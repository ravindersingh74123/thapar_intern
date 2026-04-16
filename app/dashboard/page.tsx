// "use client";

// import Link from "next/link";
// import {
//   ArrowUpRight,
//   BarChart3,
//   Building2,
//   Compass,
//   Layers3,
//   Leaf,
//   Search,
//   Sparkles,
//   ShieldCheck,
//   Users,
//   TrendingUp,
//   Activity,
//   Zap,
// } from "lucide-react";

// // ─── Data ────────────────────────────────────────────────────────────────────

// const stats = [
//   {
//     label: "Institutes tracked",
//     value: "1,248",
//     note: "+12.4% this month",
//     icon: Building2,
//     iconBg: "#e0f6f9",
//     iconColor: "#2c9fb0",
//   },
//   {
//     label: "Programs covered",
//     value: "8,936",
//     note: "Across all categories",
//     icon: Layers3,
//     iconBg: "#dce2ec",
//     iconColor: "#24304d",
//   },
//   {
//     label: "Verified freshness",
//     value: "96%",
//     note: "Data quality score",
//     icon: ShieldCheck,
//     iconBg: "#e8f6da",
//     iconColor: "#4a8c1a",
//   },
//   {
//     label: "Monthly visits",
//     value: "42K",
//     note: "+18.2% vs last month",
//     icon: TrendingUp,
//     iconBg: "#e0f6f9",
//     iconColor: "#2c9fb0",
//   },
// ];

// const actions = [
//   {
//     title: "Search institutes",
//     description: "Find by name, code, category, or ranking.",
//     href: "/search",
//     icon: Search,
//     iconBg: "#2c9fb0",
//   },
//   {
//     title: "View rankings",
//     description: "Category-wise insights and trends.",
//     href: "/ranking",
//     icon: BarChart3,
//     iconBg: "#24304d",
//   },
//   {
//     title: "Compare institutes",
//     description: "Side-by-side comparison with clarity.",
//     href: "/search",
//     icon: Layers3,
//     iconBg: "#6bbf3d",
//   },
// ];

// const features = [
//   {
//     title: "Trusted data",
//     text: "Reliable and structured institute information at your fingertips.",
//     icon: ShieldCheck,
//   },
//   {
//     title: "Better discovery",
//     text: "Quickly find the right institute and program category.",
//     icon: Compass,
//   },
//   {
//     title: "Community reach",
//     text: "Highlights institutions, students, and academic visibility.",
//     icon: Users,
//   },
//   {
//     title: "Purpose-driven",
//     text: "Polished interface inspired by the BanavatNest brand colors.",
//     icon: Sparkles,
//   },
// ];

// const activity = [
//   {
//     title: "NIRF data synced",
//     detail: "Latest ranking records updated successfully.",
//     time: "Today · 9:12 AM",
//     iconBg: "#e0f6f9",
//     iconColor: "#2c9fb0",
//     icon: Activity,
//   },
//   {
//     title: "High search activity",
//     detail: "Users are exploring IITs, IISc, and top universities.",
//     time: "Today · 8:40 AM",
//     iconBg: "#dce2ec",
//     iconColor: "#24304d",
//     icon: Search,
//   },
//   {
//     title: "Comparison flow used",
//     detail: "Multiple institute comparisons are increasing.",
//     time: "Yesterday · 6:18 PM",
//     iconBg: "#e8f6da",
//     iconColor: "#4a8c1a",
//     icon: Layers3,
//   },
// ];

// // ─── Nest logo mark ───────────────────────────────────────────────────────────

// function NestMark() {
//   return (
//     <svg width="30" height="22" viewBox="0 0 60 44" fill="none">
//       <path
//         d="M2 38 C12 24 26 20 42 25 C50 28 56 34 54 40"
//         stroke="#c8d4e8"
//         strokeWidth="3.5"
//         strokeLinecap="round"
//       />
//       <path
//         d="M4 42 C14 28 28 24 44 29 C52 32 58 38 56 43"
//         stroke="#c8d4e8"
//         strokeWidth="2.8"
//         strokeLinecap="round"
//       />
//       <path
//         d="M5 32 C15 18 30 15 46 20 C54 23 58 30 55 36"
//         stroke="#2c9fb0"
//         strokeWidth="3.2"
//         strokeLinecap="round"
//       />
//       <ellipse cx="17" cy="15" rx="6" ry="3.2" fill="#6bbf3d" transform="rotate(-32 17 15)" />
//       <ellipse cx="38" cy="12" rx="6" ry="3.2" fill="#6bbf3d" transform="rotate(28 38 12)" />
//       <ellipse cx="50" cy="24" rx="5" ry="2.8" fill="#6bbf3d" transform="rotate(15 50 24)" />
//     </svg>
//   );
// }

// // ─── Card wrapper ─────────────────────────────────────────────────────────────

