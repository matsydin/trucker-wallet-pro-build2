// js/app.js

import {
  renderLogScreen,
  renderArchiveScreen,
  renderDataScreen
} from "./ui/renderer.js";

import { state, saveState } from "./state.js";
import { LogbookService } from "./services/logbook.service.js";
import { ArchiveService } from "./services/archive.service.js";
import { CustomerService } from "./services/customer.service.js";
import { TrailerService } from "./services/trailer.service.js";

let editingCustomerId = null;
let editingTrailerId = null;
let editingEntryId = null;
let editingArchivePeriodId = null;
let editingArchiveEntryId = null;

/* ===============================
   RENDER APP STATE
================================ */

function render() {
  document.body.setAttribute("data-theme", state.ui.theme);

  const pageTitle = document.querySelector(".page-title");
  if (pageTitle) {
    const titles = {
      log: "Logbook",
      archive: "Archive",
      data: "Data",
      settings: "Settings"
    };
    pageTitle.textContent = titles[state.ui.activeTab] || "Trucker Wallet Pro";
  }

  document.querySelectorAll(".page").forEach(page => {
    page.hidden = page.dataset.page !== state.ui.activeTab;
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.tab === state.ui.activeTab
    );
  });

  document.querySelectorAll("[data-unit]").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.unit === state.ui.displayUnit
    );
  });

  const fab = document.querySelector(".fab");
  if (fab) {
    fab.style.display =
      state.ui.activeTab === "log" ? "flex" : "none";
  }

    const unitToggle = document.getElementById("unit-toggle");
if (unitToggle) {
  unitToggle.style.display =
    state.ui.activeTab === "log" ? "flex" : "none";
}

const exportBtn = document.getElementById("export-btn");
if (exportBtn) {
  exportBtn.style.display =
    state.ui.activeTab === "archive" && state.ui.archiveDetailId
      ? "block"
      : "none";
}

  if (state.ui.activeTab === "log") {
    renderLogScreen(state);
    return;
  }

  if (state.ui.activeTab === "archive") {
    renderArchiveScreen(state);
    return;
  }

  if (state.ui.activeTab === "data") {
    renderDataScreen(state);
    return;
  }
}

/* ===============================
   TAB / UNIT / THEME
================================ */

function setTab(tab) {
  if (state.ui.activeTab === tab) return;
  state.ui.activeTab = tab;
  saveState();
  render();
}

function setUnit(unit) {
  if (state.ui.displayUnit === unit) return;
  state.ui.displayUnit = unit;
  saveState();
  render();
}

function toggleTheme() {
  state.ui.theme =
    state.ui.theme === "dark" ? "light" : "dark";
  saveState();
  render();
}

function toggleCustomerHoursVisibility() {
  const checkbox = document.getElementById("customer-24h");
  const hours = document.getElementById("customer-hours");

  if (!checkbox || !hours) return;

  hours.style.display = checkbox.checked ? "none" : "block";
}

function normalizeTrailerPlateLive() {
  const plate = document.getElementById("trailer-plate");
  if (!plate) return;

  plate.value = plate.value.toUpperCase();
}

/* ===============================
   GLOBAL CLICK HANDLER
================================ */

