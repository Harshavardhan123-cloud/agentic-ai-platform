// LeetCode AI Solver - Popup Script

const API_BASE = 'https://agentic-ai-platform-1-e7zu.onrender.com';

// DOM Elements
const extractBtn = document.getElementById('extract-btn');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const problemContent = document.getElementById('problem-content');
const solutionSection = document.getElementById('solution-section');
const solutionCode = document.getElementById('solution-code');
const complexityInfo = document.getElementById('complexity-info');
const languageSelect = document.getElementById('language-select');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorText = document.getElementById('error-text');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');

let currentProblem = null;
let authToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Try to get stored auth token
    const stored = await chrome.storage.local.get(['authToken', 'lastProblem']);
    authToken = stored.authToken;

    if (stored.lastProblem) {
        currentProblem = stored.lastProblem;
        displayProblem(currentProblem);
    }

    // Auto-login if no token
    if (!authToken) {
        await autoLogin();
    }

    updateStatus(authToken ? 'connected' : 'disconnected');
});

// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Auto-login with superuser credentials
async function autoLogin() {
    try {
        // Use superuser credentials (hashed)
        const username = 'hrckkc@gmail.com';
        const password = 'HRC@123$';
        const hashedPassword = await hashPassword(password);

        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: hashedPassword })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            await chrome.storage.local.set({ authToken });
            updateStatus('connected');
        } else {
            console.error('Login failed:', await response.text());
            updateStatus('disconnected');
        }
    } catch (err) {
        console.error('Auto-login failed:', err);
        updateStatus('disconnected');
    }
}

// Extract problem from current tab
extractBtn.addEventListener('click', async () => {
    try {
        showLoading(true);
        hideError();

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Check if on supported site
        const supportedSites = ['leetcode.com', 'hackerrank.com', 'codeforces.com'];
        const isSupported = supportedSites.some(site => tab.url && tab.url.includes(site));

        if (!isSupported) {
            showError('Please navigate to a LeetCode, HackerRank, or CodeForces problem page first.');
            showLoading(false);
            return;
        }

        // Try to inject content script first (in case it wasn't loaded)
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (e) {
            console.log('Content script may already be injected or page not accessible');
        }

        // Send message to content script with retry
        let response;
        try {
            response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProblem' });
        } catch (msgError) {
            // Retry after a short delay
            await new Promise(r => setTimeout(r, 500));
            try {
                response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProblem' });
            } catch (retryError) {
                showError('Content script not loaded. Please refresh the page and try again.');
                showLoading(false);
                return;
            }
        }

        if (response && response.success) {
            currentProblem = response.problem;
            await chrome.storage.local.set({ lastProblem: currentProblem });
            displayProblem(currentProblem);
            generateBtn.disabled = false;

            // Auto-select detected language
            if (currentProblem.detectedLanguage) {
                const langMap = { 'cpp': 'cpp', 'python': 'python', 'java': 'java', 'javascript': 'javascript', 'typescript': 'typescript', 'go': 'go', 'rust': 'rust', 'csharp': 'csharp' };
                const mappedLang = langMap[currentProblem.detectedLanguage];
                if (mappedLang && languageSelect.querySelector(`option[value="${mappedLang}"]`)) {
                    languageSelect.value = mappedLang;
                }
            }
        } else {
            showError(response?.error || 'Could not extract problem. Make sure you are on a supported coding site.');
        }
    } catch (err) {
        showError('Could not connect to page. Please refresh and try again.');
        console.error(err);
    } finally {
        showLoading(false);
    }
});

// Generate solution
generateBtn.addEventListener('click', async () => {
    if (!currentProblem) {
        showError('Please extract a problem first');
        return;
    }

    if (!authToken) {
        await autoLogin();
        if (!authToken) {
            showError('Authentication failed. Please try again.');
            return;
        }
    }

    try {
        showLoading(true);
        hideError();
        solutionSection.style.display = 'none';

        const language = languageSelect.value;

        // Call backend API
        const response = await fetch(`${API_BASE}/api/generate-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                problem_statement: buildPrompt(currentProblem, language),
                language: language
            })
        });

        if (response.status === 401) {
            // Token expired, re-login
            authToken = null;
            await autoLogin();
            showError('Session expired. Please try again.');
            return;
        }

        const data = await response.json();

        if (data.success && data.code) {
            displaySolution(data);
        } else {
            showError(data.error || 'Failed to generate solution');
        }
    } catch (err) {
        showError('Network error. Please check your connection.');
        console.error(err);
    } finally {
        showLoading(false);
    }
});

// Copy solution to clipboard
copyBtn.addEventListener('click', async () => {
    const code = solutionCode.textContent;
    try {
        await navigator.clipboard.writeText(code);
        copyBtn.textContent = '✅';
        setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
    } catch (err) {
        console.error('Copy failed:', err);
    }
});

// Display extracted problem
function displayProblem(problem) {
    const langBadge = problem.detectedLanguage ? `<span class="lang-badge">${problem.detectedLanguage.toUpperCase()}</span>` : '';
    problemContent.innerHTML = `
    <h3 class="problem-title">${problem.title || 'Problem'} ${langBadge}</h3>
    <p class="problem-desc">${truncate(problem.description, 300)}</p>
    ${problem.functionSignature ? `<pre class="func-sig">${truncate(problem.functionSignature, 150)}</pre>` : ''}
    ${problem.site ? `<span class="problem-site">${problem.site}</span>` : ''}
  `;
}

// Build prompt with function signature context
function buildPrompt(problem, language) {
    let prompt = problem.description;

    if (problem.functionSignature) {
        prompt += `\n\n--- FUNCTION TEMPLATE (${language.toUpperCase()}) ---\n`;
        prompt += problem.functionSignature;
        prompt += `\n\nIMPORTANT: Generate code that FILLS IN the function body above. Return ONLY the complete implementation that fits this exact function signature. Do not change the class name or function signature. DO NOT include any comments in the code.`;
    }

    return prompt;
}

// Display generated solution
function displaySolution(data) {
    solutionSection.style.display = 'block';
    solutionCode.textContent = data.code;

    // Syntax highlighting class
    solutionCode.className = `language-${languageSelect.value}`;

    // Show complexity if available
    if (data.complexity) {
        complexityInfo.innerHTML = `
      <div class="complexity-item">
        <span class="complexity-label">Time:</span>
        <span class="complexity-value">${data.complexity.time || 'N/A'}</span>
      </div>
      <div class="complexity-item">
        <span class="complexity-label">Space:</span>
        <span class="complexity-value">${data.complexity.space || 'N/A'}</span>
      </div>
    `;
        complexityInfo.style.display = 'flex';
    } else {
        complexityInfo.style.display = 'none';
    }
}

// Utility functions
function showLoading(show) {
    loading.style.display = show ? 'flex' : 'none';
    extractBtn.disabled = show;
    generateBtn.disabled = show || !currentProblem;
}

function showError(message) {
    errorText.textContent = message;
    error.style.display = 'flex';
}

function hideError() {
    error.style.display = 'none';
}

function updateStatus(status) {
    if (status === 'connected') {
        statusDot.style.background = '#10b981';
        statusText.textContent = 'Connected';
    } else {
        statusDot.style.background = '#ef4444';
        statusText.textContent = 'Disconnected';
    }
}

function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