// function Card({
//   children,
//   className = "",
//   style = {},
// }: {
//   children: React.ReactNode;
//   className?: string;
//   style?: React.CSSProperties;
// }) {
//   return (
//     <div
//       className={className}
//       style={{
//         background: "#ffffff",
//         border: "1px solid #d6eaee",
//         borderRadius: "20px",
//         boxShadow: "0 1px 6px rgba(15,35,50,0.06)",
//         ...style,
//       }}
//     >
//       {children}
//     </div>
//   );
// }

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default function DashboardPage() {
//   return (
//     <div style={{ minHeight: "100vh", width: "100%", background: "#f0f7f8" }}>
//       {/* Top glow */}
//       <div
//         style={{
//           position: "fixed",
//           inset: 0,
//           pointerEvents: "none",
//           zIndex: 0,
//           background:
//             "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(44,159,176,0.11) 0%, transparent 100%)",
//         }}
//       />

//       <div
//         style={{
//           position: "relative",
//           zIndex: 10,
//           maxWidth: "1440px",
//           margin: "0 auto",
//           padding: "20px 24px",
//         }}
//       >
//         {/* ══ TOP BAR ══════════════════════════════════════════════════════ */}
//         <Card
//           style={{
//             borderRadius: "18px",
//             marginBottom: "20px",
//             padding: "16px 20px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             gap: "16px",
//           }}
//         >
//           {/* Brand */}
//           <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
//             <div
//               style={{
//                 width: "48px",
//                 height: "48px",
//                 borderRadius: "14px",
//                 background: "#24304d",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 flexShrink: 0,
//               }}
//             >
//               <NestMark />
//             </div>
//             <div>
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "6px",
//                   fontSize: "10px",
//                   fontWeight: 600,
//                   letterSpacing: "0.2em",
//                   textTransform: "uppercase",
//                   color: "#2c9fb0",
//                   marginBottom: "2px",
//                 }}
//               >
//                 <Leaf style={{ width: "12px", height: "12px", color: "#6bbf3d" }} />
//                 BanavatNest
//               </div>
//               <div
//                 style={{
//                   fontSize: "22px",
//                   fontWeight: 700,
//                   color: "#24304d",
//                   lineHeight: 1.1,
//                 }}
//               >
//                 Dashboard
//               </div>
//               <div style={{ fontSize: "11px", color: "#94adb5", marginTop: "2px" }}>
//                 Build with Purpose. Nurture to Impact.
//               </div>
//             </div>
//           </div>

//           {/* Nav */}
//           <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//             <div
//               style={{
//                 padding: "8px 16px",
//                 borderRadius: "999px",
//                 background: "#f0f7f8",
//                 border: "1px solid #d6eaee",
//                 fontSize: "12px",
//                 fontWeight: 500,
//                 color: "#5a8090",
//               }}
//             >
//               NIRF Institute Explorer
//             </div>
//             <Link
//               href="/search"
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "8px",
//                 padding: "9px 20px",
//                 borderRadius: "999px",
//                 background: "#24304d",
//                 color: "#ffffff",
//                 fontSize: "13px",
//                 fontWeight: 600,
//                 textDecoration: "none",
//               }}
//             >
//               <Search style={{ width: "15px", height: "15px" }} />
//               Search
//             </Link>
//           </div>
//         </Card>

//         {/* ══ HERO GRID ════════════════════════════════════════════════════ */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 400px",
//             gap: "20px",
//             marginBottom: "20px",
//           }}
//           className="hero-grid"
//         >
//           {/* Hero main */}
//           <Card style={{ padding: "48px", position: "relative", overflow: "hidden" }}>
//             {/* Decorative rings */}
//             <div
//               style={{
//                 position: "absolute",
//                 right: "-60px",
//                 top: "-60px",
//                 width: "240px",
//                 height: "240px",
//                 borderRadius: "50%",
//                 border: "1px solid rgba(44,159,176,0.12)",
//                 pointerEvents: "none",
//               }}
//             />
//             <div
//               style={{
//                 position: "absolute",
//                 right: "-30px",
//                 top: "-30px",
//                 width: "160px",
//                 height: "160px",
//                 borderRadius: "50%",
//                 border: "1px solid rgba(107,191,61,0.12)",
//                 pointerEvents: "none",
//               }}
//             />

//             {/* Badge */}
//             <div
//               style={{
//                 display: "inline-flex",
//                 alignItems: "center",
//                 gap: "6px",
//                 padding: "6px 16px",
//                 borderRadius: "999px",
//                 background: "rgba(44,159,176,0.08)",
//                 border: "1px solid rgba(44,159,176,0.20)",
//                 fontSize: "10px",
//                 fontWeight: 700,
//                 letterSpacing: "0.18em",
//                 textTransform: "uppercase",
//                 color: "#2c9fb0",
//                 marginBottom: "20px",
//               }}
//             >
//               <Sparkles style={{ width: "13px", height: "13px" }} />
//               Platform Snapshot
//             </div>

//             <h2
//               style={{
//                 fontSize: "clamp(32px, 4vw, 50px)",
//                 fontWeight: 800,
//                 color: "#24304d",
//                 lineHeight: 1.12,
//                 letterSpacing: "-0.02em",
//                 maxWidth: "480px",
//                 marginBottom: "16px",
//               }}
//             >
//               Institute discovery,{" "}
//               <span style={{ color: "#2c9fb0" }}>made simple.</span>
//             </h2>

//             <p
//               style={{
//                 fontSize: "15px",
//                 lineHeight: "1.75",
//                 color: "#6a8a98",
//                 maxWidth: "420px",
//                 marginBottom: "32px",
//               }}
//             >
//               Designed around the BanavatNest palette — deep navy, teal, and
//               fresh green — with better spacing, clearer hierarchy, and a calmer
//               premium feel.
//             </p>

//             <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
//               <Link
//                 href="/search"
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "8px",
//                   padding: "12px 24px",
//                   borderRadius: "999px",
//                   background: "#2c9fb0",
//                   color: "#ffffff",
//                   fontSize: "14px",
//                   fontWeight: 700,
//                   textDecoration: "none",
//                   boxShadow: "0 4px 18px rgba(44,159,176,0.28)",
//                 }}
//               >
//                 <Search style={{ width: "15px", height: "15px" }} />
//                 Search Institutes
//               </Link>
//               <Link
//                 href="/ranking"
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "8px",
//                   padding: "12px 24px",
//                   borderRadius: "999px",
//                   background: "#ffffff",
//                   border: "1px solid #cdd8e0",
//                   color: "#24304d",
//                   fontSize: "14px",
//                   fontWeight: 700,
//                   textDecoration: "none",
//                 }}
//               >
//                 <BarChart3 style={{ width: "15px", height: "15px" }} />
//                 View Rankings
//               </Link>
//             </div>
//           </Card>

//           {/* Right column */}
//           <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

//             {/* Navy tagline */}
//             <div
//               style={{
//                 borderRadius: "20px",
//                 background: "#24304d",
//                 padding: "28px",
//                 position: "relative",
//                 overflow: "hidden",
//               }}
//             >
//               <div
//                 style={{
//                   position: "absolute",
//                   right: "-30px",
//                   top: "-30px",
//                   width: "120px",
//                   height: "120px",
//                   borderRadius: "50%",
//                   background: "rgba(44,159,176,0.10)",
//                   pointerEvents: "none",
//                 }}
//               />
//               <div
//                 style={{
//                   position: "absolute",
//                   left: "-20px",
//                   bottom: "-20px",
//                   width: "90px",
//                   height: "90px",
//                   borderRadius: "50%",
//                   background: "rgba(107,191,61,0.10)",
//                   pointerEvents: "none",
//                 }}
//               />
//               <div style={{ position: "relative" }}>
//                 <p
//                   style={{
//                     fontSize: "10px",
//                     fontWeight: 600,
//                     letterSpacing: "0.22em",
//                     textTransform: "uppercase",
//                     color: "rgba(255,255,255,0.40)",
//                     marginBottom: "12px",
//                   }}
//                 >
//                   Tagline
//                 </p>
//                 <p
//                   style={{
//                     fontSize: "22px",
//                     fontWeight: 700,
//                     color: "#ffffff",
//                     lineHeight: 1.3,
//                     marginBottom: "12px",
//                   }}
//                 >
//                   Build with Purpose.
//                   <br />
//                   <span style={{ color: "#2c9fb0" }}>Nurture</span> to Impact.
//                 </p>
//                 <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.50)", marginBottom: "16px" }}>
//                   A polished interface inspired by your logo, with premium
//                   composition and a calmer visual rhythm.
//                 </p>
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "8px",
//                     fontSize: "13px",
//                     color: "rgba(255,255,255,0.60)",
//                   }}
//                 >
//                   <span
//                     style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6bbf3d", display: "inline-block" }}
//                   />
//                   Fresh, trustworthy, and modern
//                 </div>
//               </div>
//             </div>

//             {/* Quick actions */}
//             <Card style={{ padding: "20px", flex: 1 }}>
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                   marginBottom: "16px",
//                 }}
//               >
//                 <span style={{ fontSize: "15px", fontWeight: 700, color: "#24304d" }}>
//                   Quick Actions
//                 </span>
//                 <div
//                   style={{
//                     width: "32px",
//                     height: "32px",
//                     borderRadius: "50%",
//                     background: "rgba(44,159,176,0.10)",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   <Zap style={{ width: "14px", height: "14px", color: "#2c9fb0" }} />
//                 </div>
//               </div>

//               <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
//                 {actions.map((a) => {
//                   const Icon = a.icon;
//                   return (
//                     <Link
//                       key={a.title}
//                       href={a.href}
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: "12px",
//                         padding: "12px 14px",
//                         borderRadius: "14px",
//                         background: "#f8fcfd",
//                         border: "1px solid #e4f0f3",
//                         textDecoration: "none",
//                       }}
//                     >
//                       <div
//                         style={{
//                           width: "36px",
//                           height: "36px",
//                           borderRadius: "10px",
//                           background: a.iconBg,
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           flexShrink: 0,
//                         }}
//                       >
//                         <Icon style={{ width: "16px", height: "16px", color: "#ffffff" }} />
//                       </div>
//                       <div style={{ flex: 1, minWidth: 0 }}>
//                         <div style={{ fontSize: "13px", fontWeight: 700, color: "#24304d" }}>
//                           {a.title}
//                         </div>
//                         <div style={{ fontSize: "12px", color: "#94adb5", marginTop: "2px" }}>
//                           {a.description}
//                         </div>
//                       </div>
//                       <ArrowUpRight style={{ width: "15px", height: "15px", color: "#c8d8de", flexShrink: 0 }} />
//                     </Link>
//                   );
//                 })}
//               </div>
//             </Card>
//           </div>
//         </div>

//         {/* ══ STATS ════════════════════════════════════════════════════════ */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(4, 1fr)",
//             gap: "16px",
//             marginBottom: "20px",
//           }}
//           className="stats-grid"
//         >
//           {stats.map((s) => {
//             const Icon = s.icon;
//             return (
//               <Card key={s.label} style={{ padding: "20px 22px" }}>
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "space-between",
//                     marginBottom: "12px",
//                   }}
//                 >
//                   <span style={{ fontSize: "12px", fontWeight: 500, color: "#94adb5" }}>
//                     {s.label}
//                   </span>
//                   <div
//                     style={{
//                       width: "32px",
//                       height: "32px",
//                       borderRadius: "50%",
//                       background: s.iconBg,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                     }}
//                   >
//                     <Icon style={{ width: "14px", height: "14px", color: s.iconColor }} />
//                   </div>
//                 </div>
//                 <div
//                   style={{
//                     fontSize: "32px",
//                     fontWeight: 800,
//                     color: "#24304d",
//                     letterSpacing: "-0.02em",
//                     lineHeight: 1,
//                   }}
//                 >
//                   {s.value}
//                 </div>
//                 <div style={{ fontSize: "12px", fontWeight: 600, color: "#2c9fb0", marginTop: "8px" }}>
//                   {s.note}
//                 </div>
//               </Card>
//             );
//           })}
//         </div>

//         {/* ══ LOWER GRID ═══════════════════════════════════════════════════ */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "1fr 380px",
//             gap: "20px",
//           }}
//           className="lower-grid"
//         >
//           {/* Features */}
//           <Card style={{ padding: "24px" }}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "flex-start",
//                 justifyContent: "space-between",
//                 gap: "16px",
//                 marginBottom: "20px",
//               }}
//             >
//               <div>
//                 <div style={{ fontSize: "15px", fontWeight: 700, color: "#24304d", marginBottom: "4px" }}>
//                   What users can do here
//                 </div>
//                 <div style={{ fontSize: "12px", color: "#94adb5" }}>
//                   Simple entry points that keep the dashboard focused.
//                 </div>
//               </div>
//               <div
//                 style={{
//                   width: "36px",
//                   height: "36px",
//                   borderRadius: "50%",
//                   background: "rgba(107,191,61,0.12)",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   flexShrink: 0,
//                 }}
//               >
//                 <Sparkles style={{ width: "16px", height: "16px", color: "#6bbf3d" }} />
//               </div>
//             </div>

//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
//               {features.map((f) => {
//                 const Icon = f.icon;
//                 return (
//                   <div
//                     key={f.title}
//                     style={{
//                       padding: "20px",
//                       borderRadius: "16px",
//                       background: "#f8fcfd",
//                       border: "1px solid #e4f0f3",
//                     }}
//                   >
//                     <div
//                       style={{
//                         width: "40px",
//                         height: "40px",
//                         borderRadius: "12px",
//                         background: "rgba(44,159,176,0.10)",
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         marginBottom: "14px",
//                       }}
//                     >
//                       <Icon style={{ width: "18px", height: "18px", color: "#2c9fb0" }} />
//                     </div>
//                     <div style={{ fontSize: "13px", fontWeight: 700, color: "#24304d", marginBottom: "6px" }}>
//                       {f.title}
//                     </div>
//                     <div style={{ fontSize: "12px", lineHeight: 1.6, color: "#7a9aaa" }}>
//                       {f.text}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </Card>

//           {/* Activity */}
//           <Card style={{ padding: "24px" }}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 marginBottom: "20px",
//               }}
//             >
//               <span style={{ fontSize: "15px", fontWeight: 700, color: "#24304d" }}>
//                 Recent activity
//               </span>
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "6px",
//                   padding: "4px 12px",
//                   borderRadius: "999px",
//                   background: "rgba(107,191,61,0.10)",
//                 }}
//               >
//                 <span
//                   style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6bbf3d", display: "inline-block" }}
//                 />
//                 <span
//                   style={{
//                     fontSize: "10px",
//                     fontWeight: 700,
//                     letterSpacing: "0.16em",
//                     textTransform: "uppercase",
//                     color: "#4a8c1a",
//                   }}
//                 >
//                   Live
//                 </span>
//               </div>
//             </div>

//             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
//               {activity.map((item) => {
//                 const Icon = item.icon;
//                 return (
//                   <div
//                     key={item.title}
//                     style={{
//                       padding: "14px 16px",
//                       borderRadius: "14px",
//                       background: "#f8fcfd",
//                       border: "1px solid #e4f0f3",
//                     }}
//                   >
//                     <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
//                       <div
//                         style={{
//                           width: "34px",
//                           height: "34px",
//                           borderRadius: "50%",
//                           background: item.iconBg,
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           flexShrink: 0,
//                           marginTop: "2px",
//                         }}
//                       >
//                         <Icon style={{ width: "14px", height: "14px", color: item.iconColor }} />
//                       </div>
//                       <div style={{ minWidth: 0 }}>
//                         <div style={{ fontSize: "13px", fontWeight: 700, color: "#24304d" }}>
//                           {item.title}
//                         </div>
//                         <div style={{ fontSize: "12px", lineHeight: 1.5, color: "#7a9aaa", marginTop: "3px" }}>
//                           {item.detail}
//                         </div>
//                         <div
//                           style={{
//                             fontSize: "10px",
//                             fontWeight: 700,
//                             letterSpacing: "0.12em",
//                             textTransform: "uppercase",
//                             color: "#b8cdd4",
//                             marginTop: "6px",
//                           }}
//                         >
//                           {item.time}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>

//             <Link
//               href="#"
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 gap: "6px",
//                 marginTop: "14px",
//                 padding: "12px",
//                 borderRadius: "14px",
//                 background: "#f0f7f8",
//                 border: "1px solid #d6eaee",
//                 fontSize: "12px",
//                 fontWeight: 700,
//                 color: "#2c9fb0",
//                 textDecoration: "none",
//               }}
//             >
//               View all activity
//               <ArrowUpRight style={{ width: "14px", height: "14px" }} />
//             </Link>
//           </Card>
//         </div>

//         {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
//         <div
//           style={{
//             marginTop: "24px",
//             paddingBottom: "8px",
//             textAlign: "center",
//             fontSize: "10px",
//             fontWeight: 700,
//             letterSpacing: "0.22em",
//             textTransform: "uppercase",
//             color: "#b8cdd4",
//           }}
//         >
//           BanavatNest · Build with Purpose. Nurture to Impact.
//         </div>
//       </div>

//       {/* ── Responsive overrides ────────────────────────────────────────── */}
//       <style>{`
//         @media (max-width: 1100px) {
//           .hero-grid { grid-template-columns: 1fr !important; }
//           .lower-grid { grid-template-columns: 1fr !important; }
//         }
//         @media (max-width: 640px) {
//           .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
//         }
//       `}</style>
//     </div>
//   );
// }

// "use client";

// import Link from "next/link";
// import { ArrowUpRight, BarChart3, Leaf, Search, Sparkles } from "lucide-react";

// export default function DashboardPage() {
//   return (
//     <div className="page-root">
//       <header className="topbar">
//         <div className="topbar-left">
//           <div className="logo-box" aria-hidden="true">
//             <Leaf size={18} />
//           </div>

//           <div className="brand-block">
//             <div className="brand-kicker">BANAVATNEST</div>
//             <div className="brand-title">Dashboard</div>
//             <div className="brand-subtitle">Build with Purpose. Nurture to Impact.</div>
//           </div>
//         </div>

//         <div className="topbar-right">
//           <div className="topbar-pill">NIRF Institute Explorer</div>

//           <Link href="/ranking" className="topbar-link">
//             <BarChart3 size={16} />
//             Rankings
//           </Link>

//           <Link href="/search" className="topbar-button">
//             <Search size={16} />
//             Search
//           </Link>
//         </div>
//       </header>

//       <main className="container">
//         <section className="hero">
//           <div className="badge">
//             <Sparkles size={14} />
//             Platform Overview
//           </div>

//           <h1 className="hero-title">
//             Discover institutes <span>smarter.</span>
//           </h1>

//           <p className="hero-desc">
//             Explore rankings, compare institutions, and find the right academic fit through a
//             clean, focused interface designed for clarity, speed, and trust.
//           </p>

//           <div className="cta-row">
//             <Link href="/search" className="primary-btn">
//               <Search size={16} />
//               Search Institutes
//               <ArrowUpRight size={16} />
//             </Link>

//             <Link href="/ranking" className="secondary-btn">
//               <BarChart3 size={16} />
//               View Rankings
//             </Link>
//           </div>
//         </section>
//       </main>

//       <style>{`
//         * {
//           box-sizing: border-box;
//         }

//         .page-root {
//           min-height: 100vh;
//           width: 100%;
//           background:
//             linear-gradient(180deg, #f6fafb 0%, #f9fcfd 100%);
//           color: #24304d;
//         }

//         .topbar {
//           height: 78px;
//           width: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           padding: 0 40px;
//           background: #ffffff;
//           border-bottom: 1px solid #dce9ee;
//         }

//         .topbar-left {
//           display: flex;
//           align-items: center;
//           gap: 14px;
//           min-width: 0;
//         }

//         .logo-box {
//           width: 42px;
//           height: 42px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: #24304d;
//           color: #6bbf3d;
//           flex-shrink: 0;
//         }

//         .brand-block {
//           min-width: 0;
//         }

//         .brand-kicker {
//           font-size: 10px;
//           font-weight: 800;
//           letter-spacing: 0.22em;
//           color: #2c9fb0;
//           text-transform: uppercase;
//           margin-bottom: 2px;
//         }

//         .brand-title {
//           font-size: 20px;
//           font-weight: 900;
//           line-height: 1.1;
//           color: #24304d;
//         }

//         .brand-subtitle {
//           font-size: 11px;
//           color: #8ea3ad;
//           margin-top: 2px;
//         }

//         .topbar-right {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           flex-wrap: wrap;
//           justify-content: flex-end;
//         }

//         .topbar-pill {
//           padding: 10px 14px;
//           border: 1px solid #d8e7ec;
//           background: #f6fbfc;
//           color: #587988;
//           font-size: 12px;
//           font-weight: 600;
//         }

//         .topbar-link,
//         .topbar-button,
//         .primary-btn,
//         .secondary-btn {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           text-decoration: none;
//           font-weight: 700;
//           transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease,
//             color 0.2s ease;
//         }

//         .topbar-link {
//           padding: 10px 14px;
//           border: 1px solid #d8e7ec;
//           background: #ffffff;
//           color: #24304d;
//           font-size: 12px;
//         }

//         .topbar-link:hover {
//           background: #f6fbfc;
//           transform: translateY(-1px);
//         }

//         .topbar-button {
//           padding: 10px 16px;
//           background: #2c9fb0;
//           color: #ffffff;
//           font-size: 12px;
//           border: 1px solid #2c9fb0;
//         }

//         .topbar-button:hover {
//           background: #248a99;
//           border-color: #248a99;
//           transform: translateY(-1px);
//         }

//         .container {
//           max-width: 1120px;
//           margin: 0 auto;
//           padding: 96px 20px 48px;
//         }

//         .hero {
//           max-width: 740px;
//           animation: fadeUp 0.65s ease both;
//         }

//         .badge {
//           display: inline-flex;
//           align-items: center;
//           gap: 6px;
//           padding: 7px 14px;
//           border: 1px solid rgba(44, 159, 176, 0.18);
//           background: rgba(44, 159, 176, 0.07);
//           color: #2c9fb0;
//           font-size: 10px;
//           font-weight: 800;
//           letter-spacing: 0.2em;
//           text-transform: uppercase;
//           margin-bottom: 20px;
//         }

//         .hero-title {
//           margin: 0 0 16px;
//           font-size: clamp(44px, 6vw, 72px);
//           line-height: 1.02;
//           letter-spacing: -0.04em;
//           font-weight: 900;
//           color: #24304d;
//         }

//         .hero-title span {
//           color: #2c9fb0;
//         }

//         .hero-desc {
//           margin: 0;
//           max-width: 620px;
//           font-size: 15px;
//           line-height: 1.85;
//           color: #6f8b95;
//         }

//         .cta-row {
//           display: flex;
//           gap: 12px;
//           flex-wrap: wrap;
//           margin-top: 30px;
//         }

//         .primary-btn,
//         .secondary-btn {
//           padding: 12px 18px;
//           font-size: 14px;
//           border: 1px solid transparent;
//           border-radius: 0;
//         }

//         .primary-btn {
//           background: #2c9fb0;
//           color: #ffffff;
//           box-shadow: 0 8px 20px rgba(44, 159, 176, 0.14);
//         }

//         .primary-btn:hover {
//           background: #248a99;
//           transform: translateY(-1px);
//         }

//         .secondary-btn {
//           background: #ffffff;
//           color: #24304d;
//           border-color: #d8e7ec;
//         }

//         .secondary-btn:hover {
//           background: #f6fbfc;
//           transform: translateY(-1px);
//         }

//         @keyframes fadeUp {
//           from {
//             opacity: 0;
//             transform: translateY(14px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @media (max-width: 768px) {
//           .topbar {
//             height: auto;
//             padding: 16px;
//             align-items: flex-start;
//             gap: 14px;
//             flex-direction: column;
//           }

//           .topbar-right {
//             width: 100%;
//             justify-content: flex-start;
//           }

//           .container {
//             padding: 56px 16px 32px;
//           }

//           .hero-title {
//             font-size: clamp(38px, 12vw, 52px);
//           }

//           .cta-row {
//             flex-direction: column;
//             align-items: stretch;
//           }

//           .primary-btn,
//           .secondary-btn {
//             width: 100%;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }

































// "use client";

// import Link from "next/link";
// import {
//   ArrowUpRight,
//   BarChart3,
//   Search,
//   Sparkles,
//   ShieldCheck,
//   TrendingUp,
//   Users,
// } from "lucide-react";

// const stats = [
//   { label: "Institutes indexed", value: "6,000+", icon: BarChart3 },
//   { label: "Ranking parameters", value: "10", icon: TrendingUp },
//   { label: "Trusted sources", value: "NIRF", icon: ShieldCheck },
// ];

// const highlights = [
//   "Compare institutes with clear ranking data",
//   "Search by name, category, or region",
//   "Built for fast discovery and clean navigation",
//   "Explore rankings with a simple clean interface",
// ];

// export default function DashboardPage() {
//   return (
//     <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-[#f8fcfd] via-white to-[#f4fafb] text-[#24304d] relative">

//       {/* ✨ animated glow */}
//       <div className="glow" />

//       {/* HEADER */}
//       <header className="sticky top-0 z-50 w-full border-b border-[#e6eef2] bg-white/60 backdrop-blur-xl">
//         <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-2 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          
//           <div className="flex items-center gap-4">
//             <img src="/logo.png" className="h-14 w-32 object-contain" />

//             <div className="text-[12px] text-[#7d9198]">
//               Build with Purpose. Nurture to Impact.
//             </div>
//           </div>

//           <nav className="flex flex-wrap items-center gap-2">
//             <div className="hidden rounded-lg border border-[#e2eff3] bg-[#f3fafb] px-3 py-2 text-xs font-semibold text-[#5b7f8a] sm:flex">
//               NIRF Explorer
//             </div>

//             <Link
//               href="/ranking"
//               className="nav-btn"
//             >
//               <BarChart3 size={16} />
//               Rankings
//             </Link>

//             <Link
//               href="/search"
//               className="nav-btn-primary group"
//             >
//               <Search size={16} />
//               Search
//               <ArrowUpRight className="icon" size={14} />
//             </Link>
//           </nav>
//         </div>
//       </header>

//       {/* MAIN */}
//       <main className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10">
//         <section className="mx-auto max-w-5xl">

//           {/* BADGE */}
//           <div className="badge">
//             <Sparkles size={14} />
//             PLATFORM OVERVIEW
//           </div>

//           {/* TITLE */}
//           <h1 className="title">
//             Discover institutes{" "}
//             <span className="gradient-text">smarter.</span>
//           </h1>

//           {/* DESC */}
//           <p className="desc">
//             Explore rankings, compare institutions, and find the right academic
//             fit through a clean, fast, and trusted interface.
//           </p>

//           {/* BUTTONS */}
//           <div className="mt-8 flex flex-wrap gap-4">
//             <Link href="/search" className="btn-primary group">
//               <Search size={16} />
//               Search Institutes
//               <ArrowUpRight className="icon" size={16} />
//             </Link>

//             <Link href="/ranking" className="btn-secondary">
//               <BarChart3 size={16} />
//               View Rankings
//             </Link>
//           </div>

//           {/* STATS */}
//           <div className="mt-12 grid gap-5 sm:grid-cols-3">
//             {stats.map((item) => {
//               const Icon = item.icon;
//               return (
//                 <div key={item.label} className="card">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <div className="text-xs text-[#7d9198]">
//                         {item.label}
//                       </div>
//                       <div className="mt-2 text-2xl font-black">
//                         {item.value}
//                       </div>
//                     </div>

//                     <div className="icon-box">
//                       <Icon size={18} />
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* RUNNING TEXT */}
//           <div className="marquee-container">
//             <div className="marquee fade-mask">
//               {[...highlights, ...highlights].map((item, i) => (
//                 <div key={i} className="marquee-item">
//                   {item}
//                   <span className="dot" />
//                 </div>
//               ))}
//             </div>
//           </div>

