import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function POST(req: Request){
  const body = await req.json();
  const need = await prisma.need.create({ data: {
    ownerType: "CLUB", ownerId: "demo", sport: body.sport,
    position: body.position ?? null, ageMin: body.ageMin ?? null, ageMax: body.ageMax ?? null, level: body.level ?? null
  }});
  return NextResponse.json({ id: need.id });
}
