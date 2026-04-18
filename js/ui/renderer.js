// js/ui/renderer.js
import { getYearTotal } from "../services/timeline.service.js";
import { ArchiveService } from "../services/archive.service.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ======================================
   RENDER LOG SCREEN
====================================== */

export function renderLogScreen(state) {
  const totalEl = document.querySelector(".summary-amount");
  const listEl = document.querySelector(".logbook-list");

  if (!totalEl || !listEl) return;

  const totals = state.current?.totals || {};
  const totalAmount = totals.amount ?? 0;

  totalEl.textContent =
    "$" + Number(totalAmount).toFixed(2) + " " + state.settings.currency;

  const entries = state.current?.entries || [];

  if (!entries.length) {
    listEl.innerHTML = '<div class="card">No entries yet</div>';
    return;
  }

  listEl.innerHTML = entries.map(entry => {
    const distance =
      state.ui.displayUnit === "km"
        ? Number(entry.kilometers ?? 0).toFixed(1)
        : Number(entry.miles ?? 0).toFixed(1);

    return (
      '<div class="card">' +
        '<div class="card-header">' +
          '<h3>' + escapeHtml(entry.date || "") + '</h3>' +
          '<div>' +
            '<button data-action="edit-log-entry" data-id="' + entry.id + '" type="button">Edit</button>' +
            '<button data-delete="' + entry.id + '" type="button">Delete</button>' +
          '</div>' +
        '</div>' +
        '<p>' + distance + " " + state.ui.displayUnit + '</p>' +
        '<p>Loads: ' + Number(entry.loads ?? 0) + '</p>' +
        '<p>Waiting: ' + Number(entry.waitingHours ?? 0) + ' h</p>' +
        '<p class="entry-amount">$' + Number(entry.amount ?? 0).toFixed(2) + '</p>' +
      '</div>'
    );
  }).join("");
}

/* ======================================
   RENDER DATA SCREEN
====================================== */

export function renderDataScreen(state) {
  const container = document.querySelector('[data-page="data"]');
  if (!container) return;

  const active = state.ui.dataTab;

  let html = `
    <div class="screen">
      <div class="screen-header">
        <h2>Data</h2>
      </div>

      <div class="segmented data-segmented">
        <button
          data-action="set-data-tab"
          data-tab="customers"
          class="${active === "customers" ? "active" : ""}">
          Customers
        </button>

        <button
          data-action="set-data-tab"
          data-tab="fleet"
          class="${active === "fleet" ? "active" : ""}">
          Fleet
        </button>
      </div>

      <div id="data-content"></div>
    </div>
  `;

  container.innerHTML = html;

  if (active === "customers") {
    renderCustomers(state);
  }

  if (active === "fleet") {
    renderFleet(state);
  }
}

/* ======================================
   RENDER ARCHIVE SCREEN
====================================== */

