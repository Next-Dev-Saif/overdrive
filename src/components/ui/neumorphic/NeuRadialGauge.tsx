import type { ReactNode } from 'react';
interface NeuRadialGaugeProps { value: number; size?: number; strokeWidth?: number; icon?: ReactNode; label?: string; color?: string; className?: string }
/** Compact combat meter; preserves existing HUD bindings without a large dashboard-style dial. */
export function NeuRadialGauge({ value, label, color = 'var(--color-neu-accent)', className = '' }: NeuRadialGaugeProps) {
    const percentage = Math.round(Math.max(0, Math.min(1, value)) * 100);
    return <div className={`combat-meter ${className}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div><span>{label}</span><strong>{percentage}%</strong></div><div className="combat-meter-track"><span style={{ width: `${percentage}%`, background: color }} /></div></div>;
}
