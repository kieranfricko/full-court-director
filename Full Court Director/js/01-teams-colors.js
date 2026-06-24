const baseTeams = [
  { id: 1, name: "Boston Harbor", abbrev: "BOS", conference: "East", hiddenDivision: "Atlantic", teamStrength: 640 },
  { id: 2, name: "New York Empire", abbrev: "NYE", conference: "East", hiddenDivision: "Atlantic", teamStrength: 615 },
  { id: 3, name: "Philadelphia Liberty", abbrev: "PHI", conference: "East", hiddenDivision: "Atlantic", teamStrength: 590 },
  { id: 4, name: "Brooklyn Bridges", abbrev: "BKN", conference: "East", hiddenDivision: "Atlantic", teamStrength: 535 },
  { id: 5, name: "Toronto North", abbrev: "TOR", conference: "East", hiddenDivision: "Atlantic", teamStrength: 560 },

  { id: 6, name: "Chicago Wind", abbrev: "CHI", conference: "East", hiddenDivision: "Central", teamStrength: 575 },
  { id: 7, name: "Cleveland Rockers", abbrev: "CLE", conference: "East", hiddenDivision: "Central", teamStrength: 605 },
  { id: 8, name: "Detroit Engines", abbrev: "DET", conference: "East", hiddenDivision: "Central", teamStrength: 475 },
  { id: 9, name: "Milwaukee Stags", abbrev: "MIL", conference: "East", hiddenDivision: "Central", teamStrength: 660 },
  { id: 10, name: "Indiana Racers", abbrev: "IND", conference: "East", hiddenDivision: "Central", teamStrength: 550 },

  { id: 11, name: "Miami Wave", abbrev: "MIA", conference: "East", hiddenDivision: "Southeast", teamStrength: 630 },
  { id: 12, name: "Orlando Stars", abbrev: "ORL", conference: "East", hiddenDivision: "Southeast", teamStrength: 520 },
  { id: 13, name: "Atlanta Flight", abbrev: "ATL", conference: "East", hiddenDivision: "Southeast", teamStrength: 535 },
  { id: 14, name: "Charlotte Swarm", abbrev: "CHA", conference: "East", hiddenDivision: "Southeast", teamStrength: 455 },
  { id: 15, name: "Washington Monuments", abbrev: "WAS", conference: "East", hiddenDivision: "Southeast", teamStrength: 500 },

  { id: 16, name: "Los Angeles Legends", abbrev: "LAL", conference: "West", hiddenDivision: "Pacific", teamStrength: 640 },
  { id: 17, name: "Los Angeles Surf", abbrev: "LAC", conference: "West", hiddenDivision: "Pacific", teamStrength: 590 },
  { id: 18, name: "Golden State Guardians", abbrev: "GSW", conference: "West", hiddenDivision: "Pacific", teamStrength: 610 },
  { id: 19, name: "Sacramento Royals", abbrev: "SAC", conference: "West", hiddenDivision: "Pacific", teamStrength: 560 },
  { id: 20, name: "Phoenix Firebirds", abbrev: "PHX", conference: "West", hiddenDivision: "Pacific", teamStrength: 575 },

  { id: 21, name: "Portland Pioneers", abbrev: "POR", conference: "West", hiddenDivision: "Northwest", teamStrength: 485 },
  { id: 22, name: "Oklahoma Storm", abbrev: "OKC", conference: "West", hiddenDivision: "Northwest", teamStrength: 545 },
  { id: 23, name: "Denver Peaks", abbrev: "DEN", conference: "West", hiddenDivision: "Northwest", teamStrength: 680 },
  { id: 24, name: "Utah Peaks", abbrev: "UTA", conference: "West", hiddenDivision: "Northwest", teamStrength: 520 },
  { id: 25, name: "Minnesota Frost", abbrev: "MIN", conference: "West", hiddenDivision: "Northwest", teamStrength: 605 },

  { id: 26, name: "Dallas Wranglers", abbrev: "DAL", conference: "West", hiddenDivision: "Southwest", teamStrength: 630 },
  { id: 27, name: "Houston Launch", abbrev: "HOU", conference: "West", hiddenDivision: "Southwest", teamStrength: 535 },
  { id: 28, name: "San Antonio Marshals", abbrev: "SAS", conference: "West", hiddenDivision: "Southwest", teamStrength: 500 },
  { id: 29, name: "Memphis Blues", abbrev: "MEM", conference: "West", hiddenDivision: "Southwest", teamStrength: 560 },
  { id: 30, name: "New Orleans Krewe", abbrev: "NOP", conference: "West", hiddenDivision: "Southwest", teamStrength: 520 }
];

