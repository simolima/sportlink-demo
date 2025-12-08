import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function FeedScreen({ currentUser }: { currentUser: any }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeApplications: 0,
        opportunities: 0,
        messages: 0
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            // TODO: Load dashboard stats
            setStats({
                activeApplications: 0,
                opportunities: 5,
                messages: 2
            });
        } catch (error) {
            console.error('Errore caricamento dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loadingText}>Caricamento...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header Banner */}
            <View style={styles.header}>
                <Text style={styles.logo}>SPRINTA</Text>
                <Text style={styles.subtitle}>Il tuo gestionale sportivo</Text>
            </View>

            {/* Welcome Section */}
            <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>
                    Bentornato, {currentUser?.firstName || 'Utente'}! 👋
                </Text>
                <Text style={styles.welcomeSubtitle}>
                    {currentUser?.sport || 'Sport'} • {currentUser?.professionalRole || 'Atleta'}
                </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Ionicons name="briefcase-outline" size={32} color="#16a34a" />
                    <Text style={styles.statValue}>{stats.activeApplications}</Text>
                    <Text style={styles.statLabel}>Candidature</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="trophy-outline" size={32} color="#eab308" />
                    <Text style={styles.statValue}>{stats.opportunities}</Text>
                    <Text style={styles.statLabel}>Opportunità</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="mail-outline" size={32} color="#3b82f6" />
                    <Text style={styles.statValue}>{stats.messages}</Text>
                    <Text style={styles.statLabel}>Messaggi</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Azioni Rapide</Text>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="search-outline" size={24} color="#16a34a" />
                    <Text style={styles.actionText}>Cerca Opportunità</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="document-text-outline" size={24} color="#16a34a" />
                    <Text style={styles.actionText}>Aggiorna Profilo</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="people-outline" size={24} color="#16a34a" />
                    <Text style={styles.actionText}>Esplora Network</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attività Recente</Text>
                <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color="#d1d5db" />
                    <Text style={styles.emptyText}>Nessuna attività recente</Text>
                    <Text style={styles.emptySubtext}>
                        Inizia candidandoti a nuove opportunità
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 20,
        paddingVertical: 24,
        paddingTop: 60,
    },
    logo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    welcomeCard: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    welcomeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    actionText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        marginLeft: 12,
        fontWeight: '500',
    },
    emptyState: {
        backgroundColor: 'white',
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
        textAlign: 'center',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    loadingText: {
        fontSize: 16,
        color: '#16a34a',
    },
});
