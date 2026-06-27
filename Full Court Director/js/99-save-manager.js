// ============================================================
// FULL COURT DIRECTOR - SAVE MANAGER
// Auto Save, Manual Save, Save Slots, Export, Import, Clear
// ============================================================

const FCD_SAVE_MANAGER = {
  version: 1,
  prefix: "fcd_save_manager_",
  autoKey: "fcd_save_manager_auto_v1",
  manualKey: "fcd_save_manager_manual_v1",
  indexKey: "fcd_save_manager_index_v1",
  pendingLoadKey: "fcd_save_manager_pending_load_v1",
  slotPrefix: "fcd_save_manager_slot_",
  autosaveEveryMs: 30000,
  maxSlots: 3
};

let fcdAutosaveTimer = null;

// ------------------------------------------------------------
// BASIC HELPERS
// ------------------------------------------------------------

function fcdSaveNowIso() {
  return new Date().toISOString();
}

function fcdFormatSaveTime(iso) {
  if (!iso) return "Never";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function fcdSafeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fcdGetGameState() {
  try {
    if (typeof gameState !== "undefined") {
      return gameState;
    }
  } catch (error) {}

  if (window.gameState) {
    return window.gameState;
  }

  return null;
}

function fcdSetGameState(loadedGameState) {
  try {
    if (typeof gameState !== "undefined") {
      gameState = loadedGameState;
      window.gameState = loadedGameState;
      return true;
    }
  } catch (error) {}

  window.gameState = loadedGameState;
  return true;
}

function fcdHasRealSaveableGame() {
  const state = fcdGetGameState();

  if (!state) return false;

  // Main check
  if (state.started === true) return true;

  // Backup checks for your game if "started" is not always set yet.
  if (state.userTeamId) return true;
  if (state.selectedTeamId) return true;
  if (state.userTeam) return true;
  if (state.currentDate) return true;
  if (state.seasonLabel) return true;

  // Roster/franchise checks
  if (state.rosters && Object.keys(state.rosters).length > 0) return true;
  if (Array.isArray(state.teams) && state.teams.length > 0 && state.userTeamId) return true;

  return false;
}

function fcdGetTeamNameFromState(state) {
  if (!state) return "Unknown Team";

  if (state.userTeamName) return state.userTeamName;
  if (state.selectedTeamName) return state.selectedTeamName;

  const userTeamId = state.userTeamId || state.selectedTeamId;

  if (userTeamId && Array.isArray(state.teams)) {
    const team = state.teams.find(item => String(item.id) === String(userTeamId));
    if (team && team.name) return team.name;
  }

  return "Unknown Team";
}

function fcdGetSaveMeta(label, saveType) {
  const state = fcdGetGameState();

  return {
    label,
    saveType,
    savedAt: fcdSaveNowIso(),
    version: FCD_SAVE_MANAGER.version,
    gameTitle: "Full Court Director",
    teamName: fcdGetTeamNameFromState(state),
    seasonLabel: state?.seasonLabel || state?.season || "",
    currentDate: state?.currentDate || state?.date || "",
    userTeamId: state?.userTeamId || state?.selectedTeamId || ""
  };
}

function fcdCreateSavePayload(label, saveType) {
  const state = fcdGetGameState();

  if (!state) {
    throw new Error("No gameState found. Start or load a game first.");
  }

  // This also proves the save can be stringified before we store it.
  const cleanGameState = JSON.parse(JSON.stringify(state));

  return {
    meta: fcdGetSaveMeta(label, saveType),
    gameState: cleanGameState
  };
}

function fcdGetSaveIndex() {
  try {
    const raw = localStorage.getItem(FCD_SAVE_MANAGER.indexKey);
    if (!raw) {
      return {
        auto: null,
        manual: null,
        slots: {}
      };
    }

    const parsed = JSON.parse(raw);

    return {
      auto: parsed.auto || null,
      manual: parsed.manual || null,
      slots: parsed.slots || {}
    };
  } catch (error) {
    return {
      auto: null,
      manual: null,
      slots: {}
    };
  }
}

function fcdSetSaveIndex(index) {
  localStorage.setItem(FCD_SAVE_MANAGER.indexKey, JSON.stringify(index));
}

function fcdUpdateIndexEntry(saveType, key, meta, slotNumber) {
  const index = fcdGetSaveIndex();

  const entry = {
    key,
    label: meta.label,
    saveType: meta.saveType,
    savedAt: meta.savedAt,
    teamName: meta.teamName,
    seasonLabel: meta.seasonLabel,
    currentDate: meta.currentDate
  };

  if (saveType === "auto") {
    index.auto = entry;
  } else if (saveType === "manual") {
    index.manual = entry;
  } else if (saveType === "slot") {
    index.slots[String(slotNumber)] = entry;
  }

  fcdSetSaveIndex(index);
}

// ------------------------------------------------------------
// SAVE / LOAD CORE
// ------------------------------------------------------------

function fcdWriteSave(key, label, saveType, options = {}) {
  const { slotNumber = null, silent = false } = options;

  if (!fcdHasRealSaveableGame()) {
    if (!silent) {
      fcdShowSaveToast("Start a game first before saving.", "bad");
    }
    return false;
  }

  try {
    const payload = fcdCreateSavePayload(label, saveType);
    localStorage.setItem(key, JSON.stringify(payload));
    fcdUpdateIndexEntry(saveType, key, payload.meta, slotNumber);

    if (!silent) {
      fcdShowSaveToast(`${label} saved.`, "good");
    }

    fcdRenderSaveManagerPanel();
    return true;
  } catch (error) {
    console.error("Save failed:", error);

    if (!silent) {
      fcdShowSaveToast("Save failed. Try exporting your save file.", "bad");
      alert(
        "Save failed.\n\nThis usually means the browser storage is full or gameState has something that cannot be saved.\n\nTry using Export Save as a backup."
      );
    }

    return false;
  }
}

function fcdAutoSave(options = {}) {
  return fcdWriteSave(
    FCD_SAVE_MANAGER.autoKey,
    "Auto Save",
    "auto",
    {
      silent: options.silent === true
    }
  );
}

function fcdManualSave() {
  return fcdWriteSave(
    FCD_SAVE_MANAGER.manualKey,
    "Manual Save",
    "manual"
  );
}

function fcdSaveSlot(slotNumber) {
  return fcdWriteSave(
    `${FCD_SAVE_MANAGER.slotPrefix}${slotNumber}_v1`,
    `Slot ${slotNumber}`,
    "slot",
    {
      slotNumber
    }
  );
}

function fcdReadSave(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const parsed = JSON.parse(raw);

  if (!parsed || !parsed.gameState) {
    throw new Error("Invalid save file.");
  }

  return parsed;
}

function fcdLoadSaveByKey(key) {
  try {
    const payload = fcdReadSave(key);

    if (!payload) {
      fcdShowSaveToast("No save found in that slot.", "bad");
      return false;
    }

    const confirmed = confirm(
      `Load this save?\n\n${payload.meta?.label || "Save"}\n${payload.meta?.teamName || ""}\n${fcdFormatSaveTime(payload.meta?.savedAt)}\n\nYour current unsaved progress will be replaced.`
    );

    if (!confirmed) return false;

    // Store the save as pending, then reload the page.
    // This makes the game boot cleanly into the loaded franchise.
    localStorage.setItem(FCD_SAVE_MANAGER.pendingLoadKey, JSON.stringify(payload));

    fcdShowSaveToast("Loading save...", "good");

    setTimeout(() => {
      window.location.reload();
    }, 250);

    return true;
  } catch (error) {
    console.error("Load failed:", error);
    alert("Load failed. Open the console and send me the red error if this keeps happening.");
    fcdShowSaveToast("Load failed. Save file may be broken.", "bad");
    return false;
  }
}

function fcdLoadAutoSave() {
  return fcdLoadSaveByKey(FCD_SAVE_MANAGER.autoKey);
}

function fcdLoadManualSave() {
  return fcdLoadSaveByKey(FCD_SAVE_MANAGER.manualKey);
}

function fcdLoadSlot(slotNumber) {
  return fcdLoadSaveByKey(`${FCD_SAVE_MANAGER.slotPrefix}${slotNumber}_v1`);
}

function fcdDeleteSaveByKey(key, saveType, slotNumber = null) {
  const confirmed = confirm("Delete this save? This cannot be undone.");
  if (!confirmed) return false;

  localStorage.removeItem(key);

  const index = fcdGetSaveIndex();

  if (saveType === "auto") {
    index.auto = null;
  } else if (saveType === "manual") {
    index.manual = null;
  } else if (saveType === "slot") {
    delete index.slots[String(slotNumber)];
  }

  fcdSetSaveIndex(index);
  fcdRenderSaveManagerPanel();
  fcdShowSaveToast("Save deleted.", "good");

  return true;
}

function fcdDeleteSlot(slotNumber) {
  return fcdDeleteSaveByKey(
    `${FCD_SAVE_MANAGER.slotPrefix}${slotNumber}_v1`,
    "slot",
    slotNumber
  );
}

function fcdClearAllBrowserSaves() {
  const confirmed = confirm(
    "Clear all Full Court Director browser saves on this browser?\n\nThis deletes Auto Save, Manual Save, and all save slots.\n\nExport first if you want a backup."
  );

  if (!confirmed) return false;

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(FCD_SAVE_MANAGER.prefix)) {
      localStorage.removeItem(key);
    }
  });

  fcdRenderSaveManagerPanel();
  fcdShowSaveToast("All browser saves cleared.", "good");

  return true;
}