export function renderArchiveScreen(state) {
  const archivePage = document.querySelector('[data-page="archive"]');
  if (!archivePage) return;

  const { archiveYear, archiveMonth, archiveDetailId } = state.ui;

  const allPeriods = state.archive || [];

  /* ============================
     LEVEL DETECTION
  ============================ */

  let level = "years";

  if (archiveDetailId) level = "detail";
  else if (archiveMonth !== null) level = "weeks";
  else if (archiveYear !== null) level = "months";

  /* ============================
     BACK BUTTON
  ============================ */

  let backBtn = "";

  if (level !== "years") {
    backBtn =
      '<button class="ghost-btn" data-action="archive-back">← Back</button>';
  }

  /* ============================
     SUMMARY BAR
  ============================ */

function renderSummary(totals, label) {
  return (
    '<div class="archive-summary">' +

      '<div class="archive-summary-top">' +
        '<h2>' + label + '</h2>' +
        '<button class="export-btn" data-action="export-archive">Export</button>' +
      '</div>' +

      '<div class="archive-summary-grid">' +

        '<div class="summary-item">' +
          '<span>Gross</span>' +
          '<strong>$' + Number(totals.amount ?? 0).toFixed(2) + '</strong>' +
        '</div>' +

        '<div class="summary-item">' +
          '<span>Distance</span>' +
          '<strong>' + Number(totals.kilometers ?? 0).toFixed(0) + ' ' + state.ui.displayUnit + '</strong>' +
        '</div>' +

        '<div class="summary-item">' +
          '<span>Loads</span>' +
          '<strong>' + Number(totals.loads ?? 0) + '</strong>' +
        '</div>' +

      '</div>' +

    '</div>'
  );
}

  /* ============================
     DETAIL VIEW
  ============================ */

  if (level === "detail") {
    const period = allPeriods.find(p => p.id === archiveDetailId);
    if (!period) return;

    const summary = renderSummary(period.totals, period.periodLabel);

    archivePage.innerHTML =
      '<div class="screen">' +
        backBtn +
        summary +
      '</div>';

    return;
  }

  /* ============================
     YEARS VIEW
  ============================ */

  if (level === "years") {
    const years = ArchiveService.getArchiveYears();

    const total = years.reduce((acc, y) => {
      acc.amount += y.amount ?? 0;
      acc.kilometers += y.kilometers ?? 0;
      acc.loads += y.loads ?? 0;
      return acc;
    }, { amount: 0, kilometers: 0, loads: 0 });

    const summary = renderSummary(total, "All Years");

    const table =
      '<div class="archive-table">' +
        '<div class="archive-row archive-header">' +
          '<div>Year</div>' +
          '<div>Gross</div>' +
          '<div></div>' +
        '</div>' +

        years.map(y =>
          '<div class="archive-row" data-action="open-archive-year" data-year="' + y.year + '">' +
            '<div>' + y.year + '</div>' +
            '<div>$' + Number(y.amount ?? 0).toFixed(2) + '</div>' +
            '<div>View</div>' +
          '</div>'
        ).join("") +

      '</div>';

    archivePage.innerHTML =
      '<div class="screen">' +
        summary +
        table +
      '</div>';

    return;
  }

  /* ============================
     MONTHS VIEW
  ============================ */

  if (level === "months") {
    const months = ArchiveService.getArchiveMonths(archiveYear);

    const total = months.reduce((acc, m) => {
      acc.amount += m.amount ?? 0;
      acc.kilometers += m.kilometers ?? 0;
      acc.loads += m.loads ?? 0;
      return acc;
    }, { amount: 0, kilometers: 0, loads: 0 });

    const summary = renderSummary(total, archiveYear);

    const table =
      '<div class="archive-table">' +
        '<div class="archive-row archive-header">' +
          '<div>Month</div>' +
          '<div>Gross</div>' +
          '<div></div>' +
        '</div>' +

        months.map(m => {
          const name = new Date(m.year, m.month)
            .toLocaleString("en-US", { month: "long" });

          return (
            '<div class="archive-row" data-action="open-archive-month" data-year="' + m.year + '" data-month="' + m.month + '">' +
              '<div>' + name + '</div>' +
              '<div>$' + Number(m.amount ?? 0).toFixed(2) + '</div>' +
              '<div>View</div>' +
            '</div>'
          );
        }).join("") +

      '</div>';

    archivePage.innerHTML =
      '<div class="screen">' +
        backBtn +
        summary +
        table +
      '</div>';

    return;
  }

  /* ============================
     WEEKS VIEW
  ============================ */

  const weeks = ArchiveService.getArchivedWeeks(archiveYear, archiveMonth);

  const total = weeks.reduce((acc, w) => {
    acc.amount += w.totals.amount ?? 0;
    acc.kilometers += w.totals.kilometers ?? 0;
    acc.loads += w.totals.loads ?? 0;
    return acc;
  }, { amount: 0, kilometers: 0, loads: 0 });

  const monthName = new Date(archiveYear, archiveMonth)
    .toLocaleString("en-US", { month: "long" });

  const summary = renderSummary(total, monthName + " " + archiveYear);

  const table =
    '<div class="archive-table">' +
      '<div class="archive-row archive-header">' +
        '<div>Week</div>' +
        '<div>Gross</div>' +
        '<div></div>' +
      '</div>' +

      weeks.map(w =>
        '<div class="archive-row" data-action="open-archive" data-id="' + w.id + '">' +
          '<div>' + escapeHtml(w.periodLabel) + '</div>' +
          '<div>$' + Number(w.totals.amount ?? 0).toFixed(2) + '</div>' +
          '<div>View</div>' +
        '</div>'
      ).join("") +

    '</div>';

  archivePage.innerHTML =
    '<div class="screen">' +
      backBtn +
      summary +
      table +
    '</div>';
}

