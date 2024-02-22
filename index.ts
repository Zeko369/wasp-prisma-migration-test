import { PrismaClient } from "@prisma/client";

const mode = process.argv[2] === "manual" ? "manual" : "transaction";
console.log(`Running in ${mode}`);

async function createSocialLoginMigration(
  prismaClient: PrismaClient,
  providerName: "google" | "github"
) {
  const users = await prismaClient.user.findMany({
    where: {externalAuthAssociations: {some: {provider: providerName}}},
    include: {
      auth: true,
      externalAuthAssociations: true,
    },
  });

  let numAlreadyMigratedUsers = 0;
  let numUsersMissingProvider = 0;
  let numMigratedUsers = 0;

  const transactions = [];

  for (const user of users) {
    if (user.auth) {
      // console.log("User was already migrated, skipping", user.id);
      numAlreadyMigratedUsers++;
      continue;
    }

    const provider = user.externalAuthAssociations.find(
      (provider) => provider.provider === providerName
    );

    if (!provider) {
      // console.log(`Missing ${providerName} provider, skipping user`, user.id);
      numUsersMissingProvider++;
      continue;
    }

    const promise = prismaClient.auth.create({
      data: {
        identities: {
          create: {
            providerName,
            providerUserId: provider.providerId,
            providerData: JSON.stringify({}),
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    if (mode === "manual") {
      await promise;
    } else {
      transactions.push(promise);
    }

    // console.log(`Migrated user`, user.id);
    numMigratedUsers++;
  }

  if (mode === "transaction") {
    await prismaClient.$transaction(transactions);
  }

  console.log("Num already migrated users: ", numAlreadyMigratedUsers);
  console.log("Num users missing provider: ", numUsersMissingProvider);
  console.log("Num migrated users: ", numMigratedUsers);
}

const prisma = new PrismaClient({log: ['query', 'info']});

await createSocialLoginMigration(prisma, "google");
await createSocialLoginMigration(prisma, "github");
