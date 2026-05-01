# MarketPLC — Full Project Handoff Document

> Written on 2026-04-23. This document is for any AI assistant (or human) picking up this project. Read everything before touching any code.

---

## 1. What Is This Project?

**MarketPLC** is a geo-social commerce platform — think Twitter meets Google Maps meets a local business directory. It allows:

- **Traders** (businesses) to post updates, deals, events, and announcements that are visible to nearby users on a live feed and map.
- **Urban Explorers** (regular users) to discover local businesses, save posts, comment, and interact with nearby content.
- All users have a **public profile page** shareable via a link (`/u/[username]`).

The core vision is a **local attention economy** — businesses buy attention from nearby users, and eventually an AI ad-routing system targets the right users based on their interests and location.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, `src/` structure) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + custom CSS variables |
| **Database & Auth** | Supabase (PostgreSQL + Row Level Security + Auth) |
| **Deployment** | Vercel |
| **Maps** | Mapbox GL JS |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |
| **Design System** | "Minimal Monochrome + Blue" — strict light mode, no rainbow colors, no dark gradients |

---

## 3. Project Locations

There are **TWO separate projects** on this machine:

### MVP (Live)
- **Local path**: `D:\New folder\market`
- **Live URL**: `https://marketplc.vercel.app`
- **Status**: ✅ Deployed and live. This is the production app. Do NOT break this.
- **Database**: Supabase project for the MVP (ask user for credentials)

### V2 (In Development)
- **Local path**: `D:\New folder\marketplc-v2`
- **Live URL**: Not yet deployed (will be a separate Vercel project)
- **Status**: 🏗️ Scaffold created, dependencies defined, schema written. Needs Supabase project created and `.env.local` filled in.
- **Database**: Needs a NEW separate Supabase project created

---

## 4. MVP — What Was Built (Complete Feature List)

### Authentication
- Email/password signup with role selection: `explorer` or `trader`
- Traders are prompted to fill in business details during signup (name, category, location)
- Protected routes via Next.js middleware — unauthenticated users are redirected to login
- Auto-creates a `profiles` row in Supabase on signup via a database trigger

### Feed (`/feed`)
- Displays posts from traders ordered by recency
- Falls back to mock data if no real posts exist yet
- Post cards show: business name, content, images (carousel), likes, comments
- Likes and bookmarks are saved to Supabase

### Compose Post (`/compose`)
- **Traders only** (explorers see "Access Denied")
- Text content with minimum 10 words required
- Image upload: minimum 10KB, maximum 4MB, images only (no videos)
- Images stored in Supabase Storage bucket

### Comments (`CommentSection.tsx`)
- Maximum 280 characters per comment
- Image uploads allowed in comments (same 10KB–4MB limits, images only)
- Comment count is tracked on the post

### Search (`/search`)
- Currently searches **businesses only** by name and category
- Shows distance from user's location using Haversine formula
- Location permission toggle
- Category filter buttons (Food, Retail, Events, Services)
- Falls back to mock businesses if no real data

> ⚠️ **Known limitation**: Search does NOT yet search posts or users. This is Phase 2.

### Map (`/map`)
- Mapbox GL JS interactive map
- Business markers shown with pulsing ring animation
- Click a marker → business info drawer slides up
- User's GPS location shown as a dot

### Profile (`/profile`)
- Private profile page (only visible when logged in as yourself)
- Shows: avatar (uploadable), full name, username, headline, bio
- **Premium badge**: if `is_premium = true` on the profile, the name shows as a gradient + ✨ sparkle icon
- **Stats cards**: Posts Created, Saved Posts, Status (premium/explorer rank)
- **Edit Profile modal**: update full name, username (uniqueness checked), headline, bio, and social links (website, Twitter, Instagram) for traders
- **Share Hub button**: copies `https://marketplc.vercel.app/u/[username]` to clipboard with visual "Copied!" confirmation
- **Security cards** (Privacy, Devices, Visibility): visible but disabled/grayed out — placeholders for future features

### Public Profile (`/u/[username]`)
- Publicly accessible, no login required — designed for sharing
- Shows: avatar, name (with premium gradient if `is_premium`), headline, bio, role badge, Explorer Rank card
- Traders additionally see: Business Name, Category, Bio, Address, Phone, Website, Twitter, Instagram links
- If business has lat/lng stored: shows a Mapbox static map image linking to `/map`

