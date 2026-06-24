const generatedStaffFirstNames = [
  "Marcus", "David", "Brian", "Eric", "Ryan", "Chris", "Steve", "Mike",
  "Jordan", "Anthony", "Kevin", "Aaron", "Nick", "Taylor", "Corey",
  "Daniel", "Alex", "Brandon", "Jared", "Tyler", "Sam", "Miles"
];

const generatedStaffLastNames = [
  "Bennett", "Harrison", "Coleman", "Reed", "Lawson", "Miller", "Porter",
  "Fields", "Wallace", "Turner", "Anderson", "Parker", "Wells", "Hayes",
  "Brooks", "Foster", "Griffin", "Sullivan", "Murray", "Knight"
];

const generatedCoachPhilosophies = [
  "Modern Offensive",
  "Defensive Identity",
  "Balanced System",
  "Player Development",
  "Grit and Pace",
  "Spacing Heavy",
  "Post-Oriented",
  "Switch Everything"
];

const staffGrades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C"];

function getRandomStaffName() {
  const first = generatedStaffFirstNames[Math.floor(Math.random() * generatedStaffFirstNames.length)];
  const last = generatedStaffLastNames[Math.floor(Math.random() * generatedStaffLastNames.length)];

  return `${first} ${last}`;
}

function getRandomStaffGrade() {
  return staffGrades[Math.floor(Math.random() * staffGrades.length)];
}

function getRandomCoachPhilosophy() {
  return generatedCoachPhilosophies[Math.floor(Math.random() * generatedCoachPhilosophies.length)];
}

function formatStaffTeamKey(teamId) {
  return String(Number(teamId)).padStart(2, "0");
}

function createGeneratedStaffMember(role, specialty = "General", staffId = null) {
  const grade = getRandomStaffGrade();

  return {
    staffId,
    id: staffId,
    name: getRandomStaffName(),
    reference: "Generated Staff",
    role,
    specialty,
    age: 32 + Math.floor(Math.random() * 28),
    experience: 2 + Math.floor(Math.random() * 22),
    contractYears: 1 + Math.floor(Math.random() * 4),
    salary: Number((0.3 + Math.random() * 2.2).toFixed(1)),
    grade
  };
}

function createGeneratedHeadCoach(teamId) {
  const teamKey = formatStaffTeamKey(teamId);
  const staffId = `staff_${teamKey}_hc`;

  return {
    staffId,
    id: staffId,
    name: getRandomStaffName(),
    reference: "Generated Head Coach",
    role: "Head Coach",
    age: 38 + Math.floor(Math.random() * 25),
    experience: 4 + Math.floor(Math.random() * 20),
    contractYears: 1 + Math.floor(Math.random() * 4),
    salary: Number((2.5 + Math.random() * 5.5).toFixed(1)),
    philosophy: getRandomCoachPhilosophy(),
    offense: getRandomStaffGrade(),
    defense: getRandomStaffGrade(),
    playerDevelopment: getRandomStaffGrade(),
    motivation: getRandomStaffGrade(),
    reputation: 65 + Math.floor(Math.random() * 31)
  };
}

function createGeneratedTeamStaff(team) {
  const teamId = Number(team && team.id);
  const teamKey = formatStaffTeamKey(teamId);
  const teamName = team && team.name ? team.name : "Unknown Team";

  return {
    teamId,
    teamName,

    headCoach: createGeneratedHeadCoach(teamId),

    assistants: [
      createGeneratedStaffMember("1st Assistant", "Offense", `staff_${teamKey}_ac_01`),
      createGeneratedStaffMember("Assistant Coach", "Defense", `staff_${teamKey}_ac_02`),
      createGeneratedStaffMember("Assistant Coach", "Player Development", `staff_${teamKey}_ac_03`),
      createGeneratedStaffMember("Shooting Coach", "Shooting", `staff_${teamKey}_ac_04`),
      createGeneratedStaffMember("Player Development Coach", "Development", `staff_${teamKey}_ac_05`)
    ],

    scouts: [
      createGeneratedStaffMember("Lead Scout", "College", `staff_${teamKey}_scout_01`),
      createGeneratedStaffMember("G League Scout", "G League", `staff_${teamKey}_scout_02`),
      createGeneratedStaffMember("College Scout", "College", `staff_${teamKey}_scout_03`),
      createGeneratedStaffMember("College Scout", "College", `staff_${teamKey}_scout_04`),
      createGeneratedStaffMember("Europe Scout", "International", `staff_${teamKey}_scout_05`)
    ],

    medical: [
      createGeneratedStaffMember("Head Athletic Trainer", "Injury Prevention", `staff_${teamKey}_med_01`),
      createGeneratedStaffMember("Assistant Trainer", "Rehab", `staff_${teamKey}_med_02`),
      createGeneratedStaffMember("Physical Therapist", "Therapy", `staff_${teamKey}_med_03`),
      createGeneratedStaffMember("Performance Coach", "Performance", `staff_${teamKey}_med_04`),
      createGeneratedStaffMember("Nutritionist", "Nutrition", `staff_${teamKey}_med_05`)
    ],

    analytics: [
      createGeneratedStaffMember("Head of Analytics", "Analytics", `staff_${teamKey}_ana_01`)
    ]
  };
}

function ensureStaffIdsForTeam(teamId, staff) {
  if (!staff) return;

  const teamKey = formatStaffTeamKey(teamId);

  if (staff.headCoach && !staff.headCoach.staffId) {
    staff.headCoach.staffId = `staff_${teamKey}_hc`;
    staff.headCoach.id = staff.headCoach.staffId;
  }

  (staff.assistants || []).forEach((member, index) => {
    if (!member.staffId) {
      const slot = String(index + 1).padStart(2, "0");
      member.staffId = `staff_${teamKey}_ac_${slot}`;
      member.id = member.staffId;
    }
  });

  (staff.scouts || []).forEach((member, index) => {
    if (!member.staffId) {
      const slot = String(index + 1).padStart(2, "0");
      member.staffId = `staff_${teamKey}_scout_${slot}`;
      member.id = member.staffId;
    }
  });

  (staff.medical || []).forEach((member, index) => {
    if (!member.staffId) {
      const slot = String(index + 1).padStart(2, "0");
      member.staffId = `staff_${teamKey}_med_${slot}`;
      member.id = member.staffId;
    }
  });

  (staff.analytics || []).forEach((member, index) => {
    if (!member.staffId) {
      const slot = String(index + 1).padStart(2, "0");
      member.staffId = `staff_${teamKey}_ana_${slot}`;
      member.id = member.staffId;
    }
  });
}

function cloneStaffGroup(staffGroup) {
  return JSON.parse(JSON.stringify(staffGroup));
}

function getFixedStaffDatabaseArray() {
  if (
    typeof window !== "undefined" &&
    Array.isArray(window.fixedStaffDatabase)
  ) {
    return window.fixedStaffDatabase;
  }

  if (
    typeof fixedStaffDatabase !== "undefined" &&
    Array.isArray(fixedStaffDatabase)
  ) {
    return fixedStaffDatabase;
  }

  return [];
}

function getFixedStaffRowsForTeam(team) {
  if (!team) return [];

  const database = getFixedStaffDatabaseArray();

  if (!database.length) return [];

  return database.filter(staff => {
    if (!staff) return false;

    return (
      Number(staff.teamId) === Number(team.id) ||
      String(staff.teamName || "") === String(team.name || "") ||
      String(staff.teamName || "") === String(team.originalName || "")
    );
  });
}

function isVacantStaffMember(member) {
  if (!member) return true;

  return (
    member.isVacant === true ||
    member.status === "Vacant" ||
    member.name === "Vacant" ||
    member.name === "none"
  );
}

function buildGameStaffGroupFromFixedRows(team, rows) {
  const clonedRows = rows.map(staff => cloneStaffGroup(staff));

  const staffGroup = {
    teamId: team.id,
    teamName: team.name,

    owner: null,
    president: null,
    generalManager: null,
    assistantGeneralManagers: [],

    headCoach: null,
    assistants: [],
    assistantCoaches: [],

    scouts: [],
    scouting: [],

    medical: [],
    analytics: [],

    staff: clonedRows
  };

  clonedRows.forEach(member => {
    const role = String(member.role || "").trim();
    const department = String(member.department || "").trim();

    if (role === "Owner") {
      staffGroup.owner = member;
      return;
    }

    if (role === "President of Basketball Operations") {
      staffGroup.president = member;
      return;
    }

    if (role === "General Manager") {
      staffGroup.generalManager = member;
      return;
    }

    if (role === "Assistant GM") {
      staffGroup.assistantGeneralManagers.push(member);
      return;
    }

    if (role === "Head Coach") {
      staffGroup.headCoach = member;
      return;
    }

    if (role === "Assistant Coach") {
      staffGroup.assistants.push(member);
      staffGroup.assistantCoaches.push(member);
      return;
    }

    if (
      role.includes("Scout") ||
      department === "Scouting"
    ) {
      staffGroup.scouts.push(member);
      staffGroup.scouting.push(member);
      return;
    }

    if (
      role.includes("Medical") ||
      role.includes("Trainer") ||
      role.includes("Therapist") ||
      department === "Medical"
    ) {
      staffGroup.medical.push(member);
      return;
    }

    if (
      role.includes("Analytics") ||
      department === "Analytics"
    ) {
      staffGroup.analytics.push(member);
      return;
    }
  });

  if (!staffGroup.headCoach) {
    staffGroup.headCoach = createGeneratedHeadCoach();
  }

  return staffGroup;
}

function createStaffForTeam(team) {
  if (!team) return null;

  const fixedRows = getFixedStaffRowsForTeam(team);

  if (fixedRows.length) {
    return buildGameStaffGroupFromFixedRows(team, fixedRows);
  }

  return {
    teamId: team.id,
    ...createGeneratedTeamStaff(team.name)
  };
}

function createAllTeamStaff() {
  const staffByTeamId = {};

  if (!gameState || !gameState.teams) {
    return staffByTeamId;
  }

  for (let team of gameState.teams) {
    staffByTeamId[team.id] = createStaffForTeam(team);
  }

  return staffByTeamId;
}

function ensureTeamStaff() {
  if (!gameState) return;

  if (!gameState.staff) {
    gameState.staff = {};
  }

  if (!gameState.teams) return;

  for (let team of gameState.teams) {
  if (!gameState.staff[team.id]) {
    gameState.staff[team.id] = createStaffForTeam(team);
  }

  ensureStaffIdsForTeam(team.id, gameState.staff[team.id]);
}
}

function getTeamStaff(teamId) {
  if (!gameState || !gameState.staff) return null;

  return gameState.staff[teamId] || null;
}

function getSelectedTeamStaff() {
  if (!gameState) return null;

  return getTeamStaff(gameState.selectedTeamId);
}

function formatStaffMoney(amount) {
  if (amount === undefined || amount === null) return "$0.0M";
  return `$${Number(amount).toFixed(1)}M`;
}

