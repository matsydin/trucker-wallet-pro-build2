import { LogbookService } from "../services/logbook.service.js";
import { renderLogScreen } from "./renderer.js";

document.addEventListener("click", (e) => {

  if (e.target.dataset.delete) {
    const id = e.target.dataset.delete;

    LogbookService.deleteEntry(id);
    renderLogScreen();
  }

  if (e.target.dataset.edit) {
    const id = e.target.dataset.edit;

    // 🔜 Поки що просто лог
    console.log("Edit entry:", id);
  }

});
