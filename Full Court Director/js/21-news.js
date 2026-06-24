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

        <img class="award-watch-player-silhouette" src="${escapeAwardWatchHtml(playerImage)}" alt="${escapeAwardWatchHtml(name)}">
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
