import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const JOBS_PATH = path.join(process.cwd(), 'data', 'jobs.json')
const USERS_PATH = path.join(process.cwd(), 'data', 'users.json')

function ensureFile() {
    if (!fs.existsSync(JOBS_PATH)) {
        fs.mkdirSync(path.dirname(JOBS_PATH), { recursive: true })
        fs.writeFileSync(JOBS_PATH, '[]')
    }
}

function readJobs() {
    ensureFile()
    const raw = fs.readFileSync(JOBS_PATH, 'utf8')
    try { return JSON.parse(raw || '[]') } catch { return [] }
}

function writeJobs(jobs: any[]) {
    ensureFile()
    fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2))
}

function readUsers() {
    if (!fs.existsSync(USERS_PATH)) return []
    try { return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8') || '[]') } catch { return [] }
}

export async function GET(req: Request) {
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const jobs = readJobs()

    if (category) {
        const filtered = jobs.filter((j: any) => j.category === category)
        filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return NextResponse.json(filtered)
    }

    jobs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json(jobs)
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { title, category, description, location, authorId, authorName, contactEmail } = body || {}

        if (!title || !category || !description || !authorId) {
            return NextResponse.json({ error: 'title, category, description and authorId required' }, { status: 400 })
        }

        const jobs = readJobs()
        const newJob = {
            id: Date.now(),
            title: title.trim(),
            category, // 'player', 'coach', 'staff', 'other'
            description: description.trim(),
            location: location?.trim() || null,
            authorId: String(authorId),
            authorName: authorName || 'Utente',
            contactEmail: contactEmail || null,
            createdAt: new Date().toISOString(),
            active: true,
            applications: []
        }

        jobs.unshift(newJob)
        writeJobs(jobs)

        return NextResponse.json(newJob, { status: 201 })
    } catch (err) {
        return NextResponse.json({ error: 'invalid request' }, { status: 400 })
    }
}

// PATCH actions:
// - Apply to job: { action: 'apply', jobId, applicantId }
//   Will append application with profile data to job.applications
// - Send message: { action: 'message', jobId, fromUserId, text }
//   Will append a message to job.messages
export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const { action } = body || {}
        if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 })

        const jobs = readJobs()
        const jobId = body.jobId
        if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })
        const job = jobs.find((j: any) => String(j.id) === String(jobId))
        if (!job) return NextResponse.json({ error: 'job not found' }, { status: 404 })

        if (action === 'apply') {
            const applicantId = body.applicantId
            if (!applicantId) return NextResponse.json({ error: 'applicantId required' }, { status: 400 })

            job.applications = Array.isArray(job.applications) ? job.applications : []
            const already = job.applications.find((a: any) => String(a.applicantId) === String(applicantId))
            if (already) {
                return NextResponse.json({ error: 'already_applied' }, { status: 409 })
            }

            const users = readUsers()
            const user = users.find((u: any) => String(u.id) === String(applicantId))
            const applicantName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || (user.username ?? 'Utente') : 'Utente'
            const application = {
                id: Date.now(),
                applicantId: String(applicantId),
                applicantName,
                applicantEmail: user?.email ?? null,
                profileBio: user?.bio ?? null,
                experiences: Array.isArray(user?.experiences) ? user.experiences : [],
                createdAt: new Date().toISOString()
            }
            job.applications.unshift(application)
            writeJobs(jobs)
            return NextResponse.json({ ok: true, job })
        }

        // no job-level chat; chat will be implemented separately between users

        return NextResponse.json({ error: 'unknown action' }, { status: 400 })
    } catch (err) {
        return NextResponse.json({ error: 'invalid request' }, { status: 400 })
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json()
        const { jobId, authorId } = body || {}

        if (!jobId || !authorId) {
            return NextResponse.json({ error: 'jobId and authorId required' }, { status: 400 })
        }

        let jobs = readJobs()
        const job = jobs.find((j: any) => String(j.id) === String(jobId))

        if (!job) {
            return NextResponse.json({ error: 'job not found' }, { status: 404 })
        }

        // Solo l'autore può eliminare
        if (String(job.authorId) !== String(authorId)) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
        }

        jobs = jobs.filter((j: any) => String(j.id) !== String(jobId))
        writeJobs(jobs)

        return NextResponse.json({ deleted: true })
    } catch (err) {
        return NextResponse.json({ error: 'invalid request' }, { status: 400 })
    }
}
