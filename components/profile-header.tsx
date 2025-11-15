'use client'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import Avatar from './avatar'

export default function ProfileHeader({ user }: { user: any }) {
    console.log('ProfileHeader avatarUrl:', user?.avatarUrl)
    return (
        <div className="bg-white p-6 rounded shadow flex gap-6">
            <Avatar
                src={user?.avatarUrl}
                alt={`${user?.firstName} ${user?.lastName}`}
                size="xl"
                fallbackText={user?.firstName?.[0] || 'U'}
                className="w-28 h-28"
            />
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold">{user?.firstName} {user?.lastName}</h1>
                        <div className="text-sm text-gray-600">{user?.currentRole}</div>
                        <div className="text-sm text-gray-500 mt-1">{user?.email}</div>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded text-sm flex items-center gap-2"><PencilSquareIcon className="w-4 h-4" /> Modifica</button>
                    </div>
                </div>
                <p className="text-sm text-gray-700 mt-3">{user?.bio}</p>
            </div>
        </div>
    )
}
