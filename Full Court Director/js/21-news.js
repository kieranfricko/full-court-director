function displayNewsPage() {
  displayNewsScoreTicker();
}

function displayNewsScoreTicker() {
  const tracks = document.querySelectorAll(".news-scoreboard-track");

  if (!tracks.length) {
    console.warn("No .news-scoreboard-track found.");
    return;
  }

  const games = getFakeNewsScoreboardGames();

  for (let track of tracks) {
    track.innerHTML = games.map(game => renderNewsScoreboardGame(game)).join("");
  }
}

function getFakeNewsScoreboardGames() {
  const teams = Array.isArray(window.gameState?.teams) ? window.gameState.teams : [];

  if (teams.length >= 10) {
    return [
      {
        date: "8/29",
        time: "12:00 PM",
        away: teams[0],
        home: teams[1]
      },
      {
        date: "8/29",
        time: "3:00 PM",
        away: teams[2],
        home: teams[3]
      },
      {
        date: "8/29",
        time: "3:30 PM",
        away: teams[4],
        home: teams[5]
      },
      {
        date: "8/29",
        time: "5:30 PM",
        away: teams[6],
        home: teams[7]
      },
      {
        date: "8/29",
        time: "8:00 PM",
        away: teams[8],
        home: teams[9]
      }
    ];
  }

  return [
    {
      date: "8/29",
      time: "12:00 PM",
      awayName: "Boston Harbor",
      homeName: "New York Empire",
      awayRecord: "0-0",
      homeRecord: "0-0",
      awayLogo: "",
      homeLogo: ""
    },
    {
      date: "8/29",
      time: "3:00 PM",
      awayName: "Philadelphia Liberty",
      homeName: "Brooklyn Bridges",
      awayRecord: "0-0",
      homeRecord: "0-0",
      awayLogo: "",
      homeLogo: ""
    },
    {
      date: "8/29",
      time: "3:30 PM",
      awayName: "Milwaukee Stags",
      homeName: "Chicago Wind",
      awayRecord: "0-0",
      homeRecord: "0-0",
      awayLogo: "",
      homeLogo: ""
    },
    {
      date: "8/29",
      time: "5:30 PM",
      awayName: "Miami Wave",
      homeName: "Orlando Stars",
      awayRecord: "0-0",
      homeRecord: "0-0",
      awayLogo: "",
      homeLogo: ""
    },
    {
      date: "8/29",
      time: "8:00 PM",
      awayName: "Los Angeles Legends",
      homeName: "Golden State Guardians",
      awayRecord: "0-0",
      homeRecord: "0-0",
      awayLogo: "",
      homeLogo: ""
    }
  ];
}

function renderNewsScoreboardGame(game) {
  return `
    <div class="news-scoreboard-game">
      <div class="news-scoreboard-meta">
        <span class="news-scoreboard-time">${game.date} - ${game.time}</span>
      </div>

      <div class="news-scoreboard-team-list">
        ${renderNewsScoreboardTeamRow(game.away, game.awayName, game.awayRecord, game.awayLogo)}
        ${renderNewsScoreboardTeamRow(game.home, game.homeName, game.homeRecord, game.homeLogo)}
      </div>
    </div>
  `;
}

function renderNewsScoreboardTeamRow(team, fallbackName, fallbackRecord, fallbackLogo) {
  const logo =
    team?.logo ||
    team?.logoPath ||
    team?.image ||
    fallbackLogo ||
    "";

  const name = team?.name || fallbackName || "Team";
  const record = fallbackRecord || `${Number(team?.wins || 0)}-${Number(team?.losses || 0)}`;

  return `
    <div class="news-scoreboard-team-row">
      ${
        logo
          ? `<img class="news-scoreboard-team-logo" src="${logo}" alt="${name}">`
          : `<div class="news-scoreboard-team-logo"></div>`
      }

      <div class="news-scoreboard-team-name">${name}</div>
      <div class="news-scoreboard-team-record">${record}</div>
    </div>
  `;
}

window.addEventListener("load", function() {
  setTimeout(() => {
    if (document.querySelector(".screen.active-screen #news-scoreboard-track")) {
      displayNewsPage();
    }
  }, 100);
});

/* ======================================================
   NEWS: AWARD WATCH PAGE
====================================================== */

function displayNewsPage() {
  displayNewsScoreTicker();

  const awardWatchScreen = document.getElementById("news-award-watch-screen");

  if (
    awardWatchScreen &&
    awardWatchScreen.classList.contains("active-screen") &&
    typeof displayNewsAwardWatchPage === "function"
  ) {
    displayNewsAwardWatchPage();
  }
}