//         </section>
//       </main>

//       {/* STYLES */}
//       <style jsx>{`
//         /* 🌟 glow animation */
//         .glow {
//           position: absolute;
//           top: -200px;
//           left: 50%;
//           transform: translateX(-50%);
//           width: 800px;
//           height: 400px;
//           background: radial-gradient(circle, rgba(44,159,176,0.2), transparent);
//           filter: blur(80px);
//           animation: float 6s ease-in-out infinite alternate;
//         }

//         @keyframes float {
//           0% { transform: translateX(-50%) translateY(0); }
//           100% { transform: translateX(-50%) translateY(40px); }
//         }

//         .title {
//           margin-top: 20px;
//           font-size: clamp(44px, 7vw, 80px);
//           font-weight: 900;
//           line-height: 0.95;
//           letter-spacing: -0.04em;
//         }

//         .gradient-text {
//           background: linear-gradient(90deg, #2c9fb0, #38bdf8, #6bbf3d);
//           -webkit-background-clip: text;
//           color: transparent;
//           animation: shimmer 4s linear infinite;
//           background-size: 200% auto;
//         }

//         @keyframes shimmer {
//           0% { background-position: 0% }
//           100% { background-position: 200% }
//         }

//         .desc {
//           margin-top: 20px;
//           max-width: 600px;
//           color: #6f8b95;
//           line-height: 1.8;
//         }

