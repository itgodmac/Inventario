
export default function PrintLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="print-layout bg-white min-h-screen">
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
        }
      `}</style>
            {children}
        </div>
    );
}
