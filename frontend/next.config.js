/** @type {import('next').NextConfig} */
const onCloudflare = process.env.CF_PAGES === '1';
const repo = 'move-mark';
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: onCloudflare ? '' : process.env.GH_PAGES === '1' ? `/${repo}` : '',
  trailingSlash: true,
};
module.exports = nextConfig;
