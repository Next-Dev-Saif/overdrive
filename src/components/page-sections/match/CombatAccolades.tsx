import { Crosshair, Skull } from 'lucide-react';
import './combat-feedback.css';

export interface CombatMedal { id: string; text: string; time: number }

/** Unboxed combat acknowledgement: insignia, display title and quiet reward line. */
export function CombatAccolades({ medals, now, confirmed, confirmationId }: { medals: CombatMedal[]; now: number; confirmed: boolean; confirmationId: number }) {
    const medal = medals.findLast(item => now - item.time < 3000);
    return <div className="combat-accolades" role="status" aria-live="polite" aria-atomic="true">
        {medal ? <div key={medal.id} className="combat-accolade" style={{ opacity: Math.min(1, (3000 - (now - medal.time)) / 400) }}>
            <div className="combat-accolade__insignia" aria-hidden="true"><span /><Crosshair size={32} strokeWidth={1.5} /><span /></div>
            <strong>{medal.text}</strong>
            <span className="combat-accolade__reward">+100 XP</span>
        </div> : confirmed ? <div key={confirmationId} className="combat-confirmation"><Skull size={20} aria-hidden="true" /><strong>TARGET DESTROYED</strong><span>+100</span></div> : null}
    </div>;
}
