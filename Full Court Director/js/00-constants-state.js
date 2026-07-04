function getDefaultGameplan() {
  return {
    offensiveStyle: "Balanced",
    pace: "Balanced",
    shotProfile: "Balanced",
    ballMovement: "Balanced",
    firstScoringOption: "Best Player",
    secondScoringOption: "Best Player",
    defensiveStyle: "Balanced",
    pickRollDefense: "Drop Coverage",
    defensiveAggression: "Balanced",
    reboundingFocus: "Balanced"
  };
}

function getSeasonLabel(startYear) {
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

let nextPlayerId = 1;

let gameState = {
  started: false,
  selectedTeamId: null,
  seasonStartYear: 2026,
  seasonLabel: "2026-27",
  currentDate: new Date(2026, 8, 25),
  teams: [],
  inbox: [],
  tradeHistory: [],
  transactions: [],
  leagueTransactions: [],
  newsItems: [],
  tradeRoom: null,
  powerRankings: null,
  userSchedule: [],
  rosters: {},
  processedEvents: {},
  gameplan: getDefaultGameplan(),
  cup: null,
  playoffs: null,
  history: {
    seasons: [],
    champions: [],
    cupWinners: []
  },
  seasonReadyForRollover: false,
  finalsCompletedDate: null,
  scheduleReleasedForSeason: "2026-27"
};

let calendarViewDate = new Date(2026, 8, 25);
let playerStatsSortKey = "points";
let playerStatsSortDirection = "desc";
let draggedRotationSlotId = null;
let currentViewedTeamId = null;
let currentProfilePlayerId = null;
let currentFreeAgentOfferPlayerId = null;
let currentReleasePlayerId = null;

let selectedContractYearIndex = 0;

let previousMainSectionBeforePlayerProfile = null;
let previousSecondaryScreenBeforePlayerProfile = null;

let playerProfileContext = {
  source: null,
  teamId: null,
  playerIds: [],
  currentIndex: 0
};

let freeAgencyPositionFilter = "ALL";
let freeAgencySortKey = "salary";
let freeAgencySortDirection = "desc";

let selectedFreeAgentPanelPlayerId = null;
let currentFreeAgentNegotiation = null;
let pendingFreeAgentNegotiationResultAction = null;
let freeAgencyTypeFilter = "ALL";
let freeAgencyAgeFilter = "ALL";
let freeAgencySearchText = "";
let selectedPracticePlayerId = null;
let draggedGameplanSlotIndex = null;

let statsSubTab = "player";

let currentMainSection = "dashboard";
let currentSecondaryScreen = "dashboard-screen";

const SALARY_CAP = 155;

const SALARY_CAP_TABLE = {
  "2025-2026": {
    salaryCap: 154647000,
    luxuryTax: 187895000,
    firstApron: 195945000,
    secondApron: 207824000,
    bae: 5134000,
    nonTaxpayerMLE: 14104000,
    taxpayerMLE: 5685000,
    teamRoomMLE: 8781000
  },
  "2026-2027": {
    salaryCap: 165000000,
    luxuryTax: 201000000,
    firstApron: 209000000,
    secondApron: 222000000,
    bae: 5478000,
    nonTaxpayerMLE: 15048000,
    taxpayerMLE: 6065000,
    teamRoomMLE: 9369000
  },
  "2027-2028": {
    salaryCap: 173250000,
    luxuryTax: 210499000,
    firstApron: 219481000,
    secondApron: 232789000,
    bae: 5752000,
    nonTaxpayerMLE: 15800000,
    taxpayerMLE: 6369000,
    teamRoomMLE: 9837000
  },
  "2028-2029": {
    salaryCap: 181913000,
    luxuryTax: 221024000,
    firstApron: 230455000,
    secondApron: 244428000,
    bae: 6040000,
    nonTaxpayerMLE: 16590000,
    taxpayerMLE: 6687000,
    teamRoomMLE: 10329000
  },
  "2029-2030": {
    salaryCap: 191009000,
    luxuryTax: 232076000,
    firstApron: 241979000,
    secondApron: 256651000,
    bae: 6341000,
    nonTaxpayerMLE: 17420000,
    taxpayerMLE: 7021000,
    teamRoomMLE: 10845000
  },
  "2030-2031": {
    salaryCap: 200559000,
    luxuryTax: 243679000,
    firstApron: 254077000,
    secondApron: 269482000,
    bae: 6659000,
    nonTaxpayerMLE: 18291000,
    taxpayerMLE: 7372000,
    teamRoomMLE: 11388000
  },
  "2031-2032": {
    salaryCap: 210587000,
    luxuryTax: 255863000,
    firstApron: 266781000,
    secondApron: 282956000,
    bae: 6991000,
    nonTaxpayerMLE: 19206000,
    taxpayerMLE: 7741000,
    teamRoomMLE: 11957000
  },
  "2032-2033": {
    salaryCap: 221116000,
    luxuryTax: 268656000,
    firstApron: 280120000,
    secondApron: 297104000,
    bae: 7341000,
    nonTaxpayerMLE: 20166000,
    taxpayerMLE: 8128000,
    teamRoomMLE: 12555000
  },
  "2033-2034": {
    salaryCap: 232172000,
    luxuryTax: 282089000,
    firstApron: 294126000,
    secondApron: 311959000,
    bae: 7708000,
    nonTaxpayerMLE: 21174000,
    taxpayerMLE: 8534000,
    teamRoomMLE: 13183000
  },
  "2034-2035": {
    salaryCap: 243781000,
    luxuryTax: 296194000,
    firstApron: 308833000,
    secondApron: 327558000,
    bae: 8094000,
    nonTaxpayerMLE: 22233000,
    taxpayerMLE: 8961000,
    teamRoomMLE: 13842000
  }
};

function getSeasonLabelFromGameDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  date.setHours(0, 0, 0, 0);

  const calendarYear = date.getFullYear();
  const financialPlanningDate = new Date(calendarYear, 5, 17);
  const seasonStartYear = date >= financialPlanningDate
    ? calendarYear
    : calendarYear - 1;

  return `${seasonStartYear}-${seasonStartYear + 1}`;
}

