import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { getFollowersCount, getFollowingCount } from '../lib/services';

export default function ProfileScreen({ currentUser, onLogout }: { currentUser: any; onLogout: () => void }) {
    const [loading, setLoading] = useState(true);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [applicationsCount, setApplicationsCount] = useState(0);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const [followers, following] = await Promise.all([
                getFollowersCount(currentUser.id),
                getFollowingCount(currentUser.id),
            ]);

            setFollowersCount(followers);
            setFollowingCount(following);
            // TODO: Fetch applications count
            setApplicationsCount(0);
        } catch (error) {
            console.error('Errore caricamento dati utente:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Cover Image */}
            <View style={styles.coverContainer}>
                {currentUser.coverUrl ? (
                    <Image source={{ uri: currentUser.coverUrl }} style={styles.coverImage} />
                ) : (
                    <View style={styles.coverPlaceholder} />
                )}
            </View>

            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                    {currentUser.avatarUrl ? (
                        <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={styles.userName}>
                    {currentUser.firstName} {currentUser.lastName}
                </Text>
                <Text style={styles.userRole}>{currentUser.currentRole || 'Atleta'}</Text>
                {currentUser.bio && (
                    <Text style={styles.userBio}>{currentUser.bio}</Text>
                )}

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{applicationsCount}</Text>
                        <Text style={styles.statLabel}>Candidature</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{followersCount}</Text>
                        <Text style={styles.statLabel}>Follower</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{followingCount}</Text>
                        <Text style={styles.statLabel}>Seguiti</Text>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Activity Section */}
            <View style={styles.activitySection}>
                <Text style={styles.sectionTitle}>Attività Recente</Text>
                {loading ? (
                    <Text style={styles.loadingText}>Caricamento...</Text>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Nessuna attività recente</Text>
                        <Text style={styles.emptySubtext}>
                            Le tue candidature e interazioni appariranno qui
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdf4',
    },
    coverContainer: {
        height: 150,
        backgroundColor: '#dcfce7',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#16a34a',
    },
    profileHeader: {
        backgroundColor: 'white',
        paddingBottom: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    avatarContainer: {
        marginTop: -50,
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'white',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#16a34a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
    },
    avatarText: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 16,
        color: '#16a34a',
        fontWeight: '500',
        marginBottom: 8,
    },
    userBio: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 32,
        marginTop: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    logoutButton: {
        marginTop: 16,
        backgroundColor: '#dc2626',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    activitySection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
    },
    loadingText: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 20,
    },
    emptyState: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 8,
        textAlign: 'center',
    },
});
