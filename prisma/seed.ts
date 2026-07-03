import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.reportBiomarker.deleteMany({});
  await prisma.bloodReport.deleteMany({});
  await prisma.userProfile.deleteMany({});
  console.log("Database cleaned (no default data added).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
