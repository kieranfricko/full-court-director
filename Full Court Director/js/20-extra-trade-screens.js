function displayTeamIntel() {
  const screen = document.getElementById("team-intel-screen");

  if (!screen) return;

  screen.innerHTML = `
    <div class="team-intel-container">
      <div class="team-intel-header">
        <h2>TEAM INTEL</h2>
        <p>
          League-wide front office intelligence including team direction,
          trade activity, and cap situation.
        </p>
      </div>

      <div id="team-intel-content"></div>
    </div>
  `;

  renderTeamIntelBoard();
}

function renderTeamIntelBoard() {
  const container = document.getElementById("team-intel-content");
  if (!container || !gameState || !gameState.teams) return;

  const rankedTeams = getTeamIntelRankings();
  const divisions = getTradeIntelDivisions();

  container.innerHTML = divisions.map(division => `
    <div class="team-intel-division">
      <div class="team-intel-division-title">${division.name}</div>

      <div class="team-intel-grid">
        ${division.teams.map(team => {
          const intel = rankedTeams.find(item => Number(item.team.id) === Number(team.id));
          return renderTeamIntelCard(intel);
        }).join("")}
      </div>
    </div>
  `).join("");
}

function getTeamIntelRankings() {
  const teams = gameState.teams.map(team => {
    const roster = getRosterByTeamId(team.id);
    const topPlayers = roster
      .slice()
      .sort((a, b) => Number(b.currentAbility || 0) - Number(a.currentAbility || 0))
      .slice(0, 8);

    const strength = topPlayers.length
      ? topPlayers.reduce((sum, player) => sum + Number(player.currentAbility || 0), 0) / topPlayers.length
      : 0;

    const avgAge = roster.length
      ? roster.reduce((sum, player) => sum + Number(player.age || 25), 0) / roster.length
      : 25;

    return { team, strength, avgAge };
  });

  teams.sort((a, b) => b.strength - a.strength);

  return teams.map((item, index) => {
    const rank = index + 1;
    const identity = getTeamIdentityFromRank(rank);
    const tradeStatus = getTeamTradeStatusWithOverride(item.team.id, identity, item.avgAge, rank);
    const timeline = getTeamTimeline(item.avgAge, identity);
    const capSpace = getCapSpace(item.team.id);

    return {
      ...item,
      rank,
      identity,
      tradeStatus,
      timeline,
      capSpace
    };
  });
}  

function getTeamIdentityFromRank(rank) {
  if (rank <= 4) return "Championship Contender";
  if (rank <= 8) return "Contender";
  if (rank <= 12) return "Playoff Team";
  if (rank <= 18) return "Play-In Team";
  if (rank <= 25) return "Lottery Team";
  return "Bottom Of The League";
}

function getTeamTradeStatus(identity, avgAge, rank) {
  if (identity === "Championship Contender" && avgAge >= 27) return "Aggressive Buyer";
  if (identity === "Championship Contender") return "Buyer";

  if (identity === "Contender") return avgAge >= 26 ? "Aggressive Buyer" : "Buyer";
  if (identity === "Playoff Team") return "Buyer";
  if (identity === "Play-In Team") return avgAge <= 25 ? "Building Around Young Core" : "Re-Evaluating";

  if (identity === "Lottery Team") return avgAge <= 24.8 ? "Building Around Young Core" : "Seller";
  if (identity === "Bottom Of The League") return avgAge >= 26 ? "Aggressive Seller" : "Building Around Young Core";

  return "Neutral";
}

function getTeamTimeline(avgAge, identity) {
  if (identity === "Championship Contender" || identity === "Contender") return "Win Now";
  if (avgAge <= 24.5) return "Long-Term Build";
  if (avgAge <= 26) return "2-4 Years";
  return "1-2 Years";
}

function renderTeamIntelCard(intel) {
  if (!intel) return "";

  const team = intel.team;
  const color = getTradeTeamPrimaryColor(team.id);
  const capClass = intel.capSpace >= 0 ? "positive" : "negative";
  const capText = `${intel.capSpace >= 0 ? "+" : "-"}${formatMoney(Math.abs(intel.capSpace))}`;

  return `
    <div class="team-intel-card" style="--team-color:${color};">
      <div class="team-intel-team-name">${team.name}</div>

      <div class="team-intel-rank">Power Ranking: #${getTeamIntelPowerRank(team.id)}</div>

      <div class="team-intel-row">
        <span>Identity</span>
        <strong>${intel.identity}</strong>
      </div>

      ${Number(team.id) === Number(gameState.selectedTeamId) ? `
        <div class="team-intel-row">
            <span>Your Trade Status</span>
            <select class="team-intel-status-select" onchange="setUserTradeStatusOverride(this.value)">
            ${renderUserTradeStatusOptions(intel.tradeStatus)}
            </select>
        </div>
        ` : `
        <div class="team-intel-row">
            <span>Trade Status</span>
            <strong>${intel.tradeStatus}</strong>
        </div>
        `}

      <div class="team-intel-cap ${capClass}">
        ${capText}
        <small>${intel.capSpace >= 0 ? "Cap Space" : "Over Cap"}</small>
      </div>

      <div class="team-intel-row">
        <span>Timeline</span>
        <strong>${intel.timeline}</strong>
      </div>
    </div>
  `;
}

function getTeamIntelPowerRank(teamId) {
  if (typeof ensurePowerRankingsState === "function") {
    ensurePowerRankingsState();
  }

  if (
    !gameState.powerRankings ||
    !Array.isArray(gameState.powerRankings.rankings) ||
    gameState.powerRankings.rankings.length === 0
  ) {
    if (typeof updatePowerRankingsSnapshot === "function") {
      updatePowerRankingsSnapshot();
    }
  }

  const item = gameState.powerRankings.rankings.find(rank =>
    Number(rank.teamId) === Number(teamId)
  );

  return item ? item.rank : "--";
}

function getTeamTradeStatusWithOverride(teamId, identity, avgAge, rank) {
  if (
    Number(teamId) === Number(gameState.selectedTeamId) &&
    gameState.userTradeStatusOverride
  ) {
    return gameState.userTradeStatusOverride;
  }

  return getTeamTradeStatus(identity, avgAge, rank);
}

function renderUserTradeStatusOptions(currentStatus) {
  const statuses = [
    "Aggressive Buyer",
    "Buyer",
    "Neutral",
    "Re-Evaluating",
    "Building Around Young Core",
    "Seller",
    "Aggressive Seller"
  ];

  return statuses.map(status => `
    <option value="${status}" ${status === currentStatus ? "selected" : ""}>
      ${status}
    </option>
  `).join("");
}

function setUserTradeStatusOverride(status) {
  gameState.userTradeStatusOverride = status;
  renderTeamIntelBoard();
}

function displayTradeDeadline() {
  const screen = document.getElementById("trade-deadline-screen");
  if (!screen) return;

  const days = getDaysUntilTradeDeadline();
  const status = getTradeDeadlineStatus(days);
  const buyers = getTradeDeadlineTeamsByStatus(["Aggressive Buyer", "Buyer"]);
  const sellers = getTradeDeadlineTeamsByStatus(["Seller", "Aggressive Seller"]);

  screen.innerHTML = `
    <div class="trade-deadline-page">
      <div class="trade-deadline-hero">
        <div>
          <h2>Trade Deadline</h2>
          <p>Track deadline pressure, buyers, sellers, and completed trades.</p>
        </div>

        <div class="trade-deadline-countdown">
          <strong>${days}</strong>
          <span>Days Remaining</span>
          <small>${status}</small>
        </div>
      </div>

      <div class="trade-deadline-grid">
        <div class="trade-deadline-card">
          <h3>Buyers</h3>
          ${renderTradeDeadlineTeamList(buyers)}
        </div>

        <div class="trade-deadline-card">
          <h3>Sellers</h3>
          ${renderTradeDeadlineTeamList(sellers)}
        </div>
      </div>

      <div class="trade-deadline-card trade-tracker-card">
        <h3>Trade Tracker</h3>
        ${renderTradeDeadlineTracker()}
      </div>
    </div>
  `;
}

