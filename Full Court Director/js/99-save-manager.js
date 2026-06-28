// ============================================================
// FULL COURT DIRECTOR - NAMED LOCAL SAVE MANAGER v1.01
// ============================================================

const FCD_SAVE_MANAGER = {
  indexKey: "fcd_saves_index_v101",
  activeSaveIdKey: "fcd_active_save_id_v101",
  pendingLoadKey: "fcd_pending_load_v101",
  savePrefix: "fcd_save_v101_"
};

let fcdSaveClickTimer = null;

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
    if (typeof gameState !== "undefined") return gameState;
  } catch (error) {}

  return window.gameState || null;
}

function fcdSetGameState(state) {
  try {
    gameState = state;
  } catch (error) {}

  window.gameState = state;
}

function fcdGetSaveIndex() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FCD_SAVE_MANAGER.indexKey));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Could not read saved-games index:", error);
    return [];
  }
}

function fcdSetSaveIndex(index) {
  localStorage.setItem(FCD_SAVE_MANAGER.indexKey, JSON.stringify(index));
}

function fcdRemoveObsoleteSaveStorage() {
  const keys = [];

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key) keys.push(key);
  }

  keys.forEach(key => {
    if (
      key === "fullCourtDirectorSave" ||
      key.startsWith("fcd_save_manager_")
    ) {
      localStorage.removeItem(key);
    }
  });
}

function fcdRemoveOrphanedNamedSavePayloads() {
  const indexedIds = new Set(
    fcdGetSaveIndex()
      .map(item => item?.saveId)
      .filter(Boolean)
  );
  const payloadKeys = [];

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key && key.startsWith(FCD_SAVE_MANAGER.savePrefix)) {
      payloadKeys.push(key);
    }
  }

  payloadKeys.forEach(key => {
    const saveId = key.slice(FCD_SAVE_MANAGER.savePrefix.length);
    if (!indexedIds.has(saveId)) {
      localStorage.removeItem(key);
    }
  });
}

function fcdRepairSaveIndex() {
  const index = fcdGetSaveIndex();
  const repaired = index.filter(item => {
    if (!item?.saveId) return false;

    const raw = localStorage.getItem(`${FCD_SAVE_MANAGER.savePrefix}${item.saveId}`);
    if (!raw) return false;

    try {
      return Boolean(JSON.parse(raw)?.gameState);
    } catch (error) {
      return false;
    }
  });

  if (repaired.length !== index.length) {
    fcdSetSaveIndex(repaired);
  }

  const activeSaveId = fcdGetActiveSaveId();
  if (activeSaveId && !repaired.some(item => item.saveId === activeSaveId)) {
    fcdSetActiveSaveId("");
  }

  return repaired;
}

function fcdGetActiveSaveId() {
  return localStorage.getItem(FCD_SAVE_MANAGER.activeSaveIdKey) || "";
}

function fcdSetActiveSaveId(saveId) {
  if (saveId) {
    localStorage.setItem(FCD_SAVE_MANAGER.activeSaveIdKey, saveId);
  } else {
    localStorage.removeItem(FCD_SAVE_MANAGER.activeSaveIdKey);
  }
}

