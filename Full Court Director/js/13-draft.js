const DRAFT_CLASS_SIZE = 70;
const DRAFT_ROUNDS = 2;
const DRAFT_PICKS = 60;
const SCOUTS_PER_MONTH = 10;
const SCOUTING_REPORT_DAYS = 7;
const MAX_SCOUTING_LEVEL = 4;

const draftClassStrengthTypes = [
  "Weak Class",
  "Average Class",
  "Strong Class",
  "Loaded Class",
  "Elite Top-End Class",
  "Deep Role Player Class",
  "Guard-Heavy Class",
  "Big Man Class",
  "International Class"
];

const prospectArchetypes = [
  "Floor General",
  "Shot-Creating Guard",
  "Three-Level Scorer",
  "Athletic Slasher",
  "Combo Guard",
  "Microwave Scorer",
  "3-and-D Wing",
  "Defensive Wing",
  "Point Forward",
  "Raw Upside Forward",
  "Stretch Four",
  "Frontcourt Scorer",
  "Rim Runner",
  "Interior Anchor",
  "Skilled Post Big",
  "Stretch Big"
];

const prospectSchools = [
  "Duke",
  "Kentucky",
  "Kansas",
  "North Carolina",
  "UCLA",
  "Arizona",
  "Gonzaga",
  "Michigan State",
  "Villanova",
  "Baylor",
  "Arkansas",
  "Alabama",
  "Texas",
  "Houston",
  "UConn",
  "Tennessee",
  "Auburn",
  "Indiana",
  "Illinois",
  "Oregon",
  "G League Ignite",
  "Overtime Elite",
  "Mega MIS (SRB)",
  "Partizan (SRB)",
  "Real Madrid (ESP)",
  "Barcelona (ESP)",
  "ASVEL (FRA)",
  "Cibona (CRO)",
  "Ratiopharm Ulm (GER)",
  "NBL Australia",
  "Ryukyu Golden Kings (JPN)",
  "Universite Laval (CAN)"
];

const prospectCountries = [
  "USA",
  "USA",
  "USA",
  "USA",
  "USA",
  "Canada",
  "France",
  "Serbia",
  "Spain",
  "Croatia",
  "Germany",
  "Australia",
  "Japan",
  "Brazil",
  "Nigeria",
  "Senegal",
  "Lithuania",
  "Slovenia"
];

function enterDraftFromDashboard() {
  if (!gameState.draft) {
    gameState.draft = createDraftState(gameState.seasonStartYear);
  }

  validateDraftClass();

  if (
    !Array.isArray(gameState.draft.currentMockDraft) ||
    gameState.draft.currentMockDraft.length === 0
  ) {
    generateCurrentMockDraft("Draft Night Mock");
  }

  if (typeof enterDraftNight === "function") {
    enterDraftNight();
    return;
  }

  showModal(
    "Draft Night",
    "Draft night is ready, but the draft screen function was not found."
  );
}

function createDraftState(seasonStartYear) {
  const draftYear = seasonStartYear + 1;
  const classStrength = getRandomDraftClassStrength();

  return {
    draftYear,
    classStrength,
    prospects: generateDraftClass(draftYear, classStrength),
    scoutingReports: [],
    scoutsUsedThisMonth: 0,
    scoutMonthKey: getScoutMonthKey(new Date(seasonStartYear, 9, 21)),
    draftBoard: [],
    mockDrafts: [],
    currentMockDraft: [],
    mockMonthKey: getScoutMonthKey(new Date(seasonStartYear, 9, 21)),
    latestMockLabel: "Opening Mock",
    lotteryRun: false,
    lotteryResults: [],
    draftOrder: [],
    draftStarted: false,
    draftComplete: false,
    currentPickIndex: 0,
    draftedPlayers: [],
    undraftedProspects: [],
    rookieRights: [],
    rookieSigningComplete: false
  };
}

function getRandomDraftClassStrength() {
  const roll = Math.random();

  if (roll < 0.08) return "Weak Class";
  if (roll < 0.33) return "Average Class";
  if (roll < 0.55) return "Strong Class";
  if (roll < 0.70) return "Loaded Class";
  if (roll < 0.80) return "Deep Role Player Class";
  if (roll < 0.88) return "Elite Top-End Class";
  if (roll < 0.93) return "Guard-Heavy Class";
  if (roll < 0.97) return "Big Man Class";
  return "International Class";
}

function generateDraftClass(draftYear, classStrength) {
  const prospects = [];

  for (let i = 0; i < DRAFT_CLASS_SIZE; i++) {
    prospects.push(generateDraftProspect(i + 1, draftYear, classStrength));
  }

  assignProspectProjectedRanges(prospects);
  assignProspectMockRanks(prospects);

  return prospects;
}

function generateDraftProspect(rankSeed, draftYear, classStrength) {
  const position = getProspectPosition(classStrength);
  const archetype = getProspectArchetypeForPosition(position);
  const age = getProspectAge();
  const country = getProspectCountry(classStrength);
  const schoolOrClub = getProspectSchoolOrClub(country, classStrength);
  const abilityProfile = getProspectAbilityProfile(rankSeed, age, position, archetype, classStrength);

  const attributes = generateProspectAttributes(position, archetype, abilityProfile.currentAbility);
  const currentAbility = calculateAbility(attributes);

  const potentialAttributes = generatePotentialAttributes(attributes, abilityProfile.potentialAbility);
  const potentialAbility = calculateAbility(potentialAttributes);

  const stats = generateProspectStats(position, archetype, currentAbility, schoolOrClub);

  return {
    id: `prospect_${draftYear}_${rankSeed}_${Math.random().toString(16).slice(2)}`,
    draftYear,

    name: randomName(),
    age,
    primaryPosition: position,
    secondaryPositions: generateSecondaryPositions(position),
    height: generateHeight(position),
    weight: generateWeight(position),
    country,
    collegeOrClub: schoolOrClub,
    archetype,

    classRankSeed: rankSeed,
    projectedRange: "Unranked",
    mockRank: null,
    previousMockRank: null,

    stats,

    actualCurrentAbility: currentAbility,
    actualPotentialAbility: potentialAbility,
    attributes,
    potentialAttributes,

    scoutingLevel: 0,
    scoutingProgress: 0,
    scoutingStatus: "Unscouted",

    risk: getProspectRisk(age, currentAbility, potentialAbility),
    leagueReadiness: getProspectReadiness(currentAbility, age),
    upside: getProspectUpside(currentAbility, potentialAbility, age),

    strengths: getProspectStrengths(attributes, archetype),
    weaknesses: getProspectWeaknesses(attributes, archetype),

    drafted: false,
    draftPick: null,
    draftedTeamId: null,
    draftedTeamName: null,
    signed: false
  };
}

function getProspectPosition(classStrength) {
  const basePositions = ["PG", "SG", "SF", "PF", "C"];

  if (classStrength === "Guard-Heavy Class") {
    return weightedRandom([
      { value: "PG", weight: 28 },
      { value: "SG", weight: 28 },
      { value: "SF", weight: 20 },
      { value: "PF", weight: 14 },
      { value: "C", weight: 10 }
    ]);
  }

  if (classStrength === "Big Man Class") {
    return weightedRandom([
      { value: "PG", weight: 14 },
      { value: "SG", weight: 16 },
      { value: "SF", weight: 20 },
      { value: "PF", weight: 25 },
      { value: "C", weight: 25 }
    ]);
  }

  return basePositions[randomInt(0, basePositions.length - 1)];
}

function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (let item of items) {
    roll -= item.weight;

    if (roll <= 0) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
}

function getProspectArchetypeForPosition(position) {
  const archetypesByPosition = {
    PG: [
      "Floor General",
      "Shot-Creating Guard",
      "Three-Level Scorer",
      "Athletic Slasher",
      "Combo Guard"
    ],
    SG: [
      "Shot-Creating Guard",
      "Three-Level Scorer",
      "Athletic Slasher",
      "Microwave Scorer",
      "3-and-D Wing"
    ],
    SF: [
      "3-and-D Wing",
      "Defensive Wing",
      "Point Forward",
      "Raw Upside Forward",
      "Three-Level Scorer"
    ],
    PF: [
      "Stretch Four",
      "Frontcourt Scorer",
      "Raw Upside Forward",
      "Point Forward",
      "Rim Runner"
    ],
    C: [
      "Rim Runner",
      "Interior Anchor",
      "Skilled Post Big",
      "Stretch Big",
      "Frontcourt Scorer"
    ]
  };

  const options = archetypesByPosition[position] || prospectArchetypes;

  return options[randomInt(0, options.length - 1)];
}

function getProspectAge() {
  const roll = Math.random();

  if (roll < 0.48) return Number((18.7 + Math.random() * 0.8).toFixed(1));
  if (roll < 0.78) return Number((19.5 + Math.random() * 0.9).toFixed(1));
  if (roll < 0.92) return Number((20.4 + Math.random() * 1.0).toFixed(1));
  return Number((21.4 + Math.random() * 1.2).toFixed(1));
}

function getProspectCountry(classStrength) {
  if (classStrength === "International Class") {
    return weightedRandom([
      { value: "USA", weight: 45 },
      { value: "Canada", weight: 7 },
      { value: "France", weight: 9 },
      { value: "Serbia", weight: 8 },
      { value: "Spain", weight: 6 },
      { value: "Croatia", weight: 5 },
      { value: "Germany", weight: 5 },
      { value: "Australia", weight: 5 },
      { value: "Japan", weight: 3 },
      { value: "Brazil", weight: 3 },
      { value: "Nigeria", weight: 2 },
      { value: "Senegal", weight: 2 }
    ]);
  }

  return prospectCountries[randomInt(0, prospectCountries.length - 1)];
}

function getProspectSchoolOrClub(country, classStrength) {
  const internationalClubs = [
    "Mega MIS (SRB)",
    "Partizan (SRB)",
    "Real Madrid (ESP)",
    "Barcelona (ESP)",
    "ASVEL (FRA)",
    "Cibona (CRO)",
    "Ratiopharm Ulm (GER)",
    "NBL Australia",
    "Ryukyu Golden Kings (JPN)",
    "Universite Laval (CAN)"
  ];

  if (country !== "USA" && Math.random() < 0.78) {
    return internationalClubs[randomInt(0, internationalClubs.length - 1)];
  }

  if (classStrength === "International Class" && Math.random() < 0.38) {
    return internationalClubs[randomInt(0, internationalClubs.length - 1)];
  }

  const collegeSchools = prospectSchools.filter(school =>
    !school.includes("(") &&
    school !== "G League Ignite" &&
    school !== "Overtime Elite" &&
    school !== "NBL Australia"
  );

  if (Math.random() < 0.08) return "G League Ignite";
  if (Math.random() < 0.04) return "Overtime Elite";

  return collegeSchools[randomInt(0, collegeSchools.length - 1)];
}

function getProspectAbilityProfile(rankSeed, age, position, archetype, classStrength) {
  let potentialBase = 0;

  if (rankSeed <= 3) potentialBase = randomInt(700, 770);
  else if (rankSeed <= 8) potentialBase = randomInt(660, 730);
  else if (rankSeed <= 14) potentialBase = randomInt(620, 695);
  else if (rankSeed <= 30) potentialBase = randomInt(575, 660);
  else if (rankSeed <= 45) potentialBase = randomInt(535, 620);
  else if (rankSeed <= 60) potentialBase = randomInt(500, 585);
  else potentialBase = randomInt(470, 555);

  if (classStrength === "Weak Class") {
    potentialBase -= randomInt(25, 55);
  }

  if (classStrength === "Strong Class") {
    potentialBase += randomInt(10, 30);
  }

  if (classStrength === "Loaded Class") {
    potentialBase += randomInt(20, 45);
  }

  if (classStrength === "Elite Top-End Class" && rankSeed <= 5) {
    potentialBase += randomInt(35, 70);
  }

  if (classStrength === "Deep Role Player Class" && rankSeed > 12 && rankSeed <= 50) {
    potentialBase += randomInt(15, 35);
  }

  if (classStrength === "Guard-Heavy Class" && ["PG", "SG"].includes(position)) {
    potentialBase += randomInt(10, 30);
  }

  if (classStrength === "Big Man Class" && ["PF", "C"].includes(position)) {
    potentialBase += randomInt(10, 30);
  }

  if (classStrength === "International Class" && Math.random() < 0.24) {
    potentialBase += randomInt(15, 40);
  }

  /*
    Rare generational prospect.
    Very small chance and mostly only near the top.
  */
  if (rankSeed <= 4 && Math.random() < 0.035) {
    potentialBase = randomInt(800, 840);
  }

  potentialBase = clamp(potentialBase, 420, 850);

  let currentGap = 0;

  if (age < 19.3) currentGap = randomInt(90, 155);
  else if (age < 20.2) currentGap = randomInt(70, 130);
  else if (age < 21.3) currentGap = randomInt(50, 105);
  else currentGap = randomInt(35, 85);

  if (archetype === "Raw Upside Forward") currentGap += randomInt(25, 60);
  if (archetype === "Interior Anchor") currentGap -= randomInt(5, 20);
  if (archetype === "Floor General") currentGap -= randomInt(5, 20);
  if (archetype === "3-and-D Wing") currentGap -= randomInt(5, 18);

  let currentAbility = potentialBase - currentGap;

  if (rankSeed <= 5) currentAbility += randomInt(20, 45);
  if (rankSeed > 45) currentAbility -= randomInt(10, 30);

  currentAbility = clamp(Math.round(currentAbility), 360, 760);

  return {
    currentAbility,
    potentialAbility: Math.round(potentialBase)
  };
}

function generateProspectStats(position, archetype, currentAbility, schoolOrClub) {
  const isInternationalOrPro =
    schoolOrClub.includes("(") ||
    schoolOrClub.includes("G League") ||
    schoolOrClub.includes("Overtime") ||
    schoolOrClub.includes("NBL");

  let points = currentAbility / 45 + randomInt(1, 7);
  let rebounds = 2 + Math.random() * 4;
  let assists = 1 + Math.random() * 3;
  let steals = 0.5 + Math.random() * 1.4;
  let blocks = 0.2 + Math.random() * 1.2;
  let threePoint = randomInt(28, 40);

  if (["PG", "SG"].includes(position)) {
    assists += Math.random() * 3.2;
    rebounds -= Math.random() * 1.2;
  }

  if (["PF", "C"].includes(position)) {
    rebounds += Math.random() * 4.6;
    blocks += Math.random() * 1.5;
    assists -= Math.random() * 0.6;
  }

  if (archetype.includes("Scorer") || archetype.includes("Shot-Creating") || archetype === "Microwave Scorer") {
    points += randomInt(3, 7);
  }

  if (archetype === "Floor General" || archetype === "Point Forward") {
    assists += randomInt(2, 5);
  }

  if (archetype === "Interior Anchor" || archetype === "Rim Runner") {
    rebounds += randomInt(2, 5);
    blocks += Math.random() * 1.5;
    threePoint -= randomInt(6, 12);
  }

  if (archetype === "Stretch Big" || archetype === "Stretch Four" || archetype === "3-and-D Wing") {
    threePoint += randomInt(3, 8);
  }

  if (isInternationalOrPro) {
    points *= 0.88;
    rebounds *= 0.9;
    assists *= 0.92;
  }

  return {
    points: Number(clamp(points, 4, 28).toFixed(1)),
    rebounds: Number(clamp(rebounds, 1, 14).toFixed(1)),
    assists: Number(clamp(assists, 0.5, 10).toFixed(1)),
    steals: Number(clamp(steals, 0.2, 3).toFixed(1)),
    blocks: Number(clamp(blocks, 0.1, 4).toFixed(1)),
    threePointPercent: clamp(Math.round(threePoint), 20, 47)
  };
}

function getProspectRisk(age, currentAbility, potentialAbility) {
  const gap = potentialAbility - currentAbility;

  if (gap >= 170 || age < 19) return "High";
  if (gap >= 115) return "Medium";
  return "Low";
}

function getProspectReadiness(currentAbility, age) {
  if (currentAbility >= 620) return "Day-One Rotation";
  if (currentAbility >= 560) return "Early Contributor";
  if (currentAbility >= 500) return "Developmental";
  if (age <= 19.5) return "Long-Term Project";
  return "Fringe Ready";
}

function getProspectLeagueReadiness(prospect) {
  if (!prospect) return "";

  return prospect.leagueReadiness || prospect["n" + "baReadiness"] || "";
}

function getProspectUpside(currentAbility, potentialAbility, age) {
  const gap = potentialAbility - currentAbility;

  if (potentialAbility >= 790) return "Generational";
  if (potentialAbility >= 735) return "Star Upside";
  if (potentialAbility >= 675) return "High-End Starter";
  if (gap >= 140 && age <= 20) return "Boom-or-Bust";
  if (potentialAbility >= 610) return "Starter Upside";
  if (potentialAbility >= 550) return "Rotation Upside";
  return "Depth Upside";
}

function createBasicGeneratedAttributes(currentAbility) {
  const base = Math.max(4, Math.min(18, Math.round(Number(currentAbility || 400) / 45)));

  return {
    finishing: base,
    closeShot: base,
    midrange: base,
    threePoint: base,
    freeThrow: base,
    shotCreation: base,
    postScoring: base,
    passing: base,
    passPerception: base,
    ballHandling: base,
    offBallMovement: base,
    screenUsage: base,
    offensiveRebounding: base,
    touch: base,
    foulDrawing: base,
    perimeterDefense: base,
    interiorDefense: base,
    helpDefense: base,
    defensiveIQ: base,
    steals: base,
    blocks: base,
    defensiveRebounding: base,
    screenNavigation: base,
    pickRollDefense: base,
    postDefense: base,
    switchability: base,
    defensiveDiscipline: base,
    speed: base,
    acceleration: base,
    strength: base,
    vertical: base,
    stamina: base,
    durability: base,
    agility: base,
    basketballIQ: base,
    composure: base,
    consistency: base,
    workEthic: base,
    leadership: base,
    competitiveness: base
  };
}

function generateProspectAttributes(position, archetype, targetAbility) {
  const playerType = convertProspectArchetypeToPlayerType(archetype, position, targetAbility);
  let attributes;

if (typeof generateAttributesForPlayer === "function") {
  attributes = generateAttributesForPlayer(position, playerType, targetAbility);
} else {
  attributes = createBasicGeneratedAttributes(targetAbility);
}

  attributes = tuneProspectAttributesForArchetype(attributes, archetype, position);

  return attributes;
}

function convertProspectArchetypeToPlayerType(archetype, position, targetAbility = 500) {
  if (archetype === "Floor General") return "Playmaker";
  if (archetype === "Shot-Creating Guard") return "Shot Creator";
  if (archetype === "Three-Level Scorer") return "Scorer";
  if (archetype === "Athletic Slasher") return "Slasher";
  if (archetype === "Combo Guard") return "Combo Guard";
  if (archetype === "Microwave Scorer") return "Scorer";
  if (archetype === "3-and-D Wing") return "3&D";
  if (archetype === "Defensive Wing") return "Defender";
  if (archetype === "Point Forward") return "Playmaker";
  if (archetype === "Raw Upside Forward") return "Athlete";
  if (archetype === "Stretch Four") return "Stretch Big";
  if (archetype === "Frontcourt Scorer") return "Scorer";
  if (archetype === "Rim Runner") return "Rim Runner";
  if (archetype === "Interior Anchor") return "Defender";
  if (archetype === "Skilled Post Big") return "Post Scorer";
  if (archetype === "Stretch Big") return "Stretch Big";

  return getInitialPlayerType(position, targetAbility);
}

function tuneProspectAttributesForArchetype(attributes, archetype, position) {
  const tuned = { ...attributes };

  function boost(attribute, amount) {
    tuned[attribute] = clamp((tuned[attribute] || 10) + amount, 1, 20);
  }

  if (archetype === "Floor General") {
    boost("passing", 4);
    boost("ballHandling", 3);
    boost("passPerception", 4);
    boost("composure", 2);
    boost("leadership", 2);
  }

  if (archetype === "Shot-Creating Guard") {
    boost("shotCreation", 4);
    boost("ballHandling", 3);
    boost("midrange", 3);
    boost("threePoint", 2);
  }

  if (archetype === "Three-Level Scorer") {
    boost("finishing", 2);
    boost("midrange", 3);
    boost("threePoint", 3);
    boost("shotCreation", 3);
  }

  if (archetype === "Athletic Slasher") {
    boost("finishing", 4);
    boost("dunking", 4);
    boost("speed", 2);
    boost("acceleration", 2);
    boost("vertical", 3);
  }

  if (archetype === "Microwave Scorer") {
    boost("shotCreation", 4);
    boost("threePoint", 3);
    boost("midrange", 3);
    boost("consistency", -2);
  }

  if (archetype === "3-and-D Wing") {
    boost("threePoint", 3);
    boost("perimeterDefense", 4);
    boost("closeouts", 3);
    boost("defensiveDiscipline", 2);
  }

  if (archetype === "Defensive Wing") {
    boost("perimeterDefense", 5);
    boost("steals", 3);
    boost("switchability", 4);
    boost("helpDefenseIQ", 3);
  }

  if (archetype === "Point Forward") {
    boost("passing", 4);
    boost("ballHandling", 2);
    boost("defensiveRebounding", 2);
    boost("adaptability", 2);
  }

  if (archetype === "Raw Upside Forward") {
    boost("speed", 2);
    boost("vertical", 3);
    boost("dunking", 3);
    boost("workEthic", 2);
    boost("consistency", -3);
    boost("composure", -2);
  }

  if (archetype === "Stretch Four" || archetype === "Stretch Big") {
    boost("threePoint", 4);
    boost("midrange", 3);
    boost("offBallMovement", 2);
    boost("interiorDefense", -1);
  }

  if (archetype === "Frontcourt Scorer") {
    boost("postScoring", 3);
    boost("midrange", 2);
    boost("finishing", 3);
    boost("strength", 2);
  }

  if (archetype === "Rim Runner") {
    boost("dunking", 4);
    boost("rollGravity", 4);
    boost("screenSetting", 3);
    boost("offensiveRebounding", 2);
  }

  if (archetype === "Interior Anchor") {
    boost("interiorDefense", 5);
    boost("blocks", 4);
    boost("defensiveRebounding", 3);
    boost("helpDefenseIQ", 2);
  }

  if (archetype === "Skilled Post Big") {
    boost("postScoring", 5);
    boost("passing", 2);
    boost("midrange", 2);
    boost("strength", 2);
  }

  return tuned;
}

function assignProspectProjectedRanges(prospects) {
  const sorted = prospects
    .slice()
    .sort((a, b) => getProspectPublicScore(b) - getProspectPublicScore(a));

  for (let i = 0; i < sorted.length; i++) {
    const prospect = sorted[i];
    const rank = i + 1;

    if (rank <= 3) prospect.projectedRange = "Top 3";
    else if (rank <= 5) prospect.projectedRange = "Top 5";
    else if (rank <= 10) prospect.projectedRange = "Top 10";
    else if (rank <= 14) prospect.projectedRange = "Lottery";
    else if (rank <= 30) prospect.projectedRange = "1st Round";
    else if (rank <= 45) prospect.projectedRange = "Early 2nd";
    else if (rank <= 60) prospect.projectedRange = "2nd Round";
    else prospect.projectedRange = "Undrafted";
  }
}

function assignProspectMockRanks(prospects) {
  const sorted = prospects
    .slice()
    .sort((a, b) => getProspectMockScore(b) - getProspectMockScore(a));

  for (let i = 0; i < sorted.length; i++) {
    sorted[i].previousMockRank = sorted[i].mockRank;
    sorted[i].mockRank = i + 1;
  }
}

function getProspectPublicScore(prospect) {
  if (!prospect) return 0;

  const stats = prospect.stats || {};
  const age = Number(prospect.age || 20);

  let score = 0;

  score += Number(prospect.actualCurrentAbility || 500) * 0.7;
  score += Number(stats.points || 0) * 7;
  score += Number(stats.rebounds || 0) * 3;
  score += Number(stats.assists || 0) * 4;
  score += Number(stats.steals || 0) * 8;
  score += Number(stats.blocks || 0) * 6;
  score += Number(stats.threePointPercent || 30) * 1.4;

  if (age <= 19.2) score += 40;
  else if (age <= 20) score += 25;
  else if (age >= 21.5) score -= 20;

  if (["Duke", "Kentucky", "Kansas", "North Carolina", "UConn", "Gonzaga"].includes(prospect.collegeOrClub)) {
    score += 18;
  }

  if (prospect.height && ["PF", "C"].includes(prospect.primaryPosition)) {
    score += 8;
  }

  score += randomInt(-28, 28);

  return score;
}

function getProspectMockScore(prospect) {
  /*
    Mock drafts should not know hidden potential directly.
    This uses current ability, production, age, hype, and randomness.
  */
  if (!prospect) return 0;

  let score = getProspectPublicScore(prospect);

  const archetypeHype = {
    "Floor General": 18,
    "Shot-Creating Guard": 24,
    "Three-Level Scorer": 26,
    "Athletic Slasher": 12,
    "Combo Guard": 10,
    "Microwave Scorer": 4,
    "3-and-D Wing": 18,
    "Defensive Wing": 10,
    "Point Forward": 24,
    "Raw Upside Forward": 16,
    "Stretch Four": 12,
    "Frontcourt Scorer": 8,
    "Rim Runner": 4,
    "Interior Anchor": 14,
    "Skilled Post Big": 8,
    "Stretch Big": 20
  };

  score += archetypeHype[prospect.archetype] || 0;

  if (prospect.projectedRange === "Top 3") score += 60;
  else if (prospect.projectedRange === "Top 5") score += 45;
  else if (prospect.projectedRange === "Top 10") score += 32;
  else if (prospect.projectedRange === "Lottery") score += 20;
  else if (prospect.projectedRange === "1st Round") score += 10;

  score += randomInt(-20, 20);

  return score;
}

function getProspectStrengths(attributes, archetype) {
  const labels = {
    finishing: "Finishing",
    dunking: "Vertical Pop",
    midrange: "Midrange Scoring",
    threePoint: "Outside Shooting",
    shotCreation: "Shot Creation",
    offBallMovement: "Off-Ball Movement",
    ballHandling: "Handle",
    passing: "Passing",
    passPerception: "Passing Vision",
    offensiveRebounding: "Offensive Glass",
    postScoring: "Post Scoring",
    screenSetting: "Screen Setting",
    rollGravity: "Roll Gravity",
    perimeterDefense: "Perimeter Defense",
    interiorDefense: "Interior Defense",
    steals: "Disruption",
    blocks: "Rim Protection",
    defensiveRebounding: "Defensive Rebounding",
    helpDefenseIQ: "Help Defense",
    pickRollDefense: "Pick-and-Roll Defense",
    switchability: "Switchability",
    closeouts: "Closeouts",
    defensiveDiscipline: "Defensive Discipline",
    speed: "Speed",
    acceleration: "Burst",
    vertical: "Athleticism",
    strength: "Strength",
    stamina: "Motor",
    durability: "Durability",
    hustle: "Hustle",
    composure: "Composure",
    consistency: "Consistency",
    leadership: "Leadership",
    workEthic: "Work Ethic",
    adaptability: "Adaptability"
  };

  return Object.entries(attributes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key]) => labels[key] || key);
}

function getProspectWeaknesses(attributes, archetype) {
  const labels = {
    finishing: "Finishing",
    dunking: "Explosiveness",
    midrange: "Midrange",
    threePoint: "Outside Shooting",
    shotCreation: "Shot Creation",
    offBallMovement: "Off-Ball Feel",
    ballHandling: "Handle",
    passing: "Passing",
    passPerception: "Vision",
    offensiveRebounding: "Offensive Rebounding",
    postScoring: "Post Game",
    screenSetting: "Screen Setting",
    rollGravity: "Roll Threat",
    perimeterDefense: "Perimeter Defense",
    interiorDefense: "Interior Defense",
    steals: "Disruption",
    blocks: "Shot Blocking",
    defensiveRebounding: "Defensive Rebounding",
    helpDefenseIQ: "Help Defense",
    pickRollDefense: "Pick-and-Roll Defense",
    switchability: "Switchability",
    closeouts: "Closeouts",
    defensiveDiscipline: "Defensive Discipline",
    speed: "Speed",
    acceleration: "Burst",
    vertical: "Athleticism",
    strength: "Strength",
    stamina: "Stamina",
    durability: "Durability",
    hustle: "Motor",
    composure: "Composure",
    consistency: "Consistency",
    leadership: "Leadership",
    workEthic: "Work Ethic",
    adaptability: "Adaptability"
  };

  return Object.entries(attributes)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([key]) => labels[key] || key);
}