function displayNewsAwardWatchPage() {
  const screen = document.getElementById("news-award-watch-screen");

  if (!screen || !gameState || !gameState.started) return;

  if (typeof forceAwardWatchSundayRefreshIfNeeded === "function") {
  forceAwardWatchSundayRefreshIfNeeded();
}

const results = getAwardWatchResultsForDisplay();

  if (!results) {
    screen.innerHTML = `
      <div class="award-watch-page">
        <div class="award-watch-empty">
          <h2>Award Watch</h2>
          <p>Award Watch will begin once the regular season starts.</p>
        </div>
      </div>
    `;
    return;
  }

  const mvp = results.awards.find(award => award.id === "mvp");
  const dpoy = results.awards.find(award => award.id === "dpoy");
  const otherAwards = results.awards.filter(award => award.id !== "mvp" && award.id !== "dpoy");

  const lastUpdatedText = results.lastUpdated
    ? `Last updated ${formatDate(new Date(results.lastUpdated))} · Updates every Sunday`
    : "Updates every Sunday once the regular season starts";

  screen.innerHTML = `
    <div class="award-watch-page">
      <div class="award-watch-hero">
        <div class="award-watch-title-block">
          <span>LEAGUE WIRE</span>
          <h2>Race to the Awards</h2>
          <p>${gameState.seasonLabel}</p>
        </div>

        <div class="award-watch-meta-card">
          <strong>${lastUpdatedText}</strong>
          <small>Final winners are decided at the end of the regular season.</small>
        </div>
      </div>

      <div class="award-watch-feature-grid">
        ${renderAwardWatchFeatureCard(mvp)}
        ${renderAwardWatchFeatureCard(dpoy)}
      </div>

      <div class="award-watch-small-grid">
        ${otherAwards.map(renderAwardWatchSmallCard).join("")}
      </div>
    </div>
  `;
}

function renderAwardWatchFeatureCard(award) {
  if (!award) return "";

  return `
    <section class="award-watch-feature-card" style="--award-color:${award.color || "#1d4ed8"};">
      <div class="award-watch-card-header">
        <div>
          <span>${escapeAwardWatchHtml(award.shortTitle)}</span>
          <h3>${escapeAwardWatchHtml(award.title)}</h3>
        </div>

        <strong>Top 3</strong>
      </div>

      <div class="award-watch-ladder">
        ${renderAwardWatchCandidateRows(award)}
      </div>
    </section>
  `;
}

function renderAwardWatchSmallCard(award) {
  if (!award) return "";

  return `
    <section class="award-watch-small-card" style="--award-color:${award.color || "#1d4ed8"};">
      <div class="award-watch-small-title">
        <span>${escapeAwardWatchHtml(award.shortTitle)}</span>
        <h3>${escapeAwardWatchHtml(award.title)}</h3>
      </div>

      <div class="award-watch-mini-ladder">
        ${renderAwardWatchCandidateRows(award)}
      </div>
    </section>
  `;
}

function renderAwardWatchCandidateRows(award) {
  if (!award || !Array.isArray(award.finalists) || award.finalists.length === 0) {
    return `
      <div class="award-watch-no-candidates">
        Race not active yet.
      </div>
    `;
  }

  return award.finalists.map((candidate, index) => {
    return renderAwardWatchCandidateRow(candidate, award, index + 1);
  }).join("");
}

function renderAwardWatchCandidateRow(candidate, award, rank) {
  const isPlayer = award.type === "player";
  const team = candidate.team || null;
  const logo = getAwardWatchTeamLogo(team);
  const playerImage = isPlayer
    ? getAwardWatchPlayerImage(candidate.player)
    : "images/players/default-silhouette.png";

  const name = isPlayer
    ? candidate.player.name
    : candidate.name;

  const subtitle = isPlayer
    ? candidate.statLine
    : candidate.statLine;

  const teamName = team ? team.name : "League";
  const movement = candidate.movement || "◆";
  const movementClass =
    movement === "▲"
      ? "up"
      : movement === "▼"
      ? "down"
      : "same";

  const odds = candidate.odds || "+500";
  const projectionLabel = isPlayer && candidate.isBuildingSample
    ? `<em>Season sample building</em>`
    : "";

  return `
    <button
      type="button"
      class="award-watch-candidate-row rank-${rank}"
      onclick="${isPlayer ? `openPlayerProfile('${candidate.player.id || candidate.player.playerId}')` : `openTeamProfile(${team ? team.id : gameState.selectedTeamId})`}"
    >
      <div class="award-watch-rank-number">${rank}</div>

      <div class="award-watch-candidate-art">
        ${
          logo
            ? `<img class="award-watch-team-backdrop" src="${logo}" alt="${escapeAwardWatchHtml(teamName)}">`
            : `<div class="award-watch-team-backdrop-empty">${escapeAwardWatchHtml(team?.abbrev || "TM")}</div>`
        }

        <img class="award-watch-player-silhouette" src="${escapeAwardWatchHtml(playerImage)}" alt="${escapeAwardWatchHtml(name)}" ${isPlayer ? getPlayerImageErrorAttributes(candidate.player) : ""}>
      </div>

      <div class="award-watch-candidate-info">
        <strong>${escapeAwardWatchHtml(name)}</strong>
        <span>${escapeAwardWatchHtml(odds)}</span>
        <small>${escapeAwardWatchHtml(teamName)} · ${escapeAwardWatchHtml(subtitle || "")}</small>
        ${projectionLabel}
      </div>

      <div class="award-watch-movement ${movementClass}">
        ${movement}
      </div>
    </button>
  `;
}

function resetAwardWatchForCurrentSave() {
  if (!gameState) return;

  gameState.awardWatch = createFreshAwardWatchState();

  if (typeof refreshAll === "function") {
    refreshAll();
  }

  console.log("Award Watch reset for current save.");
}

/* ======================================================
   NEWS SCOREBOARD — REAL DAILY LEAGUE GAMES
====================================================== */

function displayNewsPage() {
  displayNewsScoreTicker();

  const awardWatchScreen = document.getElementById("news-award-watch-screen");

  if (
    awardWatchScreen &&
    awardWatchScreen.classList.contains("active-screen") &&
    typeof displayNewsAwardWatchPage === "function"
  ) {
    displayNewsAwardWatchPage();
  }
}

