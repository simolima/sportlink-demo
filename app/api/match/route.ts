import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors, handleOptions } from '@/lib/cors'

export const runtime = 'nodejs'

const NEEDS_PATH = path.join(process.cwd(), 'data', 'needs.json')
const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')

function readJsonArray(filePath: string) {
  if (!fs.existsSync(filePath)) return []
  const raw = fs.readFileSync(filePath, 'utf8')
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

  return {
    sport: user?.sport || (Array.isArray(user?.sports) ? user.sports[0] : '') || '',
    position: user?.specificRole || user?.footballPrimaryPosition || user?.currentRole || '',
    age: getAge(user?.birthDate),
    contract: String(user?.availability ?? '').toLowerCase().includes('disponibile') ? 'FREE' : 'CONTRACT',
    profile: {
      displayName,
    },
  }
}

function score(a: any, need: any) {
  let s = 0
  const why: string[] = []
  if (a.sport === need.sport) {
    s += 40
    why.push('sport match')
  }
  if (need.position && a.position === need.position) {
    s += 20
    why.push('position match')
  }
  if (need.ageMin && a.age && a.age >= need.ageMin) s += 5
  if (need.ageMax && a.age && a.age <= need.ageMax) s += 5
  if (a.contract === 'FREE') {
    s += 10
    why.push('free agent')
  }
  return { s, why }
}

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  const { needId } = await req.json()
  const needs = readJsonArray(NEEDS_PATH)
  const need = needs.find((n: any) => String(n.id) === String(needId))
  if (!need) return withCors(NextResponse.json({ candidates: [] }))

  const athletes = readJsonArray(USERS_PATH).filter(isAthlete).map(mapAthlete).slice(0, 100)
  const candidates = athletes
    .map((a: any) => {
      const r = score(a, need)
      return { name: a.profile.displayName, score: r.s, why: r.why }
    })
    .sort((x: any, y: any) => y.score - x.score)
    .slice(0, 10)

  return withCors(NextResponse.json({ candidates }))
}