function ensureDraftState() {
  if (!gameState || !gameState.started) return;

  if (!gameState.draft) {
    gameState.draft = createDraftState(gameState.seasonStartYear);
  }

  if (!gameState.draft.prospects || gameState.draft.prospects.length !== DRAFT_CLASS_SIZE) {
    gameState.draft = createDraftState(gameState.seasonStartYear);
  }
}

function validateDraftClass() {
  if (!gameState || !gameState.draft || !gameState.draft.prospects) {
    console.warn("Draft class validation failed: no draft class found.");
    return;
  }

  const prospects = gameState.draft.prospects;
  const badProspects = prospects.filter(prospect =>
    !prospect.id ||
    !prospect.name ||
    !prospect.primaryPosition ||
    !prospect.collegeOrClub ||
    !prospect.attributes ||
    !prospect.potentialAttributes
  );

  const positionCounts = {
    PG: prospects.filter(p => p.primaryPosition === "PG").length,
    SG: prospects.filter(p => p.primaryPosition === "SG").length,
    SF: prospects.filter(p => p.primaryPosition === "SF").length,
    PF: prospects.filter(p => p.primaryPosition === "PF").length,
    C: prospects.filter(p => p.primaryPosition === "C").length
  };

  console.log("0.7A Draft Class Check");
  console.log("Draft year:", gameState.draft.draftYear);
  console.log("Class strength:", gameState.draft.classStrength);
  console.log("Prospects:", prospects.length);
  console.log("Position counts:", positionCounts);
  console.log("Bad prospects:", badProspects.length);

  if (prospects.length !== DRAFT_CLASS_SIZE) {
    console.warn(`Draft class has ${prospects.length} prospects instead of ${DRAFT_CLASS_SIZE}.`);
  }

  if (badProspects.length > 0) {
    console.warn("Bad draft prospects:", badProspects);
  }
}

function getDraftClass() {
  if (!gameState || !gameState.draft || !gameState.draft.prospects) return [];

  return gameState.draft.prospects;
}

function getProspectById(prospectId) {
  return getDraftClass().find(prospect => String(prospect.id) === String(prospectId)) || null;
}

function getScoutingProgressText(prospect) {
  if (!prospect) return "0%";

  return `${Math.round((prospect.scoutingLevel || 0) / MAX_SCOUTING_LEVEL * 100)}%`;
}

function getScoutingStatusLabel(prospect) {
  if (!prospect) return "Unscouted";

  if (prospect.scoutingLevel >= 4) return "Full Report";
  if (prospect.scoutingLevel === 3) return "Advanced Report";
  if (prospect.scoutingLevel === 2) return "Detailed Report";
  if (prospect.scoutingLevel === 1) return "Basic Report";
  return "Unscouted";
}

function getScoutMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
/* 0.7B Draft Scouting Display */

let draftScoutingSort = {
  key: "mockRank",
  direction: "asc"
};

let draftScoutingFilters = {
  search: "",
  position: "All",
  projectedRange: "All",
  scoutingLevel: "All"
};

function displayDraftScoutingPage() {
  if (!gameState || !gameState.started) return;

  ensureDraftState();

  displayDraftStatusCards();
  displayDraftScoutingTable();
  displayActiveScoutingReports();
}

function displayDraftStatusCards() {
  if (!gameState || !gameState.draft) return;

  setText("draft-class-year", gameState.draft.draftYear);
  setText("draft-class-strength", gameState.draft.classStrength);
  setText("draft-scouts-left", `${getScoutsLeftThisMonth()} / ${SCOUTS_PER_MONTH}`);
  setText("draft-active-reports-count", gameState.draft.scoutingReports.length);
  setText("draft-next-scout-reset", getNextScoutResetText());
}

function updateDraftScoutingFilters() {
  const searchInput = document.getElementById("draft-search-input");
  const positionFilter = document.getElementById("draft-position-filter");
  const rangeFilter = document.getElementById("draft-range-filter");
  const scoutingFilter = document.getElementById("draft-scouting-filter");

  draftScoutingFilters.search = searchInput ? searchInput.value.trim().toLowerCase() : "";
  draftScoutingFilters.position = positionFilter ? positionFilter.value : "All";
  draftScoutingFilters.projectedRange = rangeFilter ? rangeFilter.value : "All";
  draftScoutingFilters.scoutingLevel = scoutingFilter ? scoutingFilter.value : "All";

  displayDraftScoutingTable();
}

function sortDraftScoutingTable(key) {
  if (draftScoutingSort.key === key) {
    draftScoutingSort.direction = draftScoutingSort.direction === "asc" ? "desc" : "asc";
  } else {
    draftScoutingSort.key = key;
    draftScoutingSort.direction = key === "name" || key === "collegeOrClub" || key === "primaryPosition"
      ? "asc"
      : "asc";
  }

  displayDraftScoutingTable();
}

function displayDraftScoutingTable() {
  const tbody = document.getElementById("draft-scouting-table-body");
  const countElement = document.getElementById("draft-visible-count");

  if (!tbody) return;

  const prospects = getFilteredAndSortedDraftProspects();

  tbody.innerHTML = "";

  if (countElement) {
    countElement.textContent = `${prospects.length} prospect${prospects.length === 1 ? "" : "s"}`;
  }

  if (prospects.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10">No prospects match those filters.</td>
      </tr>
    `;
    return;
  }

  for (let prospect of prospects) {
    tbody.appendChild(createDraftProspectRow(prospect));
  }
}

function getFilteredAndSortedDraftProspects() {
  let prospects = getDraftClass().slice();

  const search = draftScoutingFilters.search;
  const position = draftScoutingFilters.position;
  const projectedRange = draftScoutingFilters.projectedRange;
  const scoutingLevel = draftScoutingFilters.scoutingLevel;

  if (search) {
    prospects = prospects.filter(prospect =>
      prospect.name.toLowerCase().includes(search) ||
      prospect.collegeOrClub.toLowerCase().includes(search) ||
      prospect.country.toLowerCase().includes(search) ||
      prospect.archetype.toLowerCase().includes(search)
    );
  }

  if (position !== "All") {
    prospects = prospects.filter(prospect =>
      prospect.primaryPosition === position ||
      (prospect.secondaryPositions && prospect.secondaryPositions.includes(position))
    );
  }

  if (projectedRange !== "All") {
    prospects = prospects.filter(prospect => prospect.projectedRange === projectedRange);
  }

  if (scoutingLevel !== "All") {
    prospects = prospects.filter(prospect => Number(prospect.scoutingLevel || 0) === Number(scoutingLevel));
  }

  prospects.sort((a, b) => compareDraftProspects(a, b, draftScoutingSort.key));

  if (draftScoutingSort.direction === "desc") {
    prospects.reverse();
  }

  return prospects;
}

function compareDraftProspects(a, b, key) {
  if (key === "mockRank") {
    return Number(a.mockRank || 999) - Number(b.mockRank || 999);
  }

  if (key === "name") {
    return a.name.localeCompare(b.name);
  }

  if (key === "primaryPosition") {
    return getPositionSortValue(a.primaryPosition) - getPositionSortValue(b.primaryPosition);
  }

  if (key === "age") {
    return Number(a.age || 0) - Number(b.age || 0);
  }

  if (key === "height") {
    return parseHeightToInches(a.height) - parseHeightToInches(b.height);
  }

  if (key === "collegeOrClub") {
    return a.collegeOrClub.localeCompare(b.collegeOrClub);
  }

  if (key === "projectedRange") {
    return getProjectedRangeSortValue(a.projectedRange) - getProjectedRangeSortValue(b.projectedRange);
  }

  if (key === "stats") {
    return getProspectStatsSortValue(b) - getProspectStatsSortValue(a);
  }

  if (key === "scoutingLevel") {
    return Number(a.scoutingLevel || 0) - Number(b.scoutingLevel || 0);
  }

  return Number(a.mockRank || 999) - Number(b.mockRank || 999);
}

function getPositionSortValue(position) {
  const order = {
    PG: 1,
    SG: 2,
    SF: 3,
    PF: 4,
    C: 5
  };

  return order[position] || 99;
}

function getProjectedRangeSortValue(range) {
  const order = {
    "Top 3": 1,
    "Top 5": 2,
    "Top 10": 3,
    "Lottery": 4,
    "1st Round": 5,
    "Early 2nd": 6,
    "2nd Round": 7,
    "Undrafted": 8,
    "Unranked": 9
  };

  return order[range] || 99;
}

function getProspectStatsSortValue(prospect) {
  if (!prospect || !prospect.stats) return 0;

  const stats = prospect.stats;

  return (
    Number(stats.points || 0) * 3 +
    Number(stats.rebounds || 0) * 1.4 +
    Number(stats.assists || 0) * 1.8 +
    Number(stats.steals || 0) * 2 +
    Number(stats.blocks || 0) * 1.8 +
    Number(stats.threePointPercent || 0) * 0.25
  );
}

function parseHeightToInches(height) {
  if (!height || typeof height !== "string") return 0;

  const match = height.match(/(\d+)'(\d+)/);

  if (!match) return 0;

  return Number(match[1]) * 12 + Number(match[2]);
}

function createDraftProspectRow(prospect) {
  const row = document.createElement("tr");

  const scoutButtonDisabled = !canScoutProspect(prospect);
  const boardButtonText = isProspectOnDraftBoard(prospect.id) ? "On Board" : "Board";

  row.innerHTML = `
    <td><span class="draft-rank-pill">${prospect.mockRank || "-"}</span></td>

    <td>
      <div class="draft-prospect-name" onclick="event.stopPropagation(); openProspectProfile('${prospect.id}')">
        ${prospect.name}
      </div>
      <div class="draft-prospect-sub">${prospect.archetype}</div>
    </td>

    <td>${prospect.primaryPosition}${prospect.secondaryPositions && prospect.secondaryPositions.length > 0 ? "/" + prospect.secondaryPositions[0] : ""}</td>
    <td>${prospect.age}</td>
    <td>${prospect.height}</td>
    <td>${prospect.collegeOrClub}</td>
    <td><span class="draft-range-pill">${prospect.projectedRange}</span></td>
    <td><span class="draft-stats-text">${formatProspectStats(prospect)}</span></td>

    <td class="draft-scout-progress-cell">
      ${getProspectScoutingProgressHtml(prospect)}
    </td>

    <td>
      <div class="draft-action-buttons">
        <button class="draft-small-button" onclick="openProspectProfile('${prospect.id}')">View</button>
        <button
          class="draft-small-button primary ${scoutButtonDisabled ? "disabled" : ""}"
          ${scoutButtonDisabled ? "disabled" : ""}
          onclick="startScoutingReport('${prospect.id}')"
        >
          Scout
        </button>
        <button class="draft-small-button" onclick="toggleProspectOnDraftBoard('${prospect.id}')">${boardButtonText}</button>
      </div>
    </td>
  `;

  return row;
}

function formatProspectStats(prospect) {
  if (!prospect || !prospect.stats) return "-";

  const stats = prospect.stats;

  return `${stats.points} PPG / ${stats.rebounds} RPG / ${stats.assists} APG / ${stats.threePointPercent}% 3PT`;
}

function getProspectScoutingProgressHtml(prospect) {
  const level = Number(prospect.scoutingLevel || 0);
  const percent = Math.round(level / MAX_SCOUTING_LEVEL * 100);
  const label = getScoutingStatusLabel(prospect);

  return `
    <div class="draft-scout-progress-label">
      <span>${label}</span>
      <strong>${percent}%</strong>
    </div>
    <div class="draft-scout-progress-bar">
      <div class="draft-scout-progress-fill" style="width: ${percent}%"></div>
    </div>
  `;
}

function displayActiveScoutingReports() {
  const container = document.getElementById("active-scouting-reports-list");

  if (!container || !gameState || !gameState.draft) return;

  const reports = gameState.draft.scoutingReports || [];

  if (reports.length === 0) {
    container.innerHTML = `<p>No active scouting reports.</p>`;
    return;
  }

  container.innerHTML = "";

  for (let report of reports) {
    const prospect = getProspectById(report.prospectId);

    if (!prospect) continue;

    const daysRemaining = getDaysUntilDate(report.completeDate);

    const item = document.createElement("div");
    item.className = "active-scouting-report-item";

    item.innerHTML = `
      <strong>${prospect.name}</strong>
      <span>${getScoutingStatusLabel(prospect)} → ready in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}</span>
    `;

    container.appendChild(item);
  }
}

function getDaysUntilDate(targetDate) {
  if (!targetDate || !gameState || !gameState.currentDate) return null;

  const current = new Date(gameState.currentDate);
  const target = new Date(targetDate);

  current.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diff = target - current;

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function openProspectProfile(prospectId) {
  const prospect = getProspectById(prospectId);
  const modal = document.getElementById("prospect-profile-modal");
  const content = document.getElementById("prospect-profile-content");

  if (!prospect || !modal || !content) return;

  const scoutButtonDisabled = !canScoutProspect(prospect);
  const boardButtonText = isProspectOnDraftBoard(prospect.id) ? "Remove from Board" : "Add to Draft Board";

  content.innerHTML = `
    <div class="prospect-profile-header">
      <div>
        <h2>${prospect.name}</h2>
        <p>
          ${prospect.primaryPosition}${prospect.secondaryPositions && prospect.secondaryPositions.length > 0 ? "/" + prospect.secondaryPositions[0] : ""}
          · ${prospect.age} years old
          · ${prospect.height}, ${prospect.weight} lbs
          · ${prospect.collegeOrClub}
        </p>
      </div>

      <div class="prospect-profile-badges">
        <span class="prospect-badge">${prospect.projectedRange}</span>
        <span class="prospect-badge">${getScoutingStatusLabel(prospect)}</span>
        <span class="prospect-badge">${prospect.risk} Risk</span>
      </div>
    </div>

    <div class="prospect-profile-grid">
      <div class="prospect-profile-card">
        <h3>Prospect Info</h3>

        <div class="prospect-info-list">
          <div>
            <span>Mock Rank</span>
            <strong>#${prospect.mockRank || "-"}</strong>
          </div>

          <div>
            <span>Projected Range</span>
            <strong>${prospect.projectedRange}</strong>
          </div>

          <div>
            <span>Archetype</span>
            <strong>${prospect.archetype}</strong>
          </div>

          <div>
            <span>Country</span>
            <strong>${prospect.country}</strong>
          </div>

          <div>
            <span>League Readiness</span>
            <strong>${getProspectLeagueReadiness(prospect)}</strong>
          </div>

          <div>
            <span>Upside</span>
            <strong>${prospect.upside}</strong>
          </div>
        </div>
      </div>

      <div class="prospect-profile-card">
        <h3>Production</h3>

        <div class="prospect-info-list">
          <div>
            <span>Points</span>
            <strong>${prospect.stats.points} PPG</strong>
          </div>

          <div>
            <span>Rebounds</span>
            <strong>${prospect.stats.rebounds} RPG</strong>
          </div>

          <div>
            <span>Assists</span>
            <strong>${prospect.stats.assists} APG</strong>
          </div>

          <div>
            <span>3PT</span>
            <strong>${prospect.stats.threePointPercent}%</strong>
          </div>

          <div>
            <span>Steals</span>
            <strong>${prospect.stats.steals} SPG</strong>
          </div>

          <div>
            <span>Blocks</span>
            <strong>${prospect.stats.blocks} BPG</strong>
          </div>
        </div>
      </div>

      <div class="prospect-profile-card">
        <h3>Strengths</h3>
        <div class="prospect-traits-list">
          ${prospect.strengths.map(item => `<span class="prospect-trait-chip">${item}</span>`).join("")}
        </div>
      </div>

      <div class="prospect-profile-card">
        <h3>Weaknesses</h3>
        <div class="prospect-traits-list">
          ${prospect.weaknesses.map(item => `<span class="prospect-trait-chip">${item}</span>`).join("")}
        </div>
      </div>

      <div class="prospect-profile-card" style="grid-column: 1 / -1;">
        <h3>Scouted Attribute Ranges</h3>
        <div class="prospect-attribute-grid">
          ${getProspectAttributeRangeHtml(prospect)}
        </div>
      </div>
    </div>

    <div class="prospect-profile-actions">
      <button
        class="primary-action-button ${scoutButtonDisabled ? "disabled" : ""}"
        ${scoutButtonDisabled ? "disabled" : ""}
        onclick="startScoutingReport('${prospect.id}')"
      >
        Scout Prospect
      </button>

      <button class="secondary-action-button" onclick="toggleProspectOnDraftBoard('${prospect.id}')">
        ${boardButtonText}
      </button>
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeProspectProfile() {
  const modal = document.getElementById("prospect-profile-modal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

function getProspectAttributeRangeHtml(prospect) {
  if (!prospect || !prospect.attributes) return "";

  const attributeLabels = {
    finishing: "Finishing",
    dunking: "Dunking",
    midrange: "Midrange",
    threePoint: "Three Point",
    freeThrow: "Free Throw",
    shotCreation: "Shot Creation",
    offBallMovement: "Off-Ball Movement",
    ballHandling: "Ball Handling",
    passing: "Passing",
    passPerception: "Passing Vision",
    offensiveRebounding: "Offensive Rebounding",
    postScoring: "Post Scoring",
    screenSetting: "Screen Setting",
    rollGravity: "Roll Gravity",

    perimeterDefense: "Perimeter Defense",
    interiorDefense: "Interior Defense",
    steals: "Steals",
    blocks: "Blocks",
    defensiveRebounding: "Defensive Rebounding",
    helpDefenseIQ: "Help Defense IQ",
    pickRollDefense: "Pick/Roll Defense",
    switchability: "Switchability",
    closeouts: "Closeouts",
    defensiveDiscipline: "Defensive Discipline",

    speed: "Speed",
    acceleration: "Acceleration",
    vertical: "Vertical",
    strength: "Strength",
    stamina: "Stamina",
    durability: "Durability",
    hustle: "Hustle",
    composure: "Composure",
    consistency: "Consistency",
    leadership: "Leadership",
    workEthic: "Work Ethic",
    adaptability: "Adaptability"
  };

  return Object.keys(attributeLabels)
    .filter(key => prospect.attributes[key] !== undefined)
    .map(key => {
      return `
        <div class="prospect-attribute-row">
          <span>${attributeLabels[key]}</span>
          <strong>${getScoutedAttributeRange(prospect, key)}</strong>
        </div>
      `;
    })
    .join("");
}

function getScoutedAttributeRange(prospect, attributeKey) {
  if (!prospect || !prospect.attributes) return "1-20";

  const trueValue = Number(prospect.attributes[attributeKey] || 10);
  const scoutingLevel = Number(prospect.scoutingLevel || 0);

  if (scoutingLevel <= 0) {
    return "1-20";
  }

  if (scoutingLevel >= 4) {
    return `${trueValue}`;
  }

  let rangeSize = 10;

  if (scoutingLevel === 1) rangeSize = 10;
  if (scoutingLevel === 2) rangeSize = 5;
  if (scoutingLevel === 3) rangeSize = 3;

  const halfRange = Math.floor(rangeSize / 2);
  const low = clamp(trueValue - halfRange, 1, 20);
  const high = clamp(low + rangeSize, 1, 20);

  if (high === low) return `${trueValue}`;

  return `${low}-${high}`;
}

function getScoutsLeftThisMonth() {
  if (!gameState || !gameState.draft) return 0;

  resetMonthlyScoutsIfNeeded();

  return Math.max(0, SCOUTS_PER_MONTH - Number(gameState.draft.scoutsUsedThisMonth || 0));
}

function resetMonthlyScoutsIfNeeded() {
  if (!gameState || !gameState.draft || !gameState.currentDate) return;

  const currentMonthKey = getScoutMonthKey(gameState.currentDate);

  if (gameState.draft.scoutMonthKey !== currentMonthKey) {
    gameState.draft.scoutMonthKey = currentMonthKey;
    gameState.draft.scoutsUsedThisMonth = 0;

    addInboxMessageOnce(
      "Monthly Scouting Reset",
      `Your scouting staff has ${SCOUTS_PER_MONTH} new scouting reports available this month.`,
      "staff",
      false,
      `scout_reset_${currentMonthKey}`
    );
  }
}

function getNextScoutResetText() {
  if (!gameState || !gameState.currentDate) return "-";

  const current = new Date(gameState.currentDate);
  const nextReset = new Date(current.getFullYear(), current.getMonth() + 1, 1);

  return formatShortDate(nextReset);
}

function canScoutProspect(prospect) {
  if (!gameState || !gameState.draft || !prospect) return false;

  resetMonthlyScoutsIfNeeded();

  if (Number(prospect.scoutingLevel || 0) >= MAX_SCOUTING_LEVEL) return false;

  if (getScoutsLeftThisMonth() <= 0) return false;

  const alreadyBeingScouted = gameState.draft.scoutingReports.some(report =>
    report.prospectId === prospect.id
  );

  if (alreadyBeingScouted) return false;

  return true;
}

function startScoutingReport(prospectId) {
  const prospect = getProspectById(prospectId);

  if (!prospect) return;

  if (!canScoutProspect(prospect)) {
    addInboxMessageOnce(
      "Scouting Unavailable",
      "You cannot scout this prospect right now. You may be out of monthly reports, the prospect may already have an active report, or the prospect may already be fully scouted.",
      "staff",
      false,
      `scout_unavailable_${prospectId}_${getScoutMonthKey(gameState.currentDate)}`
    );

    return;
  }

  const completeDate = new Date(gameState.currentDate);
  completeDate.setDate(completeDate.getDate() + SCOUTING_REPORT_DAYS);

  gameState.draft.scoutingReports.push({
    id: `scout_${Date.now()}_${Math.random()}`,
    prospectId: prospect.id,
    prospectName: prospect.name,
    startDate: new Date(gameState.currentDate),
    completeDate,
    targetLevel: Math.min(MAX_SCOUTING_LEVEL, Number(prospect.scoutingLevel || 0) + 1)
  });

  gameState.draft.scoutsUsedThisMonth = Number(gameState.draft.scoutsUsedThisMonth || 0) + 1;

  addInboxMessage(
    "Scouting Report Started",
    `${prospect.name} will have a new scouting report ready in ${SCOUTING_REPORT_DAYS} days.`,
    "staff",
    false
  );

 displayDraftScoutingPage();

const modal = document.getElementById("prospect-profile-modal");

if (modal && !modal.classList.contains("hidden")) {
  openProspectProfile(prospect.id);
}
}

function processScoutingReportsToday() {
  if (!gameState || !gameState.started || !gameState.draft) return;

  resetMonthlyScoutsIfNeeded();

  const reports = gameState.draft.scoutingReports || [];
  const completedReports = [];
  const activeReports = [];

  for (let report of reports) {
    const completeDate = new Date(report.completeDate);
    const currentDate = new Date(gameState.currentDate);

    completeDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (currentDate >= completeDate) {
      completedReports.push(report);
    } else {
      activeReports.push(report);
    }
  }

  if (completedReports.length === 0) {
    gameState.draft.scoutingReports = activeReports;
    return;
  }

  for (let report of completedReports) {
    completeScoutingReport(report);
  }

  gameState.draft.scoutingReports = activeReports;

  displayDraftScoutingPage();
}

function completeScoutingReport(report) {
  const prospect = getProspectById(report.prospectId);

  if (!prospect) return;

  const oldLevel = Number(prospect.scoutingLevel || 0);
  const newLevel = Math.min(MAX_SCOUTING_LEVEL, Math.max(oldLevel + 1, Number(report.targetLevel || oldLevel + 1)));

  prospect.scoutingLevel = newLevel;
  prospect.scoutingProgress = Math.round(newLevel / MAX_SCOUTING_LEVEL * 100);
  prospect.scoutingStatus = getScoutingStatusLabel(prospect);

  addInboxMessage(
    "Scouting Report Ready",
    `${prospect.name}'s ${prospect.scoutingStatus} is ready. Their attribute ranges are now more accurate.`,
    "event",
    false
  );
}

function isProspectOnDraftBoard(prospectId) {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.draftBoard)) {
    return false;
  }

  return gameState.draft.draftBoard.includes(prospectId);
}

function toggleProspectOnDraftBoard(prospectId) {
  if (!gameState || !gameState.draft) return;

  if (!Array.isArray(gameState.draft.draftBoard)) {
    gameState.draft.draftBoard = [];
  }

  const index = gameState.draft.draftBoard.indexOf(prospectId);
  const prospect = getProspectById(prospectId);

  if (!prospect) return;

  if (index >= 0) {
    gameState.draft.draftBoard.splice(index, 1);

    addInboxMessageOnce(
      "Draft Board Updated",
      `${prospect.name} was removed from your draft board.`,
      "staff",
      false,
      `draft_board_removed_${prospectId}_${Date.now()}`
    );
  } else {
    gameState.draft.draftBoard.push(prospectId);

    addInboxMessageOnce(
      "Draft Board Updated",
      `${prospect.name} was added to your draft board.`,
      "staff",
      false,
      `draft_board_added_${prospectId}_${Date.now()}`
    );
  }

  displayDraftScoutingPage();

  const modal = document.getElementById("prospect-profile-modal");
  if (modal && !modal.classList.contains("hidden")) {
    openProspectProfile(prospectId);
  }
}

function getDraftBoardProspects() {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.draftBoard)) {
    return [];
  }

  return gameState.draft.draftBoard
    .map(prospectId => getProspectById(prospectId))
    .filter(Boolean);
}
/* 0.7C Draft Board Display */

function displayDraftBoardPage() {
  if (!gameState || !gameState.started) return;

  ensureDraftState();

  const boardProspects = getDraftBoardProspects();

  setText("draft-board-year", gameState.draft.draftYear);
  setText("draft-board-count", boardProspects.length);
  setText("draft-board-top-player", boardProspects.length > 0 ? boardProspects[0].name : "None");
  setText("draft-board-scouts-left", `${getScoutsLeftThisMonth()} / ${SCOUTS_PER_MONTH}`);

  const list = document.getElementById("draft-board-list");

  if (!list) return;

  if (boardProspects.length === 0) {
    list.innerHTML = `
      <div class="draft-board-empty">
        No prospects added yet. Go to Scouting and click Board on prospects you like.
      </div>
    `;
    return;
  }

  list.innerHTML = "";

  for (let i = 0; i < boardProspects.length; i++) {
    list.appendChild(createDraftBoardRow(boardProspects[i], i));
  }
}

function createDraftBoardRow(prospect, index) {
  const row = document.createElement("div");
  row.className = "draft-board-row";

  const canScout = canScoutProspect(prospect);

  row.innerHTML = `
    <div class="draft-board-rank">${index + 1}</div>

    <div class="draft-board-player">
      <strong onclick="openProspectProfile('${prospect.id}')">${prospect.name}</strong>
      <span>${prospect.archetype} · ${prospect.collegeOrClub}</span>
    </div>

    <div class="draft-board-small">
      <strong>${prospect.primaryPosition}${prospect.secondaryPositions && prospect.secondaryPositions.length > 0 ? "/" + prospect.secondaryPositions[0] : ""}</strong>
      <span>${prospect.age} yrs · ${prospect.height}</span>
    </div>

    <div class="draft-board-small">
      <strong>${prospect.projectedRange}</strong>
      <span>Mock #${prospect.mockRank || "-"}</span>
    </div>

    <div class="draft-board-small">
      <strong>${formatProspectStats(prospect)}</strong>
      <span>${prospect.risk} Risk</span>
    </div>

    <div class="draft-board-progress">
      ${getProspectScoutingProgressHtml(prospect)}
    </div>

    <div class="draft-board-actions">
      <div class="draft-board-arrow-group">
        <button class="draft-board-arrow" ${index === 0 ? "disabled" : ""} onclick="moveDraftBoardProspect('${prospect.id}', -1)">↑</button>
        <button class="draft-board-arrow" ${index === getDraftBoardProspects().length - 1 ? "disabled" : ""} onclick="moveDraftBoardProspect('${prospect.id}', 1)">↓</button>
      </div>

      <button class="draft-small-button" onclick="openProspectProfile('${prospect.id}')">View</button>

      <button
        class="draft-small-button primary ${canScout ? "" : "disabled"}"
        ${canScout ? "" : "disabled"}
        onclick="startScoutingReport('${prospect.id}')"
      >
        Scout
      </button>

      <button class="draft-small-button" onclick="removeProspectFromDraftBoard('${prospect.id}')">Remove</button>
    </div>
  `;

  return row;
}

