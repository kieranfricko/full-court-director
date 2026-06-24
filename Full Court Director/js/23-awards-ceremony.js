const AWARDS_CEREMONY_DATE_KEY = 415;
const AWARDS_PLAYER_GAMES_REQUIRED = 65;

const FCD_AWARD_DEFINITIONS = [
  {
    id: "mvp",
    title: "Most Valuable Player",
    shortTitle: "MVP",
    type: "player",
    scoreKey: "mvpScore"
  },
  {
    id: "roy",
    title: "Rookie of the Year",
    shortTitle: "ROTY",
    type: "player",
    scoreKey: "rookieScore",
    filter: "rookie"
  },
  {
    id: "dpoy",
    title: "Defensive Player of the Year",
    shortTitle: "DPOY",
    type: "player",
    scoreKey: "defenseScore"
  },
  {
    id: "sixth",
    title: "Sixth Man of the Year",
    shortTitle: "Sixth Man",
    type: "player",
    scoreKey: "sixthManScore",
    filter: "sixthMan"
  },
  {
    id: "mip",
    title: "Most Improved Player",
    shortTitle: "MIP",
    type: "player",
    scoreKey: "improvedScore"
  },
  {
    id: "clutch",
    title: "Clutch Player of the Year",
    shortTitle: "Clutch",
    type: "player",
    scoreKey: "clutchScore"
  },
  {
    id: "coy",
    title: "Coach of the Year",
    shortTitle: "COY",
    type: "coach"
  },
  {
    id: "eoy",
    title: "Executive of the Year",
    shortTitle: "EOY",
    type: "executive"
  },
  {
    id: "teammate",
    title: "Teammate of the Year",
    shortTitle: "Teammate",
    type: "player",
    scoreKey: "teammateScore"
  },
  {
    id: "sportsmanship",
    title: "Sportsmanship Award",
    shortTitle: "Sportsmanship",
    type: "player",
    scoreKey: "sportsmanshipScore"
  },
  {
    id: "hustle",
    title: "Hustle Award",
    shortTitle: "Hustle",
    type: "player",
    scoreKey: "hustleScore"
  }
];

