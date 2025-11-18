'use client'
import { useState, useEffect } from 'react'

import { useCallback } from 'react'
import { HeartIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import FollowButton from './follow-button'
import CommentComposer from './comment-composer'
import CommentList from './comment-list'
import SharePostModal from './share-post-modal'
import Avatar from './avatar'
import { getCommentCount } from '@/lib/comment-count'

export default function PostCard({ post }: { post: any }) {
    const author = post.authorName || post.author || `User ${post.authorId}`
    const date = post.createdAt ? new Date(post.createdAt).toLocaleString() : ''
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null

    const [showComments, setShowComments] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [commentCount, setCommentCount] = useState<number>(0)
    const [showShareModal, setShowShareModal] = useState(false)

    const fetchCommentCount = useCallback(async () => {
        const count = await getCommentCount(post.id)
        setCommentCount(count)
    }, [post.id])

    // Like state
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const [likeLoading, setLikeLoading] = useState(false)

    // Carica lo stato dei like e dei commenti al mount/refresh
    useEffect(() => {
        const fetchLikes = async () => {
            try {
                const res = await fetch(`/api/likes?postId=${post.id}`)
                const data = await res.json()
                setLikeCount(data.count || 0)
                if (currentUserId && data.likes) {
                    const userLiked = data.likes.some((l: any) => String(l.userId) === String(currentUserId))
                    setIsLiked(userLiked)
                }
            } catch (e) {
                console.error('Error fetching likes:', e)
            }
        }
        fetchLikes()
        fetchCommentCount()
    }, [post.id, currentUserId, fetchCommentCount, refreshKey])

    const toggleLike = async () => {
        if (!currentUserId) {
            alert('Devi essere loggato per mettere like')
            return
        }

        if (likeLoading) return

        setLikeLoading(true)
        try {
            const res = await fetch('/api/likes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.id, userId: currentUserId })
            })

            if (res.ok) {
                const data = await res.json()
                setLikeCount(data.count)
                setIsLiked(data.action === 'liked')
            }
        } catch (e) {
            console.error('Error toggling like:', e)
        } finally {
            setLikeLoading(false)
        }
    }

    return (
        <article className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <Avatar
                        src={post.authorAvatar}
                        alt={author}
                        size="md"
                        fallbackText={author[0] || 'U'}
                    />
                    <div>
                        <div className="flex items-center gap-3">
                            <a href={`/profile/${post.authorId}`} className="font-semibold text-gray-900 hover:underline">
                                {author}
                            </a>
                            <div className="text-sm text-gray-500">{date}</div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                    {post.authorId && String(post.authorId) !== String(currentUserId) && (
                        <FollowButton targetId={post.authorId} />
                    )}
                </div>
            </div>
            <div className="mt-3 text-gray-800">{post.content}</div>
            {post.imageUrl && <img src={post.imageUrl} className="mt-3 w-full max-h-96 object-cover rounded-lg" />}

            {/* Action buttons */}
            <div className="flex items-center gap-6 mt-4 pt-3 border-t">
                <button
                    onClick={toggleLike}
                    disabled={likeLoading}
                    className={`flex items-center gap-2 text-sm transition ${isLiked ? 'text-red-500 font-semibold' : 'text-gray-600 hover:text-red-500'}`}
                >
                    {isLiked ? (
                        <HeartIconSolid className="w-5 h-5" />
                    ) : (
                        <HeartIcon className="w-5 h-5" />
                    )}
                    <span>{isLiked ? 'Ti piace' : 'Mi piace'}</span>
                    {likeCount > 0 && <span className="text-xs">({likeCount})</span>}
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition"
                >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span>Commenta</span>
                    {commentCount > 0 && <span className="text-xs">({commentCount})</span>}
                </button>
                <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-500 transition"
                >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    <span>Condividi</span>
                </button>
            </div>

            {/* Comments section */}
            {showComments && (
                <div className="mt-4 border-t pt-4">
                    <CommentComposer
                        postId={post.id}
                        onAdded={() => setRefreshKey(prev => prev + 1)}
                    />
                    <CommentList
                        postId={post.id}
                        refreshKey={refreshKey}
                    />
                </div>
            )}

            {/* Share modal */}
            {showShareModal && (
                <SharePostModal
                    postId={post.id}
                    onClose={() => setShowShareModal(false)}
                    onShared={() => {
                        alert('Post condiviso con successo!')
                        setShowShareModal(false)
                    }}
                />
            )}
        </article>
    )
}