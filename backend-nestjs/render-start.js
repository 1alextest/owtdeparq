// Render-specific startup script
const { spawn } = require("child_process");

console.log("🚀 Starting Owtdeparq Backend on Render...");
console.log("Environment:", process.env.NODE_ENV);
console.log("Port:", process.env.PORT || 10000);

// Set Render-specific environment
process.env.PORT = process.env.PORT || "10000";

// Start the application
const app = spawn("node", ["dist/main.js"], {
  stdio: "inherit",
  env: process.env,
});

app.on("close", (code) => {
  console.log(`Application exited with code ${code}`);
  process.exit(code);
});

app.on("error", (err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});
