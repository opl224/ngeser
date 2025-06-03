
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
        "https://9000-firebase-studio-1748783613696.cluster-iktsryn7xnhpexlu6255bftka4.cloudworkstations.dev",
      // Add other allowed origins here if needed in the future
    ],
  },
};

export default nextConfig;
