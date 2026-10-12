import { Check, ChevronRight } from 'lucide-react';
import { vehicles, weapons } from '../../../data/catalog';

export type GarageCategory = 'vehicles' | 'weapons' | 'paint';
const PAINTS = [
    ['Red', '#ef4444'], ['Orange', '#f97316'], ['Yellow', '#eab308'], ['Green', '#22c55e'],
    ['Teal', '#2dd4bf'], ['Blue', '#3b82f6'], ['Purple', '#a855f7'], ['Pink', '#ec4899'],
    ['Charcoal', '#1f2937'], ['White', '#f8fafc'],
] as const;

interface Props {
    category: GarageCategory;
    vehicleId: string;
    weaponId: string;
    equippedVehicle: string;
    equippedWeapon: string;
    color: string;
    onVehicle: (id: string) => void;
    onWeapon: (id: string) => void;
    onColor: (color: string) => void;
}

/** Equipment browsing is a preview; paint keeps the existing immediate-save behavior. */
export function GarageSelection({ category, vehicleId, weaponId, equippedVehicle, equippedWeapon, color, onVehicle, onWeapon, onColor }: Props) {
    const items = category === 'vehicles' ? vehicles : weapons;
    return <aside className="garage-inventory" aria-label={category === 'paint' ? 'Paint colors' : `Choose ${category}`}>
        <div className="garage-section-heading"><h2>{category === 'paint' ? 'Paint finishes' : category === 'vehicles' ? 'Your vehicles' : 'Your weapons'}</h2><span>{category === 'paint' ? PAINTS.length : items.length}</span></div>
        {category === 'paint' ? <>
            <p className="garage-inventory-note">Choose a color. Paint changes save automatically.</p>
            <div className="garage-paints">{PAINTS.map(([name, hex]) => <button key={hex} aria-pressed={color.toLowerCase() === hex} onClick={() => onColor(hex)}>
                <span className="garage-paint-chip" style={{ backgroundColor: hex }} aria-hidden="true" />
                <span>{name}</span>{color.toLowerCase() === hex && <Check size={16} aria-hidden="true" />}
            </button>)}</div>
        </> : <div className="garage-equipment-list">{items.map((item, index) => {
            const selected = item.id === (category === 'vehicles' ? vehicleId : weaponId);
            const equipped = item.id === (category === 'vehicles' ? equippedVehicle : equippedWeapon);
            return <button className="garage-equipment-choice" key={item.id} aria-pressed={selected} onClick={() => category === 'vehicles' ? onVehicle(item.id) : onWeapon(item.id)}>
                <span className="garage-choice-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="garage-choice-copy"><strong>{item.name}</strong><small>{equipped ? <><Check size={12} aria-hidden="true" /> Equipped</> : item.role}</small></span>
                {selected && <ChevronRight size={18} aria-hidden="true" />}
            </button>;
        })}</div>}
    </aside>;
}
