# CodeWhisper AI - Quick Start Guide

## 📦 Complete File Structure

Create this exact folder structure:

```
CodeWhisper-AI/
│
├── manifest.json          ← Extension configuration
├── background.js          ← API handler
├── content.js            ← Main logic
├── popup.html            ← Settings UI
├── popup.js              ← Settings logic
├── README.md             ← Full documentation
├── QUICKSTART.md         ← This file
│
└── icons/
    ├── icon16.png        ← 16x16 extension icon
    ├── icon48.png        ← 48x48 extension icon
    └── icon128.png       ← 128x128 extension icon
```

## ⚡ 5-Minute Setup

### 1. Create Project Folder
```bash
mkdir CodeWhisper-AI
cd CodeWhisper-AI
mkdir icons
```

### 2. Copy All Files
Copy the 5 main files into the `CodeWhisper-AI` folder:
- `manifest.json`
- `background.js`
- `content.js`
- `popup.html`
- `popup.js`

### 3. Create Simple Icon Files

**Quick Method - Using Placeholder**

Create a simple 128x128 PNG with:
- Blue background (#667eea)
- White text: `</>`
- Save as `icon128.png`

Then resize to create:
- `icon48.png` (48x48)
- `icon16.png` (16x16)

Place all three in the `icons/` folder.

**OR Use Online Tool:**
1. Go to: https://favicon.io/favicon-generator/
2. Text: `</>`
3. Background: `#667eea`
4. Font: Bold
5. Generate and download
6. Rename to `icon16.png`, `icon48.png`, `icon128.png`

### 4. Get OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **Important**: Save it securely - you can't view it again!

### 5. Load Extension in Chrome

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top-right)
4. Click **"Load unpacked"**
5. Select the `CodeWhisper-AI` folder
6. Extension loaded! ✅

### 6. Configure Extension

1. Click the puzzle icon 🧩 in Chrome toolbar
2. Find "CodeWhisper AI"
3. Click to open settings popup
4. Paste your OpenAI API key
5. Select model: **GPT-4o Mini** (recommended)
6. Click **"Test Connection"** ✓
7. Click **"Save Settings"**

### 7. Test It Out!

1. Go to: https://leetcode.com/playground/
2. In the editor, type:
   ```javascript
   // binary search function
   ```
3. Press **Enter** ⏎
4. Watch the magic happen! ✨

## 🎯 Usage Examples

### JavaScript
```javascript
// function to reverse a string

// check if array is sorted

// find max element in array
```

### Python
```python
# merge sort algorithm

# calculate fibonacci number

# validate email address
```

### Java
```java
// implement stack using array

// check if tree is balanced

// find longest palindrome substring
```

### C++
```cpp
// dijkstra shortest path

// segment tree implementation

// fast modular exponentiation
```

## 🔥 Pro Tips

1. **Be Specific**: More detailed comments = better code
   - ❌ `// sort`
   - ✅ `// merge sort with O(n log n) complexity`

2. **Include Constraints**: Mention edge cases
   - `// binary search, array is 0-indexed and sorted`

3. **Specify Return Type**: Help AI understand requirements
   - `// function returns boolean, checks if prime`

4. **Use Context**: AI reads previous lines for better results

5. **Language Hints**: AI auto-detects but you can specify
   - `// python function to calculate factorial`

## 🐛 Quick Troubleshooting

### Not Working?
- ✅ Extension enabled?
- ✅ API key saved?
- ✅ "Auto-Generate" toggle ON?
- ✅ Pressed Enter after comment?
- ✅ Browser console shows errors? (F12)

### "API Key Error"
- Check key starts with `sk-`
- Verify you have OpenAI credits
- Use "Test Connection" button

### Code Not Typing?
- Try refreshing the page
- Check comment format (`//`, `#`, `/*`)
- Verify cursor is in editor

### Badge Not Showing?
- Badge appears bottom-right
- May be hidden on some sites
- Check if generation is actually running

## 📊 Cost Estimation

Using **GPT-4o Mini** (recommended):
- Cost per request: ~$0.001 - $0.005
- 100 requests: ~$0.10 - $0.50
- 1000 requests: ~$1.00 - $5.00

**Tip**: Start with $5 credit - that's 1000+ code generations!

## 🎓 Learning Path

### Day 1: Setup
- Install extension
- Configure API key
- Test on LeetCode

### Day 2: Practice
- Try 10 different prompts
- Test on multiple platforms
- Adjust typing speed

### Day 3: Master
- Use context-aware features
- Optimize prompts
- Share with friends!

## 🌟 Best Practices

### DO:
- ✅ Use descriptive comments
- ✅ Include complexity requirements
- ✅ Mention edge cases
- ✅ Test generated code
- ✅ Review and understand output

### DON'T:
- ❌ Use during actual interviews (it's cheating!)
- ❌ Blindly submit without understanding
- ❌ Share your API key
- ❌ Expect perfect code every time
- ❌ Use for malicious purposes

## 🎮 Challenge Ideas

Try generating:
1. **Data Structures**: Linked list, BST, Heap
2. **Algorithms**: DFS, BFS, Dynamic Programming
3. **Utils**: Date formatter, string manipulator
4. **Math**: GCD, LCM, Prime checker
5. **Patterns**: Singleton, Factory, Observer

## 📚 Resources

- **OpenAI Docs**: https://platform.openai.com/docs
- **Chrome Extensions**: https://developer.chrome.com/docs/extensions
- **LeetCode**: https://leetcode.com
- **HackerRank**: https://hackerrank.com

## 🎉 Success Checklist

- [ ] Extension installed
- [ ] API key configured
- [ ] Connection tested
- [ ] First code generated
- [ ] Settings customized
- [ ] Tested on 3+ platforms
- [ ] Shared with a friend

## 🚀 Next Steps

1. **Customize**: Adjust typing speed to your preference
2. **Explore**: Try on different coding platforms
3. **Optimize**: Experiment with different prompts
4. **Learn**: Study the generated code
5. **Share**: Help others set it up

## 💬 Need Help?

- Check README.md for detailed docs
- Open browser console (F12) for errors
- Test with simple prompts first
- Verify API key has credits
- Try refreshing the page

---

**Happy Coding! 🚀**

*Remember: This tool is for learning and practice. Always understand the code it generates!*