# 7XBET Google SEO Setup Guide

এই update Google rank guarantee করে না, কিন্তু Google যেন সাইট crawl, index এবং বুঝতে পারে তার জন্য প্রয়োজনীয় technical SEO foundation যোগ করা হয়েছে।

## নতুন/Update করা ফাইল

- `index.html` — title, description, canonical, Open Graph, Twitter Card, Organization/WebSite JSON-LD
- `src/components/SeoManager.jsx` — React route অনুযায়ী title, meta description, canonical, OG, Twitter এবং JSON-LD update
- `src/App.jsx` — `SeoManager` add করা হয়েছে
- `public/robots.txt` — public pages allow, admin/private pages disallow, sitemap location add
- `public/sitemap.xml` — public SEO pages list

## Render deploy করার পর যা করবেন

1. Google Search Console খুলুন।
2. Domain property add করুন: `7xbet.asia`।
3. DNS TXT verification complete করুন।
4. Sitemaps menu-তে submit করুন: `sitemap.xml`।
5. URL Inspection দিয়ে homepage inspect করে “Request indexing” দিন।
6. নিচের public pages গুলোও inspect করে indexing request দিন:
   - `/`
   - `/sports`
   - `/games`
   - `/live-casino`
   - `/slots`
   - `/bonuses`
   - `/about-us`
   - `/terms-and-conditions`
   - `/privacy-policy`
   - `/responsible-gambling`
   - `/kyc-policies`
7. 7-30 দিন Search Console coverage, indexing, performance এবং query report দেখুন।

## Important SEO কাজ

- Website legal pages live রাখতে হবে।
- Footer links real URLs হতে হবে, `#` না। এই package-এ legal links আগের update থেকে ঠিক করা আছে।
- Private pages যেমন admin, agent, wallet, deposit, withdraw Google index করবে না। এগুলো sitemap-এ নেই।
- Google rank দ্রুত হয় না। ভালো content, trust pages, page speed, backlinks এবং user engagement দরকার।
- Gambling/betting website হলে target country law, age restriction, KYC এবং responsible gambling content অবশ্যই পরিষ্কার রাখতে হবে।
