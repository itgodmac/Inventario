import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "RIPODOO - Next Generation ERP",
    description: "Advanced ERP System built with Next.js, featuring modern architecture and seamless workflows",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
