export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'
import { supabaseServer as supabase, getUserIdFromAuthToken } from '@/lib/supabase-server'

export async function OPTIONS() {
    return handleOptions()
}

// GET /api/studios/[id] — dettaglio studio
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        // Auth opzionale: se owner, vede anche le recensioni non pubblicate
        const authenticatedUserId = await getUserIdFromAuthToken(req)

        const { data, error } = await supabase
            .from('professional_studios')
            .select(`
                *,
                owner:profiles!owner_id(
                    id, first_name, last_name, avatar_url, role_id
                ),
                reviews:studio_reviews(
                    id, studio_id, reviewer_profile_id, rating, title, comment, is_verified, is_published,
                    owner_response, owner_responded_at,
                    created_at, updated_at, deleted_at,
                    reviewer:profiles!reviewer_profile_id(
                        id, first_name, last_name, avatar_url
                    )
                ),
                specializations:studio_specializations(
                    id, studio_id, name, description, icon, display_order, created_at, updated_at, deleted_at
                ),
                faqs:studio_faqs(
                    id, studio_id, question, answer, display_order, created_at, updated_at, deleted_at
                )
            `)
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (error || !data) {
            return withCors(NextResponse.json({ error: 'studio not found' }, { status: 404 }))
        }

        const isOwner = authenticatedUserId && String(authenticatedUserId) === String(data.owner_id)

        const reviews = (data.reviews || [])
            .filter((r: any) => {
                if (r.deleted_at) return false
                if (isOwner) return true
                return r.is_published || String(r.reviewer_profile_id) === String(authenticatedUserId)
            })
            .map((r: any) => ({
                id: r.id,
                studioId: r.studio_id,
                reviewerProfileId: r.reviewer_profile_id,
                rating: r.rating,
                title: r.title ?? undefined,
                comment: r.comment,
                isVerified: !!r.is_verified,
                isPublished: !!r.is_published,
                ownerResponse: r.owner_response ?? undefined,
                ownerRespondedAt: r.owner_responded_at ?? undefined,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                deletedAt: r.deleted_at,
                reviewer: r.reviewer ? {
                    id: r.reviewer.id,
                    firstName: r.reviewer.first_name,
                    lastName: r.reviewer.last_name,
                    avatarUrl: r.reviewer.avatar_url,
                } : undefined,
            }))

        const specializations = (data.specializations || [])
            .filter((s: any) => !s.deleted_at)
            .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((s: any) => ({
                id: s.id,
                studioId: s.studio_id,
                name: s.name,
                description: s.description ?? undefined,
                icon: s.icon ?? undefined,
                displayOrder: s.display_order ?? 0,
                createdAt: s.created_at,
                updatedAt: s.updated_at,
                deletedAt: s.deleted_at,
            }))

        const faqs = (data.faqs || [])
            .filter((f: any) => !f.deleted_at)
            .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((f: any) => ({
                id: f.id,
                studioId: f.studio_id,
                question: f.question,
                answer: f.answer,
                displayOrder: f.display_order ?? 0,
                createdAt: f.created_at,
                updatedAt: f.updated_at,
                deletedAt: f.deleted_at,
            }))

        return withCors(NextResponse.json({
            id: data.id,
            ownerId: data.owner_id,
            name: data.name,
            city: data.city,
            address: data.address,
            phone: data.phone,
            website: data.website,
            logoUrl: data.logo_url,
            description: data.description,
            servicesOffered: data.services_offered ?? [],
            yearsOfExperience: data.years_of_experience ?? undefined,
            languages: data.languages ?? [],
            workModes: data.work_modes ?? [],
            certifications: data.certifications ?? [],
            methodology: data.methodology ?? undefined,
            timezone: data.timezone,
            bookingEnabled: data.booking_enabled,
            autoConfirmBookings: data.auto_confirm_bookings,
            slotIncrementMinutes: data.slot_increment_minutes,
            defaultBufferBetweenAppointments: data.default_buffer_between_appointments,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            reviews,
            specializations,
            faqs,
            owner: data.owner ? {
                id: data.owner.id,
                firstName: data.owner.first_name,
                lastName: data.owner.last_name,
                avatarUrl: data.owner.avatar_url,
                roleId: data.owner.role_id,
            } : undefined,
        }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// PUT /api/studios/[id] — aggiorna studio (solo owner)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        // Verifica ownership
        const { data: studio } = await supabase
            .from('professional_studios')
            .select('owner_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (!studio) {
            return withCors(NextResponse.json({ error: 'studio not found' }, { status: 404 }))
        }
        if (studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const body = await req.json()
        const {
            name,
            city,
            address,
            phone,
            website,
            logoUrl,
            description,
            servicesOffered,
            yearsOfExperience,
            languages,
            workModes,
            certifications,
            methodology,
            timezone,
            bookingEnabled,
            autoConfirmBookings,
            slotIncrementMinutes,
            defaultBufferBetweenAppointments,
        } = body

        const updates: Record<string, any> = {}
        if (name !== undefined) updates.name = name
        if (city !== undefined) updates.city = city
        if (address !== undefined) updates.address = address
        if (phone !== undefined) updates.phone = phone
        if (website !== undefined) updates.website = website
        if (logoUrl !== undefined) updates.logo_url = logoUrl
        if (description !== undefined) updates.description = description
        if (servicesOffered !== undefined) updates.services_offered = servicesOffered
        if (yearsOfExperience !== undefined) {
            const val = Number(yearsOfExperience)
            if (!Number.isNaN(val) && val >= 0) updates.years_of_experience = val
        }
        if (Array.isArray(languages)) {
            updates.languages = languages.filter((l: any) => typeof l === 'string')
        }
        if (Array.isArray(workModes)) {
            const valid = workModes.filter((m: any) => ['in-person', 'remote', 'hybrid'].includes(m))
            updates.work_modes = valid
        }
        if (Array.isArray(certifications)) {
            updates.certifications = certifications.filter((c: any) => typeof c === 'string')
        }
        if (methodology !== undefined) {
            updates.methodology = methodology?.toString?.()?.trim() || null
        }
        if (timezone !== undefined) updates.timezone = timezone
        if (bookingEnabled !== undefined) updates.booking_enabled = bookingEnabled
        if (autoConfirmBookings !== undefined) updates.auto_confirm_bookings = autoConfirmBookings
        if (slotIncrementMinutes !== undefined) updates.slot_increment_minutes = slotIncrementMinutes
        if (defaultBufferBetweenAppointments !== undefined) {
            updates.default_buffer_between_appointments = defaultBufferBetweenAppointments
        }

        const { data: updated, error } = await supabase
            .from('professional_studios')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        return withCors(NextResponse.json({
            id: updated.id,
            ownerId: updated.owner_id,
            name: updated.name,
            city: updated.city,
            address: updated.address,
            phone: updated.phone,
            website: updated.website,
            logoUrl: updated.logo_url,
            description: updated.description,
            servicesOffered: updated.services_offered ?? [],
            timezone: updated.timezone,
            bookingEnabled: updated.booking_enabled,
            autoConfirmBookings: updated.auto_confirm_bookings,
            slotIncrementMinutes: updated.slot_increment_minutes,
            defaultBufferBetweenAppointments: updated.default_buffer_between_appointments,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}

// DELETE /api/studios/[id] — soft delete (solo owner)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const authenticatedUserId = await getUserIdFromAuthToken(req)
        if (!authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'unauthorized' }, { status: 401 }))
        }

        const { data: studio } = await supabase
            .from('professional_studios')
            .select('owner_id')
            .eq('id', params.id)
            .is('deleted_at', null)
            .single()

        if (!studio) {
            return withCors(NextResponse.json({ error: 'studio not found' }, { status: 404 }))
        }
        if (studio.owner_id !== authenticatedUserId) {
            return withCors(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
        }

        const { error } = await supabase
            .from('professional_studios')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', params.id)

        if (error) throw error

        return withCors(NextResponse.json({ success: true }))
    } catch (err: any) {
        return withCors(NextResponse.json({ error: err.message }, { status: 500 }))
    }
}
