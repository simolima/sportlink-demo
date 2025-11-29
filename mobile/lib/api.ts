import Constants from 'expo-constants';

// Funzione per ottenere automaticamente l'IP del server
function getLocalIP(): string {
    // In sviluppo, Expo fornisce l'IP del server Metro
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (debuggerHost) {
        // debuggerHost è nel formato "192.168.1.12:8081"
        const ip = debuggerHost.split(':')[0];
        return `http://${ip}:3000`;
    }
    
    // Fallback a localhost (non funzionerà su dispositivo fisico)
    return 'http://localhost:3000';
}

// API configuration for mobile app
export const API_CONFIG = {
    // In sviluppo usa l'IP rilevato automaticamente, in produzione usa Vercel
    BASE_URL: __DEV__
        ? getLocalIP()  // Rileva automaticamente l'IP del PC
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
