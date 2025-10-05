
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/authUtils";

// GET handler to fetch investment accounts
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const investmentAccounts = await prisma.investmentAccount.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(investmentAccounts);
  } catch (error) {
    console.error("Error fetching investment accounts:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST handler to create a new investment account
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { name, description, currency } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Account name is required" },
        { status: 400 }
      );
    }

    const newAccount = await prisma.investmentAccount.create({
      data: {
        userId: decoded.userId,
        name,
        description,
        currency,
      },
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    console.error("Error creating investment account:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
