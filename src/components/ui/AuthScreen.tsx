import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { authenticate } from '../../services/AuthService';
import { User, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export function AuthScreen() {
    const { login, sessionMessage } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const playHover = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-hover'));
    };

    const playSelect = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        playSelect();
        setError('');
        setLoading(true);

        try {
            const data = await authenticate(isLogin ? 'login' : 'register', { username, email, password });
            login(data.token, data.user);
        } catch (err: any) {
            setError(err.message || 'Unable to sign in. Please check your credentials.');
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-deselect'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative w-full h-full min-h-dvh bg-[#08090b] text-[#f5f6f8] overflow-hidden flex items-center justify-center font-sans selection:bg-white selection:text-black">
            {/* Subtle Studio Lighting Vignette */}
            <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                    background: 'radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.05) 0%, transparent 60%), radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.7) 100%)' 
                }} 
            />

            {/* Background Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 opacity-[0.03] flex flex-col items-center leading-none">
                <span className="text-[20vw] font-black italic tracking-tighter text-white">OVERDRIVE</span>
            </div>

            {/* Sign In Card */}
            <div className="relative z-10 w-full max-w-md p-6 sm:p-8">
                <div className="relative bg-[#0e1015]/95 border border-white/15 p-8 sm:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl rounded-lg">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <span className="text-2xl sm:text-3xl font-black italic tracking-tight uppercase text-white mb-1">
                            OVERDRIVE
                        </span>
                        <p className="text-white/50 text-xs font-medium">
                            {isLogin ? 'Sign in with your driver account' : 'Create your driver account to play'}
                        </p>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="grid grid-cols-2 gap-1 bg-black/50 p-1 mb-6 border border-white/10 rounded-md">
                        <button
                            type="button"
                            onMouseEnter={playHover}
                            onClick={() => { playSelect(); setIsLogin(true); setError(''); }}
                            className={`py-2 px-3 text-xs font-bold tracking-wider uppercase transition-all rounded ${
                                isLogin 
                                    ? 'bg-white text-black shadow-sm' 
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onMouseEnter={playHover}
                            onClick={() => { playSelect(); setIsLogin(false); setError(''); }}
                            className={`py-2 px-3 text-xs font-bold tracking-wider uppercase transition-all rounded ${
                                !isLogin 
                                    ? 'bg-white text-black shadow-sm' 
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {sessionMessage && (
                        <div role="status" className="mb-6 p-3 bg-white/5 border border-white/20 text-xs text-white/80 rounded flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5 text-white/70" />
                            <span>{sessionMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Username Input */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold tracking-wider text-white/70 block uppercase">
                                Username
                            </label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Enter your username" 
                                    required 
                                    value={username} 
                                    onChange={e => setUsername(e.target.value)} 
                                    className="w-full bg-[#08090c] border border-white/15 rounded py-3 pl-10 pr-4 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white focus:bg-[#12141a] transition-all" 
                                />
                            </div>
                        </div>
                        
                        {/* Email Input (Register only) */}
                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold tracking-wider text-white/70 block uppercase">
                                    Email
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" size={16} />
                                    <input 
                                        type="email" 
                                        placeholder="driver@example.com" 
                                        required 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        className="w-full bg-[#08090c] border border-white/15 rounded py-3 pl-10 pr-4 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white focus:bg-[#12141a] transition-all" 
                                    />
                                </div>
                            </div>
                        )}
                        
                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold tracking-wider text-white/70 block uppercase">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" size={16} />
                                <input 
                                    type="password" 
                                    placeholder="••••••••••••" 
                                    required 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    className="w-full bg-[#08090c] border border-white/15 rounded py-3 pl-10 pr-4 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white focus:bg-[#12141a] transition-all" 
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-white text-xs p-3 rounded mt-1 flex items-center gap-2">
                                <AlertCircle size={14} className="text-red-400 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading} 
                            onMouseEnter={playHover}
                            className="group relative mt-3 w-full bg-white hover:bg-neutral-200 text-black font-extrabold tracking-wider uppercase py-3.5 px-6 rounded transition-all disabled:opacity-50 active:scale-[0.99] cursor-pointer"
                        >
                            <div className="relative flex items-center justify-center gap-2 text-xs">
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin text-black" size={15} />
                                        <span>Please wait...</span>
                                    </>
                                ) : (
                                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                )}
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
