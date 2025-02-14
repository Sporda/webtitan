module.exports = {
  apps: [
    {
      name: "webtitan",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        PORT: 3000,
        HOST: "0.0.0.0",
        NODE_ENV: "production",
      },
    },
  ],
};
