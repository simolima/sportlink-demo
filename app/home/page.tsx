"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import PostCard from '@/components/post-card'
import PostComposer from '@/components/post-composer'

export default function HomePage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userPhoto, setUserPhoto] = useState<string | null>(null)
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const id = localStorage.getItem('currentUserId')
        const name = localStorage.getItem('currentUserName')
        setUserId(id)
        setUserName(name)

        if (!id) {
            router.push('/login')
            return
        }

        const fetchData = async () => {
            try {
                const res = await fetch('/api/users')
                const users = await res.json()
                const currentUser = (users || []).find((u: any) => String(u.id) === String(id))
                if (currentUser) {
                    setUserRole(currentUser.currentRole)
                    setUserPhoto(currentUser.avatarUrl)
                }
            } catch (e) {
                console.error('Error fetching user:', e)
            }

            try {
                const res = await fetch('/api/posts')
                const data = await res.json()
                setPosts(Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [])
            } catch (e) {
                setPosts([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router])

    if (!userId) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto py-6 px-4">
                {/* Welcome Card & Profile Navigation */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {userPhoto ? (
                                    <img src={userPhoto} alt={userName || ''} className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <div className="text-xl font-semibold text-gray-900">{userName}</div>
                                <div className="text-sm text-gray-600">{userRole || 'Atleta'}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/profile')}
                            className="px-6 py-2 border-2 border-green-600 text-green-600 font-semibold rounded-full hover:bg-green-50 transition"
                        >
                            Visualizza Profilo
                        </button>
                    </div>
                </div>

                {/* Post Composer */}
                <PostComposer userPhoto={userPhoto} userName={userName} />

                {/* Posts Feed */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Caricamento feed...</div>
                    ) : posts.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <p className="text-gray-500 mb-4">Nessun post disponibile</p>
                            <p className="text-sm text-gray-400">Sii il primo a condividere un post!</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
