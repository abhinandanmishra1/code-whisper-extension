// Create a side panel
chrome.devtools.panels.elements.createSidebarPane(
  "CodeWhisper AI",
  function(sidebar) {
    sidebar.setPage("devtools.html");
  }
);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateDevTools') {
    const chatContainer = document.getElementById('chatContainer');
    
    // Clear empty state if present
    const emptyState = chatContainer.querySelector('.empty-state');
    if (emptyState) {
      chatContainer.removeChild(emptyState);
    }

    // Add prompt message
    const promptDiv = document.createElement('div');
    promptDiv.className = 'message prompt';
    promptDiv.innerHTML = `
      <div class="message-header">Prompt</div>
      <div class="message-content">${escapeHtml(message.prompt)}</div>
    `;
    chatContainer.appendChild(promptDiv);

    // Add response message
    const responseDiv = document.createElement('div');
    responseDiv.className = 'message response';
    responseDiv.innerHTML = `
      <div class="message-header">Response</div>
      <div class="message-content">${formatCode(message.response)}</div>
    `;
    chatContainer.appendChild(responseDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper function to format code blocks
function formatCode(text) {
  return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}
