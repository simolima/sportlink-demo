export default function Feed({ posts }: { posts: any[] }) {
    if (!posts || posts.length === 0) return <div className="text-center text-gray-500">Nessun post ancora. Crea il primo!</div>

    return (
        <div className="space-y-4">
            {posts.map(p => (
                <article key={p.id} className="bg-white p-4 rounded shadow">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0" />
                        <div>
                            <div className="font-semibold">{p.authorName ?? 'Anon'}</div>
                            <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="mt-3 text-sm whitespace-pre-wrap">{p.content}</div>
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="mt-3 w-full max-h-96 object-cover rounded" />}
                </article>
            ))}
        </div>
    )
}
