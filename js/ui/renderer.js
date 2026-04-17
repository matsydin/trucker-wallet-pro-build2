// js/ui/renderer.js
// FINAL CLEAN VERSION

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
        '<div>' + (entry.date || "") + '</div>' +
        '<div>' + distance + " " + state.ui.displayUnit + '</div>' +
        '<div>$' + Number(entry.amount ?? 0).toFixed(2) + '</div>' +
        '<button data-delete="' + entry.id + '" type="button">Delete</button>' +
      '</div>'
    );
  }).join("");
}

/* ======================================
   RENDER ARCHIVE SCREEN
====================================== */

export function renderArchiveScreen(state) {
  const archivePage = document.querySelector('[data-page="archive"]');
  if (!archivePage) return;

  const archive = state.archive || [];
  const detailId = state.ui.archiveDetailId;

  // ===============================
  // DETAIL VIEW
  // ===============================

  if (detailId) {
    const period = archive.find(p => p.id === detailId);
    if (!period) return;

    const totals = period.totals || {};

    const distance =
      state.ui.displayUnit === "km"
        ? Number(totals.kilometers ?? 0).toFixed(1)
        : Number(totals.miles ?? 0).toFixed(1);

    archivePage.innerHTML =
      '<div class="card">' +
        '<button data-action="close-archive" type="button">← Back</button>' +
        '<h3>' + period.periodLabel + '</h3>' +
        '<p>Gross: $' + Number(totals.amount ?? 0).toFixed(2) + '</p>' +
        '<p>' + distance + " " + state.ui.displayUnit + '</p>' +
        '<p>Loads: ' + (period.entries || []).length + '</p>' +
      '</div>' +

      (period.entries || []).map(entry => {
        const entryDistance =
          state.ui.displayUnit === "km"
            ? Number(entry.kilometers ?? 0).toFixed(1)
            : Number(entry.miles ?? 0).toFixed(1);

        return (
          '<div class="card">' +
            '<div>' + (entry.date || "") + '</div>' +
            '<div>' + entryDistance + " " + state.ui.displayUnit + '</div>' +
            '<div>$' + Number(entry.amount ?? 0).toFixed(2) + '</div>' +
          '</div>'
        );
      }).join("") +

      '<div class="card">' +
        '<button data-action="delete-archive" data-id="' + period.id + '" type="button">' +
          'Delete Period' +
        '</button>' +
      '</div>';

    return;
  }

  // ===============================
  // LIST VIEW
  // ===============================

  if (!archive.length) {
    archivePage.innerHTML =
      '<div class="card">No archived weeks yet.</div>';
    return;
  }

  archivePage.innerHTML = archive.map(period => {
    const totals = period.totals || {};

    const distance =
      state.ui.displayUnit === "km"
        ? Number(totals.kilometers ?? 0).toFixed(1)
        : Number(totals.miles ?? 0).toFixed(1);

    return (
      '<div class="card">' +
        '<h3>' + period.periodLabel + '</h3>' +
        '<p>Gross: $' + Number(totals.amount ?? 0).toFixed(2) + '</p>' +
        '<p>' + distance + " " + state.ui.displayUnit + '</p>' +
        '<p>Loads: ' + (period.entries || []).length + '</p>' +
        '<button data-action="open-archive" data-id="' + period.id + '" type="button">View</button>' +
        '<button data-action="delete-archive" data-id="' + period.id + '" type="button">Delete</button>' +
      '</div>'
    );
  }).join("");
}

/* ======================================
   RENDER CUSTOMERS SCREEN
====================================== */

export function renderCustomers(state) {
  const container = document.querySelector('[data-page="data"]');
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
          value="${search}"
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
            <h3>${c.name}</h3>
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

          ${c.address ? `<p>${c.address}</p>` : ""}

          ${
            c.is24h
              ? `<p>Open 24 Hours</p>`
              : c.openTime && c.closeTime
              ? `<p>${c.openTime} - ${c.closeTime}</p>`
              : ""
          }

          ${c.notes ? `<p class="muted">${c.notes}</p>` : ""}
        </div>
      `;
    });

    html += `</div>`;
  }

  html += `</div>`;

  container.innerHTML = html;
}
