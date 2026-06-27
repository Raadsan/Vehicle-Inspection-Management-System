import "dotenv/config";
import app from "./src/app.js";

const PORT = process.env.SERVER_PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server is running on ${PORT}`);
});

process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
