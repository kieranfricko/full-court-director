let tradeRoom = {
  teams: [],
  assets: [],
  leakRisk: 0,
  callActive: false,
  incomingGmCall: null,
  gmCallLog: [],
  incomingTradePackages: [],
  boardDeals: [],
  activeBoardDealId: null
};

let tradePhoneBuilderOverlayState = null;

function initializeTradeCenter() {
  if (!gameState || !gameState.started) return;

  const userTeam = getSelectedTeam();

  if (!userTeam) return;

  if (
    !tradeRoom.teams ||
    tradeRoom.teams.length === 0
  ) {
    tradeRoom.teams = [
      {
        teamId: userTeam.id,
        locked: true
      }
    ];
  }

  updateTradeRoomHeader();
  renderTradeRoom();
  renderTradeBoardScreen();
}

function updateTradeRoomHeader() {
  setText(
    "trade-room-date",
    formatDate(gameState.currentDate)
  );

  setText(
    "trade-room-team-count",
    `${tradeRoom.teams.length}`
  );

  setText(
    "trade-room-leak-risk",
    `${tradeRoom.leakRisk}%`
  );

  const daysUntilDeadline =
    getDaysUntilTradeDeadline();

  const deadlineText =
    daysUntilDeadline > 30
      ? "Open"
      : daysUntilDeadline > 15
      ? `${daysUntilDeadline} Days`
      : daysUntilDeadline > 5
      ? `Warning (${daysUntilDeadline})`
      : `URGENT (${daysUntilDeadline})`;

  setText(
    "trade-room-deadline",
    deadlineText
  );
  updateTradeLegalStatus();
}

function getDaysUntilTradeDeadline() {
  return 45;
}

function createAddTeamCard() {
  const card = document.createElement("div");

  card.className = "trade-room-add-card";

  card.innerHTML = `
    <div class="trade-room-add-inner">
      Add Another Team
    </div>
  `;

  card.onclick = openTradeAddTeamMenu;

  return card;
}

function renderTradeRoom() {
  const container =
    document.getElementById("trade-room-grid");

  if (!container) return;

  container.innerHTML = "";
  container.className = `trade-room-grid teams-${tradeRoom.teams.length}`;

  for (const tradeTeam of tradeRoom.teams) {
    container.appendChild(
      createTradeTeamCard(tradeTeam)
    );
  }

  if (tradeRoom.teams.length < 4) {
    container.appendChild(
      createAddTeamCard()
    );
  }
}

function createTradeTeamCard(teamId) {
  const team = gameState.teams.find(t => Number(t.id) === Number(teamId));
  const roster = getRosterByTeamId(teamId);

  const card = document.createElement("div");
  card.className = "trade-room-team-card";

  card.innerHTML = `
    <div class="trade-room-team-header">
      <h3>${team.name}</h3>
      <span>Payroll: ${formatMoney(getRosterPayroll(teamId))}</span>
    </div>

    <div class="trade-room-direction-box">
      <div>
        <strong>Outgoing</strong>
        <div id="outgoing-${teamId}">
          ${renderTradeOutgoingAssets(teamId)}
        </div>
      </div>

      <div>
        <strong>Incoming</strong>
        <div id="incoming-${teamId}">
          ${renderTradeIncomingAssets(teamId)}
        </div>
      </div>
    </div>

    <div class="trade-room-roster">
      ${roster.map(player => renderTradeRoomPlayerRow(player, teamId)).join("")}
    </div>
  `;

  return card;
}

function setTradeTeamTab(teamId, tabName) {
  const tradeTeam = tradeRoom.teams.find(item =>
    Number(item.teamId) === Number(teamId)
  );

  if (!tradeTeam) return;

  tradeTeam.activeTab = tabName;
  renderTradeRoom();
}

function renderTradeTeamTabBody(teamId, activeTab) {
  if (activeTab === "picks") {
    return renderTradeTeamPicksTab(teamId);
  }

  if (activeTab === "exceptions") {
    return renderTradeTeamExceptionsTab(teamId);
  }

  return renderTradeTeamRosterTab(teamId);
}

function renderTradeTeamRosterTab(teamId) {
  const roster = getRosterByTeamId(teamId);

  return `
    <div class="trade-room-roster">
      ${roster.map(player => renderTradeRoomPlayerRow(player, teamId)).join("")}
    </div>
  `;
}

function renderTradeTeamPicksTab(teamId) {
  const picks = getTradePicksForTeam(teamId);

  return `
    <div class="trade-picks-list">
      ${picks.map(pick => {
        const asset = getTradeAssetForPick(pick.id);
        const destinationTeam = asset ? getTeamById(asset.toTeamId) : null;

        return `
          <div
            class="trade-pick-row ${asset ? "pick-in-trade" : ""}"
            onclick="openSendPickModal('${pick.id}', '${teamId}')"
          >
            <div>
              <strong>${getTradePickLabel(pick)}</strong>
              <span>${getTradePickSubtext(pick)}</span>
            </div>

            <em>
              ${asset && destinationTeam ? `
                <em>To ${destinationTeam.name}</em>
              ` : ""}
            </em>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderTradeTeamExceptionsTab(teamId) {
  return `
    <div class="trade-exceptions-list">
      <div class="trade-exception-row">
        <strong>Trade Exception</strong>
        <span>None available</span>
      </div>

      <div class="trade-exception-row">
        <strong>Mid-Level Exception</strong>
        <span>View-only for now</span>
      </div>

      <div class="trade-exception-row">
        <strong>Disabled Player Exception</strong>
        <span>None available</span>
      </div>
    </div>
  `;
}

function renderTradeRoomPlayerRow(player, teamId) {
  const asset = getTradeAssetForPlayer(player.id);
  const isMoved = Boolean(asset);

  const destinationTeam = asset
    ? getTeamById(asset.toTeamId)
    : null;

  const destinationColor = asset
    ? getTradeTeamPrimaryColor(asset.toTeamId)
    : "#22c55e";

  return `
    <div
      class="trade-room-player real-player-card ${isMoved ? "player-in-trade" : ""}"
      onclick="openSendPlayerModal('${player.id}', '${teamId}')"
      style="--trade-destination-color: ${destinationColor};"
    >
      <div class="trade-player-left">
        <img
          src="${getTradePlayerImage(player)}"
          alt="${player.name}"
          class="trade-player-img"
          onerror="this.src='images/players/default-silhouette.png'"
        >

        <div class="trade-player-main">
          <strong>${player.name}</strong>
          <span>${player.primaryPosition || "--"} · Age ${player.age || "--"}</span>
          <small>${getTradePlayerStatsLine(player)}</small>
        </div>
      </div>

      <div class="trade-room-player-right">
        <span>${formatMoney(player.salary || 0)}</span>
        <small>${player.contractYears || 0} YRS</small>

        ${
          isMoved
            ? `<em>To ${destinationTeam ? destinationTeam.name : "Team"}</em>`
            : `<em>Add</em>`
        }
      </div>
    </div>
  `;
}

function getTradeAssetForPlayer(playerId) {
  if (!tradeRoom || !Array.isArray(tradeRoom.assets)) return null;

  return tradeRoom.assets.find(asset =>
    asset.type === "player" &&
    Number(asset.playerId) === Number(playerId)
  ) || null;
}

function renderTradeOutgoingAssets(teamId) {
  const assets = tradeRoom.assets.filter(asset =>
    Number(asset.fromTeamId) === Number(teamId)
  );

  if (assets.length === 0) return `<span class="trade-room-empty-text">None</span>`;

  return assets.map(asset => {
    const toTeam = getTeamById(asset.toTeamId);

    if (asset.type === "pick") {
      const roundText = asset.round === 1 ? "1st" : "2nd";

      return `
        <div
          class="trade-room-asset-chip"
          style="--chip-color: ${getTradeTeamPrimaryColor(asset.fromTeamId)};"
        >
          <span>
            ${asset.year} ${roundText} Round Pick (${asset.protection}) → ${toTeam ? toTeam.name : "Team"}
          </span>

          <button type="button" onclick="event.stopPropagation(); removeTradeAsset('pick', '${asset.pickId}')">
            Remove
          </button>
        </div>
      `;
    }

    const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);

    return `
      <div
        class="trade-room-asset-chip"
        style="--chip-color: ${getTradeTeamPrimaryColor(asset.fromTeamId)};"
      >
        <span>
          ${player ? player.name : "Player"} → ${toTeam ? toTeam.name : "Team"}
        </span>

        <button type="button" onclick="event.stopPropagation(); removeTradeAsset('player', '${asset.playerId}')">
          Remove
        </button>
      </div>
    `;
  }).join("");
}

function renderTradeIncomingAssets(teamId) {
  const assets = tradeRoom.assets.filter(asset =>
    Number(asset.toTeamId) === Number(teamId)
  );

  if (assets.length === 0) return `<span class="trade-room-empty-text">None</span>`;

  return assets.map(asset => {
    const fromTeam = getTeamById(asset.fromTeamId);

    if (asset.type === "pick") {
      const roundText = asset.round === 1 ? "1st" : "2nd";

      return `
        <div
          class="trade-room-asset-chip"
          style="--chip-color: ${getTradeTeamPrimaryColor(asset.toTeamId)};"
        >
          ${asset.year} ${roundText} Round Pick (${asset.protection}) ← ${fromTeam ? fromTeam.name : "Team"}
        </div>
      `;
    }

    const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);

    return `
      <div
        class="trade-room-asset-chip"
        style="--chip-color: ${getTradeTeamPrimaryColor(asset.toTeamId)};"
      >
        ${player ? player.name : "Player"} ← ${fromTeam ? fromTeam.name : "Team"}
      </div>
    `;
  }).join("");
}

function getTeamById(teamId) {
  return gameState.teams.find(team => Number(team.id) === Number(teamId)) || null;
}

function getTradeTeamPrimaryColor(teamId) {
  const team = getTeamById(teamId);

  return (
    team?.primaryColor ||
    team?.colors?.primary ||
    team?.color ||
    "#17408B"
  );
}

function getTradeTeamSecondaryColor(teamId) {
  const team = getTeamById(teamId);

  return (
    team?.secondaryColor ||
    team?.colors?.secondary ||
    "#ffffff"
  );
}