// ------------------------------------------------------------
// EXPORT / IMPORT
// ------------------------------------------------------------

function fcdMakeExportFileName(meta) {
  const datePart = new Date().toISOString().slice(0, 10);
  const teamPart = String(meta?.teamName || "team")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `full-court-director-${teamPart || "save"}-${datePart}.json`;
}

function fcdExportCurrentSave() {
  if (!fcdHasRealSaveableGame()) {
    fcdShowSaveToast("Start a game first before exporting.", "bad");
    return false;
  }

  try {
    const payload = fcdCreateSavePayload("Exported Save", "export");
    const json = JSON.stringify(payload, null, 2);

    const blob = new Blob([json], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fcdMakeExportFileName(payload.meta);
    document.body.appendChild(link);
    link.click();

    link.remove();
    URL.revokeObjectURL(url);

    fcdShowSaveToast("Save exported.", "good");
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    fcdShowSaveToast("Export failed.", "bad");
    return false;
  }
}

function fcdImportSaveFile(file) {
  if (!file) return false;

  const reader = new FileReader();

  reader.onload = function(event) {
    try {
      const payload = JSON.parse(event.target.result);

      if (!payload || !payload.gameState) {
        throw new Error("This is not a valid Full Court Director save file.");
      }

      const confirmed = confirm(
        `Import and load this save?\n\n${payload.meta?.teamName || "Unknown Team"}\n${fcdFormatSaveTime(payload.meta?.savedAt)}\n\nYour current unsaved progress will be replaced.`
      );

      if (!confirmed) return;

      // Store imported save as manual save too, so it stays in browser.
      payload.meta = {
        ...(payload.meta || {}),
        label: "Imported Save",
        saveType: "manual",
        importedAt: fcdSaveNowIso()
      };

      localStorage.setItem(FCD_SAVE_MANAGER.manualKey, JSON.stringify(payload));
      fcdUpdateIndexEntry("manual", FCD_SAVE_MANAGER.manualKey, payload.meta);

      fcdSetGameState(payload.gameState);
      fcdRefreshGameAfterLoad();

      fcdShowSaveToast("Save imported and loaded.", "good");
      fcdRenderSaveManagerPanel();
    } catch (error) {
      console.error("Import failed:", error);
      alert("Import failed. Make sure this is a Full Court Director .json save file.");
      fcdShowSaveToast("Import failed.", "bad");
    }
  };

  reader.readAsText(file);
  return true;
}

// ------------------------------------------------------------
// REFRESH AFTER LOAD
// ------------------------------------------------------------

function fcdRefreshGameAfterLoad() {
  const state = fcdGetGameState();

  if (state) {
    state.started = true;
    window.gameState = state;
  }

  try {
    fcdTogglePlayScreen(false);
  } catch (error) {}

  try {
    document.getElementById("fcd-continue-save-banner")?.remove();
  } catch (error) {}

  try {
    if (typeof normalizeGameStateAfterLoad === "function") {
      normalizeGameStateAfterLoad();
    }
  } catch (error) {
    console.warn("normalizeGameStateAfterLoad failed:", error);
  }

  // Save into your original game save system if it exists.
  try {
    if (typeof saveGame === "function") {
      saveGame();
    }
  } catch (error) {
    console.warn("saveGame failed after load:", error);
  }

  // Try common screen names.
  try {
    if (typeof showScreen === "function") {
      showScreen("dashboard-screen");
      return;
    }
  } catch (error) {
    console.warn("showScreen dashboard-screen failed:", error);
  }

  try {
    if (typeof showScreen === "function") {
      showScreen("dashboard");
      return;
    }
  } catch (error) {
    console.warn("showScreen dashboard failed:", error);
  }

  try {
    if (typeof showSecondaryScreen === "function") {
      showSecondaryScreen("dashboard-screen");
      return;
    }
  } catch (error) {
    console.warn("showSecondaryScreen failed:", error);
  }

  const refreshFunctions = [
    "renderCurrentScreen",
    "refreshCurrentScreen",
    "renderDashboard",
    "displayDashboard",
    "updateDashboard",
    "renderSidebar",
    "updateSidebar",
    "renderTopBar",
    "renderCalendar",
    "renderInbox",
    "renderTeamRoster",
    "renderLeagueStandings"
  ];

  refreshFunctions.forEach(functionName => {
    try {
      if (typeof window[functionName] === "function") {
        window[functionName]();
      }
    } catch (error) {
      console.warn(`${functionName} failed after load:`, error);
    }
  });
}

// ------------------------------------------------------------
// UI
// ------------------------------------------------------------

function fcdGetSaveSummary(entry) {
  if (!entry) {
    return `<span class="fcd-save-empty">Empty</span>`;
  }

  const team = fcdSafeText(entry.teamName || "Unknown Team");
  const season = fcdSafeText(entry.seasonLabel || "");
  const date = fcdSafeText(entry.currentDate || "");
  const time = fcdSafeText(fcdFormatSaveTime(entry.savedAt));

  return `
    <div class="fcd-save-summary-main">${team}</div>
    <div class="fcd-save-summary-sub">${season}${season && date ? " · " : ""}${date}</div>
    <div class="fcd-save-summary-time">${time}</div>
  `;
}

function fcdRenderSaveManagerPanel() {
  fcdRenderPlayScreen();
}

function fcdRenderPlayScreen() {
  const panel = document.getElementById("fcd-play-screen-panel");
  if (!panel) return;

  const index = fcdGetSaveIndex();

  let slotsHtml = "";

  for (let i = 1; i <= FCD_SAVE_MANAGER.maxSlots; i++) {
    const entry = index.slots[String(i)] || null;

    slotsHtml += `
      <div class="fcd-play-save-card">
        <div class="fcd-play-save-info">
          <div class="fcd-play-save-title">Slot ${i}</div>
          ${fcdGetSaveSummary(entry)}
        </div>
        <div class="fcd-play-save-actions">
          <button type="button" onclick="fcdSaveSlot(${i})">Save Here</button>
          <button type="button" onclick="fcdLoadSlot(${i})" ${entry ? "" : "disabled"}>Load</button>
          <button type="button" onclick="fcdDeleteSlot(${i})" ${entry ? "" : "disabled"}>Delete</button>
        </div>
      </div>
    `;
  }

  panel.innerHTML = `
    <div class="fcd-play-screen-header">
      <div>
        <div class="fcd-play-kicker">Full Court Director</div>
        <div class="fcd-play-title">Play</div>
        <div class="fcd-play-subtitle">Start a new franchise or continue a saved game on this browser.</div>
      </div>

      <button type="button" class="fcd-play-close" onclick="fcdTogglePlayScreen(false)">×</button>
    </div>

    <div class="fcd-play-main-action-row">
      <button type="button" class="fcd-start-new-save-button" onclick="fcdRunOriginalStartNewSave()">
        Start New Save
      </button>

      <label class="fcd-play-import-button">
        Import Save
        <input
          type="file"
          accept=".json,application/json"
          onchange="fcdImportSaveFile(this.files[0]); this.value = '';"
        >
      </label>
    </div>

    <div class="fcd-play-section-title">Saved Games</div>

    <div class="fcd-play-save-list">
      <div class="fcd-play-save-card featured">
        <div class="fcd-play-save-info">
          <div class="fcd-play-save-title">Auto Save</div>
          ${fcdGetSaveSummary(index.auto)}
        </div>
        <div class="fcd-play-save-actions">
          <button type="button" onclick="fcdAutoSave()">Save Now</button>
          <button type="button" onclick="fcdLoadAutoSave()" ${index.auto ? "" : "disabled"}>Load</button>
          <button type="button" onclick="fcdDeleteSaveByKey(FCD_SAVE_MANAGER.autoKey, 'auto')" ${index.auto ? "" : "disabled"}>Delete</button>
        </div>
      </div>

      <div class="fcd-play-save-card">
        <div class="fcd-play-save-info">
          <div class="fcd-play-save-title">Manual Save</div>
          ${fcdGetSaveSummary(index.manual)}
        </div>
        <div class="fcd-play-save-actions">
          <button type="button" onclick="fcdManualSave()">Save</button>
          <button type="button" onclick="fcdLoadManualSave()" ${index.manual ? "" : "disabled"}>Load</button>
          <button type="button" onclick="fcdDeleteSaveByKey(FCD_SAVE_MANAGER.manualKey, 'manual')" ${index.manual ? "" : "disabled"}>Delete</button>
        </div>
      </div>

      ${slotsHtml}
    </div>

    <div class="fcd-play-bottom-actions">
      <button type="button" onclick="fcdExportCurrentSave()">Export Current Save</button>
      <button type="button" class="danger" onclick="fcdClearAllBrowserSaves()">Clear All Browser Saves</button>
    </div>

    <div class="fcd-save-warning">
      Saves stay on this browser. Use Export Save before clearing browser data or switching computers.
    </div>
  `;
}

function fcdInstallSaveManagerStyles() {
  if (document.getElementById("fcd-save-manager-styles")) return;

  const style = document.createElement("style");
  style.id = "fcd-save-manager-styles";

   style.textContent = `
    #fcd-save-manager-button {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 99998;
      border: 1px solid rgba(255,255,255,0.18);
      background: #17408B;
      color: white;
      border-radius: 999px;
      padding: 12px 18px;
      font-weight: 900;
      letter-spacing: 0.04em;
      cursor: pointer;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      text-transform: uppercase;
    }

    #fcd-play-screen-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(2, 6, 23, 0.86);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    #fcd-play-screen-overlay.open {
      display: flex;
    }

    #fcd-play-screen-panel {
      width: min(980px, calc(100vw - 36px));
      max-height: min(820px, calc(100vh - 48px));
      overflow-y: auto;
      background: #071733;
      color: #e5e7eb;
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 18px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.62);
      padding: 22px;
    }

    .fcd-play-screen-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 18px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }

    .fcd-play-kicker {
      color: #94a3b8;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .fcd-play-title {
      color: #ffffff;
      font-size: 34px;
      line-height: 1;
      font-weight: 950;
      text-transform: uppercase;
    }

    .fcd-play-subtitle {
      color: #cbd5e1;
      font-size: 14px;
      margin-top: 8px;
    }

    .fcd-play-close {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.08);
      color: white;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
    }

    .fcd-play-main-action-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 18px;
    }

    .fcd-start-new-save-button {
      border: 1px solid rgba(255,255,255,0.16);
      background: #17408B;
      color: #ffffff;
      border-radius: 12px;
      padding: 13px 18px;
      font-size: 14px;
      font-weight: 950;
      text-transform: uppercase;
      cursor: pointer;
    }

    .fcd-play-import-button {
      border: 1px solid rgba(255,255,255,0.16);
      background: rgba(255,255,255,0.09);
      color: #ffffff;
      border-radius: 12px;
      padding: 13px 18px;
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      cursor: pointer;
    }

    .fcd-play-import-button input {
      display: none;
    }

    .fcd-play-section-title {
      color: #ffffff;
      font-size: 15px;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 12px 0;
    }

    .fcd-play-save-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .fcd-play-save-card {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 14px;
      align-items: center;
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(148, 163, 184, 0.20);
      border-radius: 14px;
      padding: 14px;
      min-height: 96px;
    }

    .fcd-play-save-card.featured {
      border-color: rgba(23, 64, 139, 0.8);
      background: rgba(23, 64, 139, 0.24);
    }

    .fcd-play-save-title {
      font-size: 13px;
      font-weight: 950;
      color: #ffffff;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .fcd-save-summary-main {
      font-size: 14px;
      font-weight: 850;
      color: #e5e7eb;
    }

    .fcd-save-summary-sub,
    .fcd-save-summary-time,
    .fcd-save-empty {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 3px;
    }

    .fcd-play-save-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 6px;
    }

    .fcd-play-save-actions button,
    .fcd-play-bottom-actions button {
      border: 1px solid rgba(255,255,255,0.16);
      background: rgba(255,255,255,0.09);
      color: #f8fafc;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: 850;
      cursor: pointer;
    }

    .fcd-play-save-actions button:hover,
    .fcd-play-bottom-actions button:hover,
    .fcd-play-import-button:hover {
      background: rgba(255,255,255,0.15);
    }

    .fcd-play-save-actions button:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .fcd-play-bottom-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }

    .fcd-play-bottom-actions .danger {
      background: rgba(220, 38, 38, 0.22);
      border-color: rgba(248, 113, 113, 0.35);
    }

    .fcd-save-warning {
      color: #cbd5e1;
      font-size: 12px;
      line-height: 1.4;
      margin-top: 14px;
      background: rgba(234, 179, 8, 0.10);
      border: 1px solid rgba(234, 179, 8, 0.24);
      border-radius: 10px;
      padding: 10px;
    }

    #fcd-save-toast {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translateX(-50%);
      z-index: 100000;
      background: #0f172a;
      color: white;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 999px;
      padding: 10px 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.45);
      font-size: 13px;
      font-weight: 800;
      display: none;
    }

    #fcd-save-toast.good {
      border-color: rgba(34, 197, 94, 0.55);
    }

    #fcd-save-toast.bad {
      border-color: rgba(248, 113, 113, 0.65);
    }

    @media (max-width: 820px) {
      .fcd-play-save-list {
        grid-template-columns: 1fr;
      }

      .fcd-play-save-card {
        grid-template-columns: 1fr;
      }

      .fcd-play-save-actions {
        justify-content: flex-start;
      }
    }
  `;

  document.head.appendChild(style);
}

function fcdRunOriginalStartNewSave() {
  fcdTogglePlayScreen(false);

  // This runs the old Start New Save onclick that we save before changing the button to Play.
  if (typeof window.fcdOriginalStartNewSaveOnClick === "function") {
    window.fcdOriginalStartNewSaveOnClick();
    return true;
  }

  // Backup guesses if your game uses one of these function names.
  const possibleStartFunctions = [
    "startNewSave",
    "startNewGame",
    "beginNewSave",
    "beginNewGame",
    "showTeamSelectScreen",
    "showIntroTeamSelect",
    "openTeamSelectScreen",
    "renderTeamSelectScreen"
  ];

  for (const functionName of possibleStartFunctions) {
    if (typeof window[functionName] === "function") {
      window[functionName]();
      return true;
    }
  }

  alert("Start New Save is not connected yet. Tell me the old Start New Save button onclick and I’ll wire it exactly.");
  return false;
}

function fcdConvertStartNewSaveButtonToPlay() {
  const buttons = Array.from(document.querySelectorAll("button"));

  const startButton = buttons.find(button => {
    const text = button.textContent.trim().toLowerCase();
    return text === "start new save" || text === "new save" || text.includes("start new save");
  });

  if (!startButton) return;

  if (!window.fcdOriginalStartNewSaveOnClick) {
    const oldOnClick = startButton.onclick;

    if (typeof oldOnClick === "function") {
      window.fcdOriginalStartNewSaveOnClick = function() {
        oldOnClick.call(startButton);
      };
    }
  }

  startButton.textContent = "Play";
  startButton.onclick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    fcdTogglePlayScreen(true);
  };
}

