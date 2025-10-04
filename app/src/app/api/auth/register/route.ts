import { Users } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function GET() {
  return NextResponse.json({ message: "User route is working!" });
}

// This route is used when creating a new account
export async function POST(req: Request) {
  try {
    // Parse request body
    const data: Users = await req.json();

    // Encrypt password using bcrypt
    data.password = await bcrypt.hash(data.password, 10);

    // Create account in the database
    const response = await prisma.users.create({
      data,
    });

    // Remove password from response
    response.password = "";

    // Return response
    return NextResponse.json({
      message: "Users created successfully!",
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
