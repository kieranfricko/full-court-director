const firstNames = [
  "Marcus", "Jalen", "Trey", "Darius", "Cole", "Malik", "Nolan", "Andre",
  "Isaiah", "Cameron", "Devin", "Miles", "Jordan", "Tyrese", "Brandon",
  "Aaron", "Chris", "Kobe", "Lamar", "Jabari", "Keon", "Desmond", "Jaylen",
  "Amari", "Tariq", "Cam", "Keaton", "Bryce", "Zaire", "Elias", "Noah",
  "Luca", "Mateo", "Jonas", "Rafael", "Oscar", "Niko", "Kai", "Damian"
];

const lastNames = [
  "Vale", "Cross", "Holloway", "Stone", "Bennett", "Rivers", "Price", "Bishop",
  "Carter", "Reed", "Walker", "Hayes", "Miller", "Harris", "Cooper", "Foster",
  "Simmons", "Woods", "Parker", "Young", "Mitchell", "Turner", "Grant", "Lawson",
  "Moore", "Fields", "Gray", "Wallace", "Porter", "Murray", "Santos", "Kovac",
  "Navarro", "Petrovic", "Mensah", "Okafor", "Moretti", "Silva"
];

const americanColleges = [
  "Duke", "Kentucky", "Kansas", "North Carolina", "Villanova", "UConn",
  "Arizona", "Michigan State", "Gonzaga", "UCLA", "Texas", "Baylor",
  "Alabama", "Auburn", "Maryland", "Indiana", "Syracuse", "Memphis"
];

const countriesAndClubs = [
  { country: "United States", clubs: americanColleges },
  { country: "Canada", clubs: ["Toronto", "Montreal", "Vancouver"] },
  { country: "Spain", clubs: ["Madrid", "Barcelona", "Valencia"] },
  { country: "France", clubs: ["Paris", "Lyon", "Monaco"] },
  { country: "Serbia", clubs: ["Belgrade", "Novi Sad"] },
  { country: "Germany", clubs: ["Berlin", "Munich", "Hamburg"] },
  { country: "Australia", clubs: ["Sydney", "Melbourne", "Perth"] },
  { country: "Greece", clubs: ["Athens", "Thessaloniki"] },
  { country: "Italy", clubs: ["Milan", "Rome", "Bologna"] },
  { country: "Brazil", clubs: ["Sao Paulo", "Rio de Janeiro"] },
  { country: "Argentina", clubs: ["Buenos Aires", "Cordoba"] },
  { country: "Nigeria", clubs: ["Lagos", "Abuja"] },
  { country: "Senegal", clubs: ["Dakar"] },
  { country: "Croatia", clubs: ["Zagreb", "Split"] },
  { country: "Slovenia", clubs: ["Ljubljana"] },
  { country: "Turkey", clubs: ["Istanbul", "Ankara"] }
];

const fixedRosterDatabase = {
  /* Data comes in later parts by team. */
};

const fixedRosterTeamNameAliases = {
  "Brooklyn Boroughs": "Brooklyn Bridges",
  "Toronto Towers": "Toronto North",
  "Cleveland Forge": "Cleveland Rockers",
  "Detroit Motors": "Detroit Engines",
  "Milwaukee Northstars": "Milwaukee Stags",
  "Miami Tides": "Miami Wave",
  "Orlando Sparks": "Orlando Stars",
  "Charlotte Crowns": "Charlotte Swarm",
  "Capital District": "Washington Monuments",

  "Los Angeles Stars": "Los Angeles Legends",
  "LA Surf": "Los Angeles Surf",
  "Golden State Bay": "Golden State Guardians",
  "Portland Pines": "Portland Pioneers",
  "Seattle Rain": "Oklahoma Storm",
  "Utah Summit": "Utah Peaks",
  "Houston Orbit": "Houston Launch",
  "San Antonio Stone": "San Antonio Marshals",
  "New Orleans Brass": "New Orleans Krewe"
};

function getFixedRosterKeyForTeam(teamName) {
  return fixedRosterTeamNameAliases[teamName] || teamName;
}

