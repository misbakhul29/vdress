import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { decryptData } from "@/lib/crypto";

export async function GET(req: Request) {
    try {
        const rows = await prisma.gachaItem.findMany();

        if (rows && rows.length > 0) {
            return NextResponse.json({ status: "success", message: 'Successed getting api data', statusCode: 200, data: rows }, { status: 200 });
        } else {
            return NextResponse.json({ status: "notFound", message: 'Data not found', errorCode: 404 }, { status: 404 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ status: "internalError", message: 'Internal server error', errorCode: 500 }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { encryptedData } = await req.json();
        console.log("Data terenkripsi yang diterima:", encryptedData);

        let decryptedData: any;
        try {
            decryptedData = decryptData(encryptedData);
        } catch (decryptError) {
            console.error("Decryption error:", decryptError);
            return NextResponse.json({ message: "Decryption failed", error: "corrupt" }, { status: 400 });
        }

        const { uid, typeFetch, ...data } = decryptedData || {};

        if (!uid || !typeFetch) {
            return NextResponse.json({ message: 'uid and typeFetch are required' }, { status: 400 });
        }

        switch (typeFetch) {
            case 'updateGems': {
                try {
                    const glamourGems = parseInt(data.glamour_gems || '0', 10);
                    if (isNaN(glamourGems)) {
                        return NextResponse.json({ message: 'Invalid glamour_gems value' }, { status: 400 });
                    }

                    if (!uid || uid.length < 3) {
                        return NextResponse.json({ message: 'Invalid uid' }, { status: 400 });
                    }

                    const userRes = await prisma.userResources.findUnique({
                        where: { uid },
                    });

                    if (!userRes) {
                        return NextResponse.json({ message: 'User resources not found' }, { status: 404 });
                    }

                    const newGlamourGems = userRes.glamour_gems - glamourGems;
                    await prisma.userResources.update({
                        where: { uid },
                        data: { glamour_gems: newGlamourGems },
                    });

                    return NextResponse.json({ message: 'glamour_gems updated successfully' }, { status: 200 });
                } catch (error) {
                    console.error('Error updating glamour_gems:', error);
                    return NextResponse.json({ message: 'Failed to update glamour_gems', error: error }, { status: 500 });
                }
            }

            case 'resetPity': {
                const res = await prisma.userResources.updateMany({
                    where: { uid },
                    data: { pity: 0 },
                });
                if (res.count > 0) {
                    return NextResponse.json({ message: 'pity updated to 0 successfully' }, { status: 200 });
                } else {
                    return NextResponse.json({ message: 'user not found' }, { status: 404 });
                }
            }

            case 'getAllGachaItems': {
                const gachaItem = await prisma.gachaItem.findMany();
                if (gachaItem.length > 0) {
                    return NextResponse.json({ gachaItem }, { status: 200 });
                } else {
                    return NextResponse.json({ message: 'items not found' }, { status: 404 });
                }
            }

            case 'updateEssence': {
                try {
                    const { essence, type } = data;
                    console.log('updateessence data :', essence, type);

                    if (isNaN(essence)) {
                        return NextResponse.json({ message: 'Invalid essence value' }, { status: 400 });
                    }

                    if (type === 'limited') {
                        await prisma.userResources.updateMany({
                            where: { uid },
                            data: { glimmering_essence: { decrement: Number(essence) } },
                        });
                    } else if (type === 'standard') {
                        await prisma.userResources.updateMany({
                            where: { uid },
                            data: { shimmering_essence: { decrement: Number(essence) } },
                        });
                    }

                    return NextResponse.json({ message: `${type} Essence updated successfully` }, { status: 200 });
                } catch (error) {
                    console.error('Error updating Essence:', error);
                    return NextResponse.json({ message: 'Failed to update Essence', error: error }, { status: 500 });
                }
            }

            case 'incPity': {
                const incPity = parseInt(data.incPity || '0', 10);
                const typePity = data.type;

                if (isNaN(incPity)) {
                    return NextResponse.json({ message: 'Invalid incPity value' }, { status: 400 });
                }

                try {
                    const dataToUpdate = typePity === 'limited' ? { pity: incPity } : { standard_pity: incPity };
                    const result = await prisma.userResources.updateMany({
                        where: { uid },
                        data: dataToUpdate,
                    });

                    if (result.count > 0) {
                        return NextResponse.json({ message: 'Pity updated successfully' }, { status: 200 });
                    } else {
                        return NextResponse.json({ message: 'User not found, failed set pity' }, { status: 404 });
                    }
                } catch (error) {
                    console.error('Error updating pity:', error);
                    return NextResponse.json({ message: 'Failed to update pity' }, { status: 500 });
                }
            }

            case 'batchUpInven': {
                try {
                    const { items } = data;

                    if (!Array.isArray(items) || items.length === 0) {
                        return NextResponse.json({ message: 'Items array is required and cannot be empty' }, { status: 400 });
                    }

                    const invalidItems = items.filter(item =>
                        !item.item_name || !item.rarity || !item.part_outfit || !item.layer
                    );

                    if (invalidItems.length > 0) {
                        return NextResponse.json({
                            message: 'Each item must have item_name, rarity, part_outfit, and layer'
                        }, { status: 400 });
                    }

                    await prisma.inventory.createMany({
                        data: items.map(item => ({
                            uid,
                            rarity: item.rarity,
                            item_name: item.item_name,
                            part_outfit: item.part_outfit,
                            layer: item.layer,
                            stat: item.stat ?? undefined,
                            power: item.power ? parseFloat(item.power) : null,
                        })),
                    });

                    return NextResponse.json({ message: 'Items pushed successfully' }, { status: 200 });
                } catch (error) {
                    console.error('Error updating inventory:', error);
                    return NextResponse.json({ message: 'Error updating inventory' }, { status: 500 });
                }
            }

            case 'batchUpHistory': {
                try {
                    const { items } = data;

                    if (!Array.isArray(items) || items.length === 0) {
                        return NextResponse.json({ message: 'Items array is required and cannot be empty' }, { status: 400 });
                    }

                    const invalidItems = items.filter(item =>
                        !item.item_name || !item.rarity || !item.part_outfit || !item.gacha_type
                    );

                    if (invalidItems.length > 0) {
                        return NextResponse.json({
                            message: 'Each item must have item_name, rarity, part_outfit, and gacha_type'
                        }, { status: 400 });
                    }

                    await prisma.gachaHistory.createMany({
                        data: items.map(item => ({
                            uid,
                            rarity: item.rarity,
                            item_name: item.item_name,
                            part_outfit: item.part_outfit,
                            gacha_type: item.gacha_type,
                        })),
                    });

                    return NextResponse.json({ message: 'Items pushed successfully' }, { status: 200 });
                } catch (error) {
                    console.error('Error updating history:', error);
                    return NextResponse.json({ message: 'Error updating history' }, { status: 500 });
                }
            }

            case 'getPity': {
                try {
                    const getPityRows = await prisma.userResources.findMany({
                        where: { uid },
                        select: { pity: true },
                    });
                    return NextResponse.json(getPityRows, { status: 200 });
                } catch (error) {
                    console.error('Error fetching pity:', error);
                    return NextResponse.json({ message: 'Failed to fetch pity', error: error }, { status: 500 });
                }
            }

            case 'getStandardPity': {
                try {
                    const getStandardRows = await prisma.userResources.findMany({
                        where: { uid },
                        select: { standard_pity: true },
                    });
                    return NextResponse.json(getStandardRows, { status: 200 });
                } catch (error) {
                    console.error('Error fetching pity:', error);
                    return NextResponse.json({ message: 'Failed to fetch pity', error: error }, { status: 500 });
                }
            }

            case 'getRateUpItem': {
                const getRarity = data.rarity;
                if (!getRarity) {
                    return NextResponse.json({ message: 'rarity is required' }, { status: 400 });
                }
                const getLimitedRows = await prisma.gachaItem.findMany({
                    where: { rarity: getRarity, rate_up: true },
                });
                return NextResponse.json(getLimitedRows, { status: 200 });
            }

            case 'getRateOffItem': {
                const getOffRarity = data.rarity;
                if (!getOffRarity) {
                    return NextResponse.json({ message: 'rarity is required' }, { status: 400 });
                }
                const getOffRows = await prisma.gachaItem.findMany({
                    where: { rarity: getOffRarity, rate_up: false },
                });
                return NextResponse.json(getOffRows, { status: 200 });
            }

            case 'getRateOn': {
                const rateOnRows = await prisma.userResources.findUnique({
                    where: { uid },
                    select: { is_rate: true },
                });
                return NextResponse.json(rateOnRows?.is_rate ?? false, { status: 200 });
            }

            case 'setRateOn': {
                await prisma.userResources.updateMany({
                    where: { uid },
                    data: { is_rate: true },
                });
                return NextResponse.json({ message: 'is_rate set to true successfully' }, { status: 200 });
            }

            case 'setRateOff': {
                await prisma.userResources.updateMany({
                    where: { uid },
                    data: { is_rate: false },
                });
                return NextResponse.json({ message: 'is_rate set to false successfully' }, { status: 200 });
            }

            case 'getGachaItem': {
                const getGachaRarity = data.rarity;
                if (!getGachaRarity) {
                    return NextResponse.json({ message: 'rarity is required' }, { status: 400 });
                }
                const getGachaRows = await prisma.gachaItem.findMany({
                    where: { rarity: getGachaRarity },
                });
                return NextResponse.json(getGachaRows, { status: 200 });
            }

            case 'getStandardItem': {
                const rarity = data.rarity;
                if (!rarity) {
                    return NextResponse.json({ message: 'rarity is required' }, { status: 400 });
                }
                const standardRows = await prisma.gachaItem.findMany({
                    where: { rarity, islimited: false },
                });
                return NextResponse.json(standardRows, { status: 200 });
            }

            case 'getUserData': {
                try {
                    const user = await prisma.user.findUnique({ where: { id: uid } });
                    const inventory = await prisma.inventory.findMany({ where: { uid } });
                    const userResources = await prisma.userResources.findMany({ where: { uid } });
                    const suited = await prisma.suited.findMany({ where: { uid } });

                    if (!user) {
                        return NextResponse.json({ message: 'User not found' }, { status: 404 });
                    }

                    const userData = {
                        ...user,
                        inventory: inventory,
                        user_resources: userResources,
                        suited: suited,
                    };

                    return NextResponse.json(userData, { status: 200 });
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    return NextResponse.json({ message: 'Error fetching user data' }, { status: 500 });
                }
            }

            case 'getHistory': {
                try {
                    const gacha_type = data.gacha_type;
                    const history = await prisma.gachaHistory.findMany({
                        where: { uid, gacha_type },
                    });
                    return NextResponse.json(history, { status: 200 });
                } catch (error) {
                    console.error('Error fetching history:', error);
                    return NextResponse.json({ message: 'Error fetching history' }, { status: 500 });
                }
            }

            case 'upHistoryA': {
                try {
                    const { item_name, rarity, part_outfit, gacha_type } = data;

                    if (!item_name || !rarity || !part_outfit || !gacha_type) {
                        return NextResponse.json({ message: 'item_name, rarity, part_outfit, and gacha_type are required' }, { status: 400 });
                    }

                    await prisma.gachaHistory.create({
                        data: {
                            uid,
                            rarity,
                            item_name,
                            part_outfit,
                            gacha_type,
                        },
                    });

                    return NextResponse.json({ message: `${item_name} push successfully` }, { status: 200 });
                } catch (error) {
                    console.error('Error adding history:', error);
                    return NextResponse.json({ message: 'Error adding history' }, { status: 500 });
                }
            }

            case 'exchangeGemsForEssence': {
                try {
                    const type = data.type;
                    const glamourGems = parseInt(data.glamour_gems || '0', 10);
                    let essence: number;
                    if (type === 'glimmering_essence') {
                        essence = parseInt(data.glimmering_essence || '0', 10);
                    } else {
                        essence = parseInt(data.shimmering_essence || '0', 10);
                    }

                    if (isNaN(glamourGems) || isNaN(essence)) {
                        return NextResponse.json({ message: 'Invalid glamour_gems or essence value' }, { status: 400 });
                    }

                    const updateData = type === 'glimmering_essence'
                        ? { glamour_gems: { decrement: glamourGems }, glimmering_essence: { increment: essence } }
                        : { glamour_gems: { decrement: glamourGems }, shimmering_essence: { increment: essence } };

                    await prisma.userResources.update({
                        where: { uid },
                        data: updateData,
                    });

                    return NextResponse.json({ message: 'Gems exchanged for essence successfully' }, { status: 200 });
                } catch (error) {
                    console.error('Error exchanging gems for essence:', error);
                    return NextResponse.json({ message: 'Failed to exchange gems for essence', error: error }, { status: 500 });
                }
            }

            case 'updateGlamourDust': {
                try {
                    const glamourDust = parseInt(data.glamour_dust || '0', 10);

                    if (isNaN(glamourDust)) {
                        return NextResponse.json({ message: 'Invalid glamour_dust value' }, { status: 400 });
                    }

                    await prisma.userResources.update({
                        where: { uid },
                        data: { glamour_dust: { increment: glamourDust } },
                    });

                    return NextResponse.json({ message: 'Glamour Dust updated successfully' }, { status: 200 });
                } catch (error) {
                    console.error('Error updating Glamour Dust:', error);
                    return NextResponse.json({ message: 'Failed to update Glamour Dust', error: error }, { status: 500 });
                }
            }

            case 'updateFashionTokens': {
                try {
                    const fashionTokens = parseInt(data.fashion_tokens || '0', 10);

                    if (isNaN(fashionTokens)) {
                        return NextResponse.json({ message: 'Invalid fashion_tokens value' }, { status: 400 });
                    }

                    await prisma.userResources.update({
                        where: { uid },
                        data: { fashion_tokens: { increment: fashionTokens } },
                    });

                    return NextResponse.json({ message: 'fashion_tokens updated successfully' }, { status: 200 });
                } catch (error) {
                    console.error('Error updating fashion_tokens:', error);
                    return NextResponse.json({ message: 'Failed to update fashion_tokens', error: error }, { status: 500 });
                }
            }

            default:
                return NextResponse.json({ message: 'Invalid typeFetch' }, { status: 400 });
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ status: "internalError", message: 'Internal server error', errorCode: 500 }, { status: 500 });
    }
}