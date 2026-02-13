import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'react-hot-toast';
import { ModeToggle } from '@/components/mode-toggle';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Archestra On-Call Agent',
  description: 'AI-powered incident response',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
            <header className="container mx-auto p-4 max-w-5xl flex justify-between items-center border-b border-border/40">
              <div className="flex items-center gap-2">
                {/* Ideally Link to home */}
                <a
                  href="/"
                  className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
                >
                  Archestra On-Call Agent
                </a>
              </div>
              <ModeToggle />
            </header>
            <main className="flex-1">{children}</main>
          </div>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
