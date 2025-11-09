'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ProfileLink() {
    const [id, setId] = useState<string | null>(null)
    const [name, setName] = useState<string | null>(null)
    useEffect(() => {
        if (typeof window === 'undefined') return
        setId(localStorage.getItem('currentUserId'))
        setName(localStorage.getItem('currentUserName'))
    }, [])

    if (!id) return <Link href="/create-profile" className="text-sm text-gray-600">Crea profilo</Link>
    return <Link href={`/profile/${id}`} className="text-sm text-gray-600">{name ?? 'Profilo'}</Link>
}
