// Background service worker for CodeWhisper AI
// Handles API communication with Google's Gemini API

console.log('CodeWhisper AI background script loaded');

// Keep track of devtools state
let devToolsEnabled = false;

// Initialize side panel
try {
  // Set up side panel behavior
  chrome.sidePanel.setOptions({
    path: 'devtools.html',
    enabled: true
  });
} catch (error) {
  console.error('Error setting up side panel:', error);
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateCode') {
    console.log("generating code")
    handleCodeGeneration(request.data)
      .then(response => {
        // If devtools is enabled, send the prompt and response
        if (devToolsEnabled) {
          chrome.runtime.sendMessage({
            action: 'updateDevTools',
            prompt: request.data.comment,
            response: response
          });
        }
        sendResponse({ success: true, code: response });
      })
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'testConnection') {
    testGeminiConnection(request.apiKey)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'toggleDevTools') {
    devToolsEnabled = request.enabled;
    // Enable/disable the side panel based on the toggle
    try {
      chrome.sidePanel.setOptions({
        enabled: devToolsEnabled,
        path: 'devtools.html'
      });
      if (devToolsEnabled) {
        // When enabled, try to show the panel
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs[0]) {
            chrome.sidePanel.show({ tabId: tabs[0].id }).catch(console.error);
          }
        });
      }
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error toggling side panel:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});

/**
 * Generate code using Google's Gemini API
 */
async function handleCodeGeneration({ comment, context, language, apiKey, model }, retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second delay between retries

  console.log({
    comment,
    context,
    language,
    apiKey,
    model
  })
  if (!apiKey) {
    throw new Error('API key not configured. Please set it in the extension popup.');
  }

  // Validate API key format
  if (!apiKey.startsWith('AIza') || apiKey.length !== 39) {
    throw new Error('Invalid API key format. Please check your Gemini API key.');
  }

    const prompt = buildPrompt(comment, context, language);
    console.log('📝 Final Prompt:', prompt);
    
    try {
      // Get model-specific parameters
      const modelConfig = getModelConfig(model || 'gemini-2.5-pro');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a coding assistant. Generate clean, optimized code based on the following context. Return ONLY the code without explanations, markdown, or code blocks. The code should be production-ready and follow best practices.

${prompt}`
          }]
        }],
        generationConfig: {
          ...modelConfig.generationConfig,
          temperature: 0.7,
          maxOutputTokens: modelConfig.maxTokens,
          topP: 0.8,
          topK: 40
        },
      })
    });

    // Get the raw response text first
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse API response:', responseText);
      throw new Error('Invalid response from API. Please check your API key and try again.');
    }

    if (!response.ok) {
      console.error('Gemini API Error Response:', data);
      
      if (data.error?.status === 'PERMISSION_DENIED') {
        throw new Error('API key does not have permission. Please check API key settings in Google AI Studio.');
      } else if (data.error?.status === 'QUOTA_EXCEEDED') {
        throw new Error('API quota exceeded. Please check your usage limits.');
      } else if (data.error?.message?.includes('overloaded') && retryCount < MAX_RETRIES) {
        console.log(`Model overloaded, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return handleCodeGeneration({ comment, context, language, apiKey, model }, retryCount + 1);
      }
      
      throw new Error(data.error?.message || 'API request failed');
    }
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    let generatedCode = data.candidates[0].content.parts[0].text.trim();
    
    // Clean up code - remove markdown code blocks if present
    generatedCode = generatedCode.replace(/^```[\w]*\n/gm, '').replace(/\n```$/gm, '');
    
    return generatedCode;
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Enhance error messages for common issues
    if (error.message.includes('API key not valid')) {
      throw new Error('Invalid API key. Please check your key in Google AI Studio.');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      throw new Error('API key does not have permission. Enable the Gemini API in your Google Cloud project.');
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      throw new Error('API quota exceeded. Please check your usage limits in Google Cloud Console.');
    }
    
    throw error;
  }
}

/**
 * Build prompt for code generation
 */
