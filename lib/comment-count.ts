export async function getCommentCount(postId: string | number): Promise<number> {
    try {
        const res = await fetch(`/api/comments?postId=${postId}`)
        if (!res.ok) return 0
        const data = await res.json()
        return Array.isArray(data) ? data.length : 0
    } catch {
        return 0
    }
}
