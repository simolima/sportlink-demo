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
        const sport = searchParams.get('sport') || 'all'
        const position = searchParams.get('position') || 'all'
        const city = searchParams.get('city')?.toLowerCase() || ''
        const country = searchParams.get('country')?.toLowerCase() || ''
        const availability = searchParams.get('availability') || 'all'
        const level = searchParams.get('level') || 'all'
        const verified = searchParams.get('verified')
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

        // Read all users
        let users = readUsers()

        // Filter for Players only
        users = users.filter((u: any) => u.professionalRole === 'Player')

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

        // Position filter (from experiences)
        if (position !== 'all') {
            users = users.filter((u: any) => {
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
        console.error('Search athletes error:', error)
        return withCors(
            NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        )
    }
}
