const ROSTER_IMPORT_STORAGE_KEY = "fcdRosterImportPack";

function getDefaultRosterImportTemplate() {
  return {
    version: 1,
    packName: "Custom Roster Import",
    players: {},
    staff: {},
    teams: {},
    teamsByFictionalName: {
      "Boston Harbor": {
        "name": "",
        "image": ""
      },
      "New York Empire": {
        "name": "",
        "image": ""
      },
      "Philadelphia Liberty": {
        "name": "",
        "image": ""
      }
    }
  };
}

function getStoredRosterImportPack() {
  try {
    const raw = localStorage.getItem(ROSTER_IMPORT_STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") return null;

    return parsed;
  } catch (error) {
    console.warn("Could not read roster import pack:", error);
    return null;
  }
}

function saveRosterImportPack(pack) {
  localStorage.setItem(ROSTER_IMPORT_STORAGE_KEY, JSON.stringify(pack));
}

function clearRosterImportPack() {
  localStorage.removeItem(ROSTER_IMPORT_STORAGE_KEY);
}

function openRosterImportScreen() {
  const existingPack = getStoredRosterImportPack();
  const template = existingPack || getDefaultRosterImportTemplate();

  const existingOverlay = document.getElementById("roster-import-overlay");

  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "roster-import-overlay";
  overlay.className = "roster-import-overlay";

  overlay.innerHTML = `
    <div class="roster-import-modal">
      <div class="roster-import-header">
        <div>
          <h2>Load Rosters</h2>
          <p>Import custom player names, team names, player images, and team images.</p>
        </div>

        <button type="button" class="roster-import-close" onclick="closeRosterImportScreen()">×</button>
      </div>

      <div class="roster-import-info">
        <strong>Important:</strong>
        This import uses PlayerID and TeamID. The fictional database still stays underneath.
        Imported names/images are only display overrides.
      </div>

      <textarea id="roster-import-textarea" spellcheck="false">${JSON.stringify(template, null, 2)}</textarea>

      <div class="roster-import-actions">
        <button type="button" onclick="saveRosterImportFromTextarea()">Save Import Pack</button>
        <button type="button" onclick="applyRosterImportPackToCurrentSave()">Apply To Current Save</button>
        <button type="button" onclick="clearRosterImportAndRefresh()">Clear Import Pack</button>
        <button type="button" onclick="closeRosterImportScreen()">Close</button>
      </div>

      <p class="roster-import-note">
          Images are optional. Player images should use PlayerID paths like images/players/1001.png. Team images should use paths like images/teams/boston.png.
      </p>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeRosterImportScreen() {
  const overlay = document.getElementById("roster-import-overlay");

  if (overlay) {
    overlay.remove();
  }
}

function saveRosterImportFromTextarea() {
  const textarea = document.getElementById("roster-import-textarea");

  if (!textarea) return;

  try {
    const pack = JSON.parse(textarea.value);

    if (!pack || typeof pack !== "object") {
      alert("Invalid import pack.");
      return;
    }

    if (!pack.players) pack.players = {};
if (!pack.staff) pack.staff = {};
if (!pack.teams) pack.teams = {};
if (!pack.teamsByFictionalName) pack.teamsByFictionalName = {};

    saveRosterImportPack(pack);

    alert("Roster import pack saved. It will apply to future new saves.");
  } catch (error) {
    alert("Could not save import pack. Check that the JSON is valid.");
    console.error(error);
  }
}

function clearRosterImportAndRefresh() {
  if (!confirm("Clear the saved roster import pack?")) return;

  clearRosterImportPack();

  alert("Roster import pack cleared.");

  closeRosterImportScreen();
}
function applyRosterImportPackToPlayer(player, playerImport) {
  if (!player || !playerImport) return;

  if (playerImport.name) {
    player.name = playerImport.name;
    player.importedName = playerImport.name;
  }

  if (playerImport.faceImage) {
    player.faceImage = playerImport.faceImage;
  }

  if (playerImport.image) {
    player.faceImage = playerImport.image;
  }

  if (playerImport.portrait) {
    player.portrait = playerImport.portrait;
  }
}

function displayDashboardNextGameLogo() {
  const logoSpot = document.getElementById("dashboard-next-game-logo");

  if (!logoSpot) return;

  const opponent = getOpponentForNextUserGame();

  if (!opponent) {
    logoSpot.innerHTML = "";
    return;
  }

  logoSpot.innerHTML = getTeamLogoHTML(opponent, "team-logo-placeholder team-logo-large dashboard-next-logo");
}

function getOpponentForNextUserGame() {
  if (!gameState || !gameState.userSchedule) return null;

  const nextGame = typeof getNextGame === "function"
    ? getNextGame()
    : gameState.userSchedule.find(game => !game.played);

  if (!nextGame) return null;

  const opponent = getTeamById(nextGame.opponentId);

  return opponent || null;
}

function applyRosterImportPackToTeam(team, teamImport) {
  if (!team || !teamImport) return;

  if (!team.originalName) {
    team.originalName = team.name;
  }

  if (teamImport.name) {
    const importedName = normalizeImportedTeamName(teamImport.name);

    team.name = importedName;
    team.displayName = importedName;
    team.importedName = importedName;
  }

  if (teamImport.image) {
    team.image = teamImport.image;
    team.logoImage = teamImport.image;
  }

  if (teamImport.logoImage) {
    team.logoImage = teamImport.logoImage;
    team.image = teamImport.logoImage;
  }
  if (teamImport.arenaName) {
  team.arenaName = teamImport.arenaName;
}

if (teamImport.arenaCapacity !== undefined) {
  team.arenaCapacity = Number(teamImport.arenaCapacity);
}
}

function normalizeImportedTeamName(teamName) {
  return teamName;
}

function getTeamLogoHTML(team, className = "team-logo-placeholder") {
  if (!team) {
    return `<div class="${className} team-logo-empty">FCD</div>`;
  }

  const imagePath = team.logoImage || team.image || "";

  if (imagePath) {
    return `
      <div class="${className}">
        <img
          src="${imagePath}"
          alt="${team.name}"
          onerror="this.parentElement.classList.add('team-logo-empty'); this.remove();"
        />
      </div>
    `;
  }

  return `<div class="${className} team-logo-empty">${team.abbrev || "FCD"}</div>`;
}

function getImportTeamLookupNames(team) {
  if (!team) return [];

  const names = new Set();

  if (team.name) names.add(team.name);
  if (team.originalName) names.add(team.originalName);
  if (team.displayName) names.add(team.displayName);

  const aliasToDatabaseFictionalName = {
    "Boston Harbor": "Boston Harbor",
    "New York Empire": "New York Empire",
    "Philadelphia Liberty": "Philadelphia Liberty",
    "Brooklyn Bridges": "Brooklyn Bridges",
    "Toronto North": "Toronto North",

    "Chicago Wind": "Chicago Wind",
    "Cleveland Rockers": "Cleveland Rockers",
    "Detroit Engines": "Detroit Engines",
    "Milwaukee Stags": "Milwaukee Stags",
    "Indiana Racers": "Indiana Racers",

    "Miami Wave": "Miami Wave",
    "Orlando Stars": "Orlando Stars",
    "Atlanta Flight": "Atlanta Flight",
    "Charlotte Swarm": "Charlotte Swarm",
    "Washington Monuments": "Washington Monuments",

    "Oklahoma Storm": "Oklahoma Storm",
    "Denver Peaks": "Denver Peaks",
    "Minnesota Frost": "Minnesota Frost",
    "Portland Pioneers": "Portland Pioneers",
    "Utah Peaks": "Utah Peaks",

    "Los Angeles Legends": "Los Angeles Legends",
    "Los Angeles Surf": "Los Angeles Surf",
    "Golden State Guardians": "Golden State Guardians",
    "Sacramento Royals": "Sacramento Royals",
    "Phoenix Firebirds": "Phoenix Firebirds",

    "Dallas Wranglers": "Dallas Wranglers",
    "Houston Launch": "Houston Launch",
    "Memphis Blues": "Memphis Blues",
    "New Orleans Krewe": "New Orleans Krewe",
    "San Antonio Marshals": "San Antonio Marshals",

    // Old code names -> new database names
    "Brooklyn Boroughs": "Brooklyn Bridges",
    "Toronto Towers": "Toronto North",
    "Cleveland Forge": "Cleveland Rockers",
    "Detroit Motors": "Detroit Engines",
    "Milwaukee Northstars": "Milwaukee Stags",
    "Miami Tides": "Miami Wave",
    "Orlando Sparks": "Orlando Stars",
    "Charlotte Crowns": "Charlotte Swarm",
    "Capital District": "Washington Monuments",
    "Los Angeles Stars": "Los Angeles Legends",
    "LA Surf": "Los Angeles Surf",
    "Golden State Bay": "Golden State Guardians",
    "New Orleans Bayou": "New Orleans Krewe",
    "Oklahoma City Storm": "Oklahoma Storm",
    "Utah Range": "Utah Peaks"
  };

  for (let name of Array.from(names)) {
    const alias = aliasToDatabaseFictionalName[name];

    if (alias) {
      names.add(alias);
    }
  }

  return Array.from(names);
}

function applyRosterImportPack(pack) {
  if (!pack || !gameState) return;

  const playerImports = pack.players || {};
  const teamImportsById = pack.teams || {};
  const teamImportsByFictionalName = pack.teamsByFictionalName || {};

  let appliedTeams = 0;
  const unmatchedTeams = [];

  if (Array.isArray(gameState.teams)) {
    for (let team of gameState.teams) {
      const teamIdKey = String(team.id);
      let teamImport = teamImportsById[teamIdKey] || null;

      if (!teamImport) {
        const lookupNames = getImportTeamLookupNames(team);

        for (let lookupName of lookupNames) {
          if (teamImportsByFictionalName[lookupName]) {
            teamImport = teamImportsByFictionalName[lookupName];
            break;
          }
        }
      }

      if (teamImport) {
        applyRosterImportPackToTeam(team, teamImport);
        appliedTeams++;
      } else {
        unmatchedTeams.push(team.originalName || team.name);
      }
    }
  }

  const allPlayers = [
    ...Object.values(gameState.rosters || {}).flat(),
    ...(gameState.freeAgents || [])
  ];

  let appliedPlayers = 0;

  for (let player of allPlayers) {
    const playerImport =
      playerImports[String(player.playerId)] ||
      playerImports[String(player.id)];

    if (playerImport) {
      applyRosterImportPackToPlayer(player, playerImport);
      appliedPlayers++;
    }
  }

  refreshScheduleOpponentNamesFromTeams();

  console.log("Roster import applied:", {
    appliedPlayers,
    appliedTeams,
    unmatchedTeams
  });
}

function applyRosterImportPackToCurrentSave() {
  const textarea = document.getElementById("roster-import-textarea");

  if (!textarea) return;

  try {
    const pack = JSON.parse(textarea.value);

    saveRosterImportPack(pack);

    if (gameState && gameState.started && Array.isArray(gameState.teams) && gameState.teams.length > 0) {
  applyRosterImportPack(pack);
  refreshAll();
  alert("Roster import pack applied to the current save.");
} else {
  alert("Roster import pack saved. Start a new save or load a save to use it.");
}
  } catch (error) {
    alert("Could not apply import pack. Check that the JSON is valid.");
    console.error(error);
  }
}

function refreshScheduleOpponentNamesFromTeams() {
  if (!gameState || !Array.isArray(gameState.userSchedule)) return;

  for (let game of gameState.userSchedule) {
    if (!game || !game.opponentId) continue;

    const opponent = getTeamById(game.opponentId);

    if (opponent) {
      game.opponentName = opponent.name;
    }
  }
}
function normalizePlayerPortraitPath(imagePath) {
  const cleanPath = String(imagePath || "").trim();

  if (!cleanPath) return "";

  if (/^(https?:|data:|blob:|\/)/i.test(cleanPath)) {
    return cleanPath;
  }

  if (cleanPath.includes("/")) {
    return cleanPath;
  }

  return `images/players/${cleanPath}`;
}

function getPlayerPortraitPath(player) {
  if (!player) return "";

  return normalizePlayerPortraitPath(
    player.portrait ||
    player.faceImage ||
    player.image ||
    player.imagePath ||
    player.imageUrl ||
    player.photo ||
    player.photoPath ||
    player.headshot ||
    player.sourceImageUrl ||
    ""
  );
}

function escapePlayerFaceAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("`", "&#096;");
}

function getPlayerFaceHTML(player, className = "player-face-placeholder") {
  if (!player) {
    return `
      <div class="${className} player-silhouette">
        <div class="silhouette-head"></div>
        <div class="silhouette-body"></div>
      </div>
    `;
  }

  const imagePath = getPlayerPortraitPath(player);

  if (imagePath) {
    return `
      <div class="${className}">
        <img src="${escapePlayerFaceAttr(imagePath)}" alt="${escapePlayerFaceAttr(player.name || "Player")}" onerror="this.parentElement.classList.add('player-silhouette'); this.remove();" />
      </div>
    `;
  }

  return `
    <div class="${className} player-silhouette">
      <div class="silhouette-head"></div>
      <div class="silhouette-body"></div>
    </div>
  `;
}

function importCommunityRosterFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const rosterPack = JSON.parse(e.target.result);

      if (!validateCommunityRosterPack(rosterPack)) {
        alert("This roster file is not valid.");
        return;
      }

      localStorage.setItem("fullCourtDirectorRosterPack", JSON.stringify(rosterPack));

      if (gameState && gameState.started) {
  applyCommunityRosterPack(rosterPack);
  refreshAll();
}

      alert(`Roster loaded: ${rosterPack.packName || "Community Roster"}`);
    } catch (error) {
      console.error(error);
      alert("Could not read this roster file.");
    }
  };

  reader.readAsText(file);

  updateActiveRosterLabel();
}

