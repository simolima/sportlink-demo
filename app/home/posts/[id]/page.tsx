'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PostCard from '@/components/post-card'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function PostDetailPage() {
    const params = useParams()
    const router = useRouter()
    const postId = params.id

    const [post, setPost] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true)
            setError(false)
            try {
                const res = await fetch('/api/posts')
                if (res.ok) {
                    const posts = await res.json()
                    const foundPost = posts.find((p: any) => String(p.id) === String(postId))
                    if (foundPost) {
                        setPost(foundPost)
                    } else {
                        setError(true)
                    }
                } else {
                    setError(true)
                }
            } catch (e) {
                console.error('Error fetching post:', e)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        if (postId) {
            fetchPost()
        }
    }, [postId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Caricamento post...</p>
                </div>
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Post non trovato</h1>
                    <p className="text-gray-600 mb-6">
                        Il post che stai cercando potrebbe essere stato rimosso o non esiste più.
                    </p>
                    <button
                        onClick={() => router.push('/home')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Torna alla Home
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header with back button */}
                <div className="mb-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span className="font-medium">Indietro</span>
                    </button>
                </div>

                {/* Post detail card */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Dettaglio Post</h1>
                    <PostCard post={post} />
                </div>

                {/* Additional info or actions could go here */}
                <div className="bg-white rounded-lg shadow p-4 text-center text-sm text-gray-500">
                    <p>Post ID: {post.id}</p>
                    <p className="mt-1">
                        Pubblicato il {new Date(post.createdAt).toLocaleString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>
        </div>
    )
}
