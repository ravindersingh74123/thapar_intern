// //app/components/downloader-form.tsx
// "use client";

// import { useEffect, useState } from "react";

// type DownloadItem = {
//   name: string;
//   status: "pending" | "downloading" | "done";
// };

// export default function DownloaderForm() {
//   const [years, setYears] = useState<string[]>([]);
//   const [year, setYear] = useState("");
//   const [url, setUrl] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [downloads, setDownloads] = useState<DownloadItem[]>([]);
//   const [progress, setProgress] = useState(0);

//   /* =========================
//      Fetch available years
//   ========================= */
//   useEffect(() => {
//     async function fetchYears() {
//       const res = await fetch("/api/years");
//       const data = await res.json();

//       setYears(data.years);

//       if (data.years.length > 0) {
//         setYear(data.years[0]);
//       }
//     }

//     fetchYears();
//   }, []);

//   /* =========================
//      Auto-generate URL
//   ========================= */
//   useEffect(() => {
//     if (!year) return;

//     setUrl(`https://www.nirfindia.org/Rankings/${year}/UniversityRanking.html`);
//   }, [year]);

//   /* =========================
//      Poll status
//   ========================= */
//   useEffect(() => {
//     if (!loading) return;

//     const interval = setInterval(async () => {
//       const res = await fetch("/api/status");
//       const data = await res.json();

//       setDownloads(data.files);
//       setProgress(data.progress);

//       if (data.progress === 100) {
//         setLoading(false);
//         clearInterval(interval);
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [loading]);

//   const startDownload = async () => {
//     setLoading(true);
//     setProgress(0);
//     setDownloads([]);

//     await fetch("/api/download", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ url, year }),
//     });
//   };

//   const getStatusColor = (status: DownloadItem["status"]) => {
//     switch (status) {
//       case "done":
//         return "bg-green-100 text-green-700";
//       case "downloading":
//         return "bg-yellow-100 text-yellow-700";
//       default:
//         return "bg-gray-100 text-gray-600";
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
//       {/* Header */}
//       <div className="space-y-1">
//         <h2 className="text-2xl font-semibold text-gray-900">
//           NIRF Downloader
//         </h2>
//         <p className="text-sm text-gray-500">
//           Select year and download ranking files
//         </p>
//       </div>

//       {/* Year Selector */}
//       <div className="space-y-2">
//         <label className="text-sm font-medium text-gray-700">Select Year</label>
//         <select
//           value={year}
//           onChange={(e) => setYear(e.target.value)}
//           className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent transition"
//         >
//           {years.map((y) => (
//             <option key={y} value={y}>
//               {y}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* URL */}
//       <div className="space-y-2">
//         <label className="text-sm font-medium text-gray-700">Website URL</label>
//         <input
//           value={url}
//           readOnly
//           className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-500"
//         />
//       </div>

//       {/* Button */}
//       <button
//         onClick={startDownload}
//         disabled={loading}
//         className="w-full bg-black text-white py-2.5 rounded-xl font-medium hover:bg-gray-800 active:scale-[0.99] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
//       >
//         {loading ? "Downloading..." : "Start Download"}
//       </button>

//       {/* Progress */}
//       <div className="space-y-2">
//         <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
//           <div
//             className="h-full bg-green-500 transition-all duration-500 ease-out"
//             style={{ width: `${progress}%` }}
//           />
//         </div>
//         <p className="text-sm text-gray-600 font-medium">
//           {progress}% completed
//         </p>
//       </div>

//       {/* Files */}
//       {downloads.length > 0 && (
//         <div className="space-y-3">
//           <h3 className="text-sm font-semibold text-gray-800">
//             Download Status
//           </h3>

//           <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
//             {downloads.map((f, i) => (
//               <li
//                 key={i}
//                 className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-2 bg-gray-50"
//               >
//                 <span className="text-sm text-gray-700 truncate">{f.name}</span>

//                 <span
//                   className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(
//                     f.status,
//                   )}`}
//                 >
//                   {f.status}
//                 </span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }















// "use client";

// import { useEffect, useState } from "react";

// type FileStatus = "pending" | "downloading" | "extracting" | "done" | "failed";

// type DownloadItem = {
//   name: string;
//   status: FileStatus;
//   category: string;
// };

// type CategoryProgress = {
//   name: string;
//   slug: string;
//   total: number;
//   done: number;
//   status: "pending" | "active" | "done";
// };

// export default function DownloaderForm() {
//   const [years, setYears] = useState<string[]>([]);
//   const [year, setYear] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [currentCategory, setCurrentCategory] = useState("");
//   const [categories, setCategories] = useState<CategoryProgress[]>([]);
//   const [files, setFiles] = useState<DownloadItem[]>([]);
//   const [extractedCount, setExtractedCount] = useState(0);

