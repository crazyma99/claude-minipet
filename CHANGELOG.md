# Changelog

All notable changes to this project will be documented in this file.

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
