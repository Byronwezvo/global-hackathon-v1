// app/api/transactions/route.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/authUtils";

export async function GET(req: Request) {
  try {
    //  Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    //  Pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1"); // default page 1
    const limit = parseInt(url.searchParams.get("limit") || "10"); // default 10 per page
    const skip = (page - 1) * limit;

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: { account: { userId: user.userId } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { account: true }, // optional: include related account
      }),
      prisma.transaction.count({ where: { account: { userId: user.userId } } }),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      transactions,
    });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { message: "Error fetching transactions", error: err },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // --- Auth check ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // --- Parse request body ---
    const body = await req.json();
    const {
      accountId,
      amount,
      type,
      description,
      category,
      status,
      reference,
    } = body;

    const transaction = await prisma.transaction.create({
      data: {
        accountId, // link to account
        userId: user.userId, // assign user from token
        amount,
        type,
        description,
        category,
        status,
        reference,
      },
    });

    return NextResponse.json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (err) {
    console.error("Error creating transaction:", err);
    return NextResponse.json(
      { message: "Error creating transaction", error: err },
      { status: 500 }
    );
  }
}
