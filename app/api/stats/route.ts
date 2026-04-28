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
    const stars = user.repositories.nodes.reduce(
      (a, b) => a + b.stargazerCount,
      0,
    );

    const svg = `
    <svg width="450" height="230" viewBox="0 0 450 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .row { animation: slideIn 0.5s ease-out forwards; opacity: 0; }
        .glow-text { fill: #00E5FF; filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.5)); }
      </style>

      <rect width="410" height="190" x="20" y="20" rx="20" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(0, 225, 255, 0.1)" />
      
      <text x="45" y="60" font-family="Segoe UI, sans-serif" font-size="22" font-weight="bold" class="glow-text">GitHub Stats</text>

      <g font-family="Segoe UI, sans-serif" font-size="14" fill="#E0F7FA">
        <g class="row" style="animation-delay: 0.1s;"><text x="45" y="100">⭐ Total Stars Earned:</text><text x="280" y="100" fill="#fff" font-weight="bold">${stars}</text></g>
        <g class="row" style="animation-delay: 0.2s;"><text x="45" y="125">📦 Total Repositories:</text><text x="280" y="125" fill="#fff" font-weight="bold">${user.repositories.totalCount}</text></g>
        <g class="row" style="animation-delay: 0.3s;"><text x="45" y="150">✨ Total PRs:</text><text x="280" y="150" fill="#fff" font-weight="bold">${user.pullRequests.totalCount}</text></g>
        <g class="row" style="animation-delay: 0.4s;"><text x="45" y="175">👥 Total Followers:</text><text x="280" y="175" fill="#fff" font-weight="bold">${user.followers.totalCount}</text></g>
      </g>
      
      <circle cx="370" cy="115" r="35" stroke="#00E5FF" stroke-width="3" fill="none" stroke-opacity="0.2" />
      <text x="370" y="125" text-anchor="middle" fill="#00E5FF" font-family="Arial" font-weight="bold" font-size="22">A+</text>
    </svg>`;
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  } catch {
    return new NextResponse("<svg></svg>");
  }
}
