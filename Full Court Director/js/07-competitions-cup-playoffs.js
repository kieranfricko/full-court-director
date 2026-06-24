function createCupState() {
  const groups = [];
  const cupStats = {};
  const eastTeams = shuffleArray(baseTeams.filter(team => team.conference === "East"));
  const westTeams = shuffleArray(baseTeams.filter(team => team.conference === "West"));

  for (let i = 0; i < 3; i++) {
    groups.push({
      name: `East Group ${String.fromCharCode(65 + i)}`,
      conference: "East",
      teamIds: eastTeams.slice(i * 5, i * 5 + 5).map(team => team.id)
    });
  }

  for (let i = 0; i < 3; i++) {
    groups.push({
      name: `West Group ${String.fromCharCode(65 + i)}`,
      conference: "West",
      teamIds: westTeams.slice(i * 5, i * 5 + 5).map(team => team.id)
    });
  }

  for (let team of baseTeams) {
    cupStats[team.id] = {
      teamId: team.id,
      wins: 0,
      losses: 0,
      pointDiff: 0,
      pointsFor: 0,
      gamesPlayed: 0
    };
  }

  return {
    groups,
    cupStats,
    knockoutStarted: false,
    knockoutComplete: false,
    championId: null,
    games: [],
    bracket: {
      quarterfinals: [],
      semifinals: [],
      final: null
    }
  };
}

function ensureCupStateForSchedule() {
  if (!gameState.cup || !gameState.cup.groups || !gameState.cup.games) {
    gameState.cup = createCupState();
  }
}

function getUserCupGroupOpponents(selectedTeamId) {
  ensureCupStateForSchedule();

  const userGroup = gameState.cup.groups.find(group =>
    group.teamIds.map(id => Number(id)).includes(Number(selectedTeamId))
  );

  if (!userGroup) return [];

  return userGroup.teamIds
    .filter(id => Number(id) !== Number(selectedTeamId))
    .map(id => getBaseTeamById(id) || baseTeams.find(team => Number(team.id) === Number(id)))
    .filter(Boolean)
    .slice(0, 4);
}

function getCupGroupDates() {
  return [
    new Date(gameState.seasonStartYear, 10, 3),
    new Date(gameState.seasonStartYear, 10, 7),
    new Date(gameState.seasonStartYear, 10, 14),
    new Date(gameState.seasonStartYear, 10, 21)
  ];
}