function buildPrompt(comment, context, language) {
  let prompt = '';
  
  try {
    // Parse the context JSON
    const parsedContext = JSON.parse(context);
    
    // Add cursor position information
    prompt += `Cursor Position: Line ${parsedContext.cursorPosition.line} of ${parsedContext.cursorPosition.totalLines}\n\n`;
    
    // Add the code context
    prompt += `Existing code up to cursor position:\n${parsedContext.code}\n\n`;
    
    // Add task description
    prompt += `Task: Continue the code from the cursor position. The code should:\n`;
    prompt += `1. Match the language and style of the existing code\n`;
    prompt += `2. Follow the established patterns and conventions\n`;
    prompt += `3. Complete any incomplete structures or blocks\n`;
    prompt += `4. Be production-ready and follow best practices\n\n`;
    
    if (comment) {
      prompt += `Additional instructions: ${comment}\n\n`;
    }
    
    prompt += `Return only the code that should be inserted at the cursor position. Do not include explanations or markdown formatting.`;
    
  } catch (error) {
    console.error('Error parsing context:', error);
    // Fallback to simple context
    prompt += `Code context:\n${context}\n\n`;
    prompt += `Task: Continue the code from the cursor position. Return only the code implementation.`;
  }
  
  return prompt;
}

/**
 * Test Gemini API connection
 */
/**
 * Get configuration for specific Gemini model
 */

function getModelConfig(model) {
  const configs = {
    'models/gemini-2.5-flash': {
      maxTokens: 65536,
      generationConfig: {
        candidateCount: 1,
        stopSequences: ["\n\n"],
        temperature: 1.0,
        topP: 0.95,
        topK: 64
      }
    },
    'models/gemini-2.5-pro': {
      maxTokens: 65536,
      generationConfig: {
        candidateCount: 1,
        stopSequences: ["\n\n"],
        temperature: 1.0,
        topP: 0.95,
        topK: 64
      }
    },
    'models/gemini-2.0-flash': {
      maxTokens: 8192,
      generationConfig: {
        candidateCount: 1,
        stopSequences: ["\n\n"],
        temperature: 1.0,
        topP: 0.95,
        topK: 40
      }
    },
    'models/gemini-2.0-flash-001': {
      maxTokens: 8192,
      generationConfig: {
        candidateCount: 1,
        stopSequences: ["\n\n"],
        temperature: 1.0,
        topP: 0.95,
        topK: 40
      }
    },
    'models/gemini-2.0-flash-lite': {
      maxTokens: 8192,
      generationConfig: {
        candidateCount: 1,
        stopSequences: ["\n\n"],
        temperature: 1.0,
        topP: 0.95,
        topK: 40
      }
    },
    'models/gemini-2.5-flash-lite': {
      maxTokens: 65536,
      generationConfig: {
        candidateCount: 1,
        stopSequences: ["\n\n"],
        temperature: 1.0,
        topP: 0.95,
        topK: 64
      }
    }
  };

  return configs[model] || configs['models/gemini-2.5-pro'];
}

async function testGeminiConnection(apiKey) {
  try {
    // Validate API key format first
    if (!apiKey.startsWith('AIza') || apiKey.length !== 39) {
      throw new Error('Invalid API key format. Key should start with "AIza" and be 39 characters long.');
    }

    // First, try to list available models
    console.log('Testing API connection...');
    const modelListResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const modelListText = await modelListResponse.text();
    console.log('Model List Response:', modelListText);

    if (!modelListResponse.ok) {
      let error;
      try {
        error = JSON.parse(modelListText);
      } catch (e) {
        throw new Error('Failed to connect to Gemini API. Please check your API key and internet connection.');
      }
      throw new Error(error.error?.message || 'Failed to list models');
    }

    // If models list works, try a simple generation request
    console.log('Testing content generation...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello"
          }]
        }],
      })
    });

    const responseText = await response.text();
    console.log('Generation Response:', responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Failed to parse generation response:', responseText);
      throw new Error('Invalid response from API. Please check your API key and try again.');
    }

    if (!response.ok) {
      const errorMessage = data.error?.message || 'API request failed';
      console.error('Error details:', data.error);
      
      if (data.error?.status === 'PERMISSION_DENIED') {
        throw new Error('API key does not have permission. Enable the Gemini API in your Google Cloud project.');
      } else if (data.error?.status === 'QUOTA_EXCEEDED') {
        throw new Error('API quota exceeded. Please check your usage limits.');
      }
      
      throw new Error(errorMessage);
    }

    return true;
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (error.message.includes('API key not valid')) {
      throw new Error('Invalid API key. Please check your key in Google AI Studio.');
    } else if (error.message.includes('Unexpected end of JSON input')) {
      throw new Error('Invalid API response. Please verify your API key is for Gemini API.');
    }
    throw error;
  }
}