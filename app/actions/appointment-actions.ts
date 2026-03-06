'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'

// ─────────────────────────────────────────────────────────────────────────────
// Schema Zod
// ─────────────────────────────────────────────────────────────────────────────
export const bookAppointmentSchema = z.object({
    studioId: z.string().uuid('ID studio non valido'),
    clientProfileId: z.string().uuid('ID cliente non valido'),
    startTime: z
        .string()
        .min(1, 'Orario di inizio obbligatorio')
        .refine((v) => !isNaN(Date.parse(v)), 'Data di inizio non valida')
        .refine((v) => new Date(v) > new Date(), 'L\'orario deve essere futuro'),
    endTime: z
        .string()
        .min(1, 'Orario di fine obbligatorio')
        .refine((v) => !isNaN(Date.parse(v)), 'Data di fine non valida'),
    serviceType: z.string().max(100, 'Tipo servizio troppo lungo').nullable().optional(),
    notes: z.string().max(500, 'Note troppo lunghe').nullable().optional(),
}).refine(
    (d) => new Date(d.endTime) > new Date(d.startTime),
    { message: 'L\'orario di fine deve essere successivo a quello di inizio', path: ['endTime'] },
)

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>

export type AppointmentActionResult =
    | { success: true; appointmentId: string }
    | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// bookAppointment
// ─────────────────────────────────────────────────────────────────────────────
export async function bookAppointment(input: BookAppointmentInput): Promise<AppointmentActionResult> {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        const parsed = bookAppointmentSchema.safeParse(input)
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0]?.message ?? 'Dati non validi'
            return { success: false, error: firstIssue }
        }

        const data = parsed.data

        // Verifica che lo studio esista e che l'utente che prenota sia il professionista
        // (owner dello studio) oppure il cliente stesso
        const { data: studio, error: studioError } = await supabase
            .from('professional_studios')
            .select('id, owner_id')
            .eq('id', data.studioId)
            .is('deleted_at', null)
            .single()

        if (studioError || !studio) {
            return { success: false, error: 'Studio non trovato.' }
        }

        const isOwner = studio.owner_id === user.id
        const isClient = data.clientProfileId === user.id

        if (!isOwner && !isClient) {
            return { success: false, error: 'Non hai i permessi per prenotare in questo studio.' }
        }

        // Verifica conflitti di sovrapposizione per il professionista
        const { data: conflicts } = await supabase
            .from('studio_appointments')
            .select('id')
            .eq('studio_id', data.studioId)
            .eq('professional_id', studio.owner_id)
            .not('status', 'eq', 'cancelled')
            .is('deleted_at', null)
            .lt('start_time', data.endTime)
            .gt('end_time', data.startTime)

        if (conflicts && conflicts.length > 0) {
            return { success: false, error: 'Lo slot selezionato si sovrappone a un appuntamento esistente.' }
        }

        // Inserimento — mapping camelCase → snake_case
        const { data: appt, error: insertError } = await supabase
            .from('studio_appointments')
            .insert({
                studio_id: data.studioId,
                client_id: data.clientProfileId,
                professional_id: studio.owner_id,
                start_time: data.startTime,
                end_time: data.endTime,
                service_type: data.serviceType ?? null,
                notes: data.notes ?? null,
                status: 'pending',
                is_external_blocker: false,
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('[bookAppointment] insert error:', insertError)
            return { success: false, error: 'Errore durante la prenotazione. Riprova.' }
        }

        revalidatePath('/dashboard')
        return { success: true, appointmentId: appt.id }
    } catch (err) {
        console.error('[bookAppointment] Unexpected error:', err)
        return { success: false, error: 'Errore imprevisto. Riprova più tardi.' }
    }
}
