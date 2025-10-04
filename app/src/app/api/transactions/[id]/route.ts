import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authUtils";

// Define the correct synchronous type for the context object
interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext // ✅ Corrected type: params is { id: string }
) {
  try {
    const { id } = params; // ✅ Access id directly, no await needed
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!transaction || transaction.userId !== user.userId) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (err) {
    console.error(err);
    // Ensure error is converted to a string or serializable format for NextResponse
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Error fetching transaction", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext // ✅ Corrected type: params is { id: string }
) {
  try {
    const { id } = params; // ✅ Access id directly, no await needed
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction || transaction.userId !== user.userId) {
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status } = body;

    // Rule: only allow changing status if current is pending
    if (transaction.status !== "pending") {
      return NextResponse.json(
        { message: "Only pending transactions can be updated" },
        { status: 400 }
      );
    }

    // Rule: status can only change to completed or rejected
    if (!["completed", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          message:
            "Invalid status update. Only 'completed' or 'rejected' allowed",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      message: "Transaction updated",
      transaction: updated,
    });
  } catch (err) {
    console.error(err);
    // Ensure error is converted to a string or serializable format for NextResponse
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Error updating transaction", error: errorMessage },
      { status: 500 }
    );
  }
}
