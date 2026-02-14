import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors, handleOptions } from '@/lib/cors'

export const runtime = 'nodejs'

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')

function readUsers() {
  if (!fs.existsSync(USERS_PATH)) return []
  const raw = fs.readFileSync(USERS_PATH, 'utf8')
  try {
    return JSON.parse(raw || '[]')
  } catch {
    return []
  }
}

function getAge(birthDate?: string): number | null {
  if (!birthDate) return null
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const m = now.getMonth() - date.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age--
  return age
}

function isAthlete(user: any) {
  const role = String(user?.professionalRole ?? '').toLowerCase()
  return role.includes('player') || role.includes('athlete')
}

function mapAthlete(user: any) {
  const firstName = String(user?.firstName ?? '').trim()
  const lastName = String(user?.lastName ?? '').trim()
  const displayName = `${firstName} ${lastName}`.trim() || String(user?.email ?? 'Athlete')
  const sport = user?.sport || (Array.isArray(user?.sports) ? user.sports[0] : '') || ''
  const position = user?.specificRole || user?.footballPrimaryPosition || user?.currentRole || ''

  return {
    id: String(user?.id ?? ''),
    sport,
    position,
    age: getAge(user?.birthDate),
    contract: String(user?.availability ?? '').toLowerCase().includes('disponibile') ? 'FREE' : 'CONTRACT',
    profile: {
      displayName,
      avatarUrl: user?.avatarUrl ?? null,
    },
  }
}

export async function OPTIONS() {
  return handleOptions()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sport = searchParams.get('sport') || undefined
  const position = searchParams.get('position') || undefined
  const ageMin = Number(searchParams.get('age_min') || 0)
  const ageMax = Number(searchParams.get('age_max') || 100)

  let items = readUsers().filter(isAthlete).map(mapAthlete)

  if (sport) items = items.filter((a: any) => a.sport === sport)
  if (position) items = items.filter((a: any) => a.position === position)
  items = items.filter((a: any) => {
    if (typeof a.age !== 'number') return true
    return a.age >= ageMin && a.age <= ageMax
  })

  return withCors(NextResponse.json({ items: items.slice(0, 60), total: items.length }))
}