function getTradeDeadlineStatus(days) {
  if (days <= 0) return "Closed";
  if (days <= 7) return "Deadline Week";
  if (days <= 20) return "Approaching";
  return "Open";
}

function getTradeDeadlineTeamsByStatus(statuses) {
  const intel = getTeamIntelRankings();

  return intel
    .filter(item => statuses.includes(item.tradeStatus))
    .slice(0, 8);
}

function renderTradeDeadlineTeamList(items) {
  if (!items.length) {
    return `<p class="trade-deadline-empty">No teams listed.</p>`;
  }

  return `
    <div class="trade-deadline-team-list">
      ${items.map(item => {
        const color = getTradeTeamPrimaryColor(item.team.id);

        return `
          <div class="trade-deadline-team-row" style="--team-color:${color};">
            <strong>${item.team.name}</strong>
            <span>${item.tradeStatus}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderTradeDeadlineTracker() {
  if (!gameState.tradeHistory || gameState.tradeHistory.length === 0) {
    return `<p class="trade-deadline-empty">No completed trades yet.</p>`;
  }

  return `
    <div class="trade-deadline-tracker-list">
      ${gameState.tradeHistory.slice(0, 10).map(trade => `
        <div class="trade-deadline-tracker-item">
          <strong>${trade.date}</strong>
          ${renderCompletedTradeSummary(trade)}
        </div>
      `).join("")}
    </div>
  `;
}

function renderCompletedTradeSummary(trade) {
  if (!trade.teams || !trade.teams.length) {
    return `<p>Trade details unavailable.</p>`;
  }

  return `
    <div class="completed-trade-summary">
      ${trade.teams.map(team => `
        <div class="completed-trade-team">
          <strong>${team.teamName}</strong>
          <span>Received: ${team.incoming.length ? team.incoming.join(", ") : "Nothing"}</span>
          <span>Sent: ${team.outgoing.length ? team.outgoing.join(", ") : "Nothing"}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function displayTradeBlock() {
  const screen = document.getElementById("trade-block-screen");
  if (!screen) return;

  screen.innerHTML = `
    <div class="team-intel-container">
      <div class="team-intel-header">
        <h2>TRADE BLOCK</h2>
        <p>Players likely to be available because of bad contracts, expiring deals, or team direction.</p>
      </div>

      <div id="trade-block-content"></div>
    </div>
  `;

  renderTradeBlockBoard();
}

function renderTradeBlockBoard() {
  const container = document.getElementById("trade-block-content");
  if (!container || !gameState || !gameState.teams) return;

  const divisions = getTradeIntelDivisions();

  container.innerHTML = divisions.map(division => `
    <div class="team-intel-division">
      <div class="team-intel-division-title">${division.name}</div>

      <div class="team-intel-grid">
        ${division.teams.map(team => {
  if (!team) return "";

  return renderTradeBlockTeamCard(team);
}).join("")}
      </div>
    </div>
  `).join("");
}

function getTradeBlockPlayers(teamId) {
  const roster = getRosterByTeamId(teamId)
    .slice()
    .sort((a, b) => getTradeBlockScore(b) - getTradeBlockScore(a));

  return roster
    .filter(player => shouldPlayerBeOnTradeBlock(player, teamId))
    .slice(0, 4);
}

function shouldPlayerBeOnTradeBlock(player, teamId) {
  if (!player) return false;

  const roster = getRosterByTeamId(teamId);
  const sortedByAbility = roster
    .slice()
    .sort((a, b) => Number(b.currentAbility || 0) - Number(a.currentAbility || 0));

  const topPlayerIds = new Set(sortedByAbility.slice(0, 4).map(p => Number(p.id)));

  const salary = Number(player.salary || 0);
  const years = Number(player.contractYears || 0);
  const ability = Number(player.currentAbility || 0);
  const age = Number(player.age || 25);

  const isCorePlayer = topPlayerIds.has(Number(player.id)) || ability >= 650;
  if (isCorePlayer) return false;

  const badContract =
    salary >= 22 &&
    years >= 2 &&
    ability < 560;

  const veryBadContract =
    salary >= 30 &&
    years >= 2 &&
    ability < 610;

  const movableExpiring =
    years <= 1 &&
    salary >= 6 &&
    ability < 575 &&
    age >= 26;

  const veteranOnBadTeam =
    years <= 2 &&
    age >= 30 &&
    ability < 600 &&
    isTeamLikelySelling(teamId);

  return badContract || veryBadContract || movableExpiring || veteranOnBadTeam;
}

function getTradeBlockScore(player) {
  const salary = Number(player.salary || 0);
  const years = Number(player.contractYears || 0);
  const ability = Number(player.currentAbility || 0);
  const age = Number(player.age || 25);

  let score = 0;

  score += salary * 3;
  score += years * 12;

  if (ability < 500) score += 40;
  else if (ability < 560) score += 25;
  else if (ability < 600) score += 10;

  if (age >= 30) score += 12;
  if (years <= 1) score += 16;

  return score;
}

function isTeamLikelySelling(teamId) {
  const intel = getTeamIntelRankings().find(item =>
    Number(item.team.id) === Number(teamId)
  );

  if (!intel) return false;

  return [
    "Seller",
    "Aggressive Seller",
    "Building Around Young Core"
  ].includes(intel.tradeStatus);
}

function getTradeBlockReason(player, teamId) {
  const salary = Number(player.salary || 0);
  const years = Number(player.contractYears || 0);
  const ability = Number(player.currentAbility || 0);
  const age = Number(player.age || 25);

  if (salary >= 30 && years >= 2 && ability < 610) return "Bad Contract";
  if (salary >= 22 && years >= 2 && ability < 560) return "Salary Dump";
  if (years <= 1 && salary >= 6 && ability < 575 && age >= 26) return "Expiring Deal";
  if (years <= 2 && age >= 30 && isTeamLikelySelling(teamId)) return "Veteran Available";

  return "Available";
}

function renderTradeBlockTeamCard(team) {
  const color = getTradeTeamPrimaryColor(team.id);
  const players = getTradeBlockPlayers(team.id);

  return `
    <div class="team-intel-card trade-block-team-card" style="--team-color:${color};">
      <div class="team-intel-team-name">${team.name}</div>

      <div class="trade-block-player-list">
        ${
          players.length
            ? players.map(player => renderTradeBlockPlayerRow(player, team)).join("")
            : `<div class="trade-block-empty">No players listed</div>`
        }
      </div>
    </div>
  `;
}

function renderTradeBlockPlayerRow(player, team) {
  return `
    <div class="trade-block-player-row">
      <strong>${player.name}</strong>
      <span>${team.abbrev || getTeamInitials(team.name)} · ${formatMoney(player.salary || 0)} · ${player.contractYears || 0} yrs</span>
      <small>${getTradeBlockReason(player, team.id)}</small>
    </div>
  `;
}

function getTradeIntelDivisions() {
  const teams = [...gameState.teams].sort((a, b) => Number(a.id) - Number(b.id));

  const divisionNames = [
    "Atlantic Division",
    "Central Division",
    "Southeast Division",
    "Northwest Division",
    "Pacific Division",
    "Southwest Division"
  ];

  return divisionNames.map((name, index) => {
    return {
      name,
      teams: teams.slice(index * 5, index * 5 + 5)
    };
  }).filter(division => division.teams.length > 0);
}

function beginTradeNegotiation() {
  if (
    typeof beginTradeBoardNegotiation === "function"
  ) {
    beginTradeBoardNegotiation();
    return;
  }

  if (typeof showTradeSimplePopup === "function") {
    showTradeSimplePopup(
      "Phone Unavailable",
      "The GM Hub phone negotiation system is not ready yet."
    );
  }
}

function startTradeCall() {
  tradeCallState = {
    active: true,
    teams: tradeRoom.teams.map(item => ({
      teamId: item.teamId
    })),
    temperature: "Warm",
    interestLevel: "Listening",
    patience: 100,
    counterOffers: [],
    messages: [
      {
        senderType: "user",
        senderName: "You",
        teamId: gameState.selectedTeamId,
        text: "Here's what we're thinking.",
        offerType: "current"
      }
    ]
  };

  generateInitialGMResponses();

  tradeRoom.callActive = true;

  showSecondaryScreen("trade-call-screen");
}

function displayTradeCallScreen() {
  const root = document.getElementById("trade-call-root");
  if (!root) return;

  root.innerHTML = `
    <div class="trade-call-page">
      <div class="trade-call-header">
        <div>
          <h2>Trade Call</h2>
          <p>Negotiation in progress. Finish or end the call before advancing.</p>
        </div>

        <button type="button" class="trade-call-end-button" onclick="endTradeCall()">
          End Call
        </button>
      </div>

      <div class="trade-call-participants">
        ${renderTradeCallParticipants()}
      </div>

      <div class="trade-call-layout">
        <aside class="trade-call-side-panel">
          <h3>Call Status</h3>

          <div class="trade-call-info-box">
            <span>Relationship</span>
            <strong>Neutral</strong>
          </div>

          <div class="trade-call-info-box">
            <span>Interest</span>
            <strong>${tradeCallState.interestLevel || "Listening"}</strong>
          </div>

          <div class="trade-call-info-box">
              <span>Temperature</span>
              <strong>${tradeCallState.temperature || "Warm"}</strong>
            </div>

          <div class="trade-call-info-box">
            <span>Patience</span>
            <strong>${getTradeCallPatienceLabel()}</strong>
          </div>

        </aside>

        <main class="trade-call-chat-panel">
          <div class="trade-call-chat-header">
            <strong>Negotiation Chat</strong>
            <span>${tradeCallState.teams.length} teams on call</span>
          </div>

          <div class="trade-call-messages">
            ${renderLegacyTradeCallMessages()}
          </div>

          <div class="trade-call-response-row">
            <button type="button" onclick="handleTradeCallAction('question')">Ask Question</button>
            <button type="button" onclick="handleTradeCallAction('revise')">Revise Offer</button>
            <button type="button" onclick="handleTradeCallAction('assets')">Discuss Assets</button>
            <button type="button" onclick="completeAcceptedTrade()">Accept Trade</button>
            <button type="button" onclick="endTradeCall()">End Call</button>
          </div>
        </main>

        <aside class="trade-call-side-panel">
          <h3>GM Intel</h3>

          <div class="trade-call-info-box">
            <span>Aggressiveness</span>
            <strong>Medium</strong>
          </div>

          <div class="trade-call-info-box">
            <span>Values Picks</span>
            <strong>High</strong>
          </div>

          <div class="trade-call-info-box">
            <span>Team Direction</span>
            <strong>Re-Evaluating</strong>
          </div>
        </aside>
      </div>
    </div>
  `;
  requestAnimationFrame(() => {
  scrollTradeCallToBottom();
});
}

function renderTradeCallParticipants() {
  return tradeCallState.teams.map(item => {
    const team = getTeamById(item.teamId);
    if (!team) return "";

    return `
      <div class="trade-call-participant" style="--team-color:${getTradeTeamPrimaryColor(team.id)};">
        <div class="trade-call-logo">
          ${
            getTradeTeamLogoImage(team)
              ? `<img src="${getTradeTeamLogoImage(team)}" alt="${team.name}">`
              : getTradeTeamLogoText(team)
          }
        </div>

        <strong>${team.name}</strong>
      </div>
    `;
  }).join("");
}

function renderLegacyTradeCallMessages() {
  return tradeCallState.messages.map(message => {
    const teamColor = getTradeCallMessageColor(message);

    return `
      <div
        class="trade-call-message ${message.senderType === "user" ? "from-user" : "from-gm"}"
        style="--message-color:${teamColor};"
      >
        <div class="trade-call-bubble">
          <div class="trade-call-message-name">${message.senderName}</div>

          <p>${message.text}</p>

          ${
            message.offerType
              ? `<button type="button" onclick="showTradeCallOfferPopup()">View Offer Details</button>`
              : ""
          }

          ${
            message.counterOfferId
              ? `<button type="button" onclick="showTradeCallCounterOfferPopup('${message.counterOfferId}')">View Counter Offer</button>`
              : ""
          }
        </div>
      </div>
    `;
  }).join("");
}

function getTradeCallMessageColor(message) {
  if (message.senderType === "user") {
    return getTradeTeamPrimaryColor(gameState.selectedTeamId);
  }

  if (message.teamId) {
    return getTradeTeamPrimaryColor(message.teamId);
  }

  return "#1d4ed8";
}

function showTradeCallOfferPopup() {
  const existing = document.getElementById("trade-offer-popup-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "trade-offer-popup-overlay";
  overlay.className = "trade-offer-popup-overlay";

  overlay.innerHTML = `
    <div class="trade-offer-popup">
      <div class="trade-offer-popup-header">
        <h2>Trade Offer Details</h2>
        <button type="button" class="trade-offer-close-button" onclick="closeTradeOfferPopup()">
          Close
        </button>
      </div>

      <div class="trade-offer-team-grid">
        ${tradeRoom.teams.map(item => renderTradeOfferPopupTeam(item.teamId)).join("")}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeTradeOfferPopup() {
  const overlay = document.getElementById("trade-offer-popup-overlay");
  if (overlay) overlay.remove();
}

function endTradeCall() {
  tradeCallState.active = false;
  tradeRoom.callActive = false;

  showSecondaryScreen("transfers-screen");
}

function renderTradeOfferPopupTeam(teamId) {
  const team = getTeamById(teamId);
  if (!team) return "";

  const payrollNow = getRosterPayroll(teamId);
  const payrollAfter = getTradePayrollAfter(teamId);
  const color = getTradeTeamPrimaryColor(teamId);

  return `
    <div class="trade-offer-team-card" style="--team-color:${color};">
      <div class="trade-offer-team-header">
        <strong>${team.name}</strong>
      </div>

      <div class="trade-offer-assets">
        <div>
          <h3>Outgoing</h3>
          ${renderTradeOfferOutgoing(teamId)}
        </div>

        <div>
          <h3>Incoming</h3>
          ${renderTradeOfferIncoming(teamId)}
        </div>
      </div>

      <div class="trade-offer-payroll">
        <div>
          <span>Payroll Now</span>
          <strong>${formatMoney(payrollNow)}</strong>
        </div>

        <div>
          <span>Payroll After Trade</span>
          <strong>${formatMoney(payrollAfter)}</strong>
        </div>
      </div>
    </div>
  `;
}

function getTradePayrollAfter(teamId) {
  const payrollNow = Number(getRosterPayroll(teamId) || 0);

  const outgoingSalary = tradeRoom.assets
    .filter(asset => asset.type === "player" && Number(asset.fromTeamId) === Number(teamId))
    .reduce((sum, asset) => {
      const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
      return sum + Number(player?.salary || 0);
    }, 0);

  const incomingSalary = tradeRoom.assets
    .filter(asset => asset.type === "player" && Number(asset.toTeamId) === Number(teamId))
    .reduce((sum, asset) => {
      const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
      return sum + Number(player?.salary || 0);
    }, 0);

  return payrollNow - outgoingSalary + incomingSalary;
}

function renderTradeOfferOutgoing(teamId) {
  const assets = tradeRoom.assets.filter(asset =>
    Number(asset.fromTeamId) === Number(teamId)
  );

  if (!assets.length) return `<p class="trade-offer-empty">None</p>`;

  return assets.map(asset => renderTradeOfferAsset(asset, "outgoing")).join("");
}

function renderTradeOfferIncoming(teamId) {
  const assets = tradeRoom.assets.filter(asset =>
    Number(asset.toTeamId) === Number(teamId)
  );

  if (!assets.length) return `<p class="trade-offer-empty">None</p>`;

  return assets.map(asset => renderTradeOfferAsset(asset, "incoming")).join("");
}

function renderTradeOfferAsset(asset, direction) {
  if (asset.type === "pick") {
    const roundText = asset.round === 1 ? "1st" : "2nd";

    return `
      <div class="trade-offer-asset-row">
        <strong>${asset.year} ${roundText} Round Pick</strong>
        <span>${asset.protection || "Unprotected"}</span>
      </div>
    `;
  }

  const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);

  return `
    <div class="trade-offer-asset-row">
      <strong>${player ? player.name : "Player"}</strong>
      <span>${player ? `${formatMoney(player.salary || 0)} · ${player.contractYears || 0} yrs` : ""}</span>
    </div>
  `;
}

function generateInitialGMResponses() {
  const otherTeams = tradeCallState.teams.filter(item =>
    Number(item.teamId) !== Number(gameState.selectedTeamId)
  );

  for (const item of otherTeams) {
    const response = getGMInitialTradeResponse(item.teamId);

    if (response.type === "counter") {
  const counterOffer = createBasicCounterOffer(item.teamId);
  tradeCallState.counterOffers.push(counterOffer);

  tradeCallState.messages.push({
    senderType: "gm",
    senderName: getTradeCallGMName(item.teamId),
    teamId: item.teamId,
    text: response.text,
    counterOfferId: counterOffer.id
  });
} else {
  tradeCallState.messages.push({
    senderType: "gm",
    senderName: getTradeCallGMName(item.teamId),
    teamId: item.teamId,
    text: response.text
  });
}
  }

  updateTradeCallMood();

  console.log("Trade call messages:", tradeCallState.messages);
}

function getGMInitialTradeResponse(teamId) {
  const evaluation = evaluateTradeForTeam(teamId);
  const teamIntel = getTeamIntelForTradeCall(teamId);

  if (evaluation.score >= 25) {
    return {
      tone: "positive",
      type: "message",
      text: "We're interested. This is a strong starting point for us."
    };
  }

  const untouchablePlayers = getUntouchablePlayersLeavingTeam(teamId);

if (untouchablePlayers.length > 0) {
  return {
    tone: "negative",
    type: "message",
    text: `${untouchablePlayers[0].name} is not available. We're not discussing him in this framework.`
  };
}

  if (evaluation.score >= 5) {
    return {
      tone: "warm",
      type: "message",
      text: "This is close. We are not far apart, but we'd need you to add something small to get this done."
    };
  }

  if (evaluation.score >= -15) {
    return {
      tone: "counter",
      type: "counter",
      text: "We're listening, but this doesn't fully meet our valuation. Here's a structure we'd be more comfortable with."
    };
  }

  if (teamIntel && teamIntel.tradeStatus.includes("Seller")) {
    return {
      tone: "counter",
      type: "counter",
      text: "We're open to moving pieces, but we'd need more future value. Here's what we'd be looking for."
    };
  }

  return {
    tone: "counter",
    type: "counter",
    text: "I don't think this gets us close. We'd need a much stronger package, something more like this."
  };
}

function getUntouchablePlayersLeavingTeam(teamId) {
  return tradeRoom.assets
    .filter(asset =>
      asset.type === "player" &&
      Number(asset.fromTeamId) === Number(teamId)
    )
    .map(asset => getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId))
    .filter(player =>
      player &&
      getPlayerTradeAvailability(player, teamId) === "Untouchable"
    );
}