function handleClick(e) {

  const target = e.target;
  if (!target) return;

  /* ===== TABS ===== */

  const tab = target.closest(".tab");
  if (tab) {
    setTab(tab.dataset.tab);
    return;
  }

  const unitBtn = target.closest("[data-unit]");
  if (unitBtn) {
    setUnit(unitBtn.dataset.unit);
    return;
  }

  const brand = target.closest(".brand");
  if (brand && !e.shiftKey) {
    toggleTheme();
    return;
  }

  /* ===== LOG ===== */

  if (target.closest(".fab") && state.ui.activeTab === "log") {
    editingEntryId = null;
    openEntryModal();
    return;
  }

  if (target.closest("#save-entry")) {
    saveEntryFromModal();
    return;
  }

  if (target.closest(".modal:not(#customer-modal):not(#trailer-modal):not(#archive-entry-modal) .modal-close")) {
    closeEntryModal();
    return;
  }

  if (target.classList.contains("modal-backdrop")) {
    const entryModal = target.closest('.modal:not(#customer-modal):not(#trailer-modal):not(#archive-entry-modal)');
    if (entryModal) {
      closeEntryModal();
      return;
    }
  }

  if (target.closest("#finish-week-btn")) {
    ArchiveService.archiveCurrent();
    render();
    return;
  }

  const deleteBtn = target.closest("[data-delete]");
  if (deleteBtn) {
    LogbookService.deleteEntry(deleteBtn.dataset.delete);
    render();
    return;
  }

  const actionBtn = target.matches("[data-action]")
    ? target
    : target.closest("[data-action]");

  if (!actionBtn) return;

  const action = actionBtn.dataset.action;
  const id = actionBtn.dataset.id;
  const periodId = actionBtn.dataset.periodId;

  /* ===== DATA TAB ===== */

  if (action === "set-data-tab") {
    state.ui.dataTab = actionBtn.dataset.tab;
    saveState();
    render();
    return;
  }
/* ===== ARCHIVE TAB SWITCH ===== */

if (action === "set-archive-tab") {

  state.ui.archiveTab = actionBtn.dataset.tab;

  state.ui.archiveYear = null;
  state.ui.archiveMonth = null;
  state.ui.archiveWeekId = null;

  saveState();
  render();
  return;
}
  /* ===== LOG ENTRY EDIT ===== */

  if (action === "edit-log-entry") {
    editingEntryId = id;
    openEntryModal(id);
    return;
  }

  /* ===================================================
     ARCHIVE — CORE ACTIONS
  =================================================== */

  if (action === "delete-archive") {
    if (confirm("Delete this archived period?")) {
      ArchiveService.deleteArchive(id);
      render();
    }
    return;
  }

  if (action === "export-archive") {
    handleArchiveExport();
    return;
  }

  if (action === "edit-archive-entry") {
    editingArchivePeriodId = periodId;
    editingArchiveEntryId = id;
    openArchiveEntryModal(periodId, id);
    return;
  }

  if (action === "delete-archive-entry") {
    if (confirm("Delete this archived entry?")) {
      ArchiveService.deleteArchivedEntry(periodId, id);
      closeArchiveEntryModal();
      render();
    }
    return;
  }

  if (action === "close-archive-entry-modal") {
    closeArchiveEntryModal();
    return;
  }

  if (action === "save-archive-entry") {
    saveArchiveEntryFromModal();
    return;
  }

  /* ===================================================
     ARCHIVE — NEW HIERARCHY NAVIGATION
  =================================================== */

  if (action === "archive-open-year") {
    state.ui.archiveYear = Number(actionBtn.dataset.year);
    state.ui.archiveTab = "months";
    saveState();
    render();
    return;
  }

  if (action === "archive-open-month") {
    state.ui.archiveMonth = Number(actionBtn.dataset.month);
    state.ui.archiveTab = "weeks";
    saveState();
    render();
    return;
  }

  //if (action === "archive-open-week") {
   // state.ui.archiveWeekId = id;
   // state.ui.archiveTab = "entries";
   // saveState();
  //  render();
  //  return;
//  }

  if (action === "archive-back") {

    if (state.ui.archiveTab === "entries") {
      state.ui.archiveTab = "weeks";
      state.ui.archiveWeekId = null;
    }
    else if (state.ui.archiveTab === "weeks") {
      state.ui.archiveTab = "months";
      state.ui.archiveMonth = null;
    }
    else if (state.ui.archiveTab === "months") {
      state.ui.archiveTab = "years";
      state.ui.archiveYear = null;
    }

    saveState();
    render();
    return;
  }  
  /* ===================================================
     CUSTOMERS
  =================================================== */

  if (action === "open-add-customer") {
    editingCustomerId = null;
    openCustomerModal();
    return;
  }

  if (action === "edit-customer") {
    editingCustomerId = id;
    openCustomerModal(id);
    return;
  }

  if (action === "delete-customer") {
    if (confirm("Delete this customer?")) {
      CustomerService.delete(id);
      render();
    }
    return;
  }

  if (action === "close-customer-modal") {
    closeCustomerModal();
    return;
  }

  if (action === "save-customer") {
    const name = document.getElementById("customer-name").value.trim();
    if (!name) return;

    const data = {
      name,
      address: document.getElementById("customer-address").value,
      is24h: document.getElementById("customer-24h").checked,
      openTime: document.getElementById("customer-open").value,
      closeTime: document.getElementById("customer-close").value,
      notes: document.getElementById("customer-notes").value
    };

    if (editingCustomerId) {
      CustomerService.edit(editingCustomerId, data);
    } else {
      CustomerService.add(data);
    }

    closeCustomerModal();
    render();
    return;
  }

  /* ===================================================
     TRAILERS
  =================================================== */

  if (action === "open-add-trailer") {
    editingTrailerId = null;
    openTrailerModal();
    return;
  }

  if (action === "edit-trailer") {
    editingTrailerId = id;
    openTrailerModal(id);
    return;
  }

  if (action === "delete-trailer") {
    if (confirm("Delete this trailer?")) {
      TrailerService.delete(id);
      render();
    }
    return;
  }

  if (action === "close-trailer-modal") {
    closeTrailerModal();
    return;
  }

  if (action === "save-trailer") {
    const unitNumber = document.getElementById("trailer-unit-number").value.trim();
    const plate = document.getElementById("trailer-plate").value.trim();
    const maxLoad = document.getElementById("trailer-max-load").value.trim();
    const psi = document.getElementById("trailer-psi").value.trim();
    const notes = document.getElementById("trailer-notes").value.trim();
    const errorEl = document.getElementById("trailer-modal-error");

    const resultData = {
      unitNumber,
      plate,
      maxLoad,
      psi,
      notes
    };

    const result = editingTrailerId
      ? TrailerService.edit(editingTrailerId, resultData)
      : TrailerService.add(resultData);

    if (!result.ok) {
      if (errorEl) {
        errorEl.textContent = result.errors.general || "Invalid data.";
      }
      return;
    }

    if (errorEl) {
      errorEl.textContent = "";
    }

    closeTrailerModal();
    render();
    return;
  }
}

