import { PrismaClient, ContentStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@finnap.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  const name = process.env.SEED_ADMIN_NAME ?? 'مدیر فیناپ';

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name,
      role: UserRole.ADMIN,
    },
    update: { passwordHash, name, role: UserRole.ADMIN },
  });

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
  });

  await prisma.telegramSettings.upsert({
    where: { eventId: event.id },
    create: { eventId: event.id },
    update: {},
  });

  await prisma.llmSettings.upsert({
    where: { eventId: event.id },
    create: { eventId: event.id },
    update: {},
  });

  await prisma.eventLink.upsert({
    where: { eventId_key: { eventId: event.id, key: 'registration' } },
    create: {
      eventId: event.id,
      key: 'registration',
      label: 'ثبت‌نام',
      url: 'https://example.com/register',
    },
    update: {},
  });

  const topics = [
    {
      key: 'schedule',
      title: 'برنامه',
      keywords: ['برنامه', 'پنل', 'زمان', 'سالن', 'سخنرانی'],
    },
    {
      key: 'tickets',
      title: 'بلیت و ثبت‌نام',
      keywords: ['بلیت', 'ثبت‌نام', 'ثبت نام', 'قیمت', 'ظرفیت'],
    },
    {
      key: 'location',
      title: 'لوکیشن و دسترسی',
      keywords: ['آدرس', 'لوکیشن', 'نقشه', 'پارکینگ', 'مترو'],
    },
    {
      key: 'sponsors',
      title: 'اسپانسر',
      keywords: ['اسپانسر', 'حمایت', 'همکاری'],
    },
    {
      key: 'contact',
      title: 'ارتباط',
      keywords: ['پشتیبانی', 'تماس', 'کمک'],
    },
  ];

  for (const [index, topic] of topics.entries()) {
    await prisma.topicNode.upsert({
      where: { eventId_key: { eventId: event.id, key: topic.key } },
      create: {
        eventId: event.id,
        key: topic.key,
        title: topic.title,
        keywordsJson: JSON.stringify(topic.keywords),
        sampleQuestions: JSON.stringify([`درباره ${topic.title} بگو`]),
        sortOrder: index,
      },
      update: {
        title: topic.title,
        keywordsJson: JSON.stringify(topic.keywords),
      },
    });
  }

  const faqCount = await prisma.faqItem.count({ where: { eventId: event.id } });
  if (faqCount === 0) {
    await prisma.faqItem.createMany({
      data: [
        {
          eventId: event.id,
          question: 'رویداد کجا برگزار می‌شود؟',
          answer:
            'جزئیات دقیق آدرس در بخش لوکیشن پنل ثبت می‌شود. فعلاً از لینک مسیریابی رویداد استفاده کنید.',
          topicKey: 'location',
          status: ContentStatus.APPROVED,
        },
        {
          eventId: event.id,
          question: 'چطور ثبت‌نام کنم؟',
          answer:
            'از طریق لینک ثبت‌نام رسمی رویداد اقدام کنید. اگر مشکل داشتید در بات بنویسید تا پیگیری شود.',
          topicKey: 'tickets',
          status: ContentStatus.APPROVED,
        },
        {
          eventId: event.id,
          question: 'برنامه پنل‌ها چیست؟',
          answer:
            'برنامه به‌روز در پنل محتوا ثبت می‌شود و همین اطلاعات در پاسخ بات استفاده می‌گردد.',
          topicKey: 'schedule',
          status: ContentStatus.APPROVED,
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed OK');
  // eslint-disable-next-line no-console
  console.log(`Admin: ${email} / ${password}`);
  // eslint-disable-next-line no-console
  console.log(`Event: ${event.title} (${event.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
