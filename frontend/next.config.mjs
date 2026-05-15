/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // pdfjs-dist v5 ships as .mjs and crashes ("Object.defineProperty called on
  // non-object") when loaded through Next's default webpack pipeline. Letting
  // Next transpile these packages with SWC fixes it.
  transpilePackages: ['react-pdf', 'pdfjs-dist'],
};

export default nextConfig;
