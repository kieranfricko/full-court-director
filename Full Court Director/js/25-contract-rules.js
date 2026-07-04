/*
 * Full Court Director — Contract / Free Agency Rules Engine (Phase 1)
 * Money is expressed in millions throughout this file.
 */
(function contractRulesModule(global) {
  "use strict";

  const TOOL = Object.freeze({
    CAP_SPACE: "CAP_SPACE",
    FULL_BIRD: "FULL_BIRD",
    EARLY_BIRD: "EARLY_BIRD",
    NON_BIRD: "NON_BIRD",
    DISABLED_PLAYER_EXCEPTION: "DISABLED_PLAYER_EXCEPTION",
    BI_ANNUAL_EXCEPTION: "BI_ANNUAL_EXCEPTION",
    NON_TAXPAYER_MLE: "NON_TAXPAYER_MLE",
    TAXPAYER_MLE: "TAXPAYER_MLE",
    ROOM_MLE: "ROOM_MLE",
    ROOKIE_SCALE_EXCEPTION: "ROOKIE_SCALE_EXCEPTION",
    MINIMUM_EXCEPTION: "MINIMUM_EXCEPTION",
    TRADED_PLAYER_EXCEPTION: "TRADED_PLAYER_EXCEPTION",
    SECOND_ROUND_PICK_EXCEPTION: "SECOND_ROUND_PICK_EXCEPTION",
    TWO_WAY: "TWO_WAY",
    REINSTATEMENT: "REINSTATEMENT"
  });

  const RIGHTS = Object.freeze({
    FULL_BIRD: "FULL_BIRD",
    EARLY_BIRD: "EARLY_BIRD",
    NON_BIRD: "NON_BIRD"
  });

  const BASE_2023_CAP = 136.021;
  const DEFAULT_CAP = 155;
  const MINIMUM_SALARY_RATIOS = [
    0.00785, 0.01263, 0.01416, 0.01466, 0.01517,
    0.01645, 0.01773, 0.01901, 0.02029, 0.02039, 0.02239
  ];

  function money(value, fallback = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return roundMoney(fallback);
    return roundMoney(Math.abs(number) > 10000 ? number / 1000000 : number);
  }

  function roundMoney(value) {
    return Math.round((Number(value) || 0) * 1000) / 1000;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value) || 0));
  }

  function state() {
    return typeof gameState !== "undefined" && gameState ? gameState : null;
  }

  function dateValue(value) {
    const date = value instanceof Date ? new Date(value) : new Date(value || state()?.currentDate || Date.now());
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  function dateKey(value) {
    const date = dateValue(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function currentSeasonLabel(input) {
    if (input) return String(input);
    const gs = state();
    if (gs?.salaryCapSeason) return String(gs.salaryCapSeason);
    if (gs?.seasonLabel && /^\d{4}-\d{4}$/.test(String(gs.seasonLabel))) return String(gs.seasonLabel);
    if (typeof getSeasonLabelFromGameDate === "function" && gs?.currentDate) {
      return getSeasonLabelFromGameDate(gs.currentDate);
    }
    const year = Number(gs?.seasonStartYear) || dateValue(gs?.currentDate).getFullYear();
    return `${year}-${year + 1}`;
  }

  function configuredSeason(seasonLabel) {
    const label = currentSeasonLabel(seasonLabel);
    if (typeof SALARY_CAP_TABLE !== "undefined" && SALARY_CAP_TABLE[label]) {
      return SALARY_CAP_TABLE[label];
    }
    return state()?.salaryCapInfo?.seasonLabel === label ? state().salaryCapInfo : {};
  }

  function getContractRulesConfig(seasonLabel) {
    const label = currentSeasonLabel(seasonLabel);
    const raw = configuredSeason(label);
    const salaryCap = money(raw.salaryCap ?? state()?.salaryCap ?? (typeof SALARY_CAP !== "undefined" ? SALARY_CAP : DEFAULT_CAP), DEFAULT_CAP);
    const minimums = {};
    MINIMUM_SALARY_RATIOS.forEach((ratio, years) => {
      minimums[years] = roundMoney(salaryCap * ratio);
    });
    const zeroYearsMinimum = money(raw.zeroYearsMinimum, minimums[0]);

    return Object.freeze({
      seasonLabel: label,
      salaryCap,
      minimumTeamSalary: money(raw.minimumTeamSalary, salaryCap * 0.9),
      luxuryTaxLine: money(raw.luxuryTaxLine ?? raw.luxuryTax, salaryCap * 1.215),
      firstApron: money(raw.firstApron, salaryCap * 1.268),
      secondApron: money(raw.secondApron, salaryCap * 1.346),
      estimatedAveragePlayerSalary: money(raw.estimatedAveragePlayerSalary, salaryCap / 14),
      averagePlayerSalary: money(raw.averagePlayerSalary, salaryCap / 14),
      minimumSalaryByYearsService: raw.minimumSalaryByYearsService || minimums,
      zeroYearsMinimum,
      nonTaxpayerMLE: money(raw.nonTaxpayerMLE, salaryCap * 0.0912),
      taxpayerMLE: money(raw.taxpayerMLE, 5 * salaryCap / BASE_2023_CAP),
      roomMLE: money(raw.roomMLE ?? raw.teamRoomMLE, salaryCap * 0.05678),
      biAnnualException: money(raw.biAnnualException ?? raw.bae, salaryCap * 0.0332),
      secondRoundPickException: raw.secondRoundPickException || {
        twoYearStructure: [1, 1],
        threeYearStructure: [1, 1, 1],
        requiresTeamOption: true
      },
      rookieScaleAmounts: raw.rookieScaleAmounts || {}
    });
  }

  const getSalaryCapLine = season => getContractRulesConfig(season).salaryCap;
  const getMinimumTeamSalaryLine = season => getContractRulesConfig(season).minimumTeamSalary;
  const getLuxuryTaxLineForRules = season => getContractRulesConfig(season).luxuryTaxLine;
  const getFirstApronLineForRules = season => getContractRulesConfig(season).firstApron;
  const getSecondApronLineForRules = season => getContractRulesConfig(season).secondApron;
  const getZeroYearsMinimumSalary = season => getContractRulesConfig(season).zeroYearsMinimum;
  const getEstimatedAveragePlayerSalary = season => getContractRulesConfig(season).estimatedAveragePlayerSalary;

  function getMinimumSalaryForYearsService(yearsService, seasonLabel) {
    const config = getContractRulesConfig(seasonLabel);
    const years = clamp(Math.floor(Number(yearsService) || 0), 0, 10);
    return money(config.minimumSalaryByYearsService[years], config.zeroYearsMinimum);
  }

  function getRoster(teamId) {
    return Array.isArray(state()?.rosters?.[teamId]) ? state().rosters[teamId] : [];
  }

  function allPlayers() {
    const rosters = Object.values(state()?.rosters || {}).flat();
    return rosters.concat(Array.isArray(state()?.freeAgents) ? state().freeAgents : []);
  }

  function findPlayer(playerId) {
    return allPlayers().find(player => String(player?.id ?? player?.playerId) === String(playerId)) || null;
  }

  function playerSalaryForSeason(player, seasonLabel) {
    if (!player) return 0;
    const salaryMap = player.salaryByYear || player.contractSalaryByYear || player.salariesByYear;
    if (salaryMap && typeof salaryMap === "object") {
      const startYear = String(currentSeasonLabel(seasonLabel)).slice(0, 4);
      const value = salaryMap[seasonLabel] ?? salaryMap[startYear] ?? salaryMap[Number(startYear)];
      if (value !== undefined) return money(value);
    }
    return money(player.salary);
  }

  function getPlayerPriorSalary(player, seasonLabel) {
    if (!player) return 0;
    if (player.priorSalary !== undefined) return money(player.priorSalary);
    const startYear = Number(String(currentSeasonLabel(seasonLabel)).slice(0, 4)) - 1;
    const priorLabel = `${startYear}-${startYear + 1}`;
    const mapped = player.salaryByYear?.[priorLabel] ?? player.salaryByYear?.[startYear];
    return mapped !== undefined ? money(mapped) : playerSalaryForSeason(player, priorLabel);
  }

  function playerTeamId(player) {
    return Number(player?.teamId ?? player?.currentTeamId ?? 0) || null;
  }

  function isRightsTeam(player, teamId) {
    if (!player) return false;
    return Number(player.rightsTeamId ?? player.priorTeamId ?? playerTeamId(player)) === Number(teamId);
  }

  function isOwnFreeAgent(player, teamId) {
    const status = String(player?.freeAgentStatus || player?.freeAgentType || "").toUpperCase();
    const freeAgent = Number(player?.contractYears || 0) <= 0 || status.includes("FA") || state()?.freeAgents?.includes(player);
    return Boolean(freeAgent && isRightsTeam(player, teamId));
  }

  function hasBeenRenounced(player, teamId) {
    return Boolean(
      player?.wasRenouncedByTeamIds?.map(Number).includes(Number(teamId)) ||
      state()?.contractRules?.renouncedRights?.[teamId]?.[player?.id ?? player?.playerId]
    );
  }

  function getBirdRightsType(player, teamId) {
    if (!player || !isRightsTeam(player, teamId) || hasBeenRenounced(player, teamId)) return null;
    const raw = String(player.birdRightsType || player.birdRights || "").toUpperCase().replace(/[\s-]+/g, "_");
    if (raw.includes("FULL")) return RIGHTS.FULL_BIRD;
    if (raw.includes("EARLY")) return RIGHTS.EARLY_BIRD;
    if (raw.includes("NON")) return RIGHTS.NON_BIRD;
    const years = Number(player.yearsWithTeam ?? player.consecutiveYearsWithTeam ?? 0);
    if (years >= 3) return RIGHTS.FULL_BIRD;
    if (years >= 2) return RIGHTS.EARLY_BIRD;
    return RIGHTS.NON_BIRD;
  }

  function getPlayerRightsStatus(player, teamId) {
    const rfa = getRestrictedFreeAgentStatus(player);
    return {
      isOwnFreeAgent: isOwnFreeAgent(player, teamId),
      isRightsTeam: isRightsTeam(player, teamId),
      renounced: hasBeenRenounced(player, teamId),
      birdRightsType: getBirdRightsType(player, teamId),
      restricted: rfa.restricted,
      qualifyingOfferSubmitted: rfa.qualifyingOfferSubmitted
    };
  }

  function getMaxSalaryTier(player) {
    const years = Number(player?.yearsService ?? player?.yearsPro ?? 0);
    return years >= 10 ? 0.35 : years >= 7 ? 0.30 : 0.25;
  }

  function getHigherMaxEligibility(player) {
    const eligible = Boolean(player?.higherMaxEligible && (player?.madeAllNBA || player?.dpoty || player?.mvp));
    return { eligible, maxTier: eligible ? 0.30 : getMaxSalaryTier(player), reason: eligible ? "Higher Max Criteria met." : "Normal service tier applies." };
  }

  function getDesignatedVeteranEligibility(player) {
    const eligible = Boolean(player?.designatedVeteranEligible && (player?.madeAllNBA || player?.dpoty || player?.mvp));
    return { eligible, maxTier: eligible ? 0.35 : getMaxSalaryTier(player), reason: eligible ? "Designated Veteran criteria met." : "Normal service tier applies." };
  }

  function getPlayerMaxSalary(player, seasonLabel, teamId = null) {
    if (!player) return 0;
    let tier = getMaxSalaryTier(player);
    const higher = getHigherMaxEligibility(player, teamId);
    const designated = getDesignatedVeteranEligibility(player, teamId);
    if (higher.eligible) tier = Math.max(tier, higher.maxTier);
    if (designated.eligible) tier = Math.max(tier, designated.maxTier);
    return roundMoney(Math.max(getSalaryCapLine(seasonLabel) * tier, getPlayerPriorSalary(player, seasonLabel) * 1.05));
  }

  function getRestrictedFreeAgentStatus(player) {
    const text = String(player?.freeAgentStatus || player?.freeAgentType || "").toUpperCase();
    const restricted = Boolean(player?.isRFA || text === "RFA" || text.includes("RESTRICTED"));
    return {
      restricted,
      status: restricted ? "RFA" : "UFA",
      qualifyingOfferSubmitted: Boolean(player?.qualifyingOfferSubmitted),
      qualifyingOfferWithdrawn: Boolean(player?.qualifyingOfferWithdrawn),
      rightsTeamId: Number(player?.rightsTeamId ?? player?.priorTeamId ?? 0) || null
    };
  }

  function getQualifyingOfferAmount(player, teamId, seasonLabel) {
    if (!player || !isRightsTeam(player, teamId)) return 0;
    if (player.qualifyingOfferAmount !== undefined) return money(player.qualifyingOfferAmount);
    return roundMoney(Math.max(getMinimumSalaryForYearsService(player.yearsService, seasonLabel) * 1.25, getPlayerPriorSalary(player, seasonLabel) * 1.25));
  }

  function getMaximumQualifyingOfferAmount(player, teamId, seasonLabel) {
    if (player?.maximumQualifyingOfferAmount !== undefined) return money(player.maximumQualifyingOfferAmount);
    return getPlayerMaxSalary(player, seasonLabel, teamId);
  }

  function getFreeAgentAmount(player, teamId, seasonLabel) {
    if (!player || !isOwnFreeAgent(player, teamId) || hasBeenRenounced(player, teamId)) return 0;
    if (player.capHoldAmount !== undefined && player.capHoldAmount !== null) return money(player.capHoldAmount);
    const prior = getPlayerPriorSalary(player, seasonLabel);
    const config = getContractRulesConfig(seasonLabel);
    const minimum = getMinimumSalaryForYearsService(player.yearsService, seasonLabel);
    let amount = minimum;
    const rights = getBirdRightsType(player, teamId);
    if (player.isTwoWay || player.rosterContractType === "Two-Way") {
      amount = config.zeroYearsMinimum;
    } else if (player.isFirstRoundPick && player.rookieScaleAmount) {
      amount = money(player.rookieScaleAmount) * 1.2;
    } else if (rights === RIGHTS.FULL_BIRD) {
      const rookieOption = Boolean(player.completedSecondRookieScaleOptionYear || player.rookieScaleSecondOptionCompleted);
      amount = prior * (rookieOption ? (prior >= config.averagePlayerSalary ? 2.5 : 3) : (prior >= config.estimatedAveragePlayerSalary ? 1.5 : 1.9));
    } else if (rights === RIGHTS.EARLY_BIRD) {
      amount = prior * 1.3;
    } else {
      amount = prior * 1.2;
    }
    return roundMoney(clamp(amount, minimum, getPlayerMaxSalary(player, seasonLabel, teamId)));
  }

  const getCapHoldAmount = getFreeAgentAmount;

  function getTeamCapHolds(teamId, seasonLabel) {
    return (state()?.freeAgents || [])
      .filter(player => isOwnFreeAgent(player, teamId) && !hasBeenRenounced(player, teamId))
      .map(player => ({
        playerId: player.id ?? player.playerId,
        playerName: player.name || "Unknown Player",
        amount: getFreeAgentAmount(player, teamId, seasonLabel),
        rights: getBirdRightsType(player, teamId),
        rfa: getRestrictedFreeAgentStatus(player).restricted
      }))
      .filter(hold => hold.amount > 0);
  }

  function getRosterSalaryForCapYear(teamId, seasonLabel) {
    return roundMoney(getRoster(teamId).reduce((sum, player) => sum + playerSalaryForSeason(player, seasonLabel), 0));
  }

  function collectionAmount(collection, teamId, seasonLabel, fields) {
    if (!Array.isArray(collection)) return 0;
    return roundMoney(collection
      .filter(item => Number(item.teamId ?? item.team?.id) === Number(teamId))
      .filter(item => !item.seasonLabel || String(item.seasonLabel) === String(currentSeasonLabel(seasonLabel)))
      .reduce((sum, item) => {
        const field = fields.find(key => item[key] !== undefined);
        return sum + money(field ? item[field] : 0);
      }, 0));
  }

  function getDeadMoneyForTeam(teamId, seasonLabel) {
    const gs = state();
    return roundMoney(
      collectionAmount(gs?.deadMoney, teamId, seasonLabel, ["amount", "salary", "guaranteedSalary"]) +
      collectionAmount(gs?.waivedPlayers, teamId, seasonLabel, ["deadMoney", "guaranteedSalary", "salary"])
    );
  }

  function getOutstandingOfferSheetSalary(teamId, seasonLabel) {
    return collectionAmount(state()?.contractRules?.offerSheets, teamId, seasonLabel, ["startingSalary", "salary"]);
  }

  function getUnsignedFirstRoundPickCapHolds(teamId, seasonLabel) {
    const picks = state()?.unsignedDraftPicks || state()?.draft?.unsignedPicks || [];
    return roundMoney((Array.isArray(picks) ? picks : [])
      .filter(pick => Number(pick.teamId) === Number(teamId) && Number(pick.round || 1) === 1)
      .reduce((sum, pick) => {
        const scale = money(pick.rookieScaleAmount ?? getContractRulesConfig(seasonLabel).rookieScaleAmounts[pick.pick]);
        return sum + scale * 1.2;
      }, 0));
  }

  function countPlayersIncludedInTeamSalary(teamId) {
    return getRoster(teamId).filter(player => !player.isTrainingCampContract && !player.isTwoWay && player.rosterContractType !== "Two-Way").length;
  }

  function isIncompleteRosterChargePeriod(date = state()?.currentDate) {
    const d = dateValue(date);
    const key = (d.getMonth() + 1) * 100 + d.getDate();
    return key >= 701 && key < 925;
  }

  function getIncompleteRosterCharge(teamId, seasonLabel) {
    if (!isIncompleteRosterChargePeriod()) return 0;
    return roundMoney(Math.max(0, 12 - countPlayersIncludedInTeamSalary(teamId)) * getZeroYearsMinimumSalary(seasonLabel));
  }

  function getExceptionHoldAmount(teamId, seasonLabel) {
    const wallet = state()?.contractRules?.exceptionWallets?.[teamId];
    if (!wallet) return 0;
    return roundMoney(Object.values(wallet).reduce((sum, entry) => {
      if (!entry || entry.renounced || entry.used) return sum;
      return sum + money(entry.holdAmount ?? entry.remaining ?? 0);
    }, 0));
  }

  function getTeamSalaryBreakdown(teamId, options = {}) {
    const seasonLabel = currentSeasonLabel(options.seasonLabel);
    const config = getContractRulesConfig(seasonLabel);
    const rosterSalary = getRosterSalaryForCapYear(teamId, seasonLabel);
    const deadMoney = getDeadMoneyForTeam(teamId, seasonLabel);
    const holds = options.excludeCapHolds ? [] : getTeamCapHolds(teamId, seasonLabel);
    const freeAgentCapHolds = roundMoney(holds.filter(item => !item.rfa).reduce((sum, item) => sum + item.amount, 0));
    const rfaHoldAmount = roundMoney(holds.filter(item => item.rfa).reduce((sum, item) => {
      const player = findPlayer(item.playerId);
      return sum + Math.max(
        item.amount,
        getQualifyingOfferAmount(player, teamId, seasonLabel),
        money(player?.firstRefusalOfferAmount),
        money(player?.matchedOfferAmount)
      );
    }, 0));
    const offerSheetAmount = getOutstandingOfferSheetSalary(teamId, seasonLabel);
    const rookieScaleCapHolds = getUnsignedFirstRoundPickCapHolds(teamId, seasonLabel);
    const incompleteRosterCharge = options.excludeIncompleteRosterCharge ? 0 : getIncompleteRosterCharge(teamId, seasonLabel);
    const exceptionHolds = options.excludeExceptionHolds ? 0 : getExceptionHoldAmount(teamId, seasonLabel);
    const totalTeamSalary = roundMoney(rosterSalary + deadMoney + freeAgentCapHolds + rfaHoldAmount + offerSheetAmount + rookieScaleCapHolds + incompleteRosterCharge + exceptionHolds);

    return {
      teamId: Number(teamId),
      seasonLabel,
      salaryCap: config.salaryCap,
      rosterSalary,
      deadMoney,
      freeAgentCapHolds,
      rfaHoldAmount,
      offerSheetAmount,
      rookieScaleCapHolds,
      incompleteRosterCharge,
      exceptionHolds,
      totalTeamSalary,
      capRoom: roundMoney(config.salaryCap - totalTeamSalary),
      taxRoom: roundMoney(config.luxuryTaxLine - totalTeamSalary),
      firstApronRoom: roundMoney(config.firstApron - totalTeamSalary),
      secondApronRoom: roundMoney(config.secondApron - totalTeamSalary),
      notes: holds.length ? [`Includes ${holds.length} own-free-agent cap hold(s).`] : []
    };
  }

  const getTeamSalary = (teamId, options = {}) => getTeamSalaryBreakdown(teamId, options).totalTeamSalary;
  const getTeamCapRoom = (teamId, options = {}) => getTeamSalaryBreakdown(teamId, options).capRoom;
  const getTaxRoom = (teamId, options = {}) => getTeamSalaryBreakdown(teamId, options).taxRoom;
  const getFirstApronRoom = (teamId, options = {}) => getTeamSalaryBreakdown(teamId, options).firstApronRoom;
  const getSecondApronRoom = (teamId, options = {}) => getTeamSalaryBreakdown(teamId, options).secondApronRoom;

  function getApronTeamSalaryBreakdown(teamId, options = {}) {
    const base = getTeamSalaryBreakdown(teamId, options);
    const roster = getRoster(teamId);
    const bonuses = roundMoney(roster.reduce((sum, player) => sum + money(player.likelyBonus) + money(player.excludedBonus), 0));
    const requiredTender = roundMoney((state()?.unsignedDraftPicks || [])
      .filter?.(pick => Number(pick.teamId) === Number(teamId))
      .reduce((sum, pick) => sum + money(pick.requiredTender), 0) || 0);
    const totalApronTeamSalary = roundMoney(
      base.totalTeamSalary + bonuses + requiredTender -
      base.freeAgentCapHolds - base.rookieScaleCapHolds -
      base.exceptionHolds - base.incompleteRosterCharge
    );
    return {
      ...base,
      likelyAndExcludedBonuses: bonuses,
      requiredTender,
      removedFreeAgentCapHolds: base.freeAgentCapHolds,
      removedRookieScaleCapHolds: base.rookieScaleCapHolds,
      removedExceptionHolds: base.exceptionHolds,
      removedIncompleteRosterCharge: base.incompleteRosterCharge,
      totalApronTeamSalary,
      apronTeamSalary: totalApronTeamSalary,
      firstApronRoom: roundMoney(getFirstApronLineForRules(base.seasonLabel) - totalApronTeamSalary),
      secondApronRoom: roundMoney(getSecondApronLineForRules(base.seasonLabel) - totalApronTeamSalary)
    };
  }

  const getApronTeamSalary = (teamId, options = {}) => getApronTeamSalaryBreakdown(teamId, options).totalApronTeamSalary;

  function ensureContractRulesState() {
    const gs = state();
    if (!gs) return null;
    if (!gs.contractRules || typeof gs.contractRules !== "object") gs.contractRules = {};
    const rules = gs.contractRules;
    if (!rules.hardCaps) rules.hardCaps = {};
    if (!rules.usedExceptions) rules.usedExceptions = {};
    if (!rules.renouncedExceptions) rules.renouncedExceptions = {};
    if (!rules.renouncedRights) rules.renouncedRights = {};
    if (!rules.exceptionWallets) rules.exceptionWallets = {};
    if (!Array.isArray(rules.offerSheets)) rules.offerSheets = [];
    if (!Array.isArray(rules.agreements)) rules.agreements = [];
    return rules;
  }

  function normalizePlayerContractRules(player, teamId = null) {
    if (!player) return null;
    const inferredTeamId = Number(teamId ?? player.teamId ?? player.priorTeamId ?? 0) || null;
    const defaults = {
      priorTeamId: inferredTeamId,
      rightsTeamId: inferredTeamId,
      freeAgentStatus: Number(player.contractYears || 0) <= 0 ? (String(player.freeAgentType).toUpperCase().includes("RFA") ? "RFA" : "UFA") : "UNDER_CONTRACT",
      birdRightsType: player.birdRights || null,
      qualifyingOfferAmount: null,
      maximumQualifyingOfferAmount: null,
      qualifyingOfferSubmitted: false,
      qualifyingOfferDate: null,
      qualifyingOfferWithdrawn: false,
      capHoldAmount: null,
      wasRenouncedByTeamIds: [],
      optionDecision: null,
      contractOptions: {},
      guaranteedByYear: {},
      guaranteeDateByYear: {},
      isTrainingCampContract: false,
      isTwoWay: player.contractType === "Two-Way" || player.rosterContractType === "Two-Way",
      yearsService: Number(player.yearsPro || 0)
    };
    Object.entries(defaults).forEach(([key, value]) => {
      if (player[key] === undefined) player[key] = value;
    });
    return player;
  }

  function normalizeAllContractRules() {
    ensureContractRulesState();
    Object.entries(state()?.rosters || {}).forEach(([teamId, roster]) => {
      (roster || []).forEach(player => normalizePlayerContractRules(player, Number(teamId)));
    });
    (state()?.freeAgents || []).forEach(player => normalizePlayerContractRules(player, player.priorTeamId));
    return state()?.contractRules || null;
  }

  function canRenouncePlayer(teamId, playerId) {
    const player = findPlayer(playerId);
    if (!player) return { allowed: false, legal: false, explanation: "Player was not found." };
    if (!isRightsTeam(player, teamId)) return { allowed: false, legal: false, explanation: "This team does not hold the player's rights." };
    if (getRestrictedFreeAgentStatus(player).restricted) {
      return { allowed: false, legal: false, explanation: "Restricted free-agent rights cannot be renounced in this rules model." };
    }
    if (hasBeenRenounced(player, teamId)) return { allowed: false, legal: false, explanation: "Rights have already been renounced." };
    return { allowed: true, legal: true, explanation: "The team may renounce this player's free-agent rights." };
  }

  function renouncePlayerRights(teamId, playerId) {
    const result = canRenouncePlayer(teamId, playerId);
    if (!result.allowed) return result;
    const player = findPlayer(playerId);
    const rules = ensureContractRulesState();
    if (!rules.renouncedRights[teamId]) rules.renouncedRights[teamId] = {};
    rules.renouncedRights[teamId][playerId] = { date: dateKey(), seasonLabel: currentSeasonLabel() };
    if (!Array.isArray(player.wasRenouncedByTeamIds)) player.wasRenouncedByTeamIds = [];
    if (!player.wasRenouncedByTeamIds.map(Number).includes(Number(teamId))) player.wasRenouncedByTeamIds.push(Number(teamId));
    player.birdRightsType = null;
    player.birdRights = null;
    player.capHoldAmount = 0;
    return { allowed: true, legal: true, playerId, teamId, explanation: "Rights renounced; only cap room, minimum, or two-way paths remain." };
  }

  const canUseBirdRights = (player, teamId) => getBirdRightsType(player, teamId) === RIGHTS.FULL_BIRD;
  const canUseEarlyBirdRights = (player, teamId) => getBirdRightsType(player, teamId) === RIGHTS.EARLY_BIRD;
  const canUseNonBirdRights = (player, teamId) => getBirdRightsType(player, teamId) === RIGHTS.NON_BIRD;

  function getVeteranFreeAgentExceptionLimit(player, teamId, seasonLabel) {
    const rights = getBirdRightsType(player, teamId);
    const prior = getPlayerPriorSalary(player, seasonLabel);
    const minimum = getMinimumSalaryForYearsService(player?.yearsService, seasonLabel);
    if (rights === RIGHTS.FULL_BIRD) return getPlayerMaxSalary(player, seasonLabel, teamId);
    if (rights === RIGHTS.EARLY_BIRD) return roundMoney(Math.max(prior * 1.75, getContractRulesConfig(seasonLabel).averagePlayerSalary * 1.05));
    if (rights === RIGHTS.NON_BIRD) return roundMoney(Math.max(prior * 1.2, minimum * 1.2, getQualifyingOfferAmount(player, teamId, seasonLabel)));
    return 0;
  }

  const getOwnPlayerMaxOffer = getVeteranFreeAgentExceptionLimit;

  function getMaxContractYears(player, teamId, signingTool) {
    if (signingTool === TOOL.FULL_BIRD && canUseBirdRights(player, teamId)) return 5;
    if ([TOOL.TAXPAYER_MLE, TOOL.BI_ANNUAL_EXCEPTION, TOOL.MINIMUM_EXCEPTION].includes(signingTool)) return 2;
    if (signingTool === TOOL.ROOM_MLE) return 3;
    if (signingTool === TOOL.SECOND_ROUND_PICK_EXCEPTION) return 4;
    if (signingTool === TOOL.DISABLED_PLAYER_EXCEPTION) return 1;
    return 4;
  }

  function getMinContractYears(player, teamId, signingTool) {
    if (signingTool === TOOL.EARLY_BIRD && canUseEarlyBirdRights(player, teamId)) return 2;
    return 1;
  }

  function getMaxAnnualRaisePercent(player, teamId, signingTool) {
    return [TOOL.FULL_BIRD, TOOL.EARLY_BIRD].includes(signingTool) && isRightsTeam(player, teamId) ? 8 : 5;
  }

  function validateContractYearsAndRaises(offer, player, teamId) {
    const problems = [];
    const tool = offer?.signingTool || getBestSigningTool(teamId, player, offer)?.type;
    const years = Number(offer?.years || 1);
    const raise = Number(offer?.annualRaisePercent || 0);
    if (years < getMinContractYears(player, teamId, tool)) problems.push(`Contract must be at least ${getMinContractYears(player, teamId, tool)} seasons.`);
    if (years > getMaxContractYears(player, teamId, tool)) problems.push(`Contract cannot exceed ${getMaxContractYears(player, teamId, tool)} seasons with ${tool || "this tool"}.`);
    if (raise > getMaxAnnualRaisePercent(player, teamId, tool)) problems.push(`Annual raises cannot exceed ${getMaxAnnualRaisePercent(player, teamId, tool)}%.`);
    return { legal: problems.length === 0, problems, maxYears: getMaxContractYears(player, teamId, tool), minYears: getMinContractYears(player, teamId, tool), maxRaisePercent: getMaxAnnualRaisePercent(player, teamId, tool) };
  }

  function optionRecord(player, optionType) {
    const type = String(optionType || "").toUpperCase().replace(/[\s-]+/g, "_");
    return player?.contractOptions?.[type] || player?.contractOptions?.[optionType] || {};
  }

  function getOptionDecisionDeadline(player, optionType, seasonLabel) {
    const startYear = Number(String(currentSeasonLabel(seasonLabel)).slice(0, 4));
    const type = String(optionType || "").toUpperCase();
    if (type.includes("ROOKIE")) return `${startYear}-10-31`;
    if (type.includes("PLAYER") && getRestrictedFreeAgentStatus(player).restricted) return `${startYear}-06-25`;
    return `${startYear}-06-29`;
  }

  function canExerciseOptionToday(player, optionType, date) {
    const option = optionRecord(player, optionType);
    const today = dateKey(date);
    const deadline = option.deadline || getOptionDecisionDeadline(player, optionType);
    const previousSalary = getPlayerPriorSalary(player);
    const optionSalary = money(option.salary ?? player?.optionSalary ?? player?.salary);
    const problems = [];
    if (!player) problems.push("Player was not found.");
    const hasOptionRecord = option && Object.keys(option).length > 0;
    if (!hasOptionRecord && !player?.optionType && !player?.contractOption) {
    problems.push("No option is recorded.");
    }
    if (option.exercised || option.declined || player?.optionDecision) problems.push("This option has already been decided.");
    if (today > deadline) problems.push(`The option deadline was ${deadline}.`);
    if (optionSalary < previousSalary) problems.push("Option salary cannot be below the previous season salary.");
    return { allowed: problems.length === 0, legal: problems.length === 0, deadline, problems };
  }

  function decideOption(playerId, teamId, decision, actor) {
    const player = findPlayer(playerId);
    if (!player) return { legal: false, problems: ["Player was not found."] };
    if (teamId !== null && Number(playerTeamId(player)) !== Number(teamId)) return { legal: false, problems: ["Player is not on this team."] };
    player.optionDecision = { decision, actor, date: dateKey() };
    if (decision === "EXERCISED") player.contractYears = Math.max(1, Number(player.contractYears || 0) + 1);
    return { legal: true, playerId, decision, actor };
  }

  const exerciseTeamOption = (teamId, playerId) => decideOption(playerId, teamId, "EXERCISED", "TEAM");
  const playerExerciseOption = playerId => decideOption(playerId, null, "EXERCISED", "PLAYER");
  const declineTeamOption = (teamId, playerId) => decideOption(playerId, teamId, "DECLINED", "TEAM");
  const playerDeclineOption = playerId => decideOption(playerId, null, "DECLINED", "PLAYER");

  function getPendingOptionDecisions(teamId) {
    return getRoster(teamId).filter(player => {
      const options = player.contractOptions || {};
      return Object.keys(options).length && !player.optionDecision;
    });
  }

  function getOffseasonContractPhase(date) {
    const d = dateValue(date);
    const key = (d.getMonth() + 1) * 100 + d.getDate();
    if (key >= 621 && key <= 629) return "PRE_FREE_AGENCY";
    if (key === 630) return "FA_NEGOTIATION";
    if (key >= 701 && key <= 705) return "MORATORIUM";
    if (key >= 706 && key <= 725) return "OFFICIAL_FREE_AGENCY";
    if (key >= 726 && key < 925) return "ROSTER_FINALIZATION";
    if (key >= 925) return "TRAINING_CAMP";
    return "CLOSED";
  }

  const isMoratoriumPeriod = date => getOffseasonContractPhase(date) === "MORATORIUM";
  const canNegotiateOutsideFreeAgents = (teamId, date) => [
    "FA_NEGOTIATION",
    "MORATORIUM",
    "OFFICIAL_FREE_AGENCY",
    "ROSTER_FINALIZATION"
  ].includes(getOffseasonContractPhase(date));

  function canNegotiateOwnFreeAgents(teamId, date) {
    const phase = getOffseasonContractPhase(date);

    if (canNegotiateOutsideFreeAgents(teamId, date)) return true;
    if (phase !== "PRE_FREE_AGENCY") return false;

    const gs = state();
    const seasonEnd = gs?.teamSeasonEndDates?.[teamId] || gs?.finalsCompletedDate;
    return Boolean(seasonEnd && dateValue(date) > dateValue(seasonEnd));
  }

  function moratoriumAllowedOffer(offer = {}) {
    return Boolean(
      offer.isOfferSheet || offer.isRookieScale || offer.isSecondRoundPickException ||
      offer.isTwoWay || offer.isMinimum || Number(offer.years || 1) <= 2 && offer.signingTool === TOOL.MINIMUM_EXCEPTION ||
      offer.isQualifyingOffer || offer.isRequiredTender
    );
  }

  function canOfficiallySign(date, offer = {}) {
    const phase = getOffseasonContractPhase(date);
    return (
      phase === "OFFICIAL_FREE_AGENCY" ||
      phase === "ROSTER_FINALIZATION" ||
      (phase === "MORATORIUM" && moratoriumAllowedOffer(offer))
    );
  }

  const shouldStoreAsAgreement = (date, offer = {}) => isMoratoriumPeriod(date) && !canOfficiallySign(date, offer);

  function convertMoratoriumAgreementsToOfficial() {
    const rules = ensureContractRulesState();
    const phase = getOffseasonContractPhase();
    if (!rules || !["OFFICIAL_FREE_AGENCY", "ROSTER_FINALIZATION"].includes(phase)) return [];
    const converted = [];
    rules.agreements.forEach(agreement => {
      if (agreement.status !== "AGREED") return;
      const result = validateContractOffer(agreement.teamId, agreement.playerId, agreement.offer, { ignoreTiming: true });
      if (result.legal) {
        agreement.status = "OFFICIAL";
        agreement.officialDate = dateKey();
        converted.push(agreement);
      }
    });
    return converted;
  }

  function deadlineAllowsQualifyingOffer(date) {
    const d = dateValue(date);
    const key = (d.getMonth() + 1) * 100 + d.getDate();
    return key >= 621 && key <= 629;
  }

  function canSubmitQualifyingOffer(teamId, playerId, date) {
    const player = findPlayer(playerId);
    const problems = [];
    if (!player) problems.push("Player was not found.");
    if (player && !isRightsTeam(player, teamId)) problems.push("This team does not hold the player's rights.");
    if (player?.qualifyingOfferSubmitted) problems.push("A qualifying offer has already been submitted.");
    if (!deadlineAllowsQualifyingOffer(date)) problems.push("The June 29 qualifying-offer deadline has passed.");
    return { legal: problems.length === 0, allowed: problems.length === 0, problems };
  }

  function submitQualifyingOffer(teamId, playerId) {
    const result = canSubmitQualifyingOffer(teamId, playerId);
    if (!result.legal) return result;
    const player = findPlayer(playerId);
    player.qualifyingOfferSubmitted = true;
    player.qualifyingOfferWithdrawn = false;
    player.qualifyingOfferDate = dateKey();
    player.qualifyingOfferAmount = getQualifyingOfferAmount(player, teamId);
    player.freeAgentStatus = "RFA";
    return { legal: true, playerId, amount: player.qualifyingOfferAmount };
  }

  function withdrawQualifyingOffer(teamId, playerId, date) {
    const player = findPlayer(playerId);
    if (!player || !isRightsTeam(player, teamId) || !player.qualifyingOfferSubmitted) return { legal: false, problems: ["No active qualifying offer was found."] };
    const d = dateValue(date);
    const key = (d.getMonth() + 1) * 100 + d.getDate();
    if (key > 713 && !player.qualifyingOfferWithdrawalConsent) return { legal: false, problems: ["Player consent is required after July 13."] };
    player.qualifyingOfferWithdrawn = true;
    player.qualifyingOfferSubmitted = false;
    player.freeAgentStatus = "UFA";
    return { legal: true, playerId };
  }

  function acceptQualifyingOffer(playerId) {
    const player = findPlayer(playerId);
    if (!player?.qualifyingOfferSubmitted || player.qualifyingOfferWithdrawn) return { legal: false, problems: ["No active qualifying offer is available."] };
    const amount = money(player.qualifyingOfferAmount);
    player.salary = amount;
    player.contractYears = 1;
    player.freeAgentStatus = "UNDER_CONTRACT";
    return { legal: true, playerId, amount };
  }

  function canCreateOfferSheet(teamId, playerId, offer = {}) {
    const player = findPlayer(playerId);
    const problems = [];
    if (!player || !getRestrictedFreeAgentStatus(player).restricted) problems.push("Player is not a restricted free agent.");
    if (player && isRightsTeam(player, teamId)) problems.push("The rights team does not create an offer sheet for its own player.");
    if (Number(offer.years || 0) <= 1) problems.push("Offer sheets must cover more than one guaranteed season.");
    if (offer.isTwoWay) problems.push("An offer sheet cannot be a two-way contract.");
    return { legal: problems.length === 0, problems };
  }

  function createOfferSheet(teamId, playerId, offer = {}) {
    const result = canCreateOfferSheet(teamId, playerId, offer);
    if (!result.legal) return result;
    const rules = ensureContractRulesState();
    const receivedAt = dateValue(offer.date);
    const id = `offer_sheet_${Date.now()}_${playerId}`;
    const sheet = { id, teamId: Number(teamId), playerId, rightsTeamId: findPlayer(playerId)?.rightsTeamId, offer: { ...offer }, startingSalary: money(offer.startingSalary), receivedAt: receivedAt.toISOString(), status: "OUTSTANDING" };
    sheet.matchDeadline = getOfferSheetMatchDeadline(sheet);
    rules.offerSheets.push(sheet);
    return { legal: true, offerSheet: sheet };
  }

  function getOfferSheetMatchDeadline(offerSheet) {
    const received = dateValue(offerSheet?.receivedAt || offerSheet?.date);
    const days = received.getHours() < 12 ? 1 : 2;
    received.setDate(received.getDate() + days);
    received.setHours(23, 59, 59, 999);
    return received.toISOString();
  }

  function canMatchOfferSheet(teamId, offerSheet) {
    const problems = [];
    if (!offerSheet || offerSheet.status !== "OUTSTANDING") problems.push("Offer sheet is not outstanding.");
    if (Number(offerSheet?.rightsTeamId) !== Number(teamId)) problems.push("This team does not hold matching rights.");
    if (dateValue() > dateValue(offerSheet?.matchDeadline)) problems.push("The matching window has expired.");
    const player = findPlayer(offerSheet?.playerId);
    const salary = money(offerSheet?.startingSalary ?? offerSheet?.offer?.startingSalary);
    const limit = Math.max(getOwnPlayerMaxOffer(player, teamId), getTeamCapRoom(teamId), getMinimumSalaryForYearsService(player?.yearsService));
    if (salary > limit) problems.push("The team lacks a legal matching path for this salary.");
    return { legal: problems.length === 0, problems };
  }

  function matchOfferSheet(teamId, offerSheetId) {
    const sheet = ensureContractRulesState()?.offerSheets.find(item => String(item.id) === String(offerSheetId));
    const result = canMatchOfferSheet(teamId, sheet);
    if (!result.legal) return result;
    sheet.status = "MATCHED";
    sheet.matchedDate = dateKey();
    return { legal: true, offerSheet: sheet };
  }

  function declineOfferSheetMatch(teamId, offerSheetId) {
    const sheet = ensureContractRulesState()?.offerSheets.find(item => String(item.id) === String(offerSheetId));
    if (!sheet || Number(sheet.rightsTeamId) !== Number(teamId)) return { legal: false, problems: ["Offer sheet was not found for this rights team."] };
    sheet.status = "DECLINED";
    sheet.declinedDate = dateKey();
    return { legal: true, offerSheet: sheet };
  }

  function exceptionDefinition(type, seasonLabel) {
    const config = getContractRulesConfig(seasonLabel);
    const definitions = {
      [TOOL.BI_ANNUAL_EXCEPTION]: { amount: config.biAnnualException, maxYears: 2, hardCap: "FIRST_APRON" },
      [TOOL.NON_TAXPAYER_MLE]: { amount: config.nonTaxpayerMLE, maxYears: 4, hardCap: "FIRST_APRON" },
      [TOOL.TAXPAYER_MLE]: { amount: config.taxpayerMLE, maxYears: 2, hardCap: "SECOND_APRON" },
      [TOOL.ROOM_MLE]: { amount: config.roomMLE, maxYears: 3 },
      [TOOL.MINIMUM_EXCEPTION]: { amount: Infinity, maxYears: 2 },
      [TOOL.DISABLED_PLAYER_EXCEPTION]: { amount: config.nonTaxpayerMLE, maxYears: 1 },
      [TOOL.SECOND_ROUND_PICK_EXCEPTION]: { amount: getMinimumSalaryForYearsService(0, seasonLabel) * 1.2, maxYears: 4 },
      [TOOL.TWO_WAY]: { amount: getZeroYearsMinimumSalary(seasonLabel) / 2, maxYears: 2 }
    };
    return definitions[type] || { amount: 0, maxYears: 0 };
  }

  function getTeamExceptionWallet(teamId, seasonLabel) {
    const label = currentSeasonLabel(seasonLabel);
    const salary = getTeamSalary(teamId, { seasonLabel: label });
    const config = getContractRulesConfig(label);
    const used = ensureContractRulesState()?.usedExceptions?.[teamId] || {};
    const renounced = ensureContractRulesState()?.renouncedExceptions?.[teamId] || {};
    const usedRoom = Boolean(used[TOOL.ROOM_MLE]);
    const usedOverCap = Boolean(used[TOOL.NON_TAXPAYER_MLE] || used[TOOL.TAXPAYER_MLE] || used[TOOL.BI_ANNUAL_EXCEPTION]);
    const roomTeam = salary < config.salaryCap;
    const types = [
      TOOL.BI_ANNUAL_EXCEPTION, TOOL.NON_TAXPAYER_MLE, TOOL.TAXPAYER_MLE,
      TOOL.ROOM_MLE, TOOL.MINIMUM_EXCEPTION, TOOL.DISABLED_PLAYER_EXCEPTION,
      TOOL.SECOND_ROUND_PICK_EXCEPTION, TOOL.TWO_WAY
    ];
    const wallet = {
      teamId: Number(teamId),
      seasonLabel: label,
      capSpace: Math.max(0, getTeamCapRoom(teamId, { seasonLabel: label })),
      tools: {}
    };
    types.forEach(type => {
      const definition = exceptionDefinition(type, label);
      let available = !used[type] && !renounced[type];
      if (type === TOOL.DISABLED_PLAYER_EXCEPTION) {
        const grant = ensureContractRulesState()?.disabledPlayerExceptions?.[teamId];
        available = available && Boolean(grant && !grant.used && !grant.extinguished);
      }
      if (type === TOOL.ROOM_MLE) available = available && roomTeam && !usedOverCap;
      if ([TOOL.NON_TAXPAYER_MLE, TOOL.TAXPAYER_MLE, TOOL.BI_ANNUAL_EXCEPTION].includes(type)) available = available && !usedRoom;
      if (type === TOOL.NON_TAXPAYER_MLE) available = available && salary <= config.firstApron;
      if (type === TOOL.TAXPAYER_MLE) available = available && salary > config.salaryCap && salary <= config.secondApron;
      wallet.tools[type] = {
        type,
        available,
        amount: Number.isFinite(definition.amount) ? definition.amount : null,
        remaining: Number.isFinite(definition.amount) ? Math.max(0, roundMoney(definition.amount - money(used[type]?.amount))) : null,
        maxYears: definition.maxYears,
        hardCap: definition.hardCap || null,
        used: used[type] || null,
        renounced: Boolean(renounced[type])
      };
    });
    return wallet;
  }

  function getAvailableSigningTools(teamId, player, offer = null) {
    if (!player) return [];
    const season = currentSeasonLabel(offer?.seasonLabel);
    const salary = money(offer?.startingSalary);
    const tools = [];
    const add = (type, limit, reason) => {
      if (!offer || salary <= limit + 0.0001) tools.push({ type, limit: roundMoney(limit), reason });
    };
    const capRoom = Math.max(0, getTeamCapRoom(teamId, { seasonLabel: season }));
    if (capRoom > 0) add(TOOL.CAP_SPACE, capRoom, "Available salary-cap room.");
    const rights = getBirdRightsType(player, teamId);
    if (rights) add(rights, getVeteranFreeAgentExceptionLimit(player, teamId, season), `${rights.replaceAll("_", " ")} rights.`);
    const wallet = getTeamExceptionWallet(teamId, season);
    Object.values(wallet.tools).forEach(entry => {
      if (!entry.available) return;
      if (entry.type === TOOL.SECOND_ROUND_PICK_EXCEPTION && !player.isSecondRoundPick && Number(player.draftRound) !== 2) return;
      if (entry.type === TOOL.TWO_WAY && (Number(player.yearsService ?? player.yearsPro ?? 0) > 3 || offer?.isTwoWay === false)) return;
      let limit = entry.remaining ?? Infinity;
      if (entry.type === TOOL.MINIMUM_EXCEPTION) limit = getMinimumSalaryForYearsService(player.yearsService, season);
      add(entry.type, limit, getExceptionExplanation(entry.type));
    });
    return tools;
  }

  function getBestSigningTool(teamId, player, offer = {}) {
    const tools = getAvailableSigningTools(teamId, player, offer);
    const priority = [
      TOOL.FULL_BIRD, TOOL.EARLY_BIRD, TOOL.NON_BIRD, TOOL.CAP_SPACE,
      TOOL.ROOM_MLE, TOOL.NON_TAXPAYER_MLE, TOOL.TAXPAYER_MLE,
      TOOL.BI_ANNUAL_EXCEPTION, TOOL.DISABLED_PLAYER_EXCEPTION,
      TOOL.MINIMUM_EXCEPTION, TOOL.SECOND_ROUND_PICK_EXCEPTION, TOOL.TWO_WAY
    ];
    const rank = type => {
      const index = priority.indexOf(type);
      return index < 0 ? priority.length : index;
    };
    return tools.sort((a, b) => rank(a.type) - rank(b.type))[0] || null;
  }

  function canUseException(teamId, exceptionType, amount, offer = {}) {
    const entry = getTeamExceptionWallet(teamId, offer.seasonLabel).tools[exceptionType];
    const problems = [];
    if (!entry?.available) problems.push(`${exceptionType} is not available.`);
    if (entry?.remaining !== null && money(amount) > entry?.remaining) problems.push(`Offer exceeds the ${exceptionType} remaining amount.`);
    if (Number(offer.years || 1) > Number(entry?.maxYears || 0)) problems.push(`Offer exceeds the ${exceptionType} term limit.`);
    return { legal: problems.length === 0, available: problems.length === 0, problems, entry };
  }

  function validateSigningTool(teamId, player, offer, tool) {
    const available = getAvailableSigningTools(teamId, player, offer).find(entry => entry.type === tool);
    return { legal: Boolean(available), tool, problems: available ? [] : [`${tool || "Selected signing tool"} cannot cover this offer.`] };
  }

  function useException(teamId, exceptionType, amount, playerId) {
    if (!state()) return { legal: false, problems: ["No active game state is available."] };
    const check = canUseException(teamId, exceptionType, amount);
    if (!check.legal) return check;
    const rules = ensureContractRulesState();
    if (!rules.usedExceptions[teamId]) rules.usedExceptions[teamId] = {};
    rules.usedExceptions[teamId][exceptionType] = { amount: money(amount), playerId, seasonLabel: currentSeasonLabel(), date: dateKey() };
    const hardCap = getTriggeredHardCapLine("SIGNING", exceptionType);
    if (hardCap) setTeamHardCap(teamId, hardCap, `${exceptionType} use`, { exceptionType, playerId });
    return { legal: true, exceptionType, amount: money(amount), hardCap };
  }

  function renounceException(teamId, exceptionType) {
    const rules = ensureContractRulesState();
    if (!rules) return { legal: false, problems: ["No active game state is available."] };
    if (!rules.renouncedExceptions[teamId]) rules.renouncedExceptions[teamId] = {};
    rules.renouncedExceptions[teamId][exceptionType] = { seasonLabel: currentSeasonLabel(), date: dateKey() };
    return { legal: true, teamId, exceptionType };
  }

  function getExceptionExplanation(type) {
    const explanations = {
      [TOOL.CAP_SPACE]: "Uses available room below the salary cap.",
      [TOOL.FULL_BIRD]: "Own-player Full Bird rights: player max, five seasons, 8% raises.",
      [TOOL.EARLY_BIRD]: "Own-player Early Bird rights: limited starting salary, at least two seasons, 8% raises.",
      [TOOL.NON_BIRD]: "Own-player Non-Bird rights: generally 120% of prior salary, 5% raises.",
      [TOOL.NON_TAXPAYER_MLE]: "Non-Taxpayer MLE; triggers a First Apron hard cap.",
      [TOOL.TAXPAYER_MLE]: "Taxpayer MLE; triggers a Second Apron hard cap.",
      [TOOL.ROOM_MLE]: "Room MLE for a team that operated below the cap.",
      [TOOL.BI_ANNUAL_EXCEPTION]: "Bi-Annual Exception; unavailable in consecutive years and triggers a First Apron hard cap.",
      [TOOL.MINIMUM_EXCEPTION]: "Minimum Salary Exception for one or two seasons.",
      [TOOL.DISABLED_PLAYER_EXCEPTION]: "One-season replacement exception for an eligible disabled player.",
      [TOOL.TRADED_PLAYER_EXCEPTION]: "Trade-generated exception; trade restrictions still apply.",
      [TOOL.SECOND_ROUND_PICK_EXCEPTION]: "Second-round pick contract with required team-option structure.",
      [TOOL.TWO_WAY]: "Two-way roster contract.",
      [TOOL.ROOKIE_SCALE_EXCEPTION]: "Rookie scale contract for a first-round pick.",
      [TOOL.REINSTATEMENT]: "Rare reinstatement exception."
    };
    return explanations[type] || "No additional explanation is available.";
  }

  function getTeamHardCap(teamId, seasonLabel) {
    const hardCap = ensureContractRulesState()?.hardCaps?.[teamId] || null;
    return hardCap && hardCap.seasonLabel === currentSeasonLabel(seasonLabel) ? hardCap : null;
  }

  function getHardCapAmount(line, seasonLabel) {
    if (line === "FIRST_APRON") return getFirstApronLineForRules(seasonLabel);
    if (line === "SECOND_APRON") return getSecondApronLineForRules(seasonLabel);
    return Infinity;
  }

  function setTeamHardCap(teamId, line, reason, triggeredBy = null) {
    const rules = ensureContractRulesState();
    if (!rules) return { legal: false, problems: ["No active game state is available."] };
    const seasonLabel = currentSeasonLabel();
    const existing = getTeamHardCap(teamId, seasonLabel);
    const effectiveLine = existing?.line === "FIRST_APRON" || line === "FIRST_APRON" ? "FIRST_APRON" : "SECOND_APRON";
    rules.hardCaps[teamId] = {
      seasonLabel,
      line: effectiveLine,
      amount: getHardCapAmount(effectiveLine, seasonLabel),
      reason: reason || "Apron-triggering transaction",
      triggeredBy,
      date: dateKey()
    };
    return rules.hardCaps[teamId];
  }

  function clearExpiredHardCaps() {
    const rules = ensureContractRulesState();
    if (!rules) return [];
    const current = currentSeasonLabel();
    const removed = [];
    Object.entries(rules.hardCaps).forEach(([teamId, hardCap]) => {
      if (hardCap.seasonLabel !== current) {
        removed.push(teamId);
        delete rules.hardCaps[teamId];
      }
    });
    return removed;
  }

  function getTriggeredHardCapLine(transactionType, signingTool) {
    const type = String(transactionType || "").toUpperCase();
    if ([TOOL.BI_ANNUAL_EXCEPTION, TOOL.NON_TAXPAYER_MLE].includes(signingTool)) return "FIRST_APRON";
    if (signingTool === TOOL.TAXPAYER_MLE) return "SECOND_APRON";
    if (["SIGN_AND_TRADE_RECEIVE", "EXPANDED_TPE", "STANDARD_TPE_POSTSEASON", "TRANSITION_TPE", "WAIVED_HIGH_SALARY_SIGNING"].includes(type)) return "FIRST_APRON";
    if (["AGGREGATED_TPE", "SEND_CASH_TRADE", "SIGN_AND_TRADE_TPE"].includes(type)) return "SECOND_APRON";
    return null;
  }

  const wouldTriggerHardCap = (transactionType, signingTool) => Boolean(getTriggeredHardCapLine(transactionType, signingTool));

  function validateHardCapCompliance(teamId, projectedApronTeamSalary, triggeredLine = null) {
    const existing = getTeamHardCap(teamId);
    let line = existing?.line || triggeredLine;
    if (existing?.line === "FIRST_APRON" || triggeredLine === "FIRST_APRON") line = "FIRST_APRON";
    const amount = getHardCapAmount(line);
    const projected = money(projectedApronTeamSalary);
    const legal = !line || projected <= amount + 0.0001;
    return {
      legal,
      line: line || null,
      amount: Number.isFinite(amount) ? amount : null,
      projectedApronTeamSalary: projected,
      remainingBelowHardCap: line ? roundMoney(amount - projected) : null,
      problems: legal ? [] : [`Projected Apron Team Salary exceeds the ${line.replace("_", " ").toLowerCase()}.`]
    };
  }

  function explainHardCapResult(result) {
    if (!result?.line) return "No hard cap applies.";
    return result.legal
      ? `Transaction remains ${roundMoney(result.remainingBelowHardCap)}M below the ${result.line.replace("_", " ").toLowerCase()}.`
      : result.problems?.[0] || "Transaction violates the team's hard cap.";
  }

  function guaranteeMapValue(player, seasonLabel) {
    const map = player?.guaranteedSalaryByYear || player?.guaranteedByYear || {};
    return map[seasonLabel] ?? map[String(seasonLabel).slice(0, 4)];
  }

  function getGuaranteeDate(player, seasonLabel) {
    const map = player?.guaranteeDateByYear || player?.guaranteeDates || {};
    return map[seasonLabel] ?? map[String(seasonLabel).slice(0, 4)] ?? null;
  }

  function getProtectedSalary(player, seasonLabel, date) {
    if (!player) return 0;
    const salary = playerSalaryForSeason(player, seasonLabel);
    const explicit = guaranteeMapValue(player, currentSeasonLabel(seasonLabel));
    let protectedAmount = explicit === true ? salary : explicit === false || explicit === undefined ? money(player.guaranteedSalary) : money(explicit);
    const d = dateValue(date);
    const guaranteeDate = getGuaranteeDate(player, seasonLabel);
    if (guaranteeDate && d >= dateValue(guaranteeDate)) protectedAmount = salary;
    const afterJan10 = d.getMonth() > 0 || (d.getMonth() === 0 && d.getDate() >= 10);
    if (afterJan10) protectedAmount = salary;
    return roundMoney(clamp(protectedAmount, 0, salary));
  }

  const getUnprotectedSalary = (player, seasonLabel, date) => roundMoney(playerSalaryForSeason(player, seasonLabel) - getProtectedSalary(player, seasonLabel, date));
  const isSalaryGuaranteed = (player, seasonLabel, date) => getUnprotectedSalary(player, seasonLabel, date) <= 0;
  const isTrainingCampContract = player => Boolean(player?.isTrainingCampContract || player?.contractType === "Exhibit 9");
  const countTrainingCampContracts = teamId => getRoster(teamId).filter(isTrainingCampContract).length;

  function canUseTrainingCampContract(teamId) {
    const standard = getRoster(teamId).filter(player => !isTrainingCampContract(player) && !player.isTwoWay).length;
    const camp = countTrainingCampContracts(teamId);
    return { legal: standard >= 14 && camp < 6, standardContracts: standard, trainingCampContracts: camp, problems: standard < 14 ? ["Team must have at least 14 standard contracts."] : camp >= 6 ? ["Team already has six training-camp contracts."] : [] };
  }

  function waivePlayerCapImpact(teamId, playerId, date) {
    const player = findPlayer(playerId);
    if (!player || Number(playerTeamId(player)) !== Number(teamId)) return { legal: false, problems: ["Player was not found on this team."] };
    return {
      legal: true,
      teamId: Number(teamId),
      playerId,
      protectedSalary: getProtectedSalary(player, currentSeasonLabel(), date),
      removableSalary: getUnprotectedSalary(player, currentSeasonLabel(), date),
      notes: ["Preview only; use the existing waiver transaction to move the player."]
    };
  }

  function rosterSpotAvailable(teamId, offer = {}) {
    const standard = countPlayersIncludedInTeamSalary(teamId);
    if (offer.isTwoWay) return getRoster(teamId).filter(player => player.isTwoWay || player.rosterContractType === "Two-Way").length < 3;
    return standard < 15;
  }

  function validateContractOffer(teamId, playerId, offer = {}, options = {}) {
    const player = findPlayer(playerId);
    const seasonLabel = currentSeasonLabel(offer.seasonLabel);
    const problems = [];
    const warnings = [];
    const explanations = [];
    const startingSalary = money(offer.startingSalary);
    const normalizedOffer = { ...offer, startingSalary, years: Number(offer.years || 1), annualRaisePercent: Number(offer.annualRaisePercent || 0) };

    if (!player) problems.push("Player was not found.");
    if (!Number.isFinite(Number(teamId))) problems.push("A valid team is required.");
    if (startingSalary <= 0) problems.push("Starting salary must be greater than zero.");
    if (!rosterSpotAvailable(teamId, offer)) problems.push("No eligible roster spot is available.");

    const tools = player ? getAvailableSigningTools(teamId, player, normalizedOffer) : [];
    const selectedTool = offer.signingTool || getBestSigningTool(teamId, player, normalizedOffer)?.type || null;
    if (!selectedTool) problems.push("No single legal signing tool can cover this offer.");
    if (selectedTool && !tools.some(entry => entry.type === selectedTool)) problems.push(`${selectedTool} cannot cover this offer.`);

    if (player && startingSalary > getPlayerMaxSalary(player, seasonLabel, teamId)) problems.push("Starting salary exceeds the player's maximum salary.");
    if (player) problems.push(...validateContractYearsAndRaises({ ...normalizedOffer, signingTool: selectedTool }, player, teamId).problems);
    if (offer.playerOptionYear && offer.teamOptionYear) problems.push("A contract cannot contain both a player option and team option for the same final season.");
    if (offer.isOfferSheet && player) problems.push(...canCreateOfferSheet(teamId, playerId, normalizedOffer).problems);
    if (!options.ignoreTiming && player) {
      const own = isOwnFreeAgent(player, teamId);
      const canNegotiate = own ? canNegotiateOwnFreeAgents(teamId, offer.date) : canNegotiateOutsideFreeAgents(teamId, offer.date);
      if (!canNegotiate) problems.push("Free-agent negotiations are not open on this date.");
    }
    if (isMoratoriumPeriod(offer.date) && shouldStoreAsAgreement(offer.date, offer)) warnings.push("This offer will be stored as AGREED until July 6.");

    const projectedTeamSalary = getProjectedTeamSalaryAfterOffer(teamId, player, normalizedOffer, seasonLabel);
    const projectedApronTeamSalary = getProjectedApronTeamSalaryAfterOffer(teamId, player, normalizedOffer, seasonLabel);
    const triggeredHardCap = getTriggeredHardCapLine(offer.isSignAndTrade ? "SIGN_AND_TRADE_RECEIVE" : "SIGNING", selectedTool);
    const hardCapResult = validateHardCapCompliance(teamId, projectedApronTeamSalary, triggeredHardCap);
    problems.push(...hardCapResult.problems);
    if (selectedTool) explanations.push(getExceptionExplanation(selectedTool));
    explanations.push(explainHardCapResult(hardCapResult));
    const config = getContractRulesConfig(seasonLabel);
    const legal = problems.length === 0;

    return {
      legal,
      status: legal ? (warnings.length ? "WARNING" : "LEGAL") : "ILLEGAL",
      tool: selectedTool,
      toolLabel: selectedTool ? selectedTool.replaceAll("_", " ") : "No legal tool",
      signingPath: selectedTool,
      projectedTeamSalary,
      projectedApronTeamSalary,
      projectedCapRoom: roundMoney(config.salaryCap - projectedTeamSalary),
      projectedTaxRoom: roundMoney(config.luxuryTaxLine - projectedTeamSalary),
      projectedFirstApronRoom: roundMoney(config.firstApron - projectedApronTeamSalary),
      projectedSecondApronRoom: roundMoney(config.secondApron - projectedApronTeamSalary),
      triggeredHardCap,
      hardCapAmount: hardCapResult.amount,
      existingHardCap: getTeamHardCap(teamId, seasonLabel),
      remainingBelowHardCap: hardCapResult.remainingBelowHardCap,
      problems,
      warnings,
      explanations
    };
  }

  function getLegalSigningToolsForOffer(teamId, playerId, offer = {}) {
    const player = findPlayer(playerId);
    return player ? getAvailableSigningTools(teamId, player, offer) : [];
  }

  const previewContractOffer = validateContractOffer;

  function applyContractOffer(teamId, playerId, offer = {}) {
    const validation = validateContractOffer(teamId, playerId, offer);
    if (!validation.legal) return validation;
    const rules = ensureContractRulesState();
    const agreement = {
      id: `agreement_${Date.now()}_${playerId}`,
      teamId: Number(teamId),
      playerId,
      offer: { ...offer, startingSalary: money(offer.startingSalary), signingTool: validation.tool },
      status: shouldStoreAsAgreement(offer.date, offer) ? "AGREED" : "OFFICIAL",
      date: dateKey(offer.date)
    };
    rules.agreements.push(agreement);
    if (![TOOL.CAP_SPACE, TOOL.FULL_BIRD, TOOL.EARLY_BIRD, TOOL.NON_BIRD].includes(validation.tool)) {
      useException(teamId, validation.tool, offer.startingSalary, playerId);
    }
    if (validation.triggeredHardCap) setTeamHardCap(teamId, validation.triggeredHardCap, `${validation.tool} signing`, agreement.id);
    return { ...validation, agreement };
  }

  function getContractRuleExplanation(key) {
    const explanations = {
      TEAM_SALARY: "Team Salary includes active salaries, dead money, applicable cap holds, offer sheets, draft holds, roster charges, and exception holds.",
      APRON_TEAM_SALARY: "Apron Team Salary removes ordinary free-agent holds, unsigned first-round holds, exception holds, and incomplete-roster charges, while retaining RFA and required-tender amounts.",
      MORATORIUM: "Most July 1–5 agreements are not official until July 6.",
      HARD_CAP: "A triggering transaction creates a salary ceiling for the rest of that cap year."
    };
    return explanations[key] || getExceptionExplanation(key);
  }

  function debugTeamContractRules(teamId) {
    const result = {
      teamSalary: getTeamSalaryBreakdown(teamId),
      apronTeamSalary: getApronTeamSalaryBreakdown(teamId),
      exceptionWallet: getTeamExceptionWallet(teamId),
      hardCap: getTeamHardCap(teamId)
    };
    console.table([result.teamSalary]);
    return result;
  }

  function debugOfferValidation(teamId, playerId, offer) {
    const result = validateContractOffer(teamId, playerId, offer);
    console.table([{ legal: result.legal, tool: result.tool, teamSalary: result.projectedTeamSalary, apronSalary: result.projectedApronTeamSalary }]);
    if (result.problems.length) console.table(result.problems.map(problem => ({ problem })));
    return result;
  }

  function debugExceptionWallet(teamId) {
    const result = getTeamExceptionWallet(teamId);
    console.table(Object.values(result.tools));
    return result;
  }

  function getProjectedTeamSalaryAfterOffer(teamId, player, offer, seasonLabel) {
    const baseSalary = getTeamSalary(teamId, { seasonLabel });
    const currentHold = isOwnFreeAgent(player, teamId)
      ? getCapHoldAmount(player, teamId, seasonLabel)
      : 0;

    return roundMoney(baseSalary - currentHold + money(offer?.startingSalary));
  }

  function getProjectedApronTeamSalaryAfterOffer(teamId, player, offer, seasonLabel) {
    const baseSalary = getApronTeamSalary(teamId, { seasonLabel });
    const rfa = getRestrictedFreeAgentStatus(player);
    const currentApronHold = isOwnFreeAgent(player, teamId) && rfa.restricted
      ? Math.max(
        getCapHoldAmount(player, teamId, seasonLabel),
        getQualifyingOfferAmount(player, teamId, seasonLabel),
        money(player?.firstRefusalOfferAmount),
        money(player?.matchedOfferAmount)
      )
      : 0;

    return roundMoney(baseSalary - currentApronHold + money(offer?.startingSalary));
  }

  function debugCapHolds(teamId) {
    const result = getTeamCapHolds(teamId, currentSeasonLabel());
    console.table(result);
    return result;
  }

  function debugHardCap(teamId) {
    const result = getTeamHardCap(teamId);
    console.table(result ? [result] : []);
    return result;
  }

  const api = {
    TOOL, RIGHTS, getContractRulesConfig, getSalaryCapLine, getMinimumTeamSalaryLine,
    getLuxuryTaxLineForRules, getFirstApronLineForRules, getSecondApronLineForRules,
    getZeroYearsMinimumSalary, getMinimumSalaryForYearsService, getEstimatedAveragePlayerSalary,
    getTeamSalary, getTeamSalaryBreakdown, getTeamCapRoom, getTaxRoom, getFirstApronRoom,
    getSecondApronRoom, getRosterSalaryForCapYear, getDeadMoneyForTeam,
    getOutstandingOfferSheetSalary, getUnsignedFirstRoundPickCapHolds, getIncompleteRosterCharge,
    countPlayersIncludedInTeamSalary, getApronTeamSalary, getApronTeamSalaryBreakdown,
    getFreeAgentAmount, getCapHoldAmount, getPlayerPriorSalary, isOwnFreeAgent, isRightsTeam,
    hasBeenRenounced, renouncePlayerRights, canRenouncePlayer, getTeamCapHolds,
    getPlayerRightsStatus, getBirdRightsType, getVeteranFreeAgentExceptionLimit,
    getOwnPlayerMaxOffer, canUseBirdRights, canUseEarlyBirdRights, canUseNonBirdRights,
    getPlayerMaxSalary, getMaxSalaryTier, getHigherMaxEligibility,
    getDesignatedVeteranEligibility, getMaxContractYears, getMinContractYears,
    getMaxAnnualRaisePercent, validateContractYearsAndRaises, getOptionDecisionDeadline,
    canExerciseOptionToday, exerciseTeamOption, playerExerciseOption, declineTeamOption,
    playerDeclineOption, getPendingOptionDecisions, getOffseasonContractPhase,
    canNegotiateOwnFreeAgents, canNegotiateOutsideFreeAgents, isMoratoriumPeriod,
    canOfficiallySign, shouldStoreAsAgreement, convertMoratoriumAgreementsToOfficial,
    canSubmitQualifyingOffer, submitQualifyingOffer, withdrawQualifyingOffer,
    acceptQualifyingOffer, getQualifyingOfferAmount, getMaximumQualifyingOfferAmount,
    getRestrictedFreeAgentStatus, canCreateOfferSheet, createOfferSheet,
    getOfferSheetMatchDeadline, canMatchOfferSheet, matchOfferSheet, declineOfferSheetMatch,
    getTeamExceptionWallet, getAvailableSigningTools, getBestSigningTool,
    validateSigningTool, useException, renounceException, canUseException,
    getExceptionExplanation, getTeamHardCap, setTeamHardCap, clearExpiredHardCaps,
    getHardCapAmount, wouldTriggerHardCap, getTriggeredHardCapLine,
    validateHardCapCompliance, explainHardCapResult, getProtectedSalary,
    getUnprotectedSalary, getGuaranteeDate, isSalaryGuaranteed, waivePlayerCapImpact,
    canUseTrainingCampContract, isTrainingCampContract, countTrainingCampContracts,
    getProjectedTeamSalaryAfterOffer, getProjectedApronTeamSalaryAfterOffer,
    validateContractOffer, getLegalSigningToolsForOffer, previewContractOffer,
    applyContractOffer, getContractRuleExplanation, ensureContractRulesState,
    normalizePlayerContractRules, normalizeAllContractRules, debugTeamContractRules,
    debugOfferValidation, debugExceptionWallet, debugCapHolds, debugHardCap
  };

  global.ContractRules = Object.freeze(api);
  Object.entries(api).forEach(([name, value]) => {
    if (typeof value === "function") global[name] = value;
  });

  // Backwards-compatible cap helpers. Active payroll remains getRosterPayroll().
  global.getCapSpace = teamId => getTeamCapRoom(teamId ?? state()?.selectedTeamId);
  global.getSalaryCap = () => getSalaryCapLine();
  global.getLuxuryTaxLine = () => getLuxuryTaxLineForRules();
  global.getFirstApronLine = () => getFirstApronLineForRules();
  global.getSecondApronLine = () => getSecondApronLineForRules();

  global.addEventListener("load", function initializeContractRulesAfterLoad() {
    if (state()) normalizeAllContractRules();
  }, { once: true });
})(window);
