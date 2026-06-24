const navigationSections = {
  dashboard: {
    defaultScreen: "dashboard-screen",
    tabs: [
      { label: "Home", screenId: "dashboard-screen" },
      { label: "Inbox", screenId: "full-inbox-screen" }
    ]
  },

    news: {
    defaultScreen: "news-screen",
    tabs: [
      { label: "Top Stories", screenId: "news-screen" },
      { label: "League Headlines", screenId: "news-league-headlines-screen" },
      { label: "Trade Rumors", screenId: "news-trade-rumors-screen" },
      { label: "Draft Buzz", screenId: "news-draft-buzz-screen" },
      { label: "Injuries", screenId: "news-injuries-screen" },
      { label: "Award Watch", screenId: "news-award-watch-screen" }
    ]
  },

  team: {
  defaultScreen: "roster-screen",
  tabs: [
    { label: "Roster", screenId: "roster-screen" },
    { label: "Contract Status", screenId: "contracts-screen" },
    { label: "Finances", screenId: "finances-screen" }
  ]
},

  "front-office": {
  defaultScreen: "front-office-overview-screen",
  tabs: [
    { label: "Front Office", screenId: "front-office-overview-screen" },
    { label: "Staff Overview", screenId: "staff-overview-screen" },
    { label: "Coaching Staff", screenId: "coaching-staff-screen" },
    { label: "Scouting Squad", screenId: "scouting-squad-screen" },
    { label: "Medical Staff", screenId: "medical-staff-screen" },
    { label: "League Staff", screenId: "league-staff-screen" },
    { label: "Organization", screenId: "organization-screen" },
    { label: "Staff Market", screenId: "staff-market-screen" }
  ]
},

 gameplan: {
  defaultScreen: "gameplan-screen",
  tabs: [
    { label: "Rotation", screenId: "gameplan-screen" },
    { label: "Team Identity", screenId: "gameplan-identity-screen" },
    { label: "Player Roles", screenId: "player-roles-screen" },
    { label: "Opponent Plans", screenId: "opponent-plans-screen" },
    { label: "Next Game Plan", screenId: "next-game-screen" },
    { label: "Practice", screenId: "practices-screen" },
    { label: "Injury Report", screenId: "injury-report-screen" }
  ]
},

  stats: {
  defaultScreen: "player-stats-screen",
  tabs: [
    { label: "Player Stats", screenId: "player-stats-screen" },
    { label: "Team Stats", screenId: "team-stats-screen" },
    { label: "League Leaders", screenId: "league-leaders-screen" },
    { label: "Season Highs", screenId: "season-highs-screen" }
  ]
},

  schedule: {
  defaultScreen: "calendar-screen",
  tabs: [
    { label: "Calendar", screenId: "calendar-screen" },
    { label: "Team Schedule", screenId: "schedule-screen" },
    { label: "League Schedule", screenId: "league-schedule-screen" }
  ]
},

  competitions: {
  defaultScreen: "playoffs-screen",
  tabs: [
    { label: "Playoffs", screenId: "playoffs-screen" },
    { label: "The Cup", screenId: "cup-screen" },
    { label: "Standings", screenId: "standings-screen" }
  ]
},

  draft: {
    defaultScreen: "scouting-screen",
    tabs: [
      { label: "Scouting", screenId: "scouting-screen" },
      { label: "Draft Board", screenId: "draft-board-screen" },
      { label: "Mock Drafts", screenId: "mock-drafts-screen" },
      { label: "Lottery Odds", screenId: "lottery-rules-screen" },
      { label: "Rookie Signing", screenId: "rookie-signing-screen" },
      { label: "Previous Draft", screenId: "previous-draft-screen" }
    ]
  },

  trade: {
  defaultScreen: "transfers-screen",
  tabs: [
    { label: "Trade Builder", screenId: "transfers-screen" },
    { label: "Formal Offers", screenId: "formal-offers-screen" },
    { label: "The Board", screenId: "trade-board-screen" },
    { label: "Trade Block", screenId: "trade-block-screen" },
    { label: "Trade Deadline", screenId: "trade-deadline-screen" },
    { label: "Team Intel", screenId: "team-intel-screen" },
    { label: "GM Intel", screenId: "gm-intel-screen" }
  ]
},

  "free-agency": {
    defaultScreen: "free-agency-screen",
    tabs: [
      { label: "Market", screenId: "free-agency-screen" }
    ]
  },

  league: {
  defaultScreen: "standings-screen",
  tabs: [
    { label: "Standings", screenId: "standings-screen" },
    { label: "Power Rankings", screenId: "power-rankings-screen" },
    { label: "Rosters", screenId: "league-rosters-screen" },
    { label: "Transactions", screenId: "league-transactions-screen" },
    { label: "Staff Movement", screenId: "staff-movement-screen" },
  ]
},

  history: {
    defaultScreen: "history-screen",
    tabs: [
      { label: "Seasons", screenId: "history-screen" },
      { label: "Champions", screenId: "history-screen" },
      { label: "Cup Winners", screenId: "history-screen" },
      { label: "Records", screenId: "records-screen" },
      { label: "Retired Players", screenId: "retired-players-screen" }
    ]
  },

  settings: {
    defaultScreen: "settings-screen",
    tabs: [
      { label: "Career", screenId: "settings-screen" },
      { label: "Preferences", screenId: "preferences-screen" },
      { label: "Help", screenId: "help-screen" }
    ]
  }
};

