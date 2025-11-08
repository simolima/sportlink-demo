export function MatchTable({ rows }:{ rows: { name:string; score:number; why:string[] }[] }){
  return (
    <table className="w-full border">
      <thead><tr><th className="text-left p-2">Athlete</th><th className="text-left p-2">Score</th><th className="text-left p-2">Why</th></tr></thead>
      <tbody>
        {rows.map((r,i)=> (
          <tr key={i} className="border-t">
            <td className="p-2">{r.name}</td>
            <td className="p-2">{r.score}</td>
            <td className="p-2 text-sm text-gray-600">{r.why.join(", ")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
