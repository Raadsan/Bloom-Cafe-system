import { execSync } from "node:child_process";

const port = process.argv[2] || "3000";

if (process.platform !== "win32") {
  process.exit(0);
}

try {
  const output = execSync(`netstat -ano | findstr :${port}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes("LISTENING")) continue;
    const pid = trimmed.split(/\s+/).pop();
    if (pid && /^\d+$/.test(pid) && pid !== "0") {
      pids.add(pid);
    }
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`[predev] Freed port ${port} (PID ${pid})`);
    } catch {
      /* ignore */
    }
  }
} catch {
  /* port already free */
}
