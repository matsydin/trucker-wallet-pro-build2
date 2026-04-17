// js/ui/renderer.js
// FINAL CLEAN VERSION

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



export function renderArchiveScreen(state) {
  const archivePage = document.querySelector('[data-page="archive"]');
  if (!archivePage) return;

  const archive = state.archive || [];
  const detailId = state.ui.archiveDetailId;

  export function renderCustomers(state) {
  const container = document.getElementById("app");
  if (!container) return;

  const customers = state.customers;

  let html = `
    <div class="screen">
      <div class="screen-header">
        <h2>Customers</h2>
        <button class="primary-btn" data-action="open-add-customer">
          + Add
        </button>
      </div>
  `;

  if (customers.length === 0) {
    html += `
      <div class="empty-state">
        No customers yet
      </div>
    `;
  } else {
    html += `<div class="card-list">`;

    customers.forEach(c => {
      html += `
        <div class="card">
          <div class="card-header">
            <h3>${c.name}</h3>
            <button data-action="delete-customer" data-id="${c.id}">
              Delete
            </button>
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
