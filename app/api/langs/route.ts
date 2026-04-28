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
      <rect width="410" height="190" x="20" y="20" rx="20" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(0, 225, 255, 0.1)" />
      <text x="45" y="60" font-family="Segoe UI" fill="#00E5FF" font-size="20" font-weight="bold">Most Used Languages</text>
      <g transform="translate(45, 95)">
        ${sorted
          .map(([n, d], i) => {
            const w = (d.size / total) * 230;
            return `
          <g transform="translate(0, ${i * 35})">
            <text font-family="Segoe UI" fill="#C9D1D9" font-size="14">${n}</text>
            <rect x="110" y="-12" width="230" height="8" rx="4" fill="rgba(255,255,255,0.05)" />
            <rect x="110" y="-12" width="0" height="8" rx="4" fill="#00E5FF">
              <animate attributeName="width" from="0" to="${w}" dur="1.5s" fill="freeze" />
              <animate attributeName="fill" values="#00E5FF;#00B8D4;#00E5FF" dur="3s" repeatCount="indefinite" />
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
