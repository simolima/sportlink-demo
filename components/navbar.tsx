import Link from 'next/link'
import dynamic from 'next/dynamic'

const ProfileLink = dynamic(() => import('./profile-link'), { ssr: false })
const LogoutButton = dynamic(() => import('./logout-button'), { ssr: false })

export default function Navbar() {
    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-yellow-400">SportLink</div>
                    <Link href="/" className="text-sm text-gray-600">Home</Link>
                    <Link href="/search" className="text-sm text-gray-600">Search</Link>
                    <Link href="/needs" className="text-sm text-gray-600">Needs</Link>
                </div>
                <div className="flex items-center gap-3">
                    <ProfileLink />
                    <LogoutButton />
                </div>
            </div>
        </nav>
    )
}
