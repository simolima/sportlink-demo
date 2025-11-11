import "./globals.css";
import Link from "next/link";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <nav className="mx-auto max-w-5xl p-4 flex gap-6">
            <Link href="/" className="font-semibold">ALMA Sport</Link>
            <div className="ml-auto flex gap-4">
              <Link href="/search">Search</Link>
              <Link href="/needs">Needs</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </body>
    </html>
  );
}
