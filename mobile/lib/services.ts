import { apiCall } from './api';

// Login
async function login(email: string) {
    const users = await apiCall('/api/users');
    const user = users.find((u: any) => u.email === email);
    return user;
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

export { login, getUserProfile, getFollowersCount, getFollowingCount };
