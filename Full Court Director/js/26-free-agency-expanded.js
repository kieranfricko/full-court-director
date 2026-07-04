/*
 * Full Court Director — Expanded Free Agency (Phases 2–3)
 * Pre-Free Agency and the reusable offer builder live here.
 * No live free-agency simulation is included.
 */
let preFreeAgencyActiveTab = "options";
const preFreeAgencyMessages = {};
let contractOfferBuilderState = null;

function escapePreFreeAgencyHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPreFreeAgencyMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? `$${Math.round(amount * 1000) / 1000}M` : "$0M";
}

function getPreFreeAgencyTeamId() {
  return Number(gameState?.selectedTeamId || 0);
}

function getPreFreeAgencyPlayerId(player) {
  return player?.id ?? player?.playerId;
}

function getPreFreeAgencyPosition(player) {
  return player?.primaryPosition || player?.position || "—";
}

function isPreFreeAgencyAvailable() {
  if (
    !gameState?.currentDate ||
    typeof getOffseasonContractPhase !== "function" ||
    getOffseasonContractPhase(gameState.currentDate) !== "PRE_FREE_AGENCY"
  ) {
    return false;
  }
  const date = new Date(gameState.currentDate);
  const key = (date.getMonth() + 1) * 100 + date.getDate();
  return key >= 622 && key <= 629;
}

function showPreFreeAgencyScreen(tab = null) {
  if (tab) preFreeAgencyActiveTab = tab;
  if (typeof showMainSection === "function") showMainSection("free-agency");
  if (typeof showSecondaryScreen === "function") showSecondaryScreen("pre-free-agency-screen");
}

function setPreFreeAgencyTab(tab) {
  preFreeAgencyActiveTab = ["options", "rights", "resign"].includes(tab) ? tab : "options";
  renderPreFreeAgencyScreen();
}

function findPreFreeAgencyPlayer(playerId) {
  const candidates = [
    ...(gameState?.freeAgents || []),
    ...Object.values(gameState?.rosters || {}).flat()
  ];
  return candidates.find(player =>
    String(getPreFreeAgencyPlayerId(player)) === String(playerId)
  ) || null;
}

function getOwnPreFreeAgents(teamId = getPreFreeAgencyTeamId()) {
  const players = [];
  const add = player => {
    if (!player || !isRightsTeam(player, teamId)) return;
    if (Number(player.contractYears || 0) > 0 && !gameState?.freeAgents?.includes(player)) return;
    const id = getPreFreeAgencyPlayerId(player);
    if (!players.some(item => String(getPreFreeAgencyPlayerId(item)) === String(id))) players.push(player);
  };
  (gameState?.freeAgents || []).forEach(add);
  (gameState?.rosters?.[teamId] || []).forEach(add);
  return players.sort((a, b) => Number(b.currentAbility || 0) - Number(a.currentAbility || 0));
}

function getPreFreeAgencyOptionRows(teamId = getPreFreeAgencyTeamId()) {
  if (typeof getPendingOptionDecisions !== "function") return [];
  const rows = [];
  (getPendingOptionDecisions(teamId) || []).forEach(player => {
    const options = player.contractOptions && typeof player.contractOptions === "object"
      ? player.contractOptions
      : {};
    const entries = Object.entries(options);
    if (!entries.length && (player.optionType || player.contractOption)) {
      entries.push([player.optionType || player.contractOption, {
        salary: player.optionSalary || player.salary,
        year: player.optionYear
      }]);
    }
    entries.forEach(([type, rawDetails]) => {
      const details = rawDetails && typeof rawDetails === "object" ? rawDetails : {};
      if (details.exercised || details.declined) return;
      const label = String(type || "Option").toUpperCase().replaceAll("_", " ");
      rows.push({
        player,
        type,
        details,
        label,
        playerControlled: label.includes("PLAYER") || label.includes("ETO")
      });
    });
  });
  return rows;
}

function renderPreFreeAgencyScreen() {
  const root = document.getElementById("pre-free-agency-root");
  if (!root) return;

  if (!window.ContractRules || typeof getTeamSalaryBreakdown !== "function") {
    root.innerHTML = renderPreFreeAgencyUnavailable(
      "Pre-Free Agency is unavailable",
      "The contract rules engine could not be loaded. Reload the game and try again."
    );
    return;
  }

  if (!isPreFreeAgencyAvailable()) {
    root.innerHTML = `
      ${renderPreFreeAgencyHeader()}
      ${renderPreFreeAgencyUnavailable("Pre-Free Agency is closed", "This screen is available from June 22 through June 29.")}
    `;
    return;
  }

  root.innerHTML = `
    <div class="pre-fa-shell">
      ${renderPreFreeAgencyHeader()}
      <nav class="pre-fa-tabs" aria-label="Pre-Free Agency sections">
        ${renderPreFreeAgencyTabButton("options", "Contract Options")}
        ${renderPreFreeAgencyTabButton("rights", "Rights & Qualifying Offers")}
        ${renderPreFreeAgencyTabButton("resign", "Re-Sign Own Players")}
      </nav>
      <div class="pre-fa-content">
        ${preFreeAgencyActiveTab === "options"
          ? renderPreFreeAgencyOptionsTab()
          : preFreeAgencyActiveTab === "rights"
            ? renderPreFreeAgencyRightsTab()
            : renderPreFreeAgencyResignTab()}
      </div>
    </div>
  `;
}

