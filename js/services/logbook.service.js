import { state, saveState } from "../state.js";

const KM_TO_MI = 0.621371;

export const LogbookService = {

  /* ======================================
     ADD ENTRY
  ====================================== */

  addEntry({ distanceKm, date, loads = 0, waitingHours = 0 }) {
    const kilometers = Number(distanceKm);
    const miles = Number((kilometers * KM_TO_MI).toFixed(1));

    const { ratePerMile, ratePerDrop, ratePerWaitingHour } = state.settings;

    const amount =
      (miles * ratePerMile) +
      (loads * ratePerDrop) +
      (waitingHours * ratePerWaitingHour);

    const entry = {
      id: crypto.randomUUID(),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      kilometers,
      miles,
      loads,
      waitingHours,
      rateSnapshot: {
        perMile: ratePerMile,
        perDrop: ratePerDrop,
        perWaiting: ratePerWaitingHour
      },
      amount: Number(amount.toFixed(2))
    };

    state.current.entries.push(entry);
    this.calculateTotals();
    saveState();
    this.render();
  },

  /* ======================================
     TOTALS
  ====================================== */

  calculateTotals() {
    const totals = { kilometers: 0, miles: 0, amount: 0 };

    state.current.entries.forEach(e => {
      totals.kilometers += e.kilometers;
      totals.miles += e.miles;
      totals.amount += e.amount;
    });

    state.current.totals = {
      kilometers: Number(totals.kilometers.toFixed(0)),
      miles: Number(totals.miles.toFixed(1)),
      amount: Number(totals.amount.toFixed(2))
    };
  },

  getTotalAmount() {
    return state.current.totals.amount;
  },

  /* ======================================
     RENDER
  ====================================== */

  render() {
    this.renderSummary();
    this.renderList();
  },

  renderSummary() {
    const summaryEl = document.querySelector(".summary-amount");
    if (!summaryEl) return;

    const total = this.getTotalAmount();
    const currency = state.settings.currency;

    // Виправлено: прибрано зайвий '$' та розриви рядків
    summaryEl.textContent = `${total.toFixed(2)} ${currency}`;
  },

  renderList() {
    const listEl = document.querySelector(".logbook-list");
    if (!listEl) return;

    const entries = state.current.entries;

    if (entries.length === 0) {
      listEl.innerHTML = `<div class="card empty">No entries yet</div>`;
      return;
    }

    listEl.innerHTML = entries
      .map(entry => this.renderItem(entry))
      .join("");
  },

  renderItem(entry) {
    const unit = state.ui.displayUnit;
    const distance = unit === "km"
        ? `${entry.kilometers.toFixed(0)} KM`
        : `${entry.miles.toFixed(1)} MI`;

    const date = new Date(entry.date).toLocaleDateString("en-CA", {
      year: "numeric", month: "short", day: "2-digit"
    });

    const loads = entry.loads ? ` • ${entry.loads} LD` : "";
    const waiting = entry.waitingHours ? ` • ${entry.waitingHours}h WT` : "";

    return `
      <div class="card log-item" data-id="${entry.id}">
        <div class="log-row">
          <div>
            <div class="log-date">${date}</div>
            <div class="log-distance">${distance}${loads}${waiting}</div>
          </div>
          <div class="log-amount">
            ${entry.amount.toFixed(2)}
          </div>
        </div>
      </div>
    `;
  }
};
