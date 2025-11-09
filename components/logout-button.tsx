'use client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
    const router = useRouter()
    const isClient = typeof window !== 'undefined'
    const id = isClient ? localStorage.getItem('currentUserId') : null
    if (!id) return null
    const logout = () => {
        if (typeof window === 'undefined') return
        localStorage.removeItem('currentUserId')
        localStorage.removeItem('currentUserName')
        localStorage.removeItem('currentUserEmail')
        // reload or navigate to home
        router.push('/')
        // ensure full refresh
        setTimeout(() => location.reload(), 200)
    }

    return (
        <button onClick={logout} className="text-sm px-3 py-1 border rounded">Logout</button>
    )
}
