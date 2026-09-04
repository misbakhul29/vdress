import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decryptData, encryptData } from "@/lib/crypto";

export async function GET() {
  try {
    const rows = await prisma.products.findMany();
    return new NextResponse(JSON.stringify({ message: 'successful', rows }), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { encryptedData } = await req.json();
    const decryptedData = decryptData(encryptedData);
    const { uid, typeFetch, ...dataFetch } = decryptedData;

    switch (typeFetch) {
      case "getUserResource": {
        const userResources = await prisma.userResources.findMany({
          where: { uid },
        });
        return NextResponse.json({ message: 'Successful', userResources: userResources || null }, { status: 200 });
      }

      case "getTokenItems": {
        const tokenItems = await prisma.tokenItems.findMany();
        const userTokenLimits = await prisma.userTokenLimit.findMany({
          where: { uid },
        });

        const mergedTokenItems = tokenItems.map((ti: any) => ({
          ...ti,
          limit: userTokenLimits.find((utl: any) => utl.item_id === ti.id)?.limit ?? null,
        }));

        const returnData = { tokenItems: mergedTokenItems };
        const encryptedReturnData = encryptData(returnData);
        return NextResponse.json({ message: 'Successful', encryptedData: encryptedReturnData }, { status: 200 });
      }

      case "getDustItems": {
        const dustItems = await prisma.dustItems.findMany({
          orderBy: { id: 'asc' },
        });
        const userDustLimits = await prisma.userDustLimit.findMany({
          where: { uid },
        });

        const mergedDustItems = dustItems.map((di: any) => ({
          ...di,
          limit: userDustLimits.find((udl: any) => udl.item_id === di.id)?.limit ?? null,
        }));

        const returnData = { dustItems: mergedDustItems };
        const encryptedReturnData = encryptData(returnData);
        return NextResponse.json({ message: 'Successful', encryptedData: encryptedReturnData }, { status: 200 });
      }

      case "restockTokenItems": {
        try {
          const tokenLimits = await prisma.userTokenLimit.findMany();
          for (const limit of tokenLimits) {
            if (limit.initial_limit !== null) {
              await prisma.userTokenLimit.update({
                where: { id: limit.id },
                data: { limit: limit.initial_limit },
              });
            }
          }
          return NextResponse.json({ message: 'Token items restocked successfully' }, { status: 200 });
        } catch (error) {
          console.error("Error during token items restock:", error);
          return NextResponse.json({ message: 'Token items restock failed' }, { status: 500 });
        }
      }

      case "restockDustItems": {
        try {
          const dustLimits = await prisma.userDustLimit.findMany();
          for (const limit of dustLimits) {
            if (limit.initial_limit !== null) {
              await prisma.userDustLimit.update({
                where: { id: limit.id },
                data: { limit: limit.initial_limit },
              });
            }
          }
          return NextResponse.json({ message: 'Dust items restocked successfully' }, { status: 200 });
        } catch (error) {
          console.error("Error during dust items restock:", error);
          return NextResponse.json({ message: 'Dust items restock failed' }, { status: 500 });
        }
      }

      case "topUp": {
        const { packageId } = dataFetch;

        try {
          const packageInfo = await prisma.products.findUnique({
            where: { id: Number(packageId) },
          });
          if (!packageInfo) {
            return NextResponse.json({ message: 'Package not found' }, { status: 404 });
          }
          const gemsToAdd = packageInfo.glamour_gems;

          const userResources = await prisma.userResources.findUnique({
            where: { uid },
          });
          if (!userResources) {
            return NextResponse.json({ error: 'User resources not found' }, { status: 404 });
          }
          const currentGems = userResources.glamour_gems;
          const newGems = currentGems + gemsToAdd;

          await prisma.userResources.update({
            where: { uid },
            data: { glamour_gems: newGems },
          });

          return NextResponse.json({ message: 'Top-up successful', newGems }, { status: 200 });

        } catch (error) {
          console.error("Error during top-up:", error);
          return NextResponse.json({ error: 'An error occurred during top-up' }, { status: 500 });
        }
      }

      case "exchangeManyGems": {
        const { essence, selectedEssence } = dataFetch;

        try {
          const resources = await prisma.userResources.findUnique({
            where: { uid },
          });
          if (!resources) {
            return NextResponse.json({ message: 'User resources not found' }, { status: 404 });
          }

          if (resources.glamour_gems < 160 * essence) {
            return NextResponse.json({ message: 'Not enough glamour gems' }, { status: 400 });
          }

          const updatedGlamourGems = resources.glamour_gems - (160 * essence);
          let updatedShimmeringEssence = resources.shimmering_essence;
          let updatedGlimmeringEssence = resources.glimmering_essence;

          if (selectedEssence === "shimmering_essence") {
            updatedShimmeringEssence += essence;
          } else if (selectedEssence === "glimmering_essence") {
            updatedGlimmeringEssence += essence;
          } else {
            return NextResponse.json({ message: 'Invalid essence type' }, { status: 400 });
          }

          await prisma.userResources.update({
            where: { uid },
            data: {
              glamour_gems: updatedGlamourGems,
              shimmering_essence: updatedShimmeringEssence,
              glimmering_essence: updatedGlimmeringEssence,
            },
          });

          return NextResponse.json({ message: 'Essence exchange successful' }, { status: 200 });

        } catch (error) {
          console.error("Error during essence exchange:", error);
          return NextResponse.json({ message: 'An error occurred during essence exchange' }, { status: 500 });
        }
      }

      case "buyTokenItem": {
        const { itemId, quantity } = dataFetch;

        if (!itemId || !quantity || quantity <= 0) {
          return NextResponse.json({ message: 'Invalid item or quantity' }, { status: 400 });
        }

        try {
          const result = await prisma.$transaction(async (tx: any) => {
            const item = await tx.tokenItems.findUnique({
              where: { id: Number(itemId) },
            });
            if (!item) {
              throw new Error("Item not found");
            }

            const userResources = await tx.userResources.findUnique({
              where: { uid },
            });
            if (!userResources) {
              throw new Error("User resources not found");
            }

            const userLimit = await tx.userTokenLimit.findFirst({
              where: { uid, item_id: Number(itemId) },
            });
            if (userLimit && userLimit.limit !== null && userLimit.limit < quantity) {
              throw new Error("Purchase limit exceeded");
            }

            const totalPrice = item.price * quantity;
            if (userResources.fashion_tokens < totalPrice) {
              throw new Error("Not enough fashion tokens");
            }

            const newTokens = userResources.fashion_tokens - totalPrice;
            let newShimmering = userResources.shimmering_essence;
            let newGlimmering = userResources.glimmering_essence;

            if (Number(itemId) === 1) {
              newShimmering += quantity;
            } else if (Number(itemId) === 2) {
              newGlimmering += quantity;
            } else {
              const gachaItem = await tx.gachaItem.findFirst({
                where: { item_name: item.name },
              });
              if (!gachaItem) {
                throw new Error("Gacha item not found");
              }

              await tx.inventory.create({
                data: {
                  uid,
                  rarity: gachaItem.rarity,
                  item_name: gachaItem.item_name,
                  part_outfit: gachaItem.part_outfit,
                  layer: gachaItem.layer,
                },
              });
            }

            await tx.userResources.update({
              where: { uid },
              data: {
                fashion_tokens: newTokens,
                shimmering_essence: newShimmering,
                glimmering_essence: newGlimmering,
              },
            });

            if (Number(itemId) !== 1 && Number(itemId) !== 2 && userLimit && userLimit.limit !== null) {
              await tx.userTokenLimit.update({
                where: { id: userLimit.id },
                data: { limit: userLimit.limit - quantity },
              });
            }

            return true;
          });

          return NextResponse.json({ message: 'Purchase successful' }, { status: 200 });
        } catch (error: any) {
          console.error('Database error during purchase:', error);
          const status = error.message === "Item not found" || error.message === "User resources not found" ? 404 : 400;
          return NextResponse.json({ message: error.message || 'Purchase failed' }, { status });
        }
      }

      case "buyDustItem": {
        const { itemId, quantity } = dataFetch;

        if (!itemId || !quantity || quantity <= 0) {
          return NextResponse.json({ message: 'Invalid item or quantity' }, { status: 400 });
        }

        try {
          await prisma.$transaction(async (tx: any) => {
            const item = await tx.dustItems.findUnique({
              where: { id: Number(itemId) },
            });
            if (!item) {
              throw new Error("Item not found");
            }

            const userResources = await tx.userResources.findUnique({
              where: { uid },
            });
            if (!userResources) {
              throw new Error("User resources not found");
            }

            const userLimit = await tx.userDustLimit.findFirst({
              where: { uid, item_id: Number(itemId) },
            });
            if (userLimit && userLimit.limit !== null && userLimit.limit < quantity) {
              throw new Error("Purchase limit exceeded");
            }

            const totalPrice = item.price * quantity;
            if (userResources.glamour_dust < totalPrice) {
              throw new Error("Not enough glamour dust");
            }

            const newTokens = userResources.glamour_dust - totalPrice;
            let newShimmering = userResources.shimmering_essence;
            let newGlimmering = userResources.glimmering_essence;

            if (Number(itemId) === 1) {
              newShimmering += quantity;
            } else if (Number(itemId) === 2) {
              newGlimmering += quantity;
            } else {
              const gachaItem = await tx.gachaItem.findFirst({
                where: { item_name: item.name },
              });
              if (!gachaItem) {
                throw new Error("Gacha item not found");
              }

              await tx.inventory.create({
                data: {
                  uid,
                  rarity: gachaItem.rarity,
                  item_name: gachaItem.item_name,
                  part_outfit: gachaItem.part_outfit,
                  layer: gachaItem.layer,
                },
              });
            }

            await tx.userResources.update({
              where: { uid },
              data: {
                glamour_dust: newTokens,
                shimmering_essence: newShimmering,
                glimmering_essence: newGlimmering,
              },
            });

            if (Number(itemId) !== 1 && Number(itemId) !== 2 && userLimit && userLimit.limit !== null) {
              await tx.userDustLimit.update({
                where: { id: userLimit.id },
                data: { limit: userLimit.limit - quantity },
              });
            }

            return true;
          });

          return NextResponse.json({ message: 'Purchase successful' }, { status: 200 });
        } catch (error: any) {
          console.error('Database error during purchase:', error);
          const status = error.message === "Item not found" || error.message === "User resources not found" ? 404 : 400;
          return NextResponse.json({ message: error.message || 'Purchase failed' }, { status });
        }
      }

      default:
        return NextResponse.json({ message: 'Invalid fetch type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
