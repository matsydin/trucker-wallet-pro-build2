// js/services/archive.service.js

import { state, saveState } from "../state.js";
import { LogbookService } from "./logbook.service.js";

export const ArchiveService = {

  /* ======================================
     ARCHIVE CURRENT PERIOD
  ====================================== */

  archiveCurrent() {

    const entries = state.current.entries;

    if (!entries.length) return;

    const firstDate = new Date(entries[0].date);
    const lastDate = new Date(
      entries[entries.length - 1].date
    );

    const periodLabel = this.buildPeriodLabel(
      firstDate,
      lastDate
    );

    const snapshot = {
      id: crypto.randomUUID(),
      periodLabel,
      createdAt: new Date().toISOString(),

      entries: structuredClone(entries),

      totals: structuredClone(state.current.totals)
    };

    state.archive.push(snapshot);

    // ✅ Clear current
    state.current.entries = [];
    state.current.totals = {
      kilometers: 0,
      miles: 0,
      amount: 0
    };

    saveState();
  },

  /* ======================================
     PERIOD LABEL
  ====================================== */

  buildPeriodLabel(start, end) {

    const format = (d) =>
      d.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "2-digit"
      });

    return `${format(start)} - ${format(end)}`;
  },

  /* ======================================
     RENDER ARCHIVE LIST
  ====================================== */

  render() {

    const container = document.querySelector(
      '[data-page="archive"]'
    );

    if (!container) return;

    if (!state.archive.length) {
      container.innerHTML = `
        <div class="card">
          No archived periods yet
        </div>
      `;
      return;
    }

    container.innerHTML = state.archive
      .map(period => this.renderItem(period))
      .join("");
  },

  renderItem(period) {

    const currency = state.settings.currency;

    return `
      <div class="card archive-item" data-id="${period.id}">
        <div class="archive-title">
          ${period.periodLabel}
        </div>
        <div class="archive-meta">
          ${period.entries.length} entries
        </div>
        <div class="archive-amount">
          $${period.totals.amount.toFixed(2)} ${currency}
        </div>
      </div>
    `;
  }

};
