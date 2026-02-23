// // app/api/status/route.ts
// import { NextResponse } from "next/server";
// import { downloadState } from "../lib/downloader";

// export async function GET() {
//   // return a fresh copy to avoid accidental mutation
//   return NextResponse.json({
//     progress: downloadState.progress,
//     files: downloadState.files,
//   });
// }

// app/api/status/route.ts
import { NextResponse } from "next/server";
import { downloadState } from "../lib/downloader";

export async function GET() {
  return NextResponse.json({
    progress: downloadState.progress,
    files: downloadState.files,
    extractedCount: downloadState.extractedData.length,
  });
}
