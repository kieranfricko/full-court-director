function getFreeAgencyOpenDate() {
  return new Date(gameState.seasonStartYear + 1, FREE_AGENCY_OPEN_MONTH, FREE_AGENCY_OPEN_DAY);
}

function getFreeAgencyCloseDate() {
  return new Date(gameState.seasonStartYear + 1, FREE_AGENCY_CLOSE_MONTH, FREE_AGENCY_CLOSE_DAY);
}

function getContractExpirationDate() {
  return new Date(gameState.seasonStartYear + 1, CONTRACT_EXPIRATION_MONTH, CONTRACT_EXPIRATION_DAY);
}

function getFinalExpiringWarningDate() {
  return new Date(gameState.seasonStartYear + 1, FINAL_EXPIRING_WARNING_MONTH, FINAL_EXPIRING_WARNING_DAY);
}

function isFreeAgencyOpen() {
  if (!gameState.started) return false;

  const current = gameState.currentDate;
  const closeDate = getFreeAgencyCloseDate();
  const openDate = getFreeAgencyOpenDate();

  return current >= openDate || current < closeDate;
}

function getFreeAgencyStatusText() {
  return getFreeAgencyPhaseLabel();
}

function getMonthDayKey(dateValue) {
  const date = new Date(dateValue);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return month * 100 + day;
}

function getFreeAgencyMarketDateKey() {
  if (!gameState || !gameState.currentDate) return "";

  const date = new Date(gameState.currentDate);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getFreeAgencyMarketDayNumber() {
  if (!gameState || !gameState.currentDate) return 0;

  const current = new Date(gameState.currentDate);
  current.setHours(0, 0, 0, 0);

  const year = current.getFullYear();
  const moratoriumStart = new Date(year, 5, 30); // June 30
  moratoriumStart.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((current - moratoriumStart) / (1000 * 60 * 60 * 24)) + 1);
}

function shouldProcessDailyFreeAgencyMarket() {
  if (!gameState || !gameState.started) return false;
  if (gameState.offseasonActive !== true) return false;
  if (!canNegotiateWithFreeAgents()) return false;
  if (!Array.isArray(gameState.freeAgents) || gameState.freeAgents.length === 0) return false;

  const dateKey = getFreeAgencyMarketDateKey();

  if (!gameState.processedFreeAgencyMarketDays) {
    gameState.processedFreeAgencyMarketDays = {};
  }

  return gameState.processedFreeAgencyMarketDays[dateKey] !== true;
}

function markDailyFreeAgencyMarketProcessed() {
  if (!gameState.processedFreeAgencyMarketDays) {
    gameState.processedFreeAgencyMarketDays = {};
  }

  gameState.processedFreeAgencyMarketDays[getFreeAgencyMarketDateKey()] = true;
}

function getDailyCpuFreeAgencySigningLimit() {
  const dayNumber = getFreeAgencyMarketDayNumber();

  if (isFreeAgencyMoratorium()) {
    // Moratorium should be slower: mostly verbal agreements.
    if (dayNumber <= 2) return randomInt(1, 2);
    return randomInt(0, 2);
  }

  if (isFreeAgencySigningPeriod()) {
    // Early signing period is active, then slows down.
    if (dayNumber <= 10) return randomInt(2, 4);
    if (dayNumber <= 25) return randomInt(1, 3);
    return randomInt(0, 2);
  }

  return 0;
}

function getFreeAgentMarketTier(player) {
  const salary = getFreeAgentExpectedSalary(player);
  const ability = Number(player.currentAbility || 0);

  if (salary >= 30 || ability >= 680) return "star";
  if (salary >= 18 || ability >= 610) return "starter";
  if (salary >= 8 || ability >= 540) return "rotation";
  return "depth";
}

function canCpuFreeAgentSignToday(player) {
  if (!player || player.pendingAgreement) return false;

  const dayNumber = getFreeAgencyMarketDayNumber();
  const tier = getFreeAgentMarketTier(player);

  if (isFreeAgencyMoratorium()) {
    // During moratorium, bigger players move first.
    if (tier === "star") return dayNumber >= 1;
    if (tier === "starter") return dayNumber >= 2;
    if (tier === "rotation") return dayNumber >= 4 && Math.random() < 0.45;
    return false;
  }

  if (isFreeAgencySigningPeriod()) {
    if (tier === "star") return true;
    if (tier === "starter") return dayNumber >= 7;
    if (tier === "rotation") return dayNumber >= 10;
    if (tier === "depth") return dayNumber >= 16;

    return true;
  }

  return false;
}

function getCpuFreeAgencyAvailablePlayers() {
  if (!gameState || !Array.isArray(gameState.freeAgents)) return [];

  return gameState.freeAgents
    .filter(player => player && !player.pendingAgreement)
    .filter(player => canCpuFreeAgentSignToday(player))
    .sort((a, b) => {
      const salaryDifference = getFreeAgentExpectedSalary(b) - getFreeAgentExpectedSalary(a);

      if (salaryDifference !== 0) return salaryDifference;

      return Number(b.currentAbility || 0) - Number(a.currentAbility || 0);
    });
}

function getCpuTeamsWithRosterRoom() {
  if (!gameState || !Array.isArray(gameState.teams)) return [];

  return gameState.teams.filter(team => {
    if (!team) return false;
    if (Number(team.id) === Number(gameState.selectedTeamId)) return false;

    const rosterCount = getRosterCount(team.id);
    return rosterCount < MAX_ROSTER_SIZE;
  });
}

function getCpuTeamFreeAgencyFitScore(team, player) {
  if (!team || !player) return -999;

  const roster = getRosterByTeamId(team.id);
  const needs = getRosterPositionNeeds(roster);
  const positionNeed = needs[player.primaryPosition] || 0;

  const capSpace = getCapSpace(team.id);
  const salary = getFreeAgentExpectedSalary(player);
  const ability = Number(player.currentAbility || 0);
  const teamStrength = getTeamStrength(team);

  let score = 0;

  score += positionNeed * 22;
  score += ability / 16;

  if (capSpace >= salary) score += 15;
  if (capSpace < salary) score -= 10;

  // Older players prefer better teams.
  if (Number(player.age || 0) >= 30 && teamStrength >= 600) score += 12;

  // Young upside players make sense for weaker teams.
  if (Number(player.age || 0) <= 24 && teamStrength < 540) score += 8;

  // Avoid CPU teams hoarding too many players.
  score -= Math.max(0, getRosterCount(team.id) - 13) * 10;

  score += randomInt(-8, 8);

  return score;
}

function findBestCpuFreeAgencyTeamForPlayer(player) {
  const teams = getCpuTeamsWithRosterRoom();

  if (teams.length === 0) return null;

  let bestTeam = null;
  let bestScore = -999;

  for (let team of teams) {
    const score = getCpuTeamFreeAgencyFitScore(team, player);

    if (score > bestScore) {
      bestScore = score;
      bestTeam = team;
    }
  }

  return bestTeam;
}

function getCpuFreeAgentContractOffer(player) {
  const baseSalary = getFreeAgentExpectedSalary(player);
  const baseYears = getFreeAgentExpectedYears(player);
  const tier = getFreeAgentMarketTier(player);
  const dayNumber = getFreeAgencyMarketDayNumber();

  let salaryMultiplier = 1;

  if (tier === "star") salaryMultiplier = 1.02 + Math.random() * 0.12;
  if (tier === "starter") salaryMultiplier = 0.96 + Math.random() * 0.12;
  if (tier === "rotation") salaryMultiplier = 0.88 + Math.random() * 0.15;
  if (tier === "depth") salaryMultiplier = 0.75 + Math.random() * 0.18;

  // Players get cheaper later in free agency.
  if (isFreeAgencySigningPeriod() && dayNumber > 20) {
    salaryMultiplier -= 0.08;
  }

  const salary = Math.max(1, Number((baseSalary * salaryMultiplier).toFixed(1)));

  let years = baseYears;

  if (tier === "depth") years = Math.min(years, 2);
  if (tier === "rotation" && Math.random() < 0.5) years = Math.min(years, 3);

  return {
    salary,
    years: Math.max(1, Math.min(5, Number(years || 1)))
  };
}

