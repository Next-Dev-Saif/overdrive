interface Props {
    vehicleId: string;
    ability: string;
}

export function VehicleAbilityGraphic({ vehicleId }: Props) {
    switch (vehicleId) {
        case 'interceptor':
            return (
                <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Lightning Strike Ability">
                    <defs>
                        <linearGradient id="bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="35%" stopColor="#fef08a" />
                            <stop offset="70%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                            <stop offset="50%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                        </linearGradient>
                        <radialGradient id="burst-halo" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="60" cy="50" r="42" fill="url(#burst-halo)" />
                    <path d="M28 32 L40 50 L28 68" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                    <path d="M18 36 L28 50 L18 64" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                    <path d="M92 32 L80 50 L92 68" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                    <path d="M102 36 L92 50 L102 64" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                    <circle cx="60" cy="50" r="28" stroke="url(#arc-grad)" strokeWidth="1.5" strokeDasharray="6 4" />
                    <path d="M64 12 L44 46 L58 46 L50 88 L78 48 L64 48 L76 12 Z" fill="url(#bolt-grad)" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M48 30 L40 24 M42 40 L34 42 M74 60 L84 62 M68 72 L78 78" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="60" cy="46" r="3" fill="#ffffff" />
                </svg>
            );

        case 'juggernaut':
            return (
                <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Kinetic Shockwave Ability">
                    <defs>
                        <linearGradient id="ram-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fca5a5" />
                            <stop offset="40%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#991b1b" />
                        </linearGradient>
                        <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                            <stop offset="50%" stopColor="#f97316" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                        </linearGradient>
                        <radialGradient id="impact-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="60" cy="50" r="44" fill="url(#impact-glow)" />
                    <path d="M22 28 C34 16, 86 16, 98 28" stroke="url(#wave-grad-1)" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M14 42 C24 24, 96 24, 106 42" stroke="url(#wave-grad-1)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                    <path d="M22 72 C34 84, 86 84, 98 72" stroke="url(#wave-grad-1)" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M14 58 C24 76, 96 76, 106 58" stroke="url(#wave-grad-1)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                    <path d="M20 50 L34 50 M86 50 L100 50" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M32 30 L42 38 M88 30 L78 38 M32 70 L42 62 M88 70 L78 62" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                    <polygon points="60,24 78,42 70,72 50,72 42,42" fill="url(#ram-grad)" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
                    <polygon points="60,34 70,46 66,64 54,64 50,46" fill="#7f1d1d" stroke="#fca5a5" strokeWidth="1" />
                    <circle cx="60" cy="48" r="4" fill="#ffffff" />
                </svg>
            );

        case 'phantom':
            return (
                <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Optical Camouflage Ability">
                    <defs>
                        <linearGradient id="cloak-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#67e8f9" />
                            <stop offset="60%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                        <radialGradient id="ghost-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="60" cy="50" r="42" fill="url(#ghost-glow)" />
                    <polygon points="60,18 74,26 74,42 60,50 46,42 46,26" stroke="#06b6d4" strokeWidth="1.5" fill="#06b6d4" fillOpacity="0.12" strokeDasharray="3 2" />
                    <polygon points="76,44 90,52 90,68 76,76 62,68 62,52" stroke="#06b6d4" strokeWidth="1.2" fill="#06b6d4" fillOpacity="0.08" opacity="0.7" />
                    <polygon points="44,44 58,52 58,68 44,76 30,68 30,52" stroke="#06b6d4" strokeWidth="1.2" fill="#06b6d4" fillOpacity="0.08" opacity="0.7" />
                    <path d="M36 50 C44 38, 76 38, 84 50 C76 62, 44 62, 36 50 Z" stroke="url(#cloak-cyan)" strokeWidth="2" fill="none" />
                    <circle cx="60" cy="50" r="9" stroke="#38bdf8" strokeWidth="1.5" fill="#082f49" />
                    <circle cx="60" cy="50" r="4" fill="#67e8f9" />
                    <line x1="20" y1="50" x2="32" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="88" y1="50" x2="100" y2="50" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="26" y1="38" x2="38" y2="38" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                    <line x1="82" y1="62" x2="94" y2="62" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                </svg>
            );

        case 'manticore':
            return (
                <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="EMP Burst Ability">
                    <defs>
                        <radialGradient id="emp-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
                            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#e0f2fe" />
                            <stop offset="50%" stopColor="#00f0ff" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                    </defs>
                    <circle cx="60" cy="50" r="44" fill="url(#emp-glow)" />
                    <circle cx="60" cy="50" r="36" stroke="url(#ring-grad)" strokeWidth="2" strokeDasharray="10 6 4 6" />
                    <circle cx="60" cy="50" r="24" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="5 3" />
                    <path d="M60 10 L60 22 M60 78 L60 90 M20 50 L32 50 M88 50 L100 50" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M32 22 L40 30 M80 70 L88 78 M32 78 L40 70 M80 30 L88 22" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="60" cy="50" r="13" fill="#0c4a6e" stroke="#00f0ff" strokeWidth="2" />
                    <path d="M54 44 L66 56 M66 44 L54 56" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="60" cy="50" r="4" fill="#ffffff" />
                </svg>
            );

        case 'valkyrie':
            return (
                <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Afterburner Dash Ability">
                    <defs>
                        <linearGradient id="jet-flame" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="25%" stopColor="#fef08a" />
                            <stop offset="55%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <radialGradient id="afterburner-glow" cx="50%" cy="30%" r="60%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <ellipse cx="60" cy="55" rx="38" ry="40" fill="url(#afterburner-glow)" />
                    <path d="M60 14 L82 38 L60 32 L38 38 Z" fill="#383c44" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round" />
                    <line x1="22" y1="20" x2="22" y2="70" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" />
                    <line x1="98" y1="20" x2="98" y2="70" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" />
                    <line x1="12" y1="30" x2="12" y2="60" stroke="#f59e0b" strokeWidth="1" strokeDasharray="6 8" opacity="0.3" />
                    <line x1="108" y1="30" x2="108" y2="60" stroke="#f59e0b" strokeWidth="1" strokeDasharray="6 8" opacity="0.3" />
                    <rect x="42" y="32" width="12" height="10" rx="2" fill="#1e293b" stroke="#e2e8f0" strokeWidth="1.2" />
                    <rect x="66" y="32" width="12" height="10" rx="2" fill="#1e293b" stroke="#e2e8f0" strokeWidth="1.2" />
                    <path d="M44 42 Q48 78, 48 88 Q48 78, 52 42 Z" fill="url(#jet-flame)" />
                    <path d="M68 42 Q72 78, 72 88 Q72 78, 76 42 Z" fill="url(#jet-flame)" />
                    <polygon points="48,50 51,55 48,60 45,55" fill="#ffffff" />
                    <polygon points="48,64 50,68 48,72 46,68" fill="#ffffff" />
                    <polygon points="72,50 75,55 72,60 69,55" fill="#ffffff" />
                    <polygon points="72,64 74,68 72,72 70,68" fill="#ffffff" />
                </svg>
            );

        case 'wraith':
            return (
                <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Grav-Pulse Ability">
                    <defs>
                        <linearGradient id="grav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f472b6" />
                            <stop offset="50%" stopColor="#c084fc" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                        <radialGradient id="grav-singularity" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="60" cy="50" r="42" fill="url(#grav-singularity)" />
                    <ellipse cx="60" cy="50" rx="44" ry="16" stroke="url(#grav-grad)" strokeWidth="1.8" strokeDasharray="8 4" transform="rotate(-15 60 50)" />
                    <ellipse cx="60" cy="50" rx="34" ry="12" stroke="#c084fc" strokeWidth="2" transform="rotate(15 60 50)" />
                    <ellipse cx="60" cy="50" rx="22" ry="8" stroke="#38bdf8" strokeWidth="1.5" />
                    <path d="M50 30 L60 20 L70 30" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M53 74 L60 66 L67 74" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                    <path d="M55 84 L60 78 L65 84" stroke="#a855f7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                    <circle cx="60" cy="50" r="10" fill="#3b0764" stroke="#e879f9" strokeWidth="1.8" />
                    <circle cx="60" cy="50" r="5" fill="#ffffff" />
                </svg>
            );

        case 'behemoth':
        default:
            return (
                <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Aegis Dome Ability">
                    <defs>
                        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="50%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                        <radialGradient id="aegis-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="60" cy="48" r="42" fill="url(#aegis-glow)" />
                    <path d="M20 74 C20 34, 100 34, 100 74 Z" stroke="url(#shield-grad)" strokeWidth="2.5" fill="#10b981" fillOpacity="0.08" strokeLinejoin="round" />
                    <path d="M28 74 C28 42, 92 42, 92 74" stroke="#34d399" strokeWidth="1.8" strokeDasharray="6 3" fill="none" />
                    <polygon points="60,32 70,38 70,50 60,56 50,50 50,38" stroke="#6ee7b7" strokeWidth="1.5" fill="#065f46" fillOpacity="0.4" />
                    <polygon points="76,46 84,51 84,61 76,66 68,61 68,51" stroke="#34d399" strokeWidth="1.2" fill="#065f46" fillOpacity="0.25" opacity="0.8" />
                    <polygon points="44,46 52,51 52,61 44,66 36,61 36,51" stroke="#34d399" strokeWidth="1.2" fill="#065f46" fillOpacity="0.25" opacity="0.8" />
                    <path d="M60 40 L66 45 L66 58 L60 63 L54 58 L54 45 Z" fill="#34d399" stroke="#ffffff" strokeWidth="1" />
                    <line x1="16" y1="74" x2="104" y2="74" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="60" cy="51" r="3" fill="#ffffff" />
                </svg>
            );
    }
}
