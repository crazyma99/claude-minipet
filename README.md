# 🐾 Claude MiniPet

> [!IMPORTANT]
> **隐私声明：** 本项目所有 Hooks 仅用于宠物状态（经验、心情、饱食度等）的娱乐性监测，**不会读取、存储或传输你的任何代码内容、文件内容或对话内容。** 所有数据处理均在本地端侧完成，云同步仅上传宠物状态数值（等级、经验、统计计数等），不包含任何源码或隐私信息。项目完全开源，欢迎审查代码。

一只住在 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 终端里的虚拟宠物。在你编程时它会陪伴在终端底部，随着你的 coding 活动获得经验、升级、进化。

> **前提条件：** 本工具是 Claude Code 的扩展插件，需要先安装 Node.js 和 Claude Code。

**[English](README_EN.md)**

<p align="center">
  <img src="show.png" alt="Claude MiniPet 截图" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude_Code-TUI-6c5ce7" />
  <img src="https://img.shields.io/badge/License-MIT-blue" />
</p>

## 环境准备

### 1. 安装 Node.js

前往 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本（>=18），或使用包管理器：

```bash
# macOS (Homebrew)
brew install node

# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows (winget)
winget install OpenJS.NodeJS.LTS
```

### 2. 安装 Claude Code

参考 [Claude Code 官方文档](https://docs.anthropic.com/en/docs/claude-code)：

```bash
npm install -g @anthropic-ai/claude-code
```

## 安装 MiniPet

```bash
npm install -g claude-minipet && claude-minipet init
```

一条命令完成安装和配置，交互式引导流程：

```
🐾 欢迎使用 Claude MiniPet!

📧 请输入你的邮箱: you@example.com
📤 发送验证码中...
✅ 验证码已发送到你的邮箱

🔑 请输入验证码 (输入 r 重新发送): 483721
✅ 登录成功!

✨ 一只新的宠物诞生了! ✨
种族: 壳龙 (Shelldragon)
稀有度: ★★★ [传说]
🧬 DNA: A3-F7-2B-E1-8C-D4-09-5F

✅ Claude Code hooks 已配置
✅ 守护进程已启动
☁️ 宠物数据已上传到云端

重启 Claude Code 就能看到你的宠物了! 🎉
```

## 使用

```bash
claude-minipet status            # 查看宠物详细状态
claude-minipet feed              # 喂食（饱食度 +30）
claude-minipet pat               # 摸摸（心情 +10，亲密 +2）
claude-minipet rename <名字>     # 给宠物改名
claude-minipet redeem <兑换码>   # 兑换码兑换宠物
claude-minipet hatch <DNA码链>   # 配对孵化新宠物（需 LV8）
claude-minipet sync              # 手动同步云端数据
```

日常使用不需要手动操作 — 宠物会在你用 Claude Code 编程时自动获得经验、升级、进化，数据自动同步到云端。

## 兑换码

```bash
claude-minipet redeem XXXX-XXXX-XXXX
```

兑换后当前宠物会被替换为新宠物（Lv.1 重新培养）。兑换码由管理员生成分发。

## 配对孵化

宠物达到 **LV8** 后解锁，使用好友的 DNA 码链进行同品种配对，孵化全新宠物：

```bash
claude-minipet hatch F8-4B-FC-04-C0-23-4E-4F
```

- 仅支持**同品种**配对，不同品种会提示孵化失败
- 每次孵化生成全新 DNA，稀有度独立随机：普通(60%) / 优秀(25%) / 稀有(10%) / 传说(4%) / 异色(1%)
- 孵化完成后可选择是否替换当前宠物（替换后从 LV1 开始）

## 特性

- **🎲 程序化生成** — 每只宠物独一无二，基于 DNA 系统随机生成外观
- **🐱 6 个种族** — 位猫、壳龙、码史莱姆、吉狐、虫枭、像素精灵，各有专属被动技能
- **✨ 5 级稀有度** — 普通(60%) / 优秀(25%) / 稀有(10%) / 传说(4%) / 异色(1%)
- **📈 养成系统** — 等级、经验、心情、饱食度、亲密度
- **🧬 进化分支** — 3 阶段进化，编程习惯决定进化方向
- **🎨 像素画渲染** — Unicode 半块字符 + ANSI 24-bit 真彩色
- **💫 多帧动画** — 眨眼、进食、升级、进化等动态效果
- **☁️ 云端同步** — 邮箱登录，数据自动同步，跨设备使用
- **💬 宠物气泡** — 实时语音气泡，显示工作状态、评语、彩蛋
- **🧠 AI 感知** — 新会话自动识别宠物命令，说"喂宠物"即可执行
- **💓 心跳监测** — 客户端每 60 秒上报心跳，服务端实时追踪在线状态和客户端版本

## 宠物气泡

状态栏底部始终显示一个实时气泡，宠物会根据当前状态"说话"：

```
╭────────────────────────────────────────────────╮
│ >> 疯狂Coding中... [3m25s]                     │  ← Claude 工作中
╰────────────────────────────────────────────────╯

╭────────────────────────────────────────────────╮
│ [ok] 任务完成了！ (用时 5分12秒)               │  ← Claude 停止时
╰────────────────────────────────────────────────╯
```

宠物还会根据你的编码行为吐槽或鼓励：
- 只 commit 不写测试 → "主人又在裸奔了..."
- 连续报错 → "又炸了...宠物捂脸"
- 深夜编码 → "都这么晚了，主人该休息了"
- 长时间离开后回来 → "主人回来啦！宠物想你了~"

## 经验获取

| 事件 | 基础经验 | 内容加成 |
|------|---------|---------|
| 发送消息 | +3 | +1/100字符 |
| Bash 命令 | +5 | +1/100字符 |
| 编辑/写入文件 | +8 | +1/100字符 |
| 读取文件 | +2 | +1/100字符 |
| 测试通过 | +15 | +1/100字符 |
| Git commit | +20 | +1/100字符 |
| 创建 PR | +30 | +1/100字符 |

内容加成上限 +50，大文件操作获得更多经验。

## 种族

| 种族 | 被动技能 |
|------|---------|
| 🐱 位猫 Bitcat | 读文件时特别开心 |
| 🐉 壳龙 Shelldragon | Bash 命令双倍经验 |
| 🟢 码史莱姆 Codeslime | 升级经验需求 -20% |
| 🦊 吉狐 Gitfox | Git 操作额外经验 |
| 🦉 虫枭 Bugowl | 测试/调试双倍经验 |
| 🤖 像素精灵 Pixiebot | 心情衰减减半 |

## 进化

每个种族有 3 个进化阶段（幼年体 → 成长体 → 完全体），每阶段 2-3 个分支。进化方向取决于你的编程习惯：

- 写代码多 → 代码系进化
- 跑命令多 → 命令系进化
- 亲密度高 → 特殊进化
- 保持好心情 → 光系进化

## License

MIT
