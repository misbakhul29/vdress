import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decryptData, encryptData } from "@/lib/crypto";

export async function POST(req: Request) {
    try {
        const { encryptedData } = await req.json();

        if (!encryptedData) {
            return NextResponse.json({
                status: "badRequest",
                message: "Encrypted data is required",
                errorCode: 400,
            }, { status: 400 });
        }

        try {
            const decryptedData = decryptData(encryptedData);
            const { action, uid, top, bottom, feet, layer } = decryptedData || {};
            console.log("decryptedData : ", decryptedData);

            if (!uid || !action) {
                return NextResponse.json({
                    status: "badRequest",
                    message: "Missing uid or action in decrypted data",
                    errorCode: 400
                }, { status: 400 });
            }

            switch (action) {
                case "updateOutfit":
                    if (!top || !bottom || !feet) {
                        return NextResponse.json({
                            status: "badRequest",
                            message: "Missing required fields for updateOutfit",
                            errorCode: 400
                        }, { status: 400 });
                    }

                    const updateResult = await prisma.suited.updateMany({
                        where: { uid },
                        data: { a: top, b: bottom, c: feet },
                    });

                    if (updateResult.count > 0) {
                        const encryptedResponse = encryptData({ message: "Outfit updated successfully" });
                        return NextResponse.json({ status: "success", encryptedData: encryptedResponse, statusCode: 200 }, { status: 200 });
                    } else {
                        return NextResponse.json({ status: "notFound", message: "User not found", errorCode: 404 }, { status: 404 });
                    }

                case "getOutfitData": {
                    const rows = await prisma.suited.findMany({
                        where: { uid },
                    });
                    const encryptedResponseGetOutfit = encryptData(rows);
                    return NextResponse.json({ encryptedData: encryptedResponseGetOutfit, status: 200 }, { status: 200 });
                }

                case "getOutfitByLayer": {
                    if (!layer) {
                        return NextResponse.json({
                            status: "badRequest",
                            message: "Missing layer for getOutfitByLayer",
                            errorCode: 400
                        }, { status: 400 });
                    }

                    const outfitLayer = await prisma.inventory.findMany({
                        where: { layer, uid },
                    });
                    const encryptedResponseGetOutfitLayer = encryptData(outfitLayer);
                    return NextResponse.json({ encryptedData: encryptedResponseGetOutfitLayer, status: 200 }, { status: 200 });
                }

                default:
                    return NextResponse.json({ status: "badRequest", message: "Invalid action", errorCode: 400 }, { status: 400 });
            }
        } catch (decryptError) {
            console.error("Decryption error:", decryptError);
            return NextResponse.json({
                status: "badRequest",
                message: "Invalid encrypted data",
                errorCode: 400,
            }, { status: 400 });
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ status: "internalError", message: "Internal server error", errorCode: 500 }, { status: 500 });
    }
}

export async function GET() {
    try {
        const rows = await prisma.suited.findMany();

        if (rows && rows.length > 0) {
            return NextResponse.json({ status: "success", message: 'Successed getting api data', statusCode: 200 }, { status: 200 });
        } else {
            return NextResponse.json({ status: "notFound", message: 'Data not found', errorCode: 404 }, { status: 404 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ status: "internalError", message: "Internal server error", errorCode: 500 }, { status: 500 });
    }
}