function createCpuPendingFreeAgencyAgreement(player, team, salary, years) {
  ensureFreeAgencyAgreementLists();

  const agreement = {
    id: `cpu-agreement-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    seasonLabel: gameState.seasonLabel,
    date: formatDate(gameState.currentDate),
    playerId: player.id || player.playerId,
    playerName: player.name,
    teamId: team.id,
    teamName: team.name,
    salary,
    years,
    totalValue: salary * years,
    type: "CPU Verbal Agreement",
    status: "pending",
    rolePromise: getExpectedFreeAgentRole(player),
    minutesPromise: getExpectedFreeAgentMinutes(player),
    optionalPromise: "None"
  };

  gameState.pendingFreeAgencyAgreements.push(agreement);

  player.pendingAgreement = true;
  player.pendingAgreementId = agreement.id;
  player.pendingTeamId = team.id;
  player.pendingTeamName = team.name;
  player.pendingSalary = salary;
  player.pendingYears = years;

recordFreeAgentAgreementTransaction(player, team, salary, years);

  return agreement;
}

function finalizeCpuFreeAgentSigning(player, team, salary, years) {
  if (!player || !team) return false;

  removeFreeAgentFromMarket(player);

  player.teamId = team.id;
  player.teamName = team.name;
  player.startsAsFreeAgent = false;
  player.pendingAgreement = false;
  player.pendingAgreementId = null;
  player.pendingTeamId = null;
  player.pendingTeamName = null;
  player.pendingSalary = null;
  player.pendingYears = null;

  player.contractType = "Standard";
  player.rosterContractType = "Standard";
  player.salary = salary;
  player.contractYears = years;
  player.contract = `${years} yr${years === 1 ? "" : "s"} / ${formatMoney(salary)}`;
  player.interest = "-";
  player.morale = player.morale || "Neutral";

  if (!gameState.rosters[team.id]) {
    gameState.rosters[team.id] = [];
  }

  const alreadyOnRoster = gameState.rosters[team.id].some(item =>
    Number(item.id) === Number(player.id) ||
    Number(item.playerId) === Number(player.playerId)
  );

  if (!alreadyOnRoster) {
    gameState.rosters[team.id].push(player);
  }

  normalizePlayerContract(player);

  ensureFreeAgencyAgreementLists();

  gameState.freeAgencyDeals.push({
    seasonLabel: gameState.seasonLabel,
    date: formatDate(gameState.currentDate),
    playerId: player.id || player.playerId,
    playerName: player.name,
    teamId: team.id,
    teamName: team.name,
    salary,
    years,
    totalValue: salary * years,
    type: "Signing"
  });

  recordFreeAgentSigningTransaction(player, team, salary, years);

  return true;
}

function processOneCpuFreeAgencyMove() {
  const availablePlayers = getCpuFreeAgencyAvailablePlayers();

  if (availablePlayers.length === 0) return null;

  for (let player of availablePlayers) {
    const team = findBestCpuFreeAgencyTeamForPlayer(player);

    if (!team) continue;

    const offer = getCpuFreeAgentContractOffer(player);

    if (isFreeAgencyMoratorium()) {
      const agreement = createCpuPendingFreeAgencyAgreement(player, team, offer.salary, offer.years);

          return {
  type: "agreement",
  playerName: player.name,
  teamId: team.id,
  teamName: team.name,
  salary: offer.salary,
  years: offer.years,
  tier: getFreeAgentMarketTier(player),
  agreement
};
    }

    if (isFreeAgencySigningPeriod()) {
      const signed = finalizeCpuFreeAgentSigning(player, team, offer.salary, offer.years);

      if (signed) {
        return {
  type: "signing",
  playerName: player.name,
  teamId: team.id,
  teamName: team.name,
  salary: offer.salary,
  years: offer.years,
  tier: getFreeAgentMarketTier(player)
};
      }
    }
  }

  return null;
}

function processDailyFreeAgencyMarket() {
  if (!shouldProcessDailyFreeAgencyMarket()) return;

  ensureFreeAgents();
  ensureFreeAgencyAgreementLists();

  const limit = getDailyCpuFreeAgencySigningLimit();
  const moves = [];

  for (let i = 0; i < limit; i++) {
    const move = processOneCpuFreeAgencyMove();

    if (!move) break;

    moves.push(move);
  }

  markDailyFreeAgencyMarketProcessed();

  if (moves.length === 0) return;

  const majorMoves = moves.filter(move => isMajorFreeAgencyMove(move));

  for (let move of majorMoves) {
    const title = move.type === "agreement"
      ? "Free Agency Agreement"
      : "Free Agent Signed";

    addInboxMessage(
      title,
      formatFreeAgencyMoveSentence(move),
      "free agency",
      false,
      "team-profile",
      {
        teamId: move.teamId,
        teamName: move.teamName,
        playerName: move.playerName
      }
    );
  }

  ensureRotation();
}

function isFreeAgencyMoratorium() {
  if (!gameState || !gameState.currentDate) return false;

  const key = getMonthDayKey(gameState.currentDate);

  return key >= 630 && key <= 705;
}

function isFreeAgencySigningPeriod() {
  if (!gameState || !gameState.currentDate) return false;

  const key = getMonthDayKey(gameState.currentDate);

  return key >= 706 || key <= 401;
}

function isFreeAgencyClosedPeriod() {
  return !isFreeAgencyMoratorium() && !isFreeAgencySigningPeriod();
}

function getFreeAgencyPhaseLabel() {
  if (isFreeAgencyMoratorium()) return "Moratorium";
  if (isFreeAgencySigningPeriod()) return "Signing Period";
  return "Closed";
}

function canOfficiallySignFreeAgents() {
  return isFreeAgencySigningPeriod();
}

function canNegotiateWithFreeAgents() {
  return isFreeAgencyMoratorium() || isFreeAgencySigningPeriod();
}

function getFreeAgencyWindowMessage() {
  if (isFreeAgencyMoratorium()) {
    return "Free agency moratorium is active. Accepted offers become verbal agreements until the signing period opens.";
  }

  if (isFreeAgencySigningPeriod()) {
    return "Free agency signing period is open. Accepted offers become official signings.";
  }

  return "Free agency is closed. Negotiations open June 30.";
}

function calculatePlayerInterest(player) {
  const selectedTeam = getSelectedTeam();

  if (!selectedTeam || !player) return "Neutral";

  const rosterCount = getRosterCount(selectedTeam.id);
  const capSpace = getCapSpace(selectedTeam.id);
  const teamStrength = getTeamStrength(selectedTeam);
  const playerSalary = getFreeAgentExpectedSalary(player);

  let score = 3;

  if (capSpace >= playerSalary) score++;
  if (capSpace < playerSalary) score--;

  if (rosterCount < 14) score++;
  if (rosterCount >= 15) score -= 2;

  if (teamStrength >= 650 && player.age >= 30) score++;
  if (teamStrength < 500 && player.age >= 32) score--;

  if (player.currentAbility >= 625 && teamStrength < 470) score--;

  score = clamp(score, 1, 5);

  if (score >= 5) return "Very Interested";
  if (score === 4) return "Interested";
  if (score === 3) return "Neutral";
  if (score === 2) return "Low Interest";
  return "Not Interested";
}

function updateFreeAgentInterest() {
  if (!gameState.freeAgents) return;

  for (let player of gameState.freeAgents) {
    player.interest = calculatePlayerInterest(player);
  }
}

function ensureFreeAgents() {
  if (!gameState.freeAgents) {
    gameState.freeAgents = [];
  }

  if (
  gameState.freeAgents.length === 0 &&
  typeof fixedFreeAgentDatabase !== "undefined" &&
  fixedFreeAgentDatabase.length > 0
) {
    gameState.freeAgents = createFixedFreeAgents();
  }

  for (let player of gameState.freeAgents) {
  player.teamId = null;
  player.teamName = "Free Agent";
  normalizePlayerContract(player);
  ensureFreeAgentMarketExpectations(player);
  }

  updateFreeAgentInterest();
}

const fixedFreeAgentDatabase = [];

function createGeneratedFreeAgent(isReplacement = false) {
  const age = isReplacement ? randomInt(19, 23) : randomInt(24, 35);
  const player = generatePlayer(null, age, isReplacement ? "development" : "freeAgent");

  player.teamId = null;
  player.teamName = "Free Agent";
  player.morale = "Available";

  if (isReplacement) {
    softenPlayerForReplacementPool(player);
  } else {
    softenPlayerForStartingFreeAgentPool(player);
  }

  player.currentAbility = calculateAbility(player.attributes);
  player.potentialAbility = calculateAbility(player.potentialAttributes);
  player.mediaDescription = getMediaDescription(player.currentAbility);
  player.projectedCeiling = getProjectedCeilingLabel(player.potentialAbility);
  player.playerType = determinePlayerType(player);
  player.seasonStats = createEmptySeasonStats();

  assignContractValues(player, {
    makeContract: false
  });

  player.salary = 0;
  player.contractYears = 0;
  player.contract = "Free Agent";
  player.contractType = "Free Agent";
  player.interest = "Neutral";

  return player;
}

function softenPlayerForStartingFreeAgentPool(player) {
  for (let key in player.attributes) {
    if (player.attributes[key] > 13) {
      player.attributes[key] = randomInt(8, 13);
    }
  }

  for (let key in player.potentialAttributes) {
    if (player.potentialAttributes[key] > 15) {
      player.potentialAttributes[key] = randomInt(10, 15);
    }
  }
}

function softenPlayerForReplacementPool(player) {
  for (let key in player.attributes) {
    if (player.attributes[key] > 12) {
      player.attributes[key] = randomInt(6, 12);
    }
  }

  for (let key in player.potentialAttributes) {
    if (player.potentialAttributes[key] < player.attributes[key]) {
      player.potentialAttributes[key] = player.attributes[key];
    }

    if (player.potentialAttributes[key] > 17) {
      player.potentialAttributes[key] = randomInt(11, 17);
    }
  }
}

function getAllPlayersIncludingFreeAgents() {
  const players = [];

  for (let teamId in gameState.rosters) {
    for (let player of gameState.rosters[teamId]) {
      players.push({
        player,
        teamId: Number(teamId),
        team: getTeamById(Number(teamId))
      });
    }
  }

  if (gameState.freeAgents) {
    for (let player of gameState.freeAgents) {
      players.push({
        player,
        teamId: null,
        team: null
      });
    }
  }

  return players;
}

function findPlayerById(playerId) {
  if (!gameState || !gameState.rosters) return null;

  const targetId = Number(playerId);

  for (let teamId in gameState.rosters) {
    const player = gameState.rosters[teamId].find(item =>
      Number(item.id) === targetId ||
      Number(item.playerId) === targetId
    );

    if (player) {
      return {
        player,
        teamId: Number(teamId),
        team: getTeamById(Number(teamId)),
        freeAgent: false
      };
    }
  }

  if (gameState.freeAgents) {
    const freeAgent = gameState.freeAgents.find(item =>
      Number(item.id) === targetId ||
      Number(item.playerId) === targetId
    );

    if (freeAgent) {
      return {
        player: freeAgent,
        teamId: null,
        team: null,
        freeAgent: true
      };
    }
  }

  return null;
}


function findBestFreeAgentIndexForTeam(teamId) {
  const roster = getRosterByTeamId(teamId);
  const positionNeeds = getRosterPositionNeeds(roster);

  let bestIndex = -1;
  let bestScore = -999;

  for (let i = 0; i < gameState.freeAgents.length; i++) {
    const player = gameState.freeAgents[i];
    const needScore = positionNeeds[player.primaryPosition] || 0;
    const abilityScore = (player.currentAbility || 0) / 100;
    const salaryPenalty = getFreeAgentExpectedSalary(player) / 20;

    const score = needScore + abilityScore - salaryPenalty;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function getRosterPositionNeeds(roster) {
  const counts = {
    PG: 0,
    SG: 0,
    SF: 0,
    PF: 0,
    C: 0
  };

  for (let player of roster) {
    if (counts[player.primaryPosition] !== undefined) {
      counts[player.primaryPosition]++;
    }
  }

  return {
    PG: Math.max(0, 3 - counts.PG),
    SG: Math.max(0, 3 - counts.SG),
    SF: Math.max(0, 3 - counts.SF),
    PF: Math.max(0, 3 - counts.PF),
    C: Math.max(0, 3 - counts.C)
  };
}

function setFreeAgencyPositionFromDropdown() {
  const element = document.getElementById("fa-position-filter");

  freeAgencyPositionFilter = element ? element.value : "ALL";
  selectedFreeAgentPanelPlayerId = null;

  displayFreeAgency();
}

function setFreeAgencyPositionFilter(position) {
  freeAgencyPositionFilter = position || "ALL";

  const dropdown = document.getElementById("fa-position-filter");

  if (dropdown) {
    dropdown.value = freeAgencyPositionFilter;
  }

  selectedFreeAgentPanelPlayerId = null;
  displayFreeAgency();
}

function sortFreeAgents(key) {
  if (freeAgencySortKey === key) {
    freeAgencySortDirection = freeAgencySortDirection === "desc" ? "asc" : "desc";
  } else {
    freeAgencySortKey = key;
    freeAgencySortDirection = key === "name" ? "asc" : "desc";
  }

  displayFreeAgency();
}

function getFreeAgencyTypeFilterValue() {
  const element = document.getElementById("fa-type-filter");
  return element ? element.value : "ALL";
}

function getFreeAgencyAgeFilterValue() {
  const element = document.getElementById("fa-age-filter");
  return element ? element.value : "ALL";
}

function getFreeAgencySearchText() {
  const element = document.getElementById("fa-search-input");
  return element ? element.value.trim().toLowerCase() : "";
}

function setFreeAgencySortFromDropdown() {
  const element = document.getElementById("fa-sort-filter");
  const value = element ? element.value : "salary-desc";

  const parts = value.split("-");
  freeAgencySortKey = parts[0] || "salary";
  freeAgencySortDirection = parts[1] || "desc";

  selectedFreeAgentPanelPlayerId = null;
  displayFreeAgency();
}

function getFreeAgentContractTypeLabel(player) {
  return player.contractType || player.freeAgentType || "Unrestricted";
}

function getFreeAgentMarketLabel(player) {
  const interest = String(player.interest || "Neutral");

  if (interest === "Very Interested") return "Open";
  if (interest === "Interested") return "Active";
  if (interest === "Neutral") return "Watching";
  if (interest === "Low Interest") return "Quiet";

  return "Cold";
}

function getFreeAgentInterestClass(player) {
  const interest = String(player.interest || "Neutral");

  if (interest === "Very Interested" || interest === "Interested") return "interest-good";
  if (interest === "Neutral") return "interest-medium";
  return "interest-low";
}

function getFreeAgentInterestPercent(player) {
  const interest = String(player.interest || "Neutral");

  if (interest === "Very Interested") return 88;
  if (interest === "Interested") return 72;
  if (interest === "Neutral") return 55;
  if (interest === "Low Interest") return 34;
  return 15;
}

const FREE_AGENT_SALARY_MODEL_VERSION = 2;
const FREE_AGENT_MINIMUM_SALARY = 1;
const FREE_AGENT_MAX_SALARY = 65;

// Training camp starts September 25.
// After this, unsigned free agents lower their asking price every day.
const FREE_AGENT_TRAINING_CAMP_MONTH = 8; // September, because JS months are 0-indexed
const FREE_AGENT_TRAINING_CAMP_DAY = 25;

function roundFreeAgentSalary(value) {
  return Number((Math.round(Number(value || 0) * 10) / 10).toFixed(1));
}

function clampFreeAgentValue(value, min, max) {
  if (typeof clamp === "function") {
    return clamp(value, min, max);
  }

  return Math.max(min, Math.min(max, value));
}

function getFreeAgentCurrentAbility(player) {
  if (!player) return 0;

  const ability = Number(
    player.currentAbility ||
    player.CurrentAbility ||
    player.overall ||
    player.rating ||
    0
  );

  if (ability > 0) return ability;

  if (player.attributes && typeof calculateAbility === "function") {
    return calculateAbility(player.attributes);
  }

  return 450;
}

function getFreeAgentPotentialAbility(player) {
  if (!player) return getFreeAgentCurrentAbility(player);

  const potential = Number(
    player.potentialAbility ||
    player.PotentialAbility ||
    player.potential ||
    0
  );

  return potential > 0 ? potential : getFreeAgentCurrentAbility(player);
}

function getFreeAgentStatsPerGame(player) {
  const stats = player && player.seasonStats ? player.seasonStats : {};
  const games = Math.max(1, Number(stats.games || stats.gamesPlayed || 0));

  return {
    games,
    mpg: Number(stats.minutes || 0) ? Number(stats.minutes || 0) / games : 0,
    ppg: Number(stats.points || 0) ? Number(stats.points || 0) / games : 0,
    rpg: Number(stats.rebounds || 0) ? Number(stats.rebounds || 0) / games : 0,
    apg: Number(stats.assists || 0) ? Number(stats.assists || 0) / games : 0,
    spg: Number(stats.steals || 0) ? Number(stats.steals || 0) / games : 0,
    bpg: Number(stats.blocks || 0) ? Number(stats.blocks || 0) / games : 0
  };
}

function getFreeAgentMarketProfile(player) {
  const current = getFreeAgentCurrentAbility(player);
  const potential = getFreeAgentPotentialAbility(player);
  const age = Number(player?.age || 25);
  const stats = getFreeAgentStatsPerGame(player);

  let marketScore = current;

  // Stats matter, but ability still leads the system.
  if (stats.games >= 1) {
    marketScore += stats.ppg * 3.8;
    marketScore += stats.apg * 3.0;
    marketScore += stats.rpg * 1.2;
    marketScore += stats.spg * 5.0;
    marketScore += stats.bpg * 5.0;
  }

  // Young upside gets paid.
  if (age <= 24) {
    marketScore += Math.max(0, potential - current) * 0.18;
  }

  // Older non-stars lose market power.
  if (age >= 33 && current < 650) {
    marketScore -= (age - 32) * 10;
  }

  if (marketScore >= 760) {
    return {
      tier: "superstar",
      label: "Max Contract",
      score: marketScore,
      scoreMin: 760,
      scoreMax: 840,
      salaryMin: 56,
      salaryMax: 65
    };
  }

  if (marketScore >= 700) {
    return {
      tier: "allStar",
      label: "All-Star Money",
      score: marketScore,
      scoreMin: 700,
      scoreMax: 759,
      salaryMin: 43,
      salaryMax: 55
    };
  }

  if (marketScore >= 650) {
    return {
      tier: "highStarter",
      label: "High-End Starter",
      score: marketScore,
      scoreMin: 650,
      scoreMax: 699,
      salaryMin: 30,
      salaryMax: 42
    };
  }

  if (marketScore >= 595) {
    return {
      tier: "starter",
      label: "Starter Money",
      score: marketScore,
      scoreMin: 595,
      scoreMax: 649,
      salaryMin: 18,
      salaryMax: 28
    };
  }

  if (marketScore >= 530) {
    return {
      tier: "rotation",
      label: "Rotation Money",
      score: marketScore,
      scoreMin: 530,
      scoreMax: 594,
      salaryMin: 8,
      salaryMax: 16
    };
  }

  if (marketScore >= 470) {
    return {
      tier: "bench",
      label: "Bench Money",
      score: marketScore,
      scoreMin: 470,
      scoreMax: 529,
      salaryMin: 3,
      salaryMax: 8
    };
  }

  return {
    tier: "minimum",
    label: "Minimum",
    score: marketScore,
    scoreMin: 350,
    scoreMax: 469,
    salaryMin: 1,
    salaryMax: 3
  };
}

function scaleFreeAgentSalary(profile) {
  const range = Math.max(1, profile.scoreMax - profile.scoreMin);
  const progress = clampFreeAgentValue((profile.score - profile.scoreMin) / range, 0, 1);

  return profile.salaryMin + (profile.salaryMax - profile.salaryMin) * progress;
}

function estimateModernFreeAgentOpeningSalary(player) {
  const profile = getFreeAgentMarketProfile(player);
  const current = getFreeAgentCurrentAbility(player);
  const potential = getFreeAgentPotentialAbility(player);
  const age = Number(player?.age || 25);
  const stats = getFreeAgentStatsPerGame(player);

  let salary = scaleFreeAgentSalary(profile);

  // Upside tax for young free agents.
  if (age <= 24 && potential - current >= 70) {
    salary += 3;
  } else if (age <= 24 && potential - current >= 40) {
    salary += 1.5;
  }

  // Productive veterans can still get paid, but years will be shorter.
  if (age >= 33 && !["superstar", "allStar"].includes(profile.tier)) {
    salary *= 0.82;
  }

  if (age >= 36 && !["superstar", "allStar"].includes(profile.tier)) {
    salary *= 0.72;
  }

  // Low-minute players should not ask like full starters.
  if (stats.games >= 10 && stats.mpg > 0 && stats.mpg < 12 && current < 600) {
    salary = Math.min(salary, 6);
  }

  // Realistic ceiling/floor.
  salary = clampFreeAgentValue(salary, FREE_AGENT_MINIMUM_SALARY, FREE_AGENT_MAX_SALARY);

  return roundFreeAgentSalary(salary);
}

function estimateModernFreeAgentExpectedYears(player) {
  const profile = getFreeAgentMarketProfile(player);
  const age = Number(player?.age || 25);

  let years = 1;

  if (profile.tier === "superstar") years = age <= 31 ? 5 : 3;
  else if (profile.tier === "allStar") years = age <= 31 ? 4 : 3;
  else if (profile.tier === "highStarter") years = age <= 30 ? 4 : 2;
  else if (profile.tier === "starter") years = age <= 31 ? 3 : 2;
  else if (profile.tier === "rotation") years = age <= 30 ? 3 : 2;
  else if (profile.tier === "bench") years = 1;
  else years = 1;

  // Once training camp is going, long-term security gets harder for unsigned guys.
  const campDays = getFreeAgencyTrainingCampDaysPassed();

  if (campDays >= 35) {
    years = Math.min(years, 1);
  } else if (campDays >= 20) {
    years = Math.min(years, 2);
  }

  return Math.max(1, Math.min(5, Number(years || 1)));
}

function getFreeAgencyTrainingCampStartDate() {
  if (!gameState || !gameState.currentDate) return null;

  const current = new Date(gameState.currentDate);
  current.setHours(0, 0, 0, 0);

  // If it is Jan-April, use the previous September's camp.
  // If it is June-August, camp has not started yet.
  const campYear = current.getMonth() <= 3
    ? current.getFullYear() - 1
    : current.getFullYear();

  const campDate = new Date(
    campYear,
    FREE_AGENT_TRAINING_CAMP_MONTH,
    FREE_AGENT_TRAINING_CAMP_DAY
  );

  campDate.setHours(0, 0, 0, 0);

  return campDate;
}

function getFreeAgencyTrainingCampDaysPassed() {
  if (!gameState || !gameState.currentDate) return 0;

  const current = new Date(gameState.currentDate);
  current.setHours(0, 0, 0, 0);

  const campDate = getFreeAgencyTrainingCampStartDate();

  if (!campDate || current < campDate) return 0;

  const oneDay = 1000 * 60 * 60 * 24;

  // +1 means the first reduction starts on training camp day.
  return Math.max(0, Math.floor((current - campDate) / oneDay) + 1);
}

function getFreeAgentTrainingCampDailyDrop(openingSalary) {
  const salary = Number(openingSalary || 1);

  if (salary >= 55) return 1.8;
  if (salary >= 42) return 1.4;
  if (salary >= 28) return 1.0;
  if (salary >= 18) return 0.75;
  if (salary >= 8) return 0.4;
  if (salary >= 3) return 0.2;

  return 0.1;
}

function getTrainingCampDiscountedFreeAgentSalary(player, openingSalary) {
  const base = Number(openingSalary || FREE_AGENT_MINIMUM_SALARY);
  const campDays = getFreeAgencyTrainingCampDaysPassed();

  if (campDays <= 0) {
    return roundFreeAgentSalary(base);
  }

  const dailyDrop = getFreeAgentTrainingCampDailyDrop(base);
  const discounted = base - dailyDrop * campDays;

  return roundFreeAgentSalary(
    Math.max(FREE_AGENT_MINIMUM_SALARY, discounted)
  );
}

function ensureFreeAgentMarketExpectations(player) {
  if (!player) return;

  const seasonKey = gameState?.seasonLabel || gameState?.seasonStartYear || "default";

  const needsNewModel =
    player.freeAgencySalaryModelVersion !== FREE_AGENT_SALARY_MODEL_VERSION ||
    player.freeAgencySalarySeasonKey !== seasonKey ||
    !Number(player.freeAgencyOpeningExpectedSalary);

  if (needsNewModel) {
    player.freeAgencyOpeningExpectedSalary = estimateModernFreeAgentOpeningSalary(player);
    player.freeAgencyOpeningExpectedYears = estimateModernFreeAgentExpectedYears(player);
    player.freeAgencySalaryModelVersion = FREE_AGENT_SALARY_MODEL_VERSION;
    player.freeAgencySalarySeasonKey = seasonKey;
  }

  const openingSalary = Number(
    player.freeAgencyOpeningExpectedSalary ||
    estimateModernFreeAgentOpeningSalary(player) ||
    FREE_AGENT_MINIMUM_SALARY
  );

  player.expectedSalary = getTrainingCampDiscountedFreeAgentSalary(player, openingSalary);
  player.expectedYears = estimateModernFreeAgentExpectedYears(player);
}

function getFreeAgentExpectedSalary(player) {
  if (!player) return FREE_AGENT_MINIMUM_SALARY;

  ensureFreeAgentMarketExpectations(player);

  return Number(player.expectedSalary || FREE_AGENT_MINIMUM_SALARY);
}

function getFreeAgentExpectedYears(player) {
  if (!player) return 1;

  ensureFreeAgentMarketExpectations(player);

  return Number(player.expectedYears || 1);
}

function getFilteredFreeAgentsForMarket() {
  if (!gameState || !Array.isArray(gameState.freeAgents)) return [];

  freeAgencyTypeFilter = getFreeAgencyTypeFilterValue();
  freeAgencyAgeFilter = getFreeAgencyAgeFilterValue();
  freeAgencySearchText = getFreeAgencySearchText();

  let freeAgents = [...gameState.freeAgents];

  freeAgents = freeAgents.filter(player => !player.pendingAgreement);

  if (freeAgencyPositionFilter !== "ALL") {
    freeAgents = freeAgents.filter(player => player.primaryPosition === freeAgencyPositionFilter);
  }

  if (freeAgencyTypeFilter !== "ALL") {
    freeAgents = freeAgents.filter(player =>
      getFreeAgentContractTypeLabel(player) === freeAgencyTypeFilter
    );
  }

  if (freeAgencyAgeFilter === "24") {
    freeAgents = freeAgents.filter(player => Number(player.age || 0) <= 24);
  }

  if (freeAgencyAgeFilter === "29") {
    freeAgents = freeAgents.filter(player => Number(player.age || 0) >= 25 && Number(player.age || 0) <= 29);
  }

  if (freeAgencyAgeFilter === "30") {
    freeAgents = freeAgents.filter(player => Number(player.age || 0) >= 30);
  }

  if (freeAgencySearchText) {
    freeAgents = freeAgents.filter(player =>
      String(player.name || "").toLowerCase().includes(freeAgencySearchText) ||
      String(player.primaryPosition || "").toLowerCase().includes(freeAgencySearchText) ||
      String(player.mediaDescription || "").toLowerCase().includes(freeAgencySearchText)
    );
  }

  freeAgents.sort((a, b) => compareFreeAgents(a, b));

  return freeAgents;
}

function selectFreeAgentForPanel(playerId) {
  selectedFreeAgentPanelPlayerId = Number(playerId);
  displayFreeAgencySelectedPlayerPanel();
  displayFreeAgency();
}

function getFreeAgentByIdFromMarket(playerId) {
  if (!gameState || !Array.isArray(gameState.freeAgents)) return null;

  return gameState.freeAgents.find(player =>
    Number(player.id) === Number(playerId) ||
    Number(player.playerId) === Number(playerId)
  ) || null;
}

function displayFreeAgency() {
  const table = document.getElementById("free-agency-table");
  if (!table) return;

  ensureFreeAgents();
  updateFreeAgentInterest();

  const selectedTeam = getSelectedTeam();
  const status = getFreeAgencyStatusText();
  const open = canNegotiateWithFreeAgents();

  if (!selectedTeam) return;

  setText("free-agency-status", status);
  setText("free-agency-period-label", getSeasonPhase());
  setText("free-agency-window-message", getFreeAgencyWindowMessage());

  const rosterStatus = getTeamRosterStatus(selectedTeam.id);
  setText("free-agency-roster-count", `${rosterStatus.standardCount} / ${rosterStatus.maxStandard}`);

  const payroll = getRosterPayroll(selectedTeam.id);
  const capSpace = getCapSpace(selectedTeam.id);

  setText("free-agency-payroll", formatMoney(payroll));
  setText("free-agency-cap-space", formatMoney(capSpace));
  setText("free-agency-cap-status", capSpace >= 0 ? "Available" : "Over the cap");

  setText("free-agency-top-need", "Point Guard");

  const statusElement = document.getElementById("free-agency-status");

  if (statusElement) {
    statusElement.classList.remove("free-agent-open", "free-agent-closed", "free-agent-unavailable");

    if (open) {
      statusElement.classList.add("free-agent-open");
    } else {
      statusElement.classList.add("free-agent-closed");
    }
  }

  const freeAgents = getFilteredFreeAgentsForMarket();

  if (!selectedFreeAgentPanelPlayerId && freeAgents.length > 0) {
    selectedFreeAgentPanelPlayerId = Number(freeAgents[0].id || freeAgents[0].playerId);
  }

  table.innerHTML = "";

  if (freeAgents.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="10">No free agents match the current filters.</td>
      </tr>
    `;

    displayFreeAgencySelectedPlayerPanel();
    displayFreeAgencyBottomPanels();
    return;
  }

  for (let player of freeAgents) {
    const canNegotiate = open && canUserSignStandardPlayer();
    const playerId = player.id || player.playerId;
    const selectedClass = Number(playerId) === Number(selectedFreeAgentPanelPlayerId) ? "selected" : "";
    const expectedSalary = getFreeAgentExpectedSalary(player);
    const expectedYears = getFreeAgentExpectedYears(player);

    const row = document.createElement("tr");
    row.className = selectedClass;
    row.onclick = function() {
      selectFreeAgentForPanel(playerId);
    };

    row.innerHTML = `
      <td>
        <button
          type="button"
          class="fa-player-name-button"
          onclick="event.stopPropagation(); openPlayerProfile('${playerId}')"
        >
          ${player.name}
        </button>
      </td>
      <td>${player.primaryPosition || "--"}</td>
      <td>${player.age || "--"}</td>
      <td>${player.mediaDescription || "Unknown"}</td>
      <td>${getFreeAgentContractTypeLabel(player)}</td>
      <td>${formatMoney(expectedSalary)}</td>
      <td>${expectedYears}</td>
      <td>
        <span class="fa-interest-pill ${getFreeAgentInterestClass(player)}">
          ${player.interest || "Neutral"}
        </span>
      </td>
      <td>${getFreeAgentMarketLabel(player)}</td>
      <td>
        <button
          class="negotiation-button"
          onclick="event.stopPropagation(); openFreeAgentOffer('${playerId}')"
          ${canNegotiate ? "" : "disabled"}
        >
          Negotiate
        </button>
      </td>
    `;

    table.appendChild(row);
  }

  displayFreeAgencySelectedPlayerPanel();
  displayFreeAgencyBottomPanels();
}