function assignCupGamesToUserSchedule() {
  if (!gameState || !gameState.userSchedule || !gameState.cup) return;

  const userId = Number(gameState.selectedTeamId);
  const userGroup = getCupGroupForTeam(userId);

  if (!userGroup) return;

  const cupOpponentIds = userGroup.teamIds
    .filter(teamId => Number(teamId) !== userId)
    .slice(0, 4);

  const cupTargetDates = [
    new Date(gameState.seasonStartYear, 10, 4),
    new Date(gameState.seasonStartYear, 10, 11),
    new Date(gameState.seasonStartYear, 10, 18),
    new Date(gameState.seasonStartYear, 10, 25)
  ];

  cupOpponentIds.forEach((opponentId, index) => {
    const opponent = getTeamById(opponentId) || getBaseTeamById(opponentId);
    if (!opponent) return;

    const targetDate = cupTargetDates[index] || cupTargetDates[cupTargetDates.length - 1];

    const scheduleGame = findBestRegularSeasonSlotForCupGroupGame(opponentId, targetDate);

    if (!scheduleGame) return;

    scheduleGame.date = new Date(targetDate);
    scheduleGame.opponentId = opponent.id;
    scheduleGame.opponentName = opponent.name;
    scheduleGame.home = index % 2 === 0;
    scheduleGame.competition = "The Cup Group";
    scheduleGame.cupGame = true;
    scheduleGame.cupRound = "Group";
    scheduleGame.countsForRegularSeason = true;
    scheduleGame.replacedByCup = false;
  });

  gameState.userSchedule.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function findBestRegularSeasonSlotForCupGroupGame(opponentId, targetDate) {
  if (!gameState || !gameState.userSchedule) return null;

  const opponentMatch = gameState.userSchedule.find(game =>
    game &&
    !game.played &&
    !game.cupGame &&
    !game.playoffGame &&
    !game.playInGame &&
    game.countsForRegularSeason !== false &&
    Number(game.opponentId) === Number(opponentId)
  );

  if (opponentMatch) {
    return opponentMatch;
  }

  const targetTime = new Date(targetDate).getTime();

  const availableGames = gameState.userSchedule
    .filter(game =>
      game &&
      !game.played &&
      !game.cupGame &&
      !game.playoffGame &&
      !game.playInGame &&
      game.countsForRegularSeason !== false &&
      new Date(game.date).getMonth() === 10
    )
    .sort((a, b) =>
      Math.abs(new Date(a.date).getTime() - targetTime) -
      Math.abs(new Date(b.date).getTime() - targetTime)
    );

  if (availableGames.length) {
    return availableGames[0];
  }

  return gameState.userSchedule.find(game =>
    game &&
    !game.played &&
    !game.cupGame &&
    !game.playoffGame &&
    !game.playInGame &&
    game.countsForRegularSeason !== false
  );
}

function removeOneRegularSeasonGameForCupDate(cupDate) {
  if (!gameState || !gameState.userSchedule) return false;

  const cupDateKey = formatDateKey(cupDate);

  let index = gameState.userSchedule.findIndex(game =>
    !game.cupGame &&
    !game.playoffGame &&
    !game.playInGame &&
    game.countsForRegularSeason !== false &&
    !game.played &&
    formatDateKey(game.date) === cupDateKey
  );

  if (index === -1) {
    index = gameState.userSchedule.findIndex(game =>
      !game.cupGame &&
      !game.playoffGame &&
      !game.playInGame &&
      game.countsForRegularSeason !== false &&
      !game.played &&
      new Date(game.date) > new Date(cupDate)
    );
  }

  if (index === -1) {
    index = gameState.userSchedule.findIndex(game =>
      !game.cupGame &&
      !game.playoffGame &&
      !game.playInGame &&
      game.countsForRegularSeason !== false &&
      !game.played
    );
  }

  if (index === -1) return false;

  gameState.userSchedule.splice(index, 1);
  return true;
}

function getCupGroupForTeam(teamId) {
  if (!gameState || !gameState.cup || !Array.isArray(gameState.cup.groups)) {
    return null;
  }

  return gameState.cup.groups.find(group =>
    group.teamIds.some(id => Number(id) === Number(teamId))
  );
}

function processCupKnockoutSetup() {
  if (gameState.cup.knockoutStarted) return;

  const setupDate = new Date(gameState.seasonStartYear, 11, 8);

  if (gameState.currentDate < setupDate) return;

  const qualifiers = getCupQualifiers();

  const quarterfinals = [
    createCupKnockoutGame(qualifiers[0], qualifiers[7], new Date(gameState.seasonStartYear, 11, 9), "The Cup Quarterfinal"),
    createCupKnockoutGame(qualifiers[1], qualifiers[6], new Date(gameState.seasonStartYear, 11, 9), "The Cup Quarterfinal"),
    createCupKnockoutGame(qualifiers[2], qualifiers[5], new Date(gameState.seasonStartYear, 11, 10), "The Cup Quarterfinal"),
    createCupKnockoutGame(qualifiers[3], qualifiers[4], new Date(gameState.seasonStartYear, 11, 10), "The Cup Quarterfinal")
  ];

  gameState.cup.bracket.quarterfinals = quarterfinals;
  gameState.cup.games = quarterfinals;
  gameState.cup.knockoutStarted = true;

  addInboxMessage("The Cup Knockout Stage Set", "The Cup quarterfinal matchups have been set.", "event");

  addUserCupKnockoutGamesToSchedule();
}

function getCupQualifiers() {
  const qualifiers = [];
  const wildcardCandidates = {
    East: [],
    West: []
  };

  for (let group of gameState.cup.groups) {
    const sorted = sortCupGroupTeams(group.teamIds);
    qualifiers.push(sorted[0]);
    wildcardCandidates[group.conference].push(sorted[1]);
  }

  const eastWildCard = sortCupTeamIds(wildcardCandidates.East)[0];
  const westWildCard = sortCupTeamIds(wildcardCandidates.West)[0];

  qualifiers.push(eastWildCard);
  qualifiers.push(westWildCard);

  return sortCupTeamIds(qualifiers);
}

function sortCupGroupTeams(teamIds) {
  return sortCupTeamIds(teamIds);
}

function sortCupTeamIds(teamIds) {
  return [...teamIds].sort((a, b) => {
    const aStats = gameState.cup.cupStats[a];
    const bStats = gameState.cup.cupStats[b];
    const aTeam = getTeamById(a);
    const bTeam = getTeamById(b);

    if (bStats.wins !== aStats.wins) return bStats.wins - aStats.wins;
    if (bStats.pointDiff !== aStats.pointDiff) return bStats.pointDiff - aStats.pointDiff;
    if (bStats.pointsFor !== aStats.pointsFor) return bStats.pointsFor - aStats.pointsFor;
    if (bTeam.wins !== aTeam.wins) return bTeam.wins - aTeam.wins;

    return Math.random() - 0.5;
  });
}

function createCupKnockoutGame(teamAId, teamBId, date, round) {
  return {
    id: Date.now() + Math.random(),
    teamAId,
    teamBId,
    teamAScore: null,
    teamBScore: null,
    winnerId: null,
    loserId: null,
    date,
    round,
    played: false,
    countsForRegularSeason: round !== "The Cup Final"
  };
}

function addUserCupKnockoutGamesToSchedule() {
  const userId = Number(gameState.selectedTeamId);

  if (!gameState.cup || !gameState.cup.games || !gameState.userSchedule) return;

  for (let cupGame of gameState.cup.games) {
    const userInGame =
      Number(cupGame.teamAId) === userId ||
      Number(cupGame.teamBId) === userId;

    if (!userInGame || cupGame.played) continue;

    const alreadyExists = gameState.userSchedule.some(game =>
      game.seriesId === cupGame.id
    );

    if (alreadyExists) continue;

    const opponentId = Number(cupGame.teamAId) === userId
      ? cupGame.teamBId
      : cupGame.teamAId;

    const opponent = getTeamById(opponentId) || getBaseTeamById(opponentId);

    if (!opponent) continue;

    const isCupFinal = cupGame.round === "The Cup Final";
    const countsForRegularSeason = !isCupFinal;

    if (countsForRegularSeason) {
      replaceRegularSeasonSlotWithCupKnockoutGame(cupGame, opponent);
    } else {
      gameState.userSchedule.push(createUserScheduleGame({
        opponent,
        date: cupGame.date,
        home: false,
        competition: cupGame.round,
        cupGame: true,
        cupRound: "Final",
        countsForRegularSeason: false,
        replacedByCup: false,
        neutralSite: true,
        seriesId: cupGame.id
      }));
    }
  }

  gameState.userSchedule.sort((a, b) => new Date(a.date) - new Date(b.date));

  validateUserSchedule82();
}

function replaceRegularSeasonSlotWithCupKnockoutGame(cupGame, opponent) {
  if (!gameState || !gameState.userSchedule || !cupGame || !opponent) return false;

  const cupDate = new Date(cupGame.date);
  const cupDateKey = formatDateKey(cupDate);

  let slot = gameState.userSchedule.find(game =>
    game &&
    !game.played &&
    !game.cupGame &&
    !game.playoffGame &&
    !game.playInGame &&
    game.countsForRegularSeason !== false &&
    formatDateKey(game.date) === cupDateKey
  );

  if (!slot) {
    slot = findClosestFutureRegularSeasonSlotForCup(cupDate);
  }

  if (!slot) return false;

  slot.originalOpponentId = slot.opponentId;
  slot.originalOpponentName = slot.opponentName;
  slot.originalCompetition = slot.competition || "Regular Season";
  slot.originalDate = new Date(slot.date);

  slot.date = new Date(cupDate);
  slot.opponentId = opponent.id;
  slot.opponentName = opponent.name;
  slot.home = cupGame.round === "The Cup Quarterfinal";
  slot.competition = cupGame.round;
  slot.cupGame = true;
  slot.cupRound = cupGame.round.replace("The Cup ", "");
  slot.countsForRegularSeason = true;
  slot.replacedByCup = true;
  slot.seriesId = cupGame.id;

  return true;
}

function findClosestFutureRegularSeasonSlotForCup(cupDate) {
  const cupTime = new Date(cupDate).getTime();

  const futureGames = gameState.userSchedule
    .filter(game =>
      game &&
      !game.played &&
      !game.cupGame &&
      !game.playoffGame &&
      !game.playInGame &&
      game.countsForRegularSeason !== false &&
      new Date(game.date).getTime() >= cupTime
    )
    .sort((a, b) =>
      Math.abs(new Date(a.date).getTime() - cupTime) -
      Math.abs(new Date(b.date).getTime() - cupTime)
    );

  if (futureGames.length) return futureGames[0];

  const anyFutureNormalGame = gameState.userSchedule.find(game =>
    game &&
    !game.played &&
    !game.cupGame &&
    !game.playoffGame &&
    !game.playInGame &&
    game.countsForRegularSeason !== false
  );

  return anyFutureNormalGame || null;
}

function removeOneFutureNormalGameForCupReplacement(cupDate) {
  if (!gameState || !gameState.userSchedule) return;

  const cupTime = new Date(cupDate).getTime();

  let index = gameState.userSchedule.findIndex(game =>
    !game.cupGame &&
    !game.playoffGame &&
    !game.playInGame &&
    game.countsForRegularSeason !== false &&
    !game.played &&
    new Date(game.date).getTime() >= cupTime
  );

  if (index === -1) {
    index = gameState.userSchedule.findIndex(game =>
      !game.cupGame &&
      !game.playoffGame &&
      !game.playInGame &&
      game.countsForRegularSeason !== false &&
      !game.played
    );
  }

  if (index !== -1) {
    gameState.userSchedule.splice(index, 1);
  }
}

function trimUserScheduleToExactly82() {
  if (!gameState || !gameState.userSchedule) return;

  const countableGames = gameState.userSchedule
    .filter(game =>
      !game.playoffGame &&
      !game.playInGame &&
      game.countsForRegularSeason !== false &&
      game.opponentId &&
      game.opponentName
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const keepIds = new Set(countableGames.slice(0, 82).map(game => game.id));

  gameState.userSchedule = gameState.userSchedule.filter(game => {
    const isCountable =
      !game.playoffGame &&
      !game.playInGame &&
      game.countsForRegularSeason !== false;

    if (!isCountable) return true;

    return keepIds.has(game.id);
  });
}

function validateUserSchedule82() {
  if (!gameState || !gameState.userSchedule) return;

  const badGames = gameState.userSchedule.filter(game =>
    !game ||
    !game.date ||
    !game.opponentId ||
    !game.opponentName ||
    game.result === "Cancelled" ||
    game.competition === "Cancelled"
  );

  const countableGames = gameState.userSchedule.filter(game =>
    game &&
    !game.playoffGame &&
    !game.playInGame &&
    game.countsForRegularSeason !== false
  );

  const gamesByMonth = {};

  for (let game of countableGames) {
    const date = new Date(game.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    gamesByMonth[key] = (gamesByMonth[key] || 0) + 1;
  }

  const decemberCutoff = new Date(gameState.seasonStartYear, 11, 31, 23, 59, 59);

  const gamesByEndOfCalendarYear = countableGames.filter(game =>
    new Date(game.date) <= decemberCutoff
  ).length;

  const firstGame = countableGames.length
    ? new Date(Math.min(...countableGames.map(game => new Date(game.date))))
    : null;

  const lastGame = countableGames.length
    ? new Date(Math.max(...countableGames.map(game => new Date(game.date))))
    : null;

  console.log("Schedule validation:");
  console.log("Total visible user schedule games:", gameState.userSchedule.length);
  console.log("Countable regular season games:", countableGames.length);
  console.log("Bad/null/cancelled games:", badGames.length);
  console.log("Games by month:", gamesByMonth);
  console.log("Games by Dec 31:", gamesByEndOfCalendarYear);
  console.log("First regular season game:", firstGame);
  console.log("Last regular season game:", lastGame);

  if (countableGames.length !== 82) {
    console.warn("Countable regular season games is not exactly 82:", countableGames.length);
  }

  if (badGames.length > 0) {
    console.warn("Bad/null/cancelled games:", badGames);
  }

  if (gamesByEndOfCalendarYear < 31 || gamesByEndOfCalendarYear > 32) {
    console.warn("Games by Dec 31 should be 31 or 32:", gamesByEndOfCalendarYear);
  }

  const seasonStart = new Date(gameState.seasonStartYear, 9, 20);
  const seasonEnd = new Date(gameState.seasonStartYear + 1, 3, 14, 23, 59, 59);

  if (firstGame && firstGame < seasonStart) {
    console.warn("Regular season starts too early:", firstGame);
  }

  if (lastGame && lastGame > seasonEnd) {
    console.warn("Regular season ends too late:", lastGame);
  }
}

function removeUserRegularSeasonGameOnDate(date) {
  gameState.userSchedule = gameState.userSchedule.filter(game => {
    const sameDate = datesMatch(game.date, date);
    const removableRegularSeasonGame =
      sameDate &&
      !game.played &&
      !game.cupGame &&
      !game.playoffGame &&
      !game.playInGame &&
      game.competition === "Regular Season";

    return !removableRegularSeasonGame;
  });
}

function processCupGamesToday() {
  if (!gameState.cup || !gameState.cup.groups || !gameState.cup.games) {
    gameState.cup = createCupState();
  }

  if (!gameState.cup) return;

  simulateOtherCupGroupGamesToday();
  processCupKnockoutSetup();

  const cupGamesToday = gameState.cup.games.filter(cupGame =>
    !cupGame.played &&
    datesMatch(cupGame.date, gameState.currentDate)
  );

  for (let cupGame of cupGamesToday) {
    const involvesUser =
      cupGame.teamAId === gameState.selectedTeamId ||
      cupGame.teamBId === gameState.selectedTeamId;

    if (involvesUser) {
      continue;
    }

    playCupKnockoutGame(cupGame);
  }

  advanceCupBracketIfNeeded();
}

function playCupKnockoutGame(cupGame) {
  const teamA = getTeamById(cupGame.teamAId);
  const teamB = getTeamById(cupGame.teamBId);

  const result = simTeamVsTeam(teamA, teamB);

  cupGame.teamAScore = result.scoreA;
  cupGame.teamBScore = result.scoreB;
  cupGame.winnerId = result.winnerId;
  cupGame.loserId = result.loserId;
  cupGame.played = true;

  if (cupGame.countsForRegularSeason) {
    applyRegularSeasonResult(teamA, teamB, result.winnerId);
  }

  updateLinkedUserCupGame(cupGame);

  if (cupGame.teamAId === gameState.selectedTeamId || cupGame.teamBId === gameState.selectedTeamId) {
    const won = result.winnerId === gameState.selectedTeamId;

    addInboxMessage(
      "The Cup Result",
      won ? `You advanced in ${cupGame.round}.` : `You were eliminated from The Cup in ${cupGame.round}.`,
      won ? "match-win" : "match-loss"
    );
  }

  advanceCupBracketIfNeeded();
}

function updateLinkedUserCupGame(cupGame) {
  const linkedGame = gameState.userSchedule.find(game => game.seriesId === cupGame.id);

  if (!linkedGame) return;

  const userIsTeamA = Number(cupGame.teamAId) === Number(gameState.selectedTeamId);
  const userScore = userIsTeamA ? cupGame.teamAScore : cupGame.teamBScore;
  const oppScore = userIsTeamA ? cupGame.teamBScore : cupGame.teamAScore;
  const userWon = Number(cupGame.winnerId) === Number(gameState.selectedTeamId);

  linkedGame.played = true;
  linkedGame.ourScore = userScore;
  linkedGame.opponentScore = oppScore;
  linkedGame.result = `${userWon ? "W" : "L"} ${userScore}-${oppScore}`;
}

function finishUserCupKnockoutGame(userScheduleGame) {
  const cupGame = gameState.cup.games.find(game => game.id === userScheduleGame.seriesId);

  if (!cupGame || cupGame.played) return;

  const userIsTeamA = cupGame.teamAId === gameState.selectedTeamId;

  cupGame.teamAScore = userIsTeamA ? userScheduleGame.ourScore : userScheduleGame.opponentScore;
  cupGame.teamBScore = userIsTeamA ? userScheduleGame.opponentScore : userScheduleGame.ourScore;

  cupGame.winnerId = userScheduleGame.ourScore > userScheduleGame.opponentScore
    ? gameState.selectedTeamId
    : userScheduleGame.opponentId;

  cupGame.loserId = userScheduleGame.ourScore > userScheduleGame.opponentScore
    ? userScheduleGame.opponentId
    : gameState.selectedTeamId;

  cupGame.played = true;

  const won = cupGame.winnerId === gameState.selectedTeamId;

  addInboxMessage(
    "The Cup Result",
    won ? `You advanced in ${cupGame.round}.` : `You were eliminated from The Cup in ${cupGame.round}.`,
    won ? "match-win" : "match-loss"
  );

  advanceCupBracketIfNeeded();
}

function advanceCupBracketIfNeeded() {
  const qfs = gameState.cup.bracket.quarterfinals;

  if (qfs.length === 4 && qfs.every(game => game.played) && gameState.cup.bracket.semifinals.length === 0) {
    const winners = qfs.map(game => game.winnerId);

    const semifinals = [
      createCupKnockoutGame(winners[0], winners[1], new Date(gameState.seasonStartYear, 11, 13), "The Cup Semifinal"),
      createCupKnockoutGame(winners[2], winners[3], new Date(gameState.seasonStartYear, 11, 13), "The Cup Semifinal")
    ];

    gameState.cup.bracket.semifinals = semifinals;
    gameState.cup.games = gameState.cup.games.concat(semifinals);

    addInboxMessage("The Cup Semifinals Set", "The Cup semifinals have been scheduled.", "event");
    addUserCupKnockoutGamesToSchedule();
    return;
  }

  const sfs = gameState.cup.bracket.semifinals;

  if (sfs.length === 2 && sfs.every(game => game.played) && !gameState.cup.bracket.final) {
    const winners = sfs.map(game => game.winnerId);

    const final = createCupKnockoutGame(
      winners[0],
      winners[1],
      new Date(gameState.seasonStartYear, 11, 16),
      "The Cup Final"
    );

    gameState.cup.bracket.final = final;
    gameState.cup.games.push(final);

    addInboxMessage("The Cup Final Set", "The Cup Final has been scheduled. This game does not count toward the regular season record.", "event");
    addUserCupKnockoutGamesToSchedule();
    refreshAll();
    return;
  }

  const final = gameState.cup.bracket.final;

  if (final && final.played && !gameState.cup.knockoutComplete) {
    gameState.cup.knockoutComplete = true;
    gameState.cup.championId = final.winnerId;

    const champion = getTeamById(final.winnerId);
    const runnerUp = getTeamById(final.loserId);

    gameState.history.cupWinners.unshift(`${gameState.seasonLabel}: ${champion.name}`);

    addInboxMessage("The Cup Champion", `${champion.name} won The Cup.`, "event");

    showModal(
      "The Cup Champion",
      `${champion.name} have won The Cup, defeating ${runnerUp ? runnerUp.name : "their opponent"} in the final.`
    );

    refreshAll();
  }
}

function updateCupStats(teamAId, teamBId, scoreA, scoreB) {
  const aStats = gameState.cup.cupStats[teamAId];
  const bStats = gameState.cup.cupStats[teamBId];

  if (!aStats || !bStats) return;

  aStats.gamesPlayed++;
  bStats.gamesPlayed++;

  aStats.pointsFor += scoreA;
  bStats.pointsFor += scoreB;

  aStats.pointDiff += scoreA - scoreB;
  bStats.pointDiff += scoreB - scoreA;

  if (scoreA > scoreB) {
    aStats.wins++;
    bStats.losses++;
  } else {
    bStats.wins++;
    aStats.losses++;
  }
}

function simulateOtherCupGroupGamesToday() {
  const month = gameState.currentDate.getMonth();
  const day = gameState.currentDate.getDate();

  if (month !== 10) return;
  if (![3, 7, 14, 21].includes(day)) return;

  for (let group of gameState.cup.groups) {
    const shuffledTeams = shuffleArray(group.teamIds);

    for (let i = 0; i < 4; i += 2) {
      const teamA = getTeamById(shuffledTeams[i]);
      const teamB = getTeamById(shuffledTeams[i + 1]);

      if (!teamA || !teamB) continue;
      if (teamA.id === gameState.selectedTeamId || teamB.id === gameState.selectedTeamId) continue;

      const result = simTeamVsTeam(teamA, teamB);
      applyRegularSeasonResult(teamA, teamB, result.winnerId);
      updateCupStats(teamA.id, teamB.id, result.scoreA, result.scoreB);
      generatePlayerStatsForGame(teamA.id, teamB.id, result.scoreA, result.scoreB);
    }
  }
}

function createEmptyPlayoffState() {
  return {
    playInInitialized: false,
    playInComplete: false,
    playoffsInitialized: false,
    playoffsComplete: false,
    championId: null,
    userEliminatedPopupShown: false,
    currentRound: null,
    playInGames: [],
    series: [],
    finalsSeries: null
  };
}

function processRegularSeasonEnd() {
  processForcedEndSeasonPlayerStats();
}

function processPlayInAndPlayoffSetup() {
  const playInDate = new Date(gameState.seasonStartYear + 1, 3, 16);
  const playoffDate = new Date(gameState.seasonStartYear + 1, 3, 21);

  if (!gameState.playoffs.playInInitialized && gameState.currentDate >= playInDate) {
    initializePlayIn();
  }

  if (
    gameState.playoffs.playInComplete &&
    !gameState.playoffs.playoffsInitialized &&
    gameState.currentDate >= playoffDate
  ) {
    initializePlayoffs();
  }
}

function getConferenceStandings(conference) {
  return gameState.teams
    .filter(team => team.conference === conference)
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses || getTeamStrength(b) - getTeamStrength(a));
}

function initializePlayIn() {
  gameState.playoffs.playInInitialized = true;
  gameState.playoffs.playInGames = [];

  const east = getConferenceStandings("East");
  const west = getConferenceStandings("West");

  createPlayInConference("East", east);
  createPlayInConference("West", west);

  addInboxMessage("Play-In Tournament Begins", "The Play-In Tournament has begun. Seeds 7-10 battle for the final two playoff spots.", "event");
  addUserPlayInGamesToSchedule();
}

function createPlayInConference(conference, standings) {
  const seed7 = standings[6];
  const seed8 = standings[7];
  const seed9 = standings[8];
  const seed10 = standings[9];

  gameState.playoffs.playInGames.push({
    id: Date.now() + Math.random(),
    conference,
    label: `${conference} 7 vs 8`,
    teamAId: seed7.id,
    teamBId: seed8.id,
    seedA: 7,
    seedB: 8,
    date: new Date(gameState.seasonStartYear + 1, 3, 16),
    played: false,
    winnerId: null,
    loserId: null,
    resultText: null,
    stage: "7-8"
  });

  gameState.playoffs.playInGames.push({
    id: Date.now() + Math.random(),
    conference,
    label: `${conference} 9 vs 10`,
    teamAId: seed9.id,
    teamBId: seed10.id,
    seedA: 9,
    seedB: 10,
    date: new Date(gameState.seasonStartYear + 1, 3, 17),
    played: false,
    winnerId: null,
    loserId: null,
    resultText: null,
    stage: "9-10"
  });
}

function addUserPlayInGamesToSchedule() {
  const userId = gameState.selectedTeamId;

  for (let game of gameState.playoffs.playInGames) {
    if (!game.played && (game.teamAId === userId || game.teamBId === userId)) {
      addPostseasonGameToUserSchedule(game, "Play-In Tournament", true, false);
      addInboxMessage("Play-In Game Scheduled", "Your team is in the Play-In Tournament. The game has been added to your schedule.", "urgent", false);
    }
  }
}

function finishPlayInGame(userScheduleGame, userWon) {
  const playInGame = gameState.playoffs.playInGames.find(game => game.id === userScheduleGame.seriesId);
  if (!playInGame) return;

  const userId = gameState.selectedTeamId;
  const opponentId = userScheduleGame.opponentId;

  playInGame.played = true;
  playInGame.winnerId = userWon ? userId : opponentId;
  playInGame.loserId = userWon ? opponentId : userId;
  playInGame.resultText = userScheduleGame.result;

  checkUserPlayInElimination(playInGame);
  advancePlayInIfNeeded();
}

function checkUserPlayInElimination(playInGame) {
  if (playInGame.loserId !== gameState.selectedTeamId) return;

  const eliminated = playInGame.stage === "9-10" || playInGame.stage === "8-seed";

  if (eliminated && !gameState.playoffs.userEliminatedPopupShown) {
    gameState.playoffs.userEliminatedPopupShown = true;

    showModal(
      "Postseason Elimination",
      "Your season is over. You were eliminated in the Play-In Tournament."
    );
  }
}

function processAutoPostseasonGamesToday() {
  processAutoPlayInGamesToday();
  processAutoPlayoffGamesToday();
}

function processAutoPlayInGamesToday() {
  if (!gameState.playoffs.playInInitialized || gameState.playoffs.playInComplete) return;

  for (let game of gameState.playoffs.playInGames) {
    if (!game.played && datesMatch(game.date, gameState.currentDate)) {
      if (game.teamAId === gameState.selectedTeamId || game.teamBId === gameState.selectedTeamId) {
        continue;
      }

      const teamA = getTeamById(game.teamAId);
      const teamB = getTeamById(game.teamBId);
      const result = simTeamVsTeam(teamA, teamB);

      game.played = true;
      game.winnerId = result.winnerId;
      game.loserId = result.loserId;
      game.resultText = `${teamA.abbrev} ${result.scoreA}, ${teamB.abbrev} ${result.scoreB}`;

      generatePlayerStatsForGame(teamA.id, teamB.id, result.scoreA, result.scoreB);
    }
  }

  advancePlayInIfNeeded();
}

function advancePlayInIfNeeded() {
  const games = gameState.playoffs.playInGames;

  for (let conference of ["East", "West"]) {
    const confGames = games.filter(game => game.conference === conference);
    const sevenEight = confGames.find(game => game.stage === "7-8");
    const nineTen = confGames.find(game => game.stage === "9-10");
    const finalGame = confGames.find(game => game.stage === "8-seed");

    if (sevenEight && nineTen && sevenEight.played && nineTen.played && !finalGame) {
      const game = {
        id: Date.now() + Math.random(),
        conference,
        label: `${conference} 8 Seed Game`,
        teamAId: sevenEight.loserId,
        teamBId: nineTen.winnerId,
        seedA: 8,
        seedB: 9,
        date: new Date(gameState.seasonStartYear + 1, 3, 19),
        played: false,
        winnerId: null,
        loserId: null,
        resultText: null,
        stage: "8-seed"
      };

      gameState.playoffs.playInGames.push(game);

      if (game.teamAId === gameState.selectedTeamId || game.teamBId === gameState.selectedTeamId) {
        addPostseasonGameToUserSchedule(game, "Play-In Tournament", true, false);
        addInboxMessage("Final Play-In Game Scheduled", "Your team has one more Play-In game for the 8 seed.", "urgent", false);
      }
    }
  }

  const eastComplete = gameState.playoffs.playInGames
    .filter(game => game.conference === "East")
    .some(game => game.stage === "8-seed" && game.played);

  const westComplete = gameState.playoffs.playInGames
    .filter(game => game.conference === "West")
    .some(game => game.stage === "8-seed" && game.played);

  if (eastComplete && westComplete && !gameState.playoffs.playInComplete) {
    gameState.playoffs.playInComplete = true;
    addInboxMessage("Play-In Complete", "The final playoff seeds are set.", "event");
  }
}

function addPostseasonGameToUserSchedule(game, competition, playInGame = false, playoffGame = false) {
  const userId = gameState.selectedTeamId;
  const opponentId = game.teamAId === userId ? game.teamBId : game.teamAId;
  const opponent = getTeamById(opponentId);

  const alreadyExists = gameState.userSchedule.some(item => item.seriesId === game.id);

  if (alreadyExists) return;

  gameState.userSchedule.push({
    id: Date.now() + Math.random(),
    date: new Date(game.date),
    opponentId: opponent.id,
    opponentName: opponent.name,
    opponentAbbrev: opponent.abbrev,
    home: true,
    played: false,
    result: null,
    ourScore: null,
    opponentScore: null,
    competition,
    countsForRegularSeason: false,
    cupGame: false,
    playoffGame,
    playInGame,
    seriesId: game.id,
    parentSeriesId: null,
    gameNumber: game.gameNumber || null,
    topPerformers: []
  });

  gameState.userSchedule.sort((a, b) => a.date - b.date);
}

function getPlayoffSeeds(conference) {
  const standings = getConferenceStandings(conference);
  const seeds = standings.slice(0, 6).map((team, index) => ({
    seed: index + 1,
    teamId: team.id
  }));

  const confPlayIn = gameState.playoffs.playInGames.filter(game => game.conference === conference);
  const sevenEight = confPlayIn.find(game => game.stage === "7-8");
  const finalGame = confPlayIn.find(game => game.stage === "8-seed");

  seeds.push({
    seed: 7,
    teamId: sevenEight.winnerId
  });

  seeds.push({
    seed: 8,
    teamId: finalGame.winnerId
  });

  return seeds;
}

function initializePlayoffs() {
  gameState.playoffs.playoffsInitialized = true;
  gameState.playoffs.currentRound = "First Round";
  gameState.playoffs.series = [];

  const eastSeeds = getPlayoffSeeds("East");
  const westSeeds = getPlayoffSeeds("West");

  createFirstRoundSeries("East", eastSeeds);
  createFirstRoundSeries("West", westSeeds);

  addInboxMessage("Playoffs Begin", "The playoff bracket has been set. The path to The Finals begins now.", "event");
  scheduleCurrentRoundGames();
}

function createFirstRoundSeries(conference, seeds) {
  const matchups = [
    [1, 8],
    [2, 7],
    [3, 6],
    [4, 5]
  ];

  for (let pair of matchups) {
    const higher = seeds.find(seed => seed.seed === pair[0]);
    const lower = seeds.find(seed => seed.seed === pair[1]);

    gameState.playoffs.series.push(createPlayoffSeries(
      conference,
      "First Round",
      higher.teamId,
      lower.teamId,
      higher.seed,
      lower.seed,
      new Date(gameState.seasonStartYear + 1, 3, 21)
    ));
  }
}

function createPlayoffSeries(conference, round, teamAId, teamBId, seedA, seedB, startDate) {
  return {
    id: Date.now() + Math.random(),
    conference,
    round,
    teamAId,
    teamBId,
    seedA,
    seedB,
    winsA: 0,
    winsB: 0,
    winnerId: null,
    loserId: null,
    complete: false,
    games: createSeriesGameDates(startDate)
  };
}

function createSeriesGameDates(startDate) {
  const games = [];

  for (let i = 0; i < 7; i++) {
    const gameDate = new Date(startDate);
    gameDate.setDate(startDate.getDate() + i * 2);

    games.push({
      id: Date.now() + Math.random(),
      date: gameDate,
      gameNumber: i + 1,
      played: false,
      winnerId: null,
      teamAScore: null,
      teamBScore: null
    });
  }

  return games;
}

function scheduleCurrentRoundGames() {
  for (let series of gameState.playoffs.series) {
    if (!series.complete) {
      scheduleUserPlayoffGamesForSeries(series);
    }
  }
}

function scheduleUserPlayoffGamesForSeries(series) {
  const userId = gameState.selectedTeamId;

  if (series.teamAId !== userId && series.teamBId !== userId) return;

  for (let game of series.games) {
    const opponentId = series.teamAId === userId ? series.teamBId : series.teamAId;
    const opponent = getTeamById(opponentId);

    const alreadyExists = gameState.userSchedule.some(item => item.seriesId === game.id);

    if (!alreadyExists) {
      gameState.userSchedule.push({
        id: Date.now() + Math.random(),
        date: new Date(game.date),
        opponentId: opponent.id,
        opponentName: opponent.name,
        opponentAbbrev: opponent.abbrev,
        home: game.gameNumber === 1 || game.gameNumber === 2 || game.gameNumber === 5 || game.gameNumber === 7,
        played: false,
        result: null,
        ourScore: null,
        opponentScore: null,
       competition: series.round === "The Finals"
  ? "The Finals"
  : `${series.conference} ${series.round}`,
        countsForRegularSeason: false,
        cupGame: false,
        playoffGame: true,
        playInGame: false,
        seriesId: game.id,
        parentSeriesId: series.id,
        gameNumber: game.gameNumber,
        topPerformers: []
      });
    }
  }

  gameState.userSchedule.sort((a, b) => a.date - b.date);
}

function processAutoPlayoffGamesToday() {
  if (!gameState.playoffs.playoffsInitialized || gameState.playoffs.playoffsComplete) return;

  for (let series of gameState.playoffs.series) {
    if (series.complete) continue;

    const nextGame = series.games.find(game => !game.played);

    if (!nextGame) continue;
    if (!datesMatch(nextGame.date, gameState.currentDate)) continue;

    if (series.teamAId === gameState.selectedTeamId || series.teamBId === gameState.selectedTeamId) {
      continue;
    }

    playPlayoffGame(series, nextGame);
  }

  advancePlayoffRoundIfNeeded();
}

function finishPlayoffUserGame(userScheduleGame, winnerId) {
  const series = gameState.playoffs.series.find(item => item.id === userScheduleGame.parentSeriesId);
  if (!series || series.complete) return;

  const playoffGame = series.games.find(game => game.id === userScheduleGame.seriesId);
  if (!playoffGame || playoffGame.played) return;

  playoffGame.played = true;
  playoffGame.winnerId = winnerId;

  if (winnerId === series.teamAId) {
    series.winsA++;
  } else {
    series.winsB++;
  }

  if (series.winsA === 4 || series.winsB === 4) {
    completeSeries(series);
  }

  advancePlayoffRoundIfNeeded();
}

function playPlayoffGame(series, playoffGame) {
  if (series.complete || playoffGame.played) return;

  const teamA = getTeamById(series.teamAId);
  const teamB = getTeamById(series.teamBId);
  const result = simTeamVsTeam(teamA, teamB);

  playoffGame.played = true;
  playoffGame.winnerId = result.winnerId;
  playoffGame.teamAScore = result.scoreA;
  playoffGame.teamBScore = result.scoreB;

  generatePlayerStatsForGame(teamA.id, teamB.id, result.scoreA, result.scoreB);

  if (result.winnerId === series.teamAId) {
    series.winsA++;
  } else {
    series.winsB++;
  }

  if (series.winsA === 4 || series.winsB === 4) {
    completeSeries(series);
  }
}

function completeSeries(series) {
  if (series.complete) return;

  series.complete = true;

  if (series.winsA === 4) {
    series.winnerId = series.teamAId;
    series.loserId = series.teamBId;
  } else {
    series.winnerId = series.teamBId;
    series.loserId = series.teamAId;
  }

  cancelRemainingUserPlayoffGames(series);

  if (series.loserId === gameState.selectedTeamId && !gameState.playoffs.userEliminatedPopupShown) {
    gameState.playoffs.userEliminatedPopupShown = true;
    const winner = getTeamById(series.winnerId);

    showModal(
      "Playoff Elimination",
      `Your season is over. You were eliminated by ${winner.name} in the ${series.round}.`
    );
  }
}

function cancelRemainingUserPlayoffGames(series) {
  gameState.userSchedule = gameState.userSchedule.filter(game => {
    const isFutureGameFromThisSeries =
      game.playoffGame &&
      game.parentSeriesId === series.id &&
      !game.played;

    return !isFutureGameFromThisSeries;
  });
}

function advancePlayoffRoundIfNeeded() {
  if (!gameState.playoffs.playoffsInitialized || gameState.playoffs.playoffsComplete) return;

  const activeSeries = gameState.playoffs.series.filter(series => series.round === gameState.playoffs.currentRound);

  if (activeSeries.length === 0 || !activeSeries.every(series => series.complete)) return;

  if (gameState.playoffs.currentRound === "First Round") {
    createNextRound("Conference Semifinals", getRoundStartDate(new Date(gameState.seasonStartYear + 1, 4, 4), 2));
  } else if (gameState.playoffs.currentRound === "Conference Semifinals") {
    createNextRound("Conference Finals", getRoundStartDate(new Date(gameState.seasonStartYear + 1, 4, 18), 2));
  } else if (gameState.playoffs.currentRound === "Conference Finals") {
    createFinals(getRoundStartDate(new Date(gameState.seasonStartYear + 1, 5, 3), 3));
  } else if (gameState.playoffs.currentRound === "The Finals") {
    completeFinalsIfReady();
  }
}

function getRoundStartDate(plannedDate, breakDays) {
  const earliestDate = new Date(gameState.currentDate);
  earliestDate.setDate(earliestDate.getDate() + breakDays);

  if (plannedDate > earliestDate) {
    return plannedDate;
  }

  return earliestDate;
}

function createNextRound(roundName, startDate) {
  const newSeries = [];

  for (let conference of ["East", "West"]) {
    const previous = gameState.playoffs.series
      .filter(series => series.conference === conference && series.round === gameState.playoffs.currentRound)
      .sort((a, b) => Math.min(a.seedA, a.seedB) - Math.min(b.seedA, b.seedB));

    if (previous.length === 4) {
      newSeries.push(createSeriesFromWinners(conference, roundName, previous[0], previous[3], startDate));
      newSeries.push(createSeriesFromWinners(conference, roundName, previous[1], previous[2], startDate));
    } else if (previous.length === 2) {
      newSeries.push(createSeriesFromWinners(conference, roundName, previous[0], previous[1], startDate));
    }
  }

  gameState.playoffs.series = gameState.playoffs.series.concat(newSeries);
  gameState.playoffs.currentRound = roundName;

  addInboxMessage(roundName, `${roundName} matchups have been set.`, "event");
  scheduleCurrentRoundGames();
}

function createSeriesFromWinners(conference, roundName, seriesA, seriesB, startDate) {
  return createPlayoffSeries(
    conference,
    roundName,
    seriesA.winnerId,
    seriesB.winnerId,
    getWinnerSeed(seriesA),
    getWinnerSeed(seriesB),
    startDate
  );
}

function getWinnerSeed(series) {
  if (series.winnerId === series.teamAId) return series.seedA;
  return series.seedB;
}

function createFinals(startDate) {
  const eastFinal = gameState.playoffs.series.find(series => series.conference === "East" && series.round === "Conference Finals");
  const westFinal = gameState.playoffs.series.find(series => series.conference === "West" && series.round === "Conference Finals");

  const finals = createPlayoffSeries(
    "Finals",
    "The Finals",
    eastFinal.winnerId,
    westFinal.winnerId,
    getWinnerSeed(eastFinal),
    getWinnerSeed(westFinal),
    startDate
  );

  gameState.playoffs.series.push(finals);
  gameState.playoffs.finalsSeries = finals.id;
  gameState.playoffs.currentRound = "The Finals";

  addInboxMessage("The Finals Set", "The final two teams are ready to play for the championship.", "event");
  scheduleUserPlayoffGamesForSeries(finals);
}

function showModalAfterCurrentModalCloses(title, body) {
  let attempts = 0;

  const waitForModalToClose = setInterval(() => {
    attempts++;

    const openModal =
      document.querySelector(".modal:not(.hidden)") ||
      document.querySelector(".modal-overlay:not(.hidden)") ||
      document.querySelector("#modal:not(.hidden)") ||
      document.querySelector("#game-modal:not(.hidden)") ||
      document.querySelector("#message-modal:not(.hidden)");

    if (!openModal || attempts >= 300) {
      clearInterval(waitForModalToClose);

      setTimeout(() => {
        showModal(title, body);
      }, 150);
    }
  }, 100);
}

function completeFinalsIfReady() {
  const finals = gameState.playoffs.series.find(series => series.id === gameState.playoffs.finalsSeries);

  if (!finals || !finals.complete || gameState.playoffs.playoffsComplete) return;

  gameState.playoffs.playoffsComplete = true;
  gameState.playoffs.championId = finals.winnerId;
  gameState.seasonReadyForRollover = true;
  gameState.finalsCompletedDate = new Date(gameState.currentDate);

  automaticallyStartOffseasonAfterFinals();

  const champion = getTeamById(finals.winnerId);
  const runnerUp = getTeamById(finals.loserId);
  const score = finals.winnerId === finals.teamAId
    ? `${finals.winsA}-${finals.winsB}`
    : `${finals.winsB}-${finals.winsA}`;

  gameState.history.champions.unshift(`${gameState.seasonLabel}: ${champion.name} defeated ${runnerUp.name}, ${score}`);
  gameState.history.seasons.unshift(getUserSeasonHistoryText());

  showModal(
    "The Finals Complete",
    `${champion.name} are league champions. They defeated ${runnerUp.name} ${score} in The Finals.`
  );

  showModalAfterCurrentModalCloses(
    "Offseason Started",
    `The offseason has begun.

Start preparing for the draft, trade season, and free agency. Your first step is to review the mock drafts and scout the upcoming class.`
  );

  addInboxMessage(
    "League Champion Crowned",
    `${champion.name} won The Finals.`,
    "event"
  );

  addInboxMessage(
    "Offseason Started",
    "The Finals are complete. The offseason has begun. Review mock drafts, prepare for trade season, and get ready for free agency.",
    "event"
  );

  refreshAll();
}

function getUserSeasonHistoryText() {
  const userTeam = getSelectedTeam();
  let result = "Missed playoffs";

  const lostSeries = gameState.playoffs.series.find(series => series.loserId === gameState.selectedTeamId);

  if (gameState.playoffs.championId === gameState.selectedTeamId) {
    result = "Won The Finals";
  } else if (lostSeries) {
    result = `Lost in ${lostSeries.round}`;
  } else {
    const playInLoss = gameState.playoffs.playInGames.find(game =>
      game.loserId === gameState.selectedTeamId &&
      (game.stage === "9-10" || game.stage === "8-seed")
    );

    if (playInLoss) {
      result = "Eliminated in Play-In";
    }
  }

  return `${gameState.seasonLabel}: ${userTeam.name} finished ${userTeam.wins}-${userTeam.losses} — ${result}`;
}

function simPlayoffGame() {
  const todayGames = getTodayUserGames().filter(game => game.playoffGame || game.playInGame);

  if (todayGames.length === 0) {
    addInboxMessage("No Postseason Game Today", "There is no Play-In or Playoff game for your team today.", "staff");
    refreshAll();
    return;
  }

  for (let game of todayGames) {
    playUserScheduleGame(game);
  }

  refreshAll();
}

/* ======================================================
   THE CUP PAGE REDO
   One screen:
   - group section on top
   - knockout bracket below
====================================================== */

function displayCup() {
  const screen = document.getElementById("cup-screen");
  if (!screen || !gameState || !gameState.started) return;

  const cupData = getCupDisplayData();

  screen.innerHTML = `
    <div class="cup-page">
      <div class="cup-title-bar">
        <h2>THE CUP</h2>
      </div>

      ${renderCupGroupSection(cupData)}

      ${renderCupSummarySection(cupData)}

      ${renderCupKnockoutSection(cupData)}
    </div>
  `;
}

function getCupDisplayData() {
  const cupState = gameState.cup || {};
  const groups = getCupGroupsForDisplay();
  const qualifiers = getCupCurrentQualifiers(groups);
  const knockout = getCupKnockoutDisplayData();

  return {
    groups,
    qualifiers,
    knockout,
    championTeamId: getCupChampionTeamId(),
    startDateText: "Games begin Nov. 3"
  };
}

function getCupGroupsForDisplay() {
  const cupState = gameState.cup || {};
  const rawGroups =
    cupState.groups ||
    cupState.groupStage ||
    cupState.drawGroups ||
    {};

  const fallback = {
    westA: [],
    westB: [],
    westC: [],
    eastA: [],
    eastB: [],
    eastC: []
  };

  const finalGroups = {
    westA: normalizeCupGroupTeams(rawGroups.westA || rawGroups.WestA || rawGroups["West A"] || fallback.westA),
    westB: normalizeCupGroupTeams(rawGroups.westB || rawGroups.WestB || rawGroups["West B"] || fallback.westB),
    westC: normalizeCupGroupTeams(rawGroups.westC || rawGroups.WestC || rawGroups["West C"] || fallback.westC),
    eastA: normalizeCupGroupTeams(rawGroups.eastA || rawGroups.EastA || rawGroups["East A"] || fallback.eastA),
    eastB: normalizeCupGroupTeams(rawGroups.eastB || rawGroups.EastB || rawGroups["East B"] || fallback.eastB),
    eastC: normalizeCupGroupTeams(rawGroups.eastC || rawGroups.EastC || rawGroups["East C"] || fallback.eastC)
  };

  return finalGroups;
}

function normalizeCupGroupTeams(groupArray) {
  if (!Array.isArray(groupArray)) return [];

  const cupGames = getAllCupGames();

  const teams = groupArray
    .map(item => {
      const teamId =
        Number(item?.teamId) ||
        Number(item?.id) ||
        Number(item);

      const team = getTeamById(teamId);
      if (!team) return null;

      const cupRecord = getCupRecordForTeam(teamId, cupGames);

      return {
        teamId,
        team,
        wins: cupRecord.wins,
        losses: cupRecord.losses,
        pointDiff: cupRecord.pointDiff,
        pointsFor: cupRecord.pointsFor
      };
    })
    .filter(Boolean);

  teams.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    return (a.team?.name || "").localeCompare(b.team?.name || "");
  });

  return teams;
}

