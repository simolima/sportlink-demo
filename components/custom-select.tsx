"use client"

import { useState, useRef, useEffect } from "react"

interface Option {
    value: string
    label: string
}

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: Option[] | string[]
    placeholder?: string
    disabled?: boolean
    className?: string
    required?: boolean
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Seleziona...",
    disabled = false,
    className = "",
    required = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Normalizza le opzioni in formato { value, label }
    const normalizedOptions: Option[] = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    )

    // Trova il label del valore selezionato
    const selectedOption = normalizedOptions.find(opt => opt.value === value)
    const displayValue = selectedOption ? selectedOption.label : ""

    // Chiudi dropdown quando clicchi fuori
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (optionValue: string) => {
        onChange(optionValue)
        setIsOpen(false)
    }

    return (
        <div ref={wrapperRef} className="relative">
            <input
                type="text"
                value={displayValue}
                readOnly
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onFocus={() => !disabled && setIsOpen(true)}
                placeholder={placeholder}
                disabled={disabled}
                className={`${className} cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                required={required}
            />

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {normalizedOptions.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`px-4 py-2.5 cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl ${value === option.value
                                    ? 'bg-gray-100 font-medium'
                                    : 'hover:bg-gray-100'
                                }`}
                        >
                            {option.label}
                        </div>
                    ))}
                    {normalizedOptions.length === 0 && (
                        <div className="px-4 py-2.5 text-sm text-gray-500 text-center">
                            {placeholder}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
