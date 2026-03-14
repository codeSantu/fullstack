const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const orgs = await prisma.organization.findMany();
    console.log('Organizations:', JSON.stringify(orgs, null, 2));
    
    const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, email: true, name: true, role: true, organizationId: true }
    });
    console.log('Latest 5 Users:', JSON.stringify(users, null, 2));
    
    const members = await prisma.member.findMany({ take: 5 });
    console.log('Latest 5 Members:', JSON.stringify(members, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