function getAllCupGames() {
  const cupState = gameState.cup || {};

  const allGames = [
    ...(Array.isArray(cupState.games) ? cupState.games : []),
    ...(Array.isArray(cupState.groupGames) ? cupState.groupGames : []),
    ...(Array.isArray(cupState.knockoutGames) ? cupState.knockoutGames : []),
    ...(Array.isArray(cupState.quarterfinals) ? cupState.quarterfinals : []),
    ...(Array.isArray(cupState.semifinals) ? cupState.semifinals : []),
    ...(Array.isArray(cupState.finals) ? cupState.finals : []),
    ...(cupState.championship ? [cupState.championship] : [])
  ];

  return allGames;
}

function isCupGroupGame(game) {
  if (!game) return false;

  return (
    game.cupGame === true ||
    game.isCupGame === true ||
    game.competition === "Cup" ||
    game.competition === "The Cup" ||
    game.type === "cup-group" ||
    game.round === "group" ||
    game.stage === "group"
  );
}

function getCupRecordForTeam(teamId, games) {
  let wins = 0;
  let losses = 0;
  let pointDiff = 0;
  let pointsFor = 0;

  (games || []).forEach(game => {
    if (!isCupGroupGame(game)) return;
    if (!game.played) return;

    const homeId = Number(game.homeTeamId || game.homeTeam?.id);
    const awayId = Number(game.awayTeamId || game.awayTeam?.id);
    const homeScore = Number(game.homeScore || 0);
    const awayScore = Number(game.awayScore || 0);

    if (teamId !== homeId && teamId !== awayId) return;

    if (teamId === homeId) {
      pointsFor += homeScore;
      pointDiff += (homeScore - awayScore);
      if (homeScore > awayScore) wins++;
      else losses++;
    } else if (teamId === awayId) {
      pointsFor += awayScore;
      pointDiff += (awayScore - homeScore);
      if (awayScore > homeScore) wins++;
      else losses++;
    }
  });

  return { wins, losses, pointDiff, pointsFor };
}

