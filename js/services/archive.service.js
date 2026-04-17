import { state, saveState } from "../state.js";

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

    totals: structuredClone(state.current.totals)
  };

  // Додаємо новий період на початок
  state.archive.unshift(archiveItem);

  // Сортування по кінцевій даті (новіші зверху)
  state.archive.sort(
    (a, b) => new Date(b.periodEnd) - new Date(a.periodEnd)
  );

  // Очищаємо current
  state.current.entries = [];
  state.current.totals = {
    kilometers: 0,
    miles: 0,
    amount: 0
  };

  saveState();
}

function deleteArchive(id) {
  state.archive = state.archive.filter(a => a.id !== id);
  saveState();
}

function getById(id) {
  return state.archive.find(a => a.id === id);
}

function generatePeriodData(entries) {
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
  const sameDay =
    start.toDateString() === end.toDateString();

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  const sameYear =
    start.getFullYear() === end.getFullYear();

  const monthShort = d =>
    d.toLocaleString("en-US", { month: "short" });

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
  getById
};
