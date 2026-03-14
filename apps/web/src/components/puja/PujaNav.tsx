export function PujaNav(props: {
    isAdmin?: boolean;
    isMember?: boolean;
    onOpenSchedule: () => void;
    onOpenCommittee: () => void;
    onOpenAdmin: () => void;
    onOpenMember: () => void;
}) {
    return (
        <nav className="nav-orbs">
            <button
                className="orb-button orb-1"
                type="button"
                onClick={props.onOpenSchedule}
            >
                <span>
                    <i>🌺</i>
                    {'বিবরণ'}
                </span>
            </button>
            <button
                className="orb-button orb-2"
                type="button"
                onClick={props.onOpenCommittee}
            >
                <span>
                    <i>🌼</i>
                    পূজা কমিটি
                </span>
            </button>
            <button
                className="orb-button orb-3"
                type="button"
                onClick={props.onOpenAdmin}
            >
                <span>
                    <i>{props.isAdmin ? '🔓' : '🔒'}</i>
                    {props.isAdmin ? 'অ্যাডমিন প্যানেল' : 'অ্যাডমিন'}
                </span>
            </button>
            <button
                className="orb-button orb-4"
                type="button"
                onClick={props.onOpenMember}
            >
                <span>
                    <i>{props.isMember ? '🔓' : '🔒'}</i>
                    সদস্য
                </span>
            </button>
        </nav>
    );
}
