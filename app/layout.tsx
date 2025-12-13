import "./globals.css";
import { ToastProvider } from '@/lib/toast-context';
import { AuthProvider } from '@/lib/hooks/useAuth';

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
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
