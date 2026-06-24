const REGULAR_SEASON_STANDARD_MIN = 14;
const REGULAR_SEASON_STANDARD_MAX = 15;
const OFFSEASON_STANDARD_MAX = 18;
const TWO_WAY_MAX = 3;

const CONTRACT_CAP_LINES = {
  floor: 139,
  cap: 166,
  tax: 190,
  apronOne: 195,
  apronTwo: 207
};

const CONTRACT_CHART_MAX = 220;

const CONTRACT_PLAYER_COLORS = [
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#38bdf8",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#84cc16",
  "#f59e0b",
  "#06b6d4"
];

function getSalaryCap() {
  return SALARY_CAP;
}

function getPlayerSalary(player) {
  return Number(player.salary || 0);
}

function getPlayerContractYears(player) {
  return Number(player.contractYears || 0);
}

function getRosterPayroll(teamId) {
  const roster = getRosterByTeamId(teamId);

  return roster.reduce((total, player) => total + getPlayerSalary(player), 0);
}

function getCapSpace(teamId) {
  return getSalaryCap() - getRosterPayroll(teamId);
}

function getRosterCount(teamId) {
  return getRosterByTeamId(teamId).length;
}

function isRosterFull(teamId) {
  return getRosterCount(teamId) >= MAX_ROSTER_SIZE;
}

function hasMinimumRoster(teamId) {
  return getRosterCount(teamId) >= MIN_ROSTER_TO_ADVANCE;
}

function getContractTotalRemaining(player) {
  return getPlayerSalary(player) * getPlayerContractYears(player);
}

function getContractStatus(player) {
  const years = getPlayerContractYears(player);

  if (years <= 0) return "Expired";
  if (years === 1) return "Expiring";
  return "Under Contract";
}

function getContractStatusClass(player) {
  const years = getPlayerContractYears(player);

  if (years <= 0) return "contract-warning";
  if (years === 1) return "contract-expiring";
  return "contract-safe";
}

function getSalaryRangeForAbility(ability) {
  if (ability >= 775) return { min: 48, max: 55 };
  if (ability >= 680) return { min: 38, max: 52 };
  if (ability >= 625) return { min: 26, max: 42 };
  if (ability >= 600) return { min: 18, max: 30 };
  if (ability >= 550) return { min: 12, max: 24 };
  if (ability >= 525) return { min: 8, max: 18 };
  if (ability >= 450) return { min: 5, max: 12 };
  if (ability >= 400) return { min: 3, max: 8 };
  if (ability >= 200) return { min: 1.5, max: 5 };
  return { min: 1, max: 3 };
}

function estimateExpectedSalary(player) {
  const ability = player.currentAbility || calculateAbility(player.attributes);
  const range = getSalaryRangeForAbility(ability);

  let salary = randomFloat(range.min, range.max);

  if (player.age <= 23) {
    salary *= 0.82;
  }

  if (player.age >= 33) {
    salary *= 0.88;
  }

  if (Math.random() < 0.12 && player.age >= 29) {
    salary *= 1.2;
  }

  salary = clamp(salary, MINIMUM_SALARY, MAXIMUM_SALARY);

  return roundSalary(salary);
}

function estimateExpectedYears(player) {
  const ability = player.currentAbility || calculateAbility(player.attributes);

  if (player.age >= 35) return randomInt(1, 2);
  if (player.age >= 32) return randomInt(1, 3);
  if (ability >= 625 && player.age <= 30) return randomInt(3, 5);
  if (ability >= 525) return randomInt(2, 4);
  if (player.age <= 24) return randomInt(2, 4);

  return randomInt(1, 3);
}

function roundSalary(amount) {
  return Math.round(Number(amount || 0) * 2) / 2;
}



function assignContractValues(player, options = {}) {
  const expectedSalary = options.expectedSalary || estimateExpectedSalary(player);
  const expectedYears = options.expectedYears || estimateExpectedYears(player);

  player.expectedSalary = roundSalary(expectedSalary);
  player.expectedYears = clamp(Number(expectedYears), 1, 5);

  if (options.makeContract !== false) {
    player.salary = options.salary !== undefined ? roundSalary(options.salary) : player.expectedSalary;
    player.contractYears = options.contractYears !== undefined
      ? clamp(Number(options.contractYears), 0, 5)
      : player.expectedYears;

    player.contract = `${player.contractYears} yrs / ${formatMoney(player.salary)}`;
  }

  if (!player.contractType) {
    player.contractType = "Standard";
  }

  return player;
}

function normalizePlayerContract(player) {
  if (!player) return null;

  if (player.currentAbility === undefined && player.attributes) {
    player.currentAbility = calculateAbility(player.attributes);
  }

  if (player.potentialAbility === undefined && player.potentialAttributes) {
    player.potentialAbility = calculateAbility(player.potentialAttributes);
  }

  if (!player.expectedSalary) {
    player.expectedSalary = estimateExpectedSalary(player);
  }

  if (!player.expectedYears) {
    player.expectedYears = estimateExpectedYears(player);
  }

  if (player.salary === undefined || player.salary === null) {
    player.salary = player.expectedSalary;
  }

  if (player.contractYears === undefined || player.contractYears === null) {
    player.contractYears = randomInt(1, 5);
  }

  player.salary = roundSalary(player.salary);
  player.contractYears = clamp(Number(player.contractYears), 0, 5);
  player.contract = `${player.contractYears} yrs / ${formatMoney(player.salary)}`;

  if (!player.contractType) {
    player.contractType = "Standard";
  }

  if (!player.interest) {
    player.interest = "Neutral";
  }

  return player;
}

