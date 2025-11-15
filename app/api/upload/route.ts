import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export const runtime = 'nodejs'

/**
 * POST /api/upload
 * Handles file uploads to /public/avatars/
 * 
 * Body (FormData):
 * - file: File to upload
 * - folder: Optional folder name (default: 'avatars')
 * 
 * Returns: { url: string } - Public URL of uploaded file
 * 
 * NOTE: This implementation saves to local filesystem.
 * When migrating to Supabase, this endpoint can be removed
 * and uploads will go directly to Supabase Storage from the client.
 */
export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const folder = (formData.get('folder') as string) || 'avatars'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type (images only)
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only images are allowed.' },
                { status: 400 }
            )
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            )
        }

        // Generate unique filename
        const timestamp = Date.now()
        const extension = file.name.split('.').pop()
        const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

        // Ensure folder exists
        const uploadDir = join(process.cwd(), 'public', folder)
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true })
        }

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filePath = join(uploadDir, fileName)

        await writeFile(filePath, buffer)

        // Return public URL
        const publicUrl = `/${folder}/${fileName}`

        return NextResponse.json({ url: publicUrl }, { status: 201 })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Upload failed. Please try again.' },
            { status: 500 }
        )
    }
}