function getCupCurrentQualifiers(groups) {
  const westGroupWinners = [];
  const eastGroupWinners = [];
  const westOthers = [];
  const eastOthers = [];

  const groupMap = [
    { key: "westA", conf: "West", label: "West A" },
    { key: "westB", conf: "West", label: "West B" },
    { key: "westC", conf: "West", label: "West C" },
    { key: "eastA", conf: "East", label: "East A" },
    { key: "eastB", conf: "East", label: "East B" },
    { key: "eastC", conf: "East", label: "East C" }
  ];

  groupMap.forEach(groupInfo => {
    const teams = groups[groupInfo.key] || [];
    if (!teams.length) return;

    const winner = teams[0];
    const others = teams.slice(1);

    const winnerEntry = {
      ...winner,
      groupKey: groupInfo.key,
      groupLabel: groupInfo.label,
      conference: groupInfo.conf,
      qualifierType: "group-winner"
    };

    if (groupInfo.conf === "West") {
      westGroupWinners.push(winnerEntry);
      westOthers.push(...others.map(item => ({
        ...item,
        groupKey: groupInfo.key,
        groupLabel: groupInfo.label,
        conference: groupInfo.conf
      })));
    } else {
      eastGroupWinners.push(winnerEntry);
      eastOthers.push(...others.map(item => ({
        ...item,
        groupKey: groupInfo.key,
        groupLabel: groupInfo.label,
        conference: groupInfo.conf
      })));
    }
  });

  westOthers.sort(compareCupTeamsForStandings);
  eastOthers.sort(compareCupTeamsForStandings);

  const westWildCard = westOthers[0]
    ? { ...westOthers[0], qualifierType: "wild-card" }
    : null;

  const eastWildCard = eastOthers[0]
    ? { ...eastOthers[0], qualifierType: "wild-card" }
    : null;

  return {
    westGroupWinners,
    eastGroupWinners,
    westWildCard,
    eastWildCard
  };
}

