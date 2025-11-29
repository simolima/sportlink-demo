import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { login } from './lib/services';
import FeedScreen from './screens/FeedScreen';
import ProfileScreen from './screens/ProfileScreen';

type Screen = 'feed' | 'profile';

export default function App() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('feed');

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Errore', 'Inserisci una email');
      return;
    }

    setLoading(true);
    try {
      console.log('Tentativo login con:', email);
      const foundUser = await login(email);
      console.log('Risposta:', foundUser);

      if (foundUser) {
        setUser(foundUser);
        Alert.alert('Successo', `Benvenuto ${foundUser.firstName || foundUser.email}!`);
      } else {
        Alert.alert('Errore', 'Utente non trovato con questa email');
      }
    } catch (error: any) {
      console.error('Errore completo:', error);
      Alert.alert('Errore di Connessione', error.message || 'Impossibile connettersi al server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: () => {
            setUser(null);
            setEmail('');
            setCurrentScreen('feed');
          },
        },
      ]
    );
  };

  // Login Screen
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🏃‍♂️ SportLink Mobile</Text>
        <Text style={styles.subtitle}>Demo Login con API Condivise</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Caricamento...' : 'Accedi'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          💡 Usa una email dal web app{'\n'}
          (es: prova@test.com se l'hai creata)
        </Text>

        <StatusBar style="auto" />
      </View>
    );
  }

  // Main App with Bottom Tabs
  return (
    <View style={styles.appContainer}>
      {/* Content Area */}
      <View style={styles.content}>
        {currentScreen === 'feed' && <FeedScreen currentUser={user} />}
        {currentScreen === 'profile' && (
          <ProfileScreen currentUser={user} onLogout={handleLogout} />
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'feed' && styles.navButtonActive]}
          onPress={() => setCurrentScreen('feed')}
        >
          <Text style={[styles.navIcon, currentScreen === 'feed' && styles.navIconActive]}>
            🏠
          </Text>
          <Text style={[styles.navLabel, currentScreen === 'feed' && styles.navLabelActive]}>
            Feed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentScreen === 'profile' && styles.navButtonActive]}
          onPress={() => setCurrentScreen('profile')}
        >
          <Text style={[styles.navIcon, currentScreen === 'profile' && styles.navIconActive]}>
            👤
          </Text>
          <Text style={[styles.navLabel, currentScreen === 'profile' && styles.navLabelActive]}>
            Profilo
          </Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#15803d',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    marginTop: 20,
    fontSize: 14,
    color: '#15803d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 20,
    paddingTop: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navButtonActive: {
    backgroundColor: '#f0fdf4',
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
});
