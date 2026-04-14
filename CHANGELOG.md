# Changelog

All notable changes to this project will be documented in this file.

## [0.6.0] - 2026-04-14

### Changed
- **Evolution system rewritten**: language + coding style based evolution replaces old stat-ratio system
  - 1st evolution (Lv.12): based on programming language (Python/Frontend/Backend/Scripting/Docs/Ops/Fullstack)
  - 2nd evolution (Lv.30): based on coding style (Craftsman/Speedster/Collaborator/Nightcoder/Scholar)
  - 102 total evolution forms across 6 species (7 first-evo × 5 second-evo per species)
- **Evolution thresholds adjusted**: Lv.16→12 (1st evo), Lv.41→30 (2nd evo) for faster progression
- **Language detection**: file extensions from Edit/Write/Read tool_input.file_path are tracked in `stats.langEdits`
- **Night activity tracking**: operations between 22:00-06:00 tracked in `stats.nightEdits`

### Migration
- Existing pets without `langEdits`/`nightEdits` auto-migrate (default to empty/0)
- Pets at Lv.12-15 will evolve as "fullstack" (thematic fallback)

## [0.5.0] - 2026-04-14

### Added
- **Pet speech bubble**: always-on bubble below pet in status line, real-time status awareness
  - `>> 疯狂Coding中... [elapsed]` — animated dots when Claude is working
  - `[ok] 任务完成了！(用时 Xm Xs)` — shown when Claude stops, with duration
  - Level-up, evolution, and stage-up notifications shown in bubble for 30s
  - Idle status: thinking (2-10min), napping (10-60min), missing you (1h+)
  - Critical alerts: hungry, sad mood, consecutive errors
  - Time-based greetings: late night, early morning, lunch time
- **Code comments system**: pet reacts to coding patterns every 5 minutes
  - No tests written? "commit 了但没 test，主人胆子真大！"
  - High activity? "主人今天好肝啊...注意身体哦！"
  - Write more than read? "主人写代码不看文档的吗？"
- **Mood reacts to code quality**
  - Bash errors: mood -2 (consecutive 3+ errors: mood -5 + sad animation)
  - Test passes: mood +5 + happy animation
  - Warnings: mood -1
- **Easter eggs**: late night reminders, idle return greetings, random daily chat (2% chance)

## [0.4.1] - 2026-04-14

### Added
- **Auto CLAUDE.md injection**: `claude-minipet init` now writes pet knowledge to `~/.claude/CLAUDE.md`, so Claude Code knows pet commands in all new sessions
- Uninstall cleanly removes the injected block without affecting user content

## [0.4.0] - 2026-04-14

### Changed
- **EXP curve reworked**: linear formula `20 + 10 * level` replaces old exponential curve — leveling is now ~10x faster
- **Base EXP rewards increased**: Edit 5→8, Bash 3→5, Read 1→2, Prompt 2→3, Commit 15→20, PR 20→30
- **Content bonus threshold lowered**: 100 chars per bonus point (was 200)

### Comparison
| Milestone | Old | New |
|---|---|---|
| Lv.2→3 | 519 EXP | 50 EXP |
| Lv.1→10 | 14,164 EXP | 720 EXP |
| Lv.1→16 (evolution) | 44,102 EXP | 1,650 EXP |

## [0.3.1] - 2026-04-14

### Fixed
- Guard against NaN/null EXP corruption in state file

## [0.3.0] - 2026-04-14

### Added
- Content-aware EXP: bonus based on tool input/output size
- OTA auto-update checker (checks npm registry every 6h)
- Mandatory email login — no offline bypass
- Resend verification code support during init

## [0.2.0] - 2026-04-14

### Added
- Cloud sync via email verification login
- Admin web dashboard with redeem codes
- Multi-frame animations (blink, feed, pat, levelup)
- DNA display in status line
- Interactive `claude-minipet init` setup flow

## [0.1.0] - 2026-04-14

### Added
- Initial release
- 6 species with DNA-based procedural generation
- 5 rarity tiers (common → shiny at 1%)
- 3-stage evolution with branching paths
- Unicode pixel art rendering in terminal
- Claude Code hooks integration (SessionStart, PostToolUse, UserPromptSubmit, Stop)
- Status line display with stats and progress bar
- Hunger/mood decay daemon
