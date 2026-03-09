'use client'

import { useState } from 'react'
import { X, Crown, UserMinus, UserPlus, LogOut, Trash2 } from 'lucide-react'
import { GroupMember } from '@/lib/types'
import { getAuthHeaders } from '@/lib/auth-fetch'
import clsx from 'clsx'

interface Props {
    groupId: string
    groupName: string
    members: GroupMember[]
    currentUserId: string
    isCurrentUserAdmin: boolean
    onClose: () => void
    onGroupDeleted: () => void
    onMembersUpdated: (members: GroupMember[]) => void
}

export default function ManageGroupModal({
    groupId,
    groupName,
    members,
    currentUserId,
    isCurrentUserAdmin,
    onClose,
    onGroupDeleted,
    onMembersUpdated,
}: Props) {
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [loading, setLoading] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const displayName = (m: GroupMember) =>
        `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Utente'

    const promote = async (member: GroupMember) => {
        setLoading(member.userId)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            const newRole = member.role === 'admin' ? 'member' : 'admin'
            await fetch(`/api/groups/${groupId}/members`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ userId: member.userId, role: newRole }),
            })
            onMembersUpdated(members.map(m => m.userId === member.userId ? { ...m, role: newRole } : m))
        } catch {
            setError('Errore aggiornamento ruolo')
        } finally {
            setLoading(null)
        }
    }

    const remove = async (member: GroupMember) => {
        setLoading(member.userId)
        setError(null)
        try {
            const headers = await getAuthHeaders()
            await fetch(`/api/groups/${groupId}/members`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ userId: member.userId }),
            })
            onMembersUpdated(members.filter(m => m.userId !== member.userId))
        } catch {
            setError('Errore rimozione membro')
        } finally {
            setLoading(null)
        }
    }

    const leave = async () => {
        setLoading('leave')
        try {
            const headers = await getAuthHeaders()
            await fetch(`/api/groups/${groupId}/members`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ userId: currentUserId }),
            })
            onGroupDeleted()
        } catch {
            setError('Errore uscita gruppo')
            setLoading(null)
        }
    }

    const deleteGroup = async () => {
        setLoading('delete')
        try {
            const headers = await getAuthHeaders()
            await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', ...headers },
            })
            onGroupDeleted()
        } catch {
            setError('Errore eliminazione gruppo')
            setLoading(null)
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-group-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
            <div className="glass-widget w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="glass-widget-header flex items-center justify-between px-5 py-4 flex-shrink-0">
                    <h2 id="manage-group-title" className="font-semibold text-base-content">{groupName}</h2>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-square">
                        <X size={18} />
                    </button>
                </div>

                {/* Members list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">
                        Membri ({members.length})
                    </p>
                    {members.map(m => {
                        const isSelf = m.userId === currentUserId
                        const isProcessing = loading === m.userId
                        return (
                            <div key={m.userId} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-base-200 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                                    {displayName(m)[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-base-content truncate">
                                        {displayName(m)} {isSelf && <span className="text-xs text-secondary font-normal">(tu)</span>}
                                    </p>
                                    <p className="text-xs text-secondary capitalize">{m.role}</p>
                                </div>
                                {m.role === 'admin' && (
                                    <Crown size={14} className="text-warning flex-shrink-0" />
                                )}
                                {!isSelf && isCurrentUserAdmin && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => promote(m)}
                                            disabled={!!loading}
                                            className="btn btn-ghost btn-xs"
                                            title={m.role === 'admin' ? 'Rimuovi admin' : 'Promuovi admin'}
                                        >
                                            {isProcessing ? '...' : m.role === 'admin' ? 'Rimuovi admin' : 'Promuovi'}
                                        </button>
                                        <button
                                            onClick={() => remove(m)}
                                            disabled={!!loading}
                                            className="btn btn-ghost btn-xs text-error"
                                            title="Rimuovi dal gruppo"
                                        >
                                            <UserMinus size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-base-300/50 space-y-2 flex-shrink-0">
                    {error && <p className="text-error text-sm text-center">{error}</p>}

                    {!confirmDelete && (
                        <>
                            <button
                                onClick={leave}
                                disabled={!!loading}
                                className="btn btn-ghost btn-sm w-full text-warning flex items-center gap-2"
                            >
                                <LogOut size={15} />
                                {loading === 'leave' ? 'Uscita...' : 'Esci dal gruppo'}
                            </button>
                            {isCurrentUserAdmin && (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="btn btn-ghost btn-sm w-full text-error flex items-center gap-2"
                                >
                                    <Trash2 size={15} />
                                    Elimina gruppo
                                </button>
                            )}
                        </>
                    )}

                    {confirmDelete && (
                        <div className="text-center space-y-2">
                            <p className="text-sm text-base-content">Eliminare il gruppo per tutti i membri?</p>
                            <div className="flex gap-2">
                                <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm flex-1">
                                    Annulla
                                </button>
                                <button
                                    onClick={deleteGroup}
                                    disabled={loading === 'delete'}
                                    className="btn btn-error btn-sm flex-1"
                                >
                                    {loading === 'delete' ? 'Eliminazione...' : 'Elimina'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