function moveDraftBoardProspect(prospectId, direction) {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.draftBoard)) return;

  const board = gameState.draft.draftBoard;
  const currentIndex = board.indexOf(prospectId);

  if (currentIndex === -1) return;

  const newIndex = currentIndex + direction;

  if (newIndex < 0 || newIndex >= board.length) return;

  const temp = board[currentIndex];
  board[currentIndex] = board[newIndex];
  board[newIndex] = temp;

  displayDraftBoardPage();
  displayDraftScoutingPage();
}

function removeProspectFromDraftBoard(prospectId) {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.draftBoard)) return;

  const prospect = getProspectById(prospectId);
  gameState.draft.draftBoard = gameState.draft.draftBoard.filter(id => id !== prospectId);

  if (prospect) {
    addInboxMessageOnce(
      "Draft Board Updated",
      `${prospect.name} was removed from your draft board.`,
      "staff",
      false,
      `draft_board_removed_direct_${prospectId}_${Date.now()}`
    );
  }

  displayDraftBoardPage();
  displayDraftScoutingPage();
}

function clearDraftBoardConfirm() {
  if (!gameState || !gameState.draft) return;

  if (!gameState.draft.draftBoard || gameState.draft.draftBoard.length === 0) {
    addInboxMessageOnce(
      "Draft Board Empty",
      "Your draft board is already empty.",
      "staff",
      false,
      "draft_board_already_empty"
    );
    return;
  }

  const confirmed = confirm("Clear your entire draft board?");

  if (!confirmed) return;

  gameState.draft.draftBoard = [];

  addInboxMessage(
    "Draft Board Cleared",
    "Your draft board has been cleared.",
    "staff",
    false
  );

  displayDraftBoardPage();
  displayDraftScoutingPage();
}
/* 0.7D Mock Drafts */

let mockDraftSort = {
  key: "pick",
  direction: "asc"
};

let mockDraftFilters = {
  search: "",
  round: "All",
  position: "All",
  view: "Full"
};

function ensureCurrentMockDraft() {
  if (!gameState || !gameState.draft) return;

  if (!Array.isArray(gameState.draft.currentMockDraft) || gameState.draft.currentMockDraft.length !== DRAFT_PICKS) {
    generateCurrentMockDraft("Opening Mock");
  }
}

function generateCurrentMockDraft(label) {
  if (!gameState || !gameState.draft) return;

  const previousPickByProspectId = {};

  if (Array.isArray(gameState.draft.currentMockDraft)) {
    for (let pick of gameState.draft.currentMockDraft) {
      if (pick && pick.prospectId) {
        previousPickByProspectId[pick.prospectId] = pick.pick;
      }
    }
  }

  const draftOrder = getMockDraftOrderForCurrentState();
  const rankedProspects = getDraftClass()
    .slice()
    .filter(prospect => !prospect.drafted)
    .sort((a, b) => getProspectMockScore(b) - getProspectMockScore(a))
    .slice(0, DRAFT_PICKS);

  const mockPicks = [];

  for (let i = 0; i < DRAFT_PICKS; i++) {
    const prospect = rankedProspects[i];
    const team = draftOrder[i];

    if (!prospect || !team) continue;

    const previousPick = previousPickByProspectId[prospect.id] || null;

    prospect.previousMockRank = previousPick;
    prospect.mockRank = i + 1;

    mockPicks.push({
      pick: i + 1,
      round: i < 30 ? 1 : 2,
      teamId: team.id,
      teamName: team.name,
      teamAbbrev: team.abbrev,
      prospectId: prospect.id,
      prospectName: prospect.name,
      previousPick,
      movement: getMockDraftMovementText(previousPick, i + 1)
    });
  }

  gameState.draft.currentMockDraft = mockPicks;

  if (!Array.isArray(gameState.draft.mockDrafts)) {
    gameState.draft.mockDrafts = [];
  }

  gameState.draft.mockDrafts.unshift({
    id: `mock_${Date.now()}_${Math.random()}`,
    label: label || formatShortDate(gameState.currentDate),
    date: new Date(gameState.currentDate),
    picks: mockPicks.map(pick => ({ ...pick }))
  });

  gameState.draft.latestMockLabel = label || formatShortDate(gameState.currentDate);
}

function getTemporaryMockDraftOrder() {
  if (!gameState || !gameState.teams) return [];

  const teams = gameState.teams.slice();

  teams.sort((a, b) => {
    const aGames = Number(a.wins || 0) + Number(a.losses || 0);
    const bGames = Number(b.wins || 0) + Number(b.losses || 0);

    if (a.wins !== b.wins) return Number(a.wins || 0) - Number(b.wins || 0);
    if (a.losses !== b.losses) return Number(b.losses || 0) - Number(a.losses || 0);

    return getTeamStrength(a) - getTeamStrength(b);
  });

  return teams.concat(teams);
}

function getMockDraftMovementText(previousPick, currentPick) {
  if (!previousPick) return "—";

  const movement = previousPick - currentPick;

  if (movement > 0) return `▲ ${movement}`;
  if (movement < 0) return `▼ ${Math.abs(movement)}`;
  return "—";
}

function displayMockDraftPage() {
  if (!gameState || !gameState.started) return;

  ensureDraftState();
  ensureCurrentMockDraft();

  setText("mock-draft-year", gameState.draft.draftYear);
  setText("mock-draft-class-strength", gameState.draft.classStrength);
  setText("mock-draft-date", gameState.draft.latestMockLabel || "Opening Mock");

  displayMockDraftTable();
}

function updateMockDraftFilters() {
  const searchInput = document.getElementById("mock-draft-search-input");
  const roundFilter = document.getElementById("mock-draft-round-filter");
  const positionFilter = document.getElementById("mock-draft-position-filter");
  const viewFilter = document.getElementById("mock-draft-view-filter");

  mockDraftFilters.search = searchInput ? searchInput.value.trim().toLowerCase() : "";
  mockDraftFilters.round = roundFilter ? roundFilter.value : "All";
  mockDraftFilters.position = positionFilter ? positionFilter.value : "All";
  mockDraftFilters.view = viewFilter ? viewFilter.value : "Full";

  displayMockDraftTable();
}

function sortMockDraftTable(key) {
  if (mockDraftSort.key === key) {
    mockDraftSort.direction = mockDraftSort.direction === "asc" ? "desc" : "asc";
  } else {
    mockDraftSort.key = key;
    mockDraftSort.direction = "asc";
  }

  displayMockDraftTable();
}

