const FCD_KEY_DATES = [
  ["Season Ticket Renewal & Financial Planning", "August 15"],
  ["Schedule Release", "August 18"],
  ["Hall of Fame Ceremony", "August 22"],
  ["Media Day", "September 22"],
  ["Training Camp Begins", "September 25"],
  ["Preseason Begins", "October 5"],
  ["Preseason Ends", "October 18"],
  ["Opening Night", "October 22"],
  ["Election Day No Games", "First Tuesday of November"],
  ["The Cup Games Begin", "November 11"],
  ["The Cup Game 2", "November 18"],
  ["The Cup Game 3", "November 25"],
  ["The Cup Game 4", "December 2"],
  ["The Cup Quarterfinals", "December 9"],
  ["The Cup Quarterfinals", "December 10"],
  ["The Cup Semifinals", "December 13"],
  ["The Cup Final", "December 15"],
  ["Christmas Day Games", "December 25"],
  ["Rivals Week Begins", "January 12"],
  ["Rivals Week Friday", "January 16"],
  ["Rivals Week Ends", "January 18"],
  ["January Free Agents Become Trade Eligible", "January 15"],
  ["Trade Deadline", "February 5"],
  ["Midseason Owner Meeting", "February 6"],
  ["All-Star Break Begins", "Wednesday of All-Star Week"],
  ["All-Star Break Ends", "Following Wednesday"],
  ["Contract Buyout Deadline", "March 1"],
  ["Two-Way Contract Conversion Deadline", "March 4"],
  ["NCAA Championship No Games", "First Monday of April"],
  ["Regular Season Ends", "April 15"],
  ["Play-In Tournament Begins", "April 16"],
  ["Play-In Tournament Ends", "April 19"],
  ["Playoffs Begin", "April 21"],
  ["Draft Lottery", "June 18"],
  ["Draft Combine", "June 19"],
  ["Draft Round 1", "June 20"],
  ["Draft Round 2", "June 21"],
  ["League Meetings", "June 24"],
  ["End-of-Season Owner Meeting", "June 25"],
  ["Rookie Contract Signing Deadline", "June 28"],
  ["Contract Options Deadline", "June 29"],
  ["New Salary Cap & Aprons Announced", "July 1"],
  ["Free Agency Moratorium Begins", "July 1"],
  ["Official Free Agency Signings Begin", "July 6"],
  ["Summer League Begins", "July 12"],
  ["Summer League Ends", "July 22"]
];

function getFirstWeekdayOfMonth(year, month, weekday) {
  const date = new Date(year, month, 1);
  date.setDate(date.getDate() + ((weekday - date.getDay() + 7) % 7));
  return date;
}

function getElectionDayDate(year) {
  return getFirstWeekdayOfMonth(year, 10, 2);
}

function getNcaaChampionshipDate(year) {
  return getFirstWeekdayOfMonth(year, 3, 1);
}

