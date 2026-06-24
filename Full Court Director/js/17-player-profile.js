function openPlayerProfile(playerId, keepPreviousContext = false) {
  const result = findPlayerById(playerId);

  if (!result) {
    addInboxMessage("Player Not Found", "That player could not be opened.", "staff");
    refreshAll();
    return;
  }

  if (!keepPreviousContext) {
    previousMainSectionBeforePlayerProfile = currentMainSection;
    previousSecondaryScreenBeforePlayerProfile = currentSecondaryScreen;
    playerProfileContext = getPlayerProfileContextForResult(result);
  } else {
    playerProfileContext = getPlayerProfileContextForResult(result);
  }

  currentProfilePlayerId = playerId;

  const player = result.player;
  const team = result.team;
  const role = result.freeAgent ? "Free Agent" : getPlayerRole(player.id);
  const stats = player.seasonStats || createEmptySeasonStats();

  ensurePlayerEnergy(player);
  ensurePlayerInjuryFields(player);

  setText("profile-player-name", player.name);
  setText("profile-player-subtitle", `${player.primaryPosition}${player.secondaryPosition ? ` / ${player.secondaryPosition}` : ""} | ${player.playerType || "Player"}`);

  setText("profile-team", team ? team.name : "Free Agent");
  setText("profile-age", player.age);
  setText("profile-position", player.primaryPosition);
  setText("profile-secondary-positions", player.secondaryPositions && player.secondaryPositions.length > 0 ? player.secondaryPositions.join(" / ") : player.secondaryPosition || "None");
  setText("profile-height", player.height);
  setText("profile-weight", `${player.weight} lbs`);
  setText("profile-country", player.country || player.nationality || "-");
  setText("profile-college", player.collegeOrClub || "-");
  setText("profile-draft-info", `${player.draftYear || "-"}: ${player.draftPick || "-"}`);
  setText("profile-years-pro", player.yearsPro);
  setText("profile-handedness", player.handedness || "-");

  setText("profile-energy", `${Math.round(player.energy)} / 100`);
  setText("profile-availability", getPlayerAvailabilityLabel(player));
  setText("profile-fitness-status", getPlayerAvailabilityLabel(player));
  setText("profile-injury-name", player.injuryName || "None");
  setText("profile-injury-time", player.injuryDaysRemaining > 0 ? `${player.injuryDaysRemaining} days` : "--");

  setText("profile-role", role);
  setText("profile-expected-role", role);
  setText("profile-morale", player.morale || "Neutral");
  setText("profile-morale-summary", `${player.name} currently feels ${player.morale || "Neutral"}.`);

  setText("profile-contract", player.contract || "Free Agent");
  setText("profile-salary", result.freeAgent ? "Free Agent" : formatMoney(player.salary));
  setText("profile-contract-years", result.freeAgent ? "-" : player.contractYears);
  setText("profile-expected-salary", formatMoney(player.expectedSalary || estimateExpectedSalary(player)));
  setText("profile-expected-years", player.expectedYears || estimateExpectedYears(player));
  setText("profile-interest", result.freeAgent ? (player.interest || "Neutral") : "-");

  setText("profile-scouting-bio", getPlayerScoutingBio(player));
  setText("profile-social-followers", getPlayerSocialFollowers(player));

  renderPlayerProfilePortrait(player);
  renderPlayerTeamLogo(result);
  applyPlayerJerseyCard(player, team, result.freeAgent);
  ensurePlayerSeasonStatsHistory(player);
  renderPlayerProfileSeasonStatsTable(player, team, result.freeAgent);

  setText("profile-stat-games", stats.games);
  setText("profile-stat-starts", stats.gamesStarted);
  setText("profile-stat-minutes", getAverage(stats.minutes, stats.games));
  setText("profile-stat-points", getAverage(stats.points, stats.games));
  setText("profile-stat-rebounds", getAverage(stats.rebounds, stats.games));
  setText("profile-stat-assists", getAverage(stats.assists, stats.games));
  setText("profile-stat-steals", getAverage(stats.steals, stats.games));
  setText("profile-stat-blocks", getAverage(stats.blocks, stats.games));
  setText("profile-stat-turnovers", getAverage(stats.turnovers, stats.games));
  setText("profile-stat-fg", getPercentage(stats.fieldGoalsMade, stats.fieldGoalsAttempted));
  setText("profile-stat-three", getPercentage(stats.threePointersMade, stats.threePointersAttempted));
  setText("profile-stat-ft", getPercentage(stats.freeThrowsMade, stats.freeThrowsAttempted));

  updatePlayerProfileActionButtons(result);
  showPlayerProfileTab("stats");

  showSecondaryScreen("player-profile-screen");
    syncPlayerProfileScreenPosition();

    const playerScreen = document.getElementById("player-profile-screen");

    if (playerScreen) {
      playerScreen.scrollTop = 0;
    }

    window.scrollTo(0, 0);
}

