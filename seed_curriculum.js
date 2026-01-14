import prisma from './src/prisma.js';
import bcrypt from 'bcryptjs';

const seed = async () => {
  // 1. Create Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mansa.edu' },
    update: {},
    create: {
      email: 'admin@mansa.edu',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN'
    }
  });
  console.log('Admin created:', admin.email);

  // 2. Create Curriculum Structure
  // High School -> Grade 10 -> Math -> Algebra
  
  const stage = await prisma.stage.create({
      data: {
          name: 'High School',
          grades: {
              create: [
                  {
                      name: 'Grade 10',
                      subjects: {
                          create: [
                              {
                                  name: 'Mathematics',
                                  units: {
                                      create: [
                                          { name: 'Algebra' },
                                          { name: 'Geometry' }
                                      ]
                                  }
                              },
                              {
                                  name: 'Physics',
                                  units: {
                                      create: [
                                          { name: 'Mechanics' },
                                          { name: 'Thermodynamics' }
                                      ]
                                  }
                              }
                          ]
                      }
                  },
                  {
                      name: 'Grade 11',
                      subjects: {
                          create: [
                              {
                                  name: 'Chemistry',
                                  units: {
                                      create: [
                                          { name: 'Organic Chemistry' }
                                      ]
                                  }
                              }
                          ]
                      }
                  }
              ]
          }
      }
  });
  
  console.log('Curriculum seeded');
};

seed()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