### Saved Posts (`/saved`)
- Lists all posts the logged-in user has bookmarked
- Uses `useSavedPosts` hook to fetch from Supabase

### Analytics (`/analytics`)
- Traders only
- Shows: total post views, views last week, total engagements, engagement rate, total map navigations
- Data comes from an RPC function `get_trader_analytics` in Supabase
- Shows live list of trader's own posts with ability to create new ones

### Alerts (`/alerts`)
- Notification settings UI
- Currently UI-only — toggles are visual only, not wired to a backend preference table yet

### Menu (`/menu`)
- Navigation hub with shortcuts to all major sections
- Shows user's avatar, name, username, and "Online" badge
- Links to: Saved Posts, Analytics, Profile, Create Post (traders)

### Admin/Explore (`/explore`)
- Currently shows mock posts as an explore/discovery feed
- Not yet wired to real data

---

## 5. Database Schema (MVP)

The MVP uses **`supabase-final-schema.sql`** (located at `D:\New folder\market\supabase-final-schema.sql`).

> **IMPORTANT**: This file must be run in the Supabase SQL Editor before the new columns will work on the live app. It is safe to run multiple times (all statements use `IF NOT EXISTS` or `CREATE OR REPLACE`).

### Key tables:
- **`profiles`**: id, email, full_name, username (unique), avatar_url, role, headline, bio, is_premium, created_at
- **`business_details`**: id, profile_id, business_name, bio, category, latitude, longitude, address, phone, website_url, twitter_url, instagram_url, is_premium
- **`posts`**: id, business_id, content, image_url, likes_count, comments_count, latitude, longitude, expires_at, created_at
- **`post_images`**: id, post_id, url, alt
- **`comments`**: id, post_id, user_id, user_name, content, created_at
- **`post_likes`**: post_id, user_id
- **`bookmarks`**: post_id, user_id
- **`post_views`**: post_id, viewer_id, viewed_at
- **`store_navigations`**: business_id, user_id, navigated_at
- **`alerts`**: id, user_id, title, body, is_read, created_at

### Global Constants (`src/lib/constants.ts`):
```
SHOUT_MAX_LENGTH = 280       (max post characters)
SHOUT_MIN_WORDS = 10         (min words required in a post)
COMMENT_MAX_LENGTH = 280     (max comment characters)
USERNAME_MAX_LENGTH = 20
FULLNAME_MAX_LENGTH = 50
IMAGE_MIN_BYTES = 10240      (10KB)
IMAGE_MAX_BYTES = 4194304    (4MB)
```

---

## 6. Terminology

> **IMPORTANT**: The codebase previously used "Shout" and "Pulse" as internal names. These have been replaced in the UI. Always use:

| Old (do not use in UI) | Correct term |
|---|---|
| Shout | Post |
| Pulse (as in post) | Post |
| Saved Pulses | Saved Posts |
| Active Pulse | Online |
| Compose Shout | Create Post |

Some internal code variables are still named `SHOUT_MAX_LENGTH` etc. — these are fine to keep as code variables, just don't show them in the UI.

---

## 7. Design System Rules

**Strict "Minimal Monochrome + Blue"** — This is non-negotiable.

- ✅ White, off-white, light gray, dark gray backgrounds
- ✅ Single accent color: `--primary` (a teal/cyan blue, roughly `#8ff5ff` or similar)
- ✅ `font-display` for headings (custom display font)
- ✅ Glassmorphism cards with `backdrop-blur`
- ✅ Subtle gradient blobs in background (only primary and accent colors)
- ❌ No rainbow colors
- ❌ No colorful category badges
- ❌ No dark-mode hex values (`#1a1a2e`, `#16213e`, etc.)
- ❌ No hardcoded colors — always use CSS variables from the theme

---

## 8. File Structure (MVP)

