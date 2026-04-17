import { state } from "../state.js";

export function renderLogScreen() {
  renderSummary();
  renderEntries();
}

function renderSummary() {
  const summaryEl = document.querySelector("#summary");

  const totals = state.current.totals;
  const currency = state.settings.currency;

  summaryEl.innerHTML = `
    <div class="summary-card">
      <div class="summary-amount">
        ${currency} ${totals.amount.toFixed(2)}
      </div>
      <div class="summary-distance">
        ${totals.kilometers.toFixed(1)} km
      </div>
    </div>
  `;
}

function renderEntries() {
  const listEl = document.querySelector("#entryList");
  listEl.innerHTML = "";

  state.current.entries.forEach(entry => {
    const card = document.createElement("div");
    card.className = "entry-card";

    card.innerHTML = `
      <div class="entry-date">${entry.date}</div>
      <div>${entry.kilometers} km</div>
      <div>${entry.amount.toFixed(2)} ${state.settings.currency}</div>

      <div class="entry-actions">
        <button data-edit="${entry.id}">Edit</button>
        <button data-delete="${entry.id}">Delete</button>
      </div>
    `;

    listEl.appendChild(card);
  });
}
