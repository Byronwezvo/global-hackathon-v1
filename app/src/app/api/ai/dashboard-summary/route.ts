import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authUtils";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!, // ✅ same style as working file
});

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

    const { summaryData, userQuestion } = await req.json();

    if (!summaryData) {
      return NextResponse.json(
        { message: "No summary data provided for analysis." },
        { status: 400 }
      );
    }

    const prompt = `
      You are a warm, expert financial advisor 🧠💰 who explains money matters in a simple, encouraging way.

      **User's Financial Summary:**
      ${JSON.stringify(summaryData, null, 2)}

      **User's Request:**
      "${userQuestion}"

      ✅ Please provide a clear and easy-to-digest analysis in Markdown with these sections:
      1. **💼 Overall Net Worth:** Summarize the combined bank + investment balances.
      2. **📊 Daily Movers:** Highlight the top gainer and top loser in:
         - Bank accounts (based on recent transactions)
         - Investment portfolio (based on market changes)
      3. **📌 Actionable Advice:** Share 2–3 simple, strategic suggestions for improving financial health.

      Keep sentences short, highlight key amounts in **bold**, and maintain a friendly, non-judgmental tone. 🫶
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return NextResponse.json({
      success: true,
      analysisText: response.text, // ✅ fixed
    });
  } catch (error: any) {
    console.error("Error in AI dashboard summary:", error);
    return NextResponse.json(
      {
        message: "Failed to generate AI analysis.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