function closePlayerProfile() {
  const actionsMenu = document.getElementById("player-actions-menu");

  if (actionsMenu) {
    actionsMenu.classList.add("hidden");
  }

  currentProfilePlayerId = null;

  if (previousMainSectionBeforePlayerProfile) {
    currentMainSection = previousMainSectionBeforePlayerProfile;
    renderSecondaryNav(currentMainSection);
  }

  const screenToReturnTo =
    previousSecondaryScreenBeforePlayerProfile ||
    navigationSections[currentMainSection]?.defaultScreen ||
    "dashboard-screen";

  showSecondaryScreen(screenToReturnTo);

  previousMainSectionBeforePlayerProfile = null;
  previousSecondaryScreenBeforePlayerProfile = null;
}

function getPlayerProfileContextForResult(result) {
  if (!result || !result.player) {
    return {
      source: null,
      teamId: null,
      playerIds: [],
      currentIndex: 0
    };
  }

  if (result.freeAgent) {
    const freeAgents = (gameState.freeAgents || [])
      .filter(player => !freeAgencyPositionFilter || player.primaryPosition === freeAgencyPositionFilter);

    const playerIds = freeAgents.map(player => player.id);
    const currentIndex = playerIds.findIndex(id => Number(id) === Number(result.player.id));

    return {
      source: "free-agency",
      teamId: null,
      playerIds,
      currentIndex: Math.max(0, currentIndex)
    };
  }

  const roster = getRosterByTeamId(result.teamId) || [];
  const playerIds = roster.map(player => player.id);
  const currentIndex = playerIds.findIndex(id => Number(id) === Number(result.player.id));

  return {
    source: "team",
    teamId: result.teamId,
    playerIds,
    currentIndex: Math.max(0, currentIndex)
  };
}

function openPreviousProfilePlayer() {
  if (!playerProfileContext || playerProfileContext.playerIds.length === 0) return;

  let nextIndex = playerProfileContext.currentIndex - 1;

  if (nextIndex < 0) {
    nextIndex = playerProfileContext.playerIds.length - 1;
  }

  const nextPlayerId = playerProfileContext.playerIds[nextIndex];

  openPlayerProfile(nextPlayerId, true);
}

function openNextProfilePlayer() {
  if (!playerProfileContext || playerProfileContext.playerIds.length === 0) return;

  let nextIndex = playerProfileContext.currentIndex + 1;

  if (nextIndex >= playerProfileContext.playerIds.length) {
    nextIndex = 0;
  }

  const nextPlayerId = playerProfileContext.playerIds[nextIndex];

  openPlayerProfile(nextPlayerId, true);
}

