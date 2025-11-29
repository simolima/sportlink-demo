import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { getPosts } from '../lib/services';

export default function FeedScreen({ currentUser }: { currentUser: any }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showComposer, setShowComposer] = useState(false);
    const [newPostText, setNewPostText] = useState('');

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        try {
            const data = await getPosts();
            setPosts(data);
        } catch (error) {
            console.error('Errore caricamento posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = () => {
        setShowComposer(true);
    };

    const handlePublishPost = async () => {
        if (!newPostText.trim()) {
            Alert.alert('Errore', 'Scrivi qualcosa prima di pubblicare');
            return;
        }

        Alert.alert('Pubblicato!', 'Il tuo post è stato pubblicato');
        setNewPostText('');
        setShowComposer(false);
        // TODO: chiamare API per creare post
    };

    const handleCancelPost = () => {
        setNewPostText('');
        setShowComposer(false);
    };

    const renderPost = ({ item }: { item: any }) => {
        console.log('Rendering post:', item.id, 'User:', item.user);

        return (
            <View style={styles.postCard}>
                <View style={styles.postHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {item.user?.firstName?.[0]?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View style={styles.postUserInfo}>
                        <Text style={styles.userName}>
                            {item.user?.firstName || 'Utente'} {item.user?.lastName || ''}
                        </Text>
                        <Text style={styles.userRole}>{item.user?.currentRole || 'Atleta'}</Text>
                    </View>
                </View>

                <Text style={styles.postContent}>{item.content}</Text>

                {item.imageUrl && (
                    <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
                )}

                <View style={styles.postActions}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionText}>👍 {item.likesCount || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionText}>💬 {item.commentsCount || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionText}>🔄 Condividi</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loadingText}>Caricamento feed...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header Banner */}
            <View style={styles.header}>
                <Text style={styles.logo}>SportLink</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>🔍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>🔔</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Actions Bar */}
            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.createPostButton} onPress={handleCreatePost}>
                    <Text style={styles.createPostIcon}>✍️</Text>
                    <Text style={styles.createPostText}>Crea un post</Text>
                </TouchableOpacity>
            </View>

            {/* Post Composer Modal */}
            {showComposer && (
                <View style={styles.composerOverlay}>
                    <View style={styles.composerCard}>
                        <View style={styles.composerHeader}>
                            <Text style={styles.composerTitle}>Crea un post</Text>
                            <TouchableOpacity onPress={handleCancelPost}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.composerBody}>
                            <View style={styles.composerUserInfo}>
                                <View style={styles.composerAvatar}>
                                    <Text style={styles.avatarText}>
                                        {currentUser?.firstName?.[0]?.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.composerUserName}>
                                    {currentUser?.firstName} {currentUser?.lastName}
                                </Text>
                            </View>

                            <TextInput
                                style={styles.composerInput}
                                placeholder="Cosa vuoi condividere?"
                                placeholderTextColor="#9ca3af"
                                multiline
                                value={newPostText}
                                onChangeText={setNewPostText}
                                autoFocus
                            />
                        </View>

                        <View style={styles.composerFooter}>
                            <TouchableOpacity style={styles.publishButton} onPress={handlePublishPost}>
                                <Text style={styles.publishButtonText}>Pubblica</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Feed List */}
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={loadPosts}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0fdf4',
    },
    header: {
        backgroundColor: '#16a34a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButtonText: {
        fontSize: 18,
    },
    quickActions: {
        backgroundColor: 'white',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    createPostButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        padding: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#16a34a',
    },
    createPostIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    createPostText: {
        fontSize: 16,
        color: '#16a34a',
        fontWeight: '500',
    },
    composerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 20,
    },
    composerCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '100%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    composerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    composerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
    },
    closeButton: {
        fontSize: 24,
        color: '#6b7280',
    },
    composerBody: {
        padding: 16,
    },
    composerUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    composerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#16a34a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    composerUserName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    composerInput: {
        fontSize: 16,
        color: '#374151',
        minHeight: 120,
        textAlignVertical: 'top',
    },
    composerFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    publishButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    publishButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
    },
    loadingText: {
        fontSize: 16,
        color: '#15803d',
    },
    listContent: {
        padding: 16,
    },
    postCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#16a34a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    postUserInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    userRole: {
        fontSize: 14,
        color: '#6b7280',
    },
    postContent: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 12,
    },
    postImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    postActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 12,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        padding: 8,
    },
    actionText: {
        fontSize: 14,
        color: '#16a34a',
        fontWeight: '500',
    },
});
