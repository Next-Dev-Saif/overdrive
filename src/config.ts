/** Shared backend origin; override with VITE_SERVER_URL for hosted or LAN deployments. */
export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
