function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}


function formatDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function getCurrentDateKey() {
  if (!gameState || !gameState.currentDate) return null;

  const date = new Date(gameState.currentDate);
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function datesMatch(a, b) {
  return a.toDateString() === b.toDateString();
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isSameDate(dateA, dateB) {
  return formatDateKey(dateA) === formatDateKey(dateB);
}

function setText(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = value;
}

function formatMoney(amount) {
  const number = Number(amount || 0);
  return `$${number.toFixed(1).replace(".0", "")}M`;
}

function formatRoom(value) {
  const number = Number(value || 0);

  if (number >= 0) return formatMoney(number);

  return `-${formatMoney(Math.abs(number))}`;
}

function setFinanceValue(elementId, value) {
  const element = document.getElementById(elementId);

  if (!element) return;

  element.textContent = formatRoom(value);
  element.classList.remove("finance-good", "finance-warning", "finance-bad");

  if (value < 0) {
    element.classList.add("finance-bad");
  } else if (value < 5) {
    element.classList.add("finance-warning");
  } else {
    element.classList.add("finance-good");
  }
}

function formatWholeNumber(value) {
  return Math.round(Number(value || 0)).toLocaleString("en-US");
}

function getAverage(total, games) {
  if (!games || games <= 0) return "0.0";
  return (total / games).toFixed(1);
}

function getPercentage(made, attempted) {
  if (!attempted || attempted <= 0) return ".000";
  return (made / attempted).toFixed(3).replace("0", "");
}

function showModal(title, message) {
  const overlay = document.getElementById("modal-overlay");
  const titleElement = document.getElementById("modal-title");
  const messageElement = document.getElementById("modal-message");

  if (!overlay || !titleElement || !messageElement) return;

  titleElement.textContent = title;
  messageElement.textContent = message;
  overlay.classList.remove("hidden");
}

function closeModal() {
  const overlay = document.getElementById("modal-overlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }
}

function createMessage(title, body, type, urgent = false, actionType = null, extraData = {}) {
  return {
    id: Date.now() + Math.random(),
    title,
    body,
    type,
    urgent,
    resolved: false,
    actionType,
    ...extraData
  };
}

function addInboxMessage(title, body, type = "info", urgent = false, actionType = null, extraData = {}) {
  if (!gameState.inbox) {
    gameState.inbox = [];
  }

 const message = createMessage(title, body, type, urgent, actionType, extraData);

  if (!message.id) {
    message.id = `msg-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  if (message.unread === undefined) {
    message.unread = true;
  }

  gameState.inbox.unshift(message);

  if (gameState.inbox.length > 30) {
    gameState.inbox.pop();
  }

  return message;
}

function addInboxMessageOnce(title, body, type = "info", urgent = false, actionType = null) {
  const alreadyExists = gameState.inbox.some(message =>
    message.title === title &&
    message.body === body &&
    !message.resolved
  );

  if (alreadyExists) return;

  addInboxMessage(title, body, type, urgent, actionType);
}

function getUnresolvedUrgentMessages() {
  if (!gameState || !Array.isArray(gameState.inbox)) return [];

  return gameState.inbox.filter(message => {
    if (!message.urgent || message.resolved) return false;

    if (message.actionType === "offseason") {
      return typeof canStartOffseasonToday === "function" && canStartOffseasonToday();
    }

    if (message.actionType === "season_complete_rollover") {
      return typeof canStartOffseasonToday === "function" && canStartOffseasonToday();
    }

    return true;
  });
}

function hasBlockingUrgentMessage() {
  return getUnresolvedUrgentMessages().length > 0;
}

function formatShortDate(date) {
  const d = new Date(date);

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}


function hasUnresolvedUrgentMessages() {
  if (!gameState || !gameState.inbox) return false;

  const blocker = gameState.inbox.find(message =>
    message.blocksAdvance === true &&
    message.completed !== true
  );

  if (blocker) {
    console.warn("Advance blocked by inbox message:", blocker);
    return true;
  }

  return false;
}

function resolveUrgentMessage(messageId) {
  const message = gameState.inbox.find(item => item.id === messageId);

  if (message) {
    message.resolved = true;
    message.urgent = false;
    addInboxMessage("Action Completed", `${message.title} has been resolved.`, "staff");
  }

  refreshAll();
}

function resolveUrgentByType(actionType) {
  const message = gameState.inbox.find(item => item.actionType === actionType && item.urgent && !item.resolved);

  if (message) {
    message.resolved = true;
    message.urgent = false;
    addInboxMessage("Action Completed", `${message.title} has been resolved.`, "staff");
  } else {
    addInboxMessage("No Urgent Action", "There is no urgent action of that type right now.", "staff");
  }

  refreshAll();
}
function cleanUrgentMessageSpam() {
  if (!gameState || !gameState.inbox) return;

  const seenKeys = new Set();

  gameState.inbox = gameState.inbox.filter(message => {
    if (message.title === "Urgent Action Required") {
      const key = "urgent_action_required";

      if (seenKeys.has(key)) {
        return false;
      }

      seenKeys.add(key);
      message.blocking = false;
      message.blocksAdvance = false;
      return true;
    }

    if (
      message.title === "Expiring Contracts Warning" ||
      message.title === "Final Contract Warning"
    ) {
      message.blocking = false;
      message.blocksAdvance = false;
      return true;
    }

    return true;
  });
}
function clearNonEssentialAdvanceBlockers() {
  if (!gameState || !gameState.inbox) return;

  for (let message of gameState.inbox) {
    if (
      message.title === "Expiring Contracts Warning" ||
      message.title === "Final Contract Warning" ||
      message.title === "Urgent Action Required" ||
      message.title === "Play-In Tournament Begins" ||
      message.title === "Playoffs Begin" ||
      message.title === "Regular Season Complete" ||
      message.title === "League Free Agency Pool Updated" ||
      message.title === "League Free Agency Signings"
    ) {
      message.blocksAdvance = false;
      message.blocking = false;
    }
  }
}