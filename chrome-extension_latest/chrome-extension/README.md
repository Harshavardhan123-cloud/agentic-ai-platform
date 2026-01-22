# LeetCode AI Chrome Extension

A powerful Chrome extension that automatically generates code solutions when visiting coding websites like LeetCode, HackerRank, and CodeForces.

## Features

- 🧠 **AI-Powered Solutions** - Generates complete, working code
- 🌐 **Multi-Site Support** - Works on LeetCode, HackerRank, CodeForces
- 🎯 **8 Languages** - Python, JavaScript, Java, C++, C#, Go, Rust, TypeScript
- 📋 **One-Click Copy** - Easy solution copying
- 🎨 **Beautiful Dark UI** - Modern glassmorphism design

## Installation

### Load as Unpacked Extension (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `chrome-extension` folder from this project
5. The extension icon should appear in your toolbar

## Usage

1. Visit a coding problem on:
   - [LeetCode](https://leetcode.com/problems/)
   - [HackerRank](https://www.hackerrank.com/challenges/)
   - [CodeForces](https://codeforces.com/problemset/)

2. Click the **LeetCode AI** extension icon in your toolbar

3. Click **"Extract Problem"** to get the problem from the page

4. Select your preferred programming language

5. Click **"Generate Solution"** to get the AI-generated code

6. Use the copy button to copy the solution!

## Supported Languages

| Language | Extension |
|----------|-----------|
| Python | `.py` |
| JavaScript | `.js` |
| Java | `.java` |
| C++ | `.cpp` |
| C# | `.cs` |
| Go | `.go` |
| Rust | `.rs` |
| TypeScript | `.ts` |

## Backend API

The extension connects to the Agentic AI Platform backend:
- **API**: `https://agentic-ai-platform-1-e7zu.onrender.com`
- **Auth**: Auto-login with demo credentials

## Troubleshooting

### "Could not connect to page"
- Refresh the coding website page
- Make sure you're on a problem page (not the homepage)

### "Could not extract problem"
- Wait for the page to fully load
- Try clicking "Extract Problem" again

### "Authentication failed"
- The backend might be sleeping (free tier)
- Wait 30 seconds and try again

## File Structure

```
chrome-extension/
├── manifest.json      # Extension configuration
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── content.js         # Page content extraction
├── styles.css         # Popup styles
├── content-styles.css # Injected page styles
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## License

MIT License - Part of Agentic AI Platform