function compareCupTeamsForStandings(a, b) {
  if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
  if ((b.pointDiff || 0) !== (a.pointDiff || 0)) return (b.pointDiff || 0) - (a.pointDiff || 0);
  if ((b.pointsFor || 0) !== (a.pointsFor || 0)) return (b.pointsFor || 0) - (a.pointsFor || 0);
  return (a.team?.name || "").localeCompare(b.team?.name || "");
}

function isCupQualifierTeam(teamId, qualifiers) {
  if (!teamId || !qualifiers) return false;

  const ids = [
    ...(qualifiers.westGroupWinners || []).map(item => Number(item.teamId)),
    ...(qualifiers.eastGroupWinners || []).map(item => Number(item.teamId)),
    qualifiers.westWildCard ? Number(qualifiers.westWildCard.teamId) : null,
    qualifiers.eastWildCard ? Number(qualifiers.eastWildCard.teamId) : null
  ].filter(Boolean);

  return ids.includes(Number(teamId));
}

function isCupWildCardTeam(teamId, qualifiers) {
  if (!teamId || !qualifiers) return false;

  return (
    Number(qualifiers?.westWildCard?.teamId) === Number(teamId) ||
    Number(qualifiers?.eastWildCard?.teamId) === Number(teamId)
  );
}

function renderCupGroupSection(cupData) {
  return `
    <section class="cup-groups-section">
      <div class="cup-groups-header">
        <div class="cup-conference-title left">WEST</div>
        <div class="cup-conference-title right">EAST</div>
      </div>

      <div class="cup-groups-grid">
        <div class="cup-group-column">
          ${renderCupGroupCard("West A", cupData.groups.westA, cupData.qualifiers)}
          ${renderCupGroupCard("West B", cupData.groups.westB, cupData.qualifiers)}
          ${renderCupGroupCard("West C", cupData.groups.westC, cupData.qualifiers)}
        </div>

        <div class="cup-group-divider"></div>

        <div class="cup-group-column">
          ${renderCupGroupCard("East A", cupData.groups.eastA, cupData.qualifiers)}
          ${renderCupGroupCard("East B", cupData.groups.eastB, cupData.qualifiers)}
          ${renderCupGroupCard("East C", cupData.groups.eastC, cupData.qualifiers)}
        </div>
      </div>
    </section>
  `;
}

function renderCupGroupCard(groupTitle, teams, qualifiers) {
  const topRow = teams.slice(0, 3);
  const bottomRow = teams.slice(3, 5);

  return `
    <div class="cup-group-card">
      <div class="cup-group-title">${groupTitle}</div>

      <div class="cup-group-logo-row top">
        ${topRow.map(teamEntry => renderCupGroupTeam(teamEntry, qualifiers)).join("")}
      </div>

      <div class="cup-group-logo-row bottom">
        ${bottomRow.map(teamEntry => renderCupGroupTeam(teamEntry, qualifiers)).join("")}
      </div>
    </div>
  `;
}

function renderCupGroupTeam(teamEntry, qualifiers) {
  if (!teamEntry || !teamEntry.team) return "";

  const team = teamEntry.team;
  const logo = getCupTeamLogo(team);
  const isQualifier = isCupQualifierTeam(teamEntry.teamId, qualifiers);
  const isWildCard = isCupWildCardTeam(teamEntry.teamId, qualifiers);

  return `
    <button
      type="button"
      class="cup-group-team ${isQualifier ? "qualifying" : ""} ${isWildCard ? "wild-card" : ""}"
      onclick="openTeamProfile(${team.id})"
      title="${team.name}"
    >
      <div class="cup-group-team-logo-wrap">
        <img class="cup-group-team-logo" src="${logo}" alt="${team.name}">
      </div>
      <div class="cup-group-team-record">${teamEntry.wins}-${teamEntry.losses}</div>
      ${isWildCard ? `<div class="cup-group-wild-label">WC</div>` : ``}
    </button>
  `;
}

function renderCupSummarySection(cupData) {
  const westWild = cupData.qualifiers.westWildCard;
  const eastWild = cupData.qualifiers.eastWildCard;

  return `
    <section class="cup-summary-section">
      <div class="cup-summary-card">
        <h3>Current Group Winners</h3>
        <div class="cup-summary-list">
          ${renderCupSummaryTeamList(cupData.qualifiers.westGroupWinners)}
          ${renderCupSummaryTeamList(cupData.qualifiers.eastGroupWinners)}
        </div>
      </div>

      <div class="cup-summary-card">
        <h3>Wild Cards If Play Ended Today</h3>
        <div class="cup-summary-wilds">
          <div>${westWild ? `${westWild.team.name} (${westWild.wins}-${westWild.losses})` : "None yet"}</div>
          <div>${eastWild ? `${eastWild.team.name} (${eastWild.wins}-${eastWild.losses})` : "None yet"}</div>
        </div>
      </div>
    </section>
  `;
}

function renderCupSummaryTeamList(list) {
  if (!Array.isArray(list) || !list.length) return `<div class="cup-summary-item">None yet</div>`;

  return list.map(item => `
    <div class="cup-summary-item">
      <span>${item.team.name}</span>
      <strong>${item.wins}-${item.losses}</strong>
    </div>
  `).join("");
}

function getCupKnockoutDisplayData() {
  const cupState = gameState.cup || {};

  return {
    quarterfinals: normalizeCupBracketGames(
      cupState.quarterfinals ||
      cupState.knockoutQuarterfinals ||
      []
    ),
    semifinals: normalizeCupBracketGames(
      cupState.semifinals ||
      cupState.knockoutSemifinals ||
      []
    ),
    championship: normalizeSingleCupBracketGame(
      cupState.championship ||
      cupState.final ||
      null
    )
  };
}

function normalizeCupBracketGames(games) {
  if (!Array.isArray(games)) return [];

  return games.map(game => normalizeSingleCupBracketGame(game)).filter(Boolean);
}

function normalizeSingleCupBracketGame(game) {
  if (!game) return null;

  const homeTeamId = Number(game.homeTeamId || game.homeTeam?.id || game.team1Id || game.team1?.id || 0);
  const awayTeamId = Number(game.awayTeamId || game.awayTeam?.id || game.team2Id || game.team2?.id || 0);

  const homeTeam = getTeamById(homeTeamId);
  const awayTeam = getTeamById(awayTeamId);

  const homeScore = Number(game.homeScore || game.team1Score || 0);
  const awayScore = Number(game.awayScore || game.team2Score || 0);

  let winnerTeamId = Number(game.winnerTeamId || 0);
  if (!winnerTeamId && game.played) {
    if (homeScore > awayScore) winnerTeamId = homeTeamId;
    if (awayScore > homeScore) winnerTeamId = awayTeamId;
  }

  return {
    played: Boolean(game.played),
    homeTeamId,
    awayTeamId,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    winnerTeamId
  };
}

function getCupChampionTeamId() {
  const championship = getCupKnockoutDisplayData().championship;
  return Number(championship?.winnerTeamId || 0);
}

function renderCupKnockoutSection(cupData) {
  const quarterfinals = cupData.knockout.quarterfinals || [];
  const semifinals = cupData.knockout.semifinals || [];
  const championship = cupData.knockout.championship || null;

  const leftQuarterfinals = quarterfinals.slice(0, 2);
  const rightQuarterfinals = quarterfinals.slice(2, 4);

  const leftSemis = semifinals.slice(0, 1);
  const rightSemis = semifinals.slice(1, 2);

  const championTeam = cupData.championTeamId ? getTeamById(cupData.championTeamId) : null;

  return `
    <section class="cup-knockout-section">
      <div class="cup-knockout-title">Knockout Rounds</div>

      <div class="cup-bracket-layout">
        <div class="cup-bracket-side left">
          <div class="cup-bracket-round-title">Quarterfinals</div>
          ${leftQuarterfinals.map(renderCupBracketGame).join("")}

          <div class="cup-bracket-round-title">Semifinals</div>
          ${leftSemis.map(renderCupBracketGame).join("")}
        </div>

        <div class="cup-bracket-center">
          <div class="cup-bracket-round-title">Championship</div>
          <div class="cup-championship-card">
            ${championship ? renderCupBracketGame(championship, true) : `
              <div class="cup-bracket-game championship">
                <div class="cup-bracket-team-slot empty"></div>
                <div class="cup-bracket-team-slot empty"></div>
              </div>
            `}

            <div class="cup-champion-display">
              <div class="cup-champion-label">Champion</div>
              ${
                championTeam
                  ? `
                    <button type="button" class="cup-champion-logo-button" onclick="openTeamProfile(${championTeam.id})">
                      <img src="${getCupTeamLogo(championTeam)}" alt="${championTeam.name}">
                    </button>
                  `
                  : `<div class="cup-champion-empty">Champion will appear here</div>`
              }
            </div>
          </div>
        </div>

        <div class="cup-bracket-side right">
          <div class="cup-bracket-round-title">Quarterfinals</div>
          ${rightQuarterfinals.map(renderCupBracketGame).join("")}

          <div class="cup-bracket-round-title">Semifinals</div>
          ${rightSemis.map(renderCupBracketGame).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderCupBracketGame(game, isChampionship = false) {
  if (!game) return "";

  return `
    <div class="cup-bracket-game ${isChampionship ? "championship" : ""}">
      ${renderCupBracketTeamSlot(game.homeTeam, game.homeTeamId, game.winnerTeamId, game.played)}
      ${renderCupBracketTeamSlot(game.awayTeam, game.awayTeamId, game.winnerTeamId, game.played)}
    </div>
  `;
}

function renderCupBracketTeamSlot(team, teamId, winnerTeamId, played) {
  if (!team) {
    return `<div class="cup-bracket-team-slot empty"></div>`;
  }

  const logo = getCupTeamLogo(team);
  const isWinner = played && Number(teamId) === Number(winnerTeamId);
  const isLoser = played && Number(teamId) !== Number(winnerTeamId);

  return `
    <button
      type="button"
      class="cup-bracket-team-slot ${isWinner ? "winner" : ""} ${isLoser ? "loser" : ""}"
      onclick="openTeamProfile(${team.id})"
      title="${team.name}"
    >
      <img class="cup-bracket-team-logo" src="${logo}" alt="${team.name}">
    </button>
  `;
}

function getCupTeamLogo(team) {
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

function displayPlayoffs() {
  displayPlayoffBracket("East", "east-playoff-bracket");
  displayPlayoffBracket("West", "west-playoff-bracket");
  displayFinalsBracket();
  displayPlayInBracket();
}

function displayPlayoffBracket(conference, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const rounds = ["First Round", "Conference Semifinals", "Conference Finals"];

  for (let round of rounds) {
    const roundBox = document.createElement("div");
    roundBox.className = "bracket-round";

    const seriesList = gameState.playoffs.series.filter(series => series.conference === conference && series.round === round);

    let html = "";

    if (seriesList.length === 0) {
      html = `<div class="bracket-game">Not set yet</div>`;
    } else {
      for (let series of seriesList) {
        html += renderSeries(series);
      }
    }

    roundBox.innerHTML = `<h3>${round}</h3>${html}`;
    container.appendChild(roundBox);
  }
}

function displayFinalsBracket() {
  const container = document.getElementById("finals-bracket");
  if (!container) return;

  container.innerHTML = "";

  const finals = gameState.playoffs.series.find(series => series.round === "The Finals");

  if (!finals) {
    container.innerHTML = `<div class="bracket-game">The Finals are not set yet.</div>`;
    return;
  }

  container.innerHTML = renderSeries(finals);
}

function renderSeries(series) {
  const teamA = getTeamById(series.teamAId);
  const teamB = getTeamById(series.teamBId);

  const aClass = series.winnerId === series.teamAId ? "bracket-winner" : "";
  const bClass = series.winnerId === series.teamBId ? "bracket-winner" : "";

  return `
    <div class="bracket-game">
      <div class="${aClass}">#${series.seedA || "-"} ${teamA ? teamA.name : "TBD"} - ${series.winsA}</div>
      <div class="${bClass}">#${series.seedB || "-"} ${teamB ? teamB.name : "TBD"} - ${series.winsB}</div>
      <small>${series.complete ? "Final" : "Series active / pending"}</small>
    </div>
  `;
}

function displayPlayInBracket() {
  const container = document.getElementById("playin-bracket");
  if (!container) return;

  container.innerHTML = "";

  if (!gameState.playoffs.playInInitialized) {
    container.innerHTML = `<div class="bracket-game">Play-In Tournament not started yet.</div>`;
    return;
  }

  for (let game of gameState.playoffs.playInGames) {
    const teamA = getTeamById(game.teamAId);
    const teamB = getTeamById(game.teamBId);

    const aClass = game.winnerId === game.teamAId ? "bracket-winner" : "";
    const bClass = game.winnerId === game.teamBId ? "bracket-winner" : "";

    const gameBox = document.createElement("div");
    gameBox.className = "bracket-game";

    gameBox.innerHTML = `
      <strong>${game.label}</strong>
      <div class="${aClass}">${teamA ? teamA.name : "TBD"}</div>
      <div class="${bClass}">${teamB ? teamB.name : "TBD"}</div>
      <small>${game.played ? game.resultText || "Final" : formatDate(game.date)}</small>
    `;

    container.appendChild(gameBox);
  }
}

function getPostseasonStatus() {
  if (!gameState.playoffs.playInInitialized) return "Not Started";
  if (gameState.playoffs.playoffsComplete) return "Complete";
  if (gameState.playoffs.playoffsInitialized) return gameState.playoffs.currentRound || "Playoffs";
  if (gameState.playoffs.playInInitialized) return "Play-In";
  return "Not Started";
}

function getSeriesForScheduleGame(scheduleGame) {
  if (!scheduleGame.parentSeriesId) return null;

  return gameState.playoffs.series.find(series => series.id === scheduleGame.parentSeriesId);
}

function getSeriesStatusText(series) {
  const teamA = getTeamById(series.teamAId);
  const teamB = getTeamById(series.teamBId);

  if (!teamA || !teamB) return "Series not available.";

  if (series.winsA === series.winsB) {
    return `Series tied ${series.winsA}-${series.winsB}`;
  }

  const leader = series.winsA > series.winsB ? teamA : teamB;
  const leaderWins = Math.max(series.winsA, series.winsB);
  const trailingWins = Math.min(series.winsA, series.winsB);

  return `${leader.abbrev} leads ${leaderWins}-${trailingWins}`;
}

function getUserCupGroupMiniHtml() {
  if (!gameState.cup) return "";

  const group = getCupGroupForTeam(gameState.selectedTeamId);

  if (!group) return "";

  const sorted = sortCupGroupTeams(group.teamIds);

  let rows = "";

  for (let teamId of sorted) {
    const team = getTeamById(teamId);
    const stats = gameState.cup.cupStats[teamId];

    rows += `
      <div class="mini-cup-row ${teamId === gameState.selectedTeamId ? "user-team" : ""}">
        <span>${team.abbrev}</span>
        <span>${stats.wins}-${stats.losses}</span>
        <span>${stats.pointDiff}</span>
      </div>
    `;
  }

  return `
    <div class="mini-cup-standings">
      <h4>${group.name}</h4>
      <div class="mini-cup-row">
        <strong>Team</strong>
        <strong>Rec</strong>
        <strong>Diff</strong>
      </div>
      ${rows}
    </div>
  `;
}

/* ======================================================
   POSTSEASON BRACKET REDESIGN
   One full visual postseason page
====================================================== */

function escapePostseasonHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapePostseasonAttr(value) {
  return escapePostseasonHtml(value).replaceAll("`", "&#096;");
}

