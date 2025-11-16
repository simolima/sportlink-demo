'use client'
import { useState, useEffect } from 'react'
import { UserCircleIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface PostComposerProps {
    userPhoto?: string | null
    userName?: string | null
}

export default function PostComposer({ userPhoto, userName }: PostComposerProps) {
    const [text, setText] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [charCount, setCharCount] = useState(0)
    const [playedToday, setPlayedToday] = useState<boolean | null>(null)
    const [teamGoals, setTeamGoals] = useState<string>('')
    const [opponentGoals, setOpponentGoals] = useState<string>('')
    const [scorers, setScorers] = useState<string>('')

    const MAX_CHARS = 500

    const submit = async () => {
        let finalText = text

        if (playedToday === true) {
            if (!teamGoals.trim() || !opponentGoals.trim()) {
                alert('Inserisci il risultato della partita.')
                return
            }
            finalText = `Ho giocato oggi: risultato ${teamGoals}-${opponentGoals}.`
            if (scorers.trim()) finalText += ` Marcatori: ${scorers.trim()}.`
        } else {
            if (!finalText.trim()) {
                alert('Scrivi qualcosa!')
                return
            }
        }
        setLoading(true)
        try {
            const authorId = typeof window !== 'undefined' ? localStorage.getItem('currentUserId') : null
            await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: finalText,
                    imageUrl: imageUrl || null,
                    authorName: userName || 'Anon',
                    authorId: authorId ? Number(authorId) : null
                })
            })
            setText('')
            setImageUrl('')
            setPlayedToday(null)
            setTeamGoals('')
            setOpponentGoals('')
            setScorers('')
            setIsExpanded(false)
            setCharCount(0)
            // Reload to refresh feed
            window.location.reload()
        } catch (e) {
            console.error(e)
            alert('Errore durante la pubblicazione')
        } finally {
            setLoading(false)
        }
    }

    const handleTextChange = (value: string) => {
        if (value.length <= MAX_CHARS) {
            setText(value)
            setCharCount(value.length)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            {/* Compact View */}
            {!isExpanded ? (
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setIsExpanded(true)}>
                    <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {userPhoto ? (
                            <img src={userPhoto} alt={userName || ''} className="w-full h-full object-cover" />
                        ) : (
                            <UserCircleIcon className="w-6 h-6 text-gray-400" />
                        )}
                    </div>
                    <button className="flex-1 text-left px-4 py-3 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition">
                        Di cosa stai pensando, {userName?.split(' ')[0]}?
                    </button>
                </div>
            ) : (
                /* Expanded View */
                <div>
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {userPhoto ? (
                                <img src={userPhoto} alt={userName || ''} className="w-full h-full object-cover" />
                            ) : (
                                <UserCircleIcon className="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">{userName}</p>
                            <p className="text-sm text-gray-500">Condividi con i tuoi contatti</p>
                        </div>
                        <button
                            onClick={() => {
                                setIsExpanded(false)
                                setText('')
                                setImageUrl('')
                                setCharCount(0)
                                setPlayedToday(null)
                                setTeamGoals('')
                                setOpponentGoals('')
                                setScorers('')
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Textarea */}
                    {/* Guided sport prompt */}
                    {playedToday === null ? (
                        <div className="flex flex-col gap-3">
                            <p className="font-medium">Hai giocato oggi?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPlayedToday(true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-full"
                                >
                                    Sì
                                </button>
                                <button
                                    onClick={() => setPlayedToday(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    ) : playedToday === false ? (
                        <>
                            <textarea
                                value={text}
                                onChange={e => handleTextChange(e.target.value)}
                                placeholder="Di cosa stai pensando?"
                                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none h-24"
                            />
                            <div className="mt-2 text-xs text-gray-500 text-right">
                                {charCount}/{MAX_CHARS}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <label className="flex-1">
                                    <div className="text-sm text-gray-600 mb-1">I tuoi gol</div>
                                    <input
                                        value={teamGoals}
                                        onChange={e => setTeamGoals(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                        placeholder="Es. 2"
                                    />
                                </label>
                                <label className="flex-1">
                                    <div className="text-sm text-gray-600 mb-1">Gol avversario</div>
                                    <input
                                        value={opponentGoals}
                                        onChange={e => setOpponentGoals(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                        placeholder="Es. 1"
                                    />
                                </label>
                            </div>
                            <label>
                                <div className="text-sm text-gray-600 mb-1">Marcatori (separati da virgola)</div>
                                <input
                                    value={scorers}
                                    onChange={e => setScorers(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                                    placeholder="Es. Rossi, Bianchi"
                                />
                            </label>
                            <div className="text-sm text-gray-500">Puoi aggiungere un'immagine o lasciare così.</div>
                        </div>
                    )}

                    {/* Image URL input */}
                    <div className="mt-4">
                        <label className="flex items-center gap-2 text-sm text-gray-600 mb-2 font-medium">
                            <PhotoIcon className="w-4 h-4" />
                            Aggiungi immagine (opzionale)
                        </label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            placeholder="Incolla un URL immagine pubblico (es. imgur, unsplash, etc.)"
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                        />
                        {imageUrl && (
                            <div className="mt-3 rounded-lg overflow-hidden border-2 border-gray-200">
                                <img src={imageUrl} alt="preview" className="w-full h-48 object-cover" onError={() => alert('Immagine non caricata. Verifica l\'URL.')} />
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-3 pt-4 border-t">
                        <button
                            onClick={() => {
                                setIsExpanded(false)
                                setText('')
                                setImageUrl('')
                                setCharCount(0)
                                setPlayedToday(null)
                                setTeamGoals('')
                                setOpponentGoals('')
                                setScorers('')
                            }}
                            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition font-semibold"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={submit}
                            disabled={
                                loading ||
                                (playedToday === true
                                    ? !teamGoals.trim() || !opponentGoals.trim()
                                    : !text.trim())
                            }
                            className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Pubblicando...' : 'Pubblica'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