function showMainSection(sectionKey) {
  const section = navigationSections[sectionKey];

  if (!section) {
    console.warn("Unknown main section:", sectionKey);
    return;
  }

  currentMainSection = sectionKey;

  document.body.classList.toggle("dashboard-main-active", sectionKey === "dashboard");
  document.body.classList.toggle("free-agency-main-active", sectionKey === "free-agency");
  document.body.classList.toggle("news-main-active", sectionKey === "news");

  const sidebarButtons = document.querySelectorAll(".sidebar button");

  for (let button of sidebarButtons) {
    button.classList.toggle("active", button.dataset.section === sectionKey);
  }

  renderSecondaryNav(sectionKey);

  if (section.defaultScreen) {
    showSecondaryScreen(section.defaultScreen);
  }

  if (sectionKey === "gameplan") {
    setTimeout(() => {
      if (typeof displayRotationBoard === "function") {
        displayRotationBoard();
      }
    }, 0);
  }

  if (sectionKey === "news") {
    setTimeout(() => {
      if (typeof displayNewsPage === "function") {
        displayNewsPage();
      }
    }, 0);
  }
}

function renderSecondaryNav(sectionKey) {
  const nav = document.getElementById("secondary-nav");
  const section = navigationSections[sectionKey];

  if (!nav || !section) return;

  nav.innerHTML = "";

  for (let tab of section.tabs) {
    const button = document.createElement("button");
    button.textContent = tab.label;
    button.dataset.screen = tab.screenId;

    button.onclick = function() {
      if (tab.statsTab) {
        showStatsSubTab(tab.statsTab);
      }

      showSecondaryScreen(tab.screenId);
    };

    nav.appendChild(button);
  }
}