function fcdInstallSaveManagerUI() {
  fcdInstallSaveManagerStyles();

  // Create the full Play / Saves screen, but do NOT create a floating Play button.
  if (!document.getElementById("fcd-play-screen-overlay")) {
    const overlay = document.createElement("div");
    overlay.id = "fcd-play-screen-overlay";

    const panel = document.createElement("div");
    panel.id = "fcd-play-screen-panel";

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  if (!document.getElementById("fcd-save-toast")) {
    const toast = document.createElement("div");
    toast.id = "fcd-save-toast";
    document.body.appendChild(toast);
  }

  fcdConvertStartNewSaveButtonToPlay();
  fcdRenderPlayScreen();
}

function fcdToggleSaveManager(forceOpen) {
  fcdTogglePlayScreen(forceOpen);
}

function fcdTogglePlayScreen(forceOpen) {
  const overlay = document.getElementById("fcd-play-screen-overlay");
  if (!overlay) return;

  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : !overlay.classList.contains("open");

  overlay.classList.toggle("open", shouldOpen);

  if (shouldOpen) {
    fcdRenderPlayScreen();
  }
}

let fcdSaveToastTimer = null;

function fcdShowSaveToast(message, type = "good") {
  const toast = document.getElementById("fcd-save-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = type;
  toast.style.display = "block";

  clearTimeout(fcdSaveToastTimer);
  fcdSaveToastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 2600);
}

function fcdShowContinueSaveBanner() {
  const index = fcdGetSaveIndex();
  const bestSave = index.auto || index.manual;

  if (!bestSave) return;

  const state = fcdGetGameState();

  // Do not show if the current page already has a started game loaded.
  if (state?.started === true) return;

  if (document.getElementById("fcd-continue-save-banner")) return;

  const banner = document.createElement("div");
  banner.id = "fcd-continue-save-banner";

  banner.innerHTML = `
    <div class="fcd-continue-title">Continue your Full Court Director save?</div>
    <div class="fcd-continue-sub">
      ${fcdSafeText(bestSave.teamName || "Saved game")} · ${fcdSafeText(fcdFormatSaveTime(bestSave.savedAt))}
    </div>
    <div class="fcd-continue-actions">
      <button type="button" onclick="document.getElementById('fcd-continue-save-banner')?.remove()">Not now</button>
      <button type="button" class="primary" onclick="fcdLoadSaveByKey('${bestSave.key}'); document.getElementById('fcd-continue-save-banner')?.remove()">Continue Save</button>
    </div>
  `;

  document.body.appendChild(banner);
}

// ------------------------------------------------------------
// AUTOSAVE BOOT
// ------------------------------------------------------------

function fcdStartAutosaveLoop() {
  if (fcdAutosaveTimer) {
    clearInterval(fcdAutosaveTimer);
  }

  fcdAutosaveTimer = setInterval(() => {
    fcdAutoSave({ silent: true });
  }, FCD_SAVE_MANAGER.autosaveEveryMs);
}

function fcdInstallSaveHooks() {
  window.addEventListener("beforeunload", function() {
    fcdAutoSave({ silent: true });
  });

  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "hidden") {
      fcdAutoSave({ silent: true });
    }
  });
}

