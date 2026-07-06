export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('farmtec-token') : null;
  const headers = new Headers(options.headers || {});

  if (token && !token.startsWith('mock-token-')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type if body is FormData (let fetch handle boundaries)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  let res = await fetch(finalUrl, {
    ...options,
    headers,
  });

  // Automatically attempt token refresh on 401 Unauthorized
  if (res.status === 401 && typeof window !== 'undefined') {
    const refresh = localStorage.getItem('farmtec-refresh-token');
    if (refresh && !refresh.startsWith('mock-refresh-')) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/accounts/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccess = refreshData.access;
          localStorage.setItem('farmtec-token', newAccess);

          // Retry the original request with the new token
          const newHeaders = new Headers(options.headers || {});
          newHeaders.set('Authorization', `Bearer ${newAccess}`);
          if (!(options.body instanceof FormData) && !newHeaders.has('Content-Type')) {
            newHeaders.set('Content-Type', 'application/json');
          }

          res = await fetch(finalUrl, {
            ...options,
            headers: newHeaders,
          });
          return res;
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
    }

    // Clear local storage and redirect to login if refresh fails
    localStorage.removeItem('farmtec-user');
    localStorage.removeItem('farmtec-token');
    localStorage.removeItem('farmtec-refresh-token');
    window.location.href = '/';
  }

  return res;
}

export const API = {
  dashboard: '/api/farms/dashboard/',
  schedules: '/api/farms/schedules/',
  plots: '/api/farms/plots/',
  farms: '/api/farms/farms/',
  fields: '/api/farms/fields/',
  notifications: '/api/accounts/notifications/',
  profile: '/api/accounts/profile/',
  cv: '/api/ai/cv/',
};

export async function fetchPublicStats() {
  const res = await apiFetch('/api/farms/public/stats/', { method: 'GET' });
  if (!res.ok) throw new Error("Failed to fetch public stats");
  return res.json();
}

export async function fetchTestimonials() {
  const res = await apiFetch('/api/farms/testimonials/', { method: 'GET' });
  if (!res.ok) throw new Error("Failed to fetch testimonials");
  const json = await res.json();
  return Array.isArray(json) ? json : json.results || [];
}

export async function sendContactMessage(payload: any) {
  const res = await apiFetch('/api/farms/public/contact/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to send contact message");
  return res.json();
}

export async function fetchSoilHealth(payload: any) {
  const res = await apiFetch('/api/ai/soil-health/', {
    method: 'POST',
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error("Failed to fetch soil health");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch soil health");
  return json.data;
}

export async function fetchCropRecommendation(payload: any) {
  const res = await apiFetch('/api/ai/crop-recommendation/', {
    method: 'POST',
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error("Failed to fetch crop recommendation");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch crop recommendation");
  return json.data;
}

export async function fetchYieldPrediction(lat: number, lon: number, year: number, crop: string) {
  const res = await apiFetch('/api/ai/yield/', {
    method: 'POST',
    body: JSON.stringify({ data: { lat, lon, year, crop } }),
  });
  if (!res.ok) throw new Error("Failed to fetch yield prediction");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch yield prediction");
  return json.data;
}

export async function fetchFertilizerOptimizer(payload: any) {
  const res = await apiFetch('/api/ai/fertilizer/', {
    method: 'POST',
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error("Failed to fetch fertilizer optimizer");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch fertilizer optimizer");
  return json.data;
}

export async function analyzeIrrigation(payload: any) {
  const res = await apiFetch('/api/ai/irrigation/', {
    method: 'POST',
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error("Failed to analyze irrigation");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to analyze irrigation");
  return json.data;
}

export async function fetchScenarioSimulation(payload: any) {
  const res = await apiFetch('/api/ai/scenario-simulator/', {
    method: 'POST',
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error("Failed to fetch scenario simulation");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch scenario simulation");
  return json.data;
}

export async function fetchCropRotation(payload: any) {
  const res = await apiFetch('/api/ai/crop-rotation/', {
    method: 'POST',
    body: JSON.stringify({ data: payload }),
  });
  if (!res.ok) throw new Error("Failed to fetch crop rotation");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch crop rotation");
  return json.data;
}

export async function fetchForecast(commodity: string) {
  const res = await apiFetch(`/api/ai/forecast/?commodity=${encodeURIComponent(commodity)}`, {
    method: 'GET'
  });
  if (!res.ok) throw new Error("Failed to fetch commodity price forecast");
  return res.json();
}

export async function fetchCommodities() {
  const res = await apiFetch('/api/ai/forecast/commodities/', {
    method: 'GET'
  });
  if (res.ok) {
    return res.json();
  }
  return ["Wheat", "Rice", "Tomato", "Potato", "Maize", "Mango"];
}

export async function fetchFarms() {
  const res = await apiFetch('/api/farms/farms/', { method: 'GET' });
  if (res.ok) {
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  }
  return [];
}