function gradeToNumber(value) {
  if (value === undefined || value === null) return 70;

  if (typeof value === "number") {
    return Math.max(0, Math.min(100, value));
  }

  const text = String(value).trim().toUpperCase();

  const gradeMap = {
    "A+": 97,
    "A": 93,
    "A-": 90,
    "B+": 87,
    "B": 83,
    "B-": 80,
    "C+": 77,
    "C": 73,
    "C-": 70,
    "D+": 67,
    "D": 63,
    "F": 55
  };

  return gradeMap[text] || 70;
}

function numberToStaffGrade(value) {
  const score = Number(value || 0);

  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  return "D";
}

function getStaffRatingScore(member) {
  if (!member) return 0;

  const possibleRatings = [
    member.reputation,
    member.overall,
    member.grade,
    member.offense,
    member.defense,
    member.playerDevelopment,
    member.development,
    member.motivation,
    member.scouting,
    member.medical,
    member.analytics,
    member.playerEvaluation,
    member.negotiation
  ];

  const usableRatings = possibleRatings
    .filter(value => value !== undefined && value !== null && value !== "" && value !== "none")
    .map(gradeToNumber)
    .filter(value => Number.isFinite(value) && value > 0);

  if (!usableRatings.length) return 70;

  const total = usableRatings.reduce((sum, value) => sum + value, 0);
  return Math.round(total / usableRatings.length);
}

function getStaffDisplayGrade(member) {
  return numberToStaffGrade(getStaffRatingScore(member));
}

function getStaffStyleLabel(member, fallback = "Staff") {
  if (!member) return fallback;

  return (
    member.specialty ||
    member.philosophy ||
    member.offensiveSystem ||
    member.defensiveSystem ||
    member.developmentStyle ||
    member.pacePreference ||
    member.personality ||
    fallback
  );
}

function getAllSelectedStaffMembers(staff) {
  if (!staff) return [];

  return [
    staff.owner,
    staff.president,
    staff.generalManager,
    staff.headCoach,
    ...(staff.assistants || []),
    ...(staff.scouts || []),
    ...(staff.medical || []),
    ...(staff.analytics || [])
  ].filter(member => member && !member.isVacant && member.name && member.name !== "Vacant");
}

function calculateStaffChemistry(staff) {
  const members = getAllSelectedStaffMembers(staff);

  if (!members.length) return 50;

  const ratings = members.map(getStaffRatingScore);
  const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;

  return Math.round(Math.max(45, Math.min(99, average)));
}

function getOrganizationGrade(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  return "D";
}

function getSelectedTeamRecordForStaffPage() {
  if (!gameState || !gameState.teams) {
    return { wins: 0, losses: 0 };
  }

  const team = gameState.teams.find(item => Number(item.id) === Number(gameState.selectedTeamId));

  if (!team) {
    return { wins: 0, losses: 0 };
  }

  return {
    wins: Number(team.wins || 0),
    losses: Number(team.losses || 0)
  };
}

function calculateOwnerConfidence(staff) {
  const chemistry = calculateStaffChemistry(staff);
  const record = getSelectedTeamRecordForStaffPage();
  const totalGames = record.wins + record.losses;

  let confidence = 65;

  if (totalGames > 0) {
    const winPct = record.wins / totalGames;
    confidence += Math.round((winPct - 0.5) * 40);
  }

  confidence += Math.round((chemistry - 75) * 0.25);

  return Math.max(25, Math.min(99, confidence));
}

function getOwnerConfidenceLabel(score) {
  if (score >= 90) return "Thrilled";
  if (score >= 78) return "Confident";
  if (score >= 65) return "Satisfied";
  if (score >= 50) return "Concerned";
  return "Frustrated";
}

function getStaffCount(staff) {
  if (!staff) return 0;

  if (Array.isArray(staff.staff)) {
    return staff.staff.filter(member => !isVacantStaffMember(member)).length;
  }

  return (
    (staff.headCoach && !isVacantStaffMember(staff.headCoach) ? 1 : 0) +
    (staff.assistants ? staff.assistants.filter(member => !isVacantStaffMember(member)).length : 0) +
    (staff.scouts ? staff.scouts.filter(member => !isVacantStaffMember(member)).length : 0) +
    (staff.medical ? staff.medical.filter(member => !isVacantStaffMember(member)).length : 0) +
    (staff.analytics ? staff.analytics.filter(member => !isVacantStaffMember(member)).length : 0)
  );
}

function getStaffPayroll(staff) {
  if (!staff) return 0;

  let members = [];

  if (Array.isArray(staff.staff)) {
    members = staff.staff;
  } else {
    members = [
      staff.owner,
      staff.president,
      staff.generalManager,
      ...(staff.assistantGeneralManagers || []),
      staff.headCoach,
      ...(staff.assistants || []),
      ...(staff.scouts || []),
      ...(staff.medical || []),
      ...(staff.analytics || [])
    ];
  }

  const total = members
    .filter(member => member && !isVacantStaffMember(member))
    .reduce((sum, member) => sum + Number(member.salary || 0), 0);

  return Number(total.toFixed(1));
}

function renderCompactStaffRow(member, fallbackRole = "Staff") {
  if (!member || member.isVacant || member.name === "Vacant") {
    return `
      <div class="compact-staff-row empty-staff-row">
        <span>${fallbackRole}</span>
        <strong>Vacant</strong>
        <small>Open</small>
      </div>
    `;
  }

  return `
    <div class="compact-staff-row">
      <span>${member.role || fallbackRole}</span>
      <strong>${member.name || "Unknown Staff"}</strong>
      <small>${getStaffStyleLabel(member, fallbackRole)}</small>
    </div>
  `;
}

function renderDetailedStaffMiniCard(member) {
  if (!member || member.isVacant || member.name === "Vacant") {
    return `
      <div class="staff-mini-card empty-staff-row">
        <span>Open Slot</span>
        <strong>Vacant</strong>
        <p>Available <b>-</b></p>
        <small>No contract</small>
      </div>
    `;
  }

  const label = getStaffStyleLabel(member, "General");
  const grade = getStaffDisplayGrade(member);

  return `
    <div class="staff-mini-card">
      <span>${member.role || "Staff"}</span>
      <strong>${member.name || "Unknown Staff"}</strong>
      <p>${label} <b>${grade}</b></p>
      <small>${member.contractYears || 1} yrs · ${formatStaffMoney(member.salary)}</small>
    </div>
  `;
}

function displayFrontOfficeGM() {
  if (!gameState) return;

  const gm = gameState.generalManager;

  if (gm) {
    setText("front-office-gm-name", gm.fullName || "Your GM");
    setText(
      "front-office-gm-info",
      `${gm.background || "General Manager"} from ${gm.hometown || "Unknown Hometown"}`
    );
    setText("front-office-background-label", gm.background || "General Manager");
  } else {
    setText("front-office-gm-name", "Your GM");
    setText("front-office-gm-info", "Create a GM to show information here.");
    setText("front-office-background-label", "General Manager");
  }
}

function displayStaffOverviewFromState() {
  if (!gameState) return;

  ensureTeamStaff();

  const staff = getSelectedTeamStaff();
  if (!staff) return;

  const assistantCount = staff.assistants ? staff.assistants.filter(member => !member.isVacant).length : 0;
  const scoutCount = staff.scouts ? staff.scouts.filter(member => !member.isVacant).length : 0;
  const medicalCount = staff.medical ? staff.medical.filter(member => !member.isVacant).length : 0;
  const analyticsCount = staff.analytics ? staff.analytics.filter(member => !member.isVacant).length : 0;

  const totalPayroll = getStaffPayroll(staff);
  const chemistry = calculateStaffChemistry(staff);
  const organizationGrade = getOrganizationGrade(chemistry);
  const ownerConfidence = calculateOwnerConfidence(staff);

  setText("staff-coaching-count", `${assistantCount + (staff.headCoach && !staff.headCoach.isVacant ? 1 : 0)} / 16`);
  setText("staff-scouting-count", `${scoutCount} / 15`);
  setText("staff-medical-count", `${medicalCount} / 10`);
  setText("staff-analytics-count", `${analyticsCount} / 2`);
  setText("staff-chemistry-score", chemistry);

  setText("front-office-budget", `${formatStaffMoney(totalPayroll)} / $24.0M`);
  setText("front-office-chemistry", chemistry);
  setText("front-office-grade", organizationGrade);
  setText("organization-grade", organizationGrade);
  setText("front-office-owner-confidence", ownerConfidence);
  setText("front-office-reputation", organizationGrade);

  const ownerLabel = document.querySelector("#front-office-owner-confidence + span");
  if (ownerLabel) {
    ownerLabel.textContent = getOwnerConfidenceLabel(ownerConfidence);
  }

  const coachingRows = document.querySelector("#staff-overview-screen .compact-staff-card:nth-child(1) .compact-staff-list");
  if (coachingRows) {
    coachingRows.innerHTML = `
      <div class="compact-staff-row head-role">
        <span>Head Coach</span>
        <strong>${staff.headCoach && !staff.headCoach.isVacant ? staff.headCoach.name : "Vacant"}</strong>
        <small>${staff.headCoach ? getStaffStyleLabel(staff.headCoach, "Open") : "Open"}</small>
      </div>
      ${(staff.assistants || []).slice(0, 5).map(member => renderCompactStaffRow(member, "Assistant Coach")).join("")}
    `;
  }

  const scoutingRows = document.querySelector("#staff-overview-screen .compact-staff-card:nth-child(2) .compact-staff-list");
  if (scoutingRows) {
    scoutingRows.innerHTML = (staff.scouts || [])
      .slice(0, 6)
      .map((member, index) => {
        const row = renderCompactStaffRow(member, "Scout");
        return index === 0 ? row.replace("compact-staff-row", "compact-staff-row head-role") : row;
      })
      .join("");
  }

  const medicalRows = document.querySelector("#staff-overview-screen .compact-staff-card:nth-child(3) .compact-staff-list");
  if (medicalRows) {
    medicalRows.innerHTML = (staff.medical || [])
      .slice(0, 6)
      .map((member, index) => {
        const row = renderCompactStaffRow(member, "Medical Staff");
        return index === 0 ? row.replace("compact-staff-row", "compact-staff-row head-role") : row;
      })
      .join("");
  }

  const organizationRows = document.querySelector("#staff-overview-screen .compact-staff-card:nth-child(4) .compact-staff-list");
  if (organizationRows) {
    const analyticsLead = staff.analytics && staff.analytics.length ? staff.analytics[0] : null;

    organizationRows.innerHTML = `
      ${renderCompactStaffRow(analyticsLead, "Head of Analytics").replace("compact-staff-row", "compact-staff-row head-role")}
      <div class="compact-staff-row">
        <span>Staff Budget</span>
        <strong>${formatStaffMoney(totalPayroll)} / $24.0M</strong>
        <small>${totalPayroll <= 24 ? "Available" : "Over Budget"}</small>
      </div>
      <div class="compact-staff-row">
        <span>Staff Chemistry</span>
        <strong>${chemistry}</strong>
        <small>${getOrganizationGrade(chemistry)}</small>
      </div>
      <div class="compact-staff-row">
        <span>Organization Grade</span>
        <strong>${organizationGrade}</strong>
        <small>${getOwnerConfidenceLabel(ownerConfidence)}</small>
      </div>
      <div class="compact-staff-row">
        <span>Owner Confidence</span>
        <strong>${ownerConfidence}</strong>
        <small>${getOwnerConfidenceLabel(ownerConfidence)}</small>
      </div>
    `;
  }
}

