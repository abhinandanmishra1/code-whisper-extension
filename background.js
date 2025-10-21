// Background service worker for CodeWhisper AI
// Handles API communication with OpenAI

console.log('CodeWhisper AI background script loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateCode') {
    handleCodeGeneration(request.data)
      .then(response => sendResponse({ success: true, code: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'testConnection') {
    testOpenAIConnection(request.apiKey)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

/**
 * Generate code using OpenAI API
 */
async function handleCodeGeneration({ comment, context, language, apiKey, model }) {
  if (!apiKey) {
    throw new Error('API key not configured. Please set it in the extension popup.');
  }

  const prompt = buildPrompt(comment, context, language);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a coding assistant. Generate clean, optimized code based on comments. Return ONLY the code without explanations, markdown, or code blocks. The code should be production-ready and follow best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    let generatedCode = data.choices[0].message.content.trim();
    
    // Clean up code - remove markdown code blocks if present
    generatedCode = generatedCode.replace(/^```[\w]*\n/gm, '').replace(/\n```$/gm, '');
    
    return generatedCode;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

/**
 * Build prompt for code generation
 */
function buildPrompt(comment, context, language) {
  let prompt = '';
  
  if (context && context.trim()) {
    prompt += `Context (previous code):\n${context}\n\n`;
  }
  
  prompt += `Language: ${language || 'auto-detect'}\n\n`;
  prompt += `Task: ${comment}\n\n`;
  prompt += `Generate the requested code. Return only the code implementation, no explanations.`;
  
  return prompt;
}

/**
 * Test OpenAI API connection
 */
async function testOpenAIConnection(apiKey) {
  const response = await fetch('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error('Invalid API key or connection failed');
  }

  return true;
}