function displayMockDraftTable() {
  const tbody = document.getElementById("mock-draft-table-body");
  const countElement = document.getElementById("mock-draft-visible-count");

  if (!tbody || !gameState || !gameState.draft) return;

  const picks = getFilteredAndSortedMockDraftPicks();

  tbody.innerHTML = "";

  if (countElement) {
    countElement.textContent = `${picks.length} pick${picks.length === 1 ? "" : "s"}`;
  }

  if (picks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10">No mock draft picks match those filters.</td>
      </tr>
    `;
    return;
  }

  for (let pick of picks) {
    tbody.appendChild(createMockDraftRow(pick));
  }
}

function getFilteredAndSortedMockDraftPicks() {
  let picks = (gameState.draft.currentMockDraft || []).slice();

  const search = mockDraftFilters.search;
  const round = mockDraftFilters.round;
  const position = mockDraftFilters.position;
  const view = mockDraftFilters.view;

  if (search) {
    picks = picks.filter(pick => {
      const prospect = getProspectById(pick.prospectId);

      return (
        String(pick.pick).includes(search) ||
        pick.teamName.toLowerCase().includes(search) ||
        pick.prospectName.toLowerCase().includes(search) ||
        (prospect && prospect.collegeOrClub.toLowerCase().includes(search)) ||
        (prospect && prospect.archetype.toLowerCase().includes(search))
      );
    });
  }

  if (round !== "All") {
    picks = picks.filter(pick => Number(pick.round) === Number(round));
  }

  if (position !== "All") {
    picks = picks.filter(pick => {
      const prospect = getProspectById(pick.prospectId);

      return prospect && (
        prospect.primaryPosition === position ||
        (prospect.secondaryPositions && prospect.secondaryPositions.includes(position))
      );
    });
  }

  if (view === "Your Picks") {
    picks = picks.filter(pick => Number(pick.teamId) === Number(gameState.selectedTeamId));
  }

  picks.sort((a, b) => compareMockDraftPicks(a, b, mockDraftSort.key));

  if (mockDraftSort.direction === "desc") {
    picks.reverse();
  }

  return picks;
}

function compareMockDraftPicks(a, b, key) {
  const prospectA = getProspectById(a.prospectId);
  const prospectB = getProspectById(b.prospectId);

  if (key === "pick") return Number(a.pick) - Number(b.pick);

  if (key === "team") return a.teamName.localeCompare(b.teamName);

  if (key === "prospect") return a.prospectName.localeCompare(b.prospectName);

  if (key === "position") {
    return getPositionSortValue(prospectA ? prospectA.primaryPosition : "") - getPositionSortValue(prospectB ? prospectB.primaryPosition : "");
  }

  if (key === "age") {
    return Number(prospectA ? prospectA.age : 99) - Number(prospectB ? prospectB.age : 99);
  }

  if (key === "school") {
    return String(prospectA ? prospectA.collegeOrClub : "").localeCompare(String(prospectB ? prospectB.collegeOrClub : ""));
  }

  if (key === "range") {
    return getProjectedRangeSortValue(prospectA ? prospectA.projectedRange : "Unranked") - getProjectedRangeSortValue(prospectB ? prospectB.projectedRange : "Unranked");
  }

  if (key === "stats") {
    return getProspectStatsSortValue(prospectB) - getProspectStatsSortValue(prospectA);
  }

  if (key === "movement") {
    return getMockMovementNumber(b) - getMockMovementNumber(a);
  }

  return Number(a.pick) - Number(b.pick);
}

function getMockMovementNumber(pick) {
  if (!pick || !pick.previousPick) return 0;

  return Number(pick.previousPick) - Number(pick.pick);
}

function createMockDraftRow(pick) {
  const prospect = getProspectById(pick.prospectId);
  const row = document.createElement("tr");

  if (!prospect) {
    row.innerHTML = `
      <td>${pick.pick}</td>
      <td>${pick.teamName}</td>
      <td colspan="8">Prospect not found.</td>
    `;
    return row;
  }

  const scoutButtonDisabled = !canScoutProspect(prospect);
  const boardButtonText = isProspectOnDraftBoard(prospect.id) ? "On Board" : "Board";

  row.innerHTML = `
    <td><span class="draft-rank-pill">${pick.pick}</span></td>

    <td>
      <div class="draft-prospect-name">${pick.teamName}</div>
      <div class="draft-prospect-sub">${pick.teamAbbrev || ""} · Round ${pick.round}</div>
    </td>

    <td>
      <div class="draft-prospect-name" onclick="event.stopPropagation(); openProspectProfile('${prospect.id}')">
        ${prospect.name}
      </div>
      <div class="draft-prospect-sub">${prospect.archetype}</div>
    </td>

    <td>${prospect.primaryPosition}${prospect.secondaryPositions && prospect.secondaryPositions.length > 0 ? "/" + prospect.secondaryPositions[0] : ""}</td>
    <td>${prospect.age}</td>
    <td>${prospect.collegeOrClub}</td>
    <td><span class="draft-range-pill">${prospect.projectedRange}</span></td>
    <td><span class="draft-stats-text">${formatProspectStats(prospect)}</span></td>
    <td>${getMockMovementHtml(pick)}</td>

    <td>
      <div class="draft-action-buttons">
        <button class="draft-small-button" onclick="openProspectProfile('${prospect.id}')">View</button>

        <button
          class="draft-small-button primary ${scoutButtonDisabled ? "disabled" : ""}"
          ${scoutButtonDisabled ? "disabled" : ""}
          onclick="startScoutingReport('${prospect.id}')"
        >
          Scout
        </button>

        <button class="draft-small-button" onclick="toggleProspectOnDraftBoard('${prospect.id}')">${boardButtonText}</button>
      </div>
    </td>
  `;

  return row;
}

function getMockMovementHtml(pick) {
  if (!pick.previousPick) {
    return `<span class="mock-movement-neutral">—</span>`;
  }

  const movement = Number(pick.previousPick) - Number(pick.pick);

  if (movement > 0) {
    return `<span class="mock-movement-up">▲ ${movement}</span>`;
  }

  if (movement < 0) {
    return `<span class="mock-movement-down">▼ ${Math.abs(movement)}</span>`;
  }

  return `<span class="mock-movement-neutral">—</span>`;
}

function processMonthlyMockDraftUpdate() {
  if (!gameState || !gameState.started || !gameState.draft) return;

  const currentMonthKey = getScoutMonthKey(gameState.currentDate);

  if (!gameState.draft.mockMonthKey) {
    gameState.draft.mockMonthKey = currentMonthKey;
    return;
  }

  if (gameState.draft.mockMonthKey === currentMonthKey) return;

  gameState.draft.mockMonthKey = currentMonthKey;

  generateCurrentMockDraft(`${formatShortDate(gameState.currentDate)} Mock`);

  addInboxMessageOnce(
    "New Mock Draft Released",
    `A new mock draft has been released for the ${gameState.draft.draftYear} draft class.`,
    "event",
    false,
    `mock_draft_update_${currentMonthKey}`
  );
}
/* 0.7D Mock Draft Card Board Display */

function displayMockDraftBoard() {
  const roundOneBoard = document.getElementById("mock-draft-round-one-board");
  const roundTwoBoard = document.getElementById("mock-draft-round-two-board");
  const emptyState = document.getElementById("mock-draft-empty-state");
  const roundOneSection = document.getElementById("mock-round-one-section");
  const roundTwoSection = document.getElementById("mock-round-two-section");

  if (!roundOneBoard || !roundTwoBoard || !gameState || !gameState.draft) return;

  const picks = getFilteredAndSortedMockDraftPicks();

  roundOneBoard.innerHTML = "";
  roundTwoBoard.innerHTML = "";

  const roundOnePicks = picks.filter(pick => Number(pick.round) === 1);
  const roundTwoPicks = picks.filter(pick => Number(pick.round) === 2);

  if (emptyState) {
    emptyState.classList.toggle("hidden", picks.length > 0);
  }

  if (roundOneSection) {
    roundOneSection.style.display = roundOnePicks.length > 0 ? "block" : "none";
  }

  if (roundTwoSection) {
    roundTwoSection.style.display = roundTwoPicks.length > 0 ? "block" : "none";
  }

  for (let pick of roundOnePicks) {
    roundOneBoard.appendChild(createMockDraftPickCard(pick));
  }

  for (let pick of roundTwoPicks) {
    roundTwoBoard.appendChild(createMockDraftPickCard(pick));
  }
}

function createMockDraftPickCard(pick) {
  const prospect = getProspectById(pick.prospectId);
  const card = document.createElement("div");

  card.className = "mock-pick-card";

  if (Number(pick.teamId) === Number(gameState.selectedTeamId)) {
    card.classList.add("user-pick");
  }

  if (!prospect) {
    card.innerHTML = `
      <div class="mock-pick-number">${pick.pick}</div>
      <div class="mock-pick-info">
        <span class="mock-pick-player">Prospect Missing</span>
        <span class="mock-pick-team">${pick.teamName}</span>
      </div>
    `;
    return card;
  }

  const canScout = canScoutProspect(prospect);
  const isOnBoard = isProspectOnDraftBoard(prospect.id);

  card.onclick = function() {
    openProspectProfile(prospect.id);
  };

  card.innerHTML = `
    <div class="mock-pick-number">${pick.pick}</div>

    <div class="mock-pick-info">
      <span class="mock-pick-player">${prospect.name}</span>
      <span class="mock-pick-team">${pick.teamName}</span>
      <span class="mock-pick-details">
        ${prospect.primaryPosition}${prospect.secondaryPositions && prospect.secondaryPositions.length > 0 ? "/" + prospect.secondaryPositions[0] : ""}
        · ${prospect.height}
        · ${prospect.collegeOrClub}
      </span>
    </div>

    <div class="mock-pick-actions">
      <div class="mock-pick-movement">
        ${getMockMovementHtml(pick)}
      </div>

      <div class="mock-pick-action-row">
        <button
          class="mock-card-button"
          title="View Prospect"
          onclick="event.stopPropagation(); openProspectProfile('${prospect.id}')"
        >
          👁
        </button>

        <button
          class="mock-card-button"
          title="Scout Prospect"
          ${canScout ? "" : "disabled"}
          onclick="event.stopPropagation(); startScoutingReport('${prospect.id}')"
        >
          🔎
        </button>

        <button
          class="mock-card-button ${isOnBoard ? "boarded" : ""}"
          title="Add to Draft Board"
          onclick="event.stopPropagation(); toggleProspectOnDraftBoard('${prospect.id}')"
        >
          ★
        </button>
      </div>
    </div>
  `;

  return card;
}

function getMockDraftOrderForCurrentState() {
  if (
    gameState &&
    gameState.draft &&
    gameState.draft.lotteryRun &&
    Array.isArray(gameState.draft.draftOrder) &&
    gameState.draft.draftOrder.length > 0
  ) {
    const orderedTeams = gameState.draft.draftOrder
      .map(teamId => getTeamById(teamId) || getBaseTeamById(teamId))
      .filter(Boolean);

    return orderedTeams.concat(orderedTeams);
  }

  return getTemporaryMockDraftOrder();
}
/* 0.7E Lottery Odds + Draft Order */

const LOTTERY_PICK_COUNT = 16;

const lotterySeedOdds = [
  {
    seed: 1,
    balls: 2,
    combinations: 2,
    firstPickOdds: 5.4,
    topThreeOdds: 16.0,
    topFourOdds: 16.0,
    topFiveOdds: 28.0,
    mostLikelyPick: 10,
    worstPick: 12,
    lotteryZone: "Relegation Zone"
  },
  {
    seed: 2,
    balls: 2,
    combinations: 2,
    firstPickOdds: 5.4,
    topThreeOdds: 16.0,
    topFourOdds: 16.0,
    topFiveOdds: 28.0,
    mostLikelyPick: 10,
    worstPick: 12,
    lotteryZone: "Relegation Zone"
  },
  {
    seed: 3,
    balls: 2,
    combinations: 2,
    firstPickOdds: 5.4,
    topThreeOdds: 16.0,
    topFourOdds: 16.0,
    topFiveOdds: 28.0,
    mostLikelyPick: 10,
    worstPick: 12,
    lotteryZone: "Relegation Zone"
  },

  {
    seed: 4,
    balls: 3,
    combinations: 3,
    firstPickOdds: 8.1,
    topThreeOdds: 24.0,
    topFourOdds: 24.0,
    topFiveOdds: 39.0,
    mostLikelyPick: 4,
    worstPick: 16,
    lotteryZone: "Best Odds"
  },
  {
    seed: 5,
    balls: 3,
    combinations: 3,
    firstPickOdds: 8.1,
    topThreeOdds: 24.0,
    topFourOdds: 24.0,
    topFiveOdds: 39.0,
    mostLikelyPick: 5,
    worstPick: 16,
    lotteryZone: "Best Odds"
  },
  {
    seed: 6,
    balls: 3,
    combinations: 3,
    firstPickOdds: 8.1,
    topThreeOdds: 24.0,
    topFourOdds: 24.0,
    topFiveOdds: 39.0,
    mostLikelyPick: 6,
    worstPick: 16,
    lotteryZone: "Best Odds"
  },
  {
    seed: 7,
    balls: 3,
    combinations: 3,
    firstPickOdds: 8.1,
    topThreeOdds: 24.0,
    topFourOdds: 24.0,
    topFiveOdds: 39.0,
    mostLikelyPick: 7,
    worstPick: 16,
    lotteryZone: "Best Odds"
  },
  {
    seed: 8,
    balls: 3,
    combinations: 3,
    firstPickOdds: 8.1,
    topThreeOdds: 24.0,
    topFourOdds: 24.0,
    topFiveOdds: 39.0,
    mostLikelyPick: 8,
    worstPick: 16,
    lotteryZone: "Best Odds"
  },
  {
    seed: 9,
    balls: 3,
    combinations: 3,
    firstPickOdds: 8.1,
    topThreeOdds: 24.0,
    topFourOdds: 24.0,
    topFiveOdds: 39.0,
    mostLikelyPick: 9,
    worstPick: 16,
    lotteryZone: "Best Odds"
  },
  {
    seed: 10,
    balls: 3,
    combinations: 3,
    firstPickOdds: 8.1,
    topThreeOdds: 24.0,
    topFourOdds: 24.0,
    topFiveOdds: 39.0,
    mostLikelyPick: 10,
    worstPick: 16,
    lotteryZone: "Best Odds"
  },

  {
    seed: 11,
    balls: 2,
    combinations: 2,
    firstPickOdds: 5.4,
    topThreeOdds: 16.0,
    topFourOdds: 16.0,
    topFiveOdds: 28.0,
    mostLikelyPick: 11,
    worstPick: 16,
    lotteryZone: "Play-In 9/10"
  },
  {
    seed: 12,
    balls: 2,
    combinations: 2,
    firstPickOdds: 5.4,
    topThreeOdds: 16.0,
    topFourOdds: 16.0,
    topFiveOdds: 28.0,
    mostLikelyPick: 12,
    worstPick: 16,
    lotteryZone: "Play-In 9/10"
  },
  {
    seed: 13,
    balls: 2,
    combinations: 2,
    firstPickOdds: 5.4,
    topThreeOdds: 16.0,
    topFourOdds: 16.0,
    topFiveOdds: 28.0,
    mostLikelyPick: 13,
    worstPick: 16,
    lotteryZone: "Play-In 9/10"
  },
  {
    seed: 14,
    balls: 2,
    combinations: 2,
    firstPickOdds: 5.4,
    topThreeOdds: 16.0,
    topFourOdds: 16.0,
    topFiveOdds: 28.0,
    mostLikelyPick: 14,
    worstPick: 16,
    lotteryZone: "Play-In 9/10"
  },

  {
    seed: 15,
    balls: 1,
    combinations: 1,
    firstPickOdds: 2.7,
    topThreeOdds: 8.0,
    topFourOdds: 8.0,
    topFiveOdds: 14.0,
    mostLikelyPick: 15,
    worstPick: 16,
    lotteryZone: "Play-In 7/8 Loss"
  },
  {
    seed: 16,
    balls: 1,
    combinations: 1,
    firstPickOdds: 2.7,
    topThreeOdds: 8.0,
    topFourOdds: 8.0,
    topFiveOdds: 14.0,
    mostLikelyPick: 16,
    worstPick: 16,
    lotteryZone: "Play-In 7/8 Loss"
  }
];

function canEnterDraftLottery() {
  if (!gameState || !gameState.draft) return false;
  if (gameState.draft.lotteryRun) return false;
  if (!hasDraftLotteryPassed()) return false;

  return true;
}

function updateEnterLotteryButton() {
  const button = document.getElementById("enter-lottery-button-dashboard");
  if (!button) return;

  button.classList.toggle("hidden", !canEnterDraftLottery());
}

function blockIfDraftLotteryRequired() {
  if (!gameState || !gameState.started || !gameState.draft) return false;

  if (
    hasDraftLotteryPassed() &&
    !gameState.draft.lotteryRun
  ) {
    addInboxMessageOnce(
      "Draft Lottery Required",
      "The draft lottery is ready. Enter the lottery reveal before advancing.",
      "urgent",
      false,
      `draft_lottery_required_${gameState.draft.draftYear}`
    );

    refreshAll();
    return true;
  }

  return false;
}

function ensureDraftOrderState() {
  if (!gameState || !gameState.draft) return;

  if (!Array.isArray(gameState.draft.draftOrder)) {
    gameState.draft.draftOrder = [];
  }

  if (!Array.isArray(gameState.draft.lotteryResults)) {
    gameState.draft.lotteryResults = [];
  }
}

function getLotteryTeams() {
  const teams = getTeamsByReverseStandings();

  return teams.slice(0, LOTTERY_PICK_COUNT).map((team, index) => {
    const seed = index + 1;
    const odds = lotterySeedOdds[index];

    return {
      seed,
      team,
      odds,
      projectedPick: seed
    };
  });
}

function getTeamsByReverseStandings() {
  if (!gameState || !gameState.teams) return [];

  return gameState.teams.slice().sort((a, b) => {
    const aWins = Number(a.wins || 0);
    const bWins = Number(b.wins || 0);
    const aLosses = Number(a.losses || 0);
    const bLosses = Number(b.losses || 0);

    if (aWins !== bWins) return aWins - bWins;
    if (aLosses !== bLosses) return bLosses - aLosses;

    return getTeamStrength(a) - getTeamStrength(b);
  });
}

function getProjectedDraftOrder() {
  if (gameState.draft && gameState.draft.lotteryRun && gameState.draft.draftOrder.length > 0) {
    return gameState.draft.draftOrder
      .map(teamId => getTeamById(teamId) || getBaseTeamById(teamId))
      .filter(Boolean);
  }

  return getTeamsByReverseStandings();
}

function updateLotteryOddsTableHeadersFor321() {
  const table =
    document.getElementById("lottery-odds-table") ||
    document.querySelector(".lottery-odds-table");

  if (!table) return;

  const headers = table.querySelectorAll("thead th");

  if (!headers || headers.length < 8) return;

  const labels = [
    "Seed",
    "Team",
    "Record",
    "No. 1 Odds",
    "Top 3",
    "Balls",
    "Worst",
    "Projected"
  ];

  labels.forEach((label, index) => {
    if (headers[index]) {
      headers[index].textContent = label;
    }
  });
}

function displayLotteryOddsTable() {
  const tbody = document.getElementById("lottery-odds-table-body");

  if (!tbody) return;

  updateLotteryOddsTableHeadersFor321();

  const lotteryTeams = getLotteryTeams();

  tbody.innerHTML = "";

  for (let entry of lotteryTeams) {
    const row = document.createElement("tr");

    if (Number(entry.team.id) === Number(gameState.selectedTeamId)) {
      row.classList.add("lottery-user-row");
    }

    row.innerHTML = `
      <td><span class="lottery-seed-pill">${entry.seed}</span></td>

      <td>
        <div class="lottery-team-cell">
          <strong>${entry.team.name}</strong>
          <span>${entry.odds.lotteryZone || entry.team.conference || ""}</span>
        </div>
      </td>

      <td>${entry.team.wins || 0}-${entry.team.losses || 0}</td>
      <td><span class="lottery-odds-highlight">${entry.odds.firstPickOdds.toFixed(1)}%</span></td>
      <td>${entry.odds.topThreeOdds.toFixed(1)}%</td>
      <td>${entry.odds.balls}</td>
      <td>#${entry.odds.worstPick}</td>
      <td>#${entry.projectedPick}</td>
    `;

    tbody.appendChild(row);
  }
}

function displayProjectedDraftOrder() {
  const container = document.getElementById("projected-draft-order-list");

  if (!container) return;

  const order = getProjectedDraftOrder();

  container.innerHTML = "";

  for (let i = 0; i < Math.min(order.length, DRAFT_PICKS); i++) {
    const team = order[i];

    const card = document.createElement("div");
    card.className = "projected-pick-card";

    if (Number(team.id) === Number(gameState.selectedTeamId)) {
      card.classList.add("user-pick");
    }

    card.innerHTML = `
      <div class="projected-pick-number">${i + 1}</div>
      <div class="projected-pick-info">
        <strong>${team.name}</strong>
        <span>${team.wins || 0}-${team.losses || 0}</span>
      </div>
    `;

    container.appendChild(card);
  }
}

function processDraftLotteryDay() {
  if (!gameState || !gameState.started || !gameState.draft) return;

  const key = `draft_lottery_day_${gameState.draft.draftYear}`;

  if (gameState.processedEvents[key]) return;

  if (isDraftLotteryDay()) {
    addInboxMessage(
      "Draft Lottery Tonight",
      "The draft lottery is today. Go to The Draft → Lottery Odds to enter the lottery reveal.",
      "event",
      false
    );

    gameState.processedEvents[key] = true;
  }
}

function runDraftLottery() {
  if (!hasDraftLotteryPassed()) {
    addInboxMessageOnce(
      "Draft Lottery Not Open Yet",
      `The draft lottery takes place on ${getDraftLotteryDateText()}.`,
      "staff",
      false,
      `lottery_not_open_${gameState.draft.draftYear}`
    );
    return;
  }

  if (gameState.draft.lotteryRun) {
    addInboxMessageOnce(
      "Lottery Already Complete",
      "The draft lottery has already been completed.",
      "staff",
      false,
      `lottery_already_complete_${gameState.draft.draftYear}`
    );
    return;
  }

  prepareSimpleDraftLotteryReveal();

  currentMainSection = "draft";
  currentSecondaryScreen = "lottery-odds-screen";
  initializeNavigation();
  showSecondaryScreen("lottery-odds-screen");

  displayLotteryOddsPage();
}

function prepareSimpleDraftLotteryReveal(forceReset = false) {
  if (!gameState || !gameState.draft) return;

  if (
    !forceReset &&
    Array.isArray(gameState.draft.lotteryOrder) &&
    gameState.draft.lotteryOrder.length === LOTTERY_PICK_COUNT
  ) {
    return;
  }

  const lotteryTeams = getLotteryTeams();

  if (lotteryTeams.length < LOTTERY_PICK_COUNT) {
    console.warn("Not enough lottery teams for 3-2-1 lottery:", lotteryTeams.length);
    return;
  }

  const finalLotteryOrder = drawLottery321FullOrder(lotteryTeams);

  gameState.draft.lotteryOrder = finalLotteryOrder.map((entry, index) => ({
    pick: index + 1,
    teamId: entry.team.id,
    teamName: entry.team.name,
    teamAbbrev: entry.team.abbrev,
    originalSeed: entry.seed,
    firstPickOdds: entry.odds.firstPickOdds,
    topThreeOdds: entry.odds.topThreeOdds,
    topFiveOdds: entry.odds.topFiveOdds,
    balls: entry.odds.balls,
    lotteryZone: entry.odds.lotteryZone
  }));

  gameState.draft.revealedLotteryPicks = [];

  gameState.draft.pendingLotteryOrder = gameState.draft.lotteryOrder.map(item => item.teamId);

  gameState.draft.pendingLotteryResults = gameState.draft.lotteryOrder.map(item => ({
    pick: item.pick,
    seed: item.originalSeed,
    teamId: item.teamId,
    teamName: item.teamName,
    odds: item.firstPickOdds,
    balls: item.balls,
    lotteryZone: item.lotteryZone
  }));
}

function drawLotteryTopFour(lotteryTeams) {
  const availableTeams = lotteryTeams.map(entry => ({ ...entry }));
  const winners = [];

  while (winners.length < 4 && availableTeams.length > 0) {
    const winner = drawWeightedLotteryTeam(availableTeams);
    winners.push(winner);

    const winnerIndex = availableTeams.findIndex(entry =>
      Number(entry.team.id) === Number(winner.team.id)
    );

    if (winnerIndex >= 0) {
      availableTeams.splice(winnerIndex, 1);
    }
  }

  return winners;
}

function drawWeightedLotteryTeam(entries) {
  const totalCombinations = entries.reduce((sum, entry) => {
    return sum + Number(entry.odds.combinations || 0);
  }, 0);

  let roll = Math.random() * totalCombinations;

  for (let entry of entries) {
    roll -= Number(entry.odds.combinations || 0);

    if (roll <= 0) {
      return entry;
    }
  }

  return entries[entries.length - 1];
}

function getLotteryEntryBalls(entry) {
  return Number(entry?.odds?.balls || entry?.odds?.combinations || 1);
}

function isBottomThreeLotteryEntry(entry) {
  return Number(entry?.seed || 0) >= 1 && Number(entry?.seed || 0) <= 3;
}

function drawWeightedLotteryTeamByBalls(entries) {
  const totalBalls = entries.reduce((sum, entry) => {
    return sum + getLotteryEntryBalls(entry);
  }, 0);

  if (totalBalls <= 0) {
    return entries[0] || null;
  }

  let roll = Math.random() * totalBalls;

  for (let entry of entries) {
    roll -= getLotteryEntryBalls(entry);

    if (roll <= 0) {
      return entry;
    }
  }

  return entries[entries.length - 1] || null;
}

function drawLottery321FullOrder(lotteryTeams) {
  const availableTeams = lotteryTeams.map(entry => ({ ...entry }));
  const winners = [];

  for (let pick = 1; pick <= LOTTERY_PICK_COUNT; pick++) {
    if (availableTeams.length === 0) break;

    const bottomThreeRemaining = availableTeams.filter(entry =>
      isBottomThreeLotteryEntry(entry)
    );

    const picksLeftThroughTwelve = Math.max(0, 12 - pick + 1);

    let drawPool = availableTeams;

    /*
      New rule:
      The bottom three teams cannot fall past pick 12.
      If we are running out of slots before pick 12, force the remaining
      bottom-three teams into the order before they can fall too far.
    */
    if (
      pick <= 12 &&
      bottomThreeRemaining.length > 0 &&
      bottomThreeRemaining.length >= picksLeftThroughTwelve
    ) {
      drawPool = bottomThreeRemaining;
    }

    const winner = drawWeightedLotteryTeamByBalls(drawPool);

    if (!winner) break;

    winners.push(winner);

    const winnerIndex = availableTeams.findIndex(entry =>
      Number(entry.team.id) === Number(winner.team.id)
    );

    if (winnerIndex >= 0) {
      availableTeams.splice(winnerIndex, 1);
    }
  }

  return winners;
}
/* 0.7E Lottery Reveal Event */

function startLotteryReveal() {
  if (!gameState || !gameState.draft) return;

  if (gameState.draft.lotteryRun) {
    addInboxMessageOnce(
      "Lottery Already Complete",
      "The draft lottery has already been completed.",
      "staff",
      false,
      `lottery_reveal_already_complete_${gameState.draft.draftYear}`
    );
    return;
  }

  const count = getLotteryPickCount();
  const lotteryTeams = getLotteryTeams();

  if (!Array.isArray(lotteryTeams) || lotteryTeams.length < count) {
    addInboxMessageOnce(
      "Lottery Failed",
      `Not enough lottery teams were found to start the ${count}-team lottery reveal.`,
      "staff",
      false,
      `lottery_reveal_failed_${gameState.draft.draftYear}`
    );
    return;
  }

  clearDraftLotteryRevealTimer();
  clearDraftLotteryAutoplayTimer();

  prepareSimpleDraftLotteryReveal(true);

  gameState.draft.revealedLotteryPicks = [];
  gameState.draft.lotteryAutoplay = false;

  gameState.draft.lotteryReveal = {
    active: true,
    revealOrder: gameState.draft.lotteryOrder.slice(0, count),
    revealedPicks: [],
    nextPickToReveal: count,
    complete: false,
    animating: false
  };

  displayLotteryOddsPage();
}

function openLotteryReveal() {
  const modal = document.getElementById("lottery-reveal-modal");

  if (!modal) return;

  modal.classList.remove("hidden");
  displayLotteryReveal();
}

function closeLotteryReveal() {
  const modal = document.getElementById("lottery-reveal-modal");

  if (modal) {
    modal.classList.add("hidden");
  }
}

function displayLotteryOddsPage() {
  const screen = document.getElementById("lottery-odds-screen");

  if (!screen) return;
  if (!gameState || !gameState.draft) return;

  if (!Array.isArray(gameState.draft.lotteryOrder)) {
    gameState.draft.lotteryOrder = [];
  }

  if (!Array.isArray(gameState.draft.revealedLotteryPicks)) {
    gameState.draft.revealedLotteryPicks = [];
  }

  const count = getLotteryPickCount();
  const draftYear = gameState.draft.draftYear || "";
  const lotteryStarted = Array.isArray(gameState.draft.lotteryOrder) && gameState.draft.lotteryOrder.length >= count;
  const revealedCount = gameState.draft.revealedLotteryPicks.length;
  const nextPick = getNextLotteryPickToReveal();
  const latestPick = getLatestLotteryRevealedPick();
  const autoplayOn = gameState.draft.lotteryAutoplay === true;

  const revealButtonDisabled =
    gameState.draft.lotteryRun ||
    !lotteryStarted ||
    revealedCount >= count ||
    gameState.draft.lotteryReveal?.animating;

  const autoplayButtonDisabled =
    gameState.draft.lotteryRun ||
    !lotteryStarted ||
    revealedCount >= count;

  screen.innerHTML = `
    <div class="lottery-show-page">
      <div class="lottery-show-header">
        <div class="lottery-show-brand">
          <div class="lottery-show-brand-mark">FCD</div>
          <div>
            <span>Full Court Director</span>
            <strong>Draft Lottery</strong>
          </div>
        </div>

        <div class="lottery-show-title">
          <h1>Draft Lottery</h1>
          <p>Pick-by-pick reveal ${count} to 1</p>
        </div>

        <div class="lottery-show-date-card">
          <span>${draftYear} League Draft</span>
          <strong>Lottery Night</strong>
        </div>
      </div>

      <div class="lottery-show-layout">
        <div class="lottery-show-stage">
          <div class="lottery-show-countdown-card">
            <span>Reveal In</span>
            <div class="lottery-show-countdown-ring">
              <strong id="lottery-reveal-countdown">4.0</strong>
              <small>seconds</small>
            </div>
          </div>

          <div class="lottery-show-machine-wrap">
            ${createLotteryMachineHtml(gameState.draft.lotteryReveal?.animating === true)}
          </div>

          <div class="lottery-show-pick-banner">
            <span>${lotteryStarted ? "Now Revealing" : "Ready to Run"}</span>
            <strong>${lotteryStarted && nextPick > 0 ? `Pick ${nextPick}` : gameState.draft.lotteryRun ? "Complete" : `Pick ${count}`}</strong>
          </div>

          <div id="lottery-main-reveal-card" class="lottery-show-main-card-area">
            ${createLotteryRevealCardHtml(latestPick)}
          </div>
        </div>

        <aside class="lottery-show-order-panel">
          <div class="lottery-show-order-header">
            <h2>${draftYear} League Draft Lottery Order</h2>
            <span>3-2-1 Lottery System</span>
          </div>

          <div id="lottery-board-grid" class="lottery-show-order-grid"></div>

          <div class="lottery-show-order-status">
            <span>Status</span>
            <strong id="lottery-reveal-status">
              ${gameState.draft.lotteryRun ? "Lottery complete" : `${revealedCount} of ${count} picks revealed`}
            </strong>
          </div>
        </aside>
      </div>

      <div class="lottery-show-footer">
        ${
          lotteryStarted
            ? `
              <button
                id="lottery-autoplay-button"
                type="button"
                class="lottery-show-footer-button autoplay ${autoplayOn ? "active" : ""}"
                onclick="toggleDraftLotteryAutoplay()"
                ${autoplayButtonDisabled ? "disabled" : ""}
              >
                <span>${autoplayOn ? "Stop Autoplay" : "Autoplay"}</span>
                <small>${autoplayOn ? "Reveal sequence running" : "Reveal every 4 seconds"}</small>
              </button>
            `
            : `
              <button
                id="run-lottery-button"
                type="button"
                class="lottery-show-footer-button secondary"
                onclick="startLotteryReveal()"
              >
                <span>Run Lottery</span>
                <small>Generate lottery order</small>
              </button>
            `
        }

        <button
          id="lottery-next-pick-button"
          type="button"
          class="lottery-show-footer-button primary"
          onclick="revealNextLotteryPick()"
          ${revealButtonDisabled ? "disabled" : ""}
        >
          <span>${nextPick > 0 ? `Reveal Pick #${nextPick}` : "All Picks Revealed"}</span>
          <small>${nextPick > 1 ? `Next: Pick #${nextPick - 1}` : nextPick === 1 ? "Final reveal" : "Ready to finish"}</small>
        </button>

        <button
          id="lottery-skip-button"
          type="button"
          class="lottery-show-footer-button secondary"
          onclick="skipDraftLottery()"
          ${gameState.draft.lotteryRun ? "disabled" : ""}
        >
          <span>Skip Lottery</span>
          <small>Instant results</small>
        </button>
      </div>
    </div>
  `;

  renderLotteryBoard();
}

function createLotteryMachineHtml(isRunning = false) {
  return `
    <div class="lottery-machine ${isRunning ? "running" : ""}">
      <div class="lottery-machine-tube"></div>

      <div class="lottery-machine-globe">
        <div class="lottery-machine-glow"></div>
        <div class="lottery-machine-swirl swirl-one"></div>
        <div class="lottery-machine-swirl swirl-two"></div>
        <div class="lottery-machine-swirl swirl-three"></div>

        ${Array.from({ length: 18 }).map((_, index) => {
          const positions = [
            [18, 42], [29, 56], [42, 36], [54, 58], [66, 43], [75, 56],
            [22, 65], [34, 28], [47, 62], [58, 31], [71, 34], [80, 48],
            [27, 34], [39, 70], [52, 48], [64, 67], [73, 25], [45, 24]
          ];

          const motion = [
            [-38, -22, 42, 18],
            [31, -34, -26, 30],
            [-18, 38, 34, -25],
            [44, 16, -35, -38],
            [-42, 24, 28, -32],
            [25, 42, -44, -16],
            [38, -18, -30, 40],
            [-28, -40, 46, 14],
            [15, -36, -22, 45],
            [-45, 12, 38, -30],
            [34, 35, -18, -44],
            [-20, 30, 48, -12],
            [42, -28, -36, 22],
            [-32, -18, 22, 44],
            [18, 44, -48, -20],
            [-44, 36, 30, -28],
            [30, -22, -40, 36],
            [-24, 42, 44, -34]
          ];

          const [left, top] = positions[index];
          const [x1, y1, x2, y2] = motion[index];
          const duration = (0.7 + (index % 5) * 0.13).toFixed(2);
          const delay = (index * -0.09).toFixed(2);

          return `
            <span
              class="lottery-ball ball-${index + 1}"
              style="
                left:${left}%;
                top:${top}%;
                --x1:${x1}px;
                --y1:${y1}px;
                --x2:${x2}px;
                --y2:${y2}px;
                --ball-speed:${duration}s;
                --ball-delay:${delay}s;
              "
            >
              ${index + 1}
            </span>
          `;
        }).join("")}
      </div>

      <div class="lottery-machine-base"></div>
    </div>
  `;
}

function createLotteryRevealCardHtml(revealedPick) {
  if (!revealedPick) {
    return `
      <div class="lottery-show-reveal-card waiting">
        <div class="lottery-show-card-placeholder">
          <span>Lottery Board Ready</span>
          <strong>Click Run Lottery</strong>
          <small>The reveal will begin at Pick ${getLotteryPickCount()}.</small>
        </div>
      </div>
    `;
  }

  return `
    <div class="lottery-show-reveal-card revealed">
      <div class="lottery-show-reveal-kicker">Pick ${revealedPick.pick}</div>

      <div class="lottery-show-reveal-logo">
        ${getLotteryRevealTeamLogoHtml(revealedPick.teamId, "large")}
      </div>

      <div class="lottery-show-reveal-team-name">
        ${revealedPick.teamName}
      </div>
    </div>
  `;
}

function displayLotteryStillWaiting() {
  const container = document.getElementById("lottery-still-waiting-list");

  if (!container || !gameState.draft.lotteryReveal) return;

  const reveal = gameState.draft.lotteryReveal;
  const revealedIds = new Set(reveal.revealedPicks.map(pick => Number(pick.teamId)));

  const stillWaiting = reveal.revealOrder
    .filter(pick => !revealedIds.has(Number(pick.teamId)))
    .sort((a, b) => a.pick - b.pick);

  if (stillWaiting.length === 0) {
    container.innerHTML = `<p style="color:#94a3b8; font-weight:900;">All lottery teams have been revealed.</p>`;
    return;
  }

  container.innerHTML = "";

  for (let item of stillWaiting) {
    const row = document.createElement("div");
    row.className = "lottery-waiting-team";

    row.innerHTML = `
      <strong>${item.teamName}</strong>
      <span>Seed #${item.originalSeed}</span>
    `;

    container.appendChild(row);
  }
}

function displayLotteryRevealedPicks() {
  const container = document.getElementById("lottery-revealed-picks-list");

  if (!container || !gameState.draft.lotteryReveal) return;

  const reveal = gameState.draft.lotteryReveal;

  if (reveal.revealedPicks.length === 0) {
    container.innerHTML = `<p style="color:#94a3b8; font-weight:900;">No picks revealed yet.</p>`;
    return;
  }

  container.innerHTML = "";

  const revealedSorted = reveal.revealedPicks
    .slice()
    .sort((a, b) => b.pick - a.pick);

  for (let item of revealedSorted) {
    const card = document.createElement("div");
    card.className = "lottery-revealed-pick";

    if (Number(item.teamId) === Number(gameState.selectedTeamId)) {
      card.classList.add("user-pick");
    }

    card.innerHTML = `
      <div class="lottery-revealed-pick-number">#${item.pick}</div>

      <div class="lottery-revealed-pick-info">
        <strong>${item.teamName}</strong>
        <span>Seed #${item.originalSeed} · ${item.firstPickOdds.toFixed(1)}% No. 1 odds</span>
      </div>
    `;

    container.appendChild(card);
  }
}

function finishLotteryReveal() {
  if (!gameState || !gameState.draft) return;

  const count = getLotteryPickCount();

  clearDraftLotteryRevealTimer();
  clearDraftLotteryAutoplayTimer();

  gameState.draft.lotteryAutoplay = false;

  if (!Array.isArray(gameState.draft.revealedLotteryPicks)) {
    gameState.draft.revealedLotteryPicks = [];
  }

  if (gameState.draft.revealedLotteryPicks.length < count) {
    addInboxMessageOnce(
      "Lottery Reveal Not Finished",
      `Reveal all ${count} lottery picks before finishing the lottery.`,
      "staff",
      false,
      `lottery_not_finished_${gameState.draft.draftYear}`
    );

    return;
  }

  const lotteryOrderIds = gameState.draft.revealedLotteryPicks
    .slice()
    .sort((a, b) => a.pick - b.pick)
    .map(item => item.teamId);

  const nonLotteryTeams = getTeamsByReverseStandings()
    .slice(count)
    .map(team => team.id);

  const fullDraftOrder = lotteryOrderIds.concat(nonLotteryTeams);

  gameState.draft.lotteryRun = true;
  gameState.draft.lotteryComplete = true;
  gameState.draft.draftOrder = fullDraftOrder;
  gameState.draft.lotteryResults = gameState.draft.pendingLotteryResults || [];

  if (gameState.draft.lotteryReveal) {
    gameState.draft.lotteryReveal.active = false;
    gameState.draft.lotteryReveal.complete = true;
    gameState.draft.lotteryReveal.animating = false;
  }

  if (typeof markOffseasonHubEventComplete === "function") {
    markOffseasonHubEventComplete("draft_lottery");
  }

  if (typeof generateCurrentMockDraft === "function") {
    generateCurrentMockDraft("Post-Lottery Mock");
  }

  if (typeof resolveDraftLotteryRequiredMessages === "function") {
    resolveDraftLotteryRequiredMessages();
  }

  const topTeam = getLotteryTeamById(fullDraftOrder[0]);

  addInboxMessage(
    "Draft Lottery Complete",
    `The ${gameState.draft.draftYear} 3-2-1 draft lottery is complete. ${topTeam ? topTeam.name : "A team"} won the No. 1 pick.`,
    "event",
    false
  );

  displayLotteryOddsPage();

  if (typeof updateEnterLotteryButton === "function") updateEnterLotteryButton();
  if (typeof updateEnterDraftButtons === "function") updateEnterDraftButtons();

  refreshAll();
}

function skipDraftLottery() {
  if (!gameState || !gameState.draft || gameState.draft.lotteryRun) return;

  const count = getLotteryPickCount();

  clearDraftLotteryRevealTimer();
  clearDraftLotteryAutoplayTimer();

  gameState.draft.lotteryAutoplay = false;

  if (
    !Array.isArray(gameState.draft.lotteryOrder) ||
    gameState.draft.lotteryOrder.length < count
  ) {
    prepareSimpleDraftLotteryReveal(true);
  }

  if (
    !Array.isArray(gameState.draft.lotteryOrder) ||
    gameState.draft.lotteryOrder.length < count
  ) {
    addInboxMessageOnce(
      "Lottery Failed",
      `Not enough teams were found to run the ${count}-team lottery.`,
      "staff",
      false,
      `lottery_skip_failed_${gameState.draft.draftYear}`
    );
    return;
  }

  gameState.draft.revealedLotteryPicks = gameState.draft.lotteryOrder
    .slice(0, count)
    .map(item => ({
      pick: item.pick,
      teamId: item.teamId,
      teamName: item.teamName,
      teamAbbrev: item.teamAbbrev,
      originalSeed: item.originalSeed,
      firstPickOdds: Number(item.firstPickOdds || 0),
      topThreeOdds: Number(item.topThreeOdds || 0),
      topFiveOdds: Number(item.topFiveOdds || 0),
      balls: Number(item.balls || 0),
      lotteryZone: item.lotteryZone || ""
    }));

  gameState.draft.lotteryReveal = {
    active: false,
    revealOrder: gameState.draft.lotteryOrder.slice(0, count),
    revealedPicks: gameState.draft.revealedLotteryPicks.slice(),
    nextPickToReveal: 0,
    complete: true,
    animating: false
  };

  finishLotteryReveal();
}

function resolveDraftLotteryRequiredMessages() {
  if (!gameState || !Array.isArray(gameState.inbox)) return;

  for (let message of gameState.inbox) {
    if (
      message.title === "Draft Lottery Required" ||
      message.title === "Draft Lottery Tonight"
    ) {
      message.resolved = true;
      message.urgent = false;
      message.read = true;
    }
  }
}

function renderLotteryBoard() {
  const boardGrid = document.getElementById("lottery-board-grid");

  if (!boardGrid || !gameState || !gameState.draft) return;

  const count = getLotteryPickCount();
  const nextPick = getNextLotteryPickToReveal();

  let topFourHtml = "";
  let lowerPicksHtml = "";

  for (let pick = 1; pick <= 4; pick++) {
    const revealed = getLotteryRevealedPickByNumber(pick);

    topFourHtml += `
      <div class="lottery-show-top-card ${revealed ? "revealed" : ""} ${nextPick === pick ? "current" : ""}">
        <div class="lottery-show-top-number">${pick}</div>

        ${
          revealed
            ? `
              <div class="lottery-show-top-logo">
                ${getLotteryRevealTeamLogoHtml(revealed.teamId, "small")}
              </div>
              <strong>${revealed.teamName}</strong>
            `
            : `
              <div class="lottery-show-card-back">?</div>
              <strong>Hidden</strong>
            `
        }
      </div>
    `;
  }

  for (let pick = 5; pick <= count; pick++) {
    const revealed = getLotteryRevealedPickByNumber(pick);

    lowerPicksHtml += `
      <div class="lottery-show-order-row ${revealed ? "revealed" : ""} ${nextPick === pick ? "current" : ""}">
        <div class="lottery-show-order-pick">${pick}</div>

        <div class="lottery-show-order-logo">
          ${
            revealed
              ? getLotteryRevealTeamLogoHtml(revealed.teamId, "tiny")
              : `<div class="lottery-show-mini-card-back">?</div>`
          }
        </div>

        <div class="lottery-show-order-team">
          <strong>${revealed ? revealed.teamName : "TBD"}</strong>
          <span>
            ${
              revealed
                ? `${Number(revealed.firstPickOdds || 0).toFixed(1)}% No. 1 odds · ${revealed.balls || "-"} ball${Number(revealed.balls) === 1 ? "" : "s"}`
                : "Waiting to reveal"
            }
          </span>
        </div>
      </div>
    `;
  }

  boardGrid.innerHTML = `
    <div class="lottery-show-top-four">
      <div class="lottery-show-top-four-title">Top 4 Picks · Order To Be Revealed</div>
      <div class="lottery-show-top-four-grid">
        ${topFourHtml}
      </div>
    </div>

    <div class="lottery-show-lower-order">
      ${lowerPicksHtml}
    </div>
  `;
}

function revealNextLotteryPick() {
  if (!gameState || !gameState.draft) return;

  const count = getLotteryPickCount();

  if (gameState.draft.lotteryRun) return;

  if (!gameState.draft.lotteryReveal || !Array.isArray(gameState.draft.lotteryOrder) || gameState.draft.lotteryOrder.length < count) {
    startLotteryReveal();
    return;
  }

  if (!Array.isArray(gameState.draft.revealedLotteryPicks)) {
    gameState.draft.revealedLotteryPicks = [];
  }

  if (gameState.draft.lotteryReveal.animating) return;

  const revealedCount = gameState.draft.revealedLotteryPicks.length;

  if (revealedCount >= count) {
    gameState.draft.lotteryAutoplay = false;
    clearDraftLotteryAutoplayTimer();
    displayLotteryOddsPage();
    return;
  }

  const pickToReveal = count - revealedCount;

  const nextEntry = gameState.draft.lotteryOrder.find(item =>
    Number(item.pick) === Number(pickToReveal)
  );

  if (!nextEntry) {
    console.warn("No lottery team found for pick", pickToReveal, gameState.draft.lotteryOrder);
    return;
  }

  gameState.draft.lotteryReveal.animating = true;

  const machineWrap = document.querySelector(".lottery-show-machine-wrap");
  const cardArea = document.getElementById("lottery-main-reveal-card");
  const countdownEl = document.getElementById("lottery-reveal-countdown");
  const nextButton = document.getElementById("lottery-next-pick-button");
  const runButton = document.getElementById("run-lottery-button");
  const autoplayButton = document.getElementById("lottery-autoplay-button");
  const statusEl = document.getElementById("lottery-reveal-status");

  if (machineWrap) {
    machineWrap.innerHTML = createLotteryMachineHtml(true);
  }

  if (cardArea) {
    cardArea.innerHTML = `
      <div class="lottery-show-reveal-card waiting running">
        <div class="lottery-show-card-placeholder">
          <span>Machine Running</span>
          <strong>Pick ${pickToReveal}</strong>
          <small>Drawing lottery balls...</small>
        </div>
      </div>
    `;
  }

  if (nextButton) nextButton.disabled = true;
  if (runButton) runButton.disabled = true;
  if (autoplayButton) autoplayButton.disabled = false;
  if (statusEl) statusEl.textContent = `Drawing Pick ${pickToReveal}...`;

  clearDraftLotteryRevealTimer();

  let remaining = 4.0;

  if (countdownEl) {
    countdownEl.textContent = remaining.toFixed(1);
  }

  draftLotteryRevealTimer = setInterval(() => {
    remaining = Math.max(0, remaining - 0.1);

    const liveCountdown = document.getElementById("lottery-reveal-countdown");

    if (liveCountdown) {
      liveCountdown.textContent = remaining.toFixed(1);
    }

    if (remaining > 0) return;

    clearDraftLotteryRevealTimer();

    const revealItem = {
      pick: nextEntry.pick,
      teamId: nextEntry.teamId,
      teamName: nextEntry.teamName,
      teamAbbrev: nextEntry.teamAbbrev,
      originalSeed: nextEntry.originalSeed,
      firstPickOdds: Number(nextEntry.firstPickOdds || 0),
      topThreeOdds: Number(nextEntry.topThreeOdds || 0),
      topFiveOdds: Number(nextEntry.topFiveOdds || 0),
      balls: Number(nextEntry.balls || 0),
      lotteryZone: nextEntry.lotteryZone || ""
    };

    gameState.draft.revealedLotteryPicks.push(revealItem);

    if (!Array.isArray(gameState.draft.lotteryReveal.revealedPicks)) {
      gameState.draft.lotteryReveal.revealedPicks = [];
    }

    gameState.draft.lotteryReveal.revealedPicks.push(revealItem);

    const newRevealedCount = gameState.draft.revealedLotteryPicks.length;

    gameState.draft.lotteryReveal.nextPickToReveal =
      newRevealedCount >= count ? 0 : count - newRevealedCount;

    gameState.draft.lotteryReveal.complete = newRevealedCount >= count;
    gameState.draft.lotteryReveal.animating = false;

   if (newRevealedCount >= count) {
  gameState.draft.lotteryAutoplay = false;
  clearDraftLotteryAutoplayTimer();

  // Show the No. 1 pick card for a moment before finalizing the lottery.
  displayLotteryOddsPage();

  setTimeout(() => {
    finishLotteryReveal();
  }, 2500);

  return;
}

    displayLotteryOddsPage();

    if (gameState.draft.lotteryAutoplay === true) {
  clearDraftLotteryAutoplayTimer();

  // Let the revealed team stay on the big card before the next draw starts.
  draftLotteryAutoplayTimer = setTimeout(() => {
    revealNextLotteryPick();
  }, 2000);
}
  }, 100);
}

function getDraftLotteryDate() {
  const draftYear = gameState.draft && gameState.draft.draftYear
    ? gameState.draft.draftYear
    : gameState.seasonStartYear + 1;

  return new Date(draftYear, 5, 18); // June 18
}

function isDraftLotteryDay() {
  if (!gameState || !gameState.currentDate) return false;

  return datesMatch(gameState.currentDate, getDraftLotteryDate());
}

function hasDraftLotteryPassed() {
  if (!gameState || !gameState.currentDate) return false;

  const current = new Date(gameState.currentDate);
  const lotteryDate = getDraftLotteryDate();

  current.setHours(0, 0, 0, 0);
  lotteryDate.setHours(0, 0, 0, 0);

  return current >= lotteryDate;
}

function getDraftLotteryDateText() {
  return formatShortDate(getDraftLotteryDate());
}

let draftLotteryRevealTimer = null;
let draftLotteryAutoplayTimer = null;

function clearDraftLotteryRevealTimer() {
  if (draftLotteryRevealTimer) {
    clearInterval(draftLotteryRevealTimer);
    draftLotteryRevealTimer = null;
  }
}

function clearDraftLotteryAutoplayTimer() {
  if (draftLotteryAutoplayTimer) {
    clearTimeout(draftLotteryAutoplayTimer);
    draftLotteryAutoplayTimer = null;
  }
}

function stopDraftLotteryAutoplay() {
  clearDraftLotteryAutoplayTimer();

  if (gameState && gameState.draft) {
    gameState.draft.lotteryAutoplay = false;
  }

  if (typeof displayLotteryOddsPage === "function") {
    displayLotteryOddsPage();
  }
}

function toggleDraftLotteryAutoplay() {
  if (!gameState || !gameState.draft) return;

  const count = getLotteryPickCount();

  if (gameState.draft.lotteryRun) return;

  if (!gameState.draft.lotteryReveal || !Array.isArray(gameState.draft.lotteryOrder) || gameState.draft.lotteryOrder.length < count) {
    startLotteryReveal();
  }

  if (gameState.draft.lotteryAutoplay) {
    stopDraftLotteryAutoplay();
    return;
  }

  gameState.draft.lotteryAutoplay = true;
  displayLotteryOddsPage();

  if (!gameState.draft.lotteryReveal?.animating) {
    revealNextLotteryPick();
  }
}

function getLotteryPickCount() {
  return typeof LOTTERY_PICK_COUNT !== "undefined" ? LOTTERY_PICK_COUNT : 16;
}

function getLotteryTeamById(teamId) {
  if (!gameState || !Array.isArray(gameState.teams)) return null;

  if (typeof getTeamById === "function") {
    const team = getTeamById(teamId);
    if (team) return team;
  }

  if (typeof getBaseTeamById === "function") {
    const team = getBaseTeamById(teamId);
    if (team) return team;
  }

  return gameState.teams.find(team => Number(team.id) === Number(teamId)) || null;
}

function getLotteryRevealTeamLogoHtml(teamId, className = "") {
  const team = getLotteryTeamById(teamId);

  if (!team) {
    return `<div class="lottery-show-logo-fallback ${className}">?</div>`;
  }

  if (typeof getTeamLogoHTML === "function") {
    return getTeamLogoHTML(team, `lottery-show-team-logo ${className}`);
  }

  if (typeof getTeamLogoHtml === "function") {
    return getTeamLogoHtml(team);
  }

  if (team.logo) {
    return `
      <img
        class="lottery-show-team-logo ${className}"
        src="${team.logo}"
        alt="${team.name}"
      >
    `;
  }

  return `<div class="lottery-show-logo-fallback ${className}">${team.abbrev || "TM"}</div>`;
}

function getLotteryRevealedPickByNumber(pickNumber) {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.revealedLotteryPicks)) {
    return null;
  }

  return gameState.draft.revealedLotteryPicks.find(item =>
    Number(item.pick) === Number(pickNumber)
  ) || null;
}

function getLatestLotteryRevealedPick() {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.revealedLotteryPicks)) {
    return null;
  }

  if (gameState.draft.revealedLotteryPicks.length === 0) return null;

  return gameState.draft.revealedLotteryPicks[gameState.draft.revealedLotteryPicks.length - 1];
}

function getNextLotteryPickToReveal() {
  const count = getLotteryPickCount();
  const revealedCount = gameState?.draft?.revealedLotteryPicks?.length || 0;

  return Math.max(0, count - revealedCount);
}

/* 0.7F Draft Night Event */

let draftNightState = {
  activeToolTab: "prospects",
  timerSeconds: 60,
  timerInterval: null,
  cpuPickTimeout: null,
  infoLocked: false
};

function getDraftNightDate() {
  const draftYear = gameState.draft && gameState.draft.draftYear
    ? gameState.draft.draftYear
    : gameState.seasonStartYear + 1;

  return new Date(draftYear, 5, 20); // June 20
}

function getDraftRoundOneDate() {
  const draftYear = gameState.draft && gameState.draft.draftYear
    ? gameState.draft.draftYear
    : gameState.seasonStartYear + 1;

  return new Date(draftYear, 5, 20); // June 20
}

function getDraftRoundTwoDate() {
  const draftYear = gameState.draft && gameState.draft.draftYear
    ? gameState.draft.draftYear
    : gameState.seasonStartYear + 1;

  return new Date(draftYear, 5, 21); // June 21
}

function getDraftNightDate() {
  return getDraftRoundOneDate();
}

function getActiveDraftNightRound() {
  if (!gameState || !gameState.draft) return 1;

  if (gameState.draft.roundOneComplete && !gameState.draft.draftComplete) {
    return 2;
  }

  return 1;
}

function getDraftCurrentNightStartPick() {
  return getActiveDraftNightRound() === 2 ? 31 : 1;
}

function getDraftCurrentNightEndPick() {
  return getActiveDraftNightRound() === 2 ? 60 : 30;
}

function isDraftRoundOneNightDay() {
  if (!gameState || !gameState.currentDate) return false;
  return datesMatch(gameState.currentDate, getDraftRoundOneDate());
}

function isDraftRoundTwoNightDay() {
  if (!gameState || !gameState.currentDate) return false;
  return datesMatch(gameState.currentDate, getDraftRoundTwoDate());
}

function hasDraftRoundOneNightPassed() {
  if (!gameState || !gameState.currentDate) return false;

  const current = new Date(gameState.currentDate);
  const draftDate = getDraftRoundOneDate();

  current.setHours(0, 0, 0, 0);
  draftDate.setHours(0, 0, 0, 0);

  return current.getTime() >= draftDate.getTime();
}

function hasDraftRoundTwoNightPassed() {
  if (!gameState || !gameState.currentDate) return false;

  const current = new Date(gameState.currentDate);
  const draftDate = getDraftRoundTwoDate();

  current.setHours(0, 0, 0, 0);
  draftDate.setHours(0, 0, 0, 0);

  return current.getTime() >= draftDate.getTime();
}

function isDraftNightDay() {
  return isDraftRoundOneNightDay() || isDraftRoundTwoNightDay();
}

function hasDraftNightPassed() {
  if (!gameState || !gameState.draft) return false;

  if (gameState.draft.roundOneComplete && !gameState.draft.draftComplete) {
    return hasDraftRoundTwoNightPassed();
  }

  return hasDraftRoundOneNightPassed();
}

function getDraftNightDateText() {
  if (gameState && gameState.draft && gameState.draft.roundOneComplete && !gameState.draft.draftComplete) {
    return formatDate(getDraftRoundTwoDate());
  }

  return formatDate(getDraftRoundOneDate());
}

function ensureTwoNightDraftState() {
  if (!gameState || !gameState.draft) return;

  if (gameState.draft.roundOneComplete === undefined) {
    gameState.draft.roundOneComplete = Number(gameState.draft.currentPickIndex || 0) >= 30;
  }

  if (gameState.draft.roundTwoStarted === undefined) {
    gameState.draft.roundTwoStarted = Number(gameState.draft.currentPickIndex || 0) >= 30;
  }
}

function canEnterDraftNight() {
  if (!gameState || !gameState.draft) return false;

  ensureTwoNightDraftState();

  if (gameState.draft.draftComplete) return false;
  if (!gameState.draft.lotteryRun) return false;

  // Night 1: Round 1
  if (!gameState.draft.roundOneComplete) {
    return hasDraftRoundOneNightPassed();
  }

  // Night 2: Round 2
  return hasDraftRoundTwoNightPassed();
}

function updateEnterDraftButtons() {
  const dashboardButton = document.getElementById("enter-draft-button-dashboard");
  const draftTabButton = document.getElementById("enter-draft-button-draft-tab");

  const shouldShow = canEnterDraftNight();

  if (dashboardButton) {
    dashboardButton.classList.toggle("hidden", !shouldShow);
  }

  if (draftTabButton) {
    draftTabButton.classList.toggle("hidden", !shouldShow);
  }
}

function processDraftNightDay() {
  if (!gameState || !gameState.started || !gameState.draft) return;

  ensureTwoNightDraftState();

  const roundOneKey = `draft_round_one_night_${gameState.draft.draftYear}`;
  const roundTwoKey = `draft_round_two_night_${gameState.draft.draftYear}`;

  if (isDraftRoundOneNightDay() && !gameState.processedEvents[roundOneKey]) {
    addInboxMessage(
      "Draft Night Has Arrived",
      "Round 1 of the draft is tonight. Click Enter Draft to begin Draft Night.",
      "event",
      false
    );

    gameState.processedEvents[roundOneKey] = true;
  }

  if (
    gameState.draft.roundOneComplete &&
    !gameState.draft.draftComplete &&
    isDraftRoundTwoNightDay() &&
    !gameState.processedEvents[roundTwoKey]
  ) {
    addInboxMessage(
      "Round 2 Draft Night Has Arrived",
      "Round 2 of the draft is tonight. Click Enter Draft to finish the draft.",
      "event",
      false
    );

    gameState.processedEvents[roundTwoKey] = true;
  }
}

function blockIfDraftNightRequired() {
  if (!gameState || !gameState.started || !gameState.draft) return false;

  ensureTwoNightDraftState();

  if (!gameState.draft.lotteryRun || gameState.draft.draftComplete) {
    return false;
  }

  if (!gameState.draft.roundOneComplete && hasDraftRoundOneNightPassed()) {
    addInboxMessageOnce(
      "Draft Night Required",
      "Round 1 of the draft is ready. Enter Draft Night before advancing further.",
      "urgent",
      false,
      `draft_round_one_required_${gameState.draft.draftYear}`
    );

    refreshAll();
    return true;
  }

  if (
    gameState.draft.roundOneComplete &&
    !gameState.draft.draftComplete &&
    hasDraftRoundTwoNightPassed()
  ) {
    addInboxMessageOnce(
      "Round 2 Draft Night Required",
      "Round 2 of the draft is ready. Enter Draft Night before advancing further.",
      "urgent",
      false,
      `draft_round_two_required_${gameState.draft.draftYear}`
    );

    refreshAll();
    return true;
  }

  return false;
}
function enterDraftNight() {
  if (!canEnterDraftNight()) {
    addInboxMessageOnce(
      "Draft Night Unavailable",
      `Draft Night opens on ${getDraftNightDateText()} after the lottery is complete.`,
      "staff",
      false,
      `draft_night_unavailable_${gameState.draft.draftYear}`
    );
    return;
  }

  initializeDraftNightState();

  currentSecondaryScreen = "draft-night-screen";
  showSecondaryScreen("draft-night-screen");

  displayDraftNightScreen();
  startDraftPickClock();
}

function initializeDraftNightState() {
  ensureDraftNightDraftOrder();
  ensureTwoNightDraftState();

  if (!Array.isArray(gameState.draft.draftedPlayers)) {
    gameState.draft.draftedPlayers = [];
  }

  // Starting Round 1 for the first time
  if (!gameState.draft.roundOneComplete && !gameState.draft.draftStarted) {
    gameState.draft.draftStarted = true;

    if (Number(gameState.draft.currentPickIndex || 0) < 0) {
      gameState.draft.currentPickIndex = 0;
    }

    if (Number(gameState.draft.currentPickIndex || 0) === 0 && gameState.draft.draftedPlayers.length === 0) {
      gameState.draft.currentPickIndex = 0;
      gameState.draft.draftedPlayers = [];
    }
  }

  // Starting Round 2
  if (gameState.draft.roundOneComplete && !gameState.draft.draftComplete) {
    gameState.draft.draftStarted = true;
    gameState.draft.roundTwoStarted = true;

    if (Number(gameState.draft.currentPickIndex || 0) < 30) {
      gameState.draft.currentPickIndex = 30;
    }
  }

  draftNightState.activeToolTab = "prospects";
  draftNightState.timerSeconds = 60;
  draftNightState.infoLocked = false;

  clearDraftNightTimers();
}

function ensureDraftNightDraftOrder() {
  if (!gameState || !gameState.draft) return;

  let baseOrder = [];

  if (Array.isArray(gameState.draft.draftOrder) && gameState.draft.draftOrder.length > 0) {
    baseOrder = gameState.draft.draftOrder.slice(0, 30);
  } else {
    baseOrder = getTeamsByReverseStandings().map(team => team.id).slice(0, 30);
  }

  if (baseOrder.length < 30) {
    baseOrder = getTeamsByReverseStandings().map(team => team.id).slice(0, 30);
  }

  gameState.draft.draftOrder = baseOrder.concat(baseOrder);
}

function clearDraftNightTimers() {
  if (draftNightState.timerInterval) {
    clearInterval(draftNightState.timerInterval);
    draftNightState.timerInterval = null;
  }

  if (draftNightState.cpuPickTimeout) {
    clearTimeout(draftNightState.cpuPickTimeout);
    draftNightState.cpuPickTimeout = null;
  }
}

function displayDraftNightScreen() {
  if (!gameState || !gameState.draft) return;

  const screen = document.getElementById("draft-night-screen");

  if (!screen) {
    console.warn("Draft night screen container not found.");
    return;
  }

  screen.innerHTML = getDraftNightRedesignHtml();
}

function getCurrentDraftPickNumber() {
  return Number(gameState.draft.currentPickIndex || 0) + 1;
}

function getCurrentDraftRound() {
  return getCurrentDraftPickNumber() <= 30 ? 1 : 2;
}

function getCurrentDraftTeam() {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.draftOrder)) return null;

  ensureDraftNightDraftOrder();

  const pickIndex = Number(gameState.draft.currentPickIndex || 0);

  if (pickIndex < 0 || pickIndex >= DRAFT_PICKS) return null;

  const teamId = gameState.draft.draftOrder[pickIndex];

  if (teamId === undefined || teamId === null) return null;

  return getTeamById(teamId) || getBaseTeamById(teamId);
}

function isUserOnClock() {
  const team = getCurrentDraftTeam();

  return team && Number(team.id) === Number(gameState.selectedTeamId);
}

function displayDraftNightCurrentPick() {
  const team = getCurrentDraftTeam();
  const pickNumber = getCurrentDraftPickNumber();
  const round = getCurrentDraftRound();

  const status = document.getElementById("draft-night-current-status");
  const teamAbbrev = document.getElementById("draft-night-team-abbrev");
  const teamName = document.getElementById("draft-night-on-clock-team");
  const pickInfo = document.getElementById("draft-night-pick-info");
  const warning = document.getElementById("draft-night-user-warning");

  if (gameState.draft.draftComplete || pickNumber > DRAFT_PICKS) {
    if (status) status.textContent = "Draft complete";
    if (teamAbbrev) teamAbbrev.textContent = "✓";
    if (teamName) teamName.textContent = "Draft Complete";
    if (pickInfo) pickInfo.textContent = "All 60 picks are complete.";
    if (warning) warning.classList.add("hidden");
    return;
  }

  if (!team) return;

  if (status) {
    status.textContent = `${team.name} is on the clock`;
  }

  if (teamAbbrev) {
    teamAbbrev.textContent = team.abbrev || team.name.slice(0, 3).toUpperCase();
  }

  if (teamName) {
    teamName.textContent = team.name;
  }

  if (pickInfo) {
    pickInfo.textContent = `Round ${round} · Pick ${pickNumber}`;
  }

  if (warning) {
    warning.classList.toggle("hidden", !isUserOnClock());
  }
}

function displayDraftNightRoundOneBoard() {
  const container = document.getElementById("draft-night-round-one-picks");
  if (!container) return;

  container.innerHTML = "";

  for (let pick = 1; pick <= 30; pick++) {
    container.appendChild(createDraftNightPickTile(pick));
  }
}

function displayDraftNightRoundTwoBoard() {
  const container = document.getElementById("draft-night-round-two-picks");
  if (!container) return;

  container.innerHTML = "";

  for (let pick = 31; pick <= 60; pick++) {
    container.appendChild(createDraftNightRoundTwoTile(pick));
  }
}

function createDraftNightPickTile(pickNumber) {
  const pick = getDraftedPickByNumber(pickNumber);
  const currentPickNumber = getCurrentDraftPickNumber();

  const tile = document.createElement("div");
  tile.className = "draft-night-pick-tile";

  if (!pick) {
    tile.classList.add("empty");
  }

  if (!gameState.draft.draftComplete && pickNumber === currentPickNumber) {
    tile.classList.add("current");
  }

  if (pick) {
    tile.innerHTML = `
      <div class="draft-night-pick-number">${pickNumber}</div>
      <div class="draft-night-pick-info">
        <span class="draft-night-pick-name">${formatDraftBoardName(pick.prospectName)}</span>
        <span class="draft-night-pick-team">${pick.teamName}</span>
        <span class="draft-night-pick-sub">${pick.position} · ${pick.school}</span>
      </div>
    `;
  } else {
    const team = getDraftTeamByPickNumber(pickNumber);

    tile.innerHTML = `
      <div class="draft-night-pick-number">${pickNumber}</div>
      <div class="draft-night-pick-info">
        <span class="draft-night-pick-name">---</span>
        <span class="draft-night-pick-team">${team ? team.name : "TBD"}</span>
        <span class="draft-night-pick-sub">Awaiting pick</span>
      </div>
    `;
  }

  return tile;
}

function createDraftNightRoundTwoTile(pickNumber) {
  const pick = getDraftedPickByNumber(pickNumber);
  const currentPickNumber = getCurrentDraftPickNumber();

  const tile = document.createElement("div");
  tile.className = "draft-night-round-two-pick";

  if (!gameState.draft.draftComplete && pickNumber === currentPickNumber) {
    tile.classList.add("current");
  }

  if (pick) {
    tile.innerHTML = `
      <div class="projected-pick-number">${pickNumber}</div>
      <div class="projected-pick-info">
        <strong>${formatDraftBoardName(pick.prospectName)}</strong>
        <span>${pick.teamName} · ${pick.position}</span>
      </div>
    `;
  } else {
    const team = getDraftTeamByPickNumber(pickNumber);

    tile.innerHTML = `
      <div class="projected-pick-number">${pickNumber}</div>
      <div class="projected-pick-info">
        <strong>---</strong>
        <span>${team ? team.name : "TBD"}</span>
      </div>
    `;
  }

  return tile;
}

function getDraftedPickByNumber(pickNumber) {
  if (!gameState.draft || !Array.isArray(gameState.draft.draftedPlayers)) return null;

  return gameState.draft.draftedPlayers.find(pick => Number(pick.pick) === Number(pickNumber)) || null;
}

function getDraftTeamByPickNumber(pickNumber) {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.draftOrder)) return null;

  ensureDraftNightDraftOrder();

  const index = Number(pickNumber) - 1;

  if (index < 0 || index >= DRAFT_PICKS) return null;

  const teamId = gameState.draft.draftOrder[index];

  if (teamId === undefined || teamId === null) return null;

  return getTeamById(teamId) || getBaseTeamById(teamId);
}

function formatDraftBoardName(fullName) {
  if (!fullName) return "---";

  const parts = fullName.trim().split(" ");

  if (parts.length <= 1) return fullName;

  const firstInitial = parts[0][0];
  const lastName = parts.slice(1).join(" ");

  return `${firstInitial}. ${lastName}`;
}

function showDraftNightToolTab(tabName) {
  if (draftNightState.infoLocked && tabName !== "prospects") {
    addInboxMessageOnce(
      "Draft Clock Expired",
      "Your clock expired. You can only use the Prospects list now.",
      "urgent",
      false,
      `draft_clock_locked_${gameState.draft.draftYear}_${getCurrentDraftPickNumber()}`
    );
    return;
  }

  draftNightState.activeToolTab = tabName;
  displayDraftNightToolTabs();
  displayDraftNightToolPanel();
}

function displayDraftNightToolTabs() {
  const tabIds = {
    prospects: "draft-night-tab-prospects",
    board: "draft-night-tab-board",
    scouting: "draft-night-tab-scouting",
    mock: "draft-night-tab-mock"
  };

  for (let key in tabIds) {
    const button = document.getElementById(tabIds[key]);
    if (button) {
      button.classList.toggle("active", draftNightState.activeToolTab === key);
    }
  }

  const tabContainer = document.querySelector(".draft-night-tool-tabs");

  if (tabContainer) {
    tabContainer.classList.toggle("locked", draftNightState.infoLocked);
  }
}

function displayDraftNightToolPanel() {
  const title = document.getElementById("draft-night-tool-panel-title");
  const panel = document.getElementById("draft-night-tool-panel");

  if (!title || !panel) return;

  if (draftNightState.infoLocked) {
    draftNightState.activeToolTab = "prospects";
  }

  if (draftNightState.activeToolTab === "prospects") {
    title.textContent = "Prospects Remaining";
    displayDraftNightProspectsPanel(panel, getAvailableDraftProspectsByScoutingRank());
    return;
  }

  if (draftNightState.activeToolTab === "board") {
    title.textContent = "My Draft Board";
    displayDraftNightProspectsPanel(panel, getAvailableDraftBoardProspects());
    return;
  }

  if (draftNightState.activeToolTab === "scouting") {
    title.textContent = "Scouting Database";
    displayDraftNightProspectsPanel(panel, getAvailableDraftProspectsByScoutingRank());
    return;
  }

  if (draftNightState.activeToolTab === "mock") {
    title.textContent = "Mock Draft View";
    displayDraftNightMockPanel(panel);
  }
}

function getAvailableDraftProspects() {
  return getDraftClass().filter(prospect => !prospect.drafted);
}

function getAvailableDraftProspectsByScoutingRank() {
  return getAvailableDraftProspects()
    .slice()
    .sort((a, b) => {
      const aBoardIndex = gameState.draft.draftBoard.indexOf(a.id);
      const bBoardIndex = gameState.draft.draftBoard.indexOf(b.id);

      if (aBoardIndex !== -1 && bBoardIndex !== -1) return aBoardIndex - bBoardIndex;
      if (aBoardIndex !== -1) return -1;
      if (bBoardIndex !== -1) return 1;

      if (Number(b.scoutingLevel || 0) !== Number(a.scoutingLevel || 0)) {
        return Number(b.scoutingLevel || 0) - Number(a.scoutingLevel || 0);
      }

      return Number(a.mockRank || 999) - Number(b.mockRank || 999);
    });
}

function getAvailableDraftBoardProspects() {
  return getDraftBoardProspects().filter(prospect => !prospect.drafted);
}

function displayDraftNightProspectsPanel(panel, prospects) {
  if (!prospects || prospects.length === 0) {
    panel.innerHTML = `
      <div class="draft-night-finished-card">
        No prospects available in this view.
      </div>
    `;
    return;
  }

  panel.innerHTML = "";

  for (let i = 0; i < prospects.length; i++) {
    panel.appendChild(createDraftNightProspectRow(prospects[i], i + 1));
  }
}

function createDraftNightProspectRow(prospect, rank) {
  const row = document.createElement("div");
  row.className = "draft-night-prospect-row";

  const canSelect = isUserOnClock();

  row.innerHTML = `
    <div class="draft-night-prospect-rank">${rank}</div>

    <div class="draft-night-prospect-name">
      <strong onclick="openProspectProfile('${prospect.id}')">${prospect.name}</strong>
      <span>${prospect.archetype} · ${prospect.collegeOrClub}</span>
    </div>

    <div>${prospect.primaryPosition}</div>
    <div>${prospect.height}</div>
    <div>${getScoutingProgressText(prospect)}</div>

    <button
      class="draft-night-select-button"
      ${canSelect ? "" : "disabled"}
      onclick="selectDraftProspect('${prospect.id}')"
    >
      Select
    </button>
  `;

  return row;
}

function displayDraftNightMockPanel(panel) {
  const availableIds = new Set(getAvailableDraftProspects().map(prospect => prospect.id));

  const mockPicks = (gameState.draft.currentMockDraft || [])
    .filter(pick => availableIds.has(pick.prospectId));

  if (mockPicks.length === 0) {
    panel.innerHTML = `
      <div class="draft-night-finished-card">
        No mock draft prospects remain.
      </div>
    `;
    return;
  }

  panel.innerHTML = "";

  for (let pick of mockPicks) {
    const prospect = getProspectById(pick.prospectId);
    if (!prospect) continue;

    const row = document.createElement("div");
    row.className = "draft-night-prospect-row";

    row.innerHTML = `
      <div class="draft-night-prospect-rank">${pick.pick}</div>

      <div class="draft-night-prospect-name">
        <strong onclick="openProspectProfile('${prospect.id}')">${prospect.name}</strong>
        <span>${pick.teamName} · ${prospect.collegeOrClub}</span>
      </div>

      <div>${prospect.primaryPosition}</div>
      <div>${prospect.height}</div>
      <div>${getMockMovementHtml(pick)}</div>

      <button
        class="draft-night-select-button"
        ${isUserOnClock() ? "" : "disabled"}
        onclick="selectDraftProspect('${prospect.id}')"
      >
        Select
      </button>
    `;

    panel.appendChild(row);
  }
}

function startDraftPickClock() {
  clearDraftNightTimers();

  if (!gameState || !gameState.draft || gameState.draft.draftComplete) return;

  draftNightState.timerSeconds = 60;
  draftNightState.infoLocked = false;

  updateDraftNightTimerDisplay();

  draftNightState.timerInterval = setInterval(() => {
    draftNightState.timerSeconds--;
    updateDraftNightTimerDisplay();

    if (draftNightState.timerSeconds <= 0) {
      clearInterval(draftNightState.timerInterval);
      draftNightState.timerInterval = null;

      if (isUserOnClock()) {
        draftNightState.infoLocked = true;
        draftNightState.activeToolTab = "prospects";
        displayDraftNightToolTabs();
        displayDraftNightToolPanel();

        addInboxMessageOnce(
          "Draft Clock Expired",
          "Your draft clock expired. You can only use the Prospects list now.",
          "urgent",
          false,
          `draft_clock_expired_${gameState.draft.draftYear}_${getCurrentDraftPickNumber()}`
        );
      } else {
        makeCpuDraftPick();
      }
    }
  }, 1000);

  if (!isUserOnClock()) {
    draftNightState.cpuPickTimeout = setTimeout(() => {
      makeCpuDraftPick();
    }, 5000);
  }
}

function updateDraftNightTimerDisplay() {
  const timer = document.getElementById("draft-night-timer");

  if (!timer) return;

  const seconds = Math.max(0, draftNightState.timerSeconds);
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = String(seconds % 60).padStart(2, "0");

  timer.textContent = `${String(minutesPart).padStart(2, "0")}:${secondsPart}`;
  timer.classList.toggle("warning", seconds <= 10);
}

function makeCpuDraftPick() {
  if (!gameState || !gameState.draft || gameState.draft.draftComplete) return;
  if (isUserOnClock()) return;

  const team = getCurrentDraftTeam();
  const prospect = chooseCpuDraftProspect(team);

  if (!team || !prospect) return;

  completeDraftPick(team, prospect);
}

function normalizeTeamNeedsForDraft(rawNeeds) {
  if (Array.isArray(rawNeeds)) {
    return rawNeeds
      .map(need => {
        if (typeof need === "string") {
          return {
            position: need,
            score: 1
          };
        }

        return {
          position: need.position || need.pos || need.key || "",
          score: Number(need.score || need.need || need.value || need.count || 0)
        };
      })
      .filter(need => need.position);
  }

  if (rawNeeds && typeof rawNeeds === "object") {
    return Object.entries(rawNeeds)
      .map(([position, value]) => {
        if (value && typeof value === "object") {
          return {
            position: value.position || position,
            score: Number(value.score || value.need || value.value || value.count || 0)
          };
        }

        return {
          position,
          score: Number(value || 0)
        };
      })
      .filter(need => need.position);
  }

  return [];
}

function chooseCpuDraftProspect(team) {
  const available = getAvailableDraftProspects();

  if (available.length === 0) return null;

  const rawTeamNeeds = typeof getTeamPositionNeeds === "function"
    ? getTeamPositionNeeds(team.id)
    : [];

  const teamNeeds = normalizeTeamNeedsForDraft(rawTeamNeeds)
    .sort((a, b) => b.score - a.score);

  const topNeedPositions = teamNeeds
    .slice(0, 2)
    .map(need => need.position);

  const candidates = available
    .slice()
    .sort((a, b) => {
      const scoreA = getCpuDraftProspectScore(a, topNeedPositions);
      const scoreB = getCpuDraftProspectScore(b, topNeedPositions);

      return scoreB - scoreA;
    });

  const topPool = candidates.slice(0, Math.min(6, candidates.length));

  return topPool[randomInt(0, topPool.length - 1)];
}

function getCpuDraftProspectScore(prospect, topNeedPositions) {
  let score = 0;

  score += (70 - Number(prospect.mockRank || 70)) * 7;
  score += getProspectStatsSortValue(prospect) * 3;
  score += Number(prospect.actualCurrentAbility || 500) * 0.25;

  if (topNeedPositions.includes(prospect.primaryPosition)) {
    score += 45;
  }

  if (prospect.projectedRange === "Top 3") score += 70;
  else if (prospect.projectedRange === "Top 5") score += 55;
  else if (prospect.projectedRange === "Top 10") score += 40;
  else if (prospect.projectedRange === "Lottery") score += 25;
  else if (prospect.projectedRange === "1st Round") score += 12;

  score += randomInt(-35, 35);

  return score;
}

function selectDraftProspect(prospectId) {
  if (!isUserOnClock()) {
    addInboxMessageOnce(
      "Not Your Pick",
      "You can only select a prospect when your team is on the clock.",
      "staff",
      false,
      `not_user_pick_${gameState.draft.draftYear}_${getCurrentDraftPickNumber()}`
    );
    return;
  }

  const prospect = getProspectById(prospectId);
  const team = getCurrentDraftTeam();

  if (!prospect || !team || prospect.drafted) return;

  const confirmed = confirm(`Draft ${prospect.name} with Pick #${getCurrentDraftPickNumber()}?`);

  if (!confirmed) return;

  completeDraftPick(team, prospect);
}

function completeDraftPick(team, prospect) {
  if (!team || !prospect) return;

  clearDraftNightTimers();

  const pickNumber = getCurrentDraftPickNumber();
  const round = getCurrentDraftRound();

  prospect.drafted = true;
  prospect.draftPick = pickNumber;
  prospect.draftedTeamId = team.id;
  prospect.draftedTeamName = team.name;

  const draftPick = {
    pick: pickNumber,
    round,
    teamId: team.id,
    teamName: team.name,
    teamAbbrev: team.abbrev,
    prospectId: prospect.id,
    prospectName: prospect.name,
    position: prospect.primaryPosition,
    school: prospect.collegeOrClub
  };

  gameState.draft.draftedPlayers.push(draftPick);
  gameState.draft.currentPickIndex++;

  // End of Night 1
  if (pickNumber === 30 && !gameState.draft.roundOneComplete) {
    finishDraftRoundOneNight();
    return;
  }

  // End of Night 2 / full draft
  if (gameState.draft.currentPickIndex >= DRAFT_PICKS) {
    finishDraftNight();
    return;
  }

  displayDraftNightScreen();
  startDraftPickClock();
}

function simDraftNextPick() {
  if (!gameState || !gameState.draft || gameState.draft.draftComplete) return;

  if (isUserOnClock()) {
    const confirmed = confirm("It is your pick. Simming this pick will auto-draft the top available player on your draft board or scouting list. Continue?");

    if (!confirmed) return;

    const autoPick = getAutoUserDraftPick();

    if (!autoPick) return;

    completeDraftPick(getCurrentDraftTeam(), autoPick);
    return;
  }

  makeCpuDraftPick();

  refreshDraftNightRedesign();
}

function simDraftToUserPick() {
  if (!gameState || !gameState.draft || gameState.draft.draftComplete) return;

  const startingRound = getActiveDraftNightRound();
  const nightEndPick = getDraftCurrentNightEndPick();

  clearDraftNightTimers();

  while (
    !gameState.draft.draftComplete &&
    getActiveDraftNightRound() === startingRound &&
    !isUserOnClock() &&
    getCurrentDraftPickNumber() <= nightEndPick
  ) {
    const team = getCurrentDraftTeam();
    const prospect = chooseCpuDraftProspect(team);

    if (!team || !prospect) break;

    completeDraftPick(team, prospect);

    if (getActiveDraftNightRound() !== startingRound) break;
    if (isUserOnClock()) break;
  }

  displayDraftNightScreen();

  if (!gameState.draft.draftComplete && getActiveDraftNightRound() === startingRound) {
    startDraftPickClock();
  }

  refreshDraftNightRedesign();
}

function simDraftToEnd() {
  if (!gameState || !gameState.draft || gameState.draft.draftComplete) return;

  const activeRound = getActiveDraftNightRound();
  const nightEndPick = getDraftCurrentNightEndPick();
  const label = activeRound === 1 ? "Round 1" : "Round 2";

  const confirmed = confirm(`Sim to the end of ${label}? Your picks in this round will be auto-selected if you still have picks remaining.`);

  if (!confirmed) return;

  clearDraftNightTimers();

  while (
    !gameState.draft.draftComplete &&
    getActiveDraftNightRound() === activeRound &&
    getCurrentDraftPickNumber() <= nightEndPick
  ) {
    const team = getCurrentDraftTeam();
    let prospect = null;

    if (!team) break;

    if (Number(team.id) === Number(gameState.selectedTeamId)) {
      prospect = getAutoUserDraftPick();
    } else {
      prospect = chooseCpuDraftProspect(team);
    }

    if (!prospect) break;

    completeDraftPick(team, prospect);
  }

  refreshDraftNightRedesign();
}

function getAutoUserDraftPick() {
  const boardProspects = getAvailableDraftBoardProspects();

  if (boardProspects.length > 0) {
    return boardProspects[0];
  }

  return getAvailableDraftProspectsByScoutingRank()[0] || null;
}

function finishDraftNight() {
  clearDraftNightTimers();

  gameState.draft.draftComplete = true;
gameState.draft.draftStarted = false;
gameState.draft.currentPickIndex = DRAFT_PICKS;

if (typeof markOffseasonHubEventComplete === "function") {
  markOffseasonHubEventComplete("league_draft");
  markOffseasonHubEventComplete("league_draft_round2");
}

  gameState.draft.undraftedProspects = getDraftClass().filter(prospect => !prospect.drafted).map(prospect => prospect.id);

  addInboxMessage(
    "Draft Complete",
    "The draft is complete. Continue to Rookie Signing to sign your drafted prospects or manage roster space.",
    "event",
    false
  );

  displayDraftNightScreen();

  const panel = document.getElementById("draft-night-tool-panel");
  const title = document.getElementById("draft-night-tool-panel-title");

  if (title) title.textContent = "Draft Complete";

  if (panel) {
    panel.innerHTML = `
      <div class="draft-night-finished-card">
        Draft complete. Rookie Signing is next.
        <br><br>
        <button class="primary-action-button" onclick="enterRookieSigning()">Continue to Rookie Signing</button>
      </div>
    `;
  }
  refreshAll();
}

function finishDraftRoundOneNight() {
  clearDraftNightTimers();

  gameState.draft.roundOneComplete = true;
  gameState.draft.roundTwoStarted = false;
  gameState.draft.draftStarted = false;
  gameState.draft.currentPickIndex = 30;

  addInboxMessage(
    "Round 1 Complete",
    `Round 1 of the draft is complete. Round 2 begins on ${formatDate(getDraftRoundTwoDate())}.`,
    "event",
    false
  );

  displayDraftNightScreen();
  refreshAll();
}

function goToRookieSigningPlaceholder() {
  enterRookieSigning();
}

/* 0.7G Rookie Signing */

function ensureRookieSigningState() {
  if (!gameState || !gameState.draft) return;

  if (!Array.isArray(gameState.draft.rookieRights)) {
    gameState.draft.rookieRights = [];
  }

  if (gameState.draft.rookieSigningComplete === undefined) {
    gameState.draft.rookieSigningComplete = false;
  }

  const userId = Number(gameState.selectedTeamId);

  const userDraftPicksFromResults = (gameState.draft.draftedPlayers || [])
    .filter(pick => Number(pick.teamId) === userId);

  const userDraftPicksFromProspects = getDraftClass()
    .filter(prospect => Number(prospect.draftedTeamId) === userId)
    .map(prospect => ({
      prospectId: prospect.id,
      prospectName: prospect.name,
      pick: prospect.draftPick,
      round: Number(prospect.draftPick) <= 30 ? 1 : 2,
      position: prospect.primaryPosition,
      school: prospect.collegeOrClub,
      teamId: prospect.draftedTeamId,
      teamName: prospect.draftedTeamName
    }));

  const combinedPicks = [
    ...userDraftPicksFromResults,
    ...userDraftPicksFromProspects
  ];

  for (let pick of combinedPicks) {
    if (!pick || !pick.prospectId) continue;

    const alreadyExists = gameState.draft.rookieRights.some(right =>
      String(right.prospectId) === String(pick.prospectId)
    );

    if (alreadyExists) continue;

    const prospect = getProspectById(pick.prospectId);
    const contract = getRookieContractForPick(pick.pick);

    gameState.draft.rookieRights.push({
      prospectId: pick.prospectId,
      prospectName: pick.prospectName || (prospect ? prospect.name : "Unknown Rookie"),
      pick: pick.pick,
      round: pick.round || (Number(pick.pick) <= 30 ? 1 : 2),
      position: pick.position || (prospect ? prospect.primaryPosition : "G"),
      school: pick.school || (prospect ? prospect.collegeOrClub : "Unknown"),
      signed: false,
      salary: contract.salary,
      years: contract.years,
      playerId: null,
      currentAbility: prospect ? prospect.actualCurrentAbility : 450,
      potentialAbility: prospect ? prospect.actualPotentialAbility : 550
    });
  }
}

function debugRookieRights() {
  const userId = Number(gameState.selectedTeamId);

  console.log("Selected Team ID:", userId);
  console.log("Draft Complete:", gameState.draft.draftComplete);
  console.log("Drafted Players:", gameState.draft.draftedPlayers);

  console.log("User Draft Picks From draftedPlayers:",
    (gameState.draft.draftedPlayers || []).filter(pick => Number(pick.teamId) === userId)
  );

  console.log("User Draft Picks From prospects:",
    getDraftClass().filter(prospect => Number(prospect.draftedTeamId) === userId)
  );

  ensureRookieSigningState();

  console.log("Rookie Rights:", gameState.draft.rookieRights);
}

function getRookieContractForPick(pickNumber) {
  const pick = Number(pickNumber);

  if (pick <= 5) {
    return { salary: 10, years: 4 };
  }

  if (pick <= 14) {
    return { salary: 7, years: 4 };
  }

  if (pick <= 30) {
    return { salary: 4, years: 4 };
  }

  if (pick <= 45) {
    return { salary: 2, years: 3 };
  }

  return { salary: 1, years: 2 };
}

function displayRookieSigningPage() {
  if (!gameState || !gameState.started || !gameState.draft) return;

  ensureRookieSigningState();

  const roster = gameState.rosters[gameState.selectedTeamId] || [];
  const rights = gameState.draft.rookieRights || [];
  const unsigned = rights.filter(right => !right.signed);
  const signed = rights.filter(right => right.signed);
  const rosterStatus = getTeamRosterStatus(gameState.selectedTeamId);

  setText("rookie-signing-year", gameState.draft.draftYear);
  setText("rookie-signing-roster-space", `${rosterStatus.standardCount} / ${rosterStatus.maxStandard}`);
  setText("rookie-signing-unsigned-count", unsigned.length);
  setText("rookie-signing-signed-count", signed.length);

  displayRookieRightsList();
  displayRookieCurrentRosterList();
}

function displayRookieRightsList() {
  const container = document.getElementById("rookie-rights-list");

  if (!container || !gameState || !gameState.draft) return;

  const rights = gameState.draft.rookieRights || [];

  container.innerHTML = "";

  if (rights.length === 0) {
    container.innerHTML = `
      <div class="rookie-empty-state">
        You do not currently hold draft rights to any rookies.
      </div>
    `;
    return;
  }

  for (let right of rights) {
    container.appendChild(createRookieRightCard(right));
  }
}

function createRookieRightCard(right) {
  const card = document.createElement("div");
  card.className = "rookie-right-card";

  if (right.signed) {
    card.classList.add("signed");
  }

  const rosterStatus = getTeamRosterStatus(gameState.selectedTeamId);
  const rosterFull = rosterStatus.standardCount >= rosterStatus.maxStandard;

  card.innerHTML = `
    <div class="rookie-pick-pill">#${right.pick}</div>

    <div class="rookie-player-info">
      <strong>${right.prospectName}</strong>
      <span>${right.position} · ${right.school} · Round ${right.round}</span>
    </div>

    <div class="rookie-contract-box">
      <strong>$${right.salary}M</strong>
      <span>${right.years} years</span>
    </div>

    <div class="rookie-status-pill ${right.signed ? "signed" : ""}">
      ${right.signed ? "Signed" : "Unsigned"}
    </div>

    <button
      class="rookie-sign-button"
      ${right.signed || rosterFull ? "disabled" : ""}
      onclick="signRookie('${right.prospectId}')"
    >
      ${right.signed ? "Signed" : rosterFull ? "Roster Full" : "Sign"}
    </button>
  `;

  return card;
}

function displayRookieCurrentRosterList() {
  const container = document.getElementById("rookie-current-roster-list");

  if (!container) return;

  const roster = gameState.rosters[gameState.selectedTeamId] || [];

  container.innerHTML = "";

  if (roster.length === 0) {
    container.innerHTML = `
      <div class="rookie-empty-state">
        No players found on your roster.
      </div>
    `;
    return;
  }

  const sortedRoster = roster.slice().sort((a, b) => {
    return Number(b.potentialAbility || b.potential || 0) - Number(a.potentialAbility || a.potential || 0);
  });

  for (let player of sortedRoster) {
    container.appendChild(createRookieRosterRow(player));
  }
}

function createRookieRosterRow(player) {
  const row = document.createElement("div");
  row.className = "rookie-roster-row";

  const salary = player.salary !== undefined ? player.salary : 1;
  const years = player.contractYears !== undefined ? player.contractYears : player.years || 1;
  const potential = player.potentialAbility !== undefined ? player.potentialAbility : player.potential || "-";

  row.innerHTML = `
    <div>
      <strong>${player.name}</strong>
      <span>${player.position} · ${player.age} years old</span>
    </div>

    <div>
      <strong>${potential}</strong>
      <span>Potential</span>
    </div>

    <div>
      <strong>$${salary}M</strong>
      <span>Salary</span>
    </div>

    <div>
      <strong>${years}</strong>
      <span>Years</span>
    </div>

    <button class="rookie-release-button" onclick="releasePlayerForRookieSigning('${player.id || player.name}')">
      Release
    </button>
  `;

  return row;
}

function signRookie(prospectId) {
  if (!gameState || !gameState.draft) return;

  ensureRookieSigningState();

  const rights = gameState.draft.rookieRights || [];
  const right = rights.find(item => String(item.prospectId) === String(prospectId));

  if (!right) {
    addInboxMessageOnce(
      "Rookie Rights Missing",
      "This rookie could not be found in your draft rights.",
      "staff",
      false,
      `missing_rookie_right_${prospectId}`
    );
    return;
  }

  if (right.signed) {
    addInboxMessageOnce(
      "Rookie Already Signed",
      `${right.prospectName} is already signed to your roster.`,
      "staff",
      false,
      `rookie_already_signed_${prospectId}`
    );
    return;
  }

  const roster = gameState.rosters[gameState.selectedTeamId] || [];
  const rosterStatus = getTeamRosterStatus(gameState.selectedTeamId);

  if (rosterStatus.standardCount >= rosterStatus.maxStandard) {
    addInboxMessageOnce(
      "Roster Full",
      `Your roster is full for the current phase. Current standard contracts: ${rosterStatus.standardCount}/${rosterStatus.maxStandard}. Release a player before signing this rookie.`,
      "staff",
      false,
      `rookie_roster_full_${prospectId}`
    );
    return;
  }

  const prospect = getProspectById(prospectId);
  const rookiePlayer = createPlayerFromDraftProspect(right, prospect);

  roster.push(rookiePlayer);
  gameState.rosters[gameState.selectedTeamId] = roster;

  right.signed = true;
  right.playerId = rookiePlayer.id;

  addInboxMessage(
    "Rookie Signed",
    `${right.prospectName} has signed a ${right.years}-year, $${right.salary}M rookie contract.`,
    "staff",
    false
  );

  refreshAll();
}

function createPlayerFromDraftProspect(right, prospect) {
  const currentAbility = Number(right.currentAbility || (prospect ? prospect.actualCurrentAbility : 450));
  const potentialAbility = Number(right.potentialAbility || (prospect ? prospect.actualPotentialAbility : 550));

  const selectedTeam = getSelectedTeam();

  const attributes = prospect && prospect.attributes
    ? { ...prospect.attributes }
    : generateAttributesForPlayer(right.position || "SG", "Rookie", currentAbility);

  const potentialAttributes = prospect && prospect.potentialAttributes
    ? { ...prospect.potentialAttributes }
    : generatePotentialAttributes(attributes, potentialAbility);

  const primaryPosition = right.position || (prospect ? prospect.primaryPosition : "SG");

  const rookiePlayer = {
    id: nextPlayerId++,
    name: right.prospectName,
    age: prospect ? prospect.age : 20,

    position: primaryPosition,
    primaryPosition,
    secondaryPositions: prospect && Array.isArray(prospect.secondaryPositions)
      ? [...prospect.secondaryPositions]
      : generateSecondaryPositions(primaryPosition),

    height: prospect ? prospect.height : generateHeight(primaryPosition),
    weight: prospect ? prospect.weight : generateWeight(primaryPosition),

    archetype: prospect ? prospect.archetype : "Rookie",
    playerType: prospect ? convertProspectArchetypeToPlayerType(prospect.archetype, primaryPosition, currentAbility) : "Rookie",

    currentAbility,
    potentialAbility,
    attributes,
    potentialAttributes,

    overall: currentAbility,
    potential: potentialAbility,

    mediaDescription: getMediaDescription(currentAbility),
    projectedCeiling: getProjectedCeilingLabel(potentialAbility),

    salary: right.salary,
    contractYears: right.years,
    years: right.years,
    contract: `${right.years} yrs / ${formatMoney(right.salary)}`,
    contractType: "Standard",
    rosterContractType: "Standard",

    teamId: selectedTeam ? selectedTeam.id : gameState.selectedTeamId,
    teamName: selectedTeam ? selectedTeam.name : "Your Team",

    morale: "Happy",
    development: "Rookie",

    rookie: true,
    draftPick: right.pick,
    draftYear: gameState.draft.draftYear,
    collegeOrClub: right.school,

    seasonStats: createEmptySeasonStats(),
    stats: createEmptySeasonStats()
  };

  normalizePlayerContract(rookiePlayer);

  return rookiePlayer;
}

function releasePlayerForRookieSigning(playerKey) {
  if (!gameState || !gameState.rosters) return;

  const roster = gameState.rosters[gameState.selectedTeamId] || [];
  const player = roster.find(item =>
    String(item.id) === String(playerKey) ||
    String(item.name) === String(playerKey)
  );

  if (!player) {
    addInboxMessageOnce(
      "Release Failed",
      "That player could not be found on your roster.",
      "staff",
      false,
      `rookie_release_failed_${playerKey}`
    );
    return;
  }

  const confirmed = confirm(`Release ${player.name} to create roster space?`);

  if (!confirmed) return;

  gameState.rosters[gameState.selectedTeamId] = roster.filter(item =>
    String(item.id) !== String(player.id) &&
    String(item.name) !== String(player.name)
  );

  if (!Array.isArray(gameState.freeAgents)) {
    gameState.freeAgents = [];
  }

  player.teamId = null;
  player.released = true;
  gameState.freeAgents.push(player);

  addInboxMessage(
    "Player Released",
    `${player.name} was released and moved to free agency.`,
    "staff",
    false
  );

  refreshAll();
}

function finishRookieSigning() {
  if (!gameState || !gameState.draft) return;

  ensureRookieSigningState();

  const unsigned = (gameState.draft.rookieRights || []).filter(right => !right.signed);

  if (unsigned.length > 0) {
    const confirmed = confirm(
      `You still have ${unsigned.length} unsigned drafted rookie(s). Finish anyway? They will stay as draft rights for now.`
    );

    if (!confirmed) return;
  }

  gameState.draft.rookieSigningComplete = true;

  addInboxMessage(
    "Rookie Signing Complete",
    "Rookie signing is complete. Your offseason can continue.",
    "event",
    false
  );

  currentMainSection = "dashboard";
  currentSecondaryScreen = "dashboard-screen";
  initializeNavigation();
  showSecondaryScreen("dashboard-screen");
  refreshAll();
}

function enterRookieSigning() {
  if (!gameState || !gameState.draft || !gameState.draft.draftComplete) {
    addInboxMessageOnce(
      "Rookie Signing Locked",
      "Rookie signing opens after the draft is complete.",
      "staff",
      false,
      "rookie_signing_locked"
    );
    return;
  }

  ensureRookieSigningState();

  currentMainSection = "draft";
  currentSecondaryScreen = "rookie-signing-screen";
  initializeNavigation();
  showSecondaryScreen("rookie-signing-screen");
  refreshAll();
}

/* =========================
   0.7F DRAFT NIGHT REDESIGN
   ========================= */

let draftNightUiState = {
  activeTab: "prospects"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDraftShortPlayerName(name) {
  if (!name) return "---";
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

function getDraftCurrentPickNumber() {
  if (!gameState || !gameState.draft) return 1;
  return Math.min(DRAFT_PICKS, Number(gameState.draft.currentPickIndex || 0) + 1);
}

function getDraftRoundFromPickNumber(pickNumber) {
  return Number(pickNumber) <= 30 ? 1 : 2;
}

function getTeamByIdSafe(teamId) {
  if (!gameState || !Array.isArray(gameState.teams)) return null;
  return gameState.teams.find(team => Number(team.id) === Number(teamId)) || null;
}

function getCurrentDraftTeam() {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.draftOrder)) return null;

  if (typeof ensureDraftNightDraftOrder === "function") {
    ensureDraftNightDraftOrder();
  }

  const pickIndex = Number(gameState.draft.currentPickIndex || 0);

  if (pickIndex < 0 || pickIndex >= DRAFT_PICKS) return null;

  const teamSlot = gameState.draft.draftOrder[pickIndex];

  if (!teamSlot) return null;

  if (typeof teamSlot === "object") {
    return teamSlot;
  }

  if (typeof getTeamById === "function") {
    const team = getTeamById(teamSlot);
    if (team) return team;
  }

  if (typeof getBaseTeamById === "function") {
    const team = getBaseTeamById(teamSlot);
    if (team) return team;
  }

  return getTeamByIdSafe(teamSlot);
}

function getDraftTeamFromDraftOrderSlot(pickNumber) {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.draftOrder)) return null;

  const teamSlot = gameState.draft.draftOrder[Number(pickNumber) - 1];

  if (!teamSlot) return null;

  if (typeof teamSlot === "object") {
    return teamSlot;
  }

  if (typeof getTeamById === "function") {
    const team = getTeamById(teamSlot);
    if (team) return team;
  }

  if (typeof getBaseTeamById === "function") {
    const team = getBaseTeamById(teamSlot);
    if (team) return team;
  }

  return getTeamByIdSafe(teamSlot);
}