function displayCoachingStaffFromState() {
  if (!gameState) return;

  ensureTeamStaff();

  const staff = getSelectedTeamStaff();
  if (!staff) return;

  const coach = staff.headCoach;

  if (coach && !coach.isVacant) {
    setText("overview-head-coach-name", coach.name);
    setText("coaching-head-coach-name", coach.name);

    const coachCards = document.querySelectorAll(".head-coach-feature-card");

    coachCards.forEach(card => {
      const info = card.querySelector(".head-coach-main-info");
      const grades = card.querySelector(".head-coach-grades");
      const rating = card.querySelector(".head-coach-rating");

      if (info) {
        info.innerHTML = `
          <span>Head Coach</span>
          <h3>${coach.name}</h3>
          <p>Age: ${coach.age || "-"}</p>
          <p>Style: ${getStaffStyleLabel(coach, "Balanced")}</p>
          <p>Contract: ${coach.contractYears || 1} yrs / ${formatStaffMoney(coach.salary)}</p>
        `;
      }

      if (grades) {
        grades.innerHTML = `
          <div><span>Coaching Style</span><strong>${getStaffStyleLabel(coach, "Balanced")}</strong></div>
          <div><span>Offense</span><strong>${numberToStaffGrade(gradeToNumber(coach.offense))}</strong></div>
          <div><span>Defense</span><strong>${numberToStaffGrade(gradeToNumber(coach.defense))}</strong></div>
          <div><span>Development</span><strong>${numberToStaffGrade(gradeToNumber(coach.playerDevelopment || coach.development))}</strong></div>
          <div><span>Motivation</span><strong>${numberToStaffGrade(gradeToNumber(coach.motivation))}</strong></div>
        `;
      }

      if (rating) {
        rating.textContent = getStaffRatingScore(coach);
      }
    });
  }

  const assistantList = document.getElementById("assistant-coaches-list");
  if (assistantList) {
    assistantList.innerHTML = (staff.assistants || [])
      .filter(member => {
        const role = String(member.role || "");
        return !role.includes("Shooting") &&
          !role.includes("Player Development") &&
          !role.includes("Big Man") &&
          !role.includes("Strength");
      })
      .map(renderDetailedStaffMiniCard)
      .join("");
  }

  const specialtyList = document.getElementById("specialty-coaches-list");
  if (specialtyList) {
    specialtyList.innerHTML = (staff.assistants || [])
      .filter(member => {
        const role = String(member.role || "");
        return role.includes("Shooting") ||
          role.includes("Player Development") ||
          role.includes("Big Man") ||
          role.includes("Strength");
      })
      .map(renderDetailedStaffMiniCard)
      .join("");
  }
}

function displayScoutingStaffFromState() {
  if (!gameState) return;

  ensureTeamStaff();

  const staff = getSelectedTeamStaff();
  if (!staff) return;

  const scoutCards = document.querySelectorAll("#scouting-squad-screen .staff-mini-card-grid");

  const gLeague = (staff.scouts || []).filter(member => {
    const text = `${member.role || ""} ${member.region || ""} ${member.specialty || ""}`.toLowerCase();
    return text.includes("g league");
  });

  const college = (staff.scouts || []).filter(member => {
    const text = `${member.role || ""} ${member.region || ""} ${member.specialty || ""}`.toLowerCase();
    return text.includes("college") || text.includes("lead scout");
  });

  const international = (staff.scouts || []).filter(member => {
    const text = `${member.role || ""} ${member.region || ""} ${member.specialty || ""}`.toLowerCase();
    return text.includes("international") || text.includes("europe") || text.includes("overseas");
  });

  if (scoutCards[0]) scoutCards[0].innerHTML = gLeague.map(renderDetailedStaffMiniCard).join("");
  if (scoutCards[1]) scoutCards[1].innerHTML = college.map(renderDetailedStaffMiniCard).join("");
  if (scoutCards[2]) scoutCards[2].innerHTML = international.map(renderDetailedStaffMiniCard).join("");
}

function displayMedicalStaffFromState() {
  if (!gameState) return;

  ensureTeamStaff();

  const staff = getSelectedTeamStaff();
  if (!staff) return;

  const medicalList = document.getElementById("medical-staff-list");
  if (medicalList) {
    medicalList.innerHTML = (staff.medical || []).map(renderDetailedStaffMiniCard).join("");
  }

  const analyticsGrid = document.querySelector("#medical-staff-screen .staff-mini-card-grid.two-wide");

  if (analyticsGrid) {
    analyticsGrid.innerHTML = `
      ${(staff.analytics || []).map(renderDetailedStaffMiniCard).join("")}
      <button type="button" class="staff-add-empty-card">+ Add Analytics Staff</button>
    `;
  }
}

function displayOrganizationStaffFromState() {
  if (!gameState) return;

  ensureTeamStaff();

  const staff = getSelectedTeamStaff();
  if (!staff) return;

  const totalPayroll = getStaffPayroll(staff);
  const chemistry = calculateStaffChemistry(staff);
  const organizationGrade = getOrganizationGrade(chemistry);
  const ownerConfidence = calculateOwnerConfidence(staff);

  const organizationCards = document.querySelectorAll("#organization-screen .front-office-big-number");

  if (organizationCards[0]) {
    organizationCards[0].innerHTML = `
      <strong>${organizationGrade}</strong>
      <span>${chemistry >= 85 ? "Strong Organization" : "Developing Organization"}</span>
    `;
  }

  if (organizationCards[1]) {
    organizationCards[1].innerHTML = `
      <strong>${formatStaffMoney(totalPayroll)}</strong>
      <span>of $24.0M used</span>
    `;
  }

  if (organizationCards[2]) {
    organizationCards[2].innerHTML = `
      <strong>${chemistry}</strong>
      <span>${getOrganizationGrade(chemistry)}</span>
    `;
  }

  if (organizationCards[3]) {
    organizationCards[3].innerHTML = `
      <strong>${ownerConfidence}</strong>
      <span>${getOwnerConfidenceLabel(ownerConfidence)}</span>
    `;
  }
}

function displayFrontOfficeStaff() {
  displayFrontOfficeGM();
  displayStaffOverviewFromState();
  displayCoachingStaffFromState();
  displayScoutingStaffFromState();
  displayMedicalStaffFromState();
  displayOrganizationStaffFromState();
}

function populateLeagueStaffTeamSelect() {
  const select = document.getElementById("league-staff-team-select");
  if (!select || !gameState || !gameState.teams) return;

  const currentValue = select.value || String(gameState.selectedTeamId || "");

  select.innerHTML = "";

  for (let team of gameState.teams) {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = `${team.name} (${team.conference})`;
    select.appendChild(option);
  }

  if (currentValue) {
    select.value = currentValue;
  }

  if (!select.value && gameState.selectedTeamId) {
    select.value = String(gameState.selectedTeamId);
  }
}

function getLeagueStaffSelectedTeamId() {
  const select = document.getElementById("league-staff-team-select");

  if (select && select.value) {
    return Number(select.value);
  }

  return gameState ? Number(gameState.selectedTeamId) : null;
}

function renderLeagueStaffCompactRows(list, fallbackRole) {
  if (!list || !list.length) {
    return `
      <div class="compact-staff-row empty-staff-row">
        <span>${fallbackRole}</span>
        <strong>Vacant</strong>
        <small>Open</small>
      </div>
    `;
  }

  return list.map(member => renderCompactStaffRow(member, fallbackRole)).join("");
}

function displayLeagueStaffBrowser() {
  if (!gameState || !gameState.started) return;

  ensureTeamStaff();
  populateLeagueStaffTeamSelect();

  const teamId = getLeagueStaffSelectedTeamId();
  const team = gameState.teams.find(item => Number(item.id) === Number(teamId));
  const staff = getTeamStaff(teamId);

  if (!team || !staff) return;

  const coach = staff.headCoach;
  const payroll = getStaffPayroll(staff);
  const count = getStaffCount(staff);

  setText("league-staff-team-name", team.name);
  setText("league-staff-head-coach", coach ? coach.name : "Vacant");
  setText("league-staff-total-count", count);
  setText("league-staff-payroll", formatStaffMoney(payroll));

  setText("league-staff-coach-name", coach ? coach.name : "Vacant");

  if (coach) {
    setText(
      "league-staff-coach-info",
      `Age: ${coach.age} · Experience: ${coach.experience} yrs · Contract: ${coach.contractYears} yrs / ${formatStaffMoney(coach.salary)}`
    );

    setText("league-staff-coach-style", coach.philosophy || "Balanced");
    setText("league-staff-coach-offense", coach.offense || "B");
    setText("league-staff-coach-defense", coach.defense || "B");
    setText("league-staff-coach-development", coach.playerDevelopment || "B");
    setText("league-staff-coach-motivation", coach.motivation || "B");
    setText("league-staff-coach-reputation", coach.reputation || 75);
  } else {
    setText("league-staff-coach-info", "No coach info.");
    setText("league-staff-coach-style", "-");
    setText("league-staff-coach-offense", "-");
    setText("league-staff-coach-defense", "-");
    setText("league-staff-coach-development", "-");
    setText("league-staff-coach-motivation", "-");
    setText("league-staff-coach-reputation", "-");
  }

  const assistantsList = document.getElementById("league-staff-assistants-list");
  if (assistantsList) {
    assistantsList.innerHTML = renderLeagueStaffCompactRows(staff.assistants, "Assistant");
  }

  const scoutsList = document.getElementById("league-staff-scouts-list");
  if (scoutsList) {
    scoutsList.innerHTML = renderLeagueStaffCompactRows(staff.scouts, "Scout");
  }

  const medicalList = document.getElementById("league-staff-medical-list");
  if (medicalList) {
    medicalList.innerHTML = renderLeagueStaffCompactRows(staff.medical, "Medical Staff");
  }

  const analyticsList = document.getElementById("league-staff-analytics-list");
  if (analyticsList) {
    analyticsList.innerHTML = renderLeagueStaffCompactRows(staff.analytics, "Analytics");
  }
}

/* ======================================================
   STAFF MARKET / FIRING / EXTENSIONS SYSTEM
   Task 1
====================================================== */

const FCD_STAFF_SALARY_BUDGET = 25;

let currentStaffMarketFilter = "ALL";
let currentStaffNegotiation = null;

const FCD_STAFF_ROLE_OPTIONS = [
  "General Manager",
  "Head Coach",
  "Assistant Coach",
  "Shooting Coach",
  "Player Development Coach",
  "Lead Scout",
  "College Scout",
  "Europe Scout",
  "Medical Director",
  "Head Athletic Trainer",
  "Physical Therapist",
  "Performance Coach",
  "Head of Analytics"
];

