/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['youtube-dl-exec', 'pdf-parse'],
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/tools/video-to-text',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/tools/media-converter',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
};

export default nextConfig;
