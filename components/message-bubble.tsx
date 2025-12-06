"use client"
import { Message } from '@/lib/types'
import Avatar from './avatar'
import clsx from 'clsx'
import { useState, useEffect } from 'react'

interface Props {
    message: Message
    currentUserId: string | null
}

export default function MessageBubble({ message, currentUserId }: Props) {
    const isMine = currentUserId && String(message.senderId) === String(currentUserId)
    const [sharedPost, setSharedPost] = useState<any>(null)
    const [loadingPost, setLoadingPost] = useState(false)
    const [senderAvatar, setSenderAvatar] = useState<string | null>(null)
    const [senderName, setSenderName] = useState<string | null>(null)

    useEffect(() => {
        const fetchSender = async () => {
            try {
                const res = await fetch('/api/users')
                if (res.ok) {
                    const users = await res.json()
                    const sender = users.find((u: any) => String(u.id) === String(message.senderId))
                    setSenderAvatar(sender?.avatarUrl || null)
                    setSenderName(sender ? `${sender.firstName} ${sender.lastName}` : null)
                }
            } catch { }
        }
        if (!isMine) fetchSender()
    }, [message.senderId, isMine])

    // Fetch shared post if sharedPostId exists
    useEffect(() => {
        if ((message as any).sharedPostId) {
            const fetchPost = async () => {
                setLoadingPost(true)
                try {
                    const res = await fetch('/api/posts')
                    if (res.ok) {
                        const posts = await res.json()
                        const post = posts.find((p: any) => Number(p.id) === Number((message as any).sharedPostId))
                        setSharedPost(post || null)
                    }
                } catch (e) {
                    console.error('Error fetching shared post:', e)
                } finally {
                    setLoadingPost(false)
                }
            }
            fetchPost()
        }
    }, [(message as any).sharedPostId])

    return (
        <div className={clsx('flex mb-2', isMine ? 'justify-end' : 'justify-start')}>
            {!isMine && (
                <div className="mr-2 flex-shrink-0">
                    <Avatar
                        src={senderAvatar}
                        alt={senderName || 'User'}
                        size="sm"
                        fallbackText={senderName?.[0] || 'U'}
                    />
                </div>
            )}
            <div className={clsx('max-w-xs rounded-lg px-3 py-2 text-sm shadow',
                isMine ? 'bg-sprinta-blue text-white' : 'bg-gray-100 text-gray-800')
            }>
                <p className="whitespace-pre-line break-words">{message.text}</p>

                {/* Shared post preview */}
                {(message as any).sharedPostId && (
                    <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                        {loadingPost && <p className="text-xs text-gray-500">Caricamento post...</p>}
                        {!loadingPost && !sharedPost && <p className="text-xs text-gray-500">Post non trovato</p>}
                        {!loadingPost && sharedPost && (
                            <a
                                href={`/home/posts/${sharedPost.id}`}
                                className="block hover:opacity-80 transition"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Avatar
                                        src={sharedPost.authorAvatar}
                                        alt={sharedPost.authorName || `User ${sharedPost.authorId}`}
                                        size="sm"
                                        fallbackText={sharedPost.authorName?.[0] || 'U'}
                                    />
                                    <span className="text-xs font-semibold text-gray-900">
                                        {sharedPost.authorName || `User ${sharedPost.authorId}`}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-700 line-clamp-3 mb-1">
                                    {sharedPost.content}
                                </p>
                                {sharedPost.imageUrl && (
                                    <img
                                        src={sharedPost.imageUrl}
                                        alt="Post"
                                        className="w-full h-32 object-cover rounded mt-1"
                                    />
                                )}
                                <div className="text-[10px] text-gray-500 mt-1">
                                    {new Date(sharedPost.createdAt).toLocaleDateString()}
                                </div>
                            </a>
                        )}
                    </div>
                )}

                <div className={clsx('mt-1 text-[10px] flex items-center gap-1', isMine ? 'text-sprinta-text/70' : 'text-sprinta-text-secondary')}>
                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMine && (
                        <span>{message.read ? '✓✓' : '✓'} </span>
                    )}
                </div>
            </div>
        </div>
    )
}