function evaluateTradeForTeam(teamId) {
  const outgoing = tradeRoom.assets.filter(asset =>
    Number(asset.fromTeamId) === Number(teamId)
  );

  const incoming = tradeRoom.assets.filter(asset =>
    Number(asset.toTeamId) === Number(teamId)
  );

  const outgoingValue = outgoing.reduce((sum, asset) => {
    return sum + getTradeCallAssetValue(asset);
  }, 0);

  const incomingValue = incoming.reduce((sum, asset) => {
    return sum + getTradeCallAssetValue(asset);
  }, 0);

  return {
    outgoingValue,
    incomingValue,
    score: incomingValue - outgoingValue
  };
}

function getTradeCallAssetValue(asset) {
  if (asset.type === "pick") {
    const receivingTeam = getTeamIntelForTradeCall(asset.toTeamId);

if (
  receivingTeam &&
  (
    receivingTeam.tradeStatus === "Seller" ||
    receivingTeam.tradeStatus === "Aggressive Seller" ||
    receivingTeam.tradeStatus === "Building Around Young Core"
  )
) {
  value *= 1.30;
}
    let value = asset.round === 1 ? 90 : 30;

    if (asset.protection && asset.protection !== "Unprotected") {
      value -= 12;
    }

    return value;
  }

  if (asset.type === "player") {
    const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
    if (!player) return 0;

    let value = getTradeValue(player);
    if (doesPlayerFillTeamNeed(player, asset.toTeamId)) {
  value *= 1.18;
}
    const intel = getTeamIntelForTradeCall(asset.fromTeamId);

const age = Number(player.age || 25);
const ability = Number(player.currentAbility || 0);

if (intel) {

  // Rebuilding teams love youth
  if (intel.tradeStatus === "Building Around Young Core") {
    if (age <= 24) value *= 1.35;
    if (age >= 30) value *= 0.75;
  }

  // Sellers prefer picks and youth
  if (
    intel.tradeStatus === "Seller" ||
    intel.tradeStatus === "Aggressive Seller"
  ) {
    if (age <= 25) value *= 1.20;
    if (age >= 31) value *= 0.80;
  }

  // Buyers value veterans more
  if (
    intel.tradeStatus === "Buyer" ||
    intel.tradeStatus === "Aggressive Buyer"
  ) {
    if (ability >= 650) value *= 1.15;
    if (age <= 22) value *= 0.90;
  }
}
const availability = getPlayerTradeAvailability(player, asset.fromTeamId);

if (availability === "Untouchable") {
  value += 9999;
}

if (availability === "Very Hard To Get") {
  value *= 1.75;
}

return value;
  }

  return 0;
}