/* ===============================
   CUSTOMER MODAL
================================ */

function openCustomerModal(id = null) {
  const modal = document.getElementById("customer-modal");
  if (!modal) return;

  const name = document.getElementById("customer-name");
  const address = document.getElementById("customer-address");
  const is24h = document.getElementById("customer-24h");
  const open = document.getElementById("customer-open");
  const close = document.getElementById("customer-close");
  const notes = document.getElementById("customer-notes");
  const title = document.getElementById("customer-modal-title");

  if (!name || !address || !is24h || !open || !close || !notes || !title) {
    console.error("Customer modal elements not found in DOM");
    return;
  }

  if (id) {
    const c = state.customers.find(c => c.id === id);
    if (!c) return;

    title.textContent = "Edit Customer";
    name.value = c.name || "";
    address.value = c.address || "";
    is24h.checked = c.is24h || false;
    open.value = c.openTime || "";
    close.value = c.closeTime || "";
    notes.value = c.notes || "";
  } else {
    title.textContent = "Add Customer";
    name.value = "";
    address.value = "";
    is24h.checked = false;
    open.value = "";
    close.value = "";
    notes.value = "";
  }

  toggleCustomerHoursVisibility();
  modal.hidden = false;
}

function closeCustomerModal() {
  const modal = document.getElementById("customer-modal");
  if (!modal) return;

  modal.hidden = true;
}

/* ===============================
   TRAILER MODAL
================================ */

function openTrailerModal(id = null) {
  const modal = document.getElementById("trailer-modal");
  if (!modal) return;

  const title = document.getElementById("trailer-modal-title");
  const unitNumber = document.getElementById("trailer-unit-number");
  const plate = document.getElementById("trailer-plate");
  const maxLoad = document.getElementById("trailer-max-load");
  const psi = document.getElementById("trailer-psi");
  const notes = document.getElementById("trailer-notes");
  const errorEl = document.getElementById("trailer-modal-error");

  if (!title || !unitNumber || !plate || !maxLoad || !psi || !notes || !errorEl) {
    console.error("Trailer modal elements not found in DOM");
    return;
  }

  errorEl.textContent = "";

  if (id) {
    const t = state.trailers.find(t => t.id === id);
    if (!t) return;

    title.textContent = "Edit Trailer";
    unitNumber.value = t.unitNumber || "";
    plate.value = t.plate || "";
    maxLoad.value = t.maxLoad || "";
    psi.value = t.psi || "";
    notes.value = t.notes || "";
  } else {
    title.textContent = "Add Trailer";
    unitNumber.value = "";
    plate.value = "";
    maxLoad.value = "";
    psi.value = "";
    notes.value = "";
  }

  modal.hidden = false;
}

function closeTrailerModal() {
  const modal = document.getElementById("trailer-modal");
  if (!modal) return;

  modal.hidden = true;
}

/* ===============================
   ENTRY MODAL (ADD / EDIT LOG)
================================ */

