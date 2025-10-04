import { prisma } from "@/lib/prisma";
import { Users } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { generateToken } from "@/lib/authUtils";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const data: Users = await req.json();

    // find user by email
    const user = await prisma.users.findUnique({
      where: { email: data.email },
    });

    // If user not found, return 404
    if (!user) {
      return NextResponse.json({ message: "User not found!" }, { status: 404 });
    }

    // Check if password is correct
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid password!" },
        { status: 401 }
      );
    }

    // Create token using jsonwebtoken (JWT) authUtils
    const token = generateToken({ userId: user.id, role: user.role });
    // Return response with token
    return NextResponse.json({
      message: "Login successful!",
      token,
      user: { ...user, password: "" }, // remove password from response
    });
  } catch (error) {
    // Handle errors
    return NextResponse.json(
      { message: "Something went wrong!", error },
      { status: 500 }
    );
  }
}
