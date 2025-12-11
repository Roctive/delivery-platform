import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * File upload utilities for handling image uploads
 */

export interface UploadResult {
    success: boolean
    filePath?: string
    publicUrl?: string
    error?: string
}

/**
 * Validate that a file is an image
 */
export function isValidImageType(mimeType: string): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    return validTypes.includes(mimeType.toLowerCase())
}

/**
 * Generate a unique filename
 */
export function generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split('.').pop()
    return `${timestamp}-${randomString}.${extension}`
}

/**
 * Upload a file to the public uploads directory
 */
export async function uploadFile(
    file: File,
    subdirectory: string = 'hiding-spots'
): Promise<UploadResult> {
    try {
        // Validate file type
        if (!isValidImageType(file.type)) {
            return {
                success: false,
                error: 'Type de fichier invalide. Seules les images sont acceptées.'
            }
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            return {
                success: false,
                error: 'Fichier trop volumineux. Taille maximale: 10MB'
            }
        }

        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads', subdirectory)
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Generate unique filename
        const filename = generateUniqueFilename(file.name)
        const filePath = join(uploadDir, filename)

        // Convert File to Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Write file
        await writeFile(filePath, buffer)

        // Generate public URL
        const publicUrl = `/uploads/${subdirectory}/${filename}`

        return {
            success: true,
            filePath,
            publicUrl
        }
    } catch (error) {
        console.error('File upload error:', error)
        return {
            success: false,
            error: 'Erreur lors de l\'upload du fichier'
        }
    }
}

/**
 * Upload a base64 encoded image
 */
export async function uploadBase64Image(
    base64Data: string,
    subdirectory: string = 'hiding-spots'
): Promise<UploadResult> {
    try {
        // Extract mime type and data
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (!matches || matches.length !== 3) {
            return {
                success: false,
                error: 'Format base64 invalide'
            }
        }

        const mimeType = matches[1]
        const data = matches[2]

        // Validate image type
        if (!isValidImageType(mimeType)) {
            return {
                success: false,
                error: 'Type de fichier invalide. Seules les images sont acceptées.'
            }
        }

        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads', subdirectory)
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Generate unique filename
        const extension = mimeType.split('/')[1]
        const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`
        const filePath = join(uploadDir, filename)

        // Convert base64 to buffer and write
        const buffer = Buffer.from(data, 'base64')
        await writeFile(filePath, buffer)

        // Generate public URL
        const publicUrl = `/uploads/${subdirectory}/${filename}`

        return {
            success: true,
            filePath,
            publicUrl
        }
    } catch (error) {
        console.error('Base64 upload error:', error)
        return {
            success: false,
            error: 'Erreur lors de l\'upload de l\'image'
        }
    }
}
