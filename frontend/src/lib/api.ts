// Use a different variable for server-side to avoid conflict if ever run in same context
const serverApiUrl = "http://backend:8000"; 

export const API_URL = typeof window !== "undefined" 
    ? `http://${window.location.hostname}:8000` 
    : serverApiUrl;

