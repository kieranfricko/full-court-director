const gameplanStarterLabels = ["PG", "SG", "SF", "PF", "C"];

const PRACTICE_OFFENSIVE_FOCUS_OPTIONS = [
  "None",
  "Finishing",
  "Midrange Shooting",
  "Three-Point Shooting",
  "Free Throws",
  "Ball Handling",
  "Passing",
  "Post Scoring",
  "Off-Ball Movement",
  "Screen Setting"
];

const PRACTICE_DEFENSIVE_FOCUS_OPTIONS = [
  "None",
  "Perimeter Defense",
  "Interior Defense",
  "Help Defense",
  "Pick-and-Roll Defense",
  "Steals",
  "Blocks",
  "Defensive Rebounding",
  "Defensive Discipline"
];

const PRACTICE_PHYSICAL_FOCUS_OPTIONS = [
  "None",
  "Strength",
  "Speed",
  "Agility",
  "Vertical",
  "Stamina",
  "Durability",
  "Recovery"
];

const PRACTICE_INTENSITY_OPTIONS = ["None", "Light", "Medium", "Hard"];

const FCD_OFFENSIVE_PLAYER_ROLES = [
  {
    key: "primaryBallHandler",
    name: "Primary Ball Handler",
    icon: "PBH",
    description: "The offensive centerpiece responsible for controlling possessions, creating opportunities, and carrying the largest playmaking burden."
  },
  {
    key: "secondaryBallHandler",
    name: "Secondary Ball Handler",
    icon: "SBH",
    description: "A dependable creator who supports the offense by handling the ball, attacking defenses, and creating opportunities when needed."
  },
  {
    key: "movementBallHandler",
    name: "Movement Ball Handler",
    icon: "MBH",
    description: "Creates offense through motion, handoffs, and off-ball actions while still serving as a playmaker."
  },
  {
    key: "connector",
    name: "Connector",
    icon: "CON",
    description: "Keeps the offense organized through quick decisions, smart passing, and efficient ball movement."
  },
  {
    key: "rollMan",
    name: "Roll Man",
    icon: "ROLL",
    description: "A screen-and-dive specialist who creates pressure at the rim through pick-and-roll actions and interior finishing."
  },
  {
    key: "versatileBig",
    name: "Versatile Big",
    icon: "VB",
    description: "A frontcourt player capable of contributing from multiple areas of the floor and fitting into various offensive actions."
  },
  {
    key: "spotUpShooter",
    name: "Spot-Up Shooter",
    icon: "3PT",
    description: "Provides spacing and thrives on catch-and-shoot opportunities from beyond the arc."
  },
  {
    key: "movementShooter",
    name: "Movement Shooter",
    icon: "MOVE",
    description: "Generates scoring chances through constant movement, screen navigation, and off-ball shooting actions."
  }
];

const FCD_DEFENSIVE_PLAYER_ROLES = [
  {
    key: "hidden",
    name: "Hidden",
    icon: "HID",
    description: "Protected within the defensive scheme and usually assigned lower-priority matchups."
  },
  {
    key: "mobileForward",
    name: "Mobile Forward",
    icon: "MOB",
    description: "A versatile defender capable of switching across multiple positions using mobility, length, and athleticism."
  },
  {
    key: "onBallGuard",
    name: "On-Ball Guard",
    icon: "POA",
    description: "Specializes in defending primary ball handlers and applying pressure at the point of attack."
  },
  {
    key: "disruptor",
    name: "Disruptor",
    icon: "DIS",
    description: "Creates defensive chaos through steals, deflections, pressure, and active hands."
  },
  {
    key: "versatileStopper",
    name: "Versatile Stopper",
    icon: "STOP",
    description: "A trusted multi-position defender regularly assigned to difficult perimeter and wing matchups."
  },
  {
    key: "rimProtector",
    name: "Rim Protector",
    icon: "RIM",
    description: "Anchors the defense around the basket through shot blocking, interior presence, and paint deterrence."
  }
];

const simpleInjuryTypes = [
  {
    name: "Knee Soreness",
    severity: "Minor",
    minDays: 2,
    maxDays: 6,
    weight: 18
  },
  {
    name: "Back Tightness",
    severity: "Minor",
    minDays: 3,
    maxDays: 8,
    weight: 16
  },
  {
    name: "Foot Bruise",
    severity: "Minor",
    minDays: 4,
    maxDays: 9,
    weight: 14
  },
  {
    name: "Ankle Sprain",
    severity: "Moderate",
    minDays: 7,
    maxDays: 21,
    weight: 13
  },
  {
    name: "Hamstring Strain",
    severity: "Moderate",
    minDays: 10,
    maxDays: 28,
    weight: 10
  },
  {
    name: "Wrist Sprain",
    severity: "Moderate",
    minDays: 7,
    maxDays: 18,
    weight: 9
  },
  {
    name: "Shoulder Strain",
    severity: "Moderate",
    minDays: 7,
    maxDays: 21,
    weight: 8
  },
  {
    name: "Major Knee Injury",
    severity: "Major",
    minDays: 60,
    maxDays: 120,
    weight: 1
  }
];

let activeNextScoutPlayerId = null;
let activeNextScoutContext = {
  rootId: "next-game-scout-root",
  opponentTeamId: null,
  mode: "nextGame"
};

function ensureRotation() {
  if (!gameState.started) return;

  if (!gameState.rotation || !Array.isArray(gameState.rotation.slots)) {
    gameState.rotation = createDefaultRotation();
    return;
  }

  if (gameState.rotation.slots.length !== rotationSlotDefinitions.length) {
    gameState.rotation = createDefaultRotation();
    return;
  }

  const rosterIds = new Set(
  getRosterByTeamId(gameState.selectedTeamId).map(player => Number(player.id))
);

const usedIds = new Set();

for (let slot of gameState.rotation.slots) {
  const slotPlayerId = slot.playerId ? Number(slot.playerId) : null;

  if (slotPlayerId && !rosterIds.has(slotPlayerId)) {
    slot.playerId = null;
  }

  if (slotPlayerId && usedIds.has(slotPlayerId)) {
    slot.playerId = null;
  }

  if (slot.playerId) {
    usedIds.add(Number(slot.playerId));
  }
}

  fillEmptyRotationSlots();
}

function createDefaultRotation() {
  const roster = getSortedRoster();
  const usedIds = new Set();
  const slots = [];

  for (let i = 0; i < rotationSlotDefinitions.length; i++) {
    const definition = rotationSlotDefinitions[i];
    let player = null;

    if (definition.starter) {
      player = roster.find(item => {
  const secondaryPositions = Array.isArray(item.secondaryPositions) ? item.secondaryPositions : [];

  return (
    !usedIds.has(item.id) &&
    (item.primaryPosition === definition.position || secondaryPositions.includes(definition.position))
  );
});

      if (!player) {
        player = roster.find(item => !usedIds.has(item.id));
      }
    } else {
      player = roster.find(item => !usedIds.has(item.id));
    }

    if (player) {
      usedIds.add(player.id);
    }

    slots.push({
      slotId: definition.slotId,
      label: definition.label,
      starter: definition.starter,
      position: definition.position,
      playerId: player ? player.id : null,
      minutes: defaultRotationMinutes[i]
    });
  }

  return { slots };
}

function fillEmptyRotationSlots() {
  const roster = getSortedRoster();
  const usedIds = new Set(
    gameState.rotation.slots
      .filter(slot => slot.playerId)
      .map(slot => slot.playerId)
  );

  for (let slot of gameState.rotation.slots) {
    if (!slot.playerId) {
      const player = roster.find(item => !usedIds.has(item.id));

      if (player) {
        slot.playerId = player.id;
        usedIds.add(player.id);
      }
    }
  }
}

function getRotationSlots() {
  ensureRotation();
  return gameState.rotation ? gameState.rotation.slots : [];
}

function getRotationSlotById(slotId) {
  return getRotationSlots().find(slot => slot.slotId === slotId);
}

function getPlayerByRotationSlot(slot) {
  if (!slot || !slot.playerId) return null;

  const result = findPlayerById(slot.playerId);
  return result ? result.player : null;
}

function getRotationMinutesTotal() {
  return getRotationSlots().reduce((total, slot) => total + Number(slot.minutes || 0), 0);
}

function getRotationWarnings() {
  const warnings = [];
  const total = getRotationMinutesTotal();

  if (total !== 240) {
    warnings.push(`Rotation minutes must total exactly 240. Current total: ${total}/240.`);
  }

  for (let slot of getRotationSlots()) {
    if (slot.starter && Number(slot.minutes || 0) < 1) {
      warnings.push(`${slot.label} must have at least 1 minute.`);
    }

    if (Number(slot.minutes || 0) > 48) {
      warnings.push(`${slot.label} cannot play more than 48 minutes.`);
    }
  }

  return warnings;
}

function isRotationValidForGame() {
  return getRotationWarnings().length === 0;
}

function blockIfRotationInvalidForGameDay() {
  const todayGames = getTodayUserGames();

  if (todayGames.length === 0) {
    return false;
  }

  if (isRotationValidForGame()) {
    return false;
  }

  addInboxMessageOnce(
    "Rotation Invalid",
    "Your rotation must total exactly 240 minutes, and every starter must have at least 1 minute before a game can be played.",
    "urgent",
    false
  );

  refreshAll();
  return true;
}

function updateRotationMinutes(slotId, minutes) {
  const slot = getRotationSlotById(slotId);

  if (!slot) return;

  slot.minutes = clamp(Number(minutes), 0, 48);

  const valueElement = document.getElementById(`minutes-value-${slot.slotId}`);

  if (valueElement) {
    valueElement.textContent = slot.minutes;
    valueElement.classList.remove("minutes-value-valid", "minutes-value-warning", "minutes-value-invalid");

    if (slot.minutes === 0) {
      valueElement.classList.add("minutes-value-invalid");
    } else if (slot.minutes >= 30) {
      valueElement.classList.add("minutes-value-valid");
    } else {
      valueElement.classList.add("minutes-value-warning");
    }
  }

  displayRotationMinutesSummary();
}

function swapRotationSlots(sourceSlotId, targetSlotId) {
  if (!sourceSlotId || !targetSlotId || sourceSlotId === targetSlotId) return;

  const sourceSlot = getRotationSlotById(sourceSlotId);
  const targetSlot = getRotationSlotById(targetSlotId);

  if (!sourceSlot || !targetSlot) return;

  const sourcePlayerId = sourceSlot.playerId;
  sourceSlot.playerId = targetSlot.playerId;
  targetSlot.playerId = sourcePlayerId;

  refreshAll();
}

function handleRotationDragStart(event, slotId) {
  draggedRotationSlotId = slotId;

  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", slotId);
    event.dataTransfer.effectAllowed = "move";
  }

  const target = event.target && event.target.closest
    ? event.target
    : event.currentTarget;

  const card = target && target.closest
    ? target.closest(".rotation-card")
    : null;

  if (card) {
    card.classList.add("dragging");
  }
}

function handleRotationDragEnd(event) {
  const target = event.target && event.target.closest
    ? event.target
    : event.currentTarget;

  const card = target && target.closest
    ? target.closest(".rotation-card")
    : null;

  if (card) {
    card.classList.remove("dragging");
  }

  draggedRotationSlotId = null;
}

function handleRotationDragOver(event) {
  event.preventDefault();

  const card = event.currentTarget;

  if (card) {
    card.classList.add("drag-over");
  }
}

function handleRotationDragLeave(event) {
  const card = event.currentTarget;

  if (card) {
    card.classList.remove("drag-over");
  }
}

function handleRotationDrop(event, targetSlotId) {
  event.preventDefault();

  const card = event.currentTarget;

  if (card) {
    card.classList.remove("drag-over");
  }

  const sourceSlotId = draggedRotationSlotId || event.dataTransfer.getData("text/plain");

  swapRotationSlots(sourceSlotId, targetSlotId);
}

function isPlayerOutOfPosition(player, slot) {
  if (!player || !slot || !slot.starter || !slot.position) return false;

  if (player.primaryPosition === slot.position) return false;
  if (player.secondaryPositions && player.secondaryPositions.includes(slot.position)) return false;

  return true;
}

function getRotationRoleForSlot(slot) {
  if (!slot) return "Reserve";

  if (slot.starter) return "Starter";

  const benchIndex = getRotationSlots()
    .filter(item => !item.starter)
    .findIndex(item => item.slotId === slot.slotId);

  if (benchIndex === 0) return "Sixth Man";
  if (benchIndex > 0 && benchIndex < 5) return "Rotation";
  return "Reserve";
}

function getPlayerRole(playerId) {
  const slot = getRotationSlots().find(item => item.playerId === playerId);

  if (!slot) return "Reserve";

  return getRotationRoleForSlot(slot);
}

function createRotationCard(slot) {
  const player = getPlayerByRotationSlot(slot);
  const card = document.createElement("div");

  card.className = "rotation-card";
  card.draggable = false;

  card.addEventListener("dragover", handleRotationDragOver);
  card.addEventListener("dragleave", handleRotationDragLeave);
  card.addEventListener("drop", event => handleRotationDrop(event, slot.slotId));

  if (!player) {
    card.classList.add("rotation-card-empty");
    card.innerHTML = `
      <div class="rotation-slot-label">${slot.label}</div>
      <h3>Empty Slot</h3>
      <p>No player assigned.</p>
      <div class="minutes-control">
        <div class="minutes-control-header">
          <span>Minutes</span>
          <strong>0</strong>
        </div>
        <input class="minutes-slider" type="range" min="0" max="48" value="0" disabled>
      </div>
    `;
    return card;
  }

  const outOfPosition = isPlayerOutOfPosition(player, slot);
  const minutesClass = slot.minutes === 0
    ? "minutes-value-invalid"
    : slot.minutes >= 30
      ? "minutes-value-valid"
      : "minutes-value-warning";

  card.innerHTML = `
    ${outOfPosition ? `<div class="out-position-warning" title="Out of position">!</div>` : ""}

    <div
      class="rotation-drag-handle"
      draggable="true"
      ondragstart="handleRotationDragStart(event, '${slot.slotId}')"
      ondragend="handleRotationDragEnd(event)"
    >
      Drag
    </div>

    <div class="rotation-slot-label">${slot.label}</div>

    <h3>
      <span class="clickable-player-name" onclick="event.stopPropagation(); openPlayerProfile('${player.id}')">
        ${player.name}
      </span>
    </h3>

    <p class="rotation-card-type">${player.primaryPosition} | ${player.playerType}</p>
    <p class="rotation-card-level">${player.mediaDescription}</p>
    <p>Projected Ceiling: ${player.projectedCeiling}</p>

    <div class="minutes-control" onclick="event.stopPropagation();">
      <div class="minutes-control-header">
        <span>Minutes</span>
        <strong id="minutes-value-${slot.slotId}" class="${minutesClass}">${slot.minutes}</strong>
      </div>

      <input
        class="minutes-slider"
        type="range"
        min="0"
        max="48"
        step="1"
        value="${slot.minutes}"
        onclick="event.stopPropagation();"
        onmousedown="event.stopPropagation();"
        ontouchstart="event.stopPropagation();"
        oninput="updateRotationMinutes('${slot.slotId}', this.value)"
      >
    </div>
  `;

  return card;
}

function displayRotationMinutesSummary() {
  const totalElement = document.getElementById("rotation-minutes-total");
  const warningElement = document.getElementById("rotation-warning-text");

  if (!totalElement || !warningElement) return;

  const total = getRotationMinutesTotal();
  const warnings = getRotationWarnings();

  totalElement.textContent = `Minutes: ${total} / 240`;
  totalElement.classList.remove("rotation-valid", "rotation-invalid");

  if (warnings.length === 0) {
    totalElement.classList.add("rotation-valid");
    warningElement.classList.add("hidden");
    warningElement.textContent = "";
  } else {
    totalElement.classList.add("rotation-invalid");
    warningElement.classList.remove("hidden");
    warningElement.textContent = warnings[0];
  }
}


function displayRotationBoard() {
  if (typeof renderGameplanCardBoard === "function") {
    renderGameplanCardBoard();
  }
}

function displayBenchCards() {
  const benchGrid = document.getElementById("bench-grid");
  if (!benchGrid) return;

  benchGrid.innerHTML = "";

  const { bench } = getSquadRoles();

  for (let i = 0; i < 10; i++) {
    const slot = bench[i];

    if (slot) {
      const role = getPlayerRoleFromBenchIndex(i);
      benchGrid.appendChild(createPlayerCard(slot.player, `Bench ${slot.slot}`, role));
    } else {
      benchGrid.appendChild(createPlayerCard(null, `Bench ${i + 6}`, "Empty"));
    }
  }
}

function createPlayerCard(player, slot, role) {
  const card = document.createElement("div");
  card.className = "player-card";

  if (!player) {
    card.classList.add("player-card-empty");
    card.innerHTML = `
      <div class="player-card-slot">${slot}</div>
      <h3>Empty Slot</h3>
      <p>No player assigned.</p>
    `;
    return card;
  }

  const minutes = getMinutesForRole(role);

  card.classList.add("clickable-player-card");
  card.onclick = () => openPlayerProfile(player.id);

  card.innerHTML = `
    <div class="player-card-slot">${slot}</div>
    <h3>${player.name}</h3>
    <p class="player-card-type">${player.primaryPosition} | ${player.playerType}</p>
    <p class="player-card-level">${player.mediaDescription}</p>
    <p>Projected Ceiling: ${player.projectedCeiling}</p>
    <p>Role: ${role}</p>
    <div class="player-card-minutes">Minutes: ${minutes}</div>
    <p>Morale: ${player.morale}</p>
    <p>Contract: ${player.contract}</p>
    <p class="player-card-fit">Fit: Not Calculated Yet</p>
  `;

  return card;
}

function updateGameplanSetting(settingName, value) {
  if (!gameState.gameplan) {
    gameState.gameplan = getDefaultGameplan();
  }

  gameState.gameplan[settingName] = value;
  refreshAll();
}

function displayGameplanSettings() {
  if (!gameState.gameplan) {
    gameState.gameplan = getDefaultGameplan();
  }

  setSelectValue("offensive-style", gameState.gameplan.offensiveStyle);
  setSelectValue("pace", gameState.gameplan.pace);
  setSelectValue("shot-profile", gameState.gameplan.shotProfile);
  setSelectValue("ball-movement", gameState.gameplan.ballMovement);
  setSelectValue("first-scoring-option", gameState.gameplan.firstScoringOption);
  setSelectValue("second-scoring-option", gameState.gameplan.secondScoringOption);
  setSelectValue("defensive-style", gameState.gameplan.defensiveStyle);
  setSelectValue("pick-roll-defense", gameState.gameplan.pickRollDefense);
  setSelectValue("defensive-aggression", gameState.gameplan.defensiveAggression);
  setSelectValue("rebounding-focus", gameState.gameplan.reboundingFocus);
}

