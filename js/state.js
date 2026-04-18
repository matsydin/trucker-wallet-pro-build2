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
  language: "EN",

  /* ===== Archive Navigation ===== */

  archiveView: "years",   // years | months | weeks | entries

  archiveYear: null,
  archiveMonth: null,
  archiveWeekId: null,

  archiveFilter: {
    from: null,
    to: null
  }
};

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
     loads: 0,           
     waitingHours: 0,    
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

    if (parsed.logbook && !parsed.current) {
      return migrateFromV1(parsed);
    }

    const merged = deepMerge(structuredClone(defaultState), parsed);

    // ✅ ensure current.totals structure (backward safety)
    merged.current.totals = {
      kilometers: merged.current.totals.kilometers ?? 0,
      miles: merged.current.totals.miles ?? 0,
      loads: merged.current.totals.loads ?? 0,
      waitingHours: merged.current.totals.waitingHours ?? 0,
      amount: merged.current.totals.amount ?? 0
    };
// ✅ Ensure meals exist (backward compatibility)

merged.current.entries.forEach(entry => {
  if (!entry.meals) {
    entry.meals = {
      breakfast: { taken: false, location: "" },
      lunch: { taken: false, location: "" },
      dinner: { taken: false, location: "" }
    };
  }
});

merged.archive.forEach(period => {
  (period.entries || []).forEach(entry => {
    if (!entry.meals) {
      entry.meals = {
        breakfast: { taken: false, location: "" },
        lunch: { taken: false, location: "" },
        dinner: { taken: false, location: "" }
      };
    }
  });
});
    return merged;

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
      target[key] = deepMerge(target[key] || {}, source[key]);
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

export { state, saveState, loadState };