function normalizeAllContracts() {
  if (!gameState) return;

  if (gameState.rosters) {
    for (let teamId in gameState.rosters) {
      for (let player of gameState.rosters[teamId]) {
        normalizePlayerContract(player);
      }
    }
  }

  if (Array.isArray(gameState.freeAgents)) {
    for (let player of gameState.freeAgents) {
      normalizePlayerContract(player);
    }
  }
}

function isTwoWayPlayer(player) {
  if (!player) return false;

  return (
    player.rosterContractType === "Two-Way" ||
    player.contractType === "Two-Way" ||
    player.contract === "Two-Way"
  );
}

function getStandardRosterPlayers(teamId) {
  return getRosterByTeamId(teamId).filter(player => !isTwoWayPlayer(player));
}

function getTwoWayRosterPlayers(teamId) {
  return getRosterByTeamId(teamId).filter(player => isTwoWayPlayer(player));
}

function getStandardRosterLimitForCurrentDate() {
  return isRegularSeasonDate() ? REGULAR_SEASON_STANDARD_MAX : OFFSEASON_STANDARD_MAX;
}

function getOpenStandardRosterSpots(teamId) {
  const standardPlayers = getStandardRosterPlayers(teamId);
  const limit = getStandardRosterLimitForCurrentDate();

  return Math.max(0, limit - standardPlayers.length);
}
function createEmptyRosterSpotElement(slotNumber) {
  const row = document.createElement("tr");

  row.className = "roster-empty-spot-row";

  row.innerHTML = `
    <td class="roster-empty-number">${slotNumber}</td>
    <td colspan="8">
      <div class="roster-empty-spot">
        <div class="roster-empty-icon">+</div>
        <div>
          <strong>Roster Spot Empty</strong>
          <p>Sign or acquire a player to fill this standard roster spot.</p>
        </div>
      </div>
    </td>
  `;

  return row;
}

function getSortedRoster() {
  const roster = gameState.rosters[gameState.selectedTeamId] || [];
  return [...roster].sort((a, b) => b.currentAbility - a.currentAbility);
}

function getPlayerRoleFromBenchIndex(index) {
  if (index === 0) return "Sixth Man";
  if (index < 5) return "Rotation";
  return "Reserve";
}

function getMinutesForRole(role) {
  if (role === "Starter") return 32;
  if (role === "Sixth Man") return 26;
  if (role === "Rotation") return 18;
  if (role === "Reserve") return 6;
  return 0;
}

function getRoleBadge(role) {
  let className = "role-reserve";

  if (role === "Starter") className = "role-starter";
  else if (role === "Sixth Man") className = "role-sixth";
  else if (role === "Rotation") className = "role-rotation";

  return `<span class="role-badge ${className}">${role}</span>`;
}

function getSquadRoles() {
  const roster = getSortedRoster();
  const usedPlayers = new Set();
  const starters = [];

  for (let position of positions) {
    let player = roster.find(item => item.primaryPosition === position && !usedPlayers.has(item.id));

    if (!player) {
      player = roster.find(item => item.secondaryPositions.includes(position) && !usedPlayers.has(item.id));
    }

    if (!player) {
      player = roster.find(item => !usedPlayers.has(item.id));
    }

    if (player) {
      starters.push({ slot: position, player });
      usedPlayers.add(player.id);
    } else {
      starters.push({ slot: position, player: null });
    }
  }

  const bench = roster
    .filter(player => !usedPlayers.has(player.id))
    .map((player, index) => ({
      slot: `${index + 6}`,
      player
    }));

  return { starters, bench };
}

function getRosterRulesForCurrentDate() {
  const phase = getSeasonPhase();
  const phaseLower = String(phase || "").toLowerCase();

  const currentDate = new Date(gameState.currentDate);
  const regularSeasonStart = new Date(gameState.seasonStartYear, 9, 20);
  const regularSeasonEnd = new Date(gameState.seasonStartYear + 1, 3, 14);

  const isRegularSeason =
    currentDate >= regularSeasonStart &&
    currentDate <= regularSeasonEnd;

  const isPostseason =
    phaseLower.includes("playoff") ||
    phaseLower.includes("play-in") ||
    phaseLower.includes("final");

  let phaseLabel = "Offseason";
  let minStandard = 0;
  let maxStandard = OFFSEASON_STANDARD_MAX;

  if (phaseLower.includes("training") || phaseLower.includes("preseason")) {
    phaseLabel = "Preseason";
  }

  if (isRegularSeason) {
    phaseLabel = "Regular Season";
    minStandard = REGULAR_SEASON_STANDARD_MIN;
    maxStandard = REGULAR_SEASON_STANDARD_MAX;
  }

  if (isPostseason) {
    phaseLabel = "Playoffs";
    minStandard = REGULAR_SEASON_STANDARD_MIN;
    maxStandard = REGULAR_SEASON_STANDARD_MAX;
  }

  return {
    phase: phaseLabel,
    minStandard,
    maxStandard,
    maxTwoWay: TWO_WAY_MAX
  };
}

