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

/** Colore unico per tutti gli avatar senza immagine — blu Sprinta */
export const AVATAR_FALLBACK_COLOR = 'bg-[#2341F0]'

/** Manteniamo l'export per compatibilità con i file che già la importano */
export function getAvatarColorClass(_text?: string): string {
    return AVATAR_FALLBACK_COLOR
}

/**
 * Avatar Component
 *
 * Fallback uniforme: bg-[#2341F0] (blu Sprinta) per tutti gli utenti.
 */
export default function Avatar({
    src,
    alt = 'Avatar',
    size = 'md',
    className = '',
    fallbackText = '?'
}: AvatarProps) {
    const sizeClass = sizeClasses[size]
    const initials = fallbackText.slice(0, 2).toUpperCase()

    if (!src) {
        return (
            <div className={clsx(
                'rounded-full flex items-center justify-center text-white font-semibold shrink-0',
                AVATAR_FALLBACK_COLOR,
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
                target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-semibold">${initials}</div>`
            }
        }
    }

    return (
        <div className={clsx(
            'relative rounded-full overflow-hidden shrink-0',
            AVATAR_FALLBACK_COLOR,
            className || sizeClass
        )}>
            <img {...imgProps} />
        </div>
    )
}