function renderPreFreeAgencyHeader() {
  const dateText = gameState?.currentDate
    ? new Date(gameState.currentDate).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric"
    })
    : "";
  return `
    <header class="pre-fa-header">
      <div>
        <span class="pre-fa-kicker">JUNE 22–29</span>
        <h1>Pre-Free Agency</h1>
        <p>Handle options, qualifying offers, Bird rights, cap holds, and your own free agents before the market opens.</p>
      </div>
      <div class="pre-fa-date">${escapePreFreeAgencyHtml(dateText)}</div>
    </header>
  `;
}

function renderPreFreeAgencyUnavailable(title, text) {
  return `
    <div class="pre-fa-shell">
      <div class="pre-fa-empty">
        <h2>${escapePreFreeAgencyHtml(title)}</h2>
        <p>${escapePreFreeAgencyHtml(text)}</p>
      </div>
    </div>
  `;
}

function renderPreFreeAgencyTabButton(tab, label) {
  return `
    <button type="button" class="${preFreeAgencyActiveTab === tab ? "active" : ""}" onclick="setPreFreeAgencyTab('${tab}')">
      ${escapePreFreeAgencyHtml(label)}
    </button>
  `;
}

function renderPreFreeAgencyOptionsTab() {
  const rows = getPreFreeAgencyOptionRows();
  if (!rows.length) {
    return renderPreFreeAgencyUnavailable("No pending option decisions.", "All recorded contract options have been resolved.");
  }
  return `
    <div class="pre-fa-section-heading">
      <div><h2>Contract Options</h2><p>Decide team-controlled options. Player options and ETOs are simulated for this phase.</p></div>
    </div>
    <div class="pre-fa-card-list">${rows.map(renderPreFreeAgencyOptionCard).join("")}</div>
  `;
}

function renderPreFreeAgencyOptionCard(row) {
  const { player, details } = row;
  const playerId = getPreFreeAgencyPlayerId(player);
  const deadline = details.deadline || getOptionDecisionDeadline(player, row.type);
  const status = player.optionDecision?.decision || "PENDING";
  const message = preFreeAgencyMessages[`option_${playerId}`] || "";
  return `
    <article class="pre-fa-player-card">
      ${renderPreFreeAgencyPlayerHeader(player, status, formatPreFreeAgencyMoney(player.salary) + " current")}
      <div class="pre-fa-detail-grid">
        ${renderPreFreeAgencyDetail("Option Type", row.label)}
        ${renderPreFreeAgencyDetail("Option Year", details.year || player.optionYear || "Next Season")}
        ${renderPreFreeAgencyDetail("Option Salary", formatPreFreeAgencyMoney(details.salary ?? player.optionSalary ?? player.salary))}
        ${renderPreFreeAgencyDetail("Deadline", deadline)}
      </div>
      <div class="pre-fa-actions">
        ${row.playerControlled
          ? `<span class="pre-fa-helper">Player-controlled decision</span>
             <button type="button" onclick="simulatePreFreeAgencyPlayerOption('${escapePreFreeAgencyHtml(playerId)}')">Sim Player Decision</button>`
          : `<button type="button" class="primary" onclick="exercisePreFreeAgencyTeamOption('${escapePreFreeAgencyHtml(playerId)}', '${escapePreFreeAgencyHtml(row.type)}')">Exercise</button>
             <button type="button" class="danger" onclick="declinePreFreeAgencyTeamOption('${escapePreFreeAgencyHtml(playerId)}')">Decline</button>`}
      </div>
      ${renderPreFreeAgencyMessage(message)}
    </article>
  `;
}

function renderPreFreeAgencyPlayerHeader(player, badge, sideText) {
  return `
    <div class="pre-fa-player-main">
      <div>
        <span class="pre-fa-status ${String(badge).toLowerCase()}">${escapePreFreeAgencyHtml(badge)}</span>
        <h3>${escapePreFreeAgencyHtml(player.name || "Unknown Player")}</h3>
        <p>${escapePreFreeAgencyHtml(getPreFreeAgencyPosition(player))} · Age ${Number(player.age || 0) || "—"}</p>
      </div>
      <strong>${escapePreFreeAgencyHtml(sideText)}</strong>
    </div>
  `;
}

