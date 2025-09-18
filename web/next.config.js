const isProd = process.env.NODE_ENV === 'production';
const defaultStaticPrefix = '/static';
const path = require('path');
const fs = require('fs');

const envFile = process.env.NEXT_ENV_FILE || '.env';

let customBasePath = process.env.NEXT_BASE_PATH || '';
let customAssetPrefix = process.env.NEXT_ASSET_PREFIX;

const envFilePath = path.join(__dirname, envFile);

const parseEnv = (content) => {
  const env = {};
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const index = line.indexOf('=');
      if (index === -1) {
        return;
      }
      const key = line.slice(0, index).trim();
      if (!key) {
        return;
      }
      let value = line.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    });
  return env;
};
try {
  if (fs.existsSync(envFilePath)) {
    const fileEnv = parseEnv(fs.readFileSync(envFilePath, 'utf-8'));
    if (!customBasePath && fileEnv.NEXT_BASE_PATH) {
      customBasePath = fileEnv.NEXT_BASE_PATH;
    }
    if (customAssetPrefix === undefined && fileEnv.NEXT_ASSET_PREFIX !== undefined) {
      customAssetPrefix = fileEnv.NEXT_ASSET_PREFIX;
    }
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.warn('Failed to load env file for next config:', error);
}

// Derive base path from manifest when not provided explicitly.
if (!customBasePath) {
  try {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (manifest?.base_url) {
      const baseUrl = new URL(manifest.base_url);
      customBasePath = baseUrl.pathname.replace(/\/$/, '');
    } else if (manifest?.id) {
      customBasePath = `/platform/plugin_relay/app_dispatch/${manifest.id}`;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to derive base path from manifest:', error);
  }
}

if (customAssetPrefix === undefined) {
  if (customBasePath) {
    customAssetPrefix = `${customBasePath}${defaultStaticPrefix}`;
  } else if (isProd) {
    customAssetPrefix = defaultStaticPrefix;
  } else {
    customAssetPrefix = '';
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  trailingSlash: false,
  assetPrefix: customAssetPrefix,
  basePath: customBasePath,
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: false,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: customBasePath,
    NEXT_PUBLIC_ASSET_PREFIX: customAssetPrefix,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/static/_next/:path*',
        destination: '/_next/:path*',
      },
      {
        source: '/static/page1.html',
        destination: '/page1',
      },
      {
        source: '/static/page2.html',
        destination: '/page2',
      },
      {
        source: '/static/index.html',
        destination: '/',
      },
      {
        source: '/static',
        destination: '/',
      },
    ];
  },
};

module.exports = nextConfig;
