function startGame() {
  const selectedId = Number(document.getElementById("team-select").value);
  const startYear = 2026;

  nextPlayerId = 1;

  gameState = {
    started: true,
    selectedTeamId: selectedId,
    generalManager: pendingCreatedGM, 
    seasonStartYear: startYear,
    seasonLabel: getSeasonLabel(startYear),
    currentDate: new Date(startYear, 8, 25),
    teams: cloneTeams(),
    inbox: [],
    tradeHistory: [],
    transactions: [],
    leagueTransactions: [],
    formalTradeOffers: [],
    tradeRoom: null,
    powerRankings: null,
    draft: null,
    previousDrafts: [],
    userSchedule: [],
    leagueSchedule: [],
    leagueScheduleMeta: null,
    rosters: {},
    staff: {},
    freeAgents: [],
    salaryCap: SALARY_CAP,
    rotation: null,
    teamStats: {},
    processedEvents: {},
    gameplan: getDefaultGameplan(),
    cup: createCupState(),
    playoffs: createEmptyPlayoffState(),
    history: {
      seasons: [],
      champions: [],
      cupWinners: []
    },
    seasonReadyForRollover: false,
    finalsCompletedDate: null
  };

   gameState.userSchedule = createRealisticUserSchedule(selectedId);
   gameState.staff = createAllTeamStaff();
  if (typeof installPlayerDatabaseIntoSave === "function") {
  installPlayerDatabaseIntoSave();
} else if (typeof installFixedPlayerDatabaseIntoSave === "function") {
  installFixedPlayerDatabaseIntoSave();
}

ensureFreeAgents();
gameState.rotation = createDefaultRotation();
ensureTeamStats();
assignCupGamesToUserSchedule();
validateUserSchedule82();

gameState.draft = createDraftState(gameState.seasonStartYear);
validateDraftClass();
generateCurrentMockDraft("Opening Mock");

if (typeof ensureAwardWatchState === "function") {
  gameState.awardWatch = null;
  ensureAwardWatchState();
}

if (typeof applySavedRosterImportPack === "function") {
  applySavedRosterImportPack();
}

  addInboxMessage("Welcome to Full Court Director", "You are responsible for roster construction, gameplan, player development, The Cup, and the postseason.", "staff");
  addInboxMessage("Training Camp Opens", "Training camp has opened. Prepare your team for the regular season.", "event");

  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");

  calendarViewDate = new Date(gameState.currentDate);

if (typeof resetTradeRoomForNewCareer === "function") {
  resetTradeRoomForNewCareer();
}

currentMainSection = "dashboard";
currentSecondaryScreen = "dashboard-screen";
initializeNavigation();

showMainSection("dashboard");

setTimeout(() => {
  refreshAll();
  displayDashboard();
}, 0);
}

function refreshAll() {
  if (gameState && gameState.started) {
    ensureTeamColors();
    ensureAllPlayerEnergy();
    ensureAllPlayerInjuryFields();
    ensureTeamStaff();
    ensureDraftState();
    resetMonthlyScoutsIfNeeded();
    cleanUrgentMessageSpam();
    clearNonEssentialAdvanceBlockers();
    ensureLeagueRosters();
    ensureFreeAgents();
    normalizeAllContracts();
    ensureRotation();
    ensureTeamStats();
    updateFreeAgentInterest();
    updateGMHeaderDisplay();

    if (typeof processTradePhoneDelayedMessages === "function") {
      processTradePhoneDelayedMessages();
    }
  }

  displayHeader();
  renderSecondaryNav(currentMainSection);
  displayDashboard();
  displayCalendar();
  displayRoster();
  displayRosterStatusBox();
  displayPlayerStats();
  displayTeamStats();
  displayLeagueLeaders();
  displayGameplan();

if (typeof ensureLeagueScheduleForCurrentSeason === "function") {
  ensureLeagueScheduleForCurrentSeason();
}

if (typeof displayTeamScheduleRedesignV3 === "function") {
  displayTeamScheduleRedesignV3();
} else if (typeof displayTeamScheduleRedesign === "function") {
  displayTeamScheduleRedesign();
} else if (typeof displaySchedule === "function") {
  displaySchedule();
}

if (typeof displayLeagueScheduleScreen === "function") {
  displayLeagueScheduleScreen();
}

displayStandings();
  displayLeague();
  displayFreeAgency();
  initializeTradeCenter();
  displayDraftScoutingPage();
  displayDraftBoardPage();
  displayMockDraftPage();
  displayLotteryOddsPage();
  displayRookieSigningPage();
  updateEnterDraftButtons();
  displayContracts();
  displayFinances();
  displayCup();
  displayPlayoffs();
  displayHistory();
  displayStartOffseasonButton();
  updateEnterLotteryButton();
  updateEnterDraftButtons();
  displayFrontOfficeStaff();
  displayLeagueStaffBrowser();

  if (typeof displayStaffMovementPage === "function") {
    displayStaffMovementPage();
  }

  displayInjuryReport();

// Award Watch now lives in News.
// Do not run the old League Award Race page every refresh.

if (
  currentSecondaryScreen === "awards-ceremony-screen" &&
  typeof displayAwardsCeremonyScreen === "function"
) {
  displayAwardsCeremonyScreen();
}

refreshTradeCenterIfOpen();

showSecondaryScreen(currentSecondaryScreen || navigationSections[currentMainSection].defaultScreen);

displayRotationBoard();
}

