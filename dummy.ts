import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

for (let i = 0; i < 100; i++) {
  const t = [];
  for (let j = 0; j < 100; j++) {
    t.push(
      prisma.user.create({
        data: {
          email: `user${i * 100 + j}@gmail.com`,
          auth: j % 50 === 0 ? { create: {} } : undefined,
          externalAuthAssociations: {
            0: undefined,
            1: {
              create: {
                provider: "github",
                providerId: `github${i * 100 + j}`,
              },
            },
            2: {
              create: {
                provider: "google",
                providerId: `google${i * 100 + j}`,
              },
            },
          }[j % 3],
        },
      })
    );
  }

  await prisma.$transaction(t);
}
