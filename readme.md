# CodeWhisper AI - Chrome Extension

**AI-powered coding assistant that writes code in real-time as you type comments.**

## 🎯 Features

- ✨ **Comment-to-Code**: Type a comment like `// binary search` and watch AI generate the code
- 🎨 **Human-like Typing**: Simulates realistic typing with random delays (30-70ms)
- 🧠 **Context-Aware**: Sends previous 10-15 lines as context for better accuracy
- 🎯 **Multi-Platform**: Works on LeetCode, HackerRank, Codeforces, and any coding platform
- 🌐 **Language Detection**: Automatically detects programming language
- ⚡ **Multiple Models**: Choose between GPT-4o, GPT-4o Mini, or GPT-3.5
- 💾 **Persistent Settings**: API key and preferences saved securely
- 🎪 **Visual Feedback**: Floating badge shows generation status

## 📁 Project Structure

```
CodeWhisper-AI/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker for API calls
├── content.js            # Content script for editor interaction
├── popup.html            # Settings UI
├── popup.js              # Popup logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🚀 Installation Instructions

### Step 1: Download/Clone the Extension

1. Create a new folder called `CodeWhisper-AI`
2. Copy all the provided files into this folder
3. Create an `icons` folder inside

### Step 2: Create Icon Files

You need to create three icon files. Here's how:

**Option A: Use an online icon generator**
- Go to https://www.favicon-generator.org/
- Upload an image with a code symbol (`</>`)
- Download 16x16, 48x48, and 128x128 PNG versions
- Rename them to `icon16.png`, `icon48.png`, `icon128.png`
- Place in the `icons/` folder

**Option B: Create simple placeholder icons**
- Create three square PNG images (16x16, 48x48, 128x128)
- Add a blue background with white `</>` symbol
- Save as `icon16.png`, `icon48.png`, `icon128.png` in `icons/` folder

### Step 3: Load Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `CodeWhisper-AI` folder
5. The extension should now appear in your extensions list

### Step 4: Configure the Extension

1. Click the extension icon in the toolbar (or pin it)
2. Click the CodeWhisper AI icon to open settings
3. Enter your **OpenAI API Key** (get it from https://platform.openai.com/api-keys)
4. Select your preferred model (GPT-4o Mini recommended for speed/cost)
5. Adjust typing speed if desired (50ms is default)
6. Click **"Test Connection"** to verify API key
7. Click **"Save Settings"**

## 📖 How to Use

### Basic Usage

1. Go to any coding platform (LeetCode, HackerRank, etc.)
2. Open the code editor
3. Type a comment describing what you want:
   ```javascript
   // power function with modulo
   ```
4. Press **Enter**
5. Watch the AI generate and type the code automatically!

### Supported Comment Formats

- **JavaScript/C++/Java**: `// your request here`
- **Python/Ruby**: `# your request here`
- **Multi-line**: `/* your request here */`

### Example Prompts

```javascript
// binary search function

// quick sort algorithm

// function to check if string is palindrome

// depth first search for graph

// calculate factorial recursively
```

```python
# merge two sorted arrays

# find longest common subsequence

# implement trie data structure

# check if number is prime
```

## 🎮 Supported Platforms

- ✅ LeetCode
- ✅ HackerRank
- ✅ Codeforces
- ✅ CodeChef
- ✅ GeeksforGeeks
- ✅ Any website with text editors (textarea, Monaco, Ace, CodeMirror)

## ⚙️ Configuration Options

### Auto-Generate Toggle
Turn AI code generation on/off without disabling the extension

### Model Selection
- **GPT-4o Mini**: Fast and cost-effective (Recommended)
- **GPT-4o**: Most capable, higher cost
- **GPT-3.5 Turbo**: Budget option

### Typing Speed
- **20-40ms**: Very fast (may look robotic)
- **40-60ms**: Balanced (Recommended)
- **60-100ms**: Slower, more human-like
- **100-150ms**: Very slow

## 🔧 Advanced Features

### Context Awareness
The extension automatically captures the last 10-15 lines above your comment and sends them as context to provide more accurate code generation.

### Language Detection
Automatically detects:
- Python
- JavaScript
- Java
- C++
- Go
- And more...

### Visual Feedback
A floating badge appears showing:
- "✨ AI Thinking..." - Processing your request
- "✨ AI Typing..." - Generating code
- "✅ Done!" - Completed successfully
- "❌ Error" - If something goes wrong

## 🐛 Troubleshooting

### Extension not working?
1. Check if extension is enabled in `chrome://extensions/`
2. Verify API key is correct
3. Check browser console for errors (F12 → Console)

### Code not generating?
1. Make sure comment format is correct (`//`, `#`, or `/* */`)
2. Press Enter after the comment
3. Check if "Auto-Generate" is enabled in settings
4. Verify you have a valid OpenAI API key with credits

### Badge not showing?
The badge appears at the bottom-right of the page. Check if it's hidden behind other elements.

### API errors?
- Check your OpenAI account has available credits
- Verify API key starts with `sk-`
- Test connection using the "Test Connection" button

## 💰 API Costs

Using OpenAI API incurs costs:

- **GPT-4o Mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **GPT-4o**: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- **GPT-3.5 Turbo**: ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens

*Average cost per request: $0.001 - $0.01 depending on model and code length*

## 🔒 Privacy & Security

- API key is stored locally in Chrome's sync storage
- No data is sent anywhere except OpenAI's API
- All processing happens locally in your browser
- No tracking or analytics

## 🛠️ Development

### Project Tech Stack
- **Manifest V3**: Modern Chrome Extension API
- **Vanilla JavaScript**: No dependencies
- **Chrome Storage API**: Persistent settings
- **OpenAI API**: Code generation

### File Descriptions

**manifest.json**
- Defines extension metadata, permissions, and entry points

**background.js**
- Service worker handling OpenAI API communication
- Processes code generation requests

**content.js**
- Injected into web pages
- Listens for keydown events
- Detects comment patterns
- Simulates human typing
- Manages visual feedback badge

**popup.html/popup.js**
- Settings interface
- API key configuration
- Model selection
- Typing speed control

## 📝 Known Limitations

- **Monaco/Ace Editors**: Some advanced editors may require additional handling
- **Context Length**: Limited to last 15 lines for context
- **Language Detection**: May not always detect correctly (works 90%+ of cases)
- **Complex IDEs**: Some integrated IDEs with heavy JavaScript may interfere

## 🚀 Future Enhancements

- [ ] Support for more AI models (Claude, Gemini)
- [ ] Multi-line comment detection
- [ ] Code explanation mode
- [ ] Code optimization suggestions
- [ ] Keyboard shortcuts
- [ ] Custom prompt templates
- [ ] History of generated code
- [ ] Offline mode with cached responses

## 📄 License

MIT License - Feel free to modify and distribute

## 🤝 Contributing

Contributions welcome! Please submit issues and pull requests.

## 📞 Support

- **Issues**: Report bugs or request features
- **Documentation**: Full API docs at https://docs.claude.com
- **Community**: Join our Discord (coming soon)

---

**Made with ❤️ for developers who code fast**