const teamColorDatabase = {
  "Atlanta Flight": {
    primaryColor: "#E03A3E",
    secondaryColor: "#26282A",
    accentColor: "#C1D32F"
  },

  "Boston Harbor": {
    primaryColor: "#007A33",
    secondaryColor: "#BA9653",
    accentColor: "#FFFFFF"
  },

  "Brooklyn Bridges": {
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    accentColor: "#777D84"
  },

  "Charlotte Swarm": {
    primaryColor: "#1D1160",
    secondaryColor: "#00788C",
    accentColor: "#A1A1A4"
  },

  "Chicago Wind": {
    primaryColor: "#CE1141",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF"
  },

  "Cleveland Rockers": {
    primaryColor: "#860038",
    secondaryColor: "#FDBB30",
    accentColor: "#041E42"
  },

  "Dallas Wranglers": {
    primaryColor: "#00538C",
    secondaryColor: "#002B5E",
    accentColor: "#B8C4CA"
  },

  "Denver Peaks": {
    primaryColor: "#0E2240",
    secondaryColor: "#FEC524",
    accentColor: "#8B2131"
  },

  "Detroit Engines": {
    primaryColor: "#1D42BA",
    secondaryColor: "#C8102E",
    accentColor: "#BEC0C2"
  },

  "Golden State Guardians": {
    primaryColor: "#1D428A",
    secondaryColor: "#FFC72C",
    accentColor: "#FFFFFF"
  },

  "Houston Launch": {
    primaryColor: "#CE1141",
    secondaryColor: "#000000",
    accentColor: "#C4CED4"
  },

  "Indiana Racers": {
    primaryColor: "#002D62",
    secondaryColor: "#FDBB30",
    accentColor: "#BEC0C2"
  },

  "Los Angeles Surf": {
    primaryColor: "#C8102E",
    secondaryColor: "#1D428A",
    accentColor: "#BEC0C2"
  },

  "Los Angeles Legends": {
    primaryColor: "#552583",
    secondaryColor: "#FDB927",
    accentColor: "#FFFFFF"
  },

  "Memphis Blues": {
    primaryColor: "#5D76A9",
    secondaryColor: "#12173F",
    accentColor: "#F5B112"
  },

  "Miami Wave": {
    primaryColor: "#98002E",
    secondaryColor: "#F9A01B",
    accentColor: "#000000"
  },

  "Milwaukee Stags": {
    primaryColor: "#00471B",
    secondaryColor: "#EEE1C6",
    accentColor: "#0077C0"
  },

  "Minnesota Frost": {
    primaryColor: "#0C2340",
    secondaryColor: "#236192",
    accentColor: "#9EA2A2"
  },

  "New Orleans Krewe": {
    primaryColor: "#0C2340",
    secondaryColor: "#C8102E",
    accentColor: "#85714D"
  },

  "New York Empire": {
    primaryColor: "#006BB6",
    secondaryColor: "#F58426",
    accentColor: "#BEC0C2"
  },

  "Oklahoma Storm": {
    primaryColor: "#007AC1",
    secondaryColor: "#EF3B24",
    accentColor: "#FDBB30"
  },

  "Orlando Stars": {
    primaryColor: "#0077C0",
    secondaryColor: "#000000",
    accentColor: "#C4CED4"
  },

  "Philadelphia Liberty": {
    primaryColor: "#006BB6",
    secondaryColor: "#ED174C",
    accentColor: "#FFFFFF"
  },

  "Phoenix Firebirds": {
    primaryColor: "#1D1160",
    secondaryColor: "#E56020",
    accentColor: "#000000"
  },

  "Portland Pioneers": {
    primaryColor: "#E03A3E",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF"
  },

  "Sacramento Royals": {
    primaryColor: "#5A2D81",
    secondaryColor: "#63727A",
    accentColor: "#000000"
  },

  "San Antonio Marshals": {
    primaryColor: "#000000",
    secondaryColor: "#C4CED4",
    accentColor: "#FFFFFF"
  },

  "Toronto North": {
    primaryColor: "#CE1141",
    secondaryColor: "#000000",
    accentColor: "#A1A1A4"
  },

  "Utah Peaks": {
    primaryColor: "#002B5C",
    secondaryColor: "#00471B",
    accentColor: "#F9A01B"
  },

  "Washington Monuments": {
    primaryColor: "#002B5C",
    secondaryColor: "#E31837",
    accentColor: "#C4CED4"
  }
};

