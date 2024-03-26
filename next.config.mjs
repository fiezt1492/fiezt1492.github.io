import postgres from 'postgres'
import million from 'million/compiler'

export const sql = postgres(process.env.POSTGRES_URL, {
    ssl: 'allow',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        ppr: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.discordapp.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    async redirects() {
        if (!process.env.POSTGRES_URL) {
            return []
        }

        let redirects = await sql`
        SELECT source, destination, permanent
        FROM redirects;
        `

        console.log(`${redirects.count} redirects found.`)

        return redirects.map(({ source, destination, permanent }) => ({
            source,
            destination,
            permanent: !!permanent,
        }))
    },
    headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ]
    },
}

const ContentSecurityPolicy = `
    default-src 'self' vercel.live;
    script-src 'self' 'unsafe-eval' 'unsafe-inline' cdn.vercel-insights.com vercel.live va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline';
    img-src * blob: data:;
    media-src 'none';
    connect-src *;
    font-src 'self' data:;
    frame-src 'self' *.codesandbox.io vercel.live;
`

const securityHeaders = [
    {
        key: 'Content-Security-Policy',
        value: ContentSecurityPolicy.replace(/\n/g, ''),
    },
    {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin',
    },
    {
        key: 'X-Frame-Options',
        value: 'DENY',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
]

const millionConfig = {
    auto: true, // if you're using RSC: auto: { rsc: true },
}

export default million.next(nextConfig, millionConfig)