function updatePlayerProfileActionButtons(result) {
  const releaseButton = document.getElementById("profile-release-button");
  const extensionButton = document.getElementById("profile-extension-button");
  const signButton = document.getElementById("profile-sign-button");

  if (!releaseButton || !extensionButton || !signButton) return;

  releaseButton.classList.add("hidden");
  extensionButton.classList.add("hidden");
  signButton.classList.add("hidden");

  releaseButton.onclick = null;
  extensionButton.onclick = null;
  signButton.onclick = null;

  const selectedTeam = getSelectedTeam();

  if (!selectedTeam || !result || !result.player) return;

  const player = result.player;

  if (result.freeAgent) {
    signButton.classList.remove("hidden");

    signButton.onclick = function() {
      if (typeof signFreeAgent === "function") {
        signFreeAgent(player.id);
      } else {
        addInboxMessage("Signing Not Ready", "Free agent signing is not built yet.", "staff");
        refreshAll();
      }
    };

    return;
  }

  if (Number(result.teamId) === Number(selectedTeam.id)) {
    releaseButton.classList.remove("hidden");
    extensionButton.classList.remove("hidden");

    releaseButton.onclick = function() {
      releasePlayerFromTeam(player.id);
    };
  }
}

function getAllProfileAttributeDefinitions() {
  return [
    ...attributeGroups.offense,
    ...attributeGroups.defense,
    ...attributeGroups.physicalMental
  ].slice(0, 40);
}

function getPlayerAttributeValue(player, key) {
  if (!player || !player.attributes) return 10;

  const directValue = player.attributes[key];

  if (directValue !== undefined && directValue !== null && directValue !== "") {
    return Number(directValue);
  }

  const aliases = {
    closeShot: ["finishing"],
    screenUsage: ["screenSetting"],
    defensiveIQ: ["helpDefenseIQ", "helpDefense"],
    screenNavigation: ["closeouts"],
    agility: ["speed", "acceleration"],
    basketballIQ: ["passPerception"],
    competitiveness: ["hustle"],
    touch: ["finishing", "freeThrow"],
    foulDrawing: ["finishing"],
    postDefense: ["interiorDefense"],
    helpDefense: ["helpDefenseIQ"],
    closeouts: ["perimeterDefense"]
  };

  const possibleKeys = aliases[key] || [];

  for (let aliasKey of possibleKeys) {
    const value = player.attributes[aliasKey];

    if (value !== undefined && value !== null && value !== "") {
      return Number(value);
    }
  }

  return 10;
}

function renderFullAttributeGrid(player) {
  const container = document.getElementById("profile-all-attributes");
  if (!container || !player) return;

  container.innerHTML = "";

  const attributes = getAllProfileAttributeDefinitions();

  for (let attribute of attributes) {
    const value = getPlayerAttributeValue(player, attribute.key);

    const card = document.createElement("div");
    card.className = "player-attribute-card";

    card.innerHTML = `
      <span>${attribute.label}</span>
      <strong class="${getAttributeClass(value)}">${value}</strong>
      <small>—</small>
    `;

    container.appendChild(card);
  }
}

function ensurePlayerSeasonStatsHistory(player) {
  if (!player) return {};

  if (!player.seasonStatsHistory || typeof player.seasonStatsHistory !== "object" || Array.isArray(player.seasonStatsHistory)) {
    player.seasonStatsHistory = {};
  }

  return player.seasonStatsHistory;
}

function renderPlayerProfileSeasonStatsTable(player, team, freeAgent = false) {
  const tbody = document.getElementById("profile-season-stats-table-body");

  if (!tbody || !player) return;

  const stats = player.seasonStats || createEmptySeasonStats();
  const games = Number(stats.games || 0);
  const teamLabel = freeAgent ? "Free Agent" : getPlayerProfileTeamStatLabel(team);
  const seasonLabel = gameState?.seasonLabel || getSeasonLabel(gameState?.seasonStartYear || 2026);

  tbody.innerHTML = `
    <tr>
      <td>${escapePlayerProfileHtml(seasonLabel)}</td>
      <td>${escapePlayerProfileHtml(teamLabel)}</td>
      <td>${games}</td>
      <td>${getAverage(stats.minutes || 0, games)}</td>
      <td>${getAverage(stats.points || 0, games)}</td>
      <td>${getAverage(stats.rebounds || 0, games)}</td>
      <td>${getAverage(stats.assists || 0, games)}</td>
      <td>${getAverage(stats.steals || 0, games)}</td>
      <td>${getAverage(stats.blocks || 0, games)}</td>
      <td>${getPercentage(stats.fieldGoalsMade || 0, stats.fieldGoalsAttempted || 0)}</td>
      <td>${getPercentage(stats.threePointersMade || 0, stats.threePointersAttempted || 0)}</td>
      <td>${getPercentage(stats.freeThrowsMade || 0, stats.freeThrowsAttempted || 0)}</td>
    </tr>
  `;
}

