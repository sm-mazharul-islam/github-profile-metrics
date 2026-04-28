import { NextResponse } from "next/server";

export const runtime = "edge";

interface GithubLangResponse {
  data: {
    user: {
      repositories: {
        nodes: Array<{
          languages: {
            edges: Array<{
              size: number;
              node: { name: string; color: string };
            }>;
          };
        }>;
      };
    };
  };
}

export async function GET() {
  const GITHUB_USERNAME = "sm-mazharul-islam";
  const query = `query { user(login: "${GITHUB_USERNAME}") { repositories(first: 100, ownerAffiliations: OWNER) { nodes { languages(first: 5, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } } } } } }`;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    const result: GithubLangResponse = await res.json();
    const langMap: Record<string, { color: string; size: number }> = {};
    let total = 0;

    result.data.user.repositories.nodes.forEach((r) =>
      r.languages.edges.forEach((e) => {
        total += e.size;
        if (!langMap[e.node.name])
          langMap[e.node.name] = { color: e.node.color, size: 0 };
        langMap[e.node.name].size += e.size;
      }),
    );

    const sorted = Object.entries(langMap)
      .sort(([, a], [, b]) => b.size - a.size)
      .slice(0, 4);

    const svg = `
    <svg width="450" height="230" viewBox="0 0 450 230" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="410" height="190" x="20" y="20" rx="15" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
      <text x="40" y="55" font-family="Segoe UI" fill="#1DB954" font-size="20" font-weight="bold">Top Tech</text>
      <g transform="translate(40, 90)">
        ${sorted
          .map(([n, d], i) => {
            const w = (d.size / total) * 220;
            return `
          <g transform="translate(0, ${i * 35})">
            <text font-family="Segoe UI" fill="#C9D1D9" font-size="13">${n}</text>
            <rect x="120" y="-12" width="220" height="6" rx="3" fill="rgba(255,255,255,0.05)" />
            <rect x="120" y="-12" width="0" height="6" rx="3" fill="${d.color}">
              <animate attributeName="width" from="0" to="${w}" dur="1.5s" fill="freeze" />
            </rect>
          </g>`;
          })
          .join("")}
      </g>
    </svg>`;
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  } catch {
    return new NextResponse("<svg></svg>");
  }
}
