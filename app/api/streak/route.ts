import { NextResponse } from "next/server";

export const runtime = "edge";

interface GithubStreakResponse {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
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
  const GITHUB_USERNAME = "sm-mazharul-islam";
  const query = `query { user(login: "${GITHUB_USERNAME}") { contributionsCollection { contributionCalendar { weeks { contributionDays { contributionCount date } } } } } }`;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const result: GithubStreakResponse = await res.json();
    const days =
      result.data.user.contributionsCollection.contributionCalendar.weeks
        .flatMap((w) => w.contributionDays)
        .reverse(); // Latest day first

    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    let currStart = "";
    let currEnd = "";
    let longStart = "";
    let longEnd = "";
    let tempEnd = "";

    // Calculate current and longest streaks
    days.forEach((d, i) => {
      if (d.contributionCount > 0) {
        if (tempStreak === 0) tempEnd = d.date;
        tempStreak++;

        if (tempStreak >= longest) {
          longest = tempStreak;
          longEnd = tempEnd;
          longStart = d.date;
        }

        // Check if streak is still active from today or yesterday
        if (i === 0 || (i === 1 && days[0].contributionCount === 0)) {
          // This indicates an ongoing streak
        }
      } else {
        // Break temp streak if it's not today/yesterday gap
        if (i > 1) tempStreak = 0;
      }
    });

    // Dedicated loop for active current streak to get dates accurately
    let count = 0;
    let foundActive = false;
    // Check if user contributed today or yesterday to consider it "active"
    const isRecentlyActive =
      days[0].contributionCount > 0 || days[1].contributionCount > 0;

    if (isRecentlyActive) {
      for (const d of days) {
        if (d.contributionCount > 0) {
          if (!foundActive) {
            currEnd = d.date;
            foundActive = true;
          }
          count++;
          currStart = d.date;
        } else if (foundActive) {
          break;
        }
      }
      current = count;
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "---";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    const svg = `
    <svg width="450" height="230" viewBox="0 0 450 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes fillUp { from { stroke-dashoffset: 301; } to { stroke-dashoffset: var(--offset); } }
        .flame { animation: pulse 2s infinite ease-in-out; fill: #00E5FF; filter: drop-shadow(0 0 8px #00E5FF); }
        .date-text { fill: #8B949E; font-family: 'Segoe UI', sans-serif; font-size: 11px; }
        .draw-circle { 
          animation: fillUp 2s ease-out forwards; 
          stroke-dasharray: 301; 
          --offset: ${301 - Math.min(current, 30) * 10};
        }
      </style>
      
      <rect width="410" height="190" x="20" y="20" rx="20" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(0, 225, 255, 0.1)" />
      
      <g transform="translate(120, 115)">
        <circle r="48" stroke="rgba(0, 229, 255, 0.1)" stroke-width="6" fill="none" />
        <circle r="48" stroke="#00E5FF" stroke-width="6" fill="none" class="draw-circle" stroke-linecap="round" transform="rotate(-90)" />
        
        <path class="flame" d="M0 -30 C -10 -20, -15 -10, -15 0 C -15 10, -8 18, 0 18 C 8 18, 15 10, 15 0 C 15 -15, 0 -35, 0 -35 Z" transform="translate(0, -55) scale(0.4)" />
        
        <text dy="10" text-anchor="middle" font-family="Segoe UI" fill="#fff" font-size="32" font-weight="bold">${current}</text>
        <text y="70" text-anchor="middle" font-family="Segoe UI" fill="#00E5FF" font-size="13" font-weight="bold">Current Streak</text>
        <text y="88" text-anchor="middle" class="date-text">${formatDate(currStart)} - ${formatDate(currEnd)}</text>
      </g>

      <line x1="230" y1="60" x2="230" y2="170" stroke="rgba(0, 229, 255, 0.15)" stroke-width="1.5" />

      <g transform="translate(335, 115)">
        <text dy="10" text-anchor="middle" font-family="Segoe UI" fill="#00E5FF" font-size="36" font-weight="bold" style="filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.3));">${longest}</text>
        <text y="40" text-anchor="middle" font-family="Segoe UI" fill="#fff" font-size="13" font-weight="bold">Longest Streak</text>
        <text y="60" text-anchor="middle" class="date-text">${formatDate(longStart)} - ${formatDate(longEnd)}</text>
      </g>
    </svg>`;

    // ... existing logic ...
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    return new NextResponse(
      `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="230"><rect width="410" height="190" x="20" y="20" rx="20" fill="rgba(255,255,255,0.03)" stroke="#00E5FF" stroke-opacity="0.2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8B949E">Streak data unavailable</text></svg>`,
      {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