//         .badge {
//           display: inline-flex;
//           gap: 6px;
//           padding: 8px 14px;
//           background: #eaf7f9;
//           border-radius: 999px;
//           font-size: 11px;
//           font-weight: 700;
//           color: #2c9fb0;
//         }

//         .btn-primary {
//           display: flex;
//           gap: 8px;
//           padding: 12px 20px;
//           border-radius: 10px;
//           background: linear-gradient(90deg, #2c9fb0, #248a99);
//           color: white;
//           font-weight: 700;
//           transition: 0.3s;
//           box-shadow: 0 10px 25px rgba(44,159,176,0.2);
//         }

//         .btn-primary:hover {
//           transform: translateY(-2px) scale(1.02);
//         }

//         .btn-secondary {
//           display: flex;
//           gap: 8px;
//           padding: 12px 20px;
//           border-radius: 10px;
//           border: 1px solid #e2eff3;
//           transition: 0.3s;
//         }

//         .btn-secondary:hover {
//           transform: translateY(-2px);
//         }

//         .nav-btn {
//           display: flex;
//           gap: 6px;
//           padding: 8px 12px;
//           border-radius: 8px;
//           border: 1px solid #e2eff3;
//         }

//         .nav-btn-primary {
//           display: flex;
//           gap: 6px;
//           padding: 8px 12px;
//           border-radius: 8px;
//           background: linear-gradient(90deg, #2c9fb0, #248a99);
//           color: white;
//         }

