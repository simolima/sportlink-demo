"use client";
import { NeedForm, type NeedForm as NF } from "@/components/need-form";
import { useRouter } from "next/navigation";
export default function Needs(){
  const router = useRouter();
  async function onSubmit(v: NF){
    const res = await fetch("/api/needs", { method: "POST", body: JSON.stringify(v) });
    const data = await res.json();
    router.push(`/matches/${data.id}`);
  }
  return (<div className="space-y-4">
    <h1 className="text-2xl font-semibold">Create Need</h1>
    <NeedForm onSubmit={onSubmit} />
  </div>);
}
