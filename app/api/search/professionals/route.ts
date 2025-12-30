import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors, handleOptions } from '@/lib/cors'

export const runtime = 'nodejs'

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')

function ensureFile() {
    if (!fs.existsSync(USERS_PATH)) {
        fs.mkdirSync(path.dirname(USERS_PATH), { recursive: true })
        fs.writeFileSync(USERS_PATH, '[]')
    }
}

function readUsers() {
    ensureFile()
    const raw = fs.readFileSync(USERS_PATH, 'utf8')
    try {
        return JSON.parse(raw || '[]')
    } catch {
        return []
    }
}

// Handle preflight requests
export async function OPTIONS(req: Request) {
    return handleOptions()
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)

        // Extract query parameters
        const searchTerm = searchParams.get('searchTerm')?.toLowerCase() || ''
        const roleType = searchParams.get('roleType') || 'all' // Player, Coach, Agent, all
        const sport = searchParams.get('sport') || 'all'
        const position = searchParams.get('position') || 'all'
        const city = searchParams.get('city')?.toLowerCase() || ''
        const country = searchParams.get('country')?.toLowerCase() || ''
        const availability = searchParams.get('availability') || 'all'
        const level = searchParams.get('level') || 'all'
        const verified = searchParams.get('verified')

        // Player-specific filters
        const minGoals = searchParams.get('minGoals') ? parseInt(searchParams.get('minGoals')!) : null
        const category = searchParams.get('category') || 'all'

        // Coach-specific filters
        const uefaLicense = searchParams.get('uefaLicense') || 'all'
        const specialization = searchParams.get('specialization')?.toLowerCase() || ''

        // Agent-specific filters
        const hasUEFALicense = searchParams.get('hasUEFALicense')
        const hasFIFALicense = searchParams.get('hasFIFALicense')

        // Pagination
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

        // Read all users
        let users = readUsers()

        // Filter by professional role type
        if (roleType !== 'all') {
            users = users.filter((u: any) => u.professionalRole === roleType)
        } else {
            // If no specific role, exclude non-professionals (filter only professionals)
            const professionalRoles = ['Player', 'Coach', 'Agent', 'Sporting Director', 'Athletic Trainer', 'Nutritionist', 'Physio/Masseur']
            users = users.filter((u: any) => professionalRoles.includes(u.professionalRole))
        }

        // Text search (name, email, bio, username, currentRole)
        if (searchTerm) {
            users = users.filter((u: any) => {
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
                const email = (u.email || '').toLowerCase()
                const bio = (u.bio || '').toLowerCase()
                const username = (u.username || '').toLowerCase()
                const role = (u.currentRole || '').toLowerCase()

                return (
                    fullName.includes(searchTerm) ||
                    email.includes(searchTerm) ||
                    bio.includes(searchTerm) ||
                    username.includes(searchTerm) ||
                    role.includes(searchTerm)
                )
            })
        }

        // Sport filter
        if (sport !== 'all') {
            users = users.filter((u: any) => {
                const userSport = u.sport || ''
                const userSports = Array.isArray(u.sports) ? u.sports : []
                return userSport === sport || userSports.includes(sport)
            })
        }

        // Position filter (from experiences) - only for Players
        if (position !== 'all') {
            users = users.filter((u: any) => {
                if (u.professionalRole !== 'Player') return true
                if (!Array.isArray(u.experiences)) return false
                return u.experiences.some((exp: any) =>
                    exp.primaryPosition === position || exp.positionDetail === position
                )
            })
        }

        // City filter
        if (city) {
            users = users.filter((u: any) => {
                const userCity = (u.city || '').toLowerCase()
                return userCity.includes(city)
            })
        }

        // Country filter
        if (country) {
            users = users.filter((u: any) => {
                const userCountry = (u.country || '').toLowerCase()
                return userCountry.includes(country)
            })
        }

        // Availability filter
        if (availability !== 'all') {
            users = users.filter((u: any) => u.availability === availability)
        }

        // Level filter
        if (level !== 'all') {
            users = users.filter((u: any) => u.level === level)
        }

        // Verified filter
        if (verified === 'true') {
            users = users.filter((u: any) => u.verified === true)
        }

        // ===== PLAYER SPECIFIC FILTERS =====
        if (roleType === 'Player' || roleType === 'all') {
            // Min goals filter (only show players with goals data in last season)
            if (minGoals !== null) {
                users = users.filter((u: any) => {
                    if (u.professionalRole !== 'Player') return true
                    if (!Array.isArray(u.experiences) || u.experiences.length === 0) return false
                    const lastExp = u.experiences[0]
                    const goals = lastExp.goals ? parseInt(lastExp.goals) : 0
                    return goals >= minGoals
                })
            }

            // Category filter (youth, senior, etc)
            if (category !== 'all') {
                users = users.filter((u: any) => {
                    if (u.professionalRole !== 'Player') return true
                    if (!Array.isArray(u.experiences)) return false
                    return u.experiences.some((exp: any) => exp.category === category)
                })
            }
        }

        // ===== COACH SPECIFIC FILTERS =====
        if (roleType === 'Coach' || roleType === 'all') {
            // UEFA License filter
            if (uefaLicense !== 'all') {
                users = users.filter((u: any) => {
                    if (u.professionalRole !== 'Coach') return true
                    const licenses = Array.isArray(u.uefaLicenses) ? u.uefaLicenses : []
                    if (uefaLicense === 'none') return licenses.length === 0
                    return licenses.includes(uefaLicense)
                })
            }

            // Specialization filter
            if (specialization) {
                users = users.filter((u: any) => {
                    if (u.professionalRole !== 'Coach') return true
                    const spec = (u.coachSpecializations || '').toLowerCase()
                    return spec.includes(specialization)
                })
            }
        }

        // ===== AGENT SPECIFIC FILTERS =====
        if (roleType === 'Agent' || roleType === 'all') {
            // UEFA License filter
            if (hasUEFALicense === 'true') {
                users = users.filter((u: any) => {
                    if (u.professionalRole !== 'Agent') return true
                    const licenses = Array.isArray(u.uefaLicenses) ? u.uefaLicenses : []
                    return licenses.length > 0
                })
            } else if (hasUEFALicense === 'false') {
                users = users.filter((u: any) => {
                    if (u.professionalRole !== 'Agent') return true
                    const licenses = Array.isArray(u.uefaLicenses) ? u.uefaLicenses : []
                    return licenses.length === 0
                })
            }

            // FIFA License filter
            if (hasFIFALicense === 'true') {
                users = users.filter((u: any) => {
                    if (u.professionalRole !== 'Agent') return true
                    return u.hasFifaLicense === true
                })
            } else if (hasFIFALicense === 'false') {
                users = users.filter((u: any) => {
                    if (u.professionalRole !== 'Agent') return true
                    return u.hasFifaLicense === false
                })
            }
        }

        // Total count before pagination
        const total = users.length

        // Pagination
        const paginatedUsers = users.slice(offset, offset + limit)

        return withCors(
            NextResponse.json({
                data: paginatedUsers,
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            })
        )
    } catch (error) {
        console.error('Search professionals error:', error)
        return withCors(
            NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        )
    }
}
