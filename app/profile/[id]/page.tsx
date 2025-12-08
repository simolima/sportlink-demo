import fs from 'fs'
import path from 'path'
import ProfileHeader from '@/components/profile-header'
import ProfileCover from '@/components/profile-cover'
import ProfileContent from '@/components/profile-content'
import ProfileRepresentationWrapper from '@/components/profile-representation-wrapper'

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')
const FOLLOWS_PATH = path.join(process.cwd(), 'data', 'follows.json')

function readJson(p: string) {
    if (!fs.existsSync(p)) return []
    try { return JSON.parse(fs.readFileSync(p, 'utf8') || '[]') } catch { return [] }
}

export default function ProfilePage({ params }: { params: { id: string } }) {
    const id = params.id
    const users = readJson(USERS_PATH)
    const follows = readJson(FOLLOWS_PATH)

    const user = users.find((u: any) => String(u.id) === id)
    if (!user) return (<div className="max-w-3xl mx-auto p-6">Utente non trovato</div>)

    const numericId = Number(id)
    const followers = follows.filter((f: any) => f.followingId === numericId).length
    const following = follows.filter((f: any) => f.followerId === numericId).length

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
                {/* Profile Header - Unified design */}
                <div className="pt-20 pb-8">
                    <ProfileHeader user={user} />
                </div>

                {/* Representation Section for Players */}
                <ProfileRepresentationWrapper
                    profileUserId={numericId}
                    profileUserRole={user.professionalRole}
                />

                {/* Tab Content with Informazioni */}
                <ProfileContent
                    user={user}
                    seasons={seasons}
                />
            </div>
        </div>
    )
}
