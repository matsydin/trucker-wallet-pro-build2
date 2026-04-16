(() => {

  const STORAGE_KEY = "tw_pro_build2_state";

  const defaultState = {
    ui: {
      theme: "dark",
      activeTab: "log",
      displayUnit: "km"
    }
  };

  let state = {};

  /* ===============================
     STORAGE
  =============================== */

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    try {
      return JSON.parse(raw);
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* ===============================
     RENDER
  =============================== */

  function render() {
    document.body.setAttribute("data-theme", state.ui.theme);

    // Tabs
    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle(
        "active",
        tab.dataset.tab === state.ui.activeTab
      );
    });

    // Unit toggle
    document.querySelectorAll(".segmented button").forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.unit === state.ui.displayUnit
      );
    });
  }

  /* ===============================
     ACTIONS
  =============================== */

  function setTheme(theme) {
    state.ui.theme = theme;
    saveState();
    render();
  }

  function toggleTheme() {
    const newTheme =
      state.ui.theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }

  function setTab(tab) {
    state.ui.activeTab = tab;
    saveState();
    render();
  }

  function setUnit(unit) {
    state.ui.displayUnit = unit;
    saveState();
    render();
  }

  /* ===============================
     EVENTS (Delegation)
  =============================== */

  function handleClick(e) {

    // Tabs
    const tab = e.target.closest(".tab");
    if (tab) {
      setTab(tab.dataset.tab);
      return;
    }

    // Unit toggle
    const unitBtn = e.target.closest("[data-unit]");
    if (unitBtn) {
      setUnit(unitBtn.dataset.unit);
      return;
    }

    // Temporary: double tap brand toggles theme
    const brand = e.target.closest(".brand");
    if (brand) {
      toggleTheme();
      return;
    }
  }

  /* ===============================
     INIT
  =============================== */

  function init() {
    state = loadState();
    document.addEventListener("click", handleClick);
    render();
  }

  document.addEventListener("DOMContentLoaded", init);

})();