function setSelectValue(elementId, value) {
  const select = document.getElementById(elementId);
  if (select) select.value = value;
}

function displayGameplan() {
  displayRotationBoard();
  displayNextGameScout();

  if (!gameState || !gameState.gameplan) return;

  const gameplan = gameState.gameplan;

  const offensiveStyle = document.getElementById("offensive-style");
  const pace = document.getElementById("pace");
  const shotProfile = document.getElementById("shot-profile");
  const ballMovement = document.getElementById("ball-movement");
  const firstScoringOption = document.getElementById("first-scoring-option");
  const secondScoringOption = document.getElementById("second-scoring-option");

  const defensiveStyle = document.getElementById("defensive-style");
  const pickRollDefense = document.getElementById("pick-roll-defense");
  const defensiveAggression = document.getElementById("defensive-aggression");
  const reboundingFocus = document.getElementById("rebounding-focus");

  if (offensiveStyle) offensiveStyle.value = gameplan.offensiveStyle || "Balanced";
  if (pace) pace.value = gameplan.pace || "Balanced";
  if (shotProfile) shotProfile.value = gameplan.shotProfile || "Balanced";
  if (ballMovement) ballMovement.value = gameplan.ballMovement || "Balanced";
  if (firstScoringOption) firstScoringOption.value = gameplan.firstScoringOption || "Best Player";
  if (secondScoringOption) secondScoringOption.value = gameplan.secondScoringOption || "Best Player";

  if (defensiveStyle) defensiveStyle.value = gameplan.defensiveStyle || "Balanced";
  if (pickRollDefense) pickRollDefense.value = gameplan.pickRollDefense || "Drop Coverage";
  if (defensiveAggression) defensiveAggression.value = gameplan.defensiveAggression || "Balanced";
  if (reboundingFocus) reboundingFocus.value = gameplan.reboundingFocus || "Balanced";
}

function displayNextGameScout(opponentTeamId = null, rootId = "next-game-scout-root") {
  const root = document.getElementById(rootId);
  if (!root || !gameState || !gameState.started) return;

  const nextGame = getNextGame();
  const isOpponentPlan = opponentTeamId !== null && opponentTeamId !== undefined;
  const scoutOpponentId = isOpponentPlan
    ? Number(opponentTeamId)
    : nextGame?.opponentId;

  activeNextScoutContext = {
    rootId,
    opponentTeamId: scoutOpponentId || null,
    mode: isOpponentPlan ? "opponentPlan" : "nextGame"
  };

  if (!scoutOpponentId) {
    root.innerHTML = `
      <div class="next-scout-empty card">
        <h2>No Next Game</h2>
        <p>There is no opponent currently scheduled.</p>
      </div>
    `;
    return;
  }

  const opponent = getTeamById(scoutOpponentId) || getBaseTeamById(scoutOpponentId);

  if (!opponent) {
    root.innerHTML = `
      <div class="next-scout-empty card">
        <h2>Opponent Not Found</h2>
        <p>The next opponent could not be loaded.</p>
      </div>
    `;
    return;
  }

  const selectedTeam = getSelectedTeam();
  const opponentColors = getNextScoutMappedColors(opponent);
  const primaryColor = opponentColors.primaryColor;
  const secondaryColor = opponentColors.secondaryColor;

  const opponentStats = getNextScoutTeamStats(opponent.id);
  const coach = getNextScoutCoach(opponent.id);
  const starters = getNextScoutStarters(opponent.id);
  const bench = getNextScoutBench(opponent.id, starters);
  const scoutSubtitle = isOpponentPlan
    ? "Custom Opponent Plan · Saved Gameplan"
    : `${nextGame.home ? "Home Game" : "Away Game"} · ${formatDate(nextGame.date)} · ${nextGame.competition || "Regular Season"}`;
  const backButton = isOpponentPlan
    ? `<button type="button" class="opponent-plan-back-button next-scout-back-button" onclick="displayOpponentPlansBoard()">← Back</button>`
    : "";

  root.innerHTML = `
    <div
      class="next-scout-page"
      style="--scout-primary: ${primaryColor}; --scout-secondary: ${secondaryColor};"
    >
      ${backButton}

      <div class="next-scout-topbar">
        <div class="next-scout-title-block">
          <div class="next-scout-kicker">Scouting Report</div>

          <div class="next-scout-team-row">
            ${typeof getTeamLogoHTML === "function"
              ? getTeamLogoHTML(opponent, "team-logo-placeholder next-scout-logo")
              : `<div class="team-logo-placeholder next-scout-logo">${opponent.abbrev || "OPP"}</div>`
            }

            <div>
              <h1>${opponent.name}</h1>
              <p>${scoutSubtitle}</p>
            </div>
          </div>
        </div>

        <div class="next-scout-coach-card">
          <span>Coach</span>
          <strong>${coach.name}</strong>
          <small>${coach.subtitle}</small>
        </div>
      </div>

      <div class="next-scout-team-stats">
        ${renderNextScoutStatBox("Record", opponentStats.record)}
        ${renderNextScoutStatBox("Place", opponentStats.place)}
        ${renderNextScoutStatBox("PPG", opponentStats.ppg)}
        ${renderNextScoutStatBox("OPP PPG", opponentStats.oppPpg)}
        ${renderNextScoutStatBox("REB", opponentStats.rebounds)}
        ${renderNextScoutStatBox("AST", opponentStats.assists)}
      </div>

      <div class="next-scout-main-card">
        <div class="next-scout-court">
          <div class="next-scout-court-lines">
  <svg class="next-scout-court-svg" viewBox="0 0 1000 720" preserveAspectRatio="none">
    <!-- baseline -->
    <line x1="80" y1="40" x2="920" y2="40" />

    <!-- backboard and rim -->
    <line x1="455" y1="62" x2="545" y2="62" />
    <circle cx="500" cy="92" r="22" />

    <!-- paint/key -->
    <rect x="385" y="40" width="230" height="330" />
    <line x1="385" y1="370" x2="615" y2="370" />

    <!-- free throw circle -->
    <circle cx="500" cy="370" r="95" />

    <!-- restricted area -->
    <path d="M430 125 Q500 195 570 125" />

    <!-- three point line: corners + correct arc -->
    <line x1="125" y1="40" x2="125" y2="305" />
    <line x1="875" y1="40" x2="875" y2="305" />
    <path d="M125 305 Q500 650 875 305" />

    <!-- center guide line, faint -->
    <line class="court-center-line" x1="500" y1="40" x2="500" y2="690" />
  </svg>
</div>

          ${renderNextScoutStarterSpot(starters.PG, "PG", "pg")}
          ${renderNextScoutStarterSpot(starters.SG, "SG", "sg")}
          ${renderNextScoutStarterSpot(starters.SF, "SF", "sf")}
          ${renderNextScoutStarterSpot(starters.C, "C", "c")}
          ${renderNextScoutStarterSpot(starters.PF, "PF", "pf")}
        </div>
      </div>

      <div class="next-scout-bench-card">
        <div class="next-scout-section-title">
          <h2>Bench / Reserves</h2>
          <span>${opponent.name} second unit</span>
        </div>

        <div class="next-scout-bench-grid">
          ${bench.map(player => renderNextScoutBenchCard(player)).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderNextScoutStatBox(label, value) {
  return `
    <div class="next-scout-stat-box">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function getNextScoutTeamStats(teamId) {
  const team = getTeamById(teamId);
  const roster = getRosterByTeamId(teamId) || [];
  const teamStats = gameState.teamStats && gameState.teamStats[teamId]
    ? gameState.teamStats[teamId]
    : {};

  const gamesPlayed = Math.max(
    1,
    Number(teamStats.games || teamStats.gamesPlayed || 0) ||
    Number((team && team.wins) || 0) + Number((team && team.losses) || 0)
  );

  let totalPoints = Number(teamStats.points || teamStats.pointsFor || teamStats.totalPoints || 0);
  let totalOppPoints = Number(teamStats.pointsAgainst || teamStats.oppPoints || teamStats.totalPointsAllowed || 0);
  let totalRebounds = Number(teamStats.rebounds || 0);
  let totalAssists = Number(teamStats.assists || 0);

  if (!totalPoints || !totalRebounds || !totalAssists) {
    for (let player of roster) {
      const stats = player.seasonStats || {};

      totalPoints += Number(stats.points || 0);
      totalRebounds += Number(stats.rebounds || 0);
      totalAssists += Number(stats.assists || 0);
    }
  }

  const record = team ? `${team.wins || 0}-${team.losses || 0}` : "0-0";

  return {
    record,
    place: getNextScoutConferencePlace(teamId),
    ppg: (totalPoints / gamesPlayed).toFixed(1),
    oppPpg: totalOppPoints ? (totalOppPoints / gamesPlayed).toFixed(1) : "0.0",
    rebounds: (totalRebounds / gamesPlayed).toFixed(1),
    assists: (totalAssists / gamesPlayed).toFixed(1)
  };
}

function getNextScoutConferencePlace(teamId) {
  if (typeof getTeamConferenceRank === "function") {
    const rank = getTeamConferenceRank(teamId);

    if (rank) {
      return `${rank}${getOrdinalSuffix ? getOrdinalSuffix(rank) : ""}`;
    }
  }

  const team = getTeamById(teamId);

  if (!team || typeof getConferenceStandings !== "function") {
    return "--";
  }

  const standings = getConferenceStandings(team.conference) || [];
  const index = standings.findIndex(item => Number(item.id) === Number(teamId));

  return index >= 0 ? `${index + 1}${getOrdinalSuffix ? getOrdinalSuffix(index + 1) : ""}` : "--";
}

function getNextScoutCoach(teamId) {
  const staff = typeof getTeamStaff === "function" ? getTeamStaff(teamId) : null;

  const possibleCoach =
    staff?.headCoach ||
    staff?.coach ||
    staff?.coaching?.headCoach ||
    staff?.coachingStaff?.headCoach ||
    null;

  return {
    name: possibleCoach?.name || "Head Coach",
    subtitle: possibleCoach?.philosophy || possibleCoach?.style || "Team Leader"
  };
}

function getNextScoutStarters(teamId) {
  const starters = {
    PG: null,
    SG: null,
    SF: null,
    C: null,
    PF: null
  };

  if (typeof getProjectedStartersForTeam === "function") {
    const projected = getProjectedStartersForTeam(teamId) || [];

    for (let item of projected) {
      if (item && item.position && starters[item.position] !== undefined) {
        starters[item.position] = item.player || null;
      }
    }
  }

  const roster = [...(getRosterByTeamId(teamId) || [])]
    .sort((a, b) => getNextScoutPlayerAbility(b) - getNextScoutPlayerAbility(a));

  const usedIds = new Set();

  for (let position of ["PG", "SG", "SF", "C", "PF"]) {
    if (starters[position]) {
      usedIds.add(Number(starters[position].id));
      continue;
    }

    const match = roster.find(player => {
      const secondaryPositions = Array.isArray(player.secondaryPositions) ? player.secondaryPositions : [];

      return (
        !usedIds.has(Number(player.id)) &&
        (player.primaryPosition === position || secondaryPositions.includes(position))
      );
    });

    if (match) {
      starters[position] = match;
      usedIds.add(Number(match.id));
    }
  }

  for (let position of ["PG", "SG", "SF", "C", "PF"]) {
    if (starters[position]) continue;

    const fallback = roster.find(player => !usedIds.has(Number(player.id)));

    if (fallback) {
      starters[position] = fallback;
      usedIds.add(Number(fallback.id));
    }
  }

  return starters;
}

function getNextScoutBench(teamId, starters) {
  const starterIds = new Set(
    Object.values(starters)
      .filter(Boolean)
      .map(player => Number(player.id))
  );

  const bench = [...(getRosterByTeamId(teamId) || [])]
    .filter(player => !starterIds.has(Number(player.id)))
    .sort((a, b) => getNextScoutPlayerAbility(b) - getNextScoutPlayerAbility(a))
    .slice(0, 12);

  while (bench.length < 12) {
    bench.push(null);
  }

  return bench;
}

function getNextScoutPlayerAbility(player) {
  if (!player) return 0;

  if (typeof getLeagueRosterPlayerAbility === "function") {
    return getLeagueRosterPlayerAbility(player);
  }

  return Number(player.currentAbility || player.overall || 0);
}

function renderNextScoutStarterSpot(player, position, spotClass) {
  return `
    <div class="next-scout-starter-spot scout-spot-${spotClass}">
      ${renderNextScoutStarterCard(player, position)}
    </div>
  `;
}

function renderNextScoutStarterCard(player, position) {
  if (!player) {
    return `
      <div class="next-scout-player-card empty">
        <div class="next-scout-position-pill">${position}</div>
        <div class="next-scout-player-empty">No Player</div>
      </div>
    `;
  }

  const stats = getNextScoutPlayerStats(player);
  const coverage = getNextScoutCoverage(player.id);
  const coverageClass = coverage ? `has-coverage next-scout-card-${coverage}` : "";

  return `
    <div
      role="button"
      tabindex="0"
      class="next-scout-player-card ${coverageClass}"
      onclick="openNextScoutCoverageMenu(event, '${player.id}')"
    >
      <div class="next-scout-position-pill">${position}</div>

      ${renderNextScoutCoverageDot(player.id)}

      <button
        type="button"
        class="next-scout-profile-button"
        onclick="event.stopPropagation(); openPlayerProfile('${player.id}')"
        title="Open player profile"
      >
        Profile
      </button>

      <div class="next-scout-player-face">
        ${typeof getPlayerFaceHTML === "function"
          ? getPlayerFaceHTML(player, "next-scout-face")
          : `<div class="next-scout-face player-silhouette"></div>`
        }
      </div>

      <div class="next-scout-player-name">
        <span>${getNextScoutFirstName(player.name)}</span>
        <strong>${getNextScoutLastName(player.name)}</strong>
      </div>

      <div class="next-scout-player-meta">
  #${player.jerseyNumber || player.number || "--"} · ${player.primaryPosition || position}
</div>

${renderNextScoutAssignedDefenderPill(player)}
${renderNextScoutDefenderSelect(player)}

<div class="next-scout-stat-bars">
        <div><span>MPG</span><strong>${stats.mpg}</strong></div>
        <div><span>PPG</span><strong>${stats.ppg}</strong></div>
        <div><span>RPG</span><strong>${stats.rpg}</strong></div>
        <div><span>APG</span><strong>${stats.apg}</strong></div>
      </div>

      ${renderNextScoutCoverageMenu(player.id)}
    </div>
  `;
}

function renderNextScoutBenchCard(player) {
  if (!player) {
    return `
      <div class="next-scout-bench-player empty">
        <span>Empty</span>
      </div>
    `;
  }

  const stats = getNextScoutPlayerStats(player);
  const coverage = getNextScoutCoverage(player.id);
  const coverageClass = coverage ? `has-coverage next-scout-card-${coverage}` : "";

  return `
    <div
      role="button"
      tabindex="0"
      class="next-scout-bench-player ${coverageClass}"
      onclick="openNextScoutCoverageMenu(event, '${player.id}')"
    >
      ${renderNextScoutCoverageDot(player.id)}

      <button
        type="button"
        class="next-scout-bench-profile-button"
        onclick="event.stopPropagation(); openPlayerProfile('${player.id}')"
        title="Open player profile"
      >
        Profile
      </button>

      <div class="next-scout-bench-face">
        ${
          typeof getPlayerFaceHTML === "function"
            ? getPlayerFaceHTML(player, "next-scout-bench-face-img")
            : ""
        }
      </div>

      <strong>${player.name}</strong>
<span>${player.primaryPosition || "-"} · ${stats.ppg} PPG</span>

${renderNextScoutAssignedDefenderPill(player)}
${renderNextScoutDefenderSelect(player)}

${renderNextScoutCoverageMenu(player.id)}
    </div>
  `;
}

function getNextScoutPlayerStats(player) {
  const stats = player && player.seasonStats ? player.seasonStats : {};
  const games = Math.max(1, Number(stats.games || stats.gamesPlayed || 0));

  return {
    mpg: Number(stats.minutes || 0) ? (Number(stats.minutes || 0) / games).toFixed(1) : "0.0",
    ppg: Number(stats.points || 0) ? (Number(stats.points || 0) / games).toFixed(1) : "0.0",
    rpg: Number(stats.rebounds || 0) ? (Number(stats.rebounds || 0) / games).toFixed(1) : "0.0",
    apg: Number(stats.assists || 0) ? (Number(stats.assists || 0) / games).toFixed(1) : "0.0"
  };
}

function getNextScoutFirstName(name) {
  const parts = String(name || "Player").trim().split(" ");

  if (parts.length <= 1) return "";

  return parts.slice(0, -1).join(" ").toUpperCase();
}

function getNextScoutLastName(name) {
  const parts = String(name || "Player").trim().split(" ");

  return parts[parts.length - 1].toUpperCase();
}

function getNextGameScoutGameKey() {
  const nextGame = getNextGame();

  if (!nextGame) return "no-next-game";

  const dateKey = typeof formatDateKey === "function"
    ? formatDateKey(nextGame.date)
    : new Date(nextGame.date).toISOString().slice(0, 10);

  return [
    dateKey,
    nextGame.opponentId,
    nextGame.competition || "Regular Season",
    nextGame.home ? "home" : "away"
  ].join("_");
}

function getActiveNextScoutOpponentId() {
  if (activeNextScoutContext && activeNextScoutContext.opponentTeamId) {
    return Number(activeNextScoutContext.opponentTeamId);
  }

  const nextGame = typeof getNextGame === "function" ? getNextGame() : null;

  if (nextGame && nextGame.opponentId) {
    return Number(nextGame.opponentId);
  }

  return null;
}

function copyLegacyNextGamePlanIfNeeded(plan, scoutOpponentId) {
  if (!gameState.nextGameScoutPlans || !plan || !scoutOpponentId) {
    return plan;
  }

  // Do not overwrite a real opponent plan.
  if (isOpponentGameplanCustomized(plan)) {
    return plan;
  }

  const key = getNextGameScoutGameKey();
  const legacyPlan = gameState.nextGameScoutPlans[key];

  if (!legacyPlan || Number(legacyPlan.opponentId) !== Number(scoutOpponentId)) {
    return plan;
  }

  if (!isOpponentGameplanCustomized(legacyPlan)) {
    return plan;
  }

  plan.coverage = { ...(legacyPlan.coverage || {}) };
  plan.matchups = { ...(legacyPlan.matchups || {}) };
  plan.migratedFromNextGameScoutPlan = key;

  syncOpponentGameplanStatus(plan, true);

  return plan;
}

function ensureNextGameScoutPlan() {
  const scoutOpponentId = getActiveNextScoutOpponentId();

  if (scoutOpponentId) {
    const plan = ensureOpponentGameplanForTeam(scoutOpponentId);

    // This pulls over an old Next Game plan one time, so existing save data is not wasted.
    if (activeNextScoutContext?.mode === "nextGame") {
      copyLegacyNextGamePlanIfNeeded(plan, scoutOpponentId);
    }

    return plan;
  }

  return {
    opponentTeamId: null,
    coverage: {},
    matchups: {},
    status: "default",
    customized: false
  };
}

function getNextScoutCoverage(playerId) {
  const plan = ensureNextGameScoutPlan();

  return plan.coverage[String(playerId)] || null;
}

function setNextScoutCoverage(playerId, coverageType) {
  const plan = ensureNextGameScoutPlan();
  const playerKey = String(playerId);

  if (!plan.coverage || typeof plan.coverage !== "object") {
    plan.coverage = {};
  }

  if (plan.coverage[playerKey] === coverageType) {
    delete plan.coverage[playerKey];
  } else {
    plan.coverage[playerKey] = coverageType;
  }

  syncOpponentGameplanStatus(plan, true);

  activeNextScoutPlayerId = null;
  refreshActiveNextScoutContext();
}

function openNextScoutCoverageMenu(event, playerId) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const playerKey = String(playerId);

  activeNextScoutPlayerId =
    String(activeNextScoutPlayerId) === playerKey
      ? null
      : playerKey;

  refreshActiveNextScoutContext();
}

