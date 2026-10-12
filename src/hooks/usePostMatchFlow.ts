import { useEffect, useRef, useState, type RefObject } from 'react';
import { getPostMatchFrame, OUTCOME_DURATION_MS } from '../game/match/PostMatchTimeline';
import type { GameEngine } from '../game/engine/GameEngine';
import type { MatchFoundPayload, MatchResult, MatchSnapshot } from '../../shared/match';

type PostPhase = 'none' | 'outcome' | 'mvp' | 'leaderboard';

/** Runs each post-match phase once and preserves the final roster/result through lobby return. */
export function usePostMatchFlow(engineRef: RefObject<GameEngine | null>, roomData: MatchFoundPayload | undefined,
    started: RefObject<number>, onBack: (seconds?: number, result?: MatchResult) => void) {
    const [postPhase, setPostPhase] = useState<PostPhase>('none');
    const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
    const [countdown, setCountdown] = useState(10);
    const finished = useRef(false);
    const resultRef = useRef<MatchResult | null>(null);
    const returned = useRef(false);
    const seconds = useRef(0);
    const onBackRef = useRef(onBack);
    useEffect(() => { onBackRef.current = onBack; }, [onBack]);

    useEffect(() => {
        const handleMatchEnd = (event: Event) => {
            const finalSnapshot = (event as CustomEvent<MatchSnapshot>).detail;
            if (finished.current || !finalSnapshot?.winner || !roomData || finalSnapshot.matchId !== roomData.matchId) return;
            finished.current = true;
            resultRef.current = { winner: finalSnapshot.winner, localTeam: roomData.localMember.teamId, scores: finalSnapshot.scores };
            seconds.current = started.current ? Math.floor((performance.now() - started.current) / 1000) : 0;
            setSnapshot(finalSnapshot);
            setPostPhase('outcome');
        };
        window.addEventListener('match-end', handleMatchEnd);
        return () => window.removeEventListener('match-end', handleMatchEnd);
    }, [roomData, started]);

    const matchResult: MatchResult | null = snapshot?.winner && roomData
        ? { winner: snapshot.winner, localTeam: roomData.localMember.teamId, scores: snapshot.scores } : null;
    // Match snapshots do not contain individual scores: retain the existing winning-team representative policy.
    const mvpMember = snapshot?.roster.find(member => member.connected && member.teamId === snapshot.winner)
        ?? snapshot?.roster.find(member => member.entityId === roomData?.localMember.entityId);

    const returnToLobby = () => {
        if (returned.current) return;
        returned.current = true;
        onBackRef.current(seconds.current, resultRef.current ?? undefined);
    };

    useEffect(() => {
        if (!snapshot) return;
        const began = performance.now();
        let attempted = false;
        let hasShowcase = true;
        const timer = setInterval(() => {
            const elapsed = performance.now() - began;
            if (!attempted && elapsed >= OUTCOME_DURATION_MS) {
                attempted = true;
                hasShowcase = engineRef.current?.startMvpShowcase(mvpMember?.entityId) ?? false;
            }
            const frame = getPostMatchFrame(elapsed, hasShowcase);
            setPostPhase(frame.phase);
            setCountdown(frame.countdown);
            if (frame.complete && !returned.current) {
                returned.current = true;
                onBackRef.current(seconds.current, resultRef.current ?? undefined);
            }
        }, 250);
        return () => clearInterval(timer);
    }, [snapshot, engineRef, mvpMember?.entityId]);

    return { postPhase, matchResult, mvpMember, countdown, returnToLobby, roster: snapshot?.roster ?? [] };
}