function hasActiveRosterUrgentMessage() {
  if (!gameState || !Array.isArray(gameState.inbox)) return false;

  return gameState.inbox.some(message =>
    message &&
    message.actionType === "fix-roster" &&
    message.urgent &&
    !message.resolved
  );
}
function showRosterBlockPopup(status) {
  const existing = document.getElementById("roster-block-popup-overlay");

  if (existing) {
    existing.remove();
  }

  const problemsHtml = status.problems && status.problems.length > 0
    ? status.problems.map(problem => `<li>${problem}</li>`).join("")
    : "<li>Your roster is not legal.</li>";

  const overlay = document.createElement("div");
  overlay.id = "roster-block-popup-overlay";
  overlay.className = "roster-block-popup-overlay";

  overlay.innerHTML = `
    <div class="roster-block-popup">
      <div class="roster-block-popup-badge">Urgent Action Required</div>

      <h1>Roster Not Legal</h1>

      <p class="roster-block-popup-text">
        You cannot advance until your roster meets the current league rules.
      </p>

      <div class="roster-block-popup-phase">
        Current Phase: <strong>${status.phase}</strong>
      </div>

      <div class="roster-block-popup-grid">
        <div>
          <span>Standard Contracts</span>
          <strong>${status.standardCount} / ${status.maxStandard}</strong>
        </div>

        <div>
          <span>Required</span>
          <strong>${status.minStandard > 0 ? `${status.minStandard} minimum` : "No minimum"}</strong>
        </div>

        <div>
          <span>Two-Way Contracts</span>
          <strong>${status.twoWayCount} / ${status.maxTwoWay}</strong>
        </div>
      </div>

      <div class="roster-block-popup-problems">
        <strong>Roster Problems</strong>
        <ul>${problemsHtml}</ul>
      </div>

      <button type="button" onclick="closeRosterBlockPopup()">
        Go Fix Roster
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeRosterBlockPopup() {
  const overlay = document.getElementById("roster-block-popup-overlay");

  if (overlay) {
    overlay.remove();
  }

  currentSecondaryScreen = "roster-screen";

  if (typeof showScreen === "function") {
    showScreen("roster-screen");
  }

  if (typeof showSecondaryScreen === "function") {
    showSecondaryScreen("roster-screen");
  }

  if (typeof displayRoster === "function") {
    displayRoster();
  }

  const rosterScreen = document.getElementById("roster-screen");

  if (rosterScreen) {
    rosterScreen.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function blockAdvanceForIllegalUserRosterIfNeeded() {
  if (!gameState || !gameState.started) return false;
  if (gameState.offseasonActive) {
  return false;
}

  const status = getTeamRosterStatus(gameState.selectedTeamId);

  if (status.legal) {
    return false;
  }

  const selectedTeam = getSelectedTeam();
  const teamName = selectedTeam ? selectedTeam.name : "Your team";
  const problemText = getRosterIllegalMessage(status);

  if (!hasActiveRosterUrgentMessage()) {
    addInboxMessage(
      "Roster Not Legal",
      `${teamName} cannot advance because the roster is not legal for the current phase.\n\nCurrent Phase: ${status.phase}\nStandard Contracts: ${status.standardCount}/${status.maxStandard}\nTwo-Way Contracts: ${status.twoWayCount}/${status.maxTwoWay}\n\n${problemText}`,
      "urgent",
      true,
      "fix-roster"
    );
  }

  showRosterBlockPopup(status);
  displayRosterStatusBox();

  return true;
}

function getTeamRosterStatus(teamId) {
  const rules = getRosterRulesForCurrentDate();
  const standardPlayers = getStandardRosterPlayers(teamId);
  const twoWayPlayers = getTwoWayRosterPlayers(teamId);

  const problems = [];

  if (rules.minStandard > 0 && standardPlayers.length < rules.minStandard) {
  problems.push(`Need at least ${rules.minStandard} standard players before advancing.`);
  }

  if (standardPlayers.length > rules.maxStandard) {
    problems.push(`Must cut down to ${rules.maxStandard} standard players before advancing.`);
  }

  if (twoWayPlayers.length > rules.maxTwoWay) {
    problems.push(`Maximum ${rules.maxTwoWay} two-way players allowed.`);
  }

  return {
    phase: rules.phase,
    standardCount: standardPlayers.length,
    twoWayCount: twoWayPlayers.length,
    minStandard: rules.minStandard,
    maxStandard: rules.maxStandard,
    maxTwoWay: rules.maxTwoWay,
    openStandardSpots: Math.max(0, rules.maxStandard - standardPlayers.length),
    legal: problems.length === 0,
    problems
  };
}

function getRosterIllegalMessage(status) {
  if (!status || !status.problems || status.problems.length === 0) {
    return "Your roster does not meet the current league rules.";
  }

  return status.problems.join("\n");
}

function blockIfRosterTooSmall() {
  if (!gameState.started) return false;

  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return false;

  if (hasMinimumRoster(selectedTeam.id)) {
    return false;
  }

  addInboxMessageOnce(
    "Roster Too Small",
    `You need at least ${MIN_ROSTER_TO_ADVANCE} players on your roster before advancing.`,
    "urgent",
    false,
    "roster_minimum"
  );

  refreshAll();
  return true;
}

function displayRosterStatusBox() {
  const box = document.getElementById("roster-status-box");

  if (!box || !gameState || !gameState.selectedTeamId) return;

  const status = getTeamRosterStatus(gameState.selectedTeamId);

  const statusClass = status.legal ? "legal" : "illegal";
  const legalText = status.legal ? "Legal" : "Not Legal";

  const standardTarget = MAX_ROSTER_SIZE || 15;
  const displayRosterCount = Math.min(status.standardCount, standardTarget);
  const overRosterLimit = status.standardCount > standardTarget;

  const minimumText = status.minStandard > 0
    ? `${status.minStandard} minimum`
    : "No minimum";

  const openStandardSpots = Math.max(0, standardTarget - status.standardCount);

  const problemsHtml = status.problems.length > 0
    ? `
      <div class="roster-status-problems">
        ${status.problems.map(problem => `<p>${problem}</p>`).join("")}
      </div>
    `
    : `<p class="roster-status-good">This roster is valid for the current phase.</p>`;

  box.className = `roster-status-box compact-roster-status-box ${statusClass}`;

  box.innerHTML = `
    <div class="roster-status-header compact-roster-status-header">
      <div class="compact-roster-status-left">
        <span class="roster-legal-label ${statusClass}">${legalText}</span>
        <strong>Current Phase: ${status.phase}</strong>
      </div>

      <div class="compact-roster-status-count">
        ${displayRosterCount}/${standardTarget}
      </div>
    </div>

    <div class="roster-status-grid compact-roster-status-grid">
      <div>
        <span>Roster Spots</span>
        <strong>${status.standardCount} / ${standardTarget}</strong>
      </div>

      <div>
        <span>Required</span>
        <strong>${minimumText}</strong>
      </div>

      <div>
        <span>Two-Way</span>
        <strong>${status.twoWayCount} / ${status.maxTwoWay}</strong>
      </div>

      <div>
        <span>Open Spots</span>
        <strong>${openStandardSpots}</strong>
      </div>
    </div>

    ${overRosterLimit ? `
      <p class="roster-status-camp-note">
        Training camp roster is above 15. Final roster target is still 15 standard players.
      </p>
    ` : ""}

    ${problemsHtml}
  `;
}

function displayRoster() {
  displayRosterTable();
  displayRosterStatusBox();
}

function displaySquadOverview() {
  const roster = getSortedRoster();

  const averageAge = roster.length === 0
    ? 0
    : (roster.reduce((total, player) => total + player.age, 0) / roster.length).toFixed(1);

  const squadLevel = roster.length === 0
    ? "Unknown"
    : getMediaDescription(Math.round(roster.slice(0, 8).reduce((total, player) => total + player.currentAbility, 0) / Math.min(8, roster.length)));

  const expiring = roster.filter(player => player.contractYears <= 1).length;

  setText("squad-roster-size", `${roster.length} / ${MAX_ROSTER_SIZE}`);
  setText("squad-average-age", averageAge);
  setText("squad-team-overall", squadLevel);
  setText("squad-expiring-contracts", expiring);
}

function displayRosterTable() {
  const rosterTable = document.getElementById("roster-table");
  if (!rosterTable) return;

  rosterTable.innerHTML = "";

  const sortedRoster = getSortedRoster();

  if (sortedRoster.length === 0) {
    rosterTable.innerHTML = `
      <tr>
        <td colspan="15">No players found on this roster.</td>
      </tr>
    `;
    return;
  }

  for (let player of sortedRoster) {
    const role = getPlayerRole(player.id);
    const expiringClass = player.contractYears <= 1 ? "contract-expiring" : "";

    const row = `
      <tr>
        <td>${getRoleBadge(role)}</td>

        <td>
          <span class="clickable-player-name" onclick="openPlayerProfile('${player.id}')">
            ${player.name}
          </span>
        </td>

        <td>${getRosterPlayerNumber(player)}</td>
        <td>${player.age || "--"}</td>
        <td>${player.primaryPosition || "--"}</td>
        <td>${player.height || "--"}</td>
        <td>${player.weight || "--"}</td>
        <td>${renderEnergyMini(player)}</td>
        <td>${renderRosterMoraleCircle(player)}</td>
        <td>${formatMoney(player.salary || 0)}</td>
        <td class="${expiringClass}">${player.contractYears || "--"}</td>
        <td>${getRosterPlayerGames(player)}</td>
        <td>${formatRosterPlayerAverage(player, "points")}</td>
        <td>${formatRosterPlayerAverage(player, "rebounds")}</td>
        <td>${formatRosterPlayerAverage(player, "assists")}</td>
      </tr>
    `;

    rosterTable.innerHTML += row;
  }
}

function getRosterPlayerNumber(player) {
  if (!player) return "--";

  return (
    player.jerseyNumber ||
    player.jersey ||
    player.number ||
    player.uniformNumber ||
    "--"
  );
}

function renderRosterMoraleCircle(player) {
  return `
    <span class="roster-morale-circle" title="Morale placeholder"></span>
  `;
}

function getRosterPlayerStatSource(player) {
  if (!player) return {};

  return player.seasonStats || player.stats || player;
}

function getRosterPlayerGames(player) {
  const source = getRosterPlayerStatSource(player);

  return (
    Number(source.games) ||
    Number(source.gamesPlayed) ||
    Number(source.gp) ||
    Number(source.G) ||
    0
  );
}

function getRosterPlayerStatValue(player, statKey) {
  const source = getRosterPlayerStatSource(player);

  const statAliases = {
    points: ["points", "pts", "PTS"],
    rebounds: ["rebounds", "reb", "rpg", "REB"],
    assists: ["assists", "ast", "apg", "AST"]
  };

  const aliases = statAliases[statKey] || [statKey];

  for (let key of aliases) {
    if (source[key] !== undefined) {
      return Number(source[key]) || 0;
    }
  }

  return 0;
}

function formatRosterPlayerAverage(player, statKey) {
  const games = getRosterPlayerGames(player);
  const rawValue = getRosterPlayerStatValue(player, statKey);

  if (!games) {
    return "0.0";
  }

  return (rawValue / games).toFixed(1);
}

function displaySquadNotes() {
  const notes = document.getElementById("squad-notes");
  if (!notes) return;

  notes.innerHTML = "";

  const roster = getSortedRoster();
  const expiring = roster.filter(player => player.contractYears <= 1);
  const rosterCount = roster.length;

  if (rosterCount < 14) {
    notes.appendChild(createMessageElement(createMessage("Roster Depth", `Your roster has ${rosterCount} players. You can carry up to 15.`, "staff", false)));
  }

  if (expiring.length > 0) {
    notes.appendChild(createMessageElement(createMessage("Contract Warning", `${expiring.length} player(s) have expiring contracts.`, "urgent", false)));
  }

  if (getCapSpace(gameState.selectedTeamId) < 0) {
    notes.appendChild(createMessageElement(createMessage("Cap Warning", "Your payroll is above the salary cap. You can still extend your own players, but outside free agent signings are blocked.", "urgent", false)));
  }

  if (notes.innerHTML === "") {
    notes.appendChild(createMessageElement(createMessage("Squad Stable", "No major squad issues right now.", "staff", false)));
  }
}

function displayContracts() {
  const redesignedTable = document.getElementById("contracts-table-body");

  if (redesignedTable) {
    displayContractStatusRedesign();
    return;
  }

  const table = document.getElementById("contracts-table");
  if (!table) return;

  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return;

  const roster = [...getRosterByTeamId(selectedTeam.id)]
    .sort((a, b) => getPlayerSalary(b) - getPlayerSalary(a));

  const payroll = getRosterPayroll(selectedTeam.id);
  const capSpace = getCapSpace(selectedTeam.id);
  const expiringCount = roster.filter(player => getPlayerContractYears(player) <= 1).length;

  setText("contracts-payroll", formatMoney(payroll));
  setText("contracts-salary-cap", formatMoney(getSalaryCap()));
  setText("contracts-cap-space", formatMoney(capSpace));
  setText("contracts-expiring-count", expiringCount);

  table.innerHTML = "";

  for (let player of roster) {
    const status = getContractStatus(player);
    const statusClass = getContractStatusClass(player);

    const row = `
      <tr>
        <td><span class="clickable-player-name" onclick="openPlayerProfile('${player.id}')">${player.name}</span></td>
        <td>${player.age}</td>
        <td>${player.primaryPosition}</td>
        <td>${player.mediaDescription}</td>
        <td>${formatMoney(player.salary)}</td>
        <td>${player.contractYears}</td>
        <td>${formatMoney(getContractTotalRemaining(player))}</td>
        <td class="${statusClass}">${status}</td>
      </tr>
    `;

    table.innerHTML += row;
  }
}

function displayContractStatusRedesign() {
  if (!gameState || !gameState.selectedTeamId) return;

  const years = getContractStatusYears();

  if (selectedContractYearIndex < 0 || selectedContractYearIndex >= years.length) {
    selectedContractYearIndex = 0;
  }

  renderContractStatusTable(years);
  renderContractCapVisual(years[selectedContractYearIndex]);
}

function getContractStatusYears() {
  const startYear = gameState.seasonStartYear || new Date(gameState.currentDate).getFullYear();
  const years = [];

  for (let i = 0; i < 5; i++) {
    const yearStart = startYear + i;

    years.push({
      index: i,
      startYear: yearStart,
      label: getSeasonLabel(yearStart)
    });
  }

  return years;
}

function renderContractYearTabs(years) {
  const container = document.getElementById("contracts-year-tabs");
  if (!container) return;

  container.innerHTML = years.map(year => {
    const activeClass = year.index === selectedContractYearIndex ? "active" : "";

    return `
      <button
        type="button"
        class="contract-year-tab-button ${activeClass}"
        onclick="selectContractYear(${year.index})"
      >
        ${year.label}
      </button>
    `;
  }).join("");
}

function selectContractYear(yearIndex) {
  selectedContractYearIndex = Number(yearIndex) || 0;
  displayContractStatusRedesign();
}

function renderContractStatusTable(years) {
  const headRow = document.getElementById("contracts-table-head-row");
  const body = document.getElementById("contracts-table-body");
  const selectedYearLabel = document.getElementById("contracts-selected-year-label");

  if (!headRow || !body) return;

  const selectedYear = years[selectedContractYearIndex];

  if (selectedYearLabel) {
    selectedYearLabel.textContent = `Click a season column to sort by that year's salary commitment. Currently viewing ${selectedYear.label}.`;
  }

  headRow.innerHTML = `
    <th>Player</th>
    ${years.map(year => {
      const selectedClass = year.index === selectedContractYearIndex ? "contract-selected-year" : "";

      return `
        <th class="${selectedClass}">
          <button
            type="button"
            class="contract-year-header-button ${selectedClass}"
            onclick="selectContractYear(${year.index})"
          >
            ${year.label}
          </button>
        </th>
      `;
    }).join("")}
  `;

  const roster = [...getRosterByTeamId(gameState.selectedTeamId)].sort((a, b) => {
    return getPlayerSalaryForContractYear(b, selectedContractYearIndex) -
      getPlayerSalaryForContractYear(a, selectedContractYearIndex);
  });

  if (roster.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="${years.length + 1}">No players found on this roster.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = roster.map(player => {
    const playerId = player.id || player.playerId;

    return `
      <tr>
        <td>
          <span class="clickable-player-name" onclick="openPlayerProfile('${playerId}')">
            ${escapeLeagueRosterText(player.name)}
          </span>
        </td>

        ${years.map(year => {
          const salary = getPlayerSalaryForContractYear(player, year.index);
          const selectedClass = year.index === selectedContractYearIndex ? "contract-selected-year" : "";

          if (!salary) {
            return `<td class="contract-empty-year ${selectedClass}">---</td>`;
          }

          return `<td class="${selectedClass}">${formatMoney(salary)}</td>`;
        }).join("")}
      </tr>
    `;
  }).join("");
}

