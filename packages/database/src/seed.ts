import { prisma } from './index';

async function main() {
  console.log('🌱 Seeding Xennic database...');

  // Create initial Admin User if not exists
  const adminEmail = 'admin@xennic.ir';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'مدیر ارشد زر نور نیرو یکتا',
        passwordHash: '$2b$10$ep/8.Uj4w56wR26D1yB0xOzW5l4H3Y8gI0zL7k6b3e1...', // Placeholder hash
        role: 'SUPER_ADMIN',
        profile: {
          create: {
            companyName: 'شرکت زر نور نیرو یکتا',
            city: 'تهران',
            province: 'تهران',
          },
        },
      },
    });
    console.log(`✅ Admin user seeded: ${admin.email}`);
  }

  // Seed sample Wiki Articles (Standards)
  const sampleArticles = [
    {
      slug: 'mabhas-13-cable-sizing',
      titleFa: 'مبحث ۱۳ مقررات ملی ساختمان - الزامات سایزینگ کابل و افت ولتاژ',
      category: 'مقررات ملی ساختمان',
      summaryFa: 'بررسی ضوابط انتخاب سطح مقطع هادی‌ها بر اساس جریان مجاز و افت ولتاژ حداکثر طبق مبحث سیزدهم.',
      bodyMd: '# مبحث ۱۳ مقررات ملی ساختمان\n\nحداکثر افت ولتاژ مجاز از مبدا تغذیه تا دورترین نقطه مصرف‌کننده روشنایی نباید از ۳ درصد و برای سایر مصارف از ۵ درصد تجاوز نماید.',
      tags: ['مبحث ۱۳', 'افت ولتاژ', 'سایزینگ کابل', 'استاندارد'],
    },
    {
      slug: 'article-16-solar-law',
      titleFa: 'ماده ۱۶ قانون جهش تولید دانش‌بنیان - تعهدات صنایع در تامین برق خورشیدی',
      category: 'قوانین و آیین‌نامه‌ها',
      summaryFa: 'صنایع با دیماند بالای یک مگاوات موظفند سالانه ۱ درصد و تا پایان سال پنجم ۵ درصد از برق مصرفی خود را از طریق نیروگاه‌های تجدیدپذیر تامین کنند.',
      bodyMd: '# ماده ۱۶ قانون جهش تولید دانش‌بنیان\n\nصنایع مشمول در صورت عدم احداث، موظف به پرداخت بهای برق تجدیدپذیر بر اساس نرخ بورس سبز انرژی می‌باشند.',
      tags: ['ماده ۱۶', 'صنایع', 'خورشیدی', 'ساتبا', 'بورس سبز'],
    },
  ];

  for (const article of sampleArticles) {
    await prisma.wikiArticle.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    });
  }

  console.log('✅ Wiki articles seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
