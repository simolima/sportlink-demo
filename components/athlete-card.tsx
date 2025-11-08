import { AthleteWithProfile } from "@/lib/types";
export function AthleteCard({ a }: { a: AthleteWithProfile }){
  return (
    <div className="border rounded p-3">
      <div className="font-semibold">{a.profile.displayName}</div>
      <div className="text-sm text-gray-600">{a.sport} · {a.position ?? "-"} · {a.level ?? "-"}</div>
      <div className="text-sm">Età: {a.age ?? "-"} · Club: {a.currentClub ?? "-"}</div>
    </div>
  );
}