function getTeamColors(team) {
  if (!team) {
    return {
      primaryColor: "#1D4ED8",
      secondaryColor: "#F8FAFC",
      accentColor: "#22D3EE"
    };
  }

  return (
    teamColorDatabase[team.originalName] ||
    teamColorDatabase[team.name] ||
    teamColorDatabase[team.importedName] ||
    {
      primaryColor: "#1D4ED8",
      secondaryColor: "#F8FAFC",
      accentColor: "#22D3EE"
    }
  );
}

function applyTeamColors(team) {
  if (!team) return team;

  const colors = getTeamColors(team);

  team.primaryColor = team.primaryColor || colors.primaryColor;
  team.secondaryColor = team.secondaryColor || colors.secondaryColor;
  team.accentColor = team.accentColor || colors.accentColor;

  return team;
}

function ensureTeamColors() {
  if (!gameState || !Array.isArray(gameState.teams)) return;

  for (let team of gameState.teams) {
    applyTeamColors(team);
  }
}

function cloneTeams() {
  return baseTeams.map(team => applyTeamColors({
    ...team,
    wins: 0,
    losses: 0
  }));
}

const FCD_START_ROSTER_PREVIEW_STORAGE_KEY = "fcd_start_active_roster_pack_preview";

let startActiveRosterPack = null;

function getStartActiveRosterPack() {
  if (startActiveRosterPack) return startActiveRosterPack;

  const possibleGlobalPacks = [
    window.activeCommunityRosterPack,
    window.currentCommunityRosterPack,
    window.communityRosterPack,
    window.loadedCommunityRosterPack
  ];

  for (let pack of possibleGlobalPacks) {
    if (isUsableStartRosterPack(pack)) {
      startActiveRosterPack = pack;
      return startActiveRosterPack;
    }
  }

  try {
    const saved = localStorage.getItem(FCD_START_ROSTER_PREVIEW_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (isUsableStartRosterPack(parsed)) {
        startActiveRosterPack = parsed;
        return startActiveRosterPack;
      }
    }
  } catch (error) {
    console.warn("Could not load start roster preview pack:", error);
  }

  return null;
}

function isUsableStartRosterPack(pack) {
  return Boolean(
    pack &&
    typeof pack === "object" &&
    (
      pack.teamsByFictionalName ||
      pack.teams ||
      pack.players ||
      pack.staff
    )
  );
}

function setStartActiveRosterPack(pack) {
  if (!isUsableStartRosterPack(pack)) return;

  startActiveRosterPack = pack;

  try {
    localStorage.setItem(FCD_START_ROSTER_PREVIEW_STORAGE_KEY, JSON.stringify(pack));
  } catch (error) {
    console.warn("Could not save start roster preview pack:", error);
  }

  const label = document.getElementById("active-roster-label");

  if (label) {
    label.textContent = `Active Roster: ${pack.packName || pack.name || "Community Roster Pack"}`;
  }

  if (document.getElementById("start-team-grid")) {
    populateTeamSelect();
  }
}

function getStartTeamOverrideFromPack(team, pack = getStartActiveRosterPack()) {
  if (!team || !pack) return null;

  const teamsByFictionalName =
    pack.teamsByFictionalName ||
    pack.teamOverrides ||
    pack.teamsByFictional ||
    {};

  const possibleKeys = [
    team.fictionalName,
    team.originalName,
    team.name,
    team.teamName,
    team.nickname
  ]
    .filter(Boolean)
    .map(value => String(value).trim());

  for (let key of possibleKeys) {
    if (teamsByFictionalName[key]) {
      return teamsByFictionalName[key];
    }
  }

  if (pack.teams && typeof pack.teams === "object") {
    const idKey = String(team.id);

    if (pack.teams[idKey]) {
      return pack.teams[idKey];
    }

    for (let key of possibleKeys) {
      if (pack.teams[key]) {
        return pack.teams[key];
      }
    }
  }

  return null;
}

