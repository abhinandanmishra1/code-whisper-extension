// Content script for CodeWhisper AI
// Detects trigger comments and handles code typing on LeetCode

// Initialize only if we're on LeetCode
function initializeOnLeetCode() {
  if (!window.location.hostname.includes('leetcode.com')) {
    console.log('CodeWhisper AI: Not on LeetCode, script disabled');
    return false;
  }

  console.log('CodeWhisper AI content script loaded on LeetCode');
  return true;
}

// Main initialization
function main() {
  // Exit if not on LeetCode
  if (!initializeOnLeetCode()) {
    console.log('CodeWhisper AI: Script not initialized');
    return;
  }
  init();
  console.log('CodeWhisper AI: Script initialized on LeetCode');
}

let isEnabled = true;
let typingSpeed = 50; // ms between characters
let apiKey = '';
let selectedModel = 'gpt-4o-mini';
let isGenerating = false;

// Load settings from storage
loadSettings();

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
  document.addEventListener('keydown', handleKeyDown);
  
  // Monitor for dynamically added editors (Monaco, CodeMirror, etc.)
  // observeEditors();
}

/**
 * Handle keydown events
 */
async function handleKeyDown(e) {
  if (!isEnabled) return;
  
  // Detect Cmd+B key combination
  if (e.key.toLowerCase() === 'b' && e.metaKey) {
    console.log('🎯 Cmd+B pressed');
    const target = e.target;
    
    // Check if target is an input element
    if (isEditableElement(target)) {
      e.preventDefault(); // Prevent default Cmd+B behavior
      await generateSolution(target);
    }
  }
}

/**
 * Check if element is editable
 */
function isEditableElement(element) {
  if (!element) return false;
  
  // Check if we're in the LeetCode editor
  const isLeetCodeEditor = 
    document.querySelector('.monaco-editor') !== null ||
    document.querySelector('[data-monaco-editor-id]') !== null;
  
  return (
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'INPUT' ||
    element.isContentEditable ||
    element.classList.contains('monaco-editor') ||
    element.classList.contains('ace_editor') ||
    element.classList.contains('CodeMirror') ||
    element.closest('.monaco-editor, [data-monaco-editor-id]') !== null ||
    isLeetCodeEditor
  );
}

/**
 * Get text content from element
 */
function getElementText(element) {
  // For LeetCode, always try to get Monaco editor first
  const editor = findEditor(element);
  if (editor) {
    const model = editor.getModel();
    if (model) {
      return model.getValue();
    }
    return editor.getValue ? editor.getValue() : '';
  }
  
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    return element.value || '';
  } else if (element.isContentEditable) {
    return element.innerText || element.textContent || '';
  }
  
  return '';
}

/**
 * Find Monaco/Ace/CodeMirror editor instance
 */
