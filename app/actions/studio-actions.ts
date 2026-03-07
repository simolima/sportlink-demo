'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase-server'

// ─────────────────────────────────────────────────────────────────────────────
// Schema Zod
// ─────────────────────────────────────────────────────────────────────────────
export const studioSchema = z.object({
    name: z
        .string()
        .min(1, 'Il nome è obbligatorio')
        .max(150, 'Nome troppo lungo'),
    city: z
        .string()
        .min(1, 'La città è obbligatoria')
        .max(100, 'Città troppo lunga'),
    address: z
        .string()
        .max(250, 'Indirizzo troppo lungo')
        .nullable()
        .optional(),
    phone: z
        .string()
        .max(30, 'Numero troppo lungo')
        .nullable()
        .optional(),
    website: z
        .string()
        .url('URL non valido')
        .nullable()
        .optional()
        .or(z.literal('')),
    description: z
        .string()
        .max(1000, 'Descrizione troppo lunga')
        .nullable()
        .optional(),
    // Array di stringhe — min 1 servizio richiesto
    services_offered: z
        .array(z.string().min(1).max(80))
        .min(1, 'Indica almeno un servizio offerto')
        .max(20, 'Troppi servizi'),
})

export type StudioInput = z.infer<typeof studioSchema>

export type ActionResult =
    | { success: true; studioId: string }
    | { success: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// createOrUpdateStudio — upsert basato su owner_id
// ─────────────────────────────────────────────────────────────────────────────
export async function createOrUpdateStudio(input: StudioInput): Promise<ActionResult> {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Non autenticato. Effettua il login.' }
        }

        const parsed = studioSchema.safeParse(input)
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0]?.message ?? 'Dati non validi'
            return { success: false, error: firstIssue }
        }

        const data = parsed.data

        // Cerca se esiste già uno studio dell'utente (uno studio per owner)
        const { data: existing } = await supabase
            .from('professional_studios')
            .select('id')
            .eq('owner_id', user.id)
            .is('deleted_at', null)
            .maybeSingle()

        const payload = {
            owner_id: user.id,
            name: data.name,
            city: data.city,
            address: data.address ?? null,
            phone: data.phone ?? null,
            website: data.website || null,
            description: data.description ?? null,
            services_offered: data.services_offered,
        }

        let studioId: string

        if (existing) {
            // UPDATE
            const { data: updated, error: updateError } = await supabase
                .from('professional_studios')
                .update(payload)
                .eq('id', existing.id)
                .select('id')
                .single()

            if (updateError) {
                console.error('[createOrUpdateStudio] update error:', updateError)
                return { success: false, error: 'Errore durante l\'aggiornamento. Riprova.' }
            }
            studioId = updated.id
        } else {
            // INSERT
            const { data: created, error: insertError } = await supabase
                .from('professional_studios')
                .insert(payload)
                .select('id')
                .single()

            if (insertError) {
                console.error('[createOrUpdateStudio] insert error:', insertError)
                return { success: false, error: 'Errore durante la creazione. Riprova.' }
            }
            studioId = created.id
        }

        revalidatePath('/dashboard')
        return { success: true, studioId }
    } catch (err) {
        console.error('[createOrUpdateStudio] Unexpected error:', err)
        return { success: false, error: 'Errore imprevisto. Riprova più tardi.' }
    }
}
