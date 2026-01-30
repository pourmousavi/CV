const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default exam types
  const examTypes = [
    { name: 'Midterm', description: 'Midterm examination' },
    { name: 'Final', description: 'Final examination' },
    { name: 'Quiz', description: 'Short quiz or test' },
    { name: 'Assignment', description: 'Homework assignment' },
    { name: 'Practice', description: 'Practice exam or worksheet' },
  ];

  for (const examType of examTypes) {
    await prisma.examType.upsert({
      where: { name: examType.name },
      update: {},
      create: examType,
    });
  }

  console.log('Created default exam types');

  // Create default admin user if none exists
  const existingUser = await prisma.user.findFirst();

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('changeme123', 12);

    await prisma.user.create({
      data: {
        email: 'admin@exammanager.local',
        passwordHash: hashedPassword,
        name: 'Administrator',
      },
    });

    console.log('Created default admin user:');
    console.log('  Email: admin@exammanager.local');
    console.log('  Password: changeme123');
    console.log('  *** PLEASE CHANGE THIS PASSWORD AFTER FIRST LOGIN ***');
  }

  // Create some default tags
  const tags = [
    { name: 'Important', color: '#EF4444' },
    { name: 'Review', color: '#F59E0B' },
    { name: 'Tricky', color: '#8B5CF6' },
    { name: 'Classic', color: '#3B82F6' },
    { name: 'New', color: '#10B981' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }

  console.log('Created default tags');
  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
