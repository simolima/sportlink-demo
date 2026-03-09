import { ThumbsUp, Heart, Flame, Trophy, Zap, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Legacy reactions stored as type strings — kept for backward compatibility */
export const REACTION_ICONS: { [key: string]: LucideIcon | undefined } = {
    like: ThumbsUp,
    love: Heart,
    fire: Flame,
    trophy: Trophy,
    zap: Zap,
    star: Star,
}

export const REACTION_LABELS: { [key: string]: string } = {
    like: 'Mi piace',
    love: 'Adoro',
    fire: 'Fuoco',
    trophy: 'Trofeo',
    zap: 'Lampo',
    star: 'Stella',
}
