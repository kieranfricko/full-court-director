const leagueRosterDivisionOrder = [
  { name: "Atlantic", conference: "East" },
  { name: "Central", conference: "East" },
  { name: "Southeast", conference: "East" },
  { name: "Pacific", conference: "West" },
  { name: "Northwest", conference: "West" },
  { name: "Southwest", conference: "West" }
];

function ensureLeagueRosters() {
  if (!gameState || !gameState.rosters) return;

  for (let team of gameState.teams) {
    const teamId = team.id;

    if (!gameState.rosters[teamId]) {
      gameState.rosters[teamId] = [];
    }

    for (let player of gameState.rosters[teamId]) {
      player.teamId = teamId;
      player.teamName = team.name;

      if (!player.rosterContractType) {
        player.rosterContractType = player.contractType === "Two-Way" ? "Two-Way" : "Standard";
      }

      normalizePlayerContract(player);
    }
  }

  ensureFreeAgents();
}

function getRosterByTeamId(teamId) {
  if (!gameState || !gameState.rosters) return [];
  return gameState.rosters[teamId] || [];
}

function getTeamConferenceRank(teamId) {
  const team = getTeamById(teamId);

  if (!team) return "-";

  const standings = getConferenceStandings(team.conference);
  const index = standings.findIndex(item => item.id === teamId);

  if (index < 0) return "-";

  return `${index + 1}`;
}

function getTopPlayersForTeam(teamId, count = 5) {
  return [...getRosterByTeamId(teamId)]
    .sort((a, b) => b.currentAbility - a.currentAbility)
    .slice(0, count);
}

function getTeamLevelFromRoster(teamId) {
  const roster = getRosterByTeamId(teamId);

  if (roster.length === 0) return "Unknown";

  const topEight = [...roster]
    .sort((a, b) => b.currentAbility - a.currentAbility)
    .slice(0, 8);

  const average = Math.round(topEight.reduce((total, player) => total + player.currentAbility, 0) / topEight.length);

  return getMediaDescription(average);
}

function displayLeague() {
  const leagueTable = document.getElementById("league-table");
  if (!leagueTable || !gameState || !gameState.started) return;

  leagueTable.innerHTML = "";

  for (let team of gameState.teams) {
    const roster = getRosterByTeamId(team.id);
    const rosterCount = roster.length;
    const payroll = getRosterPayroll(team.id);
    const capSpace = getCapSpace(team.id);
    const className = team.id === gameState.selectedTeamId ? "user-team" : "";

    const row = `
      <tr>
        <td>
          <button class="league-team-button ${className}" onclick="openTeamProfile(${team.id})">
            ${team.name}
          </button>
        </td>
        <td>${team.conference}</td>
        <td>${team.wins}-${team.losses}</td>
        <td>${rosterCount} / ${MAX_ROSTER_SIZE}</td>
        <td>${formatMoney(payroll)}</td>
        <td class="${capSpace < 0 ? "salary-negative" : "salary-positive"}">${formatMoney(capSpace)}</td>
        <td>${getTeamLevelFromRoster(team.id)}</td>
      </tr>
    `;

    leagueTable.innerHTML += row;
  }
}


function openTeamProfile(teamId) {
  currentViewedTeamId = Number(teamId);

  const team = getTeamById(currentViewedTeamId);
  const overlay = document.getElementById("team-profile-overlay");

  if (!team || !overlay) {
    console.log("Team profile failed:", teamId, team, overlay);
    return;
  }

  ensureLeagueRosters();
  ensureTeamStats();

  const roster = [...getRosterByTeamId(team.id)].sort((a, b) => {
    return getLeagueRosterPlayerAbility(b) - getLeagueRosterPlayerAbility(a);
  });

  const capSpace = getCapSpace(team.id);
  const payroll = getRosterPayroll(team.id);
  const colors = typeof getTeamColors === "function" ? getTeamColors(team) : null;
  const primaryColor = colors ? colors.primaryColor : "#1d4ed8";

  const hero = document.getElementById("team-profile-hero");

  if (hero) {
    hero.style.background = `
      linear-gradient(90deg, ${primaryColor}, rgba(8, 27, 72, 0.94))
    `;
  }

  renderTeamProfileLogo(team);

  setText("team-profile-name", team.name);
  setText("team-profile-division-label", `${team.conference} Conference · ${team.hiddenDivision || "---"} Division`);
  setText("team-profile-subtitle", `${team.conference} Conference · ${team.wins}-${team.losses}`);
  setText("team-profile-record", `${team.wins}-${team.losses}`);
  setText("team-profile-rank", getFormattedTeamConferenceRank(team.id));
  setText("team-profile-previous-finish", "---");
  setText("team-profile-roster-size", `${roster.length} / ${MAX_ROSTER_SIZE}`);
  setText("team-profile-roster-size-secondary", `${roster.length} / ${MAX_ROSTER_SIZE}`);
  setText("team-profile-level", getTeamLevelFromRoster(team.id));
  setText("team-profile-payroll", formatMoney(payroll));
  setText("team-profile-cap-space", formatMoney(capSpace));
  setText("team-profile-gm", "Placeholder GM");
  setText("team-profile-head-coach", "Placeholder Head Coach");

  displayTeamProfileFullRoster(team.id);
  displayTeamProfilePlayerStats(team.id);
  initializeTeamProfileTabs();

  overlay.classList.remove("hidden");
}