function closeNextScoutCoverageMenu() {
  if (!activeNextScoutPlayerId) return;

  activeNextScoutPlayerId = null;
  refreshActiveNextScoutContext();
}

function getNextScoutCoverageLabel(coverageType) {
  const labels = {
    deny: "Deny",
    tight: "Tight",
    gap: "Gap",
    leaveOpen: "Leave Open"
  };

  return labels[coverageType] || "";
}

function renderNextScoutCoverageDot(playerId) {
  const coverage = getNextScoutCoverage(playerId);

  if (!coverage) return "";

  const classKey = coverage === "leaveOpen" ? "leave-open" : coverage;

  return `
    <div
      class="next-scout-coverage-dot next-scout-coverage-${classKey}"
      title="${getNextScoutCoverageLabel(coverage)}"
    ></div>
  `;
}

function renderNextScoutCoverageMenu(playerId) {
  if (String(activeNextScoutPlayerId) !== String(playerId)) {
    return "";
  }

  const currentCoverage = getNextScoutCoverage(playerId);

  const options = [
    { key: "deny", label: "Deny", className: "deny" },
    { key: "tight", label: "Tight", className: "tight" },
    { key: "gap", label: "Gap", className: "gap" },
    { key: "leaveOpen", label: "Leave Open", className: "leave-open" }
  ];

  return `
    <div class="next-scout-coverage-wheel" onclick="event.stopPropagation();">
      <div class="next-scout-coverage-center">
        Coverage
        <small>Click again to clear</small>
      </div>

      ${options.map(option => {
        const activeClass = currentCoverage === option.key ? "active" : "";

        return `
          <button
            type="button"
            class="next-scout-coverage-option ${option.className} ${activeClass}"
            onclick="setNextScoutCoverage('${playerId}', '${option.key}')"
          >
            ${option.label}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function getNextScoutAssignedDefender(opponentPlayerId) {
  const plan = ensureNextGameScoutPlan();

  return plan.matchups[String(opponentPlayerId)] || "";
}

function setNextScoutAssignedDefender(opponentPlayerId, defenderPlayerId) {
  const plan = ensureNextGameScoutPlan();
  const opponentKey = String(opponentPlayerId);

  if (!plan.matchups || typeof plan.matchups !== "object") {
    plan.matchups = {};
  }

  if (!defenderPlayerId || defenderPlayerId === "default") {
    delete plan.matchups[opponentKey];
  } else {
    for (let existingOpponentId in plan.matchups) {
      if (
        String(existingOpponentId) !== opponentKey &&
        String(plan.matchups[existingOpponentId]) === String(defenderPlayerId)
      ) {
        delete plan.matchups[existingOpponentId];
      }
    }

    plan.matchups[opponentKey] = String(defenderPlayerId);
  }

  syncOpponentGameplanStatus(plan, true);

  refreshActiveNextScoutContext();
}

function refreshActiveNextScoutContext() {
  if (activeNextScoutContext?.mode === "opponentPlan" && activeNextScoutContext.opponentTeamId) {
    displayNextGameScout(activeNextScoutContext.opponentTeamId, activeNextScoutContext.rootId || "opponent-plans-root");
    return;
  }

  displayNextGameScout();
}

function getNextScoutUserDefenderOptions() {
  if (!gameState || !gameState.selectedTeamId) return [];

  const roster = [...(getRosterByTeamId(gameState.selectedTeamId) || [])];

  return roster
    .filter(player => {
      ensurePlayerEnergy(player);
      ensurePlayerInjuryFields(player);

      return !player.isInjured;
    })
    .sort((a, b) => {
      const roleA = getNextScoutDefenderSortValue(a);
      const roleB = getNextScoutDefenderSortValue(b);

      return roleB - roleA;
    });
}

function getNextScoutDefenderSortValue(player) {
  if (!player) return 0;

  const attributes = player.attributes || {};

  const defense =
    Number(attributes.perimeterDefense || 0) +
    Number(attributes.interiorDefense || 0) +
    Number(attributes.helpDefenseIQ || attributes.helpDefense || 0) +
    Number(attributes.defensiveDiscipline || 0) +
    Number(attributes.steals || 0) +
    Number(attributes.blocks || 0);

  const ability = Number(player.currentAbility || player.overall || 0) / 20;

  return defense + ability;
}

function renderNextScoutDefenderSelect(opponentPlayer) {
  if (!opponentPlayer) return "";

  const plan = ensureNextGameScoutPlan();
  const defenders = getNextScoutUserDefenderOptions();
  const selectedDefenderId = getNextScoutAssignedDefender(opponentPlayer.id);

  const usedDefenderIds = new Set();

  for (let opponentId in plan.matchups) {
    if (String(opponentId) === String(opponentPlayer.id)) continue;

    const defenderId = plan.matchups[opponentId];

    if (defenderId) {
      usedDefenderIds.add(String(defenderId));
    }
  }

  const availableDefenders = defenders.filter(defender => {
    if (String(defender.id) === String(selectedDefenderId)) return true;

    return !usedDefenderIds.has(String(defender.id));
  });

  return `
    <div class="next-scout-matchup-select-wrap" onclick="event.stopPropagation();">
      <label>Guarded By</label>

      <select
        class="next-scout-matchup-select"
        onchange="setNextScoutAssignedDefender('${opponentPlayer.id}', this.value)"
      >
        <option value="default">Auto Matchup</option>

        ${availableDefenders.map(defender => `
          <option
            value="${defender.id}"
            ${String(selectedDefenderId) === String(defender.id) ? "selected" : ""}
          >
            ${defender.name} · ${defender.primaryPosition || "-"}
          </option>
        `).join("")}
      </select>
    </div>
  `;
}

function renderNextScoutAssignedDefenderPill(opponentPlayer) {
  if (!opponentPlayer) return "";

  const assignedDefenderId = getNextScoutAssignedDefender(opponentPlayer.id);

  if (!assignedDefenderId) {
    return "";
  }

  const defender = getRosterByTeamId(gameState.selectedTeamId)
    .find(player => String(player.id) === String(assignedDefenderId));

  if (!defender) return "";

  return `
    <div class="next-scout-assigned-defender-pill">
      ${defender.name}
    </div>
  `;
}

function createNextGameScoutingReportEmail() {
  if (!gameState || !gameState.started || !Array.isArray(gameState.inbox)) return;

  const nextGame = getNextGame();

  if (!nextGame) return;

  const opponent = getTeamById(nextGame.opponentId);

  if (!opponent) return;

  const dateKey = typeof formatDateKey === "function"
    ? formatDateKey(nextGame.date)
    : new Date(nextGame.date).toISOString().slice(0, 10);

  const reportKey = `next_scout_${dateKey}_${nextGame.opponentId}_${nextGame.competition || "regular"}`;

  if (!gameState.createdScoutingReportKeys) {
    gameState.createdScoutingReportKeys = {};
  }

  if (gameState.createdScoutingReportKeys[reportKey]) {
    return;
  }

  gameState.createdScoutingReportKeys[reportKey] = true;

  const opponentStats = getNextScoutTeamStats(nextGame.opponentId);

  const title = `Scouting Report Ready: ${opponent.name}`;

  const body = [
    `Your next opponent is ${opponent.name}.`,
    `${nextGame.home ? "Home game" : "Away game"} on ${formatDate(nextGame.date)}.`,
    `Record: ${opponentStats.record}. Place: ${opponentStats.place}.`,
    `Team profile: ${opponentStats.ppg} PPG, ${opponentStats.oppPpg} OPP PPG, ${opponentStats.rebounds} REB, ${opponentStats.assists} AST.`,
    `Open the Next Game tab to review their starters, bench, defensive coverage plan, and matchup assignments.`
  ].join("\n");

  const message = createMessage(
    title,
    body,
    "scouting",
    false,
    "next-game-scout"
  );

  message.senderName = "Scouting Department";
  message.date = formatDate(gameState.currentDate);
  message.unread = true;
  message.reportKey = reportKey;

  gameState.inbox.unshift(message);

  if (gameState.inbox.length > 30) {
    gameState.inbox.pop();
  }
}


function getRotationPlayersForGameplanCards() {
  if (!gameState) return [];

  let lineup = [];

  if (typeof getRotationLineupPlayers === "function") {
    lineup = getRotationLineupPlayers()
      .filter(item => item && item.player)
      .map(item => ({
        player: item.player,
        minutes: Number(item.minutes || 0)
      }));
  }

  if (!lineup.length) {
    const roster = getRosterByTeamId(gameState.selectedTeamId) || [];

    lineup = roster.map((player, index) => ({
      player,
      minutes: index < 5 ? 30 : index < 10 ? 18 : 0
    }));
  }

  const usedIds = new Set(lineup.map(item => Number(item.player.id)));
  const roster = getRosterByTeamId(gameState.selectedTeamId) || [];

  for (let player of roster) {
    if (!usedIds.has(Number(player.id))) {
      lineup.push({
        player,
        minutes: 0
      });
    }
  }

  while (lineup.length < 17) {
    lineup.push({
      player: null,
      minutes: 0
    });
  }

  return lineup.slice(0, 17);
}

function syncGameplanCardsToRotation(lineup) {
  if (!gameState || !gameState.rotation || !Array.isArray(gameState.rotation.slots)) return;

  for (let cardItem of lineup) {
    if (!cardItem || !cardItem.player) continue;

    const matchingSlot = gameState.rotation.slots.find(slot =>
      Number(slot.playerId) === Number(cardItem.player.id)
    );

    if (matchingSlot) {
      matchingSlot.minutes = Number(cardItem.minutes || 0);
    }

    cardItem.player.rotationMinutes = Number(cardItem.minutes || 0);
  }
}

function getGameplanCardAssignedPosition(index, player) {
  if (index < 5) return gameplanStarterLabels[index];

  if (player) {
    return player.primaryPosition || player.position || "-";
  }

  return "-";
}

function isPlayerOutOfAssignedPosition(player, assignedPosition) {
  if (!player || !assignedPosition || assignedPosition === "-") return false;

  const positions = [];

  if (player.primaryPosition) positions.push(player.primaryPosition);

  if (Array.isArray(player.secondaryPositions)) {
    positions.push(...player.secondaryPositions);
  }

  if (player.secondaryPosition) {
    positions.push(player.secondaryPosition);
  }

  if (player.position && !positions.length) {
    String(player.position)
      .split("/")
      .forEach(pos => positions.push(pos.trim()));
  }

  return !positions.includes(assignedPosition);
}

function renderGameplanPlayerCard(item, index, cardSize) {
  const player = item ? item.player : null;
  const minutes = item ? Number(item.minutes || 0) : 0;
  const assignedPosition = getGameplanCardAssignedPosition(index, player);

  if (!player) {
    const label = index >= 15 ? "Two-Way Slot" : "Empty Slot";

    return `
      <div
        class="gameplan-player-card rotation-card-empty-outline ${cardSize}"
        draggable="true"
        ondragstart="handleGameplanSlotDragStart(event, ${index})"
        ondragover="handleGameplanSlotDragOver(event)"
        ondrop="handleGameplanSlotDrop(event, ${index})"
      >
        <span>${label}</span>
      </div>
    `;
  }

  ensurePlayerEnergy(player);
  ensurePlayerInjuryFields(player);

  const selectedTeam = getSelectedTeam();
  const teamColors = typeof getTeamColors === "function" && selectedTeam
    ? getTeamColors(selectedTeam)
    : null;

  const primaryColor = teamColors ? teamColors.primaryColor : "#17408B";
  const secondaryColor = teamColors ? teamColors.secondaryColor : "#C9082A";

  const outOfPosition = isPlayerOutOfAssignedPosition(player, assignedPosition);
  const injuredClass = player.isInjured ? "injured" : "";
  const oopClass = outOfPosition ? "out-of-position" : "";
  const energy = Math.round(player.energy || 100);
  const energyClass = getEnergyClass(energy);

  const nameParts = getGameplanCardNameParts(player.name);
  const playerImage = renderGameplanCardPlayerImage(player, cardSize);
  const teamLogo = renderGameplanCardTeamLogo(selectedTeam);
  const teamNameParts = getGameplanCardTeamNameParts(selectedTeam);
  const playerNumber = getGameplanCardPlayerNumber(player);
  const availabilityText = player.isInjured ? (player.injuryName || "Unavailable") : "Available";
  const positionText = getGameplanCardPositionText(player);

  return `
    <div
      class="gameplan-player-card league-rotation-card ${cardSize} ${injuredClass} ${oopClass}"
      style="--team-primary: ${primaryColor}; --team-secondary: ${secondaryColor};"
      draggable="true"
      ondragstart="handleGameplanSlotDragStart(event, ${index})"
      ondragend="handleGameplanSlotDragEnd(event)"
      ondragover="handleGameplanSlotDragOver(event)"
      ondrop="handleGameplanSlotDrop(event, ${index})"
      onclick="openPlayerProfile(${player.id})"
    >
      <div class="league-card-top-strip">
        <div class="league-card-team-wordmark">
          <div class="league-card-team-logo">
            ${teamLogo}
          </div>
          <strong>${escapeGameplanIdentityHtml(teamNameParts.nickname)}</strong>
        </div>

        <button
          type="button"
          class="league-card-drag-handle"
          onclick="event.stopPropagation();"
          title="Drag player"
        >
          ☰ Drag
        </button>
      </div>

      <div class="league-card-position-pill">
        ${assignedPosition}
      </div>

      ${outOfPosition ? `<div class="league-card-warning" title="Out of position">!</div>` : ""}

      <div class="league-card-image-zone">
        ${playerImage}
      </div>

      <div class="league-card-info-panel">
        <div class="league-card-player-number">#${escapeGameplanIdentityHtml(playerNumber)}</div>

        <div class="league-card-player-details">
          <div class="league-card-name-stack">
            <span>${escapeGameplanIdentityHtml(nameParts.first)}</span>
            <strong>${escapeGameplanIdentityHtml(nameParts.last)}</strong>
          </div>

          <div class="league-card-status-stack">
            <span class="${energyClass}">Energy ${energy}</span>
            <span class="${player.isInjured ? "injured" : ""}">${escapeGameplanIdentityHtml(availabilityText)}</span>
            <span>${escapeGameplanIdentityHtml(positionText)}</span>
          </div>
        </div>
      </div>

      <div class="league-card-city-strip">${escapeGameplanIdentityHtml(teamNameParts.city)}</div>

      <div
        class="gameplan-minutes-control league-card-minutes"
        onclick="event.stopPropagation();"
        onpointerdown="event.stopPropagation(); setGameplanCardDragEnabled(this, false);"
        onpointerup="setGameplanCardDragEnabled(this, true);"
        onpointercancel="setGameplanCardDragEnabled(this, true);"
        onmouseleave="setGameplanCardDragEnabled(this, true);"
      >
        <div class="gameplan-minutes-row">
          <button type="button" class="gameplan-minute-button" onclick="changeGameplanCardMinutes(${index}, -1)">−</button>

          <input
            type="range"
            class="gameplan-minute-slider"
            min="0"
            max="48"
            value="${minutes}"
            oninput="setGameplanCardMinutes(${index}, this.value, this)"
          />

          <button type="button" class="gameplan-minute-button" onclick="changeGameplanCardMinutes(${index}, 1)">+</button>

          <span class="gameplan-minute-number">${minutes} min</span>
        </div>
      </div>
    </div>
  `;
}

function getGameplanCardTeamNameParts(team) {
  const fullName = String(team?.name || "Team").trim();
  const city =
    team?.city ||
    team?.market ||
    team?.location ||
    getGameplanCardCityFromName(fullName);
  const nickname =
    team?.nickname ||
    team?.teamName ||
    fullName.replace(new RegExp(`^${escapeRegExp(String(city))}\\s*`, "i"), "").trim() ||
    fullName;

  return {
    city,
    nickname
  };
}

function getGameplanCardCityFromName(fullName) {
  const cityPrefixes = [
    "Golden State",
    "Los Angeles",
    "New Orleans",
    "New York",
    "Oklahoma City",
    "San Antonio"
  ];

  const matchedPrefix = cityPrefixes.find(prefix =>
    fullName.toLowerCase().startsWith(prefix.toLowerCase() + " ")
  );

  if (matchedPrefix) return matchedPrefix;

  return fullName.split(" ")[0] || "Team";
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getGameplanCardPlayerNumber(player) {
  const rawNumber = player?.jerseyNumber ?? player?.number ?? player?.jersey ?? "";
  const cleanNumber = String(rawNumber).trim();

  if (!cleanNumber || cleanNumber === "-" || cleanNumber.toLowerCase() === "unknown") {
    return "--";
  }

  return cleanNumber;
}

function getGameplanCardPositionText(player) {
  if (!player) return "-";

  const primary = player.primaryPosition || player.position || "-";
  const secondaryPositions = Array.isArray(player.secondaryPositions)
    ? player.secondaryPositions
    : [];
  const secondary =
    secondaryPositions[0] ||
    player.secondaryPosition ||
    "";

  return secondary ? `${primary} / ${secondary}` : primary;
}

function getGameplanCardNameParts(fullName) {
  const cleanName = String(fullName || "Player").trim();
  const parts = cleanName.split(" ");

  if (parts.length === 1) {
    return {
      first: "",
      last: parts[0].toUpperCase()
    };
  }

  return {
    first: parts.slice(0, -1).join(" ").toUpperCase(),
    last: parts[parts.length - 1].toUpperCase()
  };
}

function renderGameplanCardPlayerImage(player, cardSize) {
  const imagePath = typeof getPlayerPortraitPath === "function"
    ? getPlayerPortraitPath(player)
    : (player.portrait || player.image || player.imagePath || player.photo || player.photoPath || player.headshot || "");

  if (imagePath) {
    return `
      <img
        class="league-card-player-image"
        src="${escapeGameplanIdentityAttr(imagePath)}"
        alt="${escapeGameplanIdentityAttr(player.name || "Player")}"
      >
    `;
  }

  return `
    <div class="league-card-silhouette">
      <div class="league-card-silhouette-head"></div>
      <div class="league-card-silhouette-body"></div>
    </div>
  `;
}

function renderGameplanCardTeamLogo(team) {
  if (!team) return "TM";

  const logoPath = team.logo || team.logoPath || team.image || team.imagePath || team.teamLogo || "";

  if (logoPath) {
    return `<img src="${logoPath}" alt="${team.name}">`;
  }

  return team.abbrev || getTeamInitials(team.name);
}

function ensurePlayerRolesState() {
  if (!gameState) return {};

  if (!gameState.playerRoles || typeof gameState.playerRoles !== "object") {
    gameState.playerRoles = {};
  }

  const teamId = String(gameState.selectedTeamId || "user");

  if (!gameState.playerRoles[teamId] || typeof gameState.playerRoles[teamId] !== "object") {
    gameState.playerRoles[teamId] = {};
  }

  const lineup = getStoredGameplanCardLineup();

  lineup.forEach(item => {
    const player = item ? item.player : null;

    if (!player) return;

    const playerId = String(player.id || player.playerId);

    if (!gameState.playerRoles[teamId][playerId]) {
      gameState.playerRoles[teamId][playerId] = {
        offensiveRole: getDefaultOffensivePlayerRole(player),
        defensiveRole: getDefaultDefensivePlayerRole(player)
      };
    }
  });

  return gameState.playerRoles[teamId];
}

function getDefaultOffensivePlayerRole(player) {
  const position = String(player?.primaryPosition || player?.position || "").toUpperCase();

  if (position === "PG") return "primaryBallHandler";
  if (position === "SG") return "spotUpShooter";
  if (position === "SF") return "connector";
  if (position === "PF") return "versatileBig";
  if (position === "C") return "rollMan";

  return "connector";
}

function getDefaultDefensivePlayerRole(player) {
  const position = String(player?.primaryPosition || player?.position || "").toUpperCase();

  if (position === "PG" || position === "SG") return "onBallGuard";
  if (position === "SF") return "versatileStopper";
  if (position === "PF") return "mobileForward";
  if (position === "C") return "rimProtector";

  return "hidden";
}

function getPlayerRoleOption(roleType, roleKey) {
  const roles = roleType === "defense"
    ? FCD_DEFENSIVE_PLAYER_ROLES
    : FCD_OFFENSIVE_PLAYER_ROLES;

  return roles.find(role => role.key === roleKey) || roles[0];
}

function displayPlayerRolesBoard() {
  const root = document.getElementById("player-roles-root");

  if (!root || !gameState || !gameState.started) return;

  const lineup = getStoredGameplanCardLineup();

  ensurePlayerRolesState();

  root.innerHTML = `
    <div class="player-roles-page">
      <section class="player-roles-section starters">
        <div class="player-roles-section-title">
          <span>Starters</span>
          <strong>Opening five responsibilities</strong>
        </div>

        <div class="player-roles-grid starters">
          ${lineup.slice(0, 5).map((item, index) => renderPlayerRolesCard(item, index)).join("")}
        </div>
      </section>

      <section class="player-roles-section">
        <div class="player-roles-section-title">
          <span>Bench</span>
          <strong>Rotation unit roles</strong>
        </div>

        <div class="player-roles-grid bench">
          ${lineup.slice(5, 11).map((item, localIndex) => renderPlayerRolesCard(item, localIndex + 5)).join("")}
        </div>
      </section>

      <section class="player-roles-section">
        <div class="player-roles-section-title">
          <span>Reserves</span>
          <strong>Depth and two-way responsibilities</strong>
        </div>

        <div class="player-roles-grid reserves">
          ${lineup.slice(11, 17).map((item, localIndex) => renderPlayerRolesCard(item, localIndex + 11)).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderPlayerRolesCard(item, index) {
  const player = item ? item.player : null;
  const slotLabel = getPlayerRolesSlotLabel(index);

  if (!player) {
    return `
      <article class="player-role-card empty">
        <div class="player-role-empty-slot">${escapeGameplanIdentityHtml(slotLabel)}</div>
        <strong>${index >= 15 ? "Two-Way Slot" : "Empty Slot"}</strong>
        <span>No player assigned</span>
      </article>
    `;
  }

  const teamRoles = ensurePlayerRolesState();
  const playerId = String(player.id || player.playerId);
  const savedRoles = teamRoles[playerId] || {};
  const offensiveRole = getPlayerRoleOption("offense", savedRoles.offensiveRole);
  const defensiveRole = getPlayerRoleOption("defense", savedRoles.defensiveRole);

  return `
    <article class="player-role-card">
      <div class="player-role-profile">
        <div class="player-role-face">
          ${renderGameplanIdentityPlayerFace(player)}
        </div>

        <div class="player-role-player-copy">
          <span>${escapeGameplanIdentityHtml(slotLabel)}</span>
          <strong>${escapeGameplanIdentityHtml(player.name || "Player")}</strong>
          <small>${escapeGameplanIdentityHtml(getGameplanCardPositionText(player))}</small>
        </div>
      </div>

      ${renderPlayerRoleButton(playerId, "offense", offensiveRole)}
      ${renderPlayerRoleButton(playerId, "defense", defensiveRole)}
    </article>
  `;
}

function getPlayerRolesSlotLabel(index) {
  if (index < 5) return gameplanStarterLabels[index];
  return String(index + 1);
}

function renderPlayerRoleButton(playerId, roleType, role) {
  const label = roleType === "defense" ? "Defensive Role" : "Offensive Role";
  const safePlayerId = escapeGameplanIdentityAttr(playerId);

  return `
    <button
      type="button"
      class="player-role-choice ${roleType}"
      onclick="openPlayerRolePicker('${safePlayerId}', '${roleType}')"
    >
      <span>${label}</span>
      <strong>${escapeGameplanIdentityHtml(role.name)}</strong>
      <small>${escapeGameplanIdentityHtml(role.description)}</small>
    </button>
  `;
}

function openPlayerRolePicker(playerId, roleType) {
  const player = getPlayerRolesPlayerById(playerId);

  if (!player) return;

  const teamRoles = ensurePlayerRolesState();
  const roleKey = roleType === "defense" ? "defensiveRole" : "offensiveRole";
  const roles = roleType === "defense"
    ? FCD_DEFENSIVE_PLAYER_ROLES
    : FCD_OFFENSIVE_PLAYER_ROLES;
  const currentValue = teamRoles[String(playerId)]?.[roleKey] || roles[0].key;
  const overlay = getGameplanIdentityOverlay();
  const title = roleType === "defense" ? "SELECT DEFENSIVE ROLE" : "SELECT OFFENSIVE ROLE";

  overlay.innerHTML = `
    <div class="identity-picker-panel player-role-picker-panel ${roleType}">
      <div class="identity-picker-header">
        <div>
          <span>${escapeGameplanIdentityHtml(player.name || "Player")}</span>
          <h2>${title}</h2>
          <p>Choose one responsibility for this player. This is a coaching assignment, not an attribute edit.</p>
        </div>

        <button type="button" onclick="closeGameplanIdentityPicker()">×</button>
      </div>

      <div class="identity-option-card-grid player-role-picker-grid">
        ${roles.map(role => `
          <button
            type="button"
            class="identity-option-card player-role-option-card ${roleType} ${role.key === currentValue ? "active" : ""}"
            onclick="selectPlayerRole('${escapeGameplanIdentityAttr(playerId)}', '${roleType}', '${escapeGameplanIdentityAttr(role.key)}')"
          >
            <div class="identity-option-icon">${escapeGameplanIdentityHtml(role.icon)}</div>
            <strong>${escapeGameplanIdentityHtml(role.name)}</strong>
            <p>${escapeGameplanIdentityHtml(role.description)}</p>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  overlay.classList.remove("hidden");
}

function getPlayerRolesPlayerById(playerId) {
  const lineup = getStoredGameplanCardLineup();
  const match = lineup.find(item =>
    item && item.player && String(item.player.id || item.player.playerId) === String(playerId)
  );

  if (match) return match.player;

  const roster = getRosterByTeamId(gameState.selectedTeamId) || [];

  return roster.find(player => String(player.id || player.playerId) === String(playerId)) || null;
}

function selectPlayerRole(playerId, roleType, roleKey) {
  const teamRoles = ensurePlayerRolesState();
  const player = getPlayerRolesPlayerById(playerId);

  if (!player) return;

  const id = String(playerId);

  if (!teamRoles[id]) {
    teamRoles[id] = {
      offensiveRole: getDefaultOffensivePlayerRole(player),
      defensiveRole: getDefaultDefensivePlayerRole(player)
    };
  }

  if (roleType === "defense") {
    teamRoles[id].defensiveRole = roleKey;
  } else {
    teamRoles[id].offensiveRole = roleKey;
  }

  closeGameplanIdentityPicker();
  displayPlayerRolesBoard();
}

function ensureOpponentGameplansState() {
  if (!gameState) return {};

  if (!gameState.opponentGameplans || typeof gameState.opponentGameplans !== "object") {
    gameState.opponentGameplans = {};
  }

  const userTeamId = String(gameState.selectedTeamId || "user");

  if (!gameState.opponentGameplans[userTeamId] || typeof gameState.opponentGameplans[userTeamId] !== "object") {
    gameState.opponentGameplans[userTeamId] = {};
  }

  const teamPlans = gameState.opponentGameplans[userTeamId];

  // Normalize old saves, but DO NOT create a plan for every team.
  Object.keys(teamPlans).forEach(teamId => {
    if (!teamPlans[teamId] || typeof teamPlans[teamId] !== "object") {
      delete teamPlans[teamId];
      return;
    }

    normalizeOpponentGameplan(teamPlans[teamId], teamId);
  });

  return teamPlans;
}

function normalizeOpponentGameplan(plan, teamId) {
  if (!plan || typeof plan !== "object") {
    return createDefaultOpponentGameplan(teamId);
  }

  plan.opponentTeamId = Number(plan.opponentTeamId || teamId);

  if (!plan.createdDate) {
    plan.createdDate = formatDate(gameState.currentDate);
  }

  if (!plan.updatedDate) {
    plan.updatedDate = formatDate(gameState.currentDate);
  }

  if (!plan.coverage || typeof plan.coverage !== "object") {
    plan.coverage = {};
  }

  if (!plan.matchups || typeof plan.matchups !== "object") {
    plan.matchups = {};
  }

  syncOpponentGameplanStatus(plan, false);

  return plan;
}

function createDefaultOpponentGameplan(teamId) {
  return {
    opponentTeamId: Number(teamId),
    createdDate: formatDate(gameState.currentDate),
    updatedDate: formatDate(gameState.currentDate),
    coverage: {},
    matchups: {},
    status: "default",
    customized: false
  };
}

function getOpponentGameplanInstructionCount(plan) {
  if (!plan || typeof plan !== "object") return 0;

  const coverageCount = plan.coverage && typeof plan.coverage === "object"
    ? Object.keys(plan.coverage).filter(key => plan.coverage[key]).length
    : 0;

  const matchupCount = plan.matchups && typeof plan.matchups === "object"
    ? Object.keys(plan.matchups).filter(key => plan.matchups[key]).length
    : 0;

  return coverageCount + matchupCount;
}

function isOpponentGameplanCustomized(plan) {
  return getOpponentGameplanInstructionCount(plan) > 0;
}

function syncOpponentGameplanStatus(plan, touchUpdatedDate = true) {
  if (!plan || typeof plan !== "object") return plan;

  const customized = isOpponentGameplanCustomized(plan);

  plan.status = customized ? "custom" : "default";
  plan.customized = customized;

  if (touchUpdatedDate) {
    plan.updatedDate = formatDate(gameState.currentDate);
  }

  return plan;
}

function ensureOpponentGameplanForTeam(teamId) {
  const plans = ensureOpponentGameplansState();
  const id = String(teamId);

  if (!plans[id]) {
    plans[id] = createDefaultOpponentGameplan(teamId);
  }

  plans[id] = normalizeOpponentGameplan(plans[id], teamId);

  return plans[id];
}

function getOpponentPlansTeams() {
  const teams = Array.isArray(gameState?.teams) && gameState.teams.length
    ? gameState.teams
    : baseTeams;

  return teams
    .slice()
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
}

function getOpponentPlanTeamName(team) {
  if (!team) return "Team";

  const parts = getGameplanCardTeamNameParts(team);

  return parts.nickname || team.name || "Team";
}

function displayOpponentPlansBoard() {
  const root = document.getElementById("opponent-plans-root");

  if (!root || !gameState || !gameState.started) return;

  const teams = getOpponentPlansTeams();
  const plans = ensureOpponentGameplansState();
  const createdCount = teams.filter(team => {
    return isOpponentGameplanCustomized(plans[String(team.id)]);
  }).length;

  root.innerHTML = `
    <div class="opponent-plans-page">
      <header class="opponent-plans-header">
        <div>
          <h2>Opponent Plans</h2>
          <p>Create custom gameplans for specific opponents.</p>
        </div>

        <strong>Custom Plans: ${createdCount} / ${teams.length}</strong>
      </header>

      <div class="opponent-plans-logo-grid">
        ${teams.map(team => {
          const plan = plans[String(team.id)];
          const hasPlan = isOpponentGameplanCustomized(plan);

          return renderOpponentPlanLogoButton(team, hasPlan);
        }).join("")}
      </div>
    </div>
  `;
}

function renderOpponentPlanLogoButton(team, hasPlan) {
  const statusClass = hasPlan ? "has-plan" : "no-plan";
  const teamName = getOpponentPlanTeamName(team);
  const statusLabel = hasPlan ? "Custom Plan" : "Default Plan";

  return `
    <button
      type="button"
      class="opponent-plan-logo-button ${statusClass}"
      onclick="openOpponentGameplan(${Number(team.id)})"
      title="${escapeGameplanIdentityAttr(team.name || teamName)}"
    >
      <div class="opponent-plan-logo-wrap">
        ${renderOpponentPlanTeamLogo(team)}
      </div>

      <span>${escapeGameplanIdentityHtml(teamName)}</span>
      <small>${statusLabel}</small>
    </button>
  `;
}

function renderOpponentPlanTeamLogo(team) {
  if (typeof getTeamLogoHTML === "function") {
    return getTeamLogoHTML(team, "opponent-plan-team-logo");
  }

  const logoPath = team.logoImage || team.logo || team.logoPath || team.image || team.imagePath || team.teamLogo || "";

  if (logoPath) {
    return `
      <div class="opponent-plan-team-logo">
        <img src="${escapeGameplanIdentityAttr(logoPath)}" alt="${escapeGameplanIdentityAttr(team.name || "Team")}">
      </div>
    `;
  }

  return `<div class="opponent-plan-team-logo team-logo-empty">${escapeGameplanIdentityHtml(team.abbrev || "FCD")}</div>`;
}

function openOpponentGameplan(teamId) {
  ensureOpponentGameplanForTeam(teamId);

  activeNextScoutPlayerId = null;
  displayOpponentGameplanDetail(Number(teamId));
}

function displayOpponentGameplanDetail(teamId) {
  const root = document.getElementById("opponent-plans-root");

  if (!root) return;

  const team = getTeamById(Number(teamId)) || getBaseTeamById(Number(teamId));

  if (!team) {
    displayOpponentPlansBoard();
    return;
  }

  displayNextGameScout(Number(teamId), "opponent-plans-root");
}

function getStoredGameplanCardLineup() {
  if (!gameState) return [];

  const roster = getRosterByTeamId(gameState.selectedTeamId) || [];

  if (!Array.isArray(gameState.gameplanCardLineup)) {
    gameState.gameplanCardLineup = getRotationPlayersForGameplanCards().map(item => ({
      playerId: item.player ? item.player.id : null,
      minutes: Number(item.minutes || 0)
    }));
  }

  let lineup = gameState.gameplanCardLineup.map(slot => {
    const player = slot.playerId
      ? roster.find(p => Number(p.id) === Number(slot.playerId)) || null
      : null;

    return {
      player,
      minutes: Number(slot.minutes || 0)
    };
  });

  // Remove duplicate players if they somehow appear twice.
  const usedPlayerIds = new Set();

  lineup = lineup.map(slot => {
    if (!slot.player) return slot;

    const playerId = Number(slot.player.id);

    if (usedPlayerIds.has(playerId)) {
      return {
        player: null,
        minutes: 0
      };
    }

    usedPlayerIds.add(playerId);
    return slot;
  });

  // Find players currently on the roster but missing from the rotation board.
  const missingPlayers = roster
    .filter(player => !usedPlayerIds.has(Number(player.id)))
    .sort((a, b) => {
      return getLeagueRosterPlayerAbility(b) - getLeagueRosterPlayerAbility(a);
    });

  // Put new players into empty slots first.
  for (let player of missingPlayers) {
    const emptyIndex = lineup.findIndex(slot => !slot.player);

    if (emptyIndex !== -1) {
      lineup[emptyIndex] = {
        player,
        minutes: 0
      };
    } else if (lineup.length < 17) {
      lineup.push({
        player,
        minutes: 0
      });
    }
  }

  // Always keep the board at 17 spots: 5 starters + 12 bench/deep spots.
  while (lineup.length < 17) {
    lineup.push({
      player: null,
      minutes: 0
    });
  }

  lineup = lineup.slice(0, 17);

  // Save the synced version back to gameState.
  gameState.gameplanCardLineup = lineup.map(item => ({
    playerId: item && item.player ? item.player.id : null,
    minutes: Number(item && item.minutes ? item.minutes : 0)
  }));

  return lineup;
}

function saveStoredGameplanCardLineup(lineup) {
  if (!gameState) return;

  gameState.gameplanCardLineup = lineup.map(item => ({
    playerId: item && item.player ? item.player.id : null,
    minutes: Number(item && item.minutes ? item.minutes : 0)
  }));

  syncGameplanCardsToRotation(lineup);
}

function renderGameplanCardBoard() {
  if (!gameState || !gameState.started) return;

  ensureAllPlayerEnergy();
  ensureAllPlayerInjuryFields();

  let lineup = getStoredGameplanCardLineup();

  while (lineup.length < 17) {
    lineup.push({ player: null, minutes: 0 });
  }

  lineup = lineup.slice(0, 17);

  const starters = lineup.slice(0, 5);
  const benchOne = lineup.slice(5, 11);
  const benchTwo = lineup.slice(11, 17);

  const startersRow = document.getElementById("gameplan-starters-row");
  const benchRowOne = document.getElementById("gameplan-bench-row-one");
  const benchRowTwo = document.getElementById("gameplan-bench-row-two");

  if (startersRow) {
    startersRow.innerHTML = starters
      .map((item, localIndex) => renderGameplanPlayerCard(item, localIndex, "gameplan-starter-card"))
      .join("");
  }

  if (benchRowOne) {
    benchRowOne.innerHTML = benchOne
      .map((item, localIndex) => renderGameplanPlayerCard(item, localIndex + 5, "gameplan-bench-card"))
      .join("");
  }

  if (benchRowTwo) {
    benchRowTwo.innerHTML = benchTwo
      .map((item, localIndex) => renderGameplanPlayerCard(item, localIndex + 11, "gameplan-bench-card"))
      .join("");
  }

  const totalMinutes = lineup.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const totalElement = document.getElementById("gameplan-total-minutes");

  if (totalElement) {
    totalElement.textContent = `${totalMinutes} / 240`;

    const box = totalElement.closest(".gameplan-minutes-total");

    if (box) {
      box.classList.toggle("warning", totalMinutes !== 240);
    }
  }
}

function setGameplanCardMinutes(index, value, inputElement = null) {
  const lineup = getStoredGameplanCardLineup();

  if (!lineup[index]) return;

  const nextMinutes = clamp(Number(value || 0), 0, 48);
  lineup[index].minutes = nextMinutes;

  saveStoredGameplanCardLineup(lineup);
  updateGameplanCardMinuteDisplay(inputElement, nextMinutes);

  if (typeof refreshAll === "function") {
    // avoid full refresh loops if needed later
  }
}

function updateGameplanCardMinuteDisplay(inputElement, minutes) {
  if (!inputElement || !inputElement.closest) return;

  const control = inputElement.closest(".league-card-minutes");
  const number = control
    ? control.querySelector(".gameplan-minute-number")
    : null;

  if (number) {
    number.textContent = `${minutes} min`;
  }

  const totalElement = document.getElementById("gameplan-total-minutes");

  if (totalElement) {
    const lineup = getStoredGameplanCardLineup();
    const totalMinutes = lineup.reduce((sum, item) => sum + Number(item.minutes || 0), 0);

    totalElement.textContent = `${totalMinutes} / 240`;

    const box = totalElement.closest(".gameplan-minutes-total");

    if (box) {
      box.classList.toggle("warning", totalMinutes !== 240);
    }
  }
}

function changeGameplanCardMinutes(index, change) {
  const lineup = getStoredGameplanCardLineup();

  if (!lineup[index]) return;

  const current = Number(lineup[index].minutes || 0);

  lineup[index].minutes = clamp(current + Number(change || 0), 0, 48);

  saveStoredGameplanCardLineup(lineup);
  renderGameplanCardBoard();
}

function setGameplanCardDragEnabled(element, enabled) {
  const card = element && element.closest
    ? element.closest(".league-rotation-card")
    : null;

  if (card) {
    card.draggable = Boolean(enabled);
  }
}

function handleGameplanSlotDragStart(event, index) {
  if (event && event.target && event.target.closest(".gameplan-minutes-control")) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  draggedGameplanSlotIndex = index;

  if (event && event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  if (event && event.currentTarget) {
    event.currentTarget.classList.add("dragging");
  }
}

function handleGameplanSlotDragEnd(event) {
  if (event && event.currentTarget) {
    event.currentTarget.classList.remove("dragging");
  }

  draggedGameplanSlotIndex = null;
}

function handleGameplanSlotDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function handleGameplanSlotDrop(event, dropIndex) {
  event.preventDefault();
  event.stopPropagation();

  if (draggedGameplanSlotIndex === null || draggedGameplanSlotIndex === dropIndex) {
    return;
  }

  const lineup = getStoredGameplanCardLineup();

  while (lineup.length < 17) {
    lineup.push({ player: null, minutes: 0 });
  }

  const draggedItem = lineup[draggedGameplanSlotIndex] || { player: null, minutes: 0 };
  const droppedItem = lineup[dropIndex] || { player: null, minutes: 0 };

  lineup[dropIndex] = {
    ...droppedItem,
    player: draggedItem.player || null
  };

  lineup[draggedGameplanSlotIndex] = {
    ...draggedItem,
    player: droppedItem.player || null
  };

  saveStoredGameplanCardLineup(lineup);

  draggedGameplanSlotIndex = null;

  renderGameplanCardBoard();
}

function displayPracticesScreen() {
  if (!gameState || !gameState.selectedTeamId) return;

  ensurePracticePlans();

  const roster = getPracticeRosterPlayers();

  if (!selectedPracticePlayerId && roster.length > 0) {
    selectedPracticePlayerId = roster[0].id || roster[0].playerId;
  }

  const selectedPlayerStillExists = roster.some(player => {
    return String(player.id || player.playerId) === String(selectedPracticePlayerId);
  });

  if (!selectedPlayerStillExists && roster.length > 0) {
    selectedPracticePlayerId = roster[0].id || roster[0].playerId;
  }

  renderPracticePlayerList(roster);
  renderSelectedPracticePlayerPanel(roster);
}

function ensurePracticePlans() {
  if (!gameState.practicePlans) {
    gameState.practicePlans = {};
  }

  const roster = getPracticeRosterPlayers();

  for (let player of roster) {
    const playerId = player.id || player.playerId;

    if (!gameState.practicePlans[playerId]) {
      gameState.practicePlans[playerId] = {
        offensiveFocus: "None",
        defensiveFocus: "None",
        physicalFocus: "None",
        intensity: "Medium"
      };
    }
  }
}

function getPracticeRosterPlayers() {
  const roster = getRosterByTeamId(gameState.selectedTeamId) || [];

  return [...roster].sort((a, b) => {
    return getLeagueRosterPlayerAbility(b) - getLeagueRosterPlayerAbility(a);
  });
}

function renderPracticePlayerList(roster) {
  const list = document.getElementById("practice-player-list");
  if (!list) return;

  if (roster.length === 0) {
    list.innerHTML = `
      <div class="practice-empty-list">
        No players found on this roster.
      </div>
    `;
    return;
  }

  list.innerHTML = roster.map(player => {
    const playerId = player.id || player.playerId;
    const plan = getPracticePlanForPlayer(playerId);
    const activeClass = String(playerId) === String(selectedPracticePlayerId) ? "active" : "";

    return `
      <button
        type="button"
        class="practice-player-list-item ${activeClass}"
        onclick="selectPracticePlayer('${playerId}')"
      >
        <span class="practice-player-list-name">${escapeLeagueRosterText(player.name)}</span>
        <span class="practice-player-list-meta">
          ${player.primaryPosition || player.position || "--"} · ${plan.intensity}
        </span>
      </button>
    `;
  }).join("");
}

function renderSelectedPracticePlayerPanel(roster) {
  const panel = document.getElementById("practice-selected-player-panel");
  if (!panel) return;

  const player = roster.find(item => {
    return String(item.id || item.playerId) === String(selectedPracticePlayerId);
  });

  if (!player) {
    panel.innerHTML = `
      <div class="practice-no-player-selected">
        <h2>No Player Selected</h2>
        <p>Select a player from the list to set their practice plan.</p>
      </div>
    `;
    return;
  }

  const playerId = player.id || player.playerId;
  const plan = getPracticePlanForPlayer(playerId);
  const nameParts = getGameplanCardNameParts(player.name);

  panel.innerHTML = `
    <div class="practice-player-hero">
      <div class="practice-player-identity">
        <div class="practice-player-name-full">
          ${escapeLeagueRosterText(player.name).toUpperCase()}
        </div>

        <p>
          ${player.primaryPosition || player.position || "--"} · Age ${player.age || "--"} · Energy ${Math.round(player.energy || 100)}
        </p>
      </div>

      <button
        type="button"
        class="practice-open-profile-button"
        onclick="openPlayerProfile('${playerId}')"
      >
        Open Profile
      </button>
    </div>

    <div class="practice-focus-grid">

      <div class="practice-focus-card">
        <h3>Offensive Focus</h3>
        ${renderPracticeFocusSelect(playerId, "offensiveFocus", plan.offensiveFocus, PRACTICE_OFFENSIVE_FOCUS_OPTIONS)}
      </div>

      <div class="practice-focus-card">
        <h3>Defensive Focus</h3>
        ${renderPracticeFocusSelect(playerId, "defensiveFocus", plan.defensiveFocus, PRACTICE_DEFENSIVE_FOCUS_OPTIONS)}
      </div>

      <div class="practice-focus-card">
        <h3>Physical Focus</h3>
        ${renderPracticeFocusSelect(playerId, "physicalFocus", plan.physicalFocus, PRACTICE_PHYSICAL_FOCUS_OPTIONS)}
      </div>

    </div>

    <div class="practice-intensity-card">
      <div>
        <h3>Practice Intensity</h3>
        <p>Higher intensity will matter more when development and fatigue are fully active.</p>
      </div>

      <div class="practice-intensity-buttons">
        ${PRACTICE_INTENSITY_OPTIONS.map(option => {
          const activeClass = plan.intensity === option ? "active" : "";

          return `
            <button
              type="button"
              class="practice-intensity-button ${activeClass}"
              onclick="updatePlayerPracticeIntensity('${playerId}', '${option}')"
            >
              ${option}
            </button>
          `;
        }).join("")}
      </div>
    </div>

    <div class="practice-development-section">
      <div class="practice-development-card">
        <h3>Offensive Development</h3>
        ${renderPracticeDevelopmentBars(player, [
          { label: "Finishing", key: "finishing" },
          { label: "Three-Point", key: "threePoint" },
          { label: "Ball Handling", key: "ballHandling" },
          { label: "Passing", key: "passing" },
          { label: "Off-Ball", key: "offBallMovement" }
        ])}
      </div>

      <div class="practice-development-card">
        <h3>Defensive Development</h3>
        ${renderPracticeDevelopmentBars(player, [
          { label: "Perimeter", key: "perimeterDefense" },
          { label: "Interior", key: "interiorDefense" },
          { label: "Help Defense", key: "helpDefenseIQ" },
          { label: "Pick-and-Roll", key: "pickRollDefense" },
          { label: "Discipline", key: "defensiveDiscipline" }
        ])}
      </div>

      <div class="practice-development-card">
        <h3>Physical Development</h3>
        ${renderPracticeDevelopmentBars(player, [
          { label: "Strength", key: "strength" },
          { label: "Speed", key: "speed" },
          { label: "Agility", key: "agility" },
          { label: "Stamina", key: "stamina" },
          { label: "Durability", key: "durability" }
        ])}
      </div>
    </div>
  `;
}

function getPracticePlanForPlayer(playerId) {
  ensurePracticePlans();

  if (!gameState.practicePlans[playerId]) {
    gameState.practicePlans[playerId] = {
      offensiveFocus: "None",
      defensiveFocus: "None",
      physicalFocus: "None",
      intensity: "Medium"
    };
  }

  return gameState.practicePlans[playerId];
}

function selectPracticePlayer(playerId) {
  selectedPracticePlayerId = playerId;
  displayPracticesScreen();
}

function renderPracticeFocusSelect(playerId, field, currentValue, options) {
  return `
    <select
      class="practice-focus-select"
      onchange="updatePlayerPracticeFocus('${playerId}', '${field}', this.value)"
    >
      ${options.map(option => {
        const selected = option === currentValue ? "selected" : "";

        return `<option ${selected}>${option}</option>`;
      }).join("")}
    </select>
  `;
}

function updatePlayerPracticeFocus(playerId, field, value) {
  const plan = getPracticePlanForPlayer(playerId);

  plan[field] = value;

  displayPracticesScreen();
}

function updatePlayerPracticeIntensity(playerId, intensity) {
  const plan = getPracticePlanForPlayer(playerId);

  plan.intensity = intensity;

  displayPracticesScreen();
}

function renderPracticeDevelopmentBars(player, attributes) {
  return `
    <div class="practice-development-bars">
      ${attributes.map(attribute => {
        const value = getPracticeAttributeValue(player, attribute.key);
        const percent = Math.max(4, Math.min(100, (value / 20) * 100));

        return `
          <div class="practice-development-row">
            <div class="practice-development-row-top">
              <span>${attribute.label}</span>
              <strong>${value}</strong>
            </div>

            <div class="practice-development-track">
              <div class="practice-development-fill" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function getPracticeAttributeValue(player, key) {
  if (!player || !key) return 0;

  const rawValue = Number(
    player[key] ||
    (player.attributes && player.attributes[key]) ||
    0
  );

  if (!rawValue) return 0;

  if (rawValue > 20) {
    return Math.round(rawValue / 5);
  }

  return Math.round(rawValue);
}
function ensurePlayerEnergy(player) {
  if (!player) return;

  if (player.energy === undefined || player.energy === null || Number.isNaN(Number(player.energy))) {
    player.energy = 100;
  }

  player.energy = clamp(Number(player.energy), 0, 100);
}

function ensureAllPlayerEnergy() {
  if (!gameState || !gameState.rosters) return;

  for (let teamId in gameState.rosters) {
    const roster = gameState.rosters[teamId] || [];

    for (let player of roster) {
      ensurePlayerEnergy(player);
    }
  }

  if (Array.isArray(gameState.freeAgents)) {
    for (let player of gameState.freeAgents) {
      ensurePlayerEnergy(player);
    }
  }
}

function getEnergyRecoveryAmount(player) {
  ensurePlayerEnergy(player);

  /*
    Simple for now:
    Everyone recovers 8 energy per day.
    Later this can use recoveryRate, stamina, medical staff, age, injuries, etc.
  */
  return 8;
}

function recoverPlayerEnergyOneDay(player) {
  if (!player) return;

  ensurePlayerEnergy(player);

  const recovery = getEnergyRecoveryAmount(player);

  player.energy = clamp(player.energy + recovery, 0, 100);
}

function recoverAllPlayersEnergyOneDay() {
  if (!gameState || !gameState.rosters) return;

  for (let teamId in gameState.rosters) {
    const roster = gameState.rosters[teamId] || [];

    for (let player of roster) {
      recoverPlayerEnergyOneDay(player);
    }
  }

  if (Array.isArray(gameState.freeAgents)) {
    for (let player of gameState.freeAgents) {
      recoverPlayerEnergyOneDay(player);
    }
  }
}

function getEnergyLossFromMinutes(minutes) {
  const mins = Number(minutes || 0);

  if (mins <= 0) return 0;
  if (mins <= 10) return 3;
  if (mins <= 20) return 6;
  if (mins <= 30) return 9;
  if (mins <= 38) return 12;

  return 15;
}

function applyEnergyLossToPlayer(player, minutes) {
  if (!player) return;

  ensurePlayerEnergy(player);

  const loss = getEnergyLossFromMinutes(minutes);

  player.energy = clamp(player.energy - loss, 0, 100);
}

function applyEnergyLossFromRotation() {
  if (!gameState || !gameState.rotation) return;

  const lineup = getRotationLineupPlayers();

  for (let item of lineup) {
    if (!item || !item.player) continue;

    applyEnergyLossToPlayer(item.player, item.minutes);
  }
}

function applyEnergyLossToCpuTeam(teamId) {
  const roster = getRosterByTeamId(teamId) || [];

  const sorted = [...roster]
    .sort((a, b) => getSimplePlayerImpact(b) - getSimplePlayerImpact(a))
    .slice(0, 10);

  const minutesPlan = [34, 34, 32, 32, 30, 24, 20, 16, 10, 8];

  sorted.forEach((player, index) => {
    applyEnergyLossToPlayer(player, minutesPlan[index] || 0);
  });
}

function applyEnergyLossForCompletedGame(teamAId, teamBId) {
  if (!gameState) return;

  if (Number(teamAId) === Number(gameState.selectedTeamId)) {
    applyEnergyLossFromRotation();
  } else {
    applyEnergyLossToCpuTeam(teamAId);
  }

  if (Number(teamBId) === Number(gameState.selectedTeamId)) {
    applyEnergyLossFromRotation();
  } else {
    applyEnergyLossToCpuTeam(teamBId);
  }
}

function getEnergyLabel(energy) {
  const value = Number(energy || 0);

  if (value >= 85) return "Energized";
  if (value >= 70) return "Fresh";
  if (value >= 50) return "Okay";
  if (value >= 30) return "Tired";
  if (value >= 15) return "Exhausted";

  return "Danger";
}

function getEnergyClass(energy) {
  const value = Number(energy || 0);

  if (value >= 75) return "energy-good";
  if (value >= 50) return "energy-mid";
  if (value >= 25) return "energy-low";

  return "energy-danger";
}

function renderEnergyGauge(player) {
  if (!player) return "";

  ensurePlayerEnergy(player);

  const energy = Math.round(player.energy);
  const label = getEnergyLabel(energy);
  const energyClass = getEnergyClass(energy);

  return `
    <div class="energy-gauge ${energyClass}" title="Energy: ${energy} / 100">
      <div class="energy-gauge-ring" style="--energy:${energy};"></div>
      <div class="energy-gauge-center">
        <strong>${energy}</strong>
        <span>${label}</span>
      </div>
    </div>
  `;
}

function renderEnergyMini(player) {
  if (!player) return "";

  ensurePlayerEnergy(player);

  const energy = Math.round(player.energy);
  const energyClass = getEnergyClass(energy);

  return `
    <div class="energy-mini ${energyClass}" title="Energy: ${energy}/100">
      <span class="energy-mini-dot"></span>
      <strong>${energy}</strong>
    </div>
  `;
}

function ensurePlayerInjuryFields(player) {
  if (!player) return;

  if (player.isInjured === undefined) {
    player.isInjured = false;
  }

  if (!player.injuryName) {
    player.injuryName = "";
  }

  if (!player.injurySeverity) {
    player.injurySeverity = "";
  }

  if (player.injuryDaysRemaining === undefined || player.injuryDaysRemaining === null) {
    player.injuryDaysRemaining = 0;
  }

  player.injuryDaysRemaining = Math.max(0, Number(player.injuryDaysRemaining || 0));

  if (player.injuryDaysRemaining <= 0) {
    player.isInjured = false;
    player.injuryName = "";
    player.injurySeverity = "";
    player.injuryDaysRemaining = 0;
  }
}

function ensureAllPlayerInjuryFields() {
  if (!gameState || !gameState.rosters) return;

  for (let teamId in gameState.rosters) {
    const roster = gameState.rosters[teamId] || [];

    for (let player of roster) {
      ensurePlayerInjuryFields(player);
    }
  }

  if (Array.isArray(gameState.freeAgents)) {
    for (let player of gameState.freeAgents) {
      ensurePlayerInjuryFields(player);
    }
  }
}

function pickWeightedInjuryType() {
  const totalWeight = simpleInjuryTypes.reduce((sum, injury) => sum + injury.weight, 0);
  let roll = Math.random() * totalWeight;

  for (let injury of simpleInjuryTypes) {
    roll -= injury.weight;

    if (roll <= 0) {
      return injury;
    }
  }

  return simpleInjuryTypes[0];
}

function injurePlayer(player, injuryType = null) {
  if (!player) return null;

  ensurePlayerInjuryFields(player);

  if (player.isInjured) return null;

  const injury = injuryType || pickWeightedInjuryType();
  const days = randomInt(injury.minDays, injury.maxDays);

  player.isInjured = true;
  player.injuryName = injury.name;
  player.injurySeverity = injury.severity;
  player.injuryDaysRemaining = days;
  player.originalInjuryDays = days;

  return {
    player,
    injuryName: injury.name,
    injurySeverity: injury.severity,
    days
  };
}

function recoverPlayerInjuryOneDay(player) {
  if (!player) return null;

  ensurePlayerInjuryFields(player);

  if (!player.isInjured) return null;

  player.injuryDaysRemaining = Math.max(0, Number(player.injuryDaysRemaining || 0) - 1);

  if (player.injuryDaysRemaining <= 0) {
    const recoveredInfo = {
      player,
      injuryName: player.injuryName
    };

    player.isInjured = false;
    player.injuryName = "";
    player.injurySeverity = "";
    player.injuryDaysRemaining = 0;

    return recoveredInfo;
  }

  return null;
}

function recoverAllPlayerInjuriesOneDay() {
  if (!gameState || !gameState.rosters) return;

  const recoveredPlayers = [];

  for (let teamId in gameState.rosters) {
    const roster = gameState.rosters[teamId] || [];

    for (let player of roster) {
      const recovered = recoverPlayerInjuryOneDay(player);

      if (recovered) {
        recoveredPlayers.push({
          ...recovered,
          teamId: Number(teamId)
        });
      }
    }
  }

  for (let recovered of recoveredPlayers) {
    if (Number(recovered.teamId) === Number(gameState.selectedTeamId)) {
      addInboxMessage(
        "Injury Recovery",
        `${recovered.player.name} has recovered from ${recovered.injuryName} and is available to play.`,
        "team"
      );
    }
  }
}

function getPlayerInjuryRisk(player, minutes = 0) {
  if (!player) return 0;

  ensurePlayerEnergy(player);
  ensurePlayerInjuryFields(player);

  if (player.isInjured) return 0;

  const energy = Number(player.energy || 100);

  /*
    Simple first version:
    - Base risk is very low
    - Low energy raises risk
    - Heavy minutes raises risk slightly
    - Later we add durability / injuryProneness / stamina from database
  */
  let risk = 0.002; // 0.2% base risk per game appearance

  if (energy < 75) risk += 0.002;
  if (energy < 55) risk += 0.004;
  if (energy < 35) risk += 0.007;
  if (energy < 20) risk += 0.012;

  const mins = Number(minutes || 0);

  if (mins >= 30) risk += 0.002;
  if (mins >= 38) risk += 0.003;

  return clamp(risk, 0, 0.04);
}

function rollInjuryForPlayer(player, minutes = 0) {
  if (!player) return null;

  const risk = getPlayerInjuryRisk(player, minutes);
  const roll = Math.random();

  if (roll < risk) {
    return injurePlayer(player);
  }

  return null;
}

function rollInjuriesForUserRotation() {
  if (!gameState || !gameState.rotation) return [];

  const injuries = [];
  const lineup = getRotationLineupPlayers();

  for (let item of lineup) {
    if (!item || !item.player) continue;

    const minutes = Number(item.minutes || 0);

    if (minutes <= 0) continue;

    const injury = rollInjuryForPlayer(item.player, minutes);

    if (injury) {
      injuries.push(injury);
    }
  }

  return injuries;
}

function rollInjuriesForCpuTeam(teamId) {
  const injuries = [];
  const roster = getRosterByTeamId(teamId) || [];

  const availablePlayers = roster
    .filter(player => !player.isInjured)
    .sort((a, b) => getSimplePlayerImpact(b) - getSimplePlayerImpact(a))
    .slice(0, 10);

  const minutesPlan = [34, 34, 32, 32, 30, 24, 20, 16, 10, 8];

  availablePlayers.forEach((player, index) => {
    const injury = rollInjuryForPlayer(player, minutesPlan[index] || 0);

    if (injury) {
      injuries.push(injury);
    }
  });

  return injuries;
}

function rollInjuriesForCompletedGame(teamAId, teamBId) {
  const injuries = [];

  if (Number(teamAId) === Number(gameState.selectedTeamId)) {
    injuries.push(...rollInjuriesForUserRotation());
  } else {
    injuries.push(...rollInjuriesForCpuTeam(teamAId));
  }

  if (Number(teamBId) === Number(gameState.selectedTeamId)) {
    injuries.push(...rollInjuriesForUserRotation());
  } else {
    injuries.push(...rollInjuriesForCpuTeam(teamBId));
  }

  for (let injury of injuries) {
    const player = injury.player;
    const playerTeamId = player.teamId;

    if (Number(playerTeamId) === Number(gameState.selectedTeamId)) {
      addInboxMessage(
        "Injury Update",
        `${player.name} suffered ${injury.injuryName}. He is expected to miss ${injury.days} days.`,
        "injury"
      );
    }
  }

  return injuries;
}

function getPlayerAvailabilityLabel(player) {
  if (!player) return "Unknown";

  ensurePlayerInjuryFields(player);

  if (player.isInjured) {
    return `${player.injuryName} (${player.injuryDaysRemaining} days)`;
  }

  return "Available";
}

function renderAvailabilityBadge(player) {
  if (!player) return `<span class="availability-badge available">Available</span>`;

  ensurePlayerInjuryFields(player);

  if (player.isInjured) {
    return `
      <span class="availability-badge injured">
        ${player.injuryName} · ${player.injuryDaysRemaining}d
      </span>
    `;
  }

  return `<span class="availability-badge available">Available</span>`;
}

function getHealthyRosterByTeamId(teamId) {
  const roster = getRosterByTeamId(teamId) || [];

  return roster.filter(player => {
    ensurePlayerInjuryFields(player);
    return !player.isInjured;
  });
}

function getInjuredPlayersByTeamId(teamId) {
  const roster = getRosterByTeamId(teamId) || [];

  return roster.filter(player => {
    ensurePlayerInjuryFields(player);
    return player.isInjured;
  });
}

function getAverageTeamEnergy(teamId) {
  const roster = getRosterByTeamId(teamId) || [];

  if (!roster.length) return 100;

  let total = 0;

  for (let player of roster) {
    ensurePlayerEnergy(player);
    total += Number(player.energy || 100);
  }

  return Math.round(total / roster.length);
}

function getLowestTeamEnergy(teamId) {
  const roster = getRosterByTeamId(teamId) || [];

  if (!roster.length) return 100;

  let lowest = 100;

  for (let player of roster) {
    ensurePlayerEnergy(player);
    lowest = Math.min(lowest, Number(player.energy || 100));
  }

  return Math.round(lowest);
}

function calculateTeamHealthScore(teamId) {
  const roster = getRosterByTeamId(teamId) || [];

  if (!roster.length) return 100;

  const averageEnergy = getAverageTeamEnergy(teamId);
  const injuredCount = getInjuredPlayersByTeamId(teamId).length;
  const lowEnergyCount = roster.filter(player => {
    ensurePlayerEnergy(player);
    return Number(player.energy || 100) < 70;
  }).length;

  const score = averageEnergy - injuredCount * 6 - lowEnergyCount * 2;

  return clamp(Math.round(score), 0, 100);
}

function displayInjuryReport() {
  if (!gameState || !gameState.started) return;

  ensureAllPlayerEnergy();
  ensureAllPlayerInjuryFields();

  const teamId = gameState.selectedTeamId;
  const roster = getRosterByTeamId(teamId) || [];

  const injuryRows = roster.map(player => {
    ensurePlayerEnergy(player);
    ensurePlayerInjuryFields(player);

    return {
      player,
      data: getSimpleInjuryPlayerData(player)
    };
  });

  const healthyCount = injuryRows.filter(row => row.data.statusKey === "healthy").length;
  const limitedCount = injuryRows.filter(row => {
    return row.data.statusKey === "limited" || row.data.statusKey === "day";
  }).length;
  const outCount = injuryRows.filter(row => row.data.statusKey === "out").length;
  const teamRisk = getSimpleTeamInjuryRisk(injuryRows);

  setText("simple-injury-healthy-count", healthyCount);
  setText("simple-injury-limited-count", limitedCount);
  setText("simple-injury-out-count", outCount);
  setText("simple-injury-team-risk", teamRisk);

  const tableBody = document.getElementById("simple-injury-table-body");

  if (tableBody) {
    const sortedRows = injuryRows.sort((a, b) => {
      return getSimpleInjurySortValue(a.data.statusKey) - getSimpleInjurySortValue(b.data.statusKey);
    });

    tableBody.innerHTML = sortedRows.length
      ? sortedRows.map(row => renderSimpleInjuryTableRow(row.player, row.data)).join("")
      : `
        <tr>
          <td colspan="5">No players found on this roster.</td>
        </tr>
      `;
  }

  renderSimpleInjuryNotes(injuryRows, teamRisk);
}

function getSimpleInjuryPlayerData(player) {
  const energy = Math.round(Number(player.energy || 100));

  const injuryName = player.injuryName ||
    player.injury ||
    player.injuryType ||
    "Injury";

  const daysRemaining = Number(
    player.injuryDaysRemaining ||
    player.daysRemaining ||
    player.daysOut ||
    player.returnDays ||
    0
  );

  if (player.isInjured) {
    if (daysRemaining > 7) {
      return {
        statusKey: "out",
        statusLabel: "Out",
        issueText: injuryName,
        returnText: `${daysRemaining} days`,
        recommendation: "No practice"
      };
    }

    return {
      statusKey: "day",
      statusLabel: "Day-to-Day",
      issueText: injuryName,
      returnText: daysRemaining > 0 ? `${daysRemaining} days` : "TBD",
      recommendation: "Rest / Light"
    };
  }

  if (energy < 70) {
    return {
      statusKey: "limited",
      statusLabel: "Limited",
      issueText: `Energy ${energy}`,
      returnText: "—",
      recommendation: "Light practice"
    };
  }

  return {
    statusKey: "healthy",
    statusLabel: "Healthy",
    issueText: `Energy ${energy}`,
    returnText: "—",
    recommendation: "Normal"
  };
}

function getSimpleInjurySortValue(statusKey) {
  const sortValues = {
    out: 1,
    day: 2,
    limited: 3,
    healthy: 4
  };

  return sortValues[statusKey] || 99;
}

function renderSimpleInjuryTableRow(player, data) {
  const playerId = player.id || player.playerId;

  return `
    <tr>
      <td>
        <button
          type="button"
          class="simple-injury-player-button"
          onclick="openPlayerProfile('${playerId}')"
        >
          ${escapeLeagueRosterText(player.name)}
        </button>
      </td>

      <td>
        <span class="simple-injury-status simple-injury-status-${data.statusKey}">
          ${data.statusLabel}
        </span>
      </td>

      <td>${escapeLeagueRosterText(data.issueText)}</td>
      <td>${data.returnText}</td>
      <td>${data.recommendation}</td>
    </tr>
  `;
}

function getSimpleTeamInjuryRisk(injuryRows) {
  const outCount = injuryRows.filter(row => row.data.statusKey === "out").length;
  const limitedCount = injuryRows.filter(row => {
    return row.data.statusKey === "limited" || row.data.statusKey === "day";
  }).length;

  if (outCount >= 2 || limitedCount >= 5) {
    return "High";
  }

  if (outCount >= 1 || limitedCount >= 2) {
    return "Medium";
  }

  return "Low";
}

function renderSimpleInjuryNotes(injuryRows, teamRisk) {
  const list = document.getElementById("simple-injury-notes-list");
  if (!list) return;

  const outCount = injuryRows.filter(row => row.data.statusKey === "out").length;
  const dayCount = injuryRows.filter(row => row.data.statusKey === "day").length;
  const lowEnergyCount = injuryRows.filter(row => row.data.statusKey === "limited").length;

  const notes = [];

  if (outCount === 0 && dayCount === 0 && lowEnergyCount === 0) {
    notes.push("Roster health is stable. No players need special attention right now.");
  }

  if (outCount > 0) {
    notes.push(`${outCount} player${outCount === 1 ? "" : "s"} should be held out of practice and games.`);
  }

  if (dayCount > 0) {
    notes.push(`${dayCount} player${dayCount === 1 ? "" : "s"} should be treated as day-to-day.`);
  }

  if (lowEnergyCount > 0) {
    notes.push(`${lowEnergyCount} player${lowEnergyCount === 1 ? "" : "s"} should avoid hard practice until energy improves.`);
  }

  if (teamRisk === "High") {
    notes.push("Team injury risk is high. Consider lighter practices and shorter rotations.");
  } else if (teamRisk === "Medium") {
    notes.push("Team injury risk is manageable, but a few players need workload control.");
  } else {
    notes.push("Team injury risk is low. Normal workload is safe for most players.");
  }

  list.innerHTML = notes.map(note => `<p>${note}</p>`).join("");
}

document.addEventListener("click", function(event) {
  const scoutRoot = document.getElementById(activeNextScoutContext?.rootId || "next-game-scout-root");

  if (!scoutRoot) return;

  const clickedInsideScoutCard = event.target.closest(".next-scout-player-card, .next-scout-bench-player");

  if (!clickedInsideScoutCard && activeNextScoutPlayerId) {
    activeNextScoutPlayerId = null;
    refreshActiveNextScoutContext();
  }
});

/* ======================================================
   GAMEPLAN IDENTITY BOARD
   Task 4
   Does not affect gameplay yet. Saves only team identity.
====================================================== */

const FCD_GAMEPLAN_IDENTITY_DEFAULTS = {
  offensiveStyle: "Balanced",
  tempo: "Balanced",
  offensiveRebounding: "Balanced",
  firstScoringOptionId: null,
  secondScoringOptionId: null,
  thirdScoringOptionId: null,

  defensiveStyle: "Balanced",
  defensiveAggression: "Balanced",
  defensiveRebounding: "Balanced",
  pickRollCoverage: "Drop Coverage",
  onBallCoverage: "Contain",
  offBallCoverage: "Stay Home"
};

const FCD_GAMEPLAN_FIELDS = [
  { key: "offensiveStyle", side: "offense", label: "Style", type: "option" },
  { key: "tempo", side: "offense", label: "Tempo", type: "option" },
  { key: "offensiveRebounding", side: "offense", label: "O Rebounding", type: "option" },
  { key: "firstScoringOptionId", side: "offense", label: "1st Scoring Option", type: "player" },
  { key: "secondScoringOptionId", side: "offense", label: "2nd Scoring Option", type: "player" },
  { key: "thirdScoringOptionId", side: "offense", label: "3rd Scoring Option", type: "player" },

  { key: "defensiveStyle", side: "defense", label: "Style", type: "option" },
  { key: "defensiveAggression", side: "defense", label: "Aggression", type: "option" },
  { key: "defensiveRebounding", side: "defense", label: "Defensive Rebounding", type: "option" },
  { key: "pickRollCoverage", side: "defense", label: "Pick & Roll Coverage", type: "option" },
  { key: "onBallCoverage", side: "defense", label: "On Ball Coverage", type: "option" },
  { key: "offBallCoverage", side: "defense", label: "Off Ball Coverage", type: "option" }
];

const FCD_GAMEPLAN_OPTIONS = {
  offensiveStyle: [
    {
      value: "Balanced",
      label: "Balanced",
      icon: "◎",
      description: "No strong offensive identity selected yet.",
      pros: [],
      cons: []
    },
    {
      value: "Five-Out Delay",
      label: "Five-Out Delay",
      icon: "5",
      description: "Clear paint, center playmaking from the perimeter.",
      pros: ["Creates driving lanes.", "Pulls rim protectors away from the basket.", "Good for skilled passing bigs."],
      cons: ["Needs a center who can pass and shoot.", "Can struggle on the offensive glass."]
    },
    {
      value: "Drive-and-Kick",
      label: "Drive-and-Kick",
      icon: "↗",
      description: "Playmaker collapses defense, kicks to corner shooters.",
      pros: ["Generates corner threes.", "Creates pressure at the rim.", "Works well with strong guards."],
      cons: ["Needs spacing around the ball.", "Can become turnover-heavy if the defense loads up."]
    },
    {
      value: "Efficiency Merchant",
      label: "Efficiency Merchant",
      icon: "%",
      description: "Analytical focus on three-pointers and layups.",
      pros: ["Prioritizes efficient shots.", "Limits low-value midrange attempts.", "Fits modern spacing."],
      cons: ["Can become predictable.", "May ignore good midrange creators."]
    },
    {
      value: "Heliocentric Isolation",
      label: "Heliocentric Isolation",
      icon: "★",
      description: "Single superstar handles everything, hunts mismatches.",
      pros: ["Maximizes your best creator.", "Good late-clock offense.", "Easy role clarity."],
      cons: ["Can tire out your star.", "Offense may stall when the star sits.", "Teammates can become less involved."]
    },
    {
      value: "Spread Pick-and-Roll",
      label: "Spread Pick-and-Roll",
      icon: "PnR",
      description: "Ball screens up top with shooters spacing floor.",
      pros: ["Creates simple advantages.", "Good for guard-big duos.", "Forces defensive rotations."],
      cons: ["Can struggle against switching defenses.", "Needs good screeners and shooters."]
    },
    {
      value: "Rim-Attacking",
      label: "Rim-Attacking",
      icon: "▾",
      description: "Physical drives and direct paint punishment.",
      pros: ["Creates free throws.", "Pressures weak interior defenders.", "Can get opponents in foul trouble."],
      cons: ["Spacing can get cramped.", "Physical style can drain energy."]
    },
    {
      value: "Up-Tempo Transition",
      label: "Up-Tempo Transition",
      icon: "⚡",
      description: "Fast-break running before defense sets up.",
      pros: ["High transition pressure.", "Creates easy points.", "Punishes slow teams."],
      cons: ["Players get tired more often.", "Can lead to rushed shots and turnovers."]
    },
    {
      value: "High-Post Anchor",
      label: "High-Post Anchor",
      icon: "⌂",
      description: "Playmaking center orchestrating from the elbow.",
      pros: ["Good for smart passing bigs.", "Creates cutters and split actions.", "Can slow the game down with control."],
      cons: ["Needs off-ball movement.", "Can be too slow without shooting."]
    }
  ],

  tempo: [
    {
      value: "Slow",
      label: "Slow",
      icon: "🐢",
      description: "Control possessions and limit chaos.",
      pros: ["Limits turnovers.", "Helps older teams conserve energy."],
      cons: ["Fewer easy transition points.", "Bad starts can feel harder to erase."]
    },
    {
      value: "Balanced",
      label: "Balanced",
      icon: "◎",
      description: "Mix transition chances with half-court control.",
      pros: [],
      cons: []
    },
    {
      value: "Fast",
      label: "Fast",
      icon: "↟",
      description: "Push the ball when possible.",
      pros: ["Creates transition chances.", "Can boost scoring volume."],
      cons: ["Players get tired faster.", "Can create sloppy possessions."]
    },
    {
      value: "Run and Gun",
      label: "Run and Gun",
      icon: "⚡",
      description: "Attack before the defense is set every chance.",
      pros: ["Extreme transition pressure.", "Great for athletic teams."],
      cons: ["Major fatigue risk.", "Can hurt defensive balance."]
    }
  ],

  offensiveRebounding: [
    {
      value: "Get Back on Defense",
      label: "Get Back on Defense",
      icon: "↩",
      description: "Prioritize transition defense over second chances.",
      pros: ["Better fast-break prevention.", "Keeps defensive shape."],
      cons: ["Fewer second-chance points."]
    },
    {
      value: "Balanced",
      label: "Balanced",
      icon: "◎",
      description: "Crash selectively without overcommitting.",
      pros: [],
      cons: []
    },
    {
      value: "Crash Glass",
      label: "Crash Glass",
      icon: "▰",
      description: "Send extra players after offensive rebounds.",
      pros: ["More second-chance opportunities.", "Physical identity."],
      cons: ["More vulnerable to transition."]
    },
    {
      value: "All-In Offensive Boards",
      label: "All-In Offensive Boards",
      icon: "▣",
      description: "Attack the glass aggressively after every shot.",
      pros: ["Maximum offensive rebound pressure.", "Can wear down smaller teams."],
      cons: ["Huge transition defense risk.", "Can tire out bigs and wings."]
    }
  ],

  defensiveStyle: [
    {
      value: "Balanced",
      label: "Balanced",
      icon: "◎",
      description: "Standard team defense with no extreme identity.",
      pros: [],
      cons: []
    },
    {
      value: "Switch Everything",
      label: "Switch Everything",
      icon: "↔",
      description: "Switch screens and keep the ball in front.",
      pros: ["Reduces open pick-and-roll looks.", "Great for versatile defenders."],
      cons: ["Can create post mismatches.", "Needs similar-sized defenders."]
    },
    {
      value: "Protect the Paint",
      label: "Protect the Paint",
      icon: "▾",
      description: "Load up inside and force tougher outside shots.",
      pros: ["Limits layups and dunks.", "Helps shot blockers."],
      cons: ["Can allow more threes."]
    },
    {
      value: "Perimeter Pressure",
      label: "Perimeter Pressure",
      icon: "◉",
      description: "Pressure guards and shooters outside.",
      pros: ["Can force turnovers.", "Disrupts ball handlers."],
      cons: ["Can allow back cuts and fouls."]
    },
    {
      value: "Zone Heavy",
      label: "Zone Heavy",
      icon: "▥",
      description: "Use zone looks to protect weak defenders.",
      pros: ["Can hide poor individual defenders.", "Can confuse opponents."],
      cons: ["Weak rebounding structure.", "Can give up open threes."]
    },
    {
      value: "Fast Break Prevention",
      label: "Fast Break Prevention",
      icon: "⛔",
      description: "Protect against transition first.",
      pros: ["Limits easy opponent points.", "Keeps defense organized."],
      cons: ["Less aggressive offensive rebounding."]
    }
  ],

  defensiveAggression: [
    {
      value: "Conservative",
      label: "Conservative",
      icon: "◌",
      description: "Stay solid and avoid risky plays.",
      pros: ["Lower foul risk.", "More stable defense."],
      cons: ["Fewer steals and chaos plays."]
    },
    {
      value: "Balanced",
      label: "Balanced",
      icon: "◎",
      description: "Normal defensive pressure.",
      pros: [],
      cons: []
    },
    {
      value: "Aggressive",
      label: "Aggressive",
      icon: "!",
      description: "Pressure the ball and attack passing lanes.",
      pros: ["More turnover chances.", "Can speed opponents up."],
      cons: ["Higher foul risk.", "Can give up easy looks if beaten."]
    },
    {
      value: "Chaos / High Risk",
      label: "Chaos / High Risk",
      icon: "⚠",
      description: "Trap, gamble, and force the issue.",
      pros: ["Can flip games quickly.", "Creates high-pressure possessions."],
      cons: ["Major foul and fatigue risk.", "Can collapse if rotations are late."]
    }
  ],

  defensiveRebounding: [
    {
      value: "Leak Out",
      label: "Leak Out",
      icon: "↟",
      description: "Release early to create transition chances.",
      pros: ["More fast-break chances.", "Helps quick wings."],
      cons: ["Worse defensive rebounding."]
    },
    {
      value: "Balanced",
      label: "Balanced",
      icon: "◎",
      description: "Normal defensive rebounding rules.",
      pros: [],
      cons: []
    },
    {
      value: "Crash Defensive Glass",
      label: "Crash Defensive Glass",
      icon: "▰",
      description: "Prioritize ending possessions cleanly.",
      pros: ["Fewer second-chance points allowed.", "Better board control."],
      cons: ["Slightly fewer leak-out chances."]
    },
    {
      value: "Send Everyone to Boards",
      label: "Send Everyone to Boards",
      icon: "▣",
      description: "All five players help finish possessions.",
      pros: ["Maximum defensive rebounding focus."],
      cons: ["Slower transition offense."]
    }
  ],

  pickRollCoverage: [
    {
      value: "Drop Coverage",
      label: "Drop Coverage",
      icon: "↓",
      description: "Big drops back to protect the rim.",
      pros: ["Protects the paint.", "Good for slower rim protectors."],
      cons: ["Can allow pull-up jumpers."]
    },
    {
      value: "Switch",
      label: "Switch",
      icon: "↔",
      description: "Switch the ball screen.",
      pros: ["Keeps actions simple.", "Can shut down pull-up guards."],
      cons: ["Creates mismatch risk."]
    },
    {
      value: "Hedge",
      label: "Hedge",
      icon: "⇢",
      description: "Big steps out to slow the ball handler.",
      pros: ["Disrupts rhythm.", "Can buy guards time to recover."],
      cons: ["Requires smart rotations behind it."]
    },
    {
      value: "Blitz",
      label: "Blitz",
      icon: "‼",
      description: "Trap the ball handler hard.",
      pros: ["Forces the ball out of stars' hands.", "Can create turnovers."],
      cons: ["High rotation stress.", "Open shots if the trap fails."]
    },
    {
      value: "Ice",
      label: "Ice",
      icon: "▐",
      description: "Force side pick-and-rolls away from the middle.",
      pros: ["Keeps ball out of dangerous areas.", "Strong sideline control."],
      cons: ["Needs disciplined guards."]
    },
    {
      value: "Go Under",
      label: "Go Under",
      icon: "↧",
      description: "Defender goes under the screen.",
      pros: ["Protects against drives.", "Good against poor shooters."],
      cons: ["Gives up pull-up threes."]
    },
    {
      value: "Fight Over",
      label: "Fight Over",
      icon: "↥",
      description: "Defender chases over the screen.",
      pros: ["Takes away pull-up threes.", "Keeps pressure on shooters."],
      cons: ["Can expose the big if beaten."]
    }
  ],

  onBallCoverage: [
    {
      value: "Contain",
      label: "Contain",
      icon: "○",
      description: "Stay in front and keep the ball under control.",
      pros: ["Stable one-on-one defense.", "Lower foul risk."],
      cons: ["Less turnover pressure."]
    },
    {
      value: "Pressure Ball",
      label: "Pressure Ball",
      icon: "◉",
      description: "Crowd ball handlers and make them uncomfortable.",
      pros: ["Can force mistakes.", "Sets a physical tone."],
      cons: ["Can give up drives if beaten."]
    },
    {
      value: "Force Baseline",
      label: "Force Baseline",
      icon: "↘",
      description: "Push drivers toward the sideline and help.",
      pros: ["Uses the sideline as help.", "Can funnel into rim protection."],
      cons: ["Bad help timing creates corner threes."]
    },
    {
      value: "Force Middle",
      label: "Force Middle",
      icon: "↙",
      description: "Send ball handlers toward loaded middle help.",
      pros: ["Can protect corners.", "Good with strong interior help."],
      cons: ["Risky without rim protection."]
    },
    {
      value: "Switch Matchups",
      label: "Switch Matchups",
      icon: "⇄",
      description: "Change matchups often to protect weak links.",
      pros: ["Can hide weaker defenders.", "Flexible game-to-game."],
      cons: ["Can confuse assignments."]
    }
  ],

  offBallCoverage: [
    {
      value: "Stay Home",
      label: "Stay Home",
      icon: "⌂",
      description: "Stick to shooters and limit help.",
      pros: ["Limits open threes.", "Good against shooting teams."],
      cons: ["Less rim help."]
    },
    {
      value: "Help Heavy",
      label: "Help Heavy",
      icon: "+",
      description: "Collapse to help on drives.",
      pros: ["Protects the paint.", "Can erase weak on-ball defense."],
      cons: ["Can give up kick-out threes."]
    },
    {
      value: "Deny Shooters",
      label: "Deny Shooters",
      icon: "✕",
      description: "Top-lock and deny off-ball shooting threats.",
      pros: ["Disrupts elite shooters.", "Can take away set plays."],
      cons: ["Back-cut risk."]
    },
    {
      value: "Pack Paint",
      label: "Pack Paint",
      icon: "▾",
      description: "Shrink the floor and dare jumpers.",
      pros: ["Strong paint protection.", "Good against poor shooting teams."],
      cons: ["Can be punished by spacing."]
    },
    {
      value: "Switch Off-Ball",
      label: "Switch Off-Ball",
      icon: "↔",
      description: "Switch off-ball screens and movement.",
      pros: ["Limits clean cuts and flare screens."],
      cons: ["Can create mismatches away from the ball."]
    }
  ]
};

function escapeGameplanIdentityHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeGameplanIdentityAttr(value) {
  return escapeGameplanIdentityHtml(value).replaceAll("`", "&#096;");
}

function ensureGameplanIdentityState() {
  if (!gameState) return null;

  if (!gameState.gameplan) {
    gameState.gameplan = {};
  }

  if (gameState.gameplan.offensiveStyle === "Mismatch Post-Ups") {
    gameState.gameplan.offensiveStyle = "Balanced";
  }

  // Clean up old placeholder scoring option text from the old dropdown system.
  ["firstScoringOptionId", "secondScoringOptionId", "thirdScoringOptionId"].forEach(key => {
    const value = gameState.gameplan[key];

    if (value === "Best Player" || value === "Balanced" || value === "") {
      gameState.gameplan[key] = null;
    }
  });

  return gameState.gameplan;
}

function getGameplanIdentityRoster() {
  if (!gameState || !gameState.selectedTeamId) return [];

  return getRosterByTeamId(gameState.selectedTeamId)
    .slice()
    .sort((a, b) => Number(b.currentAbility || b.overall || 0) - Number(a.currentAbility || a.overall || 0));
}

function getGameplanIdentityOption(settingKey, value) {
  const list = FCD_GAMEPLAN_OPTIONS[settingKey] || [];

  return list.find(option => option.value === value) || list[0] || null;
}

function getGameplanIdentityPlayerById(playerId) {
  if (!playerId) return null;

  return getGameplanIdentityRoster().find(player =>
    String(player.id || player.playerId) === String(playerId)
  ) || null;
}

function getGameplanIdentityFieldValue(field) {
  const gameplan = ensureGameplanIdentityState();

  if (!gameplan) return "Balanced";

  if (field.type === "player") {
    const player = getGameplanIdentityPlayerById(gameplan[field.key]);

    return player ? player.name : "Choose Player";
  }

  return gameplan[field.key] || "Balanced";
}

function getGameplanIdentityFieldSubtext(field) {
  const gameplan = ensureGameplanIdentityState();

  if (!gameplan) return "";

  if (field.type === "player") {
    const player = getGameplanIdentityPlayerById(gameplan[field.key]);

    if (!player) return "No scorer selected";

    return `${player.primaryPosition || player.position || "-"} · ${getGameplanIdentityPlayerPPG(player)}`;
  }

  const option = getGameplanIdentityOption(field.key, gameplan[field.key]);

  return option ? option.description : "";
}

function renderGameplanIdentityCard(field) {
  const value = getGameplanIdentityFieldValue(field);
  const subtext = getGameplanIdentityFieldSubtext(field);
  const option = field.type === "option"
    ? getGameplanIdentityOption(field.key, value)
    : null;

  const icon = option ? option.icon : "👤";

  return `
    <button
      type="button"
      class="identity-setting-card ${field.type === "player" ? "player-choice" : ""}"
      onclick="openGameplanIdentityPicker('${escapeGameplanIdentityAttr(field.key)}')"
    >
      <div class="identity-setting-top">
        <span>${escapeGameplanIdentityHtml(field.label)}</span>
        <strong>${escapeGameplanIdentityHtml(icon)}</strong>
      </div>

      <div class="identity-setting-value">
        ${escapeGameplanIdentityHtml(value)}
      </div>

      <p>${escapeGameplanIdentityHtml(subtext)}</p>
    </button>
  `;
}

function displayGameplanIdentityBoard() {
  const root = document.getElementById("gameplan-identity-root");

  if (!root || !gameState || !gameState.started) return;

  ensureGameplanIdentityState();

  const offenseFields = FCD_GAMEPLAN_FIELDS.filter(field => field.side === "offense");
  const defenseFields = FCD_GAMEPLAN_FIELDS.filter(field => field.side === "defense");

  root.innerHTML = `
    <div class="identity-gameplan-page">
      <div class="identity-main-grid">
        <section class="identity-panel offense">
          <div class="identity-panel-title">
            <span>Offense</span>
            <h3>Offensive Style</h3>
          </div>

          <div class="identity-setting-grid">
            ${offenseFields.map(renderGameplanIdentityCard).join("")}
          </div>
        </section>

        <section class="identity-panel defense">
          <div class="identity-panel-title">
            <span>Defense</span>
            <h3>Defensive Identity</h3>
          </div>

          <div class="identity-setting-grid">
            ${defenseFields.map(renderGameplanIdentityCard).join("")}
          </div>
        </section>
      </div>

      <section class="identity-pros-cons-section">
        ${renderGameplanProsCons()}
      </section>

      <section class="identity-grade-section">
        <div class="identity-section-heading">
          <span>Team Identity Grades</span>
          <h3>System Fit Preview</h3>
          <p>Grades use current team stats when available, plus the identity choices you selected.</p>
        </div>

        <div class="identity-grade-grid">
          ${renderGameplanIdentityGrades()}
        </div>
      </section>

      <section class="identity-future-room">
        <h3>Future Space</h3>
        <p>
          This area can later hold opponent-specific gameplans, coach influence, player fit warnings, or practice recommendations.
        </p>
      </section>
    </div>
  `;
}

function getGameplanSelectedOptionObjects() {
  const gameplan = ensureGameplanIdentityState();

  if (!gameplan) return [];

  const options = [];

  for (let field of FCD_GAMEPLAN_FIELDS) {
    if (field.type !== "option") continue;

    const value = gameplan[field.key];
    const option = getGameplanIdentityOption(field.key, value);

    if (option && option.value !== "Balanced") {
      options.push(option);
    }
  }

  return options;
}

function pushUniqueIdentityNote(map, text) {
  if (!text) return;

  map.set(text, (map.get(text) || 0) + 1);
}

function renderGameplanProsCons() {
  const gameplan = ensureGameplanIdentityState();
  const selectedOptions = getGameplanSelectedOptionObjects();

  const pros = new Map();
  const cons = new Map();

  selectedOptions.forEach(option => {
    (option.pros || []).forEach(text => pushUniqueIdentityNote(pros, text));
    (option.cons || []).forEach(text => pushUniqueIdentityNote(cons, text));
  });

  const selectedScorers = [
    gameplan.firstScoringOptionId,
    gameplan.secondScoringOptionId,
    gameplan.thirdScoringOptionId
  ].filter(Boolean);

  if (selectedScorers.length > 0) {
    pushUniqueIdentityNote(pros, "Your scoring hierarchy is clearly defined.");
  }

  if (selectedScorers.length === 1) {
    pushUniqueIdentityNote(cons, "Only one scorer is prioritized, so the offense may become predictable.");
  }

  if (pros.size === 0 && cons.size === 0) {
    return `
      <div class="identity-pros-cons-card balanced">
        <div class="identity-balanced-message">
          <span>Balanced</span>
          <h3>No strong tactical identity selected yet</h3>
          <p>
            Choose one offensive or defensive tactic to generate pros and cons for your team identity.
          </p>
        </div>
      </div>
    `;
  }

  return `
    <div class="identity-pros-cons-card">
      <div class="identity-pros-column">
        <h3>Pros</h3>
        <ul>
          ${Array.from(pros.entries()).map(([text, count]) => `
            <li>${escapeGameplanIdentityHtml(text)}${count > 1 ? ` <strong>Major strength</strong>` : ""}</li>
          `).join("") || `<li>No major strengths from current selections.</li>`}
        </ul>
      </div>

      <div class="identity-cons-column">
        <h3>Cons</h3>
        <ul>
          ${Array.from(cons.entries()).map(([text, count]) => `
            <li>${escapeGameplanIdentityHtml(text)}${count > 1 ? ` <strong>Major warning</strong>` : ""}</li>
          `).join("") || `<li>No major weaknesses from current selections.</li>`}
        </ul>
      </div>
    </div>
  `;
}

function openGameplanIdentityPicker(settingKey) {
  const field = FCD_GAMEPLAN_FIELDS.find(item => item.key === settingKey);

  if (!field) return;

  if (field.type === "player") {
    openGameplanPlayerPicker(settingKey, field);
  } else {
    openGameplanOptionPicker(settingKey, field);
  }
}

function getGameplanIdentityOverlay() {
  let overlay = document.getElementById("gameplan-identity-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "gameplan-identity-overlay";
    overlay.className = "gameplan-identity-overlay hidden";
    document.body.appendChild(overlay);
  }

  return overlay;
}

function closeGameplanIdentityPicker() {
  const overlay = document.getElementById("gameplan-identity-overlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }
}

function openGameplanOptionPicker(settingKey, field) {
  const gameplan = ensureGameplanIdentityState();
  const overlay = getGameplanIdentityOverlay();
  const options = FCD_GAMEPLAN_OPTIONS[settingKey] || [];
  const currentValue = gameplan[settingKey];

  overlay.innerHTML = `
    <div class="identity-picker-panel">
      <div class="identity-picker-header">
        <div>
          <span>${escapeGameplanIdentityHtml(field.side)}</span>
          <h2>${escapeGameplanIdentityHtml(field.label)}</h2>
          <p>Select how this part of your team identity should operate.</p>
        </div>

        <button type="button" onclick="closeGameplanIdentityPicker()">×</button>
      </div>

      <div class="identity-option-card-grid">
        ${options.map(option => `
          <button
            type="button"
            class="identity-option-card ${option.value === currentValue ? "active" : ""}"
            onclick="selectGameplanIdentityOption('${escapeGameplanIdentityAttr(settingKey)}', '${escapeGameplanIdentityAttr(option.value)}')"
          >
            <div class="identity-option-icon">${escapeGameplanIdentityHtml(option.icon)}</div>
            <strong>${escapeGameplanIdentityHtml(option.label)}</strong>
            <p>${escapeGameplanIdentityHtml(option.description)}</p>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  overlay.classList.remove("hidden");
}

function getSelectedScoringOptionIds(exceptKey = null) {
  const gameplan = ensureGameplanIdentityState();

  return [
    ["firstScoringOptionId", gameplan.firstScoringOptionId],
    ["secondScoringOptionId", gameplan.secondScoringOptionId],
    ["thirdScoringOptionId", gameplan.thirdScoringOptionId]
  ]
    .filter(([key, value]) => key !== exceptKey && value !== null && value !== undefined)
    .map(([key, value]) => String(value));
}

function openGameplanPlayerPicker(settingKey, field) {
  const gameplan = ensureGameplanIdentityState();
  const overlay = getGameplanIdentityOverlay();
  const roster = getGameplanIdentityRoster();
  const unavailableIds = getSelectedScoringOptionIds(settingKey);
  const currentValue = gameplan[settingKey] ? String(gameplan[settingKey]) : null;

  overlay.innerHTML = `
    <div class="identity-picker-panel player-picker">
      <div class="identity-picker-header">
        <div>
          <span>Scoring Option</span>
          <h2>${escapeGameplanIdentityHtml(field.label)}</h2>
          <p>Choose a player. Players already selected for another scoring option are locked.</p>
        </div>

        <button type="button" onclick="closeGameplanIdentityPicker()">×</button>
      </div>

      <div class="identity-player-picker-list">
        ${roster.map(player => {
          const playerId = String(player.id || player.playerId);
          const isUnavailable = unavailableIds.includes(playerId);
          const isActive = currentValue === playerId;

          return `
            <button
              type="button"
              class="identity-player-choice ${isActive ? "active" : ""} ${isUnavailable ? "disabled" : ""}"
              ${isUnavailable ? "disabled" : `onclick="selectGameplanIdentityPlayer('${escapeGameplanIdentityAttr(settingKey)}', '${escapeGameplanIdentityAttr(playerId)}')"` }
            >
              <div class="identity-player-face">
                ${renderGameplanIdentityPlayerFace(player)}
              </div>

              <div class="identity-player-info">
                <strong>${escapeGameplanIdentityHtml(player.name)}</strong>
                <span>${escapeGameplanIdentityHtml(player.primaryPosition || player.position || "-")} · ${getGameplanIdentityPlayerPPG(player)}</span>
              </div>

              <div class="identity-player-lock">
                ${isUnavailable ? "Locked" : isActive ? "Selected" : "Choose"}
              </div>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;

  overlay.classList.remove("hidden");
}

function renderGameplanIdentityPlayerFace(player) {
  const imagePath = typeof getPlayerPortraitPath === "function"
    ? getPlayerPortraitPath(player)
    : (player.portrait || player.image || player.imagePath || player.photo || player.photoPath || player.headshot || "");

  if (imagePath) {
    return `<img src="${escapeGameplanIdentityAttr(imagePath)}" alt="${escapeGameplanIdentityAttr(player.name || "Player")}" onerror="this.remove();">`;
  }

  return `
    <div class="identity-player-silhouette">
      <div></div>
      <span></span>
    </div>
  `;
}

function selectGameplanIdentityOption(settingKey, value) {
  const gameplan = ensureGameplanIdentityState();

  if (!gameplan) return;

  gameplan[settingKey] = value;

  closeGameplanIdentityPicker();
  displayGameplanIdentityBoard();
}

function selectGameplanIdentityPlayer(settingKey, playerId) {
  const gameplan = ensureGameplanIdentityState();

  if (!gameplan) return;

  const unavailableIds = getSelectedScoringOptionIds(settingKey);

  if (unavailableIds.includes(String(playerId))) {
    return;
  }

  gameplan[settingKey] = String(playerId);

  closeGameplanIdentityPicker();
  displayGameplanIdentityBoard();
}

function getGameplanTeamStatNumber(teamStats, keys) {
  for (let key of keys) {
    if (teamStats && teamStats[key] !== undefined && teamStats[key] !== null) {
      return Number(teamStats[key] || 0);
    }
  }

  return 0;
}

function getGameplanSelectedTeamStatContext() {
  const teamId = gameState.selectedTeamId;
  const teamStats = gameState.teamStats && gameState.teamStats[teamId]
    ? gameState.teamStats[teamId]
    : {};

  const games = Number(teamStats.games || 0);
  const safeGames = Math.max(1, games);

  const pointsFor = getGameplanTeamStatNumber(teamStats, ["pointsFor", "points", "pts"]);
  const pointsAgainst = getGameplanTeamStatNumber(teamStats, ["pointsAgainst", "opponentPoints", "oppPoints"]);
  const rebounds = getGameplanTeamStatNumber(teamStats, ["rebounds", "totalRebounds"]);
  const assists = getGameplanTeamStatNumber(teamStats, ["assists"]);
  const steals = getGameplanTeamStatNumber(teamStats, ["steals"]);
  const blocks = getGameplanTeamStatNumber(teamStats, ["blocks"]);
  const turnovers = getGameplanTeamStatNumber(teamStats, ["turnovers"]);

  const threesMade = getGameplanTeamStatNumber(teamStats, ["threePointersMade", "threesMade", "threeMade"]);
  const threesAttempted = getGameplanTeamStatNumber(teamStats, ["threePointersAttempted", "threesAttempted", "threeAttempted"]);

  return {
    games,
    ppg: games ? pointsFor / safeGames : 0,
    oppPpg: games ? pointsAgainst / safeGames : 0,
    rpg: games ? rebounds / safeGames : 0,
    apg: games ? assists / safeGames : 0,
    spg: games ? steals / safeGames : 0,
    bpg: games ? blocks / safeGames : 0,
    tpg: games ? turnovers / safeGames : 0,
    threePct: threesAttempted ? (threesMade / threesAttempted) * 100 : 0
  };
}

function getGameplanOptionBonus(value, bonusMap) {
  return Number(bonusMap[value] || 0);
}

function getGameplanIdentityGradeScores() {
  const gameplan = ensureGameplanIdentityState();
  const stats = getGameplanSelectedTeamStatContext();
  const hasGames = stats.games > 0;

  let offense = hasGames ? 62 + (stats.ppg - 108) * 1.2 + stats.apg * 0.8 : 72;
  let defense = hasGames ? 72 + (112 - stats.oppPpg) * 1.3 + stats.spg * 1.8 + stats.bpg * 1.7 : 72;
  let pace = 70;
  let shooting = hasGames ? 55 + stats.threePct * 1.1 : 70;
  let rebounding = hasGames ? 58 + stats.rpg * 0.7 : 70;
  let discipline = hasGames ? 78 - stats.tpg * 1.4 : 76;

  offense += getGameplanOptionBonus(gameplan.offensiveStyle, {
    "Five-Out Delay": 4,
    "Drive-and-Kick": 5,
    "Efficiency Merchant": 6,
    "Heliocentric Isolation": 3,
    "Spread Pick-and-Roll": 5,
    "Rim-Attacking": 4,
    "Up-Tempo Transition": 3,
    "High-Post Anchor": 3,
  });

  defense += getGameplanOptionBonus(gameplan.defensiveStyle, {
    "Switch Everything": 4,
    "Protect the Paint": 5,
    "Perimeter Pressure": 4,
    "Zone Heavy": 2,
    "Fast Break Prevention": 3
  });

  pace += getGameplanOptionBonus(gameplan.tempo, {
    Slow: -12,
    Balanced: 0,
    Fast: 10,
    "Run and Gun": 18
  });

  shooting += getGameplanOptionBonus(gameplan.offensiveStyle, {
    "Five-Out Delay": 5,
    "Drive-and-Kick": 6,
    "Efficiency Merchant": 8,
    "Spread Pick-and-Roll": 5,
    "Up-Tempo Transition": 2
  });

  rebounding += getGameplanOptionBonus(gameplan.offensiveRebounding, {
    "Get Back on Defense": -5,
    Balanced: 0,
    "Crash Glass": 7,
    "All-In Offensive Boards": 12
  });

  rebounding += getGameplanOptionBonus(gameplan.defensiveRebounding, {
    "Leak Out": -6,
    Balanced: 0,
    "Crash Defensive Glass": 7,
    "Send Everyone to Boards": 12
  });

  discipline += getGameplanOptionBonus(gameplan.defensiveAggression, {
    Conservative: 8,
    Balanced: 0,
    Aggressive: -6,
    "Chaos / High Risk": -14
  });

  discipline += getGameplanOptionBonus(gameplan.tempo, {
    Slow: 5,
    Balanced: 0,
    Fast: -4,
    "Run and Gun": -10
  });

  return [
    { label: "Offense", score: offense },
    { label: "Defense", score: defense },
    { label: "Pace", score: pace },
    { label: "Shooting", score: shooting },
    { label: "Rebounding", score: rebounding },
    { label: "Discipline", score: discipline }
  ];
}

function getGameplanIdentityGrade(score) {
  const value = clamp(Math.round(score), 0, 100);

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

function getGameplanGradeColor(score) {
  const value = clamp(Number(score || 0), 0, 100);

  if (value >= 90) return "#22c55e";
  if (value >= 80) return "#84cc16";
  if (value >= 70) return "#facc15";
  if (value >= 60) return "#fb923c";
  return "#ef4444";
}

function renderGameplanIdentityGrades() {
  const grades = getGameplanIdentityGradeScores();

  return grades.map(item => {
    const score = clamp(Math.round(item.score), 0, 100);
    const grade = getGameplanIdentityGrade(score);
    const color = getGameplanGradeColor(score);

    return `
      <div class="identity-grade-card" style="--identity-grade-color:${color};">
        <span>${escapeGameplanIdentityHtml(item.label)}</span>
        <strong>${grade}</strong>
        <div class="identity-grade-bar">
          <div style="width:${score}%;"></div>
        </div>
        <small>${score}/100</small>
      </div>
    `;
  }).join("");
}

/* Override the old dropdown-based displayGameplan.
   Rotation still lives on gameplan-screen.
   Team identity now lives on gameplan-identity-screen. */
function displayGameplan() {
  displayRotationBoard();
  displayNextGameScout();
  displayGameplanIdentityBoard();
  displayPlayerRolesBoard();
  displayOpponentPlansBoard();
}

function getGameplanIdentityPlayerPPG(player) {
  const stats = player && player.seasonStats ? player.seasonStats : null;
  const games = Number(stats?.games || 0);

  if (!games) return "0.0 PPG";

  const ppg = Number(stats.points || 0) / games;

  return `${ppg.toFixed(1)} PPG`;
}

function normalizeNextScoutColor(color, fallback) {
  if (!color) return fallback;

  const value = String(color).trim();

  if (value.startsWith("#")) return value;

  return fallback;
}

function isNextScoutLightColor(hex) {
  const clean = String(hex || "").replace("#", "");

  if (clean.length !== 6) return false;

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 190;
}

function getNextScoutOpponentColors(team) {
  const colors = typeof getTeamColors === "function"
    ? getTeamColors(team)
    : {};

  const primaryColor = normalizeNextScoutColor(
    colors.primaryColor ||
    colors.primary ||
    colors.mainColor ||
    team.primaryColor ||
    team.primary ||
    team.color,
    "#17408B"
  );

  let secondaryColor = normalizeNextScoutColor(
    colors.secondaryColor ||
    colors.secondary ||
    colors.accentColor ||
    team.secondaryColor ||
    team.secondary,
    "#C9082A"
  );

  // If the secondary color is white/light, it looks washed out in the header.
  // Use the primary instead so teams like Atlanta do not get a white pill.
  if (isNextScoutLightColor(secondaryColor)) {
    secondaryColor = primaryColor;
  }

  return {
    primaryColor,
    secondaryColor
  };
}

/* ======================================================
   NEXT GAME SCOUT COLORS FIX
   Guarantees opponent-colored scouting header
====================================================== */

var FCD_NEXT_SCOUT_TEAM_COLORS = {
  1: { primary: "#007A33", secondary: "#BA9653" },
  2: { primary: "#006BB6", secondary: "#F58426" },
  3: { primary: "#006BB6", secondary: "#ED174C" },
  4: { primary: "#000000", secondary: "#FFFFFF" },
  5: { primary: "#CE1141", secondary: "#000000" },

  6: { primary: "#CE1141", secondary: "#000000" },
  7: { primary: "#6F263D", secondary: "#FFB81C" },
  8: { primary: "#1D42BA", secondary: "#C8102E" },
  9: { primary: "#00471B", secondary: "#EEE1C6" },
  10: { primary: "#002D62", secondary: "#FDBB30" },

  11: { primary: "#98002E", secondary: "#F9A01B" },
  12: { primary: "#0077C0", secondary: "#C4CED4" },
  13: { primary: "#E03A3E", secondary: "#C1D32F" },
  14: { primary: "#1D1160", secondary: "#00788C" },
  15: { primary: "#002B5C", secondary: "#E31837" },

  16: { primary: "#552583", secondary: "#FDB927" },
  17: { primary: "#C8102E", secondary: "#1D428A" },
  18: { primary: "#1D428A", secondary: "#FFC72C" },
  19: { primary: "#5A2D81", secondary: "#63727A" },
  20: { primary: "#1D1160", secondary: "#E56020" },

  21: { primary: "#E03A3E", secondary: "#000000" },
  22: { primary: "#007AC1", secondary: "#EF3B24" },
  23: { primary: "#0E2240", secondary: "#FEC524" },
  24: { primary: "#002B5C", secondary: "#F9A01B" },
  25: { primary: "#0C2340", secondary: "#78BE20" },

  26: { primary: "#00538C", secondary: "#002B5E" },
  27: { primary: "#CE1141", secondary: "#000000" },
  28: { primary: "#C4CED4", secondary: "#000000" },
  29: { primary: "#5D76A9", secondary: "#12173F" },
  30: { primary: "#0C2340", secondary: "#C8102E" }
};

function cleanNextScoutHexColor(value, fallback) {
  if (!value) return fallback;

  const color = String(value).trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }

  return fallback;
}

function getNextScoutMappedColors(team) {
  if (!team) {
    return {
      primaryColor: "#2563eb",
      secondaryColor: "#22d3ee"
    };
  }

  const mapped = FCD_NEXT_SCOUT_TEAM_COLORS[Number(team.id)] || null;

  const primaryColor = cleanNextScoutHexColor(
    mapped?.primary ||
    team.primaryColor ||
    team.primary ||
    team.teamColor ||
    team.color ||
    team.colors?.primaryColor ||
    team.colors?.primary,
    "#2563eb"
  );

  let secondaryColor = cleanNextScoutHexColor(
    mapped?.secondary ||
    team.secondaryColor ||
    team.secondary ||
    team.accentColor ||
    team.colors?.secondaryColor ||
    team.colors?.secondary,
    "#22d3ee"
  );

  // If the secondary is white/silver, keep the header readable by using black.
  if (
    secondaryColor.toLowerCase() === "#ffffff" ||
    secondaryColor.toLowerCase() === "#f8fafc" ||
    secondaryColor.toLowerCase() === "#c4ced4"
  ) {
    secondaryColor = "#111827";
  }

  return {
    primaryColor,
    secondaryColor
  };
}
