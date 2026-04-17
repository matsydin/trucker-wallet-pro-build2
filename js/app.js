// js/app.js

import { state, saveState, loadState } from "./state.js";
import { LogbookService } from "./services/logbook.service.js";
import { ArchiveService } from "./services/archive.service.js";
import { renderLogScreen } from "./ui/renderer.js";

/* ===============================
   RENDER
================================ */

function renderUI() {
  // Theme
  document.body.setAttribute("data-theme", state.ui.theme);

  // Active tab buttons
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.tab === state.ui.activeTab
    );
  });

  // Page visibility
  document.querySelectorAll(".page").forEach(page => {
    page.hidden = page.dataset.page !== state.ui.activeTab;
  });

  // Unit segmented toggle
  document.querySelectorAll(".segmented button").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.unit === state.ui.displayUnit
    );
  });
}

function render() {
  renderUI();
  renderLogScreen();      // ✅ тепер рендер через renderer.js
  ArchiveService.render(); // поки що залишаємо
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

  // Tabs
  const tab = e.target.closest(".tab");
  if (tab) {
    setTab(tab.dataset.tab);
    return;
  }

  // KM / MI toggle
  const unitBtn = e.target.closest("[data-unit]");
  if (unitBtn) {
    setUnit(unitBtn.dataset.unit);
    return;
  }

  // Brand (temporary theme toggle)
  const brand = e.target.closest(".brand");
  if (brand) {
    toggleTheme();
    return;
  }

 // FAB
const fab = e.target.closest(".fab");
if (fab) {
  openModal();
  return;
}
   // Close modal
if (e.target.closest(".modal-close") ||
    e.target.closest(".modal-backdrop")) {
  closeModal();
  return;
}

// Save entry
if (e.target.closest("#save-entry")) {
  saveEntryFromModal();
  return;
}
   // Temporary: archive on long press brand
if (e.target.closest(".brand") && e.shiftKey) {
  ArchiveService.archiveCurrent();
  render();
  return;
}
}

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
    kilometers: distanceKm,   // ✅ ПРАВИЛЬНА ЗМІННА
    date: date,
    loads: pickups,
    waitingHours: 0
  });

  distanceInput.value = "";
  pickupsInput.value = "";

  closeModal();

  render();   // ✅ одразу оновлюємо UI
}
/* ===============================
   INIT
================================ */

function init() {

  // ✅ 1. Завантажити state з localStorage
  loadState();

  // ✅ 2. Перерахувати totals (на випадок старих даних)
  LogbookService.calculateTotals();

  // ✅ 3. Підключити події
  document.addEventListener("click", handleClick);

  // ✅ 4. Перший рендер
  render();
}

document.addEventListener("DOMContentLoaded", init);
