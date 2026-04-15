/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
transpilePackages: ['@ai-sdk/react', 'ai'],
};

export default nextConfig;
