// js/app.js

import {
  renderLogScreen,
  renderArchiveScreen,
  renderCustomers,
  renderDataScreen
} from "./ui/renderer.js";

import { state, saveState } from "./state.js";
import { LogbookService } from "./services/logbook.service.js";
import { ArchiveService } from "./services/archive.service.js";
import { CustomerService } from "./services/customer.service.js";
import { TrailerService } from "./services/trailer.service.js";

let editingCustomerId = null;
let editingTrailerId = null;

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

  const segmented = document.querySelector(".segmented");
  if (segmented) {
    segmented.style.display =
      state.ui.activeTab === "log" ? "flex" : "none";
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

  if (target.closest(".fab") && state.ui.activeTab === "log") {
    openModal();
    return;
  }

  if (target.closest("#save-entry")) {
    saveEntryFromModal();
    return;
  }
  
  if (target.closest(".modal:not(#customer-modal):not(#trailer-modal) .modal-close")) {
    closeModal();
    return;
  }

  if (target.classList.contains("modal-backdrop")) {
    const entryModal = target.closest('.modal:not(#customer-modal):not(#trailer-modal)');
    if (entryModal) {
      closeModal();
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

  const actionBtn = target.closest("[data-action]");
  if (!actionBtn) return;

  const action = actionBtn.dataset.action;
  const id = actionBtn.dataset.id;

  if (action === "set-data-tab") {
    state.ui.dataTab = actionBtn.dataset.tab;
    saveState();
    render();
    return;
  }

  /* ===== ARCHIVE ===== */

  if (action === "open-archive") {
    state.ui.archiveDetailId = id;
    saveState();
    render();
    return;
  }

  if (action === "close-archive") {
    state.ui.archiveDetailId = null;
    saveState();
    render();
    return;
  }

  if (action === "delete-archive") {
    if (confirm("Delete this archived period?")) {
      ArchiveService.deleteArchive(id);
      render();
    }
    return;
  }

  /* ===== CUSTOMERS ===== */

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

  /* ===== FLEET ===== */

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
   ENTRY MODAL
================================ */

function openModal() {
  const modal = document.querySelector(".modal:not(#customer-modal):not(#trailer-modal)");
  if (!modal) return;

  modal.hidden = false;

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("entry-date").value = today;
}

function closeModal() {
  const modal = document.querySelector(".modal:not(#customer-modal):not(#trailer-modal)");
  if (!modal) return;

  modal.hidden = true;
}

function saveEntryFromModal() {
  const distanceInput = document.getElementById("entry-distance");
  const dateInput = document.getElementById("entry-date");
  const pickupsInput = document.getElementById("entry-pickups");

  const distanceKm = parseFloat(distanceInput.value);
  const date = dateInput.value;
  const pickups = parseInt(pickupsInput.value) || 0;

  if (!distanceKm || distanceKm <= 0) return;

  LogbookService.addEntry({
    kilometers: distanceKm,
    date: date,
    loads: pickups,
    waitingHours: 0
  });

  distanceInput.value = "";
  pickupsInput.value = "";

  closeModal();
  render();
}

/* ===============================
   SEARCH LISTENER
================================ */

document.addEventListener("input", function(e) {
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
   INIT
================================ */

function init() {
  LogbookService.calculateTotals();
  document.addEventListener("click", handleClick);
  render();
}

document.addEventListener("DOMContentLoaded", init);
