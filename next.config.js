/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  output: 'export',
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    }
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      asyncWebAssembly: true,
    };
    config.module.rules.push({
      test: /\.md$/i,
      use: "raw-loader",
    });
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        "node:fs/promises": false,
        assert: false,
        module: false,
        perf_hooks: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
