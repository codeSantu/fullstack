export function canUseNativePopover(el: any): el is HTMLElement & { showPopover: () => void; hidePopover: () => void } {
    return !!el && typeof el.showPopover === 'function' && typeof el.hidePopover === 'function';
}

function ensureBackdrop(): HTMLDivElement {
    let backdrop = document.querySelector<HTMLDivElement>('[data-puja-popover-backdrop="true"]');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.setAttribute('data-puja-popover-backdrop', 'true');
    backdrop.className = 'puja-popover-backdrop';
    backdrop.addEventListener('click', () => {
        document.querySelectorAll<HTMLElement>('[popover].fallback-popover-open').forEach((p) => {
            p.classList.remove('fallback-popover-open');
        });
        backdrop?.classList.remove('is-open');
    });
    document.body.appendChild(backdrop);
    return backdrop;
}

export function togglePopoverById(id: string) {
    const el = document.getElementById(id) as any;
    if (!el) return;

    if (canUseNativePopover(el)) {
        if (el.matches?.(':popover-open')) el.hidePopover();
        else el.showPopover();
        return;
    }

    const backdrop = ensureBackdrop();
    const isOpen = el.classList.contains('fallback-popover-open');
    document.querySelectorAll<HTMLElement>('[popover].fallback-popover-open').forEach((p) => {
        p.classList.remove('fallback-popover-open');
    });
    if (!isOpen) {
        el.classList.add('fallback-popover-open');
        backdrop.classList.add('is-open');
    } else {
        backdrop.classList.remove('is-open');
    }
}

export function hidePopoverById(id: string) {
    const el = document.getElementById(id) as any;
    if (!el) return;

    if (canUseNativePopover(el)) {
        el.hidePopover();
        return;
    }

    el.classList.remove('fallback-popover-open');
    const backdrop = document.querySelector<HTMLDivElement>('[data-puja-popover-backdrop="true"]');
    const anyOpen = document.querySelector<HTMLElement>('[popover].fallback-popover-open');
    if (!anyOpen) backdrop?.classList.remove('is-open');
}