function renderPlayerProfilePortrait(player) {
  const portraitWrap = document.getElementById("profile-player-portrait");
  const portraitImg = document.getElementById("profile-player-portrait-img");
  const imagePath = typeof getPlayerPortraitPath === "function"
    ? getPlayerPortraitPath(player)
    : "";
  const finalPath = imagePath || "images/players/default-silhouette.png";

  if (portraitWrap) {
    portraitWrap.classList.toggle("missing-silhouette", !imagePath);
  }

  if (portraitImg) {
    portraitImg.style.display = "";
    portraitImg.src = finalPath;
    portraitImg.alt = `${player?.name || "Player"} portrait`;
  }

  const overlayPortrait = document.getElementById("profile-player-initials");

  if (overlayPortrait) {
    overlayPortrait.innerHTML = imagePath
      ? `<img src="${escapePlayerProfileHtml(finalPath)}" alt="${escapePlayerProfileHtml(player?.name || "Player")} portrait" onerror="this.remove();">`
      : "";
  }
}

function getPlayerProfileTeamStatLabel(team) {
  if (!team) return "-";

  if (team.city || team.market || team.location) {
    return team.city || team.market || team.location;
  }

  if (typeof getGameplanCardTeamNameParts === "function") {
    return getGameplanCardTeamNameParts(team).city || team.name || "-";
  }

  return String(team.name || "-").split(" ")[0] || "-";
}

function escapePlayerProfileHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showPlayerProfileTab(tabName) {
  const tabs = document.querySelectorAll(".player-profile-tab");

  for (let tab of tabs) {
    tab.classList.remove("active");
  }

  const selectedTab = document.getElementById(`player-profile-tab-${tabName}`);

  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  const buttons = document.querySelectorAll(".player-page-tabs button");

  for (let button of buttons) {
    button.classList.remove("active");
  }

  const matchingButton = Array.from(buttons).find(button =>
    button.textContent.trim().toLowerCase() === tabName.toLowerCase()
  );

  if (matchingButton) {
    matchingButton.classList.add("active");
  }
}

function togglePlayerActionsMenu() {
  const menu = document.getElementById("player-actions-menu");

  if (menu) {
    menu.classList.toggle("hidden");
  }
}

function getPlayerScoutingBio(player) {
  if (!player) return "No scouting summary available.";

  const position = player.primaryPosition || "player";
  const type = player.playerType || "basketball player";
  const description = player.mediaDescription || "rotation-level contributor";

  return `${player.name} is a ${description.toLowerCase()} ${position} who profiles as a ${type.toLowerCase()}. His value comes from his current skill set, development outlook, and fit within the team structure.`;
}

function getPlayerSocialFollowers(player) {
  const marketability = Number(player.marketability || 10);
  const currentAbility = Number(player.currentAbility || 400);
  const potentialAbility = Number(player.potentialAbility || currentAbility);

  const followers = Math.round((marketability * 40000) + (currentAbility * 900) + (potentialAbility * 500));

  if (followers >= 1000000) {
    return `${(followers / 1000000).toFixed(1)}M`;
  }

  if (followers >= 1000) {
    return `${Math.round(followers / 1000)}K`;
  }

  return String(followers);
}

