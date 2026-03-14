'use client';

import { useEffect, useState } from 'react';

interface InlineEditableTextProps {
    value: string;
    onChange: (next: string) => void;
    isAdmin: boolean;
    className?: string;
    placeholder?: string;
}

export function InlineEditableText({
    value,
    onChange,
    isAdmin,
    className,
    placeholder,
}: InlineEditableTextProps) {
    const [draft, setDraft] = useState(value);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    if (!isAdmin) {
        return <span className={className}>{value}</span>;
    }

    const displayText = draft || placeholder || value;

    const handleBlur = () => {
        setEditing(false);
        const trimmed = draft.trim();
        if (trimmed !== value) {
            onChange(trimmed);
        }
    };

    return (
        <span
            className={['inline-editable', editing ? 'inline-editable--editing' : '', className]
                .filter(Boolean)
                .join(' ')}
            contentEditable
            suppressContentEditableWarning
            onFocus={() => setEditing(true)}
            onBlur={handleBlur}
            onInput={(e) => {
                const next = (e.target as HTMLElement).innerText ?? '';
                setDraft(next);
            }}
            data-placeholder={placeholder}
        >
            {displayText}
        </span>
    );
}

