import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  HeartHandshake,
  Info,
  Mail,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import './StaticInfoPage.css';

const COMPANY_LEGAL_INFO = [
  '7XBET ASIA is operated by CrownGate Digital SARL.',
  'Licence / Authorisation No: 009932/A/MINAT/SG/DAP/SDLP/SJ.',
  'Licensing Authority: Agence de Regulation des Jeux, under the Ministry of Territorial Administration, Republic of Cameroon.',
  'Registered Address: 2MWV+62R, Rue des Écoles, Douala, Cameroon.',
  'Licensed Domain: https://7xbet.asia.',
  'Licensed Activity: Online betting, online games, and lottery.',
  'Licence Validity: From 27 April 2026 to 26 April 2031.',
  'Licence Conditions: AML, data protection, online payment compliance, and related regulatory requirements.',
];

const LEGAL_PAGES = {
  about: {
    eyebrow: 'Company',
    title: 'About Us',
    subtitle:
      '7XBET is built as a modern online betting and gaming platform for players who want a fast, secure, and easy experience across desktop and mobile devices.',
    icon: Info,
    updated: 'Last updated: May 2026',
    highlights: [
      'Sports, esports, live casino, slots, and original game experiences in one platform.',
      'Responsive interface designed for both desktop and mobile users.',
      'Account, wallet, deposit, withdrawal, and verification flows built with user safety in mind.',
    ],
    sections: [
      {
        heading: 'Company and licence information',
        body: COMPANY_LEGAL_INFO,
      },
      {
        heading: 'Who we are',
        body: [
          '7XBET is an online entertainment platform focused on sports betting, casino-style games, and digital wallet services. Our goal is to provide a smooth user journey from registration to gameplay, deposits, withdrawals, profile management, and customer support.',
          'The platform is designed for users who are legally permitted to participate in online gaming activities in their location. Every user is responsible for confirming that access to 7XBET is allowed under the rules and laws that apply to them.',
        ],
      },
      {
        heading: 'Our service approach',
        body: [
          'We focus on simple navigation, quick access to games, transparent account information, secure payment handling, and clear support channels. The platform is continuously improved to make the user experience faster, safer, and more reliable.',
          '7XBET may provide access to sports markets, casino content, live casino content, promotional offers, loyalty rewards, and original games. Availability can vary by region, account status, verification level, payment method, and platform rules.',
        ],
      },
      {
        heading: 'Security and fairness',
        body: [
          'User protection is an important part of the 7XBET experience. We use account security practices, transaction monitoring, verification checks, and responsible gambling controls to help reduce unauthorized access, payment misuse, underage access, and abusive activity.',
          'Users should always keep their login information private, use strong passwords, and contact support immediately if they notice suspicious account activity.',
        ],
      },
    ],
  },

  terms: {
    eyebrow: 'Legal',
    title: 'Terms and Conditions',
    subtitle:
      'These Terms and Conditions explain the rules for creating an account, using 7XBET services, placing bets, receiving bonuses, making payments, and interacting with the platform.',
    icon: FileText,
    updated: 'Last updated: May 2026',
    highlights: [
      'Users must be legally eligible and must provide accurate account information.',
      'Deposits, withdrawals, bonuses, and bets are subject to platform rules and verification checks.',
      '7XBET may restrict, suspend, or close accounts that violate these terms or create security risk.',
    ],
    sections: [
      {
        heading: 'Company, operator, and licence',
        body: [
          'This website is operated under the brand name 7XBET ASIA by CrownGate Digital SARL.',
          'Licence / Authorisation No: 009932/A/MINAT/SG/DAP/SDLP/SJ.',
          'Licensing Authority: Agence de Regulation des Jeux, under the Ministry of Territorial Administration, Republic of Cameroon.',
          'Registered Address: 2MWV+62R, Rue des Écoles, Douala, Cameroon.',
          'Website / Domain: https://7xbet.asia.',
          'Authorised Activity: Online betting, online games, and lottery.',
          'Validity Period: From 27 April 2026 to 26 April 2031.',
          'The operator is required to follow applicable AML, data protection, online payment compliance, and other regulatory conditions.',
        ],
      },
      {
        heading: '1. Acceptance of terms',
        body: [
          'By registering, logging in, placing a bet, making a deposit, requesting a withdrawal, claiming a bonus, or using any 7XBET service, you agree to follow these Terms and Conditions, the Privacy Policy, KYC Policies, Responsible Gambling Policy, bonus rules, game rules, and any other rules displayed on the website.',
          'If you do not agree with these terms, you must not create an account or use the platform. 7XBET may update these terms when needed. Continued use of the platform after an update means you accept the updated version.',
        ],
      },
      {
        heading: '2. Eligibility',
        body: [
          'You may use 7XBET only if you are at least 18 years old, or older if a higher minimum age applies in your location. You must also be legally allowed to access online betting or gaming services under the laws that apply to you.',
          'It is your responsibility to check local rules before using the platform. 7XBET may refuse registration, close accounts, void bets, cancel bonuses, or reject payments where eligibility requirements are not satisfied.',
        ],
      },
      {
        heading: '3. Account registration and security',
        body: [
          'Each user may hold only one personal account unless 7XBET gives written approval. You must provide accurate, complete, and current information during registration and account verification.',
          'You are responsible for keeping your username, password, email, phone number, authentication code, and device access secure. Any activity performed through your account may be treated as your activity unless 7XBET determines that unauthorized access occurred.',
        ],
      },
      {
        heading: '4. Deposits and withdrawals',
        body: [
          'Deposits must be made through payment methods made available on the website. You must follow the instructions shown in the deposit popup or payment page, including minimum and maximum limits, reference numbers, transaction IDs, wallet addresses, and required notes.',
          'Withdrawals may require account verification, payment ownership checks, wagering review, fraud screening, and security approval. 7XBET may delay or reject a withdrawal where account information is incomplete, suspicious activity is detected, bonus conditions are not met, or legal/compliance checks are required.',
        ],
      },
      {
        heading: '5. Bets, games, results, and errors',
        body: [
          'Bets are accepted only when confirmed by the platform. Odds, game outcomes, settlement status, and market availability may change. 7XBET may void or correct bets affected by technical errors, obvious pricing mistakes, incorrect results, interrupted games, duplicate transactions, system abuse, or provider-side issues.',
          'Users must not attempt to manipulate games, exploit bugs, use bots, automate betting, abuse latency, collude with other users, or interfere with the platform. Any such conduct may result in account restriction, balance review, voided bets, confiscation of improper gains, or account closure.',
        ],
      },
      {
        heading: '6. Bonuses and promotions',
        body: [
          'Bonus offers are optional and may include eligibility rules, wagering requirements, minimum odds, excluded games, time limits, maximum conversion limits, and withdrawal restrictions. The specific rules displayed with each promotion form part of these Terms and Conditions.',
          '7XBET may cancel a bonus or related winnings if the offer is abused, claimed with duplicate accounts, used with incorrect information, used with suspicious payment activity, or used in a way that violates bonus rules.',
        ],
      },
      {
        heading: '7. Account restriction and closure',
        body: [
          '7XBET may suspend, restrict, review, or close an account if we identify identity mismatch, underage use, prohibited location access, payment abuse, chargeback risk, duplicate accounts, bonus abuse, account selling, fraud, harassment, technical manipulation, or any activity that creates legal, security, financial, or operational risk.',
          'Users may request account closure by contacting support. Before closure is completed, 7XBET may require verification, balance settlement, open bet settlement, or investigation of unresolved account activity.',
        ],
      },
      {
        heading: '8. Limitation of liability',
        body: [
          '7XBET aims to keep the platform reliable, but online services can be affected by internet issues, maintenance, third-party provider downtime, payment delays, device problems, or technical errors. 7XBET is not responsible for losses caused by factors outside reasonable platform control.',
          'Nothing in these terms removes rights that cannot be excluded by applicable law. Where liability can be limited, 7XBET liability is limited to the maximum extent permitted by applicable rules.',
        ],
      },
    ],
  },

  contacts: {
    eyebrow: 'Support',
    title: 'Contacts',
    subtitle:
      'Need help with your 7XBET account, deposit, withdrawal, verification, bonus, or technical issue? Use the official support channels below.',
    icon: Mail,
    updated: 'Last updated: May 2026',
    highlights: [
      'Official support email: support-en@7xbet.asia',
      'Include your registered username, transaction ID, date, amount, and screenshot when reporting payment issues.',
      'Never share your password, OTP, private key, seed phrase, or full card details with anyone.',
    ],
    sections: [
      {
        heading: 'Operator information',
        body: [
          'Operator / Company: CrownGate Digital SARL.',
          'Licence / Authorisation No: 009932/A/MINAT/SG/DAP/SDLP/SJ.',
          'Registered Address: 2MWV+62R, Rue des Écoles, Douala, Cameroon.',
          'Official Website: https://7xbet.asia.',
          'Support Email: support-en@7xbet.asia.',
        ],
      },
      {
        heading: 'Official customer support',
        body: [
          'For account questions, payment questions, deposit or withdrawal issues, bonus questions, and technical support, contact us at support-en@7xbet.asia. Please provide clear details so our team can review your request properly.',
          'For faster handling, include your registered account username or user ID, the related payment method, amount, transaction ID or reference number, date and time, and a screenshot if available.',
        ],
      },
      {
        heading: 'Payment support',
        body: [
          'If your deposit is not credited, check that you followed the deposit popup instructions exactly and submitted the correct sender wallet number, transaction ID, amount, and note. If any detail was entered incorrectly, contact support with proof of payment.',
          'For withdrawal issues, make sure your account information, payment method, verification status, and bonus wagering requirements are complete. 7XBET may request additional information before approving withdrawals.',
        ],
      },
      {
        heading: 'Security support',
        body: [
          'Contact support immediately if you believe your account was accessed without permission, your password was exposed, your device was stolen, or your payment information may be compromised.',
          '7XBET will never ask for your password, OTP, seed phrase, private key, or full payment security information. Any person asking for these details should be treated as suspicious.',
        ],
      },
      {
        heading: 'Complaints and disputes',
        body: [
          'If you disagree with a bet settlement, bonus decision, transaction decision, or account action, contact support with all relevant details. We will review platform records, provider data, transaction logs, and applicable rules before responding.',
          'Users should remain respectful when contacting support. Abusive, threatening, fraudulent, or misleading communication may result in support limitations or account review.',
        ],
      },
    ],
  },

  affiliate: {
    eyebrow: 'Partners',
    title: 'Affiliate Program',
    subtitle:
      'The 7XBET Affiliate Program is designed for publishers, creators, communities, media buyers, and partners who can introduce eligible users to the platform responsibly.',
    icon: Users,
    updated: 'Last updated: May 2026',
    highlights: [
      'Promote 7XBET responsibly to eligible audiences only.',
      'Affiliate traffic must be legal, transparent, and free from misleading claims.',
      'Fraud, spam, duplicate accounts, incentive abuse, and underage targeting are prohibited.',
    ],
    sections: [
      {
        heading: 'Program overview',
        body: [
          'Approved affiliates may promote 7XBET through websites, social media, communities, campaigns, videos, banners, and other approved marketing channels. Commission structures, tracking links, creative assets, and payment rules may be provided after review and approval.',
          'Affiliate participation is not automatic. 7XBET may approve, reject, suspend, or terminate any affiliate account based on traffic quality, compliance risk, brand safety, fraud indicators, or operational requirements.',
        ],
      },
      {
        heading: 'Responsible promotion rules',
        body: [
          'Affiliates must not target minors, self-excluded users, prohibited locations, or anyone who is not legally allowed to use online betting or gaming services. Marketing must not suggest guaranteed winnings, risk-free gambling, employment income, financial investment, or a way to solve money problems.',
          'All content must be honest, clear, and brand-safe. Affiliates must avoid false bonus claims, fake reviews, unauthorized logos, copied content, misleading landing pages, impersonation, spam, malware, cookie stuffing, and any traffic method that damages user trust.',
        ],
      },
      {
        heading: 'Traffic and commission review',
        body: [
          '7XBET may review affiliate traffic, user behavior, deposits, betting activity, chargebacks, duplicate accounts, device patterns, payment risk, and other indicators before approving commissions.',
          'Commission may be adjusted, delayed, rejected, or cancelled where traffic is fraudulent, duplicated, incentivized without approval, generated through prohibited advertising, or connected to abuse of promotions, payment methods, or platform rules.',
        ],
      },
      {
        heading: 'How to apply',
        body: [
          'To discuss affiliate opportunities, contact support-en@7xbet.asia with your name, company or channel details, audience location, traffic sources, estimated monthly traffic, and the type of promotion you plan to run.',
          'Do not begin paid promotion or public campaigns using the 7XBET brand unless you have approval and the correct campaign materials.',
        ],
      },
    ],
  },

  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    subtitle:
      'This Privacy Policy explains what information 7XBET may collect, how it may be used, how it may be protected, and when it may be shared for account, payment, security, and compliance purposes.',
    icon: ShieldCheck,
    updated: 'Last updated: May 2026',
    highlights: [
      'We collect information needed to operate accounts, payments, verification, support, security, and platform improvement.',
      'Payment and verification information may be reviewed to prevent fraud, underage use, prohibited access, and financial abuse.',
      'Users should keep login details private and contact support if they suspect unauthorized access.',
    ],
    sections: [
      {
        heading: '1. Information we may collect',
        body: [
          '7XBET may collect registration details, login data, contact information, country or region indicators, device data, IP address, browser information, gameplay activity, bet history, wallet transactions, deposit and withdrawal details, support messages, bonus activity, verification documents, and security logs.',
          'We may also collect information from payment providers, game providers, fraud prevention tools, verification checks, analytics tools, customer support records, and technical systems used to operate the platform.',
        ],
      },
      {
        heading: '2. How we use information',
        body: [
          'Information may be used to create and manage accounts, process deposits and withdrawals, display balances, settle bets, provide customer support, detect fraud, verify identity, manage bonuses, improve platform performance, personalize content, maintain security, and comply with applicable requirements.',
          'We may use transaction and activity data to investigate disputes, prevent chargebacks, identify duplicate accounts, detect account takeovers, enforce terms, and protect users and the platform from misuse.',
        ],
      },
      {
        heading: '3. Cookies and similar technologies',
        body: [
          '7XBET may use cookies, local storage, session storage, pixels, analytics tools, and similar technologies to keep users logged in, remember preferences, improve page speed, detect suspicious activity, measure performance, and understand how the website is used.',
          'Users can manage some cookie controls through browser settings. Blocking essential cookies may affect login, wallet, gameplay, payment, or security functions.',
        ],
      },
      {
        heading: '4. Sharing and disclosure',
        body: [
          '7XBET may share information with service providers, payment processors, game providers, verification providers, fraud prevention partners, hosting providers, analytics providers, support tools, professional advisers, or authorities where required for platform operation, safety, dispute handling, or compliance.',
          'We do not sell account passwords or security credentials. Users should never disclose private login or payment security details to anyone claiming to represent the platform.',
        ],
      },
      {
        heading: '5. Data security and retention',
        body: [
          'We use reasonable technical and organizational safeguards to protect user information. However, no online platform can guarantee absolute security, so users should protect their accounts with strong passwords and safe device practices.',
          'Information may be retained as long as needed for account operation, legal or compliance reasons, fraud prevention, financial records, dispute resolution, responsible gambling controls, and security monitoring.',
        ],
      },
      {
        heading: '6. User requests',
        body: [
          'Users may contact support-en@7xbet.asia to request review, correction, or account-related assistance. Some information may need to be retained where required for fraud prevention, payment records, account safety, or compliance purposes.',
          'Before acting on a privacy or account request, 7XBET may need to verify the user identity to protect the account from unauthorized changes.',
        ],
      },
    ],
  },

  responsible: {
    eyebrow: 'Player Safety',
    title: 'Responsible Gambling',
    subtitle:
      '7XBET supports responsible gambling. Betting and gaming should be treated as entertainment, not as a source of income or a solution to financial problems.',
    icon: HeartHandshake,
    updated: 'Last updated: May 2026',
    highlights: [
      'Only gamble if you are legally eligible and can afford the risk.',
      'Set personal limits for time, deposits, losses, and betting activity.',
      'Contact support if you need account limits, time-out, or self-exclusion assistance.',
    ],
    sections: [
      {
        heading: 'Our responsible gambling position',
        body: [
          '7XBET is designed for adults who choose to participate in betting and gaming responsibly. Users should understand that gambling involves risk and that losses are possible. No game, bet, strategy, bonus, or prediction can guarantee profit.',
          'You should not gamble with money needed for rent, food, education, debt, healthcare, family needs, business capital, or other important expenses.',
        ],
      },
      {
        heading: 'Practical safety guidelines',
        body: [
          'Set a budget before playing and stop when that budget is reached. Do not chase losses, increase stakes emotionally, borrow money to gamble, or continue playing when stressed, tired, angry, or under the influence of alcohol or drugs.',
          'Take regular breaks and review your betting history. If gambling starts affecting your work, studies, family, sleep, mood, finances, or relationships, stop playing and seek support.',
        ],
      },
      {
        heading: 'Account limits and self-exclusion',
        body: [
          'Users may contact support to request responsible gambling assistance such as account limits, cooling-off periods, time-outs, or self-exclusion. 7XBET may apply reasonable controls to help protect users from harmful activity.',
          'If you request a restriction, do not attempt to bypass it by opening another account, using another person account, changing devices, or using another payment method.',
        ],
      },
      {
        heading: 'Underage gambling is prohibited',
        body: [
          'Users must be at least 18 years old, or older if a higher minimum age applies in their location. 7XBET may request verification and may restrict accounts where underage access is suspected.',
          'Parents and guardians should use device controls, browser controls, and payment controls to prevent minors from accessing betting or gaming websites.',
        ],
      },
    ],
  },

  kyc: {
    eyebrow: 'Verification',
    title: 'KYC Policies',
    subtitle:
      'KYC policies help protect accounts, payments, withdrawals, bonuses, and the platform from identity misuse, fraud, duplicate accounts, and unauthorized activity.',
    icon: UserCheck,
    updated: 'Last updated: May 2026',
    highlights: [
      'Users must provide accurate profile and payment information.',
      'Withdrawal and payment checks may require full name, address, document number, or additional verification.',
      'False, incomplete, or mismatched information may delay or block account actions.',
    ],
    sections: [
      {
        heading: 'Why verification may be required',
        body: [
          '7XBET may request verification to confirm user identity, payment ownership, account security, age eligibility, account ownership, and compliance with platform rules.',
          'Verification may be required before withdrawals, during account review, after suspicious activity, after payment mismatch, after duplicate account detection, or where platform risk controls require more information.',
        ],
      },
      {
        heading: 'Information that may be requested',
        body: [
          'Depending on account status and risk review, 7XBET may request full name, address, email verification, phone verification, document type, document number, payment proof, transaction screenshot, wallet information, or other reasonable information needed to review the account.',
          'Users must provide accurate and current information. Documents or details that are fake, edited, stolen, expired, mismatched, or unreadable may be rejected.',
        ],
      },
      {
        heading: 'Payment ownership checks',
        body: [
          'Deposits and withdrawals should normally be made using payment methods owned or controlled by the account holder. 7XBET may reject transactions where payment ownership cannot be verified or where third-party payment use creates risk.',
          'Users should not sell, rent, transfer, or share accounts. Account sharing or payment sharing may result in account restriction, balance review, or withdrawal delay.',
        ],
      },
      {
        heading: 'Verification review and account action',
        body: [
          '7XBET may approve, reject, or request additional information during verification review. Review time can vary depending on data quality, payment provider response, gameplay review, bonus review, and security checks.',
          'If verification is not completed, 7XBET may limit withdrawals, bonuses, payment methods, gameplay access, or account functionality where necessary to protect users and the platform.',
        ],
      },
    ],
  },
};

