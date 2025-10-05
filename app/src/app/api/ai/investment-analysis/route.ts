import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authUtils";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!, // make sure this is set in .env.local
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
You are an expert financial advisor 🧠💰. The user has shared their investment portfolio, including both active and closed positions.  

Please provide a clear, friendly, and **concise summary in Markdown format** using **headings, bullet points, and emojis**. Avoid tables. Focus on summaries for active positions, and include brief notes for closed positions.  

---

📊 **User's Portfolio:**  
${JSON.stringify(investments, null, 2)}

❓ **User's Question:**  
"${userQuestion}"

---

### ✨ Response Guidelines

1. **📌 Portfolio Snapshot (Active Positions)**  
   - Provide the **Total Portfolio Value** (sum of all 'currentValue' for active investments).  
   - Give a short summary of **overall performance** today (gain/loss vs previousClose).  
   - Highlight major contributors to performance (top gainers/losers).  

2. **🌐 Diversification Summary**  
   - Summarize allocation across **Stocks, Crypto, and other asset types**.  
   - Note any **over-concentration or underexposure**, in plain language.  

3. **💹 Closed Positions Notes**  
   - List **closed positions briefly**, including:  
     - Closing date  
     - Total gain/loss achieved  
     - Whether reinvestment in a similar asset might make sense  

4. **💡 Actionable Suggestions**  
   - Provide **2–3 practical tips** to improve diversification, reduce risk, and optimize returns.  
   - Include advice about possible **reinvestment strategies** based on closed positions.  

---

✅ Make the answer:  
- Clear, concise, and easy to read  
- Structured with headings, bullet points, and emojis  
- Friendly and encouraging  
- Highlight important numbers in **bold**
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
      { message: "Failed to generate AI analysis.", error: error.message },
      { status: 500 }
    );
  }
}
