module.exports = {
  apps: [
    {
      name: "inspection-backend",
      cwd: "./backend",
      script: "server.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        SERVER_PORT: "7001",
      },
    },
    {
      name: "inspection-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        FRONTEND_PORT: "2001",
        NEXT_PUBLIC_BACKEND_URL: "http://localhost:7001",
      },
    },
  ],
};