function getSalaryCapInfoForSeason(seasonLabel) {
  const info = SALARY_CAP_TABLE[String(seasonLabel || "")];
  return info ? { ...info } : null;
}

function getCurrentSalaryCapInfo() {
  if (!gameState || !gameState.currentDate) return null;

  const seasonLabel = getSeasonLabelFromGameDate(gameState.currentDate);
  const info = getSalaryCapInfoForSeason(seasonLabel);

  return info ? { seasonLabel, ...info } : null;
}

function getSalaryCapApplicationDateKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function applySalaryCapForCurrentSeason() {
  if (!gameState || !gameState.currentDate) return null;

  const currentInfo = getCurrentSalaryCapInfo();
  if (!currentInfo) return null;

  gameState.salaryCapSeason = currentInfo.seasonLabel;
  gameState.salaryCapInfo = {
    ...currentInfo,
    appliedDate: getSalaryCapApplicationDateKey(gameState.currentDate)
  };

  return gameState.salaryCapInfo;
}

function ensureSalaryCapState() {
  if (!gameState || !gameState.currentDate) return null;

  const seasonLabel = getSeasonLabelFromGameDate(gameState.currentDate);

  if (
    !gameState.salaryCapInfo ||
    gameState.salaryCapSeason !== seasonLabel ||
    gameState.salaryCapInfo.seasonLabel !== seasonLabel
  ) {
    return applySalaryCapForCurrentSeason();
  }

  return gameState.salaryCapInfo;
}

const MINIMUM_SALARY = 1;
const MAXIMUM_SALARY = 55;
const MIN_ROSTER_SIZE = 14;
const MAX_ROSTER_SIZE = 15;
const MIN_ROSTER_TO_ADVANCE = 5;

const FREE_AGENCY_OPEN_MONTH = 5;
const FREE_AGENCY_OPEN_DAY = 30;

const FREE_AGENCY_CLOSE_MONTH = 3;
const FREE_AGENCY_CLOSE_DAY = 1;

const CONTRACT_EXPIRATION_MONTH = 5;
const CONTRACT_EXPIRATION_DAY = 23;

const FINAL_EXPIRING_WARNING_MONTH = 5;
const FINAL_EXPIRING_WARNING_DAY = 22;

const RETIREMENT_AGE = 40;

const freeAgencyPositionLabels = {
  PG: "Point Guards",
  SG: "Shooting Guards",
  SF: "Small Forwards",
  PF: "Power Forwards",
  C: "Centers"
};

