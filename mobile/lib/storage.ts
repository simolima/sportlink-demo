import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage per mantenere l'utente loggato
export const storeUser = async (user: any) => {
    try {
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    } catch (error) {
        console.error('Errore salvataggio utente:', error);
    }
};

export const getStoredUser = async () => {
    try {
        const user = await AsyncStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Errore lettura utente:', error);
        return null;
    }
};

export const clearStoredUser = async () => {
    try {
        await AsyncStorage.removeItem('currentUser');
    } catch (error) {
        console.error('Errore rimozione utente:', error);
    }
};
