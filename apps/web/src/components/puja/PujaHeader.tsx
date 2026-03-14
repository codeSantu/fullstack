export function PujaHeader(props: {
    title: string;
    subtitle: string;
    statusLine?: string | null;
}) {
    return (
        <header>
            <h1 className="main-title">{props.title}</h1>
            <p className="subtitle">{props.subtitle}</p>
            {props.statusLine ? (
                <p className="command-subtitle" style={{ marginTop: 12 }}>
                    {props.statusLine}
                </p>
            ) : null}
        </header>
    );
}

