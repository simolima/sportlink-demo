import "./globals.css";
import Navbar from '@/components/navbar';
import MainLayout from '@/components/main-layout';
import { ToastProvider } from '@/lib/toast-context';
import { AuthProvider } from '@/lib/hooks/useAuth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" data-theme="sprinta">
      <body className="bg-base-100 text-secondary">
        <AuthProvider>
          <ToastProvider>
            <header>
              <Navbar />
            </header>
            <MainLayout>
              {children}
            </MainLayout>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
