import { SERVER_URL } from '../config';
import type { User } from '../store/AuthContext';

/** Authentication and matchmaking must target the same backend and signing authority. */
export async function authenticate(action: 'login' | 'register', credentials: { username: string; email: string; password: string }): Promise<{ token: string; user: User }> {
    const response = await fetch(`${SERVER_URL}/auth/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'login' ? { username: credentials.username, password: credentials.password } : credentials),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Authentication failed');
    if (typeof data.token !== 'string' || !data.user?.id) throw new Error('The server returned an incomplete session. Please try again.');
    return data;
}