function saveGame() {
  if (typeof syncTradeRoomToGameState === "function") {
    syncTradeRoomToGameState();
  }

  localStorage.setItem("fullCourtDirectorSave", JSON.stringify(gameState));

  addInboxMessage("Save Complete", "Your career has been saved.", "staff");
  refreshAll();
}

function loadGame() {
  const savedGame = localStorage.getItem("fullCourtDirectorSave");

  if (!savedGame) {
    alert("No saved career found.");
    return;
  }

  const loaded = JSON.parse(savedGame);

  if (!loaded.rosters || !loaded.rosters[loaded.selectedTeamId]) {
    alert("This save is from an older version and is not compatible with the new player attribute update. Please start a new career.");
    return;
  }

  const firstRoster = loaded.rosters[loaded.selectedTeamId];
  const firstPlayer = firstRoster && firstRoster[0];

  if (!firstPlayer || !firstPlayer.attributes || !firstPlayer.currentAbility) {
    alert("This save is from an older version and is not compatible with the new player attribute update. Please start a new career.");
    return;
  }

  gameState = loaded;
  gameState.currentDate = new Date(gameState.currentDate);

  if (typeof restoreTradeRoomFromGameState === "function") {
    restoreTradeRoomFromGameState();
  }

  if (!gameState.gameplan) gameState.gameplan = getDefaultGameplan();
  if (!gameState.tradeHistory) gameState.tradeHistory = [];
  if (!gameState.transactions) gameState.transactions = [];
  if (!gameState.leagueTransactions) gameState.leagueTransactions = [];
  if (!Array.isArray(gameState.formalTradeOffers)) gameState.formalTradeOffers = [];

  if (!gameState.history) {
    gameState.history = {
      seasons: [],
      champions: [],
      cupWinners: []
    };
  }

  if (!gameState.playoffs) gameState.playoffs = createEmptyPlayoffState();
  if (!gameState.cup) gameState.cup = createCupState();

  if (gameState.finalsCompletedDate) {
    gameState.finalsCompletedDate = new Date(gameState.finalsCompletedDate);
  }

  if (gameState.userSchedule) {
    for (let game of gameState.userSchedule) {
      game.date = new Date(game.date);
      if (!game.topPerformers) game.topPerformers = [];
    }
  }

  if (Array.isArray(gameState.leagueSchedule)) {
  for (let game of gameState.leagueSchedule) {
    game.date = new Date(game.date);
    if (!game.topPerformers) game.topPerformers = [];
    if (game.boxScore && game.boxScore.date) {
      game.boxScore.date = new Date(game.boxScore.date);
    }
  }
}

  if (gameState.cup.games) {
    for (let game of gameState.cup.games) {
      game.date = new Date(game.date);
    }
  }

  if (gameState.playoffs.playInGames) {
    for (let game of gameState.playoffs.playInGames) {
      game.date = new Date(game.date);
    }
  }

  if (gameState.playoffs.series) {
    for (let series of gameState.playoffs.series) {
      for (let game of series.games) {
        game.date = new Date(game.date);
      }
    }
  }

  if (!gameState.inbox || gameState.inbox.length === 0 || typeof gameState.inbox[0] === "string") {
    gameState.inbox = [];
    addInboxMessage("Save Updated", "Your save was updated to the new inbox format.", "staff");
  }

  let highestPlayerNumber = 0;

  for (let teamId in gameState.rosters) {
    for (let player of gameState.rosters[teamId]) {
      if (!player.seasonStats) player.seasonStats = createEmptySeasonStats();
      if (!player.seasonStatsHistory || typeof player.seasonStatsHistory !== "object" || Array.isArray(player.seasonStatsHistory)) {
        player.seasonStatsHistory = {};
      }

      const number = Number(String(player.id).replace("p", ""));
      if (!Number.isNaN(number)) {
        highestPlayerNumber = Math.max(highestPlayerNumber, number);
      }
    }
  }

  nextPlayerId = highestPlayerNumber + 1;
if (!gameState.rotation) {
  gameState.rotation = createDefaultRotation();
}

if (!gameState.teamStats) {
  gameState.teamStats = {};
}

ensureRotation();
ensureTeamStats();

for (let game of gameState.userSchedule) {
  if (game.boxScore && game.boxScore.date) {
    game.boxScore.date = new Date(game.boxScore.date);
  }
}
if (!gameState.freeAgents) {
  gameState.freeAgents = [];
}

for (let player of gameState.freeAgents) {
  if (!player.seasonStats) player.seasonStats = createEmptySeasonStats();
  if (!player.seasonStatsHistory || typeof player.seasonStatsHistory !== "object" || Array.isArray(player.seasonStatsHistory)) {
    player.seasonStatsHistory = {};
  }
}

if (!gameState.salaryCap) {
  gameState.salaryCap = SALARY_CAP;
}

ensureLeagueRosters();
ensureFreeAgents();
normalizeAllContracts();
ensureRotation();
ensureTeamStats();

if (typeof ensureAwardWatchState === "function") {
  ensureAwardWatchState();
}

for (let game of gameState.userSchedule) {
  if (game.boxScore && game.boxScore.date) {
    game.boxScore.date = new Date(game.boxScore.date);
  }
}
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");

  calendarViewDate = new Date(gameState.currentDate);

if (
  typeof isCommunityRosterActive === "function" &&
  isCommunityRosterActive() &&
  typeof applySavedRosterImportPack === "function"
) {
  applySavedRosterImportPack();
}

if (!Array.isArray(gameState.leagueSchedule)) {
  gameState.leagueSchedule = [];
}

if (!gameState.leagueScheduleMeta) {
  gameState.leagueScheduleMeta = null;
}

if (typeof ensureLeagueScheduleForCurrentSeason === "function") {
  ensureLeagueScheduleForCurrentSeason();
}

  addInboxMessage("Career Loaded", "Your saved career has been loaded.", "staff");

if (typeof resetTradeRoomForNewCareer === "function") {
  resetTradeRoomForNewCareer();
}

currentMainSection = "dashboard";
currentSecondaryScreen = "dashboard-screen";
initializeNavigation();



  refreshAll();
}

