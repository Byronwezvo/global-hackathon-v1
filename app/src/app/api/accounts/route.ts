import { Account } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function GET() {
  return NextResponse.json({ message: "Accounts route is working!" });
}

// This route is used when creating a new account
export async function POST(req: Request) {
  try {
    // Parse request body
    const data: Account = await req.json();

    // Encrypt password using bcrypt
    data.password = await bcrypt.hash(data.password, 10);

    // Create account in the database
    const response = await prisma.account.create({
      data,
    });

    // Remove password from response
    response.password = "";

    // Return response
    return NextResponse.json({
      message: "Account created successfully!",
      response,
    });
  } catch (error) {
    // Handle errors
    return NextResponse.json(
      { message: "Something went wrong!", error },
      { status: 500 }
    );
  }
}