function displayNewsScoreTicker() {
  const tracks = document.querySelectorAll(".news-scoreboard-track");

  if (!tracks.length) return;

  const games = getNewsScoreboardGamesForCurrentDate();

  for (let track of tracks) {
    if (!games.length) {
      track.innerHTML = `
        <div class="news-scoreboard-game news-scoreboard-no-games">
          <strong>No games scheduled today</strong>
        </div>
      `;
    } else {
      track.innerHTML = games.map(renderNewsRealScoreboardGame).join("");
    }
  }

  const fullButtons = document.querySelectorAll(".news-scoreboard-full-button");

  fullButtons.forEach(button => {
    button.onclick = openNewsFullScoreboard;
  });
}

function getNewsScoreboardGamesForCurrentDate() {
  if (!gameState || !gameState.started || !gameState.currentDate) return [];

  if (typeof ensureLeagueScheduleForCurrentSeason === "function") {
    ensureLeagueScheduleForCurrentSeason();
  }

  const dateKey = getNewsScoreboardDateKey(gameState.currentDate);

  const leagueGames = Array.isArray(gameState.leagueSchedule)
    ? gameState.leagueSchedule
    : [];

  return leagueGames
    .filter(game => game && game.date)
    .filter(game => getNewsScoreboardDateKey(game.date) === dateKey)
    .sort((a, b) => {
      if (a.played !== b.played) return a.played ? -1 : 1;

      const aTime = getNewsScoreboardGameTime(gameState, a);
      const bTime = getNewsScoreboardGameTime(gameState, b);

      return String(aTime).localeCompare(String(bTime));
    });
}

function getNewsScoreboardDateKey(dateValue) {
  const date = new Date(dateValue);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getNewsScoreboardShortDate(dateValue) {
  const date = new Date(dateValue);

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getNewsScoreboardGameTime(state, game) {
  if (!game) return "7:30 PM";

  if (game.played) return "Final";

  if (typeof fcdGetLeagueScheduleTime === "function") {
    return fcdGetLeagueScheduleTime(game);
  }

  if (game.fcdGameTime) return game.fcdGameTime;

  const times = ["7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM"];
  const raw = String(game.id || game.homeTeamId || game.awayTeamId || "game");
  let hash = 0;

  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) % 1000003;
  }

  game.fcdGameTime = times[Math.abs(hash) % times.length];

  return game.fcdGameTime;
}

function getNewsScoreboardTeam(teamId) {
  if (typeof getTeamById === "function") {
    const team = getTeamById(Number(teamId));
    if (team) return team;
  }

  if (typeof getBaseTeamById === "function") {
    const team = getBaseTeamById(Number(teamId));
    if (team) return team;
  }

  return null;
}