/* ======================================
   RENDER CUSTOMERS SCREEN
====================================== */

export function renderCustomers(state) {
  const container = document.getElementById("data-content");
  if (!container) return;

  const customers = state.customers;
  const search = state.ui.customerSearch || "";

  const filtered = search
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  let html = `
    <div class="screen">
      <div class="screen-header">
        <h2>Customers</h2>
        <button class="primary-btn"
                data-action="open-add-customer">
          + Add
        </button>
      </div>

      <div class="form-group">
        <input
          type="text"
          placeholder="Search customer..."
          value="${escapeHtml(search)}"
          data-action="customer-search"
        />
      </div>
  `;

  if (filtered.length === 0) {
    html += `<div class="empty-state">No customers found</div>`;
  } else {
    html += `<div class="card-list">`;

    filtered.forEach(c => {
      html += `
        <div class="card">
          <div class="card-header">
            <h3>${escapeHtml(c.name)}</h3>
            <div>
              <button data-action="edit-customer"
                      data-id="${c.id}">
                Edit
              </button>
              <button data-action="delete-customer"
                      data-id="${c.id}">
                Delete
              </button>
            </div>
          </div>

          ${c.address ? `<p>${escapeHtml(c.address)}</p>` : ""}

          ${
            c.is24h
              ? `<p>Open 24 Hours</p>`
              : c.openTime && c.closeTime
              ? `<p>${escapeHtml(c.openTime)} - ${escapeHtml(c.closeTime)}</p>`
              : ""
          }

          ${c.notes ? `<p class="muted">${escapeHtml(c.notes)}</p>` : ""}
        </div>
      `;
    });

    html += `</div>`;
  }

  html += `</div>`;

  container.innerHTML = html;
}

/* ======================================
   RENDER FLEET
====================================== */

export function renderFleet(state) {
  const container = document.getElementById("data-content");
  if (!container) return;

  const search = state.ui.trailerSearch || "";
  const query = search.trim().toLowerCase();

  const trailers = query
    ? state.trailers.filter(t =>
        [
          t.unitNumber,
          t.plate,
          t.maxLoad,
          t.psi,
          t.notes
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    : state.trailers;

  let html = `
    <div class="screen">
      <div class="screen-header">
        <h2>Fleet</h2>
        <button class="primary-btn" data-action="open-add-trailer">
          + Add
        </button>
      </div>

      <div class="form-group">
        <input
          type="text"
          placeholder="Search trailer..."
          value="${escapeHtml(search)}"
          data-action="trailer-search"
        />
      </div>
  `;

  if (!trailers.length) {
    html += `<div class="empty-state">No trailers found</div>`;
  } else {
    html += `<div class="card-list">`;

    trailers.forEach(t => {
      html += `
        <div class="card">
          <div class="card-header">
            <h3>#${escapeHtml(t.unitNumber)}</h3>
            <div>
              <button data-action="edit-trailer" data-id="${t.id}">
                Edit
              </button>
              <button data-action="delete-trailer" data-id="${t.id}">
                Delete
              </button>
            </div>
          </div>

          ${t.plate ? `<p>Plate: ${escapeHtml(t.plate)}</p>` : ""}
          ${t.maxLoad ? `<p>Max Load: ${escapeHtml(t.maxLoad)}</p>` : ""}
          ${t.psi ? `<p>PSI: ${escapeHtml(t.psi)}</p>` : ""}
          ${t.notes ? `<p class="muted">${escapeHtml(t.notes)}</p>` : ""}
        </div>
      `;
    });

    html += `</div>`;
  }

  html += `</div>`;

  container.innerHTML = html;
}