```
D:\New folder\market\
├── src/
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── feed/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── map/page.tsx
│   │   │   ├── profile/page.tsx        ← Private profile + Edit modal
│   │   │   ├── compose/page.tsx        ← Traders only: create post
│   │   │   ├── saved/page.tsx          ← Bookmarked posts
│   │   │   ├── analytics/page.tsx      ← Trader stats
│   │   │   ├── alerts/page.tsx         ← Notification settings
│   │   │   ├── menu/page.tsx           ← Navigation hub
│   │   │   ├── explore/page.tsx        ← Discover (WIP)
│   │   │   └── u/[username]/page.tsx   ← Public profile (shareable)
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── features/
│   │   │   ├── feed/
│   │   │   │   ├── FeedList.tsx
│   │   │   │   ├── PostCard.tsx
│   │   │   │   ├── PostHeader.tsx
│   │   │   │   ├── PostBody.tsx
│   │   │   │   ├── PostActions.tsx
│   │   │   │   └── CommentSection.tsx
│   │   │   └── map/
│   │   │       ├── MapView.tsx
│   │   │       ├── BusinessMarker.tsx
│   │   │       └── MapDetailPeek.tsx
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx          ← Nav + padding for all pages
│   │   │   ├── TabNavigation.tsx       ← Mobile bottom tab bar
│   │   │   └── DesktopHeader.tsx       ← Desktop top nav
│   │   └── ui/                         ← Shadcn-style primitives
│   ├── contexts/
│   │   ├── UserContext.tsx             ← Global auth/profile state
│   │   └── SettingsContext.tsx
│   ├── hooks/
│   │   ├── useUser.ts                  ← Auth + profile hook
│   │   ├── usePosts.ts
│   │   ├── useSavedPosts.ts
│   │   ├── useBusinesses.ts
│   │   ├── useAnalytics.ts
│   │   └── useGeolocation.ts
│   ├── lib/
│   │   ├── constants.ts                ← All global limits/constants
│   │   ├── mockData.ts                 ← Fallback mock data
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── server.ts
│   ├── types/index.ts                  ← TypeScript interfaces
│   └── middleware.ts                   ← Route protection
├── supabase-final-schema.sql           ← Run this in Supabase SQL Editor
└── supabase-schema.sql                 ← Original base schema (legacy)
```

---

## 9. Known Issues & Pending Tasks (MVP)

| Issue | Status |
|---|---|
| `supabase-final-schema.sql` must be run in Supabase dashboard to activate `headline`, `bio`, `is_premium`, `website_url`, `twitter_url`, `instagram_url` columns | ⏳ Pending — user must do this manually |
| Search only finds businesses, not posts or users | ⏳ Planned for Phase 2 (v2) |
| Alerts/notification toggles are UI-only, not saved to DB | ⏳ Planned later |
| Explore page uses mock data only | ⏳ Planned later |
| No hashtag support on posts yet | ⏳ Planned for v2 |
| The `middleware.ts` file triggers a deprecation warning on Vercel (use `proxy` instead) | Low priority, cosmetic only |

---

## 10. V2 — What We Are Building Next

**Location**: `D:\New folder\marketplc-v2`

V2 is built in complete isolation from the MVP. It will be deployed as a **separate Vercel project** with a **separate Supabase project**.

### V2 Goals
1. **Interests system** — On signup, users pick categories they care about (Food, Tech, Fashion, etc.). The feed algorithm will use these to rank posts by relevance, not just distance.
2. **Hashtag engine** — When a post is created, `#hashtags` are parsed and stored in a `hashtags` table. Hashtags are clickable and searchable.
3. **Universal Search** — Search with 3 tabs: `People` (`@username` search), `Businesses`, `Posts/Hashtags`
4. **Premium system** — A `is_premium` flag gates special features. Premium visuals: gradient username text + sparkle icon.
5. **Ad marketplace** — Traders set a daily budget, target radius (km), target interests, and optionally go global. The system routes their promoted posts to the most relevant users.
6. **Location-triggered ads** — When a user enters a geofenced zone, they see ads from businesses in that zone.
7. **Premium post features** — Comments lock, likes hidden, pinned comments, promoted comments.

### V2 Setup Status
- ✅ Next.js 16 scaffold created at `D:\New folder\marketplc-v2`
- ✅ Dependencies added and `package.json` configured for port **3001**
- ✅ `.env.local` filled with real Supabase v2 credentials
- ✅ `supabase-v2-schema.sql` written with interests, hashtags, and ad targeting
- ✅ Core infrastructure built: `UserContext`, Supabase clients (SSR), Middleware
- ✅ UI foundation: `Button` component, `cn` utility, design system tokens in `globals.css`
- ✅ **Built Pages**:
    - `signup`: Captures full name and username
    - `login`: Standard email/password
    - `onboarding`: Multi-step flow for Role selection (Explorer/Trader) and Interest picking
    - `feed`: Implements **Interest-Weighted Ranking** logic
