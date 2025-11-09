"use client";
import { NeedForm, type NeedForm as NF } from "@/components/need-form";
import { useRouter } from "next/navigation";
import Navbar from '@/components/navbar'

export default function Needs() {
  const router = useRouter();
  async function onSubmit(v: NF) {
    const res = await fetch("/api/needs", { method: "POST", body: JSON.stringify(v) });
    const data = await res.json();
    router.push(`/matches/${data.id}`);
  }
  return (<>
    <Navbar />
    <main className="max-w-5xl mx-auto p-4">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Create Need</h1>
        <NeedForm onSubmit={onSubmit} />
      </div>
    </main>
  </>);
}
