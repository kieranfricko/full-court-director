function ensureGMHubPhoneSentFlags() {
  const phoneState = ensureGMHubPhoneState();

  if (!phoneState.sentConversationIds) {
    phoneState.sentConversationIds = {};
  }

  return phoneState.sentConversationIds;
}

function hasGMHubPhoneConversationSent(sentKey) {
  if (!sentKey) return false;

  const sentFlags = ensureGMHubPhoneSentFlags();

  return sentFlags[sentKey] === true;
}

function markGMHubPhoneConversationSent(sentKey) {
  if (!sentKey) return;

  const sentFlags = ensureGMHubPhoneSentFlags();

  sentFlags[sentKey] = true;
}

function createGMHubPhoneThread(config = {}) {
  if (!gameState || !gameState.started) return null;

  const phoneState = ensureGMHubPhoneState();

  const threadId = config.id;
  const sentKey = config.sentKey || threadId;

  if (!threadId) return null;

  if (hasGMHubPhoneConversationSent(sentKey) && phoneState.threads?.[threadId]) {
    return phoneState.threads[threadId];
  }

  const messageText = config.messageText || "No message text.";
  const dateText = typeof formatDate === "function"
    ? formatDate(gameState.currentDate)
    : "Today";

  phoneState.threads[threadId] = {
    id: threadId,
    type: config.type || "staff",
    name: config.name || "Team Staff",
    role: config.role || "Staff",
    teamId: gameState.selectedTeamId,
    teamName: config.teamName || "",
    preview: messageText,
    time: config.time || "Today",
    unread: true,
    createdDateKey: getGMHubCurrentDateKey(),
    responded: false,
    closed: false,
    responseOptions: Array.isArray(config.responseOptions)
      ? config.responseOptions
      : [],
    messages: [
      {
        direction: "incoming",
        text: messageText,
        meta: dateText
      }
    ]
  };

  if (!phoneState.threadMeta[threadId]) {
    phoneState.threadMeta[threadId] = {};
  }

  phoneState.threadMeta[threadId].unread = true;

  markGMHubPhoneConversationSent(sentKey);

  return phoneState.threads[threadId];
}


function getOwnerIntroResponseOptions() {
  return [
    "Ready to work.",
    "We’ll build this right.",
    "I appreciate the trust."
  ];
}

function getCurrentOwnerIntroText() {
  const selectedTeam = typeof getSelectedTeam === "function" ? getSelectedTeam() : null;
  const teamName = selectedTeam?.name || "the team";

  return `I’m excited for you to get started with ${teamName}. This is your front office now. Build this the right way.`;
}

function ensureOwnerIntroPhoneText() {
  if (!gameState || !gameState.started) return;

  const phoneState = ensureGMHubPhoneState();
  const threadId = `owner-intro-thread-${gameState.selectedTeamId}`;

  const threadAlreadyExists =
    phoneState.threads &&
    phoneState.threads[threadId];

  if (threadAlreadyExists) {
    if (
      threadAlreadyExists.type === "owner" &&
      threadAlreadyExists.responded !== true &&
      threadAlreadyExists.closed !== true &&
      !Array.isArray(threadAlreadyExists.responseOptions)
    ) {
      threadAlreadyExists.responseOptions = getOwnerIntroResponseOptions();
    }

    if (phoneState.ownerIntroSent === true) {
      return;
    }
  }

  if (phoneState.ownerIntroSent !== true) {
    if (!hasGMHubAdvancedPastPhoneStartDate(phoneState)) return;
  }

  const selectedTeam = typeof getSelectedTeam === "function" ? getSelectedTeam() : null;
  const owner = getCurrentTeamOwnerStaffMember();

  const ownerName = getCurrentOwnerPhoneName();
  const ownerStaffId =
    owner?.staffId ||
    owner?.id ||
    `owner-team-${gameState.selectedTeamId}`;

  const messageText = getCurrentOwnerIntroText();

  const dateText = typeof formatDate === "function"
    ? formatDate(gameState.currentDate)
    : "Today";

  phoneState.threads[threadId] = {
    id: threadId,
    ownerStaffId,
    teamId: gameState.selectedTeamId,
    teamName: selectedTeam?.name || "",
    type: "owner",
    name: ownerName,
    role: "Owner",
    preview: messageText,
    time: "Today",
    unread: phoneState.threadMeta?.[threadId]?.unread !== false,
    createdDateKey: getGMHubCurrentDateKey(),
    responded: false,
    closed: false,
    responseOptions: getOwnerIntroResponseOptions(),
    messages: [
      {
        direction: "incoming",
        text: messageText,
        meta: dateText
      }
    ]
  };

  if (!phoneState.threadMeta[threadId]) {
    phoneState.threadMeta[threadId] = {
      unread: true
    };
  }

  phoneState.ownerIntroSent = true;
}