function renderPreFreeAgencyDetail(label, value) {
  return `<div><span>${escapePreFreeAgencyHtml(label)}</span><strong>${escapePreFreeAgencyHtml(value)}</strong></div>`;
}

function renderPreFreeAgencyMessage(message) {
  return message ? `<div class="pre-fa-message">${escapePreFreeAgencyHtml(message)}</div>` : "";
}

function exercisePreFreeAgencyTeamOption(playerId, optionType) {
  const player = findPreFreeAgencyPlayer(playerId);
  const check = canExerciseOptionToday(player, optionType, gameState.currentDate);
  const result = check.legal
    ? exerciseTeamOption(getPreFreeAgencyTeamId(), playerId)
    : check;
  preFreeAgencyMessages[`option_${playerId}`] = result.legal
    ? "Team option exercised."
    : result.problems?.join(" ") || "This option cannot be exercised.";
  refreshPreFreeAgencyAfterAction();
}

function declinePreFreeAgencyTeamOption(playerId) {
  const result = declineTeamOption(getPreFreeAgencyTeamId(), playerId);
  preFreeAgencyMessages[`option_${playerId}`] = result.legal
    ? "Team option declined."
    : result.problems?.join(" ") || "The option could not be declined.";
  refreshPreFreeAgencyAfterAction();
}

function simulatePreFreeAgencyPlayerOption(playerId) {
  const player = findPreFreeAgencyPlayer(playerId);
  if (!player) return;
  const optionSalary = Number(player.optionSalary || player.salary || 0);
  const expectedSalary = Number(player.expectedSalary || optionSalary);
  const ability = Number(player.currentAbility || 0);
  const shouldDecline = ability >= 550 && optionSalary < expectedSalary * 0.85;
  const result = shouldDecline ? playerDeclineOption(playerId) : playerExerciseOption(playerId);
  preFreeAgencyMessages[`option_${playerId}`] = result.legal
    ? `Player ${shouldDecline ? "declined" : "exercised"} the option.`
    : result.problems?.join(" ") || "The player decision could not be completed.";
  refreshPreFreeAgencyAfterAction();
}

function renderPreFreeAgencyRightsTab() {
  const teamId = getPreFreeAgencyTeamId();
  const players = getOwnPreFreeAgents(teamId);
  const summary = getTeamSalaryBreakdown(teamId);
  const apron = getApronTeamSalaryBreakdown(teamId);
  const holds = getTeamCapHolds(teamId) || [];
  const totalHolds = holds.reduce((sum, hold) => sum + Number(hold.amount || 0), 0);
  return `
    <div class="pre-fa-rule-note">Keeping rights costs cap space, but renouncing rights removes your special re-signing power.</div>
    <div class="pre-fa-summary-grid">
      ${renderPreFreeAgencyDetail("Team Salary", formatPreFreeAgencyMoney(summary.totalTeamSalary))}
      ${renderPreFreeAgencyDetail("Cap Room", formatPreFreeAgencyMoney(summary.capRoom))}
      ${renderPreFreeAgencyDetail("First Apron Room", formatPreFreeAgencyMoney(apron.firstApronRoom))}
      ${renderPreFreeAgencyDetail("Second Apron Room", formatPreFreeAgencyMoney(apron.secondApronRoom))}
      ${renderPreFreeAgencyDetail("Total Cap Holds", formatPreFreeAgencyMoney(totalHolds))}
    </div>
    <div class="pre-fa-section-heading">
      <div><h2>Rights & Qualifying Offers</h2><p>Manage the rights that stay on your books before the market opens.</p></div>
    </div>
    ${players.length
      ? `<div class="pre-fa-card-list">${players.map(player => renderPreFreeAgencyRightsCard(player, teamId)).join("")}</div>`
      : renderPreFreeAgencyUnavailable("No qualifying offer decisions.", "Your team has no recorded free-agent rights decisions.")}
  `;
}

