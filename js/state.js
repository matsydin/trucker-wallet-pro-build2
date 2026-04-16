// js/state.js

const STORAGE_KEY = "tw_pro_build2_state";

const defaultState = {
  ui: {
    theme: "dark",
    activeTab: "log",
    displayUnit: "km"
  },

  settings: {
    ratePerMile: 0.60
  },

  logbook: []
};

let state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    return {
      ...structuredClone(defaultState),
      ...JSON.parse(raw)
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export { state, saveState };