const FCD_STAFF_SLOT_RULES = {
  generalManager: {
    label: "General Manager",
    max: 1,
    single: true,
    department: "Executive"
  },
  headCoach: {
    label: "Head Coach",
    max: 1,
    single: true,
    department: "Coaching"
  },
  assistants: {
    label: "Assistant Coaches",
    max: 15,
    single: false,
    department: "Coaching"
  },
  scouts: {
    label: "Scouting Squad",
    max: 15,
    single: false,
    department: "Scouting"
  },
  medical: {
    label: "Medical Staff",
    max: 10,
    single: false,
    department: "Medical"
  },
  analytics: {
    label: "Analytics Staff",
    max: 2,
    single: false,
    department: "Analytics"
  }
};

function escapeStaffHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeStaffAttr(value) {
  return escapeStaffHtml(value).replace(/`/g, "&#96;");
}

function getStaffId(member) {
  if (!member) return "";

  if (!member.staffId && !member.id) {
    member.staffId = `staff_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    member.id = member.staffId;
  }

  if (!member.staffId) member.staffId = member.id;
  if (!member.id) member.id = member.staffId;

  return String(member.staffId || member.id);
}

function normalizeStaffMember(member, teamId = null, roleOverride = null) {
  if (!member) return null;

  getStaffId(member);

  if (roleOverride) {
    member.role = roleOverride;
  }

  member.age = member.age === null || member.age === undefined ? randomInt(32, 62) : Number(member.age);
  member.salary = Number(member.salary || getSuggestedStaffSalary(member.role || "Assistant Coach", member));
  member.contractYears = Number(member.contractYears || 1);
  member.status = member.status || "Active";
  member.isVacant = false;

  if (!member.department) {
    member.department = getStaffDepartmentForRole(member.role || "");
  }

  if (teamId !== null && teamId !== undefined) {
    const team = getTeamById(Number(teamId));

    member.teamId = Number(teamId);
    member.teamName = team ? team.name : member.teamName;
  }

  return member;
}

function getStaffDepartmentForRole(role) {
  const text = String(role || "").toLowerCase();

  if (text.includes("owner") || text.includes("president") || text.includes("general manager") || text.includes("gm")) {
    return "Executive";
  }

  if (text.includes("scout")) return "Scouting";

  if (
    text.includes("medical") ||
    text.includes("trainer") ||
    text.includes("therapist") ||
    text.includes("performance") ||
    text.includes("nutrition") ||
    text.includes("sleep") ||
    text.includes("psychologist") ||
    text.includes("rehab")
  ) {
    return "Medical";
  }

  if (text.includes("analytics") || text.includes("data")) return "Analytics";

  return "Coaching";
}

function getStaffSlotKeyForRole(role) {
  const text = String(role || "").toLowerCase();

  if (text.includes("owner")) return "owner";
  if (text.includes("president")) return "president";

  if (text.includes("general manager") || text === "gm") {
    return "generalManager";
  }

  if (text.includes("head coach")) {
    return "headCoach";
  }

  if (text.includes("scout")) {
    return "scouts";
  }

  if (
    text.includes("medical") ||
    text.includes("trainer") ||
    text.includes("therapist") ||
    text.includes("performance") ||
    text.includes("nutrition") ||
    text.includes("sleep") ||
    text.includes("psychologist") ||
    text.includes("rehab")
  ) {
    return "medical";
  }

  if (text.includes("analytics") || text.includes("data")) {
    return "analytics";
  }

  return "assistants";
}

function isStaffFireLocked(member) {
  if (!member) return true;

  const role = String(member.role || "").toLowerCase();

  return (
    role.includes("owner") ||
    role.includes("president")
  );
}

function ensureStaffGroupArrays(staffGroup) {
  if (!staffGroup) return;

  if (!Array.isArray(staffGroup.assistants)) staffGroup.assistants = [];
  if (!Array.isArray(staffGroup.assistantCoaches)) staffGroup.assistantCoaches = staffGroup.assistants;
  if (!Array.isArray(staffGroup.scouts)) staffGroup.scouts = [];
  if (!Array.isArray(staffGroup.scouting)) staffGroup.scouting = staffGroup.scouts;
  if (!Array.isArray(staffGroup.medical)) staffGroup.medical = [];
  if (!Array.isArray(staffGroup.analytics)) staffGroup.analytics = [];
  if (!Array.isArray(staffGroup.assistantGeneralManagers)) staffGroup.assistantGeneralManagers = [];

  staffGroup.assistantCoaches = staffGroup.assistants;
  staffGroup.scouting = staffGroup.scouts;
}

function rebuildStaffFlatList(staffGroup) {
  if (!staffGroup) return;

  ensureStaffGroupArrays(staffGroup);

  const members = [
    staffGroup.owner,
    staffGroup.president,
    staffGroup.generalManager,
    ...(staffGroup.assistantGeneralManagers || []),
    staffGroup.headCoach,
    ...(staffGroup.assistants || []),
    ...(staffGroup.scouts || []),
    ...(staffGroup.medical || []),
    ...(staffGroup.analytics || [])
  ].filter(member => member && !isVacantStaffMember(member));

  const seen = new Set();

  staffGroup.staff = members.filter(member => {
    const id = getStaffId(member);

    if (seen.has(id)) return false;

    seen.add(id);
    return true;
  });

  staffGroup.assistantCoaches = staffGroup.assistants;
  staffGroup.scouting = staffGroup.scouts;
}

function normalizeStaffGroupsForAllTeams() {
  if (!gameState || !gameState.staff || !Array.isArray(gameState.teams)) return;

  for (let team of gameState.teams) {
    const staffGroup = gameState.staff[team.id];

    if (!staffGroup) continue;

    staffGroup.teamId = Number(team.id);
    staffGroup.teamName = team.name;

    ensureStaffGroupArrays(staffGroup);

    const allMembers = [
      staffGroup.owner,
      staffGroup.president,
      staffGroup.generalManager,
      ...(staffGroup.assistantGeneralManagers || []),
      staffGroup.headCoach,
      ...(staffGroup.assistants || []),
      ...(staffGroup.scouts || []),
      ...(staffGroup.medical || []),
      ...(staffGroup.analytics || [])
    ].filter(Boolean);

    for (let member of allMembers) {
      if (isVacantStaffMember(member)) continue;

      normalizeStaffMember(member, team.id);
    }

    rebuildStaffFlatList(staffGroup);
  }
}

function ensureStaffSystemState() {
  if (!gameState || !gameState.started) return;

  if (!gameState.staffSalaryBudget) {
    gameState.staffSalaryBudget = FCD_STAFF_SALARY_BUDGET;
  }

  if (!Array.isArray(gameState.staffMarket)) {
    gameState.staffMarket = [];
  }

  if (!Array.isArray(gameState.staffMovement)) {
    gameState.staffMovement = [];
  }

  if (!gameState.processedStaffEvents) {
    gameState.processedStaffEvents = {};
  }

  normalizeStaffGroupsForAllTeams();
  ensureStaffMarketMinimums();
}

