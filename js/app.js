import { renderLogScreen, renderArchiveScreen, renderCustomers } from "./ui/renderer.js";
import { state, saveState } from "./state.js";
import { LogbookService } from "./services/logbook.service.js";
import { ArchiveService } from "./services/archive.service.js";
import { CustomerService } from "./services/customer.service.js";

let editingCustomerId = null;

/* ===============================
   RENDER APP STATE
================================ */

function render() {
  document.body.setAttribute("data-theme", state.ui.theme);

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

  if (state.ui.activeTab === "log") {
    renderLogScreen(state);
    return;
  }

  if (state.ui.activeTab === "archive") {
    renderArchiveScreen(state);
    return;
  }

  if (state.ui.activeTab === "data") {
    renderCustomers(state);
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

  // ✅ FAB тільки на Log
  if (target.closest(".fab") && state.ui.activeTab === "log") {
    openModal();
    return;
  }

  if (target.closest("#save-entry")) {
    saveEntryFromModal();
    return;
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
}
/* ===============================
   CUSTOMER MODAL
================================ */

function openCustomerModal(id = null) {
  const modal = document.getElementById("customer-modal");
  if (!modal) return;

  const title = document.getElementById("customer-modal-title");
  const name = document.getElementById("customer-name");
  const address = document.getElementById("customer-address");
  const is24h = document.getElementById("customer-24h");
  const open = document.getElementById("customer-open");
  const close = document.getElementById("customer-close");
  const notes = document.getElementById("customer-notes");

  if (id) {
    const c = state.customers.find(c => c.id === id);
    if (!c) return;

    title.textContent = "Edit Customer";
    name.value = c.name;
    address.value = c.address;
    is24h.checked = c.is24h;
    open.value = c.openTime || "";
    close.value = c.closeTime || "";
    notes.value = c.notes;
  } else {
    title.textContent = "Add Customer";
    name.value = "";
    address.value = "";
    is24h.checked = false;
    open.value = "";
    close.value = "";
    notes.value = "";
  }

  modal.hidden = false;
}

function closeCustomerModal() {
  const modal = document.getElementById("customer-modal");
  if (!modal) return;

  modal.hidden = true;
}

/* ===============================
   ENTRY MODAL
================================ */

function openModal() {
  const modal = document.querySelector(".modal:not(#customer-modal)");
  if (!modal) return;

  modal.hidden = false;

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("entry-date").value = today;
}

function closeModal() {
  const modal = document.querySelector(".modal:not(#customer-modal)");
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