function resetCareer() {
  localStorage.removeItem("fullCourtDirectorSave");
  location.reload();
}

const startTeamProfiles = {
  1: {
    level: "Title Contender",
    identity: "Experienced Core",
    market: "Large",
    description: "A proud East franchise built around winning expectations. This is a team ready to chase championships quickly."
  },
  2: {
    level: "Playoff Team",
    identity: "Star Market",
    market: "Huge",
    description: "A major-market franchise with pressure, attention, and the resources to build something special."
  },
  3: {
    level: "Balanced",
    identity: "Flexible Core",
    market: "Large",
    description: "A proud franchise with the freedom to build a new era of success. Develop young talent, make smart moves, and bring a championship home."
  },
  4: {
    level: "Rebuilding",
    identity: "Young Roster",
    market: "Large",
    description: "A team with long-term upside and room to grow. Patience and smart roster building will matter here."
  },
  5: {
    level: "Play-In Team",
    identity: "Two-Way Group",
    market: "Large",
    description: "A competitive roster with enough talent to push for the postseason, but still needing the right moves."
  },
  6: {
    level: "Play-In Team",
    identity: "Physical Defense",
    market: "Large",
    description: "A tough, physical team trying to climb back into the playoff picture through defense and smart rotation choices."
  },
  7: {
    level: "Playoff Team",
    identity: "Strong Core",
    market: "Medium",
    description: "A strong roster with enough talent to win now if the rotation and roster moves are handled correctly."
  },
  8: {
    level: "Rebuilding",
    identity: "Development Focus",
    market: "Medium",
    description: "A long-term project with plenty of room for growth. Ideal if you want to build from the bottom."
  },
  9: {
    level: "Title Contender",
    identity: "Veteran Star Power",
    market: "Medium",
    description: "A championship-level team with high expectations. The window is open, but the pressure is real."
  },
  10: {
    level: "Play-In Team",
    identity: "Fast Tempo",
    market: "Medium",
    description: "A team built to run and compete, but still looking for the next step toward true contention."
  },
  11: {
    level: "Playoff Team",
    identity: "Veteran Toughness",
    market: "Large",
    description: "A serious organization with playoff expectations and a roster that can make noise with the right decisions."
  },
  12: {
    level: "Rebuilding",
    identity: "Young Upside",
    market: "Medium",
    description: "A young team with a lot of developmental potential. A good choice for a patient builder."
  },
  13: {
    level: "Play-In Team",
    identity: "Athletic Wings",
    market: "Large",
    description: "A team with athletic talent and flexibility, but still searching for the right long-term identity."
  },
  14: {
    level: "Rebuilding",
    identity: "Draft Focus",
    market: "Medium",
    description: "A full rebuild opportunity. The path will be difficult, but the roster can be shaped your way."
  },
  15: {
    level: "Rebuilding",
    identity: "Defensive Project",
    market: "Large",
    description: "A franchise trying to find direction. Good management can turn this into a future contender."
  },
  16: {
    level: "Title Contender",
    identity: "Star Power",
    market: "Huge",
    description: "A major-market contender where winning is expected immediately. Every decision will be under the spotlight."
  },
  17: {
    level: "Playoff Team",
    identity: "Veteran Balance",
    market: "Huge",
    description: "A deep roster with playoff expectations and a chance to become dangerous with the right moves."
  },
  18: {
    level: "Playoff Team",
    identity: "Shooting Culture",
    market: "Large",
    description: "A team with a modern identity, strong spacing, and the ability to compete if managed carefully."
  },
  19: {
    level: "Play-In Team",
    identity: "Fast Offense",
    market: "Medium",
    description: "A fun, fast-paced roster trying to push into the playoff picture and become more than a regular-season threat."
  },
  20: {
    level: "Play-In Team",
    identity: "Scoring Talent",
    market: "Large",
    description: "A team with offensive firepower, but it needs structure, balance, and the right roster decisions."
  },
  21: {
    level: "Rebuilding",
    identity: "Young Guards",
    market: "Medium",
    description: "A rebuilding team with young talent and room to grow into a future contender."
  },
  22: {
    level: "Play-In Team",
    identity: "Balanced Build",
    market: "Large",
    description: "A returning franchise with a strong fan base and a chance to build a serious basketball identity."
  },
  23: {
    level: "Title Contender",
    identity: "Elite Core",
    market: "Medium",
    description: "One of the strongest teams in the league. The goal is simple: win the championship."
  },
  24: {
    level: "Rebuilding",
    identity: "Frontcourt Depth",
    market: "Medium",
    description: "A team looking for direction, with pieces that can develop if given the right structure."
  },
  25: {
    level: "Playoff Team",
    identity: "Defense and Size",
    market: "Medium",
    description: "A tough roster with strong defensive potential and enough talent to compete in the West."
  },
  26: {
    level: "Playoff Team",
    identity: "Star Creator",
    market: "Large",
    description: "A team with high-end talent and serious playoff ambition. The right supporting cast could push them over the top."
  },
  27: {
    level: "Play-In Team",
    identity: "Young Scoring",
    market: "Large",
    description: "A developing roster with scoring upside and the flexibility to grow into something dangerous."
  },
  28: {
    level: "Rebuilding",
    identity: "Development System",
    market: "Medium",
    description: "A patient rebuild with a strong developmental feel. Ideal for building a team step by step."
  },
  29: {
    level: "Play-In Team",
    identity: "Physical Group",
    market: "Medium",
    description: "A gritty team trying to turn physicality and defense into consistent winning."
  },
  30: {
    level: "Rebuilding",
    identity: "Flexible Future",
    market: "Medium",
    description: "A team with room to grow, room to experiment, and a chance to build a new identity."
  }
};

