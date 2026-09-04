import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            // Inisialisasi data starter game untuk pemain baru
            await prisma.suited.create({
              data: {
                uid: user.id,
                a: "default",
                b: "default",
                c: "default",
              },
            });

            await prisma.userResources.create({
              data: {
                uid: user.id,
                chic_coins: 0,
                glamour_gems: 0,
                glamour_dust: 0,
                fashion_tokens: 0,
                shimmering_essence: 0,
                glimmering_essence: 0,
                pity: 0,
                is_rate: false,
                standard_pity: 0,
                neonite: 0,
                chromite: 0,
              },
            });

            const tokenItems = await prisma.tokenItems.findMany();
            for (const item of tokenItems) {
              await prisma.userTokenLimit.create({
                data: {
                  uid: user.id,
                  item_id: item.id,
                  limit: item.id === 1 || item.id === 2 ? null : 1,
                  initial_limit: item.id === 1 || item.id === 2 ? null : 1,
                },
              });
            }

            const dustItems = await prisma.dustItems.findMany();
            for (const item of dustItems) {
              await prisma.userDustLimit.create({
                data: {
                  uid: user.id,
                  item_id: item.id,
                  limit: 5,
                  initial_limit: 5,
                },
              });
            }
          } catch (error) {
            console.error("Error initializing starter game data for user:", user.id, error);
          }
        },
      },
    },
  },
});
