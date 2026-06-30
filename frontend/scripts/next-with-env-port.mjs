import { existsSync, readFileSync } from "fs";
import { spawn } from "child_process";
import path from "path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}

const cwd = process.cwd();
loadEnvFile(path.join(cwd, ".env"));
loadEnvFile(path.join(cwd, ".env.local"));

const command = process.argv[2] || "dev";
const port = process.env.FRONTEND_PORT || process.env.PORT || "2001";
const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [nextBin, command, "-p", port], {
  cwd,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