function getAwardsDateKey() {
  if (!gameState || !gameState.currentDate) return 0;

  const date = new Date(gameState.currentDate);
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function isAwardsCeremonyAvailable() {
  if (!gameState || !gameState.started || !gameState.currentDate) return false;

  const currentDate = new Date(gameState.currentDate);

  const awardsDate = new Date(
    Number(gameState.seasonStartYear) + 1,
    3,
    15
  );

  currentDate.setHours(0, 0, 0, 0);
  awardsDate.setHours(0, 0, 0, 0);

  if (currentDate.getTime() !== awardsDate.getTime()) return false;

  const regularSeasonGames = Array.isArray(gameState.userSchedule)
    ? gameState.userSchedule.filter(game =>
        game &&
        game.countsForRegularSeason !== false &&
        game.playoffGame !== true &&
        game.playInGame !== true
      )
    : [];

  const allRegularSeasonGamesPlayed =
    regularSeasonGames.length > 0 &&
    regularSeasonGames.every(game => game.played === true);

  return allRegularSeasonGamesPlayed;
}

function isAwardsCeremonyComplete() {
  return Boolean(gameState && gameState.awardsCeremony && gameState.awardsCeremony.complete);
}

function ensureAwardsCeremonyState() {
  if (!gameState.awardsCeremony) {
    gameState.awardsCeremony = {
      generated: false,
      complete: false,
      currentStepIndex: 0,
      revealedAwards: {},
      results: null
    };
  }

  return gameState.awardsCeremony;
}

function getAwardStatAverage(stats, key) {
  if (!stats || !stats.games) return 0;
  return Number((Number(stats[key] || 0) / Number(stats.games || 1)).toFixed(1));
}

function getAwardShootingPercentage(stats, madeKey, attemptKey) {
  const attempts = Number(stats && stats[attemptKey] ? stats[attemptKey] : 0);
  if (!attempts) return 0;

  return Number(((Number(stats[madeKey] || 0) / attempts) * 100).toFixed(1));
}

function getAllPlayersForAwards() {
  const players = [];

  if (!gameState || !gameState.rosters) return players;

  Object.entries(gameState.rosters).forEach(([teamId, roster]) => {
    const team = getTeamById(Number(teamId));

    if (!Array.isArray(roster) || !team) return;

    roster.forEach(player => {
      if (!player) return;

      players.push({
        player,
        team
      });
    });
  });

  return players;
}

function isAwardEligiblePlayer(player) {
  const stats = player && player.seasonStats ? player.seasonStats : null;

  return stats && Number(stats.games || 0) >= AWARDS_PLAYER_GAMES_REQUIRED;
}

function isAwardRookie(player) {
  const yearsPro = Number(player.yearsPro || 0);
  const draftYear = Number(player.draftYear || 0);

  if (yearsPro <= 1) return true;
  if (gameState && draftYear === Number(gameState.seasonStartYear)) return true;

  return false;
}

function getTeamWinPct(team) {
  const wins = Number(team && team.wins ? team.wins : 0);
  const losses = Number(team && team.losses ? team.losses : 0);
  const total = wins + losses;

  if (!total) return 0;

  return wins / total;
}

function getPlayerAwardsProfile(player, team) {
  const stats = player.seasonStats || createEmptySeasonStats();
  const attr = player.attributes || {};

  const games = Number(stats.games || 0);
  const ppg = getAwardStatAverage(stats, "points");
  const rpg = getAwardStatAverage(stats, "rebounds");
  const apg = getAwardStatAverage(stats, "assists");
  const spg = getAwardStatAverage(stats, "steals");
  const bpg = getAwardStatAverage(stats, "blocks");
  const mpg = getAwardStatAverage(stats, "minutes");
  const tpg = getAwardStatAverage(stats, "turnovers");
  const fg = getAwardShootingPercentage(stats, "fieldGoalsMade", "fieldGoalsAttempted");
  const three = getAwardShootingPercentage(stats, "threePointersMade", "threePointersAttempted");
  const ft = getAwardShootingPercentage(stats, "freeThrowsMade", "freeThrowsAttempted");
  const winPct = getTeamWinPct(team);
  const startedRate = games ? Number(stats.gamesStarted || 0) / games : 0;

  const defenseAttributeScore =
    Number(attr.perimeterDefense || 0) +
    Number(attr.interiorDefense || 0) +
    Number(attr.helpDefenseIQ || attr.defensiveIQ || 0) +
    Number(attr.defensiveRebounding || 0) +
    Number(attr.blocks || 0) +
    Number(attr.steals || 0);

  const hustleAttributeScore =
    Number(attr.hustle || 0) +
    Number(attr.competitiveness || 0) +
    Number(attr.stamina || 0) +
    Number(attr.offensiveRebounding || 0) +
    Number(attr.defensiveRebounding || 0);

  const leadershipScore =
    Number(attr.leadership || 0) +
    Number(player.loyalty || 0) +
    Number(player.marketability || 0) +
    Number(attr.composure || 0);

  const playerValue =
    Number(player.currentAbility || 0) / 25 +
    Number(player.potentialAbility || 0) / 70;

  return {
    player,
    team,
    stats,
    games,
    ppg,
    rpg,
    apg,
    spg,
    bpg,
    mpg,
    tpg,
    fg,
    three,
    ft,
    winPct,
    startedRate,

    mvpScore:
      ppg * 3.2 +
      rpg * 1.25 +
      apg * 1.55 +
      spg * 2.6 +
      bpg * 2.4 +
      winPct * 24 +
      playerValue,

    rookieScore:
      ppg * 3.0 +
      rpg * 1.2 +
      apg * 1.4 +
      spg * 2.2 +
      bpg * 2.2 +
      playerValue,

    defenseScore:
      spg * 10 +
      bpg * 12 +
      rpg * 1.6 +
      defenseAttributeScore * 1.2 +
      winPct * 12,

    sixthManScore:
      ppg * 3.1 +
      rpg * 1.0 +
      apg * 1.25 +
      spg * 1.8 +
      bpg * 1.8 +
      (1 - startedRate) * 20,

    improvedScore:
      ppg * 2.0 +
      rpg * 0.8 +
      apg * 1.0 +
      Number(player.potentialAbility || 0) / 25 -
      Number(player.currentAbility || 0) / 35 +
      Math.max(0, 28 - Number(player.age || 28)),

    clutchScore:
      ppg * 2.8 +
      apg * 1.7 +
      Number(attr.composure || 0) * 2.2 +
      Number(attr.shotCreation || 0) * 1.4 +
      winPct * 18,

    teammateScore:
      leadershipScore * 2.1 +
      apg * 1.2 +
      winPct * 14,

    sportsmanshipScore:
      Number(attr.composure || 0) * 2.4 +
      Number(attr.leadership || 0) * 1.5 +
      Math.max(0, 6 - tpg) * 6 +
      Number(player.loyalty || 0) * 1.2,

    hustleScore:
      hustleAttributeScore * 1.9 +
      rpg * 2.2 +
      spg * 5 +
      bpg * 5 +
      mpg * 0.5
  };
}

function getAwardCandidatesForDefinition(definition) {
  let candidates = getAllPlayersForAwards()
    .filter(item => isAwardEligiblePlayer(item.player))
    .map(item => getPlayerAwardsProfile(item.player, item.team));

  if (definition.filter === "rookie") {
    candidates = candidates.filter(item => isAwardRookie(item.player));
  }

  if (definition.filter === "sixthMan") {
    candidates = candidates.filter(item => item.startedRate < 0.5);
  }

  const scoreKey = definition.scoreKey;

  candidates.sort((a, b) => Number(b[scoreKey] || 0) - Number(a[scoreKey] || 0));

  return candidates;
}

function getCoachAwardsCandidates() {
  const candidates = [];

  if (!gameState || !gameState.teams) return candidates;

  gameState.teams.forEach(team => {
    const staff = typeof getTeamStaff === "function" ? getTeamStaff(team.id) : null;
    const coach = staff && staff.headCoach ? staff.headCoach : null;

    if (!coach || coach.isVacant) return;

    const wins = Number(team.wins || 0);
    const losses = Number(team.losses || 0);
    const winPct = getTeamWinPct(team);
    const reputation = Number(coach.reputation || 70);

    candidates.push({
      name: coach.name || "Unknown Coach",
      role: "Head Coach",
      team,
      staff: coach,
      wins,
      losses,
      score: wins * 2 + winPct * 60 + reputation * 0.4,
      statLine: `${wins}-${losses} record · ${Math.round(winPct * 100)} win%`
    });
  });

  candidates.sort((a, b) => b.score - a.score);

  return candidates;
}

function getExecutiveAwardsCandidates() {
  const candidates = [];

  if (!gameState || !gameState.teams) return candidates;

  gameState.teams.forEach(team => {
    const staff = typeof getTeamStaff === "function" ? getTeamStaff(team.id) : null;

    if (!staff) return;

    const executive =
      staff.generalManager ||
      staff.president ||
      (Array.isArray(staff.staff)
        ? staff.staff.find(member =>
            member &&
            !member.isVacant &&
            (member.role === "General Manager" || member.role === "President of Basketball Operations")
          )
        : null);

    if (!executive || executive.isVacant) return;

    const wins = Number(team.wins || 0);
    const losses = Number(team.losses || 0);
    const winPct = getTeamWinPct(team);

    const frontOfficeScore =
      Number(executive.reputation || 70) +
      Number(executive.negotiation || 0) * 0.5 +
      Number(executive.capManagement || 0) * 0.6 +
      Number(executive.playerEvaluation || 0) * 0.6 +
      Number(executive.analytics || 0) * 0.35;

    candidates.push({
      name: executive.name || "Unknown Executive",
      role: executive.role || "Executive",
      team,
      staff: executive,
      wins,
      losses,
      score: wins * 2 + winPct * 55 + frontOfficeScore,
      statLine: `${wins}-${losses} record · Front office score ${Math.round(frontOfficeScore)}`
    });
  });

  candidates.sort((a, b) => b.score - a.score);

  return candidates;
}

function createPlayerAwardResult(definition) {
  const candidates = getAwardCandidatesForDefinition(definition);
  const finalists = candidates.slice(0, 3);

  return {
    id: definition.id,
    title: definition.title,
    shortTitle: definition.shortTitle,
    type: definition.type,
    finalists,
    winner: finalists[0] || null
  };
}

function createStaffAwardResult(definition) {
  const candidates = definition.type === "coach"
    ? getCoachAwardsCandidates()
    : getExecutiveAwardsCandidates();

  const finalists = candidates.slice(0, 3);

  return {
    id: definition.id,
    title: definition.title,
    shortTitle: definition.shortTitle,
    type: definition.type,
    finalists,
    winner: finalists[0] || null
  };
}

function createAllLeagueTeamsForAwards() {
  const allProfiles = getAllPlayersForAwards()
    .filter(item => isAwardEligiblePlayer(item.player))
    .map(item => getPlayerAwardsProfile(item.player, item.team));

  const byMvp = [...allProfiles].sort((a, b) => b.mvpScore - a.mvpScore);
  const byDefense = [...allProfiles].sort((a, b) => b.defenseScore - a.defenseScore);
  const byRookie = allProfiles
    .filter(item => isAwardRookie(item.player))
    .sort((a, b) => b.rookieScore - a.rookieScore);

  return {
    allLeagueFirst: byMvp.slice(0, 5),
    allLeagueSecond: byMvp.slice(5, 10),
    allLeagueThird: byMvp.slice(10, 15),
    allDefenseFirst: byDefense.slice(0, 5),
    allDefenseSecond: byDefense.slice(5, 10),
    allRookieFirst: byRookie.slice(0, 5),
    allRookieSecond: byRookie.slice(5, 10)
  };
}

function generateAwardsCeremonyResults() {
  const allLeagueTeams = createAllLeagueTeamsForAwards();

  const awardResults = FCD_AWARD_DEFINITIONS.map(definition => {
    if (definition.type === "player") {
      return createPlayerAwardResult(definition);
    }

    return createStaffAwardResult(definition);
  });

  return {
    generatedAt: new Date().toISOString(),
    seasonLabel: gameState.seasonLabel,
    allLeagueTeams,
    awards: awardResults
  };
}

function prepareAwardsCeremonyResults(force = false) {
  const ceremony = ensureAwardsCeremonyState();

  if (!ceremony.generated || !ceremony.results || force) {
    ceremony.results = generateAwardsCeremonyResults();
    ceremony.generated = true;
    ceremony.currentStepIndex = 0;
    ceremony.revealedAwards = {};
    ceremony.complete = false;
  }

  return ceremony.results;
}

function getAwardsCeremonySteps() {
  const ceremony = ensureAwardsCeremonyState();
  const results = ceremony.results || prepareAwardsCeremonyResults();

  return [
    {
      type: "teams",
      title: "All-League Honors"
    },
    ...results.awards.map(award => ({
      type: "award",
      awardId: award.id,
      title: award.title
    })),
    {
      type: "recap",
      title: "Awards Recap"
    }
  ];
}

function openAwardsCeremonyFromDashboard() {
  prepareAwardsCeremonyResults();

  openSpecialEventScreen("awards-ceremony-screen");

  displayAwardsCeremonyScreen();
}

function getPlayerAwardImageHTML(profile) {
  if (!profile || !profile.player) {
    return `<div class="award-player-placeholder">?</div>`;
  }

  if (typeof getPlayerFaceHTML === "function") {
    return getPlayerFaceHTML(profile.player, "award-player-photo");
  }

  return `<div class="award-player-placeholder">${String(profile.player.name || "?").slice(0, 2).toUpperCase()}</div>`;
}

function getStaffAwardImageHTML(candidate) {
  const imagePath =
    candidate &&
    candidate.staff &&
    (candidate.staff.imagePath || candidate.staff.image);

  if (imagePath) {
    return `
      <div class="award-player-photo">
        <img src="${imagePath}" alt="${candidate.name}" onerror="this.remove();" />
      </div>
    `;
  }

  return `<div class="award-player-placeholder">${String(candidate && candidate.name ? candidate.name : "STAFF").slice(0, 2).toUpperCase()}</div>`;
}

function renderAwardCandidateCard(candidate, award, isWinner = false) {
  if (!candidate) {
    return `
      <div class="award-finalist-card empty">
        <div class="award-player-placeholder">?</div>
        <strong>No Candidate</strong>
        <span>Not enough qualified players</span>
      </div>
    `;
  }

  const isPlayer = award.type === "player";
  const name = isPlayer ? candidate.player.name : candidate.name;
  const teamName = candidate.team ? candidate.team.name : "Free Agent";
  const imageHTML = isPlayer ? getPlayerAwardImageHTML(candidate) : getStaffAwardImageHTML(candidate);
  const winnerClass = isWinner ? " winner" : "";

  return `
    <div class="award-finalist-card${winnerClass}">
      <div class="award-card-image-wrap">
        ${imageHTML}
      </div>

      <div class="award-finalist-nameplate">
        <strong>${name}</strong>
        <span>${teamName}</span>
      </div>
    </div>
  `;
}

function renderAwardStatPanel(candidate, award) {
  if (!candidate) {
    return `
      <div class="award-winner-stats">
        <h3>No Winner</h3>
        <p>Not enough qualified candidates were available.</p>
      </div>
    `;
  }

  if (award.type !== "player") {
    return `
      <div class="award-winner-stats">
        <span>${award.shortTitle}</span>
        <h3>${candidate.name}</h3>
        <p>${candidate.role || "Staff"} · ${candidate.team ? candidate.team.name : "Team"}</p>

        <div class="award-stat-grid">
          <div><strong>${candidate.wins || 0}</strong><span>Wins</span></div>
          <div><strong>${candidate.losses || 0}</strong><span>Losses</span></div>
          <div><strong>${Math.round(candidate.score || 0)}</strong><span>Score</span></div>
        </div>

        <p class="award-winner-note">${candidate.statLine || "Strong season from the organization."}</p>
      </div>
    `;
  }

  return `
    <div class="award-winner-stats">
      <span>${award.shortTitle}</span>
      <h3>${candidate.player.name}</h3>
      <p>${candidate.team.name} · ${candidate.games} games</p>

      <div class="award-stat-grid">
        <div><strong>${candidate.ppg}</strong><span>PPG</span></div>
        <div><strong>${candidate.rpg}</strong><span>RPG</span></div>
        <div><strong>${candidate.apg}</strong><span>APG</span></div>
        <div><strong>${candidate.spg}</strong><span>SPG</span></div>
        <div><strong>${candidate.bpg}</strong><span>BPG</span></div>
        <div><strong>${candidate.fg}%</strong><span>FG%</span></div>
      </div>

      <p class="award-winner-note">
        Qualified under the ${AWARDS_PLAYER_GAMES_REQUIRED}-game rule.
      </p>
    </div>
  `;
}

function getCurrentAwardsStep() {
  const ceremony = ensureAwardsCeremonyState();
  const steps = getAwardsCeremonySteps();

  return steps[ceremony.currentStepIndex] || steps[0];
}

function getAwardResultById(awardId) {
  const results = prepareAwardsCeremonyResults();
  return results.awards.find(award => award.id === awardId) || null;
}

function renderAllLeagueTeamList(title, list) {
  return `
    <div class="all-awards-team-card">
      <h3>${title}</h3>
      <div class="all-awards-team-list">
        ${(list || []).map((candidate, index) => `
          <div class="all-awards-team-row">
            <span>${index + 1}</span>
            <strong>${candidate.player.name}</strong>
            <small>${candidate.team.name} · ${candidate.ppg} PPG · ${candidate.rpg} RPG · ${candidate.apg} APG</small>
          </div>
        `).join("") || `<p>No qualified players yet.</p>`}
      </div>
    </div>
  `;
}

function renderAwardsCeremonyTeamsStep(results) {
  const teams = results.allLeagueTeams;

  return `
    <div class="awards-ceremony-stage">
      <div class="awards-show-header">
        <span>Full Court Director Honors</span>
        <h1>All-League Teams</h1>
        <p>Positionless selections. Players need ${AWARDS_PLAYER_GAMES_REQUIRED}+ games to qualify.</p>
      </div>

      <div class="all-awards-teams-grid">
        ${renderAllLeagueTeamList("All-League First Team", teams.allLeagueFirst)}
        ${renderAllLeagueTeamList("All-League Second Team", teams.allLeagueSecond)}
        ${renderAllLeagueTeamList("All-League Third Team", teams.allLeagueThird)}
        ${renderAllLeagueTeamList("All-Defense First Team", teams.allDefenseFirst)}
        ${renderAllLeagueTeamList("All-Defense Second Team", teams.allDefenseSecond)}
        ${renderAllLeagueTeamList("All-Rookie First Team", teams.allRookieFirst)}
        ${renderAllLeagueTeamList("All-Rookie Second Team", teams.allRookieSecond)}
      </div>

      <div class="awards-ceremony-actions">
        <button type="button" onclick="nextAwardsCeremonyStep()">Begin Awards</button>
        <button type="button" class="secondary" onclick="skipAwardsCeremony()">Skip Ceremony</button>
      </div>
    </div>
  `;
}

function renderAwardsCeremonyAwardStep(award) {
  const ceremony = ensureAwardsCeremonyState();
  const revealed = ceremony.revealedAwards && ceremony.revealedAwards[award.id];

  if (!revealed) {
    return `
      <div class="awards-ceremony-stage">
        <div class="awards-show-header">
          <span>Finalists</span>
          <h1>${award.title}</h1>
          <p>${award.type === "player" ? `${AWARDS_PLAYER_GAMES_REQUIRED}+ games required` : "Staff awards do not use the games played rule."}</p>
        </div>

        <div class="award-finalists-layout">
          ${(award.finalists || []).map(candidate => renderAwardCandidateCard(candidate, award)).join("")}
        </div>

        <div class="awards-ceremony-actions">
          <button type="button" onclick="revealCurrentAwardWinner()">Reveal Winner</button>
          <button type="button" class="secondary" onclick="skipAwardsCeremony()">Skip Ceremony</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="awards-ceremony-stage winner-revealed">
      <div class="awards-show-header">
        <span>Winner</span>
        <h1>${award.title}</h1>
      </div>

      <div class="award-winner-layout">
        <div class="award-winner-left">
          ${renderAwardCandidateCard(award.winner, award, true)}
        </div>

        <div class="award-winner-right">
          ${renderAwardStatPanel(award.winner, award)}
        </div>
      </div>

      <div class="awards-ceremony-actions">
        <button type="button" onclick="nextAwardsCeremonyStep()">Next Award</button>
        <button type="button" class="secondary" onclick="skipAwardsCeremony()">Skip Ceremony</button>
      </div>
    </div>
  `;
}

function renderAwardsCeremonyRecap(results) {
  return `
    <div class="awards-ceremony-stage">
      <div class="awards-show-header">
        <span>Season Recap</span>
        <h1>Award Winners</h1>
        <p>${results.seasonLabel || "Current Season"}</p>
      </div>

      <div class="awards-recap-grid">
        ${results.awards.map(award => {
          const winner = award.winner;
          let winnerName = "No Winner";
          let teamName = "";

          if (winner) {
            if (award.type === "player") {
              winnerName = winner.player.name;
              teamName = winner.team.name;
            } else {
              winnerName = winner.name;
              teamName = winner.team ? winner.team.name : "";
            }
          }

          return `
            <div class="award-recap-card">
              <span>${award.shortTitle}</span>
              <strong>${winnerName}</strong>
              <small>${teamName}</small>
            </div>
          `;
        }).join("")}
      </div>

      <div class="awards-ceremony-actions">
        <button type="button" onclick="completeAwardsCeremony()">Finish Ceremony</button>
      </div>
    </div>
  `;
}

function displayAwardsCeremonyScreen() {
  const root = document.getElementById("awards-ceremony-root");
  if (!root || !gameState || !gameState.started) return;

  const ceremony = ensureAwardsCeremonyState();
  const results = prepareAwardsCeremonyResults();
  const steps = getAwardsCeremonySteps();
  const step = getCurrentAwardsStep();

  const progressText = `${Math.min(ceremony.currentStepIndex + 1, steps.length)} / ${steps.length}`;

  let content = "";

  if (step.type === "teams") {
    content = renderAwardsCeremonyTeamsStep(results);
  } else if (step.type === "award") {
    const award = getAwardResultById(step.awardId);
    content = renderAwardsCeremonyAwardStep(award);
  } else {
    content = renderAwardsCeremonyRecap(results);
  }

  root.innerHTML = `
    <div class="awards-ceremony-page">
      <div class="awards-progress-bar">
        <span>Awards Ceremony</span>
        <strong>${progressText}</strong>
      </div>

      ${content}
    </div>
  `;
}

function revealCurrentAwardWinner() {
  const ceremony = ensureAwardsCeremonyState();
  const step = getCurrentAwardsStep();

  if (step.type !== "award") return;

  ceremony.revealedAwards[step.awardId] = true;

  displayAwardsCeremonyScreen();
}

function nextAwardsCeremonyStep() {
  const ceremony = ensureAwardsCeremonyState();
  const steps = getAwardsCeremonySteps();

  ceremony.currentStepIndex = Math.min(ceremony.currentStepIndex + 1, steps.length - 1);

  displayAwardsCeremonyScreen();
}

function skipAwardsCeremony() {
  const ceremony = ensureAwardsCeremonyState();
  const steps = getAwardsCeremonySteps();

  ceremony.currentStepIndex = steps.length - 1;

  results = prepareAwardsCeremonyResults();

  results.awards.forEach(award => {
    ceremony.revealedAwards[award.id] = true;
  });

  displayAwardsCeremonyScreen();
}

function completeAwardsCeremony() {
  const ceremony = ensureAwardsCeremonyState();

  ceremony.complete = true;

  addInboxMessage(
    "Awards Ceremony Complete",
    "The league awards have been announced. Award winners are now saved to the season record.",
    "league"
  );

  showMainSection("dashboard");

refreshAll();
}

function displayAwardsRacePage() {
  // Award Race was removed from League.
  // News > Award Watch is the only award race screen now.
  return;
}

function openSpecialEventScreen(screenId) {
  const sidebarButtons = document.querySelectorAll(".sidebar button");

  for (let button of sidebarButtons) {
    button.classList.remove("active");
  }

  const secondaryNav = document.getElementById("secondary-nav");
  if (secondaryNav) {
    secondaryNav.innerHTML = "";
  }

  currentSecondaryScreen = screenId;
  showSecondaryScreen(screenId);
}

function blockIfAwardsCeremonyRequired() {
  if (!gameState || !gameState.started) return false;

  if (
    typeof isAwardsCeremonyAvailable !== "function" ||
    typeof isAwardsCeremonyComplete !== "function"
  ) {
    return false;
  }

  if (!isAwardsCeremonyAvailable()) return false;
  if (isAwardsCeremonyComplete()) return false;

  showModal(
    "Awards Ceremony Required",
    "The regular season awards ceremony is ready. You must complete or skip the ceremony before advancing past April 15."
  );

  return true;
}

/* ======================================================
   NEWS AWARD WATCH / STAT-BASED AWARD RACES
   Task 2
====================================================== */

var FCD_AWARD_WATCH_PLAYER_MIN_GAMES = 65;

var FCD_AWARD_WATCH_DEFINITIONS = [
  {
    id: "mvp",
    title: "Most Valuable Player",
    shortTitle: "MVP",
    type: "player",
    color: "#111827"
  },
  {
    id: "dpoy",
    title: "Defensive Player of the Year",
    shortTitle: "DPOY",
    type: "player",
    color: "#123b86"
  },
  {
    id: "roy",
    title: "Rookie of the Year",
    shortTitle: "ROTY",
    type: "player",
    color: "#0f766e"
  },
  {
    id: "sixth",
    title: "Sixth Man of the Year",
    shortTitle: "Sixth Man",
    type: "player",
    color: "#7f1d1d"
  },
  {
    id: "mip",
    title: "Most Improved Player",
    shortTitle: "MIP",
    type: "player",
    color: "#581c87"
  },
  {
    id: "clutch",
    title: "Clutch Player of the Year",
    shortTitle: "Clutch",
    type: "player",
    color: "#92400e"
  },
  {
    id: "coy",
    title: "Coach of the Year",
    shortTitle: "COY",
    type: "coach",
    color: "#0f172a"
  },
  {
    id: "eoy",
    title: "Executive of the Year",
    shortTitle: "EOY",
    type: "executive",
    color: "#082f49"
  }
];

var FCD_AWARD_WATCH_TEAM_LOGO_FALLBACKS = {};

function escapeAwardWatchHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensureAwardWatchState() {
  if (!gameState) return null;

  if (
    !gameState.awardWatch ||
    gameState.awardWatch.seasonLabel !== gameState.seasonLabel
  ) {
    gameState.awardWatch = {
      seasonLabel: gameState.seasonLabel,
      lastUpdated: null,
      previousRankings: null,
      currentRankings: null,
      finalResults: null
    };
  }

  return gameState.awardWatch;
}

function isAwardWatchRegularSeasonStarted() {
  if (!gameState || !gameState.currentDate) return false;

  const current = new Date(gameState.currentDate);
  const openingNight = new Date(gameState.seasonStartYear, 9, 20);

  current.setHours(0, 0, 0, 0);
  openingNight.setHours(0, 0, 0, 0);

  return current >= openingNight;
}

function isAwardWatchRegularSeasonWindow() {
  if (!gameState || !gameState.currentDate) return false;

  const current = new Date(gameState.currentDate);
  const start = new Date(gameState.seasonStartYear, 9, 20);
  const end = new Date(gameState.seasonStartYear + 1, 3, 15);

  current.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return current >= start && current <= end;
}

function getAwardWatchDateKey(dateValue) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function shouldUpdateAwardWatchToday() {
  const state = ensureAwardWatchState();

  if (!state || !isAwardWatchRegularSeasonWindow()) return false;

  const currentDate = new Date(gameState.currentDate);
  const currentKey = getAwardWatchDateKey(currentDate);
  const lastKey = state.lastUpdated
    ? getAwardWatchDateKey(new Date(state.lastUpdated))
    : null;

  if (!state.currentRankings) return true;

  return currentDate.getDay() === 0 && currentKey !== lastKey;
}

function processAwardWatchDaily() {
  if (!gameState || !gameState.started) return;

  ensureAwardWatchState();

  if (shouldUpdateAwardWatchToday()) {
    updateAwardWatchSnapshot("weekly");
  }
}

function updateAwardWatchSnapshot(reason = "weekly") {
  const state = ensureAwardWatchState();

  if (!state) return null;

  const previous = state.currentRankings || null;
  const results = buildAwardWatchResults(reason === "final");

  attachAwardWatchMovement(results, previous);

  state.previousRankings = previous;
  state.currentRankings = results;
  state.lastUpdated = new Date(gameState.currentDate).toISOString();

  return results;
}

function getAwardWatchResultsForDisplay() {
  const state = ensureAwardWatchState();

  if (!state) return null;

  // Do not show award races before the regular season starts.
  if (!isAwardWatchRegularSeasonStarted()) {
    return null;
  }

  // Only show final results after the ceremony is actually complete.
  // This prevents the ceremony from freezing Award Watch early.
  if (
    state.finalResults &&
    gameState.awardsCeremony &&
    gameState.awardsCeremony.complete === true
  ) {
    return state.finalResults;
  }

  if (!state.currentRankings) {
    return updateAwardWatchSnapshot("weekly");
  }

  return state.currentRankings;
}

function getFinalAwardWatchResultsForCeremony() {
  const state = ensureAwardWatchState();

  if (!state.finalResults) {
    const previous = state.currentRankings || null;
    const finalResults = buildAwardWatchResults(true);

    attachAwardWatchMovement(finalResults, previous);

    state.previousRankings = previous;
    state.currentRankings = finalResults;
    state.finalResults = finalResults;
    state.lastUpdated = new Date(gameState.currentDate).toISOString();
  }

  return state.finalResults;
}

function getAwardWatchTeamLogo(team) {
  if (!team) return "";

  return (
    team.logo ||
    team.logoPath ||
    team.image ||
    team.imagePath ||
    team.teamLogo ||
    FCD_AWARD_WATCH_TEAM_LOGO_FALLBACKS[Number(team.id)] ||
    ""
  );
}

function getAwardWatchPlayerImage(player) {
  const imagePath = typeof getPlayerPortraitPath === "function"
    ? getPlayerPortraitPath(player)
    : (player?.portrait || player?.image || player?.imagePath || player?.photo || "");

  if (imagePath && typeof normalizePlayerPortraitPath === "function") {
    return normalizePlayerPortraitPath(imagePath);
  }

  return imagePath || "images/players/default-silhouette.png";
}

function getAwardWatchTeamWinPct(team) {
  const wins = Number(team?.wins || 0);
  const losses = Number(team?.losses || 0);
  const games = wins + losses;

  if (!games) return 0;

  return wins / games;
}

function getAwardWatchTeamGames(team) {
  return Number(team?.wins || 0) + Number(team?.losses || 0);
}

function getAwardWatchTeamDefensiveScore(team) {
  if (!team) return 0;

  const teamStats = gameState.teamStats?.[team.id] || {};
  const games =
    Number(teamStats.games || 0) ||
    getAwardWatchTeamGames(team) ||
    1;

  const oppPpg = games
    ? Number(teamStats.pointsAgainst || 0) / games
    : 115;

  const teamSteals = games ? Number(teamStats.steals || 0) / games : 7;
  const teamBlocks = games ? Number(teamStats.blocks || 0) / games : 5;
  const teamRebounds = games ? Number(teamStats.rebounds || 0) / games : 42;

  const oppPpgBonus = oppPpg > 0
    ? clamp(122 - oppPpg, 0, 35) * 4
    : getAwardWatchTeamWinPct(team) * 70;

  return (
    oppPpgBonus +
    teamSteals * 3 +
    teamBlocks * 4 +
    teamRebounds * 0.8 +
    getAwardWatchTeamWinPct(team) * 70
  );
}

function getAwardWatchStatAverage(stats, key, fallback = 0) {
  const games = Number(stats?.games || 0);

  if (!games) return fallback;

  return Number((Number(stats[key] || 0) / games).toFixed(1));
}

function getAwardWatchShootingPercentage(stats, madeKey, attemptKey) {
  const attempts = Number(stats?.[attemptKey] || 0);

  if (!attempts) return 0;

  return Number(((Number(stats[madeKey] || 0) / attempts) * 100).toFixed(1));
}

function getAwardWatchAbility(player) {
  return (
    Number(player?.currentAbility) ||
    Number(player?.overall) ||
    Number(player?.ca) ||
    Number(player?.CA) ||
    (typeof calculateAbility === "function" ? calculateAbility(player?.attributes || {}) : 0)
  );
}

function getAwardWatchStableNoise(key, max = 1) {
  const text = String(key || "award-watch");
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 100000;
  }

  return (hash % 1000) / 1000 * max;
}

function isAwardWatchRookie(player) {
  const yearsPro = Number(player?.yearsPro || 0);
  const draftYear = Number(player?.draftYear || 0);

  if (yearsPro === 0) return true;

  return draftYear >= Number(gameState?.seasonStartYear || 0);
}

function getAwardWatchTeamDepthRank(player, team) {
  if (!player || !team) return 99;

  const roster = getRosterByTeamId(team.id)
    .slice()
    .sort((a, b) => getAwardWatchAbility(b) - getAwardWatchAbility(a));

  const index = roster.findIndex(item =>
    String(item.id || item.playerId) === String(player.id || player.playerId)
  );

  return index >= 0 ? index + 1 : 99;
}

function getAllAwardWatchPlayerProfiles() {
  const profiles = [];

  if (!gameState || !gameState.rosters) return profiles;

  Object.entries(gameState.rosters).forEach(([teamId, roster]) => {
    const team = getTeamById(Number(teamId));

    if (!team || !Array.isArray(roster)) return;

    roster.forEach(player => {
      if (!player) return;

      const stats = player.seasonStats || createEmptySeasonStats();
      const attr = player.attributes || {};
      const games = Number(stats.games || 0);
      const ability = getAwardWatchAbility(player);
      const winPct = getAwardWatchTeamWinPct(team);
      const wins = Number(team.wins || 0);
      const losses = Number(team.losses || 0);
      const teamGames = wins + losses;
      const teamDepthRank = getAwardWatchTeamDepthRank(player, team);

      // Award Watch should use real season stats only.
      // No fake 19.6 PPG / 8.5 RPG on day one.
      const ppg = getAwardWatchStatAverage(stats, "points", 0);
      const rpg = getAwardWatchStatAverage(stats, "rebounds", 0);
      const apg = getAwardWatchStatAverage(stats, "assists", 0);
      const spg = getAwardWatchStatAverage(stats, "steals", 0);
      const bpg = getAwardWatchStatAverage(stats, "blocks", 0);
      const mpg = getAwardWatchStatAverage(stats, "minutes", 0);
      const tpg = getAwardWatchStatAverage(stats, "turnovers", 0);

      const sampleMultiplier = games > 0
        ? clamp(games / 20, 0.35, 1)
        : 0;

      const gamesStarted = Number(stats.gamesStarted || 0);
      const startedRate = games ? gamesStarted / games : teamDepthRank <= 5 ? 1 : 0;
      const fg = getAwardWatchShootingPercentage(stats, "fieldGoalsMade", "fieldGoalsAttempted");
      const three = getAwardWatchShootingPercentage(stats, "threePointersMade", "threePointersAttempted");
      const ft = getAwardWatchShootingPercentage(stats, "freeThrowsMade", "freeThrowsAttempted");

      const defenseAttributeScore =
        Number(attr.perimeterDefense || 0) * 2.1 +
        Number(attr.interiorDefense || 0) * 2.1 +
        Number(attr.helpDefense || 0) * 1.7 +
        Number(attr.defensiveIQ || 0) * 2.0 +
        Number(attr.defensiveRebounding || 0) * 1.2 +
        Number(attr.blocks || 0) * 1.8 +
        Number(attr.steals || 0) * 1.8;

      const composureScore =
        Number(attr.composure || 0) * 2.4 +
        Number(attr.shotCreation || 0) * 1.7 +
        Number(attr.basketballIQ || 0) * 1.4 +
        Number(attr.competitiveness || 0) * 1.1;

      const hustleScore =
        mpg * 2.2 +
        rpg * 2.3 +
        spg * 7 +
        bpg * 7 +
        Number(attr.stamina || 0) * 1.8 +
        Number(attr.competitiveness || 0) * 1.3;

      profiles.push({
        player,
        team,
        stats,
        games,
        gamesStarted,
        teamGames,
        teamDepthRank,
        ability,
        winPct,
        wins,
        losses,
        ppg: Number(ppg.toFixed ? ppg.toFixed(1) : Number(ppg).toFixed(1)),
        rpg: Number(rpg.toFixed ? rpg.toFixed(1) : Number(rpg).toFixed(1)),
        apg: Number(apg.toFixed ? apg.toFixed(1) : Number(apg).toFixed(1)),
        spg: Number(spg.toFixed ? spg.toFixed(1) : Number(spg).toFixed(1)),
        bpg: Number(bpg.toFixed ? bpg.toFixed(1) : Number(bpg).toFixed(1)),
        mpg: Number(mpg.toFixed ? mpg.toFixed(1) : Number(mpg).toFixed(1)),
        tpg,
        fg,
        three,
        ft,
        startedRate,
       isProjection: false,
        isBuildingSample: games > 0 && games < 10,

        mvpScore:
          games <= 0 ? 0 :
          winPct * 430 +
          wins * 4.4 +
          ppg * 6.2 +
          rpg * 1.6 +
          apg * 2.4 +
          spg * 4.5 +
          bpg * 4.1 +
          ability * 0.08 +
          mpg * 0.9 +
          games * 1.6 +
          getAwardWatchStableNoise(`${player.name}-mvp`, 6),

        dpoyScore:
          games <= 0 ? 0 :
          getAwardWatchTeamDefensiveScore(team) +
          defenseAttributeScore * 1.4 +
          bpg * 18 +
          spg * 17 +
          rpg * 4.2 +
          winPct * 85 +
          games * 1.2 +
          getAwardWatchStableNoise(`${player.name}-dpoy`, 5),

        royScore:
          games <= 0 ? 0 :
          winPct * 275 +
          wins * 2.6 +
          ppg * 5.8 +
          rpg * 1.7 +
          apg * 2.1 +
          spg * 4.4 +
          bpg * 4.4 +
          ability * 0.08 +
          games * 1.2 +
          getAwardWatchStableNoise(`${player.name}-roy`, 8),

        sixthScore:
          games <= 0 ? 0 :
          ppg * 5.2 +
          rpg * 1.7 +
          apg * 2 +
          spg * 4.5 +
          bpg * 4.1 +
          mpg * 1.2 +
          (1 - startedRate) * 80 +
          winPct * 105 +
          games * 1.1 +
          getAwardWatchStableNoise(`${player.name}-sixth`, 7),

        mipScore:
          games <= 0 ? 0 :
          ppg * 3.8 +
          rpg * 1.6 +
          apg * 2 +
          spg * 3.4 +
          bpg * 3.4 +
          mpg * 1.6 +
          Math.max(0, Number(player.potentialAbility || ability) - ability) * 0.16 +
          Math.max(0, 28 - Number(player.age || 28)) * 4 -
          Math.max(0, ability - 680) * 0.25 +
          games * 1.2 +
          getAwardWatchStableNoise(`${player.name}-mip`, 10),

        clutchScore:
          games <= 0 ? 0 :
          winPct * 285 +
          wins * 2.8 +
          ppg * 4.9 +
          apg * 2.5 +
          composureScore * 2 +
          games * 1.1 +
          getAwardWatchStableNoise(`${player.name}-clutch`, 8),

        hustleScore:
          games <= 0 ? 0 : hustleScore * sampleMultiplier
      });
    });
  });

  return profiles;
}

function getAwardWatchCandidateId(candidate, award) {
  if (!candidate) return "";

  if (award && award.type === "player") {
    return `player_${candidate.player?.id || candidate.player?.playerId || candidate.player?.name}`;
  }

  return `staff_${candidate.staff?.staffId || candidate.staff?.id || candidate.name}_${candidate.team?.id || ""}_${candidate.role || ""}`;
}

function getAwardWatchOdds(rank, candidate, finalists) {
  const currentScore = Number(candidate?.score || 0);
  const firstScore = Number(finalists?.[0]?.score || currentScore || 1);
  const secondScore = Number(finalists?.[1]?.score || 0);

  if (rank === 1) {
    const lead = firstScore > 0 ? (firstScore - secondScore) / firstScore : 0;

    if (lead >= 0.18) return "-250";
    if (lead >= 0.1) return "-145";
    return "+110";
  }

  if (rank === 2) {
    const gap = firstScore > 0 ? (firstScore - currentScore) / firstScore : 0;

    if (gap <= 0.05) return "+175";
    if (gap <= 0.12) return "+325";
    return "+475";
  }

  const gap = firstScore > 0 ? (firstScore - currentScore) / firstScore : 0;

  if (gap <= 0.12) return "+500";
  if (gap <= 0.22) return "+750";
  return "+1100";
}

function attachAwardWatchMovement(results, previousResults) {
  if (!results || !Array.isArray(results.awards)) return results;

  for (let award of results.awards) {
    const previousAward = previousResults?.awards?.find(item => item.id === award.id);
    const previousMap = {};

    if (previousAward && Array.isArray(previousAward.finalists)) {
      previousAward.finalists.forEach((candidate, index) => {
        previousMap[getAwardWatchCandidateId(candidate, award)] = index + 1;
      });
    }

    award.finalists.forEach((candidate, index) => {
      const id = getAwardWatchCandidateId(candidate, award);
      const currentRank = index + 1;
      const previousRank = previousMap[id];

      if (!previousRank) {
        candidate.movement = "▲";
      } else if (previousRank > currentRank) {
        candidate.movement = "▲";
      } else if (previousRank < currentRank) {
        candidate.movement = "▼";
      } else {
        candidate.movement = "◆";
      }

      candidate.rank = currentRank;
      candidate.odds = getAwardWatchOdds(currentRank, candidate, award.finalists);
    });
  }

  return results;
}

function buildPlayerAwardWatchResult(definition) {
  let candidates = getAllAwardWatchPlayerProfiles();

  if (definition.id === "roy") {
    candidates = candidates.filter(item => isAwardWatchRookie(item.player));
  }

  if (definition.id === "mip") {
    candidates = candidates.filter(item => !isAwardWatchRookie(item.player));
  }

  if (definition.id === "sixth") {
    candidates = candidates.filter(item => {
      if (item.games > 0) {
        return item.startedRate < 0.5 && item.gamesStarted <= 20;
      }

      return item.teamDepthRank > 5;
    });
  }

  const scoreKey = `${definition.id}Score`;

  candidates.forEach(candidate => {
  candidate.score = Number(candidate[scoreKey] || 0);
  candidate.statLine = getAwardWatchPlayerStatLine(candidate, definition.id);
});

    applyAwardWatchWeeklyMovementDrama(candidates, definition.id);

    const playedCandidates = candidates.filter(candidate =>
      Number(candidate.games || 0) > 0
    );

    const qualified = playedCandidates.filter(candidate =>
      Number(candidate.games || 0) >= FCD_AWARD_WATCH_PLAYER_MIN_GAMES
    );

    let pool = qualified.length >= 3
      ? qualified
      : playedCandidates;

    // If nobody has played yet, do not show fake leaders.
    if (pool.length === 0) {
      return {
        id: definition.id,
        title: definition.title,
        shortTitle: definition.shortTitle,
        type: definition.type,
        color: definition.color,
        finalists: [],
        winner: null
      };
    }

    pool.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

    const finalists = pool.slice(0, 3);

  return {
    id: definition.id,
    title: definition.title,
    shortTitle: definition.shortTitle,
    type: definition.type,
    color: definition.color,
    finalists,
    winner: finalists[0] || null
  };
}

function getAwardWatchPlayerStatLine(candidate, awardId) {
  if (!candidate) return "No stat line available.";

  if (awardId === "mvp") {
    return `${candidate.ppg.toFixed(1)} PPG · ${candidate.rpg.toFixed(1)} RPG · ${candidate.apg.toFixed(1)} APG · ${candidate.wins}-${candidate.losses}`;
  }

  if (awardId === "dpoy") {
    return `${candidate.rpg.toFixed(1)} RPG · ${candidate.spg.toFixed(1)} SPG · ${candidate.bpg.toFixed(1)} BPG`;
  }

  if (awardId === "roy") {
    return `${candidate.ppg.toFixed(1)} PPG · ${candidate.rpg.toFixed(1)} RPG · ${candidate.apg.toFixed(1)} APG`;
  }

  if (awardId === "sixth") {
    return `${candidate.ppg.toFixed(1)} PPG · ${candidate.gamesStarted} starts · ${candidate.mpg.toFixed(1)} MPG`;
  }

  if (awardId === "mip") {
    return `${candidate.ppg.toFixed(1)} PPG · ${candidate.mpg.toFixed(1)} MPG · Age ${candidate.player.age || "--"}`;
  }

  if (awardId === "clutch") {
    return `${candidate.ppg.toFixed(1)} PPG · ${candidate.apg.toFixed(1)} APG · ${candidate.wins}-${candidate.losses}`;
  }

  return `${candidate.ppg.toFixed(1)} PPG · ${candidate.games} games`;
}

function getAwardWatchCoachCandidates() {
  const candidates = [];

  if (!gameState || !Array.isArray(gameState.teams)) return candidates;

  for (let team of gameState.teams) {
    const staff = typeof getTeamStaff === "function" ? getTeamStaff(team.id) : null;
    const coach = staff?.headCoach || null;

    if (!coach || coach.isVacant || !coach.name || coach.name === "Vacant") continue;

    const wins = Number(team.wins || 0);
    const losses = Number(team.losses || 0);
    const winPct = getAwardWatchTeamWinPct(team);
    const reputation = Number(coach.reputation || 70);

    if (wins + losses <= 0) continue;

    candidates.push({
      name: coach.name,
      role: "Head Coach",
      team,
      staff: coach,
      wins,
      losses,
      score:
        wins * 5 +
        winPct * 250 +
        reputation * 0.55 +
        getAwardWatchStableNoise(`${coach.name}-coy`, 8),
      statLine: `${wins}-${losses} record · ${Math.round(winPct * 100)} win%`
    });
  }

  applyAwardWatchWeeklyMovementDrama(candidates, "coy");

candidates.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

  return candidates.slice(0, 3);
}

function getAwardWatchExecutiveCandidates() {
  const candidates = [];

  if (!gameState || !Array.isArray(gameState.teams)) return candidates;

  for (let team of gameState.teams) {
    const staff = typeof getTeamStaff === "function" ? getTeamStaff(team.id) : null;

    if (!staff) continue;

    const gm =
      staff.generalManager ||
      (Array.isArray(staff.staff)
        ? staff.staff.find(member =>
            member &&
            !member.isVacant &&
            String(member.role || "").toLowerCase().includes("general manager")
          )
        : null);

    if (!gm || gm.isVacant || !gm.name || gm.name === "Vacant") continue;

    const wins = Number(team.wins || 0);
    const losses = Number(team.losses || 0);
    const winPct = getAwardWatchTeamWinPct(team);

    if (wins + losses <= 0) continue;

    const frontOfficeScore =
      Number(gm.reputation || 70) +
      Number(gm.negotiation || 0) * 0.55 +
      Number(gm.capManagement || 0) * 0.65 +
      Number(gm.playerEvaluation || 0) * 0.65 +
      Number(gm.analytics || 0) * 0.45;

    candidates.push({
      name: gm.name,
      role: gm.role || "General Manager",
      team,
      staff: gm,
      wins,
      losses,
      score:
        wins * 5 +
        winPct * 240 +
        frontOfficeScore +
        getAwardWatchStableNoise(`${gm.name}-eoy`, 8),
      statLine: `${wins}-${losses} record · GM score ${Math.round(frontOfficeScore)}`
    });
  }

  applyAwardWatchWeeklyMovementDrama(candidates, "eoy");

candidates.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

  return candidates.slice(0, 3);
}

function buildStaffAwardWatchResult(definition) {
  const finalists = definition.type === "coach"
    ? getAwardWatchCoachCandidates()
    : getAwardWatchExecutiveCandidates();

  return {
    id: definition.id,
    title: definition.title,
    shortTitle: definition.shortTitle,
    type: definition.type,
    color: definition.color,
    finalists,
    winner: finalists[0] || null
  };
}

function buildAwardWatchResults(final = false) {
  const awards = FCD_AWARD_WATCH_DEFINITIONS.map(definition => {
    if (definition.type === "player") {
      return buildPlayerAwardWatchResult(definition);
    }

    return buildStaffAwardWatchResult(definition);
  });

  return {
    generatedAt: new Date().toISOString(),
    lastUpdated: new Date(gameState.currentDate).toISOString(),
    seasonLabel: gameState.seasonLabel,
    final,
    awards
  };
}

function generateAwardsCeremonyResults() {
  const finalAwardWatch = getFinalAwardWatchResultsForCeremony();

  return {
    generatedAt: new Date().toISOString(),
    seasonLabel: gameState.seasonLabel,
    allLeagueTeams: typeof createAllLeagueTeamsForAwards === "function"
      ? createAllLeagueTeamsForAwards()
      : null,
    awards: finalAwardWatch.awards
  };
}

function prepareAwardsCeremonyResults(force = false) {
  const ceremony = ensureAwardsCeremonyState();

  if (!ceremony.generated || !ceremony.results || force) {
    ceremony.results = generateAwardsCeremonyResults();
    ceremony.generated = true;
    ceremony.currentStepIndex = 0;
    ceremony.revealedAwards = {};
    ceremony.complete = false;
  }

  return ceremony.results;
}

function renderAwardStatPanel(candidate, award) {
  if (!candidate) {
    return `
      <div class="award-winner-stats">
        <h3>No Winner</h3>
        <p>Not enough qualified candidates were available.</p>
      </div>
    `;
  }

  if (award.type !== "player") {
    return `
      <div class="award-winner-stats">
        <span>${award.shortTitle}</span>
        <h3>${escapeAwardWatchHtml(candidate.name)}</h3>
        <p>${escapeAwardWatchHtml(candidate.role || "Staff")} · ${escapeAwardWatchHtml(candidate.team ? candidate.team.name : "Team")}</p>

        <div class="award-stat-grid">
          <div><strong>${candidate.wins || 0}</strong><span>Wins</span></div>
          <div><strong>${candidate.losses || 0}</strong><span>Losses</span></div>
          <div><strong>${Math.round(candidate.score || 0)}</strong><span>Score</span></div>
        </div>

        <p class="award-winner-note">${escapeAwardWatchHtml(candidate.statLine || "Strong season from the organization.")}</p>
      </div>
    `;
  }

  return `
    <div class="award-winner-stats">
      <span>${award.shortTitle}</span>
      <h3>${escapeAwardWatchHtml(candidate.player.name)}</h3>
      <p>${escapeAwardWatchHtml(candidate.team.name)} · ${candidate.games} games</p>

      <div class="award-stat-grid">
        <div><strong>${candidate.ppg.toFixed(1)}</strong><span>PPG</span></div>
        <div><strong>${candidate.rpg.toFixed(1)}</strong><span>RPG</span></div>
        <div><strong>${candidate.apg.toFixed(1)}</strong><span>APG</span></div>
        <div><strong>${candidate.spg.toFixed(1)}</strong><span>SPG</span></div>
        <div><strong>${candidate.bpg.toFixed(1)}</strong><span>BPG</span></div>
        <div><strong>${candidate.games}</strong><span>Games</span></div>
      </div>

      <p class="award-winner-note">
        Final ranking from News Award Watch. Player awards use a ${FCD_AWARD_WATCH_PLAYER_MIN_GAMES}-game qualification rule when enough players qualify.
      </p>
    </div>
  `;
}

/* ======================================================
   AWARD WATCH WEEKLY MOVEMENT FIX
====================================================== */

function getAwardWatchWeekNumber() {
  if (!gameState || !gameState.currentDate) return 0;

  const start = new Date(gameState.seasonStartYear, 9, 20);
  const current = new Date(gameState.currentDate);

  start.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const diffDays = Math.max(0, Math.floor((current - start) / (1000 * 60 * 60 * 24)));

  return Math.floor(diffDays / 7);
}

function getAwardWatchWeeklyDrama(key, amount = 20) {
  const week = getAwardWatchWeekNumber();
  const text = `${key}_${week}_${gameState.seasonLabel}`;
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33 + text.charCodeAt(i)) % 1000003;
  }

  const normalized = (hash % 2001) / 1000 - 1;

  return normalized * amount;
}

