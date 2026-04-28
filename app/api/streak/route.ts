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
        .reverse();

    let current = 0,
      longest = 0,
      temp = 0;
    days.forEach((d, i) => {
      if (d.contributionCount > 0) {
        temp++;
        if (i === 0) current = temp;
        if (temp > longest) longest = temp;
      } else {
        temp = 0;
      }
    });

    const svg = `
    <svg width="450" height="230" viewBox="0 0 450 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="innerGlow" x="0" y="0" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
        </filter>
      </defs>

      <rect width="410" height="190" x="20" y="20" rx="15" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" />
      
      <g transform="translate(110, 115)">
        <circle r="45" stroke="rgba(255,255,255,0.05)" stroke-width="5" fill="none" />
        <circle r="45" stroke="#1DB954" stroke-width="5" fill="none" stroke-dasharray="283" stroke-dashoffset="${283 - current * 8}" stroke-linecap="round" transform="rotate(-90)">
          <animate attributeName="stroke-dashoffset" from="283" to="${283 - current * 8}" dur="2s" fill="freeze" />
        </circle>
        <text dy="10" text-anchor="middle" font-family="Segoe UI" fill="#fff" font-size="28" font-weight="bold">${current}</text>
        <text y="70" text-anchor="middle" font-family="Segoe UI" fill="#1DB954" font-size="12" font-weight="bold">Current Streak</text>
      </g>

      <line x1="225" y1="50" x2="225" y2="180" stroke="rgba(255,255,255,0.1)" stroke-width="1" />

      <g transform="translate(340, 115)">
        <text dy="10" text-anchor="middle" font-family="Segoe UI" fill="#1DB954" font-size="36" font-weight="bold">${longest}</text>
        <text y="45" text-anchor="middle" font-family="Segoe UI" fill="#1DB954" font-size="12" font-weight="bold">Longest Streak</text>
      </g>
    </svg>`;
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  } catch {
    return new NextResponse("<svg></svg>");
  }
}
