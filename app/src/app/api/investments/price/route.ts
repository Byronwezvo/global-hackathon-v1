import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assetName = searchParams.get("assetName");

  if (!assetName) {
    return NextResponse.json(
      { message: "assetName is required" },
      { status: 400 }
    );
  }

  // Yahoo Finance uses "-USD" for cryptocurrencies
  const ticker = assetName.toUpperCase();
  const isCrypto = [
    "BTC",
    "ETH",
    "BNB",
    "XRP",
    "ADA",
    "SOL",
    "DOGE",
    "DOT",
    "MATIC",
    "AVAX",
    "TRX",
    "LTC",
    "SHIB",
    "UNI",
    "ATOM",
    "XLM",
    "ETC",
    "FIL",
    "ICP",
    "NEAR",
  ].includes(ticker);

  const finalTicker = isCrypto ? `${ticker}-USD` : ticker;
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${finalTicker}`;

  try {
    const response = await fetch(yahooUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from Yahoo Finance: ${response.statusText}`);
    }

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    const currentPrice = meta?.regularMarketPrice;
    const previousClose = meta?.chartPreviousClose;

    if (currentPrice === undefined || previousClose === undefined) {
      return NextResponse.json(
        { message: "Price data not found for the given asset" },
        { status: 404 }
      );
    }

    return NextResponse.json({ currentPrice, previousClose });
  } catch (error: any) {
    console.error(`Error fetching price for ${assetName}:`, error);
    return NextResponse.json(
      { message: `Failed to fetch price data: ${error.message}` },
      { status: 500 }
    );
  }
}
