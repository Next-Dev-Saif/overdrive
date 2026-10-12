import { useState } from 'react';
import { ArrowLeft, Check, Wrench } from 'lucide-react';
import { useMenuSection } from '../../hooks/useMenuSection';
import { GarageRenderer } from './GarageRenderer';
import { GarageSelection } from '../page-sections/garage/GarageSelection';
import { GarageDetails } from '../page-sections/garage/GarageDetails';
import { vehicles, weapons } from '../../data/catalog';
import '../page-sections/garage/garage.css';

interface GarageScreenProps {
    equippedVehicle: string;
    onEquip: (id: string) => void;
    equippedWeapon: string;
    onEquipWeapon: (id: string) => void;
    vehicleColor: string;
    onColorChange: (color: string) => void;
    onBack: () => void;
    initialTab?: 'vehicles' | 'weapons' | 'paint';
}

/** A vehicle-first game menu: browse, inspect, then commit the selected loadout. */
export function GarageScreen({ equippedVehicle, onEquip, equippedWeapon, onEquipWeapon, vehicleColor, onColorChange, onBack, initialTab = 'vehicles' }: GarageScreenProps) {
    const [tab, setTab] = useMenuSection('equipment', ['vehicles', 'weapons', 'paint'] as const, initialTab);
    const [vehicleId, setVehicleId] = useState(equippedVehicle);
    const [weaponId, setWeaponId] = useState(equippedWeapon);
    const vehicle = vehicles.find(item => item.id === vehicleId) ?? vehicles[0];
    const weapon = weapons.find(item => item.id === weaponId) ?? weapons[0];
    const equipped = vehicle.id === equippedVehicle && weapon.id === equippedWeapon;

    return <main className="garage-screen">
        <header className="garage-header">
            <button className="garage-back" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /><span>Back</span></button>
            <div className="garage-title"><span>Selected loadout</span><h1>Garage</h1></div>
        </header>
        <nav className="garage-categories" aria-label="Garage category">
            {(['vehicles', 'weapons', 'paint'] as const).map((category, index) => <button key={category} aria-pressed={tab === category} onClick={() => setTab(category)}>
                <span aria-hidden="true">0{index + 1}</span>{category === 'vehicles' ? 'Vehicles' : category === 'weapons' ? 'Weapons' : 'Paint'}
            </button>)}
        </nav>
        <div className="garage-workspace">
            <GarageSelection category={tab} vehicleId={vehicle.id} weaponId={weapon.id} equippedVehicle={equippedVehicle} equippedWeapon={equippedWeapon} color={vehicleColor} onVehicle={setVehicleId} onWeapon={setWeaponId} onColor={onColorChange} />
            <section className="garage-vehicle-bay" aria-label="Vehicle inspection">
                <div className="garage-bay-heading"><span>{vehicle.name}</span><span>{equipped ? 'Current loadout' : 'Preview'}</span></div>
                <GarageRenderer vehicleId={vehicle.id} weaponId={weapon.id} vehicleColor={vehicleColor} environment="garage" />
            </section>
            <GarageDetails category={tab} vehicle={vehicle} weapon={weapon} color={vehicleColor} />
        </div>
        <footer className="garage-footer">
            <div className="garage-loadout-summary"><span>Selected loadout</span><strong>{vehicle.name}<span aria-hidden="true"> / </span>{weapon.name}</strong></div>
            <p className="garage-save-status" role="status">{equipped ? <><Check size={16} aria-hidden="true" />Loadout equipped</> : 'Previewing changes'}</p>
            <button className="garage-equip" disabled={equipped} onClick={() => { onEquip(vehicle.id); onEquipWeapon(weapon.id); }}>
                {equipped ? <Check size={18} aria-hidden="true" /> : <Wrench size={18} aria-hidden="true" />}{equipped ? 'Equipped' : 'Equip loadout'}
            </button>
        </footer>
    </main>;
}
