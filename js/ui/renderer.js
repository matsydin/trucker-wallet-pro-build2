import { state } from "../state.js";

export function renderLogScreen() {
  renderSummary();
  renderEntries();
}

/* ===============================
   SUMMARY
================================ */

function renderSummary() {
  const amountEl = document.querySelector(".summary-amount");
  if (!amountEl) return;

  const amount = state.current?.totals?.amount ?? 0;
  const currency = state.settings?.currency ?? "CAD";

  amountEl.textContent = `${currency} ${amount.toFixed(2)}`;
}

/* ===============================
   ENTRIES
================================ */

function renderEntries() {
  const listEl = document.querySelector(".logbook-list");
  if (!listEl) return;

  listEl.innerHTML = "";

  state.current.entries.forEach(entry => {

    const unit = state.ui.displayUnit;

    const distance =
      unit === "mi"
        ? entry.miles ?? 0
        : entry.kilometers ?? 0;

    const unitLabel = unit === "mi" ? "mi" : "km";

    const amount = entry.amount ?? 0;
    const date = entry.date ?? "—";

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="entry-row">
        <div><strong>${date}</strong></div>
        <div>${distance} ${unitLabel}</div>
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
export function renderArchiveScreen(state) {
  const container = document.getElementById('app');
  const archive = state.archive || [];
  const detailId = state.archiveDetailId;

  // DETAIL VIEW
  if (detailId) {
    const period = archive.find(p => p.id === detailId);

    if (!period) {
      state.archiveDetailId = null;
      return renderArchiveScreen(state);
    }

    container.innerHTML = `
      <div class="screen archive-detail">
        <button data-action="close-archive" class="back-btn">← Back</button>

        <h2>${period.periodLabel}</h2>

        <div class="archive-summary">
          <p><strong>Gross:</strong> 
$$
{period.totals.gross.toFixed(2)}</p>
          <p><strong>Miles:</strong> ${period.totals.miles.toFixed(1)} ${state.settings.displayUnit}</p>
          <p><strong>Loads:</strong> ${period.entries.length}</p>
        </div>

        <div class="archive-entries">
          ${period.entries.map(entry => `
            <div class="entry-row">
              <div>${entry.date || ''}</div>
              <div>${entry.miles.toFixed(1)} ${state.settings.displayUnit}</div>
              <div>
$$
{entry.amount.toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <button 
          data-action="delete-archive" 
          data-id="${period.id}" 
          class="danger-btn"
        >
          Delete Period
        </button>
      </div>
    `;

    return;
  }

  // LIST VIEW
  if (!archive.length) {
    container.innerHTML = `
      <div class="screen archive-empty">
        <h2>Archive</h2>
        <p>No archived weeks yet.</p>
        <p>Finish a week to create archive.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="screen archive-list">
      <h2>Archive</h2>

      ${archive.map(period => `
        <div class="archive-card">
          <div>
            <h3>${period.periodLabel}</h3>
            <p>Gross: $${period.totals.gross.toFixed(2)}</p>
            <p>Miles: ${period.totals.miles.toFixed(1)} ${state.settings.displayUnit}</p>
            <p>Loads: ${period.entries.length}</p>
          </div>

          <div class="archive-actions">
            <button 
              data-action="open-archive" 
              data-id="${period.id}"
            >
              View
            </button>

            <button 
              data-action="delete-archive" 
              data-id="${period.id}"
              class="danger-btn"
            >
              Delete
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
