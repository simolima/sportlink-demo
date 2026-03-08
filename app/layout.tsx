import "./globals.css";
import { ToastProvider } from '@/lib/toast-context';
import { AuthProvider } from '@/lib/hooks/useAuth';
import AuthLoadingGate from '@/components/ui/AuthLoadingGate';
import { ThemeProvider } from '@/lib/hooks/useTheme';
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
  const initialThemeScript = `
    (function () {
      try {
        var stored = localStorage.getItem('sprinta-theme');
        var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = stored === 'sprinta-dark' || stored === 'sprinta-light'
          ? stored
          : (systemPrefersDark ? 'sprinta-dark' : 'sprinta-light');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'sprinta-light');
      }
    })();
  `

  return (
    <html lang="it" data-theme="sprinta-light" suppressHydrationWarning>
      <body className="bg-base-100 text-base-content">
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AuthLoadingGate>
                {children}
              </AuthLoadingGate>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
