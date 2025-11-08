import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
const prisma = new PrismaClient();
const sports = ["football","volleyball","basketball"]; const positions=["LW","RW","CB","CM","ST","GK"];
async function main(){
  for(let i=0;i<50;i++){
    const user = await prisma.user.create({ data: { email: faker.internet.email(), role: "ATHLETE" } });
    const profile = await prisma.profile.create({ data: {
      userId: user.id,
      handle: faker.internet.userName().toLowerCase()+faker.number.int({min:10,max:99}),
      displayName: faker.person.fullName(),
      country: faker.location.country(), city: faker.location.city(), languages: ["en"]
    }});
    await prisma.athlete.create({ data: {
      profileId: profile.id, sport: faker.helpers.arrayElement(sports), position: faker.helpers.arrayElement(positions),
      level: faker.helpers.arrayElement(["U19","Semi-Pro","Pro"]), age: faker.number.int({min:17,max:28}), currentClub: faker.company.name(), contract: faker.helpers.arrayElement(["FREE","CONTRACTED"])
    }});
  }
  for(let i=0;i<10;i++){
    const user = await prisma.user.create({ data: { email: faker.internet.email(), role: "CLUB" } });
    const profile = await prisma.profile.create({ data: { userId: user.id, handle: `club${i}`, displayName: faker.company.name() } });
    await prisma.club.create({ data: { profileId: profile.id, name: profile.displayName, sport: "football", league: "Demo League" } });
  }
  for(let i=0;i<10;i++){
    const user = await prisma.user.create({ data: { email: faker.internet.email(), role: "AGENT" } });
    const profile = await prisma.profile.create({ data: { userId: user.id, handle: `agent${i}`, displayName: faker.person.fullName() } });
    await prisma.agent.create({ data: { profileId: profile.id, sports: ["football"], regions: ["EU"], yearsExp: 3 } });
  }
}
main().finally(()=>prisma.$disconnect());
