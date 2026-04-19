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

        '<p class="entry-amount">' +
  Number(entry.amount ?? 0).toFixed(2) +
  ' ' + state.settings.currency +
        '</p>'+

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

export function renderArchiveScreen(state) {
  let { archiveTab, archiveYear, archiveMonthFilter } = state.ui;

  // ✅ AUTO-SET DEFAULT YEAR
  if (!archiveYear) {
    const years = ArchiveAggregationService.getYearsSummary();

    if (years.length) {
      archiveYear = years[0].year;
      state.ui.archiveYear = archiveYear;
    }
  }
  
  const archivePage = document.querySelector('[data-page="archive"]');
  if (!archivePage) return;
  let content = "";


  /* =========================
     LEVEL: MONTHS
  ========================== */

 if (state.ui.archiveTab === "months") {

  const months = ArchiveAggregationService.getMonthsSummary(
    Number(state.ui.archiveYear)
  );

  content = months.length
    ? renderMonthsTable(months, state.ui.archiveYear)
    : '<div class="empty-state">No data</div>';
}

  /* =========================
     LEVEL: WEEKS
  ========================== */

  if (state.ui.archiveTab === "weeks") {

  

  const selectedYear = Number(state.ui.archiveYear);

  

  let weeks = [];

  const months = ArchiveAggregationService.getMonthsSummary(selectedYear);

  

  if (state.ui.archiveMonthFilter == null) {

    months.forEach(m => {

      const monthWeeks = ArchiveAggregationService.getWeeksSummary(
        selectedYear,
        Number(m.month)
      );

      

      weeks = weeks.concat(monthWeeks);
    });

  } else {

    weeks = ArchiveAggregationService.getWeeksSummary(
      selectedYear,
      Number(state.ui.archiveMonthFilter)
    );

    
  }

  

  content = weeks.length
    ? renderWeeksTable(weeks)
    : '<div class="empty-state">No data</div>';
}

  /* =========================
     LEVEL: ENTRIES
  ========================== */

//if (archiveTab === "entries") {
  //  const period = state.archive.find(p => p.id === archiveWeekId);
  //  if (period) {
   //   content = renderArchiveEntries(period, state);
 //   }
// }

  /* =========================
     FINAL LAYOUT
  ========================== */

  archivePage.innerHTML = `
  <div class="screen">

    <!-- YEAR SELECTOR -->
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

    <!-- TABS -->
    <div class="segmented archive-segmented">
      <button
        data-action="set-archive-tab"
        data-tab="weeks"
        class="${state.ui.archiveTab === "weeks" ? "active" : ""}">
        Weeks
      </button>

      <button
        data-action="set-archive-tab"
        data-tab="months"
        class="${state.ui.archiveTab === "months" ? "active" : ""}">
        Months
      </button>
    </div>

    ${content}

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
