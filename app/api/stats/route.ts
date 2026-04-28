import { NextResponse } from "next/server";

export const runtime = "edge";

interface GithubStatsResponse {
  data: {
    user: {
      name: string;
      followers: { totalCount: number };
      pullRequests: { totalCount: number };
      issues: { totalCount: number };
      repositories: {
        totalCount: number;
        nodes: Array<{ stargazerCount: number }>;
      };
    };
  };
}

export async function GET() {
  const GITHUB_USERNAME = "sm-mazharul-islam";
  const query = `query {
    user(login: "${GITHUB_USERNAME}") {
      name
      followers { totalCount }
      pullRequests { totalCount }
      issues { totalCount }
      repositories(first: 100, ownerAffiliations: OWNER) {
        totalCount
        nodes { stargazerCount }
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

    const result: GithubStatsResponse = await res.json();
    const user = result.data.user;

    // Calculate total stars
    const stars = user.repositories.nodes.reduce(
      (a, b) => a + b.stargazerCount,
      0,
    );
    const totalRepos = user.repositories.totalCount;

    const svg = `
    <svg width="450" height="230" viewBox="0 0 450 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blurFilter" x="-20" y="-20" width="490" height="270">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
        </filter>
      </defs>

      <style>
        @keyframes slide { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .row { animation: slide 0.6s ease forwards; opacity: 0; }
      </style>

      <rect width="410" height="190" x="20" y="20" rx="15" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.1)" />
      
      <circle cx="380" cy="115" r="30" fill="#1DB954" fill-opacity="0.1" filter="url(#blurFilter)" />
      
      <text x="40" y="55" font-family="Segoe UI, sans-serif" fill="#1DB954" font-size="20" font-weight="bold">Mazharul's GitHub Stats</text>

      <g font-family="Segoe UI, sans-serif" font-size="14" fill="#C9D1D9">
        <g class="row" style="animation-delay: 0.1s;">
          <text x="40" y="90">⭐ Total Stars Earned:</text>
          <text x="280" y="90" fill="#fff" font-weight="bold">${stars}</text>
        </g>
        
        <g class="row" style="animation-delay: 0.2s;">
          <text x="40" y="115">📦 Total Repositories:</text>
          <text x="280" y="115" fill="#fff" font-weight="bold">${totalRepos}</text>
        </g>
        
        <g class="row" style="animation-delay: 0.3s;">
          <text x="40" y="140">✨ Total Pull Requests:</text>
          <text x="280" y="140" fill="#fff" font-weight="bold">${user.pullRequests.totalCount}</text>
        </g>
        
        <g class="row" style="animation-delay: 0.4s;">
          <text x="40" y="165">❗ Total Issues:</text>
          <text x="280" y="165" fill="#fff" font-weight="bold">${user.issues.totalCount}</text>
        </g>
        
        <g class="row" style="animation-delay: 0.5s;">
          <text x="40" y="190">👥 Total Followers:</text>
          <text x="280" y="190" fill="#fff" font-weight="bold">${user.followers.totalCount}</text>
        </g>
      </g>
      
      <circle cx="380" cy="115" r="38" stroke="#1DB954" stroke-width="3" fill="none" stroke-opacity="0.2" />
      <text x="380" y="125" text-anchor="middle" fill="#1DB954" font-family="Arial, sans-serif" font-weight="bold" font-size="24">A+</text>
    </svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new NextResponse(
      '<svg xmlns="http://www.w3.org/2000/svg"><text y="20" fill="red">Error loading stats</text></svg>',
      {
        headers: { "Content-Type": "image/svg+xml" },
      },
    );
  }
}
