// js/services/archive.service.js

import { state, saveState } from "../state.js";

const KM_TO_MI = 0.621371;

/* ======================================
   ARCHIVE CURRENT PERIOD
====================================== */

function archiveCurrent() {
  const entries = state.current.entries;

  if (!entries || entries.length === 0) return;

  const periodData = generatePeriodData(entries);

  const archiveItem = {
    id: crypto.randomUUID(),

    periodLabel: periodData.label,
    periodStart: periodData.start,
    periodEnd: periodData.end,

    createdAt: new Date().toISOString(),

    entries: structuredClone(entries),

   totals: {
     kilometers: state.current.totals.kilometers ?? 0,
     miles: state.current.totals.miles ?? 0,
     loads: state.current.totals.loads ?? 0,
     waitingHours: state.current.totals.waitingHours ?? 0,
     amount: state.current.totals.amount ?? 0,
     meals: entries.reduce((acc, e) => {
    return acc + ["breakfast","lunch","dinner"]
      .filter(type => e.meals?.[type]?.taken).length;
  }, 0)
}
  };

  state.archive.unshift(archiveItem);

  state.archive.sort(
    (a, b) => new Date(b.periodEnd) - new Date(a.periodEnd)
  );

  state.current.entries = [];
  state.current.totals = {
    kilometers: 0,
    miles: 0,
    loads: 0,
    waitingHours: 0,
    amount: 0
  };

  saveState();
}

/* ======================================
   BASIC CRUD
====================================== */

function deleteArchive(id) {
  state.archive = state.archive.filter(a => a.id !== id);



  saveState();
}

function getById(id) {
  return state.archive.find(a => a.id === id);
}

/* ======================================
   AGGREGATION — YEARS / MONTHS / WEEKS
====================================== */

function getArchivedWeeks(year = null, month = null) {
  let weeks = [...state.archive];

  if (year !== null) {
    weeks = weeks.filter(w =>
      new Date(w.periodStart).getFullYear() === year
    );
  }

  if (month !== null) {
    weeks = weeks.filter(w =>
      new Date(w.periodStart).getMonth() === month
    );
  }

  return weeks.sort(
    (a, b) => new Date(b.periodEnd) - new Date(a.periodEnd)
  );
}

function getArchiveYears() {
  const map = {};

  state.archive.forEach(period => {
    const year = new Date(period.periodStart).getFullYear();

    if (!map[year]) {
      map[year] = {
        year,
        kilometers: 0,
        miles: 0,
        loads: 0,
        waitingHours: 0,
        amount: 0,
        meals: 0
      };
    }

    map[year].kilometers += period.totals.kilometers ?? 0;
    map[year].miles += period.totals.miles ?? 0;
    map[year].loads += period.totals.loads ?? 0;
    map[year].waitingHours += period.totals.waitingHours ?? 0;
    map[year].amount += period.totals.amount ?? 0;
    map[year].meals += period.totals.meals ?? 0;
  });

  return Object.values(map).sort((a, b) => b.year - a.year);
}

function getArchiveMonths(year) {
  if (year === null || year === undefined) return [];

  const map = {};

  state.archive.forEach(period => {
    const date = new Date(period.periodStart);
    const pYear = date.getFullYear();

    if (pYear !== year) return;

    const month = date.getMonth();
    const key = `${year}-${month}`;

    if (!map[key]) {
      map[key] = {
        year,
        month,
        kilometers: 0,
        miles: 0,
        loads: 0,
        waitingHours: 0,
        amount: 0,
        meals: 0
      };
    }

    map[key].kilometers += period.totals.kilometers ?? 0;
    map[key].miles += period.totals.miles ?? 0;
    map[key].loads += period.totals.loads ?? 0;
    map[key].waitingHours += period.totals.waitingHours ?? 0;
    map[key].amount += period.totals.amount ?? 0;
    map[key].meals += period.totals.meals ?? 0;
  });

  return Object.values(map).sort((a, b) => b.month - a.month);
}

/* ======================================
   ENTRY EDITING
====================================== */

function convertKmToMiles(km) {
  return +(Number(km || 0) * KM_TO_MI).toFixed(1);
}

function calculateArchivedAmount(entry) {
  return +(
    (Number(entry.miles || 0) * Number(entry.rateSnapshot?.perMile || 0)) +
    (Number(entry.loads || 0) * Number(entry.rateSnapshot?.perDrop || 0)) +
    (Number(entry.waitingHours || 0) * Number(entry.rateSnapshot?.perWaiting || 0))
  ).toFixed(2);
}