function getStartTeamRealDisplayName(team) {
  const override = getStartTeamOverrideFromPack(team);

  return (
    override?.name ||
    team?.sourceName ||
    team?.displayName ||
    team?.nickname ||
    team?.teamName ||
    team?.shortName ||
    team?.name ||
    "Team"
  );
}

function getStartTeamRealLogoPath(team) {
  const override = getStartTeamOverrideFromPack(team);

  return (
    override?.image ||
    override?.logo ||
    override?.logoPath ||
    team?.logo ||
    team?.logoUrl ||
    team?.logoPath ||
    team?.image ||
    team?.imageUrl ||
    team?.teamLogo ||
    ""
  );
}

function getStartTeamRealInitials(team) {
  const override = getStartTeamOverrideFromPack(team);
  const name = getStartTeamRealDisplayName(team);

  return (
    override?.abbrev ||
    override?.abbreviation ||
    team?.abbrev ||
    team?.abbreviation ||
    String(name || "Team")
      .split(" ")
      .map(word => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase()
  );
}

function applyStartRosterTeamNamesToGameState() {
  const pack = getStartActiveRosterPack();

  if (!pack || !gameState || !Array.isArray(gameState.teams)) return;

  for (let team of gameState.teams) {
    const oldName = team.fictionalName || team.name;
    const override = getStartTeamOverrideFromPack(team, pack);

    if (!override) continue;

    team.fictionalName = oldName;
    team.sourceName = override.name || team.sourceName || team.name;
    team.name = override.name || team.name;

    if (override.image) {
      team.logo = override.image;
      team.logoPath = override.image;
      team.image = override.image;
      team.imageUrl = override.image;
    }

    if (override.arenaName) {
      team.arenaName = override.arenaName;
    }

    if (override.arenaCapacity) {
      team.arenaCapacity = override.arenaCapacity;
    }
  }

  syncRosterTeamNamesAfterStartRosterOverride();

  gameState.activeRosterPackName = pack.packName || pack.name || "Community Roster Pack";
}

function syncRosterTeamNamesAfterStartRosterOverride() {
  if (!gameState || !Array.isArray(gameState.teams)) return;

  const teamNameById = {};

  for (let team of gameState.teams) {
    teamNameById[Number(team.id)] = team.name;
  }

  if (gameState.rosters) {
    for (let teamId in gameState.rosters) {
      const teamName = teamNameById[Number(teamId)];

      if (!teamName) continue;

      for (let player of gameState.rosters[teamId] || []) {
        player.teamName = teamName;
      }
    }
  }

  const scheduleLists = [
    gameState.schedule,
    gameState.userSchedule,
    gameState.leagueSchedule
  ];

  for (let list of scheduleLists) {
    if (!Array.isArray(list)) continue;

    for (let game of list) {
      if (game.homeTeamId && teamNameById[Number(game.homeTeamId)]) {
        game.homeTeamName = teamNameById[Number(game.homeTeamId)];
      }

      if (game.awayTeamId && teamNameById[Number(game.awayTeamId)]) {
        game.awayTeamName = teamNameById[Number(game.awayTeamId)];
      }

      if (game.opponentId && teamNameById[Number(game.opponentId)]) {
        game.opponentName = teamNameById[Number(game.opponentId)];
      }
    }
  }
}

function populateTeamSelect() {
  const select = document.getElementById("team-select");
  if (!select) return;

  select.innerHTML = "";

    for (let team of baseTeams) {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = `${team.name} (${team.conference})`;
    select.appendChild(option);
  }

  updateStartTeamPreview();
}

function getSelectedTeam() {
  return gameState.teams.find(team => team.id === gameState.selectedTeamId);
}

function getTeamById(teamId) {
  return gameState.teams.find(team => team.id === teamId);
}

function getBaseTeamById(teamId) {
  return baseTeams.find(team => team.id === teamId);
}

function getTeamStrength(team) {
  if (!team) return 500;

  const roster = getRosterByTeamId(team.id);

  if (!roster || roster.length === 0) {
    return team.teamStrength || 500;
  }

  const topEight = [...roster]
    .sort((a, b) => b.currentAbility - a.currentAbility)
    .slice(0, 8);

  const total = topEight.reduce((sum, player, index) => {
    const weight = index < 5 ? 1.15 : 0.75;
    return sum + player.currentAbility * weight;
  }, 0);

  return Math.round(total / topEight.length);
}

function getTeamMediaLevel(team) {
  const strength = getTeamStrength(team);
  return getMediaDescription(strength);
}