//   /* ── fetch years ── */
//   useEffect(() => {
//     fetch("/api/years")
//       .then((r) => r.json())
//       .then((d) => {
//         setYears(d.years ?? []);
//         if (d.years?.length) setYear(d.years[0]);
//       });
//   }, []);

//   /* ── poll status while loading ── */
//   useEffect(() => {
//     if (!loading) return;
//     const id = setInterval(async () => {
//       const res = await fetch("/api/status");
//       const data = await res.json();
//       setProgress(data.progress);
//       setCurrentCategory(data.currentCategory ?? "");
//       setCategories(data.categories ?? []);
//       setFiles(data.files ?? []);
//       setExtractedCount(data.extractedCount ?? 0);
//       if (data.progress === 100) {
//         setLoading(false);
//         clearInterval(id);
//       }
//     }, 1000);
//     return () => clearInterval(id);
//   }, [loading]);

//   const startDownload = async () => {
//     setLoading(true);
//     setProgress(0);
//     setCategories([]);
//     setFiles([]);
//     setExtractedCount(0);
//     setCurrentCategory("");

//     await fetch("/api/download", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ year }),
//     });
//   };

//   const fileStatusColor = (s: FileStatus) => {
//     switch (s) {
//       case "done":       return "bg-green-100 text-green-700";
//       case "extracting": return "bg-blue-100 text-blue-700";
//       case "downloading":return "bg-yellow-100 text-yellow-700";
//       case "failed":     return "bg-red-100 text-red-700";
//       default:           return "bg-gray-100 text-gray-500";
//     }
//   };

//   const catStatusColor = (s: CategoryProgress["status"]) => {
//     switch (s) {
//       case "done":   return "bg-green-500";
//       case "active": return "bg-yellow-400 animate-pulse";
//       default:       return "bg-gray-200";
//     }
//   };

//   return (
//     <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
//       <div>
//         <h2 className="text-2xl font-semibold text-gray-900">NIRF Downloader</h2>
//         <p className="text-sm text-gray-500 mt-1">
//           Select a year — all categories are discovered and downloaded automatically.
//         </p>
//       </div>

//       {/* Year selector */}
//       <div className="space-y-2">
//         <label className="text-sm font-medium text-gray-700">Select Year</label>
//         <select
//           value={year}
//           onChange={(e) => setYear(e.target.value)}
//           disabled={loading}
//           className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/80 transition disabled:bg-gray-50"
//         >
//           {years.map((y) => (
//             <option key={y} value={y}>{y}</option>
//           ))}
//         </select>
//       </div>

//       {/* Start button */}
//       <button
//         onClick={startDownload}
//         disabled={loading || !year}
//         className="w-full bg-black text-white py-2.5 rounded-xl font-medium hover:bg-gray-800 active:scale-[0.99] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
//       >
//         {loading ? "Downloading..." : "Start Download"}
//       </button>

//       {/* Overall progress */}
//       <div className="space-y-1.5">
//         <div className="flex justify-between text-sm text-gray-600">
//           <span>{loading && currentCategory ? `Downloading: ${currentCategory}` : progress === 100 ? "Complete" : "Waiting..."}</span>
//           <span className="font-medium">{progress}%</span>
//         </div>
//         <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
//           <div
//             className="h-full bg-green-500 transition-all duration-500"
//             style={{ width: `${progress}%` }}
//           />
//         </div>
//         {extractedCount > 0 && (
//           <p className="text-xs text-blue-600 font-medium">
//             ✦ {extractedCount} PDFs extracted so far
//           </p>
//         )}
//       </div>

//       {/* Category breakdown */}
//       {categories.length > 0 && (
//         <div className="space-y-2">
//           <h3 className="text-sm font-semibold text-gray-700">Categories</h3>
//           <div className="space-y-2">
//             {categories.map((cat) => (
//               <div key={cat.slug} className="flex items-center gap-3">
//                 <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${catStatusColor(cat.status)}`} />
//                 <span className="text-sm text-gray-700 flex-1">{cat.name}</span>
//                 <span className="text-xs text-gray-400">
//                   {cat.done}/{cat.total}
//                 </span>
//                 {cat.total > 0 && (
//                   <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-green-400 transition-all duration-300"
//                       style={{ width: `${Math.round((cat.done / cat.total) * 100)}%` }}
//                     />
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* File list */}
//       {files.length > 0 && (
//         <div className="space-y-2">
//           <h3 className="text-sm font-semibold text-gray-700">Files</h3>
//           <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
//             {files.map((f, i) => (
//               <li
//                 key={i}
//                 className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-1.5 bg-gray-50"
//               >
//                 <div className="min-w-0">
//                   <span className="text-xs text-gray-400 mr-1">[{f.category}]</span>
//                   <span className="text-sm text-gray-700 truncate">{f.name}</span>
//                 </div>
//                 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${fileStatusColor(f.status)}`}>
//                   {f.status}
//                 </span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {progress === 100 && files.length > 0 && (
//         <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
//           ✅ Done! {categories.length} categories downloaded. {extractedCount} PDFs extracted to{" "}
//           <code className="font-mono text-xs">downloads/{year}/</code>
//         </div>
//       )}
//     </div>
//   );
// }

















