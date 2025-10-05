import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/authUtils";

interface Params {
  id: string;
}

// GET handler to fetch a single investment
export async function GET(req: NextRequest, { params }: { params: Params }) {
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
    const investment = await prisma.investment.findFirst({
      where: { id, userId: decoded.userId },
    });

    if (!investment) {
      return NextResponse.json(
        { message: "Investment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(investment);
  } catch (error) {
    console.error("Error fetching investment:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// PUT handler to update an investment
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
    const { description, status, reference } = await req.json();

    // First, verify the investment belongs to the user
    const investment = await prisma.investment.findFirst({
      where: { id, userId: decoded.userId },
    });

    if (!investment) {
      return NextResponse.json(
        { message: "Investment not found or access denied" },
        { status: 404 }
      );
    }

    // If status is 'closed', prevent any updates
    if (investment.status === "closed") {
      return NextResponse.json(
        { message: "Cannot update a closed investment" },
        { status: 403 }
      );
    }

    const updatedInvestment = await prisma.investment.update({
      where: { id },
      data: {
        description,
        status,
        reference,
      },
    });

    return NextResponse.json(updatedInvestment);
  } catch (error) {
    console.error("Error updating investment:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