function updateStartTeamPreview() {
  const select = document.getElementById("team-select");
  if (!select) return;

  const selectedId = Number(select.value);
  const team = baseTeams.find(item => item.id === selectedId);
  const profile = startTeamProfiles[selectedId] || {
    level: "Balanced",
    identity: "Flexible Core",
    market: "Medium",
    description: "A franchise ready for a new direction."
  };

  if (!team) return;

  const conferenceText = team.conference === "East" ? "Eastern Conference" : "Western Conference";

  setText("start-preview-name", team.name);
  setText("start-preview-conference", conferenceText);
  setText("start-preview-level", profile.level);
  setText("start-preview-identity", profile.identity);
  setText("start-preview-market", profile.market);
  setText("start-preview-description", profile.description);
}

if (typeof populateTeamSelect === "function") {
  populateTeamSelect();
}

if (typeof updateStartTeamPreview === "function") {
  updateStartTeamPreview();
}

/* ======================================================
   TEAM SCHEDULE REDESIGN FORCE RENDER
   Uses schedule-screen but does not rely on old displaySchedule()
====================================================== */

var fcdTeamScheduleCurrentFilter = "full";
var fcdTeamScheduleSuppressAutoScroll = false;

var FCD_TEAM_SCHEDULE_TIMES_V2 = [
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
  "10:00 PM"
];