function getAlphabeticalTeamProfileList() {
  if (!gameState || !Array.isArray(gameState.teams)) return [];

  return [...gameState.teams].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
}

function getCurrentAlphabeticalTeamIndex() {
  const teams = getAlphabeticalTeamProfileList();

  return teams.findIndex(team => Number(team.id) === Number(currentViewedTeamId));
}

function openPreviousTeamProfile() {
  const teams = getAlphabeticalTeamProfileList();

  if (teams.length === 0) return;

  const currentIndex = getCurrentAlphabeticalTeamIndex();
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const previousIndex = safeIndex === 0 ? teams.length - 1 : safeIndex - 1;

  openTeamProfile(teams[previousIndex].id);
}

function openNextTeamProfile() {
  const teams = getAlphabeticalTeamProfileList();

  if (teams.length === 0) return;

  const currentIndex = getCurrentAlphabeticalTeamIndex();
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = safeIndex === teams.length - 1 ? 0 : safeIndex + 1;

  openTeamProfile(teams[nextIndex].id);
}

function renderTeamProfileLogo(team) {
  const logoContainer = document.getElementById("team-profile-logo");

  if (!logoContainer || !team) return;

  const colors = typeof getTeamColors === "function" ? getTeamColors(team) : null;
  const primaryColor = colors ? colors.primaryColor : "#1d4ed8";
  const secondaryColor = colors ? colors.secondaryColor : "#67e8f9";

  logoContainer.style.background = primaryColor;
  logoContainer.style.borderColor = secondaryColor;

  const logoPath = team.logo || team.logoPath || team.image || team.imagePath || team.teamLogo || "";

  if (logoPath) {
    logoContainer.innerHTML = `
      <img src="${logoPath}" alt="${team.name}">
    `;
    return;
  }

  logoContainer.textContent = team.abbrev || getTeamInitials(team.name);
}
function getFormattedTeamConferenceRank(teamId) {
  const rank = Number(getTeamConferenceRank(teamId));

  if (!rank || Number.isNaN(rank)) {
    return "-";
  }

  const suffix = getOrdinalSuffix(rank);
  const team = getTeamById(teamId);
  const conference = team ? team.conference : "";

  return `${rank}${suffix} ${conference}`;
}

