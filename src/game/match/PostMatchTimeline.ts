export type PostMatchPhase = 'outcome' | 'mvp' | 'leaderboard';
export const OUTCOME_DURATION_MS = 4000;
const MVP_DURATION_MS = 7000;
const RESULTS_DURATION_MS = 10000;

/** Absolute elapsed time keeps the sequence/countdown correct after a delayed or backgrounded frame. */
export function getPostMatchFrame(elapsedMs: number, hasShowcase: boolean): { phase: PostMatchPhase; countdown: number; complete: boolean } {
    if (elapsedMs < OUTCOME_DURATION_MS) return { phase: 'outcome', countdown: 10, complete: false };
    const resultsStart = OUTCOME_DURATION_MS + (hasShowcase ? MVP_DURATION_MS : 0);
    if (elapsedMs < resultsStart) return { phase: 'mvp', countdown: 10, complete: false };
    const remaining = Math.max(0, resultsStart + RESULTS_DURATION_MS - elapsedMs);
    return { phase: 'leaderboard', countdown: Math.ceil(remaining / 1000), complete: remaining === 0 };
}