function escapeTeamScheduleV2(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeTeamScheduleAttrV2(value) {
  return escapeTeamScheduleV2(value).replaceAll("`", "&#096;");
}

function getTeamScheduleStableIndexV2(key, length) {
  const text = String(key || "schedule-time");
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000003;
  }

  return Math.abs(hash) % Math.max(1, length);
}

function ensureTeamScheduleGameTimesV2() {
  if (!gameState || !Array.isArray(gameState.userSchedule)) return;

  for (let game of gameState.userSchedule) {
    if (!game) continue;

    if (!game.fcdGameTime) {
      const key = `${game.id || ""}_${game.date || ""}_${game.opponentId || ""}`;
      const index = getTeamScheduleStableIndexV2(key, FCD_TEAM_SCHEDULE_TIMES_V2.length);
      game.fcdGameTime = FCD_TEAM_SCHEDULE_TIMES_V2[index];
    }
  }
}

function getTeamScheduleLogoV2(team) {
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

function getTeamScheduleInitialsV2(team) {
  if (!team || !team.name) return "TM";

  return String(team.name)
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function getTeamSchedulePrimaryV2(team) {
  if (!team) return "#17408B";

  if (typeof getTeamPrimaryColorSafe === "function") {
    return getTeamPrimaryColorSafe(team);
  }

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.primaryColor ||
      colors.primary ||
      colors.mainColor ||
      team.primaryColor ||
      team.primary ||
      team.color ||
      "#17408B"
    );
  }

  return team.primaryColor || team.primary || team.color || "#17408B";
}

function getTeamScheduleSecondaryV2(team) {
  if (!team) return "#123b86";

  if (typeof getTeamSecondaryColorSafe === "function") {
    return getTeamSecondaryColorSafe(team);
  }

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.secondaryColor ||
      colors.secondary ||
      colors.accentColor ||
      team.secondaryColor ||
      team.secondary ||
      "#123b86"
    );
  }

  return team.secondaryColor || team.secondary || team.accentColor || "#123b86";
}

