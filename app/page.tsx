"use client"
import LandingHero from '../components/landing-hero'
import { useEffect } from 'react'

export default function Page() {
  // Hide the global header (defined in app/layout.tsx) on the homepage so only
  // the blue LandingHero is visible. Restore it when leaving the page.
  useEffect(() => {
    const header = document.querySelector('header')
    if (header) header.classList.add('hidden')
    return () => { if (header) header.classList.remove('hidden') }
  }, [])

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-4xl px-4">
        <LandingHero />
      </div>
    </div>
  )
}
