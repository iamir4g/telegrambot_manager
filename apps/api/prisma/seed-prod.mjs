import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'

const require = createRequire(import.meta.url)
const bcrypt = require('bcryptjs')


const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@finnap.local'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123'
  const name = process.env.SEED_ADMIN_NAME ?? 'مدیر فیناپ'

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name,
      role: 'ADMIN',
    },
    update: { passwordHash, name, role: 'ADMIN' },
  })

  const event = await prisma.event.upsert({
    where: { slug: 'credit-first-2026' },
    create: {
      slug: 'credit-first-2026',
      title: 'Finup Credit First',
      description: 'رویداد اعتباری فیناپ',
      isActive: true,
      dayGuideJson: JSON.stringify({
        entrance: 'ورودی شمالی',
        checkin: 'پذیرش از ساعت ۸:۳۰',
        help: 'میز کمک کنار پذیرش',
      }),
    },
    update: { isActive: true, title: 'Finup Credit First' },
  })

  await prisma.telegramSettings.upsert({
    where: { eventId: event.id },
    create: { eventId: event.id },
    update: {},
  })

  await prisma.llmSettings.upsert({
    where: { eventId: event.id },
    create: { eventId: event.id },
    update: {},
  })

  console.log(`Seed complete: admin=${email}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
