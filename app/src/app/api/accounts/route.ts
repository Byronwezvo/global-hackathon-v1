import { Accounts } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/authUtils";

// GET all accounts for the logged-in user
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const accounts = await prisma.accounts.findMany({
      where: { userId: user.userId },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching accounts", error },
      { status: 500 }
    );
  }
}

// POST: create a new account
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const bodyText = await req.text();
    if (!bodyText) {
      return NextResponse.json(
        { message: "Request body is empty" },
        { status: 400 }
      );
    }

    const body = JSON.parse(bodyText);

    const accountData = {
      ...body,
      userId: user.userId,
    };

    const newAccount = await prisma.accounts.create({ data: accountData });

    return NextResponse.json({
      message: "Account created successfully!",
      account: newAccount,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { message: "Error creating account", error },
      { status: 500 }
    );
  }
}