function renderPreFreeAgencyRightsCard(player, teamId) {
  const playerId = getPreFreeAgencyPlayerId(player);
  const rights = getPlayerRightsStatus(player, teamId);
  const rfa = getRestrictedFreeAgentStatus(player);
  const renounceCheck = canRenouncePlayer(teamId, playerId);
  const message = preFreeAgencyMessages[`rights_${playerId}`] || "";
  return `
    <article class="pre-fa-player-card">
      ${renderPreFreeAgencyPlayerHeader(player, rfa.status, rights.birdRightsType?.replaceAll("_", " ") || "No Bird Rights")}
      <div class="pre-fa-detail-grid">
        ${renderPreFreeAgencyDetail("Cap Hold", formatPreFreeAgencyMoney(getCapHoldAmount(player, teamId)))}
        ${renderPreFreeAgencyDetail("Qualifying Offer", rfa.restricted ? formatPreFreeAgencyMoney(getQualifyingOfferAmount(player, teamId)) : "Not applicable")}
        ${renderPreFreeAgencyDetail("Max Eligible Offer", formatPreFreeAgencyMoney(getOwnPlayerMaxOffer(player, teamId)))}
        ${renderPreFreeAgencyDetail("Renounced", rights.renounced ? "Yes" : "No")}
        ${renderPreFreeAgencyDetail("QO Submitted", rights.qualifyingOfferSubmitted ? "Yes" : "No")}
      </div>
      <div class="pre-fa-actions">
        ${rfa.restricted && !rights.qualifyingOfferSubmitted
          ? `<button type="button" class="primary" onclick="submitPreFreeAgencyQO('${escapePreFreeAgencyHtml(playerId)}')">Submit Qualifying Offer</button>`
          : ""}
        ${rights.qualifyingOfferSubmitted
          ? `<button type="button" onclick="withdrawPreFreeAgencyQO('${escapePreFreeAgencyHtml(playerId)}')">Withdraw QO</button>`
          : ""}
        ${!rfa.restricted && !rights.renounced
          ? `<button type="button" class="danger" onclick="renouncePreFreeAgencyRights('${escapePreFreeAgencyHtml(playerId)}')">Renounce Rights</button>`
          : ""}
        ${!renounceCheck.allowed && !rights.renounced
          ? `<span class="pre-fa-helper">${escapePreFreeAgencyHtml(renounceCheck.explanation || "")}</span>`
          : ""}
      </div>
      ${renderPreFreeAgencyMessage(message)}
    </article>
  `;
}

function submitPreFreeAgencyQO(playerId) {
  const result = submitQualifyingOffer(getPreFreeAgencyTeamId(), playerId);
  preFreeAgencyMessages[`rights_${playerId}`] = result.legal
    ? `Qualifying offer submitted for ${formatPreFreeAgencyMoney(result.amount)}.`
    : result.problems?.join(" ") || "The qualifying offer could not be submitted.";
  refreshPreFreeAgencyAfterAction();
}

function withdrawPreFreeAgencyQO(playerId) {
  const result = withdrawQualifyingOffer(getPreFreeAgencyTeamId(), playerId, gameState.currentDate);
  preFreeAgencyMessages[`rights_${playerId}`] = result.legal
    ? "Qualifying offer withdrawn."
    : result.problems?.join(" ") || "The qualifying offer could not be withdrawn.";
  refreshPreFreeAgencyAfterAction();
}

function renouncePreFreeAgencyRights(playerId) {
  const result = renouncePlayerRights(getPreFreeAgencyTeamId(), playerId);
  preFreeAgencyMessages[`rights_${playerId}`] = result.legal
    ? result.explanation || "Player rights renounced."
    : result.explanation || result.problems?.join(" ") || "Rights could not be renounced.";
  refreshPreFreeAgencyAfterAction();
}

function renderPreFreeAgencyResignTab() {
  const teamId = getPreFreeAgencyTeamId();
  const players = getOwnPreFreeAgents(teamId);
  if (!players.length) {
    return renderPreFreeAgencyUnavailable("No own free agents to re-sign.", "Your team has no players with retained rights.");
  }
  return `
    <div class="pre-fa-section-heading">
      <div><h2>Re-Sign Own Players</h2><p>Build and validate an offer before committing to an agreement.</p></div>
    </div>
    <div class="pre-fa-card-list">${players.map(player => renderPreFreeAgencyResignCard(player, teamId)).join("")}</div>
    ${contractOfferBuilderState ? renderContractOfferBuilder() : ""}
  `;
}

function renderPreFreeAgencyResignCard(player, teamId) {
  const playerId = getPreFreeAgencyPlayerId(player);
  const rights = getPlayerRightsStatus(player, teamId);
  const rfa = getRestrictedFreeAgentStatus(player);
  const agreement = (gameState?.contractRules?.agreements || []).find(item =>
    String(item.playerId) === String(playerId) &&
    Number(item.teamId) === Number(teamId) &&
    item.preFreeAgency === true
  );
  const message = preFreeAgencyMessages[`resign_${playerId}`] || "";
  return `
    <article class="pre-fa-player-card">
      ${renderPreFreeAgencyPlayerHeader(player, rfa.status, rights.birdRightsType?.replaceAll("_", " ") || "No Bird Rights")}
      <div class="pre-fa-detail-grid">
        ${renderPreFreeAgencyDetail("Cap Hold", formatPreFreeAgencyMoney(getCapHoldAmount(player, teamId)))}
        ${renderPreFreeAgencyDetail("Max Eligible Offer", formatPreFreeAgencyMoney(getOwnPlayerMaxOffer(player, teamId)))}
        ${renderPreFreeAgencyDetail("Rights Status", rights.renounced ? "Renounced" : "Retained")}
        ${renderPreFreeAgencyDetail("Offer Status", agreement ? "Offer Agreed" : "No Offer")}
      </div>
      <div class="pre-fa-actions">
        <button type="button" class="primary" onclick="openContractOfferBuilder('${escapePreFreeAgencyHtml(playerId)}')">
          ${agreement ? "View / Replace Offer" : "Build Offer"}
        </button>
      </div>
      ${renderPreFreeAgencyMessage(message)}
    </article>
  `;
}

