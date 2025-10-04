// app/api/transactions/route.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authUtils";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user)
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // --- NEW FILTER PARAMS ---
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const accountIdsParam = searchParams.get("accountIds"); // Comma-separated IDs
    const typesParam = searchParams.get("types"); // Comma-separated 'credit', 'debit'

    const where: any = {
      userId: user.userId,
    };

    // Date Range Filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date fully
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    // Account ID Filter
    if (accountIdsParam) {
      const accountIds = accountIdsParam.split(",");
      if (accountIds.length > 0) {
        where.accountId = { in: accountIds };
      }
    }

    // Type Filter (credit/debit)
    if (typesParam) {
      const types = typesParam
        .split(",")
        .filter((t) => t === "credit" || t === "debit");
      if (types.length > 0) {
        where.type = { in: types };
      }
    }

    const total = await prisma.transaction.count({ where });

    const transactions = await prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { account: { select: { name: true } } },
    });

    // Remap data to match frontend's expected format (including account name)
    const formattedTransactions = transactions.map((t) => ({
      ...t,
      // @ts-ignore: Prisma returns { account: { name: '...' } }, but we flatten it
      accountName: t.account?.name || "N/A",
      account: undefined, // Remove the nested account object if not needed
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Error fetching transactions list", error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