function createMarketStaffMember(role, department = null, specialty = null) {
  const staffId = `market_staff_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const rating = randomInt(58, 86);

  const member = {
    staffId,
    id: staffId,
    name: getRandomStaffName(),
    role,
    department: department || getStaffDepartmentForRole(role),
    specialty: specialty || getStaffDepartmentForRole(role),
    age: randomInt(32, 64),
    experience: randomInt(1, 25),
    salary: getSuggestedStaffSalary(role, { reputation: rating }),
    contractYears: 0,
    status: "Available",
    teamId: null,
    teamName: "Staff Market",
    reputation: rating,
    personality: ["Professional", "Teacher", "Player Friendly", "Analytical", "Demanding", "Culture Builder"][randomInt(0, 5)],
    offense: randomInt(45, 90),
    defense: randomInt(45, 90),
    playerDevelopment: randomInt(45, 90),
    development: randomInt(45, 90),
    scouting: role.toLowerCase().includes("scout") ? randomInt(55, 92) : 0,
    medical: getStaffDepartmentForRole(role) === "Medical" ? randomInt(55, 92) : 0,
    analytics: getStaffDepartmentForRole(role) === "Analytics" ? randomInt(55, 92) : 0,
    imagePath: "images/staff/default-silhouette.png",
    notes: ""
  };

  return member;
}

function ensureStaffMarketMinimums() {
  if (!gameState || !Array.isArray(gameState.staffMarket)) return;

  const activeMarket = gameState.staffMarket.filter(member => member && member.status !== "Retired");

  function countRole(roleText) {
    const text = String(roleText || "").toLowerCase();

    return activeMarket.filter(member => String(member.role || "").toLowerCase().includes(text)).length;
  }

  function addMany(count, role, department, specialty) {
    for (let i = 0; i < count; i++) {
      gameState.staffMarket.push(createMarketStaffMember(role, department, specialty));
    }
  }

  const headCoachNeed = Math.max(0, 10 - countRole("head coach"));
  const assistantNeed = Math.max(0, 80 - activeMarket.filter(member => getStaffDepartmentForRole(member.role) === "Coaching" && !String(member.role || "").toLowerCase().includes("head coach")).length);
  const scoutNeed = Math.max(0, 20 - activeMarket.filter(member => getStaffDepartmentForRole(member.role) === "Scouting").length);
  const medicalNeed = Math.max(0, 15 - activeMarket.filter(member => getStaffDepartmentForRole(member.role) === "Medical").length);
  const analyticsNeed = Math.max(0, 8 - activeMarket.filter(member => getStaffDepartmentForRole(member.role) === "Analytics").length);
  const executiveNeed = Math.max(0, 10 - activeMarket.filter(member => getStaffDepartmentForRole(member.role) === "Executive").length);

  addMany(headCoachNeed, "Head Coach", "Coaching", "Team Identity");
  addMany(Math.ceil(assistantNeed * 0.55), "Assistant Coach", "Coaching", "General");
  addMany(Math.ceil(assistantNeed * 0.18), "Shooting Coach", "Coaching", "Shooting");
  addMany(Math.ceil(assistantNeed * 0.18), "Player Development Coach", "Coaching", "Development");
  addMany(Math.max(0, assistantNeed - Math.ceil(assistantNeed * 0.91)), "Assistant Coach", "Coaching", "Defense");

  addMany(Math.ceil(scoutNeed * 0.45), "College Scout", "Scouting", "College");
  addMany(Math.ceil(scoutNeed * 0.35), "Europe Scout", "Scouting", "International");
  addMany(Math.max(0, scoutNeed - Math.ceil(scoutNeed * 0.8)), "Lead Scout", "Scouting", "Draft");

  addMany(Math.ceil(medicalNeed * 0.35), "Head Athletic Trainer", "Medical", "Injury Prevention");
  addMany(Math.ceil(medicalNeed * 0.3), "Physical Therapist", "Medical", "Rehab");
  addMany(Math.ceil(medicalNeed * 0.2), "Performance Coach", "Medical", "Performance");
  addMany(Math.max(0, medicalNeed - Math.ceil(medicalNeed * 0.85)), "Medical Director", "Medical", "Health");

  addMany(analyticsNeed, "Head of Analytics", "Analytics", "Data");
  addMany(executiveNeed, "General Manager", "Executive", "Roster Building");
}

function getSuggestedStaffSalary(role, member = null) {
  const rating = member ? getStaffRatingScore(member) : 70;
  const text = String(role || "").toLowerCase();

  let min = 0.3;
  let max = 1.0;

  if (text.includes("general manager")) {
    min = 2.0;
    max = 5.0;
  } else if (text.includes("head coach")) {
    min = 3.0;
    max = 8.0;
  } else if (text.includes("assistant") || text.includes("shooting") || text.includes("development")) {
    min = 0.4;
    max = 2.0;
  } else if (text.includes("scout")) {
    min = 0.3;
    max = 1.2;
  } else if (text.includes("medical") || text.includes("trainer") || text.includes("therapist") || text.includes("performance")) {
    min = 0.3;
    max = 1.3;
  } else if (text.includes("analytics")) {
    min = 0.5;
    max = 1.5;
  }

  const ratio = clamp((rating - 55) / 40, 0, 1);
  const salary = min + (max - min) * ratio;

  return Number(salary.toFixed(1));
}

function getStaffBudgetPayroll(staffGroup) {
  if (!staffGroup) return 0;

  const members = getAllSelectedStaffMembers(staffGroup).filter(member => {
    const role = String(member.role || "").toLowerCase();

    return !role.includes("owner") && !role.includes("president");
  });

  const total = members.reduce((sum, member) => sum + Number(member.salary || 0), 0);

  return Number(total.toFixed(1));
}

function getUserStaffBudgetStatus(extraSalary = 0, removedSalary = 0) {
  ensureStaffSystemState();

  const staff = getSelectedTeamStaff();
  const budget = Number(gameState.staffSalaryBudget || FCD_STAFF_SALARY_BUDGET);
  const currentPayroll = getStaffBudgetPayroll(staff);
  const projectedPayroll = Number((currentPayroll + Number(extraSalary || 0) - Number(removedSalary || 0)).toFixed(1));

  return {
    budget,
    currentPayroll,
    projectedPayroll,
    room: Number((budget - projectedPayroll).toFixed(1)),
    legal: projectedPayroll <= budget
  };
}

function getStaffMarketFilterForRole(role) {
  const department = getStaffDepartmentForRole(role);

  if (department === "Coaching") return "Coaching";
  if (department === "Scouting") return "Scouting";
  if (department === "Medical") return "Medical";
  if (department === "Executive") return "Executive";
  if (department === "Analytics") return "Analytics";

  return "ALL";
}

function setStaffMarketFilter(filter) {
  currentStaffMarketFilter = filter || "ALL";
  displayStaffMarketPage();
}

function goToStaffMarket(filter = "ALL") {
  currentStaffMarketFilter = filter || "ALL";

  showMainSection("front-office");
  showSecondaryScreen("staff-market-screen");
  displayStaffMarketPage();
}

function getFilteredStaffMarket() {
  ensureStaffSystemState();

  let market = gameState.staffMarket.filter(member => member && member.status !== "Retired");

  if (currentStaffMarketFilter !== "ALL") {
    market = market.filter(member => getStaffDepartmentForRole(member.role) === currentStaffMarketFilter);
  }

  market.sort((a, b) => {
    const departmentCompare = getStaffDepartmentForRole(a.role).localeCompare(getStaffDepartmentForRole(b.role));

    if (departmentCompare !== 0) return departmentCompare;

    return getStaffRatingScore(b) - getStaffRatingScore(a);
  });

  return market;
}

function displayStaffMarketPage() {
  const screen = document.getElementById("staff-market-screen");

  if (!screen || !gameState || !gameState.started) return;

  ensureStaffSystemState();

  const budget = getUserStaffBudgetStatus();
  const market = getFilteredStaffMarket();

  screen.innerHTML = `
    <div class="front-office-page staff-market-page">
      <div class="staff-page-header staff-market-header">
        <div>
          <h2>Staff Market</h2>
          <p>Hire coaches, scouts, medical staff, analytics staff, and front office staff.</p>
        </div>

        <div class="staff-budget-pill ${budget.legal ? "" : "over-budget"}">
          <span>Staff Budget</span>
          <strong>${formatStaffMoney(budget.currentPayroll)} / ${formatStaffMoney(budget.budget)}</strong>
        </div>
      </div>

      <div class="staff-market-toolbar card">
        <div>
          <label for="staff-market-filter">Department</label>
          <select id="staff-market-filter" onchange="setStaffMarketFilter(this.value)">
            <option value="ALL">All Staff</option>
            <option value="Coaching">Coaching</option>
            <option value="Scouting">Scouting</option>
            <option value="Medical">Medical</option>
            <option value="Analytics">Analytics</option>
            <option value="Executive">Executive</option>
          </select>
        </div>

        <div class="staff-market-budget-note">
          <strong>${formatStaffMoney(Math.max(0, budget.budget - budget.currentPayroll))}</strong>
          <span>budget room</span>
        </div>
      </div>

      <div class="staff-market-table card">
        <div class="staff-market-row staff-market-heading">
          <span>Name</span>
          <span>Age</span>
          <span>Role</span>
          <span>Grade</span>
          <span>Expected</span>
          <span>Action</span>
        </div>

        <div class="staff-market-list">
          ${
            market.length
              ? market.map(renderStaffMarketRow).join("")
              : `
                <div class="staff-market-empty">
                  <h3>No staff found</h3>
                  <p>No available staff match this filter.</p>
                </div>
              `
          }
        </div>
      </div>
    </div>
  `;

  const filterSelect = document.getElementById("staff-market-filter");
  if (filterSelect) filterSelect.value = currentStaffMarketFilter;
}

function renderStaffMarketRow(member) {
  const staffId = getStaffId(member);
  const expectedSalary = getSuggestedStaffSalary(member.role, member);
  const grade = getStaffDisplayGrade(member);

  return `
    <div class="staff-market-row">
      <div class="staff-market-name">
        <strong>${escapeStaffHtml(member.name || "Unknown Staff")}</strong>
        <small>${escapeStaffHtml(getStaffDepartmentForRole(member.role))}</small>
      </div>

      <span>${member.age || "--"}</span>
      <span>${escapeStaffHtml(member.role || "Staff")}</span>
      <span class="staff-grade-badge">${grade}</span>
      <span>${formatStaffMoney(expectedSalary)} / yr</span>

      <button type="button" onclick="openStaffNegotiation('${escapeStaffAttr(staffId)}', 'market')">
        Negotiate
      </button>
    </div>
  `;
}

function findStaffInMarket(staffId) {
  ensureStaffSystemState();

  return gameState.staffMarket.find(member => String(getStaffId(member)) === String(staffId)) || null;
}

function findStaffOnTeam(staffId, teamId = null) {
  ensureStaffSystemState();

  const teamIds = teamId
    ? [Number(teamId)]
    : Object.keys(gameState.staff || {}).map(Number);

  for (let id of teamIds) {
    const staffGroup = gameState.staff[id];

    if (!staffGroup) continue;

    ensureStaffGroupArrays(staffGroup);

    const singleSlots = [
      { key: "owner", member: staffGroup.owner },
      { key: "president", member: staffGroup.president },
      { key: "generalManager", member: staffGroup.generalManager },
      { key: "headCoach", member: staffGroup.headCoach }
    ];

    for (let slot of singleSlots) {
      if (slot.member && String(getStaffId(slot.member)) === String(staffId)) {
        return {
          teamId: id,
          staffGroup,
          member: slot.member,
          slotKey: slot.key
        };
      }
    }

    const arraySlots = ["assistantGeneralManagers", "assistants", "scouts", "medical", "analytics"];

    for (let key of arraySlots) {
      const list = staffGroup[key] || [];
      const member = list.find(item => item && String(getStaffId(item)) === String(staffId));

      if (member) {
        return {
          teamId: id,
          staffGroup,
          member,
          slotKey: key
        };
      }
    }
  }

  return null;
}

function canStaffMemberTakeRole(member, role) {
  const originalRole = String(member?.role || "").toLowerCase();

  if (originalRole.includes("head coach")) {
    return String(role || "").toLowerCase().includes("head coach");
  }

  return true;
}

function getStaffNegotiationRoleOptions(member) {
  if (!member) return FCD_STAFF_ROLE_OPTIONS;

  if (String(member.role || "").toLowerCase().includes("head coach")) {
    return ["Head Coach"];
  }

  return FCD_STAFF_ROLE_OPTIONS;
}

function getStaffSlotCount(teamId, role, ignoredStaffId = null) {
  const staffGroup = getTeamStaff(teamId);

  if (!staffGroup) return 0;

  ensureStaffGroupArrays(staffGroup);

  const slotKey = getStaffSlotKeyForRole(role);

  if (slotKey === "generalManager") {
    return staffGroup.generalManager && String(getStaffId(staffGroup.generalManager)) !== String(ignoredStaffId) ? 1 : 0;
  }

  if (slotKey === "headCoach") {
    return staffGroup.headCoach && String(getStaffId(staffGroup.headCoach)) !== String(ignoredStaffId) ? 1 : 0;
  }

  const list = staffGroup[slotKey] || [];

  return list.filter(member => {
    if (!member || isVacantStaffMember(member)) return false;
    return String(getStaffId(member)) !== String(ignoredStaffId);
  }).length;
}

function isStaffSlotAvailable(teamId, role, ignoredStaffId = null) {
  const slotKey = getStaffSlotKeyForRole(role);
  const rule = FCD_STAFF_SLOT_RULES[slotKey];

  if (!rule) return false;

  return getStaffSlotCount(teamId, role, ignoredStaffId) < rule.max;
}

function removeStaffFromTeam(teamId, staffId) {
  const staffGroup = getTeamStaff(teamId);

  if (!staffGroup) return null;

  ensureStaffGroupArrays(staffGroup);

  let removed = null;

  function removeFromSingle(key) {
    if (staffGroup[key] && String(getStaffId(staffGroup[key])) === String(staffId)) {
      removed = staffGroup[key];
      staffGroup[key] = null;
    }
  }

  removeFromSingle("generalManager");
  removeFromSingle("headCoach");

  const arraySlots = ["assistantGeneralManagers", "assistants", "scouts", "medical", "analytics"];

  for (let key of arraySlots) {
    const originalLength = staffGroup[key].length;

    staffGroup[key] = staffGroup[key].filter(member => {
      if (!member) return false;

      const isMatch = String(getStaffId(member)) === String(staffId);

      if (isMatch) removed = member;

      return !isMatch;
    });

    if (staffGroup[key].length !== originalLength) {
      break;
    }
  }

  rebuildStaffFlatList(staffGroup);

  return removed;
}

function addStaffToTeam(teamId, member, role) {
  const staffGroup = getTeamStaff(teamId);
  const team = getTeamById(teamId);

  if (!staffGroup || !team || !member) return false;

  if (!canStaffMemberTakeRole(member, role)) return false;
  if (!isStaffSlotAvailable(teamId, role, getStaffId(member))) return false;

  ensureStaffGroupArrays(staffGroup);

  const slotKey = getStaffSlotKeyForRole(role);

  normalizeStaffMember(member, teamId, role);

  member.teamId = Number(teamId);
  member.teamName = team.name;
  member.department = getStaffDepartmentForRole(role);
  member.status = "Active";
  member.isVacant = false;

  if (slotKey === "generalManager") {
    staffGroup.generalManager = member;
  } else if (slotKey === "headCoach") {
    staffGroup.headCoach = member;
  } else {
    if (!Array.isArray(staffGroup[slotKey])) {
      staffGroup[slotKey] = [];
    }

    const alreadyThere = staffGroup[slotKey].some(item => String(getStaffId(item)) === String(getStaffId(member)));

    if (!alreadyThere) {
      staffGroup[slotKey].push(member);
    }
  }

  rebuildStaffFlatList(staffGroup);

  return true;
}

function addStaffToMarket(member, reason = "Available") {
  if (!member) return;

  ensureStaffSystemState();

  const staffId = getStaffId(member);

  member.teamId = null;
  member.teamName = "Staff Market";
  member.status = "Available";
  member.contractYears = Math.max(0, Number(member.contractYears || 0));
  member.department = getStaffDepartmentForRole(member.role || "");
  member.marketReason = reason;

  const alreadyInMarket = gameState.staffMarket.some(item => String(getStaffId(item)) === String(staffId));

  if (!alreadyInMarket) {
    gameState.staffMarket.push(member);
  }
}

function addStaffMovement(move) {
  ensureStaffSystemState();

  const normalized = {
    id: move.id || `staff_move_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    seasonLabel: gameState.seasonLabel,
    date: move.date || new Date(gameState.currentDate).toISOString(),
    type: move.type || "MOVE",
    staffId: move.staffId || null,
    staffName: move.staffName || "Staff Member",
    role: move.role || "Staff",
    fromTeamId: move.fromTeamId || null,
    fromTeamName: move.fromTeamName || "",
    toTeamId: move.toTeamId || null,
    toTeamName: move.toTeamName || "",
    salary: Number(move.salary || 0),
    years: Number(move.years || 0),
    text: move.text || "Staff movement recorded."
  };

  gameState.staffMovement.unshift(normalized);

  if (gameState.staffMovement.length > 500) {
    gameState.staffMovement = gameState.staffMovement.slice(0, 500);
  }
}

