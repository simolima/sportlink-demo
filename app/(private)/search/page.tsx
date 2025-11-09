"use client";
import { useEffect, useState } from "react";
import { AthleteCard } from "@/components/athlete-card";
import Navbar from '@/components/navbar'

export default function Search() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { fetch("/api/athletes").then(r => r.json()).then(d => setItems(d.items || d || [])); }, []);
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto p-4">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Search Athletes</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {items.map((a) => <AthleteCard key={a.id} a={a} />)}
          </div>
        </div>
      </main>
    </>
  );
}