- ❌ Supabase SQL NOT yet run by user — **user must run `supabase-v2-schema.sql` in the new project's SQL Editor**
- ❌ Not yet deployed to Vercel (needs `npx vercel --prod` in the v2 folder)

### V2 Database Schema (supabase-v2-schema.sql)
Key tables added vs MVP:
- **`interests`**: Preset list (Food, Fashion, Tech, etc.) with emoji
- **`user_interests`**: Many-to-many: user ↔ interests (used for feed ranking and ad targeting)
- **`hashtags`**: Stores unique hashtag names with post count
- **`post_hashtags`**: Many-to-many: post ↔ hashtags
- **`posts`**: Extended with `is_promoted`, `promoted_radius_km`, `promoted_interests[]`, `promoted_until`, `comments_locked`, `likes_hidden`
- **`business_details`**: Extended with `ad_budget_daily`, `ad_radius_km`, `ad_target_global`

---

## 11. Business Model (Planned — Not Yet Built)

| Feature | Free | Premium |
|---|---|---|
| Create posts | ✅ | ✅ |
| Add hashtags | ❌ (just plain text) | ✅ (clickable, searchable) |
| Premium name style (gradient + ✨) | ❌ | ✅ |
| Appear in search results boosted | ❌ | ✅ |
| Promote a post (ad spend) | ❌ | ✅ |
| Target by interest/location | ❌ | ✅ |
| Pin comment to top | ❌ | ✅ |
| Lock comments on post | ❌ | ✅ |
| Hide likes on post | ❌ | ✅ |
| Social links on profile | ✅ (traders) | ✅ |
| Public profile page | ✅ | ✅ |

> **Current MVP has no payment system.** The goal right now is user acquisition — let people discover and join the app for free. Payments (likely Stripe) will be added in v2.

---

## 12. What To Do Next (Priority Order)

### Immediate (MVP)
1. **Run `supabase-final-schema.sql`** in the Supabase SQL Editor to activate the new columns on the live database.
2. Test that Edit Profile saves headline, bio, and social links correctly.
3. Test that public profile at `marketplc.vercel.app/u/[username]` loads correctly.

### V2 Setup
1. Create a new Supabase project at `supabase.com` → name it `marketplc-v2`
2. Fill in `D:\New folder\marketplc-v2\.env.local` with the new project's URL and anon key
3. Run `supabase-v2-schema.sql` in the new project's SQL Editor
4. Run `npm install` in `D:\New folder\marketplc-v2` to install new dependencies
5. Run `npm run dev` in `D:\New folder\marketplc-v2` to start on port 3001
6. Begin building the auth flow with interests selection on signup

### V2 Build Order
1. Auth pages (login + signup with interests picker step)
2. Main layout + navigation
3. Feed page (with interest-weighted ranking)
4. Compose post page (with hashtag parsing)
5. Search page (People + Businesses + Posts/Hashtags tabs)
6. Profile pages (private + public)
7. Premium system + visual treatment
8. Ad marketplace UI for traders

---

## 13. User Accounts (for Testing)
> Ask the user directly — do not hardcode credentials here.

The user has their own account on the live MVP at `marketplc.vercel.app`. They are signed up as a **Trader**.

---

## 14. Important Decisions Made

- **No "Shout" or "Pulse" in UI** — Always say "Post". Code variable names like `SHOUT_MAX_LENGTH` are fine internally.
- **No payments in MVP** — Focus on user growth first.
- **V2 is fully separate** from MVP — different Supabase project, different Vercel project.
- **Design is strictly Minimal Monochrome + Blue** — no rainbow or dark hex colors.
- **Interests system is v2-only** — MVP keeps it simple.
- **Premium flag exists in MVP DB** (`is_premium BOOLEAN`) but there is no way to set it to `true` yet from the UI — it must be set manually in Supabase dashboard for now.
- **Security cards** (Privacy, Devices, Visibility) on the profile page are intentionally disabled — they are UI placeholders for future features.