function renderPreFreeAgencyValidation(result) {
  const items = [
    ...(result.problems || []).map(text => ({ type: "problem", text })),
    ...(result.warnings || []).map(text => ({ type: "warning", text })),
    ...(result.explanations || []).map(text => ({ type: "explanation", text }))
  ];
  return `
    <div class="pre-fa-validation ${result.legal ? "legal" : "illegal"}">
      <strong>${result.legal ? "LEGAL OFFER" : "OFFER NEEDS CHANGES"}</strong>
      ${items.length
        ? `<ul>${items.map(item => `<li class="${item.type}">${escapePreFreeAgencyHtml(item.text)}</li>`).join("")}</ul>`
        : "<p>No rule issues found.</p>"}
    </div>
  `;
}

function getContractBuilderSeasonLabels(years) {
  const configured = typeof getContractRulesConfig === "function"
    ? getContractRulesConfig().seasonLabel
    : gameState?.seasonLabel;
  const startYear = Number(String(configured || gameState?.seasonLabel || "2026-2027").slice(0, 4)) || 2026;
  return Array.from({ length: Math.max(1, Number(years) || 1) }, (_, index) =>
    `${startYear + index}-${startYear + index + 1}`
  );
}

function createContractOfferBuilderState(player) {
  const teamId = getPreFreeAgencyTeamId();
  const minimum = Number(getMinimumSalaryForYearsService(player?.yearsService) || 0);
  const fair = Math.max(minimum, Number(player?.expectedSalary || player?.salary || minimum));
  return {
    playerId: getPreFreeAgencyPlayerId(player),
    teamId,
    years: 3,
    startingSalary: fair,
    annualRaisePercent: 5,
    playerOption: false,
    teamOption: false,
    guarantees: {},
    guaranteeDates: {},
    rolePromise: "No Promise",
    teamDirectionPitch: "Championship Contender",
    offer: null,
    validation: null
  };
}

function openContractOfferBuilder(playerId) {
  if (!window.ContractRules) {
    preFreeAgencyMessages[`resign_${playerId}`] = "The contract rules engine is unavailable.";
    renderPreFreeAgencyScreen();
    return;
  }
  const player = findPreFreeAgencyPlayer(playerId);
  if (!player) {
    preFreeAgencyMessages[`resign_${playerId}`] = "This player could not be found.";
    renderPreFreeAgencyScreen();
    return;
  }
  contractOfferBuilderState = createContractOfferBuilderState(player);
  recalculateContractOfferBuilder();
  renderPreFreeAgencyScreen();
}

function closeContractOfferBuilder() {
  contractOfferBuilderState = null;
  renderPreFreeAgencyScreen();
}

function calculateContractBuilderSalaryByYear(startingSalary, years, raisePercent) {
  const labels = getContractBuilderSeasonLabels(years);
  const start = Number(startingSalary);
  const raise = Number(raisePercent) / 100;
  const salaries = {};
  labels.forEach((label, index) => {
    salaries[label] = Number.isFinite(start)
      ? Math.round(start * Math.pow(1 + raise, index) * 1000) / 1000
      : 0;
  });
  return salaries;
}

