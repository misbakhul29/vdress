import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ message: 'UID is required' }, { status: 400 });
    }

    const row = await prisma.userResources.findUnique({
      where: { uid },
    });

    if (row) {
      return NextResponse.json({
        status: "success",
        message: "user resources retrieved successfully",
        data: row,
        statusCode: 200,
      }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'User resource not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching user resource:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}