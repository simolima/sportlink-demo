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

/**
 * Avatar Component
 * 
 * Displays user avatar with automatic fallback to initials
 * Supports multiple sizes and custom styling
 * 
 * @param src - Avatar image URL (from local /public or Supabase Storage)
 * @param alt - Alt text for image
 * @param size - Avatar size (xs, sm, md, lg, xl)
 * @param className - Additional CSS classes
 * @param fallbackText - Text to show when no image (e.g., user initials)
 */
export default function Avatar({
    src,
    alt = 'Avatar',
    size = 'md',
    className = '',
    fallbackText = '?'
}: AvatarProps) {
    const sizeClass = sizeClasses[size]

    // Debug: log to see what src we're receiving
    if (process.env.NODE_ENV === 'development') {
        console.log('Avatar render:', { src, alt, fallbackText })
    }

    // Show fallback if no src
    if (!src) {
        return (
            <div className={clsx(
                'rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shrink-0',
                className || sizeClass
            )}>
                {fallbackText.slice(0, 2).toUpperCase()}
            </div>
        )
    }

    // Only add onError if running in browser (Client Component)
    const imgProps: any = {
        src,
        alt,
        className: "w-full h-full object-cover"
    }
    if (typeof window !== 'undefined') {
        imgProps.onError = (e: any) => {
            console.error('Avatar image failed to load:', src)
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            if (target.parentElement) {
                target.parentElement.innerHTML = `<div class=\"w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold\">${fallbackText.slice(0, 2).toUpperCase()}</div>`
            }
        }
    }

    return (
        <div className={clsx('relative rounded-full overflow-hidden shrink-0 bg-gray-200', className || sizeClass)}>
            <img {...imgProps} />
        </div>
    )
}