function getStaffMovementTypeLabel(type) {
  const labels = {
    HIRED: "Hired",
    FIRED: "Fired",
    EXTENDED: "Extended",
    EXPIRED: "Expired"
  };

  return labels[type] || "Move";
}

function fireStaffMember(staffId) {
  ensureStaffSystemState();

  const result = findStaffOnTeam(staffId, gameState.selectedTeamId);

  if (!result || !result.member) {
    showModal("Fire Staff Failed", "That staff member could not be found on your staff.");
    return;
  }

  const member = result.member;
  const team = getTeamById(result.teamId);

  if (isStaffFireLocked(member)) {
    showModal("Cannot Fire Staff", "Owners and presidents are locked for now.");
    return;
  }

  const confirmed = confirm(
    `Fire ${member.name}?\n\nThey will leave your staff and enter the Staff Market.`
  );

  if (!confirmed) return;

  const removed = removeStaffFromTeam(result.teamId, staffId);

  if (!removed) return;

  removed.contractYears = 0;

  addStaffToMarket(removed, "Fired");

  addStaffMovement({
    type: "FIRED",
    staffId: getStaffId(removed),
    staffName: removed.name,
    role: removed.role,
    fromTeamId: team ? team.id : null,
    fromTeamName: team ? team.name : "Unknown Team",
    toTeamName: "Staff Market",
    salary: removed.salary,
    years: removed.contractYears,
    text: `${team ? team.name : "Your team"} fired ${removed.name}.`
  });

  addInboxMessage(
    "Staff Fired",
    `${removed.name} has been fired and moved to the Staff Market.`,
    "staff"
  );

  refreshAll();
}

function openStaffNegotiation(staffId, mode = "market") {
  ensureStaffSystemState();

  let member = null;
  let teamId = gameState.selectedTeamId;

  if (mode === "market") {
    member = findStaffInMarket(staffId);
  } else {
    const result = findStaffOnTeam(staffId, gameState.selectedTeamId);
    member = result ? result.member : null;
    teamId = result ? result.teamId : gameState.selectedTeamId;
  }

  if (!member) {
    showModal("Staff Not Found", "That staff member could not be found.");
    return;
  }

  currentStaffNegotiation = {
    staffId,
    mode,
    teamId
  };

  const roleOptions = getStaffNegotiationRoleOptions(member);
  const suggestedSalary = mode === "market"
    ? getSuggestedStaffSalary(member.role, member)
    : Number(member.salary || getSuggestedStaffSalary(member.role, member));

  const suggestedYears = mode === "market"
    ? 2
    : Math.max(1, Number(member.contractYears || 1) + 1);

  const overlay = getStaffNegotiationOverlay();

  overlay.innerHTML = `
    <div class="staff-negotiation-panel">
      <div class="staff-negotiation-header">
        <div>
          <span>${mode === "market" ? "Staff Market Negotiation" : "Staff Extension"}</span>
          <h2>${escapeStaffHtml(member.name)}</h2>
          <p>${escapeStaffHtml(member.role || "Staff")} · Age ${member.age || "--"} · Grade ${getStaffDisplayGrade(member)}</p>
        </div>

        <button type="button" class="staff-negotiation-close" onclick="closeStaffNegotiation()">×</button>
      </div>

      <div class="staff-negotiation-grid">
        <label>
          Salary Per Year
          <input id="staff-offer-salary" type="number" min="0.1" max="25" step="0.1" value="${suggestedSalary}">
        </label>

        <label>
          Years
          <input id="staff-offer-years" type="number" min="1" max="6" step="1" value="${suggestedYears}">
        </label>

        <label>
          Position
          <select id="staff-offer-role">
            ${roleOptions.map(role => `
              <option value="${escapeStaffAttr(role)}" ${role === member.role ? "selected" : ""}>
                ${escapeStaffHtml(role)}
              </option>
            `).join("")}
          </select>
        </label>
      </div>

      <div class="staff-negotiation-budget-box" id="staff-negotiation-budget-preview"></div>

      <div class="staff-negotiation-actions">
        <button type="button" onclick="submitStaffNegotiationOffer()">
          Submit Offer
        </button>

        <button type="button" class="secondary-button" onclick="closeStaffNegotiation()">
          Cancel
        </button>
      </div>
    </div>
  `;

  overlay.classList.remove("hidden");

  const salaryInput = document.getElementById("staff-offer-salary");
  const yearsInput = document.getElementById("staff-offer-years");
  const roleInput = document.getElementById("staff-offer-role");

  if (salaryInput) salaryInput.oninput = updateStaffNegotiationBudgetPreview;
  if (yearsInput) yearsInput.oninput = updateStaffNegotiationBudgetPreview;
  if (roleInput) roleInput.onchange = updateStaffNegotiationBudgetPreview;

  updateStaffNegotiationBudgetPreview();
}

function getStaffNegotiationOverlay() {
  let overlay = document.getElementById("staff-negotiation-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "staff-negotiation-overlay";
    overlay.className = "staff-negotiation-overlay hidden";
    document.body.appendChild(overlay);
  }

  return overlay;
}

function closeStaffNegotiation() {
  const overlay = document.getElementById("staff-negotiation-overlay");

  if (overlay) {
    overlay.classList.add("hidden");
  }

  currentStaffNegotiation = null;
}

function updateStaffNegotiationBudgetPreview() {
  if (!currentStaffNegotiation) return;

  const salaryInput = document.getElementById("staff-offer-salary");
  const preview = document.getElementById("staff-negotiation-budget-preview");

  if (!salaryInput || !preview) return;

  const salary = Number(salaryInput.value || 0);

  let oldSalary = 0;

  if (currentStaffNegotiation.mode === "extension") {
    const result = findStaffOnTeam(currentStaffNegotiation.staffId, gameState.selectedTeamId);
    oldSalary = result && result.member ? Number(result.member.salary || 0) : 0;
  }

  const budget = getUserStaffBudgetStatus(salary, oldSalary);

  preview.classList.toggle("over-budget", !budget.legal);

  preview.innerHTML = `
    <span>Projected Staff Payroll</span>
    <strong>${formatStaffMoney(budget.projectedPayroll)} / ${formatStaffMoney(budget.budget)}</strong>
    <small>${budget.legal ? `${formatStaffMoney(budget.room)} remaining` : `Over budget by ${formatStaffMoney(Math.abs(budget.room))}`}</small>
  `;
}

function submitStaffNegotiationOffer() {
  if (!currentStaffNegotiation) return;

  const salary = Number(document.getElementById("staff-offer-salary")?.value || 0);
  const years = Number(document.getElementById("staff-offer-years")?.value || 1);
  const role = document.getElementById("staff-offer-role")?.value || "Assistant Coach";

  if (salary <= 0 || years <= 0) {
    showModal("Invalid Offer", "Salary and years must both be greater than zero.");
    return;
  }

  if (currentStaffNegotiation.mode === "market") {
    signStaffFromMarket(currentStaffNegotiation.staffId, salary, years, role);
  } else {
    extendCurrentStaffMember(currentStaffNegotiation.staffId, salary, years, role);
  }
}

function signStaffFromMarket(staffId, salary, years, role) {
  const member = findStaffInMarket(staffId);
  const selectedTeam = getSelectedTeam();

  if (!member || !selectedTeam) {
    showModal("Signing Failed", "That staff member is no longer available.");
    return;
  }

  if (!canStaffMemberTakeRole(member, role)) {
    showModal("Role Blocked", "Head coaches can only be hired as head coaches.");
    return;
  }

  if (!isStaffSlotAvailable(selectedTeam.id, role)) {
    showModal("Staff Slot Full", `You do not have an open ${role} slot.`);
    return;
  }

  const budget = getUserStaffBudgetStatus(salary, 0);

  if (!budget.legal) {
    showModal(
      "Staff Budget Exceeded",
      `This offer would put your staff payroll at ${formatStaffMoney(budget.projectedPayroll)}. Your staff budget is ${formatStaffMoney(budget.budget)}.`
    );
    return;
  }

  gameState.staffMarket = gameState.staffMarket.filter(item => String(getStaffId(item)) !== String(staffId));

  member.salary = Number(salary.toFixed(1));
  member.contractYears = Number(years);
  member.contract = `${years} yr${years === 1 ? "" : "s"} / ${formatStaffMoney(salary)}`;

  const added = addStaffToTeam(selectedTeam.id, member, role);

  if (!added) {
    addStaffToMarket(member, "Available");
    showModal("Signing Failed", "That staff slot could not be filled.");
    return;
  }

  addStaffMovement({
    type: "HIRED",
    staffId: getStaffId(member),
    staffName: member.name,
    role,
    fromTeamName: "Staff Market",
    toTeamId: selectedTeam.id,
    toTeamName: selectedTeam.name,
    salary,
    years,
    text: `${selectedTeam.name} hired ${member.name} as ${role} on a ${years}-year deal worth ${formatStaffMoney(salary)} per season.`
  });

  addInboxMessage(
    "Staff Hired",
    `${selectedTeam.name} hired ${member.name} as ${role} on a ${years}-year deal worth ${formatStaffMoney(salary)} per season.`,
    "staff"
  );

  closeStaffNegotiation();
  refreshAll();
}

