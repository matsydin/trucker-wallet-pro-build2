import { state, saveState } from "../state.js";

const KM_TO_MI = 0.621371;

export const LogbookService = {

addEntry({ distanceKm, date, pickups }) {

  const miles = distanceKm * KM_TO_MI;
  const rate = state.settings.ratePerMile;

  const entry = {
    id: crypto.randomUUID(),
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    distanceKm,
    distanceMi: miles,
    pickups: pickups || 0,
    rateSnapshot: rate,
    amount: miles * rate
  };

  state.logbook.push(entry);
  saveState();
  this.render();
},

  addMockEntry() {
    this.addEntry({
      distanceKm: Math.floor(Math.random() * 500) + 50
    });
  },

  getTotal() {
    return state.logbook.reduce((sum, e) => sum + e.amount, 0);
  },

  render() {
    this.renderSummary();
    this.renderList();
  },

  renderSummary() {
    const summaryEl = document.querySelector(".summary-amount");
    if (!summaryEl) return;

    const total = this.getTotal();
    summaryEl.textContent = "$" + total.toFixed(2) + " CAD";
  },

  renderList() {
    const listEl = document.querySelector(".logbook-list");
    if (!listEl) return;

    if (state.logbook.length === 0) {
      listEl.innerHTML = `
        <div class="card empty">
          No entries yet
        </div>
      `;
      return;
    }

    listEl.innerHTML = state.logbook
      .map(entry => this.renderItem(entry))
      .join("");
  },

  renderItem(entry) {
    const unit = state.ui.displayUnit;

    const distance =
      unit === "km"
        ? entry.distanceKm.toFixed(0) + " KM"
        : entry.distanceMi.toFixed(0) + " MI";

    return `
      <div class="card log-item" data-id="${entry.id}">
        <div class="log-row">
          <div class="log-distance">${distance}</div>
          <div class="log-amount">
            $${entry.amount.toFixed(2)}
          </div>
        </div>
      </div>
    `;
  }

};
