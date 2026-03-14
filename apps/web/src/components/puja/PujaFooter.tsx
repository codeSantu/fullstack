export function PujaFooter(props: { locations: string[] }) {
    return (
        <footer>
            <p className="footer-text">
                {props.locations.map((loc, idx) => (
                    <span key={loc} className="footer-highlight">
                        {loc}
                        {idx < props.locations.length - 1 ? ' +' : ''}
                    </span>
                ))}
            </p>
            <div style={{ marginTop: '10px' }}></div>
            <img src="/favicon-192x192-rbg.png" alt="Logo" width={192} style={{ display: "block", margin: "0 auto" }} />
        </footer>
    );
}

