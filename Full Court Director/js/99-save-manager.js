// ============================================================
// FULL COURT DIRECTOR - INDEXEDDB SAVE MANAGER
// ============================================================

const FCD_SAVE_MANAGER = {
  dbName: "full_court_director_saves_v101",
  dbVersion: 1,
  storeName: "saves",
  activeSaveIdKey: "fcd_active_save_id_v101",
  pendingLoadKey: "fcd_pending_load_v101",
  legacyIndexKey: "fcd_saves_index_v101",
  legacySavePrefix: "fcd_save_v101_",
  migrationCompleteKey: "fcd_indexeddb_migration_v101"
};

let fcdSaveClickTimer = null;
let fcdSaveWriteChain = Promise.resolve();
let fcdPlayRenderVersion = 0;

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

function fcdBuildSaveMeta(saveId, saveName, state, updatedAt) {
  return {
    saveId,
    saveName,
    teamName: fcdGetTeamNameFromState(state),
    seasonLabel: state?.seasonLabel || "",
    savedAt: updatedAt
  };
}

function fcdBuildIndexedDbSave(saveId, saveName, state) {
  const updatedAt = new Date().toISOString();

  return {
    id: saveId,
    meta: fcdBuildSaveMeta(saveId, saveName, state, updatedAt),
    gameState: JSON.parse(JSON.stringify(state)),
    updatedAt
  };
}

function fcdGetSaveSizeMb(saveObject) {
  const bytes = new Blob([JSON.stringify(saveObject)]).size;
  return (bytes / (1024 * 1024)).toFixed(2);
}

function openFcdSaveDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(
      FCD_SAVE_MANAGER.dbName,
      FCD_SAVE_MANAGER.dbVersion
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(FCD_SAVE_MANAGER.storeName)) {
        const store = db.createObjectStore(FCD_SAVE_MANAGER.storeName, {
          keyPath: "id"
        });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open save database."));
    request.onblocked = () => reject(new Error("Save database upgrade is blocked by another tab."));
  });
}

async function saveGameToIndexedDB(saveId, saveObject) {
  const db = await openFcdSaveDb();

  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(FCD_SAVE_MANAGER.storeName, "readwrite");
      const store = transaction.objectStore(FCD_SAVE_MANAGER.storeName);

      store.put({
        ...saveObject,
        id: saveId,
        updatedAt: saveObject.updatedAt || new Date().toISOString()
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Save write failed."));
      transaction.onabort = () => reject(transaction.error || new Error("Save write was aborted."));
    });

    console.log(
      `[FCD Saves] Wrote ${saveId} (${fcdGetSaveSizeMb(saveObject)} MB)`
    );
    return true;
  } finally {
    db.close();
  }
}

async function loadGameFromIndexedDB(saveId) {
  const db = await openFcdSaveDb();

  try {
    const saveObject = await new Promise((resolve, reject) => {
      const transaction = db.transaction(FCD_SAVE_MANAGER.storeName, "readonly");
      const request = transaction.objectStore(FCD_SAVE_MANAGER.storeName).get(saveId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Save read failed."));
    });

    if (saveObject) {
      console.log(
        `[FCD Saves] Loaded ${saveId} (${fcdGetSaveSizeMb(saveObject)} MB)`
      );
    }

    return saveObject;
  } finally {
    db.close();
  }
}

async function deleteSaveFromIndexedDB(saveId) {
  const db = await openFcdSaveDb();

  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(FCD_SAVE_MANAGER.storeName, "readwrite");
      transaction.objectStore(FCD_SAVE_MANAGER.storeName).delete(saveId);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Save deletion failed."));
      transaction.onabort = () => reject(transaction.error || new Error("Save deletion was aborted."));
    });

    console.log(`[FCD Saves] Deleted ${saveId}`);
    return true;
  } finally {
    db.close();
  }
}

async function listSavesFromIndexedDB() {
  const db = await openFcdSaveDb();

  try {
    const saves = await new Promise((resolve, reject) => {
      const transaction = db.transaction(FCD_SAVE_MANAGER.storeName, "readonly");
      const request = transaction.objectStore(FCD_SAVE_MANAGER.storeName).getAll();

      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => reject(request.error || new Error("Could not list saves."));
    });

    return saves.sort((a, b) =>
      String(b.updatedAt || b.meta?.savedAt || "")
        .localeCompare(String(a.updatedAt || a.meta?.savedAt || ""))
    );
  } finally {
    db.close();
  }
}

function fcdRemoveObsoleteSaveStorage() {
  const keys = [];

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key) keys.push(key);
  }

  keys.forEach(key => {
    if (key === "fullCourtDirectorSave" || key.startsWith("fcd_save_manager_")) {
      localStorage.removeItem(key);
    }
  });
}

function fcdGetLegacyLocalSaveKeys() {
  const keys = [];

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);

    if (key && key.startsWith(FCD_SAVE_MANAGER.legacySavePrefix)) {
      keys.push(key);
    }
  }

  return keys;
}

