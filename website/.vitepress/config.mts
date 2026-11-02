import { defineConfig, type HeadConfig } from 'vitepress'

const siteUrl = 'https://ftery0.github.io/ai-profile-switch'
const base = '/ai-profile-switch/'
const pretendard = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'

// VitePress's default heading ids, then NFC: the default NFKD step splits each Hangul syllable
// into jamo, so a hand-written link such as #기존-설정-가져오기 never matched its heading.
function slugify(str: string) {
  return str
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
    .normalize('NFC')
}

function guideSidebar(prefix = '') {
  return [
    {
      text: prefix ? '가이드' : 'Guide',
      items: [
        { text: prefix ? '빠른 시작' : 'Quick Start', link: `${prefix}/guide/` },
        { text: prefix ? '설치' : 'Installation', link: `${prefix}/guide/installation` },
        { text: prefix ? '명령어 레퍼런스' : 'Commands', link: `${prefix}/guide/commands` },
        { text: prefix ? '셸 통합' : 'Shell Integration', link: `${prefix}/guide/shell-integration` },
        { text: prefix ? '작동 방식' : 'How It Works', link: `${prefix}/guide/how-it-works` },
      ],
    },
    {
      text: prefix ? '플랫폼별 설정' : 'Platform Setup',
      items: [
        { text: 'macOS', link: `${prefix}/guide/setup-macos` },
        { text: 'Linux', link: `${prefix}/guide/setup-linux` },
        { text: 'Windows', link: `${prefix}/guide/setup-windows` },
      ],
    },
  ]
}

export default defineConfig({
  title: 'ai-profile-switch',
  description: 'Multi-account profile manager for Claude Code',
  cleanUrls: true,
  base,

  markdown: {
    anchor: { slugify },
  },

  sitemap: {
    hostname: 'https://ftery0.github.io/ai-profile-switch/',
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['link', { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` }],
    ['meta', { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#ffffff' }],
    ['meta', { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#17171c' }],
    ['link', { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: pretendard }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'ai-profile-switch' }],
    ['meta', { property: 'og:image', content: `${siteUrl}/og-image.png` }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: `${siteUrl}/og-image.png` }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/' },
        ],
        sidebar: {
          '/guide/': guideSidebar(),
        },
      },
    },
    ko: {
      label: '한국어',
      lang: 'ko',
      description: 'Claude Code를 위한 멀티 계정 프로필 관리 도구',
      themeConfig: {
        nav: [
          { text: '가이드', link: '/ko/guide/' },
        ],
        sidebar: {
          '/ko/guide/': guideSidebar('/ko'),
        },
        outline: { label: '목차' },
        docFooter: { prev: '이전', next: '다음' },
        lastUpdated: { text: '마지막 수정' },
      },
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ftery0/ai-profile-switch' },
    ],
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/ftery0/ai-profile-switch/edit/main/website/:path',
    },
  },

  transformHead({ pageData, siteData }) {
    const head: HeadConfig[] = []
    const pagePath = pageData.relativePath
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')

    // Canonical URL
    const canonical = `${siteUrl}/${pagePath}`
    head.push(['link', { rel: 'canonical', href: canonical }])

    // Hreflang: EN ↔ KO
    const isKo = pagePath.startsWith('ko/')
    const enPath = isKo ? pagePath.replace(/^ko\//, '') : pagePath
    const koPath = isKo ? pagePath : `ko/${pagePath}`

    head.push(['link', { rel: 'alternate', hreflang: 'en', href: `${siteUrl}/${enPath}` }])
    head.push(['link', { rel: 'alternate', hreflang: 'ko', href: `${siteUrl}/${koPath}` }])
    head.push(['link', { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}/${enPath}` }])

    // OG meta per page
    const title = pageData.frontmatter.title || pageData.title || siteData.title
    const description = pageData.frontmatter.description || pageData.description || siteData.description
    head.push(['meta', { property: 'og:title', content: title }])
    head.push(['meta', { property: 'og:description', content: description }])
    head.push(['meta', { property: 'og:url', content: canonical }])

    return head
  },

  transformHtml(code, id, ctx) {
    // Inject JSON-LD from frontmatter
    const jsonLd = ctx.pageData.frontmatter.jsonLd
    if (jsonLd) {
      const script = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
      return code.replace('</head>', `${script}\n</head>`)
    }
  },
})