function showSecondaryScreen(screenId) {
  currentSecondaryScreen = screenId;

  const screens = document.querySelectorAll(".screen");

  for (let screen of screens) {
    screen.classList.remove("active-screen");
  }

  const selectedScreen = document.getElementById(screenId);

  if (selectedScreen) {
    selectedScreen.classList.add("active-screen");
  }

  if (screenId === "transfers-screen" && typeof initializeTradeCenter === "function") {
  initializeTradeCenter();
}

  const secondaryButtons = document.querySelectorAll("#secondary-nav button");

  for (let button of secondaryButtons) {
    if (button.dataset.screen === screenId) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  }

  if (screenId === "calendar-screen") {
    calendarViewDate = new Date(gameState.currentDate);
    displayCalendar();
  }

if (screenId === "schedule-screen") {
  if (typeof displayTeamScheduleRedesignV3 === "function") {
    displayTeamScheduleRedesignV3();
  } else if (typeof displayTeamScheduleRedesign === "function") {
    displayTeamScheduleRedesign();
  } else {
    displaySchedule();
  }
}

if (screenId === "league-schedule-screen") {
  if (typeof displayLeagueScheduleScreen === "function") {
    displayLeagueScheduleScreen();
  }
}

if (screenId === "awards-race-screen") {
  if (typeof displayAwardsRacePage === "function") {
    displayAwardsRacePage();
  }
}

if (screenId === "awards-ceremony-screen") {
  if (typeof displayAwardsCeremonyScreen === "function") {
    displayAwardsCeremonyScreen();
  }
}

if (screenId === "standings-screen") {
  displayStandings();
}

if (screenId === "free-agency-screen") {
  displayFreeAgency();
}

if (screenId === "scouting-screen") {
  displayDraftScoutingPage();
}

if (screenId === "draft-board-screen") {
  displayDraftBoardPage();
}

if (screenId === "mock-drafts-screen") {
  displayMockDraftPage();
}

if (
  screenId === "news-screen" ||
  screenId === "news-league-headlines-screen" ||
  screenId === "news-trade-rumors-screen" ||
  screenId === "news-draft-buzz-screen" ||
  screenId === "news-injuries-screen" ||
  screenId === "news-award-watch-screen"
) {
  if (typeof displayNewsPage === "function") {
    displayNewsPage();
  }
}

if (screenId === "lottery-odds-screen") {
  displayLotteryOddsPage();
}

if (screenId === "lottery-rules-screen") {
  displayDraftLotteryRulesPage();
}

if (screenId === "previous-draft-screen") {
  displayPreviousDraftPage();
}

if (screenId === "rookie-signing-screen") {
  displayRookieSigningPage();
}

if (screenId === "trade-deadline-screen") {
  displayTradeDeadline();
}

if (screenId === "trade-block-screen") {
  displayTradeBlock();
}

if (screenId === "trade-board-screen" && typeof renderTradeBoardScreen === "function") {
  renderTradeBoardScreen();
}

if (screenId === "formal-offers-screen" && typeof renderFormalOffersScreen === "function") {
  renderFormalOffersScreen();
}

if (screenId === "trade-call-screen") {
  if (
    typeof renderTradeGmCallScreen === "function" &&
    typeof tradeRoom !== "undefined" &&
    tradeRoom.activeBoardDealId
  ) {
    renderTradeGmCallScreen(tradeRoom.activeBoardDealId);
  } else {
    displayTradeCallScreen();
  }
}

if (screenId === "injury-report-screen") {
  displayInjuryReport();
}

      if (screenId === "playoffs-screen") {
      displayPlayoffs();
    }

    if (screenId === "cup-screen") {
      displayCup();
    }

    if (screenId === "team-intel-screen") {
  displayTeamIntel();
}

if (screenId === "gm-intel-screen") {
  displayGMIntelScreen();
}

  if (screenId === "player-stats-screen") {
  displayPlayerStats();
}

if (screenId === "team-stats-screen") {
  displayTeamStats();
}

if (screenId === "league-leaders-screen") {
  displayLeagueLeaders();
}

if (screenId === "season-highs-screen") {
  displaySeasonHighs();
}

  if (screenId === "full-inbox-screen") {
    displayFullInbox();
  }

  if (screenId === "league-transactions-screen") {
  initializeLeagueTransactionsScreen();
  }

  if (screenId === "staff-market-screen") {
  if (typeof displayStaffMarketPage === "function") {
    displayStaffMarketPage();
  }
}

if (screenId === "staff-movement-screen") {
  if (typeof displayStaffMovementPage === "function") {
    displayStaffMovementPage();
  }
}

  if (screenId === "league-rosters-screen") {
  displayLeagueRostersBoard();
  }

  if (screenId === "finances-screen") {
  displayFinances();
  }

  if (screenId === "contracts-screen") {
  displayContractStatusRedesign();
  }

  if (screenId === "power-rankings-screen") {
  displayPowerRankings();
  }

  if (screenId === "gameplan-screen") {
  displayRotationBoard();
  }

  if (screenId === "gameplan-identity-screen") {
  displayGameplan();
  }

  if (screenId === "player-roles-screen") {
  displayPlayerRolesBoard();
  }

  if (screenId === "opponent-plans-screen") {
  displayOpponentPlansBoard();
  }

  if (screenId === "practices-screen") {
  displayPracticesScreen();
  } 

  if (screenId === "history-screen") {
  displayHistory();
  }

  if (screenId === "dashboard-screen") {
  displayDashboard();
}

if (screenId === "next-game-screen") {
  displayNextGameScout();
}

  requestAnimationFrame(() => {
  resetScreenScroll();

  requestAnimationFrame(() => {
    resetScreenScroll();
  });
});

const mainContent = document.querySelector(".main-content");

if (mainContent) {
  mainContent.scrollTop = 0;
}

window.scrollTo(0, 0);
document.documentElement.scrollTop = 0;
document.body.scrollTop = 0;
}

