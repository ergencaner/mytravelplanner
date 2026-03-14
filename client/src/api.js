const BASE = '/api';

async function req(method, path, body) {
  const opts = { method, headers: {} };
  if (body && !(body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    opts.body = body;
  }
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Plans
  getPlans: () => req('GET', '/plans'),
  getPlan: (id) => req('GET', `/plans/${id}`),
  createPlan: (data) => req('POST', '/plans', data),
  updatePlan: (id, data) => req('PUT', `/plans/${id}`, data),
  deletePlan: (id) => req('DELETE', `/plans/${id}`),
  uploadCover: (id, file) => {
    const fd = new FormData(); fd.append('cover', file);
    return req('POST', `/plans/${id}/cover`, fd);
  },

  // Accommodations
  createAccommodation: (planId, data) => req('POST', `/plans/${planId}/accommodations`, data),
  updateAccommodation: (id, data) => req('PUT', `/accommodations/${id}`, data),
  deleteAccommodation: (id) => req('DELETE', `/accommodations/${id}`),

  // Places
  createPlace: (planId, data) => req('POST', `/plans/${planId}/places`, data),
  updatePlace: (id, data) => req('PUT', `/places/${id}`, data),
  deletePlace: (id) => req('DELETE', `/places/${id}`),

  // Transport
  createTransport: (planId, data) => req('POST', `/plans/${planId}/transport`, data),
  updateTransport: (id, data) => req('PUT', `/transport/${id}`, data),
  deleteTransport: (id) => req('DELETE', `/transport/${id}`),

  // Restaurants
  createRestaurant: (planId, data) => req('POST', `/plans/${planId}/restaurants`, data),
  updateRestaurant: (id, data) => req('PUT', `/restaurants/${id}`, data),
  deleteRestaurant: (id) => req('DELETE', `/restaurants/${id}`),

  // Itinerary
  createItineraryItem: (planId, data) => req('POST', `/plans/${planId}/itinerary`, data),
  updateItineraryItem: (id, data) => req('PUT', `/itinerary/${id}`, data),
  deleteItineraryItem: (id) => req('DELETE', `/itinerary/${id}`),

  // Summary links
  createSummaryLink: (planId, data) => req('POST', `/plans/${planId}/summary-links`, data),
  updateSummaryLink: (id, data) => req('PUT', `/summary-links/${id}`, data),
  deleteSummaryLink: (id) => req('DELETE', `/summary-links/${id}`),

  // Files
  getFiles: (planId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/plans/${planId}/files${qs ? '?' + qs : ''}`);
  },
  uploadFile: (planId, file, entityType, entityId) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('entity_type', entityType || 'plan');
    if (entityId) fd.append('entity_id', entityId);
    return req('POST', `/plans/${planId}/files`, fd);
  },
  deleteFile: (id) => req('DELETE', `/files/${id}`),
};

export async function geocode(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}