(function installStartRosterPreviewUploadHook() {
  const originalImportCommunityRosterFile = window.importCommunityRosterFile;

  window.importCommunityRosterFile = function(event) {
    const file = event && event.target && event.target.files
      ? event.target.files[0]
      : null;

    if (file) {
      const reader = new FileReader();

      reader.onload = function(loadEvent) {
        try {
          const pack = JSON.parse(loadEvent.target.result);

          if (isUsableStartRosterPack(pack)) {
            setStartActiveRosterPack(pack);
          }
        } catch (error) {
          console.warn("Could not read roster pack for start screen preview:", error);
        }
      };

      reader.readAsText(file);
    }

    if (typeof originalImportCommunityRosterFile === "function") {
      return originalImportCommunityRosterFile.apply(this, arguments);
    }

    return null;
  };
})();

function validateCommunityRosterPack(pack) {
  if (!pack || typeof pack !== "object") return false;
  if (!pack.version) return false;

  const hasPlayers = pack.players && typeof pack.players === "object";
  const hasStaff = pack.staff && typeof pack.staff === "object";
  const hasTeams = pack.teams && typeof pack.teams === "object";
  const hasTeamsByFictionalName =
    pack.teamsByFictionalName &&
    typeof pack.teamsByFictionalName === "object";

  return hasPlayers || hasStaff || hasTeams || hasTeamsByFictionalName;
}

