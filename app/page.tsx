"use client"
import LandingHero from '../components/landing-hero'
import { useEffect } from 'react'

export default function Page() {
  // Hide the global header and navbar on the landing page for a full-height hero
  useEffect(() => {
    const header = document.querySelector('header')
    if (header) header.classList.add('hidden')
    return () => { if (header) header.classList.remove('hidden') }
  }, [])

  return (
    <div>
      <LandingHero />
    </div>
  )
}
