import { describe, it, expect } from 'vitest'
import { NextResponse } from 'next/server'
import { corsHeaders, withCors, handleOptions } from '../cors'

// ============================================================================
// corsHeaders constant
// ============================================================================
describe('corsHeaders', () => {
    it('contains Access-Control-Allow-Origin: *', () => {
        expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*')
    })

    it('contains Access-Control-Allow-Methods with common methods', () => {
        const methods = corsHeaders['Access-Control-Allow-Methods']
        expect(methods).toContain('GET')
        expect(methods).toContain('POST')
        expect(methods).toContain('DELETE')
        expect(methods).toContain('OPTIONS')
    })

    it('contains Access-Control-Allow-Headers with Content-Type', () => {
        expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Content-Type')
    })
})

// ============================================================================
// withCors
// ============================================================================
describe('withCors', () => {
    it('adds CORS headers to a NextResponse', () => {
        const response = NextResponse.json({ ok: true })
        const result = withCors(response)

        expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*')
        expect(result.headers.get('Access-Control-Allow-Methods')).toBeTruthy()
        expect(result.headers.get('Access-Control-Allow-Headers')).toBeTruthy()
    })

    it('preserves the original response body', async () => {
        const data = { name: 'SportLink', version: 1 }
        const response = NextResponse.json(data)
        const result = withCors(response)

        const body = await result.json()
        expect(body).toEqual(data)
    })

    it('preserves the original response status', () => {
        const response = NextResponse.json({ error: 'not_found' }, { status: 404 })
        const result = withCors(response)

        expect(result.status).toBe(404)
        expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })
})

// ============================================================================
// handleOptions
// ============================================================================
describe('handleOptions', () => {
    it('returns a response with status 200', () => {
        const result = handleOptions()
        expect(result.status).toBe(200)
    })

    it('includes CORS headers', () => {
        const result = handleOptions()
        expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*')
        expect(result.headers.get('Access-Control-Allow-Methods')).toBeTruthy()
        expect(result.headers.get('Access-Control-Allow-Headers')).toBeTruthy()
    })

    it('has null body (preflight has no content)', async () => {
        const result = handleOptions()
        const text = await result.text()
        expect(text).toBe('')
    })
})
