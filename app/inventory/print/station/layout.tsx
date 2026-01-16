
export default function StationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="station-layout">
            {/* Reuse the print styles from bodega layout specifically for the label part? 
            Actually we can just include the style block here too. 
        */}
            <style>{`
        @media print {
            @page {
                size: 62mm 100mm;
                margin: 0;
            }
            html, body {
                width: 62mm;
                height: 100mm;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden;
            }
            /* Hide the UI, show the label */
        }
      `}</style>

            {/* Set title empty for clean headers */}
            <script dangerouslySetInnerHTML={{ __html: `document.title = '';` }} />

            {children}
        </div>
    );
}
