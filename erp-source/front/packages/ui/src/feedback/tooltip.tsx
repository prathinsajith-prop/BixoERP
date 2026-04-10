'use client';

import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
    /** The tooltip label. */
    content: React.ReactNode;
    /**
     * Must be a single native element (button, a, span, div…).
     * The tooltip attaches its ref + event handlers directly — no wrapper DOM node is added.
     */
    children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
    side?: 'top' | 'bottom' | 'left' | 'right';
    /** Hover delay in ms. Focus shows immediately. Default: 300 */
    delay?: number;
    className?: string;
}

const GAP = 6;
type Phase = 'hidden' | 'measuring' | 'visible';

export function Tooltip({ content, children, side = 'top', delay = 300, className = '' }: TooltipProps) {
    const [phase, setPhase] = useState<Phase>('hidden');
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLElement | null>(null);
    const tooltipRef = useRef<HTMLSpanElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const computePos = useCallback(() => {
        const el = triggerRef.current;
        const tip = tooltipRef.current;
        if (!el || !tip) return;

        const rect = el.getBoundingClientRect();
        const tw = tip.offsetWidth;
        const th = tip.offsetHeight;

        let top = 0;
        let left = 0;

        switch (side) {
            case 'top':
                top = rect.top - th - GAP;
                left = rect.left + rect.width / 2 - tw / 2;
                break;
            case 'bottom':
                top = rect.bottom + GAP;
                left = rect.left + rect.width / 2 - tw / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2 - th / 2;
                left = rect.left - tw - GAP;
                break;
            case 'right':
                top = rect.top + rect.height / 2 - th / 2;
                left = rect.right + GAP;
                break;
        }

        setPos({
            top: Math.max(8, Math.min(top, window.innerHeight - th - 8)),
            left: Math.max(8, Math.min(left, window.innerWidth - tw - 8)),
        });
    }, [side]);

    /**
     * After the tooltip mounts at opacity-0 ('measuring'), run before the next paint:
     * compute its real size + position, then switch to 'visible' so it fades in.
     * useLayoutEffect runs synchronously after DOM mutation but before paint —
     * no flicker, no frame where the user sees position (0,0).
     */
    useLayoutEffect(() => {
        if (phase !== 'measuring') return;
        computePos();
        setPhase('visible');
    }, [phase, computePos]);

    // Clear pending timer on unmount
    useEffect(() => () => clearTimeout(timerRef.current), []);

    const show = useCallback(() => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setPhase('measuring'), delay);
    }, [delay]);

    const showNow = useCallback(() => {
        clearTimeout(timerRef.current);
        setPhase('measuring');
    }, []);

    const hide = useCallback(() => {
        clearTimeout(timerRef.current);
        setPhase('hidden');
    }, []);

    // Attach ref + event handlers directly to the child — no extra wrapper DOM node.
    // This preserves position: absolute, flex-item sizing, and group-hover visibility.
    const setRef = useCallback((node: HTMLElement | null) => { triggerRef.current = node; }, []);

    const child = React.Children.only(children) as React.ReactElement<
        React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }
    >;
    const cloned = React.cloneElement(child, {
        ref: setRef,
        onMouseEnter(e) { child.props.onMouseEnter?.(e); show(); },
        onMouseLeave(e) { child.props.onMouseLeave?.(e); hide(); },
        // Keyboard users get immediate display — no delay
        onFocus(e) { child.props.onFocus?.(e as React.FocusEvent<HTMLElement>); showNow(); },
        onBlur(e) { child.props.onBlur?.(e as React.FocusEvent<HTMLElement>); hide(); },
    });

    return (
        <>
            {cloned}
            {phase !== 'hidden' && createPortal(
                <span
                    ref={tooltipRef}
                    role="tooltip"
                    style={{
                        position: 'fixed',
                        top: pos.top,
                        left: pos.left,
                        zIndex: 9999,
                        pointerEvents: 'none',
                        backgroundColor: 'var(--gogo-surface)',
                        border: '1px solid var(--gogo-divider)',
                        color: 'var(--gogo-text-primary)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        borderRadius: 'var(--radius-button, 6px)',
                        opacity: phase === 'visible' ? 1 : 0,
                        transition: 'opacity 0.12s ease',
                    }}
                    className={`whitespace-nowrap px-2.5 py-1 text-xs font-medium leading-5 ${className}`}
                >
                    {content}
                </span>,
                document.body,
            )}
        </>
    );
}
