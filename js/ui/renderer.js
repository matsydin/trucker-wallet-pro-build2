// js/ui/renderer.js

import { state } from "../state.js";

export function renderLogScreen() {
  renderSummary();
  renderEntries();
}

function renderSummary() {
  const amountEl = document.querySelector(".summary-amount");
  if (!amountEl) return;

  const totals = state.current.totals;
  const currency = state.settings.currency;

  amountEl.textContent =
    `${currency} ${totals.amount.toFixed(2)}`;
}

function renderEntries() {
  const listEl = document.querySelector(".logbook-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  state.current.entries.forEach(entry => {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="entry-row">
        <div><strong>${entry.date}</strong></div>
        <div>${entry.kilometers} km</div>
        <div>${state.settings.currency} ${entry.amount.toFixed(2)}</div>
      </div>

      <div class="entry-actions">
        <button data-edit="${entry.id}" type="button">Edit</button>
        <button data-delete="${entry.id}" type="button">Delete</button>
      </div>
    `;

    listEl.appendChild(card);
  });
}
