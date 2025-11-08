"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MatchTable } from "@/components/match-table";
export default function Matches(){
  const { id } = useParams();
  const [rows,setRows] = useState<any[]>([]);
  useEffect(()=>{ fetch("/api/match", { method: "POST", body: JSON.stringify({ needId: id }) })
    .then(r=>r.json()).then(d=> setRows(d.candidates)); },[id]);
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Matches</h1><MatchTable rows={rows} /></div>;
}
