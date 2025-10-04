import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!, // make sure this is set in .env.local
});

interface TransactionData {
  amount: number;
  type: "credit" | "debit";
  description?: string;
  accountName?: string;
  createdAt: string;
}

export async function POST(req: NextRequest) {
  try {
    const {
      transactions,
      userQuestion,
    }: { transactions: TransactionData[]; userQuestion: string } =
      await req.json();

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { message: "No transactions provided" },
        { status: 400 }
      );
    }

    const formattedTransactions = transactions
      .map(
        (t) =>
          `Date: ${new Date(t.createdAt).toLocaleDateString()}, Account: ${
            t.accountName || "N/A"
          }, Type: ${t.type.toUpperCase()}, Amount: $${t.amount.toFixed(
            2
          )}, Description: ${t.description || "N/A"}`
      )
      .join("\n");

    const prompt = `
      You are an expert financial advisor 🧠💰 with the ability to explain complex financial data in a simple, friendly, and easy-to-understand way — even for someone with no accounting background (like a grandmother).  

      Analyze the following financial transactions carefully:  

      --- TRANSACTION DATA ---  
      ${formattedTransactions}  
      --- END DATA ---  

      Now, based on this data, please address the user’s request:  
      "${userQuestion}"  

      ✅ Your response must:  
      - Use **clear headings** with emojis for each section (e.g., 📊 Net Balance, 💵 Income Summary, 💸 Expense Summary, 📌 Actionable Advice).  
      - Provide **easy-to-digest explanations** in plain language, with short sentences.  
      - Highlight important numbers clearly (e.g., **bold amounts**).  
      - Show **totals, averages, or percentages** where useful.  
      - Compare **credits vs debits** in a way that shows overall financial health.  
      - End with **2–3 practical, granny-friendly tips** to improve financial habits (examples: budgeting, savings, reducing unnecessary expenses, setting goals).  
      - Keep the tone **friendly, encouraging, and non-judgmental**.  

      Make sure your analysis feels like a **personal financial advisor session**, but with the warmth of explaining money matters to family. 🫶

    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return NextResponse.json({
      success: true,
      analysisText: response.text, // ✅ new SDK gives .text
    });
  } catch (error) {
    console.error("Error during financial analysis API call:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