function renderContractCapVisual(selectedYear) {
  const graph = document.getElementById("contracts-cap-graphic");
  const legend = document.getElementById("contracts-cap-legend-list");
  const capYearLabel = document.getElementById("contracts-cap-year-label");
  const totalPayrollLabel = document.getElementById("contracts-total-payroll");
  const capSpaceLabel = document.getElementById("contracts-cap-space");
  const rosterSpotsLabel = document.getElementById("contracts-roster-spots");

  if (!graph || !legend) return;

  const roster = [...getRosterByTeamId(gameState.selectedTeamId)]
    .map((player, index) => {
      return {
        player,
        salary: getPlayerSalaryForContractYear(player, selectedYear.index),
        color: CONTRACT_PLAYER_COLORS[index % CONTRACT_PLAYER_COLORS.length]
      };
    })
    .filter(item => item.salary > 0)
    .sort((a, b) => b.salary - a.salary);

  const totalPayroll = roster.reduce((sum, item) => sum + item.salary, 0);
  const capSpace = CONTRACT_CAP_LINES.cap - totalPayroll;

  if (capYearLabel) {
    capYearLabel.textContent = selectedYear.label;
  }

  if (totalPayrollLabel) {
    totalPayrollLabel.textContent = formatMoney(totalPayroll);
  }

  if (capSpaceLabel) {
    capSpaceLabel.textContent = formatMoney(capSpace);
  }

  if (rosterSpotsLabel) {
    const rosterCount = getRosterByTeamId(gameState.selectedTeamId).length;
    rosterSpotsLabel.textContent = `${rosterCount} / ${MAX_ROSTER_SIZE || 15}`;
  }

  graph.innerHTML = `
    ${renderContractCapMarker(CONTRACT_CAP_LINES.apronTwo, "2nd Apron", "contracts-cap-marker-apron-two")}
    ${renderContractCapMarker(CONTRACT_CAP_LINES.apronOne, "1st Apron", "contracts-cap-marker-apron-one")}
    ${renderContractCapMarker(CONTRACT_CAP_LINES.tax, "Luxury Tax", "contracts-cap-marker-tax")}
    ${renderContractCapMarker(CONTRACT_CAP_LINES.cap, "Salary Cap", "contracts-cap-marker-cap")}
    ${renderContractCapMarker(CONTRACT_CAP_LINES.floor, "Salary Floor", "contracts-cap-marker-floor")}
    ${renderContractSalaryBlocks(roster)}
  `;

  legend.innerHTML = roster.length
    ? roster.map(item => {
      return `
        <div class="contracts-cap-legend-item">
          <span class="contracts-cap-legend-dot" style="background: ${item.color};"></span>
          <span class="contracts-cap-legend-name">${escapeLeagueRosterText(getPlayerLegendName(item.player))}</span>
          <span class="contracts-cap-legend-salary">${formatMoney(item.salary)}</span>
        </div>
      `;
    }).join("")
    : `
      <div class="contracts-cap-legend-item">
        <span class="contracts-cap-legend-dot" style="background: #64748b;"></span>
        <span class="contracts-cap-legend-name">No salary committed</span>
        <span class="contracts-cap-legend-salary">$0M</span>
      </div>
    `;
}

