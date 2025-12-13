import Navbar from '@/components/navbar';
import MainLayout from '@/components/main-layout';

/**
 * Layout per le pagine principali dell'app (con Navbar).
 */
export default function MainGroupLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <header>
                <Navbar />
            </header>
            <MainLayout>
                {children}
            </MainLayout>
        </>
    );
}
