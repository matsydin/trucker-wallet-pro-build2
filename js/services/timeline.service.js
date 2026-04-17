// js/services/timeline.service.js

import { state } from "../state.js";

/* ======================================
   UNIFIED TIMELINE
====================================== */

export function getAllEntries() {
  const archiveEntries = state.archive.flatMap(period =>
    period.entries || []
  );

  const currentEntries = state.current.entries || [];

  return [...archiveEntries, ...currentEntries];
}

/* ======================================
   GENERIC TOTAL CALCULATOR
====================================== */

export function calculateTotals(entries) {
  let kilometers = 0;
  let miles = 0;
  let loads = 0;
  let waitingHours = 0;
  let amount = 0;

  entries.forEach(entry => {
    kilometers += Number(entry.kilometers || 0);
    miles += Number(entry.miles || 0);
    loads += Number(entry.loads || 0);
    waitingHours += Number(entry.waitingHours || 0);
    amount += Number(entry.amount || 0);
  });

  return {
    kilometers: +kilometers.toFixed(1),
    miles: +miles.toFixed(1),
    loads: +loads.toFixed(0),
    waitingHours: +waitingHours.toFixed(1),
    amount: +amount.toFixed(2)
  };
}

/* ======================================
   MONTH TOTAL
====================================== */

export function getMonthTotal(year, monthIndex) {
  const entries = getAllEntries();

  const filtered = entries.filter(entry => {
    const d = new Date(entry.date);
    return (
      d.getFullYear() === year &&
      d.getMonth() === monthIndex
    );
  });

  return calculateTotals(filtered);
}

/* ======================================
   YEAR TOTAL
====================================== */

export function getYearTotal(year) {
  const entries = getAllEntries();

  const filtered = entries.filter(entry => {
    const d = new Date(entry.date);
    return d.getFullYear() === year;
  });

  return calculateTotals(filtered);
}