function renderContractCapMarker(value, label, className) {
  const bottomPercent = Math.min(100, Math.max(0, (value / CONTRACT_CHART_MAX) * 100));

  return `
    <div
      class="contracts-cap-marker ${className}"
      style="bottom: ${bottomPercent}%;"
    >
      <span>${label}</span>
    </div>
  `;
}

function renderContractSalaryBlocks(rosterItems) {
  let currentBottom = 0;

  return rosterItems.map(item => {
    const heightPercent = Math.max(1.2, (item.salary / CONTRACT_CHART_MAX) * 100);
    const safeBottom = Math.min(100, currentBottom);
    const safeHeight = Math.max(0, Math.min(heightPercent, 100 - safeBottom));

    currentBottom += heightPercent;

    if (safeHeight <= 0) return "";

    return `
      <div
        class="contracts-cap-player-block"
        title="${escapeLeagueRosterText(item.player.name)} - ${formatMoney(item.salary)}"
        style="
          position: absolute;
          left: 50%;
          bottom: ${safeBottom}%;
          height: ${safeHeight}%;
          width: 48%;
          max-width: 150px;
          min-width: 86px;
          transform: translateX(-50%);
          background: ${item.color};
          z-index: 3;
        "
      ></div>
    `;
  }).join("");
}

