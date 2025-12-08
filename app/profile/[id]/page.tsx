import fs from 'fs'
import path from 'path'
import ProfileHeader from '@/components/profile-header'
import ProfileCover from '@/components/profile-cover'
import ProfileContent from '@/components/profile-content'
import ProfileRepresentationWrapper from '@/components/profile-representation-wrapper'

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')
const FOLLOWS_PATH = path.join(process.cwd(), 'data', 'follows.json')
const CLUBS_PATH = path.join(process.cwd(), 'data', 'clubs.json')
const CLUB_MEMBERSHIPS_PATH = path.join(process.cwd(), 'data', 'club-memberships.json')

function readJson(p: string) {
    if (!fs.existsSync(p)) return []
    try { return JSON.parse(fs.readFileSync(p, 'utf8') || '[]') } catch { return [] }
}

export default function ProfilePage({ params }: { params: { id: string } }) {
    const id = params.id
    const users = readJson(USERS_PATH)
    const follows = readJson(FOLLOWS_PATH)
    const clubs = readJson(CLUBS_PATH)
    const memberships = readJson(CLUB_MEMBERSHIPS_PATH)

    const user = users.find((u: any) => String(u.id) === id)
    if (!user) return (<div className="max-w-3xl mx-auto p-6">Utente non trovato</div>)

    const numericId = Number(id)
    const followers = follows.filter((f: any) => String(f.followingId) === String(id)).length
    const following = follows.filter((f: any) => String(f.followerId) === String(id)).length

    // Determina il club da mostrare
    let userClub = user.currentClub || null

    // Se Player: cerca il club dalla membership
    if (!userClub && user.professionalRole === 'Player') {
        const playerMembership = memberships.find((m: any) => String(m.userId) === String(id) && m.isActive)
        if (playerMembership) {
            const club = clubs.find((c: any) => String(c.id) === String(playerMembership.clubId))
            if (club) userClub = club.name
        }
    }

    // Se DS: cerca il club creato da lui
    if (!userClub && user.professionalRole === 'Sporting Director') {
        const managedClub = clubs.find((c: any) => String(c.createdBy) === String(id))
        if (managedClub) userClub = managedClub.name
    }

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
                    <ProfileHeader user={user} followersCount={followers} followingCount={following} />
                </div>

                {/* Representation Section for Players */}
                <ProfileRepresentationWrapper
                    profileUserId={numericId}
                    profileUserRole={user.professionalRole}
                />

                {/* Tab Content with Informazioni */}
                <ProfileContent
                    user={user}
                    clubName={userClub}
                    followersCount={followers}
                    followingCount={following}
                />
            </div>
        </div>
    )
}
