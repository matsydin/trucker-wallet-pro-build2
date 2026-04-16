// js/state.js

const STORAGE_KEY = "tw_pro_build2_state";

/* ======================================
   DEFAULT STATE — MASTER PLAN
====================================== */

const defaultState = {
  ui: {
    theme: "dark",
    activeTab: "log",
    displayUnit: "km",
    inputUnit: "km",
    language: "EN"
  },

  settings: {
    driverName: "",
    ratePerMile: 0.60,
    ratePerDrop: 0,
    ratePerWaitingHour: 0,
    currency: "CAD"
  },

  current: {
    entries: [],
    totals: {
      kilometers: 0,
      miles: 0,
      amount: 0
    }
  },

  archive: [],
  customers: [],
  trailers: []
};

let state = loadState();

/* ======================================
   LOAD WITH SAFE MERGE
====================================== */

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(raw);

    // 🔁 MIGRATION from old structure
    if (parsed.logbook && !parsed.current) {
      return migrateFromV1(parsed);
    }

    return deepMerge(structuredClone(defaultState), parsed);
  } catch {
    return structuredClone(defaultState);
  }
}

/* ======================================
   MIGRATION (Build 1 → Build 2)
====================================== */

function migrateFromV1(oldState) {
  const migrated = structuredClone(defaultState);

  migrated.ui = {
    ...migrated.ui,
    ...oldState.ui
  };

  migrated.settings.ratePerMile =
    oldState.settings?.ratePerMile ?? 0.60;

  migrated.current.entries = (oldState.logbook || []).map(e => ({
    id: e.id,
    date: e.date,
    kilometers: e.distanceKm,
    miles: e.distanceMi,
    loads: e.pickups || 0,
    waitingHours: 0,
    rateSnapshot: {
      perMile: e.rateSnapshot,
      perDrop: 0,
      perWaiting: 0
    },
    amount: e.amount
  }));

  return migrated;
}

/* ======================================
   UTIL: DEEP MERGE
====================================== */

function deepMerge(target, source) {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(
        target[key] || {},
        source[key]
      );
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

/* ======================================
   SAVE
====================================== */

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export { state, saveState };