function displayFreeAgencySelectedPlayerPanel() {
  const panel = document.getElementById("free-agency-selected-player-panel");
  const selectedTeam = getSelectedTeam();

  if (!panel || !selectedTeam) return;

  const player = getFreeAgentByIdFromMarket(selectedFreeAgentPanelPlayerId);

  if (!player) {
    panel.innerHTML = `
      <div class="fa-panel-empty">
        Select a free agent to view market details.
      </div>
    `;
    return;
  }

  const expectedSalary = getFreeAgentExpectedSalary(player);
  const expectedYears = getFreeAgentExpectedYears(player);
  const interestPercent = getFreeAgentInterestPercent(player);
  const capSpaceAfter = getCapSpace(selectedTeam.id) - expectedSalary;
  const canNegotiate = canNegotiateWithFreeAgents() && canUserSignStandardPlayer();

  panel.innerHTML = `
    <div class="fa-selected-player-top">
      ${renderFreeAgencyPlayerFaceHTML(player, "fa-player-silhouette")}

      <div>
        <span>${player.primaryPosition || "--"} · Age ${player.age || "--"}</span>
        <h3>${player.name}</h3>
        <p>${player.playerType || "Free Agent"}</p>
      </div>

      <div class="fa-interest-circle">
        <strong>${interestPercent}%</strong>
        <span>Interest</span>
      </div>
    </div>

    <div class="fa-selected-player-info-grid">
      <div>
        <span>Media Reputation</span>
        <strong>${player.mediaDescription || "Unknown"}</strong>
      </div>

      <div>
        <span>Projected Ceiling</span>
        <strong>${player.projectedCeiling || "Unknown"}</strong>
      </div>

      <div>
        <span>Asking Price</span>
        <strong>${formatMoney(expectedSalary)} / year</strong>
      </div>

      <div>
        <span>Expected Years</span>
        <strong>${expectedYears}</strong>
      </div>

      <div>
        <span>Interest In Your Team</span>
        <strong class="${getFreeAgentInterestClass(player)}">${player.interest || "Neutral"}</strong>
      </div>

      <div>
        <span>Market Status</span>
        <strong>${getFreeAgentMarketLabel(player)}</strong>
      </div>
    </div>

    <div class="fa-player-panel-section">
      <h4>Fit With Team</h4>
      <strong>Good</strong>
      <p>${player.name} is asking for a deal that reflects their current market reputation, age, and expected role.</p>
    </div>

    <div class="fa-player-panel-section">
      <h4>Financial Outlook</h4>

      <div class="fa-financial-lines">
        <span>Cap Space Now</span>
        <strong>${formatMoney(getCapSpace(selectedTeam.id))}</strong>

        <span>Cap Space After</span>
        <strong class="${capSpaceAfter < 0 ? "interest-low" : "interest-good"}">${formatMoney(capSpaceAfter)}</strong>

        <span>Roster Spots</span>
        <strong>${getTeamRosterStatus(selectedTeam.id).standardCount} / ${getTeamRosterStatus(selectedTeam.id).maxStandard}</strong>
      </div>
    </div>

    <button
      type="button"
      class="fa-main-negotiate-button"
      onclick="openFreeAgentOffer('${player.id || player.playerId}')"
      ${canNegotiate ? "" : "disabled"}
    >
      Negotiate
    </button>
  `;
}

function getFreeAgencyPlayerImagePath(player, useDefault = true) {
  const imagePath = typeof getPlayerPortraitPath === "function"
    ? getPlayerPortraitPath(player)
    : (player?.portrait || player?.faceImage || player?.image || player?.imagePath || player?.imageUrl || player?.photo || player?.photoPath || player?.headshot || "");

  if (imagePath) {
    return typeof normalizePlayerPortraitPath === "function"
      ? normalizePlayerPortraitPath(imagePath)
      : imagePath;
  }

  return useDefault ? "images/players/default-silhouette.png" : "";
}

function escapeFreeAgencyImageAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("`", "&#096;");
}

function renderFreeAgencyPlayerFaceHTML(player, className) {
  if (typeof getPlayerFaceHTML === "function") {
    return getPlayerFaceHTML(player, className);
  }

  const imagePath = getFreeAgencyPlayerImagePath(player, false);

  if (!imagePath) {
    return `<div class="${className} player-silhouette"></div>`;
  }

  return `
    <div class="${className}">
      <img src="${escapeFreeAgencyImageAttr(imagePath)}" alt="${escapeFreeAgencyImageAttr(player?.name || "Player")}" onerror="this.parentElement.classList.add('player-silhouette'); this.remove();">
    </div>
  `;
}

function displayFreeAgencyBottomPanels() {
  displayFreeAgencyTopAvailable();
  displayFreeAgencyMarketBuzz();
  displayFreeAgencyBiggestDeals();
}

function displayFreeAgencyTopAvailable() {
  const container = document.getElementById("free-agency-top-available-list");
  if (!container || !gameState || !Array.isArray(gameState.freeAgents)) return;

  const topPlayers = [...gameState.freeAgents]
    .filter(player => !player.pendingAgreement)
    .sort((a, b) => getFreeAgentExpectedSalary(b) - getFreeAgentExpectedSalary(a))
    .slice(0, 3);

  if (topPlayers.length === 0) {
    container.innerHTML = `<div class="fa-mini-empty">No free agents available.</div>`;
    return;
  }

  container.innerHTML = topPlayers.map(player => `
    <button type="button" class="fa-mini-player-row" onclick="selectFreeAgentForPanel('${player.id || player.playerId}')">
      <span>${player.name}</span>
      <em>${player.primaryPosition || "--"}</em>
      <strong>${formatMoney(getFreeAgentExpectedSalary(player))}</strong>
    </button>
  `).join("");
}

function displayFreeAgencyMarketBuzz() {
  const container = document.getElementById("free-agency-market-buzz-list");
  if (!container) return;

  container.innerHTML = `
    <div class="fa-buzz-item">
      <strong>Market Watch</strong>
      <p>Teams are monitoring guard depth and veteran shooters.</p>
    </div>

    <div class="fa-buzz-item">
      <strong>Front Office Note</strong>
      <p>Several players are waiting for larger offers before committing.</p>
    </div>

    <div class="fa-buzz-item">
      <strong>League Buzz</strong>
      <p>Cap space teams may control the early market.</p>
    </div>
  `;
}

function getFreeAgencyDealsForCurrentCycle() {
  if (!gameState) return [];

  if (!Array.isArray(gameState.freeAgencyDeals)) {
    gameState.freeAgencyDeals = [];
  }

  return gameState.freeAgencyDeals.filter(deal =>
    deal.seasonLabel === gameState.seasonLabel
  );
}

function displayFreeAgencyBiggestDeals() {
  const container = document.getElementById("free-agency-biggest-deals-list");
  if (!container) return;

  const deals = getFreeAgencyDealsForCurrentCycle()
    .sort((a, b) => Number(b.totalValue || 0) - Number(a.totalValue || 0))
    .slice(0, 3);

  const officialDeals = getFreeAgencyDealsForCurrentCycle();
  const pendingAgreements = getPendingFreeAgencyAgreementsForCurrentCycle();

setText("free-agency-recap-main", `${officialDeals.length} Signings`);
setText("free-agency-recap-sub", `${pendingAgreements.length} agreement${pendingAgreements.length === 1 ? "" : "s"} · 0 trades`);

if (deals.length === 0 && pendingAgreements.length > 0) {
  container.innerHTML = pendingAgreements.slice(0, 3).map(agreement => `
    <div class="fa-mini-deal-row pending">
      <span>${agreement.playerName}</span>
      <em>${agreement.teamName}</em>
      <strong>Pending · ${agreement.years} yrs / ${formatMoney(agreement.salary)}</strong>
    </div>
  `).join("");

  return;
}
  if (deals.length === 0) {
    container.innerHTML = `
      <div class="fa-mini-empty">
        No deals completed this offseason.
      </div>
    `;
    return;
  }

  container.innerHTML = deals.map(deal => `
    <div class="fa-mini-deal-row">
      <span>${deal.playerName}</span>
      <em>${deal.teamName}</em>
      <strong>${deal.years} yrs / ${formatMoney(deal.salary)}</strong>
    </div>
  `).join("");
}

