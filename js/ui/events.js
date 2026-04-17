// js/ui/events.js

import { LogbookService } from "../services/logbook.service.js";
import { renderLogScreen } from "./renderer.js";
import { ArchiveService } from "../services/archive.service.js";
import { render } from "../app.js";

export function initEvents() {
  const finishBtn = document.getElementById("finish-week-btn");

  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      ArchiveService.archiveCurrent();
      render();
    });
  }
}

export function initEvents() {

  // ✅ Submit Add Entry Form
  const form = document.querySelector("#addEntryForm");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const data = {
        date: form.date.value,
        kilometers: +form.kilometers.value,
        loads: +form.loads.value,
        waitingHours: +form.waitingHours.value
      };

      LogbookService.addEntry(data);

      form.reset();

      renderLogScreen();
    });
  }

  // ✅ Global Click Handler (Edit / Delete)
  document.addEventListener("click", (e) => {

    // ✅ Delete Entry
    if (e.target.dataset.delete) {
      const id = e.target.dataset.delete;

      const confirmDelete = confirm("Delete this entry?");
      if (!confirmDelete) return;

      LogbookService.deleteEntry(id);
      renderLogScreen();
    }

    // ✅ Edit Entry (UI зробимо наступним кроком)
    if (e.target.dataset.edit) {
      const id = e.target.dataset.edit;

      console.log("Edit entry:", id);

      // 🔜 Тут буде відкриття modal з prefill
    }

  });

}