function getPlayerSalaryForContractYear(player, yearIndex) {
  if (!player) return 0;

  const annualSalary = Number(player.salary || 0);
  const yearsRemaining = Number(player.contractYears || player.years || 0);

  if (!annualSalary || !yearsRemaining) return 0;

  if (yearIndex >= yearsRemaining) {
    return 0;
  }

  return annualSalary;
}

function getPlayerLegendName(player) {
  if (!player || !player.name) return "Player";

  const parts = player.name.trim().split(" ");

  if (parts.length === 1) {
    return parts[0];
  }

  return parts[parts.length - 1];
}

function displayFinances() {
  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return;

  const financeState = getTeamFinanceState(selectedTeam.id);
  const monthlyData = getTeamMonthlyFinanceData(selectedTeam, financeState);
  const revenueBreakdown = getTeamRevenueBreakdown(selectedTeam, financeState, monthlyData);

  const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);
  const averageAttendance = getAverageFinanceAttendance(monthlyData);
  const fanInterest = getTeamFanInterest(selectedTeam, financeState);
  const ownerConfidence = getTeamOwnerConfidence(selectedTeam, financeState, totalRevenue);

  setText("finance-season-revenue", formatMoney(totalRevenue));
  setText("finance-average-attendance", formatWholeNumber(averageAttendance));
  setText("finance-fan-interest", `${fanInterest}/100`);
  setText("finance-ticket-price-card", `$${financeState.ticketPrice}`);
  setText("finance-ticket-price-control", `$${financeState.ticketPrice}`);
  setText("finance-owner-confidence", `${ownerConfidence}/100`);

  renderFinanceComboChart(monthlyData, selectedTeam);
  renderFinanceRevenuePie(revenueBreakdown);
  renderFinanceNotes(selectedTeam, financeState, monthlyData, fanInterest, ownerConfidence);
}