function showFreeAgencyDealsList() {
  const deals = getFreeAgencyDealsForCurrentCycle();

  if (deals.length === 0) {
    addInboxMessage(
      "Free Agency Deals",
      "No free agency deals have been completed yet this offseason.",
      "staff"
    );
    refreshAll();
    return;
  }

  addInboxMessage(
    "Free Agency Deals",
    `${deals.length} deal${deals.length === 1 ? "" : "s"} have been completed this offseason.`,
    "staff"
  );

  refreshAll();
}

function compareFreeAgents(a, b) {
  let aValue = getFreeAgentSortValue(a, freeAgencySortKey);
  let bValue = getFreeAgentSortValue(b, freeAgencySortKey);

  if (typeof aValue === "string") {
    return freeAgencySortDirection === "desc"
      ? bValue.localeCompare(aValue)
      : aValue.localeCompare(bValue);
  }

  return freeAgencySortDirection === "desc"
    ? bValue - aValue
    : aValue - bValue;
}

function getFreeAgentSortValue(player, key) {
  if (key === "name") return player.name;
  if (key === "age") return player.age;
  if (key === "position") return player.primaryPosition;
  if (key === "type") return player.playerType;
  if (key === "level") return player.currentAbility || 0;
  if (key === "ceiling") return player.potentialAbility || 0;
  if (key === "salary") return getFreeAgentExpectedSalary(player);
  if (key === "years") return getFreeAgentExpectedYears(player);
  if (key === "interest") return interestRankings[player.interest] || 0;

  return 0;
}

function getExpectedFreeAgentRole(player) {
  const salary = getFreeAgentExpectedSalary(player);

  if (salary >= 35) return "Star Player";
  if (salary >= 20) return "Starter";
  if (salary >= 12) return "Sixth Man";
  if (salary >= 5) return "Rotation";

  return "Bench";
}

function getExpectedFreeAgentMinutes(player) {
  const salary = getFreeAgentExpectedSalary(player);

  if (salary >= 30) return "30+ MPG";
  if (salary >= 18) return "25+ MPG";
  if (salary >= 10) return "20+ MPG";
  if (salary >= 5) return "15+ MPG";

  return "10+ MPG";
}

function getRolePromiseScore(role) {
  const scores = {
    "No Promise": 0,
    "Bench": 1,
    "Rotation": 2,
    "Sixth Man": 3,
    "Starter": 4,
    "Star Player": 5
  };

  return scores[role] || 0;
}

function getMinutesPromiseScore(minutes) {
  const scores = {
    "No Promise": 0,
    "10+ MPG": 1,
    "15+ MPG": 2,
    "20+ MPG": 3,
    "25+ MPG": 4,
    "30+ MPG": 5
  };

  return scores[minutes] || 0;
}

function getFreeAgentNegotiationPlayer() {
  if (!currentFreeAgentNegotiation) return null;

  return getFreeAgentByIdFromMarket(currentFreeAgentNegotiation.playerId);
}

function getFreeAgentOfferScore() {
  const player = getFreeAgentNegotiationPlayer();

  if (!player || !currentFreeAgentNegotiation) return 0;

  const expectedSalary = getFreeAgentExpectedSalary(player);
  const expectedYears = getFreeAgentExpectedYears(player);
  const expectedRole = getExpectedFreeAgentRole(player);
  const expectedMinutes = getExpectedFreeAgentMinutes(player);

  const salaryRatio = currentFreeAgentNegotiation.salary / Math.max(1, expectedSalary);
  const salaryScore = Math.min(45, salaryRatio * 45);

  const yearsRatio = currentFreeAgentNegotiation.years / Math.max(1, expectedYears);
  const yearsScore = Math.min(20, yearsRatio * 20);

  const roleDifference =
    getRolePromiseScore(currentFreeAgentNegotiation.rolePromise) -
    getRolePromiseScore(expectedRole);

  const roleScore = Math.max(0, Math.min(15, 10 + roleDifference * 3));

  const minutesDifference =
    getMinutesPromiseScore(currentFreeAgentNegotiation.minutesPromise) -
    getMinutesPromiseScore(expectedMinutes);

  const minutesScore = Math.max(0, Math.min(10, 7 + minutesDifference * 2));

  const interestPercent = getFreeAgentInterestPercent(player);
  const interestScore = Math.min(10, interestPercent / 10);

  return Math.round(salaryScore + yearsScore + roleScore + minutesScore + interestScore);
}

function getFreeAgentOfferSummary(score) {
  if (score >= 88) {
    return "This offer is strong and very likely to be accepted.";
  }

  if (score >= 72) {
    return "This is a competitive offer. The player may accept, but the camp could still ask for small changes.";
  }

  if (score >= 55) {
    return "This offer is close, but the player’s camp may want better terms.";
  }

  return "This offer is below the player’s expectations.";
}

function getOfferScoreClass(score) {
  if (score >= 88) return "likely";
  if (score >= 72) return "strong";
  if (score >= 55) return "competitive";
  return "weak";
}

function setOfferFieldState(fieldId, state, noteText) {
  const field = document.getElementById(fieldId);

  if (!field) return;

  field.classList.remove("agent-changed", "field-good", "field-warning", "field-bad");

  if (state) {
    field.classList.add(state);
  }

  const note = field.querySelector("small");

  if (note && noteText) {
    note.textContent = noteText;
  }
}

function adjustFreeAgentOfferSalary(change) {
  if (!currentFreeAgentNegotiation) return;

  currentFreeAgentNegotiation.salary = Math.max(
    1,
    Number((currentFreeAgentNegotiation.salary + change).toFixed(1))
  );

  currentFreeAgentNegotiation.changedFields.salary = false;
  updateFreeAgentNegotiationScreen();
  setText(
  "fa-neg-camp-message",
  "“This is the structure our camp would be comfortable with. If you are ready, you can offer the contract.”"
);
}

function setFreeAgentOfferYears(years) {
  if (!currentFreeAgentNegotiation) return;

  currentFreeAgentNegotiation.years = Number(years);
  currentFreeAgentNegotiation.changedFields.years = false;

  updateFreeAgentNegotiationScreen();
}

function syncFreeAgentNegotiationInputsFromState() {
  if (!currentFreeAgentNegotiation) return;

  const roleSelect = document.getElementById("fa-neg-role-promise");
  const minutesSelect = document.getElementById("fa-neg-minutes-promise");
  const optionalSelect = document.getElementById("fa-neg-optional-promise");

  if (roleSelect) roleSelect.value = currentFreeAgentNegotiation.rolePromise;
  if (minutesSelect) minutesSelect.value = currentFreeAgentNegotiation.minutesPromise;
  if (optionalSelect) optionalSelect.value = currentFreeAgentNegotiation.optionalPromise;
}

function readFreeAgentNegotiationInputsToState() {
  if (!currentFreeAgentNegotiation) return;

  const roleSelect = document.getElementById("fa-neg-role-promise");
  const minutesSelect = document.getElementById("fa-neg-minutes-promise");
  const optionalSelect = document.getElementById("fa-neg-optional-promise");

  if (roleSelect) currentFreeAgentNegotiation.rolePromise = roleSelect.value;
  if (minutesSelect) currentFreeAgentNegotiation.minutesPromise = minutesSelect.value;
  if (optionalSelect) currentFreeAgentNegotiation.optionalPromise = optionalSelect.value;
}

function suggestFreeAgentOffer() {
  const player = getFreeAgentNegotiationPlayer();

  if (!player || !currentFreeAgentNegotiation) return;

  const expectedSalary = getFreeAgentExpectedSalary(player);
  const expectedYears = getFreeAgentExpectedYears(player);
  const expectedRole = getExpectedFreeAgentRole(player);
  const expectedMinutes = getExpectedFreeAgentMinutes(player);

  const oldSalary = currentFreeAgentNegotiation.salary;
  const oldYears = currentFreeAgentNegotiation.years;
  const oldRole = currentFreeAgentNegotiation.rolePromise;
  const oldMinutes = currentFreeAgentNegotiation.minutesPromise;

  currentFreeAgentNegotiation.salary = expectedSalary;
  currentFreeAgentNegotiation.years = expectedYears;
  currentFreeAgentNegotiation.rolePromise = expectedRole;
  currentFreeAgentNegotiation.minutesPromise = expectedMinutes;

  if (currentFreeAgentNegotiation.optionalPromise === "None" && expectedSalary >= 12) {
    currentFreeAgentNegotiation.optionalPromise = "Compete for playoffs";
  }

  currentFreeAgentNegotiation.suggested = true;
  currentFreeAgentNegotiation.changedFields = {
    salary: oldSalary !== currentFreeAgentNegotiation.salary,
    years: oldYears !== currentFreeAgentNegotiation.years,
    role: oldRole !== currentFreeAgentNegotiation.rolePromise,
    minutes: oldMinutes !== currentFreeAgentNegotiation.minutesPromise,
    optional: true
  };

  currentFreeAgentNegotiation.status = "agent-countered";

  syncFreeAgentNegotiationInputsFromState();
  updateFreeAgentNegotiationScreen();
}

function renderFreeAgentNegotiationPlayerFace(player) {
  const faceElement = document.getElementById("fa-neg-player-face");

  if (!faceElement) return;

  const imagePath = getFreeAgencyPlayerImagePath(player, false);

  faceElement.classList.toggle("player-silhouette", !imagePath);

  if (!imagePath) {
    faceElement.innerHTML = "";
    return;
  }

  faceElement.innerHTML = `
    <img
      src="${escapeFreeAgencyImageAttr(imagePath)}"
      alt="${escapeFreeAgencyImageAttr(player?.name || "Player")} portrait"
      onerror="this.parentElement.classList.add('player-silhouette'); this.remove();"
    >
  `;
}

function cancelFreeAgentNegotiation() {
  currentFreeAgentNegotiation = null;
  currentFreeAgentOfferPlayerId = null;

  if (gameState && gameState.blockingNegotiation) {
    gameState.blockingNegotiation = null;
  }

  showSecondaryScreen("free-agency-screen");
  displayFreeAgency();
}
function displayFreeAgentNegotiationScreen() {
  const player = getFreeAgentNegotiationPlayer();
  const selectedTeam = getSelectedTeam();

  if (!player || !selectedTeam || !currentFreeAgentNegotiation) {
    cancelFreeAgentNegotiation();
    return;
  }

  syncFreeAgentNegotiationInputsFromState();

  setText("fa-neg-subtitle", `${player.name} contract discussion`);
  setText("fa-neg-date", formatDate(gameState.currentDate));
  setText("fa-neg-cap-space", formatMoney(getCapSpace(selectedTeam.id)));

  const rosterStatus = getTeamRosterStatus(selectedTeam.id);
  setText("fa-neg-roster-spots", Math.max(0, rosterStatus.maxStandard - rosterStatus.standardCount));

  setText("fa-neg-player-name", player.name);
  setText("fa-neg-player-position-age", `${player.primaryPosition || "--"} · Age ${player.age || "--"}`);
  setText("fa-neg-player-type", player.playerType || "Free Agent");
  renderFreeAgentNegotiationPlayerFace(player);
  setText("fa-neg-media-reputation", player.mediaDescription || "Unknown");
  setText("fa-neg-projected-ceiling", player.projectedCeiling || "Unknown");
  setText("fa-neg-free-agent-type", getFreeAgentContractTypeLabel(player));

  setText("fa-neg-expected-salary", `${formatMoney(getFreeAgentExpectedSalary(player))} / year`);
  setText("fa-neg-expected-years", `${getFreeAgentExpectedYears(player)} year${getFreeAgentExpectedYears(player) === 1 ? "" : "s"}`);
  setText("fa-neg-expected-role", getExpectedFreeAgentRole(player));
  setText("fa-neg-expected-minutes", getExpectedFreeAgentMinutes(player));
  setText("fa-neg-current-interest", player.interest || "Neutral");
  setText("fa-neg-market-status", getFreeAgentMarketLabel(player));

  displayFreeAgentPriorities(player);
  updateFreeAgentNegotiationScreen();
}

function displayFreeAgentPriorities(player) {
  const container = document.getElementById("fa-neg-priorities");

  if (!container || !player) return;

  const expectedSalary = getFreeAgentExpectedSalary(player);

  const priorities = [
    { label: "Money", value: expectedSalary >= 20 ? 90 : expectedSalary >= 10 ? 75 : 55, grade: expectedSalary >= 20 ? "A" : expectedSalary >= 10 ? "B+" : "B" },
    { label: "Role", value: expectedSalary >= 15 ? 82 : 65, grade: expectedSalary >= 15 ? "A-" : "B" },
    { label: "Winning", value: Number(player.ambition || 12) * 5, grade: "B" },
    { label: "Years / Security", value: getFreeAgentExpectedYears(player) >= 4 ? 82 : 62, grade: getFreeAgentExpectedYears(player) >= 4 ? "A-" : "B" },
    { label: "Market Size", value: Number(player.marketability || 12) * 5, grade: "B" },
    { label: "Loyalty", value: Number(player.loyalty || 10) * 5, grade: "C+" }
  ];

  container.innerHTML = priorities.map(priority => `
    <div class="fa-priority-row">
      <span>${priority.label}</span>
      <div class="fa-priority-bar">
        <div style="width: ${Math.max(8, Math.min(100, priority.value))}%"></div>
      </div>
      <strong>${priority.grade}</strong>
    </div>
  `).join("");
}