async function fcdMigrateLocalStorageSaves() {
  const button = document.getElementById("fcd-migrate-saves-button");
  if (button) button.disabled = true;

  const keys = fcdGetLegacyLocalSaveKeys();
  let migrated = 0;

  for (const key of keys) {
    try {
      const payload = JSON.parse(localStorage.getItem(key));
      if (!payload?.gameState) throw new Error("Legacy payload has no gameState.");

      const saveId =
        payload.meta?.saveId ||
        key.slice(FCD_SAVE_MANAGER.legacySavePrefix.length) ||
        fcdCreateSaveId();
      const updatedAt =
        payload.meta?.savedAt ||
        new Date().toISOString();
      const saveObject = {
        id: saveId,
        meta: {
          ...(payload.meta || {}),
          saveId,
          saveName: payload.meta?.saveName || "Migrated Save",
          teamName: payload.meta?.teamName || fcdGetTeamNameFromState(payload.gameState),
          seasonLabel: payload.meta?.seasonLabel || payload.gameState.seasonLabel || "",
          savedAt: updatedAt
        },
        gameState: payload.gameState,
        updatedAt
      };

      await saveGameToIndexedDB(saveId, saveObject);
      localStorage.removeItem(key);
      migrated++;
      console.log(`[FCD Saves] Migrated ${key} to IndexedDB as ${saveId}`);
    } catch (error) {
      console.error(`[FCD Saves] Could not migrate ${key}:`, error);
    }
  }

  if (fcdGetLegacyLocalSaveKeys().length === 0) {
    localStorage.removeItem(FCD_SAVE_MANAGER.legacyIndexKey);
    localStorage.setItem(FCD_SAVE_MANAGER.migrationCompleteKey, "true");
  }

  fcdShowSaveToast(
    migrated
      ? `${migrated} save${migrated === 1 ? "" : "s"} migrated.`
      : "No saves were migrated."
  );
  await fcdRenderPlayScreen();
  return migrated;
}

async function fcdWriteNamedSave(saveId, saveName, options = {}) {
  const state = fcdGetGameState();
  if (!state || state.started !== true || !saveId) return false;

  const saveObject = fcdBuildIndexedDbSave(saveId, saveName, state);

  try {
    await saveGameToIndexedDB(saveId, saveObject);
    fcdSetActiveSaveId(saveId);

    if (options.toast !== false) {
      fcdShowSaveToast("Game saved.");
    }

    return true;
  } catch (error) {
    console.error("[FCD Saves] Save failed:", error);

    if (options.toast !== false) {
      fcdShowSaveToast("Save failed.");
    }

    return false;
  }
}

async function fcdCreateFirstSave(saveName) {
  const state = fcdGetGameState();
  if (!state || state.started !== true) return false;

  const saveId = fcdCreateSaveId();
  const created = await fcdWriteNamedSave(saveId, saveName, { toast: true });

  if (created) await fcdRenderPlayScreen();
  return created;
}

async function fcdSaveCurrentGame(silent = true) {
  const state = fcdGetGameState();
  const activeSaveId = fcdGetActiveSaveId();

  if (!state || state.started !== true || !activeSaveId) return false;

  fcdSaveWriteChain = fcdSaveWriteChain
    .catch(() => false)
    .then(async () => {
      const existingSave = await loadGameFromIndexedDB(activeSaveId);

      if (!existingSave) {
        console.warn("[FCD Saves] Active IndexedDB save is missing:", activeSaveId);
        return false;
      }

      return fcdWriteNamedSave(
        activeSaveId,
        existingSave.meta?.saveName || "Full Court Director Save",
        { toast: !silent }
      );
    });

  return fcdSaveWriteChain;
}

async function fcdLoadSave(saveId) {
  try {
    const saveObject = await loadGameFromIndexedDB(saveId);

    if (!saveObject?.gameState) {
      alert("Save not found.");
      return false;
    }

    localStorage.setItem(
      FCD_SAVE_MANAGER.pendingLoadKey,
      JSON.stringify({ saveId })
    );
    fcdSetActiveSaveId(saveId);
    window.location.reload();
    return true;
  } catch (error) {
    console.error("[FCD Saves] Could not load save:", error);
    alert("This save could not be loaded.");
    return false;
  }
}

async function fcdDeleteSave(saveId) {
  if (!confirm("Delete this save? This cannot be undone.")) return false;

  try {
    await deleteSaveFromIndexedDB(saveId);

    if (fcdGetActiveSaveId() === saveId) {
      fcdSetActiveSaveId("");
    }

    await fcdRenderPlayScreen();
    fcdShowSaveToast("Save deleted.");

    const state = fcdGetGameState();
    if (state?.started === true && !fcdGetActiveSaveId()) {
      setTimeout(() => {
        fcdClosePlayScreen();
        fcdAskForSaveNameIfNeeded();
      }, 150);
    }

    return true;
  } catch (error) {
    console.error("[FCD Saves] Delete failed:", error);
    fcdShowSaveToast("Delete failed.");
    return false;
  }
}

