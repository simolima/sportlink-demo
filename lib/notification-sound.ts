/**
 * Notification Sound Engine — Advanced Web Audio API
 *
 * Approccio B+: due oscillatori detuned + BiquadFilter lowpass + ADSR preciso.
 * Nessun file audio richiesto. Preferenza device persistita in localStorage.
 */

const STORAGE_KEY = 'sprinta_sound_enabled'

// AudioContext singleton (must be created/resumed after a user gesture)
let _ctx: AudioContext | null = null
let _unlocked = false

/**
 * Recupera o crea l'AudioContext. Deve essere chiamato all'interno di un
 * event handler (click, keydown, ecc.) la prima volta per soddisfare la
 * browser autoplay policy.
 */
function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!_ctx) {
        try {
            _ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        } catch {
            return null
        }
    }
    if (_ctx.state === 'suspended') {
        _ctx.resume().catch(() => { })
    }
    return _ctx
}

/**
 * Chiama questo nell'handler del primo gesto utente (es. click sul pulsante mute)
 * per sbloccare l'AudioContext in modo affidabile.
 */
export function unlockAudioContext(): void {
    _unlocked = true
    getAudioContext()
}

// ============================================================================
// Preferenze
// ============================================================================

export function isSoundEnabled(): boolean {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
}

export function setSoundEnabled(value: boolean): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, String(value))
}

/** Inverte lo stato corrente e restituisce il nuovo valore. */
export function toggleSound(): boolean {
    const next = !isSoundEnabled()
    setSoundEnabled(next)
    return next
}

// ============================================================================
// Tone engine
// ============================================================================

interface ToneOptions {
    /** Frequenza fondamentale in Hz */
    frequency: number
    /** Detune dell'oscillatore secondario in cents (default 8) */
    detune?: number
    /** Durata totale dal peak al silenzio (s) */
    duration?: number
    /** Peak gain (0–1) */
    gain?: number
    /** Cutoff del filtro lowpass in Hz (default 2000) */
    filterFrequency?: number
    /** Durata dell'attack (s) */
    attack?: number
    /** Ritardo dall'avvio prima di far partire il tono (s) */
    delay?: number
}

function playTone(options: ToneOptions): void {
    const ctx = getAudioContext()
    if (!ctx) return

    const {
        frequency,
        detune = 8,
        duration = 0.6,
        gain = 0.22,
        filterFrequency = 2200,
        attack = 0.012,
        delay = 0,
    } = options

    const startTime = ctx.currentTime + delay

    // Filtro lowpass condiviso — ammorbidisce le alte frequenze
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = filterFrequency
    filter.Q.value = 0.7

    // Gain master con inviluppo ADSR
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(gain, startTime + attack)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Oscillatore 1 — fondamentale
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = frequency
    osc1.connect(filter)
    osc1.start(startTime)
    osc1.stop(startTime + duration + 0.05)

    // Oscillatore 2 — detuned per calore e corposità
    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = frequency
    osc2.detune.value = detune
    osc2.connect(filter)
    osc2.start(startTime)
    osc2.stop(startTime + duration + 0.05)
}

// ============================================================================
// Varianti di notifica
// ============================================================================

export type SoundVariant = 'default' | 'important' | 'subtle'

/**
 * Mappa il tipo notifica alla variante sonora.
 * - 'important': doppio ding ascendente (opportunità, candidature, affiliazioni)
 * - 'subtle': tono breve e soft (badge permessi background)
 * - 'default': ding singolo caldo per tutto il resto
 */
export function getSoundVariant(notificationType: string): SoundVariant {
    const important = [
        'new_opportunity',
        'candidacy_accepted',
        'application_status_changed',
        'affiliation_accepted',
        'affiliation_request',
        'club_join_accepted',
        'profile_verified',
    ]
    const subtle = [
        'permission_granted',
        'permission_revoked',
    ]

    if (important.includes(notificationType)) return 'important'
    if (subtle.includes(notificationType)) return 'subtle'
    return 'default'
}

/**
 * Riproduce il suono di notifica per la variante specificata.
 * No-op se i suoni sono disabilitati o se siamo in SSR.
 */
export function playNotificationSound(variant: SoundVariant = 'default'): void {
    if (!isSoundEnabled()) return

    switch (variant) {
        case 'important':
            // Doppio ding ascendente: La4 (440 Hz) → Re5 (587.33 Hz)
            playTone({ frequency: 440, duration: 0.55, gain: 0.2, attack: 0.01 })
            playTone({ frequency: 587.33, duration: 0.65, gain: 0.18, attack: 0.01, delay: 0.18 })
            break

        case 'subtle':
            // Tono breve e leggero
            playTone({ frequency: 523.25, duration: 0.35, gain: 0.12, attack: 0.015, filterFrequency: 1600 })
            break

        case 'default':
        default:
            // Ding singolo caldo (La4)
            playTone({ frequency: 440, duration: 0.6, gain: 0.2, attack: 0.012 })
            break
    }
}