function getGMHubPhoneThreadById(threadId) {
  const phoneState = ensureGMHubPhoneState();

  if (!phoneState.threads) return null;

  return phoneState.threads[threadId] || null;
}

function handleGMHubPhoneReply(threadId, responseIndex) {
  const phoneState = ensureGMHubPhoneState();
  const thread = getGMHubPhoneThreadById(threadId);

  if (!thread) return;

  const options = Array.isArray(thread.responseOptions)
    ? thread.responseOptions
    : [];

  const selectedOption = options[Number(responseIndex)];

  if (!selectedOption) return;

  if (
    selectedOption.tradeAction &&
    typeof handleTradePhoneNegotiationAction === "function"
  ) {
    handleTradePhoneNegotiationAction(threadId, responseIndex);
    return;
  }

  const selectedText = typeof selectedOption === "string"
    ? selectedOption
    : selectedOption.text;

  if (!selectedText) return;

  if (!Array.isArray(thread.messages)) {
    thread.messages = [];
  }

  thread.messages.push({
    direction: "outgoing",
    text: selectedText,
    meta: "Delivered"
  });

  if (selectedOption.followUpText) {
    thread.messages.push({
      direction: "incoming",
      text: selectedOption.followUpText,
      meta: "Now",
      endsConversation: true
    });

    thread.preview = selectedOption.followUpText;
  } else {
    thread.messages[thread.messages.length - 1].endsConversation = true;
    thread.preview = selectedText;
  }

  thread.unread = false;
  thread.responded = true;
  thread.closed = true;
  thread.responseOptions = [];

  if (!phoneState.threadMeta[threadId]) {
    phoneState.threadMeta[threadId] = {};
  }

  phoneState.threadMeta[threadId].unread = false;

  currentGMHubPhoneThreadId = threadId;

  renderGMHubPhoneModal();
  updateGMHubPhoneButtonNotification();
}

function getCurrentTeamOwnerStaffMember() {
  const selectedTeam = typeof getSelectedTeam === "function" ? getSelectedTeam() : null;
  const selectedTeamId = Number(gameState?.selectedTeamId || selectedTeam?.id || 0);

  if (!selectedTeamId && !selectedTeam) return null;

  const teamIdText = String(selectedTeamId);
  const teamIdPadded = String(selectedTeamId).padStart(2, "0");

  // 1. Current save staff structure.
  if (gameState && gameState.staff) {
    const directTeamStaff =
      gameState.staff[selectedTeamId] ||
      gameState.staff[teamIdText] ||
      gameState.staff[selectedTeam?.name];

    if (directTeamStaff && directTeamStaff.owner && !directTeamStaff.owner.isVacant) {
      return directTeamStaff.owner;
    }

    const matchingTeamStaff = Object.values(gameState.staff).find(teamStaff =>
      teamStaff &&
      (
        Number(teamStaff.teamId) === selectedTeamId ||
        String(teamStaff.teamName || "").toLowerCase() === String(selectedTeam?.name || "").toLowerCase()
      )
    );

    if (matchingTeamStaff && matchingTeamStaff.owner && !matchingTeamStaff.owner.isVacant) {
      return matchingTeamStaff.owner;
    }
  }

  // 2. Fixed staff helper generated by the staff database converter.
  if (typeof buildFixedStaffByTeam === "function") {
    const staffByTeam = buildFixedStaffByTeam();
    const teamStaff = staffByTeam[teamIdText] || staffByTeam[String(selectedTeamId)];

    if (teamStaff && teamStaff.owner && !teamStaff.owner.isVacant) {
      return teamStaff.owner;
    }
  }

  // 3. Fixed staff team lookup helper.
  if (typeof getFixedStaffForTeam === "function") {
    const fixedTeamStaff = getFixedStaffForTeam(selectedTeamId);

    const owner = fixedTeamStaff.find(staff =>
      String(staff.role || "").toLowerCase() === "owner" &&
      staff.isVacant !== true
    );

    if (owner) return owner;
  }

  // 4. Direct fixed staff database fallback.
  if (Array.isArray(window.fixedStaffDatabase)) {
    const ownerByTeam = window.fixedStaffDatabase.find(staff =>
      Number(staff.teamId) === selectedTeamId &&
      String(staff.role || "").toLowerCase() === "owner" &&
      staff.isVacant !== true
    );

    if (ownerByTeam) return ownerByTeam;

    const ownerByStaffId = window.fixedStaffDatabase.find(staff =>
      String(staff.staffId || staff.id || "").toLowerCase() === `staff_${teamIdPadded}_own` &&
      staff.isVacant !== true
    );

    if (ownerByStaffId) return ownerByStaffId;
  }

  return null;
}

