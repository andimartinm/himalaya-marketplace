import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';
import { InstallPrompt } from '@/components/install-prompt';
import { GoogleAnalytics } from '@/components/google-analytics';
import { SplashScreen } from '@/components/splash-screen';
import { TidioHider } from '@/components/tidio-hider';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'Pedite - Pilar del Este',
  description: 'Tu comunidad, más cerca. Marketplace de comidas, productos y servicios de tus vecinos en Pilar del Este.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pedite',
  },
  openGraph: {
    title: 'Pedite - Pilar del Este',
    description: 'Tu comunidad, más cerca',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
        <script src="//code.tidio.co/rvmstrogw3mtqvj7nnseqb8xpi90923o.js" async />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <GoogleAnalytics />
        <Providers>
          <TidioHider />
          <SplashScreen />
          {children}
          <InstallPrompt />
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