function getAllStarBreakDatesForSeason(seasonStartYear = gameState.seasonStartYear) {
  const start = getSecondWednesdayOfFebruary(Number(seasonStartYear) + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

function getFcdSeasonCalendarEvents(seasonStartYear = gameState.seasonStartYear) {
  const year = Number(seasonStartYear);
  const nextYear = year + 1;
  const allStar = getAllStarBreakDatesForSeason(year);

  return [
    ["Season Ticket Renewal & Financial Planning", new Date(year, 7, 15)],
    ["Schedule Release", new Date(year, 7, 18)],
    ["Hall of Fame Ceremony", new Date(year, 7, 22)],
    ["Media Day", new Date(year, 8, 22)],
    ["Training Camp Begins", new Date(year, 8, 25)],
    ["Preseason Begins", new Date(year, 9, 5)],
    ["Preseason Ends", new Date(year, 9, 18)],
    ["Opening Night", new Date(year, 9, 22)],
    ["Election Day - No Games", getElectionDayDate(year)],
    ["The Cup Games Begin", new Date(year, 10, 11)],
    ["The Cup Game 2", new Date(year, 10, 18)],
    ["The Cup Game 3", new Date(year, 10, 25)],
    ["The Cup Game 4", new Date(year, 11, 2)],
    ["The Cup Quarterfinals", new Date(year, 11, 9)],
    ["The Cup Quarterfinals", new Date(year, 11, 10)],
    ["The Cup Semifinals", new Date(year, 11, 13)],
    ["The Cup Final", new Date(year, 11, 15)],
    ["Christmas Day Games", new Date(year, 11, 25)],
    ["Rivals Week Begins", new Date(nextYear, 0, 12)],
    ["January Free Agents Become Trade Eligible", new Date(nextYear, 0, 15)],
    ["Rivals Week Friday", new Date(nextYear, 0, 16)],
    ["Rivals Week Ends", new Date(nextYear, 0, 18)],
    ["Trade Deadline", new Date(nextYear, 1, 5)],
    ["Midseason Owner Meeting", new Date(nextYear, 1, 6)],
    ["All-Star Break Begins", allStar.start],
    ["All-Star Break Ends", allStar.end],
    ["Contract Buyout Deadline", new Date(nextYear, 2, 1)],
    ["Two-Way Contract Conversion Deadline", new Date(nextYear, 2, 4)],
    ["NCAA Championship - No Games", getNcaaChampionshipDate(nextYear)],
    ["Regular Season Ends", new Date(nextYear, 3, 15)],
    ["Play-In Tournament Begins", new Date(nextYear, 3, 16)],
    ["Play-In Tournament Ends", new Date(nextYear, 3, 19)],
    ["Playoffs Begin", new Date(nextYear, 3, 21)],
    ["Draft Lottery", new Date(nextYear, 5, 18)],
    ["Draft Combine", new Date(nextYear, 5, 19)],
    ["Draft Round 1", new Date(nextYear, 5, 20)],
    ["Draft Round 2", new Date(nextYear, 5, 21)],
    ["League Meetings", new Date(nextYear, 5, 24)],
    ["End-of-Season Owner Meeting", new Date(nextYear, 5, 25)],
    ["Rookie Contract Signing Deadline", new Date(nextYear, 5, 28)],
    ["Contract Options Deadline", new Date(nextYear, 5, 29)],
    ["New Salary Cap & Aprons Announced", new Date(nextYear, 6, 1)],
    ["Free Agency Moratorium Begins", new Date(nextYear, 6, 1)],
    ["Official Free Agency Signings Begin", new Date(nextYear, 6, 6)],
    ["Summer League Begins", new Date(nextYear, 6, 12)],
    ["Summer League Ends", new Date(nextYear, 6, 22)]
  ].map(([name, date]) => ({ name, date }));
}

function getKeyDateOccurrence(dateLabel, year) {
  if (dateLabel === "First Tuesday of November") {
    return getElectionDayDate(year);
  }

  if (dateLabel === "First Monday of April") {
    return getNcaaChampionshipDate(year);
  }

  if (dateLabel === "Wednesday of All-Star Week") {
    return getSecondWednesdayOfFebruary(year);
  }

  if (dateLabel === "Following Wednesday") {
    const date = getSecondWednesdayOfFebruary(year);
    date.setDate(date.getDate() + 7);
    return date;
  }

  const parsedDate = new Date(`${dateLabel}, ${year}`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getRollingKeyDates() {
  const currentDate = new Date(gameState.currentDate);
  currentDate.setHours(0, 0, 0, 0);

  return FCD_KEY_DATES.map(([eventName, dateLabel], index) => {
    let occurrence = getKeyDateOccurrence(dateLabel, currentDate.getFullYear());

    if (!occurrence) {
      occurrence = new Date(currentDate.getFullYear() + 1, 11, 31);
    } else if (occurrence < currentDate) {
      occurrence = getKeyDateOccurrence(dateLabel, currentDate.getFullYear() + 1);
    }

    return {
      eventName,
      dateLabel,
      occurrence,
      index
    };
  }).sort((a, b) => {
    const dateDifference = a.occurrence - b.occurrence;
    return dateDifference || a.index - b.index;
  });
}

function formatRollingKeyDate(item) {
  return item.occurrence.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function displayKeyDatesScreen() {
  const root = document.getElementById("key-dates-root");
  if (!root) return;

  const rollingDates = getRollingKeyDates();

  root.innerHTML = `
    <div class="card">
      <h2>Key Dates</h2>

      <table class="key-dates-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          ${rollingDates.map((item, index) => `
            <tr class="${index === 0 ? "key-date-up-next" : ""}">
              <td>
                ${index === 0 ? '<span class="key-date-up-next-label">Up Next</span>' : ""}
                ${item.eventName}
              </td>
              <td>${formatRollingKeyDate(item)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function getSecondWednesdayOfFebruary(year) {
  const date = new Date(year, 1, 1); // February 1

  while (date.getDay() !== 3) { // Wednesday
    date.setDate(date.getDate() + 1);
  }

  date.setDate(date.getDate() + 7); // second Wednesday
  return date;
}

function getAllStarBreakStartDate() {
  return getAllStarBreakDatesForSeason().start;
}

function getAllStarBreakEndDate() {
  return getAllStarBreakDatesForSeason().end;
}

function isDateDuringAllStarBreak(date) {
  const current = new Date(date);
  const start = getAllStarBreakStartDate();
  const end = getAllStarBreakEndDate();

  current.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return current >= start && current <= end;
}

function getRegularSeasonMonthlyTargets() {
  return [
    {
      key: "october",
      month: 9,
      yearOffset: 0,
      startDay: 22,
      endDay: 31,
      target: 5
    },
    {
      key: "november",
      month: 10,
      yearOffset: 0,
      startDay: 1,
      endDay: 30,
      target: 15
    },
    {
      key: "december",
      month: 11,
      yearOffset: 0,
      startDay: 1,
      endDay: 31,
      target: 12
    },
    {
      key: "january",
      month: 0,
      yearOffset: 1,
      startDay: 1,
      endDay: 31,
      target: 15
    },
    {
      key: "february",
      month: 1,
      yearOffset: 1,
      startDay: 1,
      endDay: 28,
      target: 12
    },
    {
      key: "march",
      month: 2,
      yearOffset: 1,
      startDay: 1,
      endDay: 31,
      target: 16
    },
    {
      key: "april",
      month: 3,
      yearOffset: 1,
      startDay: 1,
      endDay: 14,
      target: 7
    }
  ];
}

function getDaysInMonthSafe(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getRegularSeasonDatePoolWithAllStarBreak() {
  const dates = [];
  const targets = getRegularSeasonMonthlyTargets();

  for (let target of targets) {
    const year = gameState.seasonStartYear + target.yearOffset;
    const lastDay = Math.min(target.endDay, getDaysInMonthSafe(year, target.month));
    const current = new Date(year, target.month, target.startDay);

    while (current.getMonth() === target.month && current.getDate() <= lastDay) {
      if (!fcdIsLeagueNoGameDate(current) && !fcdIsReservedShowcaseDate(current)) {
        dates.push(new Date(current));
      }

      current.setDate(current.getDate() + 1);
    }
  }

  return dates;
}

function getDatePoolForMonthlyTarget(target, reservedDateKeys = new Set()) {
  const dates = [];
  const year = gameState.seasonStartYear + target.yearOffset;
  const lastDay = Math.min(target.endDay, getDaysInMonthSafe(year, target.month));
  const current = new Date(year, target.month, target.startDay);

  while (current.getMonth() === target.month && current.getDate() <= lastDay) {
    const key = formatDateKey(current);

    if (
      !reservedDateKeys.has(key) &&
      !fcdIsLeagueNoGameDate(current) &&
      !fcdIsReservedShowcaseDate(current)
    ) {
      dates.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function pickDatesForMonth(datePool, count) {
  if (count <= 0) return [];
  if (datePool.length <= count) return datePool.slice(0, count);

  const selected = [];
  const used = new Set();

  if (count === 1) {
    const middleDate = datePool[Math.floor(datePool.length / 2)];
    return [new Date(middleDate)];
  }

  for (let i = 0; i < count; i++) {
    const idealIndex = Math.round((i * (datePool.length - 1)) / (count - 1));
    let chosenIndex = idealIndex;

    while (used.has(chosenIndex) && chosenIndex < datePool.length - 1) {
      chosenIndex++;
    }

    while (used.has(chosenIndex) && chosenIndex > 0) {
      chosenIndex--;
    }

    if (!used.has(chosenIndex)) {
      used.add(chosenIndex);
      selected.push(new Date(datePool[chosenIndex]));
    }
  }

  selected.sort((a, b) => new Date(a) - new Date(b));

  return selected.slice(0, count);
}

function pickRealisticSeasonDates(datePool, count) {
  const reservedDateKeys = new Set();
  const targets = getRegularSeasonMonthlyTargets();
  const selected = [];

  for (let target of targets) {
    if (selected.length >= count) break;

    const remainingNeeded = count - selected.length;
    const targetCount = Math.min(target.target, remainingNeeded);
    const monthPool = getDatePoolForMonthlyTarget(target, reservedDateKeys);
    const monthDates = pickDatesForMonth(monthPool, targetCount);

    for (let date of monthDates) {
      const key = formatDateKey(date);

      if (!reservedDateKeys.has(key)) {
        reservedDateKeys.add(key);
        selected.push(new Date(date));
      }
    }
  }

  if (selected.length < count) {
    const alreadyUsed = new Set(selected.map(date => formatDateKey(date)));

    for (let date of datePool) {
      if (selected.length >= count) break;

      const key = formatDateKey(date);

      if (!alreadyUsed.has(key)) {
        alreadyUsed.add(key);
        selected.push(new Date(date));
      }
    }
  }

  selected.sort((a, b) => new Date(a) - new Date(b));

  return selected.slice(0, count);
}


function getSeasonPhase() {
  if (!gameState || !gameState.currentDate) return "Unknown";

  if (isSeasonCompleteWaitingForOffseason()) {
    return "Season Complete";
  }

  if (gameState.offseasonActive === true) {
  const dateKey = getCurrentDateKey();

  if (dateKey < 618) return "Pre-Draft";
  if (dateKey === 618) return "Draft Lottery";
  if (dateKey === 619) return "Draft Combine";
  if (dateKey === 620) return "Draft";
  if (dateKey > 620 && dateKey < 630) return "Post-Draft";
  if (dateKey >= 630 && dateKey < 706) return "Moratorium";
  if (dateKey >= 706 && dateKey < 925) return "Free Agency";
  if (dateKey === 925) return "Training Camp";

  return "Offseason";
}

  const year = gameState.seasonStartYear;

  if (gameState.currentDate < new Date(year, 8, 25)) return "Offseason";
  if (gameState.currentDate < new Date(year, 9, 22)) return "Training Camp";
  if (gameState.currentDate <= new Date(year + 1, 3, 15)) return "Regular Season";
  if (gameState.currentDate <= new Date(year + 1, 3, 20)) return "Play-In";
  if (gameState.currentDate <= new Date(year + 1, 5, 19)) return "Playoffs";

  return "Offseason";
}

function isRegularSeasonDate() {
  return getSeasonPhase() === "Regular Season";
}

function getOffseasonProcessedKey(seasonLabel = null) {
  const label = seasonLabel || gameState.seasonLabel;
  return `offseason_processed_${label}`;
}

function isSeasonCompleteWaitingForOffseason() {
  if (!gameState || !gameState.started) return false;

  const processedKey = getOffseasonProcessedKey(gameState.seasonLabel);
  const offseasonAlreadyProcessed =
    gameState.processedEvents &&
    gameState.processedEvents[processedKey];

  return (
    gameState.playoffs &&
    gameState.playoffs.playoffsComplete === true &&
    gameState.seasonReadyForRollover === true &&
    gameState.offseasonActive !== true &&
    !offseasonAlreadyProcessed
  );
}

function canStartOffseasonToday() {
  return isSeasonCompleteWaitingForOffseason();
}

function isStartNewSeasonDay() {
  return getCurrentDateKey() === 925;
}

function isDraftDay() {
  return getCurrentDateKey() === 620;
}

function isStartOffseasonDay() {
  return getCurrentDateKey() === 618;
}


function blockIfStartOffseasonRequired() {
  return false;
}

function blockIfStartNewSeasonRequired() {
  if (!gameState || !gameState.started) return false;

  const shouldBlock =
    isStartNewSeasonDay() &&
    gameState.offseasonActive === true;

  if (!shouldBlock) return false;

  showModal(
    "Start New Season Required",
    "Training camp is ready. You must start the new season before advancing past September 25."
  );

  return true;
}

function blockIfEnterDraftRequired() {
  if (!gameState || !gameState.started || !gameState.draft) return false;

  if (typeof ensureTwoNightDraftState === "function") {
    ensureTwoNightDraftState();
  }

  const dateKey = getCurrentDateKey();

  const lotteryComplete =
    gameState.draftLotteryRun ||
    gameState.lotteryComplete ||
    gameState.draftLotteryComplete ||
    gameState.draft?.lotteryRun ||
    gameState.draft?.lotteryComplete;

  const roundOneComplete =
    gameState.draft?.roundOneComplete === true ||
    Number(gameState.draft?.currentPickIndex || 0) >= 30 ||
    Number(gameState.draft?.draftedPlayers?.length || 0) >= 30;

  const draftComplete =
    gameState.draftComplete ||
    gameState.draft?.complete ||
    gameState.draft?.draftComplete ||
    Number(gameState.draft?.draftedPlayers?.length || 0) >= 60;

  if (!gameState.offseasonActive || !lotteryComplete || draftComplete) {
    return false;
  }

  // June 20: only block if Round 1 has NOT been completed.
  if (dateKey === 620 && !roundOneComplete) {
    showModal(
      "Draft Required",
      "Round 1 of the Draft has arrived. You must enter the draft before advancing past June 20."
    );

    return true;
  }

  // June 21: block if Round 1 is done but Round 2 / full draft is not done.
  if (dateKey === 621 && roundOneComplete && !draftComplete) {
    showModal(
      "Round 2 Draft Required",
      "Round 2 of the Draft has arrived. You must enter the draft before advancing past June 21."
    );

    return true;
  }

  return false;
}

function simDay() {
  if (gameState && gameState.blockingNegotiation) {
  showRosterBlockPopup({
    legal: false,
    phase: "Negotiation In Progress",
    problems: [
      "You are currently negotiating with a free agent.",
      "Sign the player or cancel the offer before advancing."
    ]
  });

  return;
}
  if (!gameState.started) return;

  if (
  typeof blockIfOffseasonHubActionRequired === "function" &&
  blockIfOffseasonHubActionRequired()
) {
  refreshAll();
  return;
}

if (
  typeof blockIfAwardsCeremonyRequired === "function" &&
  blockIfAwardsCeremonyRequired()
) {
  refreshAll();
  return;
}

if (blockIfStartOffseasonRequired()) {
  refreshAll();
  return;
}

if (blockIfEnterDraftRequired()) {
  refreshAll();
  return;
}

if (blockIfStartNewSeasonRequired()) {
  refreshAll();
  return;
}

if (blockAdvanceForIllegalUserRosterIfNeeded()) {
  refreshAll();
  return;
}

  recoverAllPlayersEnergyOneDay();
  recoverAllPlayerInjuriesOneDay();

if (blockIfDraftNightRequired()) {
  return;
}

if (blockIfDraftLotteryRequired()) {
  return;
}

  if (blockIfRosterTooSmall()) {
    return;
  }

  if (hasUnresolvedUrgentMessages()) {
    addInboxMessageOnce(
      "Urgent Action Required",
      "You must resolve urgent inbox actions before advancing.",
      "staff",
      false,
      "urgent_action_required"
    );

    refreshAll();
    return;
  }

  processCalendarEvents();
processAllStarBreakToday();
processScoutingReportsToday();
processMonthlyMockDraftUpdate();
processDraftLotteryDay();
processDraftNightDay();
processOtherTeamGamesToday();
processRegularSeasonEnd();
processCupGamesToday();
processPlayInAndPlayoffSetup();
processLeagueEconomyEvents();

if (typeof processStaffSystemDaily === "function") {
  processStaffSystemDaily();
}

processFreeAgencyMoratoriumEndIfNeeded();

if (typeof processDailyFreeAgencyMarket === "function") {
  processDailyFreeAgencyMarket();
}

if (typeof processOpeningRosterFillMarket === "function") {
  processOpeningRosterFillMarket();
}

  if (blockIfRotationInvalidForGameDay()) {
    return;
  }

  const todayGames = getTodayUserGames()
    .filter(game => !game.cancelled)
    .filter(game => !isCancelledFutureGame(game));

  if (todayGames.length > 0) {
  let userPlayedGameToday = false;

  for (let game of todayGames) {
    if (!game.played) {
      playUserScheduleGame(game);
      userPlayedGameToday = true;
    }
  }

    if (userPlayedGameToday && typeof createNextGameScoutingReportEmail === "function") {
      createNextGameScoutingReportEmail();
    }
  }

  simulateOtherTeamsDaily();
processAutoPostseasonGamesToday();

if (typeof processAwardWatchDaily === "function") {
  processAwardWatchDaily();
}

gameState.currentDate.setDate(gameState.currentDate.getDate() + 1);

  processFreeAgencyMoratoriumEndIfNeeded();

  refreshAll();
}

function simWeek() {
  if (gameState && gameState.blockingNegotiation) {
  showRosterBlockPopup({
    legal: false,
    phase: "Negotiation In Progress",
    problems: [
      "You are currently negotiating with a free agent.",
      "Sign the player or cancel the offer before advancing."
    ]
  });

  return;
}
  for (let i = 0; i < 7; i++) {
    if (hasBlockingUrgentMessage()) {
      addInboxMessageOnce(
        "Simulation Stopped",
        "Weekly simulation stopped because an urgent action needs attention.",
        "urgent",
        false
      );

      refreshAll();
      return;
    }

    simDay();
  }
}

function processCalendarEvents() {
  const key = getDateKey(gameState.currentDate);

  if (gameState.processedEvents[key]) return;

  const year = gameState.seasonStartYear;
  const currentYear = new Date(gameState.currentDate).getFullYear();

  if (
    datesMatch(gameState.currentDate, new Date(currentYear, 7, 18)) &&
    typeof prepareLeagueScheduleRelease === "function"
  ) {
    prepareLeagueScheduleRelease(currentYear);
    addInboxMessage(
      "Schedule Released",
      `The ${getSeasonLabel(currentYear)} full league schedule and Cup groups are now available.`,
      "event"
    );
    gameState.processedEvents[key] = true;
    return;
  }

  const events = [
    { date: new Date(year, 8, 25), title: "Training Camp Opens", body: "Training camp has opened. This is the time to establish your team identity.", type: "event" },
    { date: new Date(year, 9, 22), title: "Opening Night", body: "Opening night has arrived. The regular season begins now.", type: "event" },
    { date: new Date(year, 11, 9), title: "The Cup Knockout Stage", body: "The Cup knockout stage is being set.", type: "event" },
    { date: new Date(year + 1, 1, 5), title: "Trade Deadline", body: "Today is the trade deadline.", type: "event" },
    { date: getAllStarBreakStartDate(), title: "All-Star Break", body: "The league has reached the All-Star break. Review your team direction.", type: "event" },
    { date: new Date(year + 1, 3, 15), title: "Regular Season Ends", body: "The regular season ends today. The postseason race is now final.", type: "event" },
    { date: new Date(year + 1, 3, 16), title: "Play-In Tournament Begins", body: "The Play-In Tournament begins.", type: "event" },
    { date: new Date(year + 1, 3, 21), title: "Playoffs Begin", body: "The playoffs begin.", type: "event" },
    { date: new Date(year + 1, 5, 3), title: "The Finals Begin", body: "The Finals are scheduled to begin.", type: "event" }
  ];

  for (let event of events) {
    if (datesMatch(event.date, gameState.currentDate)) {
      addInboxMessage(
        event.title,
        event.body,
        event.urgent ? "urgent" : event.type,
        event.urgent || false,
        event.actionType || null
      );

      gameState.processedEvents[key] = true;
    }
  }
}


function getTodayUserGames() {
  return gameState.userSchedule.filter(game =>
    !game.played &&
    !isCancelledFutureGame(game) &&
    datesMatch(game.date, gameState.currentDate)
  );
}

function getNextGame() {
  return gameState.userSchedule.find(game => !game.played && !isCancelledFutureGame(game));
}

function isCancelledFutureGame(game) {
  if (game.playoffGame && game.parentSeriesId) {
    const series = gameState.playoffs.series.find(item => item.id === game.parentSeriesId);
    return series && series.complete;
  }

  return false;
}

function playUserScheduleGame(game) {
  if (!game || game.played) return;

  // rest of your original playUserScheduleGame code continues below

  const selectedTeam = getSelectedTeam();
  const opponent = getTeamById(game.opponentId);

  const result = simTeamVsTeam(selectedTeam, opponent, {
  homeTeamId: game.home ? selectedTeam.id : opponent.id
});
  const userWon = result.winnerId === selectedTeam.id;

  game.played = true;

applyEnergyLossForCompletedGame(selectedTeam.id, opponent.id);
rollInjuriesForCompletedGame(selectedTeam.id, opponent.id);

game.ourScore = userWon ? Math.max(result.scoreA, result.scoreB) : Math.min(result.scoreA, result.scoreB);
game.opponentScore = userWon ? Math.min(result.scoreA, result.scoreB) : Math.max(result.scoreA, result.scoreB);
game.result = `${userWon ? "W" : "L"} ${game.ourScore}-${game.opponentScore}`;

  const performers = generatePlayerStatsForGame(
    selectedTeam.id,
    opponent.id,
    game.ourScore,
    game.opponentScore
  );

  game.topPerformers = performers.userTopPerformers;

  game.boxScore = createBoxScoreObject(
    game,
    selectedTeam,
    opponent,
    performers.teamAStats.playerLines,
    performers.teamBStats.playerLines
  );

  if (game.countsForRegularSeason) {
    applyRegularSeasonResult(selectedTeam, opponent, result.winnerId);
  }

  if (game.cupGame && game.competition === "The Cup Group") {
    updateCupStats(selectedTeam.id, opponent.id, game.ourScore, game.opponentScore);
  }
  if (game.cupGame && game.competition !== "The Cup Group") {
    finishUserCupKnockoutGame(game);
  }
  if (game.playInGame) {
    finishPlayInGame(game, userWon);
  }

  if (game.playoffGame) {
    finishPlayoffUserGame(game, result.winnerId);
  }

  const topPerformerText = formatTopPerformersForInbox(game.topPerformers);

  addInboxMessage(
    "Game Result",
    userWon
      ? `${selectedTeam.name} defeated ${opponent.name}, ${game.ourScore}-${game.opponentScore}.${topPerformerText}`
      : `${selectedTeam.name} lost to ${opponent.name}, ${game.ourScore}-${game.opponentScore}.${topPerformerText}`,
    userWon ? "match-win" : "match-loss"
  );
}

function applyRegularSeasonResult(teamA, teamB, winnerId) {
  if (winnerId === teamA.id) {
    teamA.wins++;
    teamB.losses++;
  } else {
    teamB.wins++;
    teamA.losses++;
  }
}

function simulateOtherTeamsDaily() {
  /*
    CPU games are now handled by processOtherTeamGamesToday().
    This function stays here so old simDay code does not break,
    but it should not create extra games anymore.
  */
  return;
}

function maybeGenerateDailyInbox() {
  return;
}


function processSeasonRolloverTrigger() {
  return;
}

function startOffseason() {
  if (!gameState || !gameState.started) return;

  if (gameState.offseasonActive) {
    showModal(
      "Offseason Already Started",
      "The offseason has already started. Continue through the offseason calendar."
    );
    return;
  }

  if (
    !gameState.playoffs ||
    gameState.playoffs.playoffsComplete !== true ||
    gameState.seasonReadyForRollover !== true
  ) {
    showModal(
      "Offseason Not Ready",
      "The offseason cannot start yet. The Finals must be completed first."
    );
    return;
  }

  if (!gameState.processedEvents) {
    gameState.processedEvents = {};
  }

  const completedSeasonLabel = gameState.seasonLabel;
  const processedKey = `offseason_processed_${completedSeasonLabel}`;

  if (gameState.processedEvents[processedKey]) {
    showModal(
      "Offseason Already Processed",
      "This offseason has already been processed."
    );
    return;
  }

  const offseasonStartDate = new Date(gameState.currentDate);

  processOffseasonPlayerAgingContractsAndRetirements();

  gameState.offseasonActive = true;
  gameState.offseasonStarted = true;
  gameState.offseasonStartedForSeason = completedSeasonLabel;
  gameState.offseasonStartDate = new Date(offseasonStartDate);
  gameState.processedEvents[processedKey] = true;

  // Do not jump the date.
  gameState.currentDate = new Date(offseasonStartDate);

  // Keep the current season label until training camp starts the next season.
  gameState.seasonLabel = completedSeasonLabel;

  gameState.seasonReadyForRollover = false;
  gameState.finalsCompletedDate = gameState.finalsCompletedDate || new Date(offseasonStartDate);

  gameState.draft = createDraftState(gameState.seasonStartYear);
  validateDraftClass();
  generateCurrentMockDraft("Offseason Mock");

  clearOldOffseasonUrgentMessages();

  ensureFreeAgents();
  updateAllPlayerLabelsAndTypes();
  ensureLeagueRostersAfterPlayerMovement();
  ensureRotation();
  ensureTeamStats();

  if (typeof markOffseasonHubEventComplete === "function") {
    markOffseasonHubEventComplete("start_offseason");
  }

  addInboxMessage(
    "Offseason Started",
    "The offseason has begun. Advance day by day through the offseason calendar.",
    "event"
  );

  calendarViewDate = new Date(gameState.currentDate);

  refreshAll();
  showMainSection("dashboard");
  showSecondaryScreen("dashboard-screen");
}

function startNextSeason() {
  if (!gameState || !gameState.started) return;

  if (!gameState.offseasonActive) {
    showModal(
      "New Season Not Ready",
      "The offseason has not started yet."
    );
    return;
  }

  if (!isStartNewSeasonDay()) {
    showModal(
      "New Season Not Ready",
      "Training camp begins on September 25. Continue through the offseason calendar first."
    );
    return;
  }

  const completedSeasonLabel = gameState.seasonLabel;
  const completedSeasonStartYear = gameState.seasonStartYear;
  const nextSeasonStartYear = new Date(gameState.currentDate).getFullYear();

gameState.seasonStartYear = nextSeasonStartYear;
gameState.seasonLabel = getSeasonLabel(nextSeasonStartYear);
gameState.currentDate = new Date(nextSeasonStartYear, 8, 25);

  const releasedSchedule =
    gameState.pendingLeagueSchedule &&
    Number(gameState.pendingLeagueSchedule.seasonStartYear) === nextSeasonStartYear
      ? gameState.pendingLeagueSchedule
      : null;

  agePlayersForNewSeason();
  resetTeamRecordsForNewSeason();

  gameState.userSchedule = [];
  gameState.leagueSchedule = releasedSchedule ? releasedSchedule.leagueSchedule : [];
  gameState.leagueScheduleMeta = releasedSchedule ? releasedSchedule.leagueScheduleMeta : null;
  gameState.rotation = null;
  gameState.teamStats = {};
  gameState.processedEvents = {};
  gameState.salaryCap = SALARY_CAP;

  gameState.cup = releasedSchedule ? releasedSchedule.cup : createCupState();
  gameState.playoffs = createEmptyPlayoffState();
  gameState.awardsCeremony = null;
  gameState.seasonReadyForRollover = false;
  gameState.finalsCompletedDate = null;

  gameState.offseasonActive = false;
  gameState.offseasonStarted = false;

  clearSeasonStatsForNewSeason(completedSeasonLabel, completedSeasonStartYear);

  gameState.rotation = createDefaultRotation();
  ensureTeamStats();

  gameState.userSchedule = createRealisticUserSchedule(gameState.selectedTeamId);
  assignCupGamesToUserSchedule();
  validateUserSchedule82();
  gameState.pendingLeagueSchedule = null;

  gameState.draft = createDraftState(gameState.seasonStartYear);
  validateDraftClass();
  generateCurrentMockDraft("Opening Mock");

  addInboxMessage(
    "Training Camp Opens",
    `The ${gameState.seasonLabel} season is ready. A new schedule has been generated and training camp has opened.`,
    "event"
  );

  calendarViewDate = new Date(gameState.currentDate);

  refreshAll();
  showMainSection("dashboard");
  showSecondaryScreen("dashboard-screen");

  showModal(
    "New Season Started",
    `Training camp has opened for the ${gameState.seasonLabel} season.

A new 82-game schedule has been generated.
Team records have reset.
The Cup and Playoffs have reset.
Your roster, signings, player images, ages, and contracts have been kept.`
  );
}

function resetTeamRecordsForNewSeason() {
  if (!gameState || !Array.isArray(gameState.teams)) return;

  for (let team of gameState.teams) {
    team.wins = 0;
    team.losses = 0;
    team.cupWins = 0;
    team.cupLosses = 0;
    team.streak = "";
  }
}

function processOffseasonPlayerAgingContractsAndRetirements() {
  if (!gameState || !gameState.rosters) return;

  const expiredPlayers = [];
  const retiredPlayers = [];

  for (let team of gameState.teams) {
    const roster = gameState.rosters[team.id] || [];
    const remainingRoster = [];

    for (let player of roster) {
      agePlayerForOffseason(player);
      decreasePlayerContractForOffseason(player);
      normalizePlayerContract(player);

      if (player.age >= RETIREMENT_AGE) {
        retiredPlayers.push({ player, team });

        if (Number(team.id) === Number(gameState.selectedTeamId)) {
          removePlayerFromRotation(player.id || player.playerId);
        }

        continue;
      }

      if (getPlayerContractYears(player) <= 0) {
        preparePlayerAsFreeAgent(player);
        expiredPlayers.push({ player, team });

        if (Number(team.id) === Number(gameState.selectedTeamId)) {
          removePlayerFromRotation(player.id || player.playerId);
        }

        continue;
      }

      remainingRoster.push(player);
    }

    gameState.rosters[team.id] = remainingRoster;
  }

  if (Array.isArray(gameState.freeAgents)) {
    const remainingFreeAgents = [];

    for (let player of gameState.freeAgents) {
      agePlayerForOffseason(player);
      normalizePlayerContract(player);

      if (player.age >= RETIREMENT_AGE) {
        retiredPlayers.push({ player, team: null });
      } else {
        remainingFreeAgents.push(player);
      }
    }

    gameState.freeAgents = remainingFreeAgents;
  }

  if (!Array.isArray(gameState.freeAgents)) {
    gameState.freeAgents = [];
  }

  for (let item of expiredPlayers) {
    gameState.freeAgents.push(item.player);
  }

  for (let retired of retiredPlayers) {
    const replacement = createGeneratedFreeAgent(true);
    gameState.freeAgents.push(replacement);
  }

  if (expiredPlayers.length > 0) {
    const userExpired = expiredPlayers.filter(item =>
      item.team && Number(item.team.id) === Number(gameState.selectedTeamId)
    );

    if (userExpired.length > 0) {
      const names = userExpired.map(item => item.player.name).join(", ");

      addInboxMessage(
        "Contracts Expired",
        `${names} entered free agency after their contracts expired.`,
        "event"
      );
    }

    addInboxMessage(
      "League Free Agency Opens",
      `${expiredPlayers.length} player(s) entered free agency after their contracts expired.`,
      "event"
    );
  }

  if (retiredPlayers.length > 0) {
    const userRetired = retiredPlayers.filter(item =>
      item.team && Number(item.team.id) === Number(gameState.selectedTeamId)
    );

    if (userRetired.length > 0) {
      const names = userRetired.map(item => item.player.name).join(", ");

      addInboxMessage(
        "Player Retirement",
        `${names} retired after the season.`,
        "event"
      );
    }

    addInboxMessage(
      "League Retirements",
      `${retiredPlayers.length} player(s) retired. Replacement free agents entered the league.`,
      "event"
    );
  }
}

function agePlayerForOffseason(player) {
  if (!player) return;

  player.age = Number(player.age || 0) + 1;
  player.yearsPro = Number(player.yearsPro || 0) + 1;
}

function decreasePlayerContractForOffseason(player) {
  if (!player) return;

  if (player.contractYears === undefined || player.contractYears === null) {
    player.contractYears = 1;
  }

  player.contractYears = Math.max(0, Number(player.contractYears || 0) - 1);
}

function preparePlayerAsFreeAgent(player) {
  if (!player) return;

  player.teamId = null;
  player.teamName = "Free Agent";
  player.startsAsFreeAgent = true;
  player.contract = "Free Agent";
  player.salary = 0;
  player.contractYears = 0;
  player.interest = player.interest || "Neutral";

  normalizePlayerContract(player);
}

function ensurePlayerSeasonStatsHistoryStorage(player) {
  if (!player) return {};

  if (!player.seasonStatsHistory || typeof player.seasonStatsHistory !== "object" || Array.isArray(player.seasonStatsHistory)) {
    player.seasonStatsHistory = {};
  }

  return player.seasonStatsHistory;
}

function createPlayerSeasonStatsSnapshot(player, teamId = null, seasonLabel = gameState.seasonLabel, seasonStartYear = gameState.seasonStartYear) {
  const stats = player && player.seasonStats ? player.seasonStats : createEmptySeasonStats();
  const team = teamId ? getTeamById(Number(teamId)) : null;

  return {
    season: seasonLabel,
    seasonStartYear,
    teamId: team ? team.id : null,
    teamName: team ? team.name : "Free Agent",
    games: Number(stats.games || 0),
    gamesStarted: Number(stats.gamesStarted || 0),
    minutes: Number(stats.minutes || 0),
    points: Number(stats.points || 0),
    rebounds: Number(stats.rebounds || 0),
    assists: Number(stats.assists || 0),
    steals: Number(stats.steals || 0),
    blocks: Number(stats.blocks || 0),
    turnovers: Number(stats.turnovers || 0),
    fieldGoalsMade: Number(stats.fieldGoalsMade || 0),
    fieldGoalsAttempted: Number(stats.fieldGoalsAttempted || 0),
    threePointersMade: Number(stats.threePointersMade || 0),
    threePointersAttempted: Number(stats.threePointersAttempted || 0),
    freeThrowsMade: Number(stats.freeThrowsMade || 0),
    freeThrowsAttempted: Number(stats.freeThrowsAttempted || 0)
  };
}

function saveCurrentSeasonStatsHistory(seasonLabel = gameState.seasonLabel, seasonStartYear = gameState.seasonStartYear) {
  if (!gameState || !seasonLabel) return;

  const seasonKey = String(seasonLabel);

  for (let teamId in gameState.rosters) {
    for (let player of gameState.rosters[teamId]) {
      const history = ensurePlayerSeasonStatsHistoryStorage(player);

      if (!history[seasonKey]) {
        history[seasonKey] = createPlayerSeasonStatsSnapshot(player, teamId, seasonLabel, seasonStartYear);
      }
    }
  }

  if (Array.isArray(gameState.freeAgents)) {
    for (let player of gameState.freeAgents) {
      const history = ensurePlayerSeasonStatsHistoryStorage(player);

      if (!history[seasonKey]) {
        history[seasonKey] = createPlayerSeasonStatsSnapshot(player, null, seasonLabel, seasonStartYear);
      }
    }
  }
}

function clearSeasonStatsForNewSeason(completedSeasonLabel = gameState.seasonLabel, completedSeasonStartYear = gameState.seasonStartYear) {
  if (!gameState) return;

  saveCurrentSeasonStatsHistory(completedSeasonLabel, completedSeasonStartYear);

  for (let teamId in gameState.rosters) {
    for (let player of gameState.rosters[teamId]) {
      player.seasonStats = createEmptySeasonStats();
      player.lastFiveGames = [];
      player.form = [];
    }
  }

  if (Array.isArray(gameState.freeAgents)) {
    for (let player of gameState.freeAgents) {
      player.seasonStats = createEmptySeasonStats();
      player.lastFiveGames = [];
      player.form = [];
    }
  }

  gameState.teamStats = {};
}

function clearOldOffseasonUrgentMessages() {
  if (!gameState || !Array.isArray(gameState.inbox)) return;

  gameState.inbox = gameState.inbox.map(message => {
    if (
      message.actionType === "offseason" ||
      message.actionType === "season_complete_rollover" ||
      message.title === "Start Offseason Available" ||
      message.title === "Season Complete"
    ) {
      return {
        ...message,
        urgent: false,
        resolved: true
      };
    }

    return message;
  });
}

function agePlayersOneYear() {
  agePlayersAndDecreaseContractsOneYear();
}

function updateAllPlayerLabelsAndTypes() {
  for (let teamId in gameState.rosters) {
    for (let player of gameState.rosters[teamId]) {
      player.currentAbility = calculateAbility(player.attributes);
      player.potentialAbility = calculateAbility(player.potentialAttributes);
      player.mediaDescription = getMediaDescription(player.currentAbility);
      player.projectedCeiling = getProjectedCeilingLabel(player.potentialAbility);
      player.playerType = determinePlayerType(player);
    }
  }
}

function getUserRegularSeasonGamesPlayed() {
  const selectedTeam = getSelectedTeam();
  if (!selectedTeam) return 0;

  return selectedTeam.wins + selectedTeam.losses;
}

function isUserRegularSeasonGame(game) {
  return (
    game &&
    !game.playoffGame &&
    !game.playInGame &&
    game.countsForRegularSeason !== false
  );
}

function pickEvenlySpacedDates(datePool, count) {
  if (count <= 0) return [];
  if (count === 1) return [new Date(datePool[0])];

  const selected = [];
  const usedIndexes = new Set();

  for (let i = 0; i < count; i++) {
    let index = Math.round(i * (datePool.length - 1) / (count - 1));

    while (usedIndexes.has(index) && index < datePool.length - 1) {
      index++;
    }

    while (usedIndexes.has(index) && index > 0) {
      index--;
    }

    usedIndexes.add(index);
    selected.push(new Date(datePool[index]));
  }

  return selected;
}

function debugUserScheduleCount() {
  if (!gameState || !gameState.userSchedule) return;

  const countable = gameState.userSchedule.filter(game =>
    !game.playoffGame &&
    !game.playInGame &&
    game.countsForRegularSeason !== false
  );

  const cupCountable = countable.filter(game => game.cupGame);
  const regularOnly = countable.filter(game => !game.cupGame);

  console.log("User schedule count check:");
  console.log("Total schedule games:", gameState.userSchedule.length);
  console.log("Countable regular season games:", countable.length);
  console.log("Regular-only countable games:", regularOnly.length);
  console.log("Cup countable games:", cupCountable.length);
}

function processAllStarBreakToday() {
  if (!gameState.started) return;

  const start = getAllStarBreakStartDate();
  const end = getAllStarBreakEndDate();
  const key = `all_star_break_${gameState.seasonLabel}`;

  if (gameState.processedEvents[key]) return;

  if (isSameDate(gameState.currentDate, start)) {
    addInboxMessage(
      "All-Star Break Begins",
      `The league is now on All-Star break. Games resume on ${formatDate(addDays(end, 1))}.`,
      "event",
      false
    );

    gameState.processedEvents[key] = true;
  }
}

function isSummerLeaguePeriod() {
  const dateKey = getCurrentDateKey();
  return dateKey >= 712 && dateKey <= 722;
}

function getOffseasonPhaseLabel() {
  const dateKey = getCurrentDateKey();

  if (!gameState.offseasonActive) {
    return "Season Complete";
  }

  if (dateKey < 618) {
    const targetDate = new Date(gameState.seasonStartYear, 5, 18);
    const daysUntil = Math.ceil((targetDate - gameState.currentDate) / (1000 * 60 * 60 * 24));
    return `Draft Lottery in ${Math.max(0, daysUntil)} days`;
  }

  if (dateKey === 618) {
    return "Draft Lottery";
  }

  if (dateKey === 619) {
    return "Draft Combine";
  }

  if (dateKey === 620) {
    return "Draft Day";
  }

  if (dateKey > 620 && dateKey < 630) {
    const daysUntil = Math.ceil((new Date(gameState.seasonStartYear, 5, 30) - gameState.currentDate) / (1000 * 60 * 60 * 24));
    return `Free Agency begins in ${Math.max(0, daysUntil)} days`;
  }

  if (isFreeAgencyMoratorium()) {
    const moratoriumStart = new Date(gameState.seasonStartYear, 5, 30);
    const daysSince = Math.floor((gameState.currentDate - moratoriumStart) / (1000 * 60 * 60 * 24));
    return `Moratorium Day ${Math.max(1, daysSince + 1)}`;
  }

  if (isFreeAgencySigningPeriod()) {
    const signingStart = new Date(gameState.seasonStartYear, 6, 6);
    const daysSince = Math.floor((gameState.currentDate - signingStart) / (1000 * 60 * 60 * 24));
    const freeAgencyDay = Math.max(1, daysSince + 1);

    if (freeAgencyDay <= 20) {
      return `Free Agency Day ${freeAgencyDay}`;
    }

    const daysUntilTrainingCamp = Math.ceil((new Date(gameState.seasonStartYear, 8, 25) - gameState.currentDate) / (1000 * 60 * 60 * 24));
    return `Training Camp begins in ${Math.max(0, daysUntilTrainingCamp)} days`;
  }

  if (isSummerLeaguePeriod()) {
    const summerLeagueStart = new Date(gameState.seasonStartYear, 6, 12);
    const dayNumber = Math.floor((gameState.currentDate - summerLeagueStart) / (1000 * 60 * 60 * 24)) + 1;
    return `Summer League: Day ${Math.max(1, dayNumber)}`;
  }

  if (dateKey < 925) {
    const daysUntil = Math.ceil((new Date(gameState.seasonStartYear, 8, 25) - gameState.currentDate) / (1000 * 60 * 60 * 24));
    return `Training Camp opens in ${Math.max(0, daysUntil)} days`;
  }

  if (dateKey === 925) {
    return "Training Camp Opens";
  }

  return "Offseason";
}

function processOffseasonContractsAndRetirements() {
  if (!gameState || !gameState.rosters) return;

  const expiredPlayers = [];
  const retiredPlayers = [];

  for (let team of gameState.teams) {
    const roster = gameState.rosters[team.id] || [];
    const remainingRoster = [];

    for (let player of roster) {
      decreasePlayerContractForOffseason(player);
      normalizePlayerContract(player);

      if (player.age >= RETIREMENT_AGE) {
        retiredPlayers.push({ player, team });

        if (Number(team.id) === Number(gameState.selectedTeamId)) {
          removePlayerFromRotation(player.id || player.playerId);
        }

        continue;
      }

      if (getPlayerContractYears(player) <= 0) {
        preparePlayerAsFreeAgent(player);
        expiredPlayers.push({ player, team });

        if (Number(team.id) === Number(gameState.selectedTeamId)) {
          removePlayerFromRotation(player.id || player.playerId);
        }

        continue;
      }

      remainingRoster.push(player);
    }

    gameState.rosters[team.id] = remainingRoster;
  }

  if (Array.isArray(gameState.freeAgents)) {
    const remainingFreeAgents = [];

    for (let player of gameState.freeAgents) {
      normalizePlayerContract(player);

      if (player.age >= RETIREMENT_AGE) {
        retiredPlayers.push({ player, team: null });
      } else {
        remainingFreeAgents.push(player);
      }
    }

    gameState.freeAgents = remainingFreeAgents;
  }

  if (!Array.isArray(gameState.freeAgents)) {
    gameState.freeAgents = [];
  }

  for (let item of expiredPlayers) {
    gameState.freeAgents.push(item.player);
  }

  for (let retired of retiredPlayers) {
    const replacement = createGeneratedFreeAgent(true);
    gameState.freeAgents.push(replacement);
  }

  if (expiredPlayers.length > 0) {
    const userExpired = expiredPlayers.filter(item =>
      item.team && Number(item.team.id) === Number(gameState.selectedTeamId)
    );

    if (userExpired.length > 0) {
      const names = userExpired.map(item => item.player.name).join(", ");

      addInboxMessage(
        "Contracts Expired",
        `${names} entered free agency after their contracts expired.`,
        "event"
      );
    }

    addInboxMessage(
      "League Free Agency Opens",
      `${expiredPlayers.length} player(s) entered free agency after their contracts expired.`,
      "event"
    );
  }

  if (retiredPlayers.length > 0) {
    const userRetired = retiredPlayers.filter(item =>
      item.team && Number(item.team.id) === Number(gameState.selectedTeamId)
    );

    if (userRetired.length > 0) {
      const names = userRetired.map(item => item.player.name).join(", ");

      addInboxMessage(
        "Player Retirement",
        `${names} retired after the season.`,
        "event"
      );
    }

    addInboxMessage(
      "League Retirements",
      `${retiredPlayers.length} player(s) retired. Replacement free agents entered the league.`,
      "event"
    );
  }
}

function agePlayersForNewSeason() {
  if (!gameState || !gameState.rosters) return;

  for (let team of gameState.teams) {
    const roster = gameState.rosters[team.id] || [];
    for (let player of roster) {
      agePlayerForOffseason(player);
    }
  }

  if (Array.isArray(gameState.freeAgents)) {
    for (let player of gameState.freeAgents) {
      agePlayerForOffseason(player);
    }
  }
}

function displayOffseasonGameCenter(selectedTeam) {
  const countdownElement = document.getElementById("dashboard-game-countdown");
  const gameTypeElement = document.getElementById("dashboard-game-type");
  const todayGameCard = document.querySelector(".dashboard-today-game-card");
  
  if (todayGameCard) {
    todayGameCard.classList.remove("dashboard-cup-game", "dashboard-playoff-game");
  }
  
  const phaseLabel = getOffseasonPhaseLabel();
  const dateKey = getCurrentDateKey();
  
  if (countdownElement) {
    countdownElement.textContent = phaseLabel;
  }
  
  if (gameTypeElement) {
    if (dateKey < 620) {
      gameTypeElement.textContent = "Offseason Preparation";
    } else if (dateKey === 620) {
      gameTypeElement.textContent = "League Draft";
    } else if (isFreeAgencyMoratorium()) {
      gameTypeElement.textContent = "Free Agency Moratorium";
    } else if (isFreeAgencySigningPeriod()) {
      gameTypeElement.textContent = "Free Agency";
    } else if (isSummerLeaguePeriod()) {
      gameTypeElement.textContent = "Summer League";
    } else {
      gameTypeElement.textContent = "Training Camp Preparation";
    }
  }
  
  setText("dashboard-next-game-time", "--");
  setText("dashboard-next-game-location", "Offseason");
  setText("dashboard-next-game-arena", "See Dashboard");
  setText("dashboard-next-game-arena-capacity", "--");
  
  setText("dashboard-next-opponent-name", "No Games");
  setText("dashboard-next-opponent-record", "--");
  
  const opponentLogo = document.getElementById("dashboard-opponent-logo");
  if (opponentLogo) {
    opponentLogo.innerHTML = `<div class="team-logo-placeholder team-logo-large dashboard-matchup-logo team-logo-empty">OFF</div>`;
  }
  
  setText("dashboard-comparison-user-record", `${selectedTeam.wins || 0}-${selectedTeam.losses || 0}`);
  setText("dashboard-comparison-user-ppg", "--");
  setText("dashboard-comparison-user-rank", "--");
  
  setText("dashboard-comparison-opponent-record", "--");
  setText("dashboard-comparison-opponent-ppg", "--");
  setText("dashboard-comparison-opponent-rank", "--");
}

function debugOffseasonFlow() {
  if (!gameState || !gameState.started) {
    console.log('Game not started yet.');
    return;
  }

  const dateKey = getCurrentDateKey();
  const selectedTeam = getSelectedTeam();
  const roster = gameState.rosters[gameState.selectedTeamId] || [];
  const freeAgents = gameState.freeAgents || [];
  const scheduleCount = (gameState.userSchedule || []).length;

  const lotteryComplete = gameState.draftLotteryRun || gameState.lotteryComplete || gameState.draftLotteryComplete;
  const draftComplete = gameState.draftStarted || gameState.draftComplete || gameState.draft?.started || gameState.draft?.complete;
  const newSeasonReady = isStartNewSeasonDay() && gameState.offseasonActive;

  const dashboardButtons = {
  scoutDraft: gameState.offseasonActive && dateKey < 618,
  lottery: isDraftLotteryDay() && !lotteryComplete,
  combine: gameState.offseasonActive && dateKey === 619,
  draft: isDraftDay() && gameState.offseasonActive && !draftComplete,
  newSeason: isStartNewSeasonDay() && gameState.offseasonActive
};

  const debugInfo = {
    'Current Date': formatDate(gameState.currentDate),
    'Date Key': dateKey,
    'Season Label': gameState.seasonLabel,
    'Offseason Active': gameState.offseasonActive,
    'Playoffs Complete': gameState.playoffs?.playoffsComplete,
    'Season Ready for Rollover': gameState.seasonReadyForRollover,
    'Draft Lottery Complete': lotteryComplete,
    'Draft Complete': draftComplete,
    'New Season Ready': newSeasonReady,
    'Current Phase': getOffseasonPhaseLabel(),
    'Selected Team': selectedTeam?.name || 'None',
    'Roster Count': roster.length,
    'Free Agents': freeAgents.length,
    'Schedule Games': scheduleCount,
    'Dashboard Buttons Visible': {
      'Scout Draft': dashboardButtons.scoutDraft,
      'June 18 - Draft Lottery': dashboardButtons.lottery,
      'June 19 - Draft Combine': dashboardButtons.combine,
      'June 20 - Enter Draft': dashboardButtons.draft,
      'Sept 25 - Start New Season': dashboardButtons.newSeason
    }
  };

  console.clear();
  return debugInfo;
}

function automaticallyStartOffseasonAfterFinals() {
  if (!gameState || !gameState.started) return;
  if (gameState.offseasonActive === true) return;

  if (
    !gameState.playoffs ||
    gameState.playoffs.playoffsComplete !== true ||
    gameState.seasonReadyForRollover !== true
  ) {
    return;
  }

  if (!gameState.processedEvents) {
    gameState.processedEvents = {};
  }

  const completedSeasonLabel = gameState.seasonLabel;
  const processedKey = getOffseasonProcessedKey(completedSeasonLabel);

  if (gameState.processedEvents[processedKey]) return;

  const offseasonStartDate = new Date(gameState.currentDate);

  processOffseasonPlayerAgingContractsAndRetirements();

  gameState.offseasonActive = true;
  gameState.offseasonStarted = true;
  gameState.offseasonStartedForSeason = completedSeasonLabel;
  gameState.offseasonStartDate = new Date(offseasonStartDate);
  gameState.finalsCompletedDate = gameState.finalsCompletedDate || new Date(offseasonStartDate);

  gameState.processedEvents[processedKey] = true;

  gameState.currentDate = new Date(offseasonStartDate);
  gameState.seasonLabel = completedSeasonLabel;
  gameState.seasonReadyForRollover = false;

  gameState.draft = createDraftState(gameState.seasonStartYear);
  validateDraftClass();
  generateCurrentMockDraft("Offseason Mock");

  clearOldOffseasonUrgentMessages();

  ensureFreeAgents();
  updateAllPlayerLabelsAndTypes();
  ensureLeagueRostersAfterPlayerMovement();
  ensureRotation();
  ensureTeamStats();

  addInboxMessage(
    "Offseason Started",
    "The offseason has begun. Start preparing for the draft.",
    "event"
  );
}

/* ======================================================
   TEAM SCHEDULE REDESIGN
   Calendar → Team Schedule
====================================================== */

let currentTeamScheduleFilter = "full";
let suppressTeamScheduleAutoScroll = false;

const FCD_TEAM_SCHEDULE_TIMES = [
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
  "10:00 PM"
];

function escapeTeamScheduleHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeTeamScheduleAttr(value) {
  return escapeTeamScheduleHtml(value).replaceAll("`", "&#096;");
}

function getTeamScheduleStableIndex(key, length) {
  const text = String(key || "schedule-time");
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000003;
  }

  return Math.abs(hash) % Math.max(1, length);
}

function ensureTeamScheduleGameTimes() {
  if (!gameState || !Array.isArray(gameState.userSchedule)) return;

  for (let game of gameState.userSchedule) {
    if (!game) continue;

    if (!game.fcdGameTime) {
      const key = `${game.id || ""}_${game.date || ""}_${game.opponentId || ""}`;
      const index = getTeamScheduleStableIndex(key, FCD_TEAM_SCHEDULE_TIMES.length);

      game.fcdGameTime = FCD_TEAM_SCHEDULE_TIMES[index];
    }
  }
}

function getTeamScheduleTeamLogo(team) {
  if (!team) return "";

  return (
    team.logo ||
    team.logoPath ||
    team.image ||
    team.imagePath ||
    team.teamLogo ||
    ""
  );
}

function getTeamScheduleTeamInitials(team) {
  if (!team || !team.name) return "TM";

  return String(team.name)
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function getTeamSchedulePrimaryColor(team) {
  if (!team) return "#17408B";

  if (typeof getTeamPrimaryColorSafe === "function") {
    return getTeamPrimaryColorSafe(team);
  }

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.primaryColor ||
      colors.primary ||
      colors.mainColor ||
      team.primaryColor ||
      team.primary ||
      team.color ||
      "#17408B"
    );
  }

  return team.primaryColor || team.primary || team.color || "#17408B";
}

function getTeamScheduleSecondaryColor(team) {
  if (!team) return "#123b86";

  if (typeof getTeamSecondaryColorSafe === "function") {
    return getTeamSecondaryColorSafe(team);
  }

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.secondaryColor ||
      colors.secondary ||
      colors.accentColor ||
      team.secondaryColor ||
      team.secondary ||
      "#123b86"
    );
  }

  return team.secondaryColor || team.secondary || team.accentColor || "#123b86";
}

function getTeamScheduleDateParts(dateValue) {
  const date = new Date(dateValue);

  const day = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const dayNumber = date.getDate();

  return {
    day,
    dateText: `${month} ${dayNumber}`
  };
}

function getTeamScheduleGameType(game) {
  if (!game) return "regular";

  const competition = String(game.competition || "").toLowerCase();

  if (game.playoffGame || game.playInGame || competition.includes("playoff") || competition.includes("play-in") || competition.includes("finals")) {
    return "playoff";
  }

  if (game.cupGame || competition.includes("cup")) {
    return "cup";
  }

  return "regular";
}

function getTeamScheduleGameFilter(game) {
  const type = getTeamScheduleGameType(game);

  if (type === "cup") return "cup";
  if (type === "playoff") return "playoffs";

  return "regular";
}

function setTeamScheduleFilter(filter) {
  currentTeamScheduleFilter = filter || "full";
  suppressTeamScheduleAutoScroll = true;
  displaySchedule();
  suppressTeamScheduleAutoScroll = false;
}

function getFilteredTeamScheduleGames() {
  if (!gameState || !Array.isArray(gameState.userSchedule)) return [];

  return gameState.userSchedule
    .filter(game => game && game.date)
    .filter(game => typeof isCancelledFutureGame === "function" ? !isCancelledFutureGame(game) : true)
    .filter(game => {
      if (currentTeamScheduleFilter === "full") return true;
      return getTeamScheduleGameFilter(game) === currentTeamScheduleFilter;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getTeamScheduleStatusLabel(game) {
  if (!game) return "UPCOMING";

  if (game.played) return "FINAL";

  return "UPCOMING";
}

function getTeamScheduleResultLetter(game) {
  if (!game || !game.played) return "UP";

  const ourScore = Number(game.ourScore || 0);
  const opponentScore = Number(game.opponentScore || 0);

  if (ourScore > opponentScore) return "W";
  return "L";
}

function getTeamScheduleScoreText(game) {
  if (!game) return "--";

  if (!game.played) {
    return game.fcdGameTime || "7:30 PM";
  }

  const ourScore = Number(game.ourScore || 0);
  const opponentScore = Number(game.opponentScore || 0);

  if (ourScore || opponentScore) {
    return `${ourScore}-${opponentScore}`;
  }

  if (game.result) {
    return String(game.result).replace(/^W\s*/i, "").replace(/^L\s*/i, "");
  }

  return "FINAL";
}

function getTeamScheduleRecordSummary() {
  const games = Array.isArray(gameState?.userSchedule) ? gameState.userSchedule : [];
  const visibleGames = games.filter(game => game && !isCancelledFutureGame(game));
  const regularGames = visibleGames.filter(game =>
    getTeamScheduleGameFilter(game) === "regular" ||
    getTeamScheduleGameFilter(game) === "cup"
  );

  const homeGames = visibleGames.filter(game => game.home).length;
  const awayGames = visibleGames.filter(game => !game.home).length;
  const playedGames = visibleGames.filter(game => game.played).length;
  const nextGame = visibleGames.find(game => !game.played);

  return {
    total: visibleGames.length,
    regularTotal: regularGames.length,
    home: homeGames,
    away: awayGames,
    played: playedGames,
    nextGame
  };
}

function ensureTeamScheduleRedesignShell() {
  const screen = document.getElementById("schedule-screen");

  if (!screen) return;

  if (screen.dataset.teamScheduleRedesign === "true") return;

  screen.dataset.teamScheduleRedesign = "true";

  screen.innerHTML = `
    <div class="team-schedule-page">
      <div class="team-schedule-header">
        <div>
          <span>Calendar</span>
          <h2>Team Schedule</h2>
          <p id="team-schedule-summary-text">Full user team schedule.</p>
        </div>

        <div class="team-schedule-filter-bar">
          <button type="button" class="team-schedule-filter-button" data-filter="full" onclick="setTeamScheduleFilter('full')">Full Schedule</button>
          <button type="button" class="team-schedule-filter-button" data-filter="regular" onclick="setTeamScheduleFilter('regular')">Regular Season</button>
          <button type="button" class="team-schedule-filter-button" data-filter="cup" onclick="setTeamScheduleFilter('cup')">The Cup</button>
          <button type="button" class="team-schedule-filter-button" data-filter="playoffs" onclick="setTeamScheduleFilter('playoffs')">Playoffs</button>
        </div>
      </div>

      <div id="team-schedule-list" class="team-schedule-list"></div>
    </div>
  `;
}

function displayScheduleSummary() {
  const summary = getTeamScheduleRecordSummary();

  setText("schedule-total-games", summary.regularTotal);
  setText("schedule-home-games", summary.home);
  setText("schedule-away-games", summary.away);
  setText("schedule-games-played", `${summary.played} / ${summary.total}`);

  if (summary.nextGame) {
    setText("schedule-next-game", `${formatDate(summary.nextGame.date)} - ${summary.nextGame.home ? "Home vs" : "Away at"} ${summary.nextGame.opponentName}`);
  } else {
    setText("schedule-next-game", "No remaining games");
  }
}

function displaySchedule() {
  if (!gameState || !gameState.started) return;

  ensureTeamScheduleGameTimes();
  ensureTeamScheduleRedesignShell();
  displayScheduleSummary();

  const list = document.getElementById("team-schedule-list");
  if (!list) return;

  const summary = getTeamScheduleRecordSummary();
  const summaryText = document.getElementById("team-schedule-summary-text");

  if (summaryText) {
    summaryText.textContent = `${summary.played} of ${summary.total} games completed. Upcoming games show saved tip times.`;
  }

  const buttons = document.querySelectorAll(".team-schedule-filter-button");
  buttons.forEach(button => {
    button.classList.toggle("active", button.dataset.filter === currentTeamScheduleFilter);
  });

  const games = getFilteredTeamScheduleGames();

  if (!games.length) {
    list.innerHTML = `
      <div class="team-schedule-empty">
        No games scheduled yet.
      </div>
    `;
    return;
  }

  list.innerHTML = games.map(renderTeamScheduleGameCard).join("");

  const screen = document.getElementById("schedule-screen");

  if (
    screen &&
    screen.classList.contains("active-screen") &&
    !suppressTeamScheduleAutoScroll
  ) {
    setTimeout(scrollTeamScheduleToNextGame, 80);
  }
}

function scrollTeamScheduleToNextGame() {
  const next =
    document.querySelector(".team-schedule-game-card.next-up") ||
    document.querySelector(".team-schedule-game-card:not(.played)") ||
    document.querySelector(".team-schedule-game-card.played:last-child");

  if (!next) return;

  next.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function renderTeamScheduleLogo(team, label) {
  const logo = getTeamScheduleTeamLogo(team);

  if (logo) {
    return `
      <div class="team-schedule-logo-wrap">
        <img src="${escapeTeamScheduleAttr(logo)}" alt="${escapeTeamScheduleAttr(label || team?.name || "Team")}">
      </div>
    `;
  }

  return `
    <div class="team-schedule-logo-wrap fallback">
      ${escapeTeamScheduleHtml(getTeamScheduleTeamInitials(team))}
    </div>
  `;
}

function renderTeamScheduleGameCard(game) {
  const selectedTeam = getSelectedTeam ? getSelectedTeam() : getTeamById(gameState.selectedTeamId);
  const opponent = getTeamById(game.opponentId);
  const gameType = getTeamScheduleGameType(game);

  const dateParts = getTeamScheduleDateParts(game.date);
  const status = getTeamScheduleStatusLabel(game);
  const resultLetter = getTeamScheduleResultLetter(game);
  const isWin = resultLetter === "W";
  const isLoss = resultLetter === "L";
  const isUpcoming = !game.played;

  const selectedPrimary = getTeamSchedulePrimaryColor(selectedTeam);
  const selectedSecondary = getTeamScheduleSecondaryColor(selectedTeam);

  const accentColor = game.home ? selectedPrimary : selectedSecondary;
  const relationText = game.home ? "VS" : "AT";
  const scoreText = getTeamScheduleScoreText(game);

  const resultClass = isWin ? "win" : isLoss ? "loss" : "upcoming";
  const nextUp = isUpcoming && game === getTeamScheduleRecordSummary().nextGame;

  return `
    <article
      id="team-schedule-game-${escapeTeamScheduleAttr(game.id)}"
      class="team-schedule-game-card ${game.played ? "played" : "upcoming"} ${resultClass} ${gameType} ${nextUp ? "next-up" : ""} ${game.home ? "home" : "away"}"
      style="--team-schedule-accent:${accentColor};"
    >
      <div class="team-schedule-date-strip">
        <strong>${escapeTeamScheduleHtml(dateParts.day)}</strong>
        <span>|</span>
        <strong>${escapeTeamScheduleHtml(dateParts.dateText)}</strong>
        <span>|</span>
        <em>${escapeTeamScheduleHtml(status)}</em>
      </div>

      <div class="team-schedule-main-row">
        <div class="team-schedule-result-badge ${resultClass}">
          ${escapeTeamScheduleHtml(resultLetter)}
        </div>

        <div class="team-schedule-score">
          ${escapeTeamScheduleHtml(scoreText)}
        </div>

        ${renderTeamScheduleLogo(selectedTeam, selectedTeam?.name)}

        <div class="team-schedule-vs-text">
          ${escapeTeamScheduleHtml(relationText)}
        </div>

        ${renderTeamScheduleLogo(opponent, game.opponentName)}

        <div class="team-schedule-box-score-slot">
          ${
            game.played && game.boxScore
              ? `<button type="button" onclick="openBoxScore('${escapeTeamScheduleAttr(game.id)}')">Box Score</button>`
              : ``
          }
        </div>
      </div>
    </article>
  `;
}

/* ======================================================
   MASTER LEAGUE SCHEDULE SYSTEM
   Calendar → League Schedule
   Creates one real 82-game schedule for every team.
====================================================== */

var fcdLeagueScheduleViewDate = null;

var FCD_LEAGUE_SCHEDULE_TIMES = [
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
  "10:00 PM"
];

function fcdEscapeScheduleHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fcdEscapeScheduleAttr(value) {
  return fcdEscapeScheduleHtml(value).replaceAll("`", "&#096;");
}

function fcdDateKey(dateValue) {
  const date = new Date(dateValue);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fcdSameDate(a, b) {
  return fcdDateKey(a) === fcdDateKey(b);
}

function fcdStableHash(textValue) {
  const text = String(textValue || "fcd");

  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000003;
  }

  return Math.abs(hash);
}

function fcdStablePick(list, key) {
  if (!Array.isArray(list) || !list.length) return null;

  return list[fcdStableHash(key) % list.length];
}

function fcdGetLeagueScheduleTime(game) {
  if (!game) return "7:30 PM";

  if (!game.fcdGameTime) {
    game.fcdGameTime = fcdStablePick(
      FCD_LEAGUE_SCHEDULE_TIMES,
      `${game.id}_${game.homeTeamId}_${game.awayTeamId}_${game.date}`
    ) || "7:30 PM";
  }

  return game.fcdGameTime;
}

function fcdGetTeamLogo(team) {
  if (!team) return "";

  return (
    team.logo ||
    team.logoPath ||
    team.image ||
    team.imagePath ||
    team.teamLogo ||
    ""
  );
}

function fcdGetTeamNickname(team) {
  if (!team || !team.name) return "Team";

  if (team.nickname) return team.nickname;
  if (team.shortName && team.shortName !== team.name) return team.shortName;

  const pieces = String(team.name).trim().split(" ");

  return pieces[pieces.length - 1] || team.name;
}

function fcdGetTeamRecordText(team) {
  if (!team) return "0-0";

  return `${Number(team.wins || 0)}-${Number(team.losses || 0)}`;
}

function fcdGetTeamPrimary(team) {
  if (!team) return "#17408B";

  if (typeof getTeamPrimaryColorSafe === "function") {
    return getTeamPrimaryColorSafe(team);
  }

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.primaryColor ||
      colors.primary ||
      colors.mainColor ||
      team.primaryColor ||
      team.primary ||
      team.color ||
      "#17408B"
    );
  }

  return team.primaryColor || team.primary || team.color || "#17408B";
}

function fcdGetTeamSecondary(team) {
  if (!team) return "#123b86";

  if (typeof getTeamSecondaryColorSafe === "function") {
    return getTeamSecondaryColorSafe(team);
  }

  if (typeof getTeamColors === "function") {
    const colors = getTeamColors(team);

    return (
      colors.secondaryColor ||
      colors.secondary ||
      colors.accentColor ||
      team.secondaryColor ||
      team.secondary ||
      "#123b86"
    );
  }

  return team.secondaryColor || team.secondary || team.accentColor || "#123b86";
}

function fcdGetTeamsForScheduleGeneration() {
  if (gameState && Array.isArray(gameState.teams)) {
    return gameState.teams;
  }

  return Array.isArray(baseTeams) ? baseTeams : [];
}

function fcdPairKey(aId, bId) {
  const a = Number(aId);
  const b = Number(bId);

  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

function fcdCreateLeagueScheduleGame(options) {
  const homeTeam = getTeamById(options.homeTeamId) || getBaseTeamById(options.homeTeamId);
  const awayTeam = getTeamById(options.awayTeamId) || getBaseTeamById(options.awayTeamId);

  return {
    id: `lg_${options.round || "rs"}_${options.homeTeamId}_${options.awayTeamId}_${Date.now()}_${Math.random()}`,
    seasonLabel: gameState.seasonLabel,
    date: options.date ? new Date(options.date) : null,

    homeTeamId: Number(options.homeTeamId),
    awayTeamId: Number(options.awayTeamId),
    homeTeamName: homeTeam ? homeTeam.name : "Home",
    awayTeamName: awayTeam ? awayTeam.name : "Away",
    homeTeamAbbrev: homeTeam ? homeTeam.abbrev : "",
    awayTeamAbbrev: awayTeam ? awayTeam.abbrev : "",

    played: false,
    homeScore: null,
    awayScore: null,
    winnerId: null,
    loserId: null,

    competition: options.competition || "Regular Season",
    countsForRegularSeason: options.countsForRegularSeason !== false,
    cupGame: options.cupGame === true,
    playoffGame: options.playoffGame === true,
    playInGame: options.playInGame === true,
    seriesId: options.seriesId || null,
    parentSeriesId: options.parentSeriesId || null,
    gameNumber: options.gameNumber || null,
    topPerformers: [],

    // User-view fields get filled by syncUserScheduleFromLeagueSchedule().
    opponentId: null,
    opponentName: null,
    opponentAbbrev: null,
    home: null,
    result: null,
    ourScore: null,
    opponentScore: null
  };
}

function fcdBuildSameConferenceFourGamePairs(teams) {
  const fourGamePairs = new Set();

  for (let conference of ["East", "West"]) {
    const divisions = {};

    teams
      .filter(team => String(team.conference) === conference)
      .forEach(team => {
        const division = String(team.hiddenDivision || "Division");
        if (!divisions[division]) divisions[division] = [];
        divisions[division].push(team);
      });

    const divisionGroups = Object.values(divisions)
      .map(group => group.sort((a, b) => Number(a.id) - Number(b.id)));

    for (let aIndex = 0; aIndex < divisionGroups.length; aIndex++) {
      for (let bIndex = aIndex + 1; bIndex < divisionGroups.length; bIndex++) {
        const groupA = divisionGroups[aIndex];
        const groupB = divisionGroups[bIndex];
        const rotation = fcdStableHash(
          `${gameState.seasonLabel}_${conference}_${aIndex}_${bIndex}`
        ) % groupB.length;

        groupA.forEach((teamA, teamIndex) => {
          for (let offset = 0; offset < 3; offset++) {
            const teamB = groupB[(teamIndex + rotation + offset) % groupB.length];
            fourGamePairs.add(fcdPairKey(teamA.id, teamB.id));
          }
        });
      }
    }
  }

  return fourGamePairs;
}

function fcdChooseBalancedExtraHomeTeams(threeGamePairs) {
  const result = new Map();

  for (let conference of ["East", "West"]) {
    const pairs = threeGamePairs.filter(pair =>
      String(pair.teamA.conference) === conference
    );
    const outgoing = {};
    const remaining = {};

    pairs.forEach(pair => {
      outgoing[pair.teamA.id] = 0;
      outgoing[pair.teamB.id] = 0;
      remaining[pair.teamA.id] = Number(remaining[pair.teamA.id] || 0) + 1;
      remaining[pair.teamB.id] = Number(remaining[pair.teamB.id] || 0) + 1;
    });

    function assign(index) {
      if (index >= pairs.length) {
        return Object.values(outgoing).every(count => count === 2);
      }

      const pair = pairs[index];
      const choices = [pair.teamA.id, pair.teamB.id]
        .sort((a, b) => outgoing[a] - outgoing[b]);

      for (let homeId of choices) {
        const otherId = Number(homeId) === Number(pair.teamA.id)
          ? pair.teamB.id
          : pair.teamA.id;

        if (outgoing[homeId] >= 2) continue;

        outgoing[homeId]++;
        remaining[pair.teamA.id]--;
        remaining[pair.teamB.id]--;

        const feasible =
          outgoing[otherId] + remaining[otherId] >= 2 &&
          outgoing[homeId] + remaining[homeId] >= 2;

        if (feasible) {
          result.set(fcdPairKey(pair.teamA.id, pair.teamB.id), Number(homeId));
          if (assign(index + 1)) return true;
          result.delete(fcdPairKey(pair.teamA.id, pair.teamB.id));
        }

        outgoing[homeId]--;
        remaining[pair.teamA.id]++;
        remaining[pair.teamB.id]++;
      }

      return false;
    }

    if (!assign(0)) {
      console.warn(`Could not perfectly balance three-game home assignments for ${conference}.`);
    }
  }

  return result;
}

function fcdCreateRawLeagueMatchups() {
  const teams = fcdGetTeamsForScheduleGeneration();
  const fourGamePairs = fcdBuildSameConferenceFourGamePairs(teams);
  const games = [];
  const threeGamePairs = [];

  const homeCounts = {};
  const extraHomeCounts = {};

  teams.forEach(team => {
    homeCounts[team.id] = 0;
    extraHomeCounts[team.id] = 0;
  });

  function addGame(homeTeamId, awayTeamId) {
    homeCounts[homeTeamId]++;

    games.push(fcdCreateLeagueScheduleGame({
      homeTeamId,
      awayTeamId,
      competition: "Regular Season",
      countsForRegularSeason: true,
      cupGame: false,
      round: "rs"
    }));
  }

  function addSplitPair(teamA, teamB, count) {
    if (count === 4) {
      addGame(teamA.id, teamB.id);
      addGame(teamA.id, teamB.id);
      addGame(teamB.id, teamA.id);
      addGame(teamB.id, teamA.id);
      return;
    }

    if (count === 2) {
      addGame(teamA.id, teamB.id);
      addGame(teamB.id, teamA.id);
      return;
    }

    threeGamePairs.push({ teamA, teamB });
  }

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const teamA = teams[i];
      const teamB = teams[j];

      let count = 2;

      if (teamA.conference === teamB.conference) {
        if (teamA.hiddenDivision === teamB.hiddenDivision) {
          count = 4;
        } else if (fourGamePairs.has(fcdPairKey(teamA.id, teamB.id))) {
          count = 4;
        } else {
          count = 3;
        }
      }

      addSplitPair(teamA, teamB, count);
    }
  }

  const sortedThreeGamePairs = threeGamePairs
    .slice()
    .sort((a, b) => {
      return fcdStableHash(`${a.teamA.id}_${a.teamB.id}_${gameState.seasonLabel}`) -
        fcdStableHash(`${b.teamA.id}_${b.teamB.id}_${gameState.seasonLabel}`);
    });

  const balancedExtraHomes = fcdChooseBalancedExtraHomeTeams(sortedThreeGamePairs);

  for (let pair of sortedThreeGamePairs) {
    addGame(pair.teamA.id, pair.teamB.id);
    addGame(pair.teamB.id, pair.teamA.id);

    const extraHomeTeamId =
      balancedExtraHomes.get(fcdPairKey(pair.teamA.id, pair.teamB.id)) ||
      pair.teamA.id;

    const awayTeamId = Number(extraHomeTeamId) === Number(pair.teamA.id)
      ? pair.teamB.id
      : pair.teamA.id;

    addGame(extraHomeTeamId, awayTeamId);
    extraHomeCounts[extraHomeTeamId]++;
  }

  fcdBalanceLeagueScheduleHomeAway(games);

  return games;
}

function fcdBalanceLeagueScheduleHomeAway(games) {
  const homeCounts = {};

  fcdGetTeamsForScheduleGeneration().forEach(team => {
    homeCounts[team.id] = 0;
  });

  games.forEach(game => {
    homeCounts[game.homeTeamId] = Number(homeCounts[game.homeTeamId] || 0) + 1;
  });

  let changed = true;
  let safety = 0;

  while (changed && safety < 1000) {
    changed = false;
    safety++;

    for (let game of games) {
      const homeId = Number(game.homeTeamId);
      const awayId = Number(game.awayTeamId);

      if (homeCounts[homeId] > 41 && homeCounts[awayId] < 41) {
        game.homeTeamId = awayId;
        game.awayTeamId = homeId;

        const newHome = getTeamById(game.homeTeamId) || getBaseTeamById(game.homeTeamId);
        const newAway = getTeamById(game.awayTeamId) || getBaseTeamById(game.awayTeamId);

        game.homeTeamName = newHome ? newHome.name : "Home";
        game.awayTeamName = newAway ? newAway.name : "Away";
        game.homeTeamAbbrev = newHome ? newHome.abbrev : "";
        game.awayTeamAbbrev = newAway ? newAway.abbrev : "";

        homeCounts[homeId]--;
        homeCounts[awayId]++;
        changed = true;
      }
    }
  }

  const badHomeCounts = Object.entries(homeCounts).filter(([, count]) => Number(count) !== 41);

  if (badHomeCounts.length) {
    console.warn("League schedule home/away counts are not perfect yet:", badHomeCounts);
  }
}

function fcdGetLeagueCupGroupDates() {
  return [
    new Date(gameState.seasonStartYear, 10, 11),
    new Date(gameState.seasonStartYear, 10, 18),
    new Date(gameState.seasonStartYear, 10, 25),
    new Date(gameState.seasonStartYear, 11, 2),
    new Date(gameState.seasonStartYear, 11, 3)
  ];
}

function fcdCreateRoundRobinPairingsForFive(teamIds) {
  const teams = teamIds.slice();
  const bye = "__BYE__";

  if (teams.length % 2 === 1) {
    teams.push(bye);
  }

  const rounds = [];
  const working = teams.slice();
  const totalRounds = working.length - 1;

  for (let round = 0; round < totalRounds; round++) {
    const pairs = [];

    for (let i = 0; i < working.length / 2; i++) {
      const a = working[i];
      const b = working[working.length - 1 - i];

      if (a !== bye && b !== bye) {
        pairs.push([Number(a), Number(b)]);
      }
    }

    rounds.push(pairs);

    const fixed = working[0];
    const rest = working.slice(1);
    rest.unshift(rest.pop());
    working.splice(0, working.length, fixed, ...rest);
  }

  return rounds;
}

function fcdFindUnmarkedGameBetweenTeams(games, teamAId, teamBId) {
  return games.find(game => {
    if (game.cupGame) return false;

    const samePair =
      (Number(game.homeTeamId) === Number(teamAId) && Number(game.awayTeamId) === Number(teamBId)) ||
      (Number(game.homeTeamId) === Number(teamBId) && Number(game.awayTeamId) === Number(teamAId));

    return samePair;
  });
}

function fcdMarkCupGroupGamesOnLeagueSchedule(games) {
  if (!gameState.cup || !Array.isArray(gameState.cup.groups)) {
    gameState.cup = createCupState();
  }

  const cupDates = fcdGetLeagueCupGroupDates();

  if (!Array.isArray(gameState.cup.games)) {
    gameState.cup.games = [];
  }

  gameState.cup.games = gameState.cup.games.filter(game =>
    game && !String(game.round || "").toLowerCase().includes("group")
  );

  for (let group of gameState.cup.groups) {
    const rounds = fcdCreateRoundRobinPairingsForFive(group.teamIds);

    rounds.forEach((roundPairs, roundIndex) => {
      const date = cupDates[roundIndex] || cupDates[cupDates.length - 1];

      roundPairs.forEach(pair => {
        const game = fcdFindUnmarkedGameBetweenTeams(games, pair[0], pair[1]);

        if (!game) return;

        game.cupGame = true;
        game.competition = "The Cup Group";
        game.date = new Date(date);
        game.seriesId = `cup_group_${group.name}_${roundIndex}_${pair[0]}_${pair[1]}`;

        gameState.cup.games.push({
          id: game.id,
          leagueGameId: game.id,
          teamAId: game.homeTeamId,
          teamBId: game.awayTeamId,
          teamAScore: null,
          teamBScore: null,
          winnerId: null,
          loserId: null,
          date: new Date(date),
          round: "The Cup Group",
          played: false,
          countsForRegularSeason: true
        });
      });
    });
  }
}

function fcdGetMonthlyTargetKey(target) {
  return `${gameState.seasonStartYear + target.yearOffset}_${target.month}`;
}

function fcdCreateMonthlyRemainingTargets() {
  const targets = getRegularSeasonMonthlyTargets();
  const remaining = {};

  fcdGetTeamsForScheduleGeneration().forEach(team => {
    remaining[team.id] = {};

    targets.forEach(target => {
      remaining[team.id][fcdGetMonthlyTargetKey(target)] = Number(target.target || 0);
    });
  });

  return remaining;
}

function fcdIsLeagueNoGameDate(dateValue) {
  const date = new Date(dateValue);
  const electionDay = getElectionDayDate(gameState.seasonStartYear);
  const ncaaFinal = getNcaaChampionshipDate(gameState.seasonStartYear + 1);

  return (
    fcdSameDate(date, electionDay) ||
    fcdSameDate(date, ncaaFinal) ||
    isDateDuringAllStarBreak(date)
  );
}

function fcdIsReservedShowcaseDate(dateValue) {
  const date = new Date(dateValue);
  const year = gameState.seasonStartYear;

  return (
    fcdSameDate(date, new Date(year, 11, 25)) ||
    fcdSameDate(date, new Date(year + 1, 0, 16)) ||
    fcdSameDate(date, new Date(year + 1, 3, 15))
  );
}

function fcdDecrementMonthlyTarget(remaining, teamId, dateValue) {
  const date = new Date(dateValue);
  const key = `${date.getFullYear()}_${date.getMonth()}`;

  if (!remaining[teamId]) return;

  remaining[teamId][key] = Number(remaining[teamId][key] || 0) - 1;
}

function fcdGetDatePoolForTarget(target) {
  const dates = [];
  const year = gameState.seasonStartYear + target.yearOffset;
  const lastDay = Math.min(target.endDay, getDaysInMonthSafe(year, target.month));
  const current = new Date(year, target.month, target.startDay);

  while (current.getMonth() === target.month && current.getDate() <= lastDay) {
    if (!fcdIsLeagueNoGameDate(current) && !fcdIsReservedShowcaseDate(current)) {
      dates.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function fcdFindBestDateForLeagueGame(game, target, usedTeamsByDate, gamesByDate) {
  const pool = fcdGetDatePoolForTarget(target)
    .slice()
    .sort((a, b) => {
      const aKey = fcdDateKey(a);
      const bKey = fcdDateKey(b);
      const aLoad = Number(gamesByDate[aKey] || 0);
      const bLoad = Number(gamesByDate[bKey] || 0);

      if (aLoad !== bLoad) return aLoad - bLoad;

      return fcdStableHash(`${game.id}_${aKey}`) - fcdStableHash(`${game.id}_${bKey}`);
    });

  for (let date of pool) {
    const key = fcdDateKey(date);

    if (!usedTeamsByDate[key]) {
      usedTeamsByDate[key] = new Set();
    }

    const teamsUsed = usedTeamsByDate[key];
    const load = Number(gamesByDate[key] || 0);

    if (load >= 15) continue;
    if (teamsUsed.has(Number(game.homeTeamId))) continue;
    if (teamsUsed.has(Number(game.awayTeamId))) continue;

    return new Date(date);
  }

  return null;
}

function fcdGetRosterStrengthForSchedule(team) {
  const roster = gameState.rosters && Array.isArray(gameState.rosters[team.id])
    ? gameState.rosters[team.id]
    : [];

  const topPlayers = roster
    .map(player => Number(player.currentAbility || 0))
    .filter(value => value > 0)
    .sort((a, b) => b - a)
    .slice(0, 8);

  if (topPlayers.length) {
    return topPlayers.reduce((total, value) => total + value, 0) / topPlayers.length;
  }

  return Number(team.teamStrength || 0);
}

function fcdFindAvailableMatchup(games, teamAId, teamBId) {
  return games.find(game => {
    if (game.cupGame || game.fcdSpecialDate) return false;

    return (
      (Number(game.homeTeamId) === Number(teamAId) && Number(game.awayTeamId) === Number(teamBId)) ||
      (Number(game.homeTeamId) === Number(teamBId) && Number(game.awayTeamId) === Number(teamAId))
    );
  }) || null;
}

function fcdMoveMatchupToSpecialDate(game, date, label) {
  if (!game) return false;

  game.date = new Date(date);
  game.fcdSpecialDate = label;
  return true;
}

function fcdAssignChristmasGames(games) {
  const teams = fcdGetTeamsForScheduleGeneration()
    .slice()
    .sort((a, b) =>
      fcdGetRosterStrengthForSchedule(b) - fcdGetRosterStrengthForSchedule(a)
    )
    .slice(0, 10);
  const date = new Date(gameState.seasonStartYear, 11, 25);

  for (let index = 0; index < teams.length; index += 2) {
    const game = fcdFindAvailableMatchup(games, teams[index].id, teams[index + 1].id);

    if (!fcdMoveMatchupToSpecialDate(game, date, "Christmas Day")) {
      console.warn("Could not schedule Christmas matchup:", teams[index].name, teams[index + 1].name);
    }
  }
}

function fcdResolveRivalryTeam(name, usedIds) {
  const teams = fcdGetTeamsForScheduleGeneration();
  const normalized = String(name).toLowerCase();
  const city = normalized.split(" ")[0];

  return teams.find(team =>
    !usedIds.has(Number(team.id)) &&
    String(team.name).toLowerCase() === normalized
  ) || teams.find(team =>
    !usedIds.has(Number(team.id)) &&
    String(team.name).toLowerCase().startsWith(`${city} `)
  ) || null;
}

function fcdGetRivalryPairs() {
  const requestedPairs = [
    ["Boston Harbor", "New York Empire"],
    ["Philadelphia Liberty", "Brooklyn Bridges"],
    ["Toronto North", "Detroit Engines"],
    ["Cleveland Rockers", "Chicago Wind"],
    ["Indiana Racers", "Milwaukee Stags"],
    ["Miami Wave", "Orlando Stars"],
    ["Atlanta Flight", "Charlotte Swarm"],
    ["Washington Monuments", "New Orleans Krewe"],
    ["Dallas Wranglers", "Houston Launch"],
    ["San Antonio Marshals", "Oklahoma Storm"],
    ["Denver Peaks", "Utah Peaks"],
    ["Phoenix Firebirds", "Minnesota Frost"],
    ["Los Angeles Legends", "Los Angeles Surf"],
    ["Golden State Guardians", "Sacramento Royals"],
    ["Portland Pioneers", "Memphis Blues"]
  ];
  const usedIds = new Set();
  const pairs = [];

  requestedPairs.forEach(([aName, bName]) => {
    const teamA = fcdResolveRivalryTeam(aName, usedIds);
    if (teamA) usedIds.add(Number(teamA.id));

    const teamB = fcdResolveRivalryTeam(bName, usedIds);
    if (teamB) usedIds.add(Number(teamB.id));

    if (teamA && teamB) {
      pairs.push([teamA, teamB]);
    } else {
      console.warn("Rivalry team match failed:", aName, bName);
    }
  });

  const unusedTeams = fcdGetTeamsForScheduleGeneration()
    .filter(team => !usedIds.has(Number(team.id)));

  for (let index = 0; index + 1 < unusedTeams.length; index += 2) {
    pairs.push([unusedTeams[index], unusedTeams[index + 1]]);
  }

  return pairs;
}

function fcdAssignRivalsWeekGames(games) {
  const date = new Date(gameState.seasonStartYear + 1, 0, 16);

  fcdGetRivalryPairs().forEach(([teamA, teamB]) => {
    const game = fcdFindAvailableMatchup(games, teamA.id, teamB.id);

    if (!fcdMoveMatchupToSpecialDate(game, date, "Rivals Week")) {
      console.warn("Could not schedule rivalry matchup:", teamA.name, teamB.name);
    }
  });
}

function fcdFindFinalDayPairing(games, remainingTeams, pairs = []) {
  if (!remainingTeams.length) return pairs;

  const teamA = remainingTeams[0];

  for (let index = 1; index < remainingTeams.length; index++) {
    const teamB = remainingTeams[index];
    const game = fcdFindAvailableMatchup(games, teamA.id, teamB.id);
    if (!game) continue;

    const nextTeams = remainingTeams.filter((team, teamIndex) =>
      teamIndex !== 0 && teamIndex !== index
    );
    const result = fcdFindFinalDayPairing(games, nextTeams, [...pairs, [game]]);
    if (result) return result;
  }

  return null;
}

function fcdAssignFinalDayGames(games) {
  const teams = fcdGetTeamsForScheduleGeneration()
    .slice()
    .sort((a, b) => Number(a.id) - Number(b.id));
  const pairings = fcdFindFinalDayPairing(games, teams);
  const date = new Date(gameState.seasonStartYear + 1, 3, 15);

  if (!pairings || pairings.length !== 15) {
    console.warn("Could not create a complete 15-game final day.");
    return;
  }

  pairings.forEach(([game]) => {
    fcdMoveMatchupToSpecialDate(game, date, "Regular Season Final Day");
  });
}

function fcdAssignLeagueShowcaseDates(games) {
  fcdAssignChristmasGames(games);
  fcdAssignRivalsWeekGames(games);
  fcdAssignFinalDayGames(games);
  games.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function fcdAssignLeagueScheduleDates(games) {
  const targets = getRegularSeasonMonthlyTargets();
  const remaining = fcdCreateMonthlyRemainingTargets();
  const usedTeamsByDate = {};
  const gamesByDate = {};

  for (let game of games.filter(item => item.cupGame && item.date)) {
    const key = fcdDateKey(game.date);

    if (!usedTeamsByDate[key]) {
      usedTeamsByDate[key] = new Set();
    }

    usedTeamsByDate[key].add(Number(game.homeTeamId));
    usedTeamsByDate[key].add(Number(game.awayTeamId));
    gamesByDate[key] = Number(gamesByDate[key] || 0) + 1;

    fcdDecrementMonthlyTarget(remaining, game.homeTeamId, game.date);
    fcdDecrementMonthlyTarget(remaining, game.awayTeamId, game.date);
  }

  const normalGames = games
    .filter(game => !game.cupGame)
    .sort((a, b) => {
      return fcdStableHash(`${a.homeTeamId}_${a.awayTeamId}_${gameState.seasonLabel}`) -
        fcdStableHash(`${b.homeTeamId}_${b.awayTeamId}_${gameState.seasonLabel}`);
    });

  for (let game of normalGames) {
    const rankedTargets = targets
      .slice()
      .sort((a, b) => {
        const aKey = fcdGetMonthlyTargetKey(a);
        const bKey = fcdGetMonthlyTargetKey(b);

        const aScore =
          Number(remaining[game.homeTeamId]?.[aKey] || 0) +
          Number(remaining[game.awayTeamId]?.[aKey] || 0);

        const bScore =
          Number(remaining[game.homeTeamId]?.[bKey] || 0) +
          Number(remaining[game.awayTeamId]?.[bKey] || 0);

        if (bScore !== aScore) return bScore - aScore;

        return a.month - b.month;
      });

    let chosenDate = null;
    let chosenTarget = null;

    for (let target of rankedTargets) {
      chosenDate = fcdFindBestDateForLeagueGame(game, target, usedTeamsByDate, gamesByDate);

      if (chosenDate) {
        chosenTarget = target;
        break;
      }
    }

    if (!chosenDate) {
      for (let target of targets) {
        chosenDate = fcdFindBestDateForLeagueGame(game, target, usedTeamsByDate, gamesByDate);

        if (chosenDate) {
          chosenTarget = target;
          break;
        }
      }
    }

    if (!chosenDate) {
      const fallbackPool = getRegularSeasonDatePoolWithAllStarBreak();
      chosenDate = fallbackPool[fcdStableHash(game.id) % fallbackPool.length];
      chosenTarget = targets.find(target =>
        target.month === chosenDate.getMonth() &&
        gameState.seasonStartYear + target.yearOffset === chosenDate.getFullYear()
      );
    }

    game.date = new Date(chosenDate);

    const key = fcdDateKey(chosenDate);

    if (!usedTeamsByDate[key]) {
      usedTeamsByDate[key] = new Set();
    }

    usedTeamsByDate[key].add(Number(game.homeTeamId));
    usedTeamsByDate[key].add(Number(game.awayTeamId));
    gamesByDate[key] = Number(gamesByDate[key] || 0) + 1;

    if (chosenTarget) {
      fcdDecrementMonthlyTarget(remaining, game.homeTeamId, chosenDate);
      fcdDecrementMonthlyTarget(remaining, game.awayTeamId, chosenDate);
    }
  }

  games.sort((a, b) => new Date(a.date) - new Date(b.date));

  games.forEach(game => {
    fcdGetLeagueScheduleTime(game);
  });

  fcdAssignLeagueShowcaseDates(games);
}

function fcdSetUserViewFieldsOnLeagueGame(game) {
  if (!game || !gameState) return game;

  const userId = Number(gameState.selectedTeamId);
  const isHome = Number(game.homeTeamId) === userId;
  const isAway = Number(game.awayTeamId) === userId;

  if (!isHome && !isAway) return game;

  const opponentId = isHome ? game.awayTeamId : game.homeTeamId;
  const opponent = getTeamById(opponentId) || getBaseTeamById(opponentId);

  game.opponentId = Number(opponentId);
  game.opponentName = opponent ? opponent.name : "Opponent";
  game.opponentAbbrev = opponent ? opponent.abbrev : "";
  game.home = isHome;

  if (game.played) {
    game.ourScore = isHome ? game.homeScore : game.awayScore;
    game.opponentScore = isHome ? game.awayScore : game.homeScore;
    game.result = `${Number(game.winnerId) === userId ? "W" : "L"} ${game.ourScore}-${game.opponentScore}`;
  }

  return game;
}

function syncUserScheduleFromLeagueSchedule() {
  if (!gameState || !Array.isArray(gameState.leagueSchedule)) return [];

  const userId = Number(gameState.selectedTeamId);

  gameState.userSchedule = gameState.leagueSchedule
    .filter(game =>
      Number(game.homeTeamId) === userId ||
      Number(game.awayTeamId) === userId
    )
    .map(game => fcdSetUserViewFieldsOnLeagueGame(game))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return gameState.userSchedule;
}

function validateLeagueSchedule82() {
  if (!gameState || !Array.isArray(gameState.leagueSchedule)) return;

  const counts = {};
  const homeCounts = {};

  gameState.teams.forEach(team => {
    counts[team.id] = 0;
    homeCounts[team.id] = 0;
  });

  gameState.leagueSchedule.forEach(game => {
    if (game.countsForRegularSeason === false) return;
    if (game.playoffGame || game.playInGame) return;

    counts[game.homeTeamId]++;
    counts[game.awayTeamId]++;
    homeCounts[game.homeTeamId]++;
  });

  const badCounts = Object.entries(counts).filter(([, count]) => Number(count) !== 82);
  const badHomeCounts = Object.entries(homeCounts).filter(([, count]) => Number(count) !== 41);

  console.log("League schedule validation:");
  console.log("Total league games:", gameState.leagueSchedule.length);
  console.log("Bad 82-game counts:", badCounts);
  console.log("Bad 41-home-game counts:", badHomeCounts);

  if (badCounts.length) console.warn("Some teams do not have exactly 82 games:", badCounts);
  if (badHomeCounts.length) console.warn("Some teams do not have exactly 41 home games:", badHomeCounts);

  const report = getLeagueScheduleValidationReport();
  console.log("League schedule rules:", report);

  if (report.duplicateTeamDates.length) {
    console.warn("Teams have multiple games on the same date:", report.duplicateTeamDates);
  }

  if (report.electionDayGames || report.allStarBreakGames || report.ncaaChampionshipGames) {
    console.warn("Games were found on a league blackout date:", report);
  }

  if (report.christmasGames !== 5 || report.rivalsWeekGames !== 15 || report.finalDayGames !== 15) {
    console.warn("A showcase date has the wrong game count:", report);
  }
}

function getLeagueScheduleValidationReport() {
  if (!gameState || !Array.isArray(gameState.leagueSchedule)) return null;

  const games = gameState.leagueSchedule;
  const gamesByDate = {};
  const teamsByDate = {};
  const year = gameState.seasonStartYear;
  const allStar = getAllStarBreakDatesForSeason(year);

  games.forEach(game => {
    const dateKey = fcdDateKey(game.date);
    gamesByDate[dateKey] = Number(gamesByDate[dateKey] || 0) + 1;
    if (!teamsByDate[dateKey]) teamsByDate[dateKey] = [];
    teamsByDate[dateKey].push(Number(game.homeTeamId), Number(game.awayTeamId));
  });

  const duplicateTeamDates = Object.entries(teamsByDate)
    .filter(([, teamIds]) => new Set(teamIds).size !== teamIds.length)
    .map(([dateKey]) => dateKey);

  const countGamesInRange = (start, end) => games.filter(game => {
    const date = new Date(game.date);
    return date >= start && date <= end;
  }).length;

  return {
    totalLeagueGames: games.length,
    userGames: Array.isArray(gameState.userSchedule) ? gameState.userSchedule.length : 0,
    duplicateTeamDates,
    electionDayGames: Number(gamesByDate[fcdDateKey(getElectionDayDate(year))] || 0),
    allStarBreakGames: countGamesInRange(allStar.start, allStar.end),
    ncaaChampionshipGames: Number(gamesByDate[fcdDateKey(getNcaaChampionshipDate(year + 1))] || 0),
    christmasGames: Number(gamesByDate[fcdDateKey(new Date(year, 11, 25))] || 0),
    rivalsWeekGames: Number(gamesByDate[fcdDateKey(new Date(year + 1, 0, 16))] || 0),
    finalDayGames: Number(gamesByDate[fcdDateKey(new Date(year + 1, 3, 15))] || 0),
    cupDates: games
      .filter(game => game.cupGame)
      .reduce((totals, game) => {
        const dateKey = fcdDateKey(game.date);
        totals[dateKey] = Number(totals[dateKey] || 0) + 1;
        return totals;
      }, {})
  };
}

function initializeLeagueScheduleForSeason() {
  if (!gameState || !gameState.started) return [];

  if (!gameState.cup) {
    gameState.cup = createCupState();
  }

  const games = fcdCreateRawLeagueMatchups();

  fcdMarkCupGroupGamesOnLeagueSchedule(games);
  fcdAssignLeagueScheduleDates(games);

  gameState.leagueSchedule = games;
  gameState.leagueScheduleMeta = {
    seasonLabel: gameState.seasonLabel,
    seasonStartYear: gameState.seasonStartYear,
    generatedAt: new Date().toISOString(),
    version: 2
  };

  syncUserScheduleFromLeagueSchedule();
  validateLeagueSchedule82();

  return gameState.leagueSchedule;
}

function prepareLeagueScheduleRelease(targetSeasonStartYear) {
  if (!gameState || !gameState.started) return null;

  const targetYear = Number(targetSeasonStartYear);

  if (
    gameState.pendingLeagueSchedule &&
    Number(gameState.pendingLeagueSchedule.seasonStartYear) === targetYear
  ) {
    return gameState.pendingLeagueSchedule;
  }

  const activeState = {
    seasonStartYear: gameState.seasonStartYear,
    seasonLabel: gameState.seasonLabel,
    cup: gameState.cup,
    leagueSchedule: gameState.leagueSchedule,
    leagueScheduleMeta: gameState.leagueScheduleMeta,
    userSchedule: gameState.userSchedule
  };

  gameState.seasonStartYear = targetYear;
  gameState.seasonLabel = getSeasonLabel(targetYear);
  gameState.cup = createCupState();
  gameState.leagueSchedule = [];
  gameState.leagueScheduleMeta = null;
  gameState.userSchedule = [];

  initializeLeagueScheduleForSeason();

  const releasedSchedule = {
    seasonStartYear: targetYear,
    seasonLabel: gameState.seasonLabel,
    generatedAt: new Date().toISOString(),
    leagueSchedule: gameState.leagueSchedule,
    leagueScheduleMeta: gameState.leagueScheduleMeta,
    cup: gameState.cup
  };

  gameState.seasonStartYear = activeState.seasonStartYear;
  gameState.seasonLabel = activeState.seasonLabel;
  gameState.cup = activeState.cup;
  gameState.leagueSchedule = activeState.leagueSchedule;
  gameState.leagueScheduleMeta = activeState.leagueScheduleMeta;
  gameState.userSchedule = activeState.userSchedule;
  gameState.pendingLeagueSchedule = releasedSchedule;

  return releasedSchedule;
}

function ensureLeagueScheduleForCurrentSeason() {
  if (!gameState || !gameState.started) return [];

  const needsSchedule =
    !Array.isArray(gameState.leagueSchedule) ||
    gameState.leagueSchedule.length < 1000 ||
    !gameState.leagueScheduleMeta ||
    gameState.leagueScheduleMeta.seasonLabel !== gameState.seasonLabel ||
    (
      Number(gameState.leagueScheduleMeta.version || 0) < 2 &&
      !gameState.leagueSchedule.some(game => game.played)
    );

  if (needsSchedule) {
    return initializeLeagueScheduleForSeason();
  }

  for (let game of gameState.leagueSchedule) {
    game.date = new Date(game.date);
    fcdGetLeagueScheduleTime(game);
  }

  syncUserScheduleFromLeagueSchedule();

  return gameState.leagueSchedule;
}

/* Replace old user-only schedule creator with master schedule version. */
function createRealisticUserSchedule(selectedTeamId) {
  if (!gameState || !gameState.started) return [];

  gameState.selectedTeamId = Number(selectedTeamId || gameState.selectedTeamId);

  ensureLeagueScheduleForCurrentSeason();

  return syncUserScheduleFromLeagueSchedule();
}

/* Old Cup assignment should not duplicate games once master league schedule exists. */
function assignCupGamesToUserSchedule() {
  if (gameState && Array.isArray(gameState.leagueSchedule) && gameState.leagueSchedule.length) {
    syncUserScheduleFromLeagueSchedule();
    return;
  }
}

/* ======================================================
   DAILY LEAGUE GAME SIMULATION FROM MASTER SCHEDULE
====================================================== */

function getTodayUserGames() {
  ensureLeagueScheduleForCurrentSeason();

  return (gameState.userSchedule || []).filter(game =>
    game &&
    !game.played &&
    !isCancelledFutureGame(game) &&
    fcdSameDate(game.date, gameState.currentDate)
  );
}

function getNextGame() {
  ensureLeagueScheduleForCurrentSeason();

  return (gameState.userSchedule || [])
    .filter(game => game && !game.played && !isCancelledFutureGame(game))
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

function fcdFindLeagueGameById(gameId) {
  if (!gameState || !Array.isArray(gameState.leagueSchedule)) return null;

  return gameState.leagueSchedule.find(game => String(game.id) === String(gameId)) || null;
}

function fcdUpdateCupGroupRecordFromLeagueGame(game) {
  if (!game || !game.cupGame || game.competition !== "The Cup Group") return;
  if (game.cupStatsApplied) return;

  if (typeof updateCupStats === "function") {
    updateCupStats(game.homeTeamId, game.awayTeamId, game.homeScore, game.awayScore);
    game.cupStatsApplied = true;
  }

  if (gameState.cup && Array.isArray(gameState.cup.games)) {
    const linkedCupGame = gameState.cup.games.find(item =>
      String(item.leagueGameId || item.id) === String(game.id)
    );

    if (linkedCupGame) {
      linkedCupGame.teamAScore = game.homeScore;
      linkedCupGame.teamBScore = game.awayScore;
      linkedCupGame.winnerId = game.winnerId;
      linkedCupGame.loserId = game.loserId;
      linkedCupGame.played = true;
    }
  }
}

function fcdSimulateLeagueScheduleGame(game, options = {}) {
  if (!game || game.played) return null;

  const homeTeam = getTeamById(game.homeTeamId);
  const awayTeam = getTeamById(game.awayTeamId);

  if (!homeTeam || !awayTeam) return null;

  const result = simTeamVsTeam(homeTeam, awayTeam, {
    homeTeamId: homeTeam.id
  });

  game.homeScore = result.scoreA;
  game.awayScore = result.scoreB;
  game.winnerId = result.winnerId;
  game.loserId = Number(result.winnerId) === Number(homeTeam.id) ? awayTeam.id : homeTeam.id;
  game.played = true;

  if (typeof applyEnergyLossForCompletedGame === "function") {
    applyEnergyLossForCompletedGame(homeTeam.id, awayTeam.id);
  }

  if (typeof rollInjuriesForCompletedGame === "function") {
    rollInjuriesForCompletedGame(homeTeam.id, awayTeam.id);
  }

  let performers = null;

  if (typeof generatePlayerStatsForGame === "function") {
    performers = generatePlayerStatsForGame(
      homeTeam.id,
      awayTeam.id,
      game.homeScore,
      game.awayScore
    );
  }

  if (game.countsForRegularSeason !== false && !game.recordApplied) {
    applyRegularSeasonResult(homeTeam, awayTeam, game.winnerId);
    game.recordApplied = true;
  }

  fcdUpdateCupGroupRecordFromLeagueGame(game);

  if (Number(game.homeTeamId) === Number(gameState.selectedTeamId) || Number(game.awayTeamId) === Number(gameState.selectedTeamId)) {
    fcdSetUserViewFieldsOnLeagueGame(game);

    if (performers && typeof createBoxScoreObject === "function") {
      const selectedTeam = getSelectedTeam();
      const opponent = getTeamById(game.opponentId);
      const selectedIsHome = Number(game.homeTeamId) === Number(gameState.selectedTeamId);

      const selectedLines = selectedIsHome
        ? performers.teamAStats.playerLines
        : performers.teamBStats.playerLines;

      const opponentLines = selectedIsHome
        ? performers.teamBStats.playerLines
        : performers.teamAStats.playerLines;

      game.topPerformers = selectedIsHome
        ? performers.teamAStats.playerLines.slice(0, 3)
        : performers.teamBStats.playerLines.slice(0, 3);

      game.boxScore = createBoxScoreObject(
        game,
        selectedTeam,
        opponent,
        selectedLines,
        opponentLines
      );
    }
  }

  return {
    result,
    performers
  };
}

function playUserScheduleGame(game) {
  if (!game || game.played) return;

  ensureLeagueScheduleForCurrentSeason();

  const leagueGame = fcdFindLeagueGameById(game.id) || game;
  const simResult = fcdSimulateLeagueScheduleGame(leagueGame, { userGame: true });

  if (!simResult) return;

  fcdSetUserViewFieldsOnLeagueGame(leagueGame);
  syncUserScheduleFromLeagueSchedule();

  const selectedTeam = getSelectedTeam();
  const opponent = getTeamById(leagueGame.opponentId);
  const userWon = Number(leagueGame.winnerId) === Number(gameState.selectedTeamId);

  const topPerformerText = typeof formatTopPerformersForInbox === "function"
    ? formatTopPerformersForInbox(leagueGame.topPerformers || [])
    : "";

  addInboxMessage(
    "Game Result",
    userWon
      ? `${selectedTeam.name} defeated ${opponent.name}, ${leagueGame.ourScore}-${leagueGame.opponentScore}.${topPerformerText}`
      : `${selectedTeam.name} lost to ${opponent.name}, ${leagueGame.ourScore}-${leagueGame.opponentScore}.${topPerformerText}`,
    userWon ? "match-win" : "match-loss",
    false,
    "box-score"
  );
}

function processOtherTeamGamesToday() {
  if (!gameState || !gameState.started) return;

  ensureLeagueScheduleForCurrentSeason();

  const currentDate = new Date(gameState.currentDate);

  if (currentDate < new Date(gameState.seasonStartYear, 9, 22)) return;
  if (currentDate > new Date(gameState.seasonStartYear + 1, 3, 15)) return;

  const key = `league_schedule_games_${formatDateKey(currentDate)}`;

  if (!gameState.processedEvents) {
    gameState.processedEvents = {};
  }

  if (gameState.processedEvents[key]) return;

  const userId = Number(gameState.selectedTeamId);

  const gamesToday = gameState.leagueSchedule.filter(game =>
    game &&
    !game.played &&
    fcdSameDate(game.date, currentDate) &&
    Number(game.homeTeamId) !== userId &&
    Number(game.awayTeamId) !== userId
  );

  for (let game of gamesToday) {
    fcdSimulateLeagueScheduleGame(game);
  }

  gameState.processedEvents[key] = true;
  syncUserScheduleFromLeagueSchedule();
}

/* Stop old random Cup group generator from duplicating Cup games. */
function simulateOtherCupGroupGamesToday() {
  return;
}

/* ======================================================
   TEAM SCHEDULE V3 — READS MASTER LEAGUE SCHEDULE
====================================================== */

var fcdTeamScheduleFilterV3 = "full";
var fcdTeamScheduleSuppressScrollV3 = false;

function setTeamScheduleFilterV3(filter) {
  fcdTeamScheduleFilterV3 = filter || "full";
  fcdTeamScheduleSuppressScrollV3 = true;
  displayTeamScheduleRedesignV3();
  fcdTeamScheduleSuppressScrollV3 = false;
}

function fcdScheduleGameType(game) {
  if (!game) return "regular";

  const competition = String(game.competition || "").toLowerCase();

  if (game.playoffGame || game.playInGame || competition.includes("playoff") || competition.includes("play-in") || competition.includes("finals")) {
    return "playoff";
  }

  if (game.cupGame || competition.includes("cup")) {
    return "cup";
  }

  return "regular";
}

function fcdScheduleGameFilter(game) {
  const type = fcdScheduleGameType(game);

  if (type === "cup") return "cup";
  if (type === "playoff") return "playoffs";

  return "regular";
}

function fcdGetUserLeagueGamesForSchedule() {
  ensureLeagueScheduleForCurrentSeason();

  const userId = Number(gameState.selectedTeamId);

  return (gameState.leagueSchedule || [])
    .filter(game =>
      Number(game.homeTeamId) === userId ||
      Number(game.awayTeamId) === userId
    )
    .map(game => fcdSetUserViewFieldsOnLeagueGame(game))
    .filter(game => {
      if (fcdTeamScheduleFilterV3 === "full") return true;
      return fcdScheduleGameFilter(game) === fcdTeamScheduleFilterV3;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function fcdGetTeamScheduleDateParts(dateValue) {
  const date = new Date(dateValue);

  return {
    day: date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
    dateText: `${date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} ${date.getDate()}`
  };
}

function fcdRenderTeamScheduleLogo(team) {
  const logo = fcdGetTeamLogo(team);

  if (logo) {
    return `
      <div class="team-schedule-logo-wrap">
        <img src="${fcdEscapeScheduleAttr(logo)}" alt="${fcdEscapeScheduleAttr(team.name)}">
      </div>
    `;
  }

  return `
    <div class="team-schedule-logo-wrap fallback">
      ${fcdEscapeScheduleHtml(fcdGetTeamNickname(team).slice(0, 3).toUpperCase())}
    </div>
  `;
}

function fcdRenderTeamScheduleCardV3(game) {
  const selectedTeam = getSelectedTeam();
  const opponent = getTeamById(game.opponentId);
  const type = fcdScheduleGameType(game);
  const dateParts = fcdGetTeamScheduleDateParts(game.date);

  const resultLetter = !game.played
    ? "UP"
    : Number(game.winnerId) === Number(gameState.selectedTeamId)
    ? "W"
    : "L";

  const resultClass = resultLetter === "W" ? "win" : resultLetter === "L" ? "loss" : "upcoming";
  const accent = game.home ? fcdGetTeamPrimary(selectedTeam) : fcdGetTeamSecondary(selectedTeam);
  const status = game.played ? "FINAL" : "UPCOMING";
  const relation = game.home ? "VS" : "AT";

  const scoreText = game.played
    ? `${game.ourScore}-${game.opponentScore}`
    : fcdGetLeagueScheduleTime(game);

  return `
    <article
      class="team-schedule-game-card ${game.played ? "played" : "upcoming"} ${resultClass} ${type} ${game.home ? "home" : "away"}"
      style="--team-schedule-accent:${accent};"
    >
      <div class="team-schedule-date-strip">
        <strong>${fcdEscapeScheduleHtml(dateParts.day)}</strong>
        <span>|</span>
        <strong>${fcdEscapeScheduleHtml(dateParts.dateText)}</strong>
        <span>|</span>
        <em>${fcdEscapeScheduleHtml(status)}</em>
      </div>

      <div class="team-schedule-main-row">
        <div class="team-schedule-result-badge ${resultClass}">
          ${fcdEscapeScheduleHtml(resultLetter)}
        </div>

        <div class="team-schedule-score">
          ${fcdEscapeScheduleHtml(scoreText)}
        </div>

        ${fcdRenderTeamScheduleLogo(selectedTeam)}

        <div class="team-schedule-vs-text">${relation}</div>

        ${fcdRenderTeamScheduleLogo(opponent)}

        <div class="team-schedule-box-score-slot">
          ${
            game.played && game.boxScore
              ? `<button type="button" onclick="openBoxScore('${fcdEscapeScheduleAttr(game.id)}')">Box Score</button>`
              : ``
          }
        </div>
      </div>
    </article>
  `;
}

function fcdScrollTeamScheduleToNextV3() {
  const next =
    document.querySelector(".team-schedule-game-card.upcoming") ||
    document.querySelector(".team-schedule-game-card.played:last-child");

  if (!next) return;

  next.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function displayTeamScheduleRedesignV3() {
  if (!gameState || !gameState.started) return;

  const screen = document.getElementById("schedule-screen");
  if (!screen) return;

  ensureLeagueScheduleForCurrentSeason();

  const allUserGames = (gameState.userSchedule || []).slice();
  const shownGames = fcdGetUserLeagueGamesForSchedule();
  const played = allUserGames.filter(game => game.played).length;

  screen.innerHTML = `
    <div class="team-schedule-page">
      <div class="team-schedule-header">
        <div>
          <span>Calendar</span>
          <h2>Team Schedule</h2>
          <p>${played} of ${allUserGames.length} games completed. This page reads from the master league schedule.</p>
        </div>

        <div class="team-schedule-filter-bar">
          <button type="button" class="team-schedule-filter-button ${fcdTeamScheduleFilterV3 === "full" ? "active" : ""}" onclick="setTeamScheduleFilterV3('full')">Full Schedule</button>
          <button type="button" class="team-schedule-filter-button ${fcdTeamScheduleFilterV3 === "regular" ? "active" : ""}" onclick="setTeamScheduleFilterV3('regular')">Regular Season</button>
          <button type="button" class="team-schedule-filter-button ${fcdTeamScheduleFilterV3 === "cup" ? "active" : ""}" onclick="setTeamScheduleFilterV3('cup')">The Cup</button>
          <button type="button" class="team-schedule-filter-button ${fcdTeamScheduleFilterV3 === "playoffs" ? "active" : ""}" onclick="setTeamScheduleFilterV3('playoffs')">Playoffs</button>
        </div>
      </div>

      <div class="team-schedule-list">
        ${
          shownGames.length
            ? shownGames.map(fcdRenderTeamScheduleCardV3).join("")
            : `<div class="team-schedule-empty">No games scheduled yet.</div>`
        }
      </div>
    </div>
  `;

  if (screen.classList.contains("active-screen") && !fcdTeamScheduleSuppressScrollV3) {
    setTimeout(fcdScrollTeamScheduleToNextV3, 80);
  }
}

/* ======================================================
   CALENDAR → LEAGUE SCHEDULE SCREEN
====================================================== */

function setLeagueScheduleViewDate(offsetDays) {
  if (!fcdLeagueScheduleViewDate) {
    fcdLeagueScheduleViewDate = new Date(gameState.currentDate);
  }

  fcdLeagueScheduleViewDate.setDate(fcdLeagueScheduleViewDate.getDate() + Number(offsetDays || 0));

  displayLeagueScheduleScreen();
}

function resetLeagueScheduleViewToCurrentDate() {
  fcdLeagueScheduleViewDate = new Date(gameState.currentDate);
  displayLeagueScheduleScreen();
}

function fcdGetAllDisplayLeagueGames() {
  ensureLeagueScheduleForCurrentSeason();

  const leagueGames = Array.isArray(gameState.leagueSchedule)
    ? gameState.leagueSchedule
    : [];

  const cupKnockoutGames = [];

  if (gameState.cup && Array.isArray(gameState.cup.games)) {
    for (let cupGame of gameState.cup.games) {
      if (String(cupGame.round || "").toLowerCase().includes("group")) continue;
      if (!cupGame.teamAId || !cupGame.teamBId) continue;

      cupKnockoutGames.push({
        id: cupGame.id,
        date: new Date(cupGame.date),
        homeTeamId: cupGame.teamAId,
        awayTeamId: cupGame.teamBId,
        homeScore: cupGame.teamAScore,
        awayScore: cupGame.teamBScore,
        winnerId: cupGame.winnerId,
        loserId: cupGame.loserId,
        played: cupGame.played,
        competition: cupGame.round || "The Cup",
        countsForRegularSeason: cupGame.countsForRegularSeason !== false,
        cupGame: true,
        playoffGame: false,
        playInGame: false
      });
    }
  }

  return leagueGames.concat(cupKnockoutGames);
}

function fcdGetLeagueGamesForDate(dateValue) {
  const key = fcdDateKey(dateValue);

  return fcdGetAllDisplayLeagueGames()
    .filter(game => game && game.date && fcdDateKey(game.date) === key)
    .sort((a, b) => {
      if (a.played !== b.played) return a.played ? -1 : 1;
      return Number(a.homeTeamId || 0) - Number(b.homeTeamId || 0);
    });
}

function fcdGetLeagueScheduleDateTitle(dateValue) {
  const date = new Date(dateValue);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function fcdRenderLeagueScheduleLogo(team) {
  const logo = fcdGetTeamLogo(team);

  if (logo) {
    return `
      <div class="league-schedule-team-logo">
        <img src="${fcdEscapeScheduleAttr(logo)}" alt="${fcdEscapeScheduleAttr(team.name)}">
      </div>
    `;
  }

  return `
    <div class="league-schedule-team-logo fallback">
      ${fcdEscapeScheduleHtml(fcdGetTeamNickname(team).slice(0, 3).toUpperCase())}
    </div>
  `;
}

function fcdRenderLeagueScheduleTeam(team, side, isWinner) {
  return `
    <div class="league-schedule-team ${side} ${isWinner ? "winner" : ""}">
      ${fcdRenderLeagueScheduleLogo(team)}
      <strong>${fcdEscapeScheduleHtml(fcdGetTeamNickname(team))}</strong>
      <span>${fcdEscapeScheduleHtml(fcdGetTeamRecordText(team))}</span>
    </div>
  `;
}

function fcdRenderLeagueScheduleGameCard(game) {
  const awayTeam = getTeamById(game.awayTeamId) || getBaseTeamById(game.awayTeamId);
  const homeTeam = getTeamById(game.homeTeamId) || getBaseTeamById(game.homeTeamId);
  const type = fcdScheduleGameType(game);

  const isFinal = game.played === true;
  const awayScore = Number(game.awayScore || 0);
  const homeScore = Number(game.homeScore || 0);

  const awayWinner = isFinal && awayScore > homeScore;
  const homeWinner = isFinal && homeScore > awayScore;

  const centerText = isFinal
    ? `${awayScore} - ${homeScore}`
    : fcdGetLeagueScheduleTime(game);

  const statusText = isFinal ? "Final" : "Upcoming";

  return `
    <article class="league-schedule-game-card ${type} ${isFinal ? "final" : "upcoming"}">
      <div class="league-schedule-card-main">
        ${fcdRenderLeagueScheduleTeam(awayTeam, "away", awayWinner)}

        <div class="league-schedule-center">
          <strong>${fcdEscapeScheduleHtml(centerText)}</strong>
          <span>${fcdEscapeScheduleHtml(statusText)}</span>
        </div>

        ${fcdRenderLeagueScheduleTeam(homeTeam, "home", homeWinner)}
      </div>

      <div class="league-schedule-card-footer">
        ${fcdEscapeScheduleHtml(game.competition || "Regular Season")}
      </div>
    </article>
  `;
}

function displayLeagueScheduleScreen() {
  const root = document.getElementById("league-schedule-root");

  if (!root || !gameState || !gameState.started) return;

  ensureLeagueScheduleForCurrentSeason();

  if (!fcdLeagueScheduleViewDate) {
    fcdLeagueScheduleViewDate = new Date(gameState.currentDate);
  }

  const games = fcdGetLeagueGamesForDate(fcdLeagueScheduleViewDate);

  root.innerHTML = `
    <div class="league-schedule-page">
      <div class="league-schedule-header">
        <button type="button" onclick="setLeagueScheduleViewDate(-1)">‹</button>

        <div>
          <span>League Schedule</span>
          <h2>${fcdEscapeScheduleHtml(fcdGetLeagueScheduleDateTitle(fcdLeagueScheduleViewDate))}</h2>
          <p>${games.length ? `${games.length} game${games.length === 1 ? "" : "s"} scheduled` : "No games scheduled today."}</p>
        </div>

        <button type="button" onclick="setLeagueScheduleViewDate(1)">›</button>
      </div>

      <div class="league-schedule-today-actions">
        <button type="button" onclick="resetLeagueScheduleViewToCurrentDate()">Current Date</button>
      </div>

      <div class="league-schedule-grid">
        ${
          games.length
            ? games.map(fcdRenderLeagueScheduleGameCard).join("")
            : `<div class="league-schedule-empty">No games scheduled today.</div>`
        }
      </div>
    </div>
  `;
}
