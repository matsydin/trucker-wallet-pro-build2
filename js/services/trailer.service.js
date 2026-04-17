// js/services/trailer.service.js

import { state, saveState } from "../state.js";

function normalizeTrailerData(data) {
  return {
    unitNumber: String(data.unitNumber || "").trim(),
    plate: String(data.plate || "").trim().toUpperCase(),
    maxLoad: String(data.maxLoad || "").trim(),
    psi: String(data.psi || "").trim(),
    notes: String(data.notes || "").trim()
  };
}

function isValidNumberOrEmpty(value) {
  if (value === "") return true;
  const num = Number(value);
  return !Number.isNaN(num) && num >= 0;
}

export const TrailerService = {
  add(data) {
    const trailer = normalizeTrailerData(data);

    if (!trailer.unitNumber || !trailer.plate) {
      return {
        ok: false,
        errors: {
          general: "Unit number and plate are required."
        }
      };
    }

    if (!isValidNumberOrEmpty(trailer.maxLoad)) {
      return {
        ok: false,
        errors: {
          general: "Max Load must be 0 or greater."
        }
      };
    }

    if (!isValidNumberOrEmpty(trailer.psi)) {
      return {
        ok: false,
        errors: {
          general: "PSI must be 0 or greater."
        }
      };
    }

    state.trailers.unshift({
      id: crypto.randomUUID(),
      unitNumber: trailer.unitNumber,
      plate: trailer.plate,
      maxLoad: trailer.maxLoad,
      psi: trailer.psi,
      notes: trailer.notes
    });

    saveState();

    return { ok: true };
  },

  edit(id, data) {
    const trailer = normalizeTrailerData(data);

    if (!trailer.unitNumber || !trailer.plate) {
      return {
        ok: false,
        errors: {
          general: "Unit number and plate are required."
        }
      };
    }

    if (!isValidNumberOrEmpty(trailer.maxLoad)) {
      return {
        ok: false,
        errors: {
          general: "Max Load must be 0 or greater."
        }
      };
    }

    if (!isValidNumberOrEmpty(trailer.psi)) {
      return {
        ok: false,
        errors: {
          general: "PSI must be 0 or greater."
        }
      };
    }

    const index = state.trailers.findIndex(t => t.id === id);
    if (index === -1) {
      return {
        ok: false,
        errors: {
          general: "Trailer not found."
        }
      };
    }

    state.trailers[index] = {
      ...state.trailers[index],
      unitNumber: trailer.unitNumber,
      plate: trailer.plate,
      maxLoad: trailer.maxLoad,
      psi: trailer.psi,
      notes: trailer.notes
    };

    saveState();

    return { ok: true };
  },

  delete(id) {
    state.trailers = state.trailers.filter(t => t.id !== id);
    saveState();
  },

  setSearch(value) {
    state.ui.trailerSearch = value || "";
    saveState();
  },

  getFiltered() {
    const query = (state.ui.trailerSearch || "").trim().toLowerCase();

    if (!query) return state.trailers;

    return state.trailers.filter(t =>
      [
        t.unitNumber,
        t.plate,
        t.maxLoad,
        t.psi,
        t.notes
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }
};
