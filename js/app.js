import { renderLogScreen, renderArchiveScreen, renderCustomers } from "./ui/renderer.js";
import { state, saveState } from "./state.js";
import { LogbookService } from "./services/logbook.service.js";
import { ArchiveService } from "./services/archive.service.js";
import { CustomerService } from "./services/customer.service.js";

/* ===============================
   RENDER APP STATE
================================ */

function render() {
  document.body.setAttribute("data-theme", state.ui.theme);

  // показ сторінок
  document.querySelectorAll(".page").forEach(page => {
    page.hidden = page.dataset.page !== state.ui.activeTab;
  });

  // активна вкладка
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.tab === state.ui.activeTab
    );
  });

  // KM / MI toggle
  document.querySelectorAll("[data-unit]").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.unit === state.ui.displayUnit
    );
  });

  // ✅ SCREEN RENDERING (FIXED ORDER)

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
   TAB / UNIT / THEME ACTIONS
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

  if (target.closest(".fab")) {
    openModal();
    return;
  }

  if (
    target.closest(".modal-close") ||
    target.closest(".modal-backdrop")
  ) {
    closeModal();
    return;
  }

  if (target.closest("#save-entry")) {
    saveEntryFromModal();
    return;
  }

  const deleteBtn = target.closest("[data-delete]");
  if (deleteBtn) {
    LogbookService.deleteEntry(deleteBtn.dataset.delete);
    render();
    return;
  }

  if (target.closest("#finish-week-btn")) {
    ArchiveService.archiveCurrent();
    render();
    return;
  }

  const openArchive = target.closest('[data-action="open-archive"]');
  if (openArchive) {
    state.ui.archiveDetailId = openArchive.dataset.id;
    saveState();
    render();
    return;
  }

  if (target.closest('[data-action="close-archive"]')) {
    state.ui.archiveDetailId = null;
    saveState();
    render();
    return;
  }

  const deleteArchiveBtn = target.closest('[data-action="delete-archive"]');
  if (deleteArchiveBtn) {
    const id = deleteArchiveBtn.dataset.id;

    if (confirm("Delete this archived period?")) {
      ArchiveService.deleteArchive(id);

      if (state.ui.archiveDetailId === id) {
        state.ui.archiveDetailId = null;
      }

      render();
    }
    return;
  }

  /* =========================
     CUSTOMER ACTIONS
  ========================= */

  const actionBtn = target.closest("[data-action]");
  if (actionBtn) {
    const action = actionBtn.dataset.action;
    const id = actionBtn.dataset.id;

    if (action === "open-add-customer") {
      const name = prompt("Customer name:");
      if (!name) return;

      CustomerService.add({
        name,
        address: "",
        is24h: false,
        openTime: "",
        closeTime: "",
        notes: ""
      });

      render();
      return;
    }

    if (action === "delete-customer") {
      if (!id) return;

      if (confirm("Delete this customer?")) {
        CustomerService.delete(id);
        render();
      }
      return;
    }
  }
}

/* ===============================
   MODAL FUNCTIONS
================================ */

function openModal() {
  const modal = document.querySelector(".modal");
  if (!modal) return;

  modal.hidden = false;

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("entry-date").value = today;
}

function closeModal() {
  const modal = document.querySelector(".modal");
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
   INIT APP
================================ */

function init() {
  LogbookService.calculateTotals();
  document.addEventListener("click", handleClick);
  render();
}

document.addEventListener("DOMContentLoaded", init);
