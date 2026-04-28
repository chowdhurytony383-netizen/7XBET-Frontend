# Gamble Frontend

Frontend-only React/Vite UI prepared for real backend data. No local placeholder user, balance or test records are used in the application state.

## Run

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env` and set your backend URL.

```bash
cp .env.example .env
```

Required values:

```env
VITE_API_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=
VITE_APP_NAME=Gamble
```

## Included pages

- Login
- Registration
- Forgot password and OTP reset pages
- Email verification page
- Home
- Games
- Dice
- Mines
- Dashboard
- Wallet
- Deposit
- Withdraw
- Profile
- Profile Verification page with Full Name, Email, Phone, Date of birth, Address, Street, City, Post code, Documents Type, Document-Number and document upload inputs
- Admin overview
- Admin users
- Admin user details
- Admin deposits
- Admin withdrawals

## Backend endpoints expected

Existing user/game/wallet endpoints are called from `src/api/auth.js`, `src/api/account.js`, and `src/api/games.js`.

Additional backend endpoints expected for the new pages:

```txt
GET    /api/user/verification
POST   /api/user/verification
PATCH  /api/user/verification
GET    /api/admin/overview
GET    /api/admin/users
GET    /api/admin/users/:userId
PATCH  /api/admin/users/:userId
PATCH  /api/admin/users/:userId/status
PATCH  /api/admin/users/:userId/verification
GET    /api/admin/deposits
PATCH  /api/admin/deposits/:transactionId/status
GET    /api/admin/withdrawals
PATCH  /api/admin/withdrawals/:transactionId/status
GET    /api/admin/transactions
GET    /api/admin/games
PATCH  /api/admin/games/:gameId
```

Admin navigation appears only when the authenticated user has `role: "admin"`, `isAdmin: true`, or `permissions` containing `admin`.

## Routing note

- `/` Home page and `/games` game lobby are public and load before login.
- `/games/dice`, `/games/mines`, dashboard, wallet, deposit, withdraw, profile, verification and admin pages require login.
- Topbar and sidebar hide wallet/user controls until the backend confirms an active user session.

## Home sports section backend endpoints

```txt
GET    /api/sports/categories
GET    /api/sports/live-matches
GET    /api/sports/match-of-the-day
```

Sports category fields supported by frontend: `_id`, `id`, `slug`, `name`, `displayName`, `image`, `icon`, `logo`.

Live match fields supported by frontend: `_id`, `id`, `country`, `league`, `tournament`, `status`, `homeTeam`, `awayTeam`, `score`, `scores`, `markets`, `odds`, `mainOdds`, `moreMarkets`, `startTime`, `dateTime`, `kickoffTime`, `matchTime`.


## Added public sidebar routes

These pages are available from the sidebar without login and are ready to receive backend/admin-panel content:

- `/sports`
- `/esports`
- `/bet-slip`
- `/crash`
- `/live-casino`
- `/slots`
- `/betongames`
- `/bonuses`
- `/bonuses/welcome-bonus`
- `/bonuses/cashback`
- `/bonuses/vip`
- `/tournaments`
- `/other`
- `/other/promotions`
- `/other/faq`
- `/other/rules`
- `/customer-support`

The sidebar menu is controlled from:

```txt
src/components/Sidebar.jsx
src/components/Sidebar.css
```

The router is controlled from:

```txt
src/App.jsx
```


## Registration methods

The registration page supports three backend-ready flows:

```txt
POST   /api/user/register
POST   /api/user/one-click-register
GET    /api/auth/google
GET    /api/auth/facebook
GET    /api/auth/google/callback
GET    /api/auth/facebook/callback
```

For Google/Facebook registration, the frontend redirects the browser to the backend OAuth start URL. After successful OAuth, the backend should set the session cookie and redirect the user back to the frontend home page or dashboard.

Optional environment overrides:

```env
VITE_GOOGLE_AUTH_URL=https://your-backend.com/api/auth/google
VITE_FACEBOOK_AUTH_URL=https://your-backend.com/api/auth/facebook
```
