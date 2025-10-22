// Popup script for CodeWhisper AI settings

document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const enableToggle = document.getElementById('enableToggle');
  const devToolsToggle = document.getElementById('devToolsToggle');
  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('model');
  const typingSpeedInput = document.getElementById('typingSpeed');
  const speedValue = document.getElementById('speedValue');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const saveStatus = document.getElementById('saveStatus');
  const testStatus = document.getElementById('testStatus');

  // Load saved settings
  await loadSettings();

  // Event listeners
  enableToggle.addEventListener('click', () => {
    enableToggle.classList.toggle('active');
  });

  devToolsToggle.addEventListener('click', () => {
    devToolsToggle.classList.toggle('active');
    chrome.runtime.sendMessage({
      action: 'toggleDevTools',
      enabled: devToolsToggle.classList.contains('active')
    });
  });

  typingSpeedInput.addEventListener('input', (e) => {
    speedValue.textContent = `${e.target.value}ms`;
  });

  saveBtn.addEventListener('click', saveSettings);
  testBtn.addEventListener('click', testConnection);

  /**
   * Load settings from storage
   */
  async function loadSettings() {
    try {
      const settings = await chrome.storage.sync.get([
        'enabled',
        'devToolsEnabled',
        'apiKey',
        'model',
        'typingSpeed'
      ]);

      // Set toggles
      if (settings.enabled !== false) {
        enableToggle.classList.add('active');
      }
      
      if (settings.devToolsEnabled) {
        devToolsToggle.classList.add('active');
      }

      // Set API key (masked)
      if (settings.apiKey) {
        apiKeyInput.value = settings.apiKey;
      }

      // Set model
      if (settings.model) {
        modelSelect.value = settings.model;
      }

      // Set typing speed
      if (settings.typingSpeed) {
        typingSpeedInput.value = settings.typingSpeed;
        speedValue.textContent = `${settings.typingSpeed}ms`;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showStatus(saveStatus, 'error', 'Failed to load settings');
    }
  }

  /**
   * Save settings to storage
   */
  async function saveSettings() {
    try {
      const settings = {
        enabled: enableToggle.classList.contains('active'),
        devToolsEnabled: devToolsToggle.classList.contains('active'),
        apiKey: apiKeyInput.value.trim(),
        model: modelSelect.value,
        typingSpeed: parseInt(typingSpeedInput.value)
      };

      // Validate API key
      if (!settings.apiKey) {
        showStatus(saveStatus, 'error', 'Please enter an API key');
        return;
      }

      // Validate Gemini API key format (should start with 'AIza' and be 39 characters)
      if (!settings.apiKey.startsWith('AIza') || settings.apiKey.length !== 39) {
        showStatus(saveStatus, 'error', 'Invalid Gemini API key format. Key should start with "AIza" and be 39 characters long.');
        return;
      }

      // Save to storage
      await chrome.storage.sync.set(settings);
      
      showStatus(saveStatus, 'success', '✓ Settings saved successfully!');
      
      // Hide status after 3 seconds
      setTimeout(() => {
        saveStatus.style.display = 'none';
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus(saveStatus, 'error', 'Failed to save settings');
    }
  }

  /**
   * Test Gemini API connection
   */
  async function testConnection() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus(testStatus, 'error', 'Please enter an API key first');
      return;
    }

    // Show loading state
    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;
    testStatus.style.display = 'none';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'testConnection',
        apiKey: apiKey
      });

      if (response.success) {
        showStatus(testStatus, 'success', '✓ Connection successful!');
      } else {
        showStatus(testStatus, 'error', '✗ ' + response.error);
      }
    } catch (error) {
      showStatus(testStatus, 'error', '✗ Connection failed: ' + error.message);
    } finally {
      testBtn.textContent = 'Test Connection';
      testBtn.disabled = false;
      
      // Hide status after 5 seconds
      setTimeout(() => {
        testStatus.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Show status message
   */
  function showStatus(element, type, message) {
    element.className = `status ${type}`;
    element.textContent = message;
    element.style.display = 'block';
  }
});