function getTeamIntelForTradeCall(teamId) {
  if (typeof getTeamIntelRankings !== "function") return null;

  return getTeamIntelRankings().find(item =>
    Number(item.team.id) === Number(teamId)
  ) || null;
}

function getTradeCallGMName(teamId) {
  if (typeof getTeamGmName === "function") {
    return getTeamGmName(teamId);
  }

  return "General Manager";
}

function updateTradeCallMood() {
  const otherTeams = tradeCallState.teams.filter(item =>
    Number(item.teamId) !== Number(gameState.selectedTeamId)
  );

  const scores = otherTeams.map(item => evaluateTradeForTeam(item.teamId).score);
  const averageScore = scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;

  if (averageScore >= 25) {
    tradeCallState.temperature = "Hot";
    tradeCallState.interestLevel = "Very Interested";
  } else if (averageScore >= 5) {
    tradeCallState.temperature = "Warm";
    tradeCallState.interestLevel = "Interested";
  } else if (averageScore >= -15) {
    tradeCallState.temperature = "Cool";
    tradeCallState.interestLevel = "Listening";
  } else {
    tradeCallState.temperature = "Cold";
    tradeCallState.interestLevel = "Skeptical";
  }
}

function handleTradeCallAction(action) {
  if (action === "revise") {
  openReviseTradeOfferPopup();
  return;
}
  const userMessage = getTradeCallUserActionMessage(action);
  const gmMessage = getTradeCallGMActionResponse(action);
  adjustTradeCallPatience(action);

if (tradeCallState.patience <= 0) {
  tradeCallState.messages.push({
    senderType: "gm",
    senderName: getTradeCallGMName(getPrimaryOtherTradeCallTeamId()),
    teamId: getPrimaryOtherTradeCallTeamId(),
    text: "I think we're done here. We're moving on from these talks."
  });

  displayTradeCallScreen();
  return;
}

  tradeCallState.messages.push({
    senderType: "user",
    senderName: "You",
    teamId: gameState.selectedTeamId,
    text: userMessage
  });

  if (gmMessage) {
  tradeCallState.messages.push({
    senderType: "gm",
    senderName: getTradeCallGMName(getPrimaryOtherTradeCallTeamId()),
    teamId: getPrimaryOtherTradeCallTeamId(),
    text: gmMessage
  });
}

  displayTradeCallScreen();
}

function getPrimaryOtherTradeCallTeamId() {
  const otherTeam = tradeCallState.teams.find(item =>
    Number(item.teamId) !== Number(gameState.selectedTeamId)
  );

  return otherTeam ? otherTeam.teamId : gameState.selectedTeamId;
}