//         .icon {
//           transition: 0.3s;
//         }

//         .group:hover .icon {
//           transform: translate(3px, -3px);
//         }

//         .card {
//           padding: 18px;
//           border-radius: 14px;
//           background: rgba(255,255,255,0.7);
//           backdrop-filter: blur(10px);
//           border: 1px solid #e6eef2;
//           transition: 0.3s;
//         }

//         .card:hover {
//           transform: translateY(-4px);
//           box-shadow: 0 10px 30px rgba(0,0,0,0.05);
//         }

//         .icon-box {
//           height: 40px;
//           width: 40px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: #eef8fa;
//           border-radius: 10px;
//           color: #2c9fb0;
//         }

//         .marquee-container {
//           margin-top: 40px;
//           overflow: hidden;
//         }

//         .marquee {
//           display: flex;
//           gap: 40px;
//           width: max-content;
//           animation: marquee 18s linear infinite;
//         }

//         .marquee-item {
//           display: flex;
//           align-items: center;
//           gap: 20px;
//           white-space: nowrap;
//         }

//         .dot {
//           height: 6px;
//           width: 6px;
//           background: #2c9fb0;
//           border-radius: 50%;
//         }

//         @keyframes marquee {
//           0% { transform: translateX(0); }
//           100% { transform: translateX(-50%); }
//         }

