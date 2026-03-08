import "./globals.css";
import { ToastProvider } from '@/lib/toast-context';
import { AuthProvider } from '@/lib/hooks/useAuth';
import AuthLoadingGate from '@/components/ui/AuthLoadingGate';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sprinta',
  description: 'Piattaforma sociale per atleti, club e agenti sportivi',
  icons: {
    icon: '/logo-mark.svg',
  },
};

/**
 * Root Layout - contiene solo struttura base e providers.
 * La Navbar viene gestita nei layout dei route groups.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" data-theme="sprinta">
      <body className="bg-base-100 text-secondary">
        <AuthProvider>
          <ToastProvider>
            <AuthLoadingGate>
              {children}
            </AuthLoadingGate>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
