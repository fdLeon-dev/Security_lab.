import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveToolkitReport } from "@/server/modules/toolkit/toolkit.service";

const schema = z.object({
  content: z.string().min(1).max(100_000),
  search: z.string().max(200).optional(),
  minLevel: z.enum(["ALL", "INFO", "WARN", "ERROR", "DEBUG"]).optional(),
});

const LOG_PATTERNS = [
  { level: "ERROR", re: /\b(error|err|fail(?:ure|ed)?|exception|critical)\b/i },
  { level: "WARN",  re: /\b(warn(?:ing)?|caution)\b/i },
  { level: "INFO",  re: /\b(info(?:rmation)?|notice|success(?:ful)?)\b/i },
  { level: "DEBUG", re: /\b(debug|trace|verbose)\b/i },
];

const LEVEL_RANK: Record<string, number> = { ALL: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4 };

function classifyLine(line: string) {
  for (const { level, re } of LOG_PATTERNS) {
    if (re.test(line)) return level;
  }
  return "INFO";
}

export async function POST(request: NextRequest) {
  try {
    const { content, search, minLevel = "ALL" } = schema.parse(await request.json());
    const minRank = LEVEL_RANK[minLevel] ?? 0;

    const lines = content
      .split("\n")
      .map((raw, idx) => ({
        line: idx + 1,
        raw: raw.trimEnd(),
        level: classifyLine(raw),
      }))
      .filter((entry) => {
        const rank = LEVEL_RANK[entry.level] ?? 0;
        const matchesLevel = rank >= minRank;
        const matchesSearch = search
          ? entry.raw.toLowerCase().includes(search.toLowerCase())
          : true;
        return matchesLevel && matchesSearch;
      });

    const stats = {
      total: lines.length,
      byLevel: Object.fromEntries(
        ["DEBUG", "INFO", "WARN", "ERROR"].map((level) => [
          level,
          lines.filter((l) => l.level === level).length,
        ])
      ),
    };

    await saveToolkitReport(
      "log_analyzer",
      `search=${search ?? ""} minLevel=${minLevel} lines=${content.split("\n").length}`,
      JSON.stringify({ stats, sample: lines.slice(0, 50) })
    );

    return NextResponse.json({ lines: lines.slice(0, 200), stats });
  } catch {
    return NextResponse.json({ error: "Invalid log analyzer request" }, { status: 400 });
  }
}