function buildContractOfferFromState() {
  const state = contractOfferBuilderState;
  if (!state) return null;
  const years = Math.max(1, Math.floor(Number(state.years) || 1));
  const labels = getContractBuilderSeasonLabels(years);
  const salaryByYear = calculateContractBuilderSalaryByYear(state.startingSalary, years, state.annualRaisePercent);
  const guaranteedByYear = {};
  const unprotectedSalaryByYear = {};
  const guaranteeDates = {};

  labels.forEach(label => {
    const salary = Number(salaryByYear[label] || 0);
    const guaranteed = Math.max(0, Math.min(salary, Number(state.guarantees[label] ?? salary)));
    guaranteedByYear[label] = Math.round(guaranteed * 1000) / 1000;
    unprotectedSalaryByYear[label] = Math.round((salary - guaranteed) * 1000) / 1000;
    guaranteeDates[label] = state.guaranteeDates[label] || "";
  });

  const preliminary = {
    startingSalary: state.startingSalary === "" ? "" : Number(state.startingSalary),
    years,
    annualRaisePercent: Number(state.annualRaisePercent || 0),
    salaryByYear,
    playerOptionYear: state.playerOption ? labels[labels.length - 1] : null,
    teamOptionYear: state.teamOption ? labels[labels.length - 1] : null,
    guaranteedByYear,
    unprotectedSalaryByYear,
    guaranteeDates,
    signingTool: null,
    isOfferSheet: false,
    isTwoWay: false,
    isMinimum: false,
    isSignAndTrade: false,
    date: gameState?.currentDate,
    rolePromise: state.rolePromise,
    teamDirectionPitch: state.teamDirectionPitch
  };
  const player = findPreFreeAgencyPlayer(state.playerId);
  preliminary.signingTool = getBestSigningTool(state.teamId, player, preliminary)?.type || null;
  return preliminary;
}

function recalculateContractOfferBuilder() {
  if (!contractOfferBuilderState) return;
  const offer = buildContractOfferFromState();
  contractOfferBuilderState.offer = offer;
  contractOfferBuilderState.validation = validateContractOffer(
    contractOfferBuilderState.teamId,
    contractOfferBuilderState.playerId,
    offer
  );
}

function updateContractOfferBuilderField(field, value) {
  if (!contractOfferBuilderState) return;
  if (field === "playerOption" || field === "teamOption") {
    contractOfferBuilderState[field] = Boolean(value);
    if (value) contractOfferBuilderState[field === "playerOption" ? "teamOption" : "playerOption"] = false;
  } else {
    contractOfferBuilderState[field] = value;
  }
  recalculateContractOfferBuilder();
  renderContractOfferBuilderIntoDom(field);
}

function updateContractOfferGuarantee(label, field, value) {
  if (!contractOfferBuilderState) return;
  if (field === "amount") contractOfferBuilderState.guarantees[label] = value === "" ? "" : Number(value);
  if (field === "date") contractOfferBuilderState.guaranteeDates[label] = value;
  recalculateContractOfferBuilder();
  renderContractOfferBuilderIntoDom(`guarantee_${field}_${label}`);
}

function quickFillContractOffer(kind) {
  if (!contractOfferBuilderState) return;
  const player = findPreFreeAgencyPlayer(contractOfferBuilderState.playerId);
  if (!player) return;
  const teamId = contractOfferBuilderState.teamId;
  const maximum = Number(getOwnPlayerMaxOffer(player, teamId) || getPlayerMaxSalary(player));
  const minimum = Number(getMinimumSalaryForYearsService(player.yearsService));
  const fair = Math.min(maximum, Math.max(minimum, Number(player.expectedSalary || player.salary || minimum)));

  if (kind === "clear") {
    contractOfferBuilderState.startingSalary = "";
    contractOfferBuilderState.years = 1;
    contractOfferBuilderState.annualRaisePercent = 0;
  } else {
    contractOfferBuilderState.startingSalary = kind === "max" ? maximum : kind === "minimum" ? minimum : fair;
    contractOfferBuilderState.years = kind === "max" ? 5 : kind === "minimum" ? 1 : 3;
    contractOfferBuilderState.annualRaisePercent = kind === "minimum" ? 0 : 5;
  }
  contractOfferBuilderState.playerOption = false;
  contractOfferBuilderState.teamOption = false;
  contractOfferBuilderState.guarantees = {};
  contractOfferBuilderState.guaranteeDates = {};
  recalculateContractOfferBuilder();
  renderContractOfferBuilderIntoDom();
}

function renderContractOfferBuilderIntoDom(focusField = "") {
  const existing = document.getElementById("contract-offer-builder-overlay");
  if (!existing) {
    renderPreFreeAgencyScreen();
    return;
  }
  existing.outerHTML = renderContractOfferBuilder();
  if (focusField) {
    const nextField = document.querySelector(`[data-builder-field="${CSS.escape(focusField)}"]`);
    if (nextField) nextField.focus();
  }
}

