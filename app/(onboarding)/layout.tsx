import MainLayout from '@/components/main-layout';

/**
 * Layout dedicato per le pagine di onboarding.
 * NON include la Navbar globale.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
}

