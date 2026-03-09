'use client'

import { useState, useRef } from 'react'
import { Message, GroupMessage, MessageReaction, ReplyPreview, ReactionType } from '@/lib/types'
import clsx from 'clsx'
import { Check, CheckCheck, CornerUpRight, Pencil } from 'lucide-react'
import MessageContextMenu, { MessageAction } from './MessageContextMenu'
import ReactionsPopover from './ReactionsPopover'
import { REACTION_ICONS, REACTION_LABELS } from './reactionIcons'

/** Unified message type accepted by the bubble */
export type BubbleMessage = Pick<Message,
    'id' | 'senderId' | 'timestamp' | 'replyTo' | 'editedAt' | 'isDeletedForAll' | 'forwardedFrom' | 'reactions'
> & { text: string | null; read?: boolean } & Partial<Pick<GroupMessage, 'senderName' | 'senderColor'>>

const EDIT_WINDOW_MS = 15 * 60 * 1000

interface Props {
    message: BubbleMessage
    isMine: boolean
    showAvatar?: boolean
    showSenderName?: boolean
    senderName?: string | null
    senderAvatar?: string | null
    senderColor?: string | null
    currentUserId: string
    onReply: (msg: BubbleMessage) => void
    onEdit: (msg: BubbleMessage) => void
    onDeleteForAll: (id: string) => void
    onDeleteForMe: (id: string) => void
    onForward: (msg: BubbleMessage) => void
    onReact: (messageId: string, reaction: ReactionType) => void
}

