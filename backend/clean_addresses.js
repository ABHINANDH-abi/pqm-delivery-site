const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging all old test Coimbatore / Avinashi Road address records from database...');
  
  const deleted = await prisma.address.deleteMany({
    where: {
      OR: [
        { addressLine1: { contains: 'Avinashi', mode: 'insensitive' } },
        { addressLine1: { contains: '104', mode: 'insensitive' } },
        { city: { equals: 'Coimbatore', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`✅ DELETED ${deleted.count} OLD TEST COIMBATORE ADDRESS RECORDS FROM DATABASE!`);
}

main()
  .catch((e) => {
    console.error('Error cleaning addresses:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
