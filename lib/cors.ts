import { NextResponse } from 'next/server';

// CORS headers per permettere al mobile di chiamare le API
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper per aggiungere CORS a una risposta
export function withCors(response: NextResponse) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

// Handler per OPTIONS (preflight)
export function handleOptions() {
    return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
    });
}
