let currentGMHubApp = "desk";
let currentGMHubReportFilter = "all";
let currentGMHubMoveFilter = "all";
let currentGMHubDeskFilter = "all";

/* Keep these for old message code that may still exist. */
let currentGMMessageFilter = "all";
let currentGMMessageThreadId = null;

let dashboardInboxFilter = "all";

let pendingCreatedGM = null;

let currentGMHubPhoneThreadId = null;
let currentGMHubPhoneSearch = "";



function scrollDashboardSchedule(direction) {
  const track = document.getElementById("dashboard-schedule-track");
  if (!track) return;

  track.scrollBy({
    left: direction * 520,
    behavior: "smooth"
  });
}

function setDashboardInboxFilter(filter) {
  dashboardInboxFilter = filter || "all";

  const tabs = ["all", "league", "team", "injuries", "staff"];

  for (let tab of tabs) {
    const button = document.getElementById(`dashboard-inbox-tab-${tab}`);
    if (button) {
      button.classList.toggle("active", dashboardInboxFilter === tab);
    }
  }

  displayInbox();
}

function markDashboardInboxRead() {
  if (!gameState || !Array.isArray(gameState.inbox)) return;

  for (let message of gameState.inbox) {
    message.read = true;
    message.unread = false;
  }

  refreshAll();
}

function displayHeader() {
  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return;

  setText("header-team-name", selectedTeam.name);
  setText("header-season", gameState.seasonLabel);
  setText("header-date", formatDate(gameState.currentDate));
  setText("header-record", `${selectedTeam.wins}-${selectedTeam.losses}`);

  updateTopNavDateBoxes();
}

function updateTopNavDateBoxes() {
  if (!gameState || !gameState.currentDate) return;

  const date = new Date(gameState.currentDate);

  setText("fcd-date-month", date.getMonth() + 1);
  setText("fcd-date-day", date.getDate());
  setText("fcd-date-year", String(date.getFullYear()).slice(-2));
}

function getGMMessageTypeLabel(type) {
  const normalized = String(type || "staff").toLowerCase();

  if (normalized === "player") return "Player";
  if (normalized === "coach") return "Coach";
  if (normalized === "owner") return "Owner";
  if (normalized === "agent") return "Agent";
  if (normalized === "gm") return "General Manager";
  if (normalized === "staff") return "Staff";
  if (normalized === "league") return "League Office";
  if (normalized === "scouting") return "Scouting";
  if (normalized === "medical" || normalized === "injury" || normalized === "injuries") return "Medical";

  return "Staff";
}

function getGMMessageAvatarText(message) {
  const type = String(message.type || "staff").toLowerCase();

  if (type === "owner") return "O";
  if (type === "agent") return "A";
  if (type === "gm") return "GM";
  if (type === "coach") return "C";
  if (type === "player") return "P";
  if (type === "league") return "NHA";
  if (type === "scouting") return "SC";
  if (type === "medical" || type === "injury" || type === "injuries") return "MED";

  return "S";
}

function getGMMessageSenderName(message) {
  const type = String(message.type || "staff").toLowerCase();

  if (message.senderName) return message.senderName;
  if (message.sender) return message.sender;

  if (type === "owner") return "Owner";
  if (type === "agent") return "Agent";
  if (type === "gm") return "Rival GM";
  if (type === "coach") return "Coaching Staff";
  if (type === "player") return "Player";
  if (type === "league") return "League Office";
  if (type === "scouting") return "Scouting Department";
  if (type === "medical" || type === "injury" || type === "injuries") return "Medical Staff";

  return "Staff";
}

function getGMHubMessages() {
  const inbox = Array.isArray(gameState.inbox) ? gameState.inbox : [];

  return inbox
    .filter(message => {
      const type = String(message.type || "").toLowerCase();

      return [
        "player",
        "coach",
        "owner",
        "agent",
        "gm"
      ].includes(type);
    })
    .map((message, index) => ({
      ...message,
      gmMessageId: message.id || message.messageId || `inbox-${index}`,
      senderName: getGMMessageSenderName(message),
      senderTypeLabel: getGMMessageTypeLabel(message.type),
      avatarText: getGMMessageAvatarText(message),
      preview: message.body || message.message || message.title || "No message preview.",
      unread: message.unread !== false
    }))
    .filter(message => {
      if (currentGMMessageFilter === "all") return true;

      const type = String(message.type || "").toLowerCase();

      if (currentGMMessageFilter === "player") return type === "player";
      if (currentGMMessageFilter === "coach") return type === "coach";
      if (currentGMMessageFilter === "owner") return type === "owner";
      if (currentGMMessageFilter === "agent") return type === "agent";
      if (currentGMMessageFilter === "gm") return type === "gm";

      return true;
    });
}

function setGMMessageFilter(filterName) {
  currentGMMessageFilter = filterName;

  const buttons = document.querySelectorAll(".gm-hub-message-filters button");

  for (let button of buttons) {
    button.classList.remove("active");
  }

  const activeButton = document.getElementById(`gm-message-filter-${filterName}`);

  if (activeButton) {
    activeButton.classList.add("active");
  }

  renderGMHubMessagesList();
}

function renderGMHubMessagesList() {
  const container = document.getElementById("gm-hub-messages-list");

  if (!container) return;

  const messages = getGMHubMessages();

  if (messages.length === 0) {
    container.innerHTML = `<div class="gm-hub-empty">No messages in this category yet.</div>`;
    return;
  }

  container.innerHTML = messages.map(message => {
    const unreadDot = message.unread ? `<span class="gm-message-unread-dot"></span>` : "";
    const dateText = message.dateText || message.date || "Today";

    return `
      <div class="gm-message-row" onclick="openGMHubMessageThread('${message.gmMessageId}')">
        <div class="gm-message-avatar">${message.avatarText}</div>

        <div class="gm-message-row-main">
          <div class="gm-message-row-top">
            <strong>${message.senderName}</strong>
            <span>${dateText}</span>
          </div>

          <div class="gm-message-row-preview">
            <span>${message.senderTypeLabel}</span>
            <p>${message.preview}</p>
          </div>
        </div>

        ${unreadDot}
        <div class="gm-message-chevron">›</div>
      </div>
    `;
  }).join("");
}

function openGMHubMessageThread(messageId) {
  currentGMMessageThreadId = messageId;

  const inbox = Array.isArray(gameState.inbox) ? gameState.inbox : [];

  const message = inbox
    .map((item, index) => ({
      ...item,
      gmMessageId: item.id || item.messageId || `inbox-${index}`
    }))
    .find(item => String(item.gmMessageId) === String(messageId));

  if (!message) return;

  message.unread = false;

  const listView = document.getElementById("gm-hub-messages-list-view");
  const threadView = document.getElementById("gm-hub-message-thread-view");

  if (listView) listView.classList.remove("active");
  if (threadView) threadView.classList.add("active");

  setText("gm-message-thread-name", getGMMessageSenderName(message));
  setText("gm-message-thread-type", getGMMessageTypeLabel(message.type));

  const body = document.getElementById("gm-message-thread-body");

  if (!body) return;

  const messageText = message.body || message.message || message.title || "No message text available.";
  const titleText = message.title || getGMMessageTypeLabel(message.type);

  body.innerHTML = `
    <div class="gm-chat-date-divider">Today</div>

    <div class="gm-chat-bubble incoming">
      <strong>${titleText}</strong>
      <p>${messageText}</p>
    </div>

    <div class="gm-chat-bubble outgoing">
      <p>Noted. I’ll review this with the front office.</p>
      <small>Auto response placeholder</small>
    </div>
  `;

  displayGMHub();
  openGMHubMessageThreadViewOnly();
}

function openGMHubMessageThreadViewOnly() {
  const listView = document.getElementById("gm-hub-messages-list-view");
  const threadView = document.getElementById("gm-hub-message-thread-view");

  if (listView) listView.classList.remove("active");
  if (threadView) threadView.classList.add("active");
}

function closeGMHubMessageThread() {
  currentGMMessageThreadId = null;

  const listView = document.getElementById("gm-hub-messages-list-view");
  const threadView = document.getElementById("gm-hub-message-thread-view");

  if (threadView) threadView.classList.remove("active");
  if (listView) listView.classList.add("active");

  renderGMHubMessagesList();
  updateGMHubBadges();
}

function getSafeGMHubApp(appName) {
  const safeApps = ["desk", "reports", "moves", "courtlink", "trash"];
  const normalized = String(appName || "desk").toLowerCase();

  return safeApps.includes(normalized) ? normalized : "desk";
}