function getTradeCallUserActionMessage(action) {
  if (action === "question") {
    return "What would it take to get this deal done?";
  }

  if (action === "revise") {
    return "We'll take another look at the package.";
  }

  if (action === "assets") {
    return "Which pieces interest you most?";
  }

  if (action === "accept") {
    return "We're willing to move forward with this framework.";
  }

  return "Let's keep talking.";
}

function getTradeCallGMActionResponse(action) {
  const teamId = getPrimaryOtherTradeCallTeamId();
  const evaluation = evaluateTradeForTeam(teamId);
  const personality = getTradeCallTeamPersonality(teamId);
  const patience = Number(tradeCallState.patience || 100);

if (patience < 20) {
  return "We're running out of patience. If this doesn't move soon, we're ending the call.";
}

if (patience < 45 && action !== "accept") {
  return "We've made our position pretty clear. We need a better framework.";
}

  if (action === "question") {
    if (evaluation.score >= 10) {
      return "The framework is close. We just need to clean up the details.";
    }

    if (personality.tradeStatus.includes("Seller")) {
      return "If we're moving pieces, future value has to be the focus.";
    }

    if (personality.tradeStatus.includes("Buyer")) {
      return "We need this to help us win now. Future-only value probably won't get it done.";
    }

    if (personality.tradeStatus === "Building Around Young Core") {
      return "We'd need something that fits our timeline: young talent, picks, or flexibility.";
    }

    return "We'd need more value coming back before we could seriously consider this.";
  }

  if (action === "revise") {
  const counterOffer = createBasicCounterOffer(teamId);

  tradeCallState.counterOffers.push(counterOffer);

  tradeCallState.messages.push({
    senderType: "gm",
    senderName: getTradeCallGMName(teamId),
    teamId,
    text: "Here's a structure we'd be more comfortable with.",
    counterOfferId: counterOffer.id
  });

  return null;
}

  if (action === "assets") {
    if (personality.tradeStatus.includes("Seller")) {
      return "Draft capital is what matters most to us right now.";
    }

    if (personality.tradeStatus.includes("Buyer")) {
      return "We're looking for players who can help immediately.";
    }

    if (personality.tradeStatus === "Building Around Young Core") {
      return "Young players and picks are what interest us most.";
    }

    return "We're mostly focused on keeping the value balanced. The framework is workable.";
  }

  if (action === "accept") {
    if (evaluation.score >= 0) {
      return "We're comfortable moving toward final approval.";
    }

    if (personality.tradeStatus.includes("Seller")) {
      return "Not yet. We'd need stronger future value before accepting.";
    }

    if (personality.tradeStatus.includes("Buyer")) {
      return "Not yet. We need more immediate help coming back.";
    }

    return "We're not ready to accept this version yet.";
  }

  return "We're listening.";
}

function getTradeCallTeamPersonality(teamId) {
  const intel = getTeamIntelForTradeCall(teamId);

  return {
    identity: intel?.identity || "Play-In Team",
    tradeStatus: intel?.tradeStatus || "Neutral",
    timeline: intel?.timeline || "1-2 Years"
  };
}

function getTradeCallPatienceLabel() {
  if (tradeCallState.patience === undefined || tradeCallState.patience === null) {
    tradeCallState.patience = 100;
  }

  const patience = Number(tradeCallState.patience);

  if (patience >= 75) return "High";
  if (patience >= 45) return "Medium";
  if (patience >= 20) return "Low";
  if (patience > 0) return "Walking Away";

  return "Ended";
}

function adjustTradeCallPatience(action) {
  if (action === "question") tradeCallState.patience -= 3;
  if (action === "assets") tradeCallState.patience -= 2;

  if (action === "accept") {
    const teamId = getPrimaryOtherTradeCallTeamId();
    const evaluation = evaluateTradeForTeam(teamId);

    if (evaluation.score < 0) {
      tradeCallState.patience -= 5;
    }
  }

  tradeCallState.patience = Math.max(0, tradeCallState.patience);
}

function scrollTradeCallToBottom() {
  const messages = document.querySelector(".trade-call-messages");
  if (!messages) return;

  messages.scrollTop = messages.scrollHeight;
}

function createBasicCounterOffer(teamId) {
  const counterAssets = tradeRoom.assets.map(asset => ({ ...asset }));

  const evaluation = evaluateTradeForTeam(teamId);

  if (evaluation.score < 0) {
    const addedPick = findExtraPickFromUserTeamForCounter(counterAssets, teamId);

    if (addedPick) {
      counterAssets.push({
        type: "pick",
        pickId: addedPick.id,
        fromTeamId: Number(gameState.selectedTeamId),
        toTeamId: Number(teamId),
        ownerTeamId: addedPick.ownerTeamId,
        originalTeamId: addedPick.originalTeamId,
        year: addedPick.year,
        round: addedPick.round,
        protection: addedPick.protection
      });
    }
  }

  return {
    id: `counter_${Date.now()}`,
    teamId,
    assets: counterAssets,
    note: "Counteroffer"
  };
}

function findExtraPickFromUserTeamForCounter(existingAssets, toTeamId) {
  if (typeof getTradePicksForTeam !== "function") return null;

  const userTeamId = Number(gameState.selectedTeamId);

  const usedPickIds = new Set(
    existingAssets
      .filter(asset => asset.type === "pick")
      .map(asset => String(asset.pickId))
  );

  const availablePicks = getTradePicksForTeam(userTeamId)
    .filter(pick => !usedPickIds.has(String(pick.id)))
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return a.year - b.year;
    });

  return availablePicks[0] || null;
}