function resetScreenScroll() {
  window.scrollTo(0, 0);

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const possibleScrollContainers = [
    document.getElementById("game-screen"),
    document.getElementById("main-content"),
    document.querySelector(".main-content"),
    document.querySelector(".content-area"),
    document.querySelector(".screen-container"),
    document.querySelector(".screens"),
    document.querySelector(".app-content")
  ];

  for (let container of possibleScrollContainers) {
    if (container) {
      container.scrollTop = 0;
    }
  }

  const activeScreen = document.querySelector(".screen.active-screen");

  if (activeScreen) {
    activeScreen.scrollTop = 0;
  }
}

function showTab(screenId) {
  const matchingSectionKey = findSectionForScreen(screenId);

  if (matchingSectionKey) {
    currentMainSection = matchingSectionKey;

    const sidebarButtons = document.querySelectorAll(".sidebar button");

    for (let button of sidebarButtons) {
      if (button.dataset.section === matchingSectionKey) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    }

    renderSecondaryNav(matchingSectionKey);
  }

  showSecondaryScreen(screenId);
}

function findSectionForScreen(screenId) {
  for (let sectionKey in navigationSections) {
    const section = navigationSections[sectionKey];

    if (section.tabs.some(tab => tab.screenId === screenId)) {
      return sectionKey;
    }
  }

  return null;
}

function initializeNavigation() {
  document.body.classList.toggle("dashboard-main-active", currentMainSection === "dashboard");
  document.body.classList.toggle("free-agency-main-active", currentMainSection === "free-agency");

  renderSecondaryNav(currentMainSection);
  showSecondaryScreen(currentSecondaryScreen || navigationSections[currentMainSection].defaultScreen);
}



function displayFullInbox() {
  const container = document.getElementById("full-inbox-list");

  if (!container || !gameState || !gameState.inbox) return;

  container.innerHTML = "";

  if (gameState.inbox.length === 0) {
    container.innerHTML = `<p>No messages yet.</p>`;
    return;
  }

  for (let message of gameState.inbox) {
    container.appendChild(createMessageElement(message));
  }
}

function showStatsSubTab(tabName) {
  statsSubTab = tabName;

  const sections = {
    player: document.getElementById("stats-player-section"),
    team: document.getElementById("stats-team-section"),
    leaders: document.getElementById("stats-leaders-section")
  };

  const buttons = {
    player: document.getElementById("stats-tab-player"),
    team: document.getElementById("stats-tab-team"),
    leaders: document.getElementById("stats-tab-leaders")
  };

  for (let key in sections) {
    if (sections[key]) {
      if (key === tabName) {
        sections[key].classList.remove("hidden");
      } else {
        sections[key].classList.add("hidden");
      }
    }

    if (buttons[key]) {
      if (key === tabName) {
        buttons[key].classList.add("active");
      } else {
        buttons[key].classList.remove("active");
      }
    }
  }
}

function displayCalendar() {
  setText("calendar-current-date", formatDate(gameState.currentDate));
  setText("calendar-season-phase", getSeasonPhase());

  const monthLabel = document.getElementById("calendar-month-label");
  const gridDays = document.getElementById("calendar-grid-days");

  if (!monthLabel || !gridDays) return;

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();

  monthLabel.textContent = calendarViewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  gridDays.innerHTML = "";

  const firstDayOfMonth = new Date(year, month, 1);
  let startOffset = firstDayOfMonth.getDay() - 1;

  if (startOffset < 0) startOffset = 6;

  const totalCells = 42;

  for (let i = 0; i < totalCells; i++) {
    const dayDate = new Date(year, month, 1);
    dayDate.setDate(1 - startOffset + i);

    const isCurrentMonth = dayDate.getMonth() === month;
    const isToday = dayDate.toDateString() === gameState.currentDate.toDateString();

    const dayBox = document.createElement("div");
    dayBox.className = "calendar-day";

    if (!isCurrentMonth) dayBox.classList.add("calendar-day-muted");
    if (isToday) dayBox.classList.add("calendar-day-today");

    const dayNumber = document.createElement("div");
    dayNumber.className = "calendar-day-number";
    dayNumber.textContent = dayDate.getDate();

    dayBox.appendChild(dayNumber);

    const dayEvents = getCalendarItemsForDate(dayDate);

   for (let item of dayEvents) {
  const eventDiv = document.createElement("div");
  eventDiv.className = `calendar-event ${item.type}`;
  eventDiv.textContent = item.text;

  if (item.played && item.gameId) {
    eventDiv.classList.add("clickable-score");
    eventDiv.onclick = () => openBoxScore(item.gameId);
  }

  dayBox.appendChild(eventDiv);
}

    gridDays.appendChild(dayBox);
  }
}