function recalculateArchiveTotals(periodId) {
  const period = getById(periodId);
  if (!period) return;

  let kilometers = 0;
  let miles = 0;
  let loads = 0;
  let waitingHours = 0;
  let amount = 0;
  let meals = 0;

  period.entries.forEach(entry => {
    kilometers += Number(entry.kilometers || 0);
    miles += Number(entry.miles || 0);
    loads += Number(entry.loads || 0);
    waitingHours += Number(entry.waitingHours || 0);
    amount += Number(entry.amount || 0);
    meals += ["breakfast","lunch","dinner"]
  .filter(type => entry.meals?.[type]?.taken).length;
  });

  period.totals = {
  kilometers: +kilometers.toFixed(1),
  miles: +miles.toFixed(1),
  loads: +loads.toFixed(0),
  waitingHours: +waitingHours.toFixed(1),
  amount: +amount.toFixed(2),
  meals: meals
};

  const periodData = generatePeriodData(period.entries);
  period.periodStart = periodData.start;
  period.periodEnd = periodData.end;
  period.periodLabel = periodData.label;
}

function editArchivedEntry(periodId, entryId, newData) {
  const period = getById(periodId);
  if (!period) return { ok: false };

  const entry = period.entries.find(e => e.id === entryId);
  if (!entry) return { ok: false };

  const kilometers = Number(newData.kilometers);
  const loads = Number(newData.loads || 0);
  const waitingHours = Number(newData.waitingHours || 0);
  const perMile = Number(newData.perMile || 0);
  const perDrop = Number(newData.perDrop || 0);
  const perWaiting = Number(newData.perWaiting || 0);

  if (!newData.date || Number.isNaN(kilometers) || kilometers <= 0) {
    return { ok: false };
  }

  if ([loads, waitingHours, perMile, perDrop, perWaiting].some(v => Number.isNaN(v) || v < 0)) {
    return { ok: false };
  }

  entry.date = newData.date;
  entry.kilometers = kilometers;
  entry.loads = loads;
  entry.waitingHours = waitingHours;

  entry.miles = convertKmToMiles(kilometers);

  entry.rateSnapshot = {
    perMile,
    perDrop,
    perWaiting
  };

  entry.amount = calculateArchivedAmount(entry);
// ✅ Update meals if provided
if (newData.meals) {
  entry.meals = newData.meals;
}
   
   if (newData.meals) {
     entry.meals = newData.meals;
      }
  period.entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  recalculateArchiveTotals(periodId);
  saveState();

  return { ok: true };
}

function deleteArchivedEntry(periodId, entryId) {
  const period = getById(periodId);
  if (!period) return;

  period.entries = period.entries.filter(e => e.id !== entryId);

  if (period.entries.length === 0) {
    deleteArchive(periodId);
    return;
  }

  recalculateArchiveTotals(periodId);
  saveState();
}

/* ======================================
   PERIOD HELPERS
====================================== */

function generatePeriodData(entries) {
  if (!entries || entries.length === 0) {
    return { start: "", end: "", label: "Empty Period" };
  }

  const dates = entries.map(e => new Date(e.date));

  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  return {
    start: formatISO(minDate),
    end: formatISO(maxDate),
    label: formatLabel(minDate, maxDate)
  };
}

function formatISO(date) {
  return date.toISOString().split("T")[0];
}

function formatLabel(start, end) {
  const monthShort = d =>
    d.toLocaleString("en-US", { month: "short" });

  const sameDay =
    start.toDateString() === end.toDateString();

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  const sameYear =
    start.getFullYear() === end.getFullYear();

  if (sameDay) {
    return `${monthShort(start)} ${start.getDate()} ${start.getFullYear()}`;
  }

  if (sameMonth) {
    return `${monthShort(start)} ${start.getDate()} – ${end.getDate()} ${start.getFullYear()}`;
  }

  if (sameYear) {
    return `${monthShort(start)} ${start.getDate()} – ${monthShort(end)} ${end.getDate()} ${start.getFullYear()}`;
  }

  return `${monthShort(start)} ${start.getDate()} ${start.getFullYear()} – ${monthShort(end)} ${end.getDate()} ${end.getFullYear()}`;
}

export const ArchiveService = {
  archiveCurrent,
  deleteArchive,
  getById,
  editArchivedEntry,
  deleteArchivedEntry,
  recalculateArchiveTotals,
  getArchivedWeeks,
  getArchiveYears,
  getArchiveMonths
};