function fcdCreateSaveId() {
  return `save_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function fcdGetTeamNameFromState(state) {
  if (!state) return "Unknown Team";

  const teamId = state.selectedTeamId || state.userTeamId;
  const team = Array.isArray(state.teams)
    ? state.teams.find(item => String(item.id) === String(teamId))
    : null;

  return team?.name || state.selectedTeamName || state.userTeamName || "Unknown Team";
}

function fcdBuildSaveMeta(saveId, saveName, state) {
  return {
    saveId,
    saveName,
    teamName: fcdGetTeamNameFromState(state),
    seasonLabel: state?.seasonLabel || "",
    savedAt: new Date().toISOString()
  };
}

function fcdBuildSavePayload(saveId, saveName, state) {
  return {
    meta: fcdBuildSaveMeta(saveId, saveName, state),
    gameState: JSON.parse(JSON.stringify(state))
  };
}

function fcdWriteNamedSave(saveId, saveName, options = {}) {
  const state = fcdGetGameState();
  if (!state || state.started !== true || !saveId) return false;

  fcdRemoveObsoleteSaveStorage();
  fcdRemoveOrphanedNamedSavePayloads();

  const payloadKey = `${FCD_SAVE_MANAGER.savePrefix}${saveId}`;
  const payload = fcdBuildSavePayload(saveId, saveName, state);
  const previousPayload = localStorage.getItem(payloadKey);
  const previousIndexRaw = localStorage.getItem(FCD_SAVE_MANAGER.indexKey);

  try {
    // Payload is always written and verified before its index row exists.
    localStorage.setItem(payloadKey, JSON.stringify(payload));

    if (!localStorage.getItem(payloadKey)) {
      throw new Error(`Save payload verification failed for ${payloadKey}`);
    }

    const index = fcdGetSaveIndex();
    const existingIndex = index.findIndex(item => item.saveId === saveId);

    if (existingIndex >= 0) {
      index[existingIndex] = payload.meta;
    } else {
      index.unshift(payload.meta);
    }

    fcdSetSaveIndex(index);
    fcdSetActiveSaveId(saveId);

    if (options.toast !== false) {
      fcdShowSaveToast("Game saved.");
    }

    return true;
  } catch (error) {
    console.error("Named save failed:", error);

    if (previousPayload === null) {
      localStorage.removeItem(payloadKey);
    } else {
      localStorage.setItem(payloadKey, previousPayload);
    }

    if (previousIndexRaw === null) {
      localStorage.removeItem(FCD_SAVE_MANAGER.indexKey);
    } else {
      localStorage.setItem(FCD_SAVE_MANAGER.indexKey, previousIndexRaw);
    }

    if (options.toast !== false) {
      const storageFull =
        error?.name === "QuotaExceededError" ||
        String(error?.message || "").toLowerCase().includes("quota");

      fcdShowSaveToast(
        storageFull
          ? "Storage full. Delete an old save and try again."
          : "Save failed."
      );

      if (storageFull) {
        document.getElementById("fcd-save-name-dialog")?.classList.remove("open");
        fcdOpenPlayScreen();
      }
    }

    return false;
  }
}

function fcdCreateFirstSave(saveName) {
  const state = fcdGetGameState();
  if (!state || state.started !== true) return false;

  const saveId = fcdCreateSaveId();
  const created = fcdWriteNamedSave(saveId, saveName, { toast: true });

  if (created) fcdRenderPlayScreen();
  return created;
}

function fcdSaveCurrentGame(silent = true) {
  const state = fcdGetGameState();
  const activeSaveId = fcdGetActiveSaveId();

  if (!state || state.started !== true || !activeSaveId) return false;

  const index = fcdGetSaveIndex();
  const activeMeta = index.find(item => item.saveId === activeSaveId);

  if (!activeMeta) {
    console.warn("Active save is missing from the save index:", activeSaveId);
    return false;
  }

  return fcdWriteNamedSave(activeSaveId, activeMeta.saveName, {
    toast: !silent
  });
}

function fcdLoadSave(saveId) {
  const payloadKey = `${FCD_SAVE_MANAGER.savePrefix}${saveId}`;
  const raw = localStorage.getItem(payloadKey);

  if (!raw) {
    console.warn("Missing save payload:", payloadKey);
    console.warn(
      "Available FCD localStorage keys:",
      Object.keys(localStorage).filter(key => key.startsWith("fcd"))
    );
    alert("Save not found.");
    return false;
  }

  try {
    const payload = JSON.parse(raw);
    if (!payload?.gameState) throw new Error("Save payload has no gameState.");

    localStorage.setItem(
      FCD_SAVE_MANAGER.pendingLoadKey,
      JSON.stringify({ saveId })
    );
    fcdSetActiveSaveId(saveId);
    window.location.reload();
    return true;
  } catch (error) {
    console.error("Could not load save:", error);
    alert("This save could not be loaded.");
    return false;
  }
}

function fcdDeleteSave(saveId) {
  if (!confirm("Delete this save? This cannot be undone.")) return false;

  const payloadKey = `${FCD_SAVE_MANAGER.savePrefix}${saveId}`;
  const index = fcdGetSaveIndex().filter(item => item.saveId !== saveId);

  localStorage.removeItem(payloadKey);
  fcdSetSaveIndex(index);

  if (fcdGetActiveSaveId() === saveId) {
    fcdSetActiveSaveId("");
  }

  fcdRenderPlayScreen();
  fcdShowSaveToast("Save deleted.");

  const state = fcdGetGameState();
  if (state?.started === true && !fcdGetActiveSaveId()) {
    setTimeout(() => {
      fcdClosePlayScreen();
      fcdAskForSaveNameIfNeeded();
    }, 150);
  }

  return true;
}

function fcdApplyPendingLoad() {
  const raw = localStorage.getItem(FCD_SAVE_MANAGER.pendingLoadKey);
  if (!raw) return false;

  localStorage.removeItem(FCD_SAVE_MANAGER.pendingLoadKey);

  try {
    const pending = JSON.parse(raw);
    const payload = pending?.gameState
      ? pending
      : JSON.parse(
          localStorage.getItem(
            `${FCD_SAVE_MANAGER.savePrefix}${pending?.saveId || ""}`
          )
        );

    if (!payload?.gameState) throw new Error("Pending save has no gameState.");

    fcdSetGameState(payload.gameState);
    gameState.started = true;

    if (typeof normalizeGameStateAfterLoad === "function") {
      normalizeGameStateAfterLoad();
    }

    document.getElementById("start-screen")?.classList.add("hidden");
    document.getElementById("game-screen")?.classList.remove("hidden");
    fcdClosePlayScreen();

    currentMainSection = "dashboard";
    currentSecondaryScreen = "dashboard-screen";

    if (typeof initializeNavigation === "function") initializeNavigation();
    if (typeof showMainSection === "function") showMainSection("dashboard");
    if (typeof showSecondaryScreen === "function") showSecondaryScreen("dashboard-screen");
    if (typeof refreshAll === "function") refreshAll();

    fcdShowSaveToast("Save loaded.");
    return true;
  } catch (error) {
    console.error("Pending save load failed:", error);
    alert("This save could not be loaded.");
    return false;
  }
}

function fcdRenderPlayScreen() {
  const panel = document.getElementById("fcd-play-screen-panel");
  if (!panel) return;

  const saves = fcdGetSaveIndex();

  panel.innerHTML = `
    <div class="fcd-save-page">
      <div class="fcd-save-header">
        <h2>Saved Games</h2>
        <button type="button" onclick="fcdStartNewSave()">Start New Save</button>
      </div>

      <div class="fcd-save-table">
        <div class="fcd-save-row fcd-save-head">
          <div>Save Name</div>
          <div>Team</div>
          <div>Season</div>
          <div>Play</div>
          <div>Delete</div>
        </div>

        ${saves.length
          ? saves.map(save => `
            <div class="fcd-save-row">
              <div>${fcdSafeText(save.saveName)}</div>
              <div>${fcdSafeText(save.teamName)}</div>
              <div>${fcdSafeText(save.seasonLabel)}</div>
              <div>
                <button type="button" onclick="fcdLoadSave('${fcdSafeText(save.saveId)}')">Play</button>
              </div>
              <div>
                <button
                  type="button"
                  class="fcd-delete-save-button"
                  onclick="fcdDeleteSave('${fcdSafeText(save.saveId)}')"
                >
                  Delete
                </button>
              </div>
            </div>
          `).join("")
          : '<div class="fcd-save-empty-row">No saves yet. Start a new save.</div>'}
      </div>
    </div>
  `;
}

function fcdInstallSaveManagerStyles() {
  if (document.getElementById("fcd-save-manager-styles")) return;

  const style = document.createElement("style");
  style.id = "fcd-save-manager-styles";
  style.textContent = `
    #fcd-play-screen-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: none;
      padding: 34px;
      overflow: auto;
      background: #071634;
    }

    #fcd-play-screen-overlay.open { display: block; }

    #fcd-play-screen-panel {
      width: min(1200px, 100%);
      margin: 0 auto;
      color: #f8fafc;
    }

    .fcd-save-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 22px;
    }

    .fcd-save-header h2 {
      margin: 0;
      color: #f8fafc;
      font-size: 34px;
      text-transform: uppercase;
    }

    .fcd-save-header button,
    .fcd-save-row button {
      min-height: 38px;
      padding: 9px 18px;
      border: 1px solid #1d4f91;
      border-radius: 4px;
      background: #143676;
      color: #f8fafc;
      font-weight: 900;
      cursor: pointer;
    }

    .fcd-save-header button {
      border-color: #22d3ee;
      background: #0f766e;
    }

    .fcd-save-row .fcd-delete-save-button {
      border-color: #bd1131;
      background: #64152a;
    }

    .fcd-save-table {
      border: 1px solid #1d4f91;
      background: #0b1f46;
    }

    .fcd-save-row {
      display: grid;
      grid-template-columns: minmax(180px, 1.4fr) minmax(180px, 1.5fr) 120px 100px 100px;
      align-items: center;
      min-height: 68px;
      padding: 0 18px;
      border-bottom: 1px solid #18345f;
      font-size: 15px;
      font-weight: 800;
    }

    .fcd-save-row:last-child { border-bottom: 0; }

    .fcd-save-head {
      min-height: 48px;
      color: #94a3b8;
      background: #081a3d;
      font-size: 11px;
      text-transform: uppercase;
    }

    .fcd-save-empty-row {
      padding: 30px 18px;
      color: #cbd5e1;
      font-weight: 800;
    }

    #fcd-save-toast {
      position: fixed;
      left: 50%;
      bottom: 22px;
      z-index: 100000;
      display: none;
      padding: 10px 16px;
      transform: translateX(-50%);
      border: 1px solid #1d4f91;
      background: #0b1f46;
      color: #f8fafc;
      font-weight: 900;
    }

    #fcd-save-name-dialog {
      position: fixed;
      inset: 0;
      z-index: 100001;
      display: none;
      place-items: center;
      background: rgba(2, 8, 23, 0.78);
    }

    #fcd-save-name-dialog.open { display: grid; }

    .fcd-save-name-panel {
      width: min(440px, calc(100vw - 32px));
      padding: 24px;
      border: 1px solid #1d4f91;
      background: #0b1f46;
      color: #f8fafc;
    }

    .fcd-save-name-panel h2 {
      margin: 0 0 16px;
      color: #22d3ee;
      font-size: 22px;
      text-transform: uppercase;
    }

    .fcd-save-name-panel label {
      display: block;
      margin-bottom: 8px;
      color: #cbd5e1;
      font-weight: 800;
    }

    .fcd-save-name-panel input {
      width: 100%;
      min-height: 44px;
      margin-bottom: 16px;
      padding: 8px 10px;
      border: 1px solid #1d4f91;
      background: #071634;
      color: #f8fafc;
      font: inherit;
    }

    .fcd-save-name-panel button {
      width: 100%;
      min-height: 42px;
      border: 1px solid #22d3ee;
      background: #0f766e;
      color: #f8fafc;
      font-weight: 900;
      cursor: pointer;
    }
  `;

  document.head.appendChild(style);
}

function fcdInstallSaveManagerUI() {
  fcdInstallSaveManagerStyles();

  if (!document.getElementById("fcd-play-screen-overlay")) {
    const overlay = document.createElement("div");
    overlay.id = "fcd-play-screen-overlay";
    overlay.innerHTML = '<div id="fcd-play-screen-panel"></div>';
    document.body.appendChild(overlay);
  }

  if (!document.getElementById("fcd-save-toast")) {
    const toast = document.createElement("div");
    toast.id = "fcd-save-toast";
    document.body.appendChild(toast);
  }

  if (!document.getElementById("fcd-save-name-dialog")) {
    const dialog = document.createElement("div");
    dialog.id = "fcd-save-name-dialog";
    dialog.innerHTML = `
      <div class="fcd-save-name-panel">
        <h2>Name Your Save</h2>
        <label for="fcd-save-name-input">Save Name</label>
        <input id="fcd-save-name-input" type="text" maxlength="60">
        <button type="button" onclick="fcdConfirmFirstSaveName()">Save Game</button>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  fcdRenderPlayScreen();
}

