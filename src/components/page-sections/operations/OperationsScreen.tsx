import { useMenuSection } from '../../../hooks/useMenuSection';
import { Archive, ArrowUpRight, LockKeyhole, User, Bell, Trophy, Wrench } from 'lucide-react';
import { GarageRenderer } from '../../ui/GarageRenderer';
import { ScreenShell } from './ScreenShell';
import { vehicles, weapons } from '../../../data/catalog';
const sections = ['Profile', 'Inventory', 'Parts', 'Customization', 'Missions', 'Leaderboard', 'Matchmaking', 'Private lobby', 'Notifications', 'Unlocks', 'Rewards'] as const;
type Section = typeof sections[number];
const unavailable: Partial<Record<Section, [string, string]>> = {
    Parts: ['No parts in storage', 'Parts collection and installation will appear here when progression is available.'],
    Customization: ['Factory finish', 'The current chassis uses its factory paint and bodywork. Paint, decals and cosmetic editing are not available yet.'],
    Missions: ['No active contracts', 'Mission tracking and reward claims are not available in this build. You can still enter an open combat session.'],
    Leaderboard: ['No ranked standings', 'Ranked matches and verified score reporting are not connected.'],
    Matchmaking: ['Matchmaking unavailable', 'This build connects to its configured game server directly. A queue and match-found flow are not available.'],
    'Private lobby': ['Private sessions unavailable', 'Room codes, invitations and private matchmaking are not connected.'],
    Notifications: ['You’re all caught up', 'There are no stored notifications for this local driver.'],
    Unlocks: ['Prototype collection available', 'All seven chassis and five weapons are available to equip. Progression-based unlocks are not enabled.'],
    Rewards: ['No rewards to claim', 'Credits, XP and parts are not awarded by the current session system.'],
};
/** Reachable supporting screens with truthful empty and unavailable states. */
export function OperationsScreen({ initialSection = 'Profile', vehicleId, weaponId, vehicleColor, onBack, onGarage, onPlay }: { initialSection?: Section; vehicleId: string; weaponId: string; vehicleColor?: string; onBack: () => void; onGarage: () => void; onPlay: () => void }) {
    const [section, setSection] = useMenuSection('section', sections, initialSection);
    const content = unavailable[section];
    return <ScreenShell title="Driver operations." eyebrow="LOCAL PROFILE / RECORDS" onBack={onBack}><div className="operations-layout"><nav className="section-nav" aria-label="Driver operations">{sections.map(s => <button key={s} aria-current={section === s ? 'page' : undefined} onClick={() => setSection(s)}>{s}<ArrowUpRight size={15} /></button>)}</nav><section className="operations-content" aria-label={section}>
        {section === 'Profile' && <><div className="driver-emblem"><User size={48} strokeWidth={1} /></div><p className="eyebrow">LOCAL DRIVER</p><h2>Your next run starts here.</h2><p>Equipment selections apply to your next session. Competitive records and account progression are not connected yet.</p><dl className="briefing-list"><div><dt>Active chassis</dt><dd>{vehicleId}</dd></div><div><dt>Mounted weapon</dt><dd>{weaponId}</dd></div><div><dt>Driver status</dt><dd>Prototype access</dd></div></dl><button className="od-button primary" onClick={onGarage}>Inspect loadout <Wrench size={18} /></button></>}
        {section === 'Inventory' && <><p className="eyebrow">AVAILABLE COLLECTION</p><h2>Built for the arena.</h2><p>All prototype equipment is available. Equip a chassis and weapon in the garage.</p><div className="inventory-grid">{[...vehicles, ...weapons].map(item => <div key={item.id}><Archive size={20} /><strong>{item.name}</strong><span>{item.role}</span><small>{item.id === vehicleId || item.id === weaponId ? 'Equipped' : 'Available'}</small></div>)}</div><button className="od-button primary" onClick={onGarage}>Open garage <ArrowUpRight size={18} /></button></>}
        {section === 'Customization' && <div className="customization-preview"><GarageRenderer vehicleId={vehicleId} weaponId={weaponId} vehicleColor={vehicleColor} /><div className="segmented" aria-label="Unavailable customization categories">{['Paint', 'Wheels', 'Decals', 'Body'].map(category => <button key={category} disabled>{category}</button>)}</div></div>}
        {content && <div className="empty-state">{section === 'Notifications' ? <Bell size={40} /> : section === 'Rewards' ? <Trophy size={40} /> : <LockKeyhole size={40} />}<p className="eyebrow">{section}</p><h2>{content[0]}</h2><p>{content[1]}</p><button className="od-button primary" onClick={['Parts', 'Customization', 'Unlocks'].includes(section) ? onGarage : onPlay}>{['Parts', 'Customization', 'Unlocks'].includes(section) ? 'Inspect available equipment' : 'Enter the arena'}<ArrowUpRight size={18} /></button></div>}
    </section></div></ScreenShell>;
}