function renderContractOfferBuilder() {
  const state = contractOfferBuilderState;
  if (!state) return "";
  const player = findPreFreeAgencyPlayer(state.playerId);
  if (!player) {
    return `<div id="contract-offer-builder-overlay" class="contract-builder-overlay"><div class="contract-builder-modal"><p>Player not found.</p><button onclick="closeContractOfferBuilder()">Close</button></div></div>`;
  }
  const validation = state.validation || { legal: false, problems: ["Enter an offer to begin."], warnings: [], explanations: [] };
  const offer = state.offer || buildContractOfferFromState();
  const labels = getContractBuilderSeasonLabels(state.years);
  const toolLabel = validation.toolLabel || offer?.signingTool?.replaceAll("_", " ") || "No legal tool";
  const hardCapText = validation.triggeredHardCap
    ? `This offer does hard-cap your team at the ${validation.triggeredHardCap.replaceAll("_", " ").toLowerCase()}.`
    : "This offer does not hard-cap your team.";

  return `
    <div id="contract-offer-builder-overlay" class="contract-builder-overlay" role="dialog" aria-modal="true" aria-label="Contract Offer Builder">
      <div class="contract-builder-modal">
        <header class="contract-builder-header">
          <div>
            <span>CONTRACT OFFER BUILDER</span>
            <h2>${escapePreFreeAgencyHtml(player.name || "Player")}</h2>
            <p>${escapePreFreeAgencyHtml(getPreFreeAgencyPosition(player))} · Age ${Number(player.age || 0) || "—"} · Cap Hold ${formatPreFreeAgencyMoney(getCapHoldAmount(player, state.teamId))}</p>
          </div>
          <button type="button" class="contract-builder-close" onclick="closeContractOfferBuilder()" aria-label="Close">×</button>
        </header>

        <div class="contract-builder-quick-fill">
          <button type="button" onclick="quickFillContractOffer('max')">Max Offer</button>
          <button type="button" onclick="quickFillContractOffer('fair')">Fair Offer</button>
          <button type="button" onclick="quickFillContractOffer('minimum')">Minimum Offer</button>
          <button type="button" onclick="quickFillContractOffer('clear')">Clear Offer</button>
        </div>

        <div class="contract-builder-grid">
          <section class="contract-builder-form">
            <h3>Offer Terms</h3>
            <div class="contract-builder-fields">
              ${renderContractBuilderNumberField("Years", "years", state.years, 1, 5, 1)}
              ${renderContractBuilderNumberField("Starting Salary (M)", "startingSalary", state.startingSalary, 0, 100, 0.001)}
              ${renderContractBuilderNumberField("Annual Raise %", "annualRaisePercent", state.annualRaisePercent, 0, 8, 0.1)}
            </div>

            <div class="contract-builder-option-row">
              <label><input type="checkbox" ${state.playerOption ? "checked" : ""} onchange="updateContractOfferBuilderField('playerOption', this.checked)"> Player option in final year</label>
              <label><input type="checkbox" ${state.teamOption ? "checked" : ""} onchange="updateContractOfferBuilderField('teamOption', this.checked)"> Team option in final year</label>
            </div>

            <div class="contract-builder-fields">
              ${renderContractBuilderSelect("Role Promise", "rolePromise", state.rolePromise, [
                "Franchise Player", "Starter", "Sixth Man", "Rotation", "Bench", "Developmental", "No Promise"
              ])}
              ${renderContractBuilderSelect("Team Direction Pitch", "teamDirectionPitch", state.teamDirectionPitch, [
                "Championship Contender", "Playoff Team", "Young Core", "Bigger Role", "Long-Term Security", "Best Financial Offer"
              ])}
            </div>

            <h3>Salary & Protection by Year</h3>
            <div class="contract-builder-year-list">
              ${labels.map(label => renderContractBuilderYear(label, offer)).join("")}
            </div>
          </section>

          <aside class="contract-builder-summary">
            <h3>Offer Summary</h3>
            <div class="contract-builder-rule-callout">
              <strong>This offer uses: ${escapePreFreeAgencyHtml(toolLabel)}</strong>
              <p>${escapePreFreeAgencyHtml(hardCapText)}</p>
            </div>
            <div class="contract-builder-metrics">
              ${renderPreFreeAgencyDetail("Projected Payroll", formatPreFreeAgencyMoney(validation.projectedTeamSalary))}
              ${renderPreFreeAgencyDetail("Projected Apron Salary", formatPreFreeAgencyMoney(validation.projectedApronTeamSalary))}
              ${renderPreFreeAgencyDetail("Cap Room After", formatPreFreeAgencyMoney(validation.projectedCapRoom))}
              ${renderPreFreeAgencyDetail("First Apron Room", formatPreFreeAgencyMoney(validation.projectedFirstApronRoom))}
              ${renderPreFreeAgencyDetail("Second Apron Room", formatPreFreeAgencyMoney(validation.projectedSecondApronRoom))}
            </div>
            ${renderPreFreeAgencyValidation(validation)}
            <div class="contract-builder-rule-explanation">
              <strong>Rule Explanation</strong>
              <p>${escapePreFreeAgencyHtml(
                typeof getContractRuleExplanation === "function"
                  ? getContractRuleExplanation(offer?.signingTool || "TEAM_SALARY")
                  : "The contract rules engine validates the selected signing path."
              )}</p>
            </div>
            <button type="button" class="contract-builder-submit" ${validation.legal ? "" : "disabled"} onclick="submitContractOfferBuilder()">
              Submit Offer
            </button>
          </aside>
        </div>
      </div>
    </div>
  `;
}