function getCalendarItemsForDate(date) {
  let items = [];

  for (let game of gameState.userSchedule) {
    if (datesMatch(game.date, date) && !isCancelledFutureGame(game)) {
      items.push({
        type: game.played
          ? "calendar-game-played"
          : game.cupGame
            ? "calendar-cup-game"
            : game.playoffGame || game.playInGame
              ? "calendar-playoff-game"
              : "calendar-game-upcoming",
       text: `${game.competition}: ${game.home ? "vs" : "at"} ${game.opponentAbbrev}${game.played ? " - " + game.result : ""}`,
gameId: game.id,
played: game.played
      });
    }
  }

  const year = gameState.seasonStartYear;

  const events = [
    { date: new Date(year, 5, 20), name: "Draft Night" },
    { date: new Date(year, 8, 25), name: "Training Camp" },
    { date: new Date(year, 9, 20), name: "Opening Night" },
    { date: new Date(year, 11, 9), name: "The Cup QF" },
    { date: new Date(year, 11, 13), name: "The Cup SF" },
    { date: new Date(year, 11, 16), name: "The Cup Final" },
    { date: new Date(year + 1, 3, 16), name: "Play-In Begins" },
    { date: new Date(year + 1, 3, 21), name: "Playoffs Begin" },
    { date: new Date(year + 1, 5, 3), name: "The Finals Begin" }
  ];

  for (let event of events) {
    if (datesMatch(event.date, date)) {
      items.push({
        type: "calendar-league-event",
        text: event.name
      });
    }
  }

  return items;
}

function previousCalendarMonth() {
  calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
  displayCalendar();
}

function nextCalendarMonth() {
  calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
  displayCalendar();
}

function goToCurrentMonth() {
  calendarViewDate = new Date(gameState.currentDate);
  displayCalendar();
}

function displayScheduleSummary() {
  const regularGames = gameState.userSchedule.filter(game =>
    game.competition === "Regular Season" || game.competition === "The Cup Group"
  );

  const totalGames = regularGames.length;
  const homeGames = regularGames.filter(game => game.home).length;
  const awayGames = regularGames.filter(game => !game.home).length;
  const gamesPlayed = regularGames.filter(game => game.played).length;
  const nextGame = getNextGame();

  setText("schedule-total-games", totalGames);
  setText("schedule-home-games", homeGames);
  setText("schedule-away-games", awayGames);
  setText("schedule-games-played", `${gamesPlayed} / ${totalGames}`);

  if (nextGame) {
    setText("schedule-next-game", `${formatDate(nextGame.date)} - ${nextGame.home ? "Home vs" : "Away at"} ${nextGame.opponentName}`);
  } else {
    setText("schedule-next-game", "No remaining games");
  }
}

function displaySchedule() {
  displayScheduleSummary();

  const scheduleTable = document.getElementById("schedule-table");
  if (!scheduleTable) return;

  scheduleTable.innerHTML = "";

  for (let game of gameState.userSchedule) {
    if (isCancelledFutureGame(game)) continue;

    const row = `
      <tr>
        <td>${formatDate(game.date)}</td>
        <td>${game.competition}</td>
        <td>${game.opponentName}</td>
        <td>${game.home ? "Home" : "Away"}</td>
        <td>${getClickableScoreHtml(game)}</td>
      </tr>
    `;

    scheduleTable.innerHTML += row;
  }
}

function getClickableScoreHtml(game) {
  if (!game.played || !game.boxScore) {
    return game.played ? game.result : "Upcoming";
  }

  return `<span class="clickable-score" onclick="openBoxScore('${game.id}')">${game.result}</span>`;
}

function showHistoryTab(tabName) {
  const tabs = document.querySelectorAll(".history-tabs button");
  const panels = document.querySelectorAll(".history-panel");

  for (let button of tabs) {
    button.classList.remove("active");
  }

  for (let panel of panels) {
    panel.classList.remove("active-history-panel");
  }

  const tabIndex = {
    seasons: 0,
    champions: 1,
    cup: 2,
    records: 3,
    retired: 4
  };

  if (tabs[tabIndex[tabName]]) {
    tabs[tabIndex[tabName]].classList.add("active");
  }

  const panel = document.getElementById(`history-tab-${tabName}`);

  if (panel) {
    panel.classList.add("active-history-panel");
  }
}