function getTradeTeamLogoText(team) {
  if (!team) return "FC";

  return (
    team.abbreviation ||
    team.abbrev ||
    team.shortName ||
    team.name
      .split(" ")
      .map(word => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase()
  );
}

function getTradePlayerImage(player) {
  const imagePath = typeof getPlayerPortraitPath === "function"
    ? getPlayerPortraitPath(player)
    : (player?.portrait || player?.faceImage || player?.image || player?.imagePath || player?.imageUrl || player?.photo || player?.photoPath || player?.headshot || "");

  if (imagePath && typeof normalizePlayerPortraitPath === "function") {
    return normalizePlayerPortraitPath(imagePath);
  }

  return imagePath || "images/players/default-silhouette.png";
}

function getTradePlayerStatsLine(player) {
  if (!player || !player.seasonStats) {
    return "0.0 PPG · 0.0 RPG · 0.0 APG";
  }

  const stats = player.seasonStats;
  const games = Math.max(1, Number(stats.games || stats.gamesPlayed || 0));

  const ppg = ((stats.points || 0) / games).toFixed(1);
  const rpg = ((stats.rebounds || 0) / games).toFixed(1);
  const apg = ((stats.assists || 0) / games).toFixed(1);

  return `${ppg} PPG · ${rpg} RPG · ${apg} APG`;
}

function getPlayerByIdFromTeam(playerId, teamId) {
  const roster = getRosterByTeamId(teamId);

  if (!Array.isArray(roster)) return null;

  return roster.find(player =>
    Number(player.id) === Number(playerId) ||
    Number(player.playerId) === Number(playerId)
  ) || null;
}

function createTradeTeamCard(tradeTeam) {
  const teamId = tradeTeam.teamId;
  const team = getTeamById(teamId);
  if (!team) return document.createElement("div");

  const activeTab = tradeTeam.activeTab || "roster";
  const primaryColor = getTradeTeamPrimaryColor(teamId);
  const secondaryColor = getTradeTeamSecondaryColor(teamId);

  const card = document.createElement("div");
  card.className = "trade-room-team-card real-team-card";
  card.style.setProperty("--team-primary", primaryColor);
  card.style.setProperty("--team-secondary", secondaryColor);

  card.innerHTML = `
    <div class="trade-room-team-header real-team-header">
        <div class="trade-team-logo-badge">
          ${
            getTradeTeamLogoImage(team)
              ? `<img src="${getTradeTeamLogoImage(team)}" alt="${team.name}" onerror="this.style.display='none'; this.parentElement.textContent='${getTradeTeamLogoText(team)}';">`
              : getTradeTeamLogoText(team)
          }
        </div>

        <div class="trade-team-header-info">
          <h3>${team.name}</h3>
          <span>Payroll: ${formatMoney(getRosterPayroll(teamId))}</span>
        </div>

        ${
          tradeTeam.locked
            ? ""
            : `<button type="button" class="trade-remove-team-button" onclick="removeTeamFromTradeRoom('${teamId}')">
                Remove Team
              </button>`
        }
      </div>

    <div class="trade-team-tabs">
      <button class="${activeTab === "roster" ? "active" : ""}" onclick="setTradeTeamTab('${teamId}', 'roster')">Roster</button>
      <button class="${activeTab === "picks" ? "active" : ""}" onclick="setTradeTeamTab('${teamId}', 'picks')">Picks</button>
      <button class="${activeTab === "exceptions" ? "active" : ""}" onclick="setTradeTeamTab('${teamId}', 'exceptions')">Exceptions</button>
    </div>

    <div class="trade-room-direction-box">
      <div>
        <strong>Outgoing</strong>
        <div>${renderTradeOutgoingAssets(teamId)}</div>
      </div>

      <div>
        <strong>Incoming</strong>
        <div>${renderTradeIncomingAssets(teamId)}</div>
      </div>
    </div>

    <div class="trade-team-tab-body">
      ${renderTradeTeamTabBody(teamId, activeTab)}
    </div>
  `;

  return card;
}

function getTradeStatsText(player) {
  if (!player || !player.seasonStats) {
    return "0.0 PPG";
  }

  const stats = player.seasonStats;
  const games = Math.max(1, Number(stats.games || stats.gamesPlayed || 0));

  if (!games) {
    return "0.0 PPG";
  }

  const points = ((stats.points || 0) / games).toFixed(1);
  const rebounds = ((stats.rebounds || 0) / games).toFixed(1);
  const assists = ((stats.assists || 0) / games).toFixed(1);

  return `${points} PPG / ${rebounds} RPG / ${assists} APG`;
}

function getTradeValue(player) {
  if (!player) return 0;

  const current = Number(player.currentAbility || 500);
  const potential = Number(player.potentialAbility || current);
  const age = Number(player.age || 25);
  const salary = Number(player.salary || 0);
  const years = Number(player.contractYears || 0);

  let value = 0;

  value += current * 0.7;
  value += potential * 0.45;

  if (age <= 21) value += 90;
  else if (age <= 24) value += 65;
  else if (age <= 27) value += 35;
  else if (age <= 30) value += 10;
  else if (age <= 33) value -= 20;
  else if (age <= 36) value -= 55;
  else value -= 90;

  if (salary >= 50) value -= 35;
  else if (salary >= 40) value -= 25;
  else if (salary >= 30) value -= 15;
  else if (salary <= 5 && current >= 550) value += 25;

  if (years >= 4 && age <= 28) value += 25;
  if (years <= 1 && current >= 650) value -= 15;

  return Math.max(1, Math.round(value));
}

function getTradeStars(player) {
  const value = getTradeValue(player);

  if (value >= 850) return "★★★★★";
  if (value >= 760) return "★★★★½";
  if (value >= 670) return "★★★★";
  if (value >= 590) return "★★★½";
  if (value >= 510) return "★★★";
  if (value >= 430) return "★★";
  return "★";
}

function displayTradeHistory() {
  const container = document.getElementById("trade-history-list");

  if (!container) return;

  if (!gameState || !gameState.tradeHistory || gameState.tradeHistory.length === 0) {
    container.innerHTML = `<p>No completed trades yet.</p>`;
    return;
  }

  container.innerHTML = "";

  for (let trade of gameState.tradeHistory) {
    const item = document.createElement("div");
    item.className = "trade-history-item";

    const sent = trade.userSent.map(player => player.name).join(", ");
    const received = trade.userReceived.map(player => player.name).join(", ");

    item.innerHTML = `
      <strong>${trade.date}</strong>
      <p>${trade.userTeamName} traded <b>${sent}</b> to ${trade.otherTeamName} for <b>${received}</b>.</p>
    `;

    container.appendChild(item);
  }
}

function refreshTradeCenterIfOpen() {
  const tradeScreen = document.getElementById("transfers-screen");

  if (tradeScreen && tradeScreen.classList.contains("active-screen")) {
    initializeTradeCenter();
  }
}

function openTradeAddTeamMenu() {
  const menu = document.getElementById("trade-add-team-menu");
  if (!menu || !gameState || !Array.isArray(gameState.teams)) return;

  const usedTeamIds = new Set(
    tradeRoom.teams.map(item => Number(item.teamId))
  );

  const availableTeams = gameState.teams
    .filter(team => !usedTeamIds.has(Number(team.id)))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (availableTeams.length === 0 || tradeRoom.teams.length >= 4) {
    menu.innerHTML = "";
    menu.classList.add("hidden");
    return;
  }

  menu.innerHTML = `
    <div class="trade-add-team-panel">
      <div class="trade-add-team-header">
        <strong>Add Team To Trade</strong>
        <button type="button" onclick="closeTradeAddTeamMenu()">×</button>
      </div>

      <div class="trade-add-team-list">
        ${availableTeams.map(team => `
          <button
            type="button"
            style="--add-team-color: ${getTradeTeamPrimaryColor(team.id)};"
            onclick="addTeamToTradeRoom('${team.id}')"
          >
            ${team.name}
          </button>
        `).join("")}
      </div>
    </div>
  `;

  menu.classList.remove("hidden");
}

function closeTradeAddTeamMenu() {
  const menu = document.getElementById("trade-add-team-menu");

  if (menu) {
    menu.classList.add("hidden");
    menu.innerHTML = "";
  }
}

function addTeamToTradeRoom(teamId) {
  if (!tradeRoom || !Array.isArray(tradeRoom.teams)) return;

  if (tradeRoom.teams.length >= 4) {
    closeTradeAddTeamMenu();
    return;
  }

  const alreadyAdded = tradeRoom.teams.some(
    item => Number(item.teamId) === Number(teamId)
  );

  if (alreadyAdded) {
    closeTradeAddTeamMenu();
    return;
  }

  tradeRoom.teams.push({
    teamId: Number(teamId),
    locked: false
  });

  closeTradeAddTeamMenu();
  updateTradeRoomHeader();
  renderTradeRoom();
}

function removeTeamFromTradeRoom(teamId) {
  const targetId = Number(teamId);

  const tradeTeam = tradeRoom.teams.find(item => Number(item.teamId) === targetId);

  if (!tradeTeam || tradeTeam.locked) return;

  tradeRoom.teams = tradeRoom.teams.filter(item =>
    Number(item.teamId) !== targetId
  );

  tradeRoom.assets = tradeRoom.assets.filter(asset =>
    Number(asset.fromTeamId) !== targetId &&
    Number(asset.toTeamId) !== targetId
  );

  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  updateTradeRoomHeader();
  renderTradeRoom();
}

function openSendPlayerModal(playerId, fromTeamId) {
  const modal = document.getElementById("trade-send-player-modal");
  if (!modal) return;

  const player = getPlayerByIdFromTeam(playerId, fromTeamId);
  if (!player) return;

  const destinationTeams = tradeRoom.teams.filter(team =>
    Number(team.teamId) !== Number(fromTeamId)
  );

  if (destinationTeams.length === 0) {
    modal.innerHTML = `
      <div class="trade-send-player-panel">
        <h3>Add another team first</h3>
        <p>You need at least two teams in the trade before moving a player.</p>
        <button type="button" onclick="closeSendPlayerModal()">Close</button>
      </div>
    `;
    modal.classList.remove("hidden");
    return;
  }

  modal.innerHTML = `
    <div class="trade-send-player-panel">
      <h3>Send ${player.name} To:</h3>

      <div class="trade-send-player-options">
        ${destinationTeams.map(item => {
          const team = getTeamById(item.teamId);

          return `
            <button type="button" onclick="assignPlayerToTrade('${player.id}', '${fromTeamId}', '${item.teamId}')">
              ${team ? team.name : "Team"}
            </button>
          `;
        }).join("")}
      </div>

      ${getTradeAssetForPlayer(player.id) ? `
        <button type="button" class="trade-remove-asset-button" onclick="removePlayerFromTrade('${player.id}')">
          Remove From Trade
        </button>
      ` : ""}

      <button type="button" onclick="closeSendPlayerModal()">Cancel</button>
    </div>
  `;

  modal.classList.remove("hidden");
}

function closeSendPlayerModal() {
  const modal = document.getElementById("trade-send-player-modal");

  if (modal) {
    modal.classList.add("hidden");
    modal.innerHTML = "";
  }
}

function assignPlayerToTrade(playerId, fromTeamId, toTeamId) {
  tradeRoom.assets = tradeRoom.assets.filter(asset =>
    !(asset.type === "player" && Number(asset.playerId) === Number(playerId))
  );

  tradeRoom.assets.push({
    type: "player",
    playerId: Number(playerId),
    fromTeamId: Number(fromTeamId),
    toTeamId: Number(toTeamId)
  });

  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  closeSendPlayerModal();
  updateTradeRoomHeader();
  renderTradeRoom();
}

function removePlayerFromTrade(playerId) {
  tradeRoom.assets = tradeRoom.assets.filter(asset =>
    !(asset.type === "player" && Number(asset.playerId) === Number(playerId))
  );

  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  closeSendPlayerModal();
  updateTradeRoomHeader();
  renderTradeRoom();
}

function getTradeTeamLogoImage(team) {
  return (
    team.logo ||
    team.logoUrl ||
    team.image ||
    team.imageUrl ||
    team.logoPath ||
    ""
  );
}

function resetTradeRoomForNewCareer() {
  tradeRoom = {
    teams: [],
    assets: [],
    leakRisk: 0,
    callActive: false,
    incomingGmCall: null,
    gmCallLog: [],
    incomingTradePackages: [],
    boardDeals: [],
    activeBoardDealId: null
  };

  syncTradeRoomToGameState();
  updateGmHubPhoneButton();
}

function removeTradeAsset(assetType, assetId) {
  tradeRoom.assets = tradeRoom.assets.filter(asset => {
    if (assetType === "player") {
      return !(asset.type === "player" && Number(asset.playerId) === Number(assetId));
    }

    if (assetType === "pick") {
      return !(asset.type === "pick" && String(asset.pickId) === String(assetId));
    }

    return true;
  });

  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  updateTradeRoomHeader();
  renderTradeRoom();
}

function getTradeLegalityStatus() {
  if (!tradeRoom || tradeRoom.teams.length < 2) {
    return {
      legal: false,
      label: "Not Legal",
      reason: "Add at least 2 teams before negotiating."
    };
  }

  if (!tradeRoom.assets || tradeRoom.assets.length === 0) {
    return {
      legal: false,
      label: "Not Legal",
      reason: "Add at least 1 player or pick to the trade."
    };
  }

  const teamIds = tradeRoom.teams.map(team => Number(team.teamId));

  for (let asset of tradeRoom.assets) {
    if (Number(asset.fromTeamId) === Number(asset.toTeamId)) {
      return {
        legal: false,
        label: "Not Legal",
        reason: "A team cannot trade an asset to itself."
      };
    }

    if (!teamIds.includes(Number(asset.fromTeamId)) || !teamIds.includes(Number(asset.toTeamId))) {
      return {
        legal: false,
        label: "Not Legal",
        reason: "This trade includes an asset connected to a team that is no longer in the trade."
      };
    }
  }

  for (let team of tradeRoom.teams) {
    const teamId = Number(team.teamId);

    const sendsAssets = tradeRoom.assets.some(asset =>
      Number(asset.fromTeamId) === teamId
    );

    const receivesAssets = tradeRoom.assets.some(asset =>
      Number(asset.toTeamId) === teamId
    );

    if (sendsAssets && !receivesAssets) {
      const teamData = getTeamById(teamId);

      return {
        legal: false,
        label: "Not Legal",
        reason: `${teamData ? teamData.name : "A team"} is sending assets but receiving nothing.`
      };
    }
  }

  return {
    legal: true,
    label: "Legal",
    reason: "This trade framework is ready for negotiations."
  };
}

function updateTradeLegalStatus() {
  const status = getTradeLegalityStatus();
  const box = document.getElementById("trade-room-legal-status");

  if (!box) return;

  box.classList.toggle("legal", status.legal);
  box.classList.toggle("illegal", !status.legal);

  box.onclick = showTradeLegalityPopup;

  box.innerHTML = `
    <span>Status</span>
    <strong>${status.label}</strong>
    <small>${status.legal ? "Ready" : "View Issues"}</small>
  `;
}

function showTradeLegalityPopup() {
  const status = getTradeLegalityStatus();

  const existing = document.getElementById("trade-legality-popup-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "trade-legality-popup-overlay";
  overlay.className = "trade-legality-popup-overlay";

  overlay.innerHTML = `
    <div class="trade-legality-popup">
      <h1>${status.legal ? "TRADE LEGAL" : "TRADE NOT LEGAL"}</h1>

      <p>${status.reason}</p>

      <button type="button" onclick="closeTradeLegalityPopup()">
        Continue
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeTradeLegalityPopup() {
  const overlay = document.getElementById("trade-legality-popup-overlay");

  if (overlay) {
    overlay.remove();
  }
}

function clearTradeRoom() {
  const existingIncomingGmCall = tradeRoom?.incomingGmCall || null;
  const existingGmCallLog = Array.isArray(tradeRoom?.gmCallLog) ? tradeRoom.gmCallLog : [];
  const existingIncomingTradePackages = Array.isArray(tradeRoom?.incomingTradePackages) ? tradeRoom.incomingTradePackages : [];
  const existingBoardDeals = Array.isArray(tradeRoom?.boardDeals) ? tradeRoom.boardDeals : [];
  const existingActiveBoardDealId = tradeRoom?.activeBoardDealId || null;
  const userTeam = getSelectedTeam();
  if (!userTeam) return;

  tradeRoom = {
    teams: [
      {
        teamId: userTeam.id,
        locked: true,
        activeTab: "roster"
      }
    ],
    assets: [],
    leakRisk: 0,
    callActive: false,
    incomingGmCall: existingIncomingGmCall,
    gmCallLog: existingGmCallLog,
    incomingTradePackages: existingIncomingTradePackages,
    boardDeals: existingBoardDeals,
    activeBoardDealId: existingActiveBoardDealId
  };

  updateTradeRoomHeader();
  renderTradeRoom();
}

function ensureTradePhoneState() {
  if (!tradeRoom) {
    tradeRoom = {
      teams: [],
      assets: [],
      leakRisk: 0,
      callActive: false,
      incomingGmCall: null,
      gmCallLog: [],
      incomingTradePackages: [],
      boardDeals: [],
      activeBoardDealId: null
    };
  }

  if (!Array.isArray(tradeRoom.gmCallLog)) {
    tradeRoom.gmCallLog = [];
  }

  if (typeof tradeRoom.incomingGmCall === "undefined") {
    tradeRoom.incomingGmCall = null;
  }

  if (!Array.isArray(tradeRoom.incomingTradePackages)) {
    tradeRoom.incomingTradePackages = [];
  }

  if (!Array.isArray(tradeRoom.boardDeals)) {
    tradeRoom.boardDeals = [];
  }

  if (typeof tradeRoom.activeBoardDealId === "undefined") {
    tradeRoom.activeBoardDealId = null;
  }
}

function updateGmHubPhoneButton() {
  ensureTradePhoneState();

  const button = document.getElementById("gm-hub-phone-button");
  if (!button) return;

  const title = button.querySelector(".gm-phone-title");
  const subtitle = button.querySelector(".gm-phone-subtitle");

  const call = tradeRoom.incomingGmCall;
  const isRinging = call && call.status === "ringing";
  const isActive = call && call.status === "active";

  button.classList.toggle("ringing", isRinging);
  button.classList.toggle("idle", !isRinging);

  button.disabled = !isRinging;

  if (isRinging) {
    if (title) title.textContent = "Incoming";
    if (subtitle) subtitle.textContent = "GM Call";
    return;
  }

  if (isActive) {
    if (title) title.textContent = "In Call";
    if (subtitle) subtitle.textContent = "Active";
    return;
  }

  if (title) title.textContent = "Phone";
  if (subtitle) subtitle.textContent = "No calls";
}

function createIncomingGmCall(options = {}) {
  ensureTradePhoneState();

  if (
    tradeRoom.incomingGmCall &&
    ["ringing", "active"].includes(tradeRoom.incomingGmCall.status)
  ) {
    updateGmHubPhoneButton();
    return tradeRoom.incomingGmCall;
  }

  if (!gameState || !gameState.started || !Array.isArray(gameState.teams)) {
    return null;
  }

  const userTeam = getSelectedTeam();
  if (!userTeam) return null;

  const userRoster = getRosterByTeamId(userTeam.id);
  if (!Array.isArray(userRoster) || userRoster.length === 0) return null;

  const targetPlayer = options.playerId
    ? userRoster.find(player => Number(player.id) === Number(options.playerId))
    : chooseIncomingGmCallTargetPlayer(userRoster);

  if (!targetPlayer) return null;

  const callingTeam = options.fromTeamId
    ? getTeamById(options.fromTeamId)
    : chooseIncomingGmCallTeam(userTeam.id);

  if (!callingTeam) return null;

  const call = {
    id: `gm-call-${Date.now()}`,
    status: "ringing",
    fromTeamId: Number(callingTeam.id),
    fromTeamName: callingTeam.name,
    fromGmName: getIncomingGmName(callingTeam),
    targetPlayerId: Number(targetPlayer.id),
    targetPlayerName: getIncomingCallPlayerName(targetPlayer),
    targetPlayerPosition: targetPlayer.primaryPosition || targetPlayer.position || "--",
    createdDate: getIncomingCallDateText(),
    summary: "",
    result: ""
  };

  tradeRoom.incomingGmCall = call;

  updateGmHubPhoneButton();

  return call;
}

function chooseIncomingGmCallTeam(userTeamId) {
  const teams = gameState.teams.filter(team =>
    Number(team.id) !== Number(userTeamId)
  );

  if (teams.length === 0) return null;

  return teams[Math.floor(Math.random() * teams.length)];
}

function chooseIncomingGmCallTargetPlayer(roster) {
  const scoredPlayers = roster
    .filter(player => player && player.id)
    .map(player => {
      const current = Number(
        player.currentAbility ||
        player.CurrentAbility ||
        player.overall ||
        player.rating ||
        500
      );

      const potential = Number(
        player.potentialAbility ||
        player.PotentialAbility ||
        current
      );

      const age = Number(player.age || 25);
      const salary = Number(player.salary || 0);

      let score = 0;

      score += current * 0.55;
      score += potential * 0.35;

      if (age <= 23) score += 80;
      else if (age <= 27) score += 45;
      else if (age >= 33) score -= 35;

      if (salary <= 8 && current >= 500) score += 35;
      if (salary >= 35) score -= 20;

      score += Math.random() * 80;

      return {
        player,
        score
      };
    })
    .sort((a, b) => b.score - a.score);

  const bestOptions = scoredPlayers.slice(0, Math.min(8, scoredPlayers.length));

  if (bestOptions.length === 0) return roster[0];

  return bestOptions[Math.floor(Math.random() * bestOptions.length)].player;
}

function getTeamGmName(teamOrId) {
  const team = typeof teamOrId === "object" && teamOrId
    ? teamOrId
    : getTeamById(teamOrId);
  const teamId = Number(team?.id || teamOrId);

  const directTeamName = getStaffLikeName(
    team?.gmName ||
    team?.generalManager ||
    team?.generalManagerName ||
    team?.executiveName ||
    team?.frontOffice?.generalManager ||
    team?.frontOffice?.gm
  );

  if (directTeamName) return directTeamName;

  const staffGroup = typeof getTeamStaff === "function"
    ? getTeamStaff(teamId)
    : (gameState?.staff ? gameState.staff[teamId] || gameState.staff[String(teamId)] || gameState.staff[team?.name] : null);

  const liveStaffName = getStaffLikeName(
    staffGroup?.generalManager ||
    staffGroup?.gm ||
    staffGroup?.frontOffice?.generalManager ||
    staffGroup?.frontOffice?.gm
  );

  if (liveStaffName) return liveStaffName;

  const staffList = Array.isArray(staffGroup?.staff) ? staffGroup.staff : [];
  const staffListGm = staffList.find(member =>
    member &&
    !member.isVacant &&
    String(member.role || "").toLowerCase() === "general manager"
  );
  const staffListName = getStaffLikeName(staffListGm);

  if (staffListName) return staffListName;

  if (typeof buildFixedStaffByTeam === "function") {
    const fixedByTeam = buildFixedStaffByTeam();
    const fixedStaffName = getStaffLikeName(
      fixedByTeam[String(teamId)]?.generalManager
    );

    if (fixedStaffName) return fixedStaffName;
  }

  if (typeof getFixedStaffForTeam === "function") {
    const fixedGm = getFixedStaffForTeam(teamId).find(member =>
      member &&
      !member.isVacant &&
      String(member.role || "").toLowerCase() === "general manager"
    );
    const fixedName = getStaffLikeName(fixedGm);

    if (fixedName) return fixedName;
  }

  return "General Manager";
}

function getStaffLikeName(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed && !["gm", "general manager", "opposing gm", "team gm"].includes(trimmed.toLowerCase())
      ? trimmed
      : "";
  }

  if (value.isVacant) return "";

  return (
    value.name ||
    value.fullName ||
    value.displayName ||
    value.gmName ||
    value.generalManagerName ||
    ""
  );
}

function getIncomingGmName(team) {
  return getTeamGmName(team);
}

function getIncomingCallPlayerName(player) {
  if (!player) return "one of your players";

  return (
    player.name ||
    player.fictionalName ||
    player.FictionalName ||
    player.sourceName ||
    player.SourceName ||
    "one of your players"
  );
}

function getIncomingCallDateText() {
  if (
    gameState &&
    gameState.currentDate &&
    typeof formatDate === "function"
  ) {
    return formatDate(gameState.currentDate);
  }

  return new Date().toLocaleDateString();
}

function openIncomingGmCallFromPhone() {
  ensureTradePhoneState();

  const call = tradeRoom.incomingGmCall;

  if (!call || call.status !== "ringing") {
    updateGmHubPhoneButton();
    return;
  }

  call.status = "active";
  tradeRoom.callActive = true;

  updateGmHubPhoneButton();
  renderIncomingGmCallModal("intro");
}

function renderIncomingGmCallModal(mode, customText = "") {
  ensureTradePhoneState();

  const call = tradeRoom.incomingGmCall;
  if (!call) return;

  const existing = document.getElementById("gm-phone-call-overlay");
  if (existing) existing.remove();

  const team = getTeamById(call.fromTeamId);
  const teamColor = team ? getTradeTeamPrimaryColor(team.id) : "#38bdf8";
  const teamLogo = team && typeof getTradeTeamLogoImage === "function"
    ? getTradeTeamLogoImage(team)
    : "";

  const overlay = document.createElement("div");
  overlay.id = "gm-phone-call-overlay";
  overlay.className = "gm-phone-call-overlay";

  overlay.innerHTML = `
    <div class="gm-phone-call-panel" style="--phone-team-color: ${teamColor};">
      <div class="gm-phone-call-header">
        <div class="gm-phone-team-logo">
          ${
            teamLogo
              ? `<img src="${teamLogo}" alt="${escapeTradePhoneHtml(call.fromTeamName)}" onerror="this.style.display='none'; this.parentElement.textContent='${escapeTradePhoneHtml(getTradeTeamLogoText(team))}';">`
              : escapeTradePhoneHtml(getTradeTeamLogoText(team))
          }
        </div>

        <div>
          <h2>${escapeTradePhoneHtml(call.fromGmName)}</h2>
          <p>${escapeTradePhoneHtml(call.fromTeamName)} · ${escapeTradePhoneHtml(call.createdDate)}</p>
        </div>
      </div>

      <div class="gm-phone-call-body">
        ${getIncomingGmCallBodyHtml(mode, customText)}
      </div>

      <div class="gm-phone-call-actions">
        ${getIncomingGmCallActionsHtml(mode)}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function getIncomingGmCallBodyHtml(mode, customText = "") {
  const call = tradeRoom.incomingGmCall;

  if (!call) return "";

  if (mode === "intro") {
    return `
      <p>
        “We wanted to check in on
        <strong>${escapeTradePhoneHtml(call.targetPlayerName)}</strong>.
        Is he someone you would be open to discussing?”
      </p>

      <p>
        This is only an inquiry. They have not made a formal offer yet.
      </p>
    `;
  }

  if (mode === "response") {
    return `
      <p>${customText}</p>
    `;
  }

  if (mode === "ended") {
    return `
      <p>${customText || "The call has ended."}</p>
    `;
  }

  return "";
}

function getIncomingGmCallActionsHtml(mode) {
  if (mode === "intro") {
    return `
      <button type="button" onclick="handleIncomingGmCallResponse('listen')">
        Tell them you are willing to listen
      </button>

      <button type="button" onclick="handleIncomingGmCallResponse('price-high')">
        Say he is available, but only for a strong offer
      </button>

      <button type="button" onclick="handleIncomingGmCallResponse('ask-offer')">
        Ask them to make an offer
      </button>

      <button type="button" class="danger" onclick="handleIncomingGmCallResponse('not-available')">
        Say he is not available
      </button>
    `;
  }

  if (mode === "response") {
    return `
      <button type="button" onclick="handleIncomingGmCallResponse('ask-offer')">
        Ask them to send a real package
      </button>

      <button type="button" onclick="handleIncomingGmCallResponse('keep-open')">
        Tell them you will keep the conversation open
      </button>

      <button type="button" class="danger" onclick="handleIncomingGmCallResponse('end-call')">
        End call
      </button>
    `;
  }

  if (mode === "ended") {
    return `
      <button type="button" onclick="closeIncomingGmCallModal()">
        Hang Up
      </button>
    `;
  }

  return "";
}

function handleIncomingGmCallResponse(responseType) {
  ensureTradePhoneState();

  const call = tradeRoom.incomingGmCall;
  if (!call) return;

  if (responseType === "listen") {
    call.summary = `${call.fromTeamName} checked in on ${call.targetPlayerName}. You said you were willing to listen.`;

    renderIncomingGmCallModal(
      "response",
      `“Good to know. We are not ready to put a final offer on the table yet, but we wanted to see if there was a real conversation here.”`
    );

    return;
  }

  if (responseType === "price-high") {
    call.summary = `${call.fromTeamName} checked in on ${call.targetPlayerName}. You told them the price would be high.`;

    const continues = Math.random() < 0.65;

    if (continues) {
      renderIncomingGmCallModal(
        "response",
        `“That makes sense. We still have interest, but we would need to talk internally before putting a package together.”`
      );
    } else {
      finishIncomingGmCall(
        "They ended the call after hearing the asking price was high.",
        `${call.fromTeamName} asked about ${call.targetPlayerName}, but backed off after hearing the price.`
      );
    }

    return;
  }

if (responseType === "ask-offer") {
  const makesOfferNow = Math.random() < 0.65;

  if (makesOfferNow) {
    const packageData = createIncomingGmTradePackage(call);

    finishIncomingGmCall(
      `“Alright. We have a package we would be willing to discuss.”`,
      `${call.fromTeamName} asked about ${call.targetPlayerName} and sent a trade package.`
    );

    setTimeout(() => {
      renderIncomingTradePackageModal(packageData);
    }, 350);
  } else {
    finishIncomingGmCall(
      `“We are not ready to make a real offer yet. Just checking the temperature.”`,
      `${call.fromTeamName} asked about ${call.targetPlayerName}, but did not make an offer.`
    );
  }

  return;
}

  if (responseType === "not-available") {
    finishIncomingGmCall(
      `“Understood. We will move on.”`,
      `${call.fromTeamName} asked about ${call.targetPlayerName}. You said he was not available.`
    );

    return;
  }

  if (responseType === "keep-open") {
    finishIncomingGmCall(
      `“Sounds good. We may check back in closer to the deadline.”`,
      `${call.fromTeamName} asked about ${call.targetPlayerName}. You kept the conversation open.`
    );

    return;
  }

  if (responseType === "end-call") {
    finishIncomingGmCall(
      "The call ended.",
      `${call.fromTeamName} asked about ${call.targetPlayerName}. The call ended without progress.`
    );
  }
}

function finishIncomingGmCall(displayText, logSummary) {
  ensureTradePhoneState();

  const call = tradeRoom.incomingGmCall;
  if (!call) return;

  call.status = "ended";
  call.result = logSummary;
  call.completedDate = getIncomingCallDateText();

  tradeRoom.gmCallLog.unshift({
    id: call.id,
    date: call.completedDate,
    fromTeamId: call.fromTeamId,
    fromTeamName: call.fromTeamName,
    fromGmName: call.fromGmName,
    targetPlayerId: call.targetPlayerId,
    targetPlayerName: call.targetPlayerName,
    summary: logSummary
  });

  tradeRoom.callActive = false;

  updateGmHubPhoneButton();

  renderIncomingGmCallModal("ended", displayText);
}

function closeIncomingGmCallModal() {
  const overlay = document.getElementById("gm-phone-call-overlay");

  if (overlay) {
    overlay.remove();
  }

  if (
    tradeRoom &&
    tradeRoom.incomingGmCall &&
    tradeRoom.incomingGmCall.status === "ended"
  ) {
    tradeRoom.incomingGmCall = null;
  }

  if (tradeRoom) {
    tradeRoom.callActive = false;
  }

  updateGmHubPhoneButton();
}

function maybeTriggerIncomingGmCall() {
  ensureTradePhoneState();

  if (!gameState || !gameState.started) return false;

  if (
    tradeRoom.incomingGmCall &&
    ["ringing", "active"].includes(tradeRoom.incomingGmCall.status)
  ) {
    return false;
  }

  let chance = 4;

  if (typeof getDaysUntilTradeDeadline === "function") {
    const daysUntilDeadline = getDaysUntilTradeDeadline();

    if (daysUntilDeadline <= 1) chance = 28;
    else if (daysUntilDeadline <= 3) chance = 20;
    else if (daysUntilDeadline <= 7) chance = 13;
    else if (daysUntilDeadline <= 14) chance = 9;
  }

  if (Math.random() * 100 > chance) {
    return false;
  }

  createIncomingGmCall();
  return true;
}

function forceIncomingGmCall() {
  return createIncomingGmCall({
    force: true
  });
}

function escapeTradePhoneHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(updateGmHubPhoneButton, 250);
});

/* ======================================================
   PART 1B — Incoming GM Trade Packages + Board Save Data
====================================================== */

function createIncomingGmTradePackage(call) {
  ensureTradeBoardState();

  if (!call || !gameState || !gameState.started) return null;

  const userTeam = getSelectedTeam();
  const callingTeam = getTeamById(call.fromTeamId);

  if (!userTeam || !callingTeam) return null;

  const targetPlayer = getPlayerByIdFromTeam(call.targetPlayerId, userTeam.id);

  if (!targetPlayer) return null;

  const callingRoster = getRosterByTeamId(callingTeam.id);
  const userRoster = getRosterByTeamId(userTeam.id);

  const offeredPlayer = chooseIncomingPackageOfferedPlayer(
    callingRoster,
    targetPlayer
  );

  if (!offeredPlayer) return null;

  const packageId = `incoming-package-${Date.now()}`;

  const packageData = {
    id: packageId,
    source: "incoming-gm-call",
    status: "new",
    fromTeamId: Number(callingTeam.id),
    fromTeamName: callingTeam.name,
    fromGmName: call.fromGmName,
    targetPlayerId: Number(targetPlayer.id),
    targetPlayerName: getIncomingCallPlayerName(targetPlayer),
    createdDate: getIncomingCallDateText(),
    teams: [
      {
        teamId: Number(userTeam.id),
        locked: true,
        activeTab: "roster"
      },
      {
        teamId: Number(callingTeam.id),
        locked: false,
        activeTab: "roster"
      }
    ],
    assets: [
      {
        type: "player",
        playerId: Number(targetPlayer.id),
        fromTeamId: Number(userTeam.id),
        toTeamId: Number(callingTeam.id)
      },
      {
        type: "player",
        playerId: Number(offeredPlayer.id),
        fromTeamId: Number(callingTeam.id),
        toTeamId: Number(userTeam.id)
      }
    ],
    note: `${callingTeam.name} called about ${getIncomingCallPlayerName(targetPlayer)} and sent this package.`,
    title: "Untitled Trade Concept"
  };

  tradeRoom.incomingTradePackages.unshift(packageData);

  return packageData;
}

function chooseIncomingPackageOfferedPlayer(callingRoster, targetPlayer) {
  if (!Array.isArray(callingRoster) || callingRoster.length === 0) return null;

  const targetValue = getTradeValue(targetPlayer);

  const scored = callingRoster
    .filter(player => player && player.id)
    .map(player => {
      const playerValue = getTradeValue(player);
      const valueGap = Math.abs(playerValue - targetValue);

      let score = 0;

      score += 1000 - valueGap;

      const age = Number(player.age || 25);
      const salary = Number(player.salary || 0);

      if (age <= 24) score += 35;
      if (age >= 33) score -= 25;

      if (salary > 35) score -= 40;
      if (salary <= 10) score += 20;

      score += Math.random() * 120;

      return {
        player,
        score
      };
    })
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  return scored[0].player;
}

function renderIncomingTradePackageModal(packageData) {
  ensureTradeBoardState();

  if (!packageData) return;

  const existing = document.getElementById("incoming-trade-package-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "incoming-trade-package-overlay";
  overlay.className = "incoming-trade-package-overlay";

  overlay.innerHTML = `
    <div class="incoming-trade-package-panel">
      <div class="incoming-trade-package-header">
        <div>
          <span>Incoming Trade Package</span>
          <h2>${escapeTradePhoneHtml(packageData.fromTeamName)}</h2>
          <p>${escapeTradePhoneHtml(packageData.note)}</p>
        </div>

        <button type="button" onclick="closeIncomingTradePackageModal()">
          ×
        </button>
      </div>

      <div class="incoming-trade-package-grid">
        ${packageData.teams.map(teamItem => {
          const team = getTeamById(teamItem.teamId);
          const incomingAssets = packageData.assets.filter(asset =>
            Number(asset.toTeamId) === Number(teamItem.teamId)
          );

          const outgoingAssets = packageData.assets.filter(asset =>
            Number(asset.fromTeamId) === Number(teamItem.teamId)
          );

          return `
            <div class="incoming-trade-team-card">
              <h3>${escapeTradePhoneHtml(team ? team.name : "Team")}</h3>

              <div class="incoming-trade-assets-box">
                <strong>Receives</strong>
                ${renderIncomingPackageAssetList(incomingAssets)}
              </div>

              <div class="incoming-trade-assets-box">
                <strong>Sends</strong>
                ${renderIncomingPackageAssetList(outgoingAssets)}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="incoming-trade-package-actions">
        <button type="button" onclick="loadIncomingPackageIntoTradeBuilder('${packageData.id}')">
          Open In Trade Builder
        </button>

        <button type="button" onclick="saveIncomingPackageToTheBoard('${packageData.id}')">
          Send To The Board
        </button>

        <button type="button" class="danger" onclick="declineIncomingTradePackage('${packageData.id}')">
          Decline Package
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function renderIncomingPackageAssetList(assets) {
  if (!assets || assets.length === 0) {
    return `<p class="incoming-trade-empty">Nothing</p>`;
  }

  return assets.map(asset => {
    if (asset.type === "player") {
      const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
      const fromTeam = getTeamById(asset.fromTeamId);

      return `
        <div class="incoming-trade-asset-pill">
          <span>${escapeTradePhoneHtml(player ? getIncomingCallPlayerName(player) : "Player")}</span>
          <small>${escapeTradePhoneHtml(fromTeam ? fromTeam.name : "Team")}</small>
        </div>
      `;
    }

    return `
      <div class="incoming-trade-asset-pill">
        <span>Trade Asset</span>
        <small>${escapeTradePhoneHtml(asset.type || "Asset")}</small>
      </div>
    `;
  }).join("");
}

function closeIncomingTradePackageModal() {
  const overlay = document.getElementById("incoming-trade-package-overlay");

  if (overlay) {
    overlay.remove();
  }
}

function getIncomingTradePackageById(packageId) {
  ensureTradeBoardState();

  return tradeRoom.incomingTradePackages.find(item =>
    String(item.id) === String(packageId)
  ) || null;
}

function loadIncomingPackageIntoTradeBuilder(packageId) {
  const packageData = getIncomingTradePackageById(packageId);

  if (!packageData) return;

  tradeRoom.teams = packageData.teams.map(team => ({
    teamId: Number(team.teamId),
    locked: Number(team.teamId) === Number(getSelectedTeam()?.id),
    activeTab: "roster"
  }));

  tradeRoom.assets = packageData.assets.map(asset => ({ ...asset }));
  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  closeIncomingTradePackageModal();

  if (typeof showSecondaryScreen === "function") {
    showSecondaryScreen("transfers-screen");
  }

  updateTradeRoomHeader();
  renderTradeRoom();
}

function saveIncomingPackageToTheBoard(packageId) {
  ensureTradeBoardState();

  const packageData = getIncomingTradePackageById(packageId);

  if (!packageData) return;

  const alreadySaved = tradeRoom.boardDeals.some(deal =>
    String(deal.sourcePackageId) === String(packageId)
  );

  if (alreadySaved) {
    showTradeSimplePopup(
      "Already On The Board",
      "This trade package is already saved to The Board."
    );
    return;
  }

  const boardDeal = {
    id: `board-deal-${Date.now()}`,
    sourcePackageId: packageData.id,
    source: "incoming-gm-call",
    title: packageData.title || "Untitled Trade Concept",
    stage: "Concept",
    createdDate: getIncomingCallDateText(),
    updatedDate: getIncomingCallDateText(),
    fromTeamId: packageData.fromTeamId,
    fromTeamName: packageData.fromTeamName,
    teams: packageData.teams.map(team => ({ ...team })),
    assets: packageData.assets.map(asset => ({ ...asset })),
    notes: [
      {
        date: getIncomingCallDateText(),
        text: packageData.note
      }
    ],
    lastGmResponse: `${packageData.fromTeamName} sent this package after calling about ${packageData.targetPlayerName}.`,
    archived: false,
    priority: false
  };

  tradeRoom.boardDeals.unshift(boardDeal);

  packageData.status = "sent-to-board";

  closeIncomingTradePackageModal();

  showTradeSimplePopup(
    "Sent To The Board",
    "This package was saved as a trade concept on The Board."
  );

  renderTradeBoardScreen();
}

function declineIncomingTradePackage(packageId) {
  const packageData = getIncomingTradePackageById(packageId);

  if (!packageData) return;

  packageData.status = "declined";

  closeIncomingTradePackageModal();

  showTradeSimplePopup(
    "Package Declined",
    `${packageData.fromTeamName} has been told you are not interested in this framework right now.`
  );
}

function showTradeSimplePopup(title, message) {
  const existing = document.getElementById("trade-simple-popup-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "trade-simple-popup-overlay";
  overlay.className = "trade-simple-popup-overlay";

  overlay.innerHTML = `
    <div class="trade-simple-popup">
      <h2>${escapeTradePhoneHtml(title)}</h2>
      <p>${escapeTradePhoneHtml(message)}</p>

      <button type="button" onclick="closeTradeSimplePopup()">
        Continue
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeTradeSimplePopup() {
  const overlay = document.getElementById("trade-simple-popup-overlay");

  if (overlay) {
    overlay.remove();
  }
}

/* ======================================================
   PART 1C — THE BOARD SCREEN
====================================================== */

let tradeBoardDragDealId = null;

function ensureTradeBoardState() {
  if (typeof ensureTradePhoneState === "function") {
    ensureTradePhoneState();
  }

  if (!tradeRoom) {
    tradeRoom = {
      teams: [],
      assets: [],
      leakRisk: 0,
      callActive: false,
      incomingGmCall: null,
      gmCallLog: [],
      incomingTradePackages: [],
      boardDeals: [],
      activeBoardDealId: null
    };
  }

  if (!Array.isArray(tradeRoom.gmCallLog)) {
    tradeRoom.gmCallLog = [];
  }

  if (!Array.isArray(tradeRoom.boardDeals)) {
    tradeRoom.boardDeals = [];
  }

  if (!Array.isArray(tradeRoom.incomingTradePackages)) {
    tradeRoom.incomingTradePackages = [];
  }

  if (typeof tradeRoom.incomingGmCall === "undefined") {
    tradeRoom.incomingGmCall = null;
  }

  if (typeof tradeRoom.activeBoardDealId === "undefined") {
    tradeRoom.activeBoardDealId = null;
  }
}

function getDefaultTradeRoomState() {
  return {
    teams: [],
    assets: [],
    leakRisk: 0,
    callActive: false,
    incomingGmCall: null,
    gmCallLog: [],
    incomingTradePackages: [],
    boardDeals: [],
    activeBoardDealId: null
  };
}

function normalizeTradeRoomState(savedTradeRoom = null) {
  const defaults = getDefaultTradeRoomState();
  const source = savedTradeRoom && typeof savedTradeRoom === "object"
    ? savedTradeRoom
    : {};

  return {
    ...defaults,
    ...source,
    teams: Array.isArray(source.teams) ? source.teams : defaults.teams,
    assets: Array.isArray(source.assets) ? source.assets : defaults.assets,
    leakRisk: Number(source.leakRisk || 0),
    callActive: Boolean(source.callActive),
    incomingGmCall: source.incomingGmCall || null,
    gmCallLog: Array.isArray(source.gmCallLog) ? source.gmCallLog : defaults.gmCallLog,
    incomingTradePackages: Array.isArray(source.incomingTradePackages) ? source.incomingTradePackages : defaults.incomingTradePackages,
    boardDeals: Array.isArray(source.boardDeals) ? source.boardDeals : defaults.boardDeals,
    activeBoardDealId: source.activeBoardDealId || null
  };
}

function syncTradeRoomToGameState() {
  if (!gameState) return;

  ensureTradeBoardState();
  gameState.tradeRoom = JSON.parse(JSON.stringify(normalizeTradeRoomState(tradeRoom)));
}

function restoreTradeRoomFromGameState() {
  tradeRoom = normalizeTradeRoomState(gameState?.tradeRoom);
  ensureTradeBoardState();
  updateGmHubPhoneButton();
}

function renderTradeBoardScreen() {
  ensureTradeBoardState();

  const container = document.getElementById("trade-board-list");
  if (!container) return;

  const activeDeals = tradeRoom.boardDeals.filter(deal => !deal.archived);

  updateTradeBoardSummary(activeDeals);

  if (activeDeals.length === 0) {
    container.innerHTML = `
      <div class="trade-board-empty">
        <h2>No deals on The Board yet</h2>
        <p>
          Build a trade in the Trade Builder, save it as a concept,
          or send an incoming GM package to The Board.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = activeDeals
    .map(deal => renderTradeBoardSlip(deal))
    .join("");
}

function updateTradeBoardSummary(deals) {
  const total = deals.length;
  const concepts = deals.filter(deal => deal.stage === "Concept").length;
  const formal = deals.filter(deal => deal.stage === "Formal Offer").length;
  const agreed = deals.filter(deal => deal.stage === "Agreed Upon").length;

  setTradeBoardText("trade-board-total-count", total);
  setTradeBoardText("trade-board-concept-count", concepts);
  setTradeBoardText("trade-board-formal-count", formal);
  setTradeBoardText("trade-board-agreed-count", agreed);
}

function setTradeBoardText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function saveCurrentTradeBuilderToBoard() {
  ensureTradeBoardState();

  if (!tradeRoom.teams || tradeRoom.teams.length < 2) {
    showTradeSimplePopup(
      "Cannot Save Deal",
      "Add at least two teams to the Trade Builder before saving a concept."
    );
    return;
  }

  if (!tradeRoom.assets || tradeRoom.assets.length === 0) {
    showTradeSimplePopup(
      "Cannot Save Deal",
      "Add at least one player or asset to the Trade Builder before saving a concept."
    );
    return;
  }

  const title = prompt("Name this trade concept:", "Untitled Trade Concept") || "Untitled Trade Concept";

  const boardDeal = {
    id: `board-deal-${Date.now()}`,
    source: "user-builder",
    title,
    stage: "Concept",
    createdDate: getTradeBoardDateText(),
    updatedDate: getTradeBoardDateText(),
    teams: tradeRoom.teams.map(team => ({ ...team })),
    assets: tradeRoom.assets.map(asset => ({ ...asset })),
    notes: [
      {
        date: getTradeBoardDateText(),
        text: "Created from the Trade Builder."
      }
    ],
    lastGmResponse: "Not discussed with another GM yet.",
    archived: false,
    priority: false
  };

  tradeRoom.boardDeals.unshift(boardDeal);
  tradeRoom.activeBoardDealId = boardDeal.id;

  renderTradeBoardScreen();

  showTradeSimplePopup(
    "Saved To The Board",
    "This trade concept is now on The Board."
  );
}

function renderTradeBoardSlip(deal) {
  const stageClass = getTradeBoardStageClass(deal.stage);
  const legality = getTradeBoardLegalityForDeal(deal);
  const teamNames = getTradeBoardTeamNames(deal);
  const notesCount = Array.isArray(deal.notes) ? deal.notes.length : 0;

  return `
    <div
      class="trade-board-slip ${stageClass}"
      draggable="true"
      ondragstart="handleTradeBoardDragStart('${deal.id}')"
      ondragover="handleTradeBoardDragOver(event)"
      ondrop="handleTradeBoardDrop(event, '${deal.id}')"
    >
      <div class="trade-board-slip-top">
        <div>
          <span class="trade-board-stage-pill">${escapeTradeBoardHtml(deal.stage || "Concept")}</span>
          <h2>${escapeTradeBoardHtml(deal.title || "Untitled Trade Concept")}</h2>
          <p>${escapeTradeBoardHtml(teamNames)}</p>
        </div>

        <button type="button" onclick="renameTradeBoardDeal('${deal.id}')">
          Rename
        </button>
      </div>

      <div class="trade-board-slip-assets">
        ${renderTradeBoardAssets(deal)}
      </div>

      <div class="trade-board-slip-status">
        <div class="${legality.legal ? "legal" : "illegal"}">
          <span>Legal Status</span>
          <strong>${escapeTradeBoardHtml(legality.label)}</strong>
        </div>

        <div>
          <span>Notes</span>
          <strong>${notesCount}</strong>
        </div>

        <div>
          <span>Updated</span>
          <strong>${escapeTradeBoardHtml(deal.updatedDate || "--")}</strong>
        </div>
      </div>

      <div class="trade-board-gm-response">
        <span>Last GM Response</span>
        <p>${escapeTradeBoardHtml(deal.lastGmResponse || "No GM discussion yet.")}</p>
      </div>

      <div class="trade-board-stage-row">
        <label>Stage</label>

        <select onchange="updateTradeBoardDealStage('${deal.id}', this.value)">
          ${getTradeBoardStageOptions(deal.stage)}
        </select>
      </div>

        <div class="trade-board-slip-actions">
          <button type="button" onclick="loadTradeBoardDealIntoBuilder('${deal.id}')">
            Open In Builder
          </button>

          <button type="button" onclick="openTradeBoardNotesModal('${deal.id}')">
            Notes
          </button>

          ${
            deal.stage === "Agreed Upon"
              ? `<button type="button" onclick="openTradeFinalizationModal('${deal.id}')">
                  Finalize
                </button>`
              : `<button type="button" onclick="discussTradeBoardDealWithGm('${deal.id}')">
                  Call GM
                </button>`
          }

          <button type="button" class="danger" onclick="archiveTradeBoardDeal('${deal.id}')">
            Archive
          </button>
        </div>
  `;
}

function renderTradeBoardAssets(deal) {
  if (!deal.assets || deal.assets.length === 0) {
    return `<p class="trade-board-no-assets">No assets saved.</p>`;
  }

  return deal.assets.map(asset => {
    const fromTeam = getTeamById(asset.fromTeamId);
    const toTeam = getTeamById(asset.toTeamId);

    return `
      <div class="trade-board-asset-line">
        <span>${escapeTradeBoardHtml(getTradeBoardAssetName(asset))}</span>
        <small>
          ${escapeTradeBoardHtml(fromTeam ? fromTeam.name : "Team")}
          →
          ${escapeTradeBoardHtml(toTeam ? toTeam.name : "Team")}
        </small>
      </div>
    `;
  }).join("");
}

function getTradeBoardAssetName(asset) {
  if (!asset) return "Asset";

  if (asset.type === "player") {
    if (asset.playerName || asset.name) {
      return asset.playerName || asset.name;
    }

    const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
    return player ? getIncomingCallPlayerName(player) : "Player";
  }

  if (asset.type === "pick") {
    const roundText = Number(asset.round) === 1 ? "1st" : "2nd";
    return `${asset.year || "Future"} ${roundText} Round Pick`;
  }

  return asset.type || "Asset";
}

function getTradeBoardTeamNames(deal) {
  if (!deal || !Array.isArray(deal.teams)) return "No teams";

  return deal.teams
    .map(item => getTeamById(item.teamId))
    .filter(Boolean)
    .map(team => team.name)
    .join(" · ");
}

function getTradeBoardStageOptions(currentStage) {
  const stages = [
    "Concept",
    "Discuss With GM",
    "Formal Offer",
    "Agreed Upon"
  ];

  return stages.map(stage => `
    <option value="${stage}" ${stage === currentStage ? "selected" : ""}>
      ${stage}
    </option>
  `).join("");
}

function getTradeBoardStageClass(stage) {
  if (stage === "Discuss With GM") return "stage-discuss";
  if (stage === "Formal Offer") return "stage-formal";
  if (stage === "Agreed Upon") return "stage-agreed";
  return "stage-concept";
}

function getTradeBoardDealById(dealId) {
  ensureTradeBoardState();

  return tradeRoom.boardDeals.find(deal =>
    String(deal.id) === String(dealId)
  ) || null;
}

function updateTradeBoardDealStage(dealId, newStage) {
  const deal = getTradeBoardDealById(dealId);
  if (!deal) return;

  deal.stage = newStage;
  deal.updatedDate = getTradeBoardDateText();

  if (newStage === "Discuss With GM") {
    deal.lastGmResponse = deal.lastGmResponse || "Ready to discuss with another GM.";
  }

  if (newStage === "Formal Offer") {
    deal.lastGmResponse = "This framework is now being treated as a formal offer.";
  }

  if (newStage === "Agreed Upon") {
    const legality = getTradeBoardLegalityForDeal(deal);

    if (!legality.legal) {
      deal.stage = "Formal Offer";

      showTradeSimplePopup(
        "Trade Not Legal",
        legality.reason
      );
    } else {
      deal.lastGmResponse = "Both sides have agreed to the framework pending final processing.";
    }
  }

  renderTradeBoardScreen();
}

function renameTradeBoardDeal(dealId) {
  const deal = getTradeBoardDealById(dealId);
  if (!deal) return;

  const newTitle = prompt("Rename this trade concept:", deal.title || "Untitled Trade Concept");

  if (!newTitle || !newTitle.trim()) return;

  deal.title = newTitle.trim();
  deal.updatedDate = getTradeBoardDateText();

  renderTradeBoardScreen();
}

function archiveTradeBoardDeal(dealId) {
  const deal = getTradeBoardDealById(dealId);
  if (!deal) return;

  const confirmArchive = confirm(`Archive "${deal.title || "Untitled Trade Concept"}"?`);

  if (!confirmArchive) return;

  deal.archived = true;
  deal.updatedDate = getTradeBoardDateText();

  renderTradeBoardScreen();
}

function openTradeBoardNotesModal(dealId) {
  const deal = getTradeBoardDealById(dealId);
  if (!deal) return;

  const existing = document.getElementById("trade-board-notes-overlay");
  if (existing) existing.remove();

  const notes = Array.isArray(deal.notes) ? deal.notes : [];

  const overlay = document.createElement("div");
  overlay.id = "trade-board-notes-overlay";
  overlay.className = "trade-board-notes-overlay";

  overlay.innerHTML = `
    <div class="trade-board-notes-panel">
      <div class="trade-board-notes-header">
        <div>
          <span>Board Notes</span>
          <h2>${escapeTradeBoardHtml(deal.title || "Untitled Trade Concept")}</h2>
        </div>

        <button type="button" onclick="closeTradeBoardNotesModal()">×</button>
      </div>

      <div class="trade-board-notes-list">
        ${
          notes.length
            ? notes.map(note => `
                <div class="trade-board-note-item">
                  <strong>${escapeTradeBoardHtml(note.date || "--")}</strong>
                  <p>${escapeTradeBoardHtml(note.text || "")}</p>
                </div>
              `).join("")
            : `<p class="trade-board-empty-note">No notes yet.</p>`
        }
      </div>

      <div class="trade-board-note-entry">
        <textarea id="trade-board-new-note" placeholder="Add a note about what this GM is thinking, asking for, or refusing..."></textarea>

        <button type="button" onclick="saveTradeBoardNote('${deal.id}')">
          Save Note
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function saveTradeBoardNote(dealId) {
  const deal = getTradeBoardDealById(dealId);
  if (!deal) return;

  const textarea = document.getElementById("trade-board-new-note");
  if (!textarea) return;

  const text = textarea.value.trim();

  if (!text) {
    showTradeSimplePopup("Empty Note", "Write something before saving the note.");
    return;
  }

  if (!Array.isArray(deal.notes)) {
    deal.notes = [];
  }

  deal.notes.unshift({
    date: getTradeBoardDateText(),
    text
  });

  deal.updatedDate = getTradeBoardDateText();

  closeTradeBoardNotesModal();
  openTradeBoardNotesModal(dealId);
  renderTradeBoardScreen();
}

function closeTradeBoardNotesModal() {
  const overlay = document.getElementById("trade-board-notes-overlay");

  if (overlay) {
    overlay.remove();
  }
}

function getTradeBoardLegalityForDeal(deal) {
  const oldTeams = tradeRoom.teams;
  const oldAssets = tradeRoom.assets;

  tradeRoom.teams = deal.teams.map(team => ({ ...team }));
  tradeRoom.assets = deal.assets.map(asset => ({ ...asset }));

  let status = {
    legal: true,
    label: "Legal",
    reason: "This trade framework is ready."
  };

  if (typeof getTradeLegalityStatus === "function") {
    status = getTradeLegalityStatus();
  }

  tradeRoom.teams = oldTeams;
  tradeRoom.assets = oldAssets;

  return status;
}

function handleTradeBoardDragStart(dealId) {
  tradeBoardDragDealId = dealId;
}

function handleTradeBoardDragOver(event) {
  event.preventDefault();
}

function handleTradeBoardDrop(event, targetDealId) {
  event.preventDefault();

  if (!tradeBoardDragDealId || tradeBoardDragDealId === targetDealId) return;

  const fromIndex = tradeRoom.boardDeals.findIndex(deal =>
    String(deal.id) === String(tradeBoardDragDealId)
  );

  const toIndex = tradeRoom.boardDeals.findIndex(deal =>
    String(deal.id) === String(targetDealId)
  );

  if (fromIndex === -1 || toIndex === -1) return;

  const [movedDeal] = tradeRoom.boardDeals.splice(fromIndex, 1);
  tradeRoom.boardDeals.splice(toIndex, 0, movedDeal);

  tradeBoardDragDealId = null;

  renderTradeBoardScreen();
}

function getTradeBoardDateText() {
  if (
    gameState &&
    gameState.currentDate &&
    typeof formatDate === "function"
  ) {
    return formatDate(gameState.currentDate);
  }

  return new Date().toLocaleDateString();
}

function escapeTradeBoardHtml(value) {
  if (typeof escapeTradePhoneHtml === "function") {
    return escapeTradePhoneHtml(value);
  }

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ======================================================
   PART 1D — BOARD DEAL GM CALLS / NEGOTIATION RESPONSES
====================================================== */

function beginTradeBoardNegotiation() {
  ensureTradeBoardState();

  const status = getTradeLegalityStatus();

  if (!status.legal) {
    showTradeLegalityPopup();
    return;
  }

  const deal = createOrUpdateBoardDealFromCurrentBuilderForCall();

  if (!deal) {
    showTradeSimplePopup(
      "Cannot Start Call",
      "Build a valid trade first, then begin negotiations."
    );
    return;
  }

  beginTradePhoneNegotiation({
    source: "trade-builder",
    boardDealId: deal.id,
    deal
  });
}

function createOrUpdateBoardDealFromCurrentBuilderForCall() {
  ensureTradeBoardState();

  if (!tradeRoom.teams || tradeRoom.teams.length < 2) return null;
  if (!tradeRoom.assets || tradeRoom.assets.length === 0) return null;

  let deal = null;

  if (tradeRoom.activeBoardDealId) {
    deal = getTradeBoardDealById(tradeRoom.activeBoardDealId);
  }

  if (deal) {
    deal.teams = tradeRoom.teams.map(team => ({ ...team }));
    deal.assets = tradeRoom.assets.map(asset => ({ ...asset }));
    deal.updatedDate = getTradeBoardDateText();

    addTradeBoardSystemNote(
      deal,
      "Trade Builder changes were synced before calling the other GM."
    );

    return deal;
  }

  deal = {
    id: `board-deal-${Date.now()}`,
    source: "builder-negotiation",
    title: "Untitled Trade Concept",
    stage: "Discuss With GM",
    createdDate: getTradeBoardDateText(),
    updatedDate: getTradeBoardDateText(),
    teams: tradeRoom.teams.map(team => ({ ...team })),
    assets: tradeRoom.assets.map(asset => ({ ...asset })),
    notes: [
      {
        date: getTradeBoardDateText(),
        text: "Created from the Trade Builder before starting GM negotiations."
      }
    ],
    lastGmResponse: "GM call started from the Trade Builder.",
    archived: false,
    priority: false,
    callMessages: []
  };

  tradeRoom.boardDeals.unshift(deal);
  tradeRoom.activeBoardDealId = deal.id;

  return deal;
}

function discussTradeBoardDealWithGm(dealId) {
  const deal = getTradeBoardDealById(dealId);

  if (!deal) return;

  const legality = getTradeBoardLegalityForDeal(deal);

  if (!legality.legal) {
    showTradeSimplePopup(
      "Trade Not Legal",
      legality.reason
    );
    return;
  }

  beginTradePhoneNegotiation({
    source: "trade-board",
    boardDealId: deal.id,
    deal
  });
}

function openTradeGmCallForBoardDeal(dealId) {
  beginTradePhoneNegotiation({
    source: "trade-board",
    boardDealId: dealId
  });
}

function beginTradePhoneNegotiation(options = {}) {
  ensureTradeBoardState();

  const deal = options.deal || getTradeBoardDealById(options.boardDealId);

  if (!deal) return;

  const otherTeamIds = getTradePhoneOpponentTeamIds(deal);

  if (otherTeamIds.length === 0) {
    showTradeSimplePopup(
      "No GM To Call",
      "This deal needs at least one other team before you can call a GM."
    );
    return;
  }

  const legality = getTradeBoardLegalityForDeal(deal);

  deal.stage = "Discuss With GM";
  deal.updatedDate = getTradeBoardDateText();
  deal.activeCallTeamId = Number(otherTeamIds[0]);
  deal.callStatus = "phone-thread";
  tradeRoom.activeBoardDealId = deal.id;

  if (!Array.isArray(deal.callMessages)) {
    deal.callMessages = [];
  }

  const attachment = createTradePackageAttachmentFromTradeRoom({
    deal,
    source: options.source || "trade-board",
    boardDealId: deal.id,
    legality
  });

  const thread = openOrCreateTradePhoneThread(deal, otherTeamIds);

  if (!thread) {
    showTradeSimplePopup(
      "Phone Unavailable",
      "The GM Hub phone could not open this conversation."
    );
    return;
  }

  addTradePackageMessageToPhoneThread(thread, attachment, deal, otherTeamIds);

  deal.lastGmResponse = otherTeamIds.length > 1
    ? "Trade package sent to the group thread."
    : `${getTeamById(otherTeamIds[0])?.name || "The other GM"} received the trade package.`;

  addTradeBoardSystemNote(
    deal,
    otherTeamIds.length > 1
      ? "Trade package sent through a GM Hub group phone thread."
      : "Trade package sent through the GM Hub phone thread."
  );

  if (typeof openGMHubPhoneModal === "function") {
    openGMHubPhoneModal(thread.id);
  } else if (typeof showMainSection === "function") {
    showMainSection("dashboard");
  }
}

function getTradePhoneOpponentTeamIds(deal) {
  const userTeam = typeof getSelectedTeam === "function" ? getSelectedTeam() : null;
  const userTeamId = Number(userTeam?.id || gameState?.selectedTeamId);

  if (!deal || !Array.isArray(deal.teams)) return [];

  return deal.teams
    .map(item => Number(item.teamId))
    .filter(teamId => Number.isFinite(teamId) && teamId !== userTeamId)
    .filter((teamId, index, allIds) => allIds.indexOf(teamId) === index);
}

function createTradePackageAttachmentFromTradeRoom(options = {}) {
  const deal = options.deal || null;
  const sourceTeams = Array.isArray(deal?.teams) ? deal.teams : tradeRoom.teams;
  const sourceAssets = Array.isArray(deal?.assets) ? deal.assets : tradeRoom.assets;
  const legality = options.legality || (
    deal ? getTradeBoardLegalityForDeal(deal) : getTradeLegalityStatus()
  );

  const teams = sourceTeams.map(item => {
    const team = getTeamById(item.teamId);

    return {
      teamId: Number(item.teamId),
      name: team?.name || item.teamName || "Team",
      abbreviation: team?.abbreviation || team?.abbrev || ""
    };
  });

  const assets = sourceAssets.map(asset => ({
    ...asset,
    name: getTradeBoardAssetName(asset),
    playerName: asset.playerName || asset.name || getTradeBoardAssetName(asset)
  }));

  return {
    id: `trade-phone-package-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    date: getTradeBoardDateText(),
    senderType: "user",
    teams,
    assets,
    legalityStatus: {
      legal: legality.legal === true,
      label: legality.label || (legality.legal ? "Legal" : "Not Legal"),
      reason: legality.reason || ""
    },
    source: options.source || "trade-builder",
    boardDealId: options.boardDealId || deal?.id || tradeRoom.activeBoardDealId || null,
    status: "sent"
  };
}

function getTradePhoneThreadIdForTeams(teamIds) {
  const userTeamId = Number(gameState?.selectedTeamId || 0);
  const sortedOtherIds = (teamIds || [])
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  return `trade-phone-${userTeamId}-${sortedOtherIds.join("-")}`;
}

function openOrCreateTradePhoneThread(deal, opponentTeamIds) {
  if (typeof ensureGMHubPhoneState !== "function") return null;

  const phoneState = ensureGMHubPhoneState();
  const threadId = getTradePhoneThreadIdForTeams(opponentTeamIds);
  const teams = opponentTeamIds.map(teamId => getTeamById(teamId)).filter(Boolean);
  const isGroup = teams.length > 1;
  const threadName = isGroup
    ? `Group Trade Discussion: ${teams.map(team => getTradePhoneTeamShortName(team)).join(" / ")}`
    : `${getIncomingGmName(teams[0])}`;
  const role = isGroup
    ? `${teams.map(team => getTeamGmName(team)).join(" / ")}`
    : `${teams[0]?.name || "Opponent"} General Manager`;

  if (!phoneState.threads) {
    phoneState.threads = {};
  }

  if (!phoneState.threadMeta) {
    phoneState.threadMeta = {};
  }

  if (!phoneState.threads[threadId]) {
    phoneState.threads[threadId] = {
      id: threadId,
      type: isGroup ? "group-trade" : "gm",
      name: threadName,
      role,
      teamId: Number(teams[0]?.id || opponentTeamIds[0]),
      teamName: teams.map(team => team.name).join(", "),
      participantTeamIds: opponentTeamIds.map(Number),
      tradeThread: true,
      boardDealIds: [],
      preview: "Trade discussion opened.",
      time: "Now",
      unread: false,
      createdDateKey: typeof getGMHubCurrentDateKey === "function"
        ? getGMHubCurrentDateKey()
        : "",
      responded: false,
      closed: false,
      responseOptions: [],
      messages: []
    };
  }

  const thread = phoneState.threads[threadId];

  if (!Array.isArray(thread.messages)) {
    thread.messages = [];
  }

  if (!Array.isArray(thread.boardDealIds)) {
    thread.boardDealIds = [];
  }

  if (deal?.id && !thread.boardDealIds.includes(deal.id)) {
    thread.boardDealIds.push(deal.id);
  }

  thread.type = isGroup ? "group-trade" : "gm";
  thread.tradeThread = true;
  thread.participantTeamIds = opponentTeamIds.map(Number);
  thread.name = threadName;
  thread.role = role;
  thread.time = "Now";
  thread.unread = false;

  phoneState.threadMeta[threadId] = {
    ...(phoneState.threadMeta[threadId] || {}),
    unread: false
  };

  return thread;
}

function addTradePackageMessageToPhoneThread(thread, attachment, deal, opponentTeamIds) {
  if (!thread || !attachment) return;

  if (opponentTeamIds.length === 1) {
    addOneOpponentTradePackageMessageToPhoneThread(thread, attachment, deal, opponentTeamIds[0]);
    return;
  }

  addMultiOpponentTradePackageMessageToPhoneThread(thread, attachment, deal, opponentTeamIds);
}

function addOneOpponentTradePackageMessageToPhoneThread(thread, attachment, deal, opponentTeamId) {
  const negotiation = ensureTradePhoneNegotiation(thread, deal, opponentTeamId);
  const offerNumber = negotiation.packageHistoryIds.length + 1;
  const messageText = offerNumber === 1
    ? "We wanted to check in on this structure. Would you consider this?"
    : "We made some changes. Check out this revised trade.";

  attachment.negotiationId = negotiation.id;
  attachment.threadId = thread.id;
  attachment.offerNumber = offerNumber;
  attachment.status = "sent";

  thread.messages.push({
    id: `trade-phone-message-${Date.now()}`,
    direction: "outgoing",
    text: messageText,
    meta: "Delivered",
    attachments: [attachment]
  });

  negotiation.latestPackageId = attachment.id;
  negotiation.packageHistoryIds.push(attachment.id);
  negotiation.status = "active";
  negotiation.updatedDate = getTradeBoardDateText();

  if (!Array.isArray(deal.callMessages)) {
    deal.callMessages = [];
  }

  deal.callMessages.push({
    speaker: "user",
    text: messageText,
    attachmentId: attachment.id
  });

  const reaction = getTradePhoneGmReactionState(deal, Number(opponentTeamId), attachment, negotiation);
  applyTradePhoneGmReaction(thread, negotiation, deal, Number(opponentTeamId), attachment, reaction);

  thread.preview = thread.messages[thread.messages.length - 1]?.text || messageText;
  thread.time = "Now";
  thread.responded = false;

  if (typeof renderGMHubPhoneModal === "function") {
    renderGMHubPhoneModal();
  }

  if (typeof updateGMHubPhoneButtonNotification === "function") {
    updateGMHubPhoneButtonNotification();
  }
}

function addMultiOpponentTradePackageMessageToPhoneThread(thread, attachment, deal, opponentTeamIds) {
  const negotiation = ensureTradePhoneGroupNegotiation(thread, deal, opponentTeamIds);
  const offerNumber = negotiation.packageHistoryIds.length + 1;
  const messageText = offerNumber === 1
    ? "Check out this trade."
    : "We made some changes. Check out this revised trade.";

  attachment.negotiationId = negotiation.id;
  attachment.threadId = thread.id;
  attachment.offerNumber = offerNumber;
  attachment.status = "sent";

  thread.messages.push({
    id: `trade-phone-message-${Date.now()}`,
    direction: "outgoing",
    text: messageText,
    meta: "Delivered",
    attachments: [attachment]
  });

  negotiation.latestPackageId = attachment.id;
  negotiation.packageHistoryIds.push(attachment.id);
  negotiation.status = "active";
  negotiation.updatedDate = getTradeBoardDateText();

  if (!Array.isArray(deal.callMessages)) {
    deal.callMessages = [];
  }

  deal.callMessages.push({
    speaker: "user",
    text: messageText,
    attachmentId: attachment.id
  });

  const responseOptions = [];

  for (let teamId of opponentTeamIds.map(Number)) {
    const teamState = ensureTradePhoneOpponentState(negotiation, teamId);

    if (teamState.status === "ended") continue;

    const reaction = getTradePhoneGmReactionState(deal, teamId, attachment, teamState);
    const teamOptions = applyTradePhoneGroupGmReaction(thread, negotiation, deal, teamId, attachment, reaction);

    responseOptions.push(...teamOptions);
  }

  updateTradePhoneGroupNegotiationStatus(negotiation);

  thread.responseOptions = negotiation.status === "ended" ? [] : responseOptions;
  thread.preview = thread.messages[thread.messages.length - 1]?.text || messageText;
  thread.time = "Now";
  thread.responded = false;
  thread.closed = negotiation.status === "ended";

  if (typeof renderGMHubPhoneModal === "function") {
    renderGMHubPhoneModal();
  }

  if (typeof updateGMHubPhoneButtonNotification === "function") {
    updateGMHubPhoneButtonNotification();
  }
}

function getTradePhoneSimpleGmResponse(deal, teamId, attachment) {
  const team = getTeamById(teamId);

  if (attachment?.legalityStatus?.legal !== true) {
    return "We cannot really engage with this until the framework is legal.";
  }

  const untouchable = getTradePhoneUntouchablePlayerName(deal, teamId);

  if (untouchable) {
    return `${untouchable} is not available. We are not discussing him in this framework.`;
  }

  const score = typeof getTradeGmInterestScore === "function"
    ? getTradeGmInterestScore(deal, teamId)
    : getTradeDealNetValueForTeam(deal, teamId);

  if (score >= 35) {
    return "We are interested enough to keep talking. Send us the formal version when you are ready.";
  }

  if (score >= -25) {
    return "We are listening, but we would need more value before this gets serious.";
  }

  return "This does not work for us as built. The value is not close enough right now.";
}

function ensureTradePhoneStateStore() {
  if (!gameState.tradePhoneNegotiations) {
    gameState.tradePhoneNegotiations = {};
  }

  if (!gameState.tradePhoneNegotiations.negotiations) {
    gameState.tradePhoneNegotiations.negotiations = {};
  }

  if (!Array.isArray(gameState.tradePhoneNegotiations.delayedMessages)) {
    gameState.tradePhoneNegotiations.delayedMessages = [];
  }

  return gameState.tradePhoneNegotiations;
}

function ensureTradePhoneNegotiation(thread, deal, opponentTeamId) {
  const store = ensureTradePhoneStateStore();
  let negotiation = thread.activeTradeNegotiationId
    ? store.negotiations[thread.activeTradeNegotiationId]
    : null;

  if (!negotiation || negotiation.status === "ended") {
    const id = `trade-negotiation-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    negotiation = {
      id,
      threadId: thread.id,
      userTeamId: Number(gameState.selectedTeamId),
      opposingTeamId: Number(opponentTeamId),
      boardDealId: deal?.id || null,
      status: "active",
      latestPackageId: null,
      packageHistoryIds: [],
      askingPriceSoftened: false,
      createdDate: getTradeBoardDateText(),
      updatedDate: getTradeBoardDateText()
    };

    store.negotiations[id] = negotiation;
    thread.activeTradeNegotiationId = id;
  }

  return negotiation;
}

function ensureTradePhoneGroupNegotiation(thread, deal, opponentTeamIds) {
  const store = ensureTradePhoneStateStore();
  const cleanOpponentIds = opponentTeamIds
    .map(Number)
    .filter(Number.isFinite)
    .filter((teamId, index, allIds) => allIds.indexOf(teamId) === index);
  let negotiation = thread.activeTradeNegotiationId
    ? store.negotiations[thread.activeTradeNegotiationId]
    : null;

  if (!negotiation || negotiation.status === "ended" || negotiation.type !== "multi-team") {
    const id = `trade-group-negotiation-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    negotiation = {
      id,
      type: "multi-team",
      threadId: thread.id,
      userTeamId: Number(gameState.selectedTeamId),
      participantTeamIds: [Number(gameState.selectedTeamId), ...cleanOpponentIds],
      opposingTeamIds: cleanOpponentIds,
      opposingTeamStates: {},
      boardDealId: deal?.id || null,
      status: "active",
      latestPackageId: null,
      packageHistoryIds: [],
      createdDate: getTradeBoardDateText(),
      updatedDate: getTradeBoardDateText()
    };

    store.negotiations[id] = negotiation;
    thread.activeTradeNegotiationId = id;
  }

  negotiation.type = "multi-team";
  negotiation.threadId = thread.id;
  negotiation.participantTeamIds = [Number(gameState.selectedTeamId), ...cleanOpponentIds];
  negotiation.opposingTeamIds = cleanOpponentIds;

  for (let teamId of cleanOpponentIds) {
    ensureTradePhoneOpponentState(negotiation, teamId);
  }

  return negotiation;
}

function ensureTradePhoneOpponentState(negotiation, teamId) {
  if (!negotiation.opposingTeamStates) {
    negotiation.opposingTeamStates = {};
  }

  const key = String(Number(teamId));

  if (!negotiation.opposingTeamStates[key]) {
    negotiation.opposingTeamStates[key] = {
      teamId: Number(teamId),
      gmName: getTeamGmName(teamId),
      reactionState: null,
      status: "active",
      askingPriceSoftened: false,
      lastResponseDate: null,
      latestPackageId: null
    };
  }

  negotiation.opposingTeamStates[key].gmName = getTeamGmName(teamId);

  return negotiation.opposingTeamStates[key];
}

function getTradePhoneNegotiationById(negotiationId) {
  const store = ensureTradePhoneStateStore();

  return store.negotiations[negotiationId] || null;
}

function getTradePhoneNegotiationForThread(thread) {
  if (!thread || !thread.activeTradeNegotiationId) return null;

  return getTradePhoneNegotiationById(thread.activeTradeNegotiationId);
}

function getTradePhoneGmReactionState(deal, teamId, attachment, negotiation) {
  if (attachment?.legalityStatus?.legal !== true) return "DISLIKES_BUT_OPEN";

  if (getTradePhoneUntouchablePlayerName(deal, teamId)) {
    return "HATES_IT_DONE";
  }

  let score = typeof getTradeGmInterestScore === "function"
    ? getTradeGmInterestScore(deal, teamId)
    : getTradeDealNetValueForTeam(deal, teamId);

  if (negotiation?.askingPriceSoftened) {
    score += 22;
  }

  if (score <= -95) return "HATES_IT_DONE";
  if (score <= -26) return "DISLIKES_BUT_OPEN";
  if (score <= 34) return "LIKES_WITH_COUNTER";
  if (score <= 84) return "LOVES_BUT_NEEDS_TIME";
  return "LOVES_READY";
}

function applyTradePhoneGmReaction(thread, negotiation, deal, teamId, attachment, reaction) {
  const team = getTeamById(teamId);
  let text = "";
  let counterAttachment = null;

  negotiation.lastReaction = reaction;

  if (reaction === "HATES_IT_DONE") {
    text = "This does not work for us. We are not interested in continuing this conversation.";
    negotiation.status = "ended";
    thread.closed = true;
    thread.responseOptions = [
      createTradePhoneResponseOption("End Discussion", "endTalks", { negotiationId: negotiation.id })
    ];
  } else if (reaction === "DISLIKES_BUT_OPEN") {
    text = "This is not there for us, but we would look at another structure if you change the offer.";
    negotiation.status = "active";
    thread.closed = false;
    thread.responseOptions = getTradePhoneResponseOptionsForState("DISLIKES_BUT_OPEN", negotiation, attachment.id);
  } else if (reaction === "LIKES_WITH_COUNTER") {
    counterAttachment = createTradePhoneCounterPackageSnapshot(attachment, negotiation, teamId);

    if (counterAttachment) {
      text = "We like the framework, but our ask would be a little higher. We would need a first included.";
    } else {
      text = "We like the framework, but our ask would be a little higher. We would need future value added.";
    }

    negotiation.status = "active";
    thread.closed = false;
    thread.responseOptions = getTradePhoneResponseOptionsForState(
      "LIKES_WITH_COUNTER",
      negotiation,
      counterAttachment ? counterAttachment.id : attachment.id
    );
  } else if (reaction === "LOVES_BUT_NEEDS_TIME") {
    text = "We like this structure a lot, but we need a couple days internally before we are ready to move.";
    negotiation.status = "active";
    thread.closed = false;
    thread.responseOptions = getTradePhoneResponseOptionsForState("LOVES_BUT_NEEDS_TIME", negotiation, attachment.id);
  } else {
    text = "We like this. If you send this formally, we are ready to move forward.";
    negotiation.status = "active";
    thread.closed = false;
    thread.responseOptions = getTradePhoneResponseOptionsForState("LOVES_READY", negotiation, attachment.id);
  }

  thread.messages.push({
    id: `trade-phone-response-${teamId}-${Date.now()}`,
    direction: "incoming",
    senderTeamId: Number(teamId),
    senderName: getIncomingGmName(team),
    text,
    meta: "Now",
    attachments: counterAttachment ? [counterAttachment] : []
  });

  if (counterAttachment) {
    negotiation.latestCounterPackageId = counterAttachment.id;
    negotiation.packageHistoryIds.push(counterAttachment.id);
  }

  if (!Array.isArray(deal.callMessages)) {
    deal.callMessages = [];
  }

  deal.callMessages.push({
    speaker: "gm",
    teamId: Number(teamId),
    text,
    attachmentId: counterAttachment?.id || null
  });

  deal.lastGmResponse = `${getIncomingGmName(team)}: ${text}`;
  negotiation.updatedDate = getTradeBoardDateText();
}

function applyTradePhoneGroupGmReaction(thread, negotiation, deal, teamId, attachment, reaction) {
  const team = getTeamById(teamId);
  const teamState = ensureTradePhoneOpponentState(negotiation, teamId);
  let text = "";
  let counterAttachment = null;

  teamState.reactionState = reaction;
  teamState.latestPackageId = attachment.id;
  teamState.lastResponseDate = getTradeBoardDateText();

  if (reaction === "HATES_IT_DONE") {
    text = "This does not work for us. We are not interested in continuing this conversation.";
    teamState.status = "ended";
  } else if (reaction === "DISLIKES_BUT_OPEN") {
    text = "This is not there for us, but we would look at another structure if you change the offer.";
    teamState.status = "active";
  } else if (reaction === "LIKES_WITH_COUNTER") {
    counterAttachment = createTradePhoneCounterPackageSnapshot(attachment, negotiation, teamId);

    if (counterAttachment) {
      text = "We like the framework, but our ask would be a little higher. We would need a first included.";
    } else {
      text = "We like the framework, but our ask would be a little higher. We would need future value added.";
    }

    teamState.status = "active";
  } else if (reaction === "LOVES_BUT_NEEDS_TIME") {
    text = "We like this structure a lot, but we need a couple days internally before we are ready to move.";
    teamState.status = "waitingOnGm";
  } else {
    text = "We like this. If you send this formally, we are ready to move forward.";
    teamState.status = "readyForFormalOffer";
  }

  thread.messages.push({
    id: `trade-phone-group-response-${teamId}-${Date.now()}`,
    direction: "incoming",
    senderTeamId: Number(teamId),
    senderName: getIncomingGmName(team),
    text,
    meta: "Now",
    attachments: counterAttachment ? [counterAttachment] : []
  });

  if (counterAttachment) {
    teamState.latestCounterPackageId = counterAttachment.id;
    negotiation.packageHistoryIds.push(counterAttachment.id);
  }

  if (!Array.isArray(deal.callMessages)) {
    deal.callMessages = [];
  }

  deal.callMessages.push({
    speaker: "gm",
    teamId: Number(teamId),
    text,
    attachmentId: counterAttachment?.id || null
  });

  deal.lastGmResponse = `${getIncomingGmName(team)}: ${text}`;
  negotiation.updatedDate = getTradeBoardDateText();

  if (reaction === "HATES_IT_DONE") {
    return [];
  }

  return getTradePhoneGroupResponseOptionsForState(
    reaction,
    negotiation,
    teamId,
    counterAttachment ? counterAttachment.id : attachment.id
  );
}

function getTradePhoneResponseOptionsForState(state, negotiation, packageId) {
  if (state === "DISLIKES_BUT_OPEN") {
    return [
      createTradePhoneResponseOption("Rework In Builder", "rework", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("I'll Get Back To You In A Couple Days", "delayUser", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("Are You Willing To Lower Your Asking Price?", "askLower", { negotiationId: negotiation.id, packageId })
    ];
  }

  if (state === "LIKES_WITH_COUNTER") {
    return [
      createTradePhoneResponseOption("I Like This, Let's Make It Official Right Now", "readyNow", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("I Have A Few Tweaks", "tweaks", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("I'm Not Willing To Lower My Asking Price", "notLower", { negotiationId: negotiation.id, packageId })
    ];
  }

  if (state === "LOVES_BUT_NEEDS_TIME") {
    return [
      createTradePhoneResponseOption("Ok, Sounds Great", "okWait", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("I Need A Response Now", "needNow", { negotiationId: negotiation.id, packageId })
    ];
  }

  if (state === "LOVES_READY") {
    return [
      createTradePhoneResponseOption("Okay, Sending A Formal Offer Now", "sendFormal", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("Give Me A Couple Days Before I Send One", "delayFormal", { negotiationId: negotiation.id, packageId })
    ];
  }

  if (state === "CHECK_BACK_USER") {
    return [
      createTradePhoneResponseOption("Rework In Builder", "rework", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("Not Yet", "notYet", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("End Talks", "endTalks", { negotiationId: negotiation.id, packageId })
    ];
  }

  if (state === "CHECK_BACK_GM") {
    return [
      createTradePhoneResponseOption("Send Formal Offer", "sendFormal", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("Rework In Builder", "rework", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("Give Me More Time", "giveMoreTime", { negotiationId: negotiation.id, packageId })
    ];
  }

  if (state === "CHECK_FORMAL") {
    return [
      createTradePhoneResponseOption("Send Formal Offer", "sendFormal", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("Rework In Builder", "rework", { negotiationId: negotiation.id, packageId }),
      createTradePhoneResponseOption("Not Yet", "notYet", { negotiationId: negotiation.id, packageId })
    ];
  }

  return [];
}

function getTradePhoneGroupResponseOptionsForState(state, negotiation, teamId, packageId) {
  const teamLabel = getTradePhoneTeamShortName(getTeamById(teamId));
  const optionBase = { negotiationId: negotiation.id, packageId, teamId: Number(teamId) };

  if (state === "DISLIKES_BUT_OPEN") {
    return [
      createTradePhoneResponseOption(`Rework In Builder For ${teamLabel}`, "rework", optionBase),
      createTradePhoneResponseOption(`Tell ${teamLabel} You'll Get Back To Them`, "delayUser", optionBase),
      createTradePhoneResponseOption(`Ask ${teamLabel} To Lower Price`, "askLower", optionBase)
    ];
  }

  if (state === "LIKES_WITH_COUNTER") {
    return [
      createTradePhoneResponseOption(`Accept ${teamLabel}'s Counter Placeholder`, "readyNow", optionBase),
      createTradePhoneResponseOption(`I Have Tweaks For ${teamLabel}`, "tweaks", optionBase),
      createTradePhoneResponseOption(`Tell ${teamLabel} The Price Is Too High`, "notLower", optionBase)
    ];
  }

  if (state === "LOVES_BUT_NEEDS_TIME") {
    return [
      createTradePhoneResponseOption(`Wait For ${teamLabel}`, "okWait", optionBase),
      createTradePhoneResponseOption(`Rush ${teamLabel} For Answer`, "needNow", optionBase)
    ];
  }

  if (state === "LOVES_READY") {
    return [
      createTradePhoneResponseOption(`Send Formal Offer To ${teamLabel}`, "sendFormal", optionBase),
      createTradePhoneResponseOption(`Ask ${teamLabel} For A Couple Days`, "delayFormal", optionBase)
    ];
  }

  if (state === "CHECK_BACK_USER") {
    return [
      createTradePhoneResponseOption(`Rework In Builder For ${teamLabel}`, "rework", optionBase),
      createTradePhoneResponseOption(`Tell ${teamLabel} Not Yet`, "notYet", optionBase),
      createTradePhoneResponseOption(`End Talks With ${teamLabel}`, "endTalks", optionBase)
    ];
  }

  if (state === "CHECK_BACK_GM" || state === "CHECK_FORMAL") {
    return [
      createTradePhoneResponseOption(`Send Formal Offer To ${teamLabel}`, "sendFormal", optionBase),
      createTradePhoneResponseOption(`Rework In Builder For ${teamLabel}`, "rework", optionBase),
      createTradePhoneResponseOption(`Ask ${teamLabel} For More Time`, "giveMoreTime", optionBase)
    ];
  }

  return [];
}

function createTradePhoneResponseOption(text, tradeAction, extra = {}) {
  return {
    text,
    tradeAction,
    ...extra
  };
}

function setTradePhoneNegotiationTeamStatus(negotiation, teamId, status) {
  if (!negotiation) return;

  if (negotiation.type === "multi-team") {
    const teamState = ensureTradePhoneOpponentState(negotiation, teamId);
    teamState.status = status;
    teamState.lastResponseDate = getTradeBoardDateText();
    updateTradePhoneGroupNegotiationStatus(negotiation);
    return;
  }

  negotiation.status = status;
}

function updateTradePhoneGroupNegotiationStatus(negotiation) {
  if (!negotiation || negotiation.type !== "multi-team") return;

  const states = (negotiation.opposingTeamIds || [])
    .map(teamId => ensureTradePhoneOpponentState(negotiation, teamId));

  if (!states.length) {
    negotiation.status = "active";
    return;
  }

  if (states.some(state => state.status === "ended")) {
    negotiation.status = "ended";
    return;
  }

  if (states.some(state => state.status === "stalled")) {
    negotiation.status = "stalled";
    return;
  }

  if (states.some(state => state.status === "waitingOnGm")) {
    negotiation.status = "waitingOnGms";
    return;
  }

  if (states.every(state => state.status === "readyForFormalOffer")) {
    negotiation.status = "readyForFormalOffer";
    return;
  }

  if (states.some(state => state.status === "waitingOnUser")) {
    negotiation.status = "waitingOnUser";
    return;
  }

  negotiation.status = "active";
}

function createTradePhoneCounterPackageSnapshot(attachment, negotiation, opponentTeamId) {
  const pick = getTradePhoneNextAvailableFirstPick(negotiation.userTeamId, attachment.assets || []);

  if (!pick) return null;

  const assets = (attachment.assets || []).map(asset => ({ ...asset }));

  assets.push({
    type: "pick",
    pickId: pick.id,
    fromTeamId: Number(negotiation.userTeamId),
    toTeamId: Number(opponentTeamId),
    ownerTeamId: pick.ownerTeamId,
    originalTeamId: pick.originalTeamId,
    year: pick.year,
    round: pick.round,
    protection: pick.protection,
    name: getTradePickLabel(pick)
  });

  return {
    ...attachment,
    id: `trade-phone-counter-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    date: getTradeBoardDateText(),
    senderType: "gm",
    source: "trade-counter",
    status: "counter",
    negotiationId: negotiation.id,
    threadId: negotiation.threadId,
    assets,
    legalityStatus: {
      legal: true,
      label: "Legal",
      reason: "Counter package snapshot."
    }
  };
}

function getTradePhoneNextAvailableFirstPick(userTeamId, existingAssets = []) {
  if (typeof getTradePicksForTeam !== "function") return null;

  return getTradePicksForTeam(userTeamId).find(pick =>
    Number(pick.round) === 1 &&
    !existingAssets.some(asset => String(asset.pickId) === String(pick.id))
  ) || null;
}

function handleTradePhoneNegotiationAction(threadId, responseIndex) {
  const phoneState = ensureGMHubPhoneState();
  const thread = phoneState.threads?.[threadId];

  if (!thread) return;

  const option = Array.isArray(thread.responseOptions)
    ? thread.responseOptions[Number(responseIndex)]
    : null;

  if (!option || !option.tradeAction) return;

  const negotiation = getTradePhoneNegotiationById(option.negotiationId || thread.activeTradeNegotiationId);

  if (!negotiation) return;

  const actionTeamId = Number(option.teamId || negotiation.opposingTeamId);
  const isGroupNegotiation = negotiation.type === "multi-team";
  const remainingGroupOptions = isGroupNegotiation
    ? (thread.responseOptions || []).filter((_, index) => Number(index) !== Number(responseIndex))
    : [];

  addTradePhoneOutgoingText(thread, option.text || "Okay.");

  thread.responseOptions = isGroupNegotiation ? remainingGroupOptions : [];
  thread.responded = false;

  switch (option.tradeAction) {
    case "rework":
    case "tweaks":
      openTradePhoneBuilderOverlay(option.packageId || negotiation.latestPackageId, thread.id, negotiation.id);
      break;

    case "delayUser":
      setTradePhoneNegotiationTeamStatus(negotiation, actionTeamId, "waitingOnUser");
      addTradePhoneDelayedMessage(thread.id, negotiation.id, "checkBackUser", option.packageId || negotiation.latestPackageId, 2, actionTeamId);
      addTradePhoneIncomingText(
        thread,
        actionTeamId,
        "Alright. We will check back in a couple days."
      );
      break;

    case "delayFormal":
      setTradePhoneNegotiationTeamStatus(negotiation, actionTeamId, "waitingOnUser");
      addTradePhoneDelayedMessage(thread.id, negotiation.id, "checkFormal", option.packageId || negotiation.latestPackageId, 2, actionTeamId);
      addTradePhoneIncomingText(
        thread,
        actionTeamId,
        "That works. Circle back when you are ready to send it formally."
      );
      break;

    case "askLower":
      handleTradePhoneAskLower(thread, negotiation, option.packageId || negotiation.latestPackageId, actionTeamId);
      break;

    case "readyNow":
    case "sendFormal":
      setTradePhoneNegotiationTeamStatus(negotiation, actionTeamId, "readyForFormalOffer");
      sendFormalTradeOfferFromPhone(
        thread,
        negotiation,
        option.packageId || negotiation.latestPackageId,
        actionTeamId
      );
      break;

    case "notLower":
      setTradePhoneNegotiationTeamStatus(negotiation, actionTeamId, "stalled");
      addTradePhoneIncomingText(
        thread,
        actionTeamId,
        "Then we probably do not have a deal at that price."
      );
      break;

    case "okWait":
      setTradePhoneNegotiationTeamStatus(negotiation, actionTeamId, "waitingOnGm");
      addTradePhoneDelayedMessage(thread.id, negotiation.id, "gmReady", option.packageId || negotiation.latestPackageId, 2, actionTeamId);
      addTradePhoneIncomingText(
        thread,
        actionTeamId,
        "Appreciate it. We will talk internally and get back to you."
      );
      break;

    case "needNow":
      handleTradePhoneNeedNow(thread, negotiation, actionTeamId);
      break;

    case "giveMoreTime":
    case "notYet":
      setTradePhoneNegotiationTeamStatus(negotiation, actionTeamId, "waitingOnUser");
      addTradePhoneDelayedMessage(thread.id, negotiation.id, "checkBackUser", option.packageId || negotiation.latestPackageId, 2, actionTeamId);
      addTradePhoneIncomingText(
        thread,
        actionTeamId,
        "Okay. We will check back soon."
      );
      break;

    case "endTalks":
      setTradePhoneNegotiationTeamStatus(negotiation, actionTeamId, "ended");
      thread.closed = true;
      addTradePhoneIncomingText(
        thread,
        actionTeamId,
        "Understood. We will end the discussion here."
      );
      break;

    default:
      break;
  }

  if (isGroupNegotiation) {
    updateTradePhoneGroupNegotiationStatus(negotiation);
    thread.closed = negotiation.status === "ended";
    if (negotiation.status === "ended") {
      thread.responseOptions = [];
    }
  }

  negotiation.updatedDate = getTradeBoardDateText();
  thread.preview = thread.messages[thread.messages.length - 1]?.text || thread.preview;

  if (typeof renderGMHubPhoneModal === "function") {
    renderGMHubPhoneModal();
  }

  if (typeof updateGMHubPhoneButtonNotification === "function") {
    updateGMHubPhoneButtonNotification();
  }
}

function handleTradePhoneAskLower(thread, negotiation, packageId, teamId = null) {
  const targetTeamId = Number(teamId || negotiation.opposingTeamId);
  const teamState = negotiation.type === "multi-team"
    ? ensureTradePhoneOpponentState(negotiation, targetTeamId)
    : negotiation;

  if (Math.random() < 0.5) {
    teamState.askingPriceSoftened = true;
    addTradePhoneIncomingText(
      thread,
      targetTeamId,
      "We can come down a little, but we still need real value."
    );
  } else {
    addTradePhoneIncomingText(
      thread,
      targetTeamId,
      "No, we are not lowering the ask."
    );
  }

  const existingOptions = Array.isArray(thread.responseOptions) ? thread.responseOptions : [];
  const nextOptions = negotiation.type === "multi-team"
    ? [
        createTradePhoneResponseOption(`Rework In Builder For ${getTradePhoneTeamShortName(getTeamById(targetTeamId))}`, "rework", { negotiationId: negotiation.id, packageId, teamId: targetTeamId }),
        createTradePhoneResponseOption(`Tell ${getTradePhoneTeamShortName(getTeamById(targetTeamId))} You'll Get Back To Them`, "delayUser", { negotiationId: negotiation.id, packageId, teamId: targetTeamId })
      ]
    : [
        createTradePhoneResponseOption("Rework In Builder", "rework", { negotiationId: negotiation.id, packageId }),
        createTradePhoneResponseOption("I'll Get Back To You In A Couple Days", "delayUser", { negotiationId: negotiation.id, packageId })
      ];

  thread.responseOptions = negotiation.type === "multi-team"
    ? [...existingOptions, ...nextOptions]
    : nextOptions;
}

function handleTradePhoneNeedNow(thread, negotiation, teamId = null) {
  const targetTeamId = Number(teamId || negotiation.opposingTeamId);

  if (Math.random() < 0.75) {
    setTradePhoneNegotiationTeamStatus(negotiation, targetTeamId, "ended");
    thread.closed = true;
    addTradePhoneIncomingText(
      thread,
      targetTeamId,
      "We are not doing business like that. We are out."
    );
    return;
  }

  setTradePhoneNegotiationTeamStatus(negotiation, targetTeamId, "readyForFormalOffer");
  addTradePhoneIncomingText(
    thread,
    targetTeamId,
    "Fine. If you need an answer now, we are ready to move forward."
  );
}

function addTradePhoneOutgoingText(thread, text) {
  if (!Array.isArray(thread.messages)) {
    thread.messages = [];
  }

  thread.messages.push({
    id: `trade-phone-user-${Date.now()}`,
    direction: "outgoing",
    text,
    meta: "Delivered"
  });
}

function addTradePhoneIncomingText(thread, teamId, text, attachments = []) {
  const team = getTeamById(teamId);

  if (!Array.isArray(thread.messages)) {
    thread.messages = [];
  }

  thread.messages.push({
    id: `trade-phone-gm-${teamId}-${Date.now()}`,
    direction: "incoming",
    senderTeamId: Number(teamId),
    senderName: getIncomingGmName(team),
    text,
    meta: "Now",
    attachments
  });
}

function addTradePhoneDelayedMessage(threadId, negotiationId, messageType, packageId, daysFromNow = 2, teamId = null) {
  const store = ensureTradePhoneStateStore();
  const dueDate = getTradePhoneDateAfterDays(daysFromNow);
  const negotiation = getTradePhoneNegotiationById(negotiationId);

  store.delayedMessages.push({
    id: `trade-phone-delay-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    threadId,
    negotiationId,
    teamId: Number(teamId || negotiation?.opposingTeamId || negotiation?.opposingTeamIds?.[0] || 0) || null,
    dueDate,
    messageType,
    packageId,
    delivered: false
  });
}

function getTradePhoneDateAfterDays(days) {
  const date = gameState?.currentDate
    ? new Date(gameState.currentDate)
    : new Date();

  date.setDate(date.getDate() + Number(days || 0));

  return date.toISOString().slice(0, 10);
}

function processTradePhoneDelayedMessages() {
  if (!gameState?.started) return;

  const store = ensureTradePhoneStateStore();
  const phoneState = typeof ensureGMHubPhoneState === "function"
    ? ensureGMHubPhoneState()
    : null;

  if (!phoneState) return;

  const todayTime = getTradePhoneDateOnlyTime(gameState.currentDate);
  let deliveredAny = false;

  for (let delayed of store.delayedMessages) {
    if (delayed.delivered) continue;
    if (getTradePhoneDateOnlyTime(delayed.dueDate) > todayTime) continue;

    const thread = phoneState.threads?.[delayed.threadId];
    const negotiation = getTradePhoneNegotiationById(delayed.negotiationId);

    if (!thread || !negotiation || negotiation.status === "ended") {
      delayed.delivered = true;
      continue;
    }

    deliverTradePhoneDelayedMessage(thread, negotiation, delayed);
    delayed.delivered = true;
    deliveredAny = true;
  }

  store.delayedMessages = store.delayedMessages.filter(item => !item.delivered);

  if (deliveredAny) {
    if (typeof renderGMHubPhoneModal === "function") {
      renderGMHubPhoneModal();
    }

    if (typeof updateGMHubPhoneButtonNotification === "function") {
      updateGMHubPhoneButtonNotification();
    }
  }
}

function getTradePhoneDateOnlyTime(dateValue) {
  if (typeof dateValue === "string" && dateValue.includes("_")) {
    const [year, month, day] = dateValue.split("_").map(Number);
    return new Date(year, month, day).setHours(0, 0, 0, 0);
  }

  const date = dateValue ? new Date(dateValue) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().setHours(0, 0, 0, 0);
  }

  return date.setHours(0, 0, 0, 0);
}

function deliverTradePhoneDelayedMessage(thread, negotiation, delayed) {
  let text = "";
  let state = "";
  const targetTeamId = Number(delayed.teamId || negotiation.opposingTeamId || negotiation.opposingTeamIds?.[0]);

  if (delayed.messageType === "checkFormal") {
    text = "Are you still planning to send the formal offer?";
    state = "CHECK_FORMAL";
    setTradePhoneNegotiationTeamStatus(negotiation, targetTeamId, "active");
  } else if (delayed.messageType === "gmReady") {
    text = "We talked it over. We are ready to keep working on this.";
    state = "CHECK_BACK_GM";
    setTradePhoneNegotiationTeamStatus(negotiation, targetTeamId, "active");
  } else {
    text = "Just checking back in. Do you have another offer ready for us?";
    state = "CHECK_BACK_USER";
    setTradePhoneNegotiationTeamStatus(negotiation, targetTeamId, "waitingOnUser");
  }

  addTradePhoneIncomingText(thread, targetTeamId, text);

  const packageId = delayed.packageId || negotiation.latestPackageId;
  const newOptions = negotiation.type === "multi-team"
    ? getTradePhoneGroupResponseOptionsForState(state, negotiation, targetTeamId, packageId)
    : getTradePhoneResponseOptionsForState(state, negotiation, packageId);

  thread.responseOptions = [
    ...(Array.isArray(thread.responseOptions) ? thread.responseOptions : []),
    ...newOptions
  ];

  thread.responded = false;
  thread.closed = negotiation.status === "ended";
  thread.unread = true;
  thread.preview = text;

  const phoneState = ensureGMHubPhoneState();
  phoneState.threadMeta[thread.id] = {
    ...(phoneState.threadMeta[thread.id] || {}),
    unread: true
  };
}

function openTradePhoneBuilderOverlay(packageId, threadId = null, negotiationId = null, options = {}) {
  const context = findTradePhonePackageContext(packageId);
  const attachment = options.attachment || context?.attachment || findTradePhonePackageAttachment(packageId);

  if (!attachment) return;

  closeTradePhonePackageModal();
  closeTradePhoneBuilderOverlay(true);

  const screen = document.getElementById("transfers-screen");

  if (!screen) return;

  const overlay = document.createElement("div");
  overlay.id = "trade-phone-builder-overlay";
  overlay.className = "trade-phone-builder-overlay";
  overlay.innerHTML = `
    <div class="trade-phone-builder-topbar">
      <div>
        <span>${escapeTradePhoneHtml(options.eyebrow || "GM Phone Negotiation")}</span>
        <h2>${escapeTradePhoneHtml(options.title || "Rework Trade Package")}</h2>
      </div>

      <button type="button" onclick="closeTradePhoneBuilderOverlay(true)">
        Close
      </button>
    </div>

    <div id="trade-phone-builder-mount" class="trade-phone-builder-mount"></div>
  `;

  document.body.appendChild(overlay);

  const mount = document.getElementById("trade-phone-builder-mount");
  const callButton = screen.querySelector(".trade-room-call-button");
  const previousTradeRoom = {
    teams: tradeRoom.teams.map(team => ({ ...team })),
    assets: tradeRoom.assets.map(asset => ({ ...asset })),
    leakRisk: tradeRoom.leakRisk,
    activeBoardDealId: tradeRoom.activeBoardDealId
  };

  tradePhoneBuilderOverlayState = {
    packageId,
    threadId: threadId || context?.thread?.id || attachment.threadId || null,
    negotiationId: negotiationId || attachment.negotiationId || null,
    originalParent: screen.parentNode,
    originalNextSibling: screen.nextSibling,
    wasActive: screen.classList.contains("active-screen"),
    previousTradeRoom,
    mode: options.mode || "phone-negotiation",
    formalOfferId: options.formalOfferId || null,
    directAttachment: options.attachment ? JSON.parse(JSON.stringify(options.attachment)) : null,
    callButton,
    previousCallButtonHtml: callButton ? callButton.innerHTML : "",
    previousCallButtonOnclick: callButton ? callButton.getAttribute("onclick") : null
  };

  mount.appendChild(screen);
  screen.classList.add("active-screen", "trade-phone-builder-screen");

  loadTradePhonePackageIntoTradeRoom(attachment);

  if (callButton) {
    callButton.innerHTML = options.submitLabel || "Renegotiate Offer";
    callButton.setAttribute("onclick", "submitTradePhoneBuilderOverlayOffer()");
  }

  updateTradeRoomHeader();
  renderTradeRoom();
}

function closeTradePhoneBuilderOverlay(restorePreviousTrade = true) {
  const state = tradePhoneBuilderOverlayState;
  const overlay = document.getElementById("trade-phone-builder-overlay");

  if (!state) {
    if (overlay) overlay.remove();
    return;
  }

  const screen = document.getElementById("transfers-screen");

  if (screen && state.originalParent) {
    state.originalParent.insertBefore(screen, state.originalNextSibling || null);
    screen.classList.remove("trade-phone-builder-screen");
    screen.classList.toggle("active-screen", state.wasActive);
  }

  if (state.callButton) {
    state.callButton.innerHTML = state.previousCallButtonHtml;

    if (state.previousCallButtonOnclick) {
      state.callButton.setAttribute("onclick", state.previousCallButtonOnclick);
    } else {
      state.callButton.removeAttribute("onclick");
    }
  }

  if (restorePreviousTrade && state.previousTradeRoom) {
    tradeRoom.teams = state.previousTradeRoom.teams.map(team => ({ ...team }));
    tradeRoom.assets = state.previousTradeRoom.assets.map(asset => ({ ...asset }));
    tradeRoom.leakRisk = state.previousTradeRoom.leakRisk;
    tradeRoom.activeBoardDealId = state.previousTradeRoom.activeBoardDealId;
  }

  tradePhoneBuilderOverlayState = null;

  if (overlay) {
    overlay.remove();
  }

  updateTradeRoomHeader();
  renderTradeRoom();

  if (typeof renderGMHubPhoneModal === "function") {
    renderGMHubPhoneModal();
  }
}

function submitTradePhoneBuilderOverlayOffer() {
  const state = tradePhoneBuilderOverlayState;

  if (!state) return;

  const status = getTradeLegalityStatus();

  if (!status.legal) {
    showTradeLegalityPopup();
    return;
  }

  if (state.mode === "formal-offer") {
    submitFormalTradeOfferRevisionFromOverlay(state, status);
    return;
  }

  const phoneState = ensureGMHubPhoneState();
  const thread = phoneState.threads?.[state.threadId];
  const negotiation = getTradePhoneNegotiationById(state.negotiationId);

  if (!thread || !negotiation) {
    closeTradePhoneBuilderOverlay(true);
    return;
  }

  const deal = getTradePhoneDealFromCurrentRoom(negotiation);
  const attachment = createTradePackageAttachmentFromTradeRoom({
    deal,
    source: "trade-phone-renegotiation",
    boardDealId: negotiation.boardDealId,
    legality: status
  });

  attachment.negotiationId = negotiation.id;
  attachment.threadId = thread.id;

  if (negotiation.type === "multi-team") {
    addMultiOpponentTradePackageMessageToPhoneThread(
      thread,
      attachment,
      deal,
      negotiation.opposingTeamIds || getTradePhoneOpponentTeamIds(deal)
    );
  } else {
    addOneOpponentTradePackageMessageToPhoneThread(
      thread,
      attachment,
      deal,
      negotiation.opposingTeamId
    );
  }

  closeTradePhoneBuilderOverlay(true);

  if (typeof openGMHubPhoneModal === "function") {
    openGMHubPhoneModal(thread.id);
  }
}

function loadTradePhonePackageIntoTradeRoom(attachment) {
  tradeRoom.teams = (attachment.teams || []).map(team => ({
    teamId: Number(team.teamId),
    locked: Number(team.teamId) === Number(gameState.selectedTeamId),
    activeTab: "roster"
  }));

  tradeRoom.assets = (attachment.assets || []).map(asset => ({ ...asset }));
  tradeRoom.activeBoardDealId = attachment.boardDealId || null;
  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);
}

function getTradePhoneDealFromCurrentRoom(negotiation) {
  return {
    id: negotiation.boardDealId || `phone-negotiation-${negotiation.id}`,
    teams: tradeRoom.teams.map(team => ({ ...team })),
    assets: tradeRoom.assets.map(asset => ({ ...asset })),
    stage: "Discuss With GM"
  };
}

function findTradePhonePackageContext(packageId) {
  if (typeof ensureGMHubPhoneState !== "function") return null;

  const phoneState = ensureGMHubPhoneState();

  for (let thread of Object.values(phoneState.threads || {})) {
    for (let message of thread.messages || []) {
      const attachment = (message.attachments || []).find(item =>
        String(item.id) === String(packageId)
      );

      if (attachment) {
        return {
          thread,
          message,
          attachment
        };
      }
    }
  }

  return null;
}

function getTradePhoneUntouchablePlayerName(deal, teamId) {
  if (!deal || !Array.isArray(deal.assets)) return "";

  if (typeof getPlayerTradeAvailability !== "function") return "";

  const asset = deal.assets.find(item => {
    if (item.type !== "player" || Number(item.fromTeamId) !== Number(teamId)) {
      return false;
    }

    const player = getPlayerByIdFromTeam(item.playerId, item.fromTeamId);

    return player && getPlayerTradeAvailability(player, teamId) === "Untouchable";
  });

  return asset ? getTradeBoardAssetName(asset) : "";
}

function getTradePhoneTeamShortName(team) {
  if (!team) return "Team";

  return team.shortName || team.nickname || team.name || "Team";
}

function renderTradePackageAttachmentCard(attachment) {
  if (!attachment) return "";

  const teams = Array.isArray(attachment.teams) ? attachment.teams : [];
  const assets = Array.isArray(attachment.assets) ? attachment.assets : [];
  const legal = attachment.legalityStatus?.legal === true;

  return `
    <div class="gm-phone-trade-package-card">
      <div class="gm-phone-trade-package-top">
        <div>
          <span>Trade Package</span>
          <strong>${escapeTradePhoneHtml(teams.map(team => team.name).join(" / ") || "Trade Framework")}</strong>
        </div>

        <em class="${legal ? "legal" : "illegal"}">
          ${escapeTradePhoneHtml(attachment.legalityStatus?.label || (legal ? "Legal" : "Not Legal"))}
        </em>
      </div>

      <div class="gm-phone-trade-package-teams">
        ${teams.map(team => renderTradePackageAttachmentTeamBlock(team, assets)).join("")}
      </div>

      <div class="gm-phone-trade-package-actions">
        <button type="button" onclick="loadTradePhonePackageInBuilder('${escapeTradePhoneHtml(attachment.id)}')">
          Rework In Builder
        </button>
        <button type="button" onclick="showTradePhonePackageDetails('${escapeTradePhoneHtml(attachment.id)}')">
          View Details
        </button>
        <button type="button" onclick="withdrawTradePhonePackage('${escapeTradePhoneHtml(attachment.id)}')">
          Withdraw
        </button>
      </div>
    </div>
  `;
}

function renderCompactTradePackageAttachment(attachment) {
  if (!attachment) return "";

  const teams = Array.isArray(attachment.teams) ? attachment.teams : [];
  const legal = attachment.legalityStatus?.legal === true;
  const teamNames = teams.map(team => team.name).join(" / ") || "Trade Framework";

  return `
    <div class="gm-phone-trade-package-preview">
      <div class="gm-phone-trade-package-preview-copy">
        <span>Trade Package</span>
        <strong>${escapeTradePhoneHtml(teamNames)}</strong>
      </div>

      <em class="${legal ? "legal" : "illegal"}">
        ${escapeTradePhoneHtml(attachment.legalityStatus?.label || (legal ? "Legal" : "Not Legal"))}
      </em>

      <button type="button" onclick="openTradePhonePackageModal('${escapeTradePhoneHtml(attachment.id)}')">
        View Package
      </button>
    </div>
  `;
}

function openTradePhonePackageModal(packageId) {
  const attachment = findTradePhonePackageAttachment(packageId);

  if (!attachment) return;

  closeTradePhonePackageModal();

  const overlay = document.createElement("div");
  overlay.id = "trade-phone-package-modal";
  overlay.className = "trade-phone-package-modal";
  overlay.innerHTML = `
    <div class="trade-phone-package-modal-backdrop" onclick="closeTradePhonePackageModal()"></div>

    <div class="trade-phone-package-modal-panel" role="dialog" aria-modal="true" aria-label="Trade Package">
      <button type="button" class="trade-phone-package-modal-close" onclick="closeTradePhonePackageModal()">
        Close
      </button>

      ${renderTradePackageAttachmentCard(attachment)}
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeTradePhonePackageModal() {
  const overlay = document.getElementById("trade-phone-package-modal");

  if (overlay) {
    overlay.remove();
  }
}

function ensureFormalTradeOffersState() {
  if (!gameState) return [];

  if (!Array.isArray(gameState.formalTradeOffers)) {
    gameState.formalTradeOffers = [];
  }

  return gameState.formalTradeOffers;
}

function persistFormalTradeOffersState() {
  if (!gameState) return;

  if (typeof syncTradeRoomToGameState === "function") {
    syncTradeRoomToGameState();
  }

  if (typeof saveGame === "function") {
    saveGame();
  }
}

function cloneFormalTradePackageSnapshot(packageSnapshot) {
  const source = packageSnapshot || {};
  const clone = JSON.parse(JSON.stringify(source));

  clone.id = clone.id || `formal-package-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  clone.date = clone.date || getTradeBoardDateText();
  clone.teams = Array.isArray(clone.teams) ? clone.teams : [];
  clone.assets = Array.isArray(clone.assets) ? clone.assets : [];
  clone.legalityStatus = clone.legalityStatus || getTradeBoardLegalityForDeal(getFormalOfferDealFromPackage(clone));

  return clone;
}

function createFormalTradeOfferFromPackage(packageSnapshot, options = {}) {
  const offers = ensureFormalTradeOffersState();
  const snapshot = cloneFormalTradePackageSnapshot(packageSnapshot);
  const teamIds = snapshot.teams
    .map(team => Number(team.teamId))
    .filter(Number.isFinite);
  const userTeamId = Number(options.userTeamId || gameState.selectedTeamId);
  const approvals = {};
  const acceptedTeamIds = (options.acceptedTeamIds || []).map(Number);

  for (let teamId of teamIds) {
    approvals[teamId] = acceptedTeamIds.includes(Number(teamId)) ? "accepted" : "waiting";
  }

  if (teamIds.includes(userTeamId) && options.direction !== "incoming") {
    approvals[userTeamId] = "accepted";
  }

  const offer = {
    id: options.id || `formal-offer-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    createdDate: getTradeBoardDateText(),
    updatedDate: getTradeBoardDateText(),
    status: options.status || "waiting",
    direction: options.direction || "outgoing",
    userTeamId,
    participantTeamIds: teamIds,
    packageSnapshot: snapshot,
    packageId: snapshot.id,
    source: options.source || "phone-negotiation",
    negotiationId: options.negotiationId || snapshot.negotiationId || null,
    threadId: options.threadId || snapshot.threadId || null,
    approvals,
    replacedByOfferId: null,
    priorOfferId: options.priorOfferId || null,
    processingNote: ""
  };

  if (offer.direction === "incoming") {
    const senderTeamId = Number(options.senderTeamId || teamIds.find(teamId => teamId !== userTeamId));

    if (senderTeamId) {
      offer.senderTeamId = senderTeamId;
      offer.approvals[senderTeamId] = "accepted";
    }
  }

  offers.unshift(offer);
  persistFormalTradeOffersState();

  return offer;
}

function sendFormalTradeOfferFromPhone(thread, negotiation, packageId, actionTeamId = null) {
  const attachment = findTradePhonePackageAttachment(packageId);

  if (!thread || !negotiation || !attachment) return null;

  const acceptedTeamIds = [Number(gameState.selectedTeamId)];
  const targetTeamId = Number(actionTeamId || negotiation.opposingTeamId);

  if (targetTeamId) {
    acceptedTeamIds.push(targetTeamId);
  }

  if (negotiation.type === "multi-team") {
    for (let teamId of negotiation.opposingTeamIds || []) {
      const teamState = ensureTradePhoneOpponentState(negotiation, teamId);

      if (teamState.status === "readyForFormalOffer") {
        acceptedTeamIds.push(Number(teamId));
      }
    }
  }

  const offer = createFormalTradeOfferFromPackage(attachment, {
    direction: "outgoing",
    source: "phone-negotiation",
    negotiationId: negotiation.id,
    threadId: thread.id,
    acceptedTeamIds
  });

  negotiation.formalOfferId = offer.id;
  negotiation.status = checkFormalOfferApprovals(offer).allAccepted
    ? "readyForFormalOffer"
    : "waitingOnGms";
  negotiation.updatedDate = getTradeBoardDateText();

  addTradePhoneOutgoingText(thread, "Formal offer sent. It is now on the table.");
  thread.preview = "Formal offer sent.";

  completeFormalTradeOfferIfReady(offer, { silent: true });
  renderFormalOffersScreen();
  persistFormalTradeOffersState();

  return offer;
}

function getFormalTradeOfferById(offerId) {
  return ensureFormalTradeOffersState().find(offer => String(offer.id) === String(offerId)) || null;
}

function getFormalOfferDealFromPackage(packageSnapshot) {
  return {
    id: packageSnapshot?.boardDealId || packageSnapshot?.id || `formal-offer-deal-${Date.now()}`,
    title: "Formal Trade Offer",
    stage: "Agreed Upon",
    teams: (packageSnapshot?.teams || []).map(team => ({
      teamId: Number(team.teamId),
      teamName: team.name || team.teamName || ""
    })),
    assets: (packageSnapshot?.assets || []).map(asset => ({ ...asset }))
  };
}

function getFormalOfferDeal(offer) {
  const deal = getFormalOfferDealFromPackage(offer?.packageSnapshot);

  deal.id = offer?.id || deal.id;
  deal.title = "Formal Trade Offer";
  deal.formalOfferId = offer?.id || null;

  return deal;
}

function checkFormalOfferApprovals(offer) {
  const approvals = offer?.approvals || {};
  const teamIds = (offer?.participantTeamIds || []).map(Number);
  const values = teamIds.map(teamId => approvals[teamId] || "waiting");

  return {
    allAccepted: values.length > 0 && values.every(value => value === "accepted"),
    anyDeclined: values.some(value => value === "declined"),
    waitingTeamIds: teamIds.filter(teamId => (approvals[teamId] || "waiting") === "waiting")
  };
}

function renderFormalOffersScreen() {
  const root = document.getElementById("formal-offers-root");

  if (!root) return;

  const offers = ensureFormalTradeOffersState();
  const incoming = offers.filter(offer => offer.direction === "incoming");
  const outgoing = offers.filter(offer => offer.direction !== "incoming");

  root.innerHTML = `
    <div class="formal-offers-page">
      <div class="formal-offers-header">
        <div>
          <span>Trade Desk</span>
          <h1>Formal Offers</h1>
          <p>Official trade offers waiting for approval, withdrawal, or completion.</p>
        </div>

        <div class="formal-offers-counts">
          <strong>${offers.length}</strong>
          <span>Total Offers</span>
        </div>
      </div>

      <div class="formal-offers-columns">
        <section class="formal-offers-section">
          <div class="formal-offers-section-title">
            <h2>Incoming Formal Offers</h2>
            <span>${incoming.length}</span>
          </div>
          <div class="formal-offers-list">
            ${incoming.length ? incoming.map(renderFormalOfferCard).join("") : renderFormalOffersEmpty("No incoming formal offers yet.")}
          </div>
        </section>

        <section class="formal-offers-section">
          <div class="formal-offers-section-title">
            <h2>Outgoing Formal Offers</h2>
            <span>${outgoing.length}</span>
          </div>
          <div class="formal-offers-list">
            ${outgoing.length ? outgoing.map(renderFormalOfferCard).join("") : renderFormalOffersEmpty("No outgoing formal offers yet.")}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderFormalOffersEmpty(text) {
  return `
    <div class="formal-offers-empty">
      ${escapeTradePhoneHtml(text)}
    </div>
  `;
}

function renderFormalOfferCard(offer) {
  const status = getFormalOfferStatusLabel(offer);
  const teams = getFormalOfferTeamsText(offer);
  const approval = checkFormalOfferApprovals(offer);
  const statusClass = String(offer.status || "waiting").toLowerCase();

  return `
    <article class="formal-offer-card ${escapeTradePhoneHtml(statusClass)}">
      <div class="formal-offer-card-top">
        <div>
          <span>Formal Trade Offer</span>
          <h3>${escapeTradePhoneHtml(teams || "Trade Offer")}</h3>
        </div>
        <em>${escapeTradePhoneHtml(offer.direction === "incoming" ? "Incoming" : "Outgoing")}</em>
      </div>

      <div class="formal-offer-meta-row">
        <div>
          <span>Status</span>
          <strong>${escapeTradePhoneHtml(status)}</strong>
        </div>
        <div>
          <span>Date</span>
          <strong>${escapeTradePhoneHtml(offer.createdDate || "Today")}</strong>
        </div>
      </div>

      <div class="formal-offer-package-summary">
        <span>Package</span>
        <strong>${escapeTradePhoneHtml(getFormalOfferPackageSummary(offer))}</strong>
        <button type="button" onclick="openFormalOfferPackage('${escapeTradePhoneHtml(offer.id)}')">
          View Package
        </button>
      </div>

      <div class="formal-offer-approvals">
        ${renderFormalOfferApprovalList(offer)}
      </div>

      ${offer.processingNote ? `<p class="formal-offer-note">${escapeTradePhoneHtml(offer.processingNote)}</p>` : ""}

      <div class="formal-offer-actions">
        ${renderFormalOfferActions(offer, approval)}
      </div>
    </article>
  `;
}

function renderFormalOfferActions(offer, approval) {
  if (offer.status === "completed") {
    return `<button type="button" disabled>Completed</button>`;
  }

  if (offer.status === "declined") {
    return `<button type="button" disabled>Declined</button>`;
  }

  if (offer.status === "withdrawn") {
    return `<button type="button" disabled>Withdrawn</button>`;
  }

  if (offer.status === "accepted") {
    return `<button type="button" disabled>Accepted</button>`;
  }

  if (offer.direction === "incoming") {
    return `
      <button type="button" onclick="acceptFormalTradeOffer('${escapeTradePhoneHtml(offer.id)}')">Accept Trade</button>
      <button type="button" onclick="declineFormalTradeOffer('${escapeTradePhoneHtml(offer.id)}')">Decline</button>
      <button type="button" onclick="reworkFormalTradeOffer('${escapeTradePhoneHtml(offer.id)}')">Rework In Builder</button>
    `;
  }

  return `
    <button type="button" onclick="withdrawFormalTradeOffer('${escapeTradePhoneHtml(offer.id)}')">Withdraw Offer</button>
    <button type="button" onclick="reworkFormalTradeOffer('${escapeTradePhoneHtml(offer.id)}')">Rework In Builder</button>
  `;
}

function getFormalOfferStatusLabel(offer) {
  if (!offer) return "Waiting";

  if (offer.status === "completed") return "Completed";
  if (offer.status === "declined") return "Declined";
  if (offer.status === "withdrawn") return "Withdrawn";
  if (offer.status === "accepted") return "Accepted";

  const approval = checkFormalOfferApprovals(offer);

  if (approval.waitingTeamIds.length > 0) {
    const names = approval.waitingTeamIds
      .map(teamId => getTeamById(teamId)?.name || "Team")
      .join(" / ");

    return `Waiting On ${names}`;
  }

  return "Waiting";
}

function getFormalOfferTeamsText(offer) {
  return (offer?.packageSnapshot?.teams || [])
    .map(team => team.name || getTeamById(team.teamId)?.name || "Team")
    .join(" / ");
}

function getFormalOfferPackageSummary(offer) {
  const assets = offer?.packageSnapshot?.assets || [];
  const players = assets.filter(asset => asset.type === "player").length;
  const picks = assets.filter(asset => asset.type === "pick").length;
  const parts = [];

  if (players) parts.push(`${players} player${players === 1 ? "" : "s"}`);
  if (picks) parts.push(`${picks} pick${picks === 1 ? "" : "s"}`);

  return parts.length ? parts.join(", ") : "No assets";
}

function renderFormalOfferApprovalList(offer) {
  return (offer.participantTeamIds || []).map(teamId => {
    const team = getTeamById(teamId);
    const approval = offer.approvals?.[teamId] || "waiting";

    return `
      <div class="formal-offer-approval ${escapeTradePhoneHtml(approval)}">
        <span>${escapeTradePhoneHtml(team?.name || "Team")}</span>
        <strong>${escapeTradePhoneHtml(approval)}</strong>
      </div>
    `;
  }).join("");
}

function openFormalOfferPackage(offerId) {
  const offer = getFormalTradeOfferById(offerId);

  if (!offer) return;

  closeFormalOfferPackageModal();

  const overlay = document.createElement("div");
  overlay.id = "formal-offer-package-modal";
  overlay.className = "trade-phone-package-modal";
  overlay.innerHTML = `
    <div class="trade-phone-package-modal-backdrop" onclick="closeFormalOfferPackageModal()"></div>

    <div class="trade-phone-package-modal-panel" role="dialog" aria-modal="true" aria-label="Formal Trade Offer">
      <button type="button" class="trade-phone-package-modal-close" onclick="closeFormalOfferPackageModal()">
        Close
      </button>

      ${renderFormalTradePackageCard(offer)}
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeFormalOfferPackageModal() {
  const overlay = document.getElementById("formal-offer-package-modal");

  if (overlay) {
    overlay.remove();
  }
}

function renderFormalTradePackageCard(offer) {
  const attachment = offer.packageSnapshot;
  const teams = Array.isArray(attachment.teams) ? attachment.teams : [];
  const assets = Array.isArray(attachment.assets) ? attachment.assets : [];
  const legal = attachment.legalityStatus?.legal === true;

  return `
    <div class="gm-phone-trade-package-card">
      <div class="gm-phone-trade-package-top">
        <div>
          <span>Formal Trade Package</span>
          <strong>${escapeTradePhoneHtml(teams.map(team => team.name).join(" / ") || "Trade Framework")}</strong>
        </div>

        <em class="${legal ? "legal" : "illegal"}">
          ${escapeTradePhoneHtml(attachment.legalityStatus?.label || (legal ? "Legal" : "Not Legal"))}
        </em>
      </div>

      <div class="gm-phone-trade-package-teams">
        ${teams.map(team => renderTradePackageAttachmentTeamBlock(team, assets)).join("")}
      </div>

      <div class="gm-phone-trade-package-actions">
        <button type="button" onclick="reworkFormalTradeOffer('${escapeTradePhoneHtml(offer.id)}')">
          Rework In Builder
        </button>
        <button type="button" onclick="showFormalOfferDetails('${escapeTradePhoneHtml(offer.id)}')">
          View Details
        </button>
        ${offer.direction === "outgoing" && offer.status === "waiting"
          ? `<button type="button" onclick="withdrawFormalTradeOffer('${escapeTradePhoneHtml(offer.id)}')">Withdraw</button>`
          : ""}
      </div>
    </div>
  `;
}

function showFormalOfferDetails(offerId) {
  const offer = getFormalTradeOfferById(offerId);

  if (!offer) return;

  const assets = offer.packageSnapshot.assets || [];
  const text = assets.length
    ? assets.map(asset => getTradeBoardAssetName(asset)).join(", ")
    : "No assets in this formal offer.";

  showTradeSimplePopup("Formal Offer Details", text);
}

function acceptFormalTradeOffer(offerId) {
  const offer = getFormalTradeOfferById(offerId);

  if (!offer || offer.status === "completed") return;

  const userTeamId = Number(offer.userTeamId || gameState.selectedTeamId);
  offer.approvals[userTeamId] = "accepted";

  for (let teamId of offer.participantTeamIds || []) {
    if (Number(teamId) !== userTeamId && (offer.approvals[teamId] || "waiting") === "waiting") {
      offer.approvals[teamId] = "accepted";
    }
  }

  offer.updatedDate = getTradeBoardDateText();
  offer.processingNote = "";
  addFormalOfferPhoneMessage(offer, "We are accepting the formal offer.", "outgoing");
  completeFormalTradeOfferIfReady(offer);
  renderFormalOffersScreen();
  persistFormalTradeOffersState();
}

function declineFormalTradeOffer(offerId) {
  const offer = getFormalTradeOfferById(offerId);

  if (!offer || offer.status === "completed") return;

  offer.status = "declined";
  offer.approvals[offer.userTeamId] = "declined";
  offer.updatedDate = getTradeBoardDateText();
  addFormalOfferPhoneMessage(offer, "We are going to pass on the formal offer.", "outgoing");
  renderFormalOffersScreen();
  persistFormalTradeOffersState();
}

function withdrawFormalTradeOffer(offerId) {
  const offer = getFormalTradeOfferById(offerId);

  if (!offer || offer.status === "completed") return;

  offer.status = "withdrawn";
  offer.updatedDate = getTradeBoardDateText();
  addFormalOfferPhoneMessage(offer, "We are withdrawing the formal offer for now.", "outgoing");
  closeFormalOfferPackageModal();
  renderFormalOffersScreen();
  persistFormalTradeOffersState();
}

function reworkFormalTradeOffer(offerId) {
  const offer = getFormalTradeOfferById(offerId);

  if (!offer || offer.status === "completed") return;

  closeFormalOfferPackageModal();
  openTradePhoneBuilderOverlay(
    offer.packageId,
    offer.threadId,
    offer.negotiationId,
    {
      mode: "formal-offer",
      formalOfferId: offer.id,
      attachment: cloneFormalTradePackageSnapshot(offer.packageSnapshot),
      eyebrow: "Formal Offer Desk",
      title: "Rework Formal Offer",
      submitLabel: "Send Revised Formal Offer"
    }
  );
}

function submitFormalTradeOfferRevisionFromOverlay(state, status) {
  const oldOffer = getFormalTradeOfferById(state.formalOfferId);

  if (!oldOffer) {
    closeTradePhoneBuilderOverlay(true);
    return;
  }

  const deal = {
    id: oldOffer.id,
    teams: tradeRoom.teams.map(team => ({ ...team })),
    assets: tradeRoom.assets.map(asset => ({ ...asset })),
    stage: "Agreed Upon"
  };

  const attachment = createTradePackageAttachmentFromTradeRoom({
    deal,
    source: "formal-offer-revision",
    boardDealId: oldOffer.packageSnapshot?.boardDealId || null,
    legality: status
  });

  attachment.threadId = oldOffer.threadId;
  attachment.negotiationId = oldOffer.negotiationId;

  const revisedOffer = createFormalTradeOfferFromPackage(attachment, {
    direction: "outgoing",
    source: "formal-offer-revision",
    threadId: oldOffer.threadId,
    negotiationId: oldOffer.negotiationId,
    priorOfferId: oldOffer.id,
    acceptedTeamIds: [Number(gameState.selectedTeamId)]
  });

  oldOffer.status = "withdrawn";
  oldOffer.replacedByOfferId = revisedOffer.id;
  oldOffer.updatedDate = getTradeBoardDateText();

  addFormalOfferPhoneMessage(revisedOffer, "We sent a revised formal offer.", "outgoing");
  closeTradePhoneBuilderOverlay(true);
  renderFormalOffersScreen();
  persistFormalTradeOffersState();
}

function completeFormalTradeOfferIfReady(offer, options = {}) {
  const approval = checkFormalOfferApprovals(offer);

  if (approval.anyDeclined) {
    offer.status = "declined";
    offer.processingNote = "One of the required teams declined this formal offer.";
    return false;
  }

  if (!approval.allAccepted) {
    offer.status = "waiting";
    offer.processingNote = "";
    return false;
  }

  const deal = getFormalOfferDeal(offer);
  const report = getTradeFinalizationReport(deal);
  const ownerReaction = getOwnerTradeCompletionReaction(deal);

  if (!report.canFinalize) {
    offer.status = "accepted";
    offer.processingNote = report.summary;

    if (!options.silent) {
      showTradeSimplePopup("Cannot Complete Trade", report.summary);
    }

    return false;
  }

  const result = processFinalTradeDeal(deal);

  if (!result.success) {
    offer.status = "accepted";
    offer.processingNote = result.message;

    if (!options.silent) {
      showTradeSimplePopup("Trade Failed", result.message);
    }

    return false;
  }

  offer.status = "completed";
  offer.completedDate = getTradeBoardDateText();
  offer.updatedDate = getTradeBoardDateText();
  offer.processingNote = "Trade completed and processed by the league office.";

  recordCompletedTradeFromBoardDeal(deal);
  clearTradeRoomAfterCompletedDeal();
  addFormalOfferPhoneMessage(offer, "Deal is complete.", "incoming");
  sendOwnerTradeCompletionReaction(offer, deal, ownerReaction);

  if (typeof renderTradeBoardScreen === "function") {
    renderTradeBoardScreen();
  }

  if (typeof displayTradeHistory === "function") {
    displayTradeHistory();
  }

  return true;
}

function addFormalOfferPhoneMessage(offer, text, direction = "incoming") {
  if (!offer?.threadId || typeof ensureGMHubPhoneState !== "function") return;

  const phoneState = ensureGMHubPhoneState();
  const thread = phoneState.threads?.[offer.threadId];

  if (!thread) return;

  if (direction === "outgoing") {
    addTradePhoneOutgoingText(thread, text);
  } else {
    const userTeamId = Number(offer.userTeamId || gameState.selectedTeamId);
    const teamId = (offer.participantTeamIds || []).find(id => Number(id) !== userTeamId) || userTeamId;

    addTradePhoneIncomingText(thread, teamId, text);
  }

  thread.preview = text;
  thread.time = "Now";

  if (typeof renderGMHubPhoneModal === "function") {
    renderGMHubPhoneModal();
  }
}

function getOwnerTradeCompletionReaction(deal) {
  const userTeamId = Number(gameState?.selectedTeamId || deal?.userTeamId || 0);
  const score = typeof getTradeDealNetValueForTeam === "function"
    ? getTradeDealNetValueForTeam(deal, userTeamId)
    : 0;

  if (score >= 80) {
    return {
      grade: "A+",
      mood: "thrilled",
      text: "That is exactly the kind of move I want to see. You improved the roster and kept us pointed forward. Excellent work."
    };
  }

  if (score >= 35) {
    return {
      grade: "A",
      mood: "excited",
      text: "I like this trade a lot. It feels decisive, and I think the fans will understand what you are building."
    };
  }

  if (score >= 5) {
    return {
      grade: "B",
      mood: "happy",
      text: "Solid work. I can see the basketball logic here, and it gives us a cleaner direction."
    };
  }

  if (score >= -25) {
    return {
      grade: "C",
      mood: "measured",
      text: "I am not upset, but I am not celebrating either. I need this move to make sense once we see it on the floor."
    };
  }

  if (score >= -65) {
    return {
      grade: "D",
      mood: "mad",
      text: "I do not love this. It looks like we gave up too much, and I need you to prove this was worth it."
    };
  }

  return {
    grade: "F",
    mood: "furious",
    text: "I am not happy with this trade. From where I sit, we just weakened the organization. We need to talk about your plan."
  };
}

function sendOwnerTradeCompletionReaction(offer, deal, reaction) {
  if (typeof ensureGMHubPhoneState !== "function") return;

  const phoneState = ensureGMHubPhoneState();
  const thread = getOrCreateOwnerPhoneThread(phoneState);

  if (!thread) return;

  const teamsText = (deal?.teams || [])
    .map(teamItem => getTeamById(teamItem.teamId))
    .filter(Boolean)
    .map(team => team.name)
    .join(" / ");

  const messageText = `Trade grade: ${reaction.grade}. ${reaction.text}${teamsText ? ` Deal: ${teamsText}.` : ""}`;

  if (!Array.isArray(thread.messages)) {
    thread.messages = [];
  }

  thread.messages.push({
    id: `owner-trade-reaction-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    direction: "incoming",
    senderName: thread.name || "Owner",
    text: messageText,
    meta: "Now",
    tradeReaction: {
      formalOfferId: offer?.id || null,
      grade: reaction.grade,
      mood: reaction.mood
    }
  });

  thread.preview = `Trade grade: ${reaction.grade}`;
  thread.time = "Now";
  thread.unread = true;

  phoneState.threadMeta[thread.id] = {
    ...(phoneState.threadMeta[thread.id] || {}),
    unread: true
  };

  if (typeof updateGMHubPhoneButtonNotification === "function") {
    updateGMHubPhoneButtonNotification();
  }

  if (typeof renderGMHubPhoneModal === "function") {
    renderGMHubPhoneModal();
  }
}

function getOrCreateOwnerPhoneThread(phoneState) {
  if (!phoneState) return null;

  if (!phoneState.threads) {
    phoneState.threads = {};
  }

  if (!phoneState.threadMeta) {
    phoneState.threadMeta = {};
  }

  const existing = Object.values(phoneState.threads).find(thread =>
    String(thread.type || "").toLowerCase() === "owner"
  );

  if (existing) return existing;

  const ownerName = getSelectedTeamOwnerName();
  const threadId = "phone-seed-owner";

  phoneState.threads[threadId] = {
    id: threadId,
    type: "owner",
    name: ownerName,
    role: "Owner",
    preview: "Owner conversation opened.",
    time: "Now",
    unread: false,
    messages: []
  };

  return phoneState.threads[threadId];
}

function getSelectedTeamOwnerName() {
  const teamId = Number(gameState?.selectedTeamId || 0);
  const staffGroup = typeof getTeamStaff === "function"
    ? getTeamStaff(teamId)
    : (gameState?.staff ? gameState.staff[teamId] || gameState.staff[String(teamId)] : null);
  const ownerName = getStaffLikeName(
    staffGroup?.owner ||
    staffGroup?.frontOffice?.owner
  );

  if (ownerName) return ownerName;

  if (typeof getFixedStaffForTeam === "function") {
    const fixedOwner = getFixedStaffForTeam(teamId).find(member =>
      member &&
      !member.isVacant &&
      String(member.role || "").toLowerCase() === "owner"
    );
    const fixedName = getStaffLikeName(fixedOwner);

    if (fixedName) return fixedName;
  }

  return "Owner";
}

function renderTradePackageAttachmentTeamBlock(team, assets) {
  const teamId = Number(team.teamId);
  const receives = assets.filter(asset => Number(asset.toTeamId) === teamId);
  const sends = assets.filter(asset => Number(asset.fromTeamId) === teamId);

  return `
    <div class="gm-phone-trade-package-team">
      <h4>${escapeTradePhoneHtml(team.name || "Team")}</h4>
      <div>
        <span>Receives</span>
        <p>${receives.length ? receives.map(asset => escapeTradePhoneHtml(asset.playerName || asset.name || getTradeBoardAssetName(asset))).join(", ") : "Nothing"}</p>
      </div>
      <div>
        <span>Sends</span>
        <p>${sends.length ? sends.map(asset => escapeTradePhoneHtml(asset.playerName || asset.name || getTradeBoardAssetName(asset))).join(", ") : "Nothing"}</p>
      </div>
    </div>
  `;
}

function findTradePhonePackageAttachment(packageId) {
  if (typeof ensureGMHubPhoneState !== "function") return null;

  const phoneState = ensureGMHubPhoneState();

  for (let thread of Object.values(phoneState.threads || {})) {
    for (let message of thread.messages || []) {
      const attachment = (message.attachments || []).find(item =>
        String(item.id) === String(packageId)
      );

      if (attachment) {
        return attachment;
      }
    }
  }

  return null;
}

function loadTradePhonePackageInBuilder(packageId) {
  const context = findTradePhonePackageContext(packageId);
  const attachment = context?.attachment || findTradePhonePackageAttachment(packageId);

  if (!attachment) return;

  if (attachment.negotiationId || context?.thread?.activeTradeNegotiationId) {
    openTradePhoneBuilderOverlay(
      packageId,
      context?.thread?.id || attachment.threadId,
      attachment.negotiationId || context?.thread?.activeTradeNegotiationId
    );
    return;
  }

  closeTradePhonePackageModal();

  loadTradePhonePackageIntoTradeRoom(attachment);

  if (typeof showMainSection === "function") {
    showMainSection("trades");
  }

  if (typeof showSecondaryScreen === "function") {
    showSecondaryScreen("transfers-screen");
  }

  updateTradeRoomHeader();
  renderTradeRoom();
}

function showTradePhonePackageDetails(packageId) {
  const attachment = findTradePhonePackageAttachment(packageId);

  if (!attachment) return;

  const legalText = attachment.legalityStatus?.reason || "This package is saved in the phone thread.";

  showTradeSimplePopup(
    "Trade Package",
    legalText
  );
}

function withdrawTradePhonePackage(packageId) {
  const attachment = findTradePhonePackageAttachment(packageId);

  if (!attachment) return;

  attachment.status = "withdrawn";

  closeTradePhonePackageModal();

  showTradeSimplePopup(
    "Package Withdrawn",
    "This package is marked withdrawn in the phone thread."
  );

  if (typeof renderGMHubPhoneModal === "function") {
    renderGMHubPhoneModal();
  }
}

function getTradeCallSpeakerName(message, deal) {
  if (!message) return "Call";

  if (message.speaker === "user") {
    return "You";
  }

  if (message.speaker === "system") {
    return "Call Log";
  }

  const team = getTeamById(message.teamId || deal.activeCallTeamId);

  if (team) {
    return getIncomingGmName(team);
  }

  return getTeamGmName(deal.activeCallTeamId);
}

function handleTradeGmCallAction(dealId, actionType) {
  const deal = getTradeBoardDealById(dealId);

  if (!deal) return;

  const otherTeamId = Number(deal.activeCallTeamId || getTradeBoardPrimaryOtherTeamId(deal));
  const otherTeam = getTeamById(otherTeamId);

  if (!otherTeam) return;

  if (!Array.isArray(deal.callMessages)) {
    deal.callMessages = [];
  }

  if (actionType === "pitch") {
    deal.callMessages.push({
      speaker: "user",
      text: "We think this framework makes sense for both sides. Is this something you would seriously discuss?"
    });

    handleTradeGmPitchResponse(deal, otherTeam);
    renderTradeGmCallScreen(deal.id);
    return;
  }

  if (actionType === "ask-price") {
    deal.callMessages.push({
      speaker: "user",
      text: "What would it take for you to get serious on this deal?"
    });

    handleTradeGmAskPriceResponse(deal, otherTeam);
    renderTradeGmCallScreen(deal.id);
    return;
  }

  if (actionType === "formal-offer") {
    deal.callMessages.push({
      speaker: "user",
      text: "We are ready to put this exact framework on the table as a formal offer."
    });

    handleTradeGmFormalOfferResponse(deal, otherTeam);
    renderTradeGmCallScreen(deal.id);
    return;
  }

  if (actionType === "end-call") {
    deal.callMessages.push({
      speaker: "user",
      text: "We will circle back later."
    });

    deal.callMessages.push({
      speaker: "gm",
      teamId: Number(otherTeam.id),
      text: "Sounds good. Keep us posted if the framework changes."
    });

    deal.callStatus = "ended";
    deal.lastGmResponse = `Call ended with ${otherTeam.name}.`;
    deal.updatedDate = getTradeBoardDateText();

    addTradeBoardSystemNote(
      deal,
      `Call ended with ${otherTeam.name}.`
    );

    renderTradeGmCallScreen(deal.id);
  }
}

function handleTradeGmPitchResponse(deal, otherTeam) {
  const score = getTradeGmInterestScore(deal, otherTeam.id);

  deal.stage = "Discuss With GM";
  deal.updatedDate = getTradeBoardDateText();

  if (score >= 85) {
    const text = "That is actually a pretty interesting framework. If you make this formal, we would have to take it seriously.";

    deal.callMessages.push({
      speaker: "gm",
      teamId: Number(otherTeam.id),
      text
    });

    deal.lastGmResponse = `${otherTeam.name} is very interested in the framework.`;
    addTradeBoardSystemNote(deal, text);
    return;
  }

  if (score >= 20) {
    const text = "We are not saying yes yet, but this is close enough to keep talking.";

    deal.callMessages.push({
      speaker: "gm",
      teamId: Number(otherTeam.id),
      text
    });

    deal.lastGmResponse = `${otherTeam.name} is open to continuing talks.`;
    addTradeBoardSystemNote(deal, text);
    return;
  }

  if (score >= -70) {
    const text = getTradeGmCounterRequestText(deal, otherTeam);

    deal.callMessages.push({
      speaker: "gm",
      teamId: Number(otherTeam.id),
      text
    });

    deal.lastGmResponse = `${otherTeam.name} wants the framework improved.`;
    addTradeBoardSystemNote(deal, text);
    return;
  }

  const hangsUp = Math.random() < 0.45;

  if (hangsUp) {
    const text = "We are not close. Call us back if you are serious.";

    deal.callMessages.push({
      speaker: "gm",
      teamId: Number(otherTeam.id),
      text
    });

    deal.callStatus = "hung-up";
    deal.lastGmResponse = `${otherTeam.name} hung up because the offer was not close.`;
    addTradeBoardSystemNote(deal, text);
    return;
  }

  const text = "That does not work for us. You would need to add real value before we keep going.";

  deal.callMessages.push({
    speaker: "gm",
    teamId: Number(otherTeam.id),
    text
  });

  deal.lastGmResponse = `${otherTeam.name} rejected the current framework.`;
  addTradeBoardSystemNote(deal, text);
}

function handleTradeGmAskPriceResponse(deal, otherTeam) {
  const score = getTradeGmInterestScore(deal, otherTeam.id);
  let text = "";

  if (score >= 65) {
    text = "You are already in the range. If this becomes formal, we would look at it seriously.";
  } else if (score >= -25) {
    text = getTradeGmCounterRequestText(deal, otherTeam);
  } else {
    text = "We would need a stronger asset coming back. Right now this feels more like you checking our temperature than a real offer.";
  }

  deal.callMessages.push({
    speaker: "gm",
    teamId: Number(otherTeam.id),
    text
  });

  deal.stage = "Discuss With GM";
  deal.lastGmResponse = text;
  deal.updatedDate = getTradeBoardDateText();

  addTradeBoardSystemNote(deal, text);
}

function handleTradeGmFormalOfferResponse(deal, otherTeam) {
  const legal = getTradeBoardLegalityForDeal(deal);

  if (!legal.legal) {
    deal.callMessages.push({
      speaker: "system",
      text: `Formal offer blocked: ${legal.reason}`
    });

    deal.lastGmResponse = legal.reason;
    addTradeBoardSystemNote(deal, `Formal offer blocked: ${legal.reason}`);
    return;
  }

  const score = getTradeGmInterestScore(deal, otherTeam.id);
  const roll = Math.random() * 40 - 20;
  const finalScore = score + roll;

  deal.stage = "Formal Offer";
  deal.updatedDate = getTradeBoardDateText();

  if (finalScore >= 90) {
    const text = "We can agree to that framework. Send it through pending final processing.";

    deal.stage = "Agreed Upon";
    deal.callStatus = "ended";
    deal.lastGmResponse = `${otherTeam.name} agreed to the framework.`;

    deal.callMessages.push({
      speaker: "gm",
      teamId: Number(otherTeam.id),
      text
    });

    addTradeBoardSystemNote(deal, text);
    return;
  }

  if (finalScore >= 35) {
    const text = "We are close, but we need one more piece before we can agree.";

    deal.lastGmResponse = `${otherTeam.name} says the formal offer is close, but not accepted.`;

    deal.callMessages.push({
      speaker: "gm",
      teamId: Number(otherTeam.id),
      text
    });

    addTradeBoardSystemNote(deal, text);
    return;
  }

  if (finalScore >= -60) {
    const text = "We are going to pass on the formal offer as currently built.";

    deal.lastGmResponse = `${otherTeam.name} rejected the formal offer.`;

    deal.callMessages.push({
      speaker: "gm",
      teamId: Number(otherTeam.id),
      text
    });

    addTradeBoardSystemNote(deal, text);
    return;
  }

  const text = "That offer is not close. We are going to move on.";

  deal.callStatus = "hung-up";
  deal.lastGmResponse = `${otherTeam.name} rejected the formal offer and ended the call.`;

  deal.callMessages.push({
    speaker: "gm",
    teamId: Number(otherTeam.id),
    text
  });

  addTradeBoardSystemNote(deal, text);
}

function getTradeGmCounterRequestText(deal, otherTeam) {
  const teamId = Number(otherTeam.id);
  const outgoingPlayers = deal.assets
    .filter(asset => asset.type === "player" && Number(asset.fromTeamId) === teamId)
    .map(asset => getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId))
    .filter(Boolean);

  const incomingPlayers = deal.assets
    .filter(asset => asset.type === "player" && Number(asset.toTeamId) === teamId)
    .map(asset => getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId))
    .filter(Boolean);

  const sendsBestPlayer = outgoingPlayers.some(player =>
    getTradeValue(player) >= 650
  );

  const receivesYoungPlayer = incomingPlayers.some(player =>
    Number(player.age || 25) <= 24
  );

  if (sendsBestPlayer && !receivesYoungPlayer) {
    return "If we are moving that kind of player, we need a young player with real upside coming back.";
  }

  const receivesEnoughPlayers = incomingPlayers.length >= outgoingPlayers.length;

  if (!receivesEnoughPlayers) {
    return "We would need another player in the framework. We are not comfortable with the current return.";
  }

  return "We would need the value improved. Add another asset or make the best incoming piece stronger.";
}

function getTradeGmInterestScore(deal, evaluatingTeamId) {
  const netValue = getTradeDealNetValueForTeam(deal, evaluatingTeamId);
  const salaryScore = getTradeDealSalaryComfortScore(deal, evaluatingTeamId);
  const rosterScore = getTradeDealRosterComfortScore(deal, evaluatingTeamId);

  return Math.round(netValue + salaryScore + rosterScore);
}

function getTradeDealNetValueForTeam(deal, teamId) {
  const incoming = deal.assets
    .filter(asset => Number(asset.toTeamId) === Number(teamId))
    .reduce((sum, asset) => sum + getTradeBoardAssetValue(asset), 0);

  const outgoing = deal.assets
    .filter(asset => Number(asset.fromTeamId) === Number(teamId))
    .reduce((sum, asset) => sum + getTradeBoardAssetValue(asset), 0);

  return incoming - outgoing;
}

function getTradeBoardAssetValue(asset) {
  if (!asset) return 0;

  if (asset.type === "player") {
    const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
    return player ? getTradeValue(player) : 0;
  }

  if (asset.type === "pick") {
    if (Number(asset.round) === 1) return 110;
    if (Number(asset.round) === 2) return 35;
    return 50;
  }

  return 0;
}

function getTradeDealSalaryComfortScore(deal, teamId) {
  const incomingSalary = deal.assets
    .filter(asset => Number(asset.toTeamId) === Number(teamId))
    .reduce((sum, asset) => sum + getTradeBoardAssetSalary(asset), 0);

  const outgoingSalary = deal.assets
    .filter(asset => Number(asset.fromTeamId) === Number(teamId))
    .reduce((sum, asset) => sum + getTradeBoardAssetSalary(asset), 0);

  const salaryChange = incomingSalary - outgoingSalary;

  if (salaryChange <= -10) return 25;
  if (salaryChange <= 0) return 12;
  if (salaryChange <= 8) return 0;
  if (salaryChange <= 18) return -18;
  return -40;
}

function getTradeBoardAssetSalary(asset) {
  if (!asset || asset.type !== "player") return 0;

  const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);

  return player ? Number(player.salary || 0) : 0;
}

function getTradeDealRosterComfortScore(deal, teamId) {
  const incomingCount = deal.assets.filter(asset =>
    asset.type === "player" &&
    Number(asset.toTeamId) === Number(teamId)
  ).length;

  const outgoingCount = deal.assets.filter(asset =>
    asset.type === "player" &&
    Number(asset.fromTeamId) === Number(teamId)
  ).length;

  const rosterChange = incomingCount - outgoingCount;

  if (rosterChange <= 0) return 5;
  if (rosterChange === 1) return -8;
  return -22;
}

function getTradeGmInterestLabel(score) {
  if (score >= 90) return "Very Interested";
  if (score >= 35) return "Interested";
  if (score >= -25) return "Negotiable";
  if (score >= -80) return "Unlikely";
  return "Not Close";
}

function getTradeBoardPrimaryOtherTeamId(deal) {
  const userTeam = getSelectedTeam();

  if (!deal || !Array.isArray(deal.teams) || !userTeam) return null;

  const otherTeam = deal.teams.find(item =>
    Number(item.teamId) !== Number(userTeam.id)
  );

  return otherTeam ? Number(otherTeam.teamId) : null;
}

function addTradeBoardSystemNote(deal, text) {
  if (!deal) return;

  if (!Array.isArray(deal.notes)) {
    deal.notes = [];
  }

  deal.notes.unshift({
    date: getTradeBoardDateText(),
    text
  });

  deal.updatedDate = getTradeBoardDateText();
}

function returnToTradeBoardFromCall() {
  if (typeof showSecondaryScreen === "function") {
    showSecondaryScreen("trade-board-screen");
  }

  renderTradeBoardScreen();
}

function loadTradeBoardDealIntoBuilder(dealId) {
  const deal = getTradeBoardDealById(dealId);
  if (!deal) return;

  const userTeam = getSelectedTeam();

  tradeRoom.activeBoardDealId = deal.id;

  tradeRoom.teams = deal.teams.map(team => ({
    teamId: Number(team.teamId),
    locked: userTeam ? Number(team.teamId) === Number(userTeam.id) : Boolean(team.locked),
    activeTab: team.activeTab || "roster"
  }));

  tradeRoom.assets = deal.assets.map(asset => ({ ...asset }));
  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  if (typeof showSecondaryScreen === "function") {
    showSecondaryScreen("transfers-screen");
  }

  updateTradeRoomHeader();
  renderTradeRoom();
}

/* ======================================================
   PART 1D FIX — SAFE BOARD GM CALL SCREEN RENDER
   Uses board-gm-call classes so it does not shrink old screen.
====================================================== */

function renderTradeGmCallScreen(dealId) {
  ensureTradeBoardState();

  const deal = getTradeBoardDealById(dealId);
  const root = document.getElementById("trade-call-root");

  if (!deal || !root) return;

  const otherTeamId = Number(deal.activeCallTeamId || getTradeBoardPrimaryOtherTeamId(deal));
  const otherTeam = getTeamById(otherTeamId);
  const userTeam = getSelectedTeam();

  if (!otherTeam || !userTeam) return;

  const teamColor = getTradeTeamPrimaryColor(otherTeam.id);
  const teamLogo = getTradeTeamLogoImage(otherTeam);
  const gmName = getIncomingGmName(otherTeam);
  const score = getTradeGmInterestScore(deal, otherTeam.id);
  const legal = getTradeBoardLegalityForDeal(deal);

  root.innerHTML = `
    <div class="board-gm-call-page" style="--board-call-team-color: ${teamColor};">
      <aside class="board-gm-call-side-panel">
        <div class="board-gm-call-team-card">
          <div class="board-gm-call-logo">
            ${
              teamLogo
                ? `<img src="${teamLogo}" alt="${escapeTradeBoardHtml(otherTeam.name)}" onerror="this.style.display='none'; this.parentElement.textContent='${escapeTradeBoardHtml(getTradeTeamLogoText(otherTeam))}';">`
                : escapeTradeBoardHtml(getTradeTeamLogoText(otherTeam))
            }
          </div>

          <div>
            <span>On The Line</span>
            <h2>${escapeTradeBoardHtml(gmName)}</h2>
            <p>${escapeTradeBoardHtml(otherTeam.name)}</p>
          </div>
        </div>

        <div class="board-gm-call-info-box">
          <span>Board Deal</span>
          <strong>${escapeTradeBoardHtml(deal.title || "Untitled Trade Concept")}</strong>
        </div>

        <div class="board-gm-call-info-box">
          <span>Stage</span>
          <strong>${escapeTradeBoardHtml(deal.stage || "Concept")}</strong>
        </div>

        <div class="board-gm-call-info-box">
          <span>Legal Status</span>
          <strong>${escapeTradeBoardHtml(legal.label)}</strong>
        </div>

        <div class="board-gm-call-info-box">
          <span>GM Interest</span>
          <strong>${escapeTradeBoardHtml(getTradeGmInterestLabel(score))}</strong>
        </div>

        <div class="board-gm-call-side-actions">
          <button type="button" onclick="loadTradeBoardDealIntoBuilder('${deal.id}')">
            Open In Builder
          </button>

          <button type="button" onclick="returnToTradeBoardFromCall()">
            Back To Board
          </button>
        </div>
      </aside>

      <main class="board-gm-call-main-panel">
        <div class="board-gm-call-chat-header">
          <div>
            <span>GM Call</span>
            <h1>${escapeTradeBoardHtml(otherTeam.name)}</h1>
          </div>

          <strong>${escapeTradeBoardHtml(getTradeBoardDateText())}</strong>
        </div>

        <div class="board-gm-call-deal-summary">
          ${renderTradeCallDealSummary(deal)}
        </div>

        <div class="board-gm-call-chat-log">
          ${renderTradeCallMessages(deal)}
        </div>

        <div class="board-gm-call-response-row">
          ${renderTradeCallResponseButtons(deal)}
        </div>
      </main>
    </div>
  `;
}

function renderTradeCallDealSummary(deal) {
  if (!deal || !Array.isArray(deal.teams)) return "";

  return deal.teams.map(teamItem => {
    const team = getTeamById(teamItem.teamId);
    if (!team) return "";

    const receives = deal.assets.filter(asset =>
      Number(asset.toTeamId) === Number(team.id)
    );

    const sends = deal.assets.filter(asset =>
      Number(asset.fromTeamId) === Number(team.id)
    );

    return `
      <div class="board-gm-call-summary-card">
        <h3>${escapeTradeBoardHtml(team.name)}</h3>

        <div>
          <span>Receives</span>
          ${renderTradeCallMiniAssets(receives)}
        </div>

        <div>
          <span>Sends</span>
          ${renderTradeCallMiniAssets(sends)}
        </div>
      </div>
    `;
  }).join("");
}

function renderTradeCallMiniAssets(assets) {
  if (!assets || assets.length === 0) {
    return `<p class="board-gm-call-empty-assets">Nothing</p>`;
  }

  return assets.map(asset => `
    <p class="board-gm-call-mini-asset">
      ${escapeTradeBoardHtml(getTradeBoardAssetName(asset))}
    </p>
  `).join("");
}

function renderTradeCallMessages(deal) {
  if (!deal.callMessages || deal.callMessages.length === 0) {
    return `<p class="board-gm-call-empty-chat">No messages yet.</p>`;
  }

  return deal.callMessages.map(message => {
    const typeClass =
      message.speaker === "user"
        ? "user"
        : message.speaker === "system"
        ? "system"
        : "gm";

    return `
      <div class="board-gm-call-message ${typeClass}">
        <div class="board-gm-call-bubble">
          <div class="board-gm-call-message-name">
            ${escapeTradeBoardHtml(getTradeCallSpeakerName(message, deal))}
          </div>

          <p>${escapeTradeBoardHtml(message.text)}</p>
        </div>
      </div>
    `;
  }).join("");
}

function renderTradeCallResponseButtons(deal) {
  if (deal.callStatus === "ended") {
    return `
      <button type="button" onclick="returnToTradeBoardFromCall()">
        Return To The Board
      </button>
    `;
  }

  if (deal.callStatus === "hung-up") {
    return `
      <button type="button" onclick="loadTradeBoardDealIntoBuilder('${deal.id}')">
        Revise In Builder
      </button>

      <button type="button" onclick="returnToTradeBoardFromCall()">
        Return To The Board
      </button>
    `;
  }

  return `
    <button type="button" onclick="handleTradeGmCallAction('${deal.id}', 'pitch')">
      Pitch Framework
    </button>

    <button type="button" onclick="handleTradeGmCallAction('${deal.id}', 'ask-price')">
      Ask Price
    </button>

    <button type="button" onclick="handleTradeGmCallAction('${deal.id}', 'formal-offer')">
      Make Formal Offer
    </button>

    <button type="button" onclick="handleTradeGmCallAction('${deal.id}', 'end-call')">
      End Call
    </button>
  `;
}

/* ======================================================
   PART 1E — FINAL TRADE PROCESSING
====================================================== */

function openTradeFinalizationModal(dealId) {
  ensureTradeBoardState();

  const deal = getTradeBoardDealById(dealId);

  if (!deal) return;

  const report = getTradeFinalizationReport(deal);

  const existing = document.getElementById("trade-finalization-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "trade-finalization-overlay";
  overlay.className = "trade-finalization-overlay";

  overlay.innerHTML = `
    <div class="trade-finalization-panel">
      <div class="trade-finalization-header">
        <div>
          <span>Final Processing</span>
          <h2>${escapeTradeBoardHtml(deal.title || "Untitled Trade Concept")}</h2>
          <p>Review the final trade check before sending it through the league office.</p>
        </div>

        <button type="button" onclick="closeTradeFinalizationModal()">×</button>
      </div>

      <div class="trade-finalization-body">
        <div class="trade-finalization-status ${report.canFinalize ? "good" : "bad"}">
          <span>Status</span>
          <strong>${report.canFinalize ? "Ready To Finalize" : "Cannot Finalize"}</strong>
          <p>${escapeTradeBoardHtml(report.summary)}</p>
        </div>

        <div class="trade-finalization-section">
          <h3>Trade Breakdown</h3>
          <div class="trade-finalization-team-grid">
            ${renderTradeFinalizationTeams(deal)}
          </div>
        </div>

        <div class="trade-finalization-section">
          <h3>Final Checks</h3>
          <div class="trade-finalization-check-list">
            ${report.checks.map(check => `
              <div class="trade-finalization-check ${check.ok ? "good" : "bad"}">
                <strong>${check.ok ? "PASS" : "ISSUE"}</strong>
                <span>${escapeTradeBoardHtml(check.text)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="trade-finalization-actions">
        <button type="button" onclick="closeTradeFinalizationModal()">
          Go Back
        </button>

        <button
          type="button"
          class="finalize-trade-button"
          ${report.canFinalize ? "" : "disabled"}
          onclick="finalizeTradeBoardDeal('${deal.id}')"
        >
          Finalize Trade
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeTradeFinalizationModal() {
  const overlay = document.getElementById("trade-finalization-overlay");

  if (overlay) {
    overlay.remove();
  }
}

function renderTradeFinalizationTeams(deal) {
  if (!deal || !Array.isArray(deal.teams)) return "";

  return deal.teams.map(teamItem => {
    const team = getTeamById(teamItem.teamId);
    if (!team) return "";

    const receives = deal.assets.filter(asset =>
      Number(asset.toTeamId) === Number(team.id)
    );

    const sends = deal.assets.filter(asset =>
      Number(asset.fromTeamId) === Number(team.id)
    );

    return `
      <div class="trade-finalization-team-card">
        <h4>${escapeTradeBoardHtml(team.name)}</h4>

        <div>
          <span>Receives</span>
          ${renderTradeFinalizationAssetList(receives)}
        </div>

        <div>
          <span>Sends</span>
          ${renderTradeFinalizationAssetList(sends)}
        </div>
      </div>
    `;
  }).join("");
}

function renderTradeFinalizationAssetList(assets) {
  if (!assets || assets.length === 0) {
    return `<p class="trade-finalization-empty">Nothing</p>`;
  }

  return assets.map(asset => `
    <p class="trade-finalization-asset">
      ${escapeTradeBoardHtml(getTradeBoardAssetName(asset))}
    </p>
  `).join("");
}

function getTradeFinalizationReport(deal) {
  const checks = [];

  if (!deal) {
    return {
      canFinalize: false,
      summary: "No trade deal was found.",
      checks: [
        {
          ok: false,
          text: "Trade deal does not exist."
        }
      ]
    };
  }

  const hasAgreement = deal.stage === "Agreed Upon";

  checks.push({
    ok: hasAgreement,
    text: hasAgreement
      ? "Both sides have agreed to the framework."
      : "This deal must reach Agreed Upon before it can be finalized."
  });

  const legality = getTradeBoardLegalityForDeal(deal);

  checks.push({
    ok: legality.legal,
    text: legality.legal
      ? "Trade passes the current legal check."
      : legality.reason
  });

  const hasPickAssets = deal.assets.some(asset => asset.type === "pick");

  checks.push({
    ok: !hasPickAssets,
    text: hasPickAssets
      ? "Pick processing is saved for Part 3. Remove picks before finalizing this version."
      : "No draft pick processing needed for this deal."
  });

  const playerCheck = getTradeFinalPlayerExistenceCheck(deal);

  checks.push({
    ok: playerCheck.ok,
    text: playerCheck.text
  });

  const rosterCheck = getTradeFinalRosterLimitCheck(deal);

  checks.push({
    ok: rosterCheck.ok,
    text: rosterCheck.text
  });

  const physicalCheck = {
    ok: true,
    text: "Physical exams are treated as passed for Part 1."
  };

  checks.push(physicalCheck);

  const canFinalize = checks.every(check => check.ok);

  return {
    canFinalize,
    summary: canFinalize
      ? "This trade can be finalized and processed."
      : "This trade has issues that must be fixed first.",
    checks
  };
}

function getTradeFinalPlayerExistenceCheck(deal) {
  const missingPlayers = [];

  for (const asset of deal.assets) {
    if (asset.type !== "player") continue;

    const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);

    if (!player) {
      missingPlayers.push(getTradeBoardAssetName(asset));
    }
  }

  if (missingPlayers.length > 0) {
    return {
      ok: false,
      text: `Missing player asset: ${missingPlayers.join(", ")}. The player may already have moved teams.`
    };
  }

  return {
    ok: true,
    text: "All player assets are still on their expected teams."
  };
}

function getTradeFinalRosterLimitCheck(deal) {
  const teamIds = deal.teams.map(team => Number(team.teamId));

  for (const teamId of teamIds) {
    const roster = getRosterByTeamId(teamId);
    const currentCount = Array.isArray(roster) ? roster.length : 0;

    const outgoingPlayers = deal.assets.filter(asset =>
      asset.type === "player" &&
      Number(asset.fromTeamId) === Number(teamId)
    ).length;

    const incomingPlayers = deal.assets.filter(asset =>
      asset.type === "player" &&
      Number(asset.toTeamId) === Number(teamId)
    ).length;

    const projectedCount = currentCount - outgoingPlayers + incomingPlayers;

    const team = getTeamById(teamId);

    if (projectedCount > 15) {
      return {
        ok: false,
        text: `${team ? team.name : "A team"} would have ${projectedCount} players after the trade. Maximum is 15.`
      };
    }
  }

  return {
    ok: true,
    text: "Roster spot limits are okay after the trade."
  };
}

function finalizeTradeBoardDeal(dealId) {
  ensureTradeBoardState();

  const deal = getTradeBoardDealById(dealId);

  if (!deal) return;

  const report = getTradeFinalizationReport(deal);

  if (!report.canFinalize) {
    showTradeSimplePopup(
      "Cannot Finalize",
      report.summary
    );
    return;
  }

  const confirmFinal = confirm(
    `Finalize "${deal.title || "Untitled Trade Concept"}"? This will move the players between teams.`
  );

  if (!confirmFinal) return;

  const result = processFinalTradeDeal(deal);

  if (!result.success) {
    showTradeSimplePopup(
      "Trade Failed",
      result.message
    );
    return;
  }

  deal.stage = "Completed";
  deal.completed = true;
  deal.archived = true;
  deal.completedDate = getTradeBoardDateText();
  deal.updatedDate = getTradeBoardDateText();
  deal.lastGmResponse = "Trade completed and processed by the league office.";

  addTradeBoardSystemNote(
    deal,
    "Trade finalized and players moved between rosters."
  );

  if (tradeRoom.activeBoardDealId === deal.id) {
    tradeRoom.activeBoardDealId = null;
  }

  closeTradeFinalizationModal();

  clearTradeRoomAfterCompletedDeal();

  recordCompletedTradeFromBoardDeal(deal);

  renderTradeBoardScreen();

  if (typeof displayTradeHistory === "function") {
    displayTradeHistory();
  }

  showTradeSimplePopup(
    "Trade Finalized",
    result.message
  );
}

function processFinalTradeDeal(deal) {
  const playerMoves = [];

  for (const asset of deal.assets) {
    if (asset.type !== "player") continue;

    const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);

    if (!player) {
      return {
        success: false,
        message: `Could not find ${getTradeBoardAssetName(asset)} on the expected roster.`
      };
    }

    asset.playerName = asset.playerName || getIncomingCallPlayerName(player);
    asset.name = asset.name || asset.playerName;

    const fromTeam = getTeamById(asset.fromTeamId);
    const toTeam = getTeamById(asset.toTeamId);

    playerMoves.push({
      player,
      playerId: Number(player.id || player.playerId || asset.playerId),
      playerName: asset.playerName,
      fromTeamId: Number(asset.fromTeamId),
      fromTeamName: fromTeam ? fromTeam.name : "",
      toTeamId: Number(asset.toTeamId),
      toTeamName: toTeam ? toTeam.name : ""
    });
  }

  deal.completedPlayerMoves = playerMoves.map(move => ({
    playerId: move.playerId,
    playerName: move.playerName,
    fromTeamId: move.fromTeamId,
    fromTeamName: move.fromTeamName,
    toTeamId: move.toTeamId,
    toTeamName: move.toTeamName
  }));

  for (const move of playerMoves) {
    removePlayerFromRosterByTeamId(move.playerId, move.fromTeamId);
  }

  for (const move of playerMoves) {
    addPlayerToRosterByTeamId(move.player, move.toTeamId);
  }

  const teamsText = deal.teams
    .map(teamItem => getTeamById(teamItem.teamId))
    .filter(Boolean)
    .map(team => team.name)
    .join(", ");

  return {
    success: true,
    message: `Trade completed between ${teamsText}.`
  };
}

function removePlayerFromRosterByTeamId(playerId, teamId) {
  if (!gameState || !gameState.rosters) return;

  const roster = gameState.rosters[teamId];

  if (!Array.isArray(roster)) return;

  gameState.rosters[teamId] = roster.filter(player =>
    Number(player.id) !== Number(playerId) &&
    Number(player.playerId) !== Number(playerId)
  );
}

function addPlayerToRosterByTeamId(player, teamId) {
  if (!gameState || !gameState.rosters || !player) return;

  const team = getTeamById(teamId);

  if (!gameState.rosters[teamId]) {
    gameState.rosters[teamId] = [];
  }

  player.teamId = Number(teamId);

  if (team) {
    player.teamName = team.name;
    player.fictionalTeam = team.name;
    player.FictionalTeam = team.name;
  }

  const alreadyThere = gameState.rosters[teamId].some(rosterPlayer =>
    Number(rosterPlayer.id) === Number(player.id) ||
    Number(rosterPlayer.playerId) === Number(player.id) ||
    Number(rosterPlayer.id) === Number(player.playerId) ||
    Number(rosterPlayer.playerId) === Number(player.playerId)
  );

  if (!alreadyThere) {
    gameState.rosters[teamId].push(player);
  }
}

function clearTradeRoomAfterCompletedDeal() {
  const userTeam = getSelectedTeam();

  tradeRoom.teams = userTeam
    ? [
        {
          teamId: userTeam.id,
          locked: true,
          activeTab: "roster"
        }
      ]
    : [];

  tradeRoom.assets = [];
  tradeRoom.leakRisk = 0;
  tradeRoom.callActive = false;

  updateTradeRoomHeader();
  renderTradeRoom();
}

function recordCompletedTradeFromBoardDeal(deal) {
  if (!gameState.tradeHistory) {
    gameState.tradeHistory = [];
  }

  const userTeam = getSelectedTeam();

  const userSent = deal.assets
    .filter(asset =>
      asset.type === "player" &&
      userTeam &&
      Number(asset.fromTeamId) === Number(userTeam.id)
    )
    .map(asset => ({
      name: getTradeBoardAssetName(asset),
      playerId: asset.playerId
    }));

  const userReceived = deal.assets
    .filter(asset =>
      asset.type === "player" &&
      userTeam &&
      Number(asset.toTeamId) === Number(userTeam.id)
    )
    .map(asset => ({
      name: getTradeBoardAssetName(asset),
      playerId: asset.playerId
    }));

  const otherTeam = deal.teams
    .map(teamItem => getTeamById(teamItem.teamId))
    .filter(Boolean)
    .find(team => !userTeam || Number(team.id) !== Number(userTeam.id));

  gameState.tradeHistory.unshift({
    id: `completed-trade-${Date.now()}`,
    date: getTradeBoardDateText(),
    title: deal.title || "Untitled Trade Concept",
    teams: deal.teams.map(team => ({ ...team })),
    assets: deal.assets.map(asset => ({ ...asset })),
    userTeamName: userTeam ? userTeam.name : "Your Team",
    otherTeamName: otherTeam ? otherTeam.name : "Another Team",
    userSent,
    userReceived,
    source: "trade-board"
  });

  recordCompletedTradeTransaction(deal);
}

function recordCompletedTradeTransaction(deal) {
  if (!gameState.transactions) {
    gameState.transactions = [];
  }

  const teamsText = deal.teams
    .map(teamItem => getTeamById(teamItem.teamId))
    .filter(Boolean)
    .map(team => team.name)
    .join(" / ");

  const assetText = deal.assets
    .map(asset => getTradeBoardAssetName(asset))
    .join(", ");

  gameState.transactions.unshift({
    id: `transaction-trade-${Date.now()}`,
    date: getTradeBoardDateText(),
    type: "Trade",
    team: teamsText,
    teamName: teamsText,
    description: `${teamsText} completed a trade involving ${assetText}.`,
    headline: deal.title || "Trade Completed",
    assets: deal.assets.map(asset => ({ ...asset }))
  });
}
