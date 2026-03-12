# 🌍 WorldFelt

A calm, emotional, map-first experience. WorldFelt visualizes how people around the world are feeling in real-time on an interactive 3D globe. No likes, no followers — just raw, honest feelings shared anonymously across the planet.

![WorldFelt](https://img.shields.io/badge/WorldFelt-Live%20Global%20Emotions-0a0a0a?style=for-the-badge)

---

## 📖 Project Journey

This project evolved from a simple concept into a full-featured emotional mapping platform. Here's what we built:

### Phase 1: Foundation & Landing Page
- ✅ **Next.js 16** setup with TypeScript and Tailwind CSS 4
- ✅ **Landing page** with hero section, animated typing text
- ✅ **Custom fonts**: Exo 2, Smooch Sans, Orbitron
- ✅ **Animated background**: Dotted world map with floating emotion bubbles
- ✅ **Smooth sections**: What is WorldFelt, Experience, CTA
- ✅ **Infinite scroll animations**: Velocity-based text rows
- ✅ **Side decorations**: Floating elements and gradient orbs

### Phase 2: Interactive 3D Globe
- ✅ **MapLibre GL integration**: 3D globe with globe projection
- ✅ **Dark theme**: CARTO dark tiles, space-like atmosphere
- ✅ **Interactive markers**: Click to see feeling details
- ✅ **Auto-rotation**: Smooth globe spinning (pausable)
- ✅ **User geolocation**: Drop feelings at your current location
- ✅ **Feeling modal**: Share your emotion with custom message
- ✅ **Floating comments**: Appear on hover over globe markers

### Phase 3: Polish & UX Improvements
- ✅ **Fixed geolocation**: Fast location access with fallback
- ✅ **Icon buttons**: Clean UI with SVG icons
- ✅ **Removed authentication**: Simplified for anonymous sharing
- ✅ **Mobile responsive**: Optimized control bar and UI elements
- ✅ **Zoom controls**: Moved to center control panel
- ✅ **Fixed React warnings**: Unique keys, no duplicate IDs
- ✅ **Fixed SVG errors**: Proper circle attribute handling

### Phase 4: Backend & Database
- ✅ **PostgreSQL + Prisma**: Full database setup
- ✅ **API endpoints**: GET and POST for feelings
- ✅ **Data persistence**: All feelings saved to database
- ✅ **Auto-refresh**: Load new feelings every 30 seconds
- ✅ **Validation**: Coordinate and field validation
- ✅ **Vercel deployment**: Automatic Prisma generation

---

## ✨ Features

### 🌐 Landing Page
- **Hero section** with animated typing effect
- **Dotted world map** background with emotion markers
- **Smooth scroll sections** with Framer Motion animations
- **Infinite text rows** that respond to scroll velocity
- **Responsive design** for all screen sizes

### 🗺️ Interactive Globe
- **3D rotating globe** with MapLibre GL
- **Real-time feelings** from around the world
- **Click markers** to see detailed messages
- **Drop your own feeling** at your location
- **8 emotion types**: hopeful, peaceful, grateful, tender, calm, reflective, anxious, tired
- **Control panel**: Rotation toggle, reset view, zoom controls, random feeling
- **Auto-rotation** that pauses on interaction

### 💾 Backend
- **PostgreSQL database** with Prisma ORM
- **RESTful API** for feelings (GET/POST)
- **Data validation** for coordinates and fields
- **Auto-refresh** every 30 seconds
- **Performance optimized** (last 100 feelings)

---

## 🎨 Emotion System

| Emotion | Color | Emoji | Use Case |
|---------|-------|-------|----------|
| 😊 Hopeful | Cyan (#22d3ee) | ✨ | Optimism, new beginnings |
| 🌸 Peaceful | Purple (#a78bfa) | 🌸 | Calm, serenity |
| 💚 Grateful | Green (#34d399) | 💚 | Thankfulness, appreciation |
| 🌷 Tender | Pink (#fb7185) | 🌷 | Softness, vulnerability |
| 🌊 Calm | Sky Blue (#38bdf8) | 🌊 | Tranquility, stillness |
| 🌅 Reflective | Amber (#fbbf24) | 🌅 | Contemplation, thinking |
| 💭 Anxious | Rose (#f472b6) | 💭 | Worry, nervousness |
| 🌙 Tired | Slate (#94a3b8) | 🌙 | Exhaustion, fatigue |

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16.1.1 with React 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4
- **Animations**: [Framer Motion](https://www.framer.com/motion/) 12
- **3D Globe**: [MapLibre GL](https://maplibre.org/) 5.15.0
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/) 5.22.0
- **Language**: TypeScript 5
- **Fonts**: Google Fonts (Exo 2, Smooch Sans, Orbitron)
- **Icons**: Lucide React
- **Map Data**: CARTO Dark tiles

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/pnpm/yarn
- **PostgreSQL** database (local or hosted)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/worldFelt.git
   cd worldfelt
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up your database** (see [Database Setup](#-database-setup) below)

4. **Create `.env` file** in the root:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/worldfelt?schema=public"
   ```

5. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

6. **Push database schema**:
   ```bash
   npm run prisma:push
   ```

7. **Start development server**:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

---

## 💾 Database Setup

### Option 1: Docker (Recommended)

```bash
docker run --name worldfelt-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=worldfelt \
  -p 5432:5432 \
  -d postgres:16
```

Your `DATABASE_URL`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/worldfelt?schema=public"
```

### Option 2: Hosted Services

Use one of these PostgreSQL hosting providers:

- **[Vercel Postgres](https://vercel.com/storage/postgres)** - Easiest if deploying to Vercel
- **[Supabase](https://supabase.com/)** - Free tier with 500MB
- **[Railway](https://railway.app/)** - Simple PostgreSQL hosting
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL with free tier

### Database Schema

```prisma
model Feeling {
  id        Int      @id @default(autoincrement())
  latitude  Float    // User's latitude (-90 to 90)
  longitude Float    // User's longitude (-180 to 180)
  feeling   String   // Emotion type (hopeful, peaceful, etc.)
  comment   String?  // Optional message
  createdAt DateTime @default(now())
  
  @@index([createdAt])
  @@map("feelings")
}
```

### Prisma Commands

```bash
npm run prisma:generate  # Generate Prisma Client
npm run prisma:push      # Push schema to database
npm run prisma:studio    # Open database GUI
```

---

## 🔌 API Endpoints

### GET /api/feelings

Fetches the last 100 feelings from the database, ordered by newest first.

**Response**:
```json
[
  {
    "id": 1,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "feeling": "hopeful",
    "comment": "the fog cleared today",
    "createdAt": "2026-01-03T12:00:00.000Z"
  }
]
```

### POST /api/feelings

Creates a new feeling in the database.

**Request Body**:
```json
{
  "latitude": 37.7749,      // Required: -90 to 90
  "longitude": -122.4194,   // Required: -180 to 180
  "feeling": "hopeful",     // Required: emotion type
  "comment": "feeling good" // Optional: user message
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "feeling": "hopeful",
  "comment": "feeling good",
  "createdAt": "2026-01-03T12:05:00.000Z"
}
```

**Error Response** (400 Bad Request):
```json
{
  "error": "Missing required fields: latitude, longitude, feeling"
}
```

---

## 📁 Project Structure

```
WorldFelt/
├── app/
│   ├── api/
│   │   └── feelings/
│   │       └── route.ts          # API endpoints
│   ├── globe/
│   │   └── page.tsx              # Globe page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout with fonts
│   └── page.tsx                  # Landing page
├── components/
│   ├── sections/
│   │   ├── cta.tsx               # Call-to-action section
│   │   ├── experience.tsx        # Experience section
│   │   └── what-is.tsx           # What is WorldFelt section
│   └── ui/
│       ├── animated-list.tsx     # Animated list component
│       ├── floating-particles.tsx # Particle effects
│       ├── globe-header.tsx      # Globe page header
│       ├── globe-map.tsx         # Main 3D globe component
│       ├── scroll-based-velocity.tsx # Scroll-based text
│       ├── scroll-indicator.tsx  # Scroll indicator
│       ├── side-decorations.tsx  # Decorative elements
│       ├── worldfelt-background.tsx # Landing background
│       ├── worldfelt-center-text.tsx # Hero text
│       └── worldfelt-header.tsx  # Landing header
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Utility functions
├── prisma/
│   └── schema.prisma             # Database schema
├── public/
│   └── globe.svg                 # Favicon
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
├── DATABASE_SETUP.md             # Database setup guide
├── IMPLEMENTATION_SUMMARY.md     # Implementation details
└── package.json                  # Dependencies & scripts
```

---

## 🎯 Key Implementation Details

### React Key Warnings Fix
All components use unique keys combining random IDs with indices to prevent React duplicate key warnings:
- Animated lists: `{location}-{idx}`
- Scroll components: `{instanceId}-{i}`
- Dots and decorations: `{uniqueId}-{pos}-{idx}`

### SVG Circle Attribute Fix
Fixed `<circle>` SVG elements to avoid "undefined" radius errors:
- Pre-calculate radius values
- Use fallback values (`r={radius || 1}`)
- Remove invalid animation properties

### Geolocation Implementation
Fast location access with fallback:
1. First try: Low accuracy for speed
2. Second try: High accuracy with longer timeout
3. Error handling with user-friendly messages

### Mobile Optimization
- Smaller buttons: `w-9 h-9` on mobile, `sm:w-11 sm:h-11` on desktop
- Compact gaps: `gap-1` on mobile, `sm:gap-2` on desktop
- Hidden elements: Counter hidden on very small screens
- Smaller fonts and icons for mobile

### Performance Optimizations
- Limit to 100 most recent feelings
- Auto-refresh every 30 seconds (not real-time)
- Indexed database queries
- Client-side caching with sample data fallback

---

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variable:
   - `DATABASE_URL` = your PostgreSQL connection string
4. Deploy!

The `postinstall` script automatically runs `prisma generate` during build.

### Environment Variables

Required for production:
```bash
DATABASE_URL="postgresql://user:password@host:5432/worldfelt?schema=public"
```

---

## 🐛 Known Issues & Future Improvements

### Current Limitations
- **Database**: Requires manual PostgreSQL setup
- **No real-time**: 30-second refresh instead of WebSockets
- **No auth**: Anonymous only (by design)
- **Rate limiting**: Not implemented yet
- **Caching**: No Redis or CDN caching

### Potential Enhancements
- Real-time updates with WebSockets or Server-Sent Events
- Feeling filters (by type, date, location)
- Heat map visualization
- Admin dashboard
- Rate limiting for API
- Redis caching layer
- Sentiment analysis on comments
- Translation support for comments

---

## 🎨 Design Philosophy

WorldFelt is designed to feel like **Earth at night from space** — quiet, alive, and human:

- **Calm over chaos**: Subtle animations, no aggressive colors
- **Connection over content**: See you're never alone in how you feel
- **Anonymous authenticity**: No profiles, followers, or likes
- **Global perspective**: The world as one emotional landscape

---

## 🤝 Contributing

Contributions are welcome! Areas that need work:

1. **Backend improvements**: Rate limiting, caching, real-time updates
2. **Mobile UX**: Further optimization for small screens
3. **Accessibility**: ARIA labels, keyboard navigation
4. **Testing**: Unit tests, E2E tests
5. **Documentation**: API docs, component docs

---

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

## 🙏 Acknowledgments

- CARTO for beautiful dark map tiles
- MapLibre GL for amazing 3D globe capabilities
- Framer Motion for smooth animations
- The global community for inspiring this project

---

<p align="center">
  <em>A calm space to share how you feel, across the entire world.</em>
</p>

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
WorldFelt/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   └── ui/
│       └── worldfelt-background.tsx  # Main background component
├── lib/
│   └── utils.ts         # Utility functions
└── public/              # Static assets
```

## 🎭 How It Works

1. **Initial Load**: Dots with emotion messages appear one by one across the globe
2. **Continuous Updates**: Every 3 seconds, new emotion dots appear in different locations
3. **Cycling Emotions**: All 6 emotions cycle through, each with unique messages
4. **Max Display**: Up to 5 extra dots display at once (3 on mobile), oldest ones fade as new ones appear

## 🌟 Design Philosophy

WorldFelt is designed to feel like **Earth at night** — quiet, alive, and human. The background:

- Never distracts from content
- Uses soft, breathing animations
- Creates a sense of global human connection
- Maintains ~15-20% opacity to stay subtle

## 📱 Responsive Behavior

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Initial dots | 10 | 5 |
| Extra dots (max) | 5 | 3 |
| Element scale | 1x | 1.5x |

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

<p align="center">
  <em>Quiet lights scattered across the Earth at night, suggesting human presence without demanding attention.</em>
</p>
