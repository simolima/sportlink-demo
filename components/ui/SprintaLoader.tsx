'use client'

/**
 * SprintaLoader — Logo-mark animato riutilizzabile.
 *
 * Usi:
 *  - color="white"  → logo istituzionale (navbar, splash): bianco monocromatico
 *  - color="brand"  → icona di stato UI (spinner chat, notifiche): blu brand
 *
 * L'SVG è inline (non <img src>) per permettere il controllo del colore via
 * currentColor e le classi Tailwind.
 */

interface Props {
    /** Dimensione: sm=28px, md=40px, lg=56px */
    size?: 'sm' | 'md' | 'lg'
    /** Colore: white (brand istituzionale) | brand (loader UI) */
    color?: 'white' | 'brand'
    /** Etichetta opzionale sotto il logo */
    label?: string
    /** Disabilita animazione pulse (es. uso statico in navbar) */
    static?: boolean
}

const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
} as const

const colorMap = {
    white: 'text-white',
    brand: 'text-brand-500',
} as const

export default function SprintaLoader({
    size = 'md',
    color = 'brand',
    label,
    static: isStatic = false,
}: Props) {
    return (
        <div className="flex flex-col items-center gap-3">
            {/* Logo-mark SVG — viewBox cropped sul solo mark (820 360 230 360) */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="820 360 230 360"
                fill="currentColor"
                className={`${sizeMap[size]} ${colorMap[color]} ${isStatic ? '' : 'sprinta-pulse'}`}
                aria-hidden="true"
            >
                <path d="M927.7,615c5.1-1.4,9.9-3.3,14.3-5.7-18.2-.6-34.6-13.5-38.6-32.5-4.4-21.4,9.7-42.3,30.8-48l36.6-9.8,52.4-14c1.1-.3,2-1.2,2.2-2.4l10.4-52.6c.4-2.3-1.6-4.2-3.8-3.6l-139.5,37.4c-31.7,8.5-52.2,38.1-50.2,69.7.2,4.5,1,9,2.2,13.5,9.7,36.2,46.9,57.7,83.2,48Z" />
                <path d="M992.3,541.4c-5.1,1.4-9.9,3.3-14.4,5.7,18.2.6,34.5,13.4,38.5,32.4,4.5,21.4-9.6,42.4-30.7,48.1l-36.7,9.8-51.9,13.9c-1.1.3-2,1.2-2.2,2.4l-10.8,52.7c-.5,2.3,1.6,4.2,3.8,3.6l139.5-37.4c31.7-8.5,52.2-38.1,50.2-69.7-.3-4.4-1-9-2.2-13.5-9.7-36.2-46.9-57.7-83.2-48Z" />
                <circle cx="915" cy="410.3" r="40.4" />
            </svg>

            {label && (
                <span className="text-xs font-medium tracking-wide opacity-70">
                    {label}
                </span>
            )}
        </div>
    )
}
