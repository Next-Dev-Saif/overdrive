import { useEffect, useState } from 'react';
import { Crosshair } from 'lucide-react';
import './hold-fire-button.css';

/** Held trigger with pointer capture so leaving the button cannot leave firing stuck on. */
export function HoldFireButton({ onFiringChange }: { onFiringChange: (held: boolean) => void }) {
    const [held, setHeld] = useState(false);
    const change = (value: boolean) => { setHeld(value); onFiringChange(value); };
    useEffect(() => {
        const release = () => { setHeld(false); onFiringChange(false); };
        window.addEventListener('blur', release);
        document.addEventListener('visibilitychange', release);
        return () => {
            window.removeEventListener('blur', release);
            document.removeEventListener('visibilitychange', release);
            onFiringChange(false);
        };
    }, [onFiringChange]);
    return <button type="button" className="hold-fire-button" aria-label="Hold to fire weapon" aria-pressed={held}
        onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); change(true); }}
        onPointerUp={() => change(false)} onPointerCancel={() => change(false)} onLostPointerCapture={() => change(false)}
        onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); change(true); } }}
        onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') change(false); }} onBlur={() => change(false)}>
        <Crosshair size={24} aria-hidden="true" /><span>Fire</span>
    </button>;
}
