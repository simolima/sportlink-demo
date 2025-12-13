import MainLayout from '@/components/main-layout';

/**
 * Layout per la landing page.
 * NON include la Navbar.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
}