function getJerseySalesRank(player) {
  if (!player || !gameState) return "--";

  const allPlayers = [];

  for (let teamId in gameState.rosters) {
    for (let rosterPlayer of gameState.rosters[teamId]) {
      allPlayers.push(rosterPlayer);
    }
  }

  allPlayers.sort((a, b) => {
    const scoreA = Number(a.currentAbility || 0) + Number(a.potentialAbility || 0);
    const scoreB = Number(b.currentAbility || 0) + Number(b.potentialAbility || 0);

    return scoreB - scoreA;
  });

  const index = allPlayers.findIndex(item =>
    Number(item.id) === Number(player.id) ||
    Number(item.playerId) === Number(player.playerId)
  );

  return index >= 0 ? `#${index + 1} in league` : "--";
}

function renderPlayerTeamLogo(result) {
  const logoSpot = document.getElementById("profile-team-logo");

  if (!logoSpot) return;

  if (result.freeAgent) {
    logoSpot.innerHTML = `
      <div class="team-logo-placeholder team-logo-large team-logo-empty">
        NHA
      </div>
    `;
    return;
  }

  logoSpot.innerHTML = getTeamLogoHTML(
    result.team,
    "team-logo-placeholder team-logo-large"
  );
}

function applyPlayerJerseyCard(player, team, freeAgent) {
  const jerseyCard = document.getElementById("profile-jersey-card");
  const jerseyName = document.getElementById("profile-jersey-name");
  const jerseyNumber = document.getElementById("profile-jersey-number");
  const jerseyBackground = document.getElementById("profile-jersey-background");
  const jerseySalesRank = document.getElementById("profile-jersey-sales-rank");

  const number = player && player.jerseyNumber !== undefined && player.jerseyNumber !== null
    ? String(player.jerseyNumber)
    : "00";

  if (jerseyName) {
    jerseyName.textContent = player ? player.name.split(" ").slice(-1)[0].toUpperCase() : "PLAYER";
  }

  if (jerseyNumber) {
    jerseyNumber.textContent = number;
  }

  if (jerseyBackground) {
    jerseyBackground.textContent = number;
  }

  if (jerseySalesRank) {
    jerseySalesRank.textContent = freeAgent
      ? "Jersey Sales Rank: Free Agent"
      : `Jersey Sales Rank: ${getJerseySalesRank(player)}`;
  }

  if (jerseyCard) {
    const primary = team && team.primaryColor ? team.primaryColor : "#7f1d1d";
    const secondary = team && team.secondaryColor ? team.secondaryColor : "#f8fafc";

    jerseyCard.style.background = `linear-gradient(180deg, ${primary}, #111827)`;
    jerseyCard.style.color = secondary;
    jerseyCard.style.borderColor = primary;
  }
}

function syncPlayerProfileScreenPosition() {
  const screen = document.getElementById("player-profile-screen");
  const sidebar = document.querySelector(".sidebar");

  if (!screen) return;

  let left = 0;
  let top = 0;

  if (sidebar) {
    const sidebarBox = sidebar.getBoundingClientRect();
    left = sidebarBox.right;
  }

  screen.style.setProperty("--player-screen-left", `${left}px`);
  screen.style.setProperty("--player-screen-top", `${top}px`);
}

window.addEventListener("resize", function() {
  const playerScreen = document.getElementById("player-profile-screen");

  if (playerScreen && playerScreen.classList.contains("active-screen")) {
    syncPlayerProfileScreenPosition();
  }
});

function getPlayerInitials(name) {
  return String(name || "Player")
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function renderAttributeList(elementId, attributesList, attributes) {
  const container = document.getElementById(elementId);
  if (!container) return;

  container.innerHTML = "";

  for (let attribute of attributesList) {
    const value = attributes[attribute.key] || 1;

    const row = document.createElement("div");
    row.className = "attribute-row";

    row.innerHTML = `
      <span class="attribute-name">${attribute.label}</span>
      <span class="attribute-value ${getAttributeClass(value)}">${value}</span>
    `;

    container.appendChild(row);
  }
}

function getAttributeClass(value) {
  const rating = Number(value) || 0;

  if (rating >= 17) return "attr-green";
  if (rating >= 12) return "attr-gray";
  if (rating >= 7) return "attr-yellow";
  return "attr-red";
}
