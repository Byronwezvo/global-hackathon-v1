import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authUtils";

// ❌ REMOVE the interface RouteContext {}

// GET a single account
export async function GET(
  req: NextRequest,
  // 👇 INLINE THE CORRECT SYNCHRONOUS TYPE
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const account = await prisma.accounts.findFirst({
      where: { id: params.id, userId: user.userId },
    });

    if (!account)
      return NextResponse.json(
        { message: "Account not found" },
        { status: 404 }
      );

    return NextResponse.json(account);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: "Error fetching account" },
      { status: 500 }
    );
  }
}

// PUT: update an account
export async function PUT(
  req: NextRequest,
  // 👇 INLINE THE CORRECT SYNCHRONOUS TYPE
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const body = await req.json();

    const dataToUpdate: any = {};
    if (body.description !== undefined)
      dataToUpdate.description = body.description;

    const updatedAccount = await prisma.accounts.updateMany({
      where: { id: params.id, userId: user.userId }, // Use params.id directly
      data: dataToUpdate,
    });

    if (updatedAccount.count === 0)
      return NextResponse.json(
        { message: "Account not found or not yours" },
        { status: 404 }
      );

    return NextResponse.json({ message: "Account updated successfully" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: "Error updating account" },
      { status: 500 }
    );
  }
}