function dedupeGMHubItems(items) {
  const seen = new Set();

  return items.filter(item => {
    const key = [
      item.id || item.messageId || "",
      item.title || "",
      item.actionType || "",
      item.body || item.message || ""
    ].join("|");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getGMHubNormalizedType(item) {
  return String(item?.type || "").toLowerCase().trim();
}

function getGMHubNormalizedAction(item) {
  return String(item?.actionType || "").toLowerCase().trim();
}

function getGMHubSearchText(item) {
  return [
    item?.title,
    item?.body,
    item?.message,
    item?.description,
    item?.type,
    item?.actionType,
    item?.label,
    item?.category
  ].join(" ").toLowerCase();
}

function isGMHubIgnoredItem(item) {
  const text = getGMHubSearchText(item);
  const title = String(item?.title || "").toLowerCase().trim();

  return (
    item?.gmHubIgnore === true ||
    title === "save complete" ||
    text.includes("save complete") ||
    text.includes("game saved") ||
    text.includes("save successful")
  );
}

function isGMHubMoveItem(item) {
  if (!item || isGMHubIgnoredItem(item)) return false;

  const type = getGMHubNormalizedType(item);
  const text = getGMHubSearchText(item);

  const moveTypes = [
    "trade",
    "trades",
    "transaction",
    "transactions",
    "signing",
    "signings",
    "waive",
    "waiver",
    "waivers",
    "g-league",
    "gleague",
    "extension",
    "extensions",
    "buyout",
    "buyouts",
    "staff movement"
  ];

  if (moveTypes.includes(type)) return true;

  if (
    text.includes("free agent signed") ||
    text.includes("signed with") ||
    text.includes("signed by") ||
    text.includes("agreed to a") ||
    text.includes("agreed to an") ||
    text.includes("re-signed") ||
    text.includes("extended") ||
    text.includes("contract extension") ||
    text.includes("traded") ||
    text.includes("acquired") ||
    text.includes("sent to") ||
    text.includes("waived") ||
    text.includes("claimed") ||
    text.includes("buyout")
  ) {
    return true;
  }

  if (type === "staff") {
    return (
      text.includes("staff movement") ||
      text.includes("hired") ||
      text.includes("fired") ||
      text.includes("joined") ||
      text.includes("promoted") ||
      text.includes("named head coach") ||
      text.includes("named assistant") ||
      text.includes("named scout")
    );
  }

  return false;
}

function isGMHubDeskInboxItem(item) {
  if (!item || isGMHubIgnoredItem(item)) return false;
  if (isGMHubMoveItem(item)) return false;

  const type = getGMHubNormalizedType(item);
  const action = getGMHubNormalizedAction(item);
  const text = getGMHubSearchText(item);

  const directMessageTypes = [
    "player",
    "coach",
    "owner",
    "agent",
    "gm"
  ];

  if (directMessageTypes.includes(type)) return true;

  const deskTypes = [
    "urgent",
    "event",
    "task",
    "reminder",
    "front office",
    "deadline"
  ];

  if (deskTypes.includes(type)) return true;

  const deskActions = [
    "fix-roster",
    "free-agency",
    "gameplan",
    "contracts",
    "standings",
    "draft-lottery",
    "draft-night",
    "rookie-signing"
  ];

  if (deskActions.includes(action)) return true;

  return (
    item.urgent === true ||
    text.includes("required") ||
    text.includes("ready") ||
    text.includes("opens") ||
    text.includes("deadline") ||
    text.includes("due") ||
    text.includes("review") ||
    text.includes("prepare") ||
    text.includes("fix") ||
    text.includes("training camp") ||
    text.includes("draft lottery") ||
    text.includes("draft night") ||
    text.includes("free agency opens") ||
    text.includes("trade deadline")
  );
}

function isGMHubReportItem(item) {
  if (!item || isGMHubIgnoredItem(item)) return false;
  if (isGMHubMoveItem(item)) return false;
  if (isGMHubDeskInboxItem(item)) return false;

  const type = getGMHubNormalizedType(item);
  const action = getGMHubNormalizedAction(item);
  const text = getGMHubSearchText(item);

  const reportTypes = [
    "staff",
    "game",
    "games",
    "result",
    "results",
    "injury",
    "injuries",
    "medical",
    "scouting",
    "scout",
    "analytics",
    "report",
    "reports",
    "roster",
    "draft",
    "league",
    "game prep"
  ];

  if (reportTypes.includes(type)) return true;

  const reportActions = [
    "next-game-scout",
    "box-score",
    "injury-report"
  ];

  if (reportActions.includes(action)) return true;

  return (
    text.includes("report") ||
    text.includes("scouting") ||
    text.includes("scout") ||
    text.includes("medical") ||
    text.includes("injury") ||
    text.includes("box score") ||
    text.includes("game log") ||
    text.includes("analytics") ||
    text.includes("matchup notes")
  );
}

function setGMHubApp(appName) {
  currentGMHubApp = getSafeGMHubApp(appName);

  if (currentGMHubApp === "trash") {
    openGMHubTrashPanel();
    return;
  }

  const panels = document.querySelectorAll(".gm-hub-panel");

  for (let panel of panels) {
    panel.classList.remove("active");
  }

  const selectedPanel = document.getElementById(`gm-hub-panel-${currentGMHubApp}`);

  if (selectedPanel) {
    selectedPanel.classList.add("active");
  }

  const dockButtons = document.querySelectorAll(".gm-hub-dock button");

  for (let button of dockButtons) {
    button.classList.toggle("active", button.dataset.gmApp === currentGMHubApp);
  }

  updateGMHubBadges();
}

function createGMHubSystemItem(title, body, type = "system", urgent = false, actionType = null) {
  return {
    title,
    body,
    type,
    urgent,
    actionType,
    systemGenerated: true,
    unread: true
  };
}

function getGMHubUrgentItems() {
  const urgentItems = [];

  if (!gameState || !gameState.started) {
    return urgentItems;
  }

  const rosterStatus = getTeamRosterStatus(gameState.selectedTeamId);

  if (rosterStatus && !rosterStatus.legal) {
    urgentItems.push(createGMHubSystemItem(
      "Roster Not Legal",
      rosterStatus.problems.join(" "),
      "roster",
      true,
      "fix-roster"
    ));
  }

  if (gameState.draft && gameState.draft.lotteryReady && !gameState.draft.lotteryComplete) {
    urgentItems.push(createGMHubSystemItem(
      "Draft Lottery Ready",
      "The draft lottery is ready to be completed.",
      "draft",
      true,
      "draft-lottery"
    ));
  }

  if (gameState.draft && gameState.draft.draftReady && !gameState.draft.draftComplete) {
    urgentItems.push(createGMHubSystemItem(
      "Draft Night Ready",
      "The draft is ready. Enter draft night to make your selections.",
      "draft",
      true,
      "draft-night"
    ));
  }

  if (
    gameState.draft &&
    gameState.draft.draftComplete &&
    !gameState.draft.rookieSigningComplete
  ) {
    urgentItems.push(createGMHubSystemItem(
      "Rookie Signing Required",
      "Your drafted rookies need to be signed before the offseason can fully continue.",
      "draft",
      true,
      "rookie-signing"
    ));
  }

  const injuredPlayers = getRosterByTeamId(gameState.selectedTeamId).filter(player => {
    ensurePlayerInjuryFields(player);
    return player.injured || player.injuryDaysRemaining > 0;
  });

  if (injuredPlayers.length > 0) {
    urgentItems.push(createGMHubSystemItem(
      "Injury Update",
      `${injuredPlayers.length} player${injuredPlayers.length === 1 ? "" : "s"} on your roster currently need injury monitoring.`,
      "medical",
      false,
      "injury-report"
    ));
  }

  return urgentItems;
}

function getGMHubTaskItems() {
  const tasks = [];

  if (!gameState || !gameState.started) {
    return tasks;
  }

  const selectedTeam = getSelectedTeam();
  const roster = getRosterByTeamId(gameState.selectedTeamId);
  const standardPlayers = getStandardRosterPlayers(gameState.selectedTeamId);
  const rules = getRosterRulesForCurrentDate();
  const rosterStatus = getTeamRosterStatus(gameState.selectedTeamId);
  const nextGame = getNextGame();

  if (rosterStatus && !rosterStatus.legal) {
    tasks.push(createGMHubSystemItem(
      "Fix roster legality",
      rosterStatus.problems.join(" "),
      "roster",
      true,
      "fix-roster"
    ));
  }

  if (standardPlayers.length < rules.maxStandard) {
    tasks.push(createGMHubSystemItem(
      "Review open roster spots",
      `${rules.maxStandard - standardPlayers.length} standard roster spot${rules.maxStandard - standardPlayers.length === 1 ? "" : "s"} available.`,
      "front office",
      false,
      "free-agency"
    ));
  }

  if (gameState.rotation) {
  const rotationSlots = Array.isArray(gameState.rotation)
    ? gameState.rotation
    : Object.values(gameState.rotation);

  const emptyRotationSlots = rotationSlots.filter(slot =>
    !slot || (!slot.playerId && !slot.id)
  ).length;

  if (emptyRotationSlots > 0) {
    tasks.push(createGMHubSystemItem(
      "Review rotation",
      `${emptyRotationSlots} rotation slot${emptyRotationSlots === 1 ? "" : "s"} are empty.`,
      "coaching",
      false,
      "gameplan"
    ));
  } else {
    tasks.push(createGMHubSystemItem(
      "Review gameplan",
      "Check your rotation and tactics before the next game.",
      "coaching",
      false,
      "gameplan"
    ));
  }
}

  const expiringPlayers = roster.filter(player =>
    Number(player.contractYears || 0) <= 1
  );

  if (expiringPlayers.length > 0) {
    tasks.push(createGMHubSystemItem(
      "Review expiring contracts",
      `${expiringPlayers.length} player${expiringPlayers.length === 1 ? "" : "s"} have expiring contracts.`,
      "contracts",
      false,
      "contracts"
    ));
  }

  if (canNegotiateWithFreeAgents()) {
    tasks.push(createGMHubSystemItem(
      "Review free agent market",
      "Free agency is open. Check the market for possible roster upgrades.",
      "free agency",
      false,
      "free-agency"
    ));
  }

  if (nextGame) {
    tasks.push(createGMHubSystemItem(
      "Prepare for next opponent",
      `${selectedTeam.name} plays ${nextGame.home ? "vs" : "at"} ${nextGame.opponentName}. Review rotation, health, and matchup notes.`,
      "game prep",
      false,
      "gameplan"
    ));
  }

  tasks.push(createGMHubSystemItem(
    "Review team standings",
    "Check your conference position, games back, and current streak.",
    "league",
    false,
    "standings"
  ));

    return tasks;
}

function getGMHubPhoneRoleLabel(type) {
  const normalized = String(type || "").toLowerCase();

  if (normalized === "gm") return "General Manager";
  if (normalized === "agent") return "Agent";
  if (normalized === "owner") return "Owner";
  if (normalized === "coach") return "Coach";
  if (normalized === "player") return "Player";
  if (normalized === "staff") return "Staff";

  return "League Contact";
}

function getGMHubPhoneAvatarText(name, type = "") {
  const clean = String(name || "").trim();

  if (clean) {
    const pieces = clean.split(/\s+/).slice(0, 2);
    return pieces.map(piece => piece.charAt(0).toUpperCase()).join("");
  }

  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType === "gm") return "GM";
  if (normalizedType === "agent") return "AG";
  if (normalizedType === "owner") return "OW";
  if (normalizedType === "coach") return "HC";
  if (normalizedType === "player") return "PL";
  if (normalizedType === "staff") return "ST";

  return "PH";
}




function updateGMHubPhoneButtonNotification() {
  const badge = document.getElementById("gm-hub-phone-badge");
  const button = document.getElementById("gm-hub-phone-button");

  if (!badge || !button) return;

  const unreadCount = getGMHubPhoneUnreadCount();

  badge.textContent = unreadCount;
  badge.classList.toggle("hidden", unreadCount <= 0);

  button.classList.toggle("has-unread-phone", unreadCount > 0);
}

function renderGMHubPhoneButtonNotification() {
  updateGMHubPhoneButtonNotification();
}

function ensureGMHubPhoneState() {
  if (!gameState) {
    return {
      threadMeta: {},
      threads: {},
      saveStartDateKey: "",
      ownerIntroSent: false
    };
  }

  if (!gameState.gmHubPhone) {
    gameState.gmHubPhone = {};
  }

  if (!gameState.gmHubPhone.threadMeta) {
    gameState.gmHubPhone.threadMeta = {};
  }

  if (!gameState.gmHubPhone.threads) {
    gameState.gmHubPhone.threads = {};
  }

  if (!gameState.gmHubPhone.saveStartDateKey) {
    gameState.gmHubPhone.saveStartDateKey = getGMHubCurrentDateKey();
  }

  if (gameState.gmHubPhone.ownerIntroSent !== true) {
    gameState.gmHubPhone.ownerIntroSent = false;
  }

  return gameState.gmHubPhone;
}

function getGMHubPhoneSeedThreads() {
  return [
    {
      id: "phone-seed-owner",
      type: "owner",
      name: "Marcus Ellison",
      role: "Owner",
      preview: "Good start. Keep the roster flexible heading into opening night.",
      time: "9:14 AM",
      unread: true,
      messages: [
        {
          direction: "incoming",
          text: "Good start. Keep the roster flexible heading into opening night.",
          meta: "Today · 9:14 AM"
        },
        {
          direction: "outgoing",
          text: "Understood. I’ll keep monitoring the market.",
          meta: "Delivered"
        }
      ]
    },
    {
      id: "phone-seed-coach",
      type: "coach",
      name: "Tyrell Benson",
      role: "Head Coach",
      preview: "I want to revisit the rotation before the next game.",
      time: "Yesterday",
      unread: false,
      messages: [
        {
          direction: "incoming",
          text: "I want to revisit the rotation before the next game.",
          meta: "Yesterday · 7:28 PM"
        },
        {
          direction: "incoming",
          text: "I think the second unit needs more ball-handling.",
          meta: "Yesterday · 7:29 PM"
        },
        {
          direction: "outgoing",
          text: "Let’s review it tomorrow morning.",
          meta: "Delivered"
        }
      ]
    },
    {
      id: "phone-seed-agent",
      type: "agent",
      name: "Darren Cole",
      role: "Agent",
      preview: "My client wants to know how you see his role this season.",
      time: "Mon",
      unread: true,
      messages: [
        {
          direction: "incoming",
          text: "My client wants to know how you see his role this season.",
          meta: "Mon · 2:41 PM"
        },
        {
          direction: "outgoing",
          text: "We still view him as part of the rotation.",
          meta: "Delivered"
        }
      ]
    },
    {
      id: "phone-seed-gm",
      type: "gm",
      name: "Chicago GM",
      role: "General Manager",
      preview: "Would you have interest in discussing veteran wing options?",
      time: "Sun",
      unread: false,
      messages: [
        {
          direction: "incoming",
          text: "Would you have interest in discussing veteran wing options?",
          meta: "Sun · 11:03 AM"
        },
        {
          direction: "outgoing",
          text: "Potentially. Send me the framework you have in mind.",
          meta: "Delivered"
        }
      ]
    }
  ];
}

function getGMHubPhoneThreads() {
  if (!gameState || !gameState.started) return [];

  ensureOwnerIntroPhoneText();

  const phoneState = ensureGMHubPhoneState();
  let threads = Object.values(phoneState.threads || {});

  /* Phone conversations include staff texts and outgoing GM trade discussions. */
  threads = threads.filter(thread =>
    ["owner", "coach", "gm", "group-trade", "trade"].includes(String(thread.type || "").toLowerCase()) ||
    thread.tradeThread === true
  );

  threads = threads.map(thread => {
    const meta = phoneState.threadMeta[thread.id] || {};

    return {
      ...thread,
      unread: meta.unread !== false && thread.unread !== false
    };
  });

  const searchText = String(currentGMHubPhoneSearch || "").trim().toLowerCase();

  if (searchText) {
    threads = threads.filter(thread => {
      const haystack = [
        thread.name,
        thread.role,
        thread.preview,
        ...(Array.isArray(thread.messages) ? thread.messages.map(message => message.text) : [])
      ].join(" ").toLowerCase();

      return haystack.includes(searchText);
    });
  }

  return threads.sort((a, b) => {
    const dateA = getGMHubDateObjectFromKey(a.createdDateKey || getGMHubCurrentDateKey()).getTime();
    const dateB = getGMHubDateObjectFromKey(b.createdDateKey || getGMHubCurrentDateKey()).getTime();

    return dateB - dateA;
  });
}

function openGMHubPhoneModal(threadId = null) {
  const modal = document.getElementById("gm-hub-phone-modal");
  if (!modal) return;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("gm-hub-phone-open");

  const threads = getGMHubPhoneThreads();

  if (threadId) {
    currentGMHubPhoneThreadId = threadId;
  } else if (
    !currentGMHubPhoneThreadId ||
    !threads.some(thread => String(thread.id) === String(currentGMHubPhoneThreadId))
  ) {
    currentGMHubPhoneThreadId = threads.length > 0 ? threads[0].id : null;
  }

  renderGMHubPhoneModal();
}

function initializeGMHubPhoneButton() {
  const phoneButtons = document.querySelectorAll("#gm-hub-phone-button, .gm-hub-phone-button");

  for (let button of phoneButtons) {
    button.disabled = false;
    button.removeAttribute("disabled");
    button.onclick = null;

    button.addEventListener("click", function(event) {
      event.preventDefault();
      event.stopPropagation();

      openGMHubPhoneModal();
    });
  }
}

document.addEventListener("DOMContentLoaded", initializeGMHubPhoneButton);

function closeGMHubPhoneModal() {
  const modal = document.getElementById("gm-hub-phone-modal");
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("gm-hub-phone-open");
}

function setGMHubPhoneSearch(value) {
  currentGMHubPhoneSearch = value || "";

  const threads = getGMHubPhoneThreads();

  if (
    currentGMHubPhoneThreadId &&
    !threads.some(thread => String(thread.id) === String(currentGMHubPhoneThreadId))
  ) {
    currentGMHubPhoneThreadId = threads.length > 0 ? threads[0].id : null;
  }

  renderGMHubPhoneModal();
}

function selectGMHubPhoneThread(threadId) {
  const phoneState = ensureGMHubPhoneState();
  currentGMHubPhoneThreadId = threadId;

  if (!phoneState.threadMeta[threadId]) {
    phoneState.threadMeta[threadId] = {};
  }

  phoneState.threadMeta[threadId].unread = false;

  if (phoneState.threads && phoneState.threads[threadId]) {
    phoneState.threads[threadId].unread = false;
  }

  renderGMHubPhoneModal();
  updateGMHubPhoneButtonNotification();
}

function openGMHubNewMessagePlaceholder() {
  if (typeof showModal === "function") {
    showModal(
      "New Message",
      "Choosing who you want to message is coming later."
    );
  }
}

function renderGMHubPhoneThreadList() {
  const container = document.getElementById("gm-hub-phone-thread-list");
  if (!container) return;

  const threads = getGMHubPhoneThreads();

  if (!threads.length) {
    container.innerHTML = `<div class="gm-hub-phone-thread-empty">No texts yet.</div>`;
    return;
  }

  container.innerHTML = threads.map(thread => `
    <div
      class="gm-hub-phone-thread-item ${String(thread.id) === String(currentGMHubPhoneThreadId) ? "active" : ""}"
      onclick="selectGMHubPhoneThread('${thread.id}')"
    >
      <div class="gm-hub-phone-thread-avatar">
        ${getGMHubPhoneAvatarText(thread.name, thread.type)}
      </div>

      <div class="gm-hub-phone-thread-main">
        <div class="gm-hub-phone-thread-top">
          <strong>${thread.name}</strong>
          <span class="gm-hub-phone-thread-time">${thread.time || ""}</span>
        </div>

        <div class="gm-hub-phone-thread-role">${thread.role}</div>
        <div class="gm-hub-phone-thread-preview">${thread.preview || ""}</div>
      </div>

      ${thread.unread ? `<div class="gm-hub-phone-thread-unread"></div>` : ``}
    </div>
  `).join("");
}

function renderGMHubPhoneConversation() {
  const header = document.getElementById("gm-hub-phone-thread-header");
  const messageList = document.getElementById("gm-hub-phone-message-list");
  const compose = document.getElementById("gm-hub-phone-compose");

  if (!header || !messageList) return;

  const threads = getGMHubPhoneThreads();
  const thread = threads.find(item => String(item.id) === String(currentGMHubPhoneThreadId));

  if (!thread) {
    header.innerHTML = "";
    messageList.innerHTML = `<div class="gm-hub-phone-empty-thread">Select a conversation.</div>`;

    if (compose) {
      compose.innerHTML = `
        <input type="text" placeholder="Select a conversation..." disabled>
        <button type="button" disabled>Send</button>
      `;
      compose.classList.remove("reply-mode");
    }

    return;
  }

  header.innerHTML = `
    <div class="gm-hub-phone-thread-header-avatar">
      ${getGMHubPhoneAvatarText(thread.name, thread.type)}
    </div>

    <div class="gm-hub-phone-thread-header-copy">
      <strong>${thread.name}</strong>
      <span>${thread.role}</span>
    </div>
  `;

  messageList.innerHTML = (thread.messages || []).map(message => `
    <div class="gm-hub-phone-message-row ${message.direction}">
      <div class="gm-hub-phone-bubble-wrap">
        <div class="gm-hub-phone-message-bubble">
          ${message.senderName ? `<div class="gm-hub-phone-message-sender">${message.senderName}</div>` : ""}
          ${message.text}
          ${renderGMHubPhoneMessageAttachments(message)}
        </div>
        <div class="gm-hub-phone-message-meta">${message.meta || ""}</div>
        ${message.endsConversation ? `<div class="gm-hub-phone-message-end-line"></div>` : ""}
      </div>
    </div>
  `).join("");

  if (compose) {
    const responseOptions = Array.isArray(thread.responseOptions)
      ? thread.responseOptions
      : [];

    if (responseOptions.length > 0 && thread.responded !== true && thread.closed !== true) {
      compose.classList.add("reply-mode");

      compose.innerHTML = `
        <div class="gm-hub-phone-reply-options">
          ${responseOptions.map((option, index) => {
            const optionText = typeof option === "string"
              ? option
              : option.text;

            return `
              <button
                type="button"
                class="gm-hub-phone-reply-option"
                onclick="handleGMHubPhoneReply('${thread.id}', ${index})"
              >
                ${optionText}
              </button>
            `;
          }).join("")}
        </div>
      `;
    } else {
      compose.classList.remove("reply-mode");

      compose.innerHTML = `
        <input
          type="text"
          placeholder="${thread.closed ? "Conversation ended." : "Reply system coming later..."}"
          disabled
        >
        <button type="button" disabled>Send</button>
      `;
    }
  }

  messageList.scrollTop = messageList.scrollHeight;
}

function renderGMHubPhoneMessageAttachments(message) {
  const attachments = Array.isArray(message?.attachments)
    ? message.attachments
    : [];

  if (!attachments.length) return "";

  return attachments.map(attachment => {
    if (
      attachment &&
      String(attachment.source || "").startsWith("trade") &&
      typeof renderCompactTradePackageAttachment === "function"
    ) {
      return renderCompactTradePackageAttachment(attachment);
    }

    return "";
  }).join("");
}

function renderGMHubPhoneModal() {
  renderGMHubPhoneTopbarUnread();
  updateGMHubPhoneButtonNotification();
  renderGMHubPhoneThreadList();
  renderGMHubPhoneConversation();
}

function ensureGMHubState() {
  if (!gameState) {
    return {
      itemMeta: {},
      trash: [],
      itemSequence: 0
    };
  }

  if (!gameState.gmHub) {
    gameState.gmHub = {};
  }

  if (!gameState.gmHub.itemMeta) {
    gameState.gmHub.itemMeta = {};
  }

  if (!Array.isArray(gameState.gmHub.trash)) {
    gameState.gmHub.trash = [];
  }

  if (!Number.isFinite(Number(gameState.gmHub.itemSequence))) {
    gameState.gmHub.itemSequence = 0;
  }

  const currentSeasonLabel = String(gameState.seasonLabel || "");

  if (
    currentSeasonLabel &&
    gameState.gmHub.seasonLabel &&
    gameState.gmHub.seasonLabel !== currentSeasonLabel
  ) {
    gameState.gmHub.itemMeta = {};
    gameState.gmHub.trash = [];
    gameState.gmHub.itemSequence = 0;
  }

  if (currentSeasonLabel) {
    gameState.gmHub.seasonLabel = currentSeasonLabel;
  }

  return gameState.gmHub;
}

function getGMHubCurrentDateObject() {
  if (gameState && gameState.currentDate) {
    const date = new Date(gameState.currentDate);

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date();
}

function getGMHubDateKey(dateValue) {
  const date = dateValue ? new Date(dateValue) : getGMHubCurrentDateObject();

  if (Number.isNaN(date.getTime())) {
    return getGMHubDateKey(getGMHubCurrentDateObject());
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getGMHubCurrentDateKey() {
  return getGMHubDateKey(getGMHubCurrentDateObject());
}

function getGMHubDateObjectFromKey(dateKey) {
  const parts = String(dateKey || "").split("-").map(Number);

  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  return getGMHubCurrentDateObject();
}

function formatGMHubDateHeader(dateKey) {
  const date = getGMHubDateObjectFromKey(dateKey);

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getGMHubItemAgeDays(item) {
  const createdDate = getGMHubDateObjectFromKey(item.gmHubCreatedDateKey);
  const currentDate = getGMHubDateObjectFromKey(getGMHubCurrentDateKey());

  return Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
}

function getGMHubStableHash(text) {
  let hash = 0;
  const value = String(text || "");

  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }

  return `gmhub-${Math.abs(hash)}`;
}

function getGMHubItemStableKey(item, hubType = "") {
  const directId = item.gmHubId || item.id || item.messageId || item.gmMessageId;

  if (directId) {
    return `id|${directId}`;
  }

  return [
    item.systemGenerated ? "system" : "inbox",
    hubType,
    item.type || "",
    item.actionType || "",
    item.title || "",
    item.body || item.message || item.description || ""
  ].join("|").toLowerCase();
}

function ensureGMHubItemMeta(item, hubType = "") {
  const hub = ensureGMHubState();
  const stableKey = getGMHubItemStableKey(item, hubType);
  const itemId = item.gmHubId || item.id || item.messageId || getGMHubStableHash(stableKey);

  if (!hub.itemMeta[stableKey]) {
    hub.itemSequence += 1;

    hub.itemMeta[stableKey] = {
      id: itemId,
      stableKey,
      hubType,
      createdDateKey: item.gmHubCreatedDateKey || getGMHubCurrentDateKey(),
      createdIndex: hub.itemSequence,
      unread: item.unread !== false,
      trashed: item.gmHubTrashed === true
    };
  }

  const meta = hub.itemMeta[stableKey];

  if (item.unread === false) {
    meta.unread = false;
  }

  if (item.gmHubTrashed === true) {
    meta.trashed = true;
  }

  item.gmHubId = meta.id;
  item.gmHubStableKey = stableKey;
  item.gmHubCreatedDateKey = meta.createdDateKey;
  item.gmHubCreatedIndex = meta.createdIndex;
  item.gmHubTrashed = meta.trashed === true;
  item.unread = meta.unread !== false;

  return item;
}

function addGMHubTrashRecord(item, hubType = "", reason = "manual") {
  const hub = ensureGMHubState();

  const trashId = item.gmHubId || item.id || item.messageId || getGMHubStableHash(
    [
      hubType,
      item.type || "",
      item.title || "",
      item.body || item.message || "",
      item.actionType || ""
    ].join("|")
  );

  const alreadyInTrash = hub.trash.some(entry =>
    String(entry.id) === String(trashId)
  );

  if (alreadyInTrash) return;

  hub.trash.unshift({
    id: trashId,
    stableKey: item.gmHubStableKey || "",
    hubType,
    title: item.title || "Update",
    body: item.body || item.message || item.description || "",
    message: item.message || item.body || item.description || "",
    type: item.type || "info",
    actionType: item.actionType || "",
    urgent: item.urgent === true,
    systemGenerated: item.systemGenerated === true,
    createdDateKey: item.gmHubCreatedDateKey || getGMHubCurrentDateKey(),
    trashedDateKey: getGMHubCurrentDateKey(),
    reason
  });
}

function moveGMHubItemToTrash(item, hubType = "", reason = "manual") {
  if (!item) return;

  const preparedItem = ensureGMHubItemMeta(item, hubType);
  const hub = ensureGMHubState();
  const meta = hub.itemMeta[preparedItem.gmHubStableKey];

  if (meta) {
    meta.trashed = true;
    meta.unread = false;
  }

  preparedItem.gmHubTrashed = true;
  preparedItem.unread = false;
  preparedItem.read = true;

  if (Array.isArray(gameState.inbox)) {
    const target = gameState.inbox.find(inboxItem => {
      const inboxStableKey = getGMHubItemStableKey(inboxItem, hubType);

      return (
        String(inboxItem.gmHubId || inboxItem.id || inboxItem.messageId || "") === String(preparedItem.gmHubId) ||
        String(inboxStableKey) === String(preparedItem.gmHubStableKey)
      );
    });

    if (target) {
      target.gmHubTrashed = true;
      target.unread = false;
      target.read = true;
    }
  }

  addGMHubTrashRecord(preparedItem, hubType, reason);
}

function prepareAndFilterGMHubItemList(items, hubType = "") {
  const preparedItems = items.map(item => ensureGMHubItemMeta(item, hubType));

  for (let item of preparedItems) {
    if (!item.gmHubTrashed && getGMHubItemAgeDays(item) >= 30) {
      moveGMHubItemToTrash(item, hubType, "auto-30-days");
    }
  }

  return preparedItems.filter(item => !item.gmHubTrashed);
}

function dedupeGMHubItems(items) {
  const seen = new Set();

  return items.filter(item => {
    const key = [
      item.gmHubStableKey || "",
      item.id || item.messageId || "",
      item.title || "",
      item.actionType || "",
      item.body || item.message || ""
    ].join("|");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function isGMHubMoveItem(item) {
  if (!item) return false;

  const type = String(item.type || "").toLowerCase().trim();
  const text = [
    item.title,
    item.body,
    item.message,
    item.description
  ].join(" ").toLowerCase();

  const moveTypes = [
    "free agency",
    "trade",
    "trades",
    "transaction",
    "transactions",
    "signing",
    "signings",
    "waive",
    "waiver",
    "waivers",
    "g-league",
    "gleague",
    "extension",
    "extensions",
    "buyout",
    "buyouts",
    "staff movement"
  ];

  if (moveTypes.includes(type)) return true;

  if (type === "staff") {
    return (
      text.includes("staff movement") ||
      text.includes("hired") ||
      text.includes("fired") ||
      text.includes("joined") ||
      text.includes("promoted") ||
      text.includes("signed with")
    );
  }

  return (
    text.includes("traded") ||
    text.includes("signed with") ||
    text.includes("waived") ||
    text.includes("hired") ||
    text.includes("fired")
  );
}

function isGMHubDeskInboxItem(item) {
  if (!item) return false;

  const type = String(item.type || "").toLowerCase().trim();

  return (
    item.urgent ||
    item.actionType === "fix-roster" ||
    type === "urgent" ||
    type === "event"
  );
}

function isGMHubReportItem(item) {
  if (!item) return false;
  if (isGMHubMoveItem(item)) return false;

  const type = String(item.type || "").toLowerCase().trim();

  const reportTypes = [
    "staff",
    "game",
    "games",
    "result",
    "results",
    "injury",
    "injuries",
    "medical",
    "scouting",
    "analytics",
    "report",
    "reports",
    "roster",
    "draft",
    "league"
  ];

  return reportTypes.includes(type);
}

function renderGMHubGroupedList(items, hubType = "", emptyText = "No items available.") {
  const activeItems = items
    .filter(item => !item.gmHubTrashed)
    .sort((a, b) => {
      const dateA = getGMHubDateObjectFromKey(a.gmHubCreatedDateKey).getTime();
      const dateB = getGMHubDateObjectFromKey(b.gmHubCreatedDateKey).getTime();

      if (dateB !== dateA) return dateB - dateA;

      return Number(b.gmHubCreatedIndex || 0) - Number(a.gmHubCreatedIndex || 0);
    });

  if (activeItems.length === 0) {
    return `<div class="gm-hub-empty">${emptyText}</div>`;
  }

  const groups = {};

  for (let item of activeItems) {
    const dateKey = item.gmHubCreatedDateKey || getGMHubCurrentDateKey();

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(item);
  }

  return Object.keys(groups)
    .sort((a, b) =>
      getGMHubDateObjectFromKey(b).getTime() - getGMHubDateObjectFromKey(a).getTime()
    )
    .map(dateKey => `
      <div class="gm-hub-date-group">
        <div class="gm-hub-date-header">${formatGMHubDateHeader(dateKey)}</div>
        ${groups[dateKey].map(item => renderGMHubItem(item, hubType)).join("")}
      </div>
    `)
    .join("");
}

function renderGMHubTrashItem(item) {
  const typeLabel = getGMHubItemTypeLabel(item);
  const iconText = getGMHubItemIconText(item);
  const title = item.title || "Update";
  const body = getGMHubReportPreview(item.body || item.message || "");
  const sourceLabel = item.hubType
    ? String(item.hubType).charAt(0).toUpperCase() + String(item.hubType).slice(1)
    : "GM Hub";

  return `
    <div class="gm-hub-item gm-hub-trash-item">
      <div class="gm-hub-item-icon">${iconText}</div>

      <div class="gm-hub-item-main">
        <div class="gm-hub-item-topline">
          <span>${typeLabel}</span>
          <em>${sourceLabel}</em>
        </div>

        <strong>${title}</strong>
        <p>${body}</p>
      </div>
    </div>
  `;
}

function renderGMHubTrashGroupedList() {
  const hub = ensureGMHubState();
  const trash = Array.isArray(hub.trash) ? hub.trash : [];

  if (trash.length === 0) {
    return `<div class="gm-hub-empty">Trash is empty.</div>`;
  }

  const activeTrash = trash
    .slice()
    .sort((a, b) => {
      const dateA = getGMHubDateObjectFromKey(a.trashedDateKey || a.createdDateKey).getTime();
      const dateB = getGMHubDateObjectFromKey(b.trashedDateKey || b.createdDateKey).getTime();

      if (dateB !== dateA) return dateB - dateA;

      return String(b.id || "").localeCompare(String(a.id || ""));
    });

  const groups = {};

  for (let item of activeTrash) {
    const dateKey = item.trashedDateKey || item.createdDateKey || getGMHubCurrentDateKey();

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(item);
  }

  return Object.keys(groups)
    .sort((a, b) =>
      getGMHubDateObjectFromKey(b).getTime() - getGMHubDateObjectFromKey(a).getTime()
    )
    .map(dateKey => `
      <div class="gm-hub-date-group">
        <div class="gm-hub-date-header">${formatGMHubDateHeader(dateKey)}</div>
        ${groups[dateKey].map(item => renderGMHubTrashItem(item)).join("")}
      </div>
    `)
    .join("");
}

function renderGMHubTrashPanel() {
  const trashList = document.getElementById("gm-hub-trash-list");

  if (!trashList) return;

  trashList.innerHTML = renderGMHubTrashGroupedList();
}

function trashGMHubItem(itemId, hubType = "") {
  if (!gameState) return;

  const cache = window.gmHubRenderedItemCache || {};
  const cachedItem = cache[itemId];

  let itemToTrash = null;

  if (cachedItem) {
    itemToTrash = { ...cachedItem };
  } else if (Array.isArray(gameState.inbox)) {
    itemToTrash = gameState.inbox.find(item =>
      String(item.gmHubId || item.id || item.messageId || "") === String(itemId)
    );
  }

  if (!itemToTrash) {
    console.warn("Could not find GM Hub item to trash:", itemId);
    return;
  }

  moveGMHubItemToTrash(
    itemToTrash,
    hubType || itemToTrash.gmHubHubType || currentGMHubApp || "desk",
    "manual"
  );

  displayGMHub();

  if (currentGMHubApp === "trash") {
    openGMHubTrashPanel();
  }
}

function ensureGMHubTrashPanelElement() {
  let trashPanel = document.getElementById("gm-hub-panel-trash");

  if (trashPanel) return trashPanel;

  const screen = document.querySelector(".gm-hub-screen");

  if (!screen) return null;

  trashPanel = document.createElement("div");
  trashPanel.id = "gm-hub-panel-trash";
  trashPanel.className = "gm-hub-panel";

  trashPanel.innerHTML = `
    <div class="gm-hub-panel-title">
      <h3>Trash</h3>
      <span>Deleted and archived GM Hub items</span>
    </div>

    <div id="gm-hub-trash-list" class="gm-hub-list"></div>
  `;

  screen.appendChild(trashPanel);

  return trashPanel;
}

function openGMHubTrashPanel() {
  currentGMHubApp = "trash";

  const trashPanel = ensureGMHubTrashPanelElement();

  if (!trashPanel) {
    console.warn("GM Hub Trash panel could not be created because .gm-hub-screen was not found.");
    return;
  }

  renderGMHubTrashPanel();

  const panels = document.querySelectorAll(".gm-hub-panel");

  for (let panel of panels) {
    panel.classList.remove("active");
  }

  trashPanel.classList.add("active");

  const dockButtons = document.querySelectorAll(".gm-hub-dock button");

  for (let button of dockButtons) {
    button.classList.remove("active");
  }

  updateGMHubBadges();
}

function getGMHubItemsByType() {
  if (!gameState || !gameState.started) {
    return {
      desk: [],
      reports: [],
      moves: [],
      urgent: [],
      messages: [],
      tasks: []
    };
  }

  const inbox = Array.isArray(gameState.inbox)
    ? gameState.inbox.filter(item => !isGMHubIgnoredItem(item))
    : [];

  const systemUrgent = getGMHubUrgentItems();
  const taskItems = getGMHubTaskItems();

  const inboxDeskItems = inbox.filter(item => isGMHubDeskInboxItem(item));
  const movesRaw = inbox.filter(item => isGMHubMoveItem(item));
  const reportsRaw = inbox.filter(item => isGMHubReportItem(item));

  const deskRaw = dedupeGMHubItems([
    ...systemUrgent,
    ...inboxDeskItems,
    ...taskItems
  ]);

  const reports = prepareAndFilterGMHubItemList(
    dedupeGMHubItems(reportsRaw),
    "reports"
  );

  const moves = prepareAndFilterGMHubItemList(
    dedupeGMHubItems(movesRaw),
    "moves"
  );

  const desk = prepareAndFilterGMHubItemList(
    dedupeGMHubItems(deskRaw),
    "desk"
  );

  return {
    desk,
    reports,
    moves,

    /* Temporary old keys so old code does not break yet. */
    urgent: desk,
    messages: [],
    tasks: prepareAndFilterGMHubItemList(taskItems, "desk")
  };
}

function getGMHubActionLabel(actionType, item = null) {
  if (!actionType) return "";

  const labels = {
    "next-game-scout": "View Report",
    "box-score": "Box Score",
    "fix-roster": "Roster",
    "free-agency": "Free Agency",
    "team-profile": "Team",
    "gameplan": "Gameplan",
    "contracts": "Contracts",
    "injury-report": "Injury Report",
    "standings": "Standings",
    "draft-lottery": "Lottery",
    "draft-night": "Draft Room",
    "rookie-signing": "Rookie Signing"
  };

  return labels[actionType] || "Open";
}

function getGMHubItemTypeLabel(item) {
  const type = getGMHubNormalizedType(item);
  const text = getGMHubSearchText(item);

  if (type === "game prep") return "Game Prep";
  if (type === "front office") return "Front Office";
  if (type === "free agency") return "Free Agency";
  if (type === "contract" || type === "contracts") return "Contracts";
  if (type === "medical" || type === "injury" || type === "injuries") return "Medical";
  if (type === "scouting" || type === "scout") return "Scouting";
  if (type === "game" || type === "games" || type === "result" || type === "results") return "Game";
  if (type === "league") return "League";
  if (type === "draft") return "Draft";
  if (type === "event") return "Event";
  if (type === "staff") {
    if (text.includes("hired") || text.includes("fired") || text.includes("staff movement")) {
      return "Staff Movement";
    }

    return "Staff";
  }

  if (type === "trade" || type === "trades") return "Trade";
  if (type === "transaction" || type === "transactions") return "Transaction";
  if (type === "signing" || type === "signings") return "Signing";
  if (type === "waive" || type === "waiver" || type === "waivers") return "Waiver";
  if (type === "urgent") return "Urgent";
  if (type === "task") return "Task";
  if (type === "reminder") return "Reminder";
  if (type === "roster") return "Roster";
  if (type === "coaching") return "Coaching";

  if (text.includes("free agent signed") || text.includes("signed with")) return "Free Agency";
  if (text.includes("traded") || text.includes("acquired")) return "Trade";
  if (text.includes("hired") || text.includes("fired")) return "Staff Movement";

  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "Update";
}

function getGMHubItemIconText(item) {
  const label = getGMHubItemTypeLabel(item).toUpperCase();

  const iconMap = {
    "EVENT": "EV",
    "URGENT": "!",
    "TASK": "✓",
    "REMINDER": "RM",
    "FRONT OFFICE": "FO",
    "COACHING": "CO",
    "GAME PREP": "GP",
    "GAME": "GM",
    "SCOUTING": "SC",
    "MEDICAL": "MED",
    "FREE AGENCY": "FA",
    "CONTRACTS": "$",
    "LEAGUE": "LE",
    "DRAFT": "DR",
    "ROSTER": "RO",
    "STAFF": "ST",
    "STAFF MOVEMENT": "ST",
    "TRADE": "TR",
    "TRANSACTION": "TX",
    "SIGNING": "SG",
    "WAIVER": "WV"
  };

  return iconMap[label] || label.slice(0, 2);
}

function getGMHubReportPreview(body, maxLength = 115) {
  const text = String(body || "")
    .replace(/\n+/g, " · ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "No report details available.";

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function markAllGmHubMessagesRead() {
  if (!gameState || !Array.isArray(gameState.inbox)) return;

  for (let item of gameState.inbox) {
    item.read = true;
    item.unread = false;
  }

  displayGMHub();
  updateGMHubBadges();
}

function renderGMHubItem(item, hubType = "") {
  const preparedItem = ensureGMHubItemMeta(item, hubType);
  const typeLabel = getGMHubItemTypeLabel(preparedItem);
  const iconText = getGMHubItemIconText(preparedItem);
  const title = preparedItem.title || "Update";
  const body = getGMHubReportPreview(preparedItem.body || preparedItem.message || "");
  const urgentClass = preparedItem.urgent ? " urgent" : "";
  const unreadClass = preparedItem.unread !== false ? " unread" : "";
  const actionType = preparedItem.actionType || "";
  const itemId = preparedItem.gmHubId || preparedItem.id || preparedItem.messageId || "";
  const actionLabel = getGMHubActionLabel(actionType, preparedItem);

  if (!window.gmHubRenderedItemCache) {
    window.gmHubRenderedItemCache = {};
  }

  window.gmHubRenderedItemCache[itemId] = {
    ...preparedItem,
    gmHubHubType: hubType
  };

  const actionButton = actionLabel
    ? `
      <button
        type="button"
        class="gm-hub-item-action"
        onclick="event.stopPropagation(); handleGMHubItemClick('${actionType}', '${itemId}', '${hubType}')"
      >
        ${actionLabel}
      </button>
    `
    : "";

  const trashButton = `
    <button
      type="button"
      class="gm-hub-item-trash-button"
      title="Move to Trash"
      onclick="event.stopPropagation(); trashGMHubItem('${itemId}', '${hubType}')"
    >
      <span class="gm-hub-trash-icon">🗑</span>
    </button>
  `;

  return `
    <div
      class="gm-hub-item gm-hub-item-${String(preparedItem.type || "info").toLowerCase().replace(/\s+/g, "-")}${urgentClass}${unreadClass}"
      onclick="markGMHubCardRead('${itemId}')"
    >
      <div class="gm-hub-item-icon">${iconText}</div>

      <div class="gm-hub-item-main">
        <div class="gm-hub-item-topline">
          <span>${typeLabel}</span>
          ${preparedItem.unread !== false ? `<em>New</em>` : ""}
        </div>

        <strong>${title}</strong>
        <p>${body}</p>
      </div>

      <div class="gm-hub-item-side">
        ${actionButton}
        ${trashButton}
      </div>
    </div>
  `;
}

function markGMHubCardRead(itemId) {
  if (!itemId) return;

  markGMHubItemRead(itemId);
  displayGMHub();
  updateGMHubBadges();
}

function markGMHubItemRead(itemId) {
  if (!gameState) return;

  const cache = window.gmHubRenderedItemCache || {};
  const cachedItem = cache[itemId];

  if (cachedItem && cachedItem.gmHubStableKey) {
    const hub = ensureGMHubState();
    const meta = hub.itemMeta[cachedItem.gmHubStableKey];

    if (meta) {
      meta.unread = false;
    }
  }

  if (Array.isArray(gameState.inbox)) {
    const target = gameState.inbox.find(item =>
      String(item.gmHubId || item.id || item.messageId || "") === String(itemId)
    );

    if (target) {
      target.unread = false;
      target.read = true;
    }
  }
}

function getGMHubInboxItemById(itemId) {
  if (!gameState || !Array.isArray(gameState.inbox)) return null;

  return gameState.inbox.find(item =>
    String(item.id || item.messageId || "") === String(itemId)
  ) || null;
}

function handleGMHubItemClick(actionType, itemId = "", hubType = "") {
  const action = String(actionType || "");

  if (itemId) {
  markGMHubItemRead(itemId);
}

  if (actionType === "team-profile") {
  const item = getGMHubInboxItemById(itemId);

  if (item && item.teamId && typeof openTeamProfile === "function") {
    openTeamProfile(item.teamId);
    return;
  }

  if (item && item.teamName) {
    const team = gameState.teams.find(team =>
      String(team.name).toLowerCase() === String(item.teamName).toLowerCase()
    );

    if (team && typeof openTeamProfile === "function") {
      openTeamProfile(team.id);
      return;
    }
  }

  showMainSection("league");
  return;
}

  if (!action) {
    displayGMHub();
    setGMHubApp(hubType || currentGMHubApp || "desk");
    return;
  }

  if (action === "next-game-scout") {
    showMainSection("gameplan");
    showSecondaryScreen("next-game-screen");

    if (typeof displayNextGameScout === "function") {
      displayNextGameScout();
    }

    return;
  }

  if (action === "box-score") {
    const message = gameState.inbox.find(item =>
      String(item.id || item.messageId || "") === String(itemId)
    );

    if (message && message.boxScoreId && typeof openBoxScore === "function") {
      openBoxScore(message.boxScoreId);
      return;
    }

    if (message && message.scheduleGameId && typeof openBoxScore === "function") {
      openBoxScore(message.scheduleGameId);
      return;
    }

    showMainSection("schedule");
    showSecondaryScreen("schedule-screen");
    return;
  }

  if (action === "fix-roster") {
    showMainSection("team");
    showSecondaryScreen("roster-screen");
    return;
  }

  if (action === "free-agency") {
    showMainSection("free-agency");
    showSecondaryScreen("free-agency-screen");
    return;
  }

  if (action === "gameplan") {
    showMainSection("gameplan");
    showSecondaryScreen("rotation-screen");
    return;
  }

  if (action === "contracts") {
    showMainSection("team");
    showSecondaryScreen("contracts-screen");
    return;
  }

  if (action === "injury-report") {
    showMainSection("gameplan");
    showSecondaryScreen("injury-report-screen");
    return;
  }

  if (action === "standings") {
    showMainSection("competitions");
    showSecondaryScreen("standings-screen");
    return;
  }

  if (action === "draft-lottery") {
    showMainSection("draft");
    showSecondaryScreen("lottery-odds-screen");

    if (typeof runDraftLottery === "function") {
      runDraftLottery();
    }

    return;
  }

  if (action === "draft-night") {
    if (typeof enterDraftNight === "function") {
      enterDraftNight();
    }

    return;
  }

  if (action === "rookie-signing") {
    showMainSection("draft");
    showSecondaryScreen("rookie-signing-screen");
    return;
  }

  displayGMHub();
  setGMHubApp(hubType || currentGMHubApp || "reports");
}

function displayDashboardEconomy() {
  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return;

  setText("dashboard-roster-size", `${getRosterCount(selectedTeam.id)} / ${MAX_ROSTER_SIZE}`);
  setText("dashboard-payroll", formatMoney(getRosterPayroll(selectedTeam.id)));

  const capSpace = getCapSpace(selectedTeam.id);
  setText("dashboard-cap-space", formatMoney(capSpace));
}


function renderCourtLinkFeed() {
  const container = document.getElementById("gm-hub-courtlink-list");
  const selectedTeam = getSelectedTeam();

  if (!container || !selectedTeam) return;

  const posts = [
    {
      name: "CourtLink Insider",
      handle: "@CourtLinkHQ",
      body: `${selectedTeam.name} open training camp with plenty of roster questions still to answer.`,
      likes: 1240,
      reposts: 210
    },
    {
      name: "NHA Central",
      handle: "@NHACentral",
      body: "Front offices around the league are watching roster crunches closely as opening night approaches.",
      likes: 860,
      reposts: 144
    },
    {
      name: "Fan Pulse",
      handle: "@FanPulse",
      body: `Fans want to see which young players earn real minutes for ${selectedTeam.name} this season.`,
      likes: 430,
      reposts: 57
    }
  ];

  container.innerHTML = posts.map(post => `
    <div class="courtlink-post">
      <div class="courtlink-avatar">CL</div>
      <div>
        <div class="courtlink-post-header">
          <strong>${post.name}</strong>
          <span>${post.handle}</span>
        </div>

        <p>${post.body}</p>

        <div class="courtlink-post-metrics">
          <span>${post.likes} likes</span>
          <span>${post.reposts} reposts</span>
        </div>
      </div>
    </div>
  `).join("");
}

function updateGMHubBadges() {
  const data = getGMHubItemsByType();

  const badgeMap = {
    desk: data.desk.filter(item => item.unread !== false).length,
    reports: data.reports.filter(item => item.unread !== false).length,
    moves: data.moves.filter(item => item.unread !== false).length,
    courtlink: 0
  };

  for (let key in badgeMap) {
    const badge = document.getElementById(`gm-hub-badge-${key}`);

    if (badge) {
      badge.textContent = badgeMap[key];
      badge.classList.toggle("hidden", Number(badgeMap[key]) <= 0);
    }
  }
}

function displayGMHub() {
  const data = getGMHubItemsByType();

  window.gmHubRenderedItemCache = {};

  const deskList = document.getElementById("gm-hub-desk-list");
  const reportsList = document.getElementById("gm-hub-reports-list");
  const movesList = document.getElementById("gm-hub-moves-list");

    if (deskList) {
      const filteredDeskItems = getFilteredGMHubDeskItems(data.desk);

      deskList.innerHTML = renderGMHubGroupedList(
        filteredDeskItems,
        "desk",
        currentGMHubDeskFilter === "all"
          ? "Nothing on your desk right now."
          : `No ${currentGMHubDeskFilter} on your desk right now.`
      );
    }

    if (reportsList) {
      const filteredReports = getFilteredGMHubReports(data.reports);

      reportsList.innerHTML = renderGMHubGroupedList(
        filteredReports,
        "reports",
        currentGMHubReportFilter === "all"
          ? "No reports available yet."
          : `No ${currentGMHubReportFilter} reports available yet.`
      );
    }

    if (movesList) {
      const filteredMoves = getFilteredGMHubMoves(data.moves);

      movesList.innerHTML = renderGMHubGroupedList(
        filteredMoves,
        "moves",
        currentGMHubMoveFilter === "all"
          ? "No league moves yet."
          : `No ${currentGMHubMoveFilter} available yet.`
      );
    }

  renderGMHubTrashPanel();

  renderCourtLinkFeed();
  updateGMHubBadges();

  const appToShow = getSafeGMHubApp(currentGMHubApp || "desk");

  const panels = document.querySelectorAll(".gm-hub-panel");

  for (let panel of panels) {
    panel.classList.remove("active");
  }

  const selectedPanel = document.getElementById(`gm-hub-panel-${appToShow}`);

  if (selectedPanel) {
    selectedPanel.classList.add("active");
  }

  const dockButtons = document.querySelectorAll(".gm-hub-dock button");

for (let button of dockButtons) {
  button.classList.toggle(
    "active",
    appToShow !== "trash" && button.dataset.gmApp === appToShow
  );
}

initializeGMHubPhoneButton();
updateGMHubPhoneButtonNotification();
}

function getGMHubPhoneUnreadCount() {
  const threads = getGMHubPhoneThreads();

  return threads.filter(thread => thread.unread === true).length;
}

function renderGMHubPhoneTopbarUnread() {
  const badge = document.getElementById("gm-hub-phone-topbar-unread");
  if (!badge) return;

  const unreadCount = getGMHubPhoneUnreadCount();

  badge.textContent = unreadCount;

  badge.classList.toggle("has-unread", unreadCount > 0);
  badge.classList.toggle("is-empty", unreadCount <= 0);
}

function getGMHubReportCategory(item) {
  const type = getGMHubNormalizedType(item);
  const action = getGMHubNormalizedAction(item);
  const text = getGMHubSearchText(item);

  if (
    type === "game" ||
    type === "games" ||
    type === "result" ||
    type === "results" ||
    type === "game prep" ||
    action === "box-score" ||
    action === "next-game-scout" ||
    text.includes("box score") ||
    text.includes("game log") ||
    text.includes("last game") ||
    text.includes("next opponent") ||
    text.includes("matchup")
  ) {
    return "games";
  }

  if (
    type === "scouting" ||
    type === "scout" ||
    type === "draft" ||
    text.includes("scouting") ||
    text.includes("scout") ||
    text.includes("prospect") ||
    text.includes("draft report")
  ) {
    return "scouting";
  }

  if (
    type === "medical" ||
    type === "injury" ||
    type === "injuries" ||
    action === "injury-report" ||
    text.includes("medical") ||
    text.includes("injury") ||
    text.includes("injured") ||
    text.includes("return timeline")
  ) {
    return "medical";
  }

  return "all";
}

function getGMHubDeskCategory(item) {
  const type = getGMHubNormalizedType(item);
  const action = getGMHubNormalizedAction(item);
  const text = getGMHubSearchText(item);

  if (
    item.urgent === true ||
    type === "urgent" ||
    action === "fix-roster" ||
    text.includes("roster not legal") ||
    text.includes("required") ||
    text.includes("must be completed") ||
    text.includes("cannot advance")
  ) {
    return "urgent";
  }

  if (
    type === "event" ||
    action === "draft-lottery" ||
    action === "draft-night" ||
    action === "rookie-signing" ||
    text.includes("training camp opens") ||
    text.includes("free agency opens") ||
    text.includes("draft lottery") ||
    text.includes("draft night") ||
    text.includes("trade deadline") ||
    text.includes("awards ceremony") ||
    text.includes("play-in begins") ||
    text.includes("playoffs begin")
  ) {
    return "events";
  }

  if (
    type === "task" ||
    type === "front office" ||
    type === "coaching" ||
    action === "free-agency" ||
    action === "gameplan" ||
    action === "contracts" ||
    action === "injury-report" ||
    text.includes("review open roster spots") ||
    text.includes("review rotation") ||
    text.includes("review expiring contracts") ||
    text.includes("review free agent market") ||
    text.includes("prepare for next opponent") ||
    text.includes("fix roster")
  ) {
    return "actions";
  }

  if (
    type === "reminder" ||
    type === "league" ||
    action === "standings" ||
    text.includes("review team standings") ||
    text.includes("check standings") ||
    text.includes("check cap space") ||
    text.includes("scouting reset") ||
    text.includes("staff contracts") ||
    text.includes("upcoming schedule")
  ) {
    return "reminders";
  }

  return "reminders";
}

function getFilteredGMHubDeskItems(deskItems) {
  if (currentGMHubDeskFilter === "all") {
    return deskItems;
  }

  return deskItems.filter(item =>
    getGMHubDeskCategory(item) === currentGMHubDeskFilter
  );
}

function setGMHubDeskFilter(filterName) {
  currentGMHubDeskFilter = filterName || "all";

  const filters = ["all", "urgent", "actions", "events", "reminders"];

  for (let filter of filters) {
    const button = document.getElementById(`gm-desk-filter-${filter}`);

    if (button) {
      button.classList.toggle("active", currentGMHubDeskFilter === filter);
    }
  }

  displayGMHub();
}

function getFilteredGMHubReports(reports) {
  if (currentGMHubReportFilter === "all") {
    return reports;
  }

  return reports.filter(item =>
    getGMHubReportCategory(item) === currentGMHubReportFilter
  );
}

function getGMHubMoveCategory(item) {
  const type = getGMHubNormalizedType(item);
  const text = getGMHubSearchText(item);

  if (
    type === "trade" ||
    type === "trades" ||
    text.includes("traded") ||
    text.includes("trade completed") ||
    text.includes("acquired") ||
    text.includes("sent to")
  ) {
    return "trades";
  }

  if (
    type === "waive" ||
    type === "waiver" ||
    type === "waivers" ||
    text.includes("waived") ||
    text.includes("claimed off waivers") ||
    text.includes("waiver")
  ) {
    return "waivers";
  }

  if (
    type === "extension" ||
    type === "extensions" ||
    text.includes("extended") ||
    text.includes("extension") ||
    text.includes("contract extension")
  ) {
    return "extensions";
  }

  if (
    type === "staff movement" ||
    type === "staff" ||
    text.includes("staff movement") ||
    text.includes("hired") ||
    text.includes("fired") ||
    text.includes("joined") ||
    text.includes("promoted") ||
    text.includes("named head coach") ||
    text.includes("named assistant") ||
    text.includes("named scout")
  ) {
    return "staff";
  }

  if (
    type === "signing" ||
    type === "signings" ||
    type === "free agency" ||
    text.includes("free agent signed") ||
    text.includes("signed with") ||
    text.includes("signed by") ||
    text.includes("agreed to a") ||
    text.includes("agreed to an") ||
    text.includes("re-signed")
  ) {
    return "signings";
  }

  return "all";
}

function getFilteredGMHubMoves(moves) {
  if (currentGMHubMoveFilter === "all") {
    return moves;
  }

  return moves.filter(item =>
    getGMHubMoveCategory(item) === currentGMHubMoveFilter
  );
}

function setGMHubMoveFilter(filterName) {
  currentGMHubMoveFilter = filterName || "all";

  const filters = ["all", "trades", "signings", "waivers", "extensions", "staff"];

  for (let filter of filters) {
    const button = document.getElementById(`gm-move-filter-${filter}`);

    if (button) {
      button.classList.toggle("active", currentGMHubMoveFilter === filter);
    }
  }

  displayGMHub();
}

function setGMHubReportFilter(filterName) {
  currentGMHubReportFilter = filterName || "all";

  const filters = ["all", "games", "scouting", "medical"];

  for (let filter of filters) {
    const button = document.getElementById(`gm-report-filter-${filter}`);

    if (button) {
      button.classList.toggle("active", currentGMHubReportFilter === filter);
    }
  }

  displayGMHub();
}

function getAllActivePlayersForStatsCenter() {
  const players = [];

  if (!gameState || !gameState.rosters) return players;

  for (let teamId in gameState.rosters) {
    const team = getTeamById(Number(teamId));

    for (let player of gameState.rosters[teamId]) {
      players.push({
        player,
        team,
        teamId: Number(teamId)
      });
    }
  }

  return players;
}

function getSafeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function cleanPlayerSeasonStats(player) {
  if (!player) return;

  if (!player.seasonStats) {
    player.seasonStats = createEmptySeasonStats();
  }

  const emptyStats = createEmptySeasonStats();

  for (let key in emptyStats) {
    if (!Number.isFinite(Number(player.seasonStats[key]))) {
      player.seasonStats[key] = 0;
    }
  }
}

function cleanAllPlayerSeasonStats() {
  if (!gameState || !gameState.rosters) return;

  for (let teamId in gameState.rosters) {
    for (let player of gameState.rosters[teamId]) {
      cleanPlayerSeasonStats(player);
    }
  }

  if (Array.isArray(gameState.freeAgents)) {
    for (let player of gameState.freeAgents) {
      cleanPlayerSeasonStats(player);
    }
  }
}

function getPlayerStatAverageForStatsCenter(player, statKey) {
  if (!player) return 0;

  const stats = player.seasonStats || createEmptySeasonStats();
  const games = getSafeNumber(stats.games);

  if (games <= 0) return 0;

  const statValue = getSafeNumber(stats[statKey]);

  return Number((statValue / games).toFixed(1));
}

function getPlayerStatLeader(players, statKey) {
  if (!Array.isArray(players) || players.length === 0) return null;

  const eligible = players
    .filter(entry => entry && entry.player)
    .map(entry => ({
      ...entry,
      value: getPlayerStatAverageForStatsCenter(entry.player, statKey)
    }))
    .sort((a, b) => b.value - a.value);

  if (eligible.length === 0 || eligible[0].value <= 0) return null;

  return eligible[0];
}

function renderStatsCenterLeaderRow(label, leader) {
  if (!leader || !leader.player) {
    return `
      <div class="stats-center-row empty">
        <span>${label}</span>
        <strong>--</strong>
        <em>--</em>
      </div>
    `;
  }

  const player = leader.player;
  const team = leader.team;
  const teamAbbrev = team && team.abbrev ? team.abbrev : "--";

  return `
    <div class="stats-center-row">
      <span>${label}</span>
      <strong class="clickable-player-name" onclick="openPlayerProfile('${player.id}')">${player.name}</strong>
      <em>${teamAbbrev} · ${leader.value}</em>
    </div>
  `;
}

function parseScoreFromResult(result) {
  if (!result) return null;

  const match = String(result).match(/([WL])\s+(\d+)-(\d+)/i);

  if (!match) return null;

  const outcome = match[1].toUpperCase();
  const firstScore = Number(match[2]);
  const secondScore = Number(match[3]);

  if (outcome === "W") {
    return {
      pointsFor: firstScore,
      pointsAgainst: secondScore
    };
  }

  return {
    pointsFor: secondScore,
    pointsAgainst: firstScore
  };
}

function getTeamPointsAllowedPerGameForStatsCenter(teamId) {
  if (!gameState || !Array.isArray(gameState.userSchedule)) return 0;

  const games = gameState.userSchedule.filter(game =>
    game.played &&
    Number(game.teamId || game.userTeamId || game.selectedTeamId || gameState.selectedTeamId) === Number(teamId)
  );

  let pointsAgainst = 0;
  let gamesCounted = 0;

  for (let game of games) {
    const score = parseScoreFromResult(game.result);

    if (score) {
      pointsAgainst += score.pointsAgainst;
      gamesCounted++;
    }
  }

  if (gamesCounted <= 0) return 0;

  return Number((pointsAgainst / gamesCounted).toFixed(1));
}

function getTeamPointDiffForStatsCenter(teamId) {
  const ppg = Number(getTeamPointsPerGame(teamId) || 0);
  const allowed = Number(getTeamPointsAllowedPerGameForStatsCenter(teamId) || 0);

  if (ppg <= 0 && allowed <= 0) return 0;

  return Number((ppg - allowed).toFixed(1));
}

function getNumericStatValue(value) {
  if (value === null || value === undefined) return 0;

  const number = Number(String(value).replace(/[^\d.-]/g, ""));

  return Number.isFinite(number) ? number : 0;
}

function getTeamRankingForStatsCenter(teamId, valueGetter, higherIsBetter = true) {
  if (!gameState || !Array.isArray(gameState.teams)) return "--";

  const rankedTeams = gameState.teams
    .map(team => ({
      team,
      value: getNumericStatValue(valueGetter(team.id))
    }))
    .filter(entry => entry.value > 0)
    .sort((a, b) => {
      if (higherIsBetter) return b.value - a.value;
      return a.value - b.value;
    });

  if (rankedTeams.length === 0) return "--";

  const index = rankedTeams.findIndex(entry =>
    Number(entry.team.id) === Number(teamId)
  );

  if (index < 0) return "--";

  return `${index + 1}${getOrdinalSuffix(index + 1)}`;
}

function displayDashboardStatsCenter() {
  const container = document.getElementById("dashboard-stats-center");
  const selectedTeam = getSelectedTeam();
  cleanAllPlayerSeasonStats();

  if (!container || !selectedTeam) return;

  const allPlayers = getAllActivePlayersForStatsCenter();
  const teamPlayers = getRosterByTeamId(gameState.selectedTeamId).map(player => ({
        player,
        team: selectedTeam,
        teamId: gameState.selectedTeamId
     }));

  const hasAnyStats = allPlayers.some(entry =>
    entry.player &&
    entry.player.seasonStats &&
    Number(entry.player.seasonStats.games || 0) > 0
  );

  if (!hasAnyStats) {
    container.innerHTML = `
      <div class="stats-center-empty">
        <strong>No season stats yet.</strong>
        <span>Team and league leaders will appear once games are played.</span>
      </div>

      <div class="stats-center-rankings">
        <div>
          <span>PPG Rank</span>
          <strong>--</strong>
        </div>

        <div>
          <span>PPG Allowed Rank</span>
          <strong>--</strong>
        </div>

        <div>
          <span>Point Diff Rank</span>
          <strong>--</strong>
        </div>
      </div>
    `;
    return;
  }

  const teamPointsLeader = getPlayerStatLeader(teamPlayers, "points");
  const teamReboundsLeader = getPlayerStatLeader(teamPlayers, "rebounds");
  const teamAssistsLeader = getPlayerStatLeader(teamPlayers, "assists");

  const leaguePointsLeader = getPlayerStatLeader(allPlayers, "points");
  const leagueReboundsLeader = getPlayerStatLeader(allPlayers, "rebounds");
  const leagueAssistsLeader = getPlayerStatLeader(allPlayers, "assists");

  const ppgRank = getTeamRankingForStatsCenter(
    selectedTeam.id,
    teamId => Number(teamId) === Number(gameState.selectedTeamId) ? getTeamPointsPerGame(teamId) : 0,
    true
  );

  const allowedRank = getTeamRankingForStatsCenter(
    selectedTeam.id,
    teamId => getTeamPointsAllowedPerGameForStatsCenter(teamId),
    false
  );

  const pointDiffRank = getTeamRankingForStatsCenter(
    selectedTeam.id,
    teamId => getTeamPointDiffForStatsCenter(teamId),
    true
  );

  container.innerHTML = `
    <div class="stats-center-section">
      <h3>Your Team Leaders</h3>
      ${renderStatsCenterLeaderRow("PTS", teamPointsLeader)}
      ${renderStatsCenterLeaderRow("REB", teamReboundsLeader)}
      ${renderStatsCenterLeaderRow("AST", teamAssistsLeader)}
    </div>

    <div class="stats-center-section">
      <h3>League Leaders</h3>
      ${renderStatsCenterLeaderRow("PTS", leaguePointsLeader)}
      ${renderStatsCenterLeaderRow("REB", leagueReboundsLeader)}
      ${renderStatsCenterLeaderRow("AST", leagueAssistsLeader)}
    </div>

    <div class="stats-center-rankings">
      <div>
        <span>PPG Rank</span>
        <strong>${ppgRank}</strong>
      </div>

      <div>
        <span>PPG Allowed Rank</span>
        <strong>${allowedRank}</strong>
      </div>

      <div>
        <span>Point Diff Rank</span>
        <strong>${pointDiffRank}</strong>
      </div>
    </div>
  `;
}

function enterFreeAgencyFromDashboard() {
  showMainSection("free-agency");
  showSecondaryScreen("free-agency-screen");
}

function setDashboardContextButtonVisibility(buttonId, shouldShow) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.classList.toggle("hidden", !shouldShow);
}

function shouldShowDashboardOffseasonHub() {
  if (!gameState || !gameState.started) return false;

  const finalsComplete =
    gameState.playoffs &&
    gameState.playoffs.playoffsComplete === true &&
    gameState.seasonReadyForRollover === true &&
    gameState.offseasonActive !== true;

  const offseasonActive = gameState.offseasonActive === true;

  return finalsComplete || offseasonActive;
}

function getOffseasonCalendarYear() {
  if (!gameState || !gameState.currentDate) {
    return new Date().getFullYear();
  }

  const currentDate = new Date(gameState.currentDate);

  return currentDate.getFullYear();
}

function getOffseasonHubEvents() {
  const year = getOffseasonCalendarYear();

  const seasonCompleteDate = gameState.finalsCompletedDate
    ? new Date(gameState.finalsCompletedDate)
    : new Date(gameState.currentDate);

  return [
    {
      id: "season_complete",
      title: "Season Ends",
      date: seasonCompleteDate,
      actionType: "scout-draft",
      passive: false,
      required: false
    },
    {
      id: "draft_lottery",
      title: "League Draft Lottery",
      date: new Date(year, 5, 18),
      actionType: "draft-lottery",
      buttonLabel: "Enter Draft Lottery",
      required: true
    },
    {
      id: "draft_combine",
      title: "League Draft Combine",
      date: new Date(year, 5, 19),
      actionType: "draft-combine",
      buttonLabel: "View Draft Combine",
      required: false
    },
    {
      id: "league_draft_round1",
      title: "League Draft Round 1",
      date: new Date(year, 5, 20),
      actionType: "draft",
      buttonLabel: "Begin Round 1",
      required: true
    },
    {
      id: "league_draft_round2",
      title: "League Draft Round 2",
      date: new Date(year, 5, 21),
      actionType: "draft",
      buttonLabel: "Begin Round 2",
      required: true
    },
    {
      id: "moratorium",
      title: "Free Agency Moratorium",
      date: new Date(year, 5, 30),
      actionType: "moratorium",
      buttonLabel: "Enter Moratorium",
      required: false
    },
    {
      id: "free_agency",
      title: "Free Agency Opens",
      date: new Date(year, 6, 6),
      actionType: "free-agency",
      buttonLabel: "Open Free Agency",
      required: false
    },
    {
      id: "summer_league",
      title: "Summer League",
      date: new Date(year, 6, 12),
      actionType: "summer-league",
      buttonLabel: "View Summer League",
      required: false
    },
    {
      id: "training_camp",
      title: "Training Camp",
      date: new Date(year, 8, 25),
      actionType: "training-camp",
      buttonLabel: "Begin Training Camp",
      required: true
    }
  ];
}

function getDateOnlyTime(dateValue) {
  const date = new Date(dateValue);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

function getDaysBetweenDates(startDate, endDate) {
  const start = getDateOnlyTime(startDate);
  const end = getDateOnlyTime(endDate);

  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function ensureOffseasonHubState() {
  if (!gameState.offseasonHub) {
    gameState.offseasonHub = {
      completedEvents: {}
    };
  }

  if (!gameState.offseasonHub.completedEvents) {
    gameState.offseasonHub.completedEvents = {};
  }

  return gameState.offseasonHub;
}

function markOffseasonHubEventComplete(eventId) {
  const hub = ensureOffseasonHubState();
  hub.completedEvents[eventId] = true;
}

function getLegacyOffseasonHubEventId(eventId) {
  const oldDraftPrefix = "n" + "ba_draft";

  if (eventId === "league_draft") return oldDraftPrefix;
  if (eventId === "league_draft_round1") return `${oldDraftPrefix}_round1`;
  if (eventId === "league_draft_round2") return `${oldDraftPrefix}_round2`;

  return "";
}

function isOffseasonHubEventMarkedComplete(hub, eventId) {
  const legacyEventId = getLegacyOffseasonHubEventId(eventId);

  return hub.completedEvents[eventId] || (legacyEventId && hub.completedEvents[legacyEventId]);
}

function getRequiredOffseasonHubEventBlockingAdvance() {
  if (!shouldShowDashboardOffseasonHub()) return null;

  const currentEvent = getCurrentOffseasonHubEvent();

  if (!currentEvent) return null;
  if (!currentEvent.required) return null;
  if (isOffseasonHubEventComplete(currentEvent)) return null;

  const todayTime = getDateOnlyTime(gameState.currentDate);
  const eventTime = getDateOnlyTime(currentEvent.date);

  if (todayTime < eventTime) return null;

  return currentEvent;
}

function blockIfOffseasonHubActionRequired() {
  const blockingEvent = getRequiredOffseasonHubEventBlockingAdvance();

  if (!blockingEvent) return false;

  const messageMap = {
    "start_offseason": "The Finals are complete. Start the offseason before advancing.",
    "draft_lottery": "The League Draft Lottery is available. Complete the lottery before advancing.",
    "league_draft": "The League Draft is available. Complete the draft before advancing.",
    "training_camp": "Training Camp is available. Begin Training Camp before advancing into the new season."
  };

  showModal(
    `${blockingEvent.title} Required`,
    messageMap[blockingEvent.id] || `${blockingEvent.title} must be completed before advancing.`
  );

  return true;
}

function isOffseasonHubEventComplete(event) {
  const hub = ensureOffseasonHubState();

  if (event.id === "season_complete") {
    return true;
  }

  if (event.id === "start_offseason") {
    return gameState.offseasonActive === true;
  }

  if (event.id === "draft_lottery") {
    return (
      gameState.draftLotteryRun ||
      gameState.lotteryComplete ||
      gameState.draftLotteryComplete ||
      gameState.draft?.lotteryRun ||
      gameState.draft?.lotteryComplete
    );
  }

  if (event.id === "league_draft_round1") {
  return (
    gameState.draft?.roundOneComplete === true ||
    Number(gameState.draft?.currentPickIndex || 0) >= 30 ||
    Number(gameState.draft?.draftedPlayers?.length || 0) >= 30 ||
    gameState.draftComplete ||
    gameState.draft?.complete ||
    gameState.draft?.draftComplete
  );
}

if (event.id === "league_draft_round2") {
  return (
    gameState.draftComplete ||
    gameState.draft?.complete ||
    gameState.draft?.draftComplete ||
    Number(gameState.draft?.draftedPlayers?.length || 0) >= 60
  );
}

if (event.id === "league_draft") {
  return (
    gameState.draftComplete ||
    gameState.draft?.complete ||
    gameState.draft?.draftComplete ||
    Number(gameState.draft?.draftedPlayers?.length || 0) >= 60
  );
}

  if (event.id === "training_camp") {
    return gameState.offseasonActive !== true && getCurrentDateKey() >= 925;
  }

  if (isOffseasonHubEventMarkedComplete(hub, event.id)) {
    return true;
  }

  if (!event.required && getDateOnlyTime(gameState.currentDate) > getDateOnlyTime(event.date)) {
    return true;
  }

  return false;
}

function getCurrentOffseasonHubEvent() {
  const events = getOffseasonHubEvents();
  const todayTime = getDateOnlyTime(gameState.currentDate);

  for (let event of events) {
    const complete = isOffseasonHubEventComplete(event);
    const eventTime = getDateOnlyTime(event.date);

    if (!complete && todayTime >= eventTime) {
      return event;
    }
  }

  return events.find(event => !isOffseasonHubEventComplete(event)) || null;
}

function getOffseasonHubEventStatus(event) {
  if (isOffseasonHubEventComplete(event)) {
    return {
      className: "completed",
      icon: "✓",
      statusText: "Completed"
    };
  }

  const currentEvent = getCurrentOffseasonHubEvent();

  if (currentEvent && currentEvent.id === event.id) {
    return {
      className: "active",
      icon: "🔥",
      statusText: "Available Now"
    };
  }

  const days = getDaysBetweenDates(gameState.currentDate, event.date);

  return {
    className: "future",
    icon: "⏳",
    statusText: days <= 0 ? "Upcoming" : `${days} Day${days === 1 ? "" : "s"}`
  };
}

function renderOffseasonHubTimelineItem(event) {
  const status = getOffseasonHubEventStatus(event);

  return `
    <div class="offseason-timeline-item ${status.className}">
      <div class="offseason-timeline-icon">${status.icon}</div>

      <div class="offseason-timeline-copy">
        <strong>${event.title}</strong>
        <span>${status.statusText}</span>
        <small>${formatDate(event.date)}</small>
      </div>
    </div>
  `;
}

function handleOffseasonHubAction(actionType) {
  const action = String(actionType || "");

  if (action === "draft-lottery") {
  showMainSection("draft");
  showSecondaryScreen("lottery-odds-screen");

  if (typeof runDraftLottery === "function") {
    runDraftLottery();
  }

  markOffseasonHubEventComplete("draft_lottery");

  refreshAll();
  return;
}

  if (action === "scout-draft") {
  showMainSection("draft");
  showSecondaryScreen("draft-scouting-screen");
  markOffseasonHubEventComplete("season_complete");
  refreshAll();
  return;
}

  if (action === "draft-combine") {
    showMainSection("draft");
    showSecondaryScreen("draft-scouting-screen");
    markOffseasonHubEventComplete("draft_combine");
    refreshAll();
    return;
  }

  if (action === "draft") {
    if (typeof enterDraftFromDashboard === "function") {
      enterDraftFromDashboard();
    } else {
      showMainSection("draft");
      showSecondaryScreen("draft-board-screen");
    }

    refreshAll();
    return;
  }

  if (action === "moratorium") {
    showMainSection("free-agency");
    showSecondaryScreen("free-agency-screen");
    markOffseasonHubEventComplete("moratorium");
    refreshAll();
    return;
  }

  if (action === "free-agency") {
    showMainSection("free-agency");
    showSecondaryScreen("free-agency-screen");
    markOffseasonHubEventComplete("free_agency");
    refreshAll();
    return;
  }

  if (action === "summer-league") {
    showModal(
      "Summer League",
      "Summer League is a placeholder for now. This will become a player development event later."
    );

    markOffseasonHubEventComplete("summer_league");
    refreshAll();
    return;
  }

  if (action === "training-camp") {
    if (typeof startNextSeason === "function") {
      startNextSeason();
    } else {
      showMainSection("gameplan");
      showSecondaryScreen("rotation-screen");
    }

    refreshAll();
    return;
  }
}

function displayDashboardOffseasonHub() {
  const normalGameCenter = document.getElementById("dashboard-game-center-normal");
  const offseasonHub = document.getElementById("dashboard-offseason-hub");

  if (!normalGameCenter || !offseasonHub) return;

  const shouldShowHub = shouldShowDashboardOffseasonHub();

  if (shouldShowHub) {
    normalGameCenter.classList.add("hidden");
    offseasonHub.classList.remove("hidden");

    normalGameCenter.style.display = "none";
    offseasonHub.style.display = "flex";
  } else {
    normalGameCenter.classList.remove("hidden");
    offseasonHub.classList.add("hidden");

    normalGameCenter.style.display = "";
    offseasonHub.style.display = "none";

    return;
  }

  ensureOffseasonHubState();

  const events = getOffseasonHubEvents();
  const currentEvent = getCurrentOffseasonHubEvent();

  const actionButton = currentEvent && currentEvent.actionType
    ? `
      <button
        type="button"
        class="offseason-hub-action-button"
        onclick="handleOffseasonHubAction('${currentEvent.actionType}')"
      >
        ${getOffseasonHubActionLabel()}
      </button>
    `
    : "";

  offseasonHub.innerHTML = `
    <div class="offseason-hub-header">
      <div>
        <span>Offseason Hub</span>
        <h2>${currentEvent ? currentEvent.title : "Offseason Complete"}</h2>
      </div>

      <strong>${currentEvent ? getOffseasonHubEventStatus(currentEvent).statusText : "Ready"}</strong>
    </div>

    <div class="offseason-hub-date-row">
      <h1>${formatDate(gameState.currentDate)}</h1>
      <p>Advance one day at a time through the offseason calendar.</p>
    </div>

    <div class="offseason-timeline">
      ${events.map(event => renderOffseasonHubTimelineItem(event)).join("")}
    </div>

    <div class="offseason-hub-footer">
      <button type="button" class="dashboard-advance-button" onclick="simDay()">
        Advance
      </button>

      ${actionButton}
    </div>
  `;
}

function getOffseasonHubActionLabel() {
  if (!gameState || !gameState.currentDate) return "Review Roster";

  const currentEvent = getCurrentOffseasonHubEvent();

  if (!currentEvent) return "Review Roster";

  if (currentEvent.id === "season_complete") return "Scout Draft";
  if (currentEvent.id === "draft_lottery") return "Draft Lottery";
  if (currentEvent.id === "draft_combine") return "View Draft Combine";
  if (currentEvent.id === "league_draft") return "Enter Draft";
if (currentEvent.id === "league_draft_round1") return "Enter Round 1";
if (currentEvent.id === "league_draft_round2") return "Enter Round 2";

  if (currentEvent.id === "moratorium") return "Free Agency";
  if (currentEvent.id === "free_agency") return "Free Agency";
  if (currentEvent.id === "summer_league") return "Review Roster";
  if (currentEvent.id === "training_camp") return "Training Camp";

  return "Review Roster";
}

function isPostseasonGameForDashboard(game) {
  if (!game) return false;

  const text = [
    game.competition,
    game.type,
    game.round,
    game.roundName,
    game.stage,
    game.name
  ].join(" ").toLowerCase();

  return (
    game.playoffGame ||
    game.playoffs ||
    game.finalsGame ||
    text.includes("playoff") ||
    text.includes("final") ||
    text.includes("postseason")
  );
}

function isGameCancelledForDashboard(game) {
  if (!game) return false;

  const status = String(game.status || game.gameStatus || "").toLowerCase();

  return (
    game.cancelled ||
    game.canceled ||
    game.unnecessary ||
    status.includes("cancel") ||
    status.includes("unnecessary")
  );
}

function getAllScheduleGamesForDashboardCheck() {
  const allGames = [];

  if (gameState && Array.isArray(gameState.userSchedule)) {
    allGames.push(...gameState.userSchedule);
  }

  if (gameState && Array.isArray(gameState.schedule)) {
    allGames.push(...gameState.schedule);
  }

  if (gameState && Array.isArray(gameState.games)) {
    allGames.push(...gameState.games);
  }

  if (typeof games !== "undefined" && Array.isArray(games)) {
    allGames.push(...games);
  }

  return allGames;
}

function hasRemainingPostseasonGamesForDashboard() {
  if (!gameState || !gameState.currentDate) return false;

  const currentDate = new Date(gameState.currentDate);
  const allGames = getAllScheduleGamesForDashboardCheck();

  return allGames.some(game => {
    if (!isPostseasonGameForDashboard(game)) return false;
    if (isGameCancelledForDashboard(game)) return false;
    if (game.played || game.completed || game.final) return false;

    const gameDate = new Date(game.date || game.gameDate || game.startDate);

    if (Number.isNaN(gameDate.getTime())) return false;

    return gameDate >= currentDate;
  });
}

function areFinalsCompleteForDashboard() {
  if (!gameState || !gameState.currentDate) return false;

  if (gameState.finalsComplete || gameState.championId || gameState.championTeamId) {
    return true;
  }

  if (gameState.playoffsComplete || gameState.postseasonComplete) {
    return true;
  }

  if (gameState.finals && gameState.finals.complete) {
    return true;
  }

  if (gameState.playoffState && gameState.playoffState.championId) {
    return true;
  }

  const currentDate = new Date(gameState.currentDate);
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const dateKey = month * 100 + day;

  const inFinalsEndingWindow = dateKey >= 606 && dateKey <= 615;

  if (inFinalsEndingWindow && !hasRemainingPostseasonGamesForDashboard()) {
    return true;
  }

  const phase = typeof getSeasonPhase === "function" ? getSeasonPhase() : "";

  return (
    phase === "Season Complete" ||
    phase === "Finals Complete" ||
    phase === "Offseason Ready"
  );
}

function displayDashboardContextButtons() {
  const button = document.getElementById("dashboard-context-action-button");
  if (!button) return;

  const action = getDashboardContextAction();

  button.classList.toggle("hidden", !action.visible);
  button.textContent = action.label;
  button.dataset.action = action.action;

  button.className = `dashboard-context-action-button ${action.className || "roster"}`;

  if (!action.visible) {
    button.classList.add("hidden");
  }
}

function handleDashboardContextAction() {
  const button = document.getElementById("dashboard-context-action-button");
  const action = button ? button.dataset.action : getDashboardContextAction().action;

if (action === "calendar-context-label") return;

if (action === "awards-ceremony") {
  if (typeof openAwardsCeremonyFromDashboard === "function") {
    openAwardsCeremonyFromDashboard();
  } else {
    showMainSection("league");
    showSecondaryScreen("awards-ceremony-screen");
  }

  refreshAll();
  return;
}

if (action === "view-playoffs") {
  showMainSection("competitions");
  showSecondaryScreen("playoffs-screen");

  if (typeof displayPlayoffs === "function") {
    displayPlayoffs();
  }

  refreshAll();
  return;
}

  if (action === "view-mock-drafts") {
    if (typeof ensureDraftState === "function") {
      ensureDraftState();
    }

    if (
      gameState.draft &&
      (!Array.isArray(gameState.draft.currentMockDraft) || gameState.draft.currentMockDraft.length === 0) &&
      typeof generateCurrentMockDraft === "function"
    ) {
      generateCurrentMockDraft("Offseason Mock");
    }

    showMainSection("draft");
    showSecondaryScreen("mock-drafts-screen");
    refreshAll();
    return;
  }

  if (action === "draft-lottery") {
    showMainSection("draft");
    showSecondaryScreen("lottery-odds-screen");

    if (typeof runDraftLottery === "function") {
      runDraftLottery();
    }

    if (typeof markOffseasonHubEventComplete === "function") {
      markOffseasonHubEventComplete("draft_lottery");
    }

    refreshAll();
    return;
  }

  if (action === "view-draft-combine") {
    showMainSection("draft");

    if (document.getElementById("combine-results-screen")) {
      showSecondaryScreen("combine-results-screen");
    } else {
      showSecondaryScreen("scouting-screen");

      showModal(
        "Draft Combine",
        "Draft Combine results are a placeholder for now. This will become its own screen later."
      );
    }

    if (typeof markOffseasonHubEventComplete === "function") {
      markOffseasonHubEventComplete("draft_combine");
    }

    refreshAll();
    return;
  }

  if (action === "league-draft") {
    if (typeof enterDraftFromDashboard === "function") {
      enterDraftFromDashboard();
    } else {
      showMainSection("draft");
      showSecondaryScreen("draft-board-screen");
    }

    refreshAll();
    return;
  }

  if (action === "re-sign-players") {
    showMainSection("team");
    showSecondaryScreen("roster-screen");
    refreshAll();
    return;
  }

  if (action === "free-agency") {
    if (typeof enterFreeAgencyFromDashboard === "function") {
      enterFreeAgencyFromDashboard();
    } else {
      showMainSection("free-agency");
      showSecondaryScreen("free-agency-screen");
    }

    refreshAll();
    return;
  }

  if (action === "start-new-season") {
    if (typeof startNextSeason === "function") {
      startNextSeason();
    }

    refreshAll();
    return;
  }

  showMainSection("team");
  showSecondaryScreen("roster-screen");
  refreshAll();
}

function testDashboardContextButtons(testDate = null, testPhase = null) {
  const oldDate = gameState.currentDate;
  const oldGetSeasonPhase = window.getSeasonPhase;

  if (testDate) {
    gameState.currentDate = testDate;
  }

  if (testPhase) {
    window.getSeasonPhase = function() {
      return testPhase;
    };
  }

  displayDashboardContextButtons();

  const result = {
    currentDate: gameState.currentDate,
    phase: typeof getSeasonPhase === "function" ? getSeasonPhase() : "Unknown",
    freeAgencyVisible: !document.getElementById("dashboard-enter-free-agency-button")?.classList.contains("hidden"),
    lotteryVisible: !document.getElementById("dashboard-enter-lottery-button")?.classList.contains("hidden"),
    draftVisible: !document.getElementById("dashboard-enter-draft-button")?.classList.contains("hidden"),
    offseasonVisible: !document.getElementById("dashboard-start-offseason-button")?.classList.contains("hidden")
  };

  console.table(result);

  gameState.currentDate = oldDate;

  if (testPhase) {
    window.getSeasonPhase = oldGetSeasonPhase;
  }

  displayDashboardContextButtons();

  return result;
}

function getMajorDateEvent(title, label, date, actionType, description) {
  return {
    title,
    label,
    date,
    actionType,
    description
  };
}

function getNextCupGameEvent() {
  if (!gameState || !Array.isArray(gameState.userSchedule)) return null;

  const todayValue = getDateOnlyValue(gameState.currentDate);

  const nextCupGame = gameState.userSchedule
    .filter(game =>
      !game.played &&
      !isCancelledFutureGame(game) &&
      (game.cupGame || String(game.competition || "").toLowerCase().includes("cup")) &&
      getDateOnlyValue(game.date) >= todayValue
    )
    .sort((a, b) => getDateOnlyValue(a.date) - getDateOnlyValue(b.date))[0];

  if (!nextCupGame) return null;

  return {
    title: "The Cup Game",
    label: "The Cup",
    date: new Date(nextCupGame.date),
    actionType: "cup",
    description: `${nextCupGame.home ? "Home vs" : "Away at"} ${nextCupGame.opponentName || nextCupGame.opponentAbbrev}. Cup games are high-priority matchups.`
  };
}

function getNextBigEventList() {
  if (!gameState || !gameState.started) return [];

  const startYear = Number(gameState.seasonStartYear || 2026);
  const nextYear = startYear + 1;

  const events = [
    getMajorDateEvent(
      "Opening Night",
      "Regular Season",
      new Date(startYear, 9, 21),
      "schedule",
      "The regular season begins. Make sure your rotation and roster are ready."
    ),

    getNextCupGameEvent(),

    getMajorDateEvent(
      "Trade Deadline",
      "Roster Building",
      new Date(nextYear, 1, 8),
      "trade-center",
      "Final chance to reshape your roster before the playoff push."
    ),

    getMajorDateEvent(
      "Regular Season Ends",
      "Season Finish",
      new Date(nextYear, 3, 12),
      "standings",
      "Final standings, playoff seeding, and Play-In spots are decided."
    ),

    getMajorDateEvent(
      "The Finals",
      "Championship",
      new Date(nextYear, 5, 4),
      "finals",
      "The league championship series begins."
    ),

    getMajorDateEvent(
      "Draft",
      "Draft Night",
      new Date(nextYear, 5, 20),
      "draft-night",
      "Select rookies and shape the future of your roster."
    ),

    getMajorDateEvent(
      "Moratorium Opens",
      "Free Agency",
      new Date(nextYear, 5, 24),
      "free-agency",
      "Teams can begin preparing their free agency plans before signings open."
    ),

    getMajorDateEvent(
      "Free Agency Opens",
      "Free Agency",
      new Date(nextYear, 5, 30),
      "free-agency",
      "Negotiate contracts and rebuild your roster."
    ),

    getMajorDateEvent(
      "Training Camp",
      "Next Season",
      new Date(nextYear, 8, 25),
      "gameplan",
      "The next season begins. Set your rotation, practices, and team direction."
    )
  ];

  return events.filter(Boolean);
}

function getDateOnlyValue(dateValue) {
  const date = new Date(dateValue);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

function getNextBigEvent() {
  if (!gameState || !gameState.started) return null;

  const todayValue = getDateOnlyValue(gameState.currentDate);

  const upcoming = getNextBigEventList()
    .filter(event => getDateOnlyValue(event.date) >= todayValue)
    .sort((a, b) => getDateOnlyValue(a.date) - getDateOnlyValue(b.date));

  return upcoming[0] || null;
}

function getDaysUntilBigEvent(eventDate) {
  if (!gameState || !gameState.currentDate || !eventDate) return null;

  const todayValue = getDateOnlyValue(gameState.currentDate);
  const eventValue = getDateOnlyValue(eventDate);

  return Math.max(0, Math.round((eventValue - todayValue) / (1000 * 60 * 60 * 24)));
}

function getNextBigEventCountdownText(days) {
  if (days === null || days === undefined) return "Upcoming";
  if (days === 0) return "Today";
  if (days === 1) return "1 Day";
  return `${days} Days`;
}

function handleNextBigEventClick(actionType) {
  const action = String(actionType || "");

  if (action === "schedule") {
    showMainSection("schedule");
    showSecondaryScreen("schedule-screen");
    return;
  }

  if (action === "cup") {
    showMainSection("competitions");
    showSecondaryScreen("cup-screen");
    return;
  }

  if (action === "trade-center") {
    showMainSection("trade-center");
    return;
  }

  if (action === "standings") {
    showMainSection("competitions");
    showSecondaryScreen("standings-screen");
    return;
  }

  if (action === "finals") {
    showMainSection("competitions");
    showSecondaryScreen("playoffs-screen");
    return;
  }

  if (action === "draft-night") {
    showMainSection("draft");
    showSecondaryScreen("draft-board-screen");
    return;
  }

  if (action === "free-agency") {
    showMainSection("free-agency");
    showSecondaryScreen("free-agency-screen");
    return;
  }

  if (action === "gameplan") {
    showMainSection("gameplan");
    showSecondaryScreen("rotation-screen");
  }
}

function displayNextBigEventCard() {
  const card = document.getElementById("dashboard-next-big-event-card");

  if (!card || !gameState || !gameState.started) return;

  const event = getNextBigEvent();

  if (!event) {
    card.innerHTML = `
      <div class="next-big-event-kicker">Next Event</div>

      <div class="next-big-event-compact-row">
        <div>
          <h2>No Event</h2>
          <p>No major event scheduled.</p>
        </div>
      </div>
    `;
    return;
  }

  const days = getDaysUntilBigEvent(event.date);
  const countdownText = getNextBigEventCountdownText(days);

  card.innerHTML = `
    <div class="next-big-event-kicker">${event.label}</div>

    <div class="next-big-event-compact-row">
      <div class="next-big-event-copy">
        <h2>${event.title}</h2>
        <p>${formatDate(event.date)}</p>
      </div>

      <div class="next-big-event-countdown">
        <strong>${countdownText}</strong>

        <button
          type="button"
          onclick="handleNextBigEventClick('${event.actionType}')"
        >
          View
        </button>
      </div>
    </div>
  `;
}

function displayDashboard() {
  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return;

  const roster = gameState.rosters[gameState.selectedTeamId] || [];
  const record = `${selectedTeam.wins || 0}-${selectedTeam.losses || 0}`;
  const rank = getConferenceRank(selectedTeam.id);

  setText("dashboard-date", formatDate(gameState.currentDate));
  setText("dashboard-season-phase", getSeasonPhase());
  setText("dashboard-team-name", selectedTeam.name);
  setText("dashboard-record", record);

  setText("dashboard-club-record", record);
  setText("dashboard-club-rank", rank ? `${rank} in ${selectedTeam.conference}` : "--");
  setText("dashboard-conference", selectedTeam.conference);
  setText("dashboard-conference-rank", rank ? `${rank}` : "--");

  setText("dashboard-overall", getTeamLevelLabel(selectedTeam));
  setText("dashboard-team-level-label", "Team Level");

  const payroll = getTeamPayroll(gameState.selectedTeamId);
  const capSpace = Math.round((gameState.salaryCap || SALARY_CAP) - payroll);

  setText("dashboard-payroll", `$${payroll}M`);
  setText("dashboard-cap-space", capSpace >= 0 ? `$${capSpace}M` : `-$${Math.abs(capSpace)}M`);
  setText("dashboard-cap-status", capSpace >= 0 ? "Under Cap" : "Over the Cap");

  const capElement = document.getElementById("dashboard-cap-space");
  const capStatusElement = document.getElementById("dashboard-cap-status");

  if (capElement) capElement.classList.toggle("over-cap", capSpace < 0);
  if (capStatusElement) capStatusElement.classList.toggle("over-cap", capSpace < 0);

  setText("dashboard-chemistry", `${getDashboardChemistry()}%`);
  setText("dashboard-owner-happiness", getDashboardOwnerHappiness());
  setText("dashboard-playoff-odds", getDashboardPlayoffOdds(selectedTeam));

  const userLogo = document.getElementById("dashboard-user-logo");

if (userLogo) {
  userLogo.innerHTML = getTeamLogoHTML(
    selectedTeam,
    "team-logo-placeholder team-logo-large dashboard-user-team-logo"
  );
}

    displayDashboardNextGame(selectedTeam);
    displayDashboardCompactNextGame(selectedTeam);
    displayDashboardSeasonOverview(selectedTeam);
    displayNextBigEventCard();
    displayDashboardScheduleStrip();

    if (typeof runGMHubPhoneConversationChecks === "function") {
      runGMHubPhoneConversationChecks();
    }

    displayGMHub();
    displayDashboardStandings();
    displayDashboardStatsCenter();
    displayDashboardContextButtons();
    displayDashboardOffseasonHub();
    displayDashboardBottomCards();
}

function displayDashboardCompactNextGame(selectedTeam) {
  const card = document.querySelector(".dashboard-compact-next-game-card");
  if (!card || !selectedTeam) return;

  const nextGame = getNextGame();
  const userLogo = document.getElementById("dashboard-compact-user-logo");
  const opponentLogo = document.getElementById("dashboard-compact-opponent-logo");

  setText("dashboard-compact-user-name", selectedTeam.name);
  setText(
    "dashboard-compact-user-record",
    `${selectedTeam.wins || 0}-${selectedTeam.losses || 0}`
  );

  if (userLogo) {
    userLogo.innerHTML = getTeamLogoHTML(
      selectedTeam,
      "team-logo-placeholder dashboard-compact-team-logo"
    );
  }

  if (!nextGame) {
    setText("dashboard-compact-game-phase", getSeasonPhase());
    setText("dashboard-compact-opponent-name", "No Game Scheduled");
    setText("dashboard-compact-opponent-record", "--");
    setText("dashboard-compact-game-date", "--");
    setText("dashboard-compact-game-time", "--");
    setText("dashboard-compact-game-arena", "--");

    if (opponentLogo) {
      opponentLogo.innerHTML =
        '<div class="team-logo-placeholder dashboard-compact-team-logo team-logo-empty">--</div>';
    }

    return;
  }

  const opponent =
    gameState.teams.find(
      (team) => Number(team.id) === Number(nextGame.opponentId)
    ) ||
    getTeamById(nextGame.opponentId) ||
    getBaseTeamById(nextGame.opponentId);

  const arenaTeam = getDashboardArenaTeamForGame(
    nextGame,
    selectedTeam,
    opponent
  );

  setText("dashboard-compact-game-phase", getSeasonPhase());
  setText(
    "dashboard-compact-opponent-name",
    opponent ? opponent.name : nextGame.opponentName || "Opponent"
  );
  setText(
    "dashboard-compact-opponent-record",
    opponent ? `${opponent.wins || 0}-${opponent.losses || 0}` : "--"
  );
  setText("dashboard-compact-game-date", formatDate(nextGame.date));
  setText("dashboard-compact-game-time", nextGame.fcdGameTime || "7:30 PM");
  setText(
    "dashboard-compact-game-arena",
    getDashboardArenaName(arenaTeam)
  );

  if (opponentLogo) {
    opponentLogo.innerHTML = opponent
      ? getTeamLogoHTML(
          opponent,
          "team-logo-placeholder dashboard-compact-team-logo"
        )
      : '<div class="team-logo-placeholder dashboard-compact-team-logo team-logo-empty">OPP</div>';
  }
}

function displayDashboardSeasonOverview(selectedTeam) {
  if (!selectedTeam) return;

  const record = `${selectedTeam.wins || 0}-${selectedTeam.losses || 0}`;
  const conferenceRank = getConferenceRank(selectedTeam.id);
  const divisionTeams = gameState.teams
    .filter(
      (team) =>
        team.conference === selectedTeam.conference &&
        team.division === selectedTeam.division
    )
    .sort((a, b) => {
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
      return (a.losses || 0) - (b.losses || 0);
    });
  const divisionRank =
    divisionTeams.findIndex(
      (team) => Number(team.id) === Number(selectedTeam.id)
    ) + 1;

  const playedGames = (gameState.userSchedule || []).filter((game) => game.played);
  const lastTenGames = playedGames.slice(-10);
  const lastTenWins = lastTenGames.filter((game) =>
    String(game.result || "").startsWith("W")
  ).length;

  let streakType = "";
  let streakLength = 0;

  for (const game of [...playedGames].reverse()) {
    const resultType = String(game.result || "").startsWith("W") ? "W" : "L";

    if (!streakType) streakType = resultType;
    if (resultType !== streakType) break;
    streakLength += 1;
  }

  const roster = gameState.rosters[gameState.selectedTeamId] || [];
  const moraleScores = {
    ecstatic: 100,
    happy: 90,
    content: 76,
    okay: 65,
    neutral: 65,
    unhappy: 42,
    angry: 25
  };
  const moraleTotal = roster.reduce((sum, player) => {
    const morale = String(player.morale || "happy").toLowerCase();
    return sum + (moraleScores[morale] || 65);
  }, 0);
  const teamMorale = roster.length
    ? Math.round(moraleTotal / roster.length)
    : 75;

  let fanInterest = 75;
  if (
    typeof getTeamFinanceState === "function" &&
    typeof getTeamFanInterest === "function"
  ) {
    fanInterest = getTeamFanInterest(
      selectedTeam,
      getTeamFinanceState(selectedTeam.id)
    );
  }

  setText("dashboard-season-record", record);
  setText(
    "dashboard-season-conf-rank",
    conferenceRank ? `${conferenceRank}${getOrdinalSuffix(conferenceRank)}` : "--"
  );
  setText(
    "dashboard-season-div-rank",
    divisionRank > 0 ? `${divisionRank}${getOrdinalSuffix(divisionRank)}` : "--"
  );
  setText(
    "dashboard-season-streak",
    streakLength ? `${streakType}${streakLength}` : "--"
  );
  setText(
    "dashboard-season-last-ten",
    `${lastTenWins}-${lastTenGames.length - lastTenWins}`
  );
  setText("dashboard-team-morale", `${teamMorale}%`);
  setText("dashboard-fan-interest", `${fanInterest}%`);
  setDashboardSeasonMeter("dashboard-chemistry-meter", getDashboardChemistry());
  setDashboardSeasonMeter("dashboard-morale-meter", teamMorale);
  setDashboardSeasonMeter("dashboard-fan-interest-meter", fanInterest);
}

function setDashboardSeasonMeter(elementId, value) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  element.style.setProperty(
    "--dashboard-meter-height",
    `${Math.round(safeValue * 0.82)}px`
  );
}

function displayDashboardBottomCards() {
  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return;

  displayDashboardStartingFive(selectedTeam);
  displayDashboardFinancesSummary(selectedTeam);
  displayDashboardInjuriesSummary(selectedTeam);
}

function getDashboardStartingFivePlayers() {
  const positions = ["PG", "SG", "SF", "PF", "C"];
  const roster = getRosterByTeamId(gameState.selectedTeamId);
  const rosterById = new Map(
    roster.map((player) => [Number(player.id), player])
  );
  const starters = {};
  const usedIds = new Set();
  const rotationSlots =
    gameState.rotation && Array.isArray(gameState.rotation.slots)
      ? gameState.rotation.slots
      : [];

  for (const position of positions) {
    const slot = rotationSlots.find(
      (item) => item.starter && item.position === position
    );
    const player = slot ? rosterById.get(Number(slot.playerId)) : null;

    if (player) {
      starters[position] = player;
      usedIds.add(Number(player.id));
    }
  }

  const fallbackRoster =
    typeof getSortedRoster === "function" ? getSortedRoster() : roster;

  for (const position of positions) {
    if (starters[position]) continue;

    let player = fallbackRoster.find((candidate) => {
      const secondary = Array.isArray(candidate.secondaryPositions)
        ? candidate.secondaryPositions
        : [];

      return (
        !usedIds.has(Number(candidate.id)) &&
        (candidate.primaryPosition === position || secondary.includes(position))
      );
    });

    if (!player) {
      player = fallbackRoster.find(
        (candidate) => !usedIds.has(Number(candidate.id))
      );
    }

    if (player) {
      starters[position] = player;
      usedIds.add(Number(player.id));
    }
  }

  return positions.map((position) => ({
    position,
    player: starters[position] || null
  }));
}

function displayDashboardStartingFive() {
  const container = document.getElementById("dashboard-starting-five");
  if (!container) return;

  const starters = getDashboardStartingFivePlayers();

  container.innerHTML = starters
    .map(({ position, player }) => {
      if (!player) {
        return `
          <div class="dashboard-starter-tile empty">
            <span>${position}</span>
            <div class="dashboard-starter-face player-silhouette"></div>
            <strong>Open Slot</strong>
            <small>#--</small>
          </div>
        `;
      }

      const faceHtml =
        typeof getPlayerFaceHTML === "function"
          ? getPlayerFaceHTML(player, "dashboard-starter-face")
          : '<div class="dashboard-starter-face player-silhouette"></div>';
      const rawJerseyNumber =
        player.jerseyNumber ?? player.number ?? player.jersey ?? "--";
      const jerseyNumber = ["", "unknown", "n/a", "null", "undefined"].includes(
        String(rawJerseyNumber).trim().toLowerCase()
      )
        ? "--"
        : rawJerseyNumber;

      return `
        <div class="dashboard-starter-tile">
          <span>${position}</span>
          ${faceHtml}
          <strong>${escapeDashboardBottomHtml(player.name || "Player")}</strong>
          <small>#${escapeDashboardBottomHtml(jerseyNumber)}</small>
        </div>
      `;
    })
    .join("");
}

function displayDashboardFinancesSummary(selectedTeam) {
  const salaryCap = Number(gameState.salaryCap || SALARY_CAP);
  const payroll =
    typeof getRosterPayroll === "function"
      ? getRosterPayroll(selectedTeam.id)
      : getTeamPayroll(selectedTeam.id);
  const capSpace = salaryCap - payroll;
  const luxuryTax =
    typeof getLuxuryTaxLine === "function"
      ? getLuxuryTaxLine()
      : Math.round(salaryCap * 1.215);
  const firstApron =
    typeof getFirstApronLine === "function"
      ? getFirstApronLine()
      : luxuryTax + 7;
  const secondApron =
    typeof getSecondApronLine === "function"
      ? getSecondApronLine()
      : luxuryTax + 17.5;
  const capUsage = Math.max(
    0,
    Math.min(100, Math.round((payroll / Math.max(1, salaryCap)) * 100))
  );

  setText("dashboard-bottom-cap-space", formatDashboardMoney(capSpace));
  setText("dashboard-bottom-salary-cap", formatMoney(salaryCap));
  setText("dashboard-bottom-luxury-tax", formatMoney(luxuryTax));
  setText("dashboard-bottom-first-apron", formatMoney(firstApron));
  setText("dashboard-bottom-second-apron", formatMoney(secondApron));

  const ring = document.getElementById("dashboard-cap-space-ring");
  if (ring) {
    ring.style.setProperty("--dashboard-cap-usage", `${capUsage}%`);
    ring.classList.toggle("over-cap", capSpace < 0);
  }
}

function formatDashboardMoney(value) {
  const amount = Number(value || 0);
  return amount < 0 ? `-${formatMoney(Math.abs(amount))}` : formatMoney(amount);
}

function displayDashboardInjuriesSummary() {
  const container = document.getElementById("dashboard-bottom-injury-list");
  if (!container) return;

  const injuredPlayers = getRosterByTeamId(gameState.selectedTeamId)
    .filter(
      (player) =>
        player.injured ||
        player.isInjured ||
        Number(player.injuryDaysRemaining || player.daysRemaining || 0) > 0
    )
    .sort(
      (a, b) =>
        Number(b.injuryDaysRemaining || b.daysRemaining || 0) -
        Number(a.injuryDaysRemaining || a.daysRemaining || 0)
    )
    .slice(0, 3);

  if (injuredPlayers.length === 0) {
    container.innerHTML =
      '<div class="dashboard-no-injuries">No current injuries.</div>';
    return;
  }

  container.innerHTML = injuredPlayers
    .map((player) => {
      const faceHtml =
        typeof getPlayerFaceHTML === "function"
          ? getPlayerFaceHTML(player, "dashboard-injury-face")
          : '<div class="dashboard-injury-face player-silhouette"></div>';
      const injuryName =
        player.injuryName || player.injuryType || "Unavailable";
      const daysRemaining = Number(
        player.injuryDaysRemaining || player.daysRemaining || 0
      );
      const status = daysRemaining > 0 ? `${daysRemaining} days` : "TBD";

      return `
        <div class="dashboard-injury-row">
          ${faceHtml}
          <div>
            <strong>${escapeDashboardBottomHtml(player.name || "Player")}</strong>
            <span>${escapeDashboardBottomHtml(injuryName)}</span>
          </div>
          <small>${status}</small>
        </div>
      `;
    })
    .join("");
}

function escapeDashboardBottomHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isDashboardDraftComplete() {
  return Boolean(
    gameState.draftComplete ||
    gameState.draft?.complete ||
    gameState.draft?.draftComplete ||
    gameState.draft?.draftComplete === true ||
    gameState.draft?.draftedPlayers?.length >= 60
  );
}

function getDashboardDateKey() {
  if (typeof getCurrentDateKey === "function") {
    return getCurrentDateKey();
  }

  if (!gameState || !gameState.currentDate) return 0;

  const date = new Date(gameState.currentDate);
  return (date.getMonth() + 1) * 100 + date.getDate();
}

function isDashboardDraftLotteryComplete() {
  return Boolean(
    gameState.draftLotteryRun ||
    gameState.lotteryComplete ||
    gameState.draftLotteryComplete ||
    gameState.draft?.lotteryRun ||
    gameState.draft?.lotteryComplete
  );
}

function isDashboardDraftComplete() {
  return Boolean(
    gameState.draftComplete ||
    gameState.draft?.complete ||
    gameState.draft?.draftComplete ||
    gameState.draft?.draftedPlayers?.length >= 60
  );
}

function isDashboardPlayoffsContextActive() {
  if (!gameState || !gameState.started || !gameState.currentDate) return false;

  if (gameState.offseasonActive === true) return false;
  if (gameState.finalsCompletedDate) return false;

  if (
    gameState.playoffs &&
    (
      gameState.playoffs.playoffsComplete === true ||
      gameState.playoffs.championId ||
      gameState.playoffs.championTeamId
    )
  ) {
    return false;
  }

  const current = new Date(gameState.currentDate);
  current.setHours(0, 0, 0, 0);

  const playoffStart = new Date(Number(gameState.seasonStartYear) + 1, 3, 21);
  playoffStart.setHours(0, 0, 0, 0);

  return current >= playoffStart;
}

function getDashboardCalendarContextLabel() {
  const current = new Date(gameState.currentDate);
  current.setHours(0, 0, 0, 0);

  const seasonYear = current.getMonth() >= 7
    ? current.getFullYear()
    : current.getFullYear() - 1;
  const nextYear = seasonYear + 1;
  const allStar = typeof getAllStarBreakDatesForSeason === "function"
    ? getAllStarBreakDatesForSeason(seasonYear)
    : { start: new Date(nextYear, 1, 12), end: new Date(nextYear, 1, 19) };
  const ncaaDate = typeof getNcaaChampionshipDate === "function"
    ? getNcaaChampionshipDate(nextYear)
    : new Date(nextYear, 3, 1);
  const finalsEnd = gameState.finalsCompletedDate
    ? new Date(gameState.finalsCompletedDate)
    : null;
  const between = (start, end) => current >= start && current <= end;
  const sameDay = (date) =>
    current.getFullYear() === date.getFullYear() &&
    current.getMonth() === date.getMonth() &&
    current.getDate() === date.getDate();

  if (between(new Date(seasonYear, 7, 15), new Date(seasonYear, 7, 17))) return "Financial Planning";
  if (between(new Date(seasonYear, 7, 18), new Date(seasonYear, 8, 21))) return "View Schedule";
  if (between(new Date(seasonYear, 8, 22), new Date(seasonYear, 9, 4))) return "Training Camp";
  if (between(new Date(seasonYear, 9, 5), new Date(seasonYear, 9, 21))) return "Preseason";
  if (between(new Date(seasonYear, 9, 22), new Date(seasonYear, 10, 10))) return "Season Hub";
  if (between(new Date(seasonYear, 10, 11), new Date(seasonYear, 11, 15))) return "The Cup";
  if (between(new Date(seasonYear, 11, 16), new Date(nextYear, 0, 11))) return "Season Hub";
  if (between(new Date(nextYear, 0, 12), new Date(nextYear, 0, 18))) return "Rivals Week";
  if (between(new Date(nextYear, 0, 19), new Date(nextYear, 1, 4))) return "Trade Center";
  if (sameDay(new Date(nextYear, 1, 5))) return "Trade Deadline";
  if (between(new Date(nextYear, 1, 6), new Date(allStar.start.getTime() - 86400000))) return "Owner Meeting";
  if (between(allStar.start, allStar.end)) return "All-Star Weekend";
  if (between(new Date(allStar.end.getTime() + 86400000), new Date(nextYear, 1, 28))) return "Season Hub";
  if (between(new Date(nextYear, 2, 1), new Date(nextYear, 2, 3))) return "Free Agents";
  if (between(new Date(nextYear, 2, 4), new Date(ncaaDate.getTime() - 86400000))) return "Roster Management";
  if (between(ncaaDate, new Date(nextYear, 3, 14))) return "Scouting";
  if (sameDay(new Date(nextYear, 3, 15))) return "Playoff Picture";
  if (between(new Date(nextYear, 3, 16), new Date(nextYear, 3, 19))) return "Play-In Tournament";
  if (current >= new Date(nextYear, 3, 20) && (!finalsEnd || current <= finalsEnd)) return "Playoffs";
  if (finalsEnd && current > finalsEnd && current <= new Date(nextYear, 5, 17)) return "Contracts";
  if (sameDay(new Date(nextYear, 5, 18))) return "Draft Lottery";
  if (sameDay(new Date(nextYear, 5, 19))) return "Draft Combine";
  if (between(new Date(nextYear, 5, 20), new Date(nextYear, 5, 21))) return "Draft";
  if (between(new Date(nextYear, 5, 22), new Date(nextYear, 5, 23))) return "Rookie Contracts";
  if (sameDay(new Date(nextYear, 5, 24))) return "League Meeting";
  if (sameDay(new Date(nextYear, 5, 25))) return "Owner Meeting";
  if (between(new Date(nextYear, 5, 26), new Date(nextYear, 5, 29))) return "Contracts";
  if (between(new Date(nextYear, 6, 1), new Date(nextYear, 6, 11))) return "Free Agency";
  if (between(new Date(nextYear, 6, 12), new Date(nextYear, 6, 22))) return "Summer League";
  return "Front Office";
}

function getDashboardContextAction() {
  if (!gameState || !gameState.started) {
    return {
      visible: false,
      label: "",
      action: "",
      className: "roster"
    };
  }

  return {
    visible: true,
    label: getDashboardCalendarContextLabel(),
    action: "calendar-context-label",
    className: "roster"
  };

  const dateKey = getDashboardDateKey();
  const offseasonActive = gameState.offseasonActive === true;
  const lotteryComplete = isDashboardDraftLotteryComplete();
  const draftComplete = isDashboardDraftComplete();

  if (
  typeof isAwardsCeremonyAvailable === "function" &&
  isAwardsCeremonyAvailable() &&
  typeof isAwardsCeremonyComplete === "function" &&
  !isAwardsCeremonyComplete()
) {
  return {
    visible: true,
    label: "Awards Ceremony",
    action: "awards-ceremony",
    className: "awards"
  };
}

if (isDashboardPlayoffsContextActive()) {
  return {
    visible: true,
    label: "View Playoffs",
    action: "view-playoffs",
    className: "playoffs"
  };
}

  if (offseasonActive) {
    if (dateKey < 618) {
      return {
        visible: true,
        label: "View Mock Drafts",
        action: "view-mock-drafts",
        className: "draft"
      };
    }

    if (dateKey >= 618 && dateKey < 620 && !lotteryComplete) {
      return {
        visible: true,
        label: "Draft Lottery",
        action: "draft-lottery",
        className: "lottery"
      };
    }

    if (dateKey >= 618 && dateKey < 620 && lotteryComplete) {
      return {
        visible: true,
        label: "View Draft Combine",
        action: "view-draft-combine",
        className: "draft"
      };
    }

    if (dateKey >= 620 && !draftComplete) {
      return {
        visible: true,
        label: "League Draft",
        action: "league-draft",
        className: "draft"
      };
    }

    if (dateKey >= 621 && dateKey < 630) {
      return {
        visible: true,
        label: "Re-sign Players",
        action: "re-sign-players",
        className: "roster"
      };
    }

    if (dateKey >= 630 && dateKey < 925) {
      return {
        visible: true,
        label: "Free Agency",
        action: "free-agency",
        className: "free-agency"
      };
    }

    if (dateKey >= 925) {
      return {
        visible: true,
        label: "Start New Season",
        action: "start-new-season",
        className: "new-season"
      };
    }
  }

  return {
    visible: true,
    label: "Review Roster",
    action: "review-roster",
    className: "roster"
  };
}

function displayStartOffseasonButton() {
  const button = document.getElementById("dashboard-start-offseason-button");

  if (button) {
    button.classList.add("hidden");
  }
}

function displayNextGameBox() {
  const nextGame = getNextGame();
  const nextGameBox = document.getElementById("next-game-box");
  const card = document.getElementById("next-match-card");

  if (!nextGameBox) return;

  if (card) {
    card.classList.remove("next-match-card-cup", "next-match-card-playoff");
  }

  if (!nextGame) {
    nextGameBox.innerHTML = `<p>No games scheduled.</p>`;
    return;
  }

  if (card && nextGame.cupGame) {
    card.classList.add("next-match-card-cup");
  }

  if (card && (nextGame.playoffGame || nextGame.playInGame)) {
    card.classList.add("next-match-card-playoff");
  }

  let specialInfo = "";

  if (nextGame.cupGame && nextGame.competition === "The Cup Group") {
    specialInfo = getUserCupGroupMiniHtml();
  }

  if (nextGame.playoffGame) {
    const series = getSeriesForScheduleGame(nextGame);

    if (series) {
      specialInfo = `
        <div class="next-match-meta">
          <p><strong>${nextGame.competition} - Game ${nextGame.gameNumber}</strong></p>
          <p>${getSeriesStatusText(series)}</p>
        </div>
      `;
    }
  }

  if (nextGame.playInGame) {
    specialInfo = `
      <div class="next-match-meta">
        <p><strong>Play-In Tournament</strong></p>
        <p>Winner moves closer to the final playoff field.</p>
      </div>
    `;
  }

  nextGameBox.innerHTML = `
    <p><strong>${nextGame.competition}</strong></p>
    <div class="next-opponent-name">${nextGame.opponentName}</div>
    <div class="next-match-meta">
      <p><strong>Date:</strong> ${formatDate(nextGame.date)}</p>
      <p><strong>Venue:</strong> ${nextGame.home ? "Home" : "Away"}</p>
      <p><strong>Status:</strong> ${nextGame.played ? nextGame.result : "Upcoming"}</p>
    </div>
    ${specialInfo}
  `;
}

function displayInbox() {
  const inboxList = document.getElementById("inbox-list");

  if (!inboxList) return;

  inboxList.innerHTML = "";

  const messages = getFilteredDashboardInboxMessages();

  if (messages.length === 0) {
    inboxList.innerHTML = `
      <div class="dashboard-inbox-item">
        <div class="dashboard-inbox-icon staff">✓</div>
        <div class="dashboard-inbox-copy">
          <strong class="staff">Inbox Clear</strong>
          <p>No messages in this filter.</p>
        </div>
        <div class="dashboard-inbox-date">Now</div>
        <div class="dashboard-inbox-dot staff"></div>
      </div>
    `;
    return;
  }

  for (let message of messages.slice(0, 12)) {
    inboxList.appendChild(createDashboardInboxItem(message));
  }

  displayFullInboxIfPresent();
}

function getFilteredDashboardInboxMessages() {
  if (!gameState || !Array.isArray(gameState.inbox)) return [];

  const messages = gameState.inbox.slice();

  messages.sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return 0;
  });

  if (dashboardInboxFilter === "all") {
    return messages;
  }

  return messages.filter(message => {
    const category = getDashboardInboxCategory(message);
    return category === dashboardInboxFilter;
  });
}

function getDashboardInboxCategory(message) {
  const type = String(message.type || "").toLowerCase();
  const title = String(message.title || "").toLowerCase();
  const body = String(message.body || "").toLowerCase();

  if (
    type.includes("injury") ||
    title.includes("injury") ||
    body.includes("injury")
  ) {
    return "injuries";
  }

  if (
    type.includes("staff") ||
    title.includes("staff") ||
    title.includes("scouting") ||
    title.includes("scout") ||
    title.includes("report")
  ) {
    return "staff";
  }

  if (
    type.includes("match") ||
    type.includes("game") ||
    title.includes("roster") ||
    title.includes("rotation") ||
    title.includes("team") ||
    title.includes("rookie") ||
    title.includes("trade")
  ) {
    return "team";
  }

  return "league";
}

function createDashboardInboxItem(message) {
  const row = document.createElement("div");
  row.className = "dashboard-inbox-item";

  const visualType = getDashboardInboxVisualType(message);
  const icon = getDashboardInboxIcon(message, visualType);
  const label = getDashboardInboxLabel(message, visualType);

  row.innerHTML = `
    <div class="dashboard-inbox-icon ${visualType}">
      ${icon}
    </div>

    <div class="dashboard-inbox-copy">
      <strong class="${visualType}">${label}</strong>
      <p>${message.title}: ${message.body}</p>
    </div>

    <div class="dashboard-inbox-date">
      ${message.urgent ? "Urgent" : "Today"}
    </div>

    <div class="dashboard-inbox-dot ${visualType}"></div>
  `;

  row.onclick = function() {
    message.read = true;

    if (message.urgent && !message.resolved) {
      const confirmed = confirm(`${message.title}\n\n${message.body}\n\nMark this urgent item complete?`);

      if (confirmed) {
        message.resolved = true;
        message.urgent = false;
      }
    }

    refreshAll();
  };

  return row;
}

function getDashboardInboxVisualType(message) {
  const type = String(message.type || "").toLowerCase();
  const title = String(message.title || "").toLowerCase();
  const body = String(message.body || "").toLowerCase();

  if (message.urgent || type === "urgent") return "urgent";
  if (type.includes("injury") || title.includes("injury") || body.includes("injury")) return "injury";
  if (type.includes("match-win") || title.includes("win")) return "win";
  if (type.includes("match-loss") || title.includes("loss")) return "loss";
  if (title.includes("scout") || title.includes("report")) return "scouting";
  if (title.includes("draft") || title.includes("lottery") || title.includes("mock")) return "event";
  if (type.includes("event")) return "event";
  if (type.includes("staff")) return "staff";

  return "staff";
}

function getDashboardInboxIcon(message, visualType) {
  if (visualType === "urgent") return "!";
  if (visualType === "injury") return "+";
  if (visualType === "win") return "W";
  if (visualType === "loss") return "L";
  if (visualType === "scouting") return "S";
  if (visualType === "event") return "E";
  return "i";
}

function getDashboardInboxLabel(message, visualType) {
  if (visualType === "urgent") return "Urgent";
  if (visualType === "injury") return "Injury";
  if (visualType === "win") return "Result";
  if (visualType === "loss") return "Result";
  if (visualType === "scouting") return "Scouting";
  if (visualType === "event") return "League";
  return "Staff";
}

function displayFullInboxIfPresent() {
  const fullInbox = document.getElementById("full-inbox-list");

  if (!fullInbox || !gameState || !Array.isArray(gameState.inbox)) return;

  fullInbox.innerHTML = "";

  for (let message of gameState.inbox) {
    fullInbox.appendChild(createMessageElement(message));
  }
}

function displayUrgentActions() {
  return;
}

function createMessageElement(message) {
  const card = document.createElement("div");

  let className = "message-card";

  if (message.urgent) className += " message-urgent";
  if (message.type === "event") className += " message-event";
  if (message.type === "match-win") className += " message-match-win";
  if (message.type === "match-loss") className += " message-match-loss";
  if (message.type === "staff") className += " message-staff";
  if (message.type === "urgent") className += " message-urgent";

  card.className = className;

  let buttonHtml = "";

  if (message.urgent && !message.resolved) {
    buttonHtml = `<button class="resolve-button" onclick="resolveUrgentMessage(${message.id})">Mark Complete</button>`;
  }

  card.innerHTML = `
    <h3>${message.title}</h3>
    <p>${message.body.replace(/\n/g, "<br>")}</p>
    <div class="message-meta">${message.urgent ? "Urgent Action" : message.type}</div>
    ${buttonHtml}
  `;

  return card;
}

function displayRightPanel() {
  displayRightUpcomingGames();
  displayRightRecentResults();
}

function displayRightUpcomingGames() {
  const container = document.getElementById("right-upcoming-games");
  if (!container) return;

  container.innerHTML = "";

  const upcoming = gameState.userSchedule
    .filter(game => !game.played && !isCancelledFutureGame(game))
    .slice(0, 4);

  if (upcoming.length === 0) {
    container.innerHTML = `<div class="side-game-empty">No upcoming games.</div>`;
    return;
  }

  for (let game of upcoming) {
    const card = document.createElement("div");
    card.className = "side-game-card";

    card.innerHTML = `
      <h4>${formatDate(game.date)}</h4>
      <p>${game.competition}</p>
      <p>${game.home ? "Home vs" : "Away at"} ${game.opponentAbbrev}</p>
    `;

    container.appendChild(card);
  }
}

function displayRightRecentResults() {
  const container = document.getElementById("right-recent-results");
  if (!container) return;

  container.innerHTML = "";

  const recent = gameState.userSchedule
    .filter(game => game.played)
    .slice(-4)
    .reverse();

  if (recent.length === 0) {
    container.innerHTML = `<div class="side-game-empty">No recent results.</div>`;
    return;
  }

  for (let game of recent) {
    const won = game.result && game.result.startsWith("W");

    const card = document.createElement("div");
    card.className = won ? "side-game-card side-game-win" : "side-game-card side-game-loss";

    card.innerHTML = `
      <h4>${getClickableScoreHtml(game)}</h4>
      <p>${game.competition}</p>
      <p>${formatDate(game.date)} - ${game.home ? "vs" : "at"} ${game.opponentAbbrev}</p>
    `;

    container.appendChild(card);
  }
}

function getDashboardArenaTeamForGame(nextGame, selectedTeam, opponent) {
  if (!nextGame) return null;

  if (nextGame.homeTeamId) {
    const homeTeam =
      getTeamById(Number(nextGame.homeTeamId)) ||
      getBaseTeamById(Number(nextGame.homeTeamId));

    if (homeTeam) return homeTeam;
  }

  return nextGame.home ? selectedTeam : opponent;
}

function getDashboardArenaName(arenaTeam) {
  if (!arenaTeam) return "--";

  return (
    arenaTeam.arenaName ||
    arenaTeam.arena ||
    arenaTeam.homeArena ||
    `${arenaTeam.name} Arena`
  );
}

function getDashboardArenaCapacity(arenaTeam) {
  if (!arenaTeam) return "--";

  const capacity = Number(
    arenaTeam.arenaCapacity ||
    arenaTeam.capacity ||
    0
  );

  if (!capacity) return "--";

  return capacity.toLocaleString();
}

function getDashboardArenaCapacity(arenaTeam) {
  const capacity = Number(
    arenaTeam?.arenaCapacity ||
    arenaTeam?.capacity ||
    0
  );

  if (!capacity) return "--";

  return capacity.toLocaleString();
}

function displayDashboardNextGame(selectedTeam) {
  const nextGame = getNextGame();
  const countdownElement = document.getElementById("dashboard-game-countdown");
  const gameTypeElement = document.getElementById("dashboard-game-type");
  const todayGameCard = document.querySelector(".dashboard-today-game-card");
  const opponentLogo = document.getElementById("dashboard-opponent-logo");

  if (todayGameCard) {
    todayGameCard.classList.remove("dashboard-cup-game", "dashboard-playoff-game");
  }

  if (!nextGame) {
    setText("dashboard-next-game-time", "--");
    setText("dashboard-next-game-location", "No Game");
    setText("dashboard-next-game-arena", "--");
    setText("dashboard-next-game-arena-capacity", "--");
    setText("dashboard-next-opponent-name", "No Game");
    setText("dashboard-next-opponent-record", "--");

    setText("dashboard-comparison-user-record", `${selectedTeam.wins || 0}-${selectedTeam.losses || 0}`);
    setText("dashboard-comparison-user-ppg", getTeamPointsPerGame(selectedTeam.id));
    setText("dashboard-comparison-user-rank", getConferenceRankText(selectedTeam.id));

    setText("dashboard-comparison-opponent-record", "--");
    setText("dashboard-comparison-opponent-ppg", "--");
    setText("dashboard-comparison-opponent-rank", "--");

    if (opponentLogo) {
  opponentLogo.innerHTML = `<div class="team-logo-placeholder team-logo-large dashboard-matchup-logo team-logo-empty">--</div>`;
}
    return;
  }

  const opponent =
  gameState.teams.find(team => Number(team.id) === Number(nextGame.opponentId)) ||
  getTeamById(nextGame.opponentId) ||
  getBaseTeamById(nextGame.opponentId);

  const isCupGame =
    nextGame.cupGame ||
    String(nextGame.competition || "").toLowerCase().includes("cup");

  const isPlayoffGame =
    nextGame.playoffGame ||
    nextGame.playInGame ||
    String(nextGame.competition || "").toLowerCase().includes("playoff") ||
    String(nextGame.competition || "").toLowerCase().includes("play-in");

    const daysUntilGame = getDaysUntilDate(nextGame.date);
const gameTypeLabel = getDashboardGameTypeLabel(nextGame);

if (countdownElement) {
  if (daysUntilGame === 0) {
    countdownElement.textContent = "Today";
  } else if (daysUntilGame === 1) {
    countdownElement.textContent = "1 Day Until Game";
  } else if (daysUntilGame !== null) {
    countdownElement.textContent = `${daysUntilGame} Days Until Game`;
  } else {
    countdownElement.textContent = "Next Game";
  }
}

if (gameTypeElement) {
  gameTypeElement.textContent = gameTypeLabel;
}

  if (todayGameCard) {
    todayGameCard.classList.toggle("dashboard-cup-game", isCupGame);
    todayGameCard.classList.toggle("dashboard-playoff-game", isPlayoffGame);
  }

  setText("dashboard-next-game-time", nextGame.fcdGameTime || "7:30 PM");
setText("dashboard-next-game-location", nextGame.home ? "Home Game" : "Away Game");

const arenaTeam = getDashboardArenaTeamForGame(nextGame, selectedTeam, opponent);

setText("dashboard-next-game-arena", getDashboardArenaName(arenaTeam));
setText("dashboard-next-game-arena-capacity", getDashboardArenaCapacity(arenaTeam));

  setText("dashboard-next-opponent-name", opponent ? opponent.name : nextGame.opponentName || "Opponent");

  if (opponent) {
  setText("dashboard-next-opponent-record", `${opponent.wins || 0}-${opponent.losses || 0}`);

  if (opponentLogo) {
    opponentLogo.innerHTML = getTeamLogoHTML(
      opponent,
      "team-logo-placeholder team-logo-large dashboard-matchup-logo"
    );
  }
} else {
  setText("dashboard-next-opponent-record", "--");

  if (opponentLogo) {
    opponentLogo.innerHTML = `<div class="team-logo-placeholder team-logo-large dashboard-matchup-logo team-logo-empty">OPP</div>`;
  }
}

  setText("dashboard-comparison-user-record", `${selectedTeam.wins || 0}-${selectedTeam.losses || 0}`);
  setText("dashboard-comparison-user-ppg", getTeamPointsPerGame(selectedTeam.id));
  setText("dashboard-comparison-user-rank", getConferenceRankText(selectedTeam.id));

  if (opponent) {
    setText("dashboard-comparison-opponent-record", `${opponent.wins || 0}-${opponent.losses || 0}`);
    setText("dashboard-comparison-opponent-ppg", getTeamPointsPerGame(opponent.id));
    setText("dashboard-comparison-opponent-rank", getConferenceRankText(opponent.id));
  } else {
    setText("dashboard-comparison-opponent-record", "--");
    setText("dashboard-comparison-opponent-ppg", "--");
    setText("dashboard-comparison-opponent-rank", "--");
  }
}

function getDashboardGameTypeLabel(nextGame) {
  if (!nextGame) return "No Game";

  const competition = String(nextGame.competition || "").toLowerCase();

  if (nextGame.cupGame || competition.includes("cup")) {
    return "The Cup";
  }

  if (nextGame.playInGame || competition.includes("play-in")) {
    return "Play-In";
  }

  if (nextGame.playoffGame || competition.includes("playoff") || competition.includes("final")) {
    return "Postseason";
  }

  return "Regular Season";
}

function displayDashboardScheduleStrip() {
  const recentContainer = document.getElementById("dashboard-recent-results");
  const upcomingContainer = document.getElementById("dashboard-upcoming-games");

  if (!recentContainer || !upcomingContainer || !gameState || !gameState.userSchedule) return;

  recentContainer.innerHTML = "";
  upcomingContainer.innerHTML = "";

  const timelineContainer = document.createElement("div");
  timelineContainer.className = "dashboard-schedule-timeline";

  const recentGames = gameState.userSchedule
    .filter(game => game.played)
    .slice(-2);

  const upcomingGames = gameState.userSchedule
    .filter(game => !game.played && !isCancelledFutureGame(game))
    .filter(game => new Date(game.date) >= new Date(gameState.currentDate))
    .slice(0, 3);

  const games = [...recentGames, ...upcomingGames];

  if (games.length === 0) {
    timelineContainer.innerHTML = `
      <div class="dashboard-schedule-empty">
        No schedule items yet.
      </div>
    `;
  }

  for (let game of games) {
    const item = document.createElement("div");
    const opponent = getTeamById(game.opponentId) || getBaseTeamById(game.opponentId);
    const isPlayed = game.played || !!game.boxScore;
    const won = game.result && game.result.startsWith("W");

    item.className = isPlayed
      ? won
        ? "dashboard-schedule-item result-win"
        : "dashboard-schedule-item result-loss"
      : "dashboard-schedule-item upcoming-game";

    item.innerHTML = `
      <div class="dashboard-schedule-item-copy">
        <strong>${isPlayed ? getClickableScoreHtml(game) : formatShortDate(game.date)}</strong>
        <span>${game.home ? "vs" : "at"} ${game.opponentAbbrev || game.opponentName}</span>

        ${
          isPlayed
            ? `<button type="button" class="dashboard-box-score-button" onclick="openBoxScore('${game.id}')">Box Score</button>`
            : `<small>${game.competition || "Regular Season"}</small>`
        }
      </div>

      <div class="dashboard-schedule-item-logo">
        ${
          opponent && typeof getTeamLogoHTML === "function"
            ? getTeamLogoHTML(opponent, "team-logo-placeholder dashboard-schedule-logo")
            : `<span class="dashboard-schedule-logo-fallback">${game.opponentAbbrev || "OPP"}</span>`
        }
      </div>
    `;

    timelineContainer.appendChild(item);
  }

  recentContainer.appendChild(timelineContainer);

  const upcomingSection = upcomingContainer.closest(".dashboard-schedule-section");

  if (upcomingSection) {
    upcomingSection.style.display = "none";
  }
}

function createDashboardScheduleCard(game) {
  const card = document.createElement("div");
  card.className = "dashboard-schedule-game-card";

  if (game.played && game.result) {
    if (String(game.result).startsWith("W")) card.classList.add("win");
    if (String(game.result).startsWith("L")) card.classList.add("loss");
  }

  if (datesMatch && datesMatch(game.date, gameState.currentDate)) {
    card.classList.add("today");
  }

  const title = game.played && game.result
    ? game.result
    : formatShortDate
      ? formatShortDate(game.date)
      : formatDate(game.date);

  card.innerHTML = `
    <strong>${title}</strong>
    <span>${game.home ? "vs" : "at"} ${game.opponentAbbrev || game.opponentName}</span>
    <span>${formatShortDate ? formatShortDate(game.date) : formatDate(game.date)}</span>
    <small>${game.competition || "Regular Season"}</small>
  `;

  return card;
}

function getLeagueBottomThreeTeamIds() {
  if (!gameState || !Array.isArray(gameState.teams)) return [];

  return [...gameState.teams]
    .sort((a, b) => {
      const aWins = a.wins || 0;
      const bWins = b.wins || 0;
      const aLosses = a.losses || 0;
      const bLosses = b.losses || 0;

      if (aWins !== bWins) return aWins - bWins;
      return bLosses - aLosses;
    })
    .slice(0, 3)
    .map(team => Number(team.id));
}

function getLeagueStandingsZoneClass(team, conferenceRank) {
  if (!team) return "";

  const bottomThreeIds = getLeagueBottomThreeTeamIds();

  if (bottomThreeIds.includes(Number(team.id))) {
    return "relegation-zone";
  }

  if (conferenceRank >= 1 && conferenceRank <= 6) {
    return "playoff-zone";
  }

  if (conferenceRank >= 7 && conferenceRank <= 10) {
    return "playin-zone";
  }

  return "";
}

function getDashboardStandingRankClass(team, conferenceRank, bottomThreeIds) {
  if (!team) return "";

  if (bottomThreeIds.includes(Number(team.id))) {
    return "standings-rank-danger";
  }

  if (conferenceRank <= 6) {
    return "standings-rank-playoff";
  }

  if (conferenceRank >= 7 && conferenceRank <= 10) {
    return "standings-rank-playin";
  }

  return "";
}

function openTeamFromDashboardStandings(teamId) {
  const targetTeamId = Number(teamId);

  currentViewedTeamId = targetTeamId;

  if (typeof openTeamProfile === "function") {
    openTeamProfile(targetTeamId);
    return;
  }

  showMainSection("league");
}

function displayDashboardStandings() {
  const container = document.getElementById("dashboard-standings-list");
  const selectedTeam = getSelectedTeam();

  if (!container || !selectedTeam) return;

 setText("dashboard-standings-title", "Standings");

  const teams = gameState.teams
    .filter(team => team.conference === selectedTeam.conference)
    .sort((a, b) => {
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
      return (a.losses || 0) - (b.losses || 0);
    });

  container.innerHTML = `
    <div class="dashboard-standings-row header">
  <span>#</span>
  <span>Team</span>
  <span>GB</span>
</div>
  `;

  const firstPlaceWins = teams.length > 0 ? teams[0].wins || 0 : 0;
  const firstPlaceLosses = teams.length > 0 ? teams[0].losses || 0 : 0;
  const bottomThreeIds = getLeagueBottomThreeTeamIds();

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const row = document.createElement("div");
    row.className = "dashboard-standings-row";

    if (Number(team.id) === Number(gameState.selectedTeamId)) {
      row.classList.add("user");
    }

    const wins = team.wins || 0;
    const losses = team.losses || 0;
    const gamesPlayed = wins + losses;
    const pct = gamesPlayed > 0 ? (wins / gamesPlayed).toFixed(3).replace("0", "") : ".000";
    const gb = i === 0 ? "--" : (((firstPlaceWins - wins) + (losses - firstPlaceLosses)) / 2).toFixed(1);

row.innerHTML = `
  <span class="dashboard-standing-rank ${getDashboardStandingRankClass(team, i + 1, bottomThreeIds)}">
    ${i + 1}
  </span>

  <span class="dashboard-standings-team-cell">
    ${getTeamLogoHTML(team, "team-logo-placeholder team-logo-tiny dashboard-standings-mini-logo")}
    <button
      type="button"
      class="dashboard-standings-team-link"
      onclick="openTeamFromDashboardStandings(${team.id})"
    >
      ${getGameplanCardTeamNameParts(team).nickname}
    </button>
  </span>

  <span class="dashboard-standings-gb">${gb}</span>
`;

    container.appendChild(row);
  }
}

function displayDashboardRosterSnapshot(roster) {
  const container = document.getElementById("dashboard-roster-snapshot");
  if (!container) return;

  const sorted = roster
    .slice()
    .sort((a, b) => {
      const aValue = Number(a.potentialAbility || a.potential || a.currentAbility || 0);
      const bValue = Number(b.potentialAbility || b.potential || b.currentAbility || 0);
      return bValue - aValue;
    })
    .slice(0, 15);

  container.innerHTML = `
    <div class="dashboard-roster-row header">
      <span>#</span>
      <span>Player</span>
      <span>Pos</span>
      <span>Age</span>
      <span>Morale</span>
    </div>
  `;

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    const row = document.createElement("div");
    row.className = "dashboard-roster-row";

    const morale = player.morale || "Happy";
    const moraleClass = morale === "Happy" ? "" : morale === "Content" || morale === "Okay" ? "okay" : "bad";

    row.innerHTML = `
      <span>${i + 1}</span>
      <strong>${player.name}</strong>
      <span>${player.position || "--"}</span>
      <span>${player.age || "--"}</span>
      <span class="dashboard-morale">
        <span class="dashboard-morale-dot ${moraleClass}"></span>
        ${morale}
      </span>
    `;

    container.appendChild(row);
  }

  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="rookie-empty-state">
        No players found.
      </div>
    `;
  }
}

function getConferenceRank(teamId) {
  const team = getTeamById(teamId) || getBaseTeamById(teamId);
  if (!team) return null;

  const teams = gameState.teams
    .filter(item => item.conference === team.conference)
    .sort((a, b) => {
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
      return (a.losses || 0) - (b.losses || 0);
    });

  const index = teams.findIndex(item => Number(item.id) === Number(teamId));
  return index >= 0 ? index + 1 : null;
}

function getConferenceRankText(teamId) {
  const team = getTeamById(teamId) || getBaseTeamById(teamId);
  const rank = getConferenceRank(teamId);

  if (!team || !rank) return "--";

  return `${rank}${getOrdinalSuffix(rank)} ${team.conference}`;
}

function displayDashboardUpcomingGames() {
  const container = document.getElementById("dashboard-upcoming-games");
  if (!container || !gameState || !gameState.userSchedule) return;

  container.innerHTML = "";

  const currentDate = new Date(gameState.currentDate);

  const games = gameState.userSchedule
    .filter(game => new Date(game.date) >= currentDate || game.boxScore)
    .slice(0, 5);

  for (let game of games) {
    const item = document.createElement("div");
    item.className = "dashboard-schedule-item upcoming-game";

    const opponent = getTeamById(game.opponentId) || getBaseTeamById(game.opponentId);
    const gamePlayed = !!game.boxScore || game.played || game.completed;

    item.innerHTML = `
      <div class="dashboard-schedule-item-copy">
        <strong>${gamePlayed ? (game.result || getClickableScoreHtml(game)) : formatShortDate(game.date)}</strong>
        <span>${game.home ? "vs" : "at"} ${game.opponentAbbrev || game.opponentName}</span>

        ${
          gamePlayed
            ? `<button type="button" class="dashboard-box-score-button" onclick="openBoxScore('${game.id}')">Box Score</button>`
            : `<small>${game.competition || "Regular Season"}</small>`
        }
      </div>

      <div class="dashboard-schedule-item-logo">
        ${
          opponent && typeof getTeamLogoHTML === "function"
            ? getTeamLogoHTML(opponent, "team-logo-placeholder dashboard-schedule-logo")
            : `<span class="dashboard-schedule-logo-fallback">${game.opponentAbbrev || "OPP"}</span>`
        }
      </div>
    `;

    container.appendChild(item);
  }
}

function getDashboardScheduleTeamLogoHTML(team) {
  const logoPath =
    team?.logo ||
    team?.logoPath ||
    team?.image ||
    team?.imageUrl ||
    team?.teamLogo ||
    "";

  if (logoPath) {
    return `
      <img
        class="dashboard-schedule-logo-img"
        src="${logoPath}"
        alt="${team.name || team.abbrev || "Team"}"
      >
    `;
  }

  return `<span class="dashboard-schedule-logo-fallback">${team?.abbrev || "OPP"}</span>`;
}

function getTeamLevelLabel(team) {
  const strength = Number(team.teamStrength || team.overall || 500);

  if (strength >= 680) return "Contender";
  if (strength >= 625) return "Star";
  if (strength >= 570) return "Playoff Team";
  if (strength >= 520) return "Balanced";
  return "Rebuilding";
}

function getTeamPayroll(teamId) {
  const roster = gameState.rosters[teamId] || [];

  return Math.round(roster.reduce((sum, player) => {
    return sum + Number(player.salary || 0);
  }, 0));
}

function getTeamPointsPerGame(teamId) {
  const stats = gameState.teamStats && gameState.teamStats[teamId];

  if (stats && Number(stats.games || 0) > 0) {
    return (Number(stats.points || 0) / Number(stats.games || 1)).toFixed(1);
  }

  const team = getTeamById(teamId) || getBaseTeamById(teamId);
  const strength = Number(team ? team.teamStrength || team.overall || 550 : 550);

  return (95 + (strength - 500) / 8).toFixed(1);
}

function getDashboardChemistry() {
  const roster = gameState.rosters[gameState.selectedTeamId] || [];
  const happyCount = roster.filter(player => (player.morale || "Happy") === "Happy").length;

  return Math.max(65, Math.min(95, 76 + happyCount));
}

function getDashboardOwnerHappiness() {
  const team = getSelectedTeam();
  if (!team) return 70;

  const wins = team.wins || 0;
  const losses = team.losses || 0;
  const games = wins + losses;

  if (games === 0) return 73;

  const pct = wins / games;
  return Math.round(55 + pct * 45);
}

function getDashboardPlayoffOdds(team) {
  if (!team) return "--";

  const rank = getConferenceRank(team.id);

  if (!rank) return "--";
  if (rank <= 4) return "95%";
  if (rank <= 6) return "78%";
  if (rank <= 10) return "38%";
  return "8%";
}

function getDashboardFakeStreak(team) {
  const wins = team.wins || 0;
  const losses = team.losses || 0;

  if (wins >= losses) return "W1";
  return "L1";
}

function showStartPanel(panelId) {
  const panels = document.querySelectorAll(".start-flow-panel");

  panels.forEach(panel => {
    panel.classList.remove("active-start-panel");
  });

  const nextPanel = document.getElementById(panelId);

  if (nextPanel) {
    nextPanel.classList.add("active-start-panel");
  }

  if (panelId === "team-select-panel") {
    if (typeof populateTeamSelect === "function") {
      populateTeamSelect();
    }
  }

  if (panelId === "gm-creation-panel") {
    updateGMPreview();
  }
}

function getInputValue(id, fallback = "") {
  const element = document.getElementById(id);

  if (!element) {
    return fallback;
  }

  const value = String(element.value || "").trim();

  return value || fallback;
}

function collectCreatedGM() {
  const firstName = getInputValue("gm-first-name", "Test");
  const lastName = getInputValue("gm-last-name", "GM");
  const age = Number(getInputValue("gm-age", "35"));
  const nationality = getInputValue("gm-nationality", "United States");
  const hometown = getInputValue("gm-hometown", "Test City");
  const background = getInputValue("gm-background", "Former Scout");

  const skinTone = getInputValue("gm-skin-tone", "light");
  const hairStyle = getInputValue("gm-hair-style", "short");
  const hairColor = getInputValue("gm-hair-color", "brown");
  const facialHair = getInputValue("gm-facial-hair", "none");
  const glasses = getInputValue("gm-glasses", "no");
  const suitColor = getInputValue("gm-suit-color", "navy");

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    age: Number.isFinite(age) ? age : 35,
    nationality,
    hometown,
    background,
    appearance: {
      skinTone,
      hairStyle,
      hairColor,
      facialHair,
      glasses,
      suitColor
    }
  };
}

function updateGMPreview() {
  const gm = collectCreatedGM();

  const nameElement = document.getElementById("gm-preview-name");
  const descriptionElement = document.getElementById("gm-preview-description");
  const faceElement = document.getElementById("gm-preview-face");
  const hairElement = document.getElementById("gm-preview-hair");
  const glassesElement = document.getElementById("gm-preview-glasses");
  const beardElement = document.getElementById("gm-preview-beard");

  if (nameElement) {
    nameElement.textContent = gm.fullName;
  }

  if (descriptionElement) {
    descriptionElement.textContent = `${gm.background} from ${gm.hometown}`;
  }

  if (faceElement) {
    faceElement.className = "gm-preview-face";
    faceElement.classList.add(`gm-skin-${gm.appearance.skinTone}`);
  }

  if (hairElement) {
    hairElement.className = "gm-preview-hair";
    hairElement.classList.add(`gm-hair-${gm.appearance.hairColor}`);
    hairElement.classList.add(`gm-hair-${gm.appearance.hairStyle}`);
  }

  if (glassesElement) {
    glassesElement.className = "gm-preview-glasses";

    if (gm.appearance.glasses === "yes") {
      glassesElement.classList.add("gm-glasses-yes");
    }
  }

  if (beardElement) {
    beardElement.className = "gm-preview-beard";

    if (gm.appearance.facialHair !== "none") {
      beardElement.classList.add(`gm-beard-${gm.appearance.facialHair}`);
    }
  }
}

function continueToTeamSelect() {
  const gm = collectCreatedGM();

  if (!gm.firstName || !gm.lastName) {
    alert("Please enter a first and last name for your GM.");
    return;
  }

  if (gm.age < 18 || gm.age > 90) {
    alert("GM age must be between 18 and 90.");
    return;
  }

  pendingCreatedGM = gm;

  showStartPanel("team-select-panel");
}

function startGameWithCreatedGM() {
  const gm = pendingCreatedGM || collectCreatedGM();
  const teamSelect = document.getElementById("team-select");
  const selectedTeamId = teamSelect ? Number(teamSelect.value || 1) : 1;

  startGame();

  if (gameState) {
    gameState.generalManager = gm;

    if (selectedTeamId) {
      gameState.selectedTeamId = selectedTeamId;
    }

    applyStartRosterTeamNamesToGameState();
  }

  updateGMHeaderDisplay();

  if (typeof refreshAll === "function") {
    refreshAll();
  }

  if (typeof saveGame === "function") {
    saveGame();
  }
}

function escapeStartFlowHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStartFlowTeams() {
  if (gameState && Array.isArray(gameState.teams) && gameState.teams.length) {
    return gameState.teams.slice();
  }

  if (typeof baseTeams !== "undefined" && Array.isArray(baseTeams)) {
    return baseTeams.slice();
  }

  if (typeof fixedTeams !== "undefined" && Array.isArray(fixedTeams)) {
    return fixedTeams.slice();
  }

  if (typeof teamsDatabase !== "undefined" && Array.isArray(teamsDatabase)) {
    return teamsDatabase.slice();
  }

  return [];
}

function getStartTeamLogoPath(team) {
  return getStartTeamRealLogoPath(team);
}

function getStartTeamInitials(team) {
  return getStartTeamRealInitials(team);
}

function getStartTeamDisplayName(team) {
  return getStartTeamRealDisplayName(team);
}

function renderStartTeamLogo(team) {
  const logoPath = getStartTeamLogoPath(team);
  const initials = getStartTeamInitials(team);

  if (logoPath) {
    return `
      <img
        src="${escapeStartFlowHtml(logoPath)}"
        alt="${escapeStartFlowHtml(getStartTeamDisplayName(team))}"
        onerror="this.remove(); this.parentElement.textContent='${escapeStartFlowHtml(initials)}';"
      >
    `;
  }

  return escapeStartFlowHtml(initials);
}

function populateTeamSelect() {
  const teams = getStartFlowTeams()
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

  const select = document.getElementById("team-select");

  if (select) {
    select.innerHTML = teams.map(team => `
      <option value="${Number(team.id)}">
        ${escapeStartFlowHtml(getStartTeamDisplayName(team))}
      </option>
    `).join("");

    if (!select.value && teams[0]) {
      select.value = String(teams[0].id);
    }
  }

  populateStartTeamGrid(teams);
}

function populateStartTeamGrid(teamsArg = null) {
  const grid = document.getElementById("start-team-grid");

  if (!grid) return;

  const teams = (Array.isArray(teamsArg) ? teamsArg : getStartFlowTeams())
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

  if (!teams.length) {
    grid.innerHTML = `
      <div class="start-team-grid-empty">
        No teams found. Make sure team data is loaded before starting a new save.
      </div>
    `;
    return;
  }

  grid.innerHTML = teams.map(team => {
    const primary = getStartTeamPrimaryColor(team);
    const secondary = getStartTeamSecondaryColor(team);
    const displayName = getStartTeamDisplayName(team);
    const conference = team.conference || "";

    return `
      <button
        type="button"
        class="start-team-tile"
        style="--start-team-primary: ${primary}; --start-team-secondary: ${secondary};"
        onclick="startGameWithCreatedGMForTeam('${Number(team.id)}')"
        title="${escapeStartFlowHtml(displayName)}"
      >
        <div class="start-team-logo-badge">
          ${renderStartTeamLogo(team)}
        </div>

        <strong>${escapeStartFlowHtml(displayName)}</strong>

        <span>${escapeStartFlowHtml(conference ? `${conference} Conference` : "Franchise")}</span>
      </button>
    `;
  }).join("");
}

function getStartTeamPrimaryColor(team) {
  if (!team) return "#17408B";

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.primaryColor ||
      colors.primary ||
      colors.mainColor ||
      team.primaryColor ||
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

function getStartTeamSecondaryColor(team) {
  if (!team) return "#67e8f9";

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.secondaryColor ||
      colors.secondary ||
      colors.accentColor ||
      team.secondaryColor ||
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

function startGameWithCreatedGMForTeam(teamId) {
  const select = document.getElementById("team-select");

  if (select) {
    if (!select.options.length && typeof populateTeamSelect === "function") {
      populateTeamSelect();
    }

    select.value = String(teamId);
  }

  startGameWithCreatedGM();

  if (gameState) {
    gameState.selectedTeamId = Number(teamId);
  }

  refreshAll();
}

function updateStartTeamPreview() {
  // Old dropdown preview function kept as a harmless compatibility stub.
}

function startQuickTestSave() {
  pendingCreatedGM = {
    firstName: "Test",
    lastName: "GM",
    fullName: "Test GM",
    age: 35,
    nationality: "United States",
    hometown: "Philadelphia, Pennsylvania",
    background: "Former Scout",
    appearance: {
      skinTone: "light",
      hairStyle: "short",
      hairColor: "brown",
      facialHair: "none",
      glasses: "no",
      suitColor: "navy"
    }
  };

  const teamSelect = document.getElementById("team-select");

  if (teamSelect) {
    if (typeof populateTeamSelect === "function" && teamSelect.options.length === 0) {
      populateTeamSelect();
    }

    teamSelect.value = "3";
  }

  startGame();

  if (gameState) {
    gameState.generalManager = pendingCreatedGM;
  }

  updateGMHeaderDisplay();

  if (typeof saveGame === "function") {
    saveGame();
  }
}

function updateGMHeaderDisplay() {
  if (!gameState || !gameState.generalManager) return;

  const gm = gameState.generalManager;
  const selectedTeam = typeof getSelectedTeam === "function" ? getSelectedTeam() : null;

  const roleElement = document.getElementById("header-role");

  if (roleElement) {
    roleElement.textContent = `${gm.fullName} · General Manager${selectedTeam ? ` of ${selectedTeam.name}` : ""}`;
  }
}

function initializeGMCreationFlow() {
  const gmInputIds = [
    "gm-first-name",
    "gm-last-name",
    "gm-age",
    "gm-nationality",
    "gm-hometown",
    "gm-background",
    "gm-skin-tone",
    "gm-hair-style",
    "gm-hair-color",
    "gm-facial-hair",
    "gm-glasses",
    "gm-suit-color"
  ];

  gmInputIds.forEach(id => {
    const element = document.getElementById(id);

    if (element) {
      element.addEventListener("input", updateGMPreview);
      element.addEventListener("change", updateGMPreview);
    }
  });

  updateGMPreview();

  if (typeof populateTeamSelect === "function") {
    populateTeamSelect();
  }
}

function shouldShowDashboardOffseasonHub() {
  return false;
}

function displayDashboardOffseasonHub() {
  const hub = document.getElementById("dashboard-offseason-hub");

  if (hub) {
    hub.classList.add("hidden");
    hub.innerHTML = "";
  }

  const normal = document.getElementById("dashboard-game-center-normal");

  if (normal) {
    normal.classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", initializeGMCreationFlow);

function markAllGmHubMessagesRead() {
  if (!gameState) return;

  // Make sure the GM Hub messages array exists
  if (!Array.isArray(gameState.gmHubMessages)) {
    gameState.gmHubMessages = [];
  }

  gameState.gmHubMessages.forEach(message => {
    message.read = true;
    message.isRead = true;
    message.unread = false;
  });

  // Re-render the GM Hub / messages area if those functions exist
  if (typeof renderGmHubMessages === "function") {
    renderGmHubMessages();
  }

  if (typeof renderGmHub === "function") {
    renderGmHub();
  }

  if (typeof updateGmHubUnreadCount === "function") {
    updateGmHubUnreadCount();
  }

  if (typeof saveGame === "function") {
    saveGame();
  }
}

document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    const modal = document.getElementById("gm-hub-phone-modal");
    if (modal && modal.classList.contains("open")) {
      closeGMHubPhoneModal();
    }
  }
});

// Make sure inline HTML onclick can see it
window.markAllGmHubMessagesRead = markAllGmHubMessagesRead;
