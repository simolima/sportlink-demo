"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircleIcon, PencilSquareIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import FollowButton from '@/components/follow-button'

export default function ProfilePage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [user, setUser] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const id = localStorage.getItem('currentUserId')
        setUserId(id)
        if (!id) {
            router.push('/login')
            return
        }

        const fetchUser = async () => {
            try {
                const res = await fetch('/api/users')
                const users = await res.json()
                const found = (users || []).find((u: any) => String(u.id) === String(id))
                setUser(found || null)
            } catch (e) {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [router])

    const logout = () => {
        if (typeof window === 'undefined') return
        localStorage.removeItem('currentUserId')
        localStorage.removeItem('currentUserName')
        localStorage.removeItem('currentUserUsername')
        localStorage.removeItem('currentUserEmail')
        router.push('/')
        setTimeout(() => location.reload(), 200)
    }

    if (!userId) return null

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Back button */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <button
                        onClick={() => router.push('/home')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        Torna al feed
                    </button>
                </div>
            </div>

            {loading && (
                <div className="text-center py-12 text-gray-500">Caricamento profilo...</div>
            )}

            {!loading && !user && (
                <div className="text-center py-12 text-gray-500">Profilo non trovato</div>
            )}

            {!loading && user && (
                <div className="max-w-4xl mx-auto py-8 px-4">
                    {/* Cover Photo Section */}
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-lg"></div>

                    {/* Profile Header Section */}
                    <div className="bg-white rounded-b-lg shadow-lg px-8 pb-8">
                        {/* Profile Info - Overlapping Avatar */}
                        <div className="flex items-end gap-6 -mt-24 mb-6 pb-6 border-b">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                                {user.profilePhoto ? (
                                    <img src={user.profilePhoto} alt={user.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircleIcon className="w-20 h-20 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
                                {user.username && (
                                    <p className="text-sm text-gray-500 mt-1">@{user.username}</p>
                                )}
                                <p className="text-lg text-blue-600 font-semibold mt-2">{user.currentRole}</p>
                            </div>
                            <div className="flex gap-3">
                                {String(user.id) !== String(userId) ? (
                                    <FollowButton targetId={user.id} />
                                ) : (
                                    <>
                                        <button
                                            onClick={() => router.push('/profile/edit')}
                                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-semibold"
                                        >
                                            <PencilSquareIcon className="w-5 h-5" />
                                            Modifica
                                        </button>
                                        <button
                                            onClick={logout}
                                            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition font-semibold"
                                        >
                                            Logout
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Bio Section */}
                        {user.bio && (
                            <div className="mb-8 pb-8 border-b">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Descrizione</h2>
                                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                            </div>
                        )}

                        {/* Personal Info Section */}
                        <div className="mb-8 pb-8 border-b">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni personali</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">Email</p>
                                    <p className="text-gray-900">{user.email}</p>
                                </div>
                                {user.birthDate && (
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium mb-1">Data di nascita</p>
                                        <p className="text-gray-900">
                                            {new Date(user.birthDate + 'T00:00:00').toLocaleDateString('it-IT', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Experiences Section */}
                        {user.experiences && user.experiences.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Esperienze professionali</h2>
                                <div className="space-y-4">
                                    {user.experiences.map((exp: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                                            {/* Company logo placeholder */}
                                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">
                                                    {exp.company?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 text-lg">{exp.title}</h3>
                                                <p className="text-blue-600 font-medium">{exp.company}</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {exp.from} — {exp.to || 'Presente'}
                                                </p>
                                                {exp.description && (
                                                    <p className="text-gray-700 mt-2 text-sm">{exp.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!user.experiences || user.experiences.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>Nessuna esperienza registrata</p>
                                <button
                                    onClick={() => router.push('/profile/edit')}
                                    className="text-blue-600 hover:text-blue-700 font-semibold mt-2"
                                >
                                    Aggiungi esperienze
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
