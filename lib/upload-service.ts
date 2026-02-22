import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Upload Service - Abstract interface for file uploads
 *
 * Current implementation: SupabaseUploadService (saves to Supabase Storage bucket 'avatars')
 */

export interface UploadResult {
    success: boolean
    url?: string
    error?: string
}

export interface IUploadService {
    /**
     * Upload a file and return its public URL
     * @param file - File to upload
     * @param folder - Optional folder/bucket name
     * @returns Promise with upload result containing public URL
     */
    uploadFile(file: File, folder?: string): Promise<UploadResult>

    /**
     * Delete a file by its URL
     * @param url - Public URL of the file to delete
     */
    deleteFile(url: string): Promise<boolean>
}

const BUCKET = 'avatars'

/**
 * Supabase Upload Service - Saves files to Supabase Storage bucket 'avatars'
 */
class SupabaseUploadService implements IUploadService {
    private supabase: SupabaseClient

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }

    async uploadFile(file: File, folder: string = 'avatars'): Promise<UploadResult> {
        try {
            const ext = file.name.split('.').pop() ?? 'jpg'
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const filePath = `${folder}/${fileName}`

            const { error } = await this.supabase.storage
                .from(BUCKET)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                return { success: false, error: error.message }
            }

            const { data: { publicUrl } } = this.supabase.storage
                .from(BUCKET)
                .getPublicUrl(filePath)

            return { success: true, url: publicUrl }
        } catch (error) {
            console.error('Supabase upload error:', error)
            return { success: false, error: 'Upload failed' }
        }
    }

    async deleteFile(url: string): Promise<boolean> {
        try {
            // Estrae il path relativo dall'URL pubblico Supabase
            // es: https://xxx.supabase.co/storage/v1/object/public/avatars/avatars/file.jpg
            const marker = `/object/public/${BUCKET}/`
            const idx = url.indexOf(marker)
            if (idx === -1) return false
            const filePath = url.slice(idx + marker.length)

            const { error } = await this.supabase.storage
                .from(BUCKET)
                .remove([filePath])

            return !error
        } catch (error) {
            console.error('Supabase delete error:', error)
            return false
        }
    }
}

/**
 * Factory function - restituisce il servizio di upload attivo
 */
export function getUploadService(): IUploadService {
    return new SupabaseUploadService()
}

export const uploadService = getUploadService()