function normalizeDraftedPickRecord(raw, explicitPickNumber = null) {
  if (!raw) return null;

  const prospectId = raw.prospectId || raw.id || null;
  const prospect = prospectId ? getProspectById(prospectId) : null;

  const pick = Number(
    raw.draftPick ||
    raw.pick ||
    raw.pickNumber ||
    prospect?.draftPick ||
    explicitPickNumber ||
    0
  );

  const teamId =
    raw.draftedTeamId ??
    raw.teamId ??
    prospect?.draftedTeamId ??
    null;

  const teamName =
    raw.draftedTeamName ||
    raw.teamName ||
    prospect?.draftedTeamName ||
    "";

  let team = getTeamByIdSafe(teamId);

  if (!team && gameState && Array.isArray(gameState.teams) && teamName) {
    team = gameState.teams.find(t =>
      String(t.name || "").toLowerCase() === String(teamName).toLowerCase()
    ) || null;
  }

  const stats = prospect?.stats || raw.stats || {};

  return {
    pick,
    round: getDraftRoundFromPickNumber(pick),

    prospectId,
    fullName:
      prospect?.name ||
      raw.name ||
      raw.prospectName ||
      raw.playerName ||
      "Unknown Prospect",

    shortName: getDraftShortPlayerName(
      prospect?.name ||
      raw.name ||
      raw.prospectName ||
      raw.playerName ||
      "---"
    ),

    team,
    teamId: team ? team.id : teamId,
    teamName: team ? team.name : teamName,

    primaryPosition:
      prospect?.primaryPosition ||
      raw.primaryPosition ||
      raw.position ||
      "-",

    age: prospect?.age ?? raw.age ?? "-",

    height:
      prospect?.height ||
      raw.height ||
      "-",

    weight:
      prospect?.weight ||
      raw.weight ||
      "-",

    country:
      prospect?.country ||
      raw.country ||
      "-",

    collegeOrClub:
      prospect?.collegeOrClub ||
      raw.collegeOrClub ||
      raw.college ||
      raw.school ||
      raw.club ||
      "-",

    archetype:
      prospect?.archetype ||
      raw.archetype ||
      "-",

    stats,

    mockRank:
      prospect?.mockRank ??
      raw.mockRank ??
      "-",

    projectedRange:
      prospect?.projectedRange ||
      raw.projectedRange ||
      "-",

    risk:
      prospect?.risk ||
      raw.risk ||
      "-",

    leagueReadiness:
      getProspectLeagueReadiness(prospect) ||
      getProspectLeagueReadiness(raw) ||
      "-",

    upside:
      prospect?.upside ||
      raw.upside ||
      "-",

    image:
      prospect?.image ||
      prospect?.imagePath ||
      prospect?.photo ||
      prospect?.portrait ||
      raw.image ||
      raw.imagePath ||
      raw.photo ||
      raw.portrait ||
      ""
  };
}

