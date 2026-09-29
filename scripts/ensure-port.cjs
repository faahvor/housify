#!/usr/bin/env node
// Usage: node ensure-port.cjs <port> <label>
// Runs before a dev/start script. If anything is already listening on <port>,
// print an alert naming the process, kill it, and verify the port is free.
// Exits non-zero (blocking the server start) if the port cannot be freed.
const { execSync } = require("node:child_process");

const port = Number(process.argv[2]);
const label = process.argv[3] || "server";
const isWin = process.platform === "win32";

if (!Number.isInteger(port) || port <= 0) {
  console.error(`[port-guard] Invalid port: ${process.argv[2]}`);
  process.exit(1);
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

function listeningPids() {
  const pids = new Set();
  if (isWin) {
    for (const line of run("netstat -ano").split(/\r?\n/)) {
      const cols = line.trim().split(/\s+/);
      // Proto  Local Address  Foreign Address  State  PID
      if (cols[0] !== "TCP" || cols[3] !== "LISTENING") continue;
      if (cols[1].endsWith(`:${port}`)) pids.add(Number(cols[4]));
    }
  } else {
    for (const pid of run(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`).split(/\s+/)) {
      if (pid) pids.add(Number(pid));
    }
  }
  pids.delete(process.pid);
  return [...pids];
}

function processName(pid) {
  if (isWin) {
    const row = run(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`).trim();
    const match = row.match(/^"([^"]+)"/);
    return match ? match[1] : "unknown";
  }
  return run(`ps -p ${pid} -o comm=`).trim() || "unknown";
}

function kill(pid) {
  if (isWin) run(`taskkill /PID ${pid} /T /F`);
  else run(`kill -9 ${pid}`);
}

const squatters = listeningPids();
if (squatters.length === 0) {
  console.log(`[port-guard] Port ${port} is free for the ${label}.`);
  process.exit(0);
}

const bar = "!".repeat(64);
console.warn(`\n${bar}`);
console.warn(`[port-guard] ALERT: port ${port} is reserved for the ${label},`);
console.warn(`[port-guard] but it is already in use by:`);
for (const pid of squatters) {
  console.warn(`[port-guard]   PID ${pid}  (${processName(pid)})`);
}
console.warn(`[port-guard] Cutting it off...`);
for (const pid of squatters) kill(pid);

// Give the OS a moment to release the socket.
const deadline = Date.now() + 5000;
let remaining = listeningPids();
while (remaining.length > 0 && Date.now() < deadline) {
  execSync(isWin ? "ping -n 2 127.0.0.1 >NUL" : "sleep 0.5");
  remaining = listeningPids();
}

if (remaining.length > 0) {
  console.error(`[port-guard] FAILED to free port ${port}. Still held by PID(s): ${remaining.join(", ")}.`);
  console.error(`[port-guard] Stop it manually, then retry. The ${label} will NOT start on another port.`);
  console.warn(`${bar}\n`);
  process.exit(1);
}

console.warn(`[port-guard] Port ${port} freed. Starting the ${label} on ${port}.`);
console.warn(`${bar}\n`);