function findEditor(element) {
  console.log('🔍 Finding editor for element:', element);

  // First try to find Monaco editor directly
  if (window.monaco && window.monaco.editor) {
    const editors = window.monaco.editor.getEditors();
    console.log('🔍 Found Monaco editors:', editors.length);
    
    // Try to find the active editor first
    const activeEditor = editors.find(editor => {
      const model = editor.getModel();
      return model && editor.hasTextFocus();
    });
    
    if (activeEditor) {
      console.log('✅ Found active Monaco editor');
      return activeEditor;
    }
    
    // If no active editor, get the first editor with a model
    const firstValidEditor = editors.find(editor => editor.getModel());
    if (firstValidEditor) {
      console.log('✅ Using first valid Monaco editor');
      return firstValidEditor;
    }
  }

  // Try to find CodeMirror editor (for playground)
  const codeMirrorTextArea = document.querySelector('textarea[name="lc-codemirror"]');
  if (codeMirrorTextArea) {
    console.log('✅ Found CodeMirror textarea');
    return {
      getValue: () => codeMirrorTextArea.value,
      setValue: (value) => {
        codeMirrorTextArea.value = value;
        codeMirrorTextArea.dispatchEvent(new Event('input', { bubbles: true }));
        codeMirrorTextArea.dispatchEvent(new Event('change', { bubbles: true }));
      },
      getModel: () => ({
        getValue: () => codeMirrorTextArea.value,
        getLanguageId: () => {
          // Try to detect language from the code content
          const code = codeMirrorTextArea.value.toLowerCase();
          if (code.includes('#include') || code.includes('std::') || code.includes("cout<<")) return 'cpp';
          if (code.includes('def ') || code.includes('print(')) return 'python';
          if (code.includes('public class') || code.includes('System.out')) return 'java';
          return 'auto-detect';
        }
      }),
      getPosition: () => ({
        lineNumber: 1,
        column: codeMirrorTextArea.selectionStart
      }),
      executeEdits: (_, edits) => {
        const edit = edits[0];
        const start = codeMirrorTextArea.selectionStart;
        const end = codeMirrorTextArea.selectionEnd;
        const value = codeMirrorTextArea.value;
        
        codeMirrorTextArea.value = value.substring(0, start) + edit.text + value.substring(end);
        codeMirrorTextArea.selectionStart = codeMirrorTextArea.selectionEnd = start + edit.text.length;
        
        codeMirrorTextArea.dispatchEvent(new Event('input', { bubbles: true }));
        codeMirrorTextArea.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      },
      trigger: true // Flag to indicate this editor supports executeEdits
    };
  }
  
  // General Monaco Editor fallback
  if (window.monaco && window.monaco.editor) {
    const editors = window.monaco.editor.getEditors();
    console.log('🔍 Found Monaco editors:', editors.length);
    for (const editor of editors) {
      // Check if the editor contains our target element
      if (editor.getDomNode().contains(element)) {
        console.log('✅ Found matching Monaco editor');
        return editor;
      }
    }
    // If no specific match but we have editors, return the first one
    if (editors.length > 0) {
      console.log('✅ Using first available Monaco editor');
      return editors[0];
    }
  }
  
  // Ace Editor fallback
  if (window.ace) {
    console.log('🔍 Trying Ace editor');
    const aceEditor = window.ace.edit(element);
    if (aceEditor) {
      console.log('✅ Using Ace editor');
      return aceEditor;
    }
  }
  
  console.log('❌ No editor found');
  return null;
}

/**
 * Insert text at cursor position
 */
function insertText(target, text) {
  // First try to get the editor instance
  const editor = findEditor(target);
  if (editor) {
    console.log('📝 Inserting text using editor:', editor);
    
    // If it's our CodeMirror wrapper
    if (editor.setValue) {
      const currentValue = editor.getValue();
      const textarea = document.querySelector('textarea[name="lc-codemirror"]');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // Insert text at cursor position
        const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
        editor.setValue(newValue);
        
        // Set cursor position after inserted text
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        
        console.log('✅ Text inserted using CodeMirror wrapper');
        return;
      }
    }
    
    // Try Monaco editor methods
    if (editor.executeEdits) {
      const position = editor.getPosition();
      editor.executeEdits('', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: text
      }]);
      console.log('✅ Text inserted using Monaco editor');
      return;
    }
    
    // Try simple insert method
    if (editor.insert) {
      editor.insert(text);
      console.log('✅ Text inserted using insert method');
      return;
    }
  }
  
  // Fallback to direct textarea/input handling
  if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;
    
    target.value = value.substring(0, start) + text + value.substring(end);
    target.selectionStart = target.selectionEnd = start + text.length;
    
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Text inserted using direct textarea/input');
    return;
  }
  
  // Last resort for contentEditable
  if (target.isContentEditable) {
    document.execCommand('insertText', false, text);
    console.log('✅ Text inserted using execCommand');
    return;
  }
  
  console.log('❌ No suitable method found to insert text');
}

