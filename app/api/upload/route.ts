import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withCors } from '@/lib/cors'

export const runtime = 'nodejs'

const BUCKET = 'avatars'

/**
 * POST /api/upload
 * Carica un file su Supabase Storage bucket 'avatars'
 *
 * Body (FormData):
 * - file: File da caricare
 * - folder: Sottocartella opzionale (default: 'avatars')
 *
 * Returns: { url: string } - URL pubblico del file caricato
 */
export async function POST(req: Request) {
    try {
        const formData = await req.formData() as any
        const file = formData.get('file') as File
        const rawFolder = formData.get('folder')
        const folder = rawFolder ? String(rawFolder) : 'avatars'

        if (!file) {
            return withCors(NextResponse.json({ error: 'No file provided' }, { status: 400 }))
        }

        // Valida tipo file (solo immagini)
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return withCors(NextResponse.json(
                { error: 'Invalid file type. Only images are allowed.' },
                { status: 400 }
            ))
        }

        // Valida dimensione (max 5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return withCors(NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            ))
        }

        // Genera nome file univoco
        const ext = file.name.split('.').pop() ?? 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const filePath = `${folder}/${fileName}`

        // Carica su Supabase Storage
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Supabase storage error:', error)
            return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
        }

        // Ottieni URL pubblico
        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(filePath)

        return withCors(NextResponse.json({ url: publicUrl }, { status: 201 }))
    } catch (error) {
        console.error('Upload error:', error)
        return withCors(NextResponse.json(
            { error: 'Upload failed. Please try again.' },
            { status: 500 }
        ))
    }
}

export async function OPTIONS() {
    return withCors(new NextResponse(null, { status: 204 }))
}