function getOrdinalSuffix(number) {
  const value = Number(number);

  if (value % 100 >= 11 && value % 100 <= 13) {
    return "th";
  }

  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function closeTeamProfile() {
  const overlay = document.getElementById("team-profile-overlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }

  currentViewedTeamId = null;
}

function displayTeamProfileStarters(teamId) {
  const container = document.getElementById("team-profile-starters");
  if (!container) return;

  container.innerHTML = "";

  const starters = getProjectedStartersForTeam(teamId);

  for (let slot of starters) {
    const div = document.createElement("div");
    div.className = "team-starter-card";

    if (!slot.player) {
      div.innerHTML = `
        <span>${slot.position}</span>
        <strong>Empty</strong>
      `;
    } else {
      div.innerHTML = `
        <span>${slot.position}</span>
        <strong>
          <span class="clickable-player-name" onclick="openPlayerProfile('${slot.player.id}')">
            ${slot.player.name}
          </span>
        </strong>
        <p>${slot.player.mediaDescription}</p>
      `;
    }

    container.appendChild(div);
  }
}

function getProjectedStartersForTeam(teamId) {
  const roster = [...getRosterByTeamId(teamId)].sort((a, b) => b.currentAbility - a.currentAbility);
  const usedIds = new Set();
  const starters = [];

  for (let position of positions) {
    let player = roster.find(item => {
      const secondaryPositions = Array.isArray(item.secondaryPositions) ? item.secondaryPositions : [];

      return (
        !usedIds.has(item.id) &&
        (item.primaryPosition === position || secondaryPositions.includes(position))
      );
    });

    if (!player) {
      player = roster.find(item => !usedIds.has(item.id));
    }

    if (player) {
      usedIds.add(player.id);
    }

    starters.push({
      position,
      player: player || null
    });
  }

  return starters;
}

function displayTeamProfileFullRoster(teamId) {
  const container = document.getElementById("team-profile-full-roster-list");
  if (!container) return;

  const roster = [...getRosterByTeamId(teamId)].sort((a, b) => {
    return getLeagueRosterPlayerAbility(b) - getLeagueRosterPlayerAbility(a);
  });

  if (roster.length === 0) {
    container.innerHTML = `
      <div class="team-profile-roster-slot-row">
        <span>--</span>
        <strong>No players found for this team.</strong>
      </div>
    `;
    return;
  }

  const projectedLineup = getProjectedLeagueRosterLineup(teamId);
  const usedPlayerIds = new Set();
  const rosterSlots = [];

  for (let lineupSlot of projectedLineup) {
    if (!lineupSlot.player) continue;

    const playerId = getLeagueRosterPlayerId(lineupSlot.player);
    usedPlayerIds.add(playerId);

    rosterSlots.push({
      slot: lineupSlot.slot,
      player: lineupSlot.player
    });
  }

  const remainingPlayers = roster.filter(player => {
    return !usedPlayerIds.has(getLeagueRosterPlayerId(player));
  });

  remainingPlayers.forEach((player, index) => {
    rosterSlots.push({
      slot: String(index + 7),
      player
    });
  });

  container.innerHTML = `
    <div class="team-profile-roster-header-row">
      <span>Slot</span>
      <span>Player</span>
      <span>Age</span>
      <span>Salary</span>
      <span>Yrs</span>
    </div>

    ${rosterSlots.map(item => {
      return renderTeamProfileRosterSlot(item.slot, item.player);
    }).join("")}
  `;
}

function renderTeamProfileRosterSlot(slot, player) {
  if (!player) {
    return `
      <div class="team-profile-roster-slot-row team-profile-roster-expanded-row">
        <span>${slot}</span>
        <strong>—</strong>
        <em>—</em>
        <em>—</em>
        <em>—</em>
      </div>
    `;
  }

  const playerId = player.id || player.playerId;

  return `
    <div class="team-profile-roster-slot-row team-profile-roster-expanded-row">
      <span>${slot}</span>

      <button type="button" onclick="openPlayerProfile('${playerId}')">
        ${escapeLeagueRosterText(player.name)}
      </button>

      <em>${player.age || "—"}</em>
      <em>${formatMoney(player.salary || 0)}</em>
      <em>${player.contractYears || "—"}</em>
    </div>
  `;
}

function displayTeamProfilePlayerStats(teamId) {
  const table = document.getElementById("team-profile-player-stats-table");

  if (!table) return;

  const roster = [...getRosterByTeamId(teamId)].sort((a, b) => {
    return getTeamProfilePlayerStatValue(b, "points") - getTeamProfilePlayerStatValue(a, "points");
  });

  if (roster.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="5">No player stats found for this team.</td>
      </tr>
    `;
    return;
  }

  table.innerHTML = roster.map(player => {
    const playerId = player.id || player.playerId;

    return `
      <tr>
        <td>
          <span class="clickable-player-name" onclick="openPlayerProfile('${playerId}')">
            ${escapeLeagueRosterText(player.name)}
          </span>
        </td>
        <td>${formatTeamProfileStatAverage(player, "points")}</td>
        <td>${formatTeamProfileStatAverage(player, "rebounds")}</td>
        <td>${formatTeamProfileStatAverage(player, "assists")}</td>
        <td>${formatTeamProfileStatAverage(player, "minutes")}</td>
      </tr>
    `;
  }).join("");
}

function getTeamProfilePlayerStatSource(player) {
  if (!player) return {};

  return player.seasonStats || player.stats || player;
}

function getTeamProfilePlayerGames(player) {
  const source = getTeamProfilePlayerStatSource(player);

  return (
    Number(source.games) ||
    Number(source.gamesPlayed) ||
    Number(source.gp) ||
    Number(source.G) ||
    0
  );
}

function getTeamProfilePlayerStatValue(player, statKey) {
  const source = getTeamProfilePlayerStatSource(player);

  const statAliases = {
    points: ["points", "pts", "PTS"],
    rebounds: ["rebounds", "reb", "rpg", "REB"],
    assists: ["assists", "ast", "apg", "AST"],
    minutes: ["minutes", "mins", "mp", "MP"]
  };

  const aliases = statAliases[statKey] || [statKey];

  for (let key of aliases) {
    if (source[key] !== undefined) {
      return Number(source[key]) || 0;
    }
  }

  return 0;
}

function formatTeamProfileStatAverage(player, statKey) {
  const games = getTeamProfilePlayerGames(player);
  const rawValue = getTeamProfilePlayerStatValue(player, statKey);

  if (!games) {
    return "0.0";
  }

  return (rawValue / games).toFixed(1);
}

function initializeTeamProfileTabs() {
  const buttons = document.querySelectorAll(".team-profile-tabs button");

  for (let button of buttons) {
    button.onclick = function() {
      showTeamProfileTab(button.dataset.teamProfileTab);
    };
  }

  showTeamProfileTab("overview");
}

function showTeamProfileTab(tabName) {
  const buttons = document.querySelectorAll(".team-profile-tabs button");
  const panels = document.querySelectorAll(".team-profile-tab-panel");

  for (let button of buttons) {
    if (button.dataset.teamProfileTab === tabName) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  }

  for (let panel of panels) {
    panel.classList.remove("active-team-profile-tab");
  }

  const selectedPanel = document.getElementById(`team-profile-${tabName}-tab`);

  if (selectedPanel) {
    selectedPanel.classList.add("active-team-profile-tab");
  }
}

function displayLeagueRostersBoard() {
  const board = document.getElementById("league-rosters-board");

  if (!board || !gameState || !Array.isArray(gameState.teams)) return;

  board.innerHTML = leagueRosterDivisionOrder.map(division => {
    return renderLeagueRosterDivision(division);
  }).join("");
}

function renderLeagueRosterDivision(division) {
  const teams = gameState.teams.filter(team => {
    return team.hiddenDivision === division.name;
  });

  const conferenceClass = division.conference === "East"
    ? "league-rosters-division-east"
    : "league-rosters-division-west";

  return `
    <section class="league-rosters-division">
      <div class="league-rosters-division-title ${conferenceClass}">
        ${division.name.toUpperCase()} DIVISION
      </div>

      <div class="league-rosters-division-grid">
        ${teams.map(team => renderLeagueRosterTeamCard(team)).join("")}
      </div>
    </section>
  `;
}

function getLeagueRosterTeamColor(team) {
  if (!team) return "#1d4ed8";

  return (
    team.primaryColor ||
    team.primary ||
    team.color ||
    team.teamColor ||
    team.mainColor ||
    team.backgroundColor ||
    team.colors?.primaryColor ||
    team.colors?.primary ||
    team.colors?.main ||
    "#1d4ed8"
  );
}

function getLeagueRosterTeamSecondaryColor(team) {
  if (!team) return "#06122d";

  return (
    team.secondaryColor ||
    team.secondary ||
    team.colors?.secondaryColor ||
    team.colors?.secondary ||
    team.accentColor ||
    "#06122d"
  );
}

function renderLeagueRosterTeamCard(team) {
  const lineup = getProjectedLeagueRosterLineup(team.id);

  const primaryColor = getLeagueRosterTeamColor(team);
  const textColor = getReadableTextColorForRosterHeader(primaryColor);

  return `
    <div class="league-roster-team-card">
      <button
        type="button"
        class="league-roster-team-header clickable-league-roster-team"
        style="
          background-color: ${primaryColor} !important;
          color: ${textColor} !important;
        "
        onclick="openTeamProfile(${team.id})"
      >
        ${escapeLeagueRosterText(team.name)}
      </button>

      <div class="league-roster-player-list">
        ${lineup.map(item => {
          return `
            <div class="league-roster-player-row">
              <span>${item.slot}</span>
              ${renderLeagueRosterPlayerName(item.player)}
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}


function renderLeagueRosterPlayerName(player) {
  if (!player) {
    return `<strong>—</strong>`;
  }

  const playerId = player.id || player.playerId;

  return `
    <button
      type="button"
      class="league-roster-player-name-button"
      onclick="openPlayerProfile('${playerId}')"
    >
      ${escapeLeagueRosterText(player.name)}
    </button>
  `;
}

function getProjectedLeagueRosterLineup(teamId) {
  const roster = [...getRosterByTeamId(teamId)]
    .sort((a, b) => getLeagueRosterPlayerAbility(b) - getLeagueRosterPlayerAbility(a));

  const usedPlayerIds = new Set();
  const lineup = [];

  const positionsToFill = ["PG", "SG", "SF", "PF", "C"];

  for (let position of positionsToFill) {
    let player = roster.find(item => {
      return !usedPlayerIds.has(getLeagueRosterPlayerId(item)) &&
        leagueRosterPlayerCanPlayPosition(item, position);
    });

    if (!player) {
      player = roster.find(item => {
        return !usedPlayerIds.has(getLeagueRosterPlayerId(item));
      });
    }

    if (player) {
      usedPlayerIds.add(getLeagueRosterPlayerId(player));
    }

    lineup.push({
      slot: position,
      player
    });
  }

  const sixthMan = roster.find(player => {
    return !usedPlayerIds.has(getLeagueRosterPlayerId(player));
  });

  if (sixthMan) {
    usedPlayerIds.add(getLeagueRosterPlayerId(sixthMan));
  }

  lineup.push({
    slot: "6",
    player: sixthMan || null
  });

  return lineup;
}

function leagueRosterPlayerCanPlayPosition(player, position) {
  const positions = getLeagueRosterPlayerPositions(player);

  return positions.includes(position);
}

function getLeagueRosterPlayerPositions(player) {
  const positions = [];

  if (!player) return positions;

  if (player.primaryPosition) {
    positions.push(player.primaryPosition);
  }

  if (Array.isArray(player.secondaryPositions)) {
    positions.push(...player.secondaryPositions);
  }

  if (player.secondaryPosition) {
    positions.push(player.secondaryPosition);
  }

  if (Array.isArray(player.positions)) {
    positions.push(...player.positions);
  }

  if (player.position) {
    String(player.position)
      .split("/")
      .forEach(position => positions.push(position.trim()));
  }

  return [...new Set(positions.filter(Boolean))];
}

function getLeagueRosterPlayerAbility(player) {
  if (!player) return 0;

  return (
    Number(player.currentAbility) ||
    Number(player.ca) ||
    Number(player.CA) ||
    Number(player.overall) ||
    0
  );
}

function getLeagueRosterPlayerId(player) {
  if (!player) return "";

  return String(player.id || player.playerId || player.name);
}

function getReadableTextColorForRosterHeader(hexColor) {
  if (!hexColor || typeof hexColor !== "string") return "#ffffff";

  const cleanHex = hexColor.replace("#", "");

  if (cleanHex.length !== 6) return "#ffffff";

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155 ? "#06122d" : "#ffffff";
}

function escapeLeagueRosterText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensurePowerRankingsState() {
  if (!gameState.powerRankings) {
    gameState.powerRankings = {
      lastUpdated: null,
      rankings: []
    };
  }
}

function displayPowerRankings() {
  ensurePowerRankingsState();

  const board = document.getElementById("power-rankings-board");
  const updatedLabel = document.getElementById("power-rankings-updated-label");

  if (!board || !gameState || !Array.isArray(gameState.teams)) return;

  if (shouldUpdatePowerRankings()) {
    updatePowerRankingsSnapshot();
  }

  if (!gameState.powerRankings.rankings || gameState.powerRankings.rankings.length === 0) {
    updatePowerRankingsSnapshot();
  }

  if (updatedLabel) {
    updatedLabel.textContent = gameState.powerRankings.lastUpdated
      ? `Last updated ${formatDate(new Date(gameState.powerRankings.lastUpdated))} · Updates every Sunday`
      : "Updates every Sunday";
  }

  const rankings = gameState.powerRankings.rankings || [];
  const groups = [
    rankings.slice(0, 10),
    rankings.slice(10, 20),
    rankings.slice(20, 30)
  ];

  board.innerHTML = groups.map(group => {
    return `
      <div class="power-rankings-column">
        ${group.map(item => renderPowerRankingRow(item)).join("")}
      </div>
    `;
  }).join("");
}

function shouldUpdatePowerRankings() {
  ensurePowerRankingsState();

  if (!gameState.currentDate) return false;

  const currentDate = new Date(gameState.currentDate);
  const currentDateKey = getPowerRankingDateKey(currentDate);
  const lastUpdatedKey = gameState.powerRankings.lastUpdated
    ? getPowerRankingDateKey(new Date(gameState.powerRankings.lastUpdated))
    : null;

  const isSunday = currentDate.getDay() === 0;

  if (!gameState.powerRankings.lastUpdated) {
    return true;
  }

  return isSunday && currentDateKey !== lastUpdatedKey;
}

function updatePowerRankingsSnapshot() {
  ensurePowerRankingsState();

  const rankings = [...gameState.teams]
    .sort((a, b) => {
      const winPctDifference = getTeamPowerRankingWinPct(b) - getTeamPowerRankingWinPct(a);

      if (winPctDifference !== 0) {
        return winPctDifference;
      }

      if ((b.wins || 0) !== (a.wins || 0)) {
        return (b.wins || 0) - (a.wins || 0);
      }

      return getTeamPowerRankingStrength(b) - getTeamPowerRankingStrength(a);
    })
    .map((team, index) => {
      return {
        rank: index + 1,
        teamId: team.id,
        teamName: team.name,
        abbrev: team.abbrev,
        wins: team.wins || 0,
        losses: team.losses || 0
      };
    });

  gameState.powerRankings = {
    lastUpdated: new Date(gameState.currentDate).toISOString(),
    rankings
  };
}

function renderPowerRankingRow(item) {
  const team = getTeamById(item.teamId);
  const colors = typeof getTeamColors === "function" ? getTeamColors(team) : null;
  const displayName = getPowerRankingDisplayName(team);
  const primaryColor = colors ? colors.primaryColor : "#1d4ed8";
  const secondaryColor = colors ? colors.secondaryColor : "#67e8f9";
  const textColor = getReadableTextColorForRosterHeader(primaryColor);
  const logo = renderPowerRankingTeamLogo(team, primaryColor, secondaryColor);

  return `
    <button
  class="power-ranking-row"
  style="
    --team-primary:${getTeamPrimaryColorSafe(team)};
    --team-secondary:${getTeamSecondaryColorSafe(team)};
    --team-text:${getTeamTextColorSafe(team)};
  "
  onclick="openTeamProfile(${team.id})"
>
      <span class="power-ranking-number">${item.rank}</span>

      <span class="power-ranking-name">
        ${escapeLeagueRosterText(displayName)}
      </span>

      <span class="power-ranking-record">
        ${item.wins}-${item.losses}
      </span>

      ${logo}
    </button>
  `;
}

function renderPowerRankingTeamLogo(team, primaryColor, secondaryColor) {
  if (!team) {
    return `
      <span class="power-ranking-logo" style="background: ${primaryColor}; border-color: ${secondaryColor};">
        TM
      </span>
    `;
  }

  const logoPath = team.logo || team.logoPath || team.image || team.imagePath || team.teamLogo || "";

  if (logoPath) {
    return `
      <span class="power-ranking-logo" style="background: ${primaryColor}; border-color: ${secondaryColor};">
        <img src="${logoPath}" alt="${team.name}">
      </span>
    `;
  }

  return `
    <span class="power-ranking-logo" style="background: ${primaryColor}; border-color: ${secondaryColor};">
      ${team.abbrev || getTeamInitials(team.name)}
    </span>
  `;
}

function getTeamPowerRankingWinPct(team) {
  const wins = Number(team.wins || 0);
  const losses = Number(team.losses || 0);
  const games = wins + losses;

  if (!games) return 0;

  return wins / games;
}

function getTeamPowerRankingStrength(team) {
  if (!team) return 0;

  return Number(team.teamStrength || 0);
}

function getPowerRankingDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getPowerRankingDisplayName(team) {
  if (!team || !team.name) return "Team";

  const nameParts = team.name.trim().split(" ");
  return nameParts[nameParts.length - 1];
}

function displayStandings() {
  displayConferenceStandings("East", "east-standings-table");
  displayConferenceStandings("West", "west-standings-table");
  displayStandingsZoneKey();
}

function displayConferenceStandings(conference, tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  table.innerHTML = "";

  const teams = getConferenceStandings(conference);
  const bottomThreeIds =
    typeof getLeagueBottomThreeTeamIds === "function"
      ? getLeagueBottomThreeTeamIds()
      : [];

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];

    let className = "";

    if (i < 6) {
      className = "playoff-team";
    } else if (i < 10) {
      className = "play-in-team";
    }

    const isRelegationTeam = bottomThreeIds.includes(Number(team.id));
    const isUserTeam = Number(team.id) === Number(gameState.selectedTeamId);
    const userStar = isUserTeam ? `<span class="standings-user-star">★</span>` : "";

    const row = `
      <tr class="${isRelegationTeam ? "league-standings-relegation-row" : ""}">
        <td>${i + 1}</td>
        <td>
          <button
            type="button"
            class="standings-team-button ${className} ${isRelegationTeam ? "relegation-team" : ""}"
            onclick="openTeamProfile(${team.id})"
          >
            ${team.name}${userStar}
          </button>
        </td>
        <td>${team.wins}</td>
        <td>${team.losses}</td>
        <td>${getWinPercentage(team)}</td>
      </tr>
    `;

    table.innerHTML += row;
  }
}

function displayStandingsZoneKey() {
  const existingKey = document.getElementById("standings-zone-key");

  if (existingKey) {
    existingKey.remove();
  }

  const eastTable = document.getElementById("east-standings-table");
  const westTable = document.getElementById("west-standings-table");

  if (!eastTable && !westTable) return;

  const parent =
    document.querySelector(".standings-layout") ||
    document.querySelector(".league-standings-layout") ||
    eastTable.closest(".standings-card")?.parentElement ||
    westTable.closest(".standings-card")?.parentElement ||
    eastTable.parentElement?.parentElement;

  if (!parent) return;

  const key = document.createElement("div");
  key.id = "standings-zone-key";
  key.className = "standings-zone-key";

  key.innerHTML = `
    <div>
      <span class="standings-key-dot playoff"></span>
      <strong>1-6</strong>
      <p>Playoffs</p>
    </div>

    <div>
      <span class="standings-key-dot playin"></span>
      <strong>7-10</strong>
      <p>Play-In</p>
    </div>

    <div>
      <span class="standings-key-dot relegation"></span>
      <strong>Bottom 3</strong>
      <p>Relegation Zone</p>
    </div>
  `;

  parent.appendChild(key);
}

function getLeagueStandingsZoneClass(team, conferenceRank) {
  if (!team || !gameState || !Array.isArray(gameState.teams)) return "";

  const totalGamesPlayed = gameState.teams.reduce((sum, item) => {
    return sum + Number(item.wins || 0) + Number(item.losses || 0);
  }, 0);

  // Do not show a fake bottom three when every team is 0-0.
  if (totalGamesPlayed <= 0) return "";

  const bottomThreeIds = getLeagueBottomThreeTeamIds();

  if (bottomThreeIds.includes(Number(team.id))) {
    return "relegation-zone";
  }

  return "";
}

function getWinPercentage(team) {
  const gamesPlayed = team.wins + team.losses;

  if (gamesPlayed === 0) return ".000";

  return (team.wins / gamesPlayed).toFixed(3).replace("0", "");
}

function getTeamPrimaryColorSafe(team) {
  return (
    team?.primaryColor ||
    team?.primary ||
    team?.color ||
    team?.colors?.primary ||
    "#1d4ed8"
  );
}

function getTeamSecondaryColorSafe(team) {
  return (
    team?.secondaryColor ||
    team?.secondary ||
    team?.colors?.secondary ||
    "#06122d"
  );
}

function getTeamTextColorSafe(team) {
  return (
    team?.textColor ||
    team?.colors?.text ||
    "#ffffff"
  );
}
