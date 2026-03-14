'use client';

import type { ReactNode } from 'react';

export function PujaPopover(props: {
    open: boolean;
    onClose: () => void;
    accentLogo: string;
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    if (!props.open) return null;

    return (
        <div className="puja-popover-overlay" role="dialog" aria-modal="true">
            <div className="popover-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <button
                    className="close-btn"
                    type="button"
                    onClick={props.onClose}
                    aria-label="Close"
                >
                    ✕
                </button>

                <div className="command-header">
                    <div className="command-logo">{props.accentLogo}</div>
                    <div>
                        <h2 className="command-title">{props.title}</h2>
                        <p className="command-subtitle">{props.subtitle}</p>
                    </div>
                </div>

                {props.children}
            </div>
        </div>
    );
}