function openEntryModal(id = null) {
  const modal = document.querySelector(
    ".modal:not(#customer-modal):not(#trailer-modal):not(#archive-entry-modal)"
  );
  if (!modal) return;

  const title = document.getElementById("entry-modal-title");
  const dateInput = document.getElementById("entry-date");
  const distanceInput = document.getElementById("entry-distance");
  const pickupsInput = document.getElementById("entry-pickups");
  const waitingInput = document.getElementById("entry-waiting");

  if (!dateInput || !distanceInput || !pickupsInput || !waitingInput) return;

  const mealTypes = ["breakfast", "lunch", "dinner"];

  if (id) {
    const entry = state.current.entries.find(e => e.id === id);
    if (!entry) return;

    if (title) title.textContent = "Edit Entry";

    dateInput.value = entry.date || "";
    distanceInput.value = entry.kilometers ?? "";
    pickupsInput.value = entry.loads ?? 0;
    waitingInput.value = entry.waitingHours ?? 0;

    const meals = entry.meals || {};

    mealTypes.forEach(type => {
      mealTypes.forEach(type => {
  const card = document.querySelector(`.meal-card[data-meal="${type}"]`);
  const checkbox = card?.querySelector(".meal-checkbox");
  const select = card?.querySelector(".meal-select");

  const taken = meals[type]?.taken;
  const location = meals[type]?.location || "";

  if (checkbox) checkbox.checked = !!taken;
  if (card) card.classList.toggle("active", !!taken);
  if (select) select.value = location;
});
      
      mealTypes.forEach(type => {
  const card = document.querySelector(`.meal-card[data-meal="${type}"]`);
  const checkbox = card?.querySelector(".meal-checkbox");
  const select = card?.querySelector(".meal-select");

  if (checkbox) checkbox.checked = false;
  if (card) card.classList.remove("active");
  if (select) select.value = "";
});

      const taken = meals[type]?.taken;
      const location = meals[type]?.location || "";

      if (pill) {
        if (taken) {
          pill.classList.add("active");
        } else {
          pill.classList.remove("active");
        }
      }

      if (select) {
        select.value = location;
      }
    });

  } else {
    if (title) title.textContent = "New Entry";

    const today = new Date().toISOString().split("T")[0];
    dateInput.value = today;
    distanceInput.value = "";
    pickupsInput.value = "";
    waitingInput.value = "";

    mealTypes.forEach(type => {
      const pill = document.querySelector(`.meal-pill[data-meal="${type}"]`);
      const select = document.getElementById(`meal-${type}-location`);

      if (pill) pill.classList.remove("active");
      if (select) select.value = "";
    });
  }

  modal.hidden = false;
}

function closeEntryModal() {
  const modal = document.querySelector(".modal:not(#customer-modal):not(#trailer-modal):not(#archive-entry-modal)");
  if (!modal) return;

  modal.hidden = true;
}

function saveEntryFromModal() {
  const distanceInput = document.getElementById("entry-distance");
  const dateInput = document.getElementById("entry-date");
  const pickupsInput = document.getElementById("entry-pickups");
  const waitingInput = document.getElementById("entry-waiting");

  const kilometers = parseFloat(distanceInput.value);
  const date = dateInput.value;
  const loads = parseInt(pickupsInput.value || "0", 10);
  const waitingHours = parseFloat(waitingInput.value || "0");

  if (!date) {
    alert("Date required");
    return;
  }

  if (!kilometers || kilometers <= 0) {
    alert("Distance must be greater than 0");
    return;
  }

  /* ===== MEALS ===== */

  const mealTypes = ["breakfast", "lunch", "dinner"];
const meals = {};

for (let type of mealTypes) {
  const card = document.querySelector(`.meal-card[data-meal="${type}"]`);
  const checkbox = card?.querySelector(".meal-checkbox");
  const select = card?.querySelector(".meal-select");

  const taken = checkbox?.checked;
  const location = select?.value;

  if (taken && !location) {
    alert(`${type} location required`);
    return;
  }

  meals[type] = {
    taken: !!taken,
    location: taken ? location : ""
  };
}

  const payload = {
    kilometers,
    date,
    loads,
    waitingHours: Number.isNaN(waitingHours) ? 0 : waitingHours,
    meals
  };

  if (editingEntryId) {
    LogbookService.editEntry(editingEntryId, payload);
  } else {
    LogbookService.addEntry(payload);
  }

  editingEntryId = null;

  closeEntryModal();
  render();
}

/* ===============================
   ARCHIVE ENTRY MODAL
================================ */

