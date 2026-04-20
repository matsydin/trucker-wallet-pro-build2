// js/services/settings.service.js

import { state, saveState } from "../state.js";

export const SettingsService = {

  updateDriverName(name) {
    state.settings.driverName = name || "";
    saveState();
  },

  updateRates({ perMile, perDrop, perWaiting }) {
  state.settings.ratePerMile = Number(perMile) || 0;
  state.settings.ratePerDrop = Number(perDrop) || 0;
  state.settings.ratePerWaitingHour = Number(perWaiting) || 0;

  // перерахунок тільки current period
  import("../services/logbook.service.js").then(module => {
    module.LogbookService.calculateTotals();
    saveState();
  });
},

  updateInputUnit(unit) {
    if (!["km", "mi"].includes(unit)) return;
    state.ui.inputUnit = unit;
    saveState();
  },

  exportBackup() {
    const blob = new Blob(
      [JSON.stringify(state, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "tw-pro-backup.json";
    a.click();

    URL.revokeObjectURL(url);
  },

  restoreBackup(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const parsed = JSON.parse(e.target.result);
        localStorage.setItem("tw_pro_build2_state", JSON.stringify(parsed));
        location.reload();
      } catch {
        alert("Invalid backup file.");
      }
    };

    reader.readAsText(file);
  },

  resetAll() {
    if (!confirm("This will permanently delete ALL data. Continue?")) return;
    localStorage.clear();
    location.reload();
  }
};