//         .fade-mask {
//           mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
//         }
//       `}</style>
//     </div>
//   );
// }




















"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Search,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Building2,
  Layers3,
  Activity,
  Clock,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { label: "Institutes indexed",  value: "6,000+", sub: "Across all categories",  icon: Building2   },
  { label: "Ranking parameters",  value: "10",     sub: "NIRF methodology",        icon: TrendingUp  },
  { label: "Data freshness",      value: "96%",    sub: "Verified quality",         icon: ShieldCheck },
  { label: "Monthly searches",    value: "42K",    sub: "+18% vs last month",       icon: Activity    },
];

const features = [
  { title: "Smart Search",   desc: "Find institutes by name, code, category, or region.",  icon: Search,      bg: "#e0f6f9", color: "#2c9fb0" },
  { title: "Live Rankings",  desc: "Explore NIRF rankings with category-wise breakdown.",   icon: BarChart3,   bg: "#dce2ec", color: "#24304d" },
  { title: "Compare",        desc: "Compare multiple institutes side-by-side with clarity.",icon: Layers3,     bg: "#e8f6da", color: "#4a8c1a" },
  { title: "Trusted data",   desc: "NIRF-verified information, refreshed regularly.",       icon: ShieldCheck, bg: "#e0f6f9", color: "#2c9fb0" },
];