function showTradeCallCounterOfferPopup(counterOfferId) {
  const counterOffer = tradeCallState.counterOffers.find(item =>
    String(item.id) === String(counterOfferId)
  );

  if (!counterOffer) return;

  const existing = document.getElementById("trade-offer-popup-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "trade-offer-popup-overlay";
  overlay.className = "trade-offer-popup-overlay";

  overlay.innerHTML = `
    <div class="trade-offer-popup">
      <div class="trade-offer-popup-header">
        <h2>Counter Offer Details</h2>
        <button type="button" class="trade-offer-close-button" onclick="closeTradeOfferPopup()">
          Close
        </button>
      </div>

      <div class="trade-offer-team-grid">
        ${tradeCallState.teams.map(item => renderCounterOfferPopupTeam(item.teamId, counterOffer.assets)).join("")}
      </div>
      <div class="counter-offer-actions">
  <button type="button" onclick="useCounterOfferAsFramework('${counterOffer.id}')">
    Use As New Framework
  </button>
</div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function useCounterOfferAsFramework(counterOfferId) {
  const counterOffer = tradeCallState.counterOffers.find(item =>
    String(item.id) === String(counterOfferId)
  );

  if (!counterOffer) return;

  tradeRoom.assets = counterOffer.assets.map(asset => ({ ...asset }));
  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  closeTradeOfferPopup();

  tradeCallState.messages.push({
    senderType: "user",
    senderName: "You",
    teamId: gameState.selectedTeamId,
    text: "We'll work from your counter and adjust the framework."
  });

  displayTradeCallScreen();

  requestAnimationFrame(() => {
    openReviseTradeOfferPopup();
  });
}

function renderCounterOfferPopupTeam(teamId, assets) {
  const team = getTeamById(teamId);
  if (!team) return "";

  const payrollNow = getRosterPayroll(teamId);
  const payrollAfter = getTradePayrollAfterForAssets(teamId, assets);
  const color = getTradeTeamPrimaryColor(teamId);

  return `
    <div class="trade-offer-team-card" style="--team-color:${color};">
      <div class="trade-offer-team-header">
        <strong>${team.name}</strong>
      </div>

      <div class="trade-offer-assets">
        <div>
          <h3>Outgoing</h3>
          ${renderTradeOfferOutgoingForAssets(teamId, assets)}
        </div>

        <div>
          <h3>Incoming</h3>
          ${renderTradeOfferIncomingForAssets(teamId, assets)}
        </div>
      </div>

      <div class="trade-offer-payroll">
        <div>
          <span>Payroll Now</span>
          <strong>${formatMoney(payrollNow)}</strong>
        </div>

        <div>
          <span>Payroll After Trade</span>
          <strong>${formatMoney(payrollAfter)}</strong>
        </div>
      </div>
    </div>
  `;
}

function getTradePayrollAfterForAssets(teamId, assets) {
  const payrollNow = Number(getRosterPayroll(teamId) || 0);

  const outgoingSalary = assets
    .filter(asset => asset.type === "player" && Number(asset.fromTeamId) === Number(teamId))
    .reduce((sum, asset) => {
      const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
      return sum + Number(player?.salary || 0);
    }, 0);

  const incomingSalary = assets
    .filter(asset => asset.type === "player" && Number(asset.toTeamId) === Number(teamId))
    .reduce((sum, asset) => {
      const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
      return sum + Number(player?.salary || 0);
    }, 0);

  return payrollNow - outgoingSalary + incomingSalary;
}

function renderTradeOfferOutgoingForAssets(teamId, assets) {
  const outgoing = assets.filter(asset => Number(asset.fromTeamId) === Number(teamId));
  if (!outgoing.length) return `<p class="trade-offer-empty">None</p>`;
  return outgoing.map(asset => renderTradeOfferAsset(asset)).join("");
}

function renderTradeOfferIncomingForAssets(teamId, assets) {
  const incoming = assets.filter(asset => Number(asset.toTeamId) === Number(teamId));
  if (!incoming.length) return `<p class="trade-offer-empty">None</p>`;
  return incoming.map(asset => renderTradeOfferAsset(asset)).join("");
}

function openReviseTradeOfferPopup() {
  const existing = document.getElementById("revise-trade-popup-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "revise-trade-popup-overlay";
  overlay.className = "revise-trade-popup-overlay";

  overlay.innerHTML = `
    <div class="revise-trade-popup">
      <div class="revise-trade-header">
        <div>
          <h2>Revise Offer</h2>
          <p>Adjust the current framework without leaving the call.</p>
          ${renderReviseTradeLegalBadge()}
        </div>

        <button type="button" onclick="closeReviseTradeOfferPopup()">Close</button>
      </div>

      <div class="revise-trade-grid">
        ${tradeRoom.teams.map(item => renderReviseTradeTeamCard(item.teamId)).join("")}
      </div>

      <div class="revise-trade-footer">
        <button type="button" class="revise-send-button" onclick="sendRevisedTradeOffer()">
          Send Revised Offer
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function renderReviseTradeLegalBadge() {
  const status = getTradeLegalityStatus();

  return `
    <div class="revise-trade-legal-badge ${status.legal ? "legal" : "illegal"}">
      ${status.legal ? "Legal Trade" : "Not Legal"}
    </div>
  `;
}

function closeReviseTradeOfferPopup() {
  const overlay = document.getElementById("revise-trade-popup-overlay");
  if (overlay) overlay.remove();
}

function renderReviseTradeTeamCard(teamId) {
  const team = getTeamById(teamId);
  if (!team) return "";

  return `
    <div class="revise-trade-team-card" style="--team-color:${getTradeTeamPrimaryColor(teamId)};">
      <div class="revise-trade-team-header">
        <strong>${team.name}</strong>
      </div>

      <div class="revise-trade-columns">
        <div>
          <h3>Outgoing</h3>
          ${renderReviseTradeAssets(teamId, "outgoing")}
        </div>

        <div>
          <h3>Incoming</h3>
          ${renderReviseTradeAssets(teamId, "incoming")}
        </div>
      </div>

      <div class="revise-add-assets-grid">
  <div class="revise-add-assets">
    <h3>Players</h3>
    ${renderReviseAvailablePlayers(teamId)}
  </div>

  <div class="revise-add-assets">
    <h3>Picks</h3>
    ${renderReviseAvailablePicks(teamId)}
  </div>

  <div class="revise-add-assets">
    <h3>Exceptions</h3>
    ${renderReviseAvailableExceptions(teamId)}
  </div>
</div>
    </div>
  `;
}

function renderReviseAvailablePlayers(teamId) {
  const roster = getRosterByTeamId(teamId);

  const alreadyMovedIds = new Set(
    tradeRoom.assets
      .filter(asset => asset.type === "player")
      .map(asset => Number(asset.playerId))
  );

  const availablePlayers = roster
    .filter(player => !alreadyMovedIds.has(Number(player.id)))
    .slice(0, 8);

  if (!availablePlayers.length) {
    return `<p class="revise-empty">No available players</p>`;
  }

  return `
    <div class="revise-player-list">
      ${availablePlayers.map(player => `
        <button type="button" onclick="openReviseSendPlayerMenu('${player.id}', '${teamId}')">
          <span>${player.name}</span>
          <small>${formatMoney(player.salary || 0)} · ${player.contractYears || 0} yrs</small>
        </button>
      `).join("")}
    </div>
  `;
}

function openReviseSendPlayerMenu(playerId, fromTeamId) {
  const player = getPlayerByIdFromTeam(playerId, fromTeamId);
  if (!player) return;

  const existing = document.getElementById("revise-destination-popup");
  if (existing) existing.remove();

  const destinationTeams = tradeRoom.teams.filter(item =>
    Number(item.teamId) !== Number(fromTeamId)
  );

  const popup = document.createElement("div");
  popup.id = "revise-destination-popup";
  popup.className = "revise-destination-popup";

  popup.innerHTML = `
    <div class="revise-destination-card">
      <h3>Send ${player.name} To:</h3>

      <div class="revise-destination-list">
        ${destinationTeams.map(item => {
          const team = getTeamById(item.teamId);
          if (!team) return "";

          return `
            <button
              type="button"
              style="--team-color:${getTradeTeamPrimaryColor(team.id)};"
              onclick="assignRevisePlayerToTeam('${player.id}', '${fromTeamId}', '${team.id}')"
            >
              ${team.name}
            </button>
          `;
        }).join("")}
      </div>

      <button type="button" class="revise-destination-cancel" onclick="closeReviseDestinationPopup()">
        Cancel
      </button>
    </div>
  `;

  document.body.appendChild(popup);
}

function closeReviseDestinationPopup() {
  const popup = document.getElementById("revise-destination-popup");
  if (popup) popup.remove();
}

function assignRevisePlayerToTeam(playerId, fromTeamId, toTeamId) {
  tradeRoom.assets.push({
    type: "player",
    playerId: Number(playerId),
    fromTeamId: Number(fromTeamId),
    toTeamId: Number(toTeamId)
  });

  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  closeReviseDestinationPopup();
  closeReviseTradeOfferPopup();
  openReviseTradeOfferPopup();
}

function renderReviseTradeAssets(teamId, direction) {
  const assets = tradeRoom.assets.filter(asset => {
    if (direction === "outgoing") return Number(asset.fromTeamId) === Number(teamId);
    return Number(asset.toTeamId) === Number(teamId);
  });

  if (!assets.length) {
    return `<p class="revise-empty">None</p>`;
  }

  return assets.map(asset => `
    <div class="revise-asset-row">
      <span>${getReviseAssetLabel(asset)}</span>

      <button type="button" onclick="removeAssetFromRevisePopup('${asset.type}', '${asset.playerId || asset.pickId}')">
        Remove
      </button>
    </div>
  `).join("");
}

function getReviseAssetLabel(asset) {
  if (asset.type === "pick") {
    const roundText = asset.round === 1 ? "1st" : "2nd";
    return `${asset.year} ${roundText} Round Pick`;
  }

  const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
  return player ? player.name : "Player";
}

function removeAssetFromRevisePopup(assetType, assetId) {
  removeTradeAsset(assetType, assetId);
  closeReviseTradeOfferPopup();
  openReviseTradeOfferPopup();
}

function sendRevisedTradeOffer() {
  const status = getTradeLegalityStatus();

  if (!status.legal) {
    showTradeLegalityPopup();
    return;
  }

  closeReviseTradeOfferPopup();

  tradeCallState.messages.push({
    senderType: "user",
    senderName: "You",
    teamId: gameState.selectedTeamId,
    text: "We revised the structure. Take another look.",
    offerType: "current"
  });

  generateInitialGMResponses();

  displayTradeCallScreen();
}

function renderReviseAvailablePicks(teamId) {
  if (typeof getTradePicksForTeam !== "function") {
    return `<p class="revise-empty">No pick database</p>`;
  }

  const usedPickIds = new Set(
    tradeRoom.assets
      .filter(asset => asset.type === "pick")
      .map(asset => String(asset.pickId))
  );

  const picks = getTradePicksForTeam(teamId)
    .filter(pick => !usedPickIds.has(String(pick.id)))
    .slice(0, 8);

  if (!picks.length) {
    return `<p class="revise-empty">No available picks</p>`;
  }

  return `
    <div class="revise-player-list">
      ${picks.map(pick => `
        <button type="button" onclick="openReviseSendPickMenu('${pick.id}', '${teamId}')">
          <span>${getTradePickLabel(pick)}</span>
          <small>${pick.protection || "Unprotected"}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function renderReviseAvailableExceptions(teamId) {
  return `
    <div class="revise-player-list">
      <button type="button" disabled>
        <span>Trade Exception</span>
        <small>Coming later</small>
      </button>

      <button type="button" disabled>
        <span>Mid-Level Exception</span>
        <small>View-only for now</small>
      </button>
    </div>
  `;
}

function openReviseSendPickMenu(pickId, fromTeamId) {
  const pick = getTradePickById(pickId, fromTeamId);
  if (!pick) return;

  const existing = document.getElementById("revise-destination-popup");
  if (existing) existing.remove();

  const destinationTeams = tradeRoom.teams.filter(item =>
    Number(item.teamId) !== Number(fromTeamId)
  );

  const popup = document.createElement("div");
  popup.id = "revise-destination-popup";
  popup.className = "revise-destination-popup";

  popup.innerHTML = `
    <div class="revise-destination-card">
      <h3>Send ${getTradePickLabel(pick)} To:</h3>

      <div class="revise-destination-list">
        ${destinationTeams.map(item => {
          const team = getTeamById(item.teamId);
          if (!team) return "";

          return `
            <button
              type="button"
              style="--team-color:${getTradeTeamPrimaryColor(team.id)};"
              onclick="assignRevisePickToTeam('${pick.id}', '${fromTeamId}', '${team.id}')"
            >
              ${team.name}
            </button>
          `;
        }).join("")}
      </div>

      <button type="button" class="revise-destination-cancel" onclick="closeReviseDestinationPopup()">
        Cancel
      </button>
    </div>
  `;

  document.body.appendChild(popup);
}

function assignRevisePickToTeam(pickId, fromTeamId, toTeamId) {
  const pick = getTradePickById(pickId, fromTeamId);
  if (!pick) return;

  tradeRoom.assets.push({
    type: "pick",
    pickId: pick.id,
    fromTeamId: Number(fromTeamId),
    toTeamId: Number(toTeamId),
    ownerTeamId: pick.ownerTeamId,
    originalTeamId: pick.originalTeamId,
    year: pick.year,
    round: pick.round,
    protection: pick.protection
  });

  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  closeReviseDestinationPopup();
  closeReviseTradeOfferPopup();
  openReviseTradeOfferPopup();
}

function completeAcceptedTrade() {
  const status = getTradeLegalityStatus();

  if (!status.legal) {
    showTradeLegalityPopup();
    return;
  }

  if (!isTradeAcceptedByOtherTeams()) {
    tradeCallState.messages.push({
      senderType: "gm",
      senderName: getTradeCallGMName(getPrimaryOtherTradeCallTeamId()),
      teamId: getPrimaryOtherTradeCallTeamId(),
      text: "We're not ready to accept this version yet."
    });

    displayTradeCallScreen();
    return;
  }

  addCompletedTradeToHistory();
  executeTradeAssets();

  tradeRoom.callActive = false;
  tradeCallState.active = false;

  clearTradeRoom();

  refreshAll();
  showSecondaryScreen("transfers-screen");
}

function executeTradeAssets() {
  const playerAssets = tradeRoom.assets.filter(asset => asset.type === "player");

  for (const asset of playerAssets) {
    movePlayerToTradeTeam(asset.playerId, asset.fromTeamId, asset.toTeamId);
  }

  // Picks will be moved later when fixed pick ownership database exists.
}

function movePlayerToTradeTeam(playerId, fromTeamId, toTeamId) {
  const fromId = String(fromTeamId);
  const toId = String(toTeamId);

  if (!gameState.rosters[fromId]) gameState.rosters[fromId] = [];
  if (!gameState.rosters[toId]) gameState.rosters[toId] = [];

  const playerIndex = gameState.rosters[fromId].findIndex(player =>
    Number(player.id) === Number(playerId)
  );

  if (playerIndex === -1) return false;

  const [player] = gameState.rosters[fromId].splice(playerIndex, 1);

  const newTeam = getTeamById(toTeamId);

  player.teamId = Number(toTeamId);
  player.teamName = newTeam ? newTeam.name : player.teamName;

  gameState.rosters[toId].push(player);

  return true;
}

function addCompletedTradeToHistory() {
  if (!gameState.tradeHistory) {
    gameState.tradeHistory = [];
  }

  const teamsInTrade = tradeRoom.teams
    .map(item => getTeamById(item.teamId))
    .filter(Boolean);

  const summary = teamsInTrade.map(team => {
    const outgoing = tradeRoom.assets
      .filter(asset => Number(asset.fromTeamId) === Number(team.id))
      .map(asset => getCompletedTradeAssetLabel(asset));

    const incoming = tradeRoom.assets
      .filter(asset => Number(asset.toTeamId) === Number(team.id))
      .map(asset => getCompletedTradeAssetLabel(asset));

    return {
      teamId: team.id,
      teamName: team.name,
      outgoing,
      incoming
    };
  });

  gameState.tradeHistory.unshift({
    id: `trade_${Date.now()}`,
    date: formatDate(gameState.currentDate),
    teams: summary
  });
}

function getCompletedTradeAssetLabel(asset) {
  if (asset.type === "pick") {
    const roundText = asset.round === 1 ? "1st" : "2nd";
    return `${asset.year} ${roundText} Round Pick`;
  }

  const player = getPlayerByIdFromTeam(asset.playerId, asset.fromTeamId);
  return player ? player.name : "Player";
}

function isTradeAcceptedByOtherTeams() {
  const otherTeams = tradeCallState.teams.filter(item =>
    Number(item.teamId) !== Number(gameState.selectedTeamId)
  );

  return otherTeams.every(item => {
    const evaluation = evaluateTradeForTeam(item.teamId);
    return evaluation.score >= 0;
  });
}

function getPlayerTradeAvailability(player, teamId) {
  if (!player) return "Available";

  const intel = getTeamIntelForTradeCall(teamId);
  const roster = getRosterByTeamId(teamId);

  const sorted = roster
    .slice()
    .sort((a, b) => Number(b.currentAbility || 0) - Number(a.currentAbility || 0));

  const topPlayerIds = new Set(sorted.slice(0, 2).map(p => Number(p.id)));

  const ability = Number(player.currentAbility || 0);
  const age = Number(player.age || 25);
  const isTopTwo = topPlayerIds.has(Number(player.id));

  if (
    isTopTwo &&
    intel &&
    ["Championship Contender", "Contender", "Playoff Team"].includes(intel.identity)
  ) {
    return "Untouchable";
  }

  if (
    age <= 24 &&
    ability >= 600 &&
    intel &&
    intel.tradeStatus === "Building Around Young Core"
  ) {
    return "Untouchable";
  }

  if (ability >= 720) {
    return "Untouchable";
  }

  if (ability >= 650 || isTopTwo) {
    return "Very Hard To Get";
  }

  return "Available";
}

function getTeamPositionNeeds(teamId) {
  const roster = getRosterByTeamId(teamId);

  const counts = {
    PG: 0,
    SG: 0,
    SF: 0,
    PF: 0,
    C: 0
  };

  roster.forEach(player => {
    const positions = getPlayerPositionList(player);

    positions.forEach(pos => {
      if (counts[pos] !== undefined) {
        counts[pos]++;
      }
    });
  });

  return {
    PG: counts.PG <= 1,
    SG: counts.SG <= 1,
    SF: counts.SF <= 1,
    PF: counts.PF <= 1,
    C: counts.C <= 1,
    counts
  };
}

function getPlayerPositionList(player) {
  const raw =
    player.positions ||
    player.position ||
    player.primaryPosition ||
    "";

  if (Array.isArray(raw)) {
    return raw.map(pos => String(pos).toUpperCase());
  }

  return String(raw)
    .split("/")
    .map(pos => pos.trim().toUpperCase())
    .filter(Boolean);
}

function doesPlayerFillTeamNeed(player, receivingTeamId) {
  const needs = getTeamPositionNeeds(receivingTeamId);
  const positions = getPlayerPositionList(player);

  return positions.some(pos => needs[pos] === true);
}

/* ======================================================
   GM INTEL SCREEN
   Visual-only GM cards for Trade section
====================================================== */

function escapeGMIntelHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getGMIntelTeamPrimaryColor(team) {
  if (!team) return "#17408B";

  if (typeof getTeamPrimaryColorSafe === "function") {
    return getTeamPrimaryColorSafe(team);
  }

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.primaryColor ||
      colors.primary ||
      colors.mainColor ||
      "#17408B"
    );
  }

  return (
    team.primaryColor ||
    team.primary ||
    team.color ||
    "#17408B"
  );
}

function getGMIntelTeamSecondaryColor(team) {
  if (!team) return "#67e8f9";

  if (typeof getTeamSecondaryColorSafe === "function") {
    return getTeamSecondaryColorSafe(team);
  }

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.secondaryColor ||
      colors.secondary ||
      colors.accentColor ||
      "#67e8f9"
    );
  }

  return (
    team.secondaryColor ||
    team.secondary ||
    team.accentColor ||
    "#67e8f9"
  );
}