function getNewsScoreboardTeamLogo(team) {
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

function getNewsScoreboardTeamRecord(team) {
  if (!team) return "0-0";

  return `${Number(team.wins || 0)}-${Number(team.losses || 0)}`;
}

function renderNewsRealScoreboardGame(game) {
  const awayTeam = getNewsScoreboardTeam(game.awayTeamId);
  const homeTeam = getNewsScoreboardTeam(game.homeTeamId);

  const dateText = getNewsScoreboardShortDate(game.date);
  const timeText = getNewsScoreboardGameTime(gameState, game);

  return `
    <div class="news-scoreboard-game ${game.played ? "final" : "upcoming"}">
      <div class="news-scoreboard-meta">
        <span class="news-scoreboard-time">
          ${dateText} - ${timeText}
        </span>
      </div>

      <div class="news-scoreboard-team-list">
        ${renderNewsRealScoreboardTeamRow(awayTeam, game, "away")}
        ${renderNewsRealScoreboardTeamRow(homeTeam, game, "home")}
      </div>
    </div>
  `;
}

function renderNewsRealScoreboardTeamRow(team, game, side) {
  const logo = getNewsScoreboardTeamLogo(team);
  const name = team ? team.name : "Team";
  const record = getNewsScoreboardTeamRecord(team);

  let rightText = record;

  if (game.played) {
    rightText = side === "away"
      ? Number(game.awayScore || 0)
      : Number(game.homeScore || 0);
  }

  return `
    <div class="news-scoreboard-team-row">
      ${
        logo
          ? `<img class="news-scoreboard-team-logo" src="${logo}" alt="${name}">`
          : `<div class="news-scoreboard-team-logo"></div>`
      }

      <div class="news-scoreboard-team-name">${name}</div>
      <div class="news-scoreboard-team-record">${rightText}</div>
    </div>
  `;
}

function openNewsFullScoreboard() {
  if (!gameState || !gameState.started) return;

  if (typeof fcdLeagueScheduleViewDate !== "undefined") {
    fcdLeagueScheduleViewDate = new Date(gameState.currentDate);
  }

  showMainSection("schedule");

  setTimeout(() => {
    showSecondaryScreen("league-schedule-screen");

    if (typeof displayLeagueScheduleScreen === "function") {
      displayLeagueScheduleScreen();
    }
  }, 0);
}

/* ======================================================
   CENTRAL LEAGUE NEWS SYSTEM
====================================================== */

let activeNewsCategory = "all";
let selectedNewsItemId = null;

const FCD_NEWS_TYPES = {
  league: { label: "League", color: "#24d8ff" },
  awards: { label: "Awards", color: "#f7c948" },
  transactions: { label: "Transactions", color: "#ff7a45" },
  injuries: { label: "Injuries", color: "#ff4d6d" }
};

function ensureNewsItems() {
  if (!gameState) return [];
  if (!Array.isArray(gameState.newsItems)) gameState.newsItems = [];
  return gameState.newsItems;
}

function getNewsDateKey(dateValue = null) {
  const date = dateValue ? new Date(dateValue) : new Date(gameState?.currentDate || Date.now());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCurrentNewsSeasonLabel() {
  if (!gameState) return "";

  const currentDate = new Date(gameState.currentDate || Date.now());

  if (gameState.offseasonActive === true && currentDate.getMonth() >= 5) {
    return typeof getSeasonLabel === "function"
      ? getSeasonLabel(currentDate.getFullYear())
      : `${currentDate.getFullYear()}-${String(currentDate.getFullYear() + 1).slice(-2)}`;
  }

  return gameState.seasonLabel || "";
}

function addNewsItem(item) {
  if (!gameState || !item || !item.id || !FCD_NEWS_TYPES[item.type]) return null;

  const items = ensureNewsItems();
  const existing = items.find(story => String(story.id) === String(item.id));
  if (existing) return existing;

  const story = {
    id: String(item.id),
    type: item.type,
    newsSeasonLabel: item.newsSeasonLabel || getCurrentNewsSeasonLabel(),
    date: item.date || getNewsDateKey(),
    createdAt: item.createdAt || new Date().toISOString(),
    title: item.title || "League Update",
    subtitle: item.subtitle || "",
    body: item.body || item.subtitle || "",
    priority: Number(item.priority || 50),
    imageType: item.imageType || "league",
    playerId: item.playerId ?? null,
    playerIds: Array.isArray(item.playerIds) ? item.playerIds : [],
    teamId: item.teamId ?? null,
    teamIds: Array.isArray(item.teamIds) ? item.teamIds : [],
    gameId: item.gameId ?? null,
    transactionId: item.transactionId ?? null,
    injuryId: item.injuryId ?? null,
    actionType: item.actionType || null
  };

  story.impactAbility = Number(item.impactAbility || getNewsStoryPlayerAbility(story) || 0);

  items.unshift(story);
  items.sort((a, b) =>
    new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date) ||
    Number(b.priority || 0) - Number(a.priority || 0)
  );

  if (items.length > 400) gameState.newsItems = items.slice(0, 400);
  return story;
}

function findNewsPlayer(playerId) {
  if (playerId === null || playerId === undefined) return null;
  if (typeof findPlayerById === "function") {
    const found = findPlayerById(playerId);
    if (found) return found.player || found;
  }

  const allPlayers = [
    ...Object.values(gameState?.rosters || {}).flat(),
    ...(gameState?.freeAgents || []),
    ...(gameState?.draft?.prospects || [])
  ];

  return allPlayers.find(player =>
    String(player?.id ?? player?.playerId) === String(playerId)
  ) || null;
}

function findNewsPlayerTeam(player) {
  if (!player) return null;
  const teamId = player.teamId ?? player.currentTeamId;
  return typeof getTeamById === "function" ? getTeamById(Number(teamId)) : null;
}

function getNewsTeamLogo(team) {
  if (!team) return "";
  return team.logo || team.logoPath || team.image || team.imagePath || team.teamLogo || "";
}

function getNewsTopLine(performers) {
  const lines = [
    ...(performers?.teamAStats?.playerLines || []),
    ...(performers?.teamBStats?.playerLines || [])
  ].filter(line => line && !line.dnp);

  return lines.sort((a, b) => Number(b.points || 0) - Number(a.points || 0))[0] || null;
}

function addGameResultNews(game, performers = null) {
  if (!game || !game.played) return;

  const homeScore = Number(game.homeScore ?? game.teamAScore ?? 0);
  const awayScore = Number(game.awayScore ?? game.teamBScore ?? 0);
  const margin = Math.abs(homeScore - awayScore);
  const overtime = game.overtime === true || game.isOvertime === true || Number(game.periods || 4) > 4;

  if (margin > 4 && !overtime) {
    addSingleGameHighNews(game, performers);
    return;
  }

  const homeTeam = getNewsScoreboardTeam(game.homeTeamId || game.teamAId);
  const awayTeam = getNewsScoreboardTeam(game.awayTeamId || game.teamBId);
  const winnerId = Number(game.winnerId);
  const winner = Number(homeTeam?.id) === winnerId ? homeTeam : awayTeam;
  const loser = winner === homeTeam ? awayTeam : homeTeam;
  if (!winner || !loser) return;

  const topLine = getNewsTopLine(performers);
  const topPlayer = topLine ? findNewsPlayer(topLine.playerId) : null;
  const headline = overtime
    ? `${winner.name} Survive ${loser.name} in Overtime Thriller`
    : `${winner.name} Edge ${loser.name} in ${margin}-Point Finish`;
  const subtitle = topLine
    ? `${topLine.name} led the night with ${Number(topLine.points || 0)} points.`
    : `${winner.name} secured a ${Math.max(homeScore, awayScore)}-${Math.min(homeScore, awayScore)} victory.`;

  addNewsItem({
    id: `news_game_${getNewsDateKey(game.date)}_${game.id}_close${overtime ? "_ot" : ""}`,
    type: "league",
    date: getNewsDateKey(game.date),
    title: headline,
    subtitle,
    body: `${winner.name} defeated ${loser.name}, ${Math.max(homeScore, awayScore)}-${Math.min(homeScore, awayScore)}.${topLine ? ` ${topLine.name} scored ${topLine.points} points in the win.` : ""}`,
    priority: overtime ? 92 : 78,
    imageType: "game",
    playerId: topPlayer?.id ?? topLine?.playerId ?? null,
    teamId: winner.id,
    teamIds: [winner.id, loser.id],
    gameId: game.id,
    actionType: "box-score"
  });

  addSingleGameHighNews(game, performers);
}

function addSingleGameHighNews(game, performers) {
  const lines = [
    ...(performers?.teamAStats?.playerLines || []),
    ...(performers?.teamBStats?.playerLines || [])
  ].filter(line => line && !line.dnp);

  lines.forEach(line => {
    const achievements = [];
    if (Number(line.points || 0) > 45) achievements.push(`${line.points} points`);
    if (Number(line.rebounds || 0) > 20) achievements.push(`${line.rebounds} rebounds`);
    if (Number(line.assists || 0) > 15) achievements.push(`${line.assists} assists`);
    if (!achievements.length) return;

    const player = findNewsPlayer(line.playerId);
    const team = findNewsPlayerTeam(player);

    addNewsItem({
      id: `news_high_${getNewsDateKey(game.date)}_${line.playerId}_${achievements.join("_").replaceAll(" ", "")}`,
      type: "awards",
      date: getNewsDateKey(game.date),
      title: `${line.name} Posts League-High Performance`,
      subtitle: `${line.name} finished with ${achievements.join(", ")}.`,
      body: `${line.name} delivered one of the season's biggest individual performances with ${achievements.join(", ")}.`,
      priority: 88,
      imageType: "award",
      playerId: line.playerId,
      teamId: team?.id || null,
      gameId: game.id,
      actionType: "box-score"
    });
  });
}

function addTransactionNews(transaction) {
  if (!transaction) return;

  const typeText = String(transaction.type || "Transaction");
  const normalizedType = typeText.toLowerCase();
  const isTrade = normalizedType.includes("trade");
  const isSigning = normalizedType === "signing";
  const playerLastName = String(transaction.playerName || "Player")
    .trim()
    .split(/\s+/)
    .pop();
  const signingHeadline = `${playerLastName} Signs for ${transaction.teamName || transaction.team || "New Team"}`;
  const assets = Array.isArray(transaction.assets) ? transaction.assets : [];
  const playerIds = assets
    .filter(asset => String(asset.type || "").toLowerCase() === "player")
    .map(asset => asset.playerId)
    .filter(id => id !== undefined && id !== null)
    .sort((a, b) =>
      Number(findNewsPlayer(b)?.currentAbility || 0) -
      Number(findNewsPlayer(a)?.currentAbility || 0)
    )
    .slice(0, 2);

  const teamIds = Array.isArray(transaction.teams)
    ? transaction.teams.map(team => team.teamId ?? team.id).filter(Boolean)
    : transaction.teamId ? [transaction.teamId] : [];

  addNewsItem({
    id: `news_transaction_${transaction.id || `${typeText}_${getNewsDateKey()}_${transaction.playerId || "league"}`}`,
    type: "transactions",
    date: transaction.date || getNewsDateKey(),
    title: transaction.headline || transaction.title || (
      isTrade
        ? "League Trade Completed"
        : isSigning
          ? signingHeadline
          : `${transaction.playerName || "Player"} ${typeText}`
    ),
    subtitle: transaction.description || transaction.text || `${transaction.teamName || transaction.team || "A team"} completed a ${typeText.toLowerCase()}.`,
    body: transaction.description || transaction.text || "",
    priority: isTrade ? 86 : 68,
    imageType: isTrade ? "trade" : "player",
    playerId: transaction.playerId || playerIds[0] || null,
    playerIds,
    teamId: transaction.teamId || teamIds[0] || null,
    teamIds,
    transactionId: transaction.id || null,
    actionType: "transaction"
  });
}

function addMajorInjuryNews(injury, teamId = null) {
  if (!injury || Number(injury.days || 0) <= 7) return;

  const player = injury.player;
  if (!player) return;
  const resolvedTeamId = teamId ?? player.teamId ?? null;
  const duration = Number(injury.days || 0);

  addNewsItem({
    id: `news_injury_${player.id || player.playerId}_${getNewsDateKey()}_${String(injury.injuryName).replaceAll(" ", "_")}`,
    type: "injuries",
    date: getNewsDateKey(),
    title: `${player.name} Out ${duration} Days With ${injury.injuryName}`,
    subtitle: `${player.name} is expected to miss more than a week.`,
    body: `${player.name} suffered ${injury.injuryName} and is expected to miss approximately ${duration} days.`,
    priority: 70 + Math.min(20, Math.round(Number(player.currentAbility || 0) / 50)),
    imageType: "injury",
    playerId: player.id || player.playerId,
    teamId: resolvedTeamId,
    injuryId: `${player.id || player.playerId}_${getNewsDateKey()}`
  });
}

function addLeagueEventNews(id, title, subtitle, options = {}) {
  return addNewsItem({
    id: `news_league_${gameState?.seasonLabel || "season"}_${id}`,
    type: "league",
    date: getNewsDateKey(),
    title,
    subtitle,
    body: options.body || subtitle,
    priority: options.priority || 85,
    imageType: options.imageType || "league",
    teamId: options.teamId || null,
    teamIds: options.teamIds || [],
    playerId: options.playerId || null,
    gameId: options.gameId || null,
    actionType: options.actionType || null
  });
}

function addYearlyAwardsNews(results) {
  if (!results || !Array.isArray(results.awards)) return;

  results.awards.forEach(award => {
    const winner = award.winner;
    if (!winner) return;
    const isPlayer = award.type === "player";
    const name = isPlayer ? winner.player?.name : winner.name;
    const team = winner.team || null;

    addNewsItem({
      id: `news_award_${results.seasonLabel || gameState.seasonLabel}_${award.id}`,
      type: "awards",
      date: getNewsDateKey(),
      title: `${name || "Winner"} Wins ${award.title}`,
      subtitle: `${name || "The winner"} has been named ${award.title}.`,
      body: winner.statLine || `${name || "The winner"} earned one of the league's highest honors.`,
      priority: award.id === "mvp" ? 100 : 90,
      imageType: "award",
      playerId: isPlayer ? (winner.player?.id || winner.player?.playerId) : null,
      teamId: team?.id || null
    });
  });
}

function setNewsCategory(category) {
  activeNewsCategory = FCD_NEWS_TYPES[category] ? category : "all";
  selectedNewsItemId = null;
  displayLeagueNewsScreen();
}

function selectNewsItem(newsId) {
  selectedNewsItemId = String(newsId);
  displayLeagueNewsScreen();
}

function getFilteredNewsItems() {
  const items = ensureNewsItems();
  return activeNewsCategory === "all"
    ? items
    : items.filter(item => item.type === activeNewsCategory);
}

function getNewsStoryPlayerAbility(story) {
  if (Number(story?.impactAbility || 0) > 0) {
    return Number(story.impactAbility);
  }

  const playerIds = [story.playerId, ...(story.playerIds || [])]
    .filter((id, index, all) => id !== null && id !== undefined && all.indexOf(id) === index);

  return playerIds.reduce((highest, playerId) => {
    const player = findNewsPlayer(playerId);
    return Math.max(
      highest,
      Number(player?.currentAbility || player?.overall || player?.CA || 0)
    );
  }, 0);
}

function getTopNewsStoriesForCurrentYear(items) {
  const seasonLabel = getCurrentNewsSeasonLabel();

  return items
    .filter(story =>
      story.type === "transactions" &&
      (story.newsSeasonLabel || seasonLabel) === seasonLabel
    )
    .slice()
    .sort((a, b) =>
      getNewsStoryPlayerAbility(b) - getNewsStoryPlayerAbility(a) ||
      Number(b.priority || 0) - Number(a.priority || 0) ||
      new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    )
    .slice(0, 5);
}

function formatNewsStoryDate(story) {
  const rawDate = String(story.date || "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? new Date(`${rawDate}T12:00:00`)
    : new Date(rawDate);
  if (Number.isNaN(date.getTime())) return story.date || "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function renderNewsBadge(type) {
  const config = FCD_NEWS_TYPES[type] || FCD_NEWS_TYPES.league;
  return `<span class="fcd-news-badge fcd-news-badge-${type}">${config.label}</span>`;
}

function renderNewsStoryVisual(story, className = "") {
  const players = [story.playerId, ...(story.playerIds || [])]
    .filter((id, index, all) => id !== null && all.indexOf(id) === index)
    .map(findNewsPlayer)
    .filter(Boolean)
    .slice(0, 2);
  const teams = [story.teamId, ...(story.teamIds || [])]
    .filter((id, index, all) => id !== null && all.indexOf(id) === index)
    .map(id => getNewsScoreboardTeam(id))
    .filter(Boolean)
    .slice(0, 2);

  if (story.imageType === "trade" && players.length) {
    return `<div class="fcd-news-visual fcd-news-trade-visual ${className}">
      ${players.map(player => `<div>${getPlayerImageHTML(player, "", player.name)}</div>`).join("")}
      ${players.length === 1 && teams[0] ? `<div>${renderNewsTeamLogo(teams[0])}</div>` : ""}
    </div>`;
  }

  if (players[0]) {
    return `<div class="fcd-news-visual fcd-news-player-visual ${className}">
      ${teams[0] ? `<div class="fcd-news-team-watermark">${renderNewsTeamLogo(teams[0])}</div>` : ""}
      ${getPlayerImageHTML(players[0], "", players[0].name)}
    </div>`;
  }

  if (teams.length) {
    return `<div class="fcd-news-visual fcd-news-team-visual ${className}">
      ${teams.map(renderNewsTeamLogo).join("")}
    </div>`;
  }

  return `<div class="fcd-news-visual fcd-news-generic-visual ${className}"><span>FCD</span></div>`;
}

function renderNewsTeamLogo(team) {
  const logo = getNewsTeamLogo(team);
  return logo
    ? `<img src="${escapeAwardWatchHtml(logo)}" alt="${escapeAwardWatchHtml(team.name)}">`
    : `<strong>${escapeAwardWatchHtml(team.abbrev || "TM")}</strong>`;
}

function renderLatestNewsItem(story) {
  return `<button type="button" class="fcd-news-latest-item" onclick="selectNewsItem('${escapeAwardWatchHtml(story.id)}')">
    ${renderNewsStoryVisual(story, "latest")}
    <span class="fcd-news-latest-copy">
      ${renderNewsBadge(story.type)}
      <strong>${escapeAwardWatchHtml(story.title)}</strong>
      <small>${formatNewsStoryDate(story)}</small>
    </span>
  </button>`;
}

function renderFeaturedNewsStory(story) {
  if (!story) {
    return `<section class="fcd-news-feature fcd-news-empty">
      <div><span>LEAGUE WIRE</span><h2>No stories yet</h2><p>News will appear as games, transactions, injuries, awards, and major league events happen.</p></div>
    </section>`;
  }

  const hasAction = story.actionType === "box-score" && story.gameId;
  return `<section class="fcd-news-feature">
    ${renderNewsStoryVisual(story, "feature")}
    <div class="fcd-news-feature-overlay">
      ${renderNewsBadge(story.type)}
      <h2>${escapeAwardWatchHtml(story.title)}</h2>
      <p>${escapeAwardWatchHtml(story.subtitle || story.body)}</p>
      <div class="fcd-news-feature-meta">
        <span>${formatNewsStoryDate(story)}</span>
        ${hasAction ? `<button type="button" onclick="openBoxScore('${escapeAwardWatchHtml(story.gameId)}')">Box Score</button>` : ""}
      </div>
    </div>
  </section>`;
}

function renderTopStoryCard(story) {
  return `<button type="button" class="fcd-news-top-card" onclick="selectNewsItem('${escapeAwardWatchHtml(story.id)}')">
    ${renderNewsStoryVisual(story, "top-story")}
    <span>${renderNewsBadge(story.type)}<strong>${escapeAwardWatchHtml(story.title)}</strong><small>${formatNewsStoryDate(story)}</small></span>
  </button>`;
}

function getNewsRecentTransactions() {
  const combined = [
    ...(gameState?.leagueTransactions || []),
    ...(gameState?.transactions || [])
  ];
  const seen = new Set();

  return combined.filter(transaction => {
    const key = String(transaction.id || `${transaction.type}_${transaction.playerId}_${transaction.date}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 4);
}

function renderRecentTransactionsPanel() {
  const transactions = getNewsRecentTransactions();
  return `<section class="fcd-news-bottom-panel">
    <header><span>FRONT OFFICE</span><h3>Recent Transactions</h3></header>
    <div class="fcd-news-panel-list">
      ${transactions.length ? transactions.map(transaction => {
        const player = findNewsPlayer(transaction.playerId);
        const team = getNewsScoreboardTeam(transaction.teamId);
        return `<div class="fcd-news-transaction-row">
          <div class="fcd-news-mini-art">${player ? getPlayerImageHTML(player, "", player.name) : renderNewsTeamLogo(team || {})}</div>
          <div><span>${escapeAwardWatchHtml(transaction.type || "MOVE")}</span><strong>${escapeAwardWatchHtml(transaction.playerName || transaction.headline || transaction.title || "League transaction")}</strong><small>${escapeAwardWatchHtml(player ? `${player.primaryPosition || player.position || "—"} · ${player.height || "—"} · Age ${player.age || "—"}` : transaction.teamName || transaction.team || "")}</small></div>
        </div>`;
      }).join("") : `<p class="fcd-news-panel-empty">No transactions recorded.</p>`}
    </div>
  </section>`;
}

function getNewsInjuredPlayers() {
  return Object.values(gameState?.rosters || {}).flat()
    .filter(player => player && (player.isInjured || Number(player.injuryDaysRemaining || 0) > 0))
    .sort((a, b) => Number(b.currentAbility || b.overall || 0) - Number(a.currentAbility || a.overall || 0))
    .slice(0, 4);
}

function renderInjuryReportPanel() {
  const players = getNewsInjuredPlayers();
  return `<section class="fcd-news-bottom-panel">
    <header><span>MEDICAL WIRE</span><h3>Injury Report</h3></header>
    <div class="fcd-news-panel-list">
      ${players.length ? players.map(player => {
        const team = findNewsPlayerTeam(player);
        const days = Number(player.injuryDaysRemaining || 0);
        return `<div class="fcd-news-injury-row">
          <div class="fcd-news-mini-art">${getPlayerImageHTML(player, "", player.name)}</div>
          <div><span class="status">OUT</span><strong>${escapeAwardWatchHtml(player.name)}</strong><small>${escapeAwardWatchHtml(team?.name || "Free Agent")} · ${escapeAwardWatchHtml(player.primaryPosition || player.position || "—")}</small><em>${escapeAwardWatchHtml(player.injuryName || "Injury")} · ${days} days</em></div>
        </div>`;
      }).join("") : `<p class="fcd-news-panel-empty">No active injuries.</p>`}
    </div>
  </section>`;
}

function getNewsAllGamesForDate(dateValue) {
  const dateKey = getNewsDateKey(dateValue);
  const games = [...(gameState?.leagueSchedule || [])];

  (gameState?.cup?.games || []).forEach(game => {
    if (!games.some(existing => String(existing.id) === String(game.id))) games.push(game);
  });
  (gameState?.playoffs?.playInGames || []).forEach(game => games.push(game));
  (gameState?.playoffs?.series || []).forEach(series => {
    (series.games || []).forEach(game => games.push({ ...game, teamAId: series.teamAId, teamBId: series.teamBId, competition: series.round }));
  });

  return games.filter(game => game?.date && getNewsDateKey(game.date) === dateKey);
}

function getNewsTeamAbility(teamId) {
  const team = getNewsScoreboardTeam(teamId);
  if (team && typeof getTeamStrength === "function") return Number(getTeamStrength(team) || 0);

  return (gameState?.rosters?.[teamId] || []).slice()
    .sort((a, b) => Number(b.currentAbility || 0) - Number(a.currentAbility || 0))
    .slice(0, 8)
    .reduce((sum, player) => sum + Number(player.currentAbility || 0), 0);
}

function getGameOfTheDay() {
  return getNewsAllGamesForDate(gameState?.currentDate)
    .sort((a, b) => {
      const aIds = [a.homeTeamId || a.teamAId, a.awayTeamId || a.teamBId];
      const bIds = [b.homeTeamId || b.teamAId, b.awayTeamId || b.teamBId];
      return (getNewsTeamAbility(bIds[0]) + getNewsTeamAbility(bIds[1])) -
        (getNewsTeamAbility(aIds[0]) + getNewsTeamAbility(aIds[1]));
    })[0] || null;
}

function renderGameOfTheDayPanel() {
  const game = getGameOfTheDay();
  if (!game) {
    return `<section class="fcd-news-bottom-panel fcd-news-gotd"><header><span>SPOTLIGHT</span><h3>Game of the Day</h3></header><p class="fcd-news-panel-empty">No games scheduled today</p></section>`;
  }

  const homeTeam = getNewsScoreboardTeam(game.homeTeamId || game.teamAId);
  const awayTeam = getNewsScoreboardTeam(game.awayTeamId || game.teamBId);
  const played = game.played === true;
  const homeScore = Number(game.homeScore ?? game.teamAScore ?? 0);
  const awayScore = Number(game.awayScore ?? game.teamBScore ?? 0);

  return `<section class="fcd-news-bottom-panel fcd-news-gotd">
    <header><span>SPOTLIGHT</span><h3>Game of the Day</h3></header>
    <div class="fcd-news-gotd-matchup">
      <div>${renderNewsTeamLogo(awayTeam || {})}<strong>${escapeAwardWatchHtml(awayTeam?.name || "Away")}</strong><small>${getNewsScoreboardTeamRecord(awayTeam)}</small></div>
      <b>${played ? `${awayScore} — ${homeScore}` : "VS"}</b>
      <div>${renderNewsTeamLogo(homeTeam || {})}<strong>${escapeAwardWatchHtml(homeTeam?.name || "Home")}</strong><small>${getNewsScoreboardTeamRecord(homeTeam)}</small></div>
    </div>
    <footer><strong>${played ? "FINAL" : escapeAwardWatchHtml(game.competition || "Regular Season")}</strong><span>${formatNewsStoryDate({ date: getNewsDateKey(game.date) })} · ${escapeAwardWatchHtml(getNewsScoreboardGameTime(gameState, game))}</span><small>${escapeAwardWatchHtml(homeTeam?.arenaName || homeTeam?.arena || "League Arena")}</small></footer>
  </section>`;
}

function displayLeagueNewsScreen() {
  const screen = document.getElementById("news-screen");
  if (!screen || !gameState?.started) return;

  const filtered = getFilteredNewsItems();
  const featured = filtered.find(item => String(item.id) === String(selectedNewsItemId)) || filtered[0] || null;
  if (featured) selectedNewsItemId = featured.id;
  const latest = filtered.slice(0, 7);
  const topStories = getTopNewsStoriesForCurrentYear(filtered);

  screen.innerHTML = `<div class="fcd-news-page">
    <header class="fcd-news-header">
      <div><span>NEWS</span><h1>League News & Updates</h1></div>
      <nav>${["all", "league", "awards", "transactions", "injuries"].map(category => `<button type="button" class="${activeNewsCategory === category ? "active" : ""}" onclick="setNewsCategory('${category}')">${category === "all" ? "All" : FCD_NEWS_TYPES[category].label}</button>`).join("")}</nav>
    </header>
    <div class="fcd-news-main-grid">
      <aside class="fcd-news-latest"><header><span>LATEST</span><strong>${filtered.length} Stories</strong></header>${latest.length ? latest.map(renderLatestNewsItem).join("") : `<p class="fcd-news-panel-empty">No ${activeNewsCategory === "all" ? "" : FCD_NEWS_TYPES[activeNewsCategory].label.toLowerCase()} news yet.</p>`}</aside>
      <main>
        ${renderFeaturedNewsStory(featured)}
        <section class="fcd-news-top-stories"><header><span>TOP MOVES</span></header><div>${topStories.length ? topStories.map(renderTopStoryCard).join("") : `<p class="fcd-news-panel-empty">The season's biggest trades, signings, and extensions will appear here.</p>`}</div></section>
      </main>
    </div>
    <div class="fcd-news-bottom-grid">
      ${renderRecentTransactionsPanel()}
      ${renderInjuryReportPanel()}
      ${renderGameOfTheDayPanel()}
    </div>
  </div>`;
}

function displayNewsPage() {
  displayLeagueNewsScreen();

  const awardWatchScreen = document.getElementById("news-award-watch-screen");
  if (awardWatchScreen?.classList.contains("active-screen") && typeof displayNewsAwardWatchPage === "function") {
    displayNewsAwardWatchPage();
  }
}
