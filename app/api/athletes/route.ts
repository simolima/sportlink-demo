import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest){
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") || undefined;
  const position = searchParams.get("position") || undefined;
  const ageMin = Number(searchParams.get("age_min") || 0);
  const ageMax = Number(searchParams.get("age_max") || 100);
  const items = await prisma.athlete.findMany({
    where: { sport, position, age: { gte: (ageMin||undefined) as any, lte: (ageMax||undefined) as any } },
    include: { profile: true }, take: 60
  });
  return NextResponse.json({ items, total: items.length });
}
