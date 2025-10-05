import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/authUtils";
import { AccountType } from "@prisma/client";

// Helper to fetch price from Yahoo Finance
async function fetchPrice(assetName: string) {
  try {
    const ticker = assetName.toUpperCase();
    const isCrypto = [
      "BTC", "ETH", "BNB", "XRP", "ADA", "SOL", "DOGE", "DOT", "MATIC",
      "AVAX", "TRX", "LTC", "SHIB", "UNI", "ATOM", "XLM", "ETC", "FIL",
      "ICP", "NEAR",
    ].includes(ticker);
    const finalTicker = isCrypto ? `${ticker}-USD` : ticker;
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${finalTicker}`;
    const response = await fetch(yahooUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    if (!response.ok) return 0;
    const data = await response.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
  } catch (error) {
    console.error(`Failed to fetch price for ${assetName}:`, error);
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // 1. Fetch all necessary data in parallel
    const [accounts, transactions, investments] = await Promise.all([
      prisma.accounts.findMany({ where: { userId } }),
      prisma.transaction.findMany({ where: { userId } }),
      prisma.investment.findMany({ where: { userId } }),
    ]);

    // 2. Calculate Bank Balances
    const accountBalances = accounts.map((acc) => {
      const balance = transactions
        .filter((t) => t.accountId === acc.id)
        .reduce((sum, t) => {
          if (acc.type === AccountType.debit) {
            // For a debit account (like checking), credit increases balance, debit decreases
            return sum + (t.type === "credit" ? t.amount : -t.amount);
          } else {
            // For a credit account (like a credit card), debit (spending) increases balance (debt), credit (payment) decreases
            return sum + (t.type === "debit" ? t.amount : -t.amount);
          }
        }, 0);
      return { id: acc.id, name: acc.name, balance, type: acc.type };
    });

    // The total balance should consider the nature of the accounts
    const totalBankBalance = accountBalances.reduce((sum, acc) => {
      // We add balances from debit accounts and subtract balances (debt) from credit accounts
      return sum + (acc.type === AccountType.debit ? acc.balance : -acc.balance);
    }, 0);

    // 3. Calculate Investment Value
    const uniqueAssetNames = [...new Set(investments.map((inv) => inv.assetName))];
    const pricePromises = uniqueAssetNames.map((name) => fetchPrice(name));
    const prices = await Promise.all(pricePromises);
    const priceMap = uniqueAssetNames.reduce((acc, name, index) => {
      acc[name] = prices[index];
      return acc;
    }, {} as { [key: string]: number });

    let totalInvestmentValue = 0;
    const investmentDetails = investments.map((inv) => {
      const currentValue = (priceMap[inv.assetName] || 0) * inv.amount;
      totalInvestmentValue += currentValue;
      return { ...inv, currentValue };
    });

    // 4. Get Recent Transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { account: { select: { name: true } } },
    });

    return NextResponse.json({
      totalBankBalance,
      totalInvestmentValue,
      accountBalances,
      recentTransactions: recentTransactions.map(t => ({...t, accountName: t.account.name})),
      investmentDetails, // For allocation chart
    });
  } catch (error: any) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: error.message },
      { status: 500 }
    );
  }
}
