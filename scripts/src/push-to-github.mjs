import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const TOKEN = process.env.GH_TOKEN;
const OWNER = "sravani150602";
const REPO = "AI-Powered-Video-Metadata-Analyzer";
const ROOT = "/home/runner/workspace";

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", ".pnpm-store",
  ".local", "__pycache__", ".cache", "coverage",
  ".replit-artifact"
]);
const SKIP_FILES = new Set(["pnpm-lock.yaml", ".DS_Store"]);
const MAX_FILE_SIZE = 800 * 1024;

function getAllFiles(dir, root) {
  const results = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (SKIP_FILES.has(entry)) continue;
    const full = join(dir, entry);
    const rel = relative(root, full);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      results.push(...getAllFiles(full, root));
    } else {
      if (stat.size > MAX_FILE_SIZE) continue;
      results.push({ path: rel, fullPath: full });
    }
  }
  return results;
}

async function upsertFile(filePath, content) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath.split('/').map(encodeURIComponent).join('/')}`;
  const headers = {
    Authorization: `token ${TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  // Try without SHA first (works for new files)
  let res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ message: `Add ${filePath}`, content }),
  });

  // If conflict (file exists), get SHA and retry
  if (res.status === 422 || res.status === 409) {
    const getRes = await fetch(url, { headers });
    if (getRes.ok) {
      const existing = await getRes.json();
      res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({ message: `Update ${filePath}`, content, sha: existing.sha }),
      });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${res.status}: ${err.message || 'unknown'}`);
  }
}

async function main() {
  const startFrom = parseInt(process.env.START_FROM || "0");
  console.log("Scanning files...");
  const files = getAllFiles(ROOT, ROOT);
  const toProcess = files.slice(startFrom);
  console.log(`Processing ${toProcess.length} files (starting from #${startFrom + 1})`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const file = toProcess[i];
    try {
      const raw = readFileSync(file.fullPath);
      const b64 = raw.toString("base64");
      await upsertFile(file.path, b64);
      success++;
      if ((i + 1) % 10 === 0 || i === toProcess.length - 1) {
        console.log(`Progress: ${startFrom + i + 1}/${files.length} — ${file.path}`);
      }
    } catch (err) {
      console.log(`FAILED: ${file.path} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! ${success} uploaded, ${failed} failed`);
  console.log(`Repo: https://github.com/${OWNER}/${REPO}`);
}

main().catch(console.error);
