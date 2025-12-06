import "./globals.css";
import Navbar from '@/components/navbar';
import { ToastProvider } from '@/lib/toast-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-gray-50">
        <ToastProvider>
          <header>
            <Navbar />
          </header>
          <main className="min-h-screen">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