function fcdOpenPlayScreen() {
  fcdRenderPlayScreen();
  document.getElementById("fcd-play-screen-overlay")?.classList.add("open");
}

function fcdClosePlayScreen() {
  document.getElementById("fcd-play-screen-overlay")?.classList.remove("open");
}

function fcdShowSaveToast(message) {
  const toast = document.getElementById("fcd-save-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.display = "block";

  clearTimeout(fcdShowSaveToast.timer);
  fcdShowSaveToast.timer = setTimeout(() => {
    toast.style.display = "none";
  }, 1800);
}

function fcdStartNewSave() {
  fcdSetActiveSaveId("");
  fcdClosePlayScreen();

  if (typeof showStartPanel === "function") {
    showStartPanel("gm-creation-panel");
  }
}

function fcdAskForSaveNameIfNeeded() {
  const state = fcdGetGameState();
  if (!state || state.started !== true || fcdGetActiveSaveId()) return false;

  const teamName = fcdGetTeamNameFromState(state);
  const dialog = document.getElementById("fcd-save-name-dialog");
  const input = document.getElementById("fcd-save-name-input");

  if (!dialog || !input) return false;

  input.value = `${teamName} Save`;
  dialog.classList.add("open");
  input.focus();
  input.select();
  return true;
}

function fcdConfirmFirstSaveName() {
  const state = fcdGetGameState();
  if (!state || state.started !== true || fcdGetActiveSaveId()) return false;

  const input = document.getElementById("fcd-save-name-input");
  const teamName = fcdGetTeamNameFromState(state);
  const saveName = input && input.value.trim()
    ? input.value.trim()
    : `${teamName} Save`;
  const created = fcdCreateFirstSave(saveName);

  if (created) {
    document.getElementById("fcd-save-name-dialog")?.classList.remove("open");
  }

  return created;
}

function fcdInstallAutoSaveOnClick() {
  document.addEventListener("click", () => {
    clearTimeout(fcdSaveClickTimer);

    fcdSaveClickTimer = setTimeout(() => {
      fcdSaveCurrentGame(true);
    }, 350);
  });
}

function fcdBootSaveManager() {
  fcdRemoveObsoleteSaveStorage();
  fcdRepairSaveIndex();
  fcdRemoveOrphanedNamedSavePayloads();
  fcdInstallSaveManagerUI();
  fcdInstallAutoSaveOnClick();
  fcdApplyPendingLoad();
}

document.addEventListener("DOMContentLoaded", fcdBootSaveManager);
