import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const seedUsers = async () => {
    const users = [
        { id: "u1", name: "김민수", password: "password1" },
        { id: "u2", name: "박서연", password: "password2" },
        { id: "u3", name: "이도윤", password: "password3" },
        { id: "u4", name: "정하은", password: "password4" },
    ];

    for (const user of users) {
        const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
        await prisma.user.upsert({
            where: { id: user.id },
            update: { passwordHash, name: user.name },
            create: { id: user.id, name: user.name, passwordHash },
        });
    }
};

const seedRooms = async () => {
    const rooms = [
        {
            id: "room-product",
            name: "프로덕트 전략",
            description: "분기별 목표와 우선순위를 논의하는 메인 룸",
            memberCount: 8,
        },
        {
            id: "room-design",
            name: "디자인 리뷰",
            description: "UI/UX 개선안과 피드백을 공유하는 룸",
            memberCount: 5,
        },
        {
            id: "room-dev",
            name: "개발 싱크",
            description: "기술 이슈와 릴리즈 일정을 맞추는 룸",
            memberCount: 10,
        },
    ];

    for (const room of rooms) {
        await prisma.room.upsert({
            where: { id: room.id },
            update: room,
            create: room,
        });
    }
};

const seedBoardCards = async () => {
    const cards = [
        {
            id: "b1",
            roomId: "room-product",
            title: "Room 리스트 UI 고도화",
            assigneeId: "u2",
            column: "todo",
            tags: JSON.stringify(["채팅", "FSD"]),
        },
        {
            id: "b2",
            roomId: "room-product",
            title: "Presence 상태 배지 정리",
            assigneeId: "u1",
            column: "inProgress",
            tags: JSON.stringify(["Presence"]),
        },
        {
            id: "b3",
            roomId: "room-product",
            title: "보드 카드 이동 UX 점검",
            assigneeId: "u4",
            column: "done",
            tags: JSON.stringify(["보드", "UX"]),
        },
    ];

    for (const card of cards) {
        await prisma.boardCard.upsert({
            where: { id: card.id },
            update: card,
            create: card,
        });
    }
};

const seedMessages = async () => {
    const messages = [
        {
            roomId: "room-product",
            userId: "u1",
            content: "이번 주 목표를 보드에 반영해주세요.",
        },
        {
            roomId: "room-product",
            userId: "u3",
            content: "협업 보드 카드 우선순위를 먼저 정리해둘게요.",
        },
        {
            roomId: "room-design",
            userId: "u4",
            content: "새 대시보드 시안 링크 공유합니다.",
        },
        {
            roomId: "room-dev",
            userId: "u2",
            content: "소켓 재연결 정책은 UI 상태만 먼저 맞춰둘게요.",
        },
    ];

    const existing = await prisma.message.count();
    if (existing > 0) return;

    for (const message of messages) {
        await prisma.message.create({ data: message });
    }
};

const main = async () => {
    await seedUsers();
    await seedRooms();
    await seedBoardCards();
    await seedMessages();
    console.log("seeded");
};

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
