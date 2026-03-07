/**
 * Utility per gestione paesi e bandiere
 * Lista completa paesi del mondo con codici ISO e emoji bandiere
 */

export interface Country {
    code: string
    name: string
    flag: string
}

/**
 * Lista completa di tutti i paesi con bandiere emoji
 * Fonte: ISO 3166-1 alpha-2
 */
export const allCountries: Country[] = [
    { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
    { code: "ZA", name: "Sudafrica", flag: "🇿🇦" },
    { code: "AL", name: "Albania", flag: "🇦🇱" },
    { code: "DZ", name: "Algeria", flag: "🇩🇿" },
    { code: "DE", name: "Germania", flag: "🇩🇪" },
    { code: "AD", name: "Andorra", flag: "🇦🇩" },
    { code: "AO", name: "Angola", flag: "🇦🇴" },
    { code: "AI", name: "Anguilla", flag: "🇦🇮" },
    { code: "AQ", name: "Antartide", flag: "🇦🇶" },
    { code: "AG", name: "Antigua e Barbuda", flag: "🇦🇬" },
    { code: "SA", name: "Arabia Saudita", flag: "🇸🇦" },
    { code: "AR", name: "Argentina", flag: "🇦🇷" },
    { code: "AM", name: "Armenia", flag: "🇦🇲" },
    { code: "AW", name: "Aruba", flag: "🇦🇼" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "AT", name: "Austria", flag: "🇦🇹" },
    { code: "AZ", name: "Azerbaigian", flag: "🇦🇿" },
    { code: "BS", name: "Bahamas", flag: "🇧🇸" },
    { code: "BH", name: "Bahrein", flag: "🇧🇭" },
    { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
    { code: "BB", name: "Barbados", flag: "🇧🇧" },
    { code: "BE", name: "Belgio", flag: "🇧🇪" },
    { code: "BZ", name: "Belize", flag: "🇧🇿" },
    { code: "BJ", name: "Benin", flag: "🇧🇯" },
    { code: "BM", name: "Bermuda", flag: "🇧🇲" },
    { code: "BT", name: "Bhutan", flag: "🇧🇹" },
    { code: "BY", name: "Bielorussia", flag: "🇧🇾" },
    { code: "BO", name: "Bolivia", flag: "🇧🇴" },
    { code: "BA", name: "Bosnia ed Erzegovina", flag: "🇧🇦" },
    { code: "BW", name: "Botswana", flag: "🇧🇼" },
    { code: "BR", name: "Brasile", flag: "🇧🇷" },
    { code: "BN", name: "Brunei", flag: "🇧🇳" },
    { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
    { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
    { code: "BI", name: "Burundi", flag: "🇧🇮" },
    { code: "KH", name: "Cambogia", flag: "🇰🇭" },
    { code: "CM", name: "Camerun", flag: "🇨🇲" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "CV", name: "Capo Verde", flag: "🇨🇻" },
    { code: "TD", name: "Ciad", flag: "🇹🇩" },
    { code: "CL", name: "Cile", flag: "🇨🇱" },
    { code: "CN", name: "Cina", flag: "🇨🇳" },
    { code: "CY", name: "Cipro", flag: "🇨🇾" },
    { code: "VA", name: "Città del Vaticano", flag: "🇻🇦" },
    { code: "CO", name: "Colombia", flag: "🇨🇴" },
    { code: "KM", name: "Comore", flag: "🇰🇲" },
    { code: "CG", name: "Congo", flag: "🇨🇬" },
    { code: "CD", name: "Congo (RDC)", flag: "🇨🇩" },
    { code: "KP", name: "Corea del Nord", flag: "🇰🇵" },
    { code: "KR", name: "Corea del Sud", flag: "🇰🇷" },
    { code: "CI", name: "Costa d'Avorio", flag: "🇨🇮" },
    { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
    { code: "HR", name: "Croazia", flag: "🇭🇷" },
    { code: "CU", name: "Cuba", flag: "🇨🇺" },
    { code: "CW", name: "Curaçao", flag: "🇨🇼" },
    { code: "DK", name: "Danimarca", flag: "🇩🇰" },
    { code: "DM", name: "Dominica", flag: "🇩🇲" },
    { code: "EC", name: "Ecuador", flag: "🇪🇨" },
    { code: "EG", name: "Egitto", flag: "🇪🇬" },
    { code: "SV", name: "El Salvador", flag: "🇸🇻" },
    { code: "AE", name: "Emirati Arabi Uniti", flag: "🇦🇪" },
    { code: "ER", name: "Eritrea", flag: "🇪🇷" },
    { code: "EE", name: "Estonia", flag: "🇪🇪" },
    { code: "SZ", name: "Eswatini", flag: "🇸🇿" },
    { code: "ET", name: "Etiopia", flag: "🇪🇹" },
    { code: "FJ", name: "Figi", flag: "🇫🇯" },
    { code: "PH", name: "Filippine", flag: "🇵🇭" },
    { code: "FI", name: "Finlandia", flag: "🇫🇮" },
    { code: "FR", name: "Francia", flag: "🇫🇷" },
    { code: "GA", name: "Gabon", flag: "🇬🇦" },
    { code: "GM", name: "Gambia", flag: "🇬🇲" },
    { code: "GE", name: "Georgia", flag: "🇬🇪" },
    { code: "GH", name: "Ghana", flag: "🇬🇭" },
    { code: "JM", name: "Giamaica", flag: "🇯🇲" },
    { code: "JP", name: "Giappone", flag: "🇯🇵" },
    { code: "GI", name: "Gibilterra", flag: "🇬🇮" },
    { code: "DJ", name: "Gibuti", flag: "🇩🇯" },
    { code: "JO", name: "Giordania", flag: "🇯🇴" },
    { code: "GR", name: "Grecia", flag: "🇬🇷" },
    { code: "GD", name: "Grenada", flag: "🇬🇩" },
    { code: "GL", name: "Groenlandia", flag: "🇬🇱" },
    { code: "GP", name: "Guadalupa", flag: "🇬🇵" },
    { code: "GU", name: "Guam", flag: "🇬🇺" },
    { code: "GT", name: "Guatemala", flag: "🇬🇹" },
    { code: "GG", name: "Guernsey", flag: "🇬🇬" },
    { code: "GN", name: "Guinea", flag: "🇬🇳" },
    { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼" },
    { code: "GQ", name: "Guinea Equatoriale", flag: "🇬🇶" },
    { code: "GY", name: "Guyana", flag: "🇬🇾" },
    { code: "GF", name: "Guyana Francese", flag: "🇬🇫" },
    { code: "HT", name: "Haiti", flag: "🇭🇹" },
    { code: "HN", name: "Honduras", flag: "🇭🇳" },
    { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "ID", name: "Indonesia", flag: "🇮🇩" },
    { code: "IR", name: "Iran", flag: "🇮🇷" },
    { code: "IQ", name: "Iraq", flag: "🇮🇶" },
    { code: "IE", name: "Irlanda", flag: "🇮🇪" },
    { code: "IS", name: "Islanda", flag: "🇮🇸" },
    { code: "BV", name: "Isola Bouvet", flag: "🇧🇻" },
    { code: "IM", name: "Isola di Man", flag: "🇮🇲" },
    { code: "NF", name: "Isola Norfolk", flag: "🇳🇫" },
    { code: "AX", name: "Isole Åland", flag: "🇦🇽" },
    { code: "KY", name: "Isole Cayman", flag: "🇰🇾" },
    { code: "CC", name: "Isole Cocos", flag: "🇨🇨" },
    { code: "CK", name: "Isole Cook", flag: "🇨🇰" },
    { code: "FO", name: "Isole Fær Øer", flag: "🇫🇴" },
    { code: "FK", name: "Isole Falkland", flag: "🇫🇰" },
    { code: "MP", name: "Isole Marianne Settentrionali", flag: "🇲🇵" },
    { code: "MH", name: "Isole Marshall", flag: "🇲🇭" },
    { code: "PN", name: "Isole Pitcairn", flag: "🇵🇳" },
    { code: "SB", name: "Isole Salomone", flag: "🇸🇧" },
    { code: "TC", name: "Isole Turks e Caicos", flag: "🇹🇨" },
    { code: "VG", name: "Isole Vergini Britanniche", flag: "🇻🇬" },
    { code: "VI", name: "Isole Vergini Americane", flag: "🇻🇮" },
    { code: "IL", name: "Israele", flag: "🇮🇱" },
    { code: "IT", name: "Italia", flag: "🇮🇹" },
    { code: "JE", name: "Jersey", flag: "🇯🇪" },
    { code: "KZ", name: "Kazakistan", flag: "🇰🇿" },
    { code: "KE", name: "Kenya", flag: "🇰🇪" },
    { code: "KG", name: "Kirghizistan", flag: "🇰🇬" },
    { code: "KI", name: "Kiribati", flag: "🇰🇮" },
    { code: "KW", name: "Kuwait", flag: "🇰🇼" },
    { code: "LA", name: "Laos", flag: "🇱🇦" },
    { code: "LS", name: "Lesotho", flag: "🇱🇸" },
    { code: "LV", name: "Lettonia", flag: "🇱🇻" },
    { code: "LB", name: "Libano", flag: "🇱🇧" },
    { code: "LR", name: "Liberia", flag: "🇱🇷" },
    { code: "LY", name: "Libia", flag: "🇱🇾" },
    { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
    { code: "LT", name: "Lituania", flag: "🇱🇹" },
    { code: "LU", name: "Lussemburgo", flag: "🇱🇺" },
    { code: "MO", name: "Macao", flag: "🇲🇴" },
    { code: "MK", name: "Macedonia del Nord", flag: "🇲🇰" },
    { code: "MG", name: "Madagascar", flag: "🇲🇬" },
    { code: "MW", name: "Malawi", flag: "🇲🇼" },
    { code: "MY", name: "Malesia", flag: "🇲🇾" },
    { code: "MV", name: "Maldive", flag: "🇲🇻" },
    { code: "ML", name: "Mali", flag: "🇲🇱" },
    { code: "MT", name: "Malta", flag: "🇲🇹" },
    { code: "MA", name: "Marocco", flag: "🇲🇦" },
    { code: "MQ", name: "Martinica", flag: "🇲🇶" },
    { code: "MR", name: "Mauritania", flag: "🇲🇷" },
    { code: "MU", name: "Mauritius", flag: "🇲🇺" },
    { code: "YT", name: "Mayotte", flag: "🇾🇹" },
    { code: "MX", name: "Messico", flag: "🇲🇽" },
    { code: "FM", name: "Micronesia", flag: "🇫🇲" },
    { code: "MD", name: "Moldavia", flag: "🇲🇩" },
    { code: "MC", name: "Monaco", flag: "🇲🇨" },
    { code: "MN", name: "Mongolia", flag: "🇲🇳" },
    { code: "ME", name: "Montenegro", flag: "🇲🇪" },
    { code: "MS", name: "Montserrat", flag: "🇲🇸" },
    { code: "MZ", name: "Mozambico", flag: "🇲🇿" },
    { code: "MM", name: "Myanmar", flag: "🇲🇲" },
    { code: "NA", name: "Namibia", flag: "🇳🇦" },
    { code: "NR", name: "Nauru", flag: "🇳🇷" },
    { code: "NP", name: "Nepal", flag: "🇳🇵" },
    { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
    { code: "NE", name: "Niger", flag: "🇳🇪" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬" },
    { code: "NU", name: "Niue", flag: "🇳🇺" },
    { code: "NO", name: "Norvegia", flag: "🇳🇴" },
    { code: "NC", name: "Nuova Caledonia", flag: "🇳🇨" },
    { code: "NZ", name: "Nuova Zelanda", flag: "🇳🇿" },
    { code: "OM", name: "Oman", flag: "🇴🇲" },
    { code: "NL", name: "Paesi Bassi", flag: "🇳🇱" },
    { code: "PK", name: "Pakistan", flag: "🇵🇰" },
    { code: "PW", name: "Palau", flag: "🇵🇼" },
    { code: "PS", name: "Palestina", flag: "🇵🇸" },
    { code: "PA", name: "Panama", flag: "🇵🇦" },
    { code: "PG", name: "Papua Nuova Guinea", flag: "🇵🇬" },
    { code: "PY", name: "Paraguay", flag: "🇵🇾" },
    { code: "PE", name: "Perù", flag: "🇵🇪" },
    { code: "PF", name: "Polinesia Francese", flag: "🇵🇫" },
    { code: "PL", name: "Polonia", flag: "🇵🇱" },
    { code: "PT", name: "Portogallo", flag: "🇵🇹" },
    { code: "PR", name: "Porto Rico", flag: "🇵🇷" },
    { code: "QA", name: "Qatar", flag: "🇶🇦" },
    { code: "GB", name: "Regno Unito", flag: "🇬🇧" },
    { code: "CZ", name: "Repubblica Ceca", flag: "🇨🇿" },
    { code: "CF", name: "Repubblica Centrafricana", flag: "🇨🇫" },
    { code: "DO", name: "Repubblica Dominicana", flag: "🇩🇴" },
    { code: "RE", name: "Riunione", flag: "🇷🇪" },
    { code: "RO", name: "Romania", flag: "🇷🇴" },
    { code: "RW", name: "Ruanda", flag: "🇷🇼" },
    { code: "RU", name: "Russia", flag: "🇷🇺" },
    { code: "EH", name: "Sahara Occidentale", flag: "🇪🇭" },
    { code: "KN", name: "Saint Kitts e Nevis", flag: "🇰🇳" },
    { code: "LC", name: "Saint Lucia", flag: "🇱🇨" },
    { code: "VC", name: "Saint Vincent e Grenadine", flag: "🇻🇨" },
    { code: "BL", name: "Saint-Barthélemy", flag: "🇧🇱" },
    { code: "MF", name: "Saint-Martin", flag: "🇲🇫" },
    { code: "PM", name: "Saint-Pierre e Miquelon", flag: "🇵🇲" },
    { code: "WS", name: "Samoa", flag: "🇼🇸" },
    { code: "AS", name: "Samoa Americane", flag: "🇦🇸" },
    { code: "SM", name: "San Marino", flag: "🇸🇲" },
    { code: "SH", name: "Sant'Elena", flag: "🇸🇭" },
    { code: "ST", name: "São Tomé e Príncipe", flag: "🇸🇹" },
    { code: "SN", name: "Senegal", flag: "🇸🇳" },
    { code: "RS", name: "Serbia", flag: "🇷🇸" },
    { code: "SC", name: "Seychelles", flag: "🇸🇨" },
    { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
    { code: "SG", name: "Singapore", flag: "🇸🇬" },
    { code: "SX", name: "Sint Maarten", flag: "🇸🇽" },
    { code: "SY", name: "Siria", flag: "🇸🇾" },
    { code: "SK", name: "Slovacchia", flag: "🇸🇰" },
    { code: "SI", name: "Slovenia", flag: "🇸🇮" },
    { code: "SO", name: "Somalia", flag: "🇸🇴" },
    { code: "ES", name: "Spagna", flag: "🇪🇸" },
    { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
    { code: "US", name: "Stati Uniti", flag: "🇺🇸" },
    { code: "SD", name: "Sudan", flag: "🇸🇩" },
    { code: "SS", name: "Sudan del Sud", flag: "🇸🇸" },
    { code: "SR", name: "Suriname", flag: "🇸🇷" },
    { code: "SJ", name: "Svalbard e Jan Mayen", flag: "🇸🇯" },
    { code: "SE", name: "Svezia", flag: "🇸🇪" },
    { code: "CH", name: "Svizzera", flag: "🇨🇭" },
    { code: "TJ", name: "Tagikistan", flag: "🇹🇯" },
    { code: "TH", name: "Thailandia", flag: "🇹🇭" },
    { code: "TW", name: "Taiwan", flag: "🇹🇼" },
    { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
    { code: "TF", name: "Terre Australi Francesi", flag: "🇹🇫" },
    { code: "IO", name: "Territorio Britannico dell'Oceano Indiano", flag: "🇮🇴" },
    { code: "TL", name: "Timor Est", flag: "🇹🇱" },
    { code: "TG", name: "Togo", flag: "🇹🇬" },
    { code: "TK", name: "Tokelau", flag: "🇹🇰" },
    { code: "TO", name: "Tonga", flag: "🇹🇴" },
    { code: "TT", name: "Trinidad e Tobago", flag: "🇹🇹" },
    { code: "TN", name: "Tunisia", flag: "🇹🇳" },
    { code: "TR", name: "Turchia", flag: "🇹🇷" },
    { code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
    { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
    { code: "UA", name: "Ucraina", flag: "🇺🇦" },
    { code: "UG", name: "Uganda", flag: "🇺🇬" },
    { code: "HU", name: "Ungheria", flag: "🇭🇺" },
    { code: "UY", name: "Uruguay", flag: "🇺🇾" },
    { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
    { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
    { code: "VE", name: "Venezuela", flag: "🇻🇪" },
    { code: "VN", name: "Vietnam", flag: "🇻🇳" },
    { code: "WF", name: "Wallis e Futuna", flag: "🇼🇫" },
    { code: "YE", name: "Yemen", flag: "🇾🇪" },
    { code: "ZM", name: "Zambia", flag: "🇿🇲" },
    { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" }
]

/**
 * Ottiene la bandiera emoji per un paese dato il suo nome
 * @param countryName Nome del paese (es: "Italia", "Germania")
 * @returns Emoji bandiera o null se non trovato
 * 
 * @example
 * getCountryFlag("Italia") // "🇮🇹"
 * getCountryFlag("Francia") // "🇫🇷"
 * getCountryFlag("UnknownCountry") // null
 */
export function getCountryFlag(countryName: string | null | undefined): string | null {
    if (!countryName) return null

    // Cerca esatta corrispondenza (case-insensitive)
    const country = allCountries.find(
        c => c.name.toLowerCase() === countryName.toLowerCase()
    )

    return country?.flag || null
}

/**
 * Ottiene l'oggetto Country completo per un paese dato il suo nome
 * @param countryName Nome del paese
 * @returns Oggetto Country o null se non trovato
 * 
 * @example
 * getCountry("Italia") // { code: "IT", name: "Italia", flag: "🇮🇹" }
 */
export function getCountry(countryName: string | null | undefined): Country | null {
    if (!countryName) return null

    const country = allCountries.find(
        c => c.name.toLowerCase() === countryName.toLowerCase()
    )

    return country || null
}

/**
 * Ottiene un paese dato il suo codice ISO (es: "IT", "US")
 * @param code Codice ISO 3166-1 alpha-2
 * @returns Oggetto Country o null
 * 
 * @example
 * getCountryByCode("IT") // { code: "IT", name: "Italia", flag: "🇮🇹" }
 */
export function getCountryByCode(code: string | null | undefined): Country | null {
    if (!code) return null

    const country = allCountries.find(
        c => c.code.toUpperCase() === code.toUpperCase()
    )

    return country || null
}

/**
 * Formatta la nazionalità con bandiera + nome
 * @param countryName Nome del paese
 * @returns String formattato "🇮🇹 Italia" o solo il nome se bandiera non trovata
 * 
 * @example
 * formatCountryWithFlag("Italia") // "🇮🇹 Italia"
 * formatCountryWithFlag("UnknownCountry") // "UnknownCountry"
 */
export function formatCountryWithFlag(countryName: string | null | undefined): string {
    if (!countryName) return 'Non specificato'

    const flag = getCountryFlag(countryName)
    return flag ? `${flag} ${countryName}` : countryName
}

/**
 * Returns the lowercase ISO 3166-1 alpha-2 country code for a given country name.
 * Useful for building flag-icons CSS classes: `fi fi-${code}` (e.g. `fi fi-it`).
 * See: https://github.com/lipis/flag-icons
 *
 * @param countryName Nome del paese (es: "Italia")
 * @returns Lowercase ISO code (es: "it") or undefined if not found
 *
 * @example
 * getCountryCode("Italia")  // "it"
 * getCountryCode("Francia") // "fr"
 */
export function getCountryCode(countryName: string | null | undefined): string | undefined {
    if (!countryName) return undefined
    return allCountries
        .find(c => c.name.toLowerCase() === countryName.toLowerCase())
        ?.code.toLowerCase()
}
