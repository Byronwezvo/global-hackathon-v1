import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/authUtils";

// GET handler to fetch investments
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

    const investments = await prisma.investment.findMany({
      where: { userId: decoded.userId },
      include: {
        investmentAccount: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to include account name directly
    const formattedInvestments = investments.map((inv) => ({
      ...inv,
      accountName: inv.investmentAccount.name,
    }));

    return NextResponse.json(formattedInvestments);
  } catch (error) {
    console.error("Error fetching investments:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST handler to create a new investment
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

    const {
      investmentAccountId,
      amount,
      assetType,
      assetName,
      description,
      status,
      reference,
    } = await req.json();

    if (!investmentAccountId || !amount || !assetType || !assetName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the investment account belongs to the user
    const investmentAccount = await prisma.investmentAccount.findFirst({
      where: { id: investmentAccountId, userId: decoded.userId },
    });

    if (!investmentAccount) {
      return NextResponse.json(
        { message: "Investment account not found or access denied" },
        { status: 404 }
      );
    }

    const newInvestment = await prisma.investment.create({
      data: {
        userId: decoded.userId,
        investmentAccountId,
        amount: parseFloat(amount),
        assetType,
        assetName,
        description,
        status,
        reference,
      },
    });

    return NextResponse.json(newInvestment, { status: 201 });
  } catch (error) {
    console.error("Error creating investment:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
