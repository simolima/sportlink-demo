import { apiCall } from './api';

// Login
async function login(email: string) {
    const users = await apiCall('/api/users');
    const user = users.find((u: any) => u.email === email);
    return user;
}

// Get posts with user data and counts
async function getPosts() {
    const [posts, users, likes, comments] = await Promise.all([
        apiCall('/api/posts'),
        apiCall('/api/users'),
        apiCall('/api/likes').catch(() => []),
        apiCall('/api/comments').catch(() => []),
    ]);

    // Attach user data and counts to each post
    return posts.map((post: any) => {
        const postLikes = Array.isArray(likes)
            ? likes.filter((l: any) => l.postId === post.id || String(l.postId) === String(post.id))
            : [];
        const postComments = Array.isArray(comments)
            ? comments.filter((c: any) => c.postId === post.id || String(c.postId) === String(post.id))
            : [];

        // Match by userId field (API now normalizes authorId to userId)
        const foundUser = users.find((u: any) => String(u.id) === String(post.userId));

        return {
            ...post,
            user: foundUser,
            likesCount: postLikes.length,
            commentsCount: postComments.length,
        };
    }).reverse(); // Mostra i più recenti per primi
}

// Create post
async function createPost(userId: string, content: string) {
    return await apiCall('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ userId, content }),
    });
}

// Get user profile
async function getUserProfile(userId: string) {
    const users = await apiCall('/api/users');
    return users.find((u: any) => u.id === userId);
}

// Get followers count
async function getFollowersCount(userId: string) {
    try {
        const follows = await apiCall('/api/follows');
        return follows.filter((f: any) => String(f.followingId) === String(userId)).length;
    } catch {
        return 0;
    }
}

// Get following count
async function getFollowingCount(userId: string) {
    try {
        const follows = await apiCall('/api/follows');
        return follows.filter((f: any) => String(f.followerId) === String(userId)).length;
    } catch {
        return 0;
    }
}

export { login, getPosts, createPost, getUserProfile, getFollowersCount, getFollowingCount };