function openArchiveEntryModal(periodId, entryId) {
  const modal = document.getElementById("archive-entry-modal");
  if (!modal) return;

  const period = ArchiveService.getById(periodId);
  if (!period) return;

  const entry = period.entries.find(e => e.id === entryId);
  if (!entry) return;

  document.getElementById("archive-entry-date").value = entry.date || "";
  document.getElementById("archive-entry-distance").value = entry.kilometers ?? "";
  document.getElementById("archive-entry-pickups").value = entry.loads ?? 0;
  document.getElementById("archive-entry-waiting").value = entry.waitingHours ?? 0;
  document.getElementById("archive-entry-rate-mile").value = entry.rateSnapshot?.perMile ?? 0;
  document.getElementById("archive-entry-rate-drop").value = entry.rateSnapshot?.perDrop ?? 0;
  document.getElementById("archive-entry-rate-waiting").value = entry.rateSnapshot?.perWaiting ?? 0;
  document.getElementById("archive-entry-modal-error").textContent = "";

  modal.hidden = false;
}

function closeArchiveEntryModal() {
  const modal = document.getElementById("archive-entry-modal");
  if (!modal) return;

  modal.hidden = true;
  editingArchivePeriodId = null;
  editingArchiveEntryId = null;
}

function saveArchiveEntryFromModal() {
  const errorEl = document.getElementById("archive-entry-modal-error");

  const payload = {
    date: document.getElementById("archive-entry-date").value,
    kilometers: document.getElementById("archive-entry-distance").value,
    loads: document.getElementById("archive-entry-pickups").value,
    waitingHours: document.getElementById("archive-entry-waiting").value,
    perMile: document.getElementById("archive-entry-rate-mile").value,
    perDrop: document.getElementById("archive-entry-rate-drop").value,
    perWaiting: document.getElementById("archive-entry-rate-waiting").value
  };

  const result = ArchiveService.editArchivedEntry(
    editingArchivePeriodId,
    editingArchiveEntryId,
    payload
  );

  if (!result.ok) {
    if (errorEl) {
      errorEl.textContent = result.error || "Invalid archive entry data.";
    }
    return;
  }

  if (errorEl) {
    errorEl.textContent = "";
  }

  closeArchiveEntryModal();
  render();
}

/* ===============================
   SEARCH / INPUT LISTENER
================================ */

document.addEventListener("change", function(e) {
/* ===== ARCHIVE YEAR SELECT ===== */

if (e.target.dataset.action === "set-archive-year") {
  state.ui.archiveYear = Number(e.target.value);
  saveState();
  render();
  return;
}

/* ===== ARCHIVE MONTH FILTER ===== */

if (e.target.dataset.action === "set-archive-month-filter") {
  state.ui.archiveMonthFilter =
    e.target.value === "" ? null : Number(e.target.value);
  saveState();
  render();
  return;
}
  
  if (e.target.dataset.action === "customer-search") {
    CustomerService.setSearch(e.target.value);
    render();
    return;
  }

  if (e.target.dataset.action === "trailer-search") {
    TrailerService.setSearch(e.target.value);
    render();
    return;
  }

  if (e.target.id === "customer-24h") {
    toggleCustomerHoursVisibility();
    return;
  }

  if (e.target.id === "trailer-plate") {
    normalizeTrailerPlateLive();
    return;
  }
});
/* ===============================
   Archive Export
================================ */
function handleArchiveExport() {
  const periodId = state.ui.archiveDetailId;

  let data;
  let filename;

  if (periodId) {
    data = ArchiveService.getById(periodId);
    filename = "archive-" + (data?.periodLabel || periodId) + ".json";
  } else {
    data = state.archive;
    filename = "archive-all.json";
  }

  if (!data) return;

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/* ===============================
   INIT
================================ */
function initMealsAccordion() {
  const cards = document.querySelectorAll(".meal-card");

  cards.forEach(card => {
    const checkbox = card.querySelector(".meal-checkbox");
    if (!checkbox) return;

    checkbox.addEventListener("change", () => {
      card.classList.toggle("active", checkbox.checked);

      if (!checkbox.checked) {
        const select = card.querySelector(".meal-select");
        if (select) select.value = "";
      }
    });
  });
}

function init() {
  LogbookService.calculateTotals();
  document.addEventListener("click", handleClick);
  initMealsAccordion();
  render();
}

window.appState = state;
window.appRender = render;
document.addEventListener("DOMContentLoaded", init);