function applyAwardWatchWeeklyMovementDrama(candidates, awardId) {
  if (!Array.isArray(candidates)) return candidates;

  for (let candidate of candidates) {
    const playerName = candidate.player ? candidate.player.name : candidate.name;
    const playerId = candidate.player
      ? candidate.player.id || candidate.player.playerId || playerName
      : candidate.staff?.staffId || candidate.name;

    const games = Number(candidate.games || 0);

    let dramaAmount = 0;

    if (awardId === "mvp") dramaAmount = games < 20 ? 38 : 22;
    else if (awardId === "dpoy") dramaAmount = games < 20 ? 34 : 20;
    else if (awardId === "roy") dramaAmount = games < 20 ? 32 : 18;
    else if (awardId === "sixth") dramaAmount = games < 20 ? 30 : 17;
    else if (awardId === "mip") dramaAmount = games < 20 ? 36 : 24;
    else if (awardId === "clutch") dramaAmount = games < 20 ? 35 : 22;
    else if (awardId === "coy") dramaAmount = 20;
    else if (awardId === "eoy") dramaAmount = 20;
    else dramaAmount = 14;

    candidate.score = Number(candidate.score || 0) + getAwardWatchWeeklyDrama(`${awardId}_${playerId}_${playerName}`, dramaAmount);
  }

  return candidates;
}

