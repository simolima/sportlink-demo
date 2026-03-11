export const DEFAULT_STUDIO_TIMEZONE = 'Europe/Rome'

const TIMEZONE_SUFFIX_REGEX = /(Z|[+-]\d{2}:\d{2})$/i

function getFormatter(timeZone: string, includeSeconds = true) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...(includeSeconds ? { second: '2-digit' } : {}),
        hour12: false,
    })
}

function getDatePartsInTimeZone(date: Date, timeZone: string) {
    const formatter = getFormatter(timeZone)
    const parts = formatter.formatToParts(date)
    const lookup = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0)

    return {
        year: lookup('year'),
        month: lookup('month'),
        day: lookup('day'),
        hour: lookup('hour'),
        minute: lookup('minute'),
        second: lookup('second'),
    }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const parts = getDatePartsInTimeZone(date, timeZone)
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    return asUtc - date.getTime()
}

function parseLocalDateTime(localDateTime: string) {
    const match = localDateTime.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
    )

    if (!match) {
        throw new Error('invalid_local_datetime')
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
        second: Number(match[6] || '0'),
    }
}

export function hasExplicitTimezone(value: string): boolean {
    return TIMEZONE_SUFFIX_REGEX.test(value)
}

export function zonedDateTimeToUtcIso(localDateTime: string, timeZone: string = DEFAULT_STUDIO_TIMEZONE): string {
    const normalizedTimeZone = timeZone || DEFAULT_STUDIO_TIMEZONE
    const parsed = parseLocalDateTime(localDateTime)

    const utcGuess = Date.UTC(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute, parsed.second)
    const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), normalizedTimeZone)
    let utcTimestamp = utcGuess - firstOffset

    const secondOffset = getTimeZoneOffsetMs(new Date(utcTimestamp), normalizedTimeZone)
    utcTimestamp = utcGuess - secondOffset

    return new Date(utcTimestamp).toISOString()
}

export function normalizeInputDateTimeToUtcIso(value: string, timeZone: string = DEFAULT_STUDIO_TIMEZONE): string {
    if (hasExplicitTimezone(value)) {
        return new Date(value).toISOString()
    }

    return zonedDateTimeToUtcIso(value, timeZone)
}

export function getUtcDayBoundsForTimezoneDate(date: string, timeZone: string = DEFAULT_STUDIO_TIMEZONE) {
    const normalizedTimeZone = timeZone || DEFAULT_STUDIO_TIMEZONE
    return {
        startUtcIso: zonedDateTimeToUtcIso(`${date}T00:00:00`, normalizedTimeZone),
        endUtcIso: zonedDateTimeToUtcIso(`${date}T23:59:59`, normalizedTimeZone),
    }
}

export function getDateInTimezone(isoString: string, timeZone: string = DEFAULT_STUDIO_TIMEZONE): string {
    const normalizedTimeZone = timeZone || DEFAULT_STUDIO_TIMEZONE
    const date = new Date(isoString)
    const parts = getDatePartsInTimeZone(date, normalizedTimeZone)

    const pad = (value: number) => String(value).padStart(2, '0')
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export function getTimeInTimezone(isoString: string, timeZone: string = DEFAULT_STUDIO_TIMEZONE): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timeZone || DEFAULT_STUDIO_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })

    return formatter.format(new Date(isoString))
}

export function getTodayInTimezone(timeZone: string = DEFAULT_STUDIO_TIMEZONE): string {
    return getDateInTimezone(new Date().toISOString(), timeZone || DEFAULT_STUDIO_TIMEZONE)
}
