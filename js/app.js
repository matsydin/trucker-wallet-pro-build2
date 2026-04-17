// js/app.js
import { renderArchiveScreen, renderLogScreen } from './ui/renderer.js';
import { state, saveState } from "./state.js";
import { LogbookService } from "./services/logbook.service.js";
import { ArchiveService } from "./services/archive.service.js";

/* ===============================
   RENDER
================================ */

function render() {
  document.body.setAttribute("data-theme", state.ui.theme);

  if (state.ui.activeTab === "archive") {
    renderArchiveScreen(state);
  } else {
    renderLogScreen(state);
  }
}

/* ===============================
   ACTIONS
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
   EVENTS (Delegation)
================================ */

function handleClick(e) {
  const target = e.target;

  // Tabs
  const tab = target.closest(".tab");
  if (tab) {
    setTab(tab.dataset.tab);
    return;
  }

  // KM / MI toggle
  const unitBtn = target.closest("[data-unit]");
  if (unitBtn) {
    setUnit(unitBtn.dataset.unit);
    return;
  }

  // Brand (theme toggle)
  const brand = target.closest(".brand");
  if (brand && !e.shiftKey) {
    toggleTheme();
    return;
  }

  // FAB
  if (target.closest(".fab")) {
    openModal();
    return;
  }

  // Close modal
  if (
    target.closest(".modal-close") ||
    target.closest(".modal-backdrop")
  ) {
    closeModal();
    return;
  }

  // Save entry
  if (target.closest("#save-entry")) {
    saveEntryFromModal();
    return;
  }

  // Delete entry
  const deleteBtn = target.closest("[data-delete]");
  if (deleteBtn) {
    LogbookService.deleteEntry(deleteBtn.dataset.delete);
    render();
    return;
  }

  // Finish Week
  if (target.closest("#finish-week-btn")) {
    ArchiveService.archiveCurrent();
    render();
    return;
  }

  // Archive (shift + brand)
  if (brand && e.shiftKey) {
    ArchiveService.archiveCurrent();
    render();
    return;
  }

  // OPEN ARCHIVE DETAIL
  const openArchive = target.closest('[data-action="open-archive"]');
  if (openArchive) {
    state.archiveDetailId = openArchive.dataset.id;
    saveState();
    render();
    return;
  }

  // CLOSE ARCHIVE DETAIL
  if (target.closest('[data-action="close-archive"]')) {
    state.archiveDetailId = null;
    saveState();
    render();
    return;
  }

  // DELETE ARCHIVE
  const deleteArchiveBtn = target.closest('[data-action="delete-archive"]');
  if (deleteArchiveBtn) {
    const id = deleteArchiveBtn.dataset.id;

    if (confirm("Delete this archived period?")) {
      deleteArchive(id);

      if (state.archiveDetailId === id) {
        state.archiveDetailId = null;
      }

      render();
    }
    return;
  }
}

/* ===============================
   MODAL
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
   INIT
================================ */

function init() {
  LogbookService.calculateTotals();
  document.addEventListener("click", handleClick);
  render();
}

document.addEventListener("DOMContentLoaded", init);