export default function MessageBubble({
    message, isMine, showAvatar = false, showSenderName = false,
    senderName, senderAvatar, senderColor, currentUserId,
    onReply, onEdit, onDeleteForAll, onDeleteForMe, onForward, onReact,
}: Props) {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
    const [reactionPickerOpen, setReactionPickerOpen] = useState(false)
    const [reactionsPopoverOpen, setReactionsPopoverOpen] = useState(false)
    const bubbleRef = useRef<HTMLDivElement>(null)

    const time = new Date(message.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    const canEdit = isMine && !message.isDeletedForAll && (Date.now() - new Date(message.timestamp).getTime()) < EDIT_WINDOW_MS
    const deletedForAll = message.isDeletedForAll ?? false
    const reactions: MessageReaction[] = message.reactions ?? []
    const replyTo: ReplyPreview | undefined = message.replyTo

    const handleContextMenu = (e: React.MouseEvent) => {
        if (deletedForAll) return
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY })
    }

    const handleLongPress = () => {
        if (deletedForAll) return
        const rect = bubbleRef.current?.getBoundingClientRect()
        if (rect) setContextMenu({ x: rect.left, y: rect.bottom + 4 })
    }

    const actions: MessageAction = {
        canEdit,
        canDeleteForAll: isMine && !deletedForAll,
        canReply: !deletedForAll,
        canForward: !deletedForAll && !!message.text,
    }

    return (
        <div className={clsx('flex mb-2 group', isMine ? 'justify-end' : 'justify-start')}>
            {/* Avatar */}
            {!isMine && showAvatar && (
                <div className="mr-2 flex-shrink-0 self-end">
                    {senderAvatar ? (
                        <img src={senderAvatar} alt={senderName || 'U'} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                            style={{ background: senderColor || '#3B52F5' }}
                        >
                            {(senderName || 'U')[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            )}

            <div className="relative max-w-[70%] flex flex-col">
                {/* Sender name (groups) */}
                {!isMine && showSenderName && senderName && (
                    <span
                        className="text-[11px] font-semibold mb-0.5 ml-1"
                        style={{ color: senderColor || '#3B52F5' }}
                    >
                        {senderName}
                    </span>
                )}

                {/* Bubble */}
                <div
                    ref={bubbleRef}
                    onContextMenu={handleContextMenu}
                    className={clsx(
                        'rounded-2xl px-4 py-2.5 shadow-sm cursor-pointer select-text',
                        isMine ? 'bg-[#2341F0] text-white' : 'bg-base-200 text-base-content'
                    )}
                >
                    {/* Reply quote */}
                    {replyTo && !deletedForAll && (
                        <div
                            className={clsx(
                                'rounded-lg px-2.5 py-1.5 mb-2 border-l-[3px] text-[12px]',
                                isMine
                                    ? 'border-white/40 bg-white/10 text-white/80'
                                    : 'border-primary bg-primary/8 text-secondary'
                            )}
                        >
                            <p className="font-semibold truncate">{replyTo.senderName}</p>
                            <p className="truncate opacity-80">
                                {replyTo.text == null ? 'Messaggio eliminato' : replyTo.text}
                            </p>
                        </div>
                    )}

                    {/* Forwarded badge */}
                    {message.forwardedFrom && !deletedForAll && (
                        <div className={clsx(
                            'flex items-center gap-1 text-[11px] mb-1 font-medium',
                            isMine ? 'text-white/70' : 'text-secondary'
                        )}>
                            <CornerUpRight size={11} />
                            <span>Inoltrato</span>
                        </div>
                    )}

                    {/* Text */}
                    {deletedForAll ? (
                        <p className={clsx(
                            'text-[13px] italic',
                            isMine ? 'text-white/60' : 'text-secondary'
                        )}>
                            Messaggio eliminato
                        </p>
                    ) : (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {message.text}
                        </p>
                    )}

                    {/* Footer */}
                    <div className={clsx(
                        'flex items-center gap-1.5 mt-1 justify-end',
                        isMine ? 'text-white/60' : 'text-secondary/60'
                    )}>
                        {!deletedForAll && message.editedAt && (
                            <Pencil size={10} className="opacity-70" aria-label="Modificato" />
                        )}
                        <span className="text-[11px]">{time}</span>
                        {isMine && !deletedForAll && (
                            message.read
                                ? <CheckCheck size={13} className="text-white/80" />
                                : <Check size={13} className="text-white/50" />
                        )}
                    </div>
                </div>

                {/* Reaction pills */}
                {reactions.length > 0 && (
                    <div
                        className={clsx('flex flex-wrap gap-1 mt-1', isMine ? 'justify-end' : 'justify-start')}
                    >
                        {reactions.map(r => {
                            const Icon = REACTION_ICONS[r.type as ReactionType]
                            return (
                                <button
                                    key={r.type}
                                    onClick={() => onReact(message.id as string, r.type as ReactionType)}
                                    className={clsx(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors',
                                        r.hasMyReaction
                                            ? 'bg-primary/15 border-primary/40 text-primary'
                                            : 'bg-base-200 border-base-300 text-secondary hover:bg-base-300'
                                    )}
                                    title={REACTION_LABELS[r.type as ReactionType]}
                                    aria-label={`${REACTION_LABELS[r.type as ReactionType]}: ${r.count}`}
                                >
                                    {Icon && <Icon size={11} />}
                                    <span>{r.count}</span>
                                </button>
                            )
                        })}
                        {/* Tap to see who reacted */}
                        <div className="relative">
                            {reactionsPopoverOpen && (
                                <ReactionsPopover reactions={reactions} onClose={() => setReactionsPopoverOpen(false)} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick reaction picker (hover) */}
            {!deletedForAll && (
                <div className={clsx(
                    'hidden group-hover:flex items-center gap-0.5 mx-1.5 self-center',
                    isMine ? 'order-first' : 'order-last'
                )}>
                    {(Object.keys(REACTION_ICONS) as ReactionType[]).map(type => {
                        const Icon = REACTION_ICONS[type]
                        return (
                            <button
                                key={type}
                                onClick={() => onReact(message.id as string, type)}
                                className="btn btn-ghost btn-xs btn-circle hover:text-primary"
                                title={REACTION_LABELS[type]}
                                aria-label={REACTION_LABELS[type]}
                            >
                                <Icon size={13} />
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Context menu */}
            {contextMenu && (
                <MessageContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    isMine={isMine}
                    actions={actions}
                    onClose={() => setContextMenu(null)}
                    onReply={() => onReply(message)}
                    onEdit={() => onEdit(message)}
                    onDeleteForAll={() => onDeleteForAll(message.id as string)}
                    onDeleteForMe={() => onDeleteForMe(message.id as string)}
                    onForward={() => onForward(message)}
                    onCopy={() => navigator.clipboard.writeText(message.text || '')}
                />
            )}
        </div>
    )
}
