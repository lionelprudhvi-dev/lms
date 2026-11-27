/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['@electric-sql/pglite', 'pg', 'pdf-lib', 'exceljs', 'bcryptjs'],
  },
};

module.exports = nextConfig;
