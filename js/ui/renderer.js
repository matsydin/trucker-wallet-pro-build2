// js/ui/renderer.js

/* ===============================
   LOG SCREEN
================================ */

export function renderLogScreen(state) {
  const totalEl = document.querySelector(".summary-amount");
  const listEl = document.querySelector(".logbook-list");

  if (!totalEl || !listEl) return;

  const totalAmount = state.current?.totals?.amount ?? 0;

  totalEl.textContent =
    `
$$
{Number(totalAmount).toFixed(2)} ${state.settings.currency}`;

  const entries = state.current?.entries || [];

  if (!entries.length) {
    listEl.innerHTML = `<div class="card">No entries yet</div>`;
    return;
  }

  listEl.innerHTML = entries.map(entry => `
    <div class="card">
      <div>${entry.date || ""}</div>
      <div>${Number(entry.miles ?? 0).toFixed(1)} ${state.ui.displayUnit}</div>
      <div>
$$
{Number(entry.amount ?? 0).toFixed(2)}</div>
      <button data-delete="${entry.id}" type="button">Delete</button>
    </div>
  `).join("");
}


/* ===============================
   ARCHIVE SCREEN
================================ */

export function renderArchiveScreen(state) {
  const archivePage = document.querySelector('[data-page="archive"]');
  if (!archivePage) return;

  const archive = state.archive || [];
  const detailId = state.archiveDetailId;

  if (detailId) {
    const period = archive.find(p => p.id === detailId);
    if (!period) return;

    archivePage.innerHTML = `
      <div class="card">
        <button data-action="close-archive" type="button">← Back</button>
        <h3>${period.periodLabel}</h3>
        <p>Gross: 
$$
{Number(period.totals?.gross ?? 0).toFixed(2)}</p>
        <p>Miles: ${Number(period.totals?.miles ?? 0).toFixed(1)} ${state.ui.displayUnit}</p>
        <p>Loads: ${(period.entries || []).length}</p>
      </div>

      ${(period.entries || []).map(entry => `
        <div class="card">
          <div>${entry.date || ""}</div>
          <div>${Number(entry.miles ?? 0).toFixed(1)} ${state.ui.displayUnit}</div>
          <div>
$$
{Number(entry.amount ?? 0).toFixed(2)}</div>
        </div>
      `).join("")}

      <div class="card">
        <button data-action="delete-archive" data-id="${period.id}" type="button">
          Delete Period
        </button>
      </div>
    `;
    return;
  }

  if (!archive.length) {
    archivePage.innerHTML = `
      <div class="card">No archived weeks yet.</div>
    `;
    return;
  }

  archivePage.innerHTML = archive.map(period => `
    <div class="card">
      <h3>${period.periodLabel}</h3>
      <p>Gross: $${Number(period.totals?.gross ?? 0).toFixed(2)}</p>
      <p>Miles: ${Number(period.totals?.miles ?? 0).toFixed(1)} ${state.ui.displayUnit}</p>
      <p>Loads: ${(period.entries || []).length}</p>

      <button data-action="open-archive" data-id="${period.id}" type="button">
        View
      </button>

      <button data-action="delete-archive" data-id="${period.id}" type="button">
        Delete
      </button>
    </div>
  `).join("");
}