function getPostseasonTeam(teamId) {
  const id = Number(teamId);

  if (!id) return null;

  if (typeof getTeamById === "function") {
    const team = getTeamById(id);
    if (team) return team;
  }

  if (typeof getBaseTeamById === "function") {
    const team = getBaseTeamById(id);
    if (team) return team;
  }

  if (gameState && Array.isArray(gameState.teams)) {
    return gameState.teams.find(team => Number(team.id) === id) || null;
  }

  if (Array.isArray(baseTeams)) {
    return baseTeams.find(team => Number(team.id) === id) || null;
  }

  return null;
}

function getPostseasonTeamLogo(team) {
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

function getPostseasonTeamAbbrev(team) {
  if (!team) return "TBD";

  return (
    team.abbrev ||
    team.shortName ||
    String(team.name || "TBD")
      .split(" ")
      .map(word => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase()
  );
}

function openPostseasonTeam(teamId) {
  if (!teamId) return;

  if (typeof openTeamProfile === "function") {
    openTeamProfile(Number(teamId));
    return;
  }

  const team = getPostseasonTeam(teamId);

  if (typeof showModal === "function") {
    showModal(
      team ? team.name : "Team",
      "Team profile opening is not available from this screen yet."
    );
  }
}

function getPostseasonStandings(conference) {
  if (!gameState || !Array.isArray(gameState.teams)) return [];

  if (typeof getConferenceStandings === "function") {
    return getConferenceStandings(conference);
  }

  return gameState.teams
    .filter(team => team.conference === conference)
    .sort((a, b) => {
      const winDiff = Number(b.wins || 0) - Number(a.wins || 0);
      if (winDiff !== 0) return winDiff;

      const lossDiff = Number(a.losses || 0) - Number(b.losses || 0);
      if (lossDiff !== 0) return lossDiff;

      if (typeof getTeamStrength === "function") {
        return getTeamStrength(b) - getTeamStrength(a);
      }

      return Number(a.id || 0) - Number(b.id || 0);
    });
}

function getPostseasonSeeds(conference) {
  return getPostseasonStandings(conference).slice(0, 10).map((team, index) => ({
    seed: index + 1,
    teamId: team.id,
    team
  }));
}

function findPostseasonSeed(seeds, seedNumber) {
  return seeds.find(seed => Number(seed.seed) === Number(seedNumber)) || null;
}

function makeProjectedPostseasonSeries(conference, round, seedA, seedB, idSuffix) {
  return {
    id: `projected_${conference}_${round}_${idSuffix}`,
    conference,
    round,
    teamAId: seedA ? seedA.teamId : null,
    teamBId: seedB ? seedB.teamId : null,
    seedA: seedA ? seedA.seed : null,
    seedB: seedB ? seedB.seed : null,
    winsA: 0,
    winsB: 0,
    winnerId: null,
    loserId: null,
    complete: false,
    projected: true,
    games: []
  };
}

function getPostseasonRealSeries(conference, round) {
  if (!gameState || !gameState.playoffs || !Array.isArray(gameState.playoffs.series)) {
    return [];
  }

  return gameState.playoffs.series
    .filter(series =>
      series &&
      series.conference === conference &&
      series.round === round
    )
    .sort(sortPostseasonSeriesForDisplay);
}

function getPostseasonFirstRoundProjection(conference) {
  const seeds = getPostseasonSeeds(conference);

  return [
    makeProjectedPostseasonSeries(conference, "First Round", findPostseasonSeed(seeds, 1), findPostseasonSeed(seeds, 8), "1_8"),
    makeProjectedPostseasonSeries(conference, "First Round", findPostseasonSeed(seeds, 4), findPostseasonSeed(seeds, 5), "4_5"),
    makeProjectedPostseasonSeries(conference, "First Round", findPostseasonSeed(seeds, 3), findPostseasonSeed(seeds, 6), "3_6"),
    makeProjectedPostseasonSeries(conference, "First Round", findPostseasonSeed(seeds, 2), findPostseasonSeed(seeds, 7), "2_7")
  ];
}

function getPostseasonProjectedWinnerSeed(series) {
  if (!series) return null;

  if (series.winnerId) {
    const winnerSeed = Number(series.winnerId) === Number(series.teamAId)
      ? series.seedA
      : series.seedB;

    return {
      seed: winnerSeed,
      teamId: series.winnerId,
      team: getPostseasonTeam(series.winnerId)
    };
  }

  if (Number(series.winsA || 0) > Number(series.winsB || 0)) {
    return {
      seed: series.seedA,
      teamId: series.teamAId,
      team: getPostseasonTeam(series.teamAId)
    };
  }

  if (Number(series.winsB || 0) > Number(series.winsA || 0)) {
    return {
      seed: series.seedB,
      teamId: series.teamBId,
      team: getPostseasonTeam(series.teamBId)
    };
  }

  const seedA = Number(series.seedA || 99);
  const seedB = Number(series.seedB || 99);

  if (seedA <= seedB) {
    return {
      seed: series.seedA,
      teamId: series.teamAId,
      team: getPostseasonTeam(series.teamAId)
    };
  }

  return {
    seed: series.seedB,
    teamId: series.teamBId,
    team: getPostseasonTeam(series.teamBId)
  };
}

function getPostseasonSeriesForRound(conference, round) {
  const real = getPostseasonRealSeries(conference, round);

  if (real.length > 0) return real;

  if (round === "First Round") {
    return getPostseasonFirstRoundProjection(conference);
  }

  if (round === "Conference Semifinals") {
    const firstRound = getPostseasonSeriesForRound(conference, "First Round");

    return [
      makeProjectedPostseasonSeries(
        conference,
        "Conference Semifinals",
        getPostseasonProjectedWinnerSeed(firstRound[0]),
        getPostseasonProjectedWinnerSeed(firstRound[1]),
        "semi_top"
      ),
      makeProjectedPostseasonSeries(
        conference,
        "Conference Semifinals",
        getPostseasonProjectedWinnerSeed(firstRound[2]),
        getPostseasonProjectedWinnerSeed(firstRound[3]),
        "semi_bottom"
      )
    ];
  }

  if (round === "Conference Finals") {
    const semifinals = getPostseasonSeriesForRound(conference, "Conference Semifinals");

    return [
      makeProjectedPostseasonSeries(
        conference,
        "Conference Finals",
        getPostseasonProjectedWinnerSeed(semifinals[0]),
        getPostseasonProjectedWinnerSeed(semifinals[1]),
        "conf_final"
      )
    ];
  }

  return [];
}

function sortPostseasonSeriesForDisplay(a, b) {
  const aMin = Math.min(Number(a.seedA || 99), Number(a.seedB || 99));
  const bMin = Math.min(Number(b.seedA || 99), Number(b.seedB || 99));

  const bracketOrder = {
    1: 1,
    4: 2,
    3: 3,
    2: 4
  };

  const aScore = bracketOrder[aMin] || aMin;
  const bScore = bracketOrder[bMin] || bMin;

  return aScore - bScore;
}

function getPostseasonFinalsSeries() {
  if (!gameState || !gameState.playoffs || !Array.isArray(gameState.playoffs.series)) {
    return null;
  }

  if (gameState.playoffs.finalsSeries) {
    const finalsById = gameState.playoffs.series.find(series =>
      String(series.id) === String(gameState.playoffs.finalsSeries)
    );

    if (finalsById) return finalsById;
  }

  return gameState.playoffs.series.find(series => series.round === "The Finals") || null;
}

function getPostseasonProjectedFinalsSeries() {
  const eastFinal = getPostseasonSeriesForRound("East", "Conference Finals")[0];
  const westFinal = getPostseasonSeriesForRound("West", "Conference Finals")[0];

  return {
    id: "projected_finals",
    conference: "Finals",
    round: "The Finals",
    teamAId: getPostseasonProjectedWinnerSeed(eastFinal)?.teamId || null,
    teamBId: getPostseasonProjectedWinnerSeed(westFinal)?.teamId || null,
    seedA: getPostseasonProjectedWinnerSeed(eastFinal)?.seed || null,
    seedB: getPostseasonProjectedWinnerSeed(westFinal)?.seed || null,
    winsA: 0,
    winsB: 0,
    winnerId: null,
    loserId: null,
    complete: false,
    projected: true,
    games: []
  };
}

function getPostseasonSeriesStatus(series) {
  if (!series) return "Projected";

  const winsA = Number(series.winsA || 0);
  const winsB = Number(series.winsB || 0);

  if (series.complete && series.winnerId) {
    const winner = getPostseasonTeam(series.winnerId);
    const score = Number(series.winnerId) === Number(series.teamAId)
      ? `${winsA}-${winsB}`
      : `${winsB}-${winsA}`;

    return `${getPostseasonTeamAbbrev(winner)} wins ${score}`;
  }

  if (winsA || winsB) {
    if (winsA === winsB) return `Series tied ${winsA}-${winsB}`;

    const leaderId = winsA > winsB ? series.teamAId : series.teamBId;
    const leader = getPostseasonTeam(leaderId);
    const leaderWins = Math.max(winsA, winsB);
    const trailingWins = Math.min(winsA, winsB);

    return `${getPostseasonTeamAbbrev(leader)} leads ${leaderWins}-${trailingWins}`;
  }

  return series.projected ? "Projected" : "Series 0-0";
}

function getPostseasonTeamRowState(series, side) {
  const teamId = side === "A" ? series.teamAId : series.teamBId;
  const seed = side === "A" ? series.seedA : series.seedB;
  const wins = side === "A" ? Number(series.winsA || 0) : Number(series.winsB || 0);

  const eliminated =
    series.complete &&
    Number(series.loserId) === Number(teamId);

  const winner =
    series.complete &&
    Number(series.winnerId) === Number(teamId);

  const leading =
    !series.complete &&
    wins > 0 &&
    wins > Number(side === "A" ? series.winsB || 0 : series.winsA || 0);

  return {
    teamId,
    seed,
    wins,
    eliminated,
    winner,
    leading
  };
}

function renderPostseasonTeamLogoButton(teamId, seed, options = {}) {
  const team = getPostseasonTeam(teamId);
  const logo = getPostseasonTeamLogo(team);
  const showSeed = options.showSeed === true;
  const small = options.small === true;

  if (!team) {
    return `
      <div class="postseason-logo-box empty ${small ? "small" : ""}">
        <span>TBD</span>
      </div>
    `;
  }

  return `
    <button
      type="button"
      class="postseason-logo-box ${small ? "small" : ""}"
      onclick="openPostseasonTeam(${Number(team.id)})"
      title="${escapePostseasonAttr(team.name)}"
    >
      ${showSeed ? `<em>${escapePostseasonHtml(seed || "")}</em>` : ""}
      ${
        logo
          ? `<img src="${escapePostseasonAttr(logo)}" alt="${escapePostseasonAttr(team.name)}">`
          : `<strong>${escapePostseasonHtml(getPostseasonTeamAbbrev(team))}</strong>`
      }
    </button>
  `;
}

function renderPostseasonSeriesBox(series, options = {}) {
  if (!series) return "";

  const showSeed = options.showSeed === true;
  const compact = options.compact === true;
  const large = options.large === true;

  const teamA = getPostseasonTeamRowState(series, "A");
  const teamB = getPostseasonTeamRowState(series, "B");

  const stateClass = series.complete
    ? "complete"
    : Number(series.winsA || 0) || Number(series.winsB || 0)
    ? "live"
    : series.projected
    ? "projected"
    : "pending";

  return `
    <div class="postseason-series-box ${stateClass} ${compact ? "compact" : ""} ${large ? "large" : ""}">
      <div class="postseason-series-teams">
        ${renderPostseasonSeriesTeamRow(teamA, showSeed, compact)}
        ${renderPostseasonSeriesTeamRow(teamB, showSeed, compact)}
      </div>

      <div class="postseason-series-status">
        ${escapePostseasonHtml(getPostseasonSeriesStatus(series))}
      </div>
    </div>
  `;
}

function renderPostseasonSeriesTeamRow(teamState, showSeed, compact) {
  const rowClass = [
    "postseason-series-team-row",
    teamState.eliminated ? "eliminated" : "",
    teamState.winner ? "winner" : "",
    teamState.leading ? "leading" : ""
  ].join(" ");

  return `
    <div class="${rowClass}">
      ${renderPostseasonTeamLogoButton(teamState.teamId, teamState.seed, {
        showSeed,
        small: compact
      })}

      <span class="postseason-series-wins">
        ${Number(teamState.wins || 0)}
      </span>
    </div>
  `;
}

function getPostseasonPlayInGames(conference) {
  const realGames =
    gameState &&
    gameState.playoffs &&
    Array.isArray(gameState.playoffs.playInGames)
      ? gameState.playoffs.playInGames.filter(game => game.conference === conference)
      : [];

  if (realGames.length > 0) {
    return realGames.sort((a, b) => {
      const order = { "7-8": 1, "9-10": 2, "8-seed": 3 };
      return Number(order[a.stage] || 99) - Number(order[b.stage] || 99);
    });
  }

  const seeds = getPostseasonSeeds(conference);
  const seed7 = findPostseasonSeed(seeds, 7);
  const seed8 = findPostseasonSeed(seeds, 8);
  const seed9 = findPostseasonSeed(seeds, 9);
  const seed10 = findPostseasonSeed(seeds, 10);

  return [
    {
      id: `projected_${conference}_playin_7_8`,
      conference,
      teamAId: seed7?.teamId || null,
      teamBId: seed8?.teamId || null,
      seedA: 7,
      seedB: 8,
      played: false,
      winnerId: null,
      loserId: null,
      resultText: null,
      stage: "7-8",
      projected: true
    },
    {
      id: `projected_${conference}_playin_9_10`,
      conference,
      teamAId: seed9?.teamId || null,
      teamBId: seed10?.teamId || null,
      seedA: 9,
      seedB: 10,
      played: false,
      winnerId: null,
      loserId: null,
      resultText: null,
      stage: "9-10",
      projected: true
    }
  ];
}

function renderPostseasonPlayInBox(game) {
  const resultClass = game.played ? "complete" : game.projected ? "projected" : "pending";

  const teamAEliminated =
    game.played &&
    Number(game.loserId) === Number(game.teamAId) &&
    (game.stage === "9-10" || game.stage === "8-seed");

  const teamBEliminated =
    game.played &&
    Number(game.loserId) === Number(game.teamBId) &&
    (game.stage === "9-10" || game.stage === "8-seed");

  return `
    <div class="postseason-playin-box ${resultClass}">
      <div class="postseason-playin-row ${teamAEliminated ? "eliminated" : ""}">
        ${renderPostseasonTeamLogoButton(game.teamAId, game.seedA, { showSeed: true, small: true })}
      </div>

      <div class="postseason-playin-row ${teamBEliminated ? "eliminated" : ""}">
        ${renderPostseasonTeamLogoButton(game.teamBId, game.seedB, { showSeed: true, small: true })}
      </div>
    </div>
  `;
}

function renderPostseasonPlayInColumn(conference) {
  const games = getPostseasonPlayInGames(conference);

  return `
    <div class="postseason-playin-column">
      ${games.map(renderPostseasonPlayInBox).join("")}
    </div>
  `;
}

function renderPostseasonRoundColumn(conference, round, label, className, showSeed) {
  const series = getPostseasonSeriesForRound(conference, round);

  return `
    <div class="postseason-round-column ${className}">
      <div class="postseason-round-label">${escapePostseasonHtml(label)}</div>
      ${series.map(item => renderPostseasonSeriesBox(item, { showSeed, compact: className !== "first-round" })).join("")}
    </div>
  `;
}

function renderPostseasonConference(conference, side) {
  const isWest = conference === "West";

  const playIn = renderPostseasonPlayInColumn(conference);
  const first = renderPostseasonRoundColumn(conference, "First Round", "Round 1", "first-round", true);
  const semis = renderPostseasonRoundColumn(conference, "Conference Semifinals", "Semis", "semis", false);
  const finals = renderPostseasonRoundColumn(conference, "Conference Finals", "Final", "conf-final", false);

  const inner = isWest
    ? `${playIn}${first}${semis}${finals}`
    : `${finals}${semis}${first}${playIn}`;

  return `
    <section class="postseason-conference postseason-${side}">
      <div class="postseason-side-label">${escapePostseasonHtml(conference)}</div>
      <div class="postseason-conference-grid">
        ${inner}
      </div>
    </section>
  `;
}

function renderPostseasonFinalsCenter() {
  const realFinals = getPostseasonFinalsSeries();
  const finals = realFinals || getPostseasonProjectedFinalsSeries();
  const championId = gameState?.playoffs?.championId || finals?.winnerId || null;
  const champion = getPostseasonTeam(championId);

  const title = realFinals ? "The Finals" : "Road to the Championship";

  return `
    <section class="postseason-center-stage">
      <div class="postseason-title-block">
        <span>${escapePostseasonHtml(gameState?.seasonLabel || "Current Season")}</span>
        <h2>Full Court Director Playoffs</h2>
      </div>

      <div class="postseason-finals-card">
        <h3>${escapePostseasonHtml(title)}</h3>
        ${renderPostseasonSeriesBox(finals, { showSeed: false, compact: false, large: true })}
      </div>

      ${
        champion
          ? `
            <div class="postseason-champion-card">
              <span>Champion</span>
              ${renderPostseasonTeamLogoButton(champion.id, null, { showSeed: false })}
            </div>
          `
          : `
            <div class="postseason-champion-placeholder">
              Champion will appear here after The Finals.
            </div>
          `
      }
    </section>
  `;
}

function displayPlayoffs() {
  const screen = document.getElementById("playoffs-screen");

  if (!screen || !gameState || !gameState.started) return;

  screen.innerHTML = `
    <div class="postseason-board-page">
      <div class="postseason-board-bg"></div>

      <div class="postseason-main-grid">
        ${renderPostseasonConference("West", "west")}
        ${renderPostseasonFinalsCenter()}
        ${renderPostseasonConference("East", "east")}
      </div>
    </div>
  `;
}

/* ======================================================
   POSTSEASON FIX
   Only project Play-In + Round 1. Later rounds stay TBD.
====================================================== */

function makeEmptyPostseasonSeries(conference, round, idSuffix) {
  return {
    id: `empty_${conference}_${round}_${idSuffix}`,
    conference,
    round,
    teamAId: null,
    teamBId: null,
    seedA: null,
    seedB: null,
    winsA: 0,
    winsB: 0,
    winnerId: null,
    loserId: null,
    complete: false,
    projected: false,
    empty: true,
    games: []
  };
}

function getPostseasonSeriesForRound(conference, round) {
  const real = getPostseasonRealSeries(conference, round);

  if (real.length > 0) return real;

  if (round === "First Round") {
    return getPostseasonFirstRoundProjection(conference);
  }

  if (round === "Conference Semifinals") {
    return [
      makeEmptyPostseasonSeries(conference, "Conference Semifinals", "semi_top"),
      makeEmptyPostseasonSeries(conference, "Conference Semifinals", "semi_bottom")
    ];
  }

  if (round === "Conference Finals") {
    return [
      makeEmptyPostseasonSeries(conference, "Conference Finals", "conf_final")
    ];
  }

  return [];
}

function getPostseasonProjectedFinalsSeries() {
  return {
    id: "empty_finals",
    conference: "Finals",
    round: "The Finals",
    teamAId: null,
    teamBId: null,
    seedA: null,
    seedB: null,
    winsA: 0,
    winsB: 0,
    winnerId: null,
    loserId: null,
    complete: false,
    projected: false,
    empty: true,
    games: []
  };
}

function getPostseasonSeriesStatus(series) {
  if (!series) return "TBD";

  if (series.empty) return "TBD";

  const winsA = Number(series.winsA || 0);
  const winsB = Number(series.winsB || 0);

  if (series.complete && series.winnerId) {
    const winner = getPostseasonTeam(series.winnerId);
    const score = Number(series.winnerId) === Number(series.teamAId)
      ? `${winsA}-${winsB}`
      : `${winsB}-${winsA}`;

    return `${getPostseasonTeamAbbrev(winner)} wins ${score}`;
  }

  if (winsA || winsB) {
    if (winsA === winsB) return `Series tied ${winsA}-${winsB}`;

    const leaderId = winsA > winsB ? series.teamAId : series.teamBId;
    const leader = getPostseasonTeam(leaderId);
    const leaderWins = Math.max(winsA, winsB);
    const trailingWins = Math.min(winsA, winsB);

    return `${getPostseasonTeamAbbrev(leader)} leads ${leaderWins}-${trailingWins}`;
  }

  return series.projected ? "Projected" : "TBD";
}

/* ======================================================
   THE CUP DATA SHAPE FIX
   Reads your real cup state:
   - gameState.cup.groups is an array
   - gameState.cup.cupStats stores group records
   - gameState.cup.bracket stores knockout rounds
====================================================== */

function getCupGroupsForDisplay() {
  if (!gameState || !gameState.cup) {
    return {
      westA: [],
      westB: [],
      westC: [],
      eastA: [],
      eastB: [],
      eastC: []
    };
  }

  if (!Array.isArray(gameState.cup.groups)) {
    gameState.cup = createCupState();
  }

  const finalGroups = {
    westA: [],
    westB: [],
    westC: [],
    eastA: [],
    eastB: [],
    eastC: []
  };

  const counters = {
    East: 0,
    West: 0
  };

  for (let group of gameState.cup.groups) {
    if (!group) continue;

    const conference = group.conference === "West" ? "West" : "East";
    const conferenceKey = conference === "West" ? "west" : "east";

    let letter = "";
    const nameText = String(group.name || "");
    const match = nameText.match(/group\s*([ABC])/i) || nameText.match(/\b([ABC])$/i);

    if (match && match[1]) {
      letter = match[1].toUpperCase();
    } else {
      letter = String.fromCharCode(65 + counters[conference]);
    }

    counters[conference]++;

    const key = `${conferenceKey}${letter}`;

    if (!finalGroups[key]) continue;

    finalGroups[key] = normalizeCupGroupTeams(group.teamIds || group.teams || []);
  }

  return finalGroups;
}

function hasAnyCupGroupGameBeenPlayed() {
  if (!gameState || !gameState.cup) return false;

  const cupStats = gameState.cup.cupStats || {};

  const hasStats = Object.values(cupStats).some(stats =>
    Number(stats && stats.gamesPlayed ? stats.gamesPlayed : 0) > 0
  );

  if (hasStats) return true;

  return getAllCupGames().some(game => {
    if (!isCupGroupGame(game)) return false;
    return game.played === true;
  });
}

function normalizeCupGroupTeams(groupArray) {
  if (!Array.isArray(groupArray)) return [];

  const cupGames = getAllCupGames();

  const teams = groupArray
    .map(item => {
      const teamId =
        Number(item?.teamId) ||
        Number(item?.id) ||
        Number(item);

      const team = getTeamById(teamId) || getBaseTeamById(teamId);
      if (!team) return null;

      const cupRecord = getCupRecordForTeam(teamId, cupGames);

      return {
        teamId,
        team,
        wins: cupRecord.wins,
        losses: cupRecord.losses,
        pointDiff: cupRecord.pointDiff,
        pointsFor: cupRecord.pointsFor,
        gamesPlayed: cupRecord.gamesPlayed
      };
    })
    .filter(Boolean);

  teams.sort(compareCupTeamsForStandings);

  return teams;
}

function getAllCupGames() {
  if (!gameState) return [];

  const cupState = gameState.cup || {};
  const bracket = cupState.bracket || {};

  return [
    ...(Array.isArray(cupState.games) ? cupState.games : []),
    ...(Array.isArray(cupState.groupGames) ? cupState.groupGames : []),
    ...(Array.isArray(cupState.knockoutGames) ? cupState.knockoutGames : []),
    ...(Array.isArray(bracket.quarterfinals) ? bracket.quarterfinals : []),
    ...(Array.isArray(bracket.semifinals) ? bracket.semifinals : []),
    ...(bracket.final ? [bracket.final] : []),
    ...(Array.isArray(gameState.leagueSchedule)
      ? gameState.leagueSchedule.filter(game =>
          game &&
          game.cupGame === true &&
          String(game.competition || "").toLowerCase().includes("cup")
        )
      : [])
  ];
}

function isCupGroupGame(game) {
  if (!game) return false;

  const competition = String(game.competition || "").toLowerCase();
  const round = String(game.round || "").toLowerCase();
  const stage = String(game.stage || "").toLowerCase();
  const cupRound = String(game.cupRound || "").toLowerCase();

  return (
    game.cupGame === true && competition.includes("group") ||
    round.includes("group") ||
    stage.includes("group") ||
    cupRound.includes("group") ||
    competition === "the cup group"
  );
}

function getCupRecordForTeam(teamId, games) {
  const id = Number(teamId);
  const stats = gameState?.cup?.cupStats?.[id];

  if (stats && Number(stats.gamesPlayed || 0) > 0) {
    return {
      wins: Number(stats.wins || 0),
      losses: Number(stats.losses || 0),
      pointDiff: Number(stats.pointDiff || 0),
      pointsFor: Number(stats.pointsFor || 0),
      gamesPlayed: Number(stats.gamesPlayed || 0)
    };
  }

  let wins = 0;
  let losses = 0;
  let pointDiff = 0;
  let pointsFor = 0;
  let gamesPlayed = 0;

  (games || []).forEach(game => {
    if (!isCupGroupGame(game)) return;
    if (!game.played) return;

    const teamAId = Number(game.teamAId || game.homeTeamId || game.team1Id || 0);
    const teamBId = Number(game.teamBId || game.awayTeamId || game.team2Id || 0);

    const scoreA = Number(
      game.teamAScore ??
      game.homeScore ??
      game.team1Score ??
      0
    );

    const scoreB = Number(
      game.teamBScore ??
      game.awayScore ??
      game.team2Score ??
      0
    );

    if (id !== teamAId && id !== teamBId) return;

    gamesPlayed++;

    if (id === teamAId) {
      pointsFor += scoreA;
      pointDiff += scoreA - scoreB;

      if (scoreA > scoreB) wins++;
      else losses++;
    }

    if (id === teamBId) {
      pointsFor += scoreB;
      pointDiff += scoreB - scoreA;

      if (scoreB > scoreA) wins++;
      else losses++;
    }
  });

  if (gamesPlayed > 0) {
    return {
      wins,
      losses,
      pointDiff,
      pointsFor,
      gamesPlayed
    };
  }

  return {
    wins: Number(stats?.wins || 0),
    losses: Number(stats?.losses || 0),
    pointDiff: Number(stats?.pointDiff || 0),
    pointsFor: Number(stats?.pointsFor || 0),
    gamesPlayed: Number(stats?.gamesPlayed || 0)
  };
}

function getCupCurrentQualifiers(groups) {
  const emptyQualifiers = {
    westGroupWinners: [],
    eastGroupWinners: [],
    westWildCard: null,
    eastWildCard: null
  };

  if (!hasAnyCupGroupGameBeenPlayed()) {
    return emptyQualifiers;
  }

  const westGroupWinners = [];
  const eastGroupWinners = [];
  const westOthers = [];
  const eastOthers = [];

  const groupMap = [
    { key: "westA", conf: "West", label: "West A" },
    { key: "westB", conf: "West", label: "West B" },
    { key: "westC", conf: "West", label: "West C" },
    { key: "eastA", conf: "East", label: "East A" },
    { key: "eastB", conf: "East", label: "East B" },
    { key: "eastC", conf: "East", label: "East C" }
  ];

  groupMap.forEach(groupInfo => {
    const teams = groups[groupInfo.key] || [];
    if (!teams.length) return;

    const sortedTeams = teams.slice().sort(compareCupTeamsForStandings);
    const winner = sortedTeams[0];
    const others = sortedTeams.slice(1);

    const winnerEntry = {
      ...winner,
      groupKey: groupInfo.key,
      groupLabel: groupInfo.label,
      conference: groupInfo.conf,
      qualifierType: "group-winner"
    };

    if (groupInfo.conf === "West") {
      westGroupWinners.push(winnerEntry);
      westOthers.push(...others.map(item => ({
        ...item,
        groupKey: groupInfo.key,
        groupLabel: groupInfo.label,
        conference: groupInfo.conf
      })));
    } else {
      eastGroupWinners.push(winnerEntry);
      eastOthers.push(...others.map(item => ({
        ...item,
        groupKey: groupInfo.key,
        groupLabel: groupInfo.label,
        conference: groupInfo.conf
      })));
    }
  });

  westOthers.sort(compareCupTeamsForStandings);
  eastOthers.sort(compareCupTeamsForStandings);

  return {
    westGroupWinners,
    eastGroupWinners,
    westWildCard: westOthers[0] ? { ...westOthers[0], qualifierType: "wild-card" } : null,
    eastWildCard: eastOthers[0] ? { ...eastOthers[0], qualifierType: "wild-card" } : null
  };
}

function compareCupTeamsForStandings(a, b) {
  if (Number(b.wins || 0) !== Number(a.wins || 0)) {
    return Number(b.wins || 0) - Number(a.wins || 0);
  }

  if (Number(b.pointDiff || 0) !== Number(a.pointDiff || 0)) {
    return Number(b.pointDiff || 0) - Number(a.pointDiff || 0);
  }

  if (Number(b.pointsFor || 0) !== Number(a.pointsFor || 0)) {
    return Number(b.pointsFor || 0) - Number(a.pointsFor || 0);
  }

  return String(a.team?.name || "").localeCompare(String(b.team?.name || ""));
}

function getCupKnockoutDisplayData() {
  const cupState = gameState.cup || {};
  const bracket = cupState.bracket || {};

  return {
    quarterfinals: normalizeCupBracketGames(
      bracket.quarterfinals ||
      cupState.quarterfinals ||
      []
    ),
    semifinals: normalizeCupBracketGames(
      bracket.semifinals ||
      cupState.semifinals ||
      []
    ),
    championship: normalizeSingleCupBracketGame(
      bracket.final ||
      cupState.championship ||
      cupState.final ||
      null
    )
  };
}

function normalizeSingleCupBracketGame(game) {
  if (!game) return null;

  const teamAId = Number(game.teamAId || game.homeTeamId || game.team1Id || 0);
  const teamBId = Number(game.teamBId || game.awayTeamId || game.team2Id || 0);

  const teamA = getTeamById(teamAId) || getBaseTeamById(teamAId);
  const teamB = getTeamById(teamBId) || getBaseTeamById(teamBId);

  const teamAScore = Number(
    game.teamAScore ??
    game.homeScore ??
    game.team1Score ??
    0
  );

  const teamBScore = Number(
    game.teamBScore ??
    game.awayScore ??
    game.team2Score ??
    0
  );

  let winnerTeamId = Number(game.winnerId || game.winnerTeamId || 0);

  if (!winnerTeamId && game.played) {
    if (teamAScore > teamBScore) winnerTeamId = teamAId;
    if (teamBScore > teamAScore) winnerTeamId = teamBId;
  }

  return {
    played: Boolean(game.played),
    homeTeamId: teamAId,
    awayTeamId: teamBId,
    homeTeam: teamA,
    awayTeam: teamB,
    homeScore: teamAScore,
    awayScore: teamBScore,
    winnerTeamId
  };
}

function getCupChampionTeamId() {
  return Number(gameState?.cup?.championId || getCupKnockoutDisplayData().championship?.winnerTeamId || 0);
}

/* ======================================================
   THE CUP GROUP ROW FIX
   Shows all 5 teams in one row instead of 3 over 2
====================================================== */

function renderCupGroupCard(groupTitle, teams, qualifiers) {
  return `
    <div class="cup-group-card">
      <div class="cup-group-title">${groupTitle}</div>

      <div class="cup-group-logo-row single">
        ${(teams || []).slice(0, 5).map(teamEntry => renderCupGroupTeam(teamEntry, qualifiers)).join("")}
      </div>
    </div>
  `;
}

/* ======================================================
   THE CUP KNOCKOUT BRACKET LAYOUT FIX
   Makes knockout rounds move inward like the playoff screen
====================================================== */

function renderCupEmptyBracketGame() {
  return `
    <div class="cup-bracket-game empty-game">
      <div class="cup-bracket-team-slot empty"></div>
      <div class="cup-bracket-team-slot empty"></div>
    </div>
  `;
}

function renderCupBracketGameSafe(game, isChampionship = false) {
  if (!game) {
    return isChampionship
      ? `
        <div class="cup-bracket-game championship empty-game">
          <div class="cup-bracket-team-slot empty"></div>
          <div class="cup-bracket-team-slot empty"></div>
        </div>
      `
      : renderCupEmptyBracketGame();
  }

  return renderCupBracketGame(game, isChampionship);
}

function renderCupKnockoutSection(cupData) {
  const quarterfinals = cupData.knockout.quarterfinals || [];
  const semifinals = cupData.knockout.semifinals || [];
  const championship = cupData.knockout.championship || null;

  const leftQuarterfinals = [
    quarterfinals[0] || null,
    quarterfinals[1] || null
  ];

  const rightQuarterfinals = [
    quarterfinals[2] || null,
    quarterfinals[3] || null
  ];

  const leftSemi = semifinals[0] || null;
  const rightSemi = semifinals[1] || null;

  const championTeam = cupData.championTeamId ? getTeamById(cupData.championTeamId) : null;

  return `
    <section class="cup-knockout-section cup-knockout-bracket-redo">
      <div class="cup-knockout-title">Knockout Rounds</div>

      <div class="cup-bracket-board">
        <div class="cup-bracket-round cup-bracket-qf cup-bracket-left-qf">
          <div class="cup-bracket-round-title">Quarterfinals</div>
          <div class="cup-bracket-round-games">
            ${leftQuarterfinals.map(game => renderCupBracketGameSafe(game)).join("")}
          </div>
        </div>

        <div class="cup-bracket-round cup-bracket-semi cup-bracket-left-semi">
          <div class="cup-bracket-round-title">Semifinals</div>
          <div class="cup-bracket-round-games">
            ${renderCupBracketGameSafe(leftSemi)}
          </div>
        </div>

        <div class="cup-bracket-center">
          <div class="cup-bracket-round-title">Championship</div>

          <div class="cup-championship-card">
            ${renderCupBracketGameSafe(championship, true)}

            <div class="cup-champion-display">
              <div class="cup-champion-label">Champion</div>
              ${
                championTeam
                  ? `
                    <button type="button" class="cup-champion-logo-button" onclick="openTeamProfile(${championTeam.id})">
                      <img src="${getCupTeamLogo(championTeam)}" alt="${championTeam.name}">
                    </button>
                  `
                  : `<div class="cup-champion-empty">Champion will appear here</div>`
              }
            </div>
          </div>
        </div>

        <div class="cup-bracket-round cup-bracket-semi cup-bracket-right-semi">
          <div class="cup-bracket-round-title">Semifinals</div>
          <div class="cup-bracket-round-games">
            ${renderCupBracketGameSafe(rightSemi)}
          </div>
        </div>

        <div class="cup-bracket-round cup-bracket-qf cup-bracket-right-qf">
          <div class="cup-bracket-round-title">Quarterfinals</div>
          <div class="cup-bracket-round-games">
            ${rightQuarterfinals.map(game => renderCupBracketGameSafe(game)).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}