function fcdApplyPendingLoadIfAny() {
  const raw = localStorage.getItem(FCD_SAVE_MANAGER.pendingLoadKey);
  if (!raw) return false;

  try {
    const payload = JSON.parse(raw);

    if (!payload || !payload.gameState) {
      localStorage.removeItem(FCD_SAVE_MANAGER.pendingLoadKey);
      return false;
    }

    localStorage.removeItem(FCD_SAVE_MANAGER.pendingLoadKey);

    fcdSetGameState(payload.gameState);

    // Force important loaded-save flags.
    const state = fcdGetGameState();
    if (state) {
      state.started = true;
      window.gameState = state;
    }

    // Let your original game save system capture the loaded save too.
    try {
      if (typeof saveGame === "function") {
        saveGame();
      }
    } catch (error) {
      console.warn("Original saveGame failed after pending load:", error);
    }

    setTimeout(() => {
      fcdRefreshGameAfterLoad();
      fcdTogglePlayScreen(false);
      fcdShowSaveToast("Save loaded.", "good");
    }, 300);

    setTimeout(() => {
      fcdRefreshGameAfterLoad();
    }, 1000);

    return true;
  } catch (error) {
    console.error("Pending load failed:", error);
    localStorage.removeItem(FCD_SAVE_MANAGER.pendingLoadKey);
    return false;
  }
}

function fcdBootSaveManager() {
  document.getElementById("fcd-save-manager-button")?.remove();

  fcdInstallSaveManagerUI();
  fcdInstallSaveHooks();
  fcdStartAutosaveLoop();

  const loadedPendingSave = fcdApplyPendingLoadIfAny();

  setTimeout(() => {
    fcdConvertStartNewSaveButtonToPlay();
    fcdRenderPlayScreen();

    if (loadedPendingSave) {
      fcdRefreshGameAfterLoad();
    }
  }, 700);

  setTimeout(() => {
    fcdConvertStartNewSaveButtonToPlay();
    fcdRenderPlayScreen();

    if (loadedPendingSave) {
      fcdRefreshGameAfterLoad();
    }
  }, 2000);
}

document.addEventListener("DOMContentLoaded", fcdBootSaveManager);