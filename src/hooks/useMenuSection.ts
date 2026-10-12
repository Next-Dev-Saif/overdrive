import { useEffect, useState } from 'react';

/** Shareable menu tabs stay in URL state; drafts and temporary previews remain component-local. */
export function useMenuSection<T extends string>(key: string, choices: readonly T[], fallback: T) {
    const read = () => {
        const value = new URLSearchParams(location.search).get(key) as T;
        return choices.includes(value) ? value : fallback;
    };
    const [section, setSection] = useState<T>(read);
    useEffect(() => {
        const update = () => setSection(read());
        window.addEventListener('popstate', update);
        return () => window.removeEventListener('popstate', update);
        // The finite choices and fallback are fixed for the lifetime of each screen.
        // oxlint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    const select = (value: T) => {
        const url = new URL(location.href); url.searchParams.set(key, value);
        history.replaceState(null, '', url);
        setSection(value);
    };
    return [section, select] as const;
}
