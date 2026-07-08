import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp'
    }
  });
  console.log(`Created Organization: ${org.name}`);

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'demo@aiworkspace.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Admin',
      role: 'ADMIN',
      organizationId: org.id
    }
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@aiworkspace.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Manager',
      role: 'MANAGER',
      organizationId: org.id
    }
  });
  console.log('Created Users: demo@aiworkspace.com, manager@aiworkspace.com');

  // 3. Create Teams
  const engTeam = await prisma.team.create({
    data: {
      name: 'Engineering',
      organizationId: org.id,
      members: {
        create: [
          { userId: admin.id, role: 'LEADER' },
          { userId: manager.id, role: 'MEMBER' }
        ]
      }
    }
  });

  // 4. Create Projects & Tasks
  const project1 = await prisma.project.create({
    data: {
      name: 'Q3 Enterprise Launch',
      description: 'Go-to-market strategy for the new enterprise tier.',
      status: 'ACTIVE',
      organizationId: org.id,
      ownerId: admin.id,
      teamId: engTeam.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Finalize Security Audit',
      description: 'Review the Phase 17 security headers and rate limits.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      organizationId: org.id,
      projectId: project1.id,
      assigneeId: admin.id,
      reporterId: manager.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Deploy to Kubernetes',
      description: 'Setup the production cluster and push docker images.',
      status: 'TODO',
      priority: 'URGENT',
      organizationId: org.id,
      projectId: project1.id,
      assigneeId: manager.id,
      reporterId: admin.id
    }
  });

  // 5. Create CRM Pipeline (Clients, Leads, Opportunities)
  const client1 = await prisma.client.create({
    data: {
      name: 'Globex Corporation',
      industry: 'Technology',
      organizationId: org.id,
    }
  });

  const stageNew = await prisma.pipelineStage.create({
    data: { name: 'New', order: 1, color: 'blue', organizationId: org.id }
  });
  
  const stageNegotiation = await prisma.pipelineStage.create({
    data: { name: 'Negotiation', order: 2, color: 'yellow', organizationId: org.id }
  });

  await prisma.opportunity.create({
    data: {
      title: 'Globex Enterprise License 2026',
      amount: 150000,
      probability: 75,
      expectedCloseDate: new Date('2026-12-01'),
      organizationId: org.id,
      clientId: client1.id,
      stageId: stageNegotiation.id,
      ownerId: admin.id
    }
  });
  
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