function extendCurrentStaffMember(staffId, salary, years, role) {
  const result = findStaffOnTeam(staffId, gameState.selectedTeamId);
  const selectedTeam = getSelectedTeam();

  if (!result || !result.member || !selectedTeam) {
    showModal("Extension Failed", "That staff member could not be found.");
    return;
  }

  const member = result.member;
  const oldSalary = Number(member.salary || 0);

  if (!canStaffMemberTakeRole(member, role)) {
    showModal("Role Blocked", "Head coaches can only stay as head coaches.");
    return;
  }

  if (!isStaffSlotAvailable(selectedTeam.id, role, staffId)) {
    showModal("Staff Slot Full", `You do not have an open ${role} slot.`);
    return;
  }

  const budget = getUserStaffBudgetStatus(salary, oldSalary);

  if (!budget.legal) {
    showModal(
      "Staff Budget Exceeded",
      `This extension would put your staff payroll at ${formatStaffMoney(budget.projectedPayroll)}. Your staff budget is ${formatStaffMoney(budget.budget)}.`
    );
    return;
  }

  removeStaffFromTeam(selectedTeam.id, staffId);

  member.salary = Number(salary.toFixed(1));
  member.contractYears = Number(years);
  member.contract = `${years} yr${years === 1 ? "" : "s"} / ${formatStaffMoney(salary)}`;
  member.status = "Active";

  addStaffToTeam(selectedTeam.id, member, role);

  addStaffMovement({
    type: "EXTENDED",
    staffId: getStaffId(member),
    staffName: member.name,
    role,
    fromTeamId: selectedTeam.id,
    fromTeamName: selectedTeam.name,
    toTeamId: selectedTeam.id,
    toTeamName: selectedTeam.name,
    salary,
    years,
    text: `${selectedTeam.name} extended ${member.name} as ${role} on a ${years}-year deal worth ${formatStaffMoney(salary)} per season.`
  });

  addInboxMessage(
    "Staff Extended",
    `${member.name} accepted a ${years}-year extension worth ${formatStaffMoney(salary)} per season.`,
    "staff"
  );

  closeStaffNegotiation();
  refreshAll();
}

function renderDetailedStaffMiniCard(member) {
  if (!member || member.isVacant || member.name === "Vacant") {
    return renderVacantStaffCard("Open Slot", "Staff");
  }

  const staffId = getStaffId(member);
  const label = getStaffStyleLabel(member, "General");
  const grade = getStaffDisplayGrade(member);
  const canFire = !isStaffFireLocked(member);

  return `
    <div class="staff-mini-card staff-action-card">
      <span>${escapeStaffHtml(member.role || "Staff")}</span>
      <strong>${escapeStaffHtml(member.name || "Unknown Staff")}</strong>
      <p>${escapeStaffHtml(label)} <b>${grade}</b></p>
      <small>${member.contractYears || 1} yrs · ${formatStaffMoney(member.salary)}</small>

      <div class="staff-card-actions">
        <button type="button" onclick="openStaffNegotiation('${escapeStaffAttr(staffId)}', 'extension')">
          Extend
        </button>

        ${
          canFire
            ? `<button type="button" class="staff-fire-button" onclick="fireStaffMember('${escapeStaffAttr(staffId)}')">Fire</button>`
            : `<button type="button" class="staff-locked-button" disabled>Locked</button>`
        }
      </div>
    </div>
  `;
}

function renderVacantStaffCard(label, role) {
  const filter = getStaffMarketFilterForRole(role);

  return `
    <div class="staff-mini-card staff-action-card vacant-staff-card">
      <span>${escapeStaffHtml(label)}</span>
      <strong>Vacant</strong>
      <p>Open staff slot <b>-</b></p>
      <small>No contract</small>

      <div class="staff-card-actions">
        <button type="button" onclick="goToStaffMarket('${escapeStaffAttr(filter)}')">
          Hire From Market
        </button>
      </div>
    </div>
  `;
}

function renderStaffSlotCards(list, max, vacantRole, vacantLabel = "Open Slot") {
  const activeList = (list || []).filter(member => member && !isVacantStaffMember(member));
  const cards = activeList.map(renderDetailedStaffMiniCard);

  const openSlots = Math.max(0, max - activeList.length);

  for (let i = 0; i < openSlots; i++) {
    cards.push(renderVacantStaffCard(`${vacantLabel} ${activeList.length + i + 1}`, vacantRole));
  }

  return cards.join("");
}

function displayCoachingStaffFromState() {
  if (!gameState) return;

  ensureStaffSystemState();

  const staff = getSelectedTeamStaff();
  if (!staff) return;

  const headCoachWrap = document.querySelector("#coaching-staff-screen .head-coach-feature-card");

  if (headCoachWrap) {
    if (staff.headCoach && !isVacantStaffMember(staff.headCoach)) {
      const coach = staff.headCoach;
      const staffId = getStaffId(coach);

      headCoachWrap.innerHTML = `
        <div class="head-coach-badge">HC</div>
        <div class="head-coach-photo">HC</div>

        <div class="head-coach-main-info">
          <span>Head Coach</span>
          <h3 id="coaching-head-coach-name">${escapeStaffHtml(coach.name)}</h3>
          <p>Age: ${coach.age || "--"}</p>
          <p>Style: ${escapeStaffHtml(getStaffStyleLabel(coach, "Balanced"))}</p>
          <p>Contract: ${coach.contractYears || 1} yrs / ${formatStaffMoney(coach.salary)}</p>
          <p>Status: ${coach.status || "Active"}</p>

          <div class="staff-card-actions head-coach-actions">
            <button type="button" onclick="openStaffNegotiation('${escapeStaffAttr(staffId)}', 'extension')">Extend</button>
            <button type="button" class="staff-fire-button" onclick="fireStaffMember('${escapeStaffAttr(staffId)}')">Fire</button>
          </div>
        </div>

        <div class="head-coach-grades">
          <div><span>Offense</span><strong>${numberToStaffGrade(gradeToNumber(coach.offense))}</strong></div>
          <div><span>Defense</span><strong>${numberToStaffGrade(gradeToNumber(coach.defense))}</strong></div>
          <div><span>Development</span><strong>${numberToStaffGrade(gradeToNumber(coach.playerDevelopment || coach.development))}</strong></div>
          <div><span>Motivation</span><strong>${numberToStaffGrade(gradeToNumber(coach.motivation))}</strong></div>
        </div>

        <div class="head-coach-rating">${getStaffRatingScore(coach)}</div>
      `;
    } else {
      headCoachWrap.innerHTML = renderVacantStaffCard("Head Coach", "Head Coach");
    }
  }

  const assistantList = document.getElementById("assistant-coaches-list");
  if (assistantList) {
    assistantList.innerHTML = renderStaffSlotCards(staff.assistants || [], 15, "Assistant Coach", "Assistant Coach");
  }

  const specialtyList = document.getElementById("specialty-coaches-list");
  if (specialtyList) {
    const specialty = (staff.assistants || []).filter(member => {
      const role = String(member.role || "");
      return role.includes("Shooting") || role.includes("Development") || role.includes("Specialty");
    });

    specialtyList.innerHTML = specialty.length
      ? specialty.map(renderDetailedStaffMiniCard).join("")
      : renderVacantStaffCard("Specialty Coach", "Shooting Coach");
  }
}

function displayScoutingStaffFromState() {
  if (!gameState) return;

  ensureStaffSystemState();

  const staff = getSelectedTeamStaff();
  if (!staff) return;

  const scoutCards = document.querySelectorAll("#scouting-squad-screen .staff-mini-card-grid");

  const scouts = staff.scouts || [];

  const gLeague = scouts.filter(member => {
    const text = `${member.role || ""} ${member.region || ""} ${member.specialty || ""}`.toLowerCase();
    return text.includes("g league");
  });

  const college = scouts.filter(member => {
    const text = `${member.role || ""} ${member.region || ""} ${member.specialty || ""}`.toLowerCase();
    return text.includes("college") || text.includes("lead scout");
  });

  const international = scouts.filter(member => {
    const text = `${member.role || ""} ${member.region || ""} ${member.specialty || ""}`.toLowerCase();
    return text.includes("international") || text.includes("europe") || text.includes("overseas");
  });

  if (scoutCards[0]) {
    scoutCards[0].innerHTML = gLeague.length
      ? gLeague.map(renderDetailedStaffMiniCard).join("")
      : renderVacantStaffCard("G League Scout", "College Scout");
  }

  if (scoutCards[1]) {
    scoutCards[1].innerHTML = college.length
      ? college.map(renderDetailedStaffMiniCard).join("")
      : renderVacantStaffCard("College Scout", "College Scout");
  }

  if (scoutCards[2]) {
    scoutCards[2].innerHTML = international.length
      ? international.map(renderDetailedStaffMiniCard).join("")
      : renderVacantStaffCard("International Scout", "Europe Scout");
  }
}

function displayMedicalStaffFromState() {
  if (!gameState) return;

  ensureStaffSystemState();

  const staff = getSelectedTeamStaff();
  if (!staff) return;

  const medicalList = document.getElementById("medical-staff-list");

  if (medicalList) {
    medicalList.innerHTML = renderStaffSlotCards(staff.medical || [], 10, "Head Athletic Trainer", "Medical Staff");
  }

  const analyticsGrid = document.querySelector("#medical-staff-screen .staff-mini-card-grid.two-wide");

  if (analyticsGrid) {
    analyticsGrid.innerHTML = renderStaffSlotCards(staff.analytics || [], 2, "Head of Analytics", "Analytics Staff");
  }
}

function displayOrganizationStaffFromState() {
  if (!gameState) return;

  ensureStaffSystemState();

  const staff = getSelectedTeamStaff();
  if (!staff) return;

  const totalPayroll = getStaffBudgetPayroll(staff);
  const budget = Number(gameState.staffSalaryBudget || FCD_STAFF_SALARY_BUDGET);
  const chemistry = calculateStaffChemistry(staff);
  const organizationGrade = getOrganizationGrade(chemistry);
  const ownerConfidence = calculateOwnerConfidence(staff);

  const organizationCards = document.querySelectorAll("#organization-screen .front-office-big-number");

  if (organizationCards[0]) {
    organizationCards[0].innerHTML = `
      <strong>${organizationGrade}</strong>
      <span>${chemistry >= 85 ? "Strong Organization" : "Developing Organization"}</span>
    `;
  }

  if (organizationCards[1]) {
    organizationCards[1].innerHTML = `
      <strong>${formatStaffMoney(totalPayroll)}</strong>
      <span>of ${formatStaffMoney(budget)} used</span>
    `;
  }

  if (organizationCards[2]) {
    organizationCards[2].innerHTML = `
      <strong>${chemistry}</strong>
      <span>${getOrganizationGrade(chemistry)}</span>
    `;
  }

  if (organizationCards[3]) {
    organizationCards[3].innerHTML = `
      <strong>${ownerConfidence}</strong>
      <span>${getOwnerConfidenceLabel(ownerConfidence)}</span>
    `;
  }
}