function getTeamFinanceState(teamId) {
  if (!gameState.teamFinanceSettings) {
    gameState.teamFinanceSettings = {};
  }

  if (!gameState.teamFinanceSettings[teamId]) {
    gameState.teamFinanceSettings[teamId] = {
      ticketPrice: 85,
      fanInterest: 65,
      ownerConfidence: 70
    };
  }

  return gameState.teamFinanceSettings[teamId];
}

function adjustTicketPrice(changeAmount) {
  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return;

  const financeState = getTeamFinanceState(selectedTeam.id);

  financeState.ticketPrice = clampFinanceValue(
    Number(financeState.ticketPrice || 85) + changeAmount,
    40,
    180
  );

  displayFinances();
}

function getTeamMonthlyFinanceData(team, financeState) {
  const months = [
    { label: "Oct", homeGames: 6 },
    { label: "Nov", homeGames: 7 },
    { label: "Dec", homeGames: 7 },
    { label: "Jan", homeGames: 7 },
    { label: "Feb", homeGames: 5 },
    { label: "Mar", homeGames: 7 },
    { label: "Apr", homeGames: 5 }
  ];

  const capacity = getTeamArenaCapacity(team);
  const baseWinPct = getTeamFinanceWinPercentage(team);
  const fanInterest = getTeamFanInterest(team, financeState);
  const ticketPrice = Number(financeState.ticketPrice || 85);

  return months.map((month, index) => {
    const monthlyWinPct = clampFinanceValue(
      baseWinPct + ((index % 3) - 1) * 0.045,
      0.18,
      0.82
    );

    const pricePenalty = Math.max(0, ticketPrice - 85) * 0.0025;
    const priceBoost = Math.max(0, 85 - ticketPrice) * 0.0015;

    const attendanceRate = clampFinanceValue(
      0.58 +
      (fanInterest / 100) * 0.23 +
      monthlyWinPct * 0.17 -
      pricePenalty +
      priceBoost,
      0.45,
      1
    );

    const attendance = Math.round(capacity * attendanceRate);
    const ticketRevenue = (attendance * ticketPrice * month.homeGames) / 1000000;

    return {
      month: month.label,
      homeGames: month.homeGames,
      attendance,
      attendanceRate,
      winPct: monthlyWinPct,
      ticketRevenue
    };
  });
}

function getTeamRevenueBreakdown(team, financeState, monthlyData) {
  const ticketRevenue = monthlyData.reduce((sum, month) => sum + month.ticketRevenue, 0);
  const totalAttendance = monthlyData.reduce((sum, month) => sum + month.attendance * month.homeGames, 0);
  const fanInterest = getTeamFanInterest(team, financeState);
  const winPct = getTeamFinanceWinPercentage(team);

  const merchandise = 18 + fanInterest * 0.18 + winPct * 16;
  const concessions = totalAttendance * 18 / 1000000;
  const sponsorships = 28 + fanInterest * 0.12 + winPct * 10;
  const revenueSharing = 30;
  const playoffRevenue = winPct >= 0.58 ? 12 : 0;

  return [
    { label: "Tickets", value: ticketRevenue, color: "#38bdf8" },
    { label: "Merchandise", value: merchandise, color: "#22c55e" },
    { label: "Concessions", value: concessions, color: "#facc15" },
    { label: "Sponsorships", value: sponsorships, color: "#a855f7" },
    { label: "Revenue Sharing", value: revenueSharing, color: "#fb923c" },
    { label: "Playoffs", value: playoffRevenue, color: "#ef4444" }
  ].filter(item => item.value > 0);
}

function renderFinanceComboChart(monthlyData, team) {
  const container = document.getElementById("finance-combo-chart");
  if (!container) return;

  const capacity = getTeamArenaCapacity(team);
  const maxRevenue = Math.max(...monthlyData.map(month => month.ticketRevenue), 1);

  const width = 960;
  const height = 360;
  const chartLeft = 58;
  const chartRight = 24;
  const chartTop = 34;
  const chartBottom = 56;
  const chartWidth = width - chartLeft - chartRight;
  const chartHeight = height - chartTop - chartBottom;
  const baseline = chartTop + chartHeight;
  const step = chartWidth / monthlyData.length;

  const attendancePoints = [];
  const winPoints = [];

  const bars = monthlyData.map((month, index) => {
    const x = chartLeft + index * step + step * 0.25;
    const barWidth = step * 0.5;
    const barHeight = (month.ticketRevenue / maxRevenue) * chartHeight;
    const y = baseline - barHeight;

    const centerX = x + barWidth / 2;
    const attendanceY = baseline - (month.attendance / capacity) * chartHeight;
    const winY = baseline - month.winPct * chartHeight;

    attendancePoints.push(`${centerX},${attendanceY}`);
    winPoints.push(`${centerX},${winY}`);

    return `
      <rect
        x="${x}"
        y="${y}"
        width="${barWidth}"
        height="${barHeight}"
        rx="8"
        class="finance-chart-bar"
      ></rect>

      <text x="${centerX}" y="${baseline + 24}" text-anchor="middle" class="finance-chart-month">
        ${month.month}
      </text>

      <text x="${centerX}" y="${y - 7}" text-anchor="middle" class="finance-chart-value">
        ${formatMoney(month.ticketRevenue)}
      </text>
    `;
  }).join("");

  container.innerHTML = `
    <div class="finance-chart-legend">
      <span><i class="finance-legend-bar"></i> Ticket Revenue</span>
      <span><i class="finance-legend-attendance"></i> Attendance</span>
      <span><i class="finance-legend-win"></i> Win %</span>
    </div>

    <svg class="finance-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <line x1="${chartLeft}" y1="${baseline}" x2="${width - chartRight}" y2="${baseline}" class="finance-chart-axis"></line>
      <line x1="${chartLeft}" y1="${chartTop}" x2="${chartLeft}" y2="${baseline}" class="finance-chart-axis"></line>

      ${bars}

      <polyline points="${attendancePoints.join(" ")}" class="finance-chart-attendance-line"></polyline>
      <polyline points="${winPoints.join(" ")}" class="finance-chart-win-line"></polyline>

      ${monthlyData.map((month, index) => {
        const centerX = chartLeft + index * step + step * 0.5;
        const attendanceY = baseline - (month.attendance / capacity) * chartHeight;
        const winY = baseline - month.winPct * chartHeight;

        return `
          <circle cx="${centerX}" cy="${attendanceY}" r="5" class="finance-chart-attendance-dot"></circle>
          <circle cx="${centerX}" cy="${winY}" r="5" class="finance-chart-win-dot"></circle>
        `;
      }).join("")}
    </svg>
  `;
}

