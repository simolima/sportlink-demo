'use client'
import React, { useEffect, useState } from 'react'
import { UserCircleIcon } from '@heroicons/react/24/outline'

type Comment = {
    id: number
    postId: string
    authorId: string
    authorName: string
    content: string
    createdAt: string
}

interface CommentListProps {
    postId: string | number
    refreshKey?: number
}

export default function CommentList({ postId, refreshKey }: CommentListProps) {
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)

    const fetchComments = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/comments?postId=${postId}`)
            if (!res.ok) {
                setComments([])
                return
            }
            const data = await res.json()
            setComments(data || [])
        } catch (e) {
            console.error('Error fetching comments:', e)
            setComments([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchComments()
    }, [postId, refreshKey])

    if (loading) {
        return <div className="py-3 text-sm text-gray-500">Caricamento commenti...</div>
    }

    if (!comments.length) {
        return <div className="py-3 text-sm text-gray-500 italic">Nessun commento ancora. Sii il primo a commentare!</div>
    }

    return (
        <div className="space-y-4 mt-4">
            {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <UserCircleIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <a
                                href={`/profile/${comment.authorId}`}
                                className="font-semibold text-sm text-gray-900 hover:underline"
                            >{comment.authorName}</a>
                            <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.content}</div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 ml-3">
                            {new Date(comment.createdAt).toLocaleString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
