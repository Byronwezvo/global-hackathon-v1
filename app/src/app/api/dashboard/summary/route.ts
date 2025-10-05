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
    if (!response.ok) return { currentPrice: 0, previousClose: 0 };
    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    return {
      currentPrice: meta?.regularMarketPrice || 0,
      previousClose: meta?.chartPreviousClose || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch price for ${assetName}:`, error);
    return { currentPrice: 0, previousClose: 0 };
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

    // 2. Calculate Bank Balances and Top Movers
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const accountSummaries = accounts.map((acc) => {
      let balance = 0;
      let recentCredits = 0;
      let recentDebits = 0;

      transactions
        .filter((t) => t.accountId === acc.id)
        .forEach((t) => {
          const balanceAmount =
            acc.type === AccountType.debit
              ? t.type === "credit"
                ? t.amount
                : -t.amount
              : t.type === "debit"
              ? t.amount
              : -t.amount;
          balance += balanceAmount;

          if (new Date(t.createdAt) > twentyFourHoursAgo) {
            if (t.type === "credit") {
              recentCredits += t.amount;
            } else {
              recentDebits += t.amount;
            }
          }
        });

      const netWorthImpact =
        acc.type === AccountType.credit ? -balance : balance;

      return {
        id: acc.id,
        name: acc.name,
        balance,
        type: acc.type,
        recentCredits,
        recentDebits,
        netWorthImpact,
      };
    });

    const totalBankBalance = accountSummaries.reduce(
      (sum, acc) => sum + acc.netWorthImpact,
      0
    );

    let topAccountGainer = null;
    if (accountSummaries.length > 0) {
      const sortedByCredits = [...accountSummaries].sort(
        (a, b) => b.recentCredits - a.recentCredits
      );
      if (sortedByCredits[0].recentCredits > 0) {
        topAccountGainer = {
          name: sortedByCredits[0].name,
          change: sortedByCredits[0].recentCredits,
        };
      }
    }

    let topAccountLoser = null;
    if (accountSummaries.length > 0) {
      const sortedByDebits = [...accountSummaries].sort(
        (a, b) => b.recentDebits - a.recentDebits
      );
      if (sortedByDebits[0].recentDebits > 0) {
        topAccountLoser = {
          name: sortedByDebits[0].name,
          change: sortedByDebits[0].recentDebits,
        };
      }
    }


    // 3. Calculate Investment Value and Top Movers
    const uniqueAssetNames = [...new Set(investments.map((inv) => inv.assetName))];
    const pricePromises = uniqueAssetNames.map((name) => fetchPrice(name));
    const pricesData = await Promise.all(pricePromises);
    const priceMap = uniqueAssetNames.reduce((acc, name, index) => {
      acc[name] = pricesData[index];
      return acc;
    }, {} as { [key: string]: { currentPrice: number; previousClose: number } });

    let totalInvestmentValue = 0;
    const investmentDetails = investments.map((inv) => {
      const priceInfo = priceMap[inv.assetName] || { currentPrice: 0, previousClose: 0 };
      const currentValue = priceInfo.currentPrice * inv.amount;
      totalInvestmentValue += currentValue;
      const changePercent = priceInfo.previousClose > 0
        ? ((priceInfo.currentPrice - priceInfo.previousClose) / priceInfo.previousClose) * 100
        : 0;
      return { ...inv, currentValue, changePercent, currentPrice: priceInfo.currentPrice };
    });

    let topGainer = null;
    let topLoser = null;

    if (investmentDetails.length > 0) {
      const sortedByChange = [...investmentDetails].sort((a, b) => b.changePercent - a.changePercent);
      topGainer = sortedByChange[0].changePercent > 0 ? sortedByChange[0] : null;
      topLoser = sortedByChange[sortedByChange.length - 1].changePercent < 0 ? sortedByChange[sortedByChange.length - 1] : null;
    }

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
      accountBalances: accountSummaries,
      recentTransactions: recentTransactions.map(t => ({...t, accountName: t.account.name})),
      investmentDetails,
      topGainer,
      topLoser,
      topAccountGainer,
      topAccountLoser,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: error.message },
      { status: 500 }
    );
  }
}