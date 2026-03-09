import { ThumbsUp, Heart, Flame, Trophy, Zap, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactionType } from '@/lib/types'

export const REACTION_ICONS: Record<ReactionType, LucideIcon> = {
    like: ThumbsUp,
    love: Heart,
    fire: Flame,
    trophy: Trophy,
    zap: Zap,
    star: Star,
}

export const REACTION_LABELS: Record<ReactionType, string> = {
    like: 'Mi piace',
    love: 'Adoro',
    fire: 'Fuoco',
    trophy: 'Trofeo',
    zap: 'Lampo',
    star: 'Stella',
}