function getDraftPickRecordByNumber(pickNumber) {
  if (!gameState || !gameState.draft) return null;

  const draftedPlayers = Array.isArray(gameState.draft.draftedPlayers)
    ? gameState.draft.draftedPlayers
    : [];

  const fromDraftedPlayers = draftedPlayers.find(item =>
    Number(item.draftPick || item.pick || item.pickNumber) === Number(pickNumber)
  );

  if (fromDraftedPlayers) {
    return normalizeDraftedPickRecord(fromDraftedPlayers, pickNumber);
  }

  const prospects = Array.isArray(gameState.draft.prospects)
    ? gameState.draft.prospects
    : [];

  const fromProspects = prospects.find(prospect =>
    Number(prospect.draftPick) === Number(pickNumber)
  );

  if (fromProspects) {
    return normalizeDraftedPickRecord(fromProspects, pickNumber);
  }

  return null;
}

function getLatestDraftedPickRecord() {
  if (!gameState || !gameState.draft) return null;

  const draftedPlayers = Array.isArray(gameState.draft.draftedPlayers)
    ? gameState.draft.draftedPlayers.slice()
    : [];

  if (draftedPlayers.length > 0) {
    draftedPlayers.sort((a, b) =>
      Number(a.draftPick || a.pick || a.pickNumber || 0) -
      Number(b.draftPick || b.pick || b.pickNumber || 0)
    );
    return normalizeDraftedPickRecord(draftedPlayers[draftedPlayers.length - 1]);
  }

  const prospects = Array.isArray(gameState.draft.prospects)
    ? gameState.draft.prospects
        .filter(p => p.drafted && Number(p.draftPick || 0) > 0)
        .sort((a, b) => Number(a.draftPick || 0) - Number(b.draftPick || 0))
    : [];

  if (prospects.length > 0) {
    return normalizeDraftedPickRecord(prospects[prospects.length - 1]);
  }

  return null;
}