async function fcdApplyPendingLoad() {
  const raw = localStorage.getItem(FCD_SAVE_MANAGER.pendingLoadKey);
  if (!raw) return false;

  try {
    const pending = JSON.parse(raw);
    const saveObject = await loadGameFromIndexedDB(pending?.saveId || "");

    if (!saveObject?.gameState) {
      throw new Error("Pending IndexedDB save was not found.");
    }

    fcdSetGameState(saveObject.gameState);
    gameState.started = true;

    if (typeof normalizeGameStateAfterLoad === "function") {
      normalizeGameStateAfterLoad();
    }

    localStorage.removeItem(FCD_SAVE_MANAGER.pendingLoadKey);
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
    localStorage.removeItem(FCD_SAVE_MANAGER.pendingLoadKey);
    console.error("[FCD Saves] Pending load failed:", error);
    alert("This save could not be loaded.");
    return false;
  }
}

async function fcdRenderPlayScreen() {
  const panel = document.getElementById("fcd-play-screen-panel");
  if (!panel) return;

  const renderVersion = ++fcdPlayRenderVersion;
  panel.innerHTML = '<div class="fcd-save-loading">Loading saved games...</div>';

  try {
    const saves = await listSavesFromIndexedDB();
    if (renderVersion !== fcdPlayRenderVersion) return;

    const legacyCount = fcdGetLegacyLocalSaveKeys().length;

    panel.innerHTML = `
      <div class="fcd-save-page">
        <div class="fcd-save-header">
          <h2>Saved Games</h2>
          <div class="fcd-save-header-actions">
            ${legacyCount
              ? `<button id="fcd-migrate-saves-button" type="button" onclick="fcdMigrateLocalStorageSaves()">
                  Migrate ${legacyCount} Old Save${legacyCount === 1 ? "" : "s"}
                </button>`
              : ""}
            <button type="button" onclick="fcdStartNewSave()">Start New Save</button>
          </div>
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
                <div>${fcdSafeText(save.meta?.saveName || "Save")}</div>
                <div>${fcdSafeText(save.meta?.teamName || "Unknown Team")}</div>
                <div>${fcdSafeText(save.meta?.seasonLabel || "")}</div>
                <div>
                  <button type="button" onclick="fcdLoadSave('${fcdSafeText(save.id)}')">Play</button>
                </div>
                <div>
                  <button
                    type="button"
                    class="fcd-delete-save-button"
                    onclick="fcdDeleteSave('${fcdSafeText(save.id)}')"
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
  } catch (error) {
    console.error("[FCD Saves] Could not render saves:", error);
    panel.innerHTML = `
      <div class="fcd-save-empty-row">
        Saved games could not be opened. Refresh and try again.
      </div>
    `;
  }
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

    .fcd-save-loading,
    .fcd-save-empty-row {
      padding: 30px 18px;
      color: #cbd5e1;
      font-weight: 800;
    }

    .fcd-save-header,
    .fcd-save-header-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .fcd-save-header { margin-bottom: 22px; }

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
}

async function fcdOpenPlayScreen() {
  document.getElementById("fcd-play-screen-overlay")?.classList.add("open");
  await fcdRenderPlayScreen();
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

async function fcdConfirmFirstSaveName() {
  const state = fcdGetGameState();
  if (!state || state.started !== true || fcdGetActiveSaveId()) return false;

  const button = document.querySelector("#fcd-save-name-dialog button");
  const input = document.getElementById("fcd-save-name-input");
  const teamName = fcdGetTeamNameFromState(state);
  const saveName = input && input.value.trim()
    ? input.value.trim()
    : `${teamName} Save`;

  if (button) button.disabled = true;
  const created = await fcdCreateFirstSave(saveName);
  if (button) button.disabled = false;

  if (created) {
    document.getElementById("fcd-save-name-dialog")?.classList.remove("open");
  }

  return created;
}

function fcdInstallAutoSaveOnClick() {
  document.addEventListener("click", () => {
    clearTimeout(fcdSaveClickTimer);

    fcdSaveClickTimer = setTimeout(() => {
      fcdSaveCurrentGame(true).catch(error => {
        console.error("[FCD Saves] Autosave failed:", error);
      });
    }, 350);
  });
}

async function fcdBootSaveManager() {
  fcdRemoveObsoleteSaveStorage();
  fcdInstallSaveManagerUI();
  fcdInstallAutoSaveOnClick();

  const loaded = await fcdApplyPendingLoad();
  if (!loaded) await fcdRenderPlayScreen();
}

document.addEventListener("DOMContentLoaded", () => {
  fcdBootSaveManager().catch(error => {
    console.error("[FCD Saves] Boot failed:", error);
  });
});
