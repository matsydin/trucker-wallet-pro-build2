// js/ui/renderer.js

/* ===============================
   LOG SCREEN
================================ */

export function renderLogScreen(state) {
  const summaryEl = document.querySelector(".summary");
  const entriesEl = document.querySelector(".entries");

  if (!summaryEl || !entriesEl) return;

  const totalMiles = state.totals?.miles ?? 0;
  const totalGross = state.totals?.gross ?? 0;

  summaryEl.innerHTML = `
    <h2>This Week</h2>
    <p><strong>Miles:</strong> ${Number(totalMiles).toFixed(1)} ${state.ui.displayUnit}</p>
    <p><strong>Gross:</strong> 
$$
{Number(totalGross).toFixed(2)}</p>
  `;

  const entries = state.entries || [];

  if (!entries.length) {
    entriesEl.innerHTML = `<p class="empty">No entries yet</p>`;
    return;
  }

  entriesEl.innerHTML = entries.map(entry => `
    <div class="entry-row">
      <div>${entry.date || ""}</div>
      <div>${Number(entry.miles ?? 0).toFixed(1)} ${state.ui.displayUnit}</div>
      <div>
$$
{Number(entry.amount ?? 0).toFixed(2)}</div>
      <button data-delete="${entry.id}">✕</button>
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

  // ===== DETAIL VIEW =====
  if (detailId) {
    const period = archive.find(p => p.id === detailId);
    if (!period) return;

    archivePage.innerHTML = `
      <button data-action="close-archive">← Back</button>
      <h2>${period.periodLabel}</h2>

      <p><strong>Gross:</strong> 
$$
{Number(period.totals?.gross ?? 0).toFixed(2)}</p>
      <p><strong>Miles:</strong> ${Number(period.totals?.miles ?? 0).toFixed(1)} ${state.ui.displayUnit}</p>
      <p><strong>Loads:</strong> ${(period.entries || []).length}</p>

      <div>
        ${(period.entries || []).map(entry => `
          <div class="entry-row">
            <div>${entry.date || ""}</div>
            <div>${Number(entry.miles ?? 0).toFixed(1)} ${state.ui.displayUnit}</div>
            <div>
$$
{Number(entry.amount ?? 0).toFixed(2)}</div>
          </div>
        `).join("")}
      </div>

      <button data-action="delete-archive" data-id="${period.id}">
        Delete Period
      </button>
    `;

    return;
  }

  // ===== LIST VIEW =====
  if (!archive.length) {
    archivePage.innerHTML = `
      <h2>Archive</h2>
      <p>No archived weeks yet.</p>
    `;
    return;
  }

  archivePage.innerHTML = `
    <h2>Archive</h2>

    ${archive.map(period => `
      <div class="archive-card">
        <h3>${period.periodLabel}</h3>
        <p>Gross: $${Number(period.totals?.gross ?? 0).toFixed(2)}</p>
        <p>Miles: ${Number(period.totals?.miles ?? 0).toFixed(1)} ${state.ui.displayUnit}</p>
        <p>Loads: ${(period.entries || []).length}</p>

        <button data-action="open-archive" data-id="${period.id}">
          View
        </button>

        <button data-action="delete-archive" data-id="${period.id}">
          Delete
        </button>
      </div>
    `).join("")}
  `;
}
