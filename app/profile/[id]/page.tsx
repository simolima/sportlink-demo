import fs from 'fs'
import path from 'path'
import FollowButton from '@/components/follow-button'
import FollowStats from '@/components/follow-stats'
import Link from 'next/link'

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')
const POSTS_PATH = path.join(process.cwd(), 'data', 'posts.json')
const FOLLOWS_PATH = path.join(process.cwd(), 'data', 'follows.json')

function readJson(p: string) {
    if (!fs.existsSync(p)) return []
    try { return JSON.parse(fs.readFileSync(p, 'utf8') || '[]') } catch { return [] }
}

export default function ProfilePage({ params }: { params: { id: string } }) {
    const id = Number(params.id)
    const users = readJson(USERS_PATH)
    const posts = readJson(POSTS_PATH)
    const follows = readJson(FOLLOWS_PATH)

    const user = users.find((u: any) => u.id === id)
    if (!user) return (<div className="max-w-3xl mx-auto p-6">Utente non trovato</div>)

    const userPosts = posts.filter((p: any) => p.authorId === id)
    // Updated field names: followers are entries where followingId === id.
    const followers = follows.filter((f: any) => f.followingId === id).length
    const following = follows.filter((f: any) => f.followerId === id).length

    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null
    const isOwn = currentUserId && String(currentUserId) === String(user.id)

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="bg-white p-6 rounded shadow flex gap-6">
                <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden" />
                <div className="flex-1">
                    <div className="flex justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">{user.firstName} {user.lastName}</h1>
                            <div className="text-sm text-gray-600">{user.currentRole}</div>
                            <div className="text-sm text-gray-500 mt-1">{user.email}</div>
                            <div className="text-sm text-gray-700 mt-3">{user.bio}</div>
                            <div className="mt-3">
                                <FollowStats userId={id} />
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {!isOwn && <FollowButton targetId={id} />}
                            {!isOwn && (
                                <Link href={`/messages/${id}`} className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Messaggia</Link>
                            )}
                        </div>
                    </div>
                    <div className="mt-4">
                        <h2 className="font-semibold">Esperienze</h2>
                        <div className="mt-2 space-y-2">
                            {Array.isArray(user.experiences) && user.experiences.map((e: any, i: number) => (
                                <div key={i} className="p-3 border rounded">
                                    <div className="font-semibold">{e.title} {e.company ? `- ${e.company}` : ''}</div>
                                    <div className="text-sm text-gray-500">{e.from} — {e.to || 'oggi'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <section className="mt-6">
                <h3 className="text-xl font-semibold mb-3">Post di {user.firstName}</h3>
                <div className="space-y-4">
                    {userPosts.map((p: any) => (
                        <article key={p.id} className="bg-white p-4 rounded shadow">
                            <div className="text-sm text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                            <div className="mt-2">{p.content}</div>
                            {p.imageUrl && <img src={p.imageUrl} className="mt-3 w-full max-h-96 object-cover rounded" />}
                        </article>
                    ))}
                    {userPosts.length === 0 && <div className="text-gray-500">Nessun post</div>}
                </div>
            </section>
        </div>
    )
}
