export const metadata = {
    title: 'DW Agent Core',
    description: 'Marketing Cognition & Scan Engine',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
