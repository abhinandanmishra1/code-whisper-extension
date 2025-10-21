// Content script for CodeWhisper AI
// Detects trigger comments and handles code typing

console.log('CodeWhisper AI content script loaded');

let isEnabled = true;
let typingSpeed = 50; // ms between characters
let apiKey = '';
let selectedModel = 'gpt-4o-mini';
let isGenerating = false;
let badge = null;

// Load settings from storage
loadSettings();

// Comment patterns to detect
const COMMENT_PATTERNS = [
  /^\s*\/\/\s*(.+)$/,  // Single-line // comment
  /^\s*#\s*(.+)$/,      // Python/Ruby # comment
  /^\s*\/\*\s*(.+)\s*\*\/$/  // Multi-line /* */ comment
];

/**
 * Load settings from chrome storage
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(['enabled', 'typingSpeed', 'apiKey', 'model']);
    isEnabled = settings.enabled !== false; // Default to true
    typingSpeed = settings.typingSpeed || 50;
    apiKey = settings.apiKey || '';
    selectedModel = settings.model || 'gpt-4o-mini';
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.enabled) isEnabled = changes.enabled.newValue;
    if (changes.typingSpeed) typingSpeed = changes.typingSpeed.newValue;
    if (changes.apiKey) apiKey = changes.apiKey.newValue;
    if (changes.model) selectedModel = changes.model.newValue;
  }
});

/**
 * Initialize event listeners
 */
function init() {
  // Listen for keydown events on the entire document
  document.addEventListener('keydown', handleKeyDown, true);
  
  // Create floating badge
  createBadge();
  
  // Monitor for dynamically added editors (Monaco, CodeMirror, etc.)
  observeEditors();
}

/**
 * Handle keydown events
 */
async function handleKeyDown(e) {
  if (!isEnabled || isGenerating) return;
  
  // Detect Enter key
  if (e.key === 'Enter') {
    const target = e.target;
    
    // Check if target is an input element
    if (isEditableElement(target)) {
      const text = getElementText(target);
      const cursorPos = getCursorPosition(target);
      
      // Get the current line
      const lines = text.substring(0, cursorPos).split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Check if current line matches comment pattern
      for (const pattern of COMMENT_PATTERNS) {
        const match = currentLine.match(pattern);
        if (match) {
          const comment = match[1].trim();
          if (comment) {
            e.preventDefault();
            await triggerCodeGeneration(target, comment, text, cursorPos);
            break;
          }
        }
      }
    }
  }
}

/**
 * Check if element is editable
 */
function isEditableElement(element) {
  if (!element) return false;
  
  return (
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'INPUT' ||
    element.isContentEditable ||
    element.classList.contains('monaco-editor') ||
    element.classList.contains('ace_editor') ||
    element.classList.contains('CodeMirror')
  );
}

/**
 * Get text content from element
 */
function getElementText(element) {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    return element.value;
  } else if (element.isContentEditable) {
    return element.innerText || element.textContent;
  }
  
  // Try to find Monaco/Ace editor
  const editor = findEditor(element);
  if (editor) {
    return editor.getValue ? editor.getValue() : '';
  }
  
  return '';
}

/**
 * Get cursor position
 */
function getCursorPosition(element) {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    return element.selectionStart;
  }
  return 0;
}

/**
 * Find Monaco/Ace/CodeMirror editor instance
 */
function findEditor(element) {
  // Monaco Editor
  if (window.monaco && window.monaco.editor) {
    const editors = window.monaco.editor.getEditors();
    for (const editor of editors) {
      if (editor.getDomNode().contains(element)) {
        return editor;
      }
    }
  }
  
  // Ace Editor
  if (window.ace) {
    const aceEditor = window.ace.edit(element);
    if (aceEditor) return aceEditor;
  }
  
  return null;
}

/**
 * Trigger code generation
 */
async function triggerCodeGeneration(target, comment, fullText, cursorPos) {
  isGenerating = true;
  showBadge('✨ AI Thinking...');
  
  try {
    // Extract context (last 10-15 lines)
    const context = extractContext(fullText, cursorPos);
    
    // Detect language
    const language = detectLanguage(fullText) || 'javascript';
    
    // Request code generation from background script
    const response = await chrome.runtime.sendMessage({
      action: 'generateCode',
      data: {
        comment,
        context,
        language,
        apiKey,
        model: selectedModel
      }
    });
    
    if (response.success) {
      showBadge('✨ AI Typing...');
      
      // Insert newline first
      insertText(target, '\n');
      await delay(100);
      
      // Type the generated code
      await typeLikeHuman(target, response.code);
      
      showBadge('✅ Done!');
      setTimeout(hideBadge, 2000);
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Code generation failed:', error);
    showBadge('❌ Error: ' + error.message);
    setTimeout(hideBadge, 3000);
  } finally {
    isGenerating = false;
  }
}

/**
 * Extract context from text
 */
function extractContext(text, cursorPos) {
  const lines = text.substring(0, cursorPos).split('\n');
  const contextLines = lines.slice(-15); // Last 15 lines
  return contextLines.join('\n');
}

/**
 * Detect programming language from content
 */
function detectLanguage(text) {
  // Check for common language indicators
  if (text.includes('def ') || text.includes('import ')) return 'python';
  if (text.includes('function ') || text.includes('const ') || text.includes('let ')) return 'javascript';
  if (text.includes('public class ') || text.includes('private ')) return 'java';
  if (text.includes('#include') || text.includes('std::')) return 'cpp';
  if (text.includes('func ') || text.includes('package main')) return 'go';
  
  // Check page URL for hints
  const url = window.location.href.toLowerCase();
  if (url.includes('python')) return 'python';
  if (url.includes('java')) return 'java';
  if (url.includes('cpp') || url.includes('c++')) return 'cpp';
  if (url.includes('javascript') || url.includes('js')) return 'javascript';
  
  return 'javascript'; // Default
}

/**
 * Type text like a human
 */
async function typeLikeHuman(target, text) {
  for (const ch of text) {
    insertText(target, ch);
    
    // Random delay between characters
    const delay_ms = Math.random() * 40 + typingSpeed - 20;
    await delay(delay_ms);
  }
}

/**
 * Insert text at cursor position
 */
function insertText(target, text) {
  if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;
    
    target.value = value.substring(0, start) + text + value.substring(end);
    target.selectionStart = target.selectionEnd = start + text.length;
    
    // Trigger input event for frameworks
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (target.isContentEditable) {
    document.execCommand('insertText', false, text);
  } else {
    // Try Monaco/Ace editor
    const editor = findEditor(target);
    if (editor && editor.trigger) {
      // Monaco editor
      const position = editor.getPosition();
      editor.executeEdits('', [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: text
      }]);
    } else if (editor && editor.insert) {
      // Ace editor
      editor.insert(text);
    }
  }
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create floating badge
 */
function createBadge() {
  badge = document.createElement('div');
  badge.id = 'codewhisper-badge';
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    display: none;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(badge);
}

/**
 * Show badge with message
 */
function showBadge(message) {
  if (badge) {
    badge.textContent = message;
    badge.style.display = 'block';
  }
}

/**
 * Hide badge
 */
function hideBadge() {
  if (badge) {
    badge.style.display = 'none';
  }
}

/**
 * Observe for dynamically added editors
 */
function observeEditors() {
  const observer = new MutationObserver((mutations) => {
    // Re-initialize listeners when DOM changes
    // This helps with single-page applications
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}