const interestRankings = {
  "Very Interested": 5,
  "Interested": 4,
  "Neutral": 3,
  "Low Interest": 2,
  "Not Interested": 1
};
const defaultRotationMinutes = [34, 34, 32, 32, 30, 26, 20, 16, 10, 6, 0, 0, 0, 0, 0];

const rotationSlotDefinitions = [
  { slotId: "start_pg", label: "Starting PG", starter: true, position: "PG" },
  { slotId: "start_sg", label: "Starting SG", starter: true, position: "SG" },
  { slotId: "start_sf", label: "Starting SF", starter: true, position: "SF" },
  { slotId: "start_pf", label: "Starting PF", starter: true, position: "PF" },
  { slotId: "start_c", label: "Starting C", starter: true, position: "C" },
  { slotId: "bench_6", label: "Bench 6", starter: false, position: null },
  { slotId: "bench_7", label: "Bench 7", starter: false, position: null },
  { slotId: "bench_8", label: "Bench 8", starter: false, position: null },
  { slotId: "bench_9", label: "Bench 9", starter: false, position: null },
  { slotId: "bench_10", label: "Bench 10", starter: false, position: null },
  { slotId: "bench_11", label: "Bench 11", starter: false, position: null },
  { slotId: "bench_12", label: "Bench 12", starter: false, position: null },
  { slotId: "bench_13", label: "Bench 13", starter: false, position: null },
  { slotId: "bench_14", label: "Bench 14", starter: false, position: null },
  { slotId: "bench_15", label: "Bench 15", starter: false, position: null }
];
const positions = ["PG", "SG", "SF", "PF", "C"];

const attributeGroups = {
  offense: [
    { key: "finishing", label: "Finishing" },
    { key: "closeShot", label: "Close Shot" },
    { key: "midrange", label: "Midrange" },
    { key: "threePoint", label: "Three-Point" },
    { key: "freeThrow", label: "Free Throw" },
    { key: "shotCreation", label: "Shot Creation" },
    { key: "postScoring", label: "Post Scoring" },
    { key: "passing", label: "Passing" },
    { key: "passPerception", label: "Pass Perception" },
    { key: "ballHandling", label: "Ball Handling" },
    { key: "offBallMovement", label: "Off-Ball Movement" },
    { key: "screenUsage", label: "Screen Usage" },
    { key: "offensiveRebounding", label: "Offensive Rebounding" },
    { key: "touch", label: "Touch" },
    { key: "foulDrawing", label: "Foul Drawing" }
  ],

  defense: [
    { key: "perimeterDefense", label: "Perimeter Defense" },
    { key: "interiorDefense", label: "Interior Defense" },
    { key: "helpDefense", label: "Help Defense" },
    { key: "defensiveIQ", label: "Defensive IQ" },
    { key: "steals", label: "Steals" },
    { key: "blocks", label: "Blocks" },
    { key: "defensiveRebounding", label: "Defensive Rebounding" },
    { key: "screenNavigation", label: "Screen Navigation" },
    { key: "pickRollDefense", label: "Pick-and-Roll Defense" },
    { key: "postDefense", label: "Post Defense" },
    { key: "switchability", label: "Switchability" },
    { key: "defensiveDiscipline", label: "Defensive Discipline" }
  ],

  physicalMental: [
    { key: "speed", label: "Speed" },
    { key: "acceleration", label: "Acceleration" },
    { key: "strength", label: "Strength" },
    { key: "vertical", label: "Vertical" },
    { key: "stamina", label: "Stamina" },
    { key: "durability", label: "Durability" },
    { key: "agility", label: "Agility" },
    { key: "basketballIQ", label: "Basketball IQ" },
    { key: "composure", label: "Composure" },
    { key: "consistency", label: "Consistency" },
    { key: "workEthic", label: "Work Ethic" },
    { key: "leadership", label: "Leadership" },
    { key: "competitiveness", label: "Competitiveness" }
  ]
};

const allAttributeKeys = [
  ...attributeGroups.offense.map(attribute => attribute.key),
  ...attributeGroups.defense.map(attribute => attribute.key),
  ...attributeGroups.physicalMental.map(attribute => attribute.key)
];

