// API configuration for mobile app
export const API_CONFIG = {
    // Cambia questo URL dopo il deploy su Vercel
    BASE_URL: __DEV__
        ? 'http://192.168.1.37:3000'  // Sviluppo locale - IP del tuo PC
        : 'https://sportlink-demo.vercel.app', // Production
};

// Helper per chiamare le API
export async function apiCall(endpoint: string, options?: RequestInit) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    } catch (error: any) {
        if (error.message?.includes('Network request failed')) {
            throw new Error('Errore di rete: Assicurati che PC e telefono siano sulla stessa WiFi e che il server sia su ' + API_CONFIG.BASE_URL);
        }
        throw error;
    }
}