function getTeamScheduleDatePartsV2(dateValue) {
  const date = new Date(dateValue);

  return {
    day: date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
    dateText: `${date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} ${date.getDate()}`
  };
}

function getTeamScheduleTypeV2(game) {
  if (!game) return "regular";

  const competition = String(game.competition || "").toLowerCase();

  if (
    game.playoffGame ||
    game.playInGame ||
    competition.includes("playoff") ||
    competition.includes("play-in") ||
    competition.includes("finals")
  ) {
    return "playoff";
  }

  if (game.cupGame || competition.includes("cup")) {
    return "cup";
  }

  return "regular";
}

function getTeamScheduleFilterV2(game) {
  const type = getTeamScheduleTypeV2(game);

  if (type === "cup") return "cup";
  if (type === "playoff") return "playoffs";

  return "regular";
}

function setTeamScheduleFilterV2(filter) {
  fcdTeamScheduleCurrentFilter = filter || "full";
  fcdTeamScheduleSuppressAutoScroll = true;
  displayTeamScheduleRedesign();
  fcdTeamScheduleSuppressAutoScroll = false;
}

function getTeamScheduleVisibleGamesV2() {
  if (!gameState || !Array.isArray(gameState.userSchedule)) return [];

  return gameState.userSchedule
    .filter(game => game && game.date)
    .filter(game => typeof isCancelledFutureGame === "function" ? !isCancelledFutureGame(game) : true)
    .filter(game => {
      if (fcdTeamScheduleCurrentFilter === "full") return true;
      return getTeamScheduleFilterV2(game) === fcdTeamScheduleCurrentFilter;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getTeamScheduleAllGamesV2() {
  if (!gameState || !Array.isArray(gameState.userSchedule)) return [];

  return gameState.userSchedule
    .filter(game => game && game.date)
    .filter(game => typeof isCancelledFutureGame === "function" ? !isCancelledFutureGame(game) : true)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getTeamScheduleResultLetterV2(game) {
  if (!game || !game.played) return "UP";

  const ourScore = Number(game.ourScore || 0);
  const opponentScore = Number(game.opponentScore || 0);

  return ourScore > opponentScore ? "W" : "L";
}

function getTeamScheduleScoreTextV2(game) {
  if (!game) return "--";

  if (!game.played) {
    return game.fcdGameTime || "7:30 PM";
  }

  const ourScore = Number(game.ourScore || 0);
  const opponentScore = Number(game.opponentScore || 0);

  if (ourScore || opponentScore) {
    return `${ourScore}-${opponentScore}`;
  }

  return "FINAL";
}

function getTeamScheduleSummaryV2() {
  const games = getTeamScheduleAllGamesV2();
  const played = games.filter(game => game.played).length;
  const nextGame = games.find(game => !game.played) || null;

  return {
    total: games.length,
    played,
    nextGame
  };
}

function renderTeamScheduleLogoV2(team, label) {
  const logo = getTeamScheduleLogoV2(team);

  if (logo) {
    return `
      <div class="team-schedule-logo-wrap">
        <img src="${escapeTeamScheduleAttrV2(logo)}" alt="${escapeTeamScheduleAttrV2(label || team?.name || "Team")}">
      </div>
    `;
  }

  return `
    <div class="team-schedule-logo-wrap fallback">
      ${escapeTeamScheduleV2(getTeamScheduleInitialsV2(team))}
    </div>
  `;
}

function renderTeamScheduleGameCardV2(game) {
  const selectedTeam = typeof getSelectedTeam === "function"
    ? getSelectedTeam()
    : getTeamById(gameState.selectedTeamId);

  const opponent = getTeamById(game.opponentId);
  const gameType = getTeamScheduleTypeV2(game);
  const dateParts = getTeamScheduleDatePartsV2(game.date);

  const resultLetter = getTeamScheduleResultLetterV2(game);
  const resultClass = resultLetter === "W" ? "win" : resultLetter === "L" ? "loss" : "upcoming";

  const accentColor = game.home
    ? getTeamSchedulePrimaryV2(selectedTeam)
    : getTeamScheduleSecondaryV2(selectedTeam);

  const relationText = game.home ? "VS" : "AT";
  const statusText = game.played ? "FINAL" : "UPCOMING";
  const scoreText = getTeamScheduleScoreTextV2(game);
  const nextGame = getTeamScheduleSummaryV2().nextGame;
  const isNextUp = nextGame && String(nextGame.id) === String(game.id);

  return `
    <article
      id="team-schedule-game-${escapeTeamScheduleAttrV2(game.id)}"
      class="team-schedule-game-card ${game.played ? "played" : "upcoming"} ${resultClass} ${gameType} ${isNextUp ? "next-up" : ""} ${game.home ? "home" : "away"}"
      style="--team-schedule-accent:${accentColor};"
    >
      <div class="team-schedule-date-strip">
        <strong>${escapeTeamScheduleV2(dateParts.day)}</strong>
        <span>|</span>
        <strong>${escapeTeamScheduleV2(dateParts.dateText)}</strong>
        <span>|</span>
        <em>${escapeTeamScheduleV2(statusText)}</em>
      </div>

      <div class="team-schedule-main-row">
        <div class="team-schedule-result-badge ${resultClass}">
          ${escapeTeamScheduleV2(resultLetter)}
        </div>

        <div class="team-schedule-score">
          ${escapeTeamScheduleV2(scoreText)}
        </div>

        ${renderTeamScheduleLogoV2(selectedTeam, selectedTeam?.name)}

        <div class="team-schedule-vs-text">
          ${escapeTeamScheduleV2(relationText)}
        </div>

        ${renderTeamScheduleLogoV2(opponent, game.opponentName)}

        <div class="team-schedule-box-score-slot">
          ${
            game.played && game.boxScore
              ? `<button type="button" onclick="openBoxScore('${escapeTeamScheduleAttrV2(game.id)}')">Box Score</button>`
              : ``
          }
        </div>
      </div>
    </article>
  `;
}

function scrollTeamScheduleToNextGameV2() {
  const next =
    document.querySelector(".team-schedule-game-card.next-up") ||
    document.querySelector(".team-schedule-game-card.upcoming") ||
    document.querySelector(".team-schedule-game-card.played:last-child");

  if (!next) return;

  next.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function displayTeamScheduleRedesign() {
  if (!gameState || !gameState.started) return;

  const screen = document.getElementById("schedule-screen");
  if (!screen) return;

  ensureTeamScheduleGameTimesV2();

  const summary = getTeamScheduleSummaryV2();
  const games = getTeamScheduleVisibleGamesV2();

  screen.innerHTML = `
    <div class="team-schedule-page">
      <div class="team-schedule-header">
        <div>
          <span>Calendar</span>
          <h2>Team Schedule</h2>
          <p>${summary.played} of ${summary.total} games completed. Upcoming games show saved tip times.</p>
        </div>

        <div class="team-schedule-filter-bar">
          <button type="button" class="team-schedule-filter-button ${fcdTeamScheduleCurrentFilter === "full" ? "active" : ""}" onclick="setTeamScheduleFilterV2('full')">Full Schedule</button>
          <button type="button" class="team-schedule-filter-button ${fcdTeamScheduleCurrentFilter === "regular" ? "active" : ""}" onclick="setTeamScheduleFilterV2('regular')">Regular Season</button>
          <button type="button" class="team-schedule-filter-button ${fcdTeamScheduleCurrentFilter === "cup" ? "active" : ""}" onclick="setTeamScheduleFilterV2('cup')">The Cup</button>
          <button type="button" class="team-schedule-filter-button ${fcdTeamScheduleCurrentFilter === "playoffs" ? "active" : ""}" onclick="setTeamScheduleFilterV2('playoffs')">Playoffs</button>
        </div>
      </div>

      <div id="team-schedule-list" class="team-schedule-list">
        ${
          games.length
            ? games.map(renderTeamScheduleGameCardV2).join("")
            : `<div class="team-schedule-empty">No games scheduled yet.</div>`
        }
      </div>
    </div>
  `;

  if (
    screen.classList.contains("active-screen") &&
    !fcdTeamScheduleSuppressAutoScroll
  ) {
    setTimeout(scrollTeamScheduleToNextGameV2, 80);
  }
}
