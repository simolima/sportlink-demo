import clsx from 'clsx'

interface AvatarProps {
    src?: string | null
    alt?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    fallbackText?: string
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl'
}

// Palette di colori consistenti — stesso colore per lo stesso nome ovunque
const AVATAR_COLORS = [
    'bg-[#2341F0]',      // sprinta-blue
    'bg-emerald-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-indigo-500',
    'bg-teal-500',
]

/**
 * Genera un indice colore deterministico dal testo (es. nome utente).
 * Stesso input → stesso colore sempre, su tutti i componenti.
 */
export function getAvatarColorClass(text: string): string {
    if (!text) return AVATAR_COLORS[0]
    let hash = 0
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/**
 * Avatar Component
 *
 * Displays user avatar with automatic fallback to initials.
 * The fallback background color is deterministic based on fallbackText
 * so the same user always gets the same color everywhere.
 */
export default function Avatar({
    src,
    alt = 'Avatar',
    size = 'md',
    className = '',
    fallbackText = '?'
}: AvatarProps) {
    const sizeClass = sizeClasses[size]
    const colorClass = getAvatarColorClass(fallbackText)
    const initials = fallbackText.slice(0, 2).toUpperCase()

    // Show fallback if no src
    if (!src) {
        return (
            <div className={clsx(
                'rounded-full flex items-center justify-center text-white font-semibold shrink-0',
                colorClass,
                className || sizeClass
            )}>
                {initials}
            </div>
        )
    }

    const imgProps: any = {
        src,
        alt,
        className: 'w-full h-full object-cover'
    }
    if (typeof window !== 'undefined') {
        imgProps.onError = (e: any) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            if (target.parentElement) {
                // Recupera la classe colore già applicata al wrapper
                target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-semibold">${initials}</div>`
            }
        }
    }

    return (
        <div className={clsx(
            'relative rounded-full overflow-hidden shrink-0',
            colorClass,   // colore visibile durante il caricamento e come fallback
            className || sizeClass
        )}>
            <img {...imgProps} />
        </div>
    )
}

