import { NextResponse } from "next/server";

export const runtime = "edge";

interface GithubGraphResponse {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<{
            contributionDays: Array<{
              contributionCount: number;
              date: string;
            }>;
          }>;
        };
      };
    };
  };
}

export async function GET() {
  const GITHUB_USERNAME = "sm-mazharul-islam"; // অথবা ডাইনামিক username প্যারামিটার
  const query = `query {
    user(login: "${GITHUB_USERNAME}") {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }`;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const result: GithubGraphResponse = await res.json();
    const calendar =
      result.data.user.contributionsCollection.contributionCalendar;
    const allDays = calendar.weeks
      .flatMap((w) => w.contributionDays)
      .slice(-28); // গত ২৮ দিনের ডেটা

    // --- Statistics Calculations ---
    const counts = allDays.map((d) => d.contributionCount);
    const maxVal = Math.max(...counts, 1);

    // ১. কন্ট্রিবিউশন গ্যাপ (কয়দিন কাজ করেননি)
    const lazyDays = counts.filter((c) => c === 0).length;

    // ২. অ্যাক্টিভ ডেস (কয়দিন কাজ করেছেন)
    const activeDays = counts.length - lazyDays;

    // ৩. অ্যাক্টিভিটি রেট (কত শতাংশ দিন কাজ করেছেন)
    const activityRate = ((activeDays / counts.length) * 100).toFixed(1);

    // ৪. ম্যাক্স কন্ট্রিবিউশন ডে (সবচেয়ে বেশি কোন দিন কাজ করেছেন)
    const peakDay = allDays.find((d) => d.contributionCount === maxVal);

    // --- Graph Drawing Logic ---
    const width = 400; // গ্রাফের প্রস্থ
    const height = 100; // গ্রাফের উচ্চতা
    const points = allDays
      .map((d, i) => {
        const x = (i / (allDays.length - 1)) * width;
        const y = height - (d.contributionCount / maxVal) * height;
        return `${x},${y}`;
      })
      .join(" ");

    const svg = `
    <svg width="500" height="300" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#00E5FF;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#00E5FF;stop-opacity:0" />
        </linearGradient>
      </defs>

      <style>
        .title { fill: #00E5FF; font-family: 'Segoe UI', sans-serif; font-size: 20px; font-weight: bold; }
        .sub-text { fill: #8B949E; font-family: 'Segoe UI', sans-serif; font-size: 13px; }
        .stat-label { fill: #E0F7FA; font-family: 'Segoe UI', sans-serif; font-size: 12px; }
        .stat-val { fill: #00E5FF; font-family: 'Segoe UI', sans-serif; font-size: 18px; font-weight: bold; }
        .stat-desc { fill: #8B949E; font-family: 'Segoe UI', sans-serif; font-size: 10px; }
        .axis-label { fill: #8B949E; font-family: 'Segoe UI', sans-serif; font-size: 10px; }
        .line { stroke: #00E5FF; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; filter: url(#neonGlow); }
        @keyframes drawLine { from { stroke-dasharray: 800; stroke-dashoffset: 800; } to { stroke-dasharray: 800; stroke-dashoffset: 0; } }
        .line-anim { animation: drawLine 2s ease-out forwards; }
      </style>

      <rect width="460" height="260" x="20" y="20" rx="28" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(0, 225, 255, 0.15)" stroke-width="1.5" />
      
      <g transform="translate(45, 60)">
        <text class="title">Premium Insights</text>
        <text y="20" class="sub-text">A detailed look into your coding commitment</text>
      </g>

      <g transform="translate(45, 110)">
        <g transform="translate(0, 0)">
          <text class="stat-label">Total Contributions (Year)</text>
          <text y="25" class="stat-val">${calendar.totalContributions}</text>
          <text y="40" class="stat-desc">Your overall dedication</text>
        </g>
        
        <g transform="translate(180, 0)">
          <text class="stat-label">Active Coding Days</text>
          <text y="25" class="stat-val">${activeDays} / 28</text>
          <text y="40" class="stat-desc">${lazyDays} Lazy days detected</text>
        </g>
        
        <g transform="translate(340, 0)">
          <text class="stat-label">Max in One Day</text>
          <text y="25" class="stat-val">${maxVal}</text>
          <text y="40" class="stat-desc">Happened on ${peakDay ? new Date(peakDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}</text>
        </g>
      </g>

      <g transform="translate(50, 180)">
        <path d="M0,${height} L${points} L${width},${height} Z" fill="url(#areaGradient)" />

        <line x1="0" y1="${height}" x2="${width}" y2="${height}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        
        <polyline points="${points}" class="line line-anim" fill="none" />
        
        <g transform="translate(${width}, ${height - (counts[counts.length - 1] / maxVal) * height})">
          <circle r="4" fill="#fff" />
          <circle r="12" stroke="#00E5FF" stroke-width="1">
            <animate attributeName="r" values="8;18;8" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>

        <g transform="translate(0, ${height + 20})">
          <text class="axis-label">${new Date(allDays[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</text>
          <text x="${width / 2}" class="axis-label" text-anchor="middle">2-Weeks Ago</text>
          <text x="${width}" class="axis-label" text-anchor="end">Today (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })})</text>
        </g>
      </g>
    </svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new NextResponse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="300"><text y="20" fill="red">Error loading premium insights</text></svg>',
      {
        headers: { "Content-Type": "image/svg+xml" },
      },
    );
  }
}
