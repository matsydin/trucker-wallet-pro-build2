// js/ui/renderer.js
import { ArchiveAggregationService } from "../services/archive-aggregation.service.js";

function getAvailableYears() {
  const years = ArchiveAggregationService.getYearsSummary();

  if (!years.length) {
    return [new Date().getFullYear()];
  }

  return years
    .map(y => y.year)
    .sort((a, b) => b - a);
}

function getMonthOptions() {
  return [
    "January","February","March","April",
    "May","June","July","August",
    "September","October","November","December"
  ];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getMealsCount(meals) {
  if (!meals) return 0;

  return ["breakfast", "lunch", "dinner"]
    .filter(type => meals[type]?.taken)
    .length;
}

function formatMealsSummary(meals) {
  if (!meals) return "";

  const parts = [];

  if (meals.breakfast?.taken) parts.push("B(" + meals.breakfast.location + ")");
  if (meals.lunch?.taken)     parts.push("L(" + meals.lunch.location + ")");
  if (meals.dinner?.taken)    parts.push("D(" + meals.dinner.location + ")");

  return parts.length ? "Meals: " + parts.join(", ") : "";
}

/* ======================================
   RENDER LOG SCREEN
====================================== */

export function renderLogScreen(state) {
  const totalEl = document.querySelector(".summary-amount");
  const listEl  = document.querySelector(".logbook-list");

  if (!totalEl || !listEl) return;

  const totals      = state.current?.totals || {};
  const totalAmount = totals.amount ?? 0;

  totalEl.textContent =
    Number(totalAmount).toFixed(2) + " " + state.settings.currency;

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

    const mealsCount   = getMealsCount(entry.meals);
    const mealsSummary = formatMealsSummary(entry.meals);

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
        '<p>Loads: '   + Number(entry.loads ?? 0) + '</p>' +
        '<p>Waiting: ' + Number(entry.waitingHours ?? 0) + ' h</p>' +

        (mealsCount > 0
  ? '<p class="muted">' + mealsSummary + '</p>'
  : '') +

(entry.notes
  ? '<p class="muted">' + escapeHtml(entry.notes) + '</p>'
  : '') +

'<p class="entry-amount">' +
  Number(entry.amount ?? 0).toFixed(2) +
  ' ' + state.settings.currency +
'</p>' +

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

  const html = `
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

  if (active === "customers") renderCustomers(state);
  if (active === "fleet")     renderFleet(state);
}
/* ======================================
   RENDER ARCHIVE SCREEN
====================================== */
import { ArchiveService } from "../services/archive.service.js";

export function renderArchiveScreen(state) {

  const archivePage = document.querySelector('[data-page="archive"]');
  if (!archivePage) return;

  /* =========================
     DETAIL MODE (WEEK → DAYS)
  ========================== */

  if (state.ui.expandedWeekId) {

    const period = state.archive.find(
      p => p.id === state.ui.expandedWeekId
    );

    if (!period) {
      state.ui.expandedWeekId = null;
      return renderArchiveScreen(state);
    }

    archivePage.innerHTML = renderArchiveDetail(period, state);
    return;
  }

  /* =========================
     DEFAULT MODE (WEEKS LIST)
  ========================== */

  const selectedYear  = Number(state.ui.archiveYear);
  const selectedMonth = state.ui.archiveMonthFilter;

  const weeks = ArchiveService.getArchivedWeeks(
    selectedYear,
    selectedMonth
  );

  const content = weeks.length
    ? renderWeeksTableFromPeriods(weeks)
    : '<div class="empty-state">No data</div>';

  archivePage.innerHTML = `
    <div class="screen">

      <div class="archive-filters">

        <div class="archive-select-group">
          <label>Year</label>
          <select data-action="set-archive-year">
            ${getAvailableYears().map(year => `
              <option value="${year}" ${year === state.ui.archiveYear ? "selected" : ""}>
                ${year}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="archive-select-group">
          <label>Month</label>
          <select data-action="set-archive-month-filter">
            <option value="">All</option>
            ${getMonthOptions().map((name, index) => `
              <option value="${index}" ${state.ui.archiveMonthFilter === index ? "selected" : ""}>
                ${name}
              </option>
            `).join("")}
          </select>
        </div>

      </div>

      ${content}
${renderCustomRangeSection(state)}
    </div>
  `;
}
/* ======================================
   RENDER Custom Range Section
====================================== */
function renderCustomRangeSection(state) {

  const from = state.ui.archiveRange?.from || "";
  const to   = state.ui.archiveRange?.to || "";

  return `
    <div class="archive-summary">

      <div class="archive-summary-top">
        <h3>Custom Range</h3>
      </div>

      <div class="archive-filters">

        <div class="archive-select-group">
          <label>From</label>
          <input type="date"
                 data-action="set-range-from"
                 value="${from}">
        </div>

        <div class="archive-select-group">
          <label>To</label>
          <input type="date"
                 data-action="set-range-to"
                 value="${to}">
        </div>

      </div>

     <div style="display:flex; gap:10px; margin-top:12px;">

  <button class="archive-action-btn"
          data-action="filter-custom-range">
    Filter
  </button>

  <button class="archive-btn"
          data-action="reset-custom-range">
    Reset
  </button>

  <button class="export-btn archive-export-btn"
          data-action="export-custom-range">
    Export TXT
  </button>

</div>

    </div>
  `;
}

/* ======================================
   RENDER MONTHS TABLE
====================================== */
function renderMonthsTable(months, year) {

  if (!months.length) {
    return '<div class="empty-state">No data</div>';
  }

  return `
    <div class="archive-table-wrapper">
      <div class="archive-table">

        <div class="archive-row archive-header">
          <div>Month</div>
          <div class="text-right">Distance</div>
          <div class="text-right">Loads</div>
          <div class="text-right">Meals</div>
          <div class="text-right">Waiting</div>
          <div class="text-right">Total</div>
        </div>

        ${months.map(m => {
          const name = new Date(year, m.month)
            .toLocaleString("en-US", { month: "long" });

          return `
            <div class="archive-row"
                 data-action="archive-open-month"
                 data-month="${m.month}">

              <div>${name}</div>
              <div class="text-right">${Number(m.distance ?? 0).toFixed(0)}</div>
              <div class="text-right">${m.loads}</div>
              <div class="text-right">${m.meals}</div>
              <div class="text-right">${Number(m.waiting ?? 0).toFixed(1)}</div>
              <div class="text-right">
                ${Number(m.total ?? 0).toFixed(2)}
              </div>

            </div>
          `;
        }).join("")}

      </div>
    </div>
  `;
}

/* ======================================
   RENDER WEEKS TABLE
====================================== */

function renderWeeksTable(weeks) {

  if (!weeks.length) {
    return '<div class="empty-state">No data</div>';
  }

  return `
    <div class="archive-table-wrapper">
      <div class="archive-table">

      <div class="archive-row archive-header">
        <div>Week Period</div>
        <div class="text-right">Distance</div>
        <div class="text-right">Loads</div>
        <div class="text-right">Meals</div>
        <div class="text-right">Waiting</div>
        <div class="text-right">Total</div>
      </div>
        ${weeks.map(w => `
  <div class="archive-row"
       data-action="archive-open-week"
       data-id="${w.id}">

    <div>${escapeHtml(w.label)}</div>
    <div class="text-right">${Number(w.distance ?? 0).toFixed(0)}</div>
    <div class="text-right">${w.loads}</div>
    <div class="text-right">${w.meals}</div>
    <div class="text-right">${Number(w.waiting ?? 0).toFixed(1)}</div>
    <div class="text-right">
      ${Number(w.total ?? 0).toFixed(2)}
    </div>

  </div>
`).join("")}
      
      </div>
    </div>
  `;
}

/* ======================================
   RENDER WEEKS TABLE FROM PERIODS
====================================== */

function renderWeeksTableFromPeriods(periods) {

  return `
    <div class="archive-table-wrapper">
      <div class="archive-table">

        <div class="archive-row archive-header">
          <div>Week Period</div>
          <div class="text-right">Distance</div>
          <div class="text-right">Loads</div>
          <div class="text-right">Meals</div>
          <div class="text-right">Waiting</div>
          <div class="text-right">Total</div>
          <div>Note</div>
        </div>

       ${periods.map(p => `
  <div class="archive-row"
       data-action="archive-open-week"
       data-id="${p.id}">

    <div>${escapeHtml(p.periodLabel)}</div>

    <div class="text-right">
      ${Number(p.totals.kilometers ?? 0).toFixed(0)}
    </div>

    <div class="text-right">
      ${p.totals.loads ?? 0}
    </div>

    <div class="text-right">
      ${p.totals.meals ?? 0}
    </div>

    <div class="text-right">
      ${Number(p.totals.waitingHours ?? 0).toFixed(1)}
    </div>

    <div class="text-right">
      ${Number(p.totals.amount ?? 0).toFixed(2)}
    </div>

    <div class="archive-notes-cell">
      ${p.notes ? escapeHtml(p.notes) : ""}
    </div>

  </div>
`).join("")}

      </div>
    </div>
  `;
}

/* ======================================
   RENDER ARCHIVE DETAIL
====================================== */
function renderArchiveDetail(period, state) {

  return `
    <div class="screen">

      <div class="screen-header">
<button class="archive-btn"
        data-action="edit-week-note"
        data-period="${period.id}">
  Week Note
</button>
      
        <button class="archive-btn"
                data-action="archive-back-to-weeks">
          ← Back
        </button>
        <h2>${escapeHtml(period.periodLabel)}</h2>
      </div>

      <div class="archive-table-wrapper">
        <div class="archive-table">

          <div class="archive-row archive-header">
  <div>Date</div>
  <div class="text-right">Km</div>
  <div class="text-right">Loads</div>
  <div class="text-right">Waiting</div>
  <div>Meals</div>
  <div class="text-right">Total</div>
  <div>Notes</div>
  <div></div>
</div>

          ${period.entries.map(entry => {

            const mealsSummary = formatMealsSummary(entry.meals);

            return `
              <div class="archive-row clickable"
                   data-action="edit-archive-entry"
                   data-period="${period.id}"
                   data-id="${entry.id}">

                <div>${escapeHtml(entry.date)}</div>

                <div class="text-right">
                  ${Number(entry.kilometers ?? 0).toFixed(1)}
                </div>

                <div class="text-right">
                  ${entry.loads ?? 0}
                </div>

                <div class="text-right">
                  ${entry.waitingHours ?? 0}
                </div>

                <div class="text-right">
                  ${mealsSummary || "-"}
                </div>

               <div class="text-right">
                  ${Number(entry.amount ?? 0).toFixed(2)}
               </div>

<div class="archive-notes-cell">
  ${entry.notes ? entry.notes : ""}
</div>

                <div>
                  <button class="danger-btn"
                          data-action="delete-archived-entry"
                          data-period="${period.id}"
                          data-entry="${entry.id}">
                    ✕
                  </button>
                </div>

              </div>
            `;
          }).join("")}

        </div>
      </div>

    </div>
  `;
}

/* ======================================
   RENDER ARCHIVE MEALS EDITOR
====================================== */
function renderArchiveMealsEditor(entry) {

  const locations = [
    "AB","BC","MB","NB","NL","NS","NT","NU",
    "ON","PE","QC","SK","YT","US"
  ];

  const types = ["breakfast","lunch","dinner"];

  return types.map(type => {

    const taken = entry.meals?.[type]?.taken;
    const location = entry.meals?.[type]?.location || "";

    return `
      <div class="archive-meal-row">

        <label>
          <input type="checkbox"
                 data-meal-type="${type}"
                 data-entry="${entry.id}"
                 ${taken ? "checked" : ""}>
          ${type.charAt(0).toUpperCase()}
        </label>

        <select data-meal-location="${type}"
                data-entry="${entry.id}">
          <option value="">--</option>
          ${locations.map(loc => `
            <option value="${loc}"
              ${location === loc ? "selected" : ""}>
              ${loc}
            </option>
          `).join("")}
        </select>

      </div>
    `;
  }).join("");
}
/* ======================================
   RENDER ARCHIVE ENTRIES
====================================== */
function renderArchiveEntries(period, state) {

  if (!period.entries?.length) {
    return '<div class="empty-state">No entries</div>';
  }

  return `
    <div class="archive-table-wrapper">
      <div class="archive-table">

        <div class="archive-row archive-header">
          <div>Date</div>
          <div>Distance</div>
          <div>Loads</div>
          <div>Meals</div>
          <div>Waiting</div>
          <div>Total</div>
        </div>

        ${period.entries.map(entry => {

          const distance =
            state.ui.displayUnit === "km"
              ? Number(entry.kilometers ?? 0).toFixed(1)
              : Number(entry.miles ?? 0).toFixed(1);

          const mealsCount =
            entry.meals
              ? ["breakfast","lunch","dinner"]
                  .filter(t => entry.meals[t]?.taken).length
              : 0;

          return `
            <div class="archive-row">

              <div>${escapeHtml(entry.date)}</div>
              <div>${distance}</div>
              <div>${entry.loads ?? 0}</div>
              <div>${mealsCount}</div>
              <div>${entry.waitingHours ?? 0}</div>
              <div>${Number(entry.amount ?? 0).toFixed(2)}</div>

            </div>
          `;

        }).join("")}

      </div>
    </div>
  `;
}
/* ======================================
   RENDER CUSTOMERS
====================================== */

export function renderCustomers(state) {
  const container = document.getElementById("data-content");
  if (!container) return;

  const customers = state.customers;
  const search    = state.ui.customerSearch || "";

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
  const query  = search.trim().toLowerCase();

  const trailers = query
    ? state.trailers.filter(t =>
        [t.unitNumber, t.plate, t.maxLoad, t.psi, t.notes]
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

          ${t.plate   ? `<p>Plate: ${escapeHtml(t.plate)}</p>` : ""}
          ${t.maxLoad ? `<p>Max Load: ${escapeHtml(t.maxLoad)}</p>` : ""}
          ${t.psi     ? `<p>PSI: ${escapeHtml(t.psi)}</p>` : ""}
          ${t.notes   ? `<p class="muted">${escapeHtml(t.notes)}</p>` : ""}
        </div>
      `;
    });

    html += `</div>`;
  }

  html += `</div>`;

  container.innerHTML = html;
}
/* ======================================
   RENDER SETTINGS SCREEN
====================================== */

export function renderSettingsScreen(state) {

  const container = document.querySelector('[data-page="settings"]');
  if (!container) return;

  container.innerHTML = `
    <div class="screen">

      <div class="screen-header">
        <h2>Settings</h2>
      </div>

      <!-- DRIVER -->
      <div class="card">
        <h3>Driver</h3>

        <div class="form-group">
          <label>Driver Name</label>
          <input
            type="text"
            id="settings-driver-name"
            value="${state.settings.driverName || ""}"
          />
        </div>
      </div>

      <!-- RATES -->
      <div class="card">
        <h3>Rates</h3>

        <div class="form-group">
          <label>Rate per Mile</label>
          <input
            type="number"
            step="0.01"
            id="settings-rate-mile"
            value="${state.settings.ratePerMile}"
          />
        </div>

        <div class="form-group">
          <label>Rate per Drop</label>
          <input
            type="number"
            step="0.01"
            id="settings-rate-drop"
            value="${state.settings.ratePerDrop}"
          />
        </div>

        <div class="form-group">
          <label>Rate per Waiting Hour</label>
          <input
            type="number"
            step="0.01"
            id="settings-rate-waiting"
            value="${state.settings.ratePerWaitingHour}"
          />
        </div>

        <div class="form-group">
          <label>Input Unit</label>
          <select id="settings-input-unit">
            <option value="km" ${state.ui.inputUnit === "km" ? "selected" : ""}>Kilometers (KM)</option>
            <option value="mi" ${state.ui.inputUnit === "mi" ? "selected" : ""}>Miles (MI)</option>
          </select>
        </div>

        <p class="muted" style="font-size:13px;">
          Changes affect only new entries.
        </p>

       <button class="primary-btn"
        data-action="save-settings"
        ${state.ui.settingsDirty ? "" : "disabled"}>
  Save Settings
</button>

      </div>

      <!-- BACKUP -->
      <div class="card">
        <h3>Backup & Restore</h3>

        <button class="archive-btn"
                data-action="export-backup">
          Export Backup
        </button>

        <div class="form-group" style="margin-top:12px;">
          <input type="file"
                 id="settings-restore-file"
                 accept="application/json" />
        </div>
      </div>

      <!-- DANGER -->
      <div class="card">
        <h3 style="color:var(--danger);">Danger Zone</h3>

        <button class="danger-btn"
                data-action="reset-all">
          Reset All Data
        </button>
      </div>

    </div>
  `;
}