function getCurrentOwnerPhoneName() {
  const owner = getCurrentTeamOwnerStaffMember();

  return (
    owner?.name ||
    owner?.staffName ||
    owner?.sourceName ||
    "Team Owner"
  );
}

function hasGMHubAdvancedPastPhoneStartDate(phoneState) {
  const startKey = phoneState.saveStartDateKey;
  const currentKey = getGMHubCurrentDateKey();

  if (!startKey || !currentKey) return false;

  const startDate = getGMHubDateObjectFromKey(startKey);
  const currentDate = getGMHubDateObjectFromKey(currentKey);

  return currentDate.getTime() > startDate.getTime();
}

function getCoachRotationResponseOptions() {
  return [
    {
      text: "I’ll review it.",
      followUpText: "Sounds good, see you on opening night."
    },
    {
      text: "Looks good to me.",
      followUpText: "Sounds good, see you on opening night."
    }
  ];
}

function getFirstUserGameForCoachPhoneText() {
  if (!gameState || !Array.isArray(gameState.userSchedule)) return null;

  return gameState.userSchedule
    .filter(game => !game.played && !game.completed && !game.cancelled && !game.canceled)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

function getCurrentTeamHeadCoachStaffMember() {
  const selectedTeam = typeof getSelectedTeam === "function" ? getSelectedTeam() : null;
  const selectedTeamId = Number(gameState?.selectedTeamId || selectedTeam?.id || 0);

  if (!selectedTeamId && !selectedTeam) return null;

  const teamIdText = String(selectedTeamId);
  const teamIdPadded = String(selectedTeamId).padStart(2, "0");

  if (gameState && gameState.staff) {
    const directTeamStaff =
      gameState.staff[selectedTeamId] ||
      gameState.staff[teamIdText] ||
      gameState.staff[selectedTeam?.name];

    if (directTeamStaff) {
      const coach =
        directTeamStaff.headCoach ||
        directTeamStaff.coach ||
        directTeamStaff.head_coach;

      if (coach && !coach.isVacant) {
        return coach;
      }
    }

    const matchingTeamStaff = Object.values(gameState.staff).find(teamStaff =>
      teamStaff &&
      (
        Number(teamStaff.teamId) === selectedTeamId ||
        String(teamStaff.teamName || "").toLowerCase() === String(selectedTeam?.name || "").toLowerCase()
      )
    );

    if (matchingTeamStaff) {
      const coach =
        matchingTeamStaff.headCoach ||
        matchingTeamStaff.coach ||
        matchingTeamStaff.head_coach;

      if (coach && !coach.isVacant) {
        return coach;
      }
    }
  }

  if (typeof buildFixedStaffByTeam === "function") {
    const staffByTeam = buildFixedStaffByTeam();
    const teamStaff = staffByTeam[teamIdText] || staffByTeam[String(selectedTeamId)];

    if (teamStaff) {
      const coach =
        teamStaff.headCoach ||
        teamStaff.coach ||
        teamStaff.head_coach;

      if (coach && !coach.isVacant) {
        return coach;
      }
    }
  }

  if (typeof getFixedStaffForTeam === "function") {
    const fixedTeamStaff = getFixedStaffForTeam(selectedTeamId);

    const coach = fixedTeamStaff.find(staff => {
      const role = String(staff.role || staff.title || "").toLowerCase();

      return (
        staff.isVacant !== true &&
        (
          role === "head coach" ||
          role === "coach" ||
          role.includes("head coach")
        )
      );
    });

    if (coach) return coach;
  }

  if (Array.isArray(window.fixedStaffDatabase)) {
    const coachByTeam = window.fixedStaffDatabase.find(staff => {
      const role = String(staff.role || staff.title || "").toLowerCase();

      return (
        Number(staff.teamId) === selectedTeamId &&
        staff.isVacant !== true &&
        (
          role === "head coach" ||
          role === "coach" ||
          role.includes("head coach")
        )
      );
    });

    if (coachByTeam) return coachByTeam;

    const coachByStaffId = window.fixedStaffDatabase.find(staff =>
      String(staff.staffId || staff.id || "").toLowerCase() === `staff_${teamIdPadded}_hc` &&
      staff.isVacant !== true
    );

    if (coachByStaffId) return coachByStaffId;
  }

  return null;
}

function getCurrentHeadCoachPhoneName() {
  const coach = getCurrentTeamHeadCoachStaffMember();

  return (
    coach?.name ||
    coach?.staffName ||
    coach?.sourceName ||
    "Head Coach"
  );
}

function shouldSendCoachRotationText(firstGame) {
  if (!firstGame || !firstGame.date || !gameState?.currentDate) return false;

  const currentDate = getGMHubDateObjectFromKey(getGMHubCurrentDateKey());
  const firstGameDate = new Date(firstGame.date);

  if (Number.isNaN(firstGameDate.getTime())) return false;

  firstGameDate.setHours(0, 0, 0, 0);

  const triggerDate = new Date(firstGameDate);
  triggerDate.setDate(triggerDate.getDate() - 7);

  currentDate.setHours(0, 0, 0, 0);

  return currentDate.getTime() >= triggerDate.getTime() &&
         currentDate.getTime() <= firstGameDate.getTime();
}

function ensureCoachRotationPhoneText() {
  if (!gameState || !gameState.started) return;

  const phoneState = ensureGMHubPhoneState();

  if (phoneState.coachRotationTextSent === true) return;

  const firstGame = getFirstUserGameForCoachPhoneText();

  if (!shouldSendCoachRotationText(firstGame)) return;

  const selectedTeam = typeof getSelectedTeam === "function" ? getSelectedTeam() : null;
  const coach = getCurrentTeamHeadCoachStaffMember();

  const coachName = getCurrentHeadCoachPhoneName();
  const coachStaffId =
    coach?.staffId ||
    coach?.id ||
    `coach-team-${gameState.selectedTeamId}`;

  const threadId = `coach-rotation-thread-${gameState.selectedTeamId}`;
  const opponentName = firstGame?.opponentName || firstGame?.opponentAbbrev || "our first opponent";

  const messageText = `We’re about a week out from opening night. I’d like us to lock in the rotation before we play ${opponentName}.`;

  const dateText = typeof formatDate === "function"
    ? formatDate(gameState.currentDate)
    : "Today";

  phoneState.threads[threadId] = {
    id: threadId,
    coachStaffId,
    teamId: gameState.selectedTeamId,
    teamName: selectedTeam?.name || "",
    type: "coach",
    name: coachName,
    role: "Head Coach",
    preview: messageText,
    time: "Today",
    unread: true,
    createdDateKey: getGMHubCurrentDateKey(),
    responded: false,
    closed: false,
    responseOptions: getCoachRotationResponseOptions(),
    messages: [
      {
        direction: "incoming",
        text: messageText,
        meta: dateText
      }
    ]
  };

  phoneState.threadMeta[threadId] = {
    unread: true
  };

  phoneState.coachRotationTextSent = true;
}

window.getCoachRotationResponseOptions = getCoachRotationResponseOptions;
window.ensureCoachRotationPhoneText = ensureCoachRotationPhoneText;
window.getCurrentTeamHeadCoachStaffMember = getCurrentTeamHeadCoachStaffMember;
window.getCurrentHeadCoachPhoneName = getCurrentHeadCoachPhoneName;

window.getOwnerIntroResponseOptions = getOwnerIntroResponseOptions;
window.getCurrentOwnerIntroText = getCurrentOwnerIntroText;
window.ensureOwnerIntroPhoneText = ensureOwnerIntroPhoneText;
window.handleGMHubPhoneReply = handleGMHubPhoneReply;


function runGMHubPhoneConversationChecks() {
  if (!gameState || !gameState.started) return;

  if (typeof ensureOwnerIntroPhoneText === "function") {
    ensureOwnerIntroPhoneText();
  }

  if (typeof ensureCoachRotationPhoneText === "function") {
    ensureCoachRotationPhoneText();
  }

  /*
    Future phone texts go here:

    ensureCoachOpeningNightReactionText();
    ensureCoachWinningStreakText();
    ensureCoachLosingStreakText();
    ensureOwnerDeadlinePressureText();
    ensureAgentRoleConcernText();
    ensurePlayerMinutesComplaintText();
  */
}

window.runGMHubPhoneConversationChecks = runGMHubPhoneConversationChecks;