const mediaDescriptionRanges = [
  { min: 775, label: "Generational Player", potentialLabel: "Generational Potential" },
  { min: 680, label: "MVP Candidate", potentialLabel: "MVP Candidate Potential" },
  { min: 625, label: "Star", potentialLabel: "Star Potential" },
  { min: 600, label: "High-Level Starter", potentialLabel: "High-Level Starter Potential" },
  { min: 550, label: "Starter", potentialLabel: "Starter Potential" },
  { min: 525, label: "Fringe Starter", potentialLabel: "Fringe Starter Potential" },
  { min: 450, label: "Key Rotation Player", potentialLabel: "Key Rotation Potential" },
  { min: 350, label: "Rotation Player", potentialLabel: "Rotation Potential" },
  { min: 250, label: "Bench Player", potentialLabel: "Bench Potential" },
  { min: 150, label: "Deep Bench", potentialLabel: "Deep Bench Potential" },
  { min: 40, label: "Developmental Player", potentialLabel: "Developmental Potential" }
];

const playerTypeTemplates = {
  "Floor General": ["passing", "passPerception", "ballHandling", "basketballIQ", "composure"],
  "Lead Guard": ["ballHandling", "passing", "shotCreation", "threePoint", "speed"],
  "Combo Guard": ["ballHandling", "shotCreation", "passing", "threePoint", "finishing"],
  "Scoring Guard": ["shotCreation", "threePoint", "midrange", "finishing", "foulDrawing"],
  "Shot Creator": ["shotCreation", "ballHandling", "midrange", "threePoint", "touch"],
  "Pull-Up Shooter": ["threePoint", "midrange", "shotCreation", "touch", "freeThrow"],
  "Slashing Guard": ["finishing", "speed", "acceleration", "ballHandling", "foulDrawing"],
  "Pass-First Guard": ["passing", "passPerception", "basketballIQ", "ballHandling", "defensiveDiscipline"],
  "Pick-and-Roll Creator": ["passing", "passPerception", "ballHandling", "shotCreation", "basketballIQ"],
  "Microwave Scorer": ["shotCreation", "threePoint", "midrange", "touch", "confidence"],
  "3-and-D Guard": ["threePoint", "perimeterDefense", "screenNavigation", "steals", "defensiveIQ"],
  "Defensive Guard": ["perimeterDefense", "screenNavigation", "steals", "agility", "defensiveDiscipline"],
  "Two-Way Guard": ["perimeterDefense", "threePoint", "ballHandling", "passing", "stamina"],
  "Off-Ball Shooter": ["threePoint", "offBallMovement", "touch", "freeThrow", "screenUsage"],
  "Tempo Pusher": ["speed", "acceleration", "passing", "ballHandling", "stamina"],
  "Crafty Guard": ["ballHandling", "touch", "passing", "midrange", "composure"],

  "3-and-D Wing": ["threePoint", "perimeterDefense", "switchability", "defensiveIQ", "offBallMovement"],
  "Slashing Wing": ["finishing", "speed", "vertical", "foulDrawing", "offBallMovement"],
  "Two-Way Wing": ["perimeterDefense", "switchability", "shotCreation", "threePoint", "stamina"],
  "Shot-Creating Wing": ["shotCreation", "midrange", "threePoint", "ballHandling", "touch"],
  "Point Forward": ["passing", "passPerception", "basketballIQ", "ballHandling", "strength"],
  "Defensive Stopper": ["perimeterDefense", "switchability", "defensiveIQ", "strength", "agility"],
  "Versatile Forward": ["switchability", "finishing", "defensiveRebounding", "passing", "basketballIQ"],
  "Spot-Up Shooter": ["threePoint", "offBallMovement", "touch", "freeThrow", "screenUsage"],
  "Athletic Finisher": ["finishing", "vertical", "speed", "offensiveRebounding", "foulDrawing"],
  "Secondary Creator": ["passing", "ballHandling", "shotCreation", "basketballIQ", "midrange"],
  "Isolation Scorer": ["shotCreation", "ballHandling", "midrange", "threePoint", "foulDrawing"],
  "Glue Guy": ["defensiveIQ", "basketballIQ", "offBallMovement", "passing", "defensiveDiscipline"],
  "Transition Wing": ["speed", "acceleration", "finishing", "steals", "stamina"],
  "Off-Ball Cutter": ["offBallMovement", "finishing", "touch", "basketballIQ", "speed"],
  "Switchable Defender": ["switchability", "perimeterDefense", "interiorDefense", "strength", "agility"],
  "Big Wing": ["strength", "finishing", "defensiveRebounding", "switchability", "postDefense"],

  "Rim Protector": ["blocks", "interiorDefense", "defensiveRebounding", "helpDefense", "vertical"],
  "Defensive Anchor": ["interiorDefense", "helpDefense", "defensiveIQ", "blocks", "defensiveRebounding"],
  "Glass Cleaner": ["defensiveRebounding", "offensiveRebounding", "strength", "vertical", "competitiveness"],
  "Rebounding Specialist": ["defensiveRebounding", "offensiveRebounding", "strength", "stamina", "competitiveness"],
  "Post Scorer": ["postScoring", "closeShot", "touch", "strength", "foulDrawing"],
  "Interior Scorer": ["finishing", "closeShot", "postScoring", "touch", "strength"],
  "Roll Man": ["finishing", "screenUsage", "vertical", "strength", "touch"],
  "Lob Threat": ["vertical", "finishing", "speed", "touch", "offensiveRebounding"],
  "Stretch Big": ["threePoint", "pickRollDefense", "defensiveRebounding", "touch", "strength"],
  "Pick-and-Pop Big": ["threePoint", "midrange", "screenUsage", "touch", "basketballIQ"],
  "Playmaking Big": ["passing", "passPerception", "basketballIQ", "postScoring", "touch"],
  "Modern Big": ["threePoint", "switchability", "interiorDefense", "defensiveRebounding", "passing"],
  "Mobile Big": ["speed", "agility", "switchability", "blocks", "finishing"],
  "Paint Beast": ["strength", "postScoring", "closeShot", "defensiveRebounding", "interiorDefense"],
  "Floor-Spacer Big": ["threePoint", "offBallMovement", "touch", "defensiveRebounding", "screenUsage"],
  "High-Post Hub": ["passing", "passPerception", "midrange", "basketballIQ", "touch"],

  "Raw Prospect": ["workEthic", "competitiveness", "vertical", "speed", "stamina"],
  "Depth Guard": ["ballHandling", "passing", "perimeterDefense", "stamina", "basketballIQ"],
  "Depth Wing": ["perimeterDefense", "offBallMovement", "threePoint", "stamina", "switchability"],
  "Depth Big": ["defensiveRebounding", "interiorDefense", "strength", "screenUsage", "stamina"],
  "Energy Big": ["offensiveRebounding", "defensiveRebounding", "competitiveness", "stamina", "strength"]
};

