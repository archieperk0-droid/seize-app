# Seize the Day — Phase 1 Deployment

## What's in this build

Phase 1 is the **Dashboard** — fully spec'd, fully working. Calendar, Projects, Habits, Focus, and Settings are placeholder views with their build specs visible so you remember what's coming.

### Phase 1 features (all live)
- **Day navigator** with Day/Week toggle
- **Signal tasks** (3 must-dos) with bank picker — pulls from project tasks or accepts one-offs
- **Auto-roll-with-confirm** for unfinished signals when the date changes
- **Daily to-do** scratchpad (the noise list) with archive prompt
- **Daily notes** in italic Fraunces
- **Strategy banner** (editable inline)
- **Project cards** showing Klayr (renamed from Trades CRM) and Oswin
- **Discipline streak widget** for Gym, Football, Muay Thai, Meditation
- **Reminders widget** with native push when installed as PWA
- **Quote of the day overlay** — paper editorial style, 40 quotes seeded (stoic + modern), favourite system, app-open streak counter
- **Service worker** for offline caching and lock-screen notifications
- **PWA manifest** with deep links (?view=calendar etc.)

## Files in this folder
```
index.html          — the app
manifest.json       — PWA install metadata
service-worker.js   — offline + notifications
icon-192.png        — Android home screen icon
icon-512.png        — high-res app icon
icon-180.png        — iOS home screen icon
DEPLOY.md           — this file
```

## To get it on your phone (5 minutes)

### Step 1 — Push to GitHub Pages
1. Create a new public repo at https://github.com/new — name it whatever you like
2. Click "Add file → Upload files"
3. Drag all 6 files from this folder into the upload area
4. Commit changes
5. Go to repo Settings → Pages
6. Source: Deploy from branch → main → root → Save
7. Wait ~60s, your URL will be `https://YOURUSERNAME.github.io/REPONAME/`

### Step 2 — Install on iPhone
1. Open the URL in Safari (must be Safari, not Chrome)
2. Tap Share button (box with arrow up)
3. Scroll to "Add to Home Screen"
4. Confirm name: "Seize"
5. Tap Add

The "Seize" app icon now lives on your home screen.

### Step 3 — Enable notifications
1. Open the app from the home screen
2. Go to Settings tab
3. Tap "Enable Notifications"
4. Allow when iOS asks
5. Reminders fire to your lock screen

## To update the app
Edit `index.html` in the GitHub repo → commit. Your phone auto-pulls the new version on next open.

## Phase 2 — Calendar (next)
- Month grid with accordion week expansion
- Reminder bells per token (5/10/30 min presets + custom)
- Day notes
- CSV / Google Sheets paste import
- .ics export

Ping me when you're ready to build it.
