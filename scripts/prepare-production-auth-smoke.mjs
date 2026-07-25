import { spawnSync } from 'node:child_process';

const composeFile = 'docker-compose.production.yml';
const organizationId = process.env.SMOKE_AUTH_ORGANIZATION_ID
  || '11111111-1111-4111-8111-111111111111';
const userId = process.env.SMOKE_AUTH_USER_ID
  || '22222222-2222-4222-8222-222222222222';
const email = process.env.SMOKE_AUTH_EMAIL || 'production-smoke@example.com';
const password = process.env.SMOKE_AUTH_PASSWORD || 'SmokePassword123!';

const runCompose = (args) => {
  const result = spawnSync(
    'docker',
    ['compose', '--env-file', '.env.production', '-f', composeFile, ...args],
    { encoding: 'utf8', env: process.env },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Docker Compose failed: ${args.join(' ')}`);
  }
};

const seedSource = `
const bcrypt = require('bcrypt');
const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const passwordHash = await bcrypt.hash(${JSON.stringify(password)}, 12);
  await prisma.organization.upsert({
    where: { slug: 'production-auth-smoke' },
    update: { name: 'Production Authentication Smoke', isActive: true, deletedAt: null },
    create: {
      id: ${JSON.stringify(organizationId)},
      name: 'Production Authentication Smoke',
      slug: 'production-auth-smoke',
    },
  });
  await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: ${JSON.stringify(organizationId)},
        email: ${JSON.stringify(email)},
      },
    },
    update: {
      password: passwordHash,
      role: Role.ADMIN,
      isActive: true,
      deletedAt: null,
    },
    create: {
      id: ${JSON.stringify(userId)},
      organizationId: ${JSON.stringify(organizationId)},
      firstName: 'Production',
      lastName: 'Smoke',
      email: ${JSON.stringify(email)},
      password: passwordHash,
      role: Role.ADMIN,
      emailVerified: true,
    },
  });
})()
  .finally(() => prisma.$disconnect())
  .catch((error) => { console.error(error.message); process.exitCode = 1; });
`;

runCompose(['exec', '-T', 'api', 'node', '-e', seedSource]);
console.log('PASS disposable production authentication database is prepared');
