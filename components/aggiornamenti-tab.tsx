'use client'
import PostCard from './post-card'

interface AggiornamentiTabProps {
    userId: number
    posts: any[]
}

export default function AggiornamentiTab({ userId, posts }: AggiornamentiTabProps) {
    if (!posts || posts.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-2">Nessun aggiornamento pubblicato</p>
                <p className="text-sm text-gray-400">Gli aggiornamenti condivisi appariranno qui</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard key={post.id} post={post} hideFollowButton={true} />
            ))}
        </div>
    )
}
