import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authUtils";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!, // make sure it's set
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

    const { investments, userQuestion } = await req.json();

    if (!investments || investments.length === 0) {
      return NextResponse.json(
        { message: "No investment data provided for analysis." },
        { status: 400 }
      );
    }

    const prompt = `
      You are an expert financial advisor. The user has shared their investment portfolio and asked a specific question.  

      Please analyze the portfolio and respond in **Markdown format** with a professional yet engaging tone.  
      Use **headings, bullet points, and emojis** to make the response clear, actionable, and visually appealing.  

      ---

      📊 **User's Portfolio:**  
      ${JSON.stringify(investments, null, 2)}

      ❓ **User's Question:**  
      "${userQuestion}"

      ---

      ### ✨ Response Guidelines  
      Structure your analysis into the following sections:

      1. **📌 Portfolio Overview**  
        - Briefly summarize the portfolio’s composition.  
        - Highlight the total current value.  

      2. **🌐 Diversification Analysis**  
        - Evaluate diversification across **Stocks, Bonds, and Crypto**.  
        - Point out any risks such as over-concentration or underexposure.  

      3. **💡 Actionable Suggestions**  
        - Provide **2–3 practical, numbered tips** for improvement.  
        - Keep them concise, realistic, and easy for the user to implement.  

      ---

      🎯 Make sure your answer is:  
      - **Clear and easy to understand**  
      - **Structured with headings & bullet points**  
      - **Visually engaging using emojis**  
      - **Directly answering the user's question**
      `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // ✅ match working file
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return NextResponse.json({
      success: true,
      analysisText: response.text,
    });
  } catch (error: any) {
    console.error("Error in AI investment analysis:", error);
    return NextResponse.json(
      {
        message: "Failed to generate AI analysis.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