"use client";

import { useEffect, useState } from "react";

type FileStatus = "pending" | "downloading" | "extracting" | "done" | "failed";

type DownloadItem = {
  name: string;
  status: FileStatus;
  category: string;
};

type CategoryProgress = {
  name: string;
  slug: string;
  total: number;
  done: number;
  status: "pending" | "active" | "done";
};

export default function DownloaderForm() {
  const [years, setYears] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCategory, setCurrentCategory] = useState("");
  const [categories, setCategories] = useState<CategoryProgress[]>([]);
  const [files, setFiles] = useState<DownloadItem[]>([]);
  const [extractedCount, setExtractedCount] = useState(0);

  /* ── fetch years ── */
  useEffect(() => {
    fetch("/api/years")
      .then((r) => r.json())
      .then((d) => {
        setYears(d.years ?? []);
        if (d.years?.length) setYear(d.years[0]);
      });
  }, []);

  /* ── poll status while loading ── */
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(async () => {
      const res = await fetch("/api/status");
      const data = await res.json();
      setProgress(data.progress);
      setCurrentCategory(data.currentCategory ?? "");
      setCategories(data.categories ?? []);
      setFiles(data.files ?? []);
      setExtractedCount(data.extractedCount ?? 0);
      if (data.progress === 100 && 
          (data.categories.length === 0 || data.categories.every((c: CategoryProgress) => c.status === "done"))) {
        setLoading(false);
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [loading]);

  const startDownload = async () => {
    setLoading(true);
    setProgress(0);
    setCategories([]);
    setFiles([]);
    setExtractedCount(0);
    setCurrentCategory("");

    await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year }),
    });
  };

  const fileStatusColor = (s: FileStatus) => {
    switch (s) {
      case "done":       return "bg-green-100 text-green-700";
      case "extracting": return "bg-blue-100 text-blue-700";
      case "downloading":return "bg-yellow-100 text-yellow-700";
      case "failed":     return "bg-red-100 text-red-700";
      default:           return "bg-gray-100 text-gray-500";
    }
  };

  const catStatusColor = (s: CategoryProgress["status"]) => {
    switch (s) {
      case "done":   return "bg-green-500";
      case "active": return "bg-yellow-400 animate-pulse";
      default:       return "bg-gray-200";
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">NIRF Downloader</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select a year — all categories are discovered and downloaded automatically.
        </p>
      </div>

      {/* Year selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Select Year</label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          disabled={loading}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/80 transition disabled:bg-gray-50"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Start button */}
      <button
        onClick={startDownload}
        disabled={loading || !year}
        className="w-full bg-black text-white py-2.5 rounded-xl font-medium hover:bg-gray-800 active:scale-[0.99] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Downloading..." : "Start Download"}
      </button>

      {/* Overall progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{loading && currentCategory ? `Downloading: ${currentCategory}` : progress === 100 ? "Complete" : "Waiting..."}</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {extractedCount > 0 && (
          <p className="text-xs text-blue-600 font-medium">
            ✦ {extractedCount} PDFs extracted so far
          </p>
        )}
      </div>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Categories</h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.slug} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${catStatusColor(cat.status)}`} />
                <span className="text-sm text-gray-700 flex-1">{cat.name}</span>
                <span className="text-xs text-gray-400">
                  {cat.done}/{cat.total}
                </span>
                {cat.total > 0 && (
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 transition-all duration-300"
                      style={{ width: `${Math.round((cat.done / cat.total) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Files</h3>
          <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {files.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-1.5 bg-gray-50"
              >
                <div className="min-w-0">
                  <span className="text-xs text-gray-400 mr-1">[{f.category}]</span>
                  <span className="text-sm text-gray-700 truncate">{f.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${fileStatusColor(f.status)}`}>
                  {f.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {progress === 100 && files.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          ✅ Done! {categories.length} categories downloaded. {extractedCount} PDFs extracted to{" "}
          <code className="font-mono text-xs">downloads/{year}/</code>
        </div>
      )}
    </div>
  );
}