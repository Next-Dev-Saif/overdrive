import { backendOrigin } from '../shared/backendOrigin';

/** Vite embeds this public URL at build time; secrets must never use the VITE_ prefix. */
export const SERVER_URL = backendOrigin(import.meta.env.VITE_SERVER_URL, import.meta.env.PROD);
