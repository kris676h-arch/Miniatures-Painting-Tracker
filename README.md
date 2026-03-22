# ⚔ Miniatures Painting Tracker

En webapp til at holde styr på dine Warhammer miniaturer — hvilke der er malede, i gang, eller venter.

## Funktioner

- 🏰 **Fraktioner** — World Eaters, Necrons, Orks + tilføj dine egne
- 📦 **Bokse** — organiser dine miniaturer i bokse under hver fraktion
- 🎨 **Miniaturer** — tilføj, rediger og slet figurer med billeder og noter
- 🍕 **Pizza-grafer** — se fremgang for alt samlet og pr. fraktion
- 📱 **Mobilvenlig** — fungerer på telefon og tablet
- ☁️ **Supabase** — data og billeder gemt i skyen

---

## Opsætning

### 1. Klon repo og installer

```bash
git clone https://github.com/DIT-BRUGERNAVN/Miniatures-Painting-Tracker.git
cd Miniatures-Painting-Tracker
npm install
```

### 2. Opret Supabase-projekt

1. Gå til [supabase.com](https://supabase.com) og log ind
2. Klik **New project** og navngiv det `miniatures-tracker`
3. Gå til **SQL Editor** og kør hele SQL-blokken fra `src/lib/supabase.js`
   - Det opretter tabellerne `factions`, `boxes`, `miniatures`
   - Det opretter en public storage bucket til billeder
   - Det sætter åbne adgangspolitikker op

### 3. Hent dine Supabase-nøgler

I Supabase: **Project Settings → API**

- Kopiér **Project URL** (ligner: `https://abcdefgh.supabase.co`)
- Kopiér **anon public key**

### 4. Opret `.env.local`

```bash
cp .env.example .env.local
```

Åbn `.env.local` og indsæt dine nøgler:

```
VITE_SUPABASE_URL=https://DIN_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=DIN_ANON_KEY
```

### 5. Kør lokalt

```bash
npm run dev
```

Åbn [http://localhost:5173](http://localhost:5173)

---

## Deploy til Vercel (gratis hosting)

Dette er den nemmeste måde at få det live på — inkl. på telefonen.

1. Gå til [vercel.com](https://vercel.com) og log ind med GitHub
2. Klik **Add New → Project**
3. Vælg dit `Miniatures-Painting-Tracker` repo
4. Under **Environment Variables**, tilføj:
   - `VITE_SUPABASE_URL` = din Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = din anon key
5. Klik **Deploy**

Du får en URL som `https://miniatures-painting-tracker.vercel.app` — åbn den på telefonen!

### Automatisk opdatering

Hver gang du pusher til GitHub, opdaterer Vercel siden automatisk.

---

## Push til GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/DIT-BRUGERNAVN/Miniatures-Painting-Tracker.git
git push -u origin main
```

---

## Teknologi

- [React](https://react.dev) + [Vite](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [Supabase](https://supabase.com) (PostgreSQL + Storage)
- [Vercel](https://vercel.com) (hosting)
