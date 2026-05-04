import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://7xbet.asia';
const SITE_NAME = '7XBET';
const DEFAULT_IMAGE = `${SITE_URL}/images/brand/og-image.png`;

const GOOGLE_SITE_VERIFICATION = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;

const NOINDEX_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/verify-reset-password-otp',
  '/set-new-password',
  '/verify-user',
  '/agent',
  '/agent/login',
  '/agent/dashboard',
  '/agent/payment-methods',
  '/dashboard',
  '/wallet',
  '/deposit',
  '/withdraw',
  '/profile',
  '/profile/verification',
  '/admin',
  '/bet-slip',
  '/games/dice',
  '/games/mines',
  '/source-games',
];

function shouldNoIndex(pathname) {
  return NOINDEX_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

const DEFAULT_SEO = {
  title: '7XBET | Sports Betting, Casino Games & Live Gaming Platform',
  description:
    '7XBET is a modern online gaming platform for sports betting, esports, live casino, slots, bonuses, secure deposits, withdrawals, and responsible play. 18+ only.',
  keywords:
    '7XBET, online betting, sports betting, live casino, slots, esports, casino games, Bangladesh gaming platform, 7xbet asia',
};

const SEO_BY_PATH = {
  '/': {
    title: '7XBET | Online Sports Betting, Casino & Live Games',
    description:
      'Join 7XBET for sports betting, esports, live casino, slots, fast account access, secure wallet options, bonuses, and responsible online gaming. 18+ only.',
  },
  '/games': {
    title: 'Online Games | 7XBET Casino & Original Games',
    description:
      'Explore 7XBET games, original casino-style games, live experiences, smooth mobile play, and secure account access. Play responsibly. 18+ only.',
  },
  '/sports': {
    title: 'Sports Betting | 7XBET Live Sports Odds',
    description:
      'Follow sports markets on 7XBET with a fast desktop and mobile betting experience, secure wallet tools, and responsible gaming controls. 18+ only.',
  },
  '/esports': {
    title: 'Esports Betting | 7XBET',
    description:
      'Discover esports betting markets on 7XBET with a smooth interface, account security, and responsible online gaming guidance. 18+ only.',
  },
  '/live-casino': {
    title: 'Live Casino | 7XBET',
    description:
      'Experience 7XBET live casino pages with fast navigation, secure accounts, wallet support, and responsible gaming information. 18+ only.',
  },
  '/slots': {
    title: 'Slots Games | 7XBET',
    description:
      'Browse slot games on 7XBET with mobile-friendly design, secure account access, bonuses, and responsible play guidance. 18+ only.',
  },
  '/crash': {
    title: '7X Crush Game | 7XBET',
    description:
      'Play the 7XBET crash-style 7X Crush game with a fast interface, secure wallet access, and responsible gaming limits. 18+ only.',
  },
  '/bonuses': {
    title: 'Bonuses & Promotions | 7XBET',
    description:
      'View 7XBET bonus offers, welcome bonus information, cashback, VIP rewards, promotion rules, and responsible bonus usage. 18+ only.',
  },
  '/bonuses/welcome-bonus': {
    title: 'Welcome Bonus | 7XBET',
    description:
      'Learn about the 7XBET welcome bonus, account registration, bonus rules, wagering information, and responsible play guidance. 18+ only.',
  },
  '/bonuses/cashback': {
    title: 'Cashback Offers | 7XBET',
    description:
      'Explore 7XBET cashback information, eligibility rules, wallet flow, and responsible gaming reminders. 18+ only.',
  },
  '/bonuses/vip': {
    title: 'VIP Rewards | 7XBET',
    description:
      'Discover 7XBET VIP reward information, loyalty benefits, account security, and responsible play guidance. 18+ only.',
  },
  '/tournaments': {
    title: 'Tournaments | 7XBET',
    description:
      'Follow 7XBET tournament pages, promotions, game events, secure account access, and responsible participation rules. 18+ only.',
  },
  '/other/promotions': {
    title: 'Promotions | 7XBET',
    description:
      'Find 7XBET promotion details, bonus terms, offer eligibility, account rules, and responsible gaming information. 18+ only.',
  },
  '/other/faq': {
    title: 'FAQ | 7XBET Help Center',
    description:
      'Read 7XBET frequently asked questions about account access, deposits, withdrawals, bonuses, security, and responsible gaming. 18+ only.',
  },
  '/other/rules': {
    title: 'Rules | 7XBET Platform Guidelines',
    description:
      'Review 7XBET platform rules for accounts, betting, deposits, withdrawals, bonuses, verification, and responsible gaming. 18+ only.',
  },
  '/customer-support': {
    title: 'Customer Support | Contact 7XBET',
    description:
      'Contact 7XBET support for account help, wallet questions, deposits, withdrawals, verification, and platform guidance. 18+ only.',
  },
  '/about-us': {
    title: 'About Us | 7XBET',
    description:
      'Learn about 7XBET, a modern online gaming platform focused on sports, casino games, secure payments, customer support, and responsible play. 18+ only.',
  },
  '/terms-and-conditions': {
    title: 'Terms and Conditions | 7XBET',
    description:
      'Read the 7XBET Terms and Conditions covering accounts, eligibility, deposits, withdrawals, bonuses, platform rules, and responsible use. 18+ only.',
  },
  '/contacts': {
    title: 'Contacts | 7XBET Support',
    description:
      'Find 7XBET contact information for support, account help, payment questions, affiliate requests, and responsible gaming assistance. 18+ only.',
  },
  '/affiliate-program': {
    title: 'Affiliate Program | 7XBET Partners',
    description:
      'Learn about the 7XBET Affiliate Program, partner standards, responsible promotion requirements, traffic quality, and business cooperation. 18+ only.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | 7XBET',
    description:
      'Read the 7XBET Privacy Policy covering account data, payments, security, cookies, verification, and user privacy rights. 18+ only.',
  },
  '/responsible-gambling': {
    title: 'Responsible Gambling | 7XBET',
    description:
      'Learn about responsible gambling at 7XBET, including age restrictions, account safety, spending control, risk awareness, and support options. 18+ only.',
  },
  '/kyc-policies': {
    title: 'KYC Policies | 7XBET Verification',
    description:
      'Review 7XBET KYC policies for identity verification, payment ownership checks, withdrawal security, fraud prevention, and compliance. 18+ only.',
  },
};

function setMetaByName(name, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setMetaByProperty(property, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setLink(rel, href) {
  if (!href) return;
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function setJsonLd(pathname, seo, canonicalUrl) {
  let tag = document.head.querySelector('#seo-jsonld');
  if (!tag) {
    tag = document.createElement('script');
    tag.setAttribute('type', 'application/ld+json');
    tag.setAttribute('id', 'seo-jsonld');
    document.head.appendChild(tag);
  }

  const graph = [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/images/brand/logo-icon-512.png`,
      image: DEFAULT_IMAGE,
      email: 'support-en@7xbet.asia',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ['7XBET Asia', '7X BET'],
      url: `${SITE_URL}/`,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: seo.title,
      description: seo.description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
  ];

  const breadcrumbPaths = pathname === '/' ? [] : pathname.split('/').filter(Boolean);
  if (breadcrumbPaths.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE_URL}/`,
        },
        ...breadcrumbPaths.map((part, index) => {
          const itemPath = `/${breadcrumbPaths.slice(0, index + 1).join('/')}`;
          return {
            '@type': 'ListItem',
            position: index + 2,
            name: part
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            item: `${SITE_URL}${itemPath}`,
          };
        }),
      ],
    });
  }

  tag.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.replace(/\/$/, '') || '/';
    const seo = { ...DEFAULT_SEO, ...(SEO_BY_PATH[pathname] || {}) };
    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;

    document.title = seo.title;
    setMetaByName('description', seo.description);
    setMetaByName('keywords', seo.keywords || DEFAULT_SEO.keywords);
    setMetaByName(
      'robots',
      shouldNoIndex(pathname)
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    setMetaByName('theme-color', '#07121d');
    setMetaByName('google-site-verification', GOOGLE_SITE_VERIFICATION);

    setLink('canonical', canonicalUrl);

    setMetaByProperty('og:site_name', SITE_NAME);
    setMetaByProperty('og:title', seo.title);
    setMetaByProperty('og:description', seo.description);
    setMetaByProperty('og:type', 'website');
    setMetaByProperty('og:url', canonicalUrl);
    setMetaByProperty('og:image', DEFAULT_IMAGE);

    setMetaByName('twitter:card', 'summary_large_image');
    setMetaByName('twitter:title', seo.title);
    setMetaByName('twitter:description', seo.description);
    setMetaByName('twitter:image', DEFAULT_IMAGE);

    setJsonLd(pathname, seo, canonicalUrl);
  }, [location.pathname]);

  return null;
}
