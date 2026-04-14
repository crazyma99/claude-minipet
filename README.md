# 🐾 Claude MiniPet

A virtual pet that lives in [Claude Code](https://docs.anthropic.com/en/docs/claude-code)'s terminal. It accompanies you while coding — gaining experience, leveling up, and evolving along the way.

> **Prerequisites:** This is a Claude Code extension plugin. Node.js and Claude Code must be installed first.

**[中文文档](README_ZH.md)**

<p align="center">
  <img src="show.png" alt="Claude MiniPet Screenshot" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude_Code-TUI-6c5ce7" />
  <img src="https://img.shields.io/badge/License-MIT-blue" />
</p>

## Prerequisites

### 1. Install Node.js

Download from [nodejs.org](https://nodejs.org/) (LTS >=18), or use a package manager:

```bash
# macOS (Homebrew)
brew install node

# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows (winget)
winget install OpenJS.NodeJS.LTS
```

### 2. Install Claude Code

See [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code):

```bash
npm install -g @anthropic-ai/claude-code
```

## Install MiniPet

```bash
npm install -g claude-minipet && claude-minipet init
```

The interactive guide walks you through email login, pet creation, and hook setup:

```
🐾 Welcome to Claude MiniPet!

📧 Enter your email: you@example.com
📤 Sending verification code...
✅ Code sent to your email

🔑 Enter code: 483721
✅ Login successful!

✨ A new pet is born! ✨
Species: Shelldragon
Rarity: ★★★ [Legendary]
🧬 DNA: A3-F7-2B-E1-8C-D4-09-5F

✅ Claude Code hooks configured
✅ Daemon started
☁️ Pet data uploaded to cloud

Restart Claude Code to see your pet! 🎉
```

## Usage

```bash
claude-minipet status            # View pet details
claude-minipet feed              # Feed pet (hunger +30)
claude-minipet pat               # Pat pet (mood +10, bond +2)
claude-minipet rename <name>     # Rename pet
claude-minipet redeem <code>     # Redeem a pet code
claude-minipet sync              # Sync cloud data
```

No manual action needed during daily use — your pet gains EXP, levels up, and evolves automatically as you code with Claude Code.

## Redeem Codes

```bash
claude-minipet redeem XXXX-XXXX-XXXX
```

Your current pet will be replaced with a new Lv.1 pet. Codes are generated and distributed by administrators.

## Features

- **🎲 Procedural Generation** — Every pet is unique, generated via a DNA system
- **🐱 6 Species** — Bitcat, Shelldragon, Codeslime, Gitfox, Bugowl, Pixiebot, each with passive bonuses
- **✨ 5 Rarity Tiers** — Common(60%) / Uncommon(25%) / Rare(10%) / Legendary(4%) / Shiny(1%)
- **📈 Nurture System** — Level, EXP, Mood, Hunger, Bond
- **🧬 Evolution Branches** — 3-stage evolution, your coding habits decide the path
- **🎨 Pixel Art Rendering** — Unicode half-blocks + ANSI 24-bit true color
- **💫 Multi-frame Animation** — Blink, eat, level up, evolve effects
- **☁️ Cloud Sync** — Email login, auto-sync, cross-device support

## EXP Gain

| Event | EXP |
|-------|-----|
| Send message | +2 |
| Bash command | +3 |
| Edit/Write file | +5 |
| Read file | +1 |
| Test passes | +10 |
| Git commit | +15 |
| Create PR | +20 |

## Species

| Species | Passive Bonus |
|---------|--------------|
| 🐱 Bitcat | Happy when reading files |
| 🐉 Shelldragon | 2x EXP from Bash commands |
| 🟢 Codeslime | -20% EXP to level up |
| 🦊 Gitfox | Extra EXP from Git ops |
| 🦉 Bugowl | 2x EXP from tests |
| 🤖 Pixiebot | Half mood decay |

## Evolution

Each species has 3 evolution stages (Baby → Growth → Final) with 2-3 branches per stage. Evolution direction depends on your coding habits:

- Write more code → Code-type evolution
- Run more commands → Command-type evolution
- High bond → Special evolution
- Stay happy → Light-type evolution

## License

MIT
