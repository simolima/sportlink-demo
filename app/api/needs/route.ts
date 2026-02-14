import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withCors, handleOptions } from '@/lib/cors'

export const runtime = 'nodejs'

const NEEDS_PATH = path.join(process.cwd(), 'data', 'needs.json')

function ensureFile() {
  if (!fs.existsSync(NEEDS_PATH)) {
    fs.mkdirSync(path.dirname(NEEDS_PATH), { recursive: true })
    fs.writeFileSync(NEEDS_PATH, '[]')
  }
}

function readNeeds() {
  ensureFile()
  const raw = fs.readFileSync(NEEDS_PATH, 'utf8')
  try {
    return JSON.parse(raw || '[]')
  } catch {
    return []
  }
}

function writeNeeds(needs: any[]) {
  ensureFile()
  fs.writeFileSync(NEEDS_PATH, JSON.stringify(needs, null, 2))
}

export async function OPTIONS() {
  return handleOptions()
}

export async function POST(req: Request) {
  const body = await req.json()
  const needs = readNeeds()
  const need = {
    id: String(Date.now()),
    ownerType: 'CLUB',
    ownerId: 'demo',
    sport: body.sport ?? '',
    position: body.position ?? null,
    ageMin: body.ageMin ?? null,
    ageMax: body.ageMax ?? null,
    level: body.level ?? null,
    createdAt: new Date().toISOString(),
  }
  needs.unshift(need)
  writeNeeds(needs)
  return withCors(NextResponse.json({ id: need.id }))
}