function forceAwardWatchSundayRefreshIfNeeded() {
  if (!gameState || !gameState.started || !gameState.currentDate) return;

  ensureAwardWatchState();

  const currentDate = new Date(gameState.currentDate);
  const currentKey = getAwardWatchDateKey(currentDate);
  const lastKey = gameState.awardWatch.lastUpdated
    ? getAwardWatchDateKey(new Date(gameState.awardWatch.lastUpdated))
    : null;

  if (!isAwardWatchRegularSeasonWindow()) return;

  if (!gameState.awardWatch.currentRankings) {
    updateAwardWatchSnapshot("weekly");
    return;
  }

  if (currentDate.getDay() === 0 && currentKey !== lastKey) {
    updateAwardWatchSnapshot("weekly");
  }
}

/* ======================================================
   AWARD WATCH AUTO-MIGRATION FIX V3
   Prevents old/frozen/final preseason rankings
====================================================== */

var FCD_AWARD_WATCH_STATE_VERSION = 3;

function awardWatchStateHasOldFakeProjectionData(state) {
  if (!state) return false;

  const rankingSets = [
    state.currentRankings,
    state.previousRankings,
    state.finalResults
  ].filter(Boolean);

  return rankingSets.some(result => {
    if (!result || !Array.isArray(result.awards)) return false;

    return result.awards.some(award => {
      if (!award || !Array.isArray(award.finalists)) return false;

      return award.finalists.some(candidate => {
        if (!candidate) return false;

        if (candidate.isProjection === true) return true;

        if (
          Number(candidate.games || 0) === 0 &&
          (
            Number(candidate.ppg || 0) > 0 ||
            Number(candidate.rpg || 0) > 0 ||
            Number(candidate.apg || 0) > 0
          )
        ) {
          return true;
        }

        return false;
      });
    });
  });
}

