import type { TeamId } from '../../../../shared/match';
import './vehicle-systems.css';

/** A single top-center score line leaves both sides of the driving view open. */
export function MatchStrip({ scores, seconds, limit, team, ended }: { scores: Record<TeamId, number>; seconds: number; limit: number; team: TeamId | null; ended: boolean }) {
    const remaining = Math.max(0, Math.ceil(seconds));
    return <section className="match-strip" aria-label="Match score and time">
        <div className="match-strip__team" data-local={team === 'alpha'}><span>TEAM 1 {team === 'alpha' && <small>YOU</small>}</span><strong aria-label={`Team 1: ${scores.alpha} kills`}>{String(scores.alpha).padStart(2, '0')}</strong></div>
        <div className="match-strip__clock" data-urgent={remaining < 60 && !ended}><time>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</time><span>{ended ? 'COMPLETE' : remaining < 60 ? 'FINAL MINUTE' : `FIRST TO ${limit}`}</span></div>
        <div className="match-strip__team" data-local={team === 'bravo'}><strong aria-label={`Team 2: ${scores.bravo} kills`}>{String(scores.bravo).padStart(2, '0')}</strong><span>TEAM 2 {team === 'bravo' && <small>YOU</small>}</span></div>
    </section>;
}