function getDraftNightUserTeam() {
  if (!gameState) return null;

  const possibleIds = [
    gameState.selectedTeamId,
    gameState.userTeamId,
    gameState.myTeamId,
    gameState.currentTeamId,
    gameState.controlledTeamId,
    gameState.userTeam && gameState.userTeam.id
  ].filter(id => id !== undefined && id !== null);

  for (const id of possibleIds) {
    if (typeof getTeamById === "function") {
      const team = getTeamById(id);
      if (team) return team;
    }

    if (typeof getBaseTeamById === "function") {
      const team = getBaseTeamById(id);
      if (team) return team;
    }

    const safeTeam = getTeamByIdSafe(id);
    if (safeTeam) return safeTeam;
  }

  return null;
}

function getUserDraftPicksTonight() {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.draftOrder)) return [];

  const userTeam = getDraftNightUserTeam();
  if (!userTeam) return [];

  return gameState.draft.draftOrder
    .map((teamSlot, index) => ({
      team: getDraftTeamFromDraftOrderSlot(index + 1),
      pick: index + 1
    }))
    .filter(item => item.team && Number(item.team.id) === Number(userTeam.id))
    .map(item => item.pick);
}

function getDraftNightTeamLogoHtml(team) {
  if (!team) {
    return `<div class="draft-night-logo-fallback">--</div>`;
  }

  if (typeof getTeamLogoHtml === "function") {
    try {
      const html = getTeamLogoHtml(team);
      if (html) {
        return `<div class="draft-night-logo-slot">${html}</div>`;
      }
    } catch (error) {}
  }

  if (typeof getTeamLogo === "function") {
    try {
      const html = getTeamLogo(team);
      if (html) {
        return `<div class="draft-night-logo-slot">${html}</div>`;
      }
    } catch (error) {}
  }

  if (team.logo) {
    return `
      <div class="draft-night-logo-slot">
        <img class="draft-night-logo-small" src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name || team.abbrev || "Team Logo")}">
      </div>
    `;
  }

  return `<div class="draft-night-logo-fallback">${escapeHtml(team.abbrev || team.shortName || "TM")}</div>`;
}

function getDraftNightProspectPortraitHtml(record) {
  if (record && record.image) {
    const imagePath = typeof normalizePlayerPortraitPath === "function"
      ? normalizePlayerPortraitPath(record.image)
      : record.image;

    return `
      <img
        class="draft-night-featured-portrait"
        src="${escapeHtml(imagePath)}"
        alt="${escapeHtml(record.fullName)}"
      >
    `;
  }

  return `
    <div class="draft-night-featured-silhouette">
      <div class="draft-night-featured-silhouette-head"></div>
      <div class="draft-night-featured-silhouette-body"></div>
    </div>
  `;
}

function formatDraftNightStat(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "-";
  return `${value}${suffix}`;
}

