import MainLayout from '@/components/main-layout';

/**
 * Layout per le pagine di autenticazione (login, signup, landing).
 * NON include la Navbar.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
}