function getGMIntelTeamsEastWest() {
  if (!gameState || !Array.isArray(gameState.teams)) return [];

  const east = gameState.teams
    .filter(team => String(team.conference || "").toLowerCase() === "east")
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

  const west = gameState.teams
    .filter(team => String(team.conference || "").toLowerCase() === "west")
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

  const unknown = gameState.teams
    .filter(team => {
      const conf = String(team.conference || "").toLowerCase();
      return conf !== "east" && conf !== "west";
    })
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

  return [...east, ...west, ...unknown];
}

function getGMIntelStaffGroup(teamId) {
  if (!gameState) return null;

  if (typeof getTeamStaff === "function") {
    return getTeamStaff(teamId);
  }

  return gameState.staff ? gameState.staff[teamId] : null;
}

function getGMIntelGeneralManager(teamId) {
  const staffGroup = getGMIntelStaffGroup(teamId);

  if (!staffGroup) return null;

  if (
    staffGroup.generalManager &&
    !staffGroup.generalManager.isVacant &&
    staffGroup.generalManager.name
  ) {
    return staffGroup.generalManager;
  }

  if (Array.isArray(staffGroup.staff)) {
    const found = staffGroup.staff.find(member => {
      if (!member || member.isVacant || !member.name) return false;

      const role = String(member.role || "").toLowerCase();

      return role.includes("general manager") || role === "gm";
    });

    if (found) return found;
  }

  return null;
}

