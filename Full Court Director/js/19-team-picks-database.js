function getTradePicksForTeam(teamId) {
  const currentYear = gameState?.seasonStartYear || 2026;
  const picks = [];

  for (let year = currentYear + 1; year <= currentYear + 4; year++) {
    picks.push(createTemporaryTradePick(teamId, teamId, year, 1));
    picks.push(createTemporaryTradePick(teamId, teamId, year, 2));
  }

  return picks;
}

function createTemporaryTradePick(ownerTeamId, originalTeamId, year, round) {
  return {
    id: `pick_${ownerTeamId}_${originalTeamId}_${year}_${round}`,
    type: "pick",
    ownerTeamId: Number(ownerTeamId),
    originalTeamId: Number(originalTeamId),
    year,
    round,
    protection: "Unprotected"
  };
}

function getTradePickLabel(pick) {
  const originalTeam = getTeamById(pick.originalTeamId);
  const originalName = originalTeam ? originalTeam.name : "Team";
  const roundText = pick.round === 1 ? "1st" : "2nd";

  return `${pick.year} ${roundText} Round Pick`;
}

function getTradePickSubtext(pick) {
  const originalTeam = getTeamById(pick.originalTeamId);
  const originalName = originalTeam ? originalTeam.name : "Team";

  return `Original: ${originalName} · ${pick.protection}`;
}

function getTradeAssetForPick(pickId) {
  if (!tradeRoom || !Array.isArray(tradeRoom.assets)) return null;

  return tradeRoom.assets.find(asset =>
    asset.type === "pick" &&
    String(asset.pickId) === String(pickId)
  ) || null;
}

function getTradePickById(pickId, ownerTeamId) {
  return getTradePicksForTeam(ownerTeamId).find(pick =>
    String(pick.id) === String(pickId)
  ) || null;
}

function openSendPickModal(pickId, fromTeamId) {
  const modal = document.getElementById("trade-send-player-modal");
  if (!modal) return;

  const pick = getTradePickById(pickId, fromTeamId);
  if (!pick) return;

  const destinationTeams = tradeRoom.teams.filter(team =>
    Number(team.teamId) !== Number(fromTeamId)
  );

  if (destinationTeams.length === 0) {
    modal.innerHTML = `
      <div class="trade-send-player-panel">
        <h3>Add another team first</h3>
        <p>You need at least two teams in the trade before moving a pick.</p>
        <button type="button" onclick="closeSendPlayerModal()">Close</button>
      </div>
    `;
    modal.classList.remove("hidden");
    return;
  }

  modal.innerHTML = `
    <div class="trade-send-player-panel">
      <h3>Send ${getTradePickLabel(pick)} To:</h3>
      <p>${getTradePickSubtext(pick)}</p>

      <div class="trade-send-player-options">
        ${destinationTeams.map(item => {
          const team = getTeamById(item.teamId);

          return `
            <button type="button" onclick="assignPickToTrade('${pick.id}', '${fromTeamId}', '${item.teamId}')">
              ${team ? team.name : "Team"}
            </button>
          `;
        }).join("")}
      </div>

      ${getTradeAssetForPick(pick.id) ? `
        <button type="button" class="trade-remove-asset-button" onclick="removePickFromTrade('${pick.id}')">
          Remove From Trade
        </button>
      ` : ""}

      <button type="button" onclick="closeSendPlayerModal()">Cancel</button>
    </div>
  `;

  modal.classList.remove("hidden");
}

function assignPickToTrade(pickId, fromTeamId, toTeamId) {
  const pick = getTradePickById(pickId, fromTeamId);
  if (!pick) return;

  tradeRoom.assets = tradeRoom.assets.filter(asset =>
    !(asset.type === "pick" && String(asset.pickId) === String(pickId))
  );

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

  closeSendPlayerModal();
  updateTradeRoomHeader();
  renderTradeRoom();
}

function removePickFromTrade(pickId) {
  tradeRoom.assets = tradeRoom.assets.filter(asset =>
    !(asset.type === "pick" && String(asset.pickId) === String(pickId))
  );

  tradeRoom.leakRisk = Math.min(95, tradeRoom.assets.length * 15);

  closeSendPlayerModal();
  updateTradeRoomHeader();
  renderTradeRoom();
}