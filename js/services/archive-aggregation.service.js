// js/services/archive-aggregation.service.js

import { state } from "../state.js";

export const ArchiveAggregationService = {

  /* ===============================
     YEARS SUMMARY
  ============================== */
  getYearsSummary() {
    const map = {};

    state.archive.forEach(period => {
      period.entries.forEach(entry => {
        const year = new Date(entry.date).getFullYear();

        if (!map[year]) {
          map[year] = this._createEmptySummary();
        }

        this._accumulate(map[year], entry);
      });
    });

    return this._toSortedArray(map, "year");
  },

  /* ===============================
     MONTHS SUMMARY
  ============================== */
  getMonthsSummary(year) {
    const map = {};

    state.archive.forEach(period => {
      period.entries.forEach(entry => {
        const d = new Date(entry.date);
        if (d.getFullYear() !== Number(year)) return;

        const month = d.getMonth(); // 0-11

        if (!map[month]) {
          map[month] = this._createEmptySummary();
        }

        this._accumulate(map[month], entry);
      });
    });

    return this._toSortedArray(map, "month");
  },

  /* ===============================
     WEEKS SUMMARY
  ============================== */
  getWeeksSummary(year, month) {
    const result = [];

    state.archive.forEach(period => {
      const entries = period.entries.filter(entry => {
        const d = new Date(entry.date);
        return (
          d.getFullYear() === Number(year) &&
          d.getMonth() === Number(month)
        );
      });

      if (!entries.length) return;

      const summary = this._createEmptySummary();
      entries.forEach(entry => this._accumulate(summary, entry));

      result.push({
        id: period.id,
        label: period.periodLabel,
        ...summary
      });
    });

    return result;
  },

  /* ===============================
     CUSTOM RANGE
  ============================== */
  getCustomRangeSummary(from, to) {
    if (!from || !to) return null;

    const start = new Date(from);
    const end = new Date(to);

    const summary = this._createEmptySummary();

    state.archive.forEach(period => {
      period.entries.forEach(entry => {
        const d = new Date(entry.date);
        if (d >= start && d <= end) {
          this._accumulate(summary, entry);
        }
      });
    });

    return summary;
  },

  /* ===============================
     INTERNAL HELPERS
  ============================== */

  _createEmptySummary() {
    return {
      distance: 0,
      loads: 0,
      meals: 0,
      waiting: 0,
      total: 0
    };
  },

  _accumulate(summary, entry) {
    summary.distance += entry.kilometers || 0;
    summary.loads += entry.loads || 0;
    summary.waiting += entry.waitingHours || 0;
    summary.total += entry.amount || 0;

    if (entry.meals) {
      Object.values(entry.meals).forEach(m => {
        if (m?.taken) summary.meals += 1;
      });
    }
  },

  _toSortedArray(map, type) {
    return Object.keys(map)
      .sort((a, b) => b - a)
      .map(key => ({
        [type]: Number(key),
        ...map[key]
      }));
  }

};
window.ArchiveAggregationService = ArchiveAggregationService;
