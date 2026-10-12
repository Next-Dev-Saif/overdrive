import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface User {
    id: string;
    username: string;
    email: string;
    stats: any;
    wallet: any;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    expireSession: () => void;
    sessionMessage: string | null;
    updateProgress: (stats: any, wallet: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [sessionMessage, setSessionMessage] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('overdrive_token');
        const storedUser = localStorage.getItem('overdrive_user');
        if (storedToken && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            } catch (e) {
                localStorage.removeItem('overdrive_token');
                localStorage.removeItem('overdrive_user');
            }
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        setSessionMessage(null);
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('overdrive_token', newToken);
        localStorage.setItem('overdrive_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('overdrive_token');
        localStorage.removeItem('overdrive_user');
    };

    /** Server rejection invalidates the saved session; never retry the same rejected token. */
    const expireSession = () => {
        logout();
        setSessionMessage('Your saved session is no longer valid. Sign in again to find a match.');
    };

    const updateProgress = (stats: any, wallet: any) => {
        if (!user) return;
        const updatedUser = { ...user, stats, wallet };
        setUser(updatedUser);
        localStorage.setItem('overdrive_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, expireSession, sessionMessage, updateProgress }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
