/**
 * Upload Service - Abstract interface for file uploads
 * 
 * This service provides an abstraction layer for file uploads.
 * Current implementation: LocalUploadService (saves to /public/avatars)
 * Future implementation: SupabaseUploadService (saves to Supabase Storage)
 * 
 * To migrate to Supabase:
 * 1. Create SupabaseUploadService implementing IUploadService
 * 2. Update getUploadService() to return new SupabaseUploadService()
 * 3. No changes needed in components or API routes!
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

/**
 * Local Upload Service - Saves files to /public/avatars
 * Used for development and testing
 */
class LocalUploadService implements IUploadService {
    async uploadFile(file: File, folder: string = 'avatars'): Promise<UploadResult> {
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', folder)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const error = await response.text()
                return { success: false, error }
            }

            const data = await response.json()
            return { success: true, url: data.url }
        } catch (error) {
            console.error('Upload error:', error)
            return { success: false, error: 'Upload failed' }
        }
    }

    async deleteFile(url: string): Promise<boolean> {
        try {
            // For local files, we could implement deletion via API
            // For now, just return true (files stay in public folder)
            console.log('Delete not implemented for local storage:', url)
            return true
        } catch (error) {
            console.error('Delete error:', error)
            return false
        }
    }
}

/**
 * Supabase Upload Service - PLACEHOLDER for future implementation
 * Uncomment and implement when migrating to Supabase
 */
/*
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
            const fileName = `${Date.now()}-${file.name}`
            const filePath = `${folder}/${fileName}`

            const { data, error } = await this.supabase.storage
                .from('public-assets') // or your bucket name
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                return { success: false, error: error.message }
            }

            // Get public URL
            const { data: { publicUrl } } = this.supabase.storage
                .from('public-assets')
                .getPublicUrl(filePath)

            return { success: true, url: publicUrl }
        } catch (error) {
            console.error('Supabase upload error:', error)
            return { success: false, error: 'Upload failed' }
        }
    }

    async deleteFile(url: string): Promise<boolean> {
        try {
            // Extract file path from URL
            const urlObj = new URL(url)
            const pathParts = urlObj.pathname.split('/')
            const filePath = pathParts.slice(pathParts.indexOf('avatars')).join('/')

            const { error } = await this.supabase.storage
                .from('public-assets')
                .remove([filePath])

            return !error
        } catch (error) {
            console.error('Supabase delete error:', error)
            return false
        }
    }
}
*/

/**
 * Factory function to get the appropriate upload service
 * Switch between Local and Supabase by changing the return value
 */
export function getUploadService(): IUploadService {
    // TODO: When migrating to Supabase, uncomment the next line and comment out the current return
    // return new SupabaseUploadService()

    return new LocalUploadService()
}

// Helper function for client-side usage
export const uploadService = getUploadService()
