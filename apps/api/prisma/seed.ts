import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as bcrypt from 'bcrypt';

let prisma: PrismaClient;

async function main() {
    const url = process.env.TURSO_DB_URL;
    const authToken = process.env.TURSO_TOKEN;

    if (url && authToken) {
        console.log('Connecting to Turso LibSQL for seeding...');
        const adapter = new PrismaLibSql({ url, authToken });
        prisma = new PrismaClient({ adapter });
    } else {
        console.log('Connecting to Local SQLite for seeding...');
        prisma = new PrismaClient();
    }

    console.log('Clearing database...');
    // Delete in reverse order of dependency
    await prisma.chatMessage.deleteMany();
    await prisma.chatGroup.deleteMany();
    await prisma.task.deleteMany();
    await prisma.member.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.volunteer.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.galleryImage.deleteMany();
    await prisma.event.deleteMany();
    await prisma.festival.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    const hashedPassword = await bcrypt.hash('Testing123!', 10);

    console.log('Seeding Organization...');
    const org = await prisma.organization.create({
        data: {
            name: 'Acme Events Co.',
        },
    });

    console.log('Seeding Users...');
    const organizer = await prisma.user.create({
        data: {
            email: 'organizer@ddd.com',
            name: 'Organizer',
            password: hashedPassword,
            role: 'ORGANIZER',
            organizationId: org.id,
        },
    });

    await prisma.user.create({
        data: {
            email: 'admin@ddd.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
            organizationId: org.id,
        },
    });

    await prisma.user.create({
        data: {
            email: 'admin@example.com',
            name: 'Demo Admin',
            password: hashedPassword,
            role: 'ADMIN',
            organizationId: org.id,
        },
    });

    console.log('Seeding Festival (Basanti Durga Puja 2026)...');

    const scheduleDays = [
        {
            id: 'sashthi',
            title: '১. ষষ্ঠী – ২২ মার্চ ২০২৬',
            dateLabel: 'ষষ্ঠী: ২২ মার্চ ২০২৬',
            icon: '🌺',
            rituals: ['কল্পপারম্বনার আচার', 'অধিবাস (Adhibas)', 'আমন্ত্রণ (Amantran)', 'বোধন (Bodhan)'],
            materials: ['বেলপাতা', 'কলা গাছ', 'ধূপ, দীপ', 'ফুল, ফল', 'ঘট (কলস)'],
            notes: 'বাসন্তী দুর্গাপূজা বসন্তকালে মা দুর্গা-র আরাধনার একটি প্রাচীন রূপ।',
        },
        {
            id: 'saptami',
            title: '২. সপ্তমী – ২৩ মার্চ ২০২৬',
            dateLabel: 'সপ্তমী: ২৩ মার্চ ২০২৬',
            icon: '🌸',
            rituals: ['নবপত্রিকা স্নান', 'নবপত্রিকা স্থাপন', 'সপ্তমী পূজা'],
            materials: ['কলা', 'কচু', 'হলুদ', 'জয়ন্তী', 'বিল্ব', 'দাড়িম', 'অশোক', 'ধান', 'মান'],
            notes: 'এই ৯টি গাছ দেবীর ৯টি শক্তির প্রতীক।',
        },
        {
            id: 'ashtami',
            title: '৩. অষ্টমী – ২৪ মার্চ ২০২৬',
            dateLabel: 'অষ্টমী: ২৪ মার্চ ২০২৬',
            icon: '🔱',
            rituals: ['মহাষ্টমী পূজা', 'অঞ্জলি প্রদান', 'সন্ধি পূজা', '১০৮টি প্রদীপ জ্বালানো হয়', '১০৮টি পদ্ম ফুল নিবেদন করা হয়'],
            notes: 'এই দিন পূজার সবচেয়ে গুরুত্বপূর্ণ দিন।',
        },
        {
            id: 'navami',
            title: '৪. নবমী – ২৫ মার্চ ২০২৬',
            dateLabel: 'নবমী: ২৫ মার্চ ২০২৬',
            icon: '🔥',
            rituals: ['মহানবমী পূজা', 'হোম যজ্ঞ', 'ভোগ নিবেদন'],
            notes: 'এই দিনে দেবীর কাছে শান্তি ও সমৃদ্ধির জন্য প্রার্থনা করা হয়।',
        },
        {
            id: 'dashami',
            title: '৫. দশমী – ২৬ মার্চ ২০২৬',
            dateLabel: 'দশমী: ২৬ মার্চ ২০২৬',
            icon: '🌿',
            rituals: ['দশমী পূজা', 'দেবী বরণ', 'সিঁদুর খেলা', 'বিসর্জন'],
        },
    ];

    const committeeSections = [
        {
            id: 'adviser',
            icon: '🪔',
            title: 'প্রধান উপদেষ্টা',
            roles: [
                {
                    id: 'advisers',
                    label: 'উপদেষ্টা',
                    members: ['শ্রী অমিত দাস', 'শ্রী সুমন ঘোষ'],
                },
            ],
        },
        {
            id: 'president',
            icon: '👑',
            title: 'সভাপতি মণ্ডলী',
            roles: [
                { id: 'president-president', label: 'সভাপতি', members: ['শ্রী দেবাশিস পাল'] },
                { id: 'president-vice', label: 'সহ সভাপতি', members: ['শ্রী রবি মন্ডল'] },
            ],
        },
        {
            id: 'volunteers',
            icon: '🤝',
            title: 'স্বেচ্ছাসেবক দল',
            roles: [
                {
                    id: 'volunteers',
                    label: 'স্বেচ্ছাসেবক',
                    members: ['রাহুল', 'বাপন', 'সুমন'],
                },
            ],
        },
    ];

    const footer = {
        locations: ['Upper Champahati', 'Samudragarh', 'Purba Burdwan'],
    };

    const festival = await prisma.festival.create({
        data: {
            id: 'f-basanti-2026',
            title: 'শ্রী শ্রী বাসন্তী দুর্গাপূজা ২০২৬',
            subtitle: '২৪ মার্চ থেকে ২৮ মার্চ',
            description: 'শ্রী শ্রী বাসন্তী দুর্গাপূজা : \n \n বাসন্তী দুর্গাপূজা হল মা দুর্গার এক প্রাচীন পূজা যা বসন্তকালে চৈত্র মাসে পালিত হয় এবং যার ঐতিহাসিক উল্লেখ পাওয়া যায় প্রায় খ্রিস্টীয় ৪০০-৬০০ সালের মধ্যে রচিত মার্কণ্ডেয় পুরাণ-এর অন্তর্গত দেবী মহাত্ম্য-এ, যেখানে বলা হয়েছে যে এই পূজার সূচনা করেছিলেন রাজা সুরথ ও সমাধি বৈশ্য, যারা কঠোর ভক্তি ও তপস্যার মাধ্যমে দেবীর কৃপা লাভ করেন, আর সেই ঐতিহ্য থেকেই বসন্তের নবজাগরণের সময় দেবী শক্তির আরাধনা হিসেবে বাসন্তী দুর্গাপূজা আজও বহু স্থানে ভক্তি, আধ্যাত্মিকতা ও সাংস্কৃতিক আনন্দের সঙ্গে উদযাপিত হয় এবং এটি শারদীয় দুর্গাপূজার আগে প্রচলিত প্রাচীনতম দুর্গা পূজার একটি রূপ হিসেবে বিশেষভাবে গুরুত্বপূর্ণ ও শ্রেষ্ঠ বলে বিবেচিত। 🙏🌼',
            location: 'Champahati, Samudragarh',
            bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop', // Placeholder or real
            startDate: new Date('2026-03-22'),
            endDate: new Date('2026-03-26'),
            scheduleJson: JSON.stringify(scheduleDays),
            committeeJson: JSON.stringify(committeeSections),
            footerJson: JSON.stringify(footer),
            creatorId: organizer.id,
            organizationId: org.id,
        },
    });

    console.log('Seeding Events...');
    await prisma.event.create({
        data: {
            title: 'Main Stage Kickoff',
            description: 'Opening ceremony',
            date: new Date('2026-08-01T18:00:00Z'),
            location: 'Main Stage',
            festivalId: festival.id,
            creatorId: organizer.id,
        },
    });

    await prisma.event.create({
        data: {
            title: 'VIP Afterparty',
            description: 'Exclusive afterparty',
            date: new Date('2026-08-03T23:00:00Z'),
            location: 'VIP Lounge',
            festivalId: festival.id,
            creatorId: organizer.id,
        },
    });

    console.log('Seeding complete. Users:');
    console.log('  organizer@ddd.com / Testing123! (ORGANIZER)');
    console.log('  admin@ddd.com / Testing123! (ADMIN)');
    console.log('  admin@example.com / Testing123! (ADMIN)');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