function getGMIntelNumber(member, keys, fallback = 70) {
  if (!member) return null;

  for (let key of keys) {
    if (member[key] !== undefined && member[key] !== null && member[key] !== "") {
      const number = Number(member[key]);

      if (Number.isFinite(number)) {
        return Math.max(0, Math.min(100, Math.round(number)));
      }
    }
  }

  return fallback;
}

function getGMIntelGrade(score) {
  const value = Math.max(0, Math.min(100, Number(score || 0)));

  if (value >= 97) return "A+";
  if (value >= 93) return "A";
  if (value >= 90) return "A-";
  if (value >= 87) return "B+";
  if (value >= 83) return "B";
  if (value >= 80) return "B-";
  if (value >= 77) return "C+";
  if (value >= 73) return "C";
  if (value >= 70) return "C-";
  if (value >= 67) return "D+";
  if (value >= 63) return "D";
  if (value >= 60) return "D-";

  return "F";
}

function getGMIntelGradeClass(score) {
  const value = Math.max(0, Math.min(100, Number(score || 0)));

  if (value >= 90) return "elite";
  if (value >= 80) return "good";
  if (value >= 70) return "average";
  if (value >= 60) return "weak";

  return "bad";
}

function getGMIntelPersonality(gm) {
  if (!gm) return "Vacant";

  return (
    gm.personality ||
    gm.Personality ||
    gm.style ||
    gm.Style ||
    "Balanced Operator"
  );
}

function getGMIntelGradeItems(gm) {
  if (!gm) {
    return [
      { label: "Negotiation", value: null },
      { label: "Scouting", value: null },
      { label: "Cap Management", value: null },
      { label: "Player Evaluation", value: null },
      { label: "Analytics", value: null },
      { label: "Aggression", value: null }
    ];
  }

  return [
    {
      label: "Negotiation",
      value: getGMIntelNumber(gm, ["negotiation", "Negotiation"])
    },
    {
      label: "Scouting",
      value: getGMIntelNumber(gm, ["scouting", "Scouting"])
    },
    {
      label: "Cap Management",
      value: getGMIntelNumber(gm, ["capManagement", "CapManagement", "cap_management"])
    },
    {
      label: "Player Evaluation",
      value: getGMIntelNumber(gm, ["playerEvaluation", "PlayerEvaluation", "player_evaluation"])
    },
    {
      label: "Analytics",
      value: getGMIntelNumber(gm, ["analytics", "Analytics"])
    },
    {
      label: "Aggression",
      value: getGMIntelNumber(gm, ["aggression", "Aggression"])
    }
  ];
}

function renderGMIntelGradePill(item) {
  if (item.value === null || item.value === undefined) {
    return `
      <div class="gm-intel-grade-row vacant">
        <span>${escapeGMIntelHtml(item.label)}</span>
        <strong>--</strong>
      </div>
    `;
  }

  const grade = getGMIntelGrade(item.value);
  const gradeClass = getGMIntelGradeClass(item.value);

  return `
    <div class="gm-intel-grade-row ${gradeClass}">
      <span>${escapeGMIntelHtml(item.label)}</span>
      <strong>${grade}</strong>
    </div>
  `;
}

function renderGMIntelCard(team) {
  const gm = getGMIntelGeneralManager(team.id);
  const primary = getGMIntelTeamPrimaryColor(team);
  const secondary = getGMIntelTeamSecondaryColor(team);

  const gmName = gm ? gm.name : "Vacant";
  const personality = getGMIntelPersonality(gm);
  const reputation = gm
    ? getGMIntelNumber(gm, ["reputation", "Reputation"], 70)
    : null;

  const reputationGrade = reputation !== null ? getGMIntelGrade(reputation) : "--";
  const reputationClass = reputation !== null ? getGMIntelGradeClass(reputation) : "vacant";
  const gradeItems = getGMIntelGradeItems(gm);

  return `
    <article
      class="gm-intel-card"
      style="--gm-team-primary:${primary}; --gm-team-secondary:${secondary};"
    >
      <div class="gm-intel-team-header">
        ${escapeGMIntelHtml(team.name)}
      </div>

      <div class="gm-intel-card-body">
        <div class="gm-intel-name-block">
          <span>General Manager</span>
          <h3>${escapeGMIntelHtml(gmName)}</h3>
          <p>${escapeGMIntelHtml(personality)}</p>
        </div>

        <div class="gm-intel-reputation ${reputationClass}">
          <span>Reputation</span>
          <strong>${reputationGrade}</strong>
        </div>

        <div class="gm-intel-grade-list">
          ${gradeItems.map(renderGMIntelGradePill).join("")}
        </div>
      </div>
    </article>
  `;
}

function displayGMIntelScreen() {
  const root = document.getElementById("gm-intel-root");

  if (!root || !gameState || !gameState.started) return;

  const teams = getGMIntelTeamsEastWest();

  root.innerHTML = `
    <div class="gm-intel-page">
      <div class="gm-intel-header">
        <div>
          <span>Trade Department</span>
          <h2>GM Intel</h2>
          <p>
            A visual scouting board for every front office leader in the league.
            This is display-only for now and does not affect trade logic yet.
          </p>
        </div>
      </div>

      <div class="gm-intel-grid">
        ${teams.map(renderGMIntelCard).join("")}
      </div>
    </div>
  `;
}