function verifyFixedRosterDatabase() {
  const baseTeamNames = baseTeams.map(team => team.name);
  const fixedTeamNames = Object.keys(fixedRosterDatabase);

  const usedFixedRosterKeys = baseTeamNames.map(name => getFixedRosterKeyForTeam(name));

  const missingFixedRosters = baseTeamNames.filter(name => {
    const fixedKey = getFixedRosterKeyForTeam(name);
    return !fixedRosterDatabase[fixedKey];
  });

  const extraFixedRosters = fixedTeamNames.filter(name => !usedFixedRosterKeys.includes(name));

  console.log("0.4E Fixed Roster Check");
  console.log("Base teams:", baseTeamNames.length);
  console.log("Fixed roster teams:", fixedTeamNames.length);

  if (missingFixedRosters.length > 0) {
    console.warn("Teams missing fixed rosters:");
    console.table(missingFixedRosters);
  } else {
    console.log("Every base team has a fixed roster.");
  }

  if (extraFixedRosters.length > 0) {
    console.warn("Fixed roster teams not connected to baseTeams:");
    console.table(extraFixedRosters);
  } else {
    console.log("No extra fixed roster team names.");
  }

  for (let teamName of fixedTeamNames) {
    const roster = fixedRosterDatabase[teamName];

    if (!Array.isArray(roster)) {
      console.warn(`${teamName} roster is not an array.`);
      continue;
    }

    if (roster.length !== 15) {
      console.warn(`${teamName} has ${roster.length} players instead of 15.`);
    }

    for (let i = 0; i < roster.length; i++) {
      const player = roster[i];

      if (!player.reference || !player.name || !player.position || !player.age || !player.potentialAbility) {
        console.warn(`${teamName} player slot ${i + 1} is missing required info:`, player);
      }
    }
  }
}

function splitPositionString(positionText) {
  const parts = String(positionText || "SG")
    .split("/")
    .map(part => part.trim())
    .filter(Boolean);

  const primaryPosition = parts[0] || "SG";
  const secondaryPositions = parts.slice(1);

  return {
    primaryPosition,
    secondaryPositions
  };
}

function getFixedCurrentAbilityFromPotential(potentialAbility, age) {
  let currentAbility = Number(potentialAbility || 500);

  if (age <= 20) currentAbility -= 95;
  else if (age <= 22) currentAbility -= 65;
  else if (age <= 24) currentAbility -= 35;
  else if (age <= 27) currentAbility -= 15;
  else if (age <= 31) currentAbility -= 5;
  else if (age <= 34) currentAbility -= 25;
  else if (age <= 37) currentAbility -= 55;
  else currentAbility -= 90;

  return clamp(Math.round(currentAbility), 100, 820);
}

function createFixedAttributes(primaryPosition, playerType, currentAbility) {
  return generateAttributesForPlayer(primaryPosition, playerType, currentAbility);
}

function determinePlayerType(player) {
  if (player.currentAbility < 250) {
    if (player.primaryPosition === "PG" || player.primaryPosition === "SG") return "Depth Guard";
    if (player.primaryPosition === "SF" || player.primaryPosition === "PF") return "Depth Wing";
    return "Depth Big";
  }

  const availableTypes = playerTypesByPosition[player.primaryPosition] || Object.keys(playerTypeTemplates);
  let bestType = availableTypes[0];
  let bestScore = -999;

  for (let type of availableTypes) {
    const keys = playerTypeTemplates[type] || [];
    const score = keys.reduce((total, key) => total + (player.attributes[key] || 0), 0);

    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestType;
}

function createFixedPotentialAttributes(attributes, potentialAbility) {
  return generatePotentialAttributes(attributes, potentialAbility);
}

function createFixedPlayerFromTemplate(template, team) {
  const positionInfo = splitPositionString(template.position);
  const primaryPosition = positionInfo.primaryPosition;

  const age = Number(template.age);
  const potentialAbility = Number(template.potentialAbility);
  const currentAbilityTarget = getFixedCurrentAbilityFromPotential(potentialAbility, age);

  const playerType = getInitialPlayerType(primaryPosition, currentAbilityTarget);
  const attributes = createFixedAttributes(primaryPosition, playerType, currentAbilityTarget);
  const currentAbility = calculateAbility(attributes);

  const potentialAttributes = createFixedPotentialAttributes(attributes, potentialAbility);
  const finalPotentialAbility = calculateAbility(potentialAttributes);

  const bio = generatePlayerBio(primaryPosition, age);

  const player = {
    id: `p${nextPlayerId++}`,

    /*
      Real-life attribute reference only.
      This does not show in-game.
      Reference: ${template.reference}
    */
    referenceName: template.reference,

    name: template.name,
    portrait: template.portrait || template.faceImage || template.image || template.imagePath || "",
    age,
    primaryPosition,
    secondaryPositions: positionInfo.secondaryPositions,

    height: template.height || generateHeight(primaryPosition),
    weight: template.weight || generateWeight(primaryPosition),
    country: template.country || bio.country,
    collegeOrClub: template.collegeOrClub || bio.collegeOrClub,
    draftYear: template.draftYear || bio.draftYear,
    draftPick: template.draftPick || bio.draftPick,
    yearsPro: Math.max(0, age - 19),
    handedness: template.handedness || (Math.random() < 0.88 ? "Right" : "Left"),

    playerType,
    mediaDescription: getMediaDescription(currentAbility),
    projectedCeiling: getProjectedCeilingLabel(finalPotentialAbility),
    currentAbility,
    potentialAbility: finalPotentialAbility,

    attributes,
    potentialAttributes,

    contractYears: Number(template.contractYears),
    salary: Number(template.salary),
    contract: `${Number(template.contractYears)} yrs / ${formatMoney(Number(template.salary))}`,
    contractType: "Standard",

    morale: getRandomMorale(),
    development: getDevelopmentStage(age),

    teamId: team.id,
    teamName: team.name,

    seasonStats: createEmptySeasonStats(),
    seasonStatsHistory: {}
  };

  normalizePlayerContract(player);

  return player;
}

function createAllRostersFromFixedDatabase() {
  const rosters = {};

  for (let team of baseTeams) {
    const fixedRosterKey = getFixedRosterKeyForTeam(team.name);
    const templates = fixedRosterDatabase[fixedRosterKey];

    if (!templates || templates.length === 0) {
      console.warn(`No fixed roster found for ${team.name}. Falling back to random roster.`);
      rosters[team.id] = createRosterForTeam(team);
      continue;
    }

    rosters[team.id] = templates.map(template => createFixedPlayerFromTemplate(template, team));
  }

  return rosters;
}

function createFixedFreeAgents() {
  return fixedFreeAgentDatabase.map(template => {
    const positionInfo = splitPositionString(template.position);
    const primaryPosition = positionInfo.primaryPosition;

    const age = Number(template.age);
    const potentialAbility = Number(template.potentialAbility);
    const currentAbilityTarget = getFixedCurrentAbilityFromPotential(potentialAbility, age);

    const playerType = getInitialPlayerType(primaryPosition, currentAbilityTarget);
    const attributes = createFixedAttributes(primaryPosition, playerType, currentAbilityTarget);
    const currentAbility = calculateAbility(attributes);
    const potentialAttributes = createFixedPotentialAttributes(attributes, potentialAbility);
    const finalPotentialAbility = calculateAbility(potentialAttributes);

    const bio = generatePlayerBio(primaryPosition, age);

    const player = {
      id: `p${nextPlayerId++}`,

      /*
        Real-life attribute reference only.
        This does not show in-game.
        Reference: ${template.reference}
      */
      referenceName: template.reference,

      name: template.name,
      portrait: template.portrait || template.faceImage || template.image || template.imagePath || "",
      age,
      primaryPosition,
      secondaryPositions: positionInfo.secondaryPositions,

      height: template.height || generateHeight(primaryPosition),
      weight: template.weight || generateWeight(primaryPosition),
      country: template.country || bio.country,
      collegeOrClub: template.collegeOrClub || bio.collegeOrClub,
      draftYear: template.draftYear || bio.draftYear,
      draftPick: template.draftPick || bio.draftPick,
      yearsPro: Math.max(0, age - 19),
      handedness: template.handedness || (Math.random() < 0.88 ? "Right" : "Left"),

      playerType,
      mediaDescription: getMediaDescription(currentAbility),
      projectedCeiling: getProjectedCeilingLabel(finalPotentialAbility),
      currentAbility,
      potentialAbility: finalPotentialAbility,

      attributes,
      potentialAttributes,

      contractYears: 0,
      salary: 0,
      contract: "Free Agent",
      contractType: "Free Agent",

      expectedSalary: Number(template.salary),
      expectedYears: Number(template.contractYears),

      morale: "Available",
      development: getDevelopmentStage(age),

      teamId: null,
      teamName: "Free Agent",

      seasonStats: createEmptySeasonStats(),
      seasonStatsHistory: {},
      interest: "Neutral"
    };

    normalizePlayerContract(player);

    player.teamId = null;
    player.teamName = "Free Agent";
    player.salary = 0;
    player.contractYears = 0;
    player.contract = "Free Agent";
    player.contractType = "Free Agent";

    return player;
  });
}

function createAllRosters() {
  return createAllRostersFromFixedDatabase();
}

function createRosterForTeam(team) {
  const roster = [];
  const positionPattern = ["PG", "SG", "SF", "PF", "C", "PG", "SG", "SF", "PF", "C", "G", "F"];

  for (let i = 0; i < 12; i++) {
    const primaryPosition = normalizePosition(positionPattern[i]);
    const age = getGeneratedAgeByRosterSpot(i);
    const targetAbility = getTargetAbilityForRosterSpot(team.teamStrength, i);
    const playerType = getInitialPlayerType(primaryPosition, targetAbility);
    const attributes = generateAttributesForPlayer(primaryPosition, playerType, targetAbility);
    const currentAbility = calculateAbility(attributes);

    const potentialAbility = getPotentialAbility(currentAbility, age);
    const potentialAttributes = generatePotentialAttributes(attributes, potentialAbility);

    const contractYears = Math.floor(Math.random() * 4) + 1;
    const salary = Math.max(1, Math.round(currentAbility / 22));

    const bio = generatePlayerBio(primaryPosition, age);

    roster.push({
      id: `p${nextPlayerId++}`,
      name: randomName(),
      age,
      primaryPosition,
      secondaryPositions: generateSecondaryPositions(primaryPosition),
      height: generateHeight(primaryPosition),
      weight: generateWeight(primaryPosition),
      country: bio.country,
      collegeOrClub: bio.collegeOrClub,
      draftYear: bio.draftYear,
      draftPick: bio.draftPick,
      yearsPro: Math.max(0, age - 19),
      handedness: Math.random() < 0.88 ? "Right" : "Left",

      playerType,
      mediaDescription: getMediaDescription(currentAbility),
      projectedCeiling: getProjectedCeilingLabel(potentialAbility),
      currentAbility,
      potentialAbility,

      attributes,
      potentialAttributes,

      contractYears,
      salary,
      contract: `${contractYears} yrs / $${salary}M`,
      morale: getRandomMorale(),
      development: getDevelopmentStage(age),

      seasonStats: createEmptySeasonStats(),
      seasonStatsHistory: {}
    });
  }

  return roster;
}
function generatePlayer(teamId = null, forcedAge = null, playerKind = "normal") {
  const team = teamId ? getTeamById(teamId) : null;

  const positionsPool = ["PG", "SG", "SF", "PF", "C"];
  const primaryPosition = positionsPool[randomInt(0, positionsPool.length - 1)];

  let age = forcedAge !== null ? forcedAge : randomInt(19, 34);

  let targetAbility;

  if (playerKind === "development") {
    targetAbility = randomInt(150, 425);
  } else if (playerKind === "freeAgent") {
    targetAbility = randomInt(150, 450);
  } else {
    const teamStrength = team ? team.teamStrength : randomInt(450, 625);
    targetAbility = getTargetAbilityForRosterSpot(teamStrength, randomInt(8, 14));
  }

  const playerType = getInitialPlayerType(primaryPosition, targetAbility);
  const attributes = generateAttributesForPlayer(primaryPosition, playerType, targetAbility);
  const currentAbility = calculateAbility(attributes);

  const potentialAbility = getPotentialAbility(currentAbility, age);
  const potentialAttributes = generatePotentialAttributes(attributes, potentialAbility);

  const bio = generatePlayerBio(primaryPosition, age);

  const contractYears = randomInt(1, 5);
  const salary = Math.max(1, Math.round(currentAbility / 22));

  const player = {
    id: `p${nextPlayerId++}`,
    name: randomName(),
    age,
    primaryPosition,
    secondaryPositions: generateSecondaryPositions(primaryPosition),
    height: generateHeight(primaryPosition),
    weight: generateWeight(primaryPosition),
    country: bio.country,
    collegeOrClub: bio.collegeOrClub,
    draftYear: bio.draftYear,
    draftPick: bio.draftPick,
    yearsPro: Math.max(0, age - 19),
    handedness: Math.random() < 0.88 ? "Right" : "Left",

    playerType,
    mediaDescription: getMediaDescription(currentAbility),
    projectedCeiling: getProjectedCeilingLabel(potentialAbility),
    currentAbility,
    potentialAbility,

    attributes,
    potentialAttributes,

    contractYears,
    salary,
    contract: `${contractYears} yrs / $${salary}M`,
    contractType: "Standard",
    morale: teamId ? getRandomMorale() : "Available",
    development: getDevelopmentStage(age),

    teamId,
    teamName: team ? team.name : "Free Agent",

    seasonStats: createEmptySeasonStats(),
    seasonStatsHistory: {}
  };

  normalizePlayerContract(player);

  return player;
}
function normalizePosition(position) {
  if (position === "G") {
    return Math.random() > 0.5 ? "PG" : "SG";
  }

  if (position === "F") {
    return Math.random() > 0.5 ? "SF" : "PF";
  }

  return position;
}

function getGeneratedAgeByRosterSpot(index) {
  if (index < 3) return randomInt(24, 31);
  if (index < 7) return randomInt(22, 30);
  if (index < 10) return randomInt(21, 33);
  return randomInt(19, 25);
}

function getTargetAbilityForRosterSpot(teamStrength, index) {
  let target = teamStrength;

  if (index === 0) target += randomInt(20, 65);
  else if (index === 1) target += randomInt(0, 45);
  else if (index === 2) target += randomInt(-10, 30);
  else if (index < 5) target += randomInt(-45, 10);
  else if (index < 8) target += randomInt(-110, -40);
  else if (index < 10) target += randomInt(-180, -85);
  else target += randomInt(-260, -145);

  return clamp(target, 160, 780);
}

function getInitialPlayerType(position, targetAbility) {
  if (targetAbility < 250) {
    if (position === "PG" || position === "SG") return "Depth Guard";
    if (position === "SF" || position === "PF") return "Depth Wing";
    return "Depth Big";
  }

  if (targetAbility < 350 && Math.random() < 0.35) {
    return "Raw Prospect";
  }

  const options = playerTypesByPosition[position] || playerTypesByPosition.SF;
  return options[Math.floor(Math.random() * options.length)];
}

function generateAttributesForPlayer(position, playerType, targetAbility) {
  const attributes = {};

  for (let key of allAttributeKeys) {
    attributes[key] = randomInt(4, 12);
  }

  applyPositionShape(attributes, position);
  applyPlayerTypeShape(attributes, playerType);

  normalizeAttributeTotal(attributes, targetAbility);

  return attributes;
}

function applyPositionShape(attributes, position) {
  if (position === "PG") {
    boost(attributes, ["passing", "passPerception", "ballHandling", "speed", "agility"], 2);
    lower(attributes, ["postScoring", "postDefense", "blocks", "interiorDefense"], 2);
  }

  if (position === "SG") {
    boost(attributes, ["threePoint", "shotCreation", "offBallMovement", "perimeterDefense"], 2);
    lower(attributes, ["postScoring", "postDefense", "blocks"], 1);
  }

  if (position === "SF") {
    boost(attributes, ["switchability", "perimeterDefense", "finishing", "threePoint"], 1);
  }

  if (position === "PF") {
    boost(attributes, ["strength", "defensiveRebounding", "finishing", "interiorDefense"], 2);
    lower(attributes, ["ballHandling", "speed"], 1);
  }

  if (position === "C") {
    boost(attributes, ["interiorDefense", "blocks", "defensiveRebounding", "strength", "closeShot"], 3);
    lower(attributes, ["ballHandling", "screenNavigation", "perimeterDefense"], 2);
  }
}

function applyPlayerTypeShape(attributes, playerType) {
  const keys = playerTypeTemplates[playerType] || [];

  for (let key of keys) {
    if (attributes[key] !== undefined) {
      attributes[key] = clamp(attributes[key] + randomInt(3, 6), 1, 20);
    }
  }

  if (playerType.includes("3-and-D")) {
    boost(attributes, ["threePoint", "perimeterDefense", "defensiveIQ"], 2);
  }

  if (playerType.includes("Stretch") || playerType.includes("Floor-Spacer")) {
    boost(attributes, ["threePoint", "touch"], 3);
  }

  if (playerType.includes("Rim") || playerType.includes("Anchor")) {
    boost(attributes, ["blocks", "interiorDefense", "defensiveIQ"], 3);
  }
}

function normalizeAttributeTotal(attributes, targetAbility) {
  let guard = 0;

  while (calculateAbility(attributes) < targetAbility && guard < 3000) {
    const key = getWeightedRandomAttributeKey(attributes, true);
    attributes[key] = clamp(attributes[key] + 1, 1, 20);
    guard++;
  }

  guard = 0;

  while (calculateAbility(attributes) > targetAbility && guard < 3000) {
    const key = getWeightedRandomAttributeKey(attributes, false);
    attributes[key] = clamp(attributes[key] - 1, 1, 20);
    guard++;
  }
}

function getWeightedRandomAttributeKey(attributes, increasing) {
  const keys = allAttributeKeys.filter(key => increasing ? attributes[key] < 20 : attributes[key] > 1);

  if (keys.length === 0) {
    return allAttributeKeys[Math.floor(Math.random() * allAttributeKeys.length)];
  }

  return keys[Math.floor(Math.random() * keys.length)];
}

function boost(attributes, keys, amount) {
  for (let key of keys) {
    if (attributes[key] !== undefined) {
      attributes[key] = clamp(attributes[key] + amount, 1, 20);
    }
  }
}

function lower(attributes, keys, amount) {
  for (let key of keys) {
    if (attributes[key] !== undefined) {
      attributes[key] = clamp(attributes[key] - amount, 1, 20);
    }
  }
}

function calculateAbility(attributes) {
  if (!attributes || typeof attributes !== "object") {
    attributes = {};
  }

  return allAttributeKeys.reduce((total, key) => {
    return total + Number(attributes[key] || 1);
  }, 0);
}

function getPotentialAbility(currentAbility, age) {
  let growth;

  if (age <= 20) growth = randomInt(80, 190);
  else if (age <= 22) growth = randomInt(50, 155);
  else if (age <= 24) growth = randomInt(25, 110);
  else if (age <= 27) growth = randomInt(5, 65);
  else if (age <= 30) growth = randomInt(0, 35);
  else growth = randomInt(0, 12);

  if (Math.random() < 0.08 && age <= 23) {
    growth += randomInt(40, 85);
  }

  return clamp(currentAbility + growth, currentAbility, 800);
}

function generatePotentialAttributes(attributes, potentialAbility) {
  const potentialAttributes = { ...attributes };
  normalizeAttributeTotal(potentialAttributes, potentialAbility);
  return potentialAttributes;
}

function getMediaDescription(ability) {
  for (let range of mediaDescriptionRanges) {
    if (ability >= range.min) return range.label;
  }

  return "Developmental Player";
}

function getPotentialLabel(ability) {
  for (let range of mediaDescriptionRanges) {
    if (ability >= range.min) return range.potentialLabel;
  }

  return "Developmental Potential";
}

function getProjectedCeilingLabel(potentialAbility) {
  const uncertainty = randomInt(25, 55);
  const lowAbility = clamp(potentialAbility - uncertainty, 40, 800);

  const lowLabel = getPotentialLabel(lowAbility);
  const highLabel = getPotentialLabel(potentialAbility);

  if (lowLabel === highLabel) {
    return highLabel;
  }

  return `${lowLabel} to ${highLabel}`;
}

function generatePlayerBio(position, age) {
  const countryRoll = Math.random();
  const countryData = countryRoll < 0.72
    ? countriesAndClubs[0]
    : countriesAndClubs[randomInt(1, countriesAndClubs.length - 1)];

  const club = countryData.clubs[Math.floor(Math.random() * countryData.clubs.length)];

  const yearsPro = Math.max(0, age - 19);
  const draftYear = 2026 - yearsPro;

  let draftPick;

  if (yearsPro === 0) {
    draftPick = "Undrafted";
  } else if (Math.random() < 0.16) {
    draftPick = "Undrafted";
  } else {
    draftPick = `Pick ${randomInt(1, 60)}`;
  }

  return {
    country: countryData.country,
    collegeOrClub: club,
    draftYear,
    draftPick
  };
}

function generateSecondaryPositions(primaryPosition) {
  const map = {
    PG: ["SG"],
    SG: ["PG", "SF"],
    SF: ["SG", "PF"],
    PF: ["SF", "C"],
    C: ["PF"]
  };

  const possible = map[primaryPosition] || [];
  const count = Math.random() < 0.22 && possible.length > 1 ? 2 : 1;

  return shuffleArray(possible).slice(0, count);
}

function generateHeight(position) {
  const ranges = {
    PG: [72, 77],
    SG: [75, 80],
    SF: [78, 82],
    PF: [80, 84],
    C: [82, 87]
  };

  const [min, max] = ranges[position] || [75, 82];
  const inches = randomInt(min, max);
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;

  return `${feet}'${remaining}"`;
}

function generateWeight(position) {
  const ranges = {
    PG: [170, 205],
    SG: [185, 220],
    SF: [205, 235],
    PF: [220, 255],
    C: [235, 285]
  };

  const [min, max] = ranges[position] || [190, 245];
  return randomInt(min, max);
}

function createEmptySeasonStats() {
  return {
    games: 0,
    gamesStarted: 0,
    minutes: 0,
    points: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0
  };
}

function randomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function getRandomMorale() {
  const options = ["Happy", "Content", "Neutral"];
  return options[Math.floor(Math.random() * options.length)];
}

function getDevelopmentStage(age) {
  if (age <= 22) return "Prospect";
  if (age <= 26) return "Developing";
  if (age <= 31) return "Prime";
  return "Veteran";
}

function cloneDatabasePlayer(databasePlayer) {
  const clone = JSON.parse(JSON.stringify(databasePlayer));

  clone.id = Number(clone.playerId || clone.id);
  clone.playerId = Number(clone.playerId || clone.id);

  clone.name = clone.name || "Unknown Player";
  clone.primaryPosition = clone.primaryPosition || clone.position || "G";
  clone.secondaryPosition = clone.secondaryPosition || "";
  clone.secondaryPositions = Array.isArray(clone.secondaryPositions)
    ? clone.secondaryPositions
    : clone.secondaryPosition
      ? [clone.secondaryPosition]
      : [];

  clone.salary = Number(clone.salary || 0);
  clone.contractYears = Number(clone.contractYears || 0);
  clone.contractExpirationYear = clone.contractExpirationYear || null;
  clone.freeAgentType = clone.freeAgentType || "None";

  clone.contract = clone.contractYears > 0
    ? `${clone.contractYears} yrs / ${formatMoney(clone.salary)}`
    : "Free Agent";

  clone.playerType = clone.playerType || "Player";
  clone.portrait = clone.portrait || clone.faceImage || clone.image || clone.imagePath || "";
  clone.mediaDescription = clone.mediaDescription || "";
  clone.projectedCeiling = clone.projectedCeiling || "";

  clone.morale = clone.morale || "Neutral";
  clone.energy = clone.energy === undefined ? 100 : clone.energy;

  clone.isInjured = false;
  clone.injuryName = "";
  clone.injurySeverity = "";
  clone.injuryDaysRemaining = 0;

  clone.seasonStats = createEmptySeasonStats();
  clone.seasonStatsHistory = clone.seasonStatsHistory || {};

  return clone;
}

function getDatabaseTeamIdByName(teamName) {
  if (!gameState || !Array.isArray(gameState.teams)) return null;

  const cleanName = String(teamName || "").trim();

  const teamNameAliases = {
    "Boston Harbor": "Boston Harbor",
    "New York Empire": "New York Empire",
    "Philadelphia Liberty": "Philadelphia Liberty",
    "Brooklyn Bridges": "Brooklyn Bridges",
    "Toronto North": "Toronto North",

    "Chicago Wind": "Chicago Wind",
    "Cleveland Rockers": "Cleveland Rockers",
    "Detroit Engines": "Detroit Engines",
    "Milwaukee Stags": "Milwaukee Stags",
    "Indiana Racers": "Indiana Racers",

    "Miami Wave": "Miami Wave",
    "Orlando Stars": "Orlando Stars",
    "Atlanta Flight": "Atlanta Flight",
    "Charlotte Swarm": "Charlotte Swarm",
    "Washington Monuments": "Washington Monuments",

    "Oklahoma Storm": "Oklahoma Storm",
    "Denver Peaks": "Denver Peaks",
    "Minnesota Frost": "Minnesota Frost",
    "Portland Pioneers": "Portland Pioneers",
    "Utah Peaks": "Utah Peaks",

    "Los Angeles Legends": "Los Angeles Legends",
    "Los Angeles Surf": "Los Angeles Surf",
    "Golden State Guardians": "Golden State Guardians",
    "Sacramento Royals": "Sacramento Royals",
    "Phoenix Firebirds": "Phoenix Firebirds",

    "Dallas Wranglers": "Dallas Wranglers",
    "Houston Launch": "Houston Launch",
    "Memphis Blues": "Memphis Blues",
    "New Orleans Krewe": "New Orleans Krewe",
    "San Antonio Marshals": "San Antonio Marshals",

    // Old code name aliases, just in case baseTeams still uses older names
    "Brooklyn Boroughs": "Brooklyn Bridges",
    "Toronto Towers": "Toronto North",
    "Cleveland Forge": "Cleveland Rockers",
    "Detroit Motors": "Detroit Engines",
    "Milwaukee Northstars": "Milwaukee Stags",
    "Miami Tides": "Miami Wave",
    "Orlando Sparks": "Orlando Stars",
    "Charlotte Crowns": "Charlotte Swarm",
    "Capital District": "Washington Monuments",
    "Los Angeles Stars": "Los Angeles Legends",
    "LA Surf": "Los Angeles Surf",
    "Golden State Bay": "Golden State Guardians"
  };

  const preferredName = teamNameAliases[cleanName] || cleanName;

  let team = gameState.teams.find(t =>
    String(t.name).trim().toLowerCase() === preferredName.toLowerCase()
  );

  if (team) return team.id;

  // fallback: maybe the code still has the older team name but database has newer name
  const reverseAliasEntry = Object.entries(teamNameAliases).find(([oldName, newName]) =>
    newName.toLowerCase() === preferredName.toLowerCase()
  );

  if (reverseAliasEntry) {
    const oldName = reverseAliasEntry[0];

    team = gameState.teams.find(t =>
      String(t.name).trim().toLowerCase() === oldName.toLowerCase()
    );

    if (team) return team.id;
  }

  return null;
}

function debugUnmatchedDatabaseTeams() {
  if (!Array.isArray(window.fixedPlayerDatabase) || !gameState || !gameState.teams) {
    console.warn("Database or teams not ready.");
    return;
  }

  const gameTeamNames = gameState.teams.map(team => team.name);

  const databaseTeamNames = [...new Set(
    window.fixedPlayerDatabase
      .filter(player => player && !player.startsAsFreeAgent && player.teamName !== "Free Agent")
      .map(player => player.teamName)
  )].sort();

  const unmatched = databaseTeamNames.filter(teamName =>
    getDatabaseTeamIdByName(teamName) === null
  );

  console.log("Game team names:", gameTeamNames);
  console.log("Database team names:", databaseTeamNames);
  console.log("Unmatched database team names:", unmatched);

  return {
    gameTeamNames,
    databaseTeamNames,
    unmatched
  };
}

function createAllRostersFromPlayerDatabase() {
  const rosters = {};

  if (!Array.isArray(window.fixedPlayerDatabase)) {
    console.warn("fixedPlayerDatabase not found. Falling back to old createAllRosters().");
    return typeof createAllRosters === "function" ? createAllRosters() : {};
  }

  if (!gameState || !Array.isArray(gameState.teams)) {
    console.warn("gameState.teams not ready. Cannot build rosters from player database yet.");
    return {};
  }

  for (let team of gameState.teams) {
    rosters[team.id] = [];
  }

  for (let databasePlayer of window.fixedPlayerDatabase) {
    if (!databasePlayer || databasePlayer.startsAsFreeAgent) continue;
    if (!databasePlayer.teamName || databasePlayer.teamName === "Free Agent") continue;

    const teamId = getDatabaseTeamIdByName(databasePlayer.teamName);

    if (!teamId) {
  if (!window.unmatchedDatabaseTeams) {
    window.unmatchedDatabaseTeams = new Set();
  }

  window.unmatchedDatabaseTeams.add(databasePlayer.teamName);
  continue;
}

    const player = cloneDatabasePlayer(databasePlayer);

    player.teamId = teamId;
    player.teamName = databasePlayer.teamName;

    rosters[teamId].push(player);
  }
if (window.unmatchedDatabaseTeams && window.unmatchedDatabaseTeams.size > 0) {
  console.warn(
    "Unmatched database teams:",
    Array.from(window.unmatchedDatabaseTeams)
  );
}
  return rosters;
}

function createFreeAgentsFromPlayerDatabase() {
  if (!Array.isArray(window.fixedPlayerDatabase)) {
    console.warn("fixedPlayerDatabase not found. Falling back to empty free agents.");
    return [];
  }

  return window.fixedPlayerDatabase
    .filter(player =>
      player &&
      (
        player.startsAsFreeAgent ||
        player.teamName === "Free Agent" ||
        Number(player.contractYears || 0) <= 0
      )
    )
    .map(databasePlayer => {
      const player = cloneDatabasePlayer(databasePlayer);

      player.teamId = null;
      player.teamName = "Free Agent";
      player.salary = Number(player.salary || player.expectedSalary || 0);
      player.contractYears = 0;
      player.contract = "Free Agent";
      player.interest = player.interest || "Neutral";
      player.expectedSalary = player.expectedSalary || estimateExpectedSalary(player);
      player.expectedYears = player.expectedYears || estimateExpectedYears(player);

      return player;
    });
}

function installPlayerDatabaseIntoSave() {
  if (!gameState || !gameState.started) return;

  if (!Array.isArray(window.fixedPlayerDatabase)) {
    console.warn("No fixedPlayerDatabase found. Make sure playerDatabase.js loads before script.js.");
    return;
  }

  gameState.rosters = createAllRostersFromPlayerDatabase();
  gameState.freeAgents = createFreeAgentsFromPlayerDatabase();

  ensureLeagueRosters();
  ensureFreeAgents();
  ensureAllPlayerEnergy();
  ensureAllPlayerInjuryFields();
  ensureRotation();

  if (
  typeof isCommunityRosterActive === "function" &&
  isCommunityRosterActive() &&
  typeof applySavedRosterImportPack === "function"
) {
  applySavedRosterImportPack();
}

  console.log("Player database installed:", {
    databasePlayers: window.fixedPlayerDatabase.length,
    rosterPlayers: Object.values(gameState.rosters).flat().length,
    freeAgents: gameState.freeAgents.length
  });
}

function isCommunityRosterActive() {
  return localStorage.getItem("fullCourtDirectorRosterPack") !== null;
}
