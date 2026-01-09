import '../styles/globals.css'
import { Providers } from './providers'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <title>Store Management System</title>
                <meta name="description" content="Premium Store Management Solution" />
            </head>
            <body className="antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 min-h-screen" suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
