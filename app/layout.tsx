import "./globals.css";
import Navbar from '@/components/navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-gray-50">
        <header>
          <Navbar />
        </header>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