function updateFreeAgentNegotiationScreen() {
  const player = getFreeAgentNegotiationPlayer();
  const selectedTeam = getSelectedTeam();

  if (!player || !selectedTeam || !currentFreeAgentNegotiation) return;

  readFreeAgentNegotiationInputsToState();

  currentFreeAgentNegotiation.salary = Number(currentFreeAgentNegotiation.salary || 0);
  currentFreeAgentNegotiation.years = Number(currentFreeAgentNegotiation.years || 1);

  const score = getFreeAgentOfferScore();
  const scoreClass = getOfferScoreClass(score);

  const expectedSalary = getFreeAgentExpectedSalary(player);
  const expectedYears = getFreeAgentExpectedYears(player);
  const expectedRole = getExpectedFreeAgentRole(player);
  const expectedMinutes = getExpectedFreeAgentMinutes(player);

  const salaryElement = document.getElementById("fa-neg-offer-salary");

  if (salaryElement) {
    salaryElement.textContent = formatMoney(currentFreeAgentNegotiation.salary);
  }

  const yearButtons = document.querySelectorAll(".fa-neg-year-buttons button");

  for (let button of yearButtons) {
    button.classList.toggle(
      "active",
      Number(button.textContent) === Number(currentFreeAgentNegotiation.years)
    );
  }

  const meter = document.getElementById("fa-offer-meter-fill");

  if (meter) {
    meter.classList.remove("weak", "competitive", "strong", "likely");
    meter.classList.add(scoreClass);
    meter.style.width = `${Math.max(4, Math.min(100, score))}%`;
  }

  const summary = document.getElementById("fa-neg-offer-summary");

  if (summary) {
    summary.textContent = getFreeAgentOfferSummary(score);
  }

  const submitButton = document.getElementById("fa-neg-submit-button");

  if (submitButton) {
  const readyToOffer = score >= 88 || currentFreeAgentNegotiation.suggested;

  submitButton.textContent = readyToOffer ? "Offer Contract" : "Submit Offer";
  submitButton.classList.toggle("ready", readyToOffer);
}

  setOfferFieldState(
    "fa-offer-field-salary",
    currentFreeAgentNegotiation.changedFields.salary
      ? "agent-changed"
      : currentFreeAgentNegotiation.salary >= expectedSalary
        ? "field-good"
        : "field-warning",
    currentFreeAgentNegotiation.changedFields.salary
      ? "Agent changed salary request"
      : currentFreeAgentNegotiation.salary >= expectedSalary
        ? "Meets asking price"
        : "Below asking price"
  );

  setOfferFieldState(
    "fa-offer-field-years",
    currentFreeAgentNegotiation.changedFields.years
      ? "agent-changed"
      : currentFreeAgentNegotiation.years >= expectedYears
        ? "field-good"
        : "field-warning",
    currentFreeAgentNegotiation.changedFields.years
      ? "Agent changed years request"
      : currentFreeAgentNegotiation.years >= expectedYears
        ? "Meets expected years"
        : "Below expected years"
  );

  setOfferFieldState(
    "fa-offer-field-role",
    currentFreeAgentNegotiation.changedFields.role
      ? "agent-changed"
      : getRolePromiseScore(currentFreeAgentNegotiation.rolePromise) >= getRolePromiseScore(expectedRole)
        ? "field-good"
        : "field-warning",
    currentFreeAgentNegotiation.changedFields.role
      ? "Agent changed role request"
      : getRolePromiseScore(currentFreeAgentNegotiation.rolePromise) >= getRolePromiseScore(expectedRole)
        ? "Meets expected role"
        : "Below expected role"
  );

  setOfferFieldState(
    "fa-offer-field-minutes",
    currentFreeAgentNegotiation.changedFields.minutes
      ? "agent-changed"
      : getMinutesPromiseScore(currentFreeAgentNegotiation.minutesPromise) >= getMinutesPromiseScore(expectedMinutes)
        ? "field-good"
        : "field-warning",
    currentFreeAgentNegotiation.changedFields.minutes
      ? "Agent changed minutes request"
      : getMinutesPromiseScore(currentFreeAgentNegotiation.minutesPromise) >= getMinutesPromiseScore(expectedMinutes)
        ? "Meets expected minutes"
        : "Below expected minutes"
  );

  setOfferFieldState(
    "fa-offer-field-optional",
    currentFreeAgentNegotiation.changedFields.optional ? "agent-changed" : "",
    currentFreeAgentNegotiation.changedFields.optional ? "Agent added optional promise" : "Optional"
  );

  updateFreeAgentFinancialImpact();
  updateFreeAgentNegotiationNotes(score);
}

function getLuxuryTaxLine() {
  return Math.round((gameState.salaryCap || SALARY_CAP) * 1.215);
}

function getFirstApronLine() {
  return getLuxuryTaxLine() + 7;
}

function getSecondApronLine() {
  return getLuxuryTaxLine() + 17.5;
}

function updateFreeAgentFinancialImpact() {
  const selectedTeam = getSelectedTeam();

  if (!selectedTeam || !currentFreeAgentNegotiation) return;

  const payroll = getRosterPayroll(selectedTeam.id);
  const cap = gameState.salaryCap || SALARY_CAP;
  const taxLine = getLuxuryTaxLine();
  const firstApron = getFirstApronLine();
  const secondApron = getSecondApronLine();

  const afterPayroll = payroll + currentFreeAgentNegotiation.salary;

  setFinanceValue("fa-neg-before-cap", cap - payroll);
  setFinanceValue("fa-neg-before-payroll", payroll);
  setFinanceValue("fa-neg-before-tax-room", taxLine - payroll);
  setFinanceValue("fa-neg-before-first-apron", firstApron - payroll);
  setFinanceValue("fa-neg-before-second-apron", secondApron - payroll);

  setFinanceValue("fa-neg-after-cap", cap - afterPayroll);
  setFinanceValue("fa-neg-after-payroll", afterPayroll);
  setFinanceValue("fa-neg-after-tax-room", taxLine - afterPayroll);
  setFinanceValue("fa-neg-after-first-apron", firstApron - afterPayroll);
  setFinanceValue("fa-neg-after-second-apron", secondApron - afterPayroll);
}

function createNegotiationNote(type, text) {
  return `
    <div class="fa-neg-note ${type}">
      <span>${type === "good" ? "✓" : type === "warning" ? "!" : "i"}</span>
      <p>${text}</p>
    </div>
  `;
}

function updateFreeAgentNegotiationNotes(score) {
  const container = document.getElementById("fa-neg-notes-list");
  const selectedTeam = getSelectedTeam();
  const player = getFreeAgentNegotiationPlayer();

  if (!container || !selectedTeam || !player || !currentFreeAgentNegotiation) return;

  const notes = [];
  const rosterStatus = getTeamRosterStatus(selectedTeam.id);
  const openSpotsAfter = Math.max(0, rosterStatus.maxStandard - rosterStatus.standardCount - 1);
  const capAfter = getCapSpace(selectedTeam.id) - currentFreeAgentNegotiation.salary;

  notes.push(createNegotiationNote(
    openSpotsAfter >= 1 ? "good" : "warning",
    `Signing this player would leave you with ${openSpotsAfter} open roster spot${openSpotsAfter === 1 ? "" : "s"}.`
  ));

  if (capAfter < 0) {
    notes.push(createNegotiationNote("warning", "This offer would put you over the salary cap."));
  } else {
    notes.push(createNegotiationNote("good", "This offer keeps you under the salary cap."));
  }

  if (currentFreeAgentNegotiation.rolePromise !== "No Promise") {
    notes.push(createNegotiationNote("warning", "Role promise could affect morale if broken."));
  }

  if (currentFreeAgentNegotiation.suggested) {
    notes.push(createNegotiationNote("info", "The player’s camp suggested changes to make the offer more acceptable."));
  }

  if (score >= 88) {
    notes.push(createNegotiationNote("good", "The player’s camp is satisfied with this structure."));
  } else if (score >= 55) {
    notes.push(createNegotiationNote("info", "The player may consider this, but the camp still has concerns."));
  } else {
    notes.push(createNegotiationNote("warning", "The current offer is below the player’s expectations."));
  }

  container.innerHTML = notes.join("");
}

function showFreeAgentNegotiationResultPopup(resultType, title, message, onContinueAction = null) {
  const popup = document.getElementById("fa-neg-result-popup");
  const card = document.getElementById("fa-neg-result-card");

  if (!popup || !card) return;

  pendingFreeAgentNegotiationResultAction = onContinueAction;

  card.classList.remove("accepted", "rejected");
  card.classList.add(resultType);

  setText("fa-neg-result-title", title);
  setText("fa-neg-result-message", message);

  popup.classList.remove("hidden");
}

function closeFreeAgentNegotiationResultPopup() {
  const popup = document.getElementById("fa-neg-result-popup");

  if (popup) {
    popup.classList.add("hidden");
  }

  const action = pendingFreeAgentNegotiationResultAction;
  pendingFreeAgentNegotiationResultAction = null;

  if (typeof action === "function") {
    action();
  }
}

function submitFreeAgentNegotiationOffer() {
  const player = getFreeAgentNegotiationPlayer();
  const selectedTeam = getSelectedTeam();

  if (!player || !selectedTeam || !currentFreeAgentNegotiation) return;

  const score = getFreeAgentOfferScore();

  if (score < 72) {
    currentFreeAgentNegotiation.status = "rejected";

    addInboxMessage(
      "Offer Rejected",
      `${player.name}'s camp rejected the offer. They are looking for stronger terms.`,
      "staff"
    );

    showFreeAgentNegotiationResultPopup(
      "rejected",
      "Offer Rejected",
      `${player.name}'s camp rejected your offer. Improve the salary, years, role promise, or minutes promise before submitting again.`,
      function() {
        updateFreeAgentNegotiationScreen();
      }
    );

    return;
  }

  if (score < 88 && !currentFreeAgentNegotiation.suggested) {
    currentFreeAgentNegotiation.status = "rejected";

    addInboxMessage(
      "Offer Rejected",
      `${player.name}'s camp rejected the offer. They may be open to a better structure.`,
      "staff"
    );

    showFreeAgentNegotiationResultPopup(
      "rejected",
      "Offer Rejected",
      `${player.name}'s camp is not ready to accept this offer. The offer is close, but they want stronger terms. Use Suggest Offer to hear what they want.`,
      function() {
        updateFreeAgentNegotiationScreen();
      }
    );

    return;
  }

  const acceptedMessage = isFreeAgencyMoratorium()
  ? `${player.name}'s camp has accepted your offer. Click Continue to record a verbal agreement. The deal becomes official after the moratorium ends.`
  : `${player.name}'s camp has accepted your contract offer. Click Continue to finalize the signing.`;

showFreeAgentNegotiationResultPopup(
  "accepted",
  "Offer Accepted",
  acceptedMessage,
  function() {
    signFreeAgentFromNegotiation();
  }
);
}

function ensureFreeAgencyAgreementLists() {
  if (!gameState.pendingFreeAgencyAgreements) {
    gameState.pendingFreeAgencyAgreements = [];
  }

  if (!gameState.freeAgencyDeals) {
    gameState.freeAgencyDeals = [];
  }
}

function getPendingFreeAgencyAgreementsForCurrentCycle() {
  ensureFreeAgencyAgreementLists();

  return gameState.pendingFreeAgencyAgreements.filter(agreement =>
    agreement.seasonLabel === gameState.seasonLabel &&
    agreement.status === "pending"
  );
}

