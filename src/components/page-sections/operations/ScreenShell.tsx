import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

/** Consistent heading focus and navigation for full-screen menu destinations. */
export function ScreenShell({ title, eyebrow, onBack, children, actions }: { title: string; eyebrow: string; onBack: () => void; children: ReactNode; actions?: ReactNode }) {
    const heading = useRef<HTMLHeadingElement>(null);
    useEffect(() => { heading.current?.focus(); }, [title]);
    return <main className="screen-shell"><header className="screen-header"><button className="od-button secondary" onClick={onBack}><ArrowLeft size={18} /> Back</button><span className="wordmark">OD<span>/</span> OVERDRIVE</span></header><div className="screen-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1 ref={heading} tabIndex={-1}>{title}</h1></div>{actions}</div>{children}</main>;
}
