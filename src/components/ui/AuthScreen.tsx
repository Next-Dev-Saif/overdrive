import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { authenticate } from '../../services/AuthService';
import { User, Mail, Lock, Loader2, KeyRound } from 'lucide-react';

export function AuthScreen() {
    const { login, sessionMessage } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Animate in
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await authenticate(isLogin ? 'login' : 'register', { username, email, password });
            login(data.token, data.user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative w-full h-full bg-slate-950 text-white overflow-hidden flex items-center justify-center font-sans selection:bg-white/30">
            {/* Cinematic Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, transparent 0%, #000 100%), repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px)' }} />
            
            {/* Massive Background Title */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 opacity-[0.03] flex flex-col items-center leading-none">
                <span className="text-[250px] font-black tracking-tighter text-white">OVER</span>
                <span className="text-[250px] font-black tracking-tighter text-white -mt-32">DRIVE</span>
            </div>

            <div className={`relative z-10 w-full max-w-md transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                
                <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-12 shadow-2xl relative overflow-hidden">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
                    
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 border border-white/20 mb-6 shadow-inner">
                            <KeyRound className="text-white" size={24} />
                        </div>
                        <h2 className="text-4xl font-black tracking-widest text-white uppercase drop-shadow-md">
                            Identity
                        </h2>
                        <p className="text-white/40 font-mono text-xs tracking-widest uppercase mt-3">Awaiting Operator Credentials</p>
                    </div>

                    <div className="flex w-full bg-white/5 p-1 mb-8 border border-white/10">
                        <button type="button" className={`flex-1 py-3 text-xs font-bold tracking-[0.2em] uppercase transition-all ${isLogin ? 'bg-white text-slate-950 shadow-md' : 'text-white/50 hover:text-white'}`} onClick={() => { setIsLogin(true); setError(''); }}>Authenticate</button>
                        <button type="button" className={`flex-1 py-3 text-xs font-bold tracking-[0.2em] uppercase transition-all ${!isLogin ? 'bg-white text-slate-950 shadow-md' : 'text-white/50 hover:text-white'}`} onClick={() => { setIsLogin(false); setError(''); }}>Initialize</button>
                    </div>

                    {sessionMessage && <p role="status" className="mb-6 text-sm text-amber-200">{sessionMessage}</p>}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                            <input type="text" placeholder="Callsign (Username)" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white focus:bg-white/5 transition-all" />
                        </div>
                        
                        {!isLogin && (
                            <div className="relative group animate-fade-in">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                                <input type="email" placeholder="Comms Link (Email)" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white focus:bg-white/5 transition-all" />
                            </div>
                        )}
                        
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={18} />
                            <input type="password" placeholder="Passcode" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 py-4 pl-12 pr-4 text-white font-mono text-sm placeholder:text-white/30 focus:outline-none focus:border-white focus:bg-white/5 transition-all" />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs tracking-widest uppercase p-4 text-center mt-2 animate-pulse">
                                [ERROR] {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="group relative mt-6 w-full bg-white hover:bg-slate-200 text-slate-950 font-black tracking-[0.2em] uppercase py-4 px-6 transition-all disabled:opacity-50 overflow-hidden">
                            <div className="absolute inset-0 bg-black/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                            <div className="relative flex items-center justify-center gap-3">
                                {loading ? <Loader2 className="animate-spin text-slate-950" size={20} /> : (isLogin ? 'Establish Link' : 'Register Operator')}
                            </div>
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