function renderContractBuilderNumberField(label, field, value, min, max, step) {
  return `
    <label>
      <span>${escapePreFreeAgencyHtml(label)}</span>
      <input data-builder-field="${field}" type="number" value="${escapePreFreeAgencyHtml(value)}" min="${min}" max="${max}" step="${step}" oninput="updateContractOfferBuilderField('${field}', this.value)">
    </label>
  `;
}

function renderContractBuilderSelect(label, field, value, options) {
  return `
    <label>
      <span>${escapePreFreeAgencyHtml(label)}</span>
      <select data-builder-field="${field}" onchange="updateContractOfferBuilderField('${field}', this.value)">
        ${options.map(option => `<option ${option === value ? "selected" : ""}>${escapePreFreeAgencyHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderContractBuilderYear(label, offer) {
  const salary = Number(offer?.salaryByYear?.[label] || 0);
  const guaranteed = contractOfferBuilderState.guarantees[label] ?? salary;
  const unprotected = Math.max(0, salary - Number(guaranteed || 0));
  const option = offer.playerOptionYear === label
    ? "Player Option"
    : offer.teamOptionYear === label
      ? "Team Option"
      : "Guaranteed Season";
  return `
    <div class="contract-builder-year-row">
      <div><strong>${escapePreFreeAgencyHtml(label)}</strong><small>${escapePreFreeAgencyHtml(option)}</small></div>
      <div><span>Salary</span><strong>${formatPreFreeAgencyMoney(salary)}</strong></div>
      <label><span>Guaranteed (M)</span><input data-builder-field="guarantee_amount_${label}" type="number" min="0" max="${salary}" step="0.001" value="${escapePreFreeAgencyHtml(guaranteed)}" oninput="updateContractOfferGuarantee('${label}', 'amount', this.value)"></label>
      <div><span>Non-Guaranteed</span><strong>${formatPreFreeAgencyMoney(unprotected)}</strong></div>
      <label><span>Guarantee Date</span><input data-builder-field="guarantee_date_${label}" type="date" value="${escapePreFreeAgencyHtml(contractOfferBuilderState.guaranteeDates[label] || "")}" onchange="updateContractOfferGuarantee('${label}', 'date', this.value)"></label>
    </div>
  `;
}

function submitContractOfferBuilder() {
  const state = contractOfferBuilderState;
  if (!state?.validation?.legal || !state.offer) return;
  const player = findPreFreeAgencyPlayer(state.playerId);
  if (!player) {
    preFreeAgencyMessages[`resign_${state.playerId}`] = "Player not found. The offer was not submitted.";
    closeContractOfferBuilder();
    return;
  }
  const result = applyContractOffer(state.teamId, state.playerId, state.offer);
  if (result.legal && result.agreement) {
    gameState.contractRules.agreements = gameState.contractRules.agreements.filter(item =>
      item === result.agreement ||
      String(item.playerId) !== String(state.playerId) ||
      Number(item.teamId) !== Number(state.teamId) ||
      item.preFreeAgency !== true
    );
    result.agreement.status = "AGREED";
    result.agreement.preFreeAgency = true;
    logFreeAgencyAgreementTransaction(player, state.offer);
  }
  preFreeAgencyMessages[`resign_${state.playerId}`] = result.legal
    ? "Offer Agreed — pending final contract processing."
    : result.problems?.join(" ") || "The offer could not be submitted.";
  contractOfferBuilderState = null;
  refreshPreFreeAgencyAfterAction();
}

function logFreeAgencyAgreementTransaction(player, offer) {
  const team = typeof getTeamById === "function"
    ? getTeamById(getPreFreeAgencyTeamId())
    : gameState?.teams?.find(item => Number(item.id) === getPreFreeAgencyTeamId());
  if (!player || !team) return false;
  if (typeof recordFreeAgentAgreementTransaction === "function") {
    recordFreeAgentAgreementTransaction(player, team, Number(offer.startingSalary || 0), Number(offer.years || 1));
    return true;
  }
  if (typeof addLeagueTransaction === "function") {
    addLeagueTransaction({
      type: "AGREEMENT",
      teamId: team.id,
      teamName: team.name,
      playerId: getPreFreeAgencyPlayerId(player),
      playerName: player.name,
      text: `${team.name} reached a pre-free-agency agreement with ${player.name}.`
    });
    return true;
  }
  return false;
}

function refreshPreFreeAgencyAfterAction() {
  if (typeof saveGame === "function") saveGame();
  renderPreFreeAgencyScreen();
  if (typeof displayDashboard === "function") displayDashboard();
}