const recentActivity = [
  { label: "NIRF data synced",      time: "9:12 AM",   color: "#2c9fb0" },
  { label: "High search activity",  time: "8:40 AM",   color: "#6bbf3d" },
  { label: "Comparison flow used",  time: "Yesterday", color: "#24304d" },
];

const highlights = [
  "Compare institutes with live ranking data",
  "Search by name, category, or region",
  "Built for fast discovery",
  "NIRF-verified data sources",
  "Clean and trusted interface",
  "Explore all 10 ranking parameters",
];

// ─── Nest SVG mark ────────────────────────────────────────────────────────────

function NestMark() {
  return (
    <svg width="24" height="18" viewBox="0 0 60 44" fill="none">
      <path d="M2 38 C12 24 26 20 42 25 C50 28 56 34 54 40" stroke="#c8d4e8" strokeWidth="3.8" strokeLinecap="round" />
      <path d="M4 42 C14 28 28 24 44 29 C52 32 58 38 56 43" stroke="#c8d4e8" strokeWidth="3"   strokeLinecap="round" />
      <path d="M5 32 C15 18 30 15 46 20 C54 23 58 30 55 36" stroke="#2c9fb0" strokeWidth="3.4" strokeLinecap="round" />
      <ellipse cx="17" cy="15" rx="6.5" ry="3.2" fill="#6bbf3d" transform="rotate(-32 17 15)" />
      <ellipse cx="38" cy="12" rx="6.5" ry="3.2" fill="#6bbf3d" transform="rotate(28 38 12)" />
      <ellipse cx="50" cy="24" rx="5.5" ry="2.8" fill="#6bbf3d" transform="rotate(15 50 24)" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#f0f7f8] text-[#24304d]">

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(44,159,176,0.13) 0%, transparent 60%)",
            "radial-gradient(ellipse 40% 30% at 90% 80%, rgba(107,191,61,0.07) 0%, transparent 60%)",
          ].join(","),
        }}
      />

      {/* ══ HEADER ════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-[#ddeaed]/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-3 lg:px-10">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="h-14 w-32 object-contain" />
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "#2c9fb0" }}
              >
                BanavatNest
              </div>
              <div className="text-[11px]" style={{ color: "#94adb5" }}>
                Build with Purpose. Nurture to Impact.
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            <div
              className="hidden rounded-lg px-3 py-1.5 text-[11px] font-semibold sm:flex"
              style={{
                background: "#f4fafb",
                border: "1px solid #ddeaed",
                color: "#5b7f8a",
              }}
            >
              NIRF Explorer
            </div>
            <Link
              href="/ranking"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 hover:bg-[#f0f7f8]"
              style={{
                border: "1px solid #ddeaed",
                color: "#24304d",
              }}
            >
              <BarChart3 size={13} />
              Rankings
            </Link>
            <Link
              href="/search"
              className="group flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-bold text-white transition-all duration-200 hover:opacity-90"
              style={{ background: "#24304d" }}
            >
              <Search size={13} />
              Search
              <ArrowUpRight
                size={12}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </nav>
        </div>
      </header>

      {/* ══ MAIN ══════════════════════════════════════════════════════════ */}
      <main className="relative z-10 mx-auto max-w-[1400px] px-6 py-14 lg:px-10">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="mb-14">

          {/* Badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: "rgba(44,159,176,0.08)",
              border: "1px solid rgba(44,159,176,0.20)",
              color: "#2c9fb0",
            }}
          >
            <Sparkles size={11} />
            Platform Overview
          </div>

          {/* Two-column */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">

            {/* Left */}
            <div>
              <h1
                className="mb-5 font-black leading-[0.92] tracking-[-0.04em]"
                style={{ fontSize: "clamp(48px, 7vw, 86px)" }}
              >
                Discover institutes
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #2c9fb0 0%, #38bdf8 50%, #6bbf3d 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "shimmer 5s linear infinite",
                    display: "inline-block",
                  }}
                >
                  smarter.
                </span>
              </h1>

              <p
                className="mb-8 max-w-[500px] text-[15px] leading-[1.85]"
                style={{ color: "#6a8a98" }}
              >
                Explore rankings, compare institutions, and find the right
                academic fit through a clean, fast, and trusted interface.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/search"
                  className="group flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "#2c9fb0",
                    boxShadow: "0 8px 24px rgba(44,159,176,0.28)",
                  }}
                >
                  <Search size={15} />
                  Search Institutes
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
                <Link
                  href="/ranking"
                  className="flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d0dde8",
                    color: "#24304d",
                  }}
                >
                  <BarChart3 size={15} />
                  View Rankings
                </Link>
              </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-4">

              {/* Navy mission card */}
              <div
                className="relative overflow-hidden rounded-2xl p-6 text-white"
                style={{ background: "#24304d" }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full"
                  style={{ background: "rgba(44,159,176,0.12)" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full"
                  style={{ background: "rgba(107,191,61,0.10)" }}
                />
                <div className="relative">
                  <p
                    className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: "rgba(255,255,255,0.38)" }}
                  >
                    Mission
                  </p>
                  <p className="text-xl font-black leading-snug">
                    Build with Purpose.
                    <br />
                    <span style={{ color: "#2c9fb0" }}>Nurture</span> to Impact.
                  </p>
                  <p
                    className="mt-3 text-[12px] leading-6"
                    style={{ color: "rgba(255,255,255,0.48)" }}
                  >
                    A trusted platform for academic discovery and NIRF ranking
                    exploration.
                  </p>
                  <div
                    className="mt-4 flex items-center gap-2 text-[12px]"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: "#6bbf3d" }}
                    />
                    Fresh · Trustworthy · Modern
                  </div>
                </div>
              </div>

              {/* Live activity */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "#ffffff",
                  border: "1px solid #ddeaed",
                  boxShadow: "0 1px 6px rgba(15,35,50,0.06)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "#24304d" }}
                  >
                    Recent activity
                  </span>
                  <div
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: "rgba(107,191,61,0.10)" }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "#6bbf3d" }}
                    />
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "#4a8c1a" }}
                    >
                      Live
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {recentActivity.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        background: "#f8fcfd",
                        border: "1px solid #e8f2f5",
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: item.color }}
                        />
                        <span
                          className="text-[12px] font-semibold"
                          style={{ color: "#24304d" }}
                        >
                          {item.label}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "#94adb5" }}
                      >
                        <Clock size={10} />
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <section className="mb-14">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #ddeaed",
                    boxShadow: "0 1px 6px rgba(15,35,50,0.06)",
                  }}
                >
                  <div className="mb-4">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: "rgba(44,159,176,0.10)" }}
                    >
                      <Icon size={16} style={{ color: "#2c9fb0" }} />
                    </div>
                  </div>
                  <div
                    className="text-[30px] font-black leading-none tracking-tight"
                    style={{ color: "#24304d" }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="mt-1.5 text-[11px] font-semibold"
                    style={{ color: "#94adb5" }}
                  >
                    {s.label}
                  </div>
                  <div
                    className="mt-1 text-[11px] font-medium"
                    style={{ color: "#2c9fb0" }}
                  >
                    {s.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section className="mb-14">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#ffffff",
              border: "1px solid #ddeaed",
              boxShadow: "0 1px 6px rgba(15,35,50,0.06)",
            }}
          >
            <div
              className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "#2c9fb0" }}
            >
              What you can do
            </div>
            <div
              className="mb-6 text-[15px] font-bold"
              style={{ color: "#24304d" }}
            >
              Simple entry points for every user
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: "#f8fcfd",
                      border: "1px solid #e8f2f5",
                    }}
                  >
                    <div
                      className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: f.bg }}
                    >
                      <Icon size={16} style={{ color: f.color }} />
                    </div>
                    <div
                      className="mb-1 text-[13px] font-bold"
                      style={{ color: "#24304d" }}
                    >
                      {f.title}
                    </div>
                    <div
                      className="text-[11px] leading-5"
                      style={{ color: "#7a9aaa" }}
                    >
                      {f.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── MARQUEE ───────────────────────────────────────────────────── */}
        <section
          className="overflow-hidden rounded-2xl py-4"
          style={{
            background: "#ffffff",
            border: "1px solid #ddeaed",
            boxShadow: "0 1px 6px rgba(15,35,50,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "40px",
              width: "max-content",
              animation: "marquee 22s linear infinite",
              maskImage:
                "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            }}
          >
            {[...highlights, ...highlights].map((item, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-4 whitespace-nowrap text-[12px] font-semibold"
                style={{ color: "#7a9aaa" }}
              >
                {item}
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "#2c9fb0" }}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer
        className="relative z-10 mx-auto max-w-[1400px] px-6 pb-8 pt-4 text-center text-[10px] font-bold uppercase tracking-[0.22em] lg:px-10"
        style={{ color: "#b8cdd4" }}
      >
        BanavatNest · Build with Purpose. Nurture to Impact.
      </footer>

      {/* ══ KEYFRAMES ═════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 0%   center; }
          100% { background-position: 200% center; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}