const playerTypesByPosition = {
  PG: [
    "Floor General", "Lead Guard", "Combo Guard", "Scoring Guard", "Shot Creator",
    "Pull-Up Shooter", "Slashing Guard", "Pass-First Guard", "Pick-and-Roll Creator",
    "Microwave Scorer", "3-and-D Guard", "Defensive Guard", "Two-Way Guard",
    "Off-Ball Shooter", "Tempo Pusher", "Crafty Guard"
  ],
  SG: [
    "Scoring Guard", "Shot Creator", "Pull-Up Shooter", "Slashing Guard", "Combo Guard",
    "Microwave Scorer", "3-and-D Guard", "Defensive Guard", "Two-Way Guard",
    "Off-Ball Shooter", "Secondary Creator", "Isolation Scorer"
  ],
  SF: [
    "3-and-D Wing", "Slashing Wing", "Two-Way Wing", "Shot-Creating Wing",
    "Point Forward", "Defensive Stopper", "Versatile Forward", "Spot-Up Shooter",
    "Athletic Finisher", "Secondary Creator", "Isolation Scorer", "Glue Guy",
    "Transition Wing", "Off-Ball Cutter", "Switchable Defender", "Big Wing"
  ],
  PF: [
    "Versatile Forward", "Big Wing", "Switchable Defender", "Stretch Big",
    "Pick-and-Pop Big", "Interior Scorer", "Post Scorer", "Glass Cleaner",
    "Modern Big", "Mobile Big", "Playmaking Big", "High-Post Hub", "Energy Big"
  ],
  C: [
    "Rim Protector", "Defensive Anchor", "Glass Cleaner", "Rebounding Specialist",
    "Post Scorer", "Interior Scorer", "Roll Man", "Lob Threat", "Stretch Big",
    "Pick-and-Pop Big", "Playmaking Big", "Modern Big", "Mobile Big", "Paint Beast",
    "Floor-Spacer Big", "High-Post Hub"
  ]
};
