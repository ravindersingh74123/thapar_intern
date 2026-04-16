import { startScrape } from "./score-rank-scraper";

startScrape("2016").then(() => console.log("Done!"));



// // debug-2017.ts
// import puppeteer from "puppeteer";

// async function debug() {
//   const browser = await puppeteer.launch({ headless: false }); // headless: false so you can see it
//   const page = await browser.newPage();
  
//   await page.goto("https://www.nirfindia.org/Rankings/2017/OverallRanking.html", { 
//     waitUntil: "networkidle2", timeout: 30000 
//   });

//   const info = await page.evaluate(() => {
//     const table = document.querySelector("table");
//     if (!table) return { error: "No table found" };
    
//     const headers = Array.from(table.querySelectorAll("th")).map(th => th.textContent?.trim());
//     const firstRow = table.querySelector("tbody tr");
//     const cells = firstRow ? Array.from(firstRow.querySelectorAll("td")).map((td, i) => ({
//       index: i,
//       text: td.textContent?.trim().substring(0, 50),
//       classes: td.className,
//     })) : [];
    
//     return { headers, firstRow: cells, tableClass: table.className };
//   });

//   console.log(JSON.stringify(info, null, 2));
  
//   // Keep browser open for 10 seconds so you can inspect
//   await new Promise(r => setTimeout(r, 10000));
//   await browser.close();
// }

// debug().catch(console.error);