function openStartRosterPicker() {
  const input = document.getElementById("community-roster-file-input");
  if (input) input.click();
}

function updateActiveRosterLabel() {
  const label = document.getElementById("active-roster-label");
  if (!label) return;

  const savedPack = localStorage.getItem("fullCourtDirectorRosterPack");

  if (!savedPack) {
    label.textContent = "Active Roster: Default Fictional Roster";
    return;
  }

  try {
    const pack = JSON.parse(savedPack);
    label.textContent = `Active Roster: ${pack.packName || "Community Roster"}`;
  } catch {
    label.textContent = "Active Roster: Default Fictional Roster";
  }
}

function openRosterPickerPopup() {
  const existing = document.getElementById("roster-picker-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "roster-picker-overlay";
  overlay.className = "roster-picker-overlay";

  overlay.innerHTML = `
    <div class="roster-picker-modal">
      <div class="roster-picker-header">
        <h2>Roster Picker</h2>
        <button type="button" onclick="closeRosterPickerPopup()">Close</button>
      </div>

      <div class="roster-picker-grid">
        <button type="button" class="roster-picker-card active" onclick="useDefaultFictionalRoster()">
          <h3>Default Fictional Roster</h3>
          <p>Use the official fictional Full Court Director roster.</p>
        </button>

        <button type="button" class="roster-picker-card" onclick="openCommunityRosterUpload()">
          <h3>Upload Community Roster</h3>
          <p>Import a JSON roster file made by the community.</p>
        </button>

        <button type="button" class="roster-picker-card disabled">
          <h3>Community Browser</h3>
          <p>Browse shared rosters here later.</p>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeRosterPickerPopup() {
  const overlay = document.getElementById("roster-picker-overlay");
  if (overlay) overlay.remove();
}

function openCommunityRosterUpload() {
  const input = document.getElementById("community-roster-file-input");
  if (input) input.click();
}

function useDefaultFictionalRoster() {
  localStorage.removeItem("fullCourtDirectorRosterPack");
  localStorage.removeItem("savedRosterImportPack");
  localStorage.removeItem("rosterImportPack");
  localStorage.removeItem("activeRosterPack");

  updateActiveRosterLabel();
  closeRosterPickerPopup();

  alert("Default Fictional Roster selected. Start a new save for it to fully apply.");
}

function collectStaffObjectsFromValue(value, staffList, seenObjects) {
  if (!value || typeof value !== "object") return;

  if (seenObjects.has(value)) return;
  seenObjects.add(value);

  if (Array.isArray(value)) {
    value.forEach(item => collectStaffObjectsFromValue(item, staffList, seenObjects));
    return;
  }

  const possibleStaffId = value.staffId || value.id;
  const looksLikeStaff =
    typeof possibleStaffId === "string" &&
    possibleStaffId.startsWith("staff_");

  if (looksLikeStaff) {
    staffList.push(value);
  }

  Object.values(value).forEach(child => {
    if (child && typeof child === "object") {
      collectStaffObjectsFromValue(child, staffList, seenObjects);
    }
  });
}

function getAllStaffForRosterImport() {
  const staffList = [];
  const seenObjects = new Set();

  if (Array.isArray(window.fixedStaffDatabase)) {
    collectStaffObjectsFromValue(window.fixedStaffDatabase, staffList, seenObjects);
  }

  if (gameState && gameState.staff) {
    collectStaffObjectsFromValue(gameState.staff, staffList, seenObjects);
  }

  return staffList;
}

function applyCommunityStaffUpdates(staffUpdates) {
  if (!staffUpdates || typeof staffUpdates !== "object") return;

  const allStaff = getAllStaffForRosterImport();
  let appliedStaff = 0;
  const unmatchedStaff = [];

  for (const staffId in staffUpdates) {
    const update = staffUpdates[staffId];

    if (!update || typeof update !== "object") continue;

    const matches = allStaff.filter(staff =>
      String(staff.staffId || staff.id) === String(staffId)
    );

    if (!matches.length) {
      unmatchedStaff.push(staffId);
      continue;
    }

    matches.forEach(staff => {
      if (update.name) {
        staff.name = update.name;
        staff.importedName = update.name;

        if (staff.isVacant) {
          staff.isVacant = false;
        }

        if (staff.status === "Vacant") {
          staff.status = "Active";
        }
      }

      if (update.image) {
        staff.image = update.image;
        staff.imagePath = update.image;
      }

      if (update.imagePath) {
        staff.image = update.imagePath;
        staff.imagePath = update.imagePath;
      }

      if (update.personality) staff.personality = update.personality;
      if (update.offensiveSystem) staff.offensiveSystem = update.offensiveSystem;
      if (update.defensiveSystem) staff.defensiveSystem = update.defensiveSystem;
      if (update.pacePreference) staff.pacePreference = update.pacePreference;
      if (update.rotationStyle) staff.rotationStyle = update.rotationStyle;
      if (update.developmentStyle) staff.developmentStyle = update.developmentStyle;
    });

    appliedStaff += matches.length;
  }

  console.log("Community staff updates applied:", {
    appliedStaff,
    unmatchedStaff
  });
}

function applyCommunityRosterPack(pack) {
  if (!pack || !gameState) return;

  if (pack.teams) {
    applyCommunityTeamUpdates(pack.teams);
  }

  if (pack.teamsByFictionalName) {
    applyCommunityTeamUpdatesByFictionalName(pack.teamsByFictionalName);
  }

  if (pack.players) {
    applyCommunityPlayerUpdates(pack.players);
  }

  if (pack.staff) {
    applyCommunityStaffUpdates(pack.staff);
  }

  gameState.activeRosterPack = {
    packName: pack.packName || "Community Roster",
    version: pack.version || 1,
    createdBy: pack.createdBy || "Community"
  };

  console.log("Community roster pack applied:", gameState.activeRosterPack);
}

function applyCommunityTeamUpdates(teamUpdates) {
  for (const teamId in teamUpdates) {
    const update = teamUpdates[teamId];
    const team = getTeamById(teamId);

    if (!team || !update) continue;

    if (update.name) team.name = update.name;
    if (update.abbrev) team.abbrev = update.abbrev;
    if (update.logo) team.logo = update.logo;
    if (update.primaryColor) team.primaryColor = update.primaryColor;
    if (update.secondaryColor) team.secondaryColor = update.secondaryColor;
    if (update.arenaName) team.arenaName = update.arenaName;

    if (update.arenaCapacity !== undefined) {
      team.arenaCapacity = Number(update.arenaCapacity);
    }
  }
}

function applyCommunityPlayerUpdates(playerUpdates) {
  const allPlayers = getAllPlayersForRosterImport();

  for (const playerId in playerUpdates) {
    const update = playerUpdates[playerId];

    const player = allPlayers.find(p =>
      Number(p.id) === Number(playerId) ||
      Number(p.playerId) === Number(playerId)
    );

    if (!player || !update) continue;

    if (update.name) player.name = update.name;
    if (update.image) player.image = update.image;
    if (update.jerseyNumber) player.jerseyNumber = update.jerseyNumber;
    if (update.primaryPosition) player.primaryPosition = update.primaryPosition;
    if (update.secondaryPosition) player.secondaryPosition = update.secondaryPosition;
  }
}

function getAllPlayersForRosterImport() {
  const players = [];

  if (gameState.rosters) {
    Object.values(gameState.rosters).forEach(roster => {
      if (Array.isArray(roster)) players.push(...roster);
    });
  }

  if (Array.isArray(gameState.freeAgents)) {
    players.push(...gameState.freeAgents);
  }

  return players;
}

function applySavedRosterImportPack() {
  const savedPack = localStorage.getItem("fullCourtDirectorRosterPack");

  if (!savedPack) return;

  try {
    const rosterPack = JSON.parse(savedPack);
    applyCommunityRosterPack(rosterPack);
  } catch (error) {
    console.error("Could not apply saved community roster pack:", error);
  }
}

function applyCommunityTeamUpdatesByFictionalName(teamUpdates) {
  for (const fictionalName in teamUpdates) {
    const update = teamUpdates[fictionalName];

    const team = gameState.teams.find(t =>
      t.name === fictionalName ||
      t.fictionalName === fictionalName
    );

    if (!team || !update) continue;

    if (update.name) team.name = update.name;
    if (update.abbrev) team.abbrev = update.abbrev;

    if (update.image) {
      team.logo = update.image;
      team.logoPath = update.image;
      team.image = update.image;
    }

    if (update.logo) {
      team.logo = update.logo;
      team.logoPath = update.logo;
      team.image = update.logo;
    }

    if (update.arenaName) {
      team.arenaName = update.arenaName;
    }

    if (update.arenaCapacity !== undefined) {
      team.arenaCapacity = Number(update.arenaCapacity);
    }
  }
}

document.addEventListener("DOMContentLoaded", updateActiveRosterLabel);
