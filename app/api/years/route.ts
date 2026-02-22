import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto("https://www.nirfindia.org/", {
      waitUntil: "networkidle2",
    });

    // NO hover, NO click — just read DOM
    const years = await page.evaluate(() => {
      const yearsSet = new Set<string>();

      document.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href") || "";

        // match /Rankings/2024/
        const match = href.match(/Rankings\/(\d{4})\//);

        if (match?.[1]) {
          yearsSet.add(match[1]);
        }
      });

      return Array.from(yearsSet);
    });

    years.sort((a, b) => Number(b) - Number(a));

    return NextResponse.json({ years });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch years" },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