function displayFrontOfficeStaff() {
  if (!gameState || !gameState.started) return;

  ensureStaffSystemState();

  displayFrontOfficeGM();
  displayStaffOverviewFromState();
  displayCoachingStaffFromState();
  displayScoutingStaffFromState();
  displayMedicalStaffFromState();
  displayOrganizationStaffFromState();
  displayStaffMarketPage();
}

function getCpuStaffHiringLimit() {
  const phase = typeof getSeasonPhase === "function" ? getSeasonPhase() : "Regular Season";

  if (gameState.offseasonActive || phase === "Offseason") {
    return randomInt(0, 2);
  }

  return randomInt(0, 1);
}

function getStaffWeeklyProcessKey() {
  const date = new Date(gameState.currentDate);

  return `staff_cpu_week_${gameState.seasonLabel}_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}`;
}

function shouldProcessCpuStaffMarketThisWeek() {
  if (!gameState || !gameState.started) return false;

  const date = new Date(gameState.currentDate);

  // Sunday only, so it feels like weekly staff movement.
  if (date.getDay() !== 0) return false;

  if (!gameState.processedStaffEvents) {
    gameState.processedStaffEvents = {};
  }

  const key = getStaffWeeklyProcessKey();

  return gameState.processedStaffEvents[key] !== true;
}

function markCpuStaffMarketProcessedThisWeek() {
  if (!gameState.processedStaffEvents) {
    gameState.processedStaffEvents = {};
  }

  gameState.processedStaffEvents[getStaffWeeklyProcessKey()] = true;
}

function getTeamVacantStaffRoles(teamId) {
  const staffGroup = getTeamStaff(teamId);

  if (!staffGroup) return [];

  ensureStaffGroupArrays(staffGroup);

  const roles = [];

  if (!staffGroup.generalManager || isVacantStaffMember(staffGroup.generalManager)) {
    roles.push("General Manager");
  }

  if (!staffGroup.headCoach || isVacantStaffMember(staffGroup.headCoach)) {
    roles.push("Head Coach");
  }

  const assistantOpen = Math.max(0, FCD_STAFF_SLOT_RULES.assistants.max - (staffGroup.assistants || []).filter(member => !isVacantStaffMember(member)).length);
  const scoutOpen = Math.max(0, FCD_STAFF_SLOT_RULES.scouts.max - (staffGroup.scouts || []).filter(member => !isVacantStaffMember(member)).length);
  const medicalOpen = Math.max(0, FCD_STAFF_SLOT_RULES.medical.max - (staffGroup.medical || []).filter(member => !isVacantStaffMember(member)).length);
  const analyticsOpen = Math.max(0, FCD_STAFF_SLOT_RULES.analytics.max - (staffGroup.analytics || []).filter(member => !isVacantStaffMember(member)).length);

  if (assistantOpen > 0) roles.push("Assistant Coach");
  if (scoutOpen > 0) roles.push("College Scout");
  if (medicalOpen > 0) roles.push("Head Athletic Trainer");
  if (analyticsOpen > 0) roles.push("Head of Analytics");

  return roles;
}

function findBestMarketStaffIndexForRole(role) {
  ensureStaffMarketMinimums();

  const roleDepartment = getStaffDepartmentForRole(role);
  const roleSlot = getStaffSlotKeyForRole(role);

  let candidates = gameState.staffMarket
    .map((member, index) => ({ member, index }))
    .filter(item => {
      if (!item.member) return false;
      if (!canStaffMemberTakeRole(item.member, role)) return false;

      const memberSlot = getStaffSlotKeyForRole(item.member.role);

      if (roleSlot === "headCoach") {
        return true;
      }

      return memberSlot === roleSlot || getStaffDepartmentForRole(item.member.role) === roleDepartment;
    });

  if (!candidates.length) return -1;

  candidates.sort((a, b) => getStaffRatingScore(b.member) - getStaffRatingScore(a.member));

  return candidates[0].index;
}

function processOneCpuStaffSigning() {
  const cpuTeams = gameState.teams
    .filter(team => Number(team.id) !== Number(gameState.selectedTeamId))
    .map(team => ({
      team,
      vacancies: getTeamVacantStaffRoles(team.id)
    }))
    .filter(item => item.vacancies.length > 0);

  if (!cpuTeams.length) return null;

  const target = cpuTeams[randomInt(0, cpuTeams.length - 1)];
  const role = target.vacancies[0];

  const marketIndex = findBestMarketStaffIndexForRole(role);

  if (marketIndex < 0) return null;

  const member = gameState.staffMarket.splice(marketIndex, 1)[0];

  const salary = getSuggestedStaffSalary(role, member);
  const years = randomInt(1, 4);

  member.salary = salary;
  member.contractYears = years;
  member.contract = `${years} yr${years === 1 ? "" : "s"} / ${formatStaffMoney(salary)}`;

  const added = addStaffToTeam(target.team.id, member, role);

  if (!added) {
    addStaffToMarket(member, "Available");
    return null;
  }

  const move = {
    type: "HIRED",
    staffId: getStaffId(member),
    staffName: member.name,
    role,
    fromTeamName: "Staff Market",
    toTeamId: target.team.id,
    toTeamName: target.team.name,
    salary,
    years,
    text: `${target.team.name} hired ${member.name} as ${role} on a ${years}-year deal worth ${formatStaffMoney(salary)} per season.`
  };

  addStaffMovement(move);

  return move;
}

function processCpuStaffMarketWeekly() {
  if (!shouldProcessCpuStaffMarketThisWeek()) return;

  const limit = getCpuStaffHiringLimit();
  const moves = [];

  for (let i = 0; i < limit; i++) {
    const move = processOneCpuStaffSigning();

    if (!move) break;

    moves.push(move);
  }

  markCpuStaffMarketProcessedThisWeek();

  if (moves.length > 0) {
    const first = moves[0];

    addInboxMessage(
      "Staff Movement",
      moves.length === 1
        ? first.text
        : `${moves.length} staff moves were completed around the league this week.`,
      "staff"
    );
  }
}

function processStaffContractExpirationsJune30() {
  if (!gameState || !gameState.started || !gameState.currentDate) return;

  const dateKey = getCurrentDateKey();

  if (dateKey !== 630) return;

  if (!gameState.processedStaffEvents) {
    gameState.processedStaffEvents = {};
  }

  const key = `staff_contracts_june30_${gameState.seasonLabel}`;

  if (gameState.processedStaffEvents[key]) return;

  const expired = [];

  for (let team of gameState.teams) {
    const staffGroup = getTeamStaff(team.id);

    if (!staffGroup) continue;

    ensureStaffGroupArrays(staffGroup);

    const members = getAllSelectedStaffMembers(staffGroup);

    for (let member of members) {
      if (!member || isStaffFireLocked(member)) continue;

      member.contractYears = Math.max(0, Number(member.contractYears || 0) - 1);
      member.contract = `${member.contractYears} yr${member.contractYears === 1 ? "" : "s"} / ${formatStaffMoney(member.salary)}`;

      if (member.contractYears <= 0) {
        expired.push({
          team,
          member
        });
      }
    }
  }

  for (let item of expired) {
    const staffId = getStaffId(item.member);
    const removed = removeStaffFromTeam(item.team.id, staffId);

    if (!removed) continue;

    removed.contractYears = 0;

    addStaffToMarket(removed, "Expired Contract");

    addStaffMovement({
      type: "EXPIRED",
      staffId,
      staffName: removed.name,
      role: removed.role,
      fromTeamId: item.team.id,
      fromTeamName: item.team.name,
      toTeamName: "Staff Market",
      salary: removed.salary,
      years: 0,
      text: `${removed.name}'s contract with ${item.team.name} expired.`
    });
  }

  if (expired.some(item => Number(item.team.id) === Number(gameState.selectedTeamId))) {
    addInboxMessage(
      "Staff Contracts Expired",
      "Some of your staff contracts expired on June 30. Check the Staff Market to fill open slots.",
      "staff"
    );
  }

  gameState.processedStaffEvents[key] = true;
}

function processStaffSystemDaily() {
  if (!gameState || !gameState.started) return;

  ensureStaffSystemState();
  processStaffContractExpirationsJune30();
  processCpuStaffMarketWeekly();
}

function displayStaffMovementPage() {
  const screen = document.getElementById("staff-movement-screen");

  if (!screen || !gameState || !gameState.started) return;

  ensureStaffSystemState();

  const moves = (gameState.staffMovement || []).filter(move => {
    return !move.seasonLabel || move.seasonLabel === gameState.seasonLabel;
  });

  screen.innerHTML = `
    <div class="league-wire-page staff-movement-page">
      <div class="league-wire-hero">
        <div>
          <div class="league-wire-kicker">Front Office Wire</div>
          <h2>Staff Movement</h2>
          <p>Staff hires, firings, extensions, and contract expirations for the current season.</p>
        </div>

        <div class="league-wire-season-box">
          <span>Season</span>
          <strong>${gameState.seasonLabel}</strong>
        </div>
      </div>

      <div class="league-wire-content">
        <div class="league-wire-list-wrap">
          <div class="league-wire-list-header">
            <span>Movement</span>
            <span>Team / Staff</span>
          </div>

          <div class="league-transactions-list">
            ${
              moves.length
                ? renderStaffMovementGroupedRows(moves)
                : `
                  <div class="league-transactions-empty">
                    <div class="empty-transaction-icon">⌂</div>
                    <h3>No staff movement recorded yet</h3>
                    <p>Hires, firings, extensions, and expired contracts will appear here.</p>
                  </div>
                `
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStaffMovementGroupedRows(moves) {
  const groups = {};

  for (let move of moves) {
    const label = formatDate(new Date(move.date));

    if (!groups[label]) groups[label] = [];

    groups[label].push(move);
  }

  return Object.keys(groups).map(dateLabel => `
    <div class="league-transaction-date-group">
      <div class="league-transaction-date-label">${dateLabel}</div>
      ${groups[dateLabel].map(renderStaffMovementRow).join("")}
    </div>
  `).join("");
}

function renderStaffMovementRow(move) {
  const typeLabel = getStaffMovementTypeLabel(move.type);
  const typeClass = `staff-movement-${String(move.type || "MOVE").toLowerCase()}`;

  return `
    <div class="league-transaction-row staff-movement-row">
      <div class="league-transaction-type ${typeClass}">
        ${typeLabel}
      </div>

      <div class="league-transaction-identity">
        <div class="league-transaction-team-logo">
          ${getTeamInitials(move.toTeamName || move.fromTeamName || "STAFF")}
        </div>

        <div class="league-transaction-player-headshot-wrap staff-headshot-wrap">
          <span>STAFF</span>
        </div>
      </div>

      <div class="league-transaction-main">
        <p>${escapeStaffHtml(move.text || "Staff movement recorded.")}</p>
        <span>${escapeStaffHtml(move.toTeamName || move.fromTeamName || "Staff Market")}</span>
      </div>
    </div>
  `;
}