function createPendingFreeAgencyAgreement(player, selectedTeam, salary, years) {
  ensureFreeAgencyAgreementLists();

  const agreement = {
    id: `agreement-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    seasonLabel: gameState.seasonLabel,
    date: formatDate(gameState.currentDate),
    playerId: player.id || player.playerId,
    playerName: player.name,
    teamId: selectedTeam.id,
    teamName: selectedTeam.name,
    salary,
    years,
    totalValue: salary * years,
    type: "Verbal Agreement",
    status: "pending",
    rolePromise: currentFreeAgentNegotiation.rolePromise,
    minutesPromise: currentFreeAgentNegotiation.minutesPromise,
    optionalPromise: currentFreeAgentNegotiation.optionalPromise
  };

  gameState.pendingFreeAgencyAgreements.push(agreement);

player.pendingAgreement = true;
player.pendingAgreementId = agreement.id;
player.pendingTeamId = selectedTeam.id;
player.pendingTeamName = selectedTeam.name;
player.pendingSalary = salary;
player.pendingYears = years;

recordFreeAgentAgreementTransaction(player, selectedTeam, salary, years);

  return agreement;
}

function removeFreeAgentFromMarket(player) {
  if (!gameState || !Array.isArray(gameState.freeAgents) || !player) return;

  const index = gameState.freeAgents.findIndex(item =>
    Number(item.id) === Number(player.id) ||
    Number(item.playerId) === Number(player.playerId)
  );

  if (index >= 0) {
    gameState.freeAgents.splice(index, 1);
  }
}

function finalizePendingFreeAgencyAgreement(agreement) {
  if (!agreement || agreement.status !== "pending") return false;

  const selectedTeam = getTeamById(Number(agreement.teamId));
  const playerResult = findPlayerById(agreement.playerId);

  let player = null;

  if (playerResult && playerResult.player) {
    player = playerResult.player;
  }

  if (!player && Array.isArray(gameState.freeAgents)) {
    player = gameState.freeAgents.find(item =>
      Number(item.id) === Number(agreement.playerId) ||
      Number(item.playerId) === Number(agreement.playerId)
    );
  }

  if (!player || !selectedTeam) {
    agreement.status = "failed";
    return false;
  }

  removeFreeAgentFromMarket(player);

  player.teamId = selectedTeam.id;
  player.teamName = selectedTeam.name;
  player.startsAsFreeAgent = false;
  player.contractType = player.contractType || "Standard";
  player.rosterContractType = "Standard";
  player.salary = agreement.salary;
  player.contractYears = agreement.years;
  player.contract = `${agreement.years} yr${agreement.years === 1 ? "" : "s"} / ${formatMoney(agreement.salary)}`;
  player.interest = "-";
  player.morale = player.morale || "Neutral";

  player.promises = {
    rolePromise: agreement.rolePromise,
    minutesPromise: agreement.minutesPromise,
    optionalPromise: agreement.optionalPromise,
    dateSigned: formatDate(gameState.currentDate),
    active: true
  };

  if (!gameState.rosters[selectedTeam.id]) {
    gameState.rosters[selectedTeam.id] = [];
  }

  const alreadyOnRoster = gameState.rosters[selectedTeam.id].some(item =>
    Number(item.id) === Number(player.id) ||
    Number(item.playerId) === Number(player.playerId)
  );

  if (!alreadyOnRoster) {
    gameState.rosters[selectedTeam.id].push(player);
  }

  normalizePlayerContract(player);

  ensureFreeAgencyAgreementLists();

  gameState.freeAgencyDeals.push({
    seasonLabel: gameState.seasonLabel,
    date: formatDate(gameState.currentDate),
    playerId: player.id || player.playerId,
    playerName: player.name,
    teamId: selectedTeam.id,
    teamName: selectedTeam.name,
    salary: agreement.salary,
    years: agreement.years,
    totalValue: agreement.totalValue,
    type: "Signing"
  });

  recordFreeAgentSigningTransaction(player, selectedTeam, agreement.salary, agreement.years);

  agreement.status = "official";
  agreement.officialDate = formatDate(gameState.currentDate);

  return true;
}

function processFreeAgencyMoratoriumEndIfNeeded() {
  if (!gameState || !gameState.currentDate) return;

  const key = getMonthDayKey(gameState.currentDate);

  if (key !== 706) return;

  ensureFreeAgencyAgreementLists();

  if (gameState.lastMoratoriumProcessedSeason === gameState.seasonLabel) return;

  const pendingAgreements = getPendingFreeAgencyAgreementsForCurrentCycle();

  if (pendingAgreements.length === 0) {
    gameState.lastMoratoriumProcessedSeason = gameState.seasonLabel;
    return;
  }

  let finalizedCount = 0;

  for (let agreement of pendingAgreements) {
    if (finalizePendingFreeAgencyAgreement(agreement)) {
      finalizedCount++;
    }
  }

  gameState.lastMoratoriumProcessedSeason = gameState.seasonLabel;

  addInboxMessage(
    "Moratorium Ends",
    `${finalizedCount} verbal agreement${finalizedCount === 1 ? "" : "s"} became official signing${finalizedCount === 1 ? "" : "s"}.`,
    "staff"
  );

  ensureRotation();
}

function signFreeAgentFromNegotiation() {
  const player = getFreeAgentNegotiationPlayer();
  const selectedTeam = getSelectedTeam();

  if (!player || !selectedTeam || !currentFreeAgentNegotiation) return;

  const salary = Number(currentFreeAgentNegotiation.salary);
  const years = Number(currentFreeAgentNegotiation.years);

  if (isFreeAgencyMoratorium()) {
    createPendingFreeAgencyAgreement(player, selectedTeam, salary, years);

    addInboxMessage(
      "Verbal Agreement Reached",
      `${selectedTeam.name} reached a verbal agreement with ${player.name} for ${years} year${years === 1 ? "" : "s"} at ${formatMoney(salary)} per season. The deal becomes official when the moratorium ends.`,
      "staff"
    );

    currentFreeAgentNegotiation = null;
    currentFreeAgentOfferPlayerId = null;

    if (gameState.blockingNegotiation) {
      gameState.blockingNegotiation = null;
    }

    showSecondaryScreen("free-agency-screen");
    refreshAll();
    return;
  }

  const freeAgentIndex = gameState.freeAgents.findIndex(item =>
    Number(item.id) === Number(player.id) ||
    Number(item.playerId) === Number(player.playerId)
  );

  if (freeAgentIndex < 0) {
    addInboxMessage("Signing Failed", "That free agent could not be found.", "staff");
    cancelFreeAgentNegotiation();
    refreshAll();
    return;
  }

  gameState.freeAgents.splice(freeAgentIndex, 1);

  player.teamId = selectedTeam.id;
  player.teamName = selectedTeam.name;
  player.startsAsFreeAgent = false;
  player.contractType = player.contractType || "Standard";
  player.rosterContractType = "Standard";
  player.salary = salary;
  player.contractYears = years;
  player.contract = `${years} yr${years === 1 ? "" : "s"} / ${formatMoney(salary)}`;
  player.interest = "-";
  player.morale = player.morale || "Neutral";

  player.promises = {
    rolePromise: currentFreeAgentNegotiation.rolePromise,
    minutesPromise: currentFreeAgentNegotiation.minutesPromise,
    optionalPromise: currentFreeAgentNegotiation.optionalPromise,
    dateSigned: formatDate(gameState.currentDate),
    active: true
  };

  if (!gameState.rosters[selectedTeam.id]) {
    gameState.rosters[selectedTeam.id] = [];
  }

  const alreadyOnRoster = gameState.rosters[selectedTeam.id].some(item =>
    Number(item.id) === Number(player.id) ||
    Number(item.playerId) === Number(player.playerId)
  );

  if (!alreadyOnRoster) {
    gameState.rosters[selectedTeam.id].push(player);
  }

  normalizePlayerContract(player);
  ensureRotation();

  ensureFreeAgencyAgreementLists();

  gameState.freeAgencyDeals.push({
    seasonLabel: gameState.seasonLabel,
    date: formatDate(gameState.currentDate),
    playerId: player.id || player.playerId,
    playerName: player.name,
    teamId: selectedTeam.id,
    teamName: selectedTeam.name,
    salary,
    years,
    totalValue: salary * years,
    type: "Signing"
  });

  recordFreeAgentSigningTransaction(player, selectedTeam, salary, years);

  addInboxMessage(
    "Free Agent Signed",
    `${selectedTeam.name} signed ${player.name} to a ${years}-year contract worth ${formatMoney(salary)} per season.`,
    "staff"
  );

  currentFreeAgentNegotiation = null;
  currentFreeAgentOfferPlayerId = null;

  if (gameState.blockingNegotiation) {
    gameState.blockingNegotiation = null;
  }

  showSecondaryScreen("free-agency-screen");
  refreshAll();
}

function openFreeAgentOffer(playerId) {
  const result = findPlayerById(playerId);

  if (!result || !result.freeAgent) {
    addInboxMessage("Negotiation Unavailable", "That player is not currently a free agent.", "staff");
    refreshAll();
    return;
  }

  const selectedTeam = getSelectedTeam();

  if (!selectedTeam) {
    addInboxMessage("Negotiation Unavailable", "No selected team was found.", "staff");
    refreshAll();
    return;
  }

  if (!canNegotiateWithFreeAgents()) {
    addInboxMessage("Negotiation Closed", "Free agency is currently closed. Negotiations open June 30.", "staff");
    refreshAll();
    return;
  }

  if (!canUserSignStandardPlayer()) {
    const status = getTeamRosterStatus(gameState.selectedTeamId);

    showRosterBlockPopup({
      ...status,
      problems: [
        `You do not have an open standard roster spot. Current standard contracts: ${status.standardCount}/${status.maxStandard}.`
      ]
    });

    return;
  }

  const player = result.player;
  const expectedSalary = getFreeAgentExpectedSalary(player);
  const expectedYears = getFreeAgentExpectedYears(player);

  currentFreeAgentOfferPlayerId = playerId;

  currentFreeAgentNegotiation = {
    playerId: Number(player.id || player.playerId),
    teamId: selectedTeam.id,
    salary: Math.max(1, Number((expectedSalary - 2).toFixed(1))),
    years: expectedYears,
    rolePromise: getExpectedFreeAgentRole(player),
    minutesPromise: getExpectedFreeAgentMinutes(player),
    optionalPromise: "None",
    suggested: false,
    changedFields: {},
    status: "preparing"
  };

  gameState.blockingNegotiation = {
    type: "free-agency",
    playerId: Number(player.id || player.playerId)
  };

  showSecondaryScreen("free-agency-negotiation-screen");
  displayFreeAgentNegotiationScreen();
}

function closeFreeAgentOffer() {
  const overlay = document.getElementById("free-agent-offer-overlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }

  currentFreeAgentOfferPlayerId = null;
}

function signCurrentFreeAgentOffer() {
  if (!currentFreeAgentOfferPlayerId) return;

  if (!gameState || !gameState.started) {
    closeFreeAgentOffer();
    return;
  }

  const result = findPlayerById(currentFreeAgentOfferPlayerId);
  const selectedTeam = getSelectedTeam();

  if (!result || !result.freeAgent || !selectedTeam) {
    closeFreeAgentOffer();
    return;
  }

  const player = result.player;

  if (!canNegotiateWithFreeAgents()) {
    addInboxMessage(
      "Free Agency Closed",
      "You cannot sign free agents until negotiations open on June 30.",
      "urgent",
      false
    );

    closeFreeAgentOffer();
    refreshAll();
    return;
  }

  if (!canUserSignStandardPlayer()) {
    const status = getTeamRosterStatus(gameState.selectedTeamId);

    closeFreeAgentOffer();

    showRosterBlockPopup({
      ...status,
      problems: [
        `You do not have an open standard roster spot. Current standard contracts: ${status.standardCount}/${status.maxStandard}.`
      ]
    });

    refreshAll();
    return;
  }

  if (player.interest === "Not Interested") {
    addInboxMessage(
      "Player Refused",
      `${player.name} is not interested in signing with your team right now.`,
      "staff"
    );

    closeFreeAgentOffer();
    refreshAll();
    return;
  }

  const targetId = Number(player.id);

  const index = gameState.freeAgents.findIndex(item =>
    Number(item.id) === targetId ||
    Number(item.playerId) === targetId
  );

  if (index < 0) {
    addInboxMessage(
      "Signing Failed",
      "That free agent could not be found.",
      "staff"
    );

    closeFreeAgentOffer();
    refreshAll();
    return;
  }

  const signedPlayer = gameState.freeAgents.splice(index, 1)[0];

  const expectedSalary = Number(
    signedPlayer.expectedSalary ||
    signedPlayer.salary ||
    estimateExpectedSalary(signedPlayer) ||
    1
  );

  const expectedYears = Number(
    signedPlayer.expectedYears ||
    estimateExpectedYears(signedPlayer) ||
    1
  );

  signedPlayer.teamId = selectedTeam.id;
  signedPlayer.teamName = selectedTeam.name;
  signedPlayer.startsAsFreeAgent = false;
  signedPlayer.salary = expectedSalary;
  signedPlayer.contractYears = expectedYears;
  signedPlayer.contract = `${expectedYears} yr${expectedYears === 1 ? "" : "s"} / ${formatMoney(expectedSalary)}`;
  signedPlayer.contractType = "Standard";
  signedPlayer.rosterContractType = "Standard";
  signedPlayer.morale = signedPlayer.morale || "Neutral";
  signedPlayer.interest = "-";

  if (!gameState.rosters[selectedTeam.id]) {
    gameState.rosters[selectedTeam.id] = [];
  }

  const alreadyOnRoster = gameState.rosters[selectedTeam.id].some(item =>
    Number(item.id) === Number(signedPlayer.id) ||
    Number(item.playerId) === Number(signedPlayer.playerId)
  );

  if (!alreadyOnRoster) {
    gameState.rosters[selectedTeam.id].push(signedPlayer);
  }

  normalizePlayerContract(signedPlayer);
  ensureRotation();

  recordFreeAgentSigningTransaction(signedPlayer, selectedTeam, expectedSalary, expectedYears);

  addInboxMessage(
    "Free Agent Signed",
    `${selectedTeam.name} signed ${signedPlayer.name} to a ${expectedYears}-year contract worth ${formatMoney(expectedSalary)} per season.`,
    "event"
  );

  closeFreeAgentOffer();

  const profileOverlay = document.getElementById("player-profile-overlay");
  if (profileOverlay) {
    profileOverlay.classList.add("hidden");
  }

  currentProfilePlayerId = null;
  refreshAll();
}

function openFreeAgentOfferForCurrentProfilePlayer() {
  if (!currentProfilePlayerId) return;
  openFreeAgentOffer(currentProfilePlayerId);
}

function confirmReleaseCurrentProfilePlayer() {
  if (!currentProfilePlayerId) return;

  const result = findPlayerById(currentProfilePlayerId);
  const selectedTeam = getSelectedTeam();

  if (!result || result.freeAgent || !selectedTeam || result.teamId !== selectedTeam.id) {
    return;
  }

  currentReleasePlayerId = currentProfilePlayerId;

  const overlay = document.getElementById("release-confirm-overlay");
  if (!overlay) return;

  setText(
    "release-confirm-message",
    `Are you sure you want to release ${result.player.name}? His contract will disappear for now, and he will enter free agency.`
  );

  overlay.classList.remove("hidden");
}

function closeReleaseConfirm() {
  const overlay = document.getElementById("release-confirm-overlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }

  currentReleasePlayerId = null;
}

function releaseCurrentConfirmedPlayer() {
  if (!currentReleasePlayerId) return;

  const selectedTeam = getSelectedTeam();
  const result = findPlayerById(currentReleasePlayerId);

  if (!selectedTeam || !result || result.freeAgent || result.teamId !== selectedTeam.id) {
    closeReleaseConfirm();
    return;
  }

  const roster = gameState.rosters[selectedTeam.id];
  const playerIndex = roster.findIndex(player => player.id === currentReleasePlayerId);

  if (playerIndex < 0) {
    closeReleaseConfirm();
    return;
  }

  const releasedPlayer = roster.splice(playerIndex, 1)[0];

  releasedPlayer.teamId = null;
  releasedPlayer.teamName = "Free Agent";
  releasedPlayer.salary = 0;
  releasedPlayer.contractYears = 0;
  releasedPlayer.contract = "Free Agent";
  releasedPlayer.contractType = "Free Agent";
  releasedPlayer.expectedSalary = estimateExpectedSalary(releasedPlayer);
  releasedPlayer.expectedYears = estimateExpectedYears(releasedPlayer);
  releasedPlayer.interest = "Neutral";
  releasedPlayer.morale = "Available";

  gameState.freeAgents.push(releasedPlayer);

  removePlayerFromRotation(releasedPlayer.id);

  recordWaivedTransaction(releasedPlayer, selectedTeam);

  addInboxMessage(
    "Player Released",
    `${releasedPlayer.name} has been released and is now a free agent.`,
    "event"
  );

  closeReleaseConfirm();
  closePlayerProfile();
  refreshAll();
}

function removePlayerFromRotation(playerId) {
  if (!gameState || !gameState.rotation) return;

  const targetId = Number(playerId);

  const slots = Array.isArray(gameState.rotation)
    ? gameState.rotation
    : Array.isArray(gameState.rotation.slots)
      ? gameState.rotation.slots
      : [];

  for (let slot of slots) {
    if (
      Number(slot.playerId) === targetId ||
      Number(slot.id) === targetId
    ) {
      slot.playerId = null;
      slot.id = null;
      slot.minutes = 0;
    }
  }
}

function openExtensionOfferForCurrentProfilePlayer() {
  if (!currentProfilePlayerId) return;

  const result = findPlayerById(currentProfilePlayerId);
  const selectedTeam = getSelectedTeam();

  if (!result || result.freeAgent || !selectedTeam || result.teamId !== selectedTeam.id) {
    return;
  }

  const player = result.player;
  const capSpace = getCapSpace(selectedTeam.id);
  const canGoOverCapToExtend = true;

  if (!canGoOverCapToExtend && capSpace < player.expectedSalary) {
    addInboxMessage("Extension Blocked", "You do not have enough cap space to extend this player.", "urgent", false);
    refreshAll();
    return;
  }

  player.salary = player.expectedSalary || estimateExpectedSalary(player);
  player.contractYears = player.expectedYears || estimateExpectedYears(player);
  player.contract = `${player.contractYears} yrs / ${formatMoney(player.salary)}`;
  player.contractType = "Extension";

  addInboxMessage(
    "Extension Signed",
    `${player.name} signed an extension worth ${formatMoney(player.salary)} per year for ${player.contractYears} year(s).`,
    "event"
  );

  closePlayerProfile();
  refreshAll();
}

function canUserSignStandardPlayer() {
  const status = getTeamRosterStatus(gameState.selectedTeamId);

  return status.standardCount < status.maxStandard;
}

function getUserOpenStandardRosterSpots() {
  const status = getTeamRosterStatus(gameState.selectedTeamId);
  return Math.max(0, status.maxStandard - status.standardCount);
}

function signFreeAgent(playerId) {
  if (!gameState || !gameState.started) return;

  if (!gameState.freeAgents) {
    gameState.freeAgents = [];
  }

  const targetId = Number(playerId);

  const freeAgentIndex = gameState.freeAgents.findIndex(player =>
    Number(player.id) === targetId ||
    Number(player.playerId) === targetId
  );

  if (freeAgentIndex < 0) {
    addInboxMessage(
      "Signing Failed",
      "That free agent could not be found.",
      "staff"
    );
    refreshAll();
    return;
  }

  const selectedTeam = getSelectedTeam();

  if (!selectedTeam) {
    addInboxMessage(
      "Signing Failed",
      "No selected team was found.",
      "staff"
    );
    refreshAll();
    return;
  }

  if (!canUserSignStandardPlayer()) {
    const status = getTeamRosterStatus(gameState.selectedTeamId);

    showRosterBlockPopup({
      ...status,
      problems: [
        `You do not have an open standard roster spot. Current standard contracts: ${status.standardCount}/${status.maxStandard}.`
      ]
    });

    return;
  }

  const player = gameState.freeAgents[freeAgentIndex];

  const expectedSalary = Number(player.expectedSalary || player.salary || estimateExpectedSalary(player) || 1);
  const expectedYears = Number(player.expectedYears || estimateExpectedYears(player) || 1);

  const confirmed = confirm(
    `Sign ${player.name}?\n\nContract: ${expectedYears} year${expectedYears === 1 ? "" : "s"} / ${formatMoney(expectedSalary)} per year`
  );

  if (!confirmed) return;

  gameState.freeAgents.splice(freeAgentIndex, 1);

  player.teamId = selectedTeam.id;
  player.teamName = selectedTeam.name;
  player.startsAsFreeAgent = false;
  player.contractType = player.contractType || "Standard";
  player.rosterContractType = "Standard";
  player.salary = expectedSalary;
  player.contractYears = expectedYears;
  player.contract = `${expectedYears} yr${expectedYears === 1 ? "" : "s"} / ${formatMoney(expectedSalary)}`;
  player.interest = "-";
  player.morale = player.morale || "Neutral";

  if (!gameState.rosters[selectedTeam.id]) {
    gameState.rosters[selectedTeam.id] = [];
  }

  const alreadyOnRoster = gameState.rosters[selectedTeam.id].some(item =>
    Number(item.id) === Number(player.id) ||
    Number(item.playerId) === Number(player.playerId)
  );

  if (!alreadyOnRoster) {
    gameState.rosters[selectedTeam.id].push(player);
  }

  normalizePlayerContract(player);
ensureRotation();

if (!Array.isArray(gameState.freeAgencyDeals)) {
  gameState.freeAgencyDeals = [];
}

gameState.freeAgencyDeals.push({
  seasonLabel: gameState.seasonLabel,
  date: formatDate(gameState.currentDate),
  playerId: player.id || player.playerId,
  playerName: player.name,
  teamId: selectedTeam.id,
  teamName: selectedTeam.name,
  salary: expectedSalary,
  years: expectedYears,
  totalValue: expectedSalary * expectedYears,
  type: "Signing"
});

recordFreeAgentSigningTransaction(player, selectedTeam, expectedSalary, expectedYears);

addInboxMessage(
  "Free Agent Signed",
    `${selectedTeam.name} signed ${player.name} to a ${expectedYears}-year contract worth ${formatMoney(expectedSalary)} per season.`,
    "staff"
  );

  currentProfilePlayerId = null;

  const overlay = document.getElementById("player-profile-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
  }

  refreshAll();
}
function releasePlayerFromTeam(playerId) {
  if (!gameState || !gameState.started) return;

  const result = findPlayerById(playerId);

  if (!result || result.freeAgent) {
    addInboxMessage("Release Failed", "That player could not be released.", "staff");
    refreshAll();
    return;
  }

  const player = result.player;
  const team = result.team;
  const teamId = result.teamId;

  if (Number(teamId) !== Number(gameState.selectedTeamId)) {
    addInboxMessage("Release Failed", "You can only release players from your own roster.", "staff");
    refreshAll();
    return;
  }

  const confirmed = confirm(
    `Release ${player.name}?\n\nThey will be removed from your roster and added to free agency.`
  );

  if (!confirmed) return;

  gameState.rosters[teamId] = gameState.rosters[teamId].filter(item =>
    Number(item.id) !== Number(player.id) &&
    Number(item.playerId) !== Number(player.playerId)
  );

  player.teamId = null;
  player.teamName = "Free Agent";
  player.startsAsFreeAgent = true;
  player.interest = player.interest || "Neutral";

  if (!gameState.freeAgents) {
    gameState.freeAgents = [];
  }

  const alreadyInFreeAgency = gameState.freeAgents.some(item =>
    Number(item.id) === Number(player.id) ||
    Number(item.playerId) === Number(player.playerId)
  );

  if (!alreadyInFreeAgency) {
    gameState.freeAgents.push(player);
  }

  removePlayerFromRotation(player.id);

  recordWaivedTransaction(player, team);

  addInboxMessage(
  "Player Released",
  `${player.name} has been released by ${team ? team.name : "your team"} and is now a free agent.`,
  "staff"
  );

  currentProfilePlayerId = null;

  const overlay = document.getElementById("player-profile-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
  }

  ensureRotation();
  refreshAll();
}

function processLeagueEconomyEvents() {
  if (!gameState.started) return;

  processExpiringContractWarning();
  processFinalExpiringContractWarning();

  /*
    Do not run old mass free agency signing here.
    Free agency is now handled by processDailyFreeAgencyMarket()
    during the actual offseason hub.
  */
}

function processExpiringContractWarning() {
  const warningDate = new Date(gameState.seasonStartYear + 1, 4, 23);
  const key = `expiring_warning_${gameState.seasonLabel}`;

  if (gameState.processedEvents[key]) return;

  if (gameState.currentDate >= warningDate) {
    const expiringPlayers = getRosterByTeamId(gameState.selectedTeamId)
      .filter(player => getPlayerContractYears(player) === 1);

    if (expiringPlayers.length > 0) {
      const names = expiringPlayers.map(player => player.name).join(", ");

     addInboxMessage(
  "Expiring Contracts Warning",
  `${expiringPlayers.length} player(s) have contracts expiring this offseason: ${names}. You can offer extensions from their player profiles.`,
  "urgent",
  false,
  "contracts"
);
    }

    gameState.processedEvents[key] = true;
  }
}

function processFinalExpiringContractWarning() {
  const warningDate = getFinalExpiringWarningDate();
  const key = `final_expiring_warning_${gameState.seasonLabel}`;

  if (gameState.processedEvents[key]) return;

  if (gameState.currentDate >= warningDate) {
    const expiringPlayers = getRosterByTeamId(gameState.selectedTeamId)
      .filter(player => getPlayerContractYears(player) <= 0 || getPlayerContractYears(player) === 1);

    if (expiringPlayers.length > 0) {
      const names = expiringPlayers.map(player => player.name).join(", ");

   addInboxMessage(
  "Final Contract Warning",
  `These players will enter free agency tomorrow if they are not extended: ${names}.`,
  "urgent",
  false,
  "contracts_final"
);
    }

    gameState.processedEvents[key] = true;
  }
}

function processContractExpirations() {
  const expirationDate = getContractExpirationDate();
  const key = `contract_expirations_${gameState.seasonLabel}`;

  if (gameState.processedEvents[key]) return;
  if (gameState.currentDate < expirationDate) return;

  const expiredPlayers = [];

  for (let team of gameState.teams) {
    const roster = gameState.rosters[team.id] || [];
    const remainingRoster = [];

    for (let player of roster) {
      if (getPlayerContractYears(player) <= 0) {
        movePlayerToFreeAgency(player);
        expiredPlayers.push({
          player,
          team
        });
      } else {
        remainingRoster.push(player);
      }
    }

    gameState.rosters[team.id] = remainingRoster;
  }

  if (expiredPlayers.length > 0) {
    const userExpired = expiredPlayers.filter(item => item.team.id === gameState.selectedTeamId);

    if (userExpired.length > 0) {
      const names = userExpired.map(item => item.player.name).join(", ");

      addInboxMessage(
        "Players Entered Free Agency",
        `${userExpired.length} player(s) from your team entered free agency: ${names}. Free agency opens on June 30.`,
        "urgent",
        false,
        "free_agency"
      );
    }

    addInboxMessage(
      "League Free Agency Pool Updated",
      `${expiredPlayers.length} expired contract player(s) around the league have entered free agency.`,
      "event"
    );
  }

  ensureLeagueRostersAfterPlayerMovement();
  gameState.processedEvents[key] = true;
}

function movePlayerToFreeAgency(player) {
  player.teamId = null;
  player.teamName = "Free Agent";
  player.salary = 0;
  player.contractYears = 0;
  player.contract = "Free Agent";
  player.contractType = "Free Agent";
  player.expectedSalary = estimateExpectedSalary(player);
  player.expectedYears = estimateExpectedYears(player);
  player.interest = "Neutral";
  player.morale = "Available";

  gameState.freeAgents.push(player);

  if (player.id && gameState.selectedTeamId) {
    removePlayerFromRotation(player.id);
  }
}

function processRetirements() {
  const key = `retirements_${gameState.seasonLabel}`;

  if (gameState.processedEvents[key]) return;

  if (!gameState.playoffs || !gameState.playoffs.playoffsComplete) return;

  const retiredPlayers = [];

  for (let team of gameState.teams) {
    const roster = gameState.rosters[team.id] || [];
    const remainingRoster = [];

    for (let player of roster) {
      if (player.age >= RETIREMENT_AGE) {
        retiredPlayers.push({
          player,
          team
        });

        if (team.id === gameState.selectedTeamId) {
          removePlayerFromRotation(player.id);
        }
      } else {
        remainingRoster.push(player);
      }
    }

    gameState.rosters[team.id] = remainingRoster;
  }

  if (gameState.freeAgents) {
    const remainingFreeAgents = [];

    for (let player of gameState.freeAgents) {
      if (player.age >= RETIREMENT_AGE) {
        retiredPlayers.push({
          player,
          team: null
        });
      } else {
        remainingFreeAgents.push(player);
      }
    }

    gameState.freeAgents = remainingFreeAgents;
  }

  for (let retired of retiredPlayers) {
    const replacement = createGeneratedFreeAgent(true);
    gameState.freeAgents.push(replacement);
  }

  if (retiredPlayers.length > 0) {
    const userRetired = retiredPlayers.filter(item => item.team && item.team.id === gameState.selectedTeamId);

    if (userRetired.length > 0) {
      const names = userRetired.map(item => item.player.name).join(", ");

      addInboxMessage(
        "Player Retirement",
        `${names} retired after the season. Replacement free agents have entered the league.`,
        "event"
      );
    }

    addInboxMessage(
      "League Retirements",
      `${retiredPlayers.length} player(s) retired. ${retiredPlayers.length} young replacement free agent(s) entered the league.`,
      "event"
    );
  }

  ensureLeagueRostersAfterPlayerMovement();
  gameState.processedEvents[key] = true;
}

function processOtherTeamFreeAgentSignings() {
  /*
    Old mass-signing system disabled.
    CPU free agency is now handled by processDailyFreeAgencyMarket().
  */
  return;
}

function isOpeningRosterFillWindow() {
  if (!gameState || !gameState.started || !gameState.currentDate) return false;

  if (gameState.offseasonActive === true) return false;

  const dateKey = getCurrentDateKey();

  // Training Camp through the day before Opening Night.
  return dateKey >= 925 && dateKey < 1020;
}

function getOpeningRosterFillDateKey() {
  const date = new Date(gameState.currentDate);
  return `opening-roster-fill-${gameState.seasonLabel}-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function shouldProcessOpeningRosterFillMarket() {
  if (!isOpeningRosterFillWindow()) return false;

  if (!gameState.processedOpeningRosterFillDays) {
    gameState.processedOpeningRosterFillDays = {};
  }

  const key = getOpeningRosterFillDateKey();

  return gameState.processedOpeningRosterFillDays[key] !== true;
}

function markOpeningRosterFillMarketProcessed() {
  if (!gameState.processedOpeningRosterFillDays) {
    gameState.processedOpeningRosterFillDays = {};
  }

  gameState.processedOpeningRosterFillDays[getOpeningRosterFillDateKey()] = true;
}

function getCpuTeamsNeedingOpeningRosterPlayers() {
  if (!gameState || !Array.isArray(gameState.teams)) return [];

  return gameState.teams
    .filter(team => {
      if (!team) return false;

      // Keep the user's team manual. CPU teams fill automatically.
      if (Number(team.id) === Number(gameState.selectedTeamId)) return false;

      return getRosterCount(team.id) < MAX_ROSTER_SIZE;
    })
    .sort((a, b) => getRosterCount(a.id) - getRosterCount(b.id));
}

function getOpeningRosterFillDailyLimit() {
  const dateKey = getCurrentDateKey();

  // Sep 25-Sep 30: slower early training camp market.
  if (dateKey < 1001) return randomInt(4, 7);

  // Oct 1-Oct 9: normal signing pace.
  if (dateKey < 1010) return randomInt(5, 8);

  // Oct 10-Opening Night: teams rush to finish rosters.
  return randomInt(7, 10);
}

function ensureEnoughOpeningRosterFreeAgents() {
  if (!gameState.freeAgents) {
    gameState.freeAgents = [];
  }

  while (gameState.freeAgents.filter(player => !player.pendingAgreement).length < 8) {
    gameState.freeAgents.push(createGeneratedFreeAgent(true));
  }
}

function findBestOpeningRosterFreeAgentIndexForTeam(teamId) {
  if (!gameState || !Array.isArray(gameState.freeAgents)) return -1;

  const roster = getRosterByTeamId(teamId);
  const positionNeeds = getRosterPositionNeeds(roster);

  let bestIndex = -1;
  let bestScore = -999;

  for (let i = 0; i < gameState.freeAgents.length; i++) {
    const player = gameState.freeAgents[i];

    if (!player || player.pendingAgreement) continue;

    const needScore = positionNeeds[player.primaryPosition] || 0;
    const abilityScore = Number(player.currentAbility || 0) / 100;
    const salaryPenalty = Number(getFreeAgentExpectedSalary(player) || 1) / 25;

    const score = needScore * 2 + abilityScore - salaryPenalty + randomInt(-2, 2);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function signOpeningRosterFreeAgentToCpuTeam(player, team) {
  if (!player || !team) return false;

  const salary = Number(player.expectedSalary || estimateExpectedSalary(player) || 1);
  const years = Number(player.expectedYears || estimateExpectedYears(player) || 1);

  removeFreeAgentFromMarket(player);

  player.teamId = team.id;
  player.teamName = team.name;
  player.startsAsFreeAgent = false;
  player.contractType = "Standard";
  player.rosterContractType = "Standard";
  player.salary = salary;
  player.contractYears = years;
  player.contract = `${years} yr${years === 1 ? "" : "s"} / ${formatMoney(salary)}`;
  player.interest = "-";
  player.morale = player.morale || "Neutral";

  if (!gameState.rosters[team.id]) {
    gameState.rosters[team.id] = [];
  }

  const alreadyOnRoster = gameState.rosters[team.id].some(item =>
    Number(item.id) === Number(player.id) ||
    Number(item.playerId) === Number(player.playerId)
  );

  if (!alreadyOnRoster) {
    gameState.rosters[team.id].push(player);
  }

  normalizePlayerContract(player);

  ensureFreeAgencyAgreementLists();

  gameState.freeAgencyDeals.push({
    seasonLabel: gameState.seasonLabel,
    date: formatDate(gameState.currentDate),
    playerId: player.id || player.playerId,
    playerName: player.name,
    teamId: team.id,
    teamName: team.name,
    salary,
    years,
    totalValue: salary * years,
    type: "Opening Roster Signing"
  });

  if (typeof recordFreeAgentSigningTransaction === "function") {
    recordFreeAgentSigningTransaction(player, team, salary, years);
  }

  return {
  type: "signing",
  playerName: player.name,
  teamId: team.id,
  teamName: team.name,
  salary,
  years,
  tier: getFreeAgentMarketTier(player)
};
}

function processOpeningRosterFillMarket() {
  if (!shouldProcessOpeningRosterFillMarket()) return;

  ensureFreeAgents();
  ensureEnoughOpeningRosterFreeAgents();

  const teamsNeedingPlayers = getCpuTeamsNeedingOpeningRosterPlayers();

  if (teamsNeedingPlayers.length === 0) {
    markOpeningRosterFillMarketProcessed();
    gameState.openingRosterFillCompleteForSeason = gameState.seasonLabel;
    return;
  }

  const limit = getOpeningRosterFillDailyLimit();
  const moves = [];

  for (let i = 0; i < limit; i++) {
    const teamsStillNeedingPlayers = getCpuTeamsNeedingOpeningRosterPlayers();

    if (teamsStillNeedingPlayers.length === 0) break;

    ensureEnoughOpeningRosterFreeAgents();

    const team = teamsStillNeedingPlayers[0];
    const freeAgentIndex = findBestOpeningRosterFreeAgentIndexForTeam(team.id);

    if (freeAgentIndex < 0) break;

    const player = gameState.freeAgents[freeAgentIndex];
    const move = signOpeningRosterFreeAgentToCpuTeam(player, team);

    if (move) {
      moves.push(move);
    }
  }

  markOpeningRosterFillMarketProcessed();

  const majorMoves = moves.filter(move => isMajorFreeAgencyMove(move));

  for (let move of majorMoves) {
    addInboxMessage(
      "Free Agent Signed",
      formatFreeAgencyMoveSentence(move),
      "free agency",
      false,
      "team-profile",
      {
        teamId: move.teamId,
        teamName: move.teamName,
        playerName: move.playerName
      }
    );
  }

  if (moves.length > 0) {
    ensureRotation();
  }
}

function fillAllTeamsToFifteenFromFreeAgency() {
  /*
    Old instant roster-fill system disabled.
    CPU teams now fill rosters through processOpeningRosterFillMarket()
    day by day during training camp.
  */
  return;
}

function formatFreeAgencyMoveSentence(move) {
  if (!move) return "";

  const contractText = `${move.years} yr${move.years === 1 ? "" : "s"} / ${formatMoney(move.salary)} per year`;

  if (move.type === "agreement") {
    return `${move.playerName} reached a verbal agreement with the ${move.teamName} for ${contractText}.`;
  }

  return `${move.playerName} signed with the ${move.teamName} for ${contractText}.`;
}

function isMajorFreeAgencyMove(move) {
  if (!move) return false;

  const salary = Number(move.salary || 0);
  const years = Number(move.years || 1);
  const totalValue = salary * years;

  return (
    salary >= 8 ||
    totalValue >= 30 ||
    move.tier === "star" ||
    move.tier === "starter"
  );
}

function formatFreeAgencyMoveLine(move) {
  return `${move.playerName} → ${move.teamName} (${move.years} yr${move.years === 1 ? "" : "s"} / ${formatMoney(move.salary)})`;
}

function signPlayerToTeam(player, teamId) {
  const team = getTeamById(teamId);

  if (!team) return;

  player.teamId = team.id;
  player.teamName = team.name;
  player.salary = player.expectedSalary || estimateExpectedSalary(player);
  player.contractYears = player.expectedYears || estimateExpectedYears(player);
  player.contract = `${player.contractYears} yrs / ${formatMoney(player.salary)}`;
  player.contractType = "Standard";
  player.morale = "Neutral";
  player.interest = "Neutral";

  if (!gameState.rosters[team.id]) {
    gameState.rosters[team.id] = [];
  }

  gameState.rosters[team.id].push(player);
}

function ensureLeagueRostersAfterPlayerMovement() {
  if (!gameState.rosters) return;

  for (let team of gameState.teams) {
    if (!gameState.rosters[team.id]) {
      gameState.rosters[team.id] = [];
    }

    for (let player of gameState.rosters[team.id]) {
      player.teamId = team.id;
      player.teamName = team.name;
      normalizePlayerContract(player);
    }
  }

  ensureFreeAgents();
}

function agePlayersAndDecreaseContractsOneYear() {
  for (let teamId in gameState.rosters) {
    for (let player of gameState.rosters[teamId]) {
      player.age++;
      player.yearsPro++;
      player.development = getDevelopmentStage(player.age);
      player.contractYears = Math.max(0, Number(player.contractYears || 0) - 1);
      player.contract = `${player.contractYears} yrs / ${formatMoney(player.salary)}`;
      player.seasonStats = createEmptySeasonStats();
    }
  }

  if (gameState.freeAgents) {
    for (let player of gameState.freeAgents) {
      player.age++;
      player.yearsPro++;
      player.development = getDevelopmentStage(player.age);
      player.seasonStats = createEmptySeasonStats();
      player.expectedSalary = estimateExpectedSalary(player);
      player.expectedYears = estimateExpectedYears(player);
      player.interest = "Neutral";
    }
  }
}

function ensureLeagueTransactionsStorage() {
  if (!gameState.leagueTransactions) {
    gameState.leagueTransactions = [];
  }
}

function initializeLeagueTransactionsScreen() {
  ensureLeagueTransactionsStorage();
  populateLeagueTransactionTeamFilter();
  updateLeagueTransactionsSeasonLabel();
  connectLeagueTransactionFilters();
  displayLeagueTransactions();
}

function updateLeagueTransactionsSeasonLabel() {
  const seasonLabel = document.getElementById("league-transactions-season-label");

  if (!seasonLabel) return;

  seasonLabel.textContent = gameState.seasonLabel || getSeasonLabel(gameState.seasonStartYear);
}

function populateLeagueTransactionTeamFilter() {
  const select = document.getElementById("league-transaction-team-filter");

  if (!select || !Array.isArray(gameState.teams)) return;

  const currentValue = select.value || "ALL";

  select.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "ALL";
  allOption.textContent = "All Teams";
  select.appendChild(allOption);

  const sortedTeams = [...gameState.teams].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  for (let team of sortedTeams) {
    const option = document.createElement("option");
    option.value = String(team.id);
    option.textContent = team.name;
    select.appendChild(option);
  }

  const hasCurrentValue = Array.from(select.options).some(option => option.value === currentValue);

  select.value = hasCurrentValue ? currentValue : "ALL";
}

function connectLeagueTransactionFilters() {
  const typeFilter = document.getElementById("league-transaction-type-filter");
  const teamFilter = document.getElementById("league-transaction-team-filter");
  const sortFilter = document.getElementById("league-transaction-sort-filter");

  if (typeFilter) {
    typeFilter.onchange = displayLeagueTransactions;
  }

  if (teamFilter) {
    teamFilter.onchange = displayLeagueTransactions;
  }

  if (sortFilter) {
    sortFilter.onchange = displayLeagueTransactions;
  }
}

function getLeagueTransactionPlayerImportance(transaction) {
  if (!transaction) return 0;

  if (typeof transaction.importance === "number") {
    return transaction.importance;
  }

  if (typeof transaction.playerCA === "number") {
    return transaction.playerCA;
  }

  if (typeof transaction.currentAbility === "number") {
    return transaction.currentAbility;
  }

  return 0;
}

function displayLeagueTransactions() {
  ensureLeagueTransactionsStorage();

  const list = document.getElementById("league-transactions-list");

  if (!list) return;

  const typeFilter = document.getElementById("league-transaction-type-filter");
  const teamFilter = document.getElementById("league-transaction-team-filter");
  const sortFilter = document.getElementById("league-transaction-sort-filter");

  const selectedType = typeFilter ? typeFilter.value : "ALL";
  const selectedTeam = teamFilter ? teamFilter.value : "ALL";
  const selectedSort = sortFilter ? sortFilter.value : "RECENT";

  let transactions = [...gameState.leagueTransactions].filter(transaction => {
  return !transaction.seasonLabel || transaction.seasonLabel === gameState.seasonLabel;
});

  if (selectedType === "FREE_AGENCY") {
  transactions = transactions.filter(transaction =>
    transaction.type === "SIGNING" ||
    transaction.type === "AGREEMENT"
  );
} else if (selectedType !== "ALL") {
  transactions = transactions.filter(transaction => transaction.type === selectedType);
}

  if (selectedTeam !== "ALL") {
    transactions = transactions.filter(transaction => {
      return String(transaction.teamId) === selectedTeam;
    });
  }

  if (selectedSort === "BIGGEST_NAMES") {
    transactions.sort((a, b) => {
      const importanceDifference = getLeagueTransactionPlayerImportance(b) - getLeagueTransactionPlayerImportance(a);

      if (importanceDifference !== 0) {
        return importanceDifference;
      }

      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
  } else {
    transactions.sort((a, b) => {
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
  }

  if (transactions.length === 0) {
    list.innerHTML = `
      <div class="league-transactions-empty">
        <div class="empty-transaction-icon">↔</div>
        <h3>No transactions recorded yet</h3>
        <p>
          Once signings, trades, waivers, draft picks, or G-League moves happen, they will appear here.
        </p>
      </div>
    `;
    return;
  }

  const groupedTransactions = groupLeagueTransactionsByDate(transactions);

  list.innerHTML = groupedTransactions.map(group => {
    return `
      <div class="league-transaction-date-group">
        <div class="league-transaction-date-label">
          <span>${formatLeagueTransactionDate(group.date)}</span>
        </div>

        <div class="league-transaction-date-items">
          ${group.transactions.map(transaction => renderLeagueTransactionRow(transaction)).join("")}
        </div>
      </div>
    `;
  }).join("");
}

function groupLeagueTransactionsByDate(transactions) {
  const groups = [];

  for (let transaction of transactions) {
    const rawDate = transaction.date || "Unknown Date";
    const existingGroup = groups.find(group => group.date === rawDate);

    if (existingGroup) {
      existingGroup.transactions.push(transaction);
    } else {
      groups.push({
        date: rawDate,
        transactions: [transaction]
      });
    }
  }

  return groups;
}

function formatLeagueTransactionDate(rawDate) {
  if (!rawDate || rawDate === "Unknown Date") {
    return "Unknown Date";
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function renderLeagueTransactionRow(transaction) {
  const team = getTeamById(transaction.teamId);
  const teamLogo = renderLeagueTransactionTeamLogo(team);
  const playerImage = renderLeagueTransactionPlayerImage(transaction);
  const typeLabel = getLeagueTransactionTypeLabel(transaction.type);
  const typeClass = getLeagueTransactionTypeClass(transaction.type);

  return `
    <div class="league-transaction-row">
      <div class="league-transaction-type ${typeClass}">
        ${typeLabel}
      </div>

      <div class="league-transaction-identity">
        ${teamLogo}
        ${playerImage}
      </div>

      <div class="league-transaction-main">
        <p>${transaction.text || "Transaction details unavailable."}</p>
        <span>${team ? team.name : "Unknown Team"}</span>
      </div>
    </div>
  `;
}

function renderLeagueTransactionTeamLogo(team) {
  if (!team) {
    return `
      <div class="league-transaction-team-logo">
        FA
      </div>
    `;
  }

  const logoPath = team.logo || team.logoPath || team.image || team.imagePath || team.teamLogo || "";

  if (logoPath) {
    return `
      <img class="league-transaction-team-logo image-logo" src="${logoPath}" alt="${team.name}">
    `;
  }

  const colors = getTeamColors ? getTeamColors(team) : null;
  const primaryColor = colors ? colors.primaryColor : "#1d4ed8";
  const secondaryColor = colors ? colors.secondaryColor : "#67e8f9";

  return `
    <div
      class="league-transaction-team-logo"
      style="background: ${primaryColor}; border-color: ${secondaryColor};"
    >
      ${team.abbrev || getTeamInitials(team.name)}
    </div>
  `;
}

function renderLeagueTransactionPlayerImage(transaction) {
  const imagePath = typeof normalizePlayerPortraitPath === "function"
    ? normalizePlayerPortraitPath(transaction.playerImage || transaction.image || "")
    : (transaction.playerImage || transaction.image || "");
  const finalPath = imagePath || "images/players/default-silhouette.png";

  return `
    <div class="league-transaction-player-headshot-wrap">
      <img
        class="league-transaction-player-headshot"
        src="${escapeFreeAgencyImageAttr(finalPath)}"
        alt="${escapeFreeAgencyImageAttr(transaction.playerName || "Player")}"
        onerror="this.src='images/players/default-silhouette.png'"
      >
    </div>
  `;
}

function getTeamInitials(teamName) {
  if (!teamName) return "TM";

  return teamName
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function getLeagueTransactionTypeLabel(type) {
  const labels = {
  SIGNING: "Signing",
  AGREEMENT: "Agreement",
  TRADE: "Trade",
  WAIVED: "Waived",
  G_LEAGUE: "G-League",
  DRAFT: "Draft"
};

  return labels[type] || "Move";
}

function getLeagueTransactionTypeClass(type) {
  const classes = {
  SIGNING: "transaction-type-signing",
  AGREEMENT: "transaction-type-agreement",
  TRADE: "transaction-type-trade",
  WAIVED: "transaction-type-waived",
  G_LEAGUE: "transaction-type-g-league",
  DRAFT: "transaction-type-draft"
};

  return classes[type] || "transaction-type-default";
}

function getLeagueTransactionDateISO() {
  if (!gameState || !gameState.currentDate) {
    return new Date().toISOString();
  }

  return new Date(gameState.currentDate).toISOString();
}

function getPlayerTransactionCA(player) {
  if (!player) return 0;

  return (
    Number(player.currentAbility) ||
    Number(player.ca) ||
    Number(player.CA) ||
    Number(player.overall) ||
    0
  );
}

function addLeagueTransaction(transaction) {
  ensureLeagueTransactionsStorage();

  const normalizedTransaction = {
    id: transaction.id || `league-transaction-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    seasonLabel: transaction.seasonLabel || gameState.seasonLabel,
    date: transaction.date || getLeagueTransactionDateISO(),
    type: transaction.type || "MOVE",
    teamId: transaction.teamId || null,
    teamName: transaction.teamName || "",
    playerId: transaction.playerId || null,
    playerName: transaction.playerName || "",
    playerCA: Number(transaction.playerCA || 0),
    playerImage: typeof normalizePlayerPortraitPath === "function"
      ? normalizePlayerPortraitPath(transaction.playerImage || "")
      : (transaction.playerImage || "images/players/default-silhouette.png"),
    text: transaction.text || "Transaction recorded."
  };

  const alreadyExists = gameState.leagueTransactions.some(existingTransaction =>
    existingTransaction.seasonLabel === normalizedTransaction.seasonLabel &&
    existingTransaction.type === normalizedTransaction.type &&
    String(existingTransaction.teamId) === String(normalizedTransaction.teamId) &&
    String(existingTransaction.playerId) === String(normalizedTransaction.playerId) &&
    existingTransaction.text === normalizedTransaction.text
  );

  if (alreadyExists) return;

  gameState.leagueTransactions.push(normalizedTransaction);

  if (gameState.leagueTransactions.length > 500) {
    gameState.leagueTransactions = gameState.leagueTransactions.slice(-500);
  }

  if (currentSecondaryScreen === "league-transactions-screen") {
    displayLeagueTransactions();
  }
}

function recordFreeAgentSigningTransaction(player, team, salary, years) {
  if (!player || !team) return;

  addLeagueTransaction({
    type: "SIGNING",
    teamId: team.id,
    teamName: team.name,
    playerId: player.id || player.playerId,
    playerName: player.name,
    playerCA: getPlayerTransactionCA(player),
    playerImage: getFreeAgencyPlayerImagePath(player),
    text: `${team.name} signed ${player.name} to a ${years}-year contract worth ${formatMoney(salary)} per season.`
  });
}

function recordFreeAgentAgreementTransaction(player, team, salary, years) {
  if (!player || !team) return;

  addLeagueTransaction({
    type: "AGREEMENT",
    teamId: team.id,
    teamName: team.name,
    playerId: player.id || player.playerId,
    playerName: player.name,
    playerCA: getPlayerTransactionCA(player),
    playerImage: getFreeAgencyPlayerImagePath(player),
    text: `${team.name} reached a verbal agreement with ${player.name} on a ${years}-year deal worth ${formatMoney(salary)} per season.`
  });
}

function recordWaivedTransaction(player, team) {
  if (!player || !team) return;

  addLeagueTransaction({
    type: "WAIVED",
    teamId: team.id,
    teamName: team.name,
    playerId: player.id || player.playerId,
    playerName: player.name,
    playerCA: getPlayerTransactionCA(player),
    playerImage: getFreeAgencyPlayerImagePath(player),
    text: `${team.name} waived ${player.name}.`
  });
}

function resetLeagueTransactionsForNewSeason() {
  gameState.leagueTransactions = [];

  const typeFilter = document.getElementById("league-transaction-type-filter");
  const teamFilter = document.getElementById("league-transaction-team-filter");
  const sortFilter = document.getElementById("league-transaction-sort-filter");

  if (typeFilter) typeFilter.value = "ALL";
  if (teamFilter) teamFilter.value = "ALL";
  if (sortFilter) sortFilter.value = "RECENT";

  if (currentSecondaryScreen === "league-transactions-screen") {
    updateLeagueTransactionsSeasonLabel();
    displayLeagueTransactions();
  }
}


function showFreeAgencyDealsList() {
  if (!gameState || !gameState.started) return;

  showMainSection("league");

  setTimeout(() => {
    showSecondaryScreen("league-transactions-screen");

    setTimeout(() => {
      const typeFilter = document.getElementById("league-transaction-type-filter");
      const teamFilter = document.getElementById("league-transaction-team-filter");
      const sortFilter = document.getElementById("league-transaction-sort-filter");

      if (typeFilter) typeFilter.value = "FREE_AGENCY";
      if (teamFilter) teamFilter.value = "ALL";
      if (sortFilter) sortFilter.value = "BIGGEST_NAMES";

      if (typeof displayLeagueTransactions === "function") {
        displayLeagueTransactions();
      }
    }, 0);
  }, 0);
}
