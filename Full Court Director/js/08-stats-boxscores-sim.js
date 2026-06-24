function createEmptyTeamStats() {
  return {
    games: 0,
    pointsFor: 0,
    pointsAgainst: 0,
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

function ensureTeamStats() {
  if (!gameState.teamStats) {
    gameState.teamStats = {};
  }

  for (let team of gameState.teams) {
    if (!gameState.teamStats[team.id]) {
      gameState.teamStats[team.id] = createEmptyTeamStats();
    }
  }
}

function recordTeamStats(teamId, pointsFor, pointsAgainst, playerLines) {
  ensureTeamStats();

  const stats = gameState.teamStats[teamId];
  stats.games++;
  stats.pointsFor += pointsFor;
  stats.pointsAgainst += pointsAgainst;

  for (let line of playerLines) {
    stats.rebounds += line.rebounds || 0;
    stats.assists += line.assists || 0;
    stats.steals += line.steals || 0;
    stats.blocks += line.blocks || 0;
    stats.turnovers += line.turnovers || 0;
    stats.fieldGoalsMade += line.fieldGoalsMade || 0;
    stats.fieldGoalsAttempted += line.fieldGoalsAttempted || 0;
    stats.threePointersMade += line.threePointersMade || 0;
    stats.threePointersAttempted += line.threePointersAttempted || 0;
    stats.freeThrowsMade += line.freeThrowsMade || 0;
    stats.freeThrowsAttempted += line.freeThrowsAttempted || 0;
  }
}

function createBoxScoreObject(game, userTeam, opponentTeam, userLines, opponentLines) {
  return {
    id: `box_${Date.now()}_${Math.random()}`,
    date: new Date(game.date),
    competition: game.competition,
    home: game.home,
    userTeamId: userTeam.id,
    opponentTeamId: opponentTeam.id,
    userTeamName: userTeam.name,
    opponentTeamName: opponentTeam.name,
    userScore: game.ourScore,
    opponentScore: game.opponentScore,
    userWon: game.ourScore > game.opponentScore,
    userLines,
    opponentLines
  };
}

function getBoxScoreById(boxScoreId) {
  if (!boxScoreId) return null;

  for (let game of gameState.userSchedule) {
    if (game.boxScore && game.boxScore.id === boxScoreId) {
      return game.boxScore;
    }
  }

  return null;
}

function getBoxScoreForScheduleGame(gameId) {
  const game = gameState.userSchedule.find(item => item.id === gameId);
  return game && game.boxScore ? game.boxScore : null;
}

function getPlayerMinutesFromRotation(playerId) {
  const slot = getRotationSlots().find(item => item.playerId === playerId);
  return slot ? Number(slot.minutes || 0) : 0;
}

function getRotationLineupPlayers() {
  const slots = getRotationSlots();

  return slots.map(slot => ({
    slot,
    player: getPlayerByRotationSlot(slot),
    minutes: Number(slot.minutes || 0),
    role: getRotationRoleForSlot(slot)
  }));
}

function generatePlayerStatsForGame(teamAId, teamBId, teamAScore, teamBScore) {
  const teamAStats = teamAId === gameState.selectedTeamId
    ? generateUserTeamPlayerStats(teamAId, teamAScore)
    : generatePlaceholderTeamPlayerStats(teamAId, teamAScore);

  const teamBStats = teamBId === gameState.selectedTeamId
    ? generateUserTeamPlayerStats(teamBId, teamBScore)
    : generatePlaceholderTeamPlayerStats(teamBId, teamBScore);

  recordTeamStats(teamAId, teamAScore, teamBScore, teamAStats.playerLines);
  recordTeamStats(teamBId, teamBScore, teamAScore, teamBStats.playerLines);

  return {
    userTopPerformers: teamAId === gameState.selectedTeamId ? teamAStats.topPerformers : teamBStats.topPerformers,
    teamAStats,
    teamBStats
  };
}

function generateUserTeamPlayerStats(teamId, teamScore) {
  const lineup = getRotationLineupPlayers();
  const playerLines = [];
  const playingLineup = lineup.filter(item => item.player && item.minutes > 0);

  if (playingLineup.length === 0) {
    return {
      topPerformers: [],
      playerLines: lineup.map(item => createDnpLine(item.player, item.slot, item.role))
    };
  }

  let totalScoringWeight = 0;

  for (let item of playingLineup) {
    const attr = item.player.attributes;

    item.scoringWeight =
      item.minutes *
      (
        attr.shotCreation * 1.2 +
        attr.finishing * 0.85 +
        attr.threePoint * 0.9 +
        attr.midrange * 0.55 +
        attr.postScoring * 0.45 +
        attr.foulDrawing * 0.35 +
        attr.touch * 0.35
      );

    totalScoringWeight += item.scoringWeight;
  }

  let assignedPoints = 0;

  for (let i = 0; i < lineup.length; i++) {
    const item = lineup[i];

    if (!item.player) continue;

    if (item.minutes <= 0) {
      const dnpLine = createDnpLine(item.player, item.slot, item.role);
      playerLines.push(dnpLine);
      continue;
    }

    const attr = item.player.attributes;
    const isLastPlayingPlayer = item.player.id === playingLineup[playingLineup.length - 1].player.id;

    let points;

    if (isLastPlayingPlayer) {
      points = Math.max(0, teamScore - assignedPoints);
    } else {
      const share = item.scoringWeight / totalScoringWeight;
      points = Math.max(0, Math.round(teamScore * share + randomInt(-4, 5)));
      assignedPoints += points;
    }

    const rebounds = Math.max(0, Math.round(
      item.minutes / 48 * ((attr.defensiveRebounding + attr.offensiveRebounding + attr.strength) / 2.7) + randomInt(-1, 2)
    ));

    const assists = Math.max(0, Math.round(
      item.minutes / 48 * ((attr.passing + attr.passPerception + attr.ballHandling) / 3.1) + randomInt(-1, 2)
    ));

    const steals = Math.max(0, Math.round(item.minutes / 48 * (attr.steals / 1.8) + randomInt(-1, 1)));
    const blocks = Math.max(0, Math.round(item.minutes / 48 * (attr.blocks / 1.8) + randomInt(-1, 1)));
    const turnovers = Math.max(0, Math.round(item.minutes / 48 * ((22 - attr.composure + 22 - attr.ballHandling) / 2.8) + randomInt(-1, 1)));

    const fta = Math.max(0, Math.round(item.minutes / 48 * ((attr.foulDrawing + attr.finishing) / 2.8) + randomInt(-1, 2)));
    const ftm = clamp(Math.round(fta * (0.48 + attr.freeThrow / 45)), 0, fta);

    const tpa = Math.max(0, Math.round(item.minutes / 48 * (attr.threePoint / 1.55) + randomInt(-1, 3)));
    const tpm = clamp(Math.round(tpa * ((attr.threePoint + attr.touch) / 50)), 0, tpa);

    const fga = Math.max(1, Math.round(points / 1.35 + randomInt(0, 4)));
    let fgm = Math.max(tpm, Math.round(Math.max(0, points - tpm * 3 - ftm) / 2) + tpm);
    fgm = clamp(fgm, 0, fga);

    const line = {
      playerId: item.player.id,
      name: item.player.name,
      slotLabel: item.slot.label,
      role: item.role,
      starter: item.slot.starter,
      minutes: item.minutes,
      dnp: false,
      fieldGoalsMade: fgm,
      fieldGoalsAttempted: fga,
      threePointersMade: tpm,
      threePointersAttempted: tpa,
      freeThrowsMade: ftm,
      freeThrowsAttempted: fta,
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      points
    };

    playerLines.push(line);
    applyPlayerGameStatsFromLine(item.player, line);
  }

  const topPerformers = getTopPerformersFromLines(playerLines);

  return {
    topPerformers,
    playerLines
  };
}

function generatePlaceholderTeamPlayerStats(teamId, teamScore) {
  const roster = getRosterByTeamId(teamId);
  const sortedRoster = [...roster].sort((a, b) => b.currentAbility - a.currentAbility);
  const minutesPlan = [34, 34, 32, 32, 30, 26, 20, 16, 10, 6, 0, 0];
  const playerLines = [];
  const playingPlayers = [];

  for (let i = 0; i < sortedRoster.length; i++) {
    const player = sortedRoster[i];
    const minutes = minutesPlan[i] || 0;

    if (minutes > 0) {
      playingPlayers.push({
        player,
        minutes,
        index: i
      });
    }
  }

  let totalWeight = 0;

  for (let item of playingPlayers) {
    const attr = item.player.attributes;

    item.scoringWeight =
      item.minutes *
      (
        attr.shotCreation +
        attr.finishing * 0.7 +
        attr.threePoint * 0.7 +
        attr.midrange * 0.45 +
        attr.postScoring * 0.35
      );

    totalWeight += item.scoringWeight;
  }

  let assignedPoints = 0;

  for (let i = 0; i < sortedRoster.length; i++) {
    const player = sortedRoster[i];
    const minutes = minutesPlan[i] || 0;
    const role = i < 5 ? "Starter" : i === 5 ? "Sixth Man" : i < 10 ? "Rotation" : "Reserve";

    if (minutes <= 0) {
      playerLines.push(createDnpLine(player, { label: i < 5 ? `Starter ${i + 1}` : `Bench ${i + 1}` }, role));
      continue;
    }

    const item = playingPlayers.find(entry => entry.player.id === player.id);
    const attr = player.attributes;
    const isLast = player.id === playingPlayers[playingPlayers.length - 1].player.id;

    let points;

    if (isLast) {
      points = Math.max(0, teamScore - assignedPoints);
    } else {
      points = Math.max(0, Math.round(teamScore * (item.scoringWeight / totalWeight) + randomInt(-4, 5)));
      assignedPoints += points;
    }

    const rebounds = Math.max(0, Math.round(minutes / 48 * ((attr.defensiveRebounding + attr.offensiveRebounding + attr.strength) / 2.8) + randomInt(-1, 2)));
    const assists = Math.max(0, Math.round(minutes / 48 * ((attr.passing + attr.passPerception + attr.ballHandling) / 3.2) + randomInt(-1, 2)));
    const steals = Math.max(0, Math.round(minutes / 48 * (attr.steals / 2) + randomInt(-1, 1)));
    const blocks = Math.max(0, Math.round(minutes / 48 * (attr.blocks / 2) + randomInt(-1, 1)));
    const turnovers = Math.max(0, Math.round(minutes / 48 * 2.4 + randomInt(-1, 1)));

    const fta = Math.max(0, Math.round(minutes / 48 * ((attr.foulDrawing + attr.finishing) / 3) + randomInt(-1, 2)));
    const ftm = clamp(Math.round(fta * (0.48 + attr.freeThrow / 45)), 0, fta);
    const tpa = Math.max(0, Math.round(minutes / 48 * (attr.threePoint / 1.7) + randomInt(-1, 3)));
    const tpm = clamp(Math.round(tpa * ((attr.threePoint + attr.touch) / 50)), 0, tpa);
    const fga = Math.max(1, Math.round(points / 1.35 + randomInt(0, 4)));
    const fgm = clamp(Math.max(tpm, Math.round(Math.max(0, points - tpm * 3 - ftm) / 2) + tpm), 0, fga);

    const line = {
      playerId: player.id,
      name: player.name,
      slotLabel: i < 5 ? `Starter ${i + 1}` : `Bench ${i + 1}`,
      role,
      starter: i < 5,
      minutes,
      dnp: false,
      fieldGoalsMade: fgm,
      fieldGoalsAttempted: fga,
      threePointersMade: tpm,
      threePointersAttempted: tpa,
      freeThrowsMade: ftm,
      freeThrowsAttempted: fta,
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      points
    };

    playerLines.push(line);
    applyPlayerGameStatsFromLine(player, line);
  }

  return {
    topPerformers: getTopPerformersFromLines(playerLines),
    playerLines
  };
}

function createDnpLine(player, slot, role) {
  return {
    playerId: player ? player.id : null,
    name: player ? player.name : "Empty",
    slotLabel: slot ? slot.label : "Bench",
    role,
    starter: slot ? !!slot.starter : false,
    minutes: 0,
    dnp: true,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    points: 0
  };
}

function getTopPerformersFromLines(playerLines) {
  return [...playerLines]
    .filter(line => !line.dnp)
    .sort((a, b) => {
      const impactA = a.points + a.rebounds * 1.2 + a.assists * 1.5 + a.steals * 2 + a.blocks * 2;
      const impactB = b.points + b.rebounds * 1.2 + b.assists * 1.5 + b.steals * 2 + b.blocks * 2;
      return impactB - impactA;
    })
    .slice(0, 3)
    .map(line => ({
      playerId: line.playerId,
      name: line.name,
      points: line.points,
      rebounds: line.rebounds,
      assists: line.assists,
      steals: line.steals,
      blocks: line.blocks
    }));
}

function applyPlayerGameStatsFromLine(player, line) {
  if (!player || line.dnp) return;

  if (!player.seasonStats) {
    player.seasonStats = createEmptySeasonStats();
  }

  const stats = player.seasonStats;

  stats.games++;
  if (line.starter) stats.gamesStarted++;

  stats.minutes += line.minutes;
  stats.points += line.points;
  stats.rebounds += line.rebounds;
  stats.assists += line.assists;
  stats.steals += line.steals;
  stats.blocks += line.blocks;
  stats.turnovers += line.turnovers;
  stats.fieldGoalsMade += line.fieldGoalsMade;
  stats.fieldGoalsAttempted += line.fieldGoalsAttempted;
  stats.threePointersMade += line.threePointersMade;
  stats.threePointersAttempted += line.threePointersAttempted;
  stats.freeThrowsMade += line.freeThrowsMade;
  stats.freeThrowsAttempted += line.freeThrowsAttempted;
}

function openBoxScore(gameId) {
  const game = gameState.userSchedule.find(item => String(item.id) === String(gameId));

  if (!game || !game.boxScore) {
    addInboxMessage("Box Score Unavailable", "This game does not have a saved box score yet.", "staff");
    refreshAll();
    return;
  }

  renderBoxScore(game.boxScore);
}

function closeBoxScore() {
  const overlay = document.getElementById("box-score-overlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }
}

function renderBoxScore(boxScore) {
  const overlay = document.getElementById("box-score-overlay");

  if (!overlay) return;

  const leftTeam = document.getElementById("box-score-team-left");
  const rightTeam = document.getElementById("box-score-team-right");

  const leftTitle = document.getElementById("box-score-left-title");
  const rightTitle = document.getElementById("box-score-right-title");

  const leftTable = document.getElementById("box-score-left-table");
  const rightTable = document.getElementById("box-score-right-table");

  if (!leftTeam || !rightTeam || !leftTitle || !rightTitle || !leftTable || !rightTable) return;

  leftTeam.classList.remove("box-score-winner");
  rightTeam.classList.remove("box-score-winner");

  leftTeam.innerHTML = `
    <span class="box-score-team-name">${boxScore.userTeamName}</span>
    <span class="box-score-team-score">${boxScore.userScore}</span>
  `;

  rightTeam.innerHTML = `
    <span class="box-score-team-name">${boxScore.opponentTeamName}</span>
    <span class="box-score-team-score">${boxScore.opponentScore}</span>
  `;

  if (boxScore.userScore > boxScore.opponentScore) {
    leftTeam.classList.add("box-score-winner");
  } else {
    rightTeam.classList.add("box-score-winner");
  }

  setText("box-score-date", formatDate(new Date(boxScore.date)));
  setText("box-score-competition", boxScore.competition);

  leftTitle.textContent = boxScore.userTeamName;
  rightTitle.textContent = boxScore.opponentTeamName;

  leftTable.innerHTML = renderBoxScoreTableRows(boxScore.userLines || [], true);
  rightTable.innerHTML = renderBoxScoreTableRows(boxScore.opponentLines || [], false);

  overlay.classList.remove("hidden");
}

function renderBoxScoreTableRows(lines, allowPlayerClick) {
  const starters = lines.filter(line => line.starter);
  const bench = lines.filter(line => !line.starter);

  let html = "";

  html += `<tr class="box-score-section-label"><td colspan="11">Starters</td></tr>`;
  html += starters.map(line => renderBoxScoreLine(line, allowPlayerClick)).join("");

  html += `<tr class="box-score-section-label"><td colspan="11">Bench</td></tr>`;
  html += bench.map(line => renderBoxScoreLine(line, allowPlayerClick)).join("");

  return html;
}

function renderBoxScoreLine(line, allowPlayerClick) {
  const nameHtml = allowPlayerClick && line.playerId
    ? `<span class="box-score-player-name" onclick="openPlayerProfile('${line.playerId}')">${line.name}</span>`
    : line.name;

  if (line.dnp) {
    return `
      <tr class="box-score-dnp">
        <td>${nameHtml}</td>
        <td>DNP</td>
        <td>0-0</td>
        <td>0-0</td>
        <td>0-0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
        <td>0</td>
      </tr>
    `;
  }

  return `
    <tr>
      <td>${nameHtml}</td>
      <td>${line.minutes}</td>
      <td>${line.fieldGoalsMade}-${line.fieldGoalsAttempted}</td>
      <td>${line.threePointersMade}-${line.threePointersAttempted}</td>
      <td>${line.freeThrowsMade}-${line.freeThrowsAttempted}</td>
      <td>${line.rebounds}</td>
      <td>${line.assists}</td>
      <td>${line.steals}</td>
      <td>${line.blocks}</td>
      <td>${line.turnovers}</td>
      <td>${line.points}</td>
    </tr>
  `;
}

function displayPlayerStats() {
  const table = document.getElementById("player-stats-table");
  if (!table) return;

  table.innerHTML = "";

  let roster = getSortedRoster();

  roster.sort((a, b) => comparePlayerStats(a, b));

  for (let player of roster) {
    const stats = player.seasonStats || createEmptySeasonStats();

    const row = `
      <tr>
        <td><span class="clickable-player-name" onclick="openPlayerProfile('${player.id}')">${player.name}</span></td>
        <td>${stats.games}</td>
        <td>${getAverage(stats.minutes, stats.games)}</td>
        <td>${getAverage(stats.points, stats.games)}</td>
        <td>${getAverage(stats.rebounds, stats.games)}</td>
        <td>${getAverage(stats.assists, stats.games)}</td>
        <td>${getAverage(stats.steals, stats.games)}</td>
        <td>${getAverage(stats.blocks, stats.games)}</td>
        <td>${getPercentage(stats.fieldGoalsMade, stats.fieldGoalsAttempted)}</td>
        <td>${getPercentage(stats.threePointersMade, stats.threePointersAttempted)}</td>
        <td>${getPercentage(stats.freeThrowsMade, stats.freeThrowsAttempted)}</td>
      </tr>
    `;

    table.innerHTML += row;
  }
}

function sortPlayerStats(key) {
  if (playerStatsSortKey === key) {
    playerStatsSortDirection = playerStatsSortDirection === "desc" ? "asc" : "desc";
  } else {
    playerStatsSortKey = key;
    playerStatsSortDirection = "desc";
  }

  displayPlayerStats();
}

function comparePlayerStats(a, b) {
  const aStats = a.seasonStats || createEmptySeasonStats();
  const bStats = b.seasonStats || createEmptySeasonStats();

  let aValue = getPlayerStatSortValue(a, aStats, playerStatsSortKey);
  let bValue = getPlayerStatSortValue(b, bStats, playerStatsSortKey);

  if (typeof aValue === "string") {
    return playerStatsSortDirection === "desc"
      ? bValue.localeCompare(aValue)
      : aValue.localeCompare(bValue);
  }

  return playerStatsSortDirection === "desc"
    ? bValue - aValue
    : aValue - bValue;
}

function getPlayerStatSortValue(player, stats, key) {
  if (key === "name") return player.name;
  if (key === "games") return stats.games;
  if (key === "minutes") return stats.games ? stats.minutes / stats.games : 0;
  if (key === "points") return stats.games ? stats.points / stats.games : 0;
  if (key === "rebounds") return stats.games ? stats.rebounds / stats.games : 0;
  if (key === "assists") return stats.games ? stats.assists / stats.games : 0;
  if (key === "steals") return stats.games ? stats.steals / stats.games : 0;
  if (key === "blocks") return stats.games ? stats.blocks / stats.games : 0;
  if (key === "fg") return stats.fieldGoalsAttempted ? stats.fieldGoalsMade / stats.fieldGoalsAttempted : 0;
  if (key === "three") return stats.threePointersAttempted ? stats.threePointersMade / stats.threePointersAttempted : 0;
  if (key === "ft") return stats.freeThrowsAttempted ? stats.freeThrowsMade / stats.freeThrowsAttempted : 0;

  return 0;
}

function displayTeamStats() {
  ensureTeamStats();

  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return;

  const stats = gameState.teamStats[selectedTeam.id] || createEmptyTeamStats();
  const games = stats.games || 0;

  setText("team-stat-games", games);
  setText("team-stat-record", `${selectedTeam.wins}-${selectedTeam.losses}`);
  setText("team-stat-ppg", getAverage(stats.pointsFor, games));
  setText("team-stat-opp-ppg", getAverage(stats.pointsAgainst, games));

  const differential = games ? ((stats.pointsFor - stats.pointsAgainst) / games).toFixed(1) : "0.0";
  setText("team-stat-diff", differential);

  setText("team-stat-fg", getPercentage(stats.fieldGoalsMade, stats.fieldGoalsAttempted));
  setText("team-stat-three", getPercentage(stats.threePointersMade, stats.threePointersAttempted));
  setText("team-stat-ft", getPercentage(stats.freeThrowsMade, stats.freeThrowsAttempted));
  setText("team-stat-rebounds", getAverage(stats.rebounds, games));
  setText("team-stat-assists", getAverage(stats.assists, games));
  setText("team-stat-steals", getAverage(stats.steals, games));
  setText("team-stat-blocks", getAverage(stats.blocks, games));
}

function displayLeagueLeaders() {
  const table = document.getElementById("league-leaders-table");
  if (!table) return;

  const qualified = [];

  for (let item of getAllPlayersIncludingFreeAgents()) {
    const player = item.player;
    const stats = player.seasonStats || createEmptySeasonStats();

    if (!item.team) continue;
    if (stats.games < 5) continue;

    qualified.push({
      player,
      team: item.team,
      stats,
      ppg: stats.points / stats.games,
      rpg: stats.rebounds / stats.games,
      apg: stats.assists / stats.games,
      spg: stats.steals / stats.games,
      bpg: stats.blocks / stats.games
    });
  }

  qualified.sort((a, b) => b.ppg - a.ppg);

  const leaders = qualified.slice(0, 25);

  table.innerHTML = "";

  if (leaders.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="9">No players have qualified yet. Players need at least 5 games played.</td>
      </tr>
    `;
    return;
  }

  for (let i = 0; i < leaders.length; i++) {
    const item = leaders[i];

    const row = `
      <tr>
        <td>${i + 1}</td>
        <td><span class="clickable-player-name" onclick="openPlayerProfile('${item.player.id}')">${item.player.name}</span></td>
        <td><span class="clickable-team-name" onclick="openTeamProfile(${item.team.id})">${item.team.abbrev}</span></td>
        <td>${item.stats.games}</td>
        <td>${item.ppg.toFixed(1)}</td>
        <td>${item.rpg.toFixed(1)}</td>
        <td>${item.apg.toFixed(1)}</td>
        <td>${item.spg.toFixed(1)}</td>
        <td>${item.bpg.toFixed(1)}</td>
      </tr>
    `;

    table.innerHTML += row;
  }
}

function getExpectedCpuGamesPlayedByDate(date) {
  if (!gameState || !gameState.userSchedule) return 0;

  const currentDate = new Date(date);

  return gameState.userSchedule.filter(game =>
    game &&
    game.date &&
    game.countsForRegularSeason !== false &&
    !game.playoffGame &&
    !game.playInGame &&
    new Date(game.date) <= currentDate
  ).length;
}

function processOtherTeamGamesToday() {
  if (!gameState || !gameState.started) return;

  const currentDate = new Date(gameState.currentDate);

  if (currentDate < new Date(gameState.seasonStartYear, 9, 20)) return;
  if (currentDate > new Date(gameState.seasonStartYear + 1, 3, 15)) return;

  const key = `other_team_games_${formatDateKey(currentDate)}`;

  if (gameState.processedEvents[key]) return;

  const expectedGamesPlayed = getExpectedCpuGamesPlayedByDate(currentDate);
  const todayUserGames = getTodayUserGames();
  const teamsPlayed = new Set();

  // User team should only play its own schedule.
  teamsPlayed.add(Number(gameState.selectedTeamId));

  // If user has a game today, opponent is already playing the user.
  for (let game of todayUserGames) {
    teamsPlayed.add(Number(game.opponentId));
  }

  const eligibleTeams = gameState.teams
    .filter(team => {
      const gamesPlayed = Number(team.wins || 0) + Number(team.losses || 0);

      return (
        Number(team.id) !== Number(gameState.selectedTeamId) &&
        !teamsPlayed.has(Number(team.id)) &&
        gamesPlayed < 82 &&
        gamesPlayed < expectedGamesPlayed
      );
    })
    .sort((a, b) => {
      const aGames = Number(a.wins || 0) + Number(a.losses || 0);
      const bGames = Number(b.wins || 0) + Number(b.losses || 0);

      return aGames - bGames;
    });

  const shuffledTeams = shuffleArray(eligibleTeams);

  for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
    const teamA = shuffledTeams[i];
    const teamB = shuffledTeams[i + 1];

    if (!teamA || !teamB) continue;
    if (teamsPlayed.has(Number(teamA.id)) || teamsPlayed.has(Number(teamB.id))) continue;

    const teamAGames = Number(teamA.wins || 0) + Number(teamA.losses || 0);
    const teamBGames = Number(teamB.wins || 0) + Number(teamB.losses || 0);

    if (teamAGames >= expectedGamesPlayed || teamBGames >= expectedGamesPlayed) continue;
    if (teamAGames >= 82 || teamBGames >= 82) continue;

    const result = simTeamVsTeam(teamA, teamB);

    applyRegularSeasonResult(teamA, teamB, result.winnerId);

    generatePlayerStatsForGame(
      teamA.id,
      teamB.id,
      result.scoreA,
      result.scoreB
    );

    applyEnergyLossForCompletedGame(teamA.id, teamB.id);
    rollInjuriesForCompletedGame(teamA.id, teamB.id);

    teamsPlayed.add(Number(teamA.id));
    teamsPlayed.add(Number(teamB.id));
  }

  gameState.processedEvents[key] = true;
}

function processForcedEndSeasonPlayerStats() {
  const key = `forced_end_stats_${gameState.seasonLabel}`;

  if (gameState.processedEvents[key]) return;

  const endDate = new Date(gameState.seasonStartYear + 1, 3, 15);

  if (gameState.currentDate < endDate) return;

  /*
    This function is only for CPU teams.
    The user's team should only play games that exist on the visible schedule.
  */

  for (let team of gameState.teams) {
    if (team.id === gameState.selectedTeamId) continue;

    let safety = 0;

    while (team.wins + team.losses < 82 && safety < 100) {
      safety++;

      const opponent = getRandomEligibleOpponentForForcedGame(team.id);

      if (!opponent) break;

      const result = simTeamVsTeam(team, opponent);

      applyRegularSeasonResult(team, opponent, result.winnerId);

      generatePlayerStatsForGame(
        team.id,
        opponent.id,
        result.scoreA,
        result.scoreB
      );
    }
  }

  gameState.processedEvents[key] = true;
}

function getRandomEligibleOpponentForForcedGame(teamId) {
  const possible = gameState.teams.filter(team =>
    team.id !== teamId &&
    team.id !== gameState.selectedTeamId &&
    team.wins + team.losses < 82
  );

  if (possible.length === 0) return null;

  return possible[randomInt(0, possible.length - 1)];
}

function getRandomOpponentForTeam(teamId) {
  const possible = gameState.teams.filter(team => team.id !== teamId);
  return possible[randomInt(0, possible.length - 1)];
}

function shuffleArray(array) {
  const copied = [...array];

  for (let i = copied.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    const temp = copied[i];
    copied[i] = copied[j];
    copied[j] = temp;
  }

  return copied;
}

function formatTopPerformersForInbox(topPerformers) {
  if (!topPerformers || topPerformers.length === 0) return "";

  let text = "\n\nTop Performers:";

  for (let performer of topPerformers) {
    text += `\n${performer.name}: ${performer.points} PTS, ${performer.rebounds} REB, ${performer.assists} AST`;
  }

  return text;
}

function gradeToSimpleBonus(grade) {
  const map = {
    "A+": 10,
    "A": 8,
    "A-": 6,
    "B+": 4,
    "B": 2,
    "B-": 0,
    "C+": -2,
    "C": -4,
    "C-": -6,
    "D": -8,
    "F": -12
  };

  return map[String(grade || "B").toUpperCase()] ?? 2;
}

function safeAttribute(player, key, fallback = 10) {
  if (!player || !player.attributes) return fallback;

  const value = Number(player.attributes[key]);

  return Number.isFinite(value) ? value : fallback;
}

function getSimplePlayerImpact(player) {
  if (!player) return 400;

  let base = Number(player.currentAbility || player.potentialAbility || 500);

  if (!Number.isFinite(base)) {
    base = 500;
  }

  const age = Number(player.age || 26);

  let ageModifier = 0;

  if (age >= 24 && age <= 30) ageModifier += 8;
  if (age >= 31 && age <= 34) ageModifier += 2;
  if (age >= 35) ageModifier -= 10;
  if (age <= 21) ageModifier -= 4;

  ensurePlayerEnergy(player);
ensurePlayerInjuryFields(player);

if (player.isInjured) {
  return 0;
}

const energyModifier = Math.round((Number(player.energy || 100) - 100) * 0.7);

return base + ageModifier + energyModifier;
}

function getSimpleTeamCategoryRatings(teamId) {
  const roster = getRosterByTeamId(teamId) || [];

  const sorted = [...roster]
    .sort((a, b) => getSimplePlayerImpact(b) - getSimplePlayerImpact(a))
    .slice(0, 10);

  if (sorted.length === 0) {
    return {
      shooting: 50,
      playmaking: 50,
      inside: 50,
      defense: 50,
      rebounding: 50,
      athleticism: 50,
      topStar: 500
    };
  }

  let totalWeight = 0;

  const totals = {
    shooting: 0,
    playmaking: 0,
    inside: 0,
    defense: 0,
    rebounding: 0,
    athleticism: 0
  };

  sorted.forEach((player, index) => {
    const weight = index < 5 ? 1.25 : 0.75;
    totalWeight += weight;

    const shooting =
      safeAttribute(player, "threePoint") * 0.45 +
      safeAttribute(player, "midrange") * 0.25 +
      safeAttribute(player, "touch") * 0.2 +
      safeAttribute(player, "freeThrow") * 0.1;

    const playmaking =
      safeAttribute(player, "passing") * 0.35 +
      safeAttribute(player, "passPerception") * 0.25 +
      safeAttribute(player, "ballHandling") * 0.25 +
      safeAttribute(player, "basketballIQ") * 0.15;

    const inside =
      safeAttribute(player, "finishing") * 0.35 +
      safeAttribute(player, "closeShot") * 0.25 +
      safeAttribute(player, "postScoring") * 0.2 +
      safeAttribute(player, "foulDrawing") * 0.2;

    const defense =
      safeAttribute(player, "perimeterDefense") * 0.25 +
      safeAttribute(player, "interiorDefense") * 0.2 +
      safeAttribute(player, "helpDefense") * 0.2 +
      safeAttribute(player, "defensiveIQ") * 0.2 +
      safeAttribute(player, "switchability") * 0.15;

    const rebounding =
      safeAttribute(player, "defensiveRebounding") * 0.55 +
      safeAttribute(player, "offensiveRebounding") * 0.3 +
      safeAttribute(player, "strength") * 0.15;

    const athleticism =
      safeAttribute(player, "speed") * 0.25 +
      safeAttribute(player, "acceleration") * 0.2 +
      safeAttribute(player, "vertical") * 0.2 +
      safeAttribute(player, "agility") * 0.2 +
      safeAttribute(player, "stamina") * 0.15;

    totals.shooting += shooting * weight;
    totals.playmaking += playmaking * weight;
    totals.inside += inside * weight;
    totals.defense += defense * weight;
    totals.rebounding += rebounding * weight;
    totals.athleticism += athleticism * weight;
  });

  function to100(value) {
    return Math.round((value / totalWeight) * 5);
  }

  return {
    shooting: to100(totals.shooting),
    playmaking: to100(totals.playmaking),
    inside: to100(totals.inside),
    defense: to100(totals.defense),
    rebounding: to100(totals.rebounding),
    athleticism: to100(totals.athleticism),
    topStar: getSimplePlayerImpact(sorted[0])
  };
}

function getSimpleTeamCoreRating(teamId) {
  const team = getTeamById(teamId) || getBaseTeamById(teamId);

  if (!team) return 500;

  const roster = getRosterByTeamId(teamId) || [];

  if (!roster.length) {
    return Number(team.teamStrength || 500);
  }

  /*
    User team uses rotation minutes.
    CPU teams use top 10 players for now.
  */
  if (Number(teamId) === Number(gameState.selectedTeamId) && gameState.rotation) {
    const lineup = getRotationLineupPlayers()
      .filter(item => item.player && Number(item.minutes || 0) > 0);

    if (lineup.length) {
      let totalMinutes = 0;
      let weightedTotal = 0;

      for (let item of lineup) {
        const minutes = Number(item.minutes || 0);
        totalMinutes += minutes;
        weightedTotal += getSimplePlayerImpact(item.player) * minutes;
      }

      if (totalMinutes > 0) {
        return Math.round(weightedTotal / totalMinutes);
      }
    }
  }

  const minutesPlan = [34, 34, 32, 32, 30, 26, 20, 16, 10, 6];

  const sorted = [...roster]
    .sort((a, b) => getSimplePlayerImpact(b) - getSimplePlayerImpact(a))
    .slice(0, 10);

  let totalMinutes = 0;
  let weightedTotal = 0;

  sorted.forEach((player, index) => {
    const minutes = minutesPlan[index] || 0;
    totalMinutes += minutes;
    weightedTotal += getSimplePlayerImpact(player) * minutes;
  });

  if (totalMinutes <= 0) return Number(team.teamStrength || 500);

  return Math.round(weightedTotal / totalMinutes);
}

function getSimpleCoachBonus(teamId, side = "overall") {
  if (typeof getTeamStaff !== "function") return 0;

  const staff = getTeamStaff(teamId);
  const coach = staff ? staff.headCoach : null;

  if (!coach) return 0;

  let bonus = 0;

  if (side === "offense") {
    bonus += gradeToSimpleBonus(coach.offense);
  } else if (side === "defense") {
    bonus += gradeToSimpleBonus(coach.defense);
  } else {
    bonus += gradeToSimpleBonus(coach.offense) * 0.4;
    bonus += gradeToSimpleBonus(coach.defense) * 0.4;
    bonus += gradeToSimpleBonus(coach.motivation) * 0.2;
  }

  bonus += Math.round((Number(coach.reputation || 75) - 75) / 8);

  return Math.round(bonus);
}

function getSimpleGameplanForTeam(teamId) {
  if (Number(teamId) === Number(gameState.selectedTeamId)) {
    return gameState.gameplan || getDefaultGameplan();
  }

  return getDefaultGameplan();
}

function getSimpleGameplanBonus(teamId) {
  const plan = getSimpleGameplanForTeam(teamId);
  const ratings = getSimpleTeamCategoryRatings(teamId);

  let bonus = 0;

  switch (plan.offensiveStyle) {
    case "Pace and Space":
      bonus += ratings.shooting >= 65 ? 5 : -3;
      bonus += ratings.playmaking >= 60 ? 2 : 0;
      break;

    case "Motion Offense":
      bonus += ratings.playmaking >= 62 ? 4 : -2;
      bonus += ratings.shooting >= 60 ? 2 : 0;
      break;

    case "Star Isolation":
      bonus += ratings.topStar >= 650 ? 5 : -3;
      break;

    case "Post-Centric":
      bonus += ratings.inside >= 65 ? 5 : -3;
      bonus += ratings.rebounding >= 60 ? 2 : 0;
      break;

    case "Pick and Roll Heavy":
      bonus += ratings.playmaking >= 60 ? 3 : -1;
      bonus += ratings.inside >= 58 ? 2 : 0;
      break;

    default:
      bonus += 1;
      break;
  }

  switch (plan.defensiveStyle) {
    case "Protect the Paint":
      bonus += ratings.defense >= 60 ? 2 : 0;
      bonus += ratings.rebounding >= 62 ? 3 : -2;
      break;

    case "Pressure Defense":
      bonus += ratings.athleticism >= 62 ? 4 : -3;
      break;

    case "Switch Everything":
      bonus += ratings.athleticism >= 60 && ratings.defense >= 60 ? 5 : -3;
      break;

    case "Limit Threes":
      bonus += ratings.defense >= 62 ? 3 : -1;
      break;

    case "Force Turnovers":
      bonus += ratings.athleticism >= 62 ? 3 : -2;
      break;

    default:
      bonus += 1;
      break;
  }

  if (plan.pace === "Fast" && ratings.athleticism >= 62) bonus += 2;
  if (plan.pace === "Fast" && ratings.athleticism < 55) bonus -= 2;

  if (plan.ballMovement === "High" && ratings.playmaking >= 62) bonus += 2;
  if (plan.ballMovement === "High" && ratings.playmaking < 55) bonus -= 2;

  if (plan.reboundingFocus === "Crash Glass" && ratings.rebounding >= 62) bonus += 2;
  if (plan.reboundingFocus === "Transition" && ratings.athleticism >= 62) bonus += 1;

  return clamp(Math.round(bonus), -10, 10);
}

function calculateSimpleTeamGameRating(teamId) {
  const core = getSimpleTeamCoreRating(teamId);
  const categories = getSimpleTeamCategoryRatings(teamId);
  const coachBonus = getSimpleCoachBonus(teamId, "overall");
  const gameplanBonus = getSimpleGameplanBonus(teamId);

  const offense =
    core +
    getSimpleCoachBonus(teamId, "offense") +
    Math.round((categories.shooting - 55) * 0.7) +
    Math.round((categories.playmaking - 55) * 0.45);

  const defense =
    core +
    getSimpleCoachBonus(teamId, "defense") +
    Math.round((categories.defense - 55) * 0.7) +
    Math.round((categories.rebounding - 55) * 0.35);

  const total = Math.round(
    core +
    coachBonus +
    gameplanBonus +
    Math.round((categories.defense - 55) * 0.15) +
    Math.round((categories.shooting - 55) * 0.15)
  );

  return {
    total,
    core,
    offense,
    defense,
    coachBonus,
    gameplanBonus,
    categories
  };
}

function simTeamVsTeam(teamA, teamB, options = {}) {
  if (!teamA || !teamB) {
    return {
      winnerId: teamA ? teamA.id : null,
      loserId: teamB ? teamB.id : null,
      teamAScore: 100,
      teamBScore: 90,
      scoreA: 100,
      scoreB: 90
    };
  }

  const ratingA = calculateSimpleTeamGameRating(teamA.id);
  const ratingB = calculateSimpleTeamGameRating(teamB.id);

  const homeTeamId = options.homeTeamId ? Number(options.homeTeamId) : null;

  const homeBonusA = homeTeamId === Number(teamA.id) ? 12 : 0;
  const homeBonusB = homeTeamId === Number(teamB.id) ? 12 : 0;

  const randomA = randomInt(-28, 28);
  const randomB = randomInt(-28, 28);

  const gamePowerA = ratingA.total + homeBonusA + randomA;
  const gamePowerB = ratingB.total + homeBonusB + randomB;

  const paceBase = 108 + randomInt(-4, 6);

  let teamAScore = Math.round(
    paceBase +
    (ratingA.offense - ratingB.defense) * 0.045 +
    (gamePowerA - gamePowerB) * 0.06 +
    randomInt(-7, 7)
  );

  let teamBScore = Math.round(
    paceBase +
    (ratingB.offense - ratingA.defense) * 0.045 +
    (gamePowerB - gamePowerA) * 0.06 +
    randomInt(-7, 7)
  );

  teamAScore = clamp(teamAScore, 82, 145);
  teamBScore = clamp(teamBScore, 82, 145);

  if (teamAScore === teamBScore) {
    if (gamePowerA >= gamePowerB) {
      teamAScore += randomInt(1, 4);
    } else {
      teamBScore += randomInt(1, 4);
    }
  }

  const teamAWon = teamAScore > teamBScore;

  return {
    teamAId: teamA.id,
    teamBId: teamB.id,
    winnerId: teamAWon ? teamA.id : teamB.id,
    loserId: teamAWon ? teamB.id : teamA.id,

    teamAScore,
    teamBScore,

    scoreA: teamAScore,
    scoreB: teamBScore,

    teamARating: ratingA,
    teamBRating: ratingB,
    homeTeamId
  };
}

function debugSimpleGameRating(teamId) {
  const team = getTeamById(teamId) || getBaseTeamById(teamId);
  const rating = calculateSimpleTeamGameRating(teamId);

  console.log(team ? team.name : teamId, rating);

  return rating;
}

/* ======================================================
   STATS PAGE REDESIGN
   Task 6
====================================================== */

function escapeStatsHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStatsSafeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getStatsAverage(total, games) {
  const safeGames = Number(games || 0);

  if (!safeGames) return "0.0";

  return (Number(total || 0) / safeGames).toFixed(1);
}

function getStatsRawAverage(total, games) {
  const safeGames = Number(games || 0);

  if (!safeGames) return 0;

  return Number(total || 0) / safeGames;
}

function getStatsPercentage(made, attempted) {
  const attempts = Number(attempted || 0);

  if (!attempts) return ".000";

  const pct = Number(made || 0) / attempts;

  return pct.toFixed(3).replace(/^0/, "");
}

function getStatsRawPercentage(made, attempted) {
  const attempts = Number(attempted || 0);

  if (!attempts) return 0;

  return Number(made || 0) / attempts;
}

function getStatsPlayerId(player) {
  return String(player?.id || player?.playerId || player?.name || "");
}

function getStatsPlayerPosition(player) {
  return player?.primaryPosition || player?.position || "-";
}

function getAllRosteredPlayerStatEntries() {
  const entries = [];

  if (!gameState || !gameState.rosters) return entries;

  for (let teamId in gameState.rosters) {
    const team = getTeamById(Number(teamId));
    const roster = gameState.rosters[teamId];

    if (!team || !Array.isArray(roster)) continue;

    for (let player of roster) {
      if (!player) continue;

      if (!player.seasonStats) {
        player.seasonStats = createEmptySeasonStats();
      }

      entries.push({
        player,
        team,
        teamId: Number(teamId),
        stats: player.seasonStats
      });
    }
  }

  return entries;
}

function getEstimatedOffensiveRebounds(player, stats) {
  if (stats.offensiveRebounds !== undefined) return Number(stats.offensiveRebounds || 0);
  if (stats.orb !== undefined) return Number(stats.orb || 0);

  const totalRebounds = Number(stats.rebounds || 0);
  const attributes = player?.attributes || {};

  const offensive = Number(attributes.offensiveRebounding || 8);
  const defensive = Number(attributes.defensiveRebounding || 8);
  const total = Math.max(1, offensive + defensive);

  const offensiveShare = clamp(offensive / total, 0.22, 0.43);

  return Math.round(totalRebounds * offensiveShare);
}

function getEstimatedDefensiveRebounds(player, stats) {
  if (stats.defensiveRebounds !== undefined) return Number(stats.defensiveRebounds || 0);
  if (stats.drb !== undefined) return Number(stats.drb || 0);

  const totalRebounds = Number(stats.rebounds || 0);
  const offensiveRebounds = getEstimatedOffensiveRebounds(player, stats);

  return Math.max(0, totalRebounds - offensiveRebounds);
}

function getStatsLeaderValue(entry, key) {
  const player = entry.player;
  const stats = entry.stats || createEmptySeasonStats();
  const games = Number(stats.games || 0);

  const orb = getEstimatedOffensiveRebounds(player, stats);
  const drb = getEstimatedDefensiveRebounds(player, stats);

  const values = {
    totalPoints: Number(stats.points || 0),
    pointsPerGame: getStatsRawAverage(stats.points, games),
    totalRebounds: Number(stats.rebounds || 0),
    reboundsPerGame: getStatsRawAverage(stats.rebounds, games),
    totalAssists: Number(stats.assists || 0),
    assistsPerGame: getStatsRawAverage(stats.assists, games),
    offensiveRebounds: orb,
    offensiveReboundsPerGame: getStatsRawAverage(orb, games),
    defensiveRebounds: drb,
    defensiveReboundsPerGame: getStatsRawAverage(drb, games),
    steals: Number(stats.steals || 0),
    stealsPerGame: getStatsRawAverage(stats.steals, games),
    blocks: Number(stats.blocks || 0),
    blocksPerGame: getStatsRawAverage(stats.blocks, games),
    fieldGoalPercentage: getStatsRawPercentage(stats.fieldGoalsMade, stats.fieldGoalsAttempted),
    threePointPercentage: getStatsRawPercentage(stats.threePointersMade, stats.threePointersAttempted),
    fieldGoalsMade: Number(stats.fieldGoalsMade || 0),
    fieldGoalsAttempted: Number(stats.fieldGoalsAttempted || 0),
    threePointersMade: Number(stats.threePointersMade || 0),
    threePointersAttempted: Number(stats.threePointersAttempted || 0),
    freeThrowsMade: Number(stats.freeThrowsMade || 0),
    freeThrowsPerGame: getStatsRawAverage(stats.freeThrowsMade, games),
    freeThrowPercentage: getStatsRawPercentage(stats.freeThrowsMade, stats.freeThrowsAttempted),
    totalMinutes: Number(stats.minutes || 0)
  };

  return Number(values[key] || 0);
}

function getStatsLeaderDisplayValue(entry, key) {
  const stats = entry.stats || createEmptySeasonStats();
  const value = getStatsLeaderValue(entry, key);

  if (
    key === "pointsPerGame" ||
    key === "reboundsPerGame" ||
    key === "assistsPerGame" ||
    key === "offensiveReboundsPerGame" ||
    key === "defensiveReboundsPerGame" ||
    key === "stealsPerGame" ||
    key === "blocksPerGame" ||
    key === "freeThrowsPerGame"
  ) {
    return value.toFixed(1);
  }

  if (key === "fieldGoalPercentage") {
    return getStatsPercentage(stats.fieldGoalsMade, stats.fieldGoalsAttempted);
  }

  if (key === "threePointPercentage") {
    return getStatsPercentage(stats.threePointersMade, stats.threePointersAttempted);
  }

  if (key === "freeThrowPercentage") {
    return getStatsPercentage(stats.freeThrowsMade, stats.freeThrowsAttempted);
  }

  return Math.round(value);
}

function getPlayerStatSortValue(player, stats, key) {
  const games = Number(stats.games || 0);
  const orb = getEstimatedOffensiveRebounds(player, stats);
  const drb = getEstimatedDefensiveRebounds(player, stats);

  if (key === "name") return player.name;
  if (key === "games") return Number(stats.games || 0);
  if (key === "starts") return Number(stats.gamesStarted || 0);

  if (key === "minutesTotal") return Number(stats.minutes || 0);
  if (key === "minutes") return getStatsRawAverage(stats.minutes, games);

  if (key === "pointsTotal") return Number(stats.points || 0);
  if (key === "points") return getStatsRawAverage(stats.points, games);

  if (key === "reboundsTotal") return Number(stats.rebounds || 0);
  if (key === "rebounds") return getStatsRawAverage(stats.rebounds, games);

  if (key === "assistsTotal") return Number(stats.assists || 0);
  if (key === "assists") return getStatsRawAverage(stats.assists, games);

  if (key === "orbTotal") return orb;
  if (key === "orb") return getStatsRawAverage(orb, games);

  if (key === "drbTotal") return drb;
  if (key === "drb") return getStatsRawAverage(drb, games);

  if (key === "stealsTotal") return Number(stats.steals || 0);
  if (key === "steals") return getStatsRawAverage(stats.steals, games);

  if (key === "blocksTotal") return Number(stats.blocks || 0);
  if (key === "blocks") return getStatsRawAverage(stats.blocks, games);

  if (key === "fgm") return Number(stats.fieldGoalsMade || 0);
  if (key === "fga") return Number(stats.fieldGoalsAttempted || 0);
  if (key === "fg") return getStatsRawPercentage(stats.fieldGoalsMade, stats.fieldGoalsAttempted);

  if (key === "threeMade") return Number(stats.threePointersMade || 0);
  if (key === "threeAttempted") return Number(stats.threePointersAttempted || 0);
  if (key === "three") return getStatsRawPercentage(stats.threePointersMade, stats.threePointersAttempted);

  if (key === "ftm") return Number(stats.freeThrowsMade || 0);
  if (key === "fta") return Number(stats.freeThrowsAttempted || 0);
  if (key === "ft") return getStatsRawPercentage(stats.freeThrowsMade, stats.freeThrowsAttempted);

  if (key === "turnovers") return Number(stats.turnovers || 0);

  return 0;
}

function displayPlayerStats() {
  const table = document.getElementById("player-stats-table");
  if (!table || !gameState || !gameState.started) return;

  table.innerHTML = "";

  let roster = getSortedRoster();

  roster.forEach(player => {
    if (!player.seasonStats) player.seasonStats = createEmptySeasonStats();
  });

  roster.sort((a, b) => comparePlayerStats(a, b));

  for (let player of roster) {
    const stats = player.seasonStats || createEmptySeasonStats();
    const games = Number(stats.games || 0);
    const orb = getEstimatedOffensiveRebounds(player, stats);
    const drb = getEstimatedDefensiveRebounds(player, stats);

    table.innerHTML += `
      <tr>
        <td>
          <span class="clickable-player-name" onclick="openPlayerProfile('${getStatsPlayerId(player)}')">
            ${escapeStatsHtml(player.name)}
          </span>
        </td>
        <td>${stats.games}</td>
        <td>${Number(stats.gamesStarted || 0)}</td>
        <td>${Math.round(Number(stats.minutes || 0))}</td>
        <td>${getStatsAverage(stats.minutes, games)}</td>
        <td>${Math.round(Number(stats.points || 0))}</td>
        <td>${getStatsAverage(stats.points, games)}</td>
        <td>${Math.round(Number(stats.rebounds || 0))}</td>
        <td>${getStatsAverage(stats.rebounds, games)}</td>
        <td>${Math.round(Number(stats.assists || 0))}</td>
        <td>${getStatsAverage(stats.assists, games)}</td>
        <td>${orb}</td>
        <td>${getStatsAverage(orb, games)}</td>
        <td>${drb}</td>
        <td>${getStatsAverage(drb, games)}</td>
        <td>${Math.round(Number(stats.steals || 0))}</td>
        <td>${getStatsAverage(stats.steals, games)}</td>
        <td>${Math.round(Number(stats.blocks || 0))}</td>
        <td>${getStatsAverage(stats.blocks, games)}</td>
        <td>${Math.round(Number(stats.fieldGoalsMade || 0))}</td>
        <td>${Math.round(Number(stats.fieldGoalsAttempted || 0))}</td>
        <td>${getStatsPercentage(stats.fieldGoalsMade, stats.fieldGoalsAttempted)}</td>
        <td>${Math.round(Number(stats.threePointersMade || 0))}</td>
        <td>${Math.round(Number(stats.threePointersAttempted || 0))}</td>
        <td>${getStatsPercentage(stats.threePointersMade, stats.threePointersAttempted)}</td>
        <td>${Math.round(Number(stats.freeThrowsMade || 0))}</td>
        <td>${Math.round(Number(stats.freeThrowsAttempted || 0))}</td>
        <td>${getStatsPercentage(stats.freeThrowsMade, stats.freeThrowsAttempted)}</td>
        <td>${Math.round(Number(stats.turnovers || 0))}</td>
      </tr>
    `;
  }
}

function getTeamStatsProfile(team) {
  const stats = gameState.teamStats?.[team.id] || createEmptyTeamStats();
  const games = Number(stats.games || 0);
  const wins = Number(team.wins || 0);
  const losses = Number(team.losses || 0);

  return {
    team,
    stats,
    games,
    wins,
    losses,
    ppg: getStatsAverage(stats.pointsFor, games),
    oppPpg: getStatsAverage(stats.pointsAgainst, games),
    rpg: getStatsAverage(stats.rebounds, games),
    apg: getStatsAverage(stats.assists, games),
    spg: getStatsAverage(stats.steals, games),
    bpg: getStatsAverage(stats.blocks, games),
    fg: getStatsPercentage(stats.fieldGoalsMade, stats.fieldGoalsAttempted),
    three: getStatsPercentage(stats.threePointersMade, stats.threePointersAttempted),
    ft: getStatsPercentage(stats.freeThrowsMade, stats.freeThrowsAttempted),
    tov: getStatsAverage(stats.turnovers, games)
  };
}

function displayTeamStats() {
  ensureTeamStats();

  const table = document.getElementById("all-team-stats-table");
  if (!table || !gameState || !Array.isArray(gameState.teams)) return;

  const rows = gameState.teams
  .map(team => getTeamStatsProfile(team))
  .sort(compareTeamStatsProfiles);

  table.innerHTML = rows.map(profile => {
    const isUserTeam = Number(profile.team.id) === Number(gameState.selectedTeamId);

    return `
      <tr class="${isUserTeam ? "stats-user-team-row" : ""}">
        <td>
          <span class="clickable-team-name" onclick="openTeamProfile(${profile.team.id})">
            ${escapeStatsHtml(profile.team.name)}
          </span>
        </td>
        <td>${profile.wins}</td>
        <td>${profile.losses}</td>
        <td>${profile.ppg}</td>
        <td>${profile.oppPpg}</td>
        <td>${profile.rpg}</td>
        <td>${profile.apg}</td>
        <td>${profile.spg}</td>
        <td>${profile.bpg}</td>
        <td>${profile.fg}</td>
        <td>${profile.three}</td>
        <td>${profile.ft}</td>
        <td>${profile.tov}</td>
      </tr>
    `;
  }).join("");
}

function getLeagueLeaderDefinitions() {
  return [
    { key: "totalPoints", title: "Total Points", suffix: "PTS" },
    { key: "pointsPerGame", title: "Points Per Game", suffix: "PPG" },
    { key: "totalRebounds", title: "Total Rebounds", suffix: "REB" },
    { key: "reboundsPerGame", title: "Rebounds Per Game", suffix: "RPG" },
    { key: "totalAssists", title: "Total Assists", suffix: "AST" },
    { key: "assistsPerGame", title: "Assists Per Game", suffix: "APG" },
    { key: "offensiveRebounds", title: "Offensive Rebounds", suffix: "ORB" },
    { key: "offensiveReboundsPerGame", title: "Offensive Rebounds Per Game", suffix: "ORBPG" },
    { key: "defensiveRebounds", title: "Defensive Rebounds", suffix: "DRB" },
    { key: "defensiveReboundsPerGame", title: "Defensive Rebounds Per Game", suffix: "DRBPG" },
    { key: "steals", title: "Steals", suffix: "STL" },
    { key: "stealsPerGame", title: "Steals Per Game", suffix: "SPG" },
    { key: "blocks", title: "Blocks", suffix: "BLK" },
    { key: "blocksPerGame", title: "Blocks Per Game", suffix: "BPG" },
    { key: "fieldGoalPercentage", title: "Field Goal Percentage", suffix: "FG%", percentage: true, minimumKey: "fieldGoalsAttempted", minimum: 100 },
    { key: "threePointPercentage", title: "Three-Point Percentage", suffix: "3P%", percentage: true, minimumKey: "threePointersAttempted", minimum: 50 },
    { key: "fieldGoalsMade", title: "Field Goals Made", suffix: "FGM" },
    { key: "fieldGoalsAttempted", title: "Field Goals Attempted", suffix: "FGA" },
    { key: "threePointersMade", title: "Three-Pointers Made", suffix: "3PM" },
    { key: "threePointersAttempted", title: "Three-Pointers Attempted", suffix: "3PA" },
    { key: "freeThrowsMade", title: "Free Throws Made", suffix: "FT" },
    { key: "freeThrowsPerGame", title: "Free Throws Per Game", suffix: "FTPG" },
    { key: "freeThrowPercentage", title: "Free Throw Percentage", suffix: "FT%", percentage: true, minimumKey: "freeThrowsAttempted", minimum: 50 },
    { key: "totalMinutes", title: "Total Minutes", suffix: "MIN" }
  ];
}

function getQualifiedLeagueLeaderEntries(definition, entries) {
  let pool = entries.filter(entry => {
    const stats = entry.stats || createEmptySeasonStats();

    if (Number(stats.games || 0) <= 0) return false;

    if (definition.percentage) {
      return Number(stats[definition.minimumKey] || 0) >= Number(definition.minimum || 0);
    }

    return getStatsLeaderValue(entry, definition.key) > 0;
  });

  // Early season fallback so percentage cards are not empty.
  if (pool.length < 5 && definition.percentage) {
    pool = entries.filter(entry => {
      const stats = entry.stats || createEmptySeasonStats();
      return Number(stats.games || 0) > 0 && Number(stats[definition.minimumKey] || 0) > 0;
    });
  }

  return pool;
}

function renderLeagueLeaderCard(definition, entries) {
  const qualified = getQualifiedLeagueLeaderEntries(definition, entries)
    .sort((a, b) => getStatsLeaderValue(b, definition.key) - getStatsLeaderValue(a, definition.key))
    .slice(0, 5);

  return `
    <div class="stats-leader-card">
      <div class="stats-leader-card-header">
        <h3>${escapeStatsHtml(definition.title)}</h3>
        <span>Top 5</span>
      </div>

      <div class="stats-leader-list">
        ${
          qualified.length
            ? qualified.map((entry, index) => renderLeagueLeaderRow(entry, definition, index + 1)).join("")
            : `<div class="stats-leader-empty">No qualified players yet.</div>`
        }
      </div>
    </div>
  `;
}

function renderLeagueLeaderRow(entry, definition, rank) {
  const player = entry.player;
  const value = getStatsLeaderDisplayValue(entry, definition.key);

  return `
    <button
      type="button"
      class="stats-leader-row"
      onclick="openPlayerProfile('${getStatsPlayerId(player)}')"
    >
      <span class="stats-leader-rank">${rank}</span>
      <span class="stats-leader-position">${escapeStatsHtml(getStatsPlayerPosition(player))}</span>
      <strong>${escapeStatsHtml(player.name)}</strong>
      <em>${escapeStatsHtml(value)} ${escapeStatsHtml(definition.suffix)}</em>
    </button>
  `;
}

function displayLeagueLeaders() {
  const grid = document.getElementById("league-leaders-grid");
  if (!grid || !gameState || !gameState.started) return;

  const entries = getAllRosteredPlayerStatEntries();

  grid.innerHTML = getLeagueLeaderDefinitions()
    .map(definition => renderLeagueLeaderCard(definition, entries))
    .join("");
}

function getSeasonHighDefinitions() {
  return [
    { key: "points", title: "Points In A Game", suffix: "PTS" },
    { key: "rebounds", title: "Rebounds In A Game", suffix: "REB" },
    { key: "assists", title: "Assists In A Game", suffix: "AST" },
    { key: "steals", title: "Steals In A Game", suffix: "STL" },
    { key: "blocks", title: "Blocks In A Game", suffix: "BLK" },
    { key: "fieldGoalsMade", title: "Field Goals Made In A Game", suffix: "FGM" }
  ];
}

function getPlayerFromSeasonHighLine(line) {
  if (!line) return null;

  const playerId = line.playerId;

  if (playerId && typeof getPlayerById === "function") {
    const player = getPlayerById(playerId);
    if (player) return player;
  }

  const entries = getAllRosteredPlayerStatEntries();

  return entries.find(entry =>
    String(entry.player.id || entry.player.playerId) === String(playerId) ||
    String(entry.player.name) === String(line.name)
  )?.player || null;
}

function getAllSavedBoxScoreLinesForSeasonHighs() {
  const lines = [];

  if (!gameState || !Array.isArray(gameState.userSchedule)) return lines;

  for (let game of gameState.userSchedule) {
    if (!game || !game.played || !game.boxScore) continue;

    const boxScore = game.boxScore;
    const combinedLines = [
      ...(boxScore.userLines || []),
      ...(boxScore.opponentLines || [])
    ];

    for (let line of combinedLines) {
      if (!line || line.dnp) continue;

      const player = getPlayerFromSeasonHighLine(line);

      lines.push({
        line,
        player,
        playerName: player?.name || line.name || "Unknown Player",
        position: player ? getStatsPlayerPosition(player) : "-",
        playerId: player?.id || player?.playerId || line.playerId || null
      });
    }
  }

  return lines;
}

function renderSeasonHighCard(definition, allLines) {
  const leaders = allLines
    .filter(entry => Number(entry.line[definition.key] || 0) > 0)
    .sort((a, b) => Number(b.line[definition.key] || 0) - Number(a.line[definition.key] || 0))
    .slice(0, 5);

  return `
    <div class="stats-leader-card season-high-card">
      <div class="stats-leader-card-header">
        <h3>${escapeStatsHtml(definition.title)}</h3>
        <span>Top 5</span>
      </div>

      <div class="stats-leader-list">
        ${
          leaders.length
            ? leaders.map((entry, index) => renderSeasonHighRow(entry, definition, index + 1)).join("")
            : `<div class="stats-leader-empty">No saved box score data yet.</div>`
        }
      </div>
    </div>
  `;
}

function renderSeasonHighRow(entry, definition, rank) {
  const value = Number(entry.line[definition.key] || 0);
  const playerButton = entry.playerId
    ? `onclick="openPlayerProfile('${entry.playerId}')"`
    : "";

  return `
    <button
      type="button"
      class="stats-leader-row"
      ${playerButton}
    >
      <span class="stats-leader-rank">${rank}</span>
      <span class="stats-leader-position">${escapeStatsHtml(entry.position)}</span>
      <strong>${escapeStatsHtml(entry.playerName)}</strong>
      <em>${value} ${escapeStatsHtml(definition.suffix)}</em>
    </button>
  `;
}

function displaySeasonHighs() {
  const grid = document.getElementById("season-highs-grid");
  if (!grid || !gameState || !gameState.started) return;

  const allLines = getAllSavedBoxScoreLinesForSeasonHighs();

  grid.innerHTML = getSeasonHighDefinitions()
    .map(definition => renderSeasonHighCard(definition, allLines))
    .join("");
}

/* ======================================================
   TEAM STATS SORTING
====================================================== */

var currentTeamStatsSortKey = "wins";
var currentTeamStatsSortDirection = "desc";

function sortTeamStats(key) {
  if (currentTeamStatsSortKey === key) {
    currentTeamStatsSortDirection =
      currentTeamStatsSortDirection === "desc" ? "asc" : "desc";
  } else {
    currentTeamStatsSortKey = key;

    // Team name should start A-Z. Everything else should start high-to-low.
    currentTeamStatsSortDirection = key === "team" ? "asc" : "desc";
  }

  displayTeamStats();
}

function getTeamStatsSortValue(profile, key) {
  if (!profile) return 0;

  if (key === "team") return profile.team.name || "";
  if (key === "wins") return Number(profile.wins || 0);
  if (key === "losses") return Number(profile.losses || 0);
  if (key === "ppg") return Number(profile.ppg || 0);
  if (key === "oppPpg") return Number(profile.oppPpg || 0);
  if (key === "rpg") return Number(profile.rpg || 0);
  if (key === "apg") return Number(profile.apg || 0);
  if (key === "spg") return Number(profile.spg || 0);
  if (key === "bpg") return Number(profile.bpg || 0);
  if (key === "fg") return Number(String(profile.fg || "0").replace(".", "0."));
  if (key === "three") return Number(String(profile.three || "0").replace(".", "0."));
  if (key === "ft") return Number(String(profile.ft || "0").replace(".", "0."));
  if (key === "tov") return Number(profile.tov || 0);

  return 0;
}

function compareTeamStatsProfiles(a, b) {
  const key = currentTeamStatsSortKey || "wins";
  const direction = currentTeamStatsSortDirection || "desc";

  const aValue = getTeamStatsSortValue(a, key);
  const bValue = getTeamStatsSortValue(b, key);

  let result = 0;

  if (typeof aValue === "string" || typeof bValue === "string") {
    result = String(aValue).localeCompare(String(bValue));
  } else {
    result = Number(aValue || 0) - Number(bValue || 0);
  }

  if (direction === "desc") {
    result *= -1;
  }

  if (result === 0) {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.team.name.localeCompare(b.team.name);
  }

  return result;
}