function getDraftClockText() {
  const seconds = Math.max(0, Number(draftNightState?.timerSeconds ?? 60));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getRemainingDraftNightProspects() {
  if (!gameState || !gameState.draft || !Array.isArray(gameState.draft.prospects)) return [];

  return gameState.draft.prospects
    .filter(prospect => !prospect.drafted)
    .sort((a, b) => {
      const aRank = Number(a.mockRank || 999);
      const bRank = Number(b.mockRank || 999);
      if (aRank !== bRank) return aRank - bRank;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
}

function handleDraftNightProspectSelect(prospectId) {
  if (typeof selectDraftProspect === "function") {
    selectDraftProspect(prospectId);
    return;
  }

  alert("Draft selection function not found. selectDraftProspect(prospectId) is missing.");
}

function setDraftNightToolTab(tab) {
  draftNightUiState.activeTab = tab;
  refreshDraftNightRedesign();
}

function createDraftNightBoardRowHtml(pickNumber) {
  const draft = gameState?.draft;
  const currentPickNumber = getDraftCurrentPickNumber();
  const pickRecord = getDraftPickRecordByNumber(pickNumber);
  const team = getDraftTeamFromDraftOrderSlot(pickNumber);

  const isCurrent =
    Number(currentPickNumber) === Number(pickNumber) &&
    !pickRecord &&
    !draft?.draftComplete;

  const nameText = pickRecord
    ? pickRecord.shortName
    : isCurrent
      ? "ON CLOCK"
      : "---";

  return `
    <div class="draft-night-board-row ${isCurrent ? "current" : ""} ${pickRecord ? "completed" : "future"}">
      <div class="draft-night-board-pick-number">${pickNumber}</div>
      <div class="draft-night-board-pick-logo">
        ${getDraftNightTeamLogoHtml(team)}
      </div>
      <div class="draft-night-board-pick-name">${escapeHtml(nameText)}</div>
    </div>
  `;
}

function createDraftNightActiveRoundBoardHtml() {
  const activeRound = getActiveDraftNightRound();
  const startPick = activeRound === 1 ? 1 : 31;
  const endPick = activeRound === 1 ? 30 : 60;
  const midpoint = activeRound === 1 ? 15 : 45;

  let leftColumn = "";
  let rightColumn = "";

  for (let pick = startPick; pick <= midpoint; pick++) {
    leftColumn += createDraftNightBoardRowHtml(pick);
  }

  for (let pick = midpoint + 1; pick <= endPick; pick++) {
    rightColumn += createDraftNightBoardRowHtml(pick);
  }

  return `
    <div class="draft-night-round-one-board">
      <div class="draft-night-section-header">
        <h2>Round ${activeRound}</h2>
        <span>${startPick} - ${endPick}</span>
      </div>

      <div class="draft-night-board-columns">
        <div class="draft-night-board-column">
          ${leftColumn}
        </div>
        <div class="draft-night-board-column">
          ${rightColumn}
        </div>
      </div>
    </div>
  `;
}

function createDraftNightWelcomePanelHtml() {
  const currentTeam = getCurrentDraftTeam();
  const userPicks = getUserDraftPicksTonight();
  const bestAvailable = getRemainingDraftNightProspects()[0] || null;
  const classStrength = gameState?.draft?.classStrength || "-";

  return `
    <div class="draft-night-featured-panel">
      <div class="draft-night-section-header yellow">
        <h2>Latest Selection</h2>
      </div>

      <div class="draft-night-welcome-card">
        <h3>WELCOME TO THE ${escapeHtml(gameState?.draft?.draftYear || "")} LEAGUE DRAFT</h3>
        <p>Round ${getActiveDraftNightRound()} is ready to begin.</p>

        <div class="draft-night-welcome-grid">
          <div class="draft-night-mini-info-box">
            <span>Class Strength</span>
            <strong>${escapeHtml(classStrength)}</strong>
          </div>
          <div class="draft-night-mini-info-box">
            <span>On The Clock</span>
            <strong>${escapeHtml(currentTeam?.name || "TBD")}</strong>
          </div>
          <div class="draft-night-mini-info-box">
            <span>Your Picks Tonight</span>
            <strong>${userPicks.length > 0 ? userPicks.join(", ") : "None"}</strong>
          </div>
          <div class="draft-night-mini-info-box">
            <span>Best Available</span>
            <strong>${escapeHtml(bestAvailable ? bestAvailable.name : "TBD")}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createDraftNightLatestSelectionHtml() {
  const latest = getLatestDraftedPickRecord();

  if (!latest) {
    return createDraftNightWelcomePanelHtml();
  }

  const teamName = latest.team?.name || latest.teamName || "Unknown Team";

  return `
    <div class="draft-night-featured-panel">
      <div class="draft-night-section-header yellow">
        <h2>Latest Selection</h2>
      </div>

      <div class="draft-night-featured-top">
        <div class="draft-night-featured-player-visual">
          ${getDraftNightProspectPortraitHtml(latest)}
        </div>

        <div class="draft-night-featured-main-info">
          <div class="draft-night-featured-main-name">${escapeHtml(latest.fullName)}</div>
          <div class="draft-night-featured-main-team">
            Selected by <span>${escapeHtml(teamName)}</span>
          </div>
          <div class="draft-night-featured-main-pick">
            Round ${latest.round} • Pick ${latest.pick}
          </div>
        </div>

        <div class="draft-night-featured-team-logo">
          ${getDraftNightTeamLogoHtml(latest.team)}
        </div>
      </div>

      <div class="draft-night-featured-detail-grid">
        <div class="draft-night-featured-detail-card">
          <div class="draft-night-featured-detail-row"><span>Position</span><strong>${escapeHtml(latest.primaryPosition)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>Age</span><strong>${escapeHtml(latest.age)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>College / Club</span><strong>${escapeHtml(latest.collegeOrClub)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>Country</span><strong>${escapeHtml(latest.country)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>Height</span><strong>${escapeHtml(latest.height)}</strong></div>
          <div class="draft-night-featured-detail-row">
            <span>Weight</span>
            <strong>${latest.weight && latest.weight !== "-" ? `${escapeHtml(latest.weight)} lbs` : "-"}</strong>
          </div>
          <div class="draft-night-featured-detail-row"><span>Archetype</span><strong>${escapeHtml(latest.archetype)}</strong></div>
        </div>

        <div class="draft-night-featured-detail-card">
          <div class="draft-night-featured-detail-row"><span>PPG</span><strong>${formatDraftNightStat(latest.stats.points)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>RPG</span><strong>${formatDraftNightStat(latest.stats.rebounds)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>APG</span><strong>${formatDraftNightStat(latest.stats.assists)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>SPG</span><strong>${formatDraftNightStat(latest.stats.steals)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>BPG</span><strong>${formatDraftNightStat(latest.stats.blocks)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>3PT%</span><strong>${formatDraftNightStat(latest.stats.threePointPercent, "%")}</strong></div>
        </div>

        <div class="draft-night-featured-detail-card">
          <div class="draft-night-featured-detail-row"><span>Mock Rank</span><strong>${escapeHtml(latest.mockRank)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>Projected Range</span><strong>${escapeHtml(latest.projectedRange)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>Risk</span><strong>${escapeHtml(latest.risk)}</strong></div>
          <div class="draft-night-featured-detail-row"><span>League Readiness</span><strong>${escapeHtml(getProspectLeagueReadiness(latest))}</strong></div>
          <div class="draft-night-featured-detail-row"><span>Upside</span><strong>${escapeHtml(latest.upside)}</strong></div>
        </div>
      </div>
    </div>
  `;
}

function createDraftNightOnClockCardHtml() {
  const team = getCurrentDraftTeam();

  return `
    <div class="draft-night-on-clock-card minimal">
      <div class="draft-night-section-header blue">
        <h2>On The Clock</h2>
      </div>

      <div class="draft-night-on-clock-minimal-grid">
        <div class="draft-night-on-clock-minimal-team">
          <span>Now Selecting</span>
          <strong>${escapeHtml(team?.name || "TBD")}</strong>
          <small>${escapeHtml(team?.abbrev || "")}</small>
        </div>

        <div class="draft-night-on-clock-minimal-box">
          <span>Pick</span>
          <strong>${getDraftCurrentPickNumber()}</strong>
        </div>

        <div class="draft-night-on-clock-minimal-box">
          <span>Time</span>
          <strong id="draft-night-timer">${getDraftClockText()}</strong>
        </div>
      </div>
    </div>
  `;
}

function createDraftNightControlsHtml() {
  const activeRound = getActiveDraftNightRound();
  const endLabel = activeRound === 1 ? "Sim To End of Round 1" : "Sim To End of Draft";

  return `
    <div class="draft-night-controls-card compact">
      <div class="draft-night-section-header blue">
        <h2>Draft Controls</h2>
      </div>

      <div class="draft-night-controls-grid compact">
        <button class="draft-night-control-button compact" onclick="simDraftNextPick()">
          <strong>Sim Next Pick</strong>
        </button>

        <button class="draft-night-control-button compact" onclick="simDraftToUserPick()">
          <strong>Sim To User Pick</strong>
        </button>

        <button class="draft-night-control-button compact" onclick="simDraftToEnd()">
          <strong>${endLabel}</strong>
        </button>
      </div>
    </div>
  `;
}

function createDraftNightToolTabsHtml() {
  const active = draftNightUiState.activeTab;

  return `
    <div class="draft-night-tools-card">
      <div class="draft-night-section-header blue">
        <h2>Draft Tools</h2>
      </div>

      <div class="draft-night-tool-tab-row">
        <button class="draft-night-tool-tab ${active === "prospects" ? "active" : ""}" onclick="setDraftNightToolTab('prospects')">Prospects</button>
        <button class="draft-night-tool-tab ${active === "board" ? "active" : ""}" onclick="setDraftNightToolTab('board')">My Board</button>
        <button class="draft-night-tool-tab ${active === "scouting" ? "active" : ""}" onclick="setDraftNightToolTab('scouting')">Scouting</button>
        <button class="draft-night-tool-tab ${active === "mock" ? "active" : ""}" onclick="setDraftNightToolTab('mock')">Mock Draft</button>
      </div>

      <div class="draft-night-tool-panel">
        ${createDraftNightActiveToolPanelHtml()}
      </div>
    </div>
  `;
}

function createDraftNightActiveToolPanelHtml() {
  const active = draftNightUiState.activeTab;

  if (active === "board") {
    const boardProspects = typeof getDraftBoardProspects === "function"
      ? getDraftBoardProspects()
      : [];

    if (!boardProspects || boardProspects.length === 0) {
      return `<div class="draft-night-empty-panel">No prospects on your board yet.</div>`;
    }

    return boardProspects
      .filter(p => !p.drafted)
      .slice(0, 12)
      .map(prospect => createDraftNightProspectListRowHtml(prospect))
      .join("");
  }

  if (active === "scouting") {
    const reports = gameState?.draft?.scoutingReports || [];
    const activeReportsHtml = reports.length === 0
      ? `<div class="draft-night-inline-note">No active scouting reports.</div>`
      : reports.map(report => `
          <div class="draft-night-inline-card">
            <strong>${escapeHtml(report.prospectName || "Prospect")}</strong>
            <span>Ready in ${Math.max(0, getDaysUntilDate(report.completeDate))} day(s)</span>
          </div>
        `).join("");

    return `
      <div class="draft-night-scouting-stack">
        <div class="draft-night-subheader">Active Reports</div>
        ${activeReportsHtml}
      </div>
    `;
  }

  if (active === "mock") {
    const mockDraft = gameState?.draft?.currentMockDraft || [];
    if (mockDraft.length === 0) {
      return `<div class="draft-night-empty-panel">No mock draft available.</div>`;
    }

    return mockDraft
      .slice(0, 12)
      .map(item => `
        <div class="draft-night-mock-row">
          <div class="draft-night-mock-pick">${item.pick}</div>
          <div class="draft-night-mock-team">${escapeHtml(item.teamAbbrev || item.teamName || "")}</div>
          <div class="draft-night-mock-player">${escapeHtml(getDraftShortPlayerName(item.prospectName || "---"))}</div>
        </div>
      `)
      .join("");
  }

  const prospects = getRemainingDraftNightProspects();

  if (!prospects || prospects.length === 0) {
    return `<div class="draft-night-empty-panel">No prospects remaining.</div>`;
  }

  return prospects
    .slice(0, 12)
    .map(prospect => createDraftNightProspectListRowHtml(prospect))
    .join("");
}

function createDraftNightProspectListRowHtml(prospect) {
  const isUserPick = !!(typeof isUserOnClock === "function" ? isUserOnClock() : false);

  return `
    <div class="draft-night-prospect-list-row">
      <div class="draft-night-prospect-list-rank">${escapeHtml(prospect.mockRank || "-")}</div>

      <div class="draft-night-prospect-list-main">
        <strong onclick="openProspectProfile('${escapeHtml(prospect.id)}')">${escapeHtml(prospect.name)}</strong>
        <span>${escapeHtml(prospect.archetype || "-")} · ${escapeHtml(prospect.collegeOrClub || "-")}</span>
      </div>

      <div class="draft-night-prospect-list-small">${escapeHtml(prospect.primaryPosition || "-")}</div>
      <div class="draft-night-prospect-list-small">${escapeHtml(prospect.height || "-")}</div>
      <div class="draft-night-prospect-list-small">${escapeHtml(prospect.projectedRange || "-")}</div>

      <div class="draft-night-prospect-list-actions">
        <button class="draft-night-mini-button" onclick="openProspectProfile('${escapeHtml(prospect.id)}')">View</button>
        <button
          class="draft-night-mini-button primary"
          ${isUserPick ? "" : "disabled"}
          onclick="handleDraftNightProspectSelect('${escapeHtml(prospect.id)}')"
        >
          Select
        </button>
      </div>
    </div>
  `;
}

function getDraftNightRedesignHtml() {
  const draftYear = gameState?.draft?.draftYear || "";
  const currentDateText =
    typeof formatLongDate === "function"
      ? formatLongDate(gameState?.currentDate)
      : (typeof formatShortDate === "function"
          ? formatShortDate(gameState?.currentDate)
          : "");

  return `
    <div id="draft-night-redesign-shell" class="draft-night-screen redesign">
      <div class="draft-night-event redesign">
        <div class="draft-night-top-banner">
          <div class="draft-night-top-brand">FULL COURT DIRECTOR</div>

          <div class="draft-night-top-title-wrap">
            <div class="draft-night-top-title">
              <span>${escapeHtml(draftYear)}</span>
              <strong>DRAFT</strong>
            </div>
          </div>

          <div class="draft-night-top-date">
            <span>Draft Night</span>
            <strong>${escapeHtml(currentDateText)}</strong>
          </div>
        </div>

        <div class="draft-night-redesign-layout">
          <div class="draft-night-redesign-left">
            ${createDraftNightActiveRoundBoardHtml()}
          </div>

          <div class="draft-night-redesign-right">
            ${createDraftNightLatestSelectionHtml()}
            ${createDraftNightCompleteActionHtml()}
            ${createDraftNightOnClockCardHtml()}
            ${createDraftNightControlsHtml()}
          </div>
        </div>

        <div class="draft-night-redesign-tools-full">
          ${createDraftNightToolTabsHtml()}
        </div>
      </div>
    </div>
  `;
}

function refreshDraftNightRedesign() {
  const shell = document.getElementById("draft-night-redesign-shell");
  if (!shell) return;
  shell.outerHTML = getDraftNightRedesignHtml();
}

function createDraftNightCompleteActionHtml() {
  if (!gameState || !gameState.draft) return "";

  if (gameState.draft.draftComplete) {
    return `
      <div class="draft-night-complete-action-card">
        <div>
          <span>Draft Complete</span>
          <strong>Rookie Signing is next</strong>
        </div>

        <button class="draft-night-continue-rookie-button" onclick="enterRookieSigning()">
          Continue to Rookie Signing
        </button>
      </div>
    `;
  }

  if (gameState.draft.roundOneComplete && !gameState.draft.draftComplete) {
    return `
      <div class="draft-night-complete-action-card round-one-complete">
        <div>
          <span>Round 1 Complete</span>
          <strong>Round 2 begins ${formatDate(getDraftRoundTwoDate())}</strong>
        </div>
      </div>
    `;
  }

  return "";
}

/* ======================================================
   DRAFT SCREEN REDESIGN — SCOUTING / BOARD / MOCK / LOTTERY RULES
   Task 7
====================================================== */

function escapeDraftRedesignHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeDraftRedesignAttr(value) {
  return escapeDraftRedesignHtml(value).replaceAll("`", "&#096;");
}

function getDraftRedesignTeamLogo(team) {
  if (!team) return "";

  return (
    team.logo ||
    team.logoPath ||
    team.image ||
    team.imagePath ||
    team.teamLogo ||
    ""
  );
}

function getDraftRedesignTeamAbbrev(team) {
  if (!team) return "TM";

  return team.abbrev || team.shortName || String(team.name || "TM").slice(0, 3).toUpperCase();
}

function getDraftRedesignProspectPosition(prospect) {
  if (!prospect) return "-";

  const secondary = Array.isArray(prospect.secondaryPositions) && prospect.secondaryPositions.length
    ? `/${prospect.secondaryPositions[0]}`
    : "";

  return `${prospect.primaryPosition || "-"}${secondary}`;
}

function ensureDraftScoutingRedesignShell() {
  const screen = document.getElementById("scouting-screen");

  if (!screen) return;

  if (screen.dataset.redesigned === "true") return;

  screen.dataset.redesigned = "true";

  screen.innerHTML = `
    <div class="draft-redesign-scouting-page">
      <div class="draft-redesign-status-row">
        <div class="draft-redesign-status-card">
          <span>Draft Class</span>
          <strong id="draft-class-year">2027</strong>
        </div>

        <div class="draft-redesign-status-card">
          <span>Class Strength</span>
          <strong id="draft-class-strength">Average Class</strong>
        </div>

        <div class="draft-redesign-status-card">
          <span>Scouts Left</span>
          <strong id="draft-scouts-left">10 / 10</strong>
        </div>

        <div class="draft-redesign-status-card">
          <span>Active Reports</span>
          <strong id="draft-active-reports-count">0</strong>
        </div>

        <div class="draft-redesign-status-card">
          <span>Next Reset</span>
          <strong id="draft-next-scout-reset">Oct 1</strong>
        </div>
      </div>

      <div class="draft-redesign-filter-card">
        <div class="draft-control-group">
          <label for="draft-search-input">Search</label>
          <input id="draft-search-input" type="text" placeholder="Search prospects..." oninput="updateDraftScoutingFilters()" />
        </div>

        <div class="draft-control-group">
          <label for="draft-position-filter">Position</label>
          <select id="draft-position-filter" onchange="updateDraftScoutingFilters()">
            <option value="All">All Positions</option>
            <option value="PG">PG</option>
            <option value="SG">SG</option>
            <option value="SF">SF</option>
            <option value="PF">PF</option>
            <option value="C">C</option>
          </select>
        </div>

        <div class="draft-control-group">
          <label for="draft-range-filter">Projected Range</label>
          <select id="draft-range-filter" onchange="updateDraftScoutingFilters()">
            <option value="All">All Ranges</option>
            <option value="Top 3">Top 3</option>
            <option value="Top 5">Top 5</option>
            <option value="Top 10">Top 10</option>
            <option value="Lottery">Lottery</option>
            <option value="1st Round">1st Round</option>
            <option value="Early 2nd">Early 2nd</option>
            <option value="2nd Round">2nd Round</option>
            <option value="Undrafted">Undrafted</option>
          </select>
        </div>

        <div class="draft-control-group">
          <label for="draft-scouting-filter">Scouting Level</label>
          <select id="draft-scouting-filter" onchange="updateDraftScoutingFilters()">
            <option value="All">All Levels</option>
            <option value="0">Unscouted</option>
            <option value="1">Basic Report</option>
            <option value="2">Detailed Report</option>
            <option value="3">Advanced Report</option>
            <option value="4">Full Report</option>
          </select>
        </div>

        <div class="draft-redesign-filter-count">
          <span id="draft-visible-count">70 prospects</span>
        </div>
      </div>

      <div class="draft-redesign-table-card">
        <h2>Scouting Database</h2>
        <p>All prospects in the current draft class. Click a prospect name to view their profile.</p>

        <div class="draft-table-wrap">
          <table class="draft-prospect-table draft-redesign-prospect-table">
            <thead>
              <tr>
                <th onclick="sortDraftScoutingTable('mockRank')">Rank</th>
                <th onclick="sortDraftScoutingTable('name')">Prospect</th>
                <th onclick="sortDraftScoutingTable('primaryPosition')">Pos</th>
                <th onclick="sortDraftScoutingTable('age')">Age</th>
                <th onclick="sortDraftScoutingTable('height')">Height</th>
                <th onclick="sortDraftScoutingTable('collegeOrClub')">School/Club</th>
                <th onclick="sortDraftScoutingTable('projectedRange')">Range</th>
                <th onclick="sortDraftScoutingTable('stats')">Stats</th>
                <th onclick="sortDraftScoutingTable('scoutingLevel')">Scouted</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody id="draft-scouting-table-body"></tbody>
          </table>
        </div>
      </div>

      <div class="draft-redesign-reports-card">
        <h2>Active Scouting Reports</h2>
        <div id="active-scouting-reports-list" class="active-scouting-reports-list">
          <p>No active scouting reports.</p>
        </div>
      </div>
    </div>
  `;
}

function displayDraftScoutingPage() {
  if (!gameState || !gameState.started) return;

  ensureDraftState();
  ensureDraftScoutingRedesignShell();

  displayDraftStatusCards();
  displayDraftScoutingTable();
  displayActiveScoutingReports();
}

function createDraftProspectRow(prospect) {
  const row = document.createElement("tr");

  const onBoard = isProspectOnDraftBoard(prospect.id);
  const canScout = canScoutProspect(prospect);
  const scoutLabel = Number(prospect.scoutingLevel || 0) >= MAX_SCOUTING_LEVEL
    ? "Full Report"
    : gameState.draft.scoutingReports.some(report => report.prospectId === prospect.id)
    ? "Scouting"
    : "Scout";

  row.innerHTML = `
    <td>
      <span class="draft-rank-pill">${prospect.mockRank || "-"}</span>
    </td>

    <td>
      <button
        type="button"
        class="draft-prospect-name-button"
        onclick="openProspectProfile('${escapeDraftRedesignAttr(prospect.id)}')"
      >
        <strong>${escapeDraftRedesignHtml(prospect.name)}</strong>
        <span>${escapeDraftRedesignHtml(prospect.archetype || "")}</span>
      </button>
    </td>

    <td>${escapeDraftRedesignHtml(getDraftRedesignProspectPosition(prospect))}</td>
    <td>${escapeDraftRedesignHtml(prospect.age)}</td>
    <td>${escapeDraftRedesignHtml(prospect.height)}</td>
    <td>${escapeDraftRedesignHtml(prospect.collegeOrClub)}</td>

    <td>
      <span class="draft-range-pill">${escapeDraftRedesignHtml(prospect.projectedRange || "Unranked")}</span>
    </td>

    <td>${escapeDraftRedesignHtml(formatProspectStats(prospect))}</td>

    <td>
      <div class="draft-scouting-cell">
        <strong>${escapeDraftRedesignHtml(getScoutingStatusLabel(prospect))}</strong>
        <span>${getScoutingProgressText(prospect)}</span>
        ${getProspectScoutingProgressHtml(prospect)}
      </div>
    </td>

    <td>
      <div class="draft-redesign-actions">
        <button
          type="button"
          class="draft-small-button primary ${canScout ? "" : "disabled"}"
          ${canScout ? "" : "disabled"}
          onclick="startScoutingReport('${escapeDraftRedesignAttr(prospect.id)}')"
        >
          ${escapeDraftRedesignHtml(scoutLabel)}
        </button>

        <button
          type="button"
          class="draft-small-button ${onBoard ? "boarded" : ""}"
          onclick="toggleProspectOnDraftBoard('${escapeDraftRedesignAttr(prospect.id)}')"
        >
          ${onBoard ? "On Board" : "Add to Draft Board"}
        </button>
      </div>
    </td>
  `;

  return row;
}

function displayDraftBoardPage() {
  if (!gameState || !gameState.started) return;

  ensureDraftState();

  const boardProspects = getDraftBoardProspects();

  setText("draft-board-year", gameState.draft.draftYear);
  setText("draft-board-count", boardProspects.length);
  setText("draft-board-top-player", boardProspects.length ? boardProspects[0].name : "None");
  setText("draft-board-scouts-left", `${getScoutsLeftThisMonth()} / ${SCOUTS_PER_MONTH}`);

  const list = document.getElementById("draft-board-list");

  if (!list) return;

  if (!boardProspects.length) {
    list.innerHTML = `
      <div class="draft-board-empty">
        No prospects added yet. Go to Scouting and click Add to Draft Board on prospects you like.
      </div>
    `;
    return;
  }

  list.innerHTML = "";
  boardProspects.forEach((prospect, index) => {
    list.appendChild(createDraftBoardRedesignRow(prospect, index));
  });
}

function createDraftBoardRedesignRow(prospect, index) {
  const row = document.createElement("div");
  row.className = "draft-board-row draft-board-row-redesign";

  const canScout = canScoutProspect(prospect);
  const boardLength = getDraftBoardProspects().length;

  row.innerHTML = `
    <div class="draft-board-rank">${index + 1}</div>

    <div class="draft-board-player">
      <button
        type="button"
        class="draft-board-player-name-button"
        onclick="openProspectProfile('${escapeDraftRedesignAttr(prospect.id)}')"
      >
        ${escapeDraftRedesignHtml(prospect.name)}
      </button>
      <span>${escapeDraftRedesignHtml(prospect.archetype || "")} · ${escapeDraftRedesignHtml(prospect.collegeOrClub || "")}</span>
    </div>

    <div class="draft-board-small">
      <strong>${escapeDraftRedesignHtml(getDraftRedesignProspectPosition(prospect))}</strong>
      <span>${escapeDraftRedesignHtml(prospect.age)} yrs · ${escapeDraftRedesignHtml(prospect.height)}</span>
    </div>

    <div class="draft-board-small">
      <strong>${escapeDraftRedesignHtml(prospect.projectedRange || "Unranked")}</strong>
      <span>Mock #${prospect.mockRank || "--"}</span>
    </div>

    <div class="draft-board-small">
      <strong>${escapeDraftRedesignHtml(formatProspectStats(prospect))}</strong>
      <span>${escapeDraftRedesignHtml(prospect.risk || "Medium")} Risk</span>
    </div>

    <div class="draft-board-progress">
      ${getProspectScoutingProgressHtml(prospect)}
    </div>

    <div class="draft-board-actions draft-board-actions-redesign">
      <button
        class="draft-board-arrow"
        ${index === 0 ? "disabled" : ""}
        onclick="moveDraftBoardProspect('${escapeDraftRedesignAttr(prospect.id)}', -1)"
      >
        ↑
      </button>

      <button
        class="draft-board-arrow"
        ${index === boardLength - 1 ? "disabled" : ""}
        onclick="moveDraftBoardProspect('${escapeDraftRedesignAttr(prospect.id)}', 1)"
      >
        ↓
      </button>

      <button
        class="draft-small-button primary ${canScout ? "" : "disabled"}"
        ${canScout ? "" : "disabled"}
        onclick="startScoutingReport('${escapeDraftRedesignAttr(prospect.id)}')"
      >
        Scout
      </button>

      <button
        class="draft-small-button"
        onclick="removeProspectFromDraftBoard('${escapeDraftRedesignAttr(prospect.id)}')"
      >
        Remove
      </button>
    </div>
  `;

  return row;
}

/* =========================
   MOCK DRAFT REDESIGN
========================= */

function getMockDraftOrderForCurrentState() {
  if (!gameState || !Array.isArray(gameState.teams)) return [];

  const teams = gameState.teams.slice();

  teams.sort((a, b) => {
    const aWins = Number(a.wins || 0);
    const bWins = Number(b.wins || 0);
    const aLosses = Number(a.losses || 0);
    const bLosses = Number(b.losses || 0);
    const aGames = aWins + aLosses;
    const bGames = bWins + bLosses;
    const aWinPct = aGames ? aWins / aGames : 0;
    const bWinPct = bGames ? bWins / bGames : 0;

    if (aWinPct !== bWinPct) return aWinPct - bWinPct;
    if (aWins !== bWins) return aWins - bWins;
    if (bLosses !== aLosses) return bLosses - aLosses;

    const aStrength = typeof getTeamStrength === "function" ? getTeamStrength(a) : 0;
    const bStrength = typeof getTeamStrength === "function" ? getTeamStrength(b) : 0;

    if (aStrength !== bStrength) return aStrength - bStrength;

    return Number(a.id || 0) - Number(b.id || 0);
  });

  return teams.concat(teams);
}

function getDraftTeamPositionNeedScore(team, position) {
  if (!team || !position) return 0;

  const roster = typeof getRosterByTeamId === "function"
    ? getRosterByTeamId(team.id)
    : [];

  const counts = { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 };

  roster.forEach(player => {
    const pos = player.primaryPosition || player.position;
    if (counts[pos] !== undefined) counts[pos]++;
  });

  const target = {
    PG: 3,
    SG: 3,
    SF: 3,
    PF: 3,
    C: 3
  };

  const need = Math.max(0, Number(target[position] || 2) - Number(counts[position] || 0));

  return need * 12;
}

function getDraftProspectBaseMockScore(prospect) {
  if (!prospect) return 0;

  if (typeof getProspectMockScore === "function") {
    return getProspectMockScore(prospect);
  }

  return (
    Number(prospect.actualPotentialAbility || 0) * 1.2 +
    Number(prospect.actualCurrentAbility || 0) * 0.8 -
    Number(prospect.classRankSeed || 999)
  );
}

function chooseMockDraftProspectForTeam(team, availableProspects, pickNumber) {
  if (!availableProspects.length) return null;

  const topWindow = availableProspects
    .slice()
    .sort((a, b) => getDraftProspectBaseMockScore(b) - getDraftProspectBaseMockScore(a))
    .slice(0, Math.min(10, availableProspects.length));

  let bestProspect = topWindow[0];
  let bestScore = -Infinity;

  topWindow.forEach(prospect => {
    const position = prospect.primaryPosition || "";
    const needBonus = getDraftTeamPositionNeedScore(team, position);
    const pickPressure = Math.max(0, 8 - Math.floor(pickNumber / 8));
    const score =
      getDraftProspectBaseMockScore(prospect) +
      needBonus +
      pickPressure +
      getDraftRedesignStableNoise(`${team.id}_${prospect.id}_${gameState.seasonLabel}`, 4);

    if (score > bestScore) {
      bestScore = score;
      bestProspect = prospect;
    }
  });

  return bestProspect;
}

function getDraftRedesignStableNoise(key, max = 1) {
  const text = String(key || "draft");
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000003;
  }

  return (hash % 1000) / 1000 * max;
}

function generateCurrentMockDraft(label) {
  if (!gameState || !gameState.draft) return;

  const draftOrder = getMockDraftOrderForCurrentState();
  const availableProspects = getDraftClass()
    .slice()
    .filter(prospect => !prospect.drafted)
    .sort((a, b) => getDraftProspectBaseMockScore(b) - getDraftProspectBaseMockScore(a));

  const mockPicks = [];

  for (let i = 0; i < DRAFT_PICKS; i++) {
    const team = draftOrder[i];
    const prospect = chooseMockDraftProspectForTeam(team, availableProspects, i + 1);

    if (!team || !prospect) continue;

    const prospectIndex = availableProspects.findIndex(item => item.id === prospect.id);
    if (prospectIndex >= 0) {
      availableProspects.splice(prospectIndex, 1);
    }

    prospect.mockRank = i + 1;

    mockPicks.push({
      pick: i + 1,
      round: i < 30 ? 1 : 2,
      teamId: team.id,
      teamName: team.name,
      teamAbbrev: team.abbrev,
      prospectId: prospect.id,
      prospectName: prospect.name
    });
  }

  gameState.draft.currentMockDraft = mockPicks;

  if (!Array.isArray(gameState.draft.mockDrafts)) {
    gameState.draft.mockDrafts = [];
  }

  gameState.draft.mockDrafts.unshift({
    id: `mock_${Date.now()}_${Math.random()}`,
    label: label || formatShortDate(gameState.currentDate),
    date: new Date(gameState.currentDate),
    picks: mockPicks.map(pick => ({ ...pick }))
  });

  gameState.draft.latestMockLabel = label || formatShortDate(gameState.currentDate);
}

function shouldUpdateWeeklyMockDraft() {
  if (!gameState || !gameState.started || !gameState.draft || !gameState.currentDate) return false;
  if (typeof getSeasonPhase === "function" && getSeasonPhase() !== "Regular Season") return false;

  const today = new Date(gameState.currentDate);
  if (today.getDay() !== 0) return false;

  const key = `mock_sunday_${gameState.seasonLabel}_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;

  if (!gameState.draft.processedMockDraftUpdates) {
    gameState.draft.processedMockDraftUpdates = {};
  }

  if (gameState.draft.processedMockDraftUpdates[key]) return false;

  gameState.draft.processedMockDraftUpdates[key] = true;

  return true;
}

function processMonthlyMockDraftUpdate() {
  if (!gameState || !gameState.started || !gameState.draft) return;

  if (shouldUpdateWeeklyMockDraft()) {
    generateCurrentMockDraft("Sunday Mock");
  }
}

function ensureMockDraftRedesignShell() {
  const screen = document.getElementById("mock-drafts-screen");

  if (!screen) return;

  if (screen.dataset.redesigned === "true") return;

  screen.dataset.redesigned = "true";

  screen.innerHTML = `
    <div class="mock-redesign-page">
      <div class="mock-redesign-round">
        <div class="mock-redesign-round-header">
          <h2>1st Round Mock</h2>
          <span>Picks 1-30 · Based on current team records</span>
        </div>

        <div id="mock-draft-round-one-board" class="mock-redesign-grid"></div>
      </div>

      <div class="mock-redesign-round">
        <div class="mock-redesign-round-header">
          <h2>2nd Round Mock</h2>
          <span>Picks 31-60 · Same record order</span>
        </div>

        <div id="mock-draft-round-two-board" class="mock-redesign-grid"></div>
      </div>

      <div id="mock-draft-empty-state" class="mock-draft-empty-state card hidden">
        No mock draft picks available.
      </div>
    </div>
  `;
}

function displayMockDraftPage() {
  if (!gameState || !gameState.started) return;

  ensureDraftState();
  ensureCurrentMockDraft();
  ensureMockDraftRedesignShell();

  displayMockDraftTable();
}

function displayMockDraftTable() {
  const roundOne = document.getElementById("mock-draft-round-one-board");
  const roundTwo = document.getElementById("mock-draft-round-two-board");
  const empty = document.getElementById("mock-draft-empty-state");

  if (!roundOne || !roundTwo || !gameState || !gameState.draft) return;

  const picks = (gameState.draft.currentMockDraft || [])
    .slice()
    .sort((a, b) => Number(a.pick || 0) - Number(b.pick || 0));

  const firstRound = picks.filter(pick => Number(pick.round) === 1);
  const secondRound = picks.filter(pick => Number(pick.round) === 2);

  roundOne.innerHTML = firstRound.map(renderMockRedesignPick).join("");
  roundTwo.innerHTML = secondRound.map(renderMockRedesignPick).join("");

  if (empty) {
    empty.classList.toggle("hidden", picks.length > 0);
  }
}

function renderMockRedesignPick(pick) {
  const team = getTeamById(pick.teamId);
  const prospect = getProspectById(pick.prospectId);
  const logo = getDraftRedesignTeamLogo(team);

  return `
    <div class="mock-redesign-pick">
      <div class="mock-redesign-pick-number">${pick.pick}</div>

      <div class="mock-redesign-team-logo">
        ${
          logo
            ? `<img src="${escapeDraftRedesignAttr(logo)}" alt="${escapeDraftRedesignAttr(team ? team.name : "Team")}">`
            : `<span>${escapeDraftRedesignHtml(getDraftRedesignTeamAbbrev(team))}</span>`
        }
      </div>

      <div class="mock-redesign-player">
        <button
          type="button"
          onclick="openProspectProfile('${escapeDraftRedesignAttr(pick.prospectId)}')"
        >
          ${escapeDraftRedesignHtml(pick.prospectName || prospect?.name || "Prospect")}
        </button>

        <span>
          ${escapeDraftRedesignHtml(prospect ? getDraftRedesignProspectPosition(prospect) : "-")}
          ${prospect ? ` · ${escapeDraftRedesignHtml(prospect.collegeOrClub)}` : ""}
        </span>
      </div>
    </div>
  `;
}

/* =========================
   LOTTERY ODDS RULES PAGE
========================= */

function displayDraftLotteryRulesPage() {
  const screen = document.getElementById("lottery-rules-screen");

  if (!screen || !gameState || !gameState.started) return;

  screen.innerHTML = `
    <div class="lottery-rules-page">
      <div class="lottery-rules-hero">
        <div class="lottery-rules-logo">FCD</div>
        <div>
          <span>Draft Lottery Rules</span>
          <h2>3-2-1 Lottery</h2>
          <p>The actual lottery still runs as an offseason event from the dashboard button on June 18.</p>
        </div>
      </div>

      <div class="lottery-rules-main-card">
        <div class="lottery-rules-table">
          <div class="lottery-rules-row header">
            <strong>Group</strong>
            <strong># of Teams</strong>
            <strong>Lottery Balls</strong>
          </div>

          ${renderLotteryRuleRow("Three worst records", "3", 3, true)}
          ${renderLotteryRuleRow("Remaining non-Play-In teams", "7", 3, false)}
          ${renderLotteryRuleRow("9th and 10th Play-In seeds", "4", 2, false)}
          ${renderLotteryRuleRow("Losers of 7 vs. 8 Play-In games", "2", 1, false)}
        </div>

        <div class="lottery-rules-notes">
          <div>
            <strong>Drawing</strong>
            <span>All 16 teams drawn.</span>
          </div>

          <div>
            <strong>Pick Floors</strong>
            <span>“Relegated” teams can’t receive a pick lower than #12.</span>
          </div>

          <div>
            <strong>Team Pick Restrictions</strong>
            <span>Can’t receive the #1 pick in consecutive years. Can’t receive top-5 picks in three consecutive years.</span>
          </div>

          <div>
            <strong>Pick Protections</strong>
            <span>Can’t protect picks top-12 through top-15 in trades.</span>
          </div>

          <div>
            <strong>Second Round</strong>
            <span>First 16 picks inverse of 1st round order. Non-lottery teams inverse of regular-season records.</span>
          </div>

          <div>
            <strong>Sunset After 2029 Draft</strong>
            <span>Vote required to continue or transition to a new system.</span>
          </div>

          <div>
            <strong>League Discipline</strong>
            <span>League can reduce lottery odds, modify draft positions, and impose significant fines.</span>
          </div>
        </div>
      </div>

      <div class="hidden">
        <strong id="lottery-status">Rules Only</strong>
        <strong id="lottery-user-pick">-</strong>
        <strong id="lottery-user-odds">0.0%</strong>
        <tbody id="lottery-odds-table-body"></tbody>
        <div id="projected-draft-order-list"></div>
        <button id="lottery-start-button" type="button"></button>
        <button id="lottery-reveal-next-button" type="button"></button>
        <button id="lottery-finish-button" type="button"></button>
      </div>
    </div>
  `;
}

function renderLotteryRuleRow(label, teamCount, balls, relegation) {
  const ballHtml = Array.from({ length: 3 }).map((_, index) => {
    const blankRelegationBall = relegation && index === 2;
    const active = index < balls && !blankRelegationBall;

    return `
      <span class="lottery-rule-ball ${active ? "active" : "empty"}"></span>
    `;
  }).join("");

  return `
    <div class="lottery-rules-row">
      <strong>${escapeDraftRedesignHtml(label)}</strong>
      <span>${escapeDraftRedesignHtml(teamCount)}</span>
      <div class="lottery-rule-balls">${ballHtml}</div>
    </div>
  `;
}

/* ======================================================
   DRAFT BOARD FULL-WIDTH FIX
   Removes right tools panel / clear board layout
====================================================== */

function ensureDraftBoardRedesignShell() {
  const screen = document.getElementById("draft-board-screen");

  if (!screen) return;

  if (screen.dataset.fullWidthBoard === "true") return;

  screen.dataset.fullWidthBoard = "true";

  screen.innerHTML = `
    <div class="draft-board-full-page">
      <div class="draft-redesign-status-row">
        <div class="draft-redesign-status-card">
          <span>Draft Class</span>
          <strong id="draft-board-year">2027</strong>
        </div>

        <div class="draft-redesign-status-card">
          <span>Board Count</span>
          <strong id="draft-board-count">0</strong>
        </div>

        <div class="draft-redesign-status-card">
          <span>Top Player</span>
          <strong id="draft-board-top-player">None</strong>
        </div>

        <div class="draft-redesign-status-card">
          <span>Scouts Left</span>
          <strong id="draft-board-scouts-left">10 / 10</strong>
        </div>

        <div class="draft-redesign-status-card">
          <span>Purpose</span>
          <strong>Draft Night</strong>
        </div>
      </div>

      <div class="draft-redesign-table-card draft-board-full-card">
        <h2>Your Draft Board</h2>
        <p>
          Move prospects up or down to create your personal draft-night ranking.
          Click a prospect name to view their profile.
        </p>

        <div id="draft-board-list" class="draft-board-list-full"></div>
      </div>
    </div>
  `;
}

function displayDraftBoardPage() {
  if (!gameState || !gameState.started) return;

  ensureDraftState();
  ensureDraftBoardRedesignShell();

  const boardProspects = getDraftBoardProspects();

  setText("draft-board-year", gameState.draft.draftYear);
  setText("draft-board-count", boardProspects.length);
  setText("draft-board-top-player", boardProspects.length ? boardProspects[0].name : "None");
  setText("draft-board-scouts-left", `${getScoutsLeftThisMonth()} / ${SCOUTS_PER_MONTH}`);

  const list = document.getElementById("draft-board-list");

  if (!list) return;

  if (!boardProspects.length) {
    list.innerHTML = `
      <div class="draft-board-empty">
        No prospects added yet. Go to Scouting and click Add to Draft Board on prospects you like.
      </div>
    `;
    return;
  }

  list.innerHTML = "";
  boardProspects.forEach((prospect, index) => {
    list.appendChild(createDraftBoardRedesignRow(prospect, index));
  });
}

/* ======================================================
   PREVIOUS DRAFTS SCREEN
   Saves completed drafts and displays historical results
====================================================== */

let currentPreviousDraftYear = null;

function ensurePreviousDraftsState() {
  if (!gameState) return [];

  if (!Array.isArray(gameState.previousDrafts)) {
    gameState.previousDrafts = [];
  }

  return gameState.previousDrafts;
}

function getPreviousDraftsSorted() {
  return ensurePreviousDraftsState()
    .slice()
    .sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
}

function getCurrentPreviousDraftRecord() {
  const drafts = getPreviousDraftsSorted();

  if (!drafts.length) return null;

  if (!currentPreviousDraftYear) {
    currentPreviousDraftYear = Number(drafts[0].year);
  }

  return drafts.find(draft => Number(draft.year) === Number(currentPreviousDraftYear)) || drafts[0];
}

function setPreviousDraftYear(year) {
  currentPreviousDraftYear = Number(year);
  displayPreviousDraftPage();
}

function getPreviousDraftPlayerIdByName(playerName) {
  if (!playerName || !gameState || !gameState.rosters) return null;

  for (let teamId in gameState.rosters) {
    const roster = gameState.rosters[teamId];

    if (!Array.isArray(roster)) continue;

    const found = roster.find(player =>
      player &&
      String(player.name || "").toLowerCase() === String(playerName || "").toLowerCase()
    );

    if (found) {
      return found.id || found.playerId || null;
    }
  }

  return null;
}

function openPreviousDraftPlayerProfile(savedPlayerId, playerName) {
  const foundPlayerId =
    savedPlayerId ||
    getPreviousDraftPlayerIdByName(playerName);

  if (foundPlayerId && typeof openPlayerProfile === "function") {
    openPlayerProfile(foundPlayerId);
    return;
  }

  showModal(
    "Player Profile Not Available",
    `${playerName || "This player"} has not been added to a roster/player profile yet. Once the rookie is signed or added to the league, this will open their player profile.`
  );
}

function createPreviousDraftPickRecord(draftPick) {
  const team = getTeamById(draftPick.teamId) || getBaseTeamById(draftPick.teamId);
  const prospect = typeof getProspectById === "function"
    ? getProspectById(draftPick.prospectId)
    : null;

  return {
    pick: Number(draftPick.pick || 0),
    round: Number(draftPick.round || (Number(draftPick.pick || 0) <= 30 ? 1 : 2)),

    teamId: Number(draftPick.teamId || 0),
    teamName: draftPick.teamName || team?.name || "Team",
    teamAbbrev: draftPick.teamAbbrev || team?.abbrev || "",

    playerId: draftPick.playerId || draftPick.rookiePlayerId || null,
    prospectId: draftPick.prospectId || null,
    playerName: draftPick.prospectName || draftPick.playerName || prospect?.name || "Drafted Player",

    position: draftPick.position || prospect?.primaryPosition || "-",
    school: draftPick.school || prospect?.collegeOrClub || ""
  };
}

function savePreviousDraftFromCompletedDraft() {
  if (!gameState || !gameState.draft) return;

  const draft = gameState.draft;
  const year = Number(draft.draftYear || Number(gameState.seasonStartYear || 0) + 1);
  const draftedPlayers = Array.isArray(draft.draftedPlayers) ? draft.draftedPlayers : [];

  if (!year || draftedPlayers.length < 60) return;

  const previousDrafts = ensurePreviousDraftsState();

  const alreadySaved = previousDrafts.some(savedDraft =>
    Number(savedDraft.year) === Number(year)
  );

  if (alreadySaved) return;

  const picks = draftedPlayers
    .slice()
    .sort((a, b) => Number(a.pick || 0) - Number(b.pick || 0))
    .map(createPreviousDraftPickRecord);

  previousDrafts.push({
    id: `draft_${year}_${Date.now()}`,
    year,
    seasonLabel: gameState.seasonLabel,
    completedDate: new Date(gameState.currentDate).toISOString(),
    picks
  });

  currentPreviousDraftYear = year;
}

function backPreviousDraftYear() {
  const drafts = getPreviousDraftsSorted();

  if (!drafts.length) return;

  const current = getCurrentPreviousDraftRecord();
  const currentIndex = drafts.findIndex(draft => Number(draft.year) === Number(current.year));
  const nextIndex = Math.min(drafts.length - 1, currentIndex + 1);

  currentPreviousDraftYear = drafts[nextIndex].year;
  displayPreviousDraftPage();
}

function forwardPreviousDraftYear() {
  const drafts = getPreviousDraftsSorted();

  if (!drafts.length) return;

  const current = getCurrentPreviousDraftRecord();
  const currentIndex = drafts.findIndex(draft => Number(draft.year) === Number(current.year));
  const nextIndex = Math.max(0, currentIndex - 1);

  currentPreviousDraftYear = drafts[nextIndex].year;
  displayPreviousDraftPage();
}

function ensurePreviousDraftScreenShell() {
  const screen = document.getElementById("previous-draft-screen");

  if (!screen) return;

  if (screen.dataset.previousDraftRedesign === "true") return;

  screen.dataset.previousDraftRedesign = "true";

  screen.innerHTML = `
    <div class="previous-draft-page">
      <div id="previous-draft-root"></div>
    </div>
  `;
}

function displayPreviousDraftPage() {
  if (!gameState || !gameState.started) return;

  ensurePreviousDraftsState();
  ensurePreviousDraftScreenShell();

  const root = document.getElementById("previous-draft-root");
  if (!root) return;

  const drafts = getPreviousDraftsSorted();

  if (!drafts.length) {
    root.innerHTML = `
      <div class="previous-draft-empty-card">
        <span>Previous Draft</span>
        <h2>No Previous Drafts Yet</h2>
        <p>
          Completed drafts will appear here after your first draft night.
          Once the draft is finished, all 60 picks will be saved automatically.
        </p>
      </div>
    `;
    return;
  }

  const draft = getCurrentPreviousDraftRecord();
  const currentIndex = drafts.findIndex(item => Number(item.year) === Number(draft.year));

  const canGoNewer = currentIndex > 0;
  const canGoOlder = currentIndex < drafts.length - 1;

  const roundOne = draft.picks.filter(pick => Number(pick.round) === 1);
  const roundTwo = draft.picks.filter(pick => Number(pick.round) === 2);

  root.innerHTML = `
    <div class="previous-draft-header">
      <div>
        <span>Previous Draft</span>
        <h2>${draft.year} Draft Results</h2>
        <p>Historical draft results saved from completed draft nights.</p>
      </div>

      <div class="previous-draft-year-controls">
        <button type="button" ${canGoOlder ? "" : "disabled"} onclick="backPreviousDraftYear()">←</button>

        <select onchange="setPreviousDraftYear(this.value)">
          ${drafts.map(savedDraft => `
            <option value="${savedDraft.year}" ${Number(savedDraft.year) === Number(draft.year) ? "selected" : ""}>
              ${savedDraft.year}
            </option>
          `).join("")}
        </select>

        <button type="button" ${canGoNewer ? "" : "disabled"} onclick="forwardPreviousDraftYear()">→</button>
      </div>
    </div>

    <div class="mock-redesign-round previous-draft-round">
      <div class="mock-redesign-round-header">
        <h2>1st Round Draft Results</h2>
        <span>Picks 1-30</span>
      </div>

      <div class="mock-redesign-grid">
        ${roundOne.map(renderPreviousDraftPick).join("")}
      </div>
    </div>

    <div class="mock-redesign-round previous-draft-round">
      <div class="mock-redesign-round-header">
        <h2>2nd Round Draft Results</h2>
        <span>Picks 31-60</span>
      </div>

      <div class="mock-redesign-grid">
        ${roundTwo.map(renderPreviousDraftPick).join("")}
      </div>
    </div>
  `;
}

function renderPreviousDraftPick(pick) {
  const team = getTeamById(pick.teamId) || getBaseTeamById(pick.teamId);
  const logo = getDraftRedesignTeamLogo(team);

  return `
    <div class="mock-redesign-pick previous-draft-pick">
      <div class="mock-redesign-pick-number">${pick.pick}</div>

      <div class="mock-redesign-team-logo">
        ${
          logo
            ? `<img src="${escapeDraftRedesignAttr(logo)}" alt="${escapeDraftRedesignAttr(pick.teamName || "Team")}">`
            : `<span>${escapeDraftRedesignHtml(pick.teamAbbrev || getDraftRedesignTeamAbbrev(team))}</span>`
        }
      </div>

      <div class="mock-redesign-player">
        <button
          type="button"
          onclick="openPreviousDraftPlayerProfile('${escapeDraftRedesignAttr(pick.playerId || "")}', '${escapeDraftRedesignAttr(pick.playerName)}')"
        >
          ${escapeDraftRedesignHtml(pick.playerName)}
        </button>

        <span>
          ${escapeDraftRedesignHtml(pick.position || "-")}
          ${pick.school ? ` · ${escapeDraftRedesignHtml(pick.school)}` : ""}
        </span>
      </div>
    </div>
  `;
}

/* Save the previous draft automatically when the draft finishes. */
(function installPreviousDraftSaveHook() {
  if (window.__previousDraftSaveHookInstalled) return;

  window.__previousDraftSaveHookInstalled = true;

  const install = () => {
    if (typeof finishDraftNight !== "function") return false;
    if (finishDraftNight.__previousDraftWrapped) return true;

    const originalFinishDraftNight = finishDraftNight;

    finishDraftNight = function(...args) {
      const result = originalFinishDraftNight.apply(this, args);

      if (typeof savePreviousDraftFromCompletedDraft === "function") {
        savePreviousDraftFromCompletedDraft();
      }

      if (typeof displayPreviousDraftPage === "function") {
        displayPreviousDraftPage();
      }

      return result;
    };

    finishDraftNight.__previousDraftWrapped = true;

    return true;
  };

  if (!install()) {
    window.addEventListener("load", install);
  }
})();