const PAGE_LINKS = [
  { key: 'about', label: 'About us', path: '/about-us' },
  { key: 'terms', label: 'Terms and Conditions', path: '/terms-and-conditions' },
  { key: 'contacts', label: 'Contacts', path: '/contacts' },
  { key: 'affiliate', label: 'Affiliate Program', path: '/affiliate-program' },
  { key: 'privacy', label: 'Privacy Policy', path: '/privacy-policy' },
  { key: 'responsible', label: 'Responsible Gambling', path: '/responsible-gambling' },
  { key: 'kyc', label: 'KYC Policies', path: '/kyc-policies' },
];

export default function StaticInfoPage({ pageKey = 'about' }) {
  const page = LEGAL_PAGES[pageKey] || LEGAL_PAGES.about;
  const PageIcon = page.icon || Info;

  return (
    <div className="static-info-page page-stack">
      <section className="static-info-hero">
        <div className="static-info-hero-copy">
          <span className="section-kicker">{page.eyebrow}</span>

          <div className="static-info-title-row">
            <span className="static-info-icon" aria-hidden="true">
              <PageIcon size={28} />
            </span>
            <h1>{page.title}</h1>
          </div>

          <p>{page.subtitle}</p>

          <span className="static-info-updated">{page.updated}</span>
        </div>

        <aside className="static-info-summary-card">
          <h2>Key points</h2>
          <ul>
            {page.highlights.map((item) => (
              <li key={item}>
                <BadgeCheck size={17} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="static-info-layout">
        <aside className="static-info-nav-card">
          <Link className="static-back-link" to="/">
            <ArrowLeft size={17} />
            Main page
          </Link>

          <h3>7XBET pages</h3>

          <nav aria-label="7XBET information pages">
            {PAGE_LINKS.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={item.key === pageKey ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="static-info-content">
          {page.sections.map((section) => (
            <article
              className={`static-info-section ${
                section.notice ? 'static-info-notice' : ''
              }`}
              key={section.heading}
            >
              <h2>{section.heading}</h2>

              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}