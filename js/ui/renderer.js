// js/ui/renderer.js

import { state } from "../state.js";

export function renderLogScreen() {
  renderSummary();
  renderEntries();
}

function renderSummary() {
  const amountEl = document.querySelector(".summary-amount");
  if (!amountEl) return;

  const amount = state.current?.totals?.amount ?? 0;
  const currency = state.settings?.currency ?? "CAD";

  amountEl.textContent = `${currency} ${amount.toFixed(2)}`;
}

function renderEntries() {
  const listEl = document.querySelector(".logbook-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  state.current.entries.forEach(entry => {

    const kilometers = entry.kilometers ?? 0;
    const amount = entry.amount ?? 0;
    const date = entry.date ?? "—";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="entry-row">
        <div><strong>${date}</strong></div>
        <div>${kilometers} km</div>
        <div>${state.settings.currency} ${amount.toFixed(2)}</div>
      </div>

      <div class="entry-actions">
        <button data-edit="${entry.id}" type="button">Edit</button>
        <button data-delete="${entry.id}" type="button">Delete</button>
      </div>
    `;

    listEl.appendChild(card);
  });
}