function renderFinanceRevenuePie(revenueBreakdown) {
  const pie = document.getElementById("finance-revenue-pie");
  const legend = document.getElementById("finance-revenue-legend");

  if (!pie || !legend) return;

  const total = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);

  let currentPercent = 0;

  const gradientParts = revenueBreakdown.map(item => {
    const percent = total > 0 ? (item.value / total) * 100 : 0;
    const start = currentPercent;
    const end = currentPercent + percent;

    currentPercent = end;

    return `${item.color} ${start}% ${end}%`;
  });

  pie.style.background = `conic-gradient(${gradientParts.join(", ")})`;

  legend.innerHTML = revenueBreakdown.map(item => {
    const percent = total > 0 ? (item.value / total) * 100 : 0;

    return `
      <div class="finance-revenue-legend-item">
        <span class="finance-revenue-dot" style="background: ${item.color};"></span>
        <strong>${item.label}</strong>
        <em>${formatMoney(item.value)} · ${percent.toFixed(0)}%</em>
      </div>
    `;
  }).join("");
}

function renderFinanceNotes(team, financeState, monthlyData, fanInterest, ownerConfidence) {
  const list = document.getElementById("finance-notes-list");
  if (!list) return;

  const ticketPrice = Number(financeState.ticketPrice || 85);
  const averageAttendance = getAverageFinanceAttendance(monthlyData);
  const capacity = getTeamArenaCapacity(team);
  const winPct = getTeamFinanceWinPercentage(team);

  const notes = [];

  if (ticketPrice > 120) {
    notes.push("Ticket prices are high. Revenue per fan is strong, but attendance may soften.");
  } else if (ticketPrice < 65) {
    notes.push("Ticket prices are low. Attendance should be strong, but revenue per seat is limited.");
  } else {
    notes.push("Ticket pricing is balanced for the current market.");
  }

  if (averageAttendance / capacity > 0.9) {
    notes.push("Attendance demand is strong. The building is close to full most months.");
  } else if (averageAttendance / capacity < 0.65) {
    notes.push("Attendance is below expectations. Winning or lowering prices may help.");
  } else {
    notes.push("Attendance is steady but still has room to grow.");
  }

  if (winPct > 0.6) {
    notes.push("Winning is helping business performance and fan interest.");
  } else if (winPct < 0.4) {
    notes.push("Poor results are limiting ticket demand.");
  }

  if (ownerConfidence >= 75) {
    notes.push("Ownership is pleased with the direction of the franchise.");
  } else if (ownerConfidence <= 45) {
    notes.push("Ownership may become concerned if results or revenue do not improve.");
  }

  list.innerHTML = notes.map(note => `<p>${note}</p>`).join("");
}

function getTeamFanInterest(team, financeState) {
  const base = Number(financeState.fanInterest || 65);
  const winPct = getTeamFinanceWinPercentage(team);
  const ticketPrice = Number(financeState.ticketPrice || 85);

  const priceEffect = ticketPrice > 110
    ? -8
    : ticketPrice < 65
      ? 5
      : 0;

  return Math.round(clampFinanceValue(base + (winPct - 0.5) * 30 + priceEffect, 20, 100));
}

function getTeamOwnerConfidence(team, financeState, totalRevenue) {
  const base = Number(financeState.ownerConfidence || 70);
  const winPct = getTeamFinanceWinPercentage(team);
  const revenueBoost = totalRevenue >= 150 ? 6 : totalRevenue >= 110 ? 3 : -4;

  return Math.round(clampFinanceValue(base + (winPct - 0.5) * 24 + revenueBoost, 10, 100));
}

function getTeamFinanceWinPercentage(team) {
  if (!team) return 0.5;

  const wins = Number(team.wins || 0);
  const losses = Number(team.losses || 0);
  const games = wins + losses;

  if (!games) return 0.5;

  return wins / games;
}

function getTeamArenaCapacity(team) {
  return Number(team.arenaCapacity || team.capacity || 19000);
}

function getAverageFinanceAttendance(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) return 0;

  const total = monthlyData.reduce((sum, month) => sum + month.attendance, 0);

  return Math.round(total / monthlyData.length);
}

function clampFinanceValue(value, min, max) {
  return Math.min(max, Math.max(min, Number(value || 0)));
}