import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/authUtils";

interface Params {
  id: string;
}

// GET handler to fetch a single investment account
export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { id } = params;
    const investmentAccount = await prisma.investmentAccount.findFirst({
      where: { id, userId: decoded.userId },
    });

    if (!investmentAccount) {
      return NextResponse.json(
        { message: "Investment account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(investmentAccount);
  } catch (error) {
    console.error("Error fetching investment account:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// PUT handler to update an investment account's description
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { id } = params;
    const { description } = await req.json();

    // First, verify the account belongs to the user
    const account = await prisma.investmentAccount.findFirst({
      where: { id, userId: decoded.userId },
    });

    if (!account) {
      return NextResponse.json(
        { message: "Investment account not found or access denied" },
        { status: 404 }
      );
    }

    const updatedAccount = await prisma.investmentAccount.update({
      where: { id },
      data: {
        description,
      },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error("Error updating investment account:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
