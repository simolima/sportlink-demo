export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { withCors, handleOptions } from '@/lib/cors'

export async function OPTIONS() {
    return handleOptions()
}

/**
 * Proxy server-side per Places API (New) — autocomplete + place details.
 * Evita completamente il caricamento del Google Maps JS SDK nel browser.
 *
 * GET /api/places-autocomplete?input=via+roma+10&type=autocomplete
 * GET /api/places-autocomplete?placeId=ChIJ...&type=details
 */
export async function GET(req: Request) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
        return withCors(NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 }))
    }

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'autocomplete'

    try {
        if (type === 'autocomplete') {
            const input = url.searchParams.get('input')
            if (!input || input.trim().length < 2) {
                return withCors(NextResponse.json({ suggestions: [] }))
            }

            const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                },
                body: JSON.stringify({
                    input: input.trim(),
                    includedPrimaryTypes: ['street_address', 'subpremise', 'premise', 'route'],
                    includedRegionCodes: ['it', 'ch', 'sm', 'va'],
                    languageCode: 'it',
                }),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                console.error('[places-autocomplete] Google API error:', res.status, errorData)
                return withCors(NextResponse.json({ error: 'Google Places API error', detail: errorData }, { status: res.status }))
            }

            const data = await res.json()
            const suggestions = (data.suggestions || []).map((s: any) => ({
                placeId: s.placePrediction?.placeId || '',
                mainText: s.placePrediction?.structuredFormat?.mainText?.text || '',
                secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text || '',
                fullText: s.placePrediction?.text?.text || '',
            }))

            return withCors(NextResponse.json({ suggestions }))
        }

        if (type === 'details') {
            const placeId = url.searchParams.get('placeId')
            if (!placeId) {
                return withCors(NextResponse.json({ error: 'placeId required' }, { status: 400 }))
            }

            const fields = 'formattedAddress,location,addressComponents'
            const res = await fetch(
                `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=${fields}&languageCode=it`,
                {
                    headers: {
                        'X-Goog-Api-Key': apiKey,
                        'X-Goog-FieldMask': fields,
                    },
                }
            )

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                console.error('[places-details] Google API error:', res.status, errorData)
                return withCors(NextResponse.json({ error: 'Google Places API error', detail: errorData }, { status: res.status }))
            }

            const place = await res.json()

            // Estrai la città dai componenti
            let city = ''
            for (const comp of (place.addressComponents || [])) {
                const types = comp.types || []
                if (types.includes('locality')) { city = comp.longText || comp.shortText || ''; break }
                if (types.includes('administrative_area_level_3')) city = comp.longText || comp.shortText || ''
            }

            return withCors(NextResponse.json({
                address: place.formattedAddress || '',
                city,
                lat: place.location?.latitude ?? 0,
                lng: place.location?.longitude ?? 0,
            }))
        }

        return withCors(NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 }))
    } catch (error: any) {
        console.error('[places-autocomplete] Error:', error.message)
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }))
    }
}