function createFreshAwardWatchState() {
  return {
    version: FCD_AWARD_WATCH_STATE_VERSION,
    seasonLabel: gameState.seasonLabel,
    lastUpdated: null,
    previousRankings: null,
    currentRankings: null,
    finalResults: null
  };
}

function shouldClearAwardWatchFinalResults(state) {
  if (!state || !state.finalResults) return false;

  // Final results should only stay after the actual awards ceremony is complete.
  if (
    gameState.awardsCeremony &&
    gameState.awardsCeremony.complete === true
  ) {
    return false;
  }

  return true;
}

function ensureAwardWatchState() {
  if (!gameState) return null;

  const state = gameState.awardWatch;

  const needsFreshState =
    !state ||
    state.seasonLabel !== gameState.seasonLabel ||
    Number(state.version || 0) !== FCD_AWARD_WATCH_STATE_VERSION ||
    awardWatchStateHasOldFakeProjectionData(state);

  if (needsFreshState) {
    gameState.awardWatch = createFreshAwardWatchState();
    return gameState.awardWatch;
  }

  if (shouldClearAwardWatchFinalResults(state)) {
    state.finalResults = null;
  }

  state.version = FCD_AWARD_WATCH_STATE_VERSION;

  return state;
}

function resetAwardWatchForCurrentSave() {
  if (!gameState) return;

  gameState.awardWatch = createFreshAwardWatchState();

  if (typeof refreshAll === "function") {
    refreshAll();
  }

  console.log("Award Watch reset for current save.");
}
