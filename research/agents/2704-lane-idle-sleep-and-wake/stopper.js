// Toy stand-in for an idle session: holds ~120 MB of touched heap, serves a unix
// socket that answers "pong", and keeps one child process (stand-in for an MCP server).
const net = require("net");
const fs = require("fs");
const { spawn } = require("child_process");
const sock = process.argv[2];
const MB = 120;
const hold = [];
for (let i = 0; i < MB; i++) { const b = Buffer.alloc(1 << 20); for (let j = 0; j < b.length; j += 4096) b[j] = 1; hold.push(b); }
try { fs.unlinkSync(sock); } catch (e) {}
net.createServer((c) => { c.on("data", () => c.end("pong")); }).listen(sock, () => {
  const child = spawn(process.execPath, ["-e", "setInterval(()=>{}, 1000)"], { stdio: "ignore" });
  console.log(JSON.stringify({ pid: process.pid, child: child.pid, heldMB: MB }));
});
