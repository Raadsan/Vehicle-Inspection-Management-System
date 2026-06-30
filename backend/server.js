import "dotenv/config";
import app from "./src/app.js";

const PORT = process.env.SERVER_PORT || process.env.PORT || 7001;
const HOST = process.env.SERVER_HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server is running on http://${HOST}:${PORT}`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
