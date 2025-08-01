const http = require("http");

// Set production environment variables
process.env.NODE_ENV = "production";
process.env.PORT = "3001";

// Import and start the app
async function testDeployment() {
  console.log("🧪 Testing deployment simulation...");

  try {
    // Import the main file (it will auto-execute bootstrap)
    require("./dist/main.js");

    // App will start automatically when main.js is required

    // Wait a moment for the app to fully start
    setTimeout(() => {
      // Test the health endpoint
      const options = {
        hostname: "localhost",
        port: 3001,
        path: "/api",
        method: "GET",
      };

      const req = http.request(options, (res) => {
        console.log(`✅ Health check status: ${res.statusCode}`);

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          console.log("✅ Response:", data);
          console.log("🎉 Deployment test PASSED!");
          process.exit(0);
        });
      });

      req.on("error", (err) => {
        console.error("❌ Health check failed:", err.message);
        console.log("💥 Deployment test FAILED!");
        process.exit(1);
      });

      req.end();
    }, 2000);
  } catch (error) {
    console.error("❌ App startup failed:", error.message);
    console.log("💥 Deployment test FAILED!");
    process.exit(1);
  }
}

testDeployment();
