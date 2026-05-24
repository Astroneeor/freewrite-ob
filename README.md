# Freewrite for Obsidian

A distraction-free, timer-based writing plugin for Obsidian — inspired by [freewrite](https://github.com/merouanezouaid/freewrite).

Set a timer, start writing, and don't stop until it runs out. No formatting. No editing. Just words.

---

## What is freewriting?

Freewriting is a writing technique where you write continuously for a set period without stopping to edit, correct, or judge what you've written. The goal is to silence your inner critic and let ideas flow unfiltered. It's useful for journaling, brainstorming, clearing mental clutter, or just getting unstuck.

---

## Features

- **Timer-based sessions** — default 15 minutes, with quick presets for 5, 10, and 25 minutes
- **Distraction-free editor** — full-pane textarea with no formatting toolbar, no markdown preview
- **Auto-fading toolbar** — controls fade out while the timer runs, reappear on mouse movement
- **Auto-save** — saves every 30 seconds and when the session ends, straight to your vault
- **Font size cycling** — 16 / 18 / 20 / 22 / 24 / 26 px
- **Font family cycling** — Sans-serif, Serif, Monospace, or Random
- **No-backspace mode** (optional) — prevents Backspace and Delete while the timer runs
- **Respects your theme** — works with any Obsidian theme, dark or light

---

## How to use

1. Click the **pencil icon** in the ribbon, or open the command palette and run **Freewrite: New session**
2. A new tab opens with a blank editor
3. Optionally pick a preset duration (5m / 10m / 15m / 25m) in the toolbar
4. Hit **Start** and write until the timer runs out
5. Your session is automatically saved to the `Freewrite/` folder in your vault

---

## Settings

Open **Settings → Freewrite** to configure:

| Setting | Default | Description |
|---------|---------|-------------|
| Default timer duration | 15 minutes | Session length |
| Freewrite folder | `Freewrite` | Vault folder where sessions are saved |
| No-backspace mode | Off | Prevents Backspace/Delete during a running timer |
| Disable spellcheck | On | Hides red underlines while writing |
| Default font size | 18px | Starting font size for new sessions |
| Default font family | Sans-serif | Starting font for new sessions |

---

## Installation

### From the community plugin browser (recommended)
1. Open **Settings → Community Plugins** and disable Safe Mode
2. Click **Browse** and search for **Freewrite**
3. Click **Install**, then **Enable**

### Manual install
1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Copy them into `{your vault}/.obsidian/plugins/freewrite/`
3. Enable the plugin in **Settings → Community Plugins**

---

## Tips

- Use the **New session** button (or open a new tab via the ribbon) to start a fresh session without losing the current one
- Sessions are saved as plain `.md` files — you can open, link, and search them like any other note
- Try the **No-backspace mode** for a more committed freewriting experience
- Pair with Obsidian's **Focus mode** (Ctrl+Shift+F) for maximum distraction-free writing

---

## Credits

Inspired by [freewrite](https://github.com/merouanezouaid/freewrite) by Merouane Zouaid.