function renderHistoryList(containerId, items, emptyText) {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = `<div class="history-empty">${emptyText}</div>`;
    return;
  }

  for (let item of items) {
    const row = document.createElement("div");
    row.className = "history-list-row";
    row.textContent = item;
    container.appendChild(row);
  }
}

function displayHistory() {
  if (!gameState || !gameState.history) return;

  const selectedTeam = getSelectedTeam();

  if (selectedTeam) {
    setText("history-current-team", selectedTeam.name);
    setText("history-current-record", `${selectedTeam.wins || 0}-${selectedTeam.losses || 0}`);
    setText("history-current-season", gameState.seasonLabel);
  }

  renderHistoryList(
    "history-seasons-list",
    gameState.history.seasons || [],
    "No completed seasons yet."
  );

  renderHistoryList(
    "history-champions-list",
    gameState.history.champions || [],
    "No champions recorded yet."
  );

  renderHistoryList(
    "history-cup-winners-list",
    gameState.history.cupWinners || [],
    "No Cup winners recorded yet."
  );
}

function displayHistoryList(elementId, items, emptyText) {
  const container = document.getElementById(elementId);
  if (!container) return;

  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `<div class="history-item">${emptyText}</div>`;
    return;
  }

  for (let item of items) {
    const div = document.createElement("div");
    div.className = "history-item";
    div.textContent = item;
    container.appendChild(div);
  }
}

/* ======================================================
   HISTORY TOP-TABS ONLY FIX
   Top secondary nav controls the History panels.
====================================================== */

var currentHistoryTopTab = "seasons";

function getHistoryTabFromTopLabel(label) {
  const normalized = String(label || "").toLowerCase().trim();

  if (normalized === "seasons") return "seasons";
  if (normalized === "champions") return "champions";
  if (normalized === "cup winners") return "cup";

  return null;
}

function updateHistoryTopTabActiveState() {
  if (currentMainSection !== "history") return;

  const buttons = document.querySelectorAll("#secondary-nav button");

  for (let button of buttons) {
    const historyTab = button.dataset.historyTab || "";

    if (historyTab) {
      button.classList.toggle("active", historyTab === currentHistoryTopTab);
    }
  }
}

function renderSecondaryNav(sectionKey) {
  const nav = document.getElementById("secondary-nav");
  const section = navigationSections[sectionKey];

  if (!nav || !section) return;

  nav.innerHTML = "";

  for (let tab of section.tabs) {
    const button = document.createElement("button");
    const historyTab = sectionKey === "history"
      ? getHistoryTabFromTopLabel(tab.label)
      : null;

    button.textContent = tab.label;
    button.dataset.screen = tab.screenId;

    if (historyTab) {
      button.dataset.historyTab = historyTab;
    }

    button.onclick = function() {
      if (tab.statsTab) {
        showStatsSubTab(tab.statsTab);
      }

      if (historyTab) {
        currentHistoryTopTab = historyTab;
      }

      showSecondaryScreen(tab.screenId);

      if (historyTab && typeof showHistoryTab === "function") {
        showHistoryTab(historyTab);
        updateHistoryTopTabActiveState();
      }
    };

    nav.appendChild(button);
  }

  if (sectionKey === "history") {
    updateHistoryTopTabActiveState();
  }
}

function displayHistory() {
  if (!gameState || !gameState.history) return;

  const selectedTeam = getSelectedTeam();

  if (selectedTeam) {
    setText("history-current-team", selectedTeam.name);
    setText("history-current-record", `${selectedTeam.wins || 0}-${selectedTeam.losses || 0}`);
    setText("history-current-season", gameState.seasonLabel);
  }

  renderHistoryList(
    "history-seasons-list",
    gameState.history.seasons || [],
    "No completed seasons yet."
  );

  renderHistoryList(
    "history-champions-list",
    gameState.history.champions || [],
    "No champions recorded yet."
  );

  renderHistoryList(
    "history-cup-winners-list",
    gameState.history.cupWinners || [],
    "No Cup winners recorded yet."
  );

  if (typeof showHistoryTab === "function") {
    showHistoryTab(currentHistoryTopTab || "seasons");
  }

  updateHistoryTopTabActiveState();
}
