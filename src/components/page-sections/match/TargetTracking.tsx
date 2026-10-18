import { useEffect, useRef } from 'react';

import { projectTargetFrame } from '../../../game/match/TargetFrame';
import './combat-feedback.css';

/** Camera-synchronous target frame without re-rendering the entire match HUD. */
export function TargetTracking({ engineRef }: { engineRef: React.RefObject<any> }) {
    const frameRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        let request = 0;
        const update = () => {
            const engine = engineRef.current;
            const element = frameRef.current;
            if (element) {
                const target = engine?.getTargetedHostile();
                const canvas = engine?.scene.getEngine().getRenderingCanvas();
                const frame = target && engine && canvas ? projectTargetFrame(target.mesh, (x, y, z) => engine.projectToScreen(x, y, z), canvas.clientWidth, canvas.clientHeight, target.locked) : null;
                element.hidden = !frame;
                if (frame) {
                    element.style.transform = `translate3d(${frame.x}px, ${frame.y}px, 0)`;
                    element.style.width = `${frame.width}px`;
                    element.style.height = `${frame.height}px`;
                    element.dataset.locked = String(frame.locked);
                    const ready = frame.locked && target.ready;
                    element.dataset.ready = String(Boolean(ready));
                    const label = element.querySelector('span');
                    if (label) label.textContent = ready ? 'FIRE · SPACE / FIRE BUTTON' : frame.locked ? 'LOCKED · PREPARING' : 'ACQUIRING';
                }
            }
            request = requestAnimationFrame(update);
        };
        request = requestAnimationFrame(update);
        return () => cancelAnimationFrame(request);
    }, [engineRef]);
    return <div ref={frameRef} hidden className="target-tracking" aria-hidden="true"><i /><i /><i /><i /><span /></div>;
}
