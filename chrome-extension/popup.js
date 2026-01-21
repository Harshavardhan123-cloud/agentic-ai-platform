// LeetCode AI Solver - Popup Script

const API_BASE = 'https://agentic-ai-platform-1-e7zu.onrender.com';

// DOM Elements - Login
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginErrorText = document.getElementById('login-error-text');

// DOM Elements - Main
const mainContent = document.getElementById('main-content');
const userBar = document.getElementById('user-bar');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
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
let currentUser = null;

// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initialize - Check stored session
document.addEventListener('DOMContentLoaded', async () => {
    const stored = await chrome.storage.local.get(['authToken', 'currentUser', 'lastProblem']);

    if (stored.authToken && stored.currentUser) {
        authToken = stored.authToken;
        currentUser = stored.currentUser;
        showMainContent();
    } else {
        showLoginSection();
    }

    if (stored.lastProblem) {
        currentProblem = stored.lastProblem;
        displayProblem(currentProblem);
    }
});

// Show/Hide sections
function showLoginSection() {
    loginSection.style.display = 'block';
    mainContent.style.display = 'none';
    updateStatus('disconnected');
}

function showMainContent() {
    loginSection.style.display = 'none';
    mainContent.style.display = 'block';
    userEmailSpan.textContent = currentUser?.username || currentUser?.email || 'User';
    updateStatus('connected');
}

// Login form submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        showLoginError('Please enter email and password');
        return;
    }

    try {
        loginError.style.display = 'none';

        // Hash password before sending
        const hashedPassword = await hashPassword(password);

        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password: hashedPassword })
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            authToken = data.access_token;
            currentUser = data.user;

            await chrome.storage.local.set({
                authToken: authToken,
                currentUser: currentUser
            });

            showMainContent();
        } else {
            showLoginError(data.msg || 'Login failed. Check your credentials.');
        }
    } catch (err) {
        console.error('Login error:', err);
        showLoginError('Connection error. Please try again.');
    }
});

function showLoginError(message) {
    loginErrorText.textContent = message;
    loginError.style.display = 'flex';
}

// Logout
logoutBtn.addEventListener('click', async () => {
    authToken = null;
    currentUser = null;
    await chrome.storage.local.remove(['authToken', 'currentUser']);
    showLoginSection();
});

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

        // Try to inject content script first
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (e) {
            console.log('Content script may already be injected');
        }

        // Send message to content script with retry
        let response;
        try {
            response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProblem' });
        } catch (msgError) {
            await new Promise(r => setTimeout(r, 500));
            try {
                response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProblem' });
            } catch (retryError) {
                showError('Please refresh the page and try again.');
                showLoading(false);
                return;
            }
        }

        if (response && response.success) {
            currentProblem = response.problem;
            await chrome.storage.local.set({ lastProblem: currentProblem });
            displayProblem(currentProblem);
            generateBtn.disabled = false;

            if (currentProblem.detectedLanguage) {
                const langMap = { 'cpp': 'cpp', 'python': 'python', 'java': 'java', 'javascript': 'javascript', 'typescript': 'typescript', 'go': 'go', 'rust': 'rust', 'csharp': 'csharp' };
                const mappedLang = langMap[currentProblem.detectedLanguage];
                if (mappedLang && languageSelect.querySelector(`option[value="${mappedLang}"]`)) {
                    languageSelect.value = mappedLang;
                }
            }
        } else {
            showError(response?.error || 'Could not extract problem.');
        }
    } catch (err) {
        showError('Error extracting problem. Please try again.');
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
        showLoginSection();
        return;
    }

    try {
        showLoading(true);
        hideError();
        solutionSection.style.display = 'none';

        const language = languageSelect.value;

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
            // Session expired - show login
            authToken = null;
            currentUser = null;
            await chrome.storage.local.remove(['authToken', 'currentUser']);
            showLoginSection();
            showLoginError('Session expired. Please login again.');
            showLoading(false);
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
    solutionCode.className = `language-${languageSelect.value}`;

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
        statusText.textContent = 'Not logged in';
    }
}

function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
