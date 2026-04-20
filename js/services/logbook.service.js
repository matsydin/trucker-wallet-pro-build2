// js/services/logbook.service.js

import { state, saveState } from "../state.js";

const KM_TO_MI = 0.621371;

function createDefaultMeals() {
  return {
    breakfast: { taken: false, location: "" },
    lunch: { taken: false, location: "" },
    dinner: { taken: false, location: "" }
  };
}

export const LogbookService = {

  convertKmToMiles(km) {
    return +(km * KM_TO_MI).toFixed(1);
  },

  calculateAmount({ miles, loads, waitingHours, rate }) {
    return +(
      (miles * rate.perMile) +
      (loads * rate.perDrop) +
      (waitingHours * rate.perWaiting)
    ).toFixed(2);
  },

  calculateTotals() {
    let kilometers = 0;
    let miles = 0;
    let loads = 0;
    let waitingHours = 0;
    let amount = 0;

    state.current.entries.forEach(entry => {
      kilometers += Number(entry.kilometers || 0);
      miles += Number(entry.miles || 0);
      loads += Number(entry.loads || 0);
      waitingHours += Number(entry.waitingHours || 0);
      amount += Number(entry.amount || 0);
    });

    state.current.totals = {
      kilometers: +kilometers.toFixed(1),
      miles: +miles.toFixed(1),
      loads: +loads.toFixed(0),
      waitingHours: +waitingHours.toFixed(1),
      amount: +amount.toFixed(2)
    };
  },

  addEntry(data) {
    const miles = this.convertKmToMiles(data.kilometers);

    const rateSnapshot = {
      perMile: state.settings.ratePerMile,
      perDrop: state.settings.ratePerDrop,
      perWaiting: state.settings.ratePerWaitingHour
    };

    const amount = this.calculateAmount({
      miles,
      loads: data.loads,
      waitingHours: data.waitingHours,
      rate: rateSnapshot
    });

    const entry = {
      id: crypto.randomUUID(),
      date: data.date,
      kilometers: data.kilometers,
      miles,
      loads: data.loads,
      waitingHours: data.waitingHours,
      rateSnapshot,
      amount,
      meals: data.meals || createDefaultMeals(),
      notes: data.notes || ""
    };

    state.current.entries.push(entry);
// ✅ reset meals form state
state.ui.mealDraft = {
  breakfast: { taken: false, location: "" },
  lunch: { taken: false, location: "" },
  dinner: { taken: false, location: "" }
};
    this.calculateTotals();
    saveState();
  },

  editEntry(id, newData) {
    const entry = state.current.entries.find(e => e.id === id);
    if (!entry) return;

    entry.date = newData.date;
    entry.kilometers = newData.kilometers;
    entry.loads = newData.loads;
    entry.waitingHours = newData.waitingHours;

    entry.miles = this.convertKmToMiles(newData.kilometers);

    // Використовуємо старий rateSnapshot
    entry.amount = this.calculateAmount({
      miles: entry.miles,
      loads: entry.loads,
      waitingHours: entry.waitingHours,
      rate: entry.rateSnapshot
    });

    entry.meals = newData.meals || createDefaultMeals();

    this.calculateTotals();
    saveState();
  },

  deleteEntry(id) {
    state.current.entries = state.current.entries.filter(e => e.id !== id);

    this.calculateTotals();
    saveState();
  }

};
