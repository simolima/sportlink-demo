import fs from 'fs'
import path from 'path'
import FollowStats from '@/components/follow-stats'
import ProfileCover from '@/components/profile-cover'
import { CheckBadgeIcon, MapPinIcon, LanguageIcon } from '@heroicons/react/24/solid'
import ProfileActions from '@/components/profile-actions'
import ProfileContent from '@/components/profile-content'

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
    const followers = follows.filter((f: any) => f.followingId === id).length
    const following = follows.filter((f: any) => f.followerId === id).length

    // Prepara le statistiche per il componente
    const stats = user.stats || [
        { label: 'Partite Giocate', value: 656, maxValue: 700, color: 'blue' },
        { label: 'Presenze Totali', value: 658, maxValue: 700, color: 'green' }
    ]

    // Prepara le stagioni professionali
    const seasons = user.professionalSeasons || [
        { 
            id: 1,
            team: 'FC Dynamo',
            year: '2024- Oggi',
            description: 'Giocatore sotto contratto per l\'intera stagione 2024 nella sua posizione di centrocampista difensivo'
        }
    ]

    return (
        <div className="min-h-screen bg-white">
            {/* Cover Photo + Avatar */}
            <ProfileCover
                coverUrl={user.coverUrl}
                avatarUrl={user.avatarUrl}
                name={`${user.firstName} ${user.lastName}`}
            />

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Profile Info Section - Below Avatar */}
                <div className="pt-20 pb-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Left: Name and Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {user.firstName} {user.lastName}
                                </h1>
                                {user.verified && (
                                    <CheckBadgeIcon className="w-7 h-7 text-sprinta-blue" />
                                )}
                            </div>
                            <p className="text-lg text-gray-600 mt-1">{user.currentRole}</p>
                            
                            {/* Location and Languages */}
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                                {user.city && (
                                    <div className="flex items-center gap-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        <span>{user.city}</span>
                                    </div>
                                )}
                                {user.languages && user.languages.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <LanguageIcon className="w-4 h-4" />
                                        <span>{user.languages.join(', ')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Bio */}
                            {user.bio && (
                                <p className="text-gray-700 mt-4 max-w-2xl">{user.bio}</p>
                            )}

                            {/* Follow Stats */}
                            <div className="mt-4">
                                <FollowStats userId={id} />
                            </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <ProfileActions userId={id} />
                    </div>
                </div>

                {/* Tab Content with Informazioni, Aggiornamenti, Post */}
                <ProfileContent 
                    user={user}
                    stats={stats}
                    seasons={seasons}
                    posts={userPosts}
                />
            </div>
        </div>
    )
}
