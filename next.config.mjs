import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/presentation/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // typedRoutes will be re-enabled once all locale routes (eventos, painel, etc.)
  // exist in the App Router. For now it false-positives on links to in-progress pages.
  images: {
    remotePatterns: [
      // S3 bucket (media uploads) — to be configured.
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      { protocol: 'https', hostname: '**.s3.*.amazonaws.com' },
      // Google account avatars (lh3, lh4, lh5, lh6 — used by OAuth profile pictures).
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      // Generic Google user content fallback.
      { protocol: 'https', hostname: 'googleusercontent.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
