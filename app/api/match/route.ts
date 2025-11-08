import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
function score(a:any, need:any){
  let s=0; const why:string[]=[];
  if(a.sport===need.sport){ s+=40; why.push("sport match"); }
  if(need.position && a.position===need.position){ s+=20; why.push("position match"); }
  if(need.ageMin && a.age && a.age>=need.ageMin){ s+=5; }
  if(need.ageMax && a.age && a.age<=need.ageMax){ s+=5; }
  if(a.contract==='FREE'){ s+=10; why.push("free agent"); }
  return { s, why };
}
export async function POST(req: Request){
  const { needId } = await req.json();
  const need = await prisma.need.findUnique({ where: { id: String(needId) } });
  if(!need) return NextResponse.json({ candidates: [] });
  const athletes = await prisma.athlete.findMany({ include: { profile: true }, take: 100 });
  const candidates = athletes.map(a=>{ const r=score(a,need); return { name: a.profile.displayName, score:r.s, why:r.why }; })
    .sort((x,y)=> y.score-x.score).slice(0,10);
  return NextResponse.json({ candidates });
}
