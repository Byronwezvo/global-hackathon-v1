import { prisma } from "@/lib/prisma";
import { Account } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { generateToken } from "@/lib/authUtils";

export async function POST(req: Request) {
  try {
    // Parse request body
    const data: Account = await req.json();

    // find account by email
    const account = await prisma.account.findUnique({
      where: { email: data.email },
    });

    // If account not found, return 404
    if (!account) {
      return NextResponse.json(
        { message: "Account not found!" },
        { status: 404 }
      );
    }

    // Check if password is correct
    const isValid = await bcrypt.compare(data.password, account.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid password!" },
        { status: 401 }
      );
    }

    // Create token using jsonwebtoken (JWT) authUtils
    const token = generateToken({ userId: account.id, role: account.role });
    // Return response with token
    return NextResponse.json({
      message: "Login successful!",
      token,
      account: { ...account, password: "" }, // remove password from response
    });
  } catch (error) {
    // Handle errors
    return NextResponse.json(
      { message: "Something went wrong!", error },
      { status: 500 }
    );
  }
}
