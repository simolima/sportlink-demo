import Link from "next/link";
export default function Page(){
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">SportLink</h1>
      <p className="text-gray-600">Il network per atleti, club e agenti. Crea il tuo profilo, cerca talenti, genera match.</p>
      <div className="flex gap-3">
        <Link href="/search" className="px-4 py-2 rounded bg-black text-white">Prova la demo</Link>
        <Link href="/login" className="px-4 py-2 rounded border">Accedi</Link>
      </div>
    </div>
  );
}