/**
 * Loading overlay functions
 */
function showLoadingOverlay(message, details = '') {
  hideLoadingOverlay();
  
  const overlay = document.createElement('div');
  overlay.className = 'codewhisper-loading-overlay';
  overlay.id = 'codewhisper-loading';
  
  const spinner = document.createElement('div');
  spinner.className = 'codewhisper-loading-spinner';
  
  const status = document.createElement('div');
  status.className = 'codewhisper-status';
  status.textContent = message;
  
  if (details) {
    const statusDetails = document.createElement('div');
    statusDetails.className = 'codewhisper-status-details';
    statusDetails.textContent = details;
    status.appendChild(statusDetails);
  }
  
  overlay.appendChild(spinner);
  overlay.appendChild(status);
  document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
  const existing = document.getElementById('codewhisper-loading');
  if (existing) {
    existing.remove();
  }
}

function updateLoadingStatus(message, details = '') {
  const overlay = document.getElementById('codewhisper-loading');
  if (overlay) {
    const status = overlay.querySelector('.codewhisper-status');
    if (status) {
      status.textContent = message;
      if (details) {
        const statusDetails = overlay.querySelector('.codewhisper-status-details') || document.createElement('div');
        statusDetails.className = 'codewhisper-status-details';
        statusDetails.textContent = details;
        status.appendChild(statusDetails);
      }
    }
  }
}

/**
 * Generate solution for the problem
 */
async function generateSolution(target) {
  isGenerating = true;
  showLoadingOverlay('Analyzing LeetCode problem...');
  
  try {
    // Get current editor content and language
    const editorInstance = findEditor(target);
    if (!editorInstance) {
      throw new Error('No editor found on the page');
    }
    console.log('✅ Using editor:', editorInstance);

    const currentCode = editorInstance.getValue?.() || '';
    const editorModel = editorInstance.getModel?.();
    const editorLanguage = editorModel?.getLanguageId() || 'auto-detect';
    
    console.log('📝 Current Code:', currentCode);
    console.log('🔤 Editor Language:', editorLanguage);
    
    // Build initial prompt with code context
    const initialPrompt = `
You are a coding assistant. I will provide you with code comments that describe what needs to be implemented.
Your task is to implement the exact functionality described in the comments.

Current code and comments:
${currentCode}

Instructions:
1. Read the comments carefully to understand the required functionality
2. Implement EXACTLY what the comments describe
3. Match the coding style of the existing code
4. If comments mention specific algorithms or data structures, use those exactly
5. If comments specify time/space complexity requirements, ensure they are met

Remember:
- Follow the comments precisely
- Don't add extra functionality not mentioned in comments
- Keep the code clean and well-structured
- Add appropriate error handling if needed
- Use the same variable naming style as surrounding code

Return only the implementation code that fulfills the comment requirements.
`;

    console.log('🔍 Initial Prompt:', initialPrompt);

    const response = await chrome.runtime.sendMessage({
      action: 'generateCode',
      data: {
        comment: initialPrompt,
        context: JSON.stringify({
          type: 'competitive_programming',
          currentCode: currentCode,
          editorLanguage: editorLanguage
        }),
        language: editorLanguage,
        apiKey,
        model: selectedModel
      }
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    console.log('💡 LLM Response:', response.code);
    
    // Insert the code
    updateLoadingStatus('Inserting solution...');
    if (editorInstance) {
      insertText(target, response.code);
    } else {
      throw new Error('Editor not found');
    }

    // Show success message
    updateLoadingStatus('Code inserted!', 'Press ⌘+B again for more suggestions');
    await delay(1500);

  } catch (error) {
    console.error('Failed to generate solution:', error);
    updateLoadingStatus('Error', error.message);
    await delay(3000);
  } finally {
    hideLoadingOverlay();
    isGenerating = false;
  }
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => main());
} else {
  main();
}