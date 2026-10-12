const HULLS: Record<string, string> = {
    interceptor: 'M27 12 37 12 43 24 44 59 38 69 26 69 20 59 21 24Z',
    juggernaut: 'M22 10H42L46 23V66L41 72H23L18 66V23Z',
    phantom: 'M26 18H38L44 29V61L39 68H25L20 61V29Z',
    manticore: 'M23 10H41L46 21V64L40 71H24L18 64V21Z',
    valkyrie: 'M25 11H39L45 25V60L39 70H25L19 60V25Z',
    wraith: 'M25 14H39L44 26V60L38 70H26L20 60V26Z',
    behemoth: 'M20 6H44L47 14V72L43 76H21L17 72V14Z',
};

/** Authored overhead silhouettes distinguish the seven selected chassis without external images. */
export function VehicleGlyph({ vehicleId }: { vehicleId: string }) {
    return <svg viewBox="0 0 64 82" className="vehicle-glyph" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M17 24V35M47 24V35M17 54V65M47 54V65" strokeWidth="4" />
        <path d={HULLS[vehicleId] ?? HULLS.interceptor} fill="currentColor" fillOpacity=".08" />
        {vehicleId === 'behemoth' ? <><path d="M21 20H43M23 10H41V17H23ZM27 25H37V68H27ZM27 33H37M27 42H37M27 51H37M27 60H37" /><path d="M16 42V50M48 42V50" strokeWidth="4" /></> : <>
            <path d="M24 30 40 30 38 40H26ZM26 43H38V52H26ZM25 55H39L40 61H24Z" />
            {vehicleId === 'juggernaut' && <path d="M23 43H41V65H23ZM23 49H41" />}
            {vehicleId === 'manticore' && <path d="M23 16H41M24 22H40M22 65H42" strokeWidth="3" />}
            {vehicleId === 'interceptor' && <path d="M26 44H38" strokeWidth="4" />}
            {vehicleId === 'valkyrie' && <path d="M23 65H41M29 15V26M35 15V26" />}
            {vehicleId === 'phantom' && <path d="M24 21H40M23 63H41" />}
            {vehicleId === 'wraith' && <path d="M25 20H39M28 65H36" />}
        </>}
    </svg>;
}
