// js/ui/renderer.js

/* ===============================
   HELPERS
================================ */

function getPage(pageName) {
  return document.querySelector(`[data-page="${pageName}"]`);
}

/* ===============================
   LOG SCREEN
================================ */

export function renderLogScreen(state) {
  const page = getPage("log");
  if (!page) return;

  const entries = state.entries || [];
  const totals = state.totals || {};

  const totalMiles = totals.miles ?? 0;
  const totalGross = totals.gross ?? 0;

  page.innerHTML = `
    <div class="summary">
      <h2>This Week</h2>
      <p><strong>Miles:</strong> ${Number(totalMiles).toFixed(1)} ${state.ui.displayUnit}</p>
      <p><strong>Gross:</strong> 
$$
{Number(totalGross).toFixed(2)}</p>
    </div>

    <div class="entries">
      ${entries.length === 0 ? `
        <p class="empty">No entries yet</p>
      ` : `
        ${entries.map(entry => {
          const miles = entry.miles ?? 0;
          const amount = entry.amount ?? 0;

          return `
            <div class="entry-row">
              <div>${entry.date || ""}</div>
              <div>${Number(miles).toFixed(1)} ${state.ui.displayUnit}</div>
              <div>
$$
{Number(amount).toFixed(2)}</div>
              <button data-delete="${entry.id}">✕</button>
            </div>
          `;
        }).join("")}
      `}
    </div>

    <button id="finish-week-btn" class="finish-btn">
      Finish Week
    </button>
  `;
}

/* ===============================
   ARCHIVE SCREEN
================================ */

export function renderArchiveScreen(state) {
  const page = getPage("archive");
  if (!page) return;

  const archive = state.archive || [];
  const detailId = state.archiveDetailId;

  /* ===== DETAIL VIEW ===== */

  if (detailId) {
    const period = archive.find(p => p.id === detailId);

    if (!period) {
      state.archiveDetailId = null;
      return renderArchiveScreen(state);
    }

    const gross = period.totals?.gross ?? 0;
    const miles = period.totals?.miles ?? 0;

    page.innerHTML = `
      <button data-action="close-archive" class="back-btn">
        ← Back
      </button>

      <h2>${period.periodLabel}</h2>

      <div class="archive-summary">
        <p><strong>Gross:</strong> 
$$
{Number(gross).toFixed(2)}</p>
        <p><strong>Miles:</strong> ${Number(miles).toFixed(1)} ${state.ui.displayUnit}</p>
        <p><strong>Loads:</strong> ${(period.entries || []).length}</p>
      </div>

      <div class="archive-entries">
        ${(period.entries || []).map(entry => {
          const entryMiles = entry.miles ?? 0;
          const entryAmount = entry.amount ?? 0;

          return `
            <div class="entry-row">
              <div>${entry.date || ""}</div>
              <div>${Number(entryMiles).toFixed(1)} ${state.ui.displayUnit}</div>
              <div>
$$
{Number(entryAmount).toFixed(2)}</div>
            </div>
          `;
        }).join("")}
      </div>

      <button 
        data-action="delete-archive" 
        data-id="${period.id}" 
        class="danger-btn"
      >
        Delete Period
      </button>
    `;

    return;
  }

  /* ===== LIST VIEW ===== */

  if (!archive.length) {
    page.innerHTML = `
      <h2>Archive</h2>
      <p>No archived weeks yet.</p>
      <p>Finish a week to create archive.</p>
    `;
    return;
  }

  page.innerHTML = `
    <h2>Archive</h2>

    ${archive.map(period => {
      const gross = period.totals?.gross ?? 0;
      const miles = period.totals?.miles ?? 0;

      return `
        <div class="archive-card">
          <div>
            <h3>${period.periodLabel}</h3>
            <p>Gross: $${Number(gross).toFixed(2)}</p>
            <p>Miles: ${Number(miles).toFixed(1)} ${state.ui.displayUnit}</p>
            <p>Loads: ${(period.entries || []).length}</p>
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
      `;
    }).join("")}
  `;
}
