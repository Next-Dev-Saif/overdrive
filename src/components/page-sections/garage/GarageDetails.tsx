import { vehicles, weapons } from '../../../data/catalog';
import type { GarageCategory } from './GarageSelection';

interface Props { category: GarageCategory; vehicle: typeof vehicles[number]; weapon: typeof weapons[number]; color: string; }

/** Catalog facts use readable values rather than invented performance ratings. */
export function GarageDetails({ category, vehicle, weapon, color }: Props) {
    const specs = category === 'weapons'
        ? [['Damage', String(weapon.damage)], ['Range', `${weapon.range} m`], ['Fire interval', `${weapon.interval} ms`], ['Ammunition', weapon.ammo]]
        : [['Handling', vehicle.handling], ['Mass', vehicle.mass], ['Ability', vehicle.ability]];
    return <section className="garage-details" aria-labelledby="garage-detail-title">
        <p className="garage-kicker">{category === 'weapons' ? weapon.role : category === 'paint' ? 'Paint shop' : vehicle.role}</p>
        <h2 id="garage-detail-title">{category === 'weapons' ? weapon.name : vehicle.name}</h2>
        <p className="garage-description">{category === 'weapons' ? weapon.detail : vehicle.detail}</p>
        {category === 'paint' ? <div className="garage-finish"><span className="garage-finish-sample" style={{ backgroundColor: color }} aria-hidden="true" /><div><span>Body color</span><strong>{color.toUpperCase()}</strong><small>Saved automatically</small></div></div>
            : <dl className="garage-facts">{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        <div className="garage-mounted"><span>{category === 'weapons' ? 'Mounted on' : 'Weapon fitted'}</span><strong>{category === 'weapons' ? vehicle.name : weapon.name}</strong></div>
    </section>;
}
