import { state, saveState } from "../state.js";

function generateId() {
  return crypto.randomUUID();
}

export const CustomerService = {

  add(data) {
    const customer = {
      id: generateId(),
      name: data.name.trim(),
      address: data.address?.trim() || "",
      is24h: data.is24h || false,
      openTime: data.is24h ? null : (data.openTime || ""),
      closeTime: data.is24h ? null : (data.closeTime || ""),
      notes: data.notes?.trim() || "",
      createdAt: new Date().toISOString()
    };

    state.customers.push(customer);
    saveState();
  },

  edit(id, data) {
    const customer = state.customers.find(c => c.id === id);
    if (!customer) return;

    customer.name = data.name.trim();
    customer.address = data.address?.trim() || "";
    customer.is24h = data.is24h || false;
    customer.openTime = customer.is24h ? null : (data.openTime || "");
    customer.closeTime = customer.is24h ? null : (data.closeTime || "");
    customer.notes = data.notes?.trim() || "";

    saveState();
  },

  delete(id) {
    state.customers = state.customers.filter(c => c.id !== id);
    saveState();
  },

  setSearch(query) {
    state.ui.customerSearch = query;
    saveState();
  },

  getFiltered() {
    const q = state.ui.customerSearch.toLowerCase().trim();
    if (!q) return state.customers;

    return state.customers.filter(c =>
      c.name.toLowerCase().includes(q)
    );
  }
};
