# Google Search Console এবং Google Analytics Setup

## 1) Google Search Console

Recommended method: DNS TXT verification.

1. Google Search Console এ যান।
2. Add Property > Domain select করুন।
3. Domain দিন: `7xbet.asia`।
4. Google যে TXT record দিবে, সেটি domain DNS panel এ add করুন।
5. Verify করুন।
6. Sitemaps section এ submit করুন: `sitemap.xml`।

Alternative: HTML tag verification ব্যবহার করলে Google যে `content` value দিবে সেটি Render frontend environment variable এ দিন:

```env
VITE_GOOGLE_SITE_VERIFICATION=YOUR_GOOGLE_VERIFICATION_CONTENT
```

তারপর frontend redeploy করুন।

## 2) Google Analytics GA4

1. Google Analytics এ Web data stream create করুন।
2. Measurement ID copy করুন, example: `G-XXXXXXXXXX`।
3. Render frontend environment variable এ add করুন:

```env
VITE_GA_ID=G-XXXXXXXXXX
```

4. Frontend redeploy করুন।
5. Google Analytics Realtime report এ check করুন।

## 3) Render SPA rewrite

Frontend Static Site > Redirects/Rewrites:

```txt
Source Path: /*
Destination Path: /index.html
Action: Rewrite
```
