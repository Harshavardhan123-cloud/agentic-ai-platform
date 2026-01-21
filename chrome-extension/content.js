// HRC AI - Content Script
// Extracts problem information and handles auto-typing

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractProblem') {
        const problem = extractProblem();
        sendResponse(problem);
    } else if (request.action === 'autotype') {
        // Auto-type code into the editor
        autotypeCode(request.code).then(result => {
            sendResponse(result);
        }).catch(err => {
            sendResponse({ success: false, error: err.message });
        });
        return true; // Keep channel open for async
    }
    return true; // Keep channel open for async response
});

// Show visual feedback on the page
function showToast(message, duration = 3000) {
    const existing = document.getElementById('hrc-ai-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'hrc-ai-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #0f0c29;
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-family: sans-serif;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border: 1px solid #7c3aed;
        animation: slideIn 0.3s ease-out;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, duration);
}

let isAutoTyping = false;

// Auto-type code into the code editor (bypasses paste detection)
async function autotypeCode(code) {
    if (isAutoTyping) return { success: false, error: 'Already typing...' };
    isAutoTyping = true;

    try {
        // 1. Always Copy to Clipboard first (Reliable Base)
        window.focus();
        try {
            await navigator.clipboard.writeText(code);
        } catch (err) {
            console.warn('Clipboard write failed, trying fallback...', err);
        }

        showToast('⚡ HRC AI: Attempting to type...');

        // 2. Try Script Injection for Monaco (Best for LeetCode)
        // Increased timeout to prevent race condition where fallback types duplicate code
        const injectedSuccess = await injectMonacoScript(code);
        if (injectedSuccess) {
            showToast('✅ Code inserted via Monaco API!');
            isAutoTyping = false;
            return { success: true, method: 'monaco-script' };
        }

        // 3. Fallback: Find Editor and Dispatch Events
        const editor = findEditorInput();
        if (editor) {
            editor.focus();

            // Critical: Select All first to overwrite and prevent duplicate nesting/indentation
            document.execCommand('selectAll', false, null);
            await new Promise(r => setTimeout(r, 50));

            // Try execCommand insertText (Modern browsers supported)
            const insertSuccess = document.execCommand('insertText', false, code);

            if (!insertSuccess) {
                // Try simulating Paste Event
                const dataTransfer = new DataTransfer();
                dataTransfer.setData('text/plain', code);
                const pasteEvent = new ClipboardEvent('paste', {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: dataTransfer,
                    view: window
                });
                editor.dispatchEvent(pasteEvent);
            }

            showToast('✅ Code typed!');
            isAutoTyping = false;
            return { success: true, method: 'dom-fallback' };
        }

        // 4. Final Fallback: Manual Paste Guide
        showToast('📋 Code copied! Press Ctrl+V to paste.', 5000);
        isAutoTyping = false;
        return { success: true, method: 'clipboard-guide' };

    } catch (e) {
        console.error("Auto-type error:", e);
        showToast('❌ Error: ' + e.message);
        isAutoTyping = false;
        return { success: false, error: e.message };
    }
}

// Find the likely input element for the code editor
function findEditorInput() {
    return document.querySelector('.monaco-editor textarea.inputarea') ||
        document.querySelector('.monaco-editor textarea') ||
        document.querySelector('.CodeMirror textarea') ||
        document.querySelector('textarea.ace_text-input') ||
        document.querySelector('textarea');
}

// Inject script to access proper window.monaco object
async function injectMonacoScript(code) {
    return new Promise((resolve) => {
        // Escape code for template string
        const safeCode = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

        const scriptContent = `
            (function() {
                try {
                    if (window.monaco && window.monaco.editor) {
                        const editors = window.monaco.editor.getEditors();
                        if (editors.length > 0) {
                            const editor = editors[0];
                            const model = editor.getModel();
                            if (model) {
                                model.setValue(\`${safeCode}\`);
                                document.dispatchEvent(new CustomEvent('hrc-autotype-success'));
                                return;
                            }
                        }
                    }
                } catch(e) { console.error(e); }
                document.dispatchEvent(new CustomEvent('hrc-autotype-failed'));
            })();
        `;

        const script = document.createElement('script');
        script.textContent = scriptContent;

        const successHandler = () => {
            cleanup();
            resolve(true);
        };

        const failHandler = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            document.removeEventListener('hrc-autotype-success', successHandler);
            document.removeEventListener('hrc-autotype-failed', failHandler);
            if (script.parentNode) script.remove();
        };

        document.addEventListener('hrc-autotype-success', successHandler);
        document.addEventListener('hrc-autotype-failed', failHandler);

        // Timeout if script is blocked or fails silently
        // Increased to 2000ms to avoid race condition with fallback
        setTimeout(() => {
            cleanup();
            resolve(false);
        }, 2000);

        (document.head || document.documentElement).appendChild(script);
    });
}

// Extract problem based on current site
function extractProblem() {
    const hostname = window.location.hostname;

    try {
        if (hostname.includes('leetcode.com')) {
            return extractLeetCode();
        } else if (hostname.includes('hackerrank.com')) {
            return extractHackerRank();
        } else if (hostname.includes('codeforces.com')) {
            return extractCodeForces();
        } else {
            return { success: false, error: 'Unsupported website' };
        }
    } catch (err) {
        console.error('Extraction error:', err);
        return { success: false, error: err.message };
    }
}

// LeetCode extractor
function extractLeetCode() {
    console.log('Extracting from LeetCode...');

    // Get problem title - try multiple selectors
    const titleEl = document.querySelector('[data-cy="question-title"]') ||
        document.querySelector('.text-title-large') ||
        document.querySelector('div[class*="title__"]') ||
        document.querySelector('a[href*="/problems/"]') ||
        document.querySelector('h4[class*="title"]');

    // Get problem description - LeetCode uses various selectors
    const descriptionEl = document.querySelector('[data-track-load="description_content"]') ||
        document.querySelector('div[class*="elfjS"]') ||
        document.querySelector('div[class*="_1l1MA"]') ||
        document.querySelector('div[class*="content__"]') ||
        document.querySelector('[class*="description"]') ||
        document.querySelector('.question-content') ||
        document.querySelector('div[data-key="description-content"]');

    // Try even more aggressive fallback
    let description = '';
    if (descriptionEl) {
        description = cleanDescription(descriptionEl.innerText || descriptionEl.textContent);
    } else {
        // Fallback: find any large text block that looks like a problem description
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
            const text = div.innerText || '';
            if (text.length > 200 && (text.includes('Example') || text.includes('Input') || text.includes('Output'))) {
                description = cleanDescription(text.substring(0, 1500));
                break;
            }
        }
    }

    if (!description) {
        return { success: false, error: 'Could not find problem description. Please make sure the problem is fully loaded.' };
    }

    const title = titleEl ? titleEl.textContent.trim() : 'LeetCode Problem';

    // Extract function signature from code editor (Monaco)
    let functionSignature = '';
    let detectedLanguage = 'python';

    // Try to get the code from Monaco editor
    const codeLines = document.querySelectorAll('.view-lines .view-line');
    if (codeLines.length > 0) {
        functionSignature = Array.from(codeLines).map(line => line.textContent).join('\n').trim();

        // Detect language from the code content
        if (functionSignature.includes('vector<') || functionSignature.includes('int>')) {
            detectedLanguage = 'cpp';
        } else if (functionSignature.includes('def ') && functionSignature.includes('self')) {
            detectedLanguage = 'python';
        } else if (functionSignature.includes('public class') || functionSignature.includes('public int')) {
            detectedLanguage = 'java';
        } else if (functionSignature.includes('function') || functionSignature.includes('var ')) {
            detectedLanguage = 'javascript';
        }
    }

    // Also try the language selector dropdown
    const langSelector = document.querySelector('[data-cy="lang-select"]') ||
        document.querySelector('.ant-select-selection-item') ||
        document.querySelector('button[id*="headlessui-listbox-button"]');
    if (langSelector) {
        const langText = langSelector.textContent.toLowerCase();
        if (langText.includes('c++') || langText.includes('cpp')) detectedLanguage = 'cpp';
        else if (langText.includes('python')) detectedLanguage = 'python';
        else if (langText.includes('java') && !langText.includes('javascript')) detectedLanguage = 'java';
        else if (langText.includes('javascript')) detectedLanguage = 'javascript';
        else if (langText.includes('typescript')) detectedLanguage = 'typescript';
        else if (langText.includes('go')) detectedLanguage = 'go';
        else if (langText.includes('rust')) detectedLanguage = 'rust';
        else if (langText.includes('c#')) detectedLanguage = 'csharp';
    }

    return {
        success: true,
        problem: {
            title: title,
            description: description,
            functionSignature: functionSignature,
            detectedLanguage: detectedLanguage,
            site: 'LeetCode',
            url: window.location.href
        }
    };
}

// HackerRank extractor
function extractHackerRank() {
    console.log('Extracting from HackerRank...');

    // Get problem title - multiple selectors for different HackerRank layouts
    const titleEl = document.querySelector('.challenge-view h2') ||
        document.querySelector('.challenge-name') ||
        document.querySelector('.challenge-header h1') ||
        document.querySelector('.challenge-body h1') ||
        document.querySelector('h1.challenge-name') ||
        document.querySelector('h1');

    // Get problem description - more selectors for hard problems
    const descriptionEl = document.querySelector('.challenge-body-html') ||
        document.querySelector('.problem-statement') ||
        document.querySelector('.challenge-text') ||
        document.querySelector('.challenge-body') ||
        document.querySelector('.problem-text') ||
        document.querySelector('[class*="problem-statement"]') ||
        document.querySelector('.hr-challenge-description');

    // Fallback: find text containing common problem keywords
    let description = '';
    if (descriptionEl) {
        description = cleanDescription(descriptionEl.innerText || descriptionEl.textContent);
    } else {
        // Aggressive fallback for complex problems
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
            const text = div.innerText || '';
            // Look for problem description patterns
            if (text.length > 300 && (
                text.includes('Input Format') ||
                text.includes('Output Format') ||
                text.includes('Sample Input') ||
                text.includes('Constraints') ||
                text.includes('Function Description')
            )) {
                description = cleanDescription(text.substring(0, 2000));
                break;
            }
        }
    }

    if (!description) {
        return { success: false, error: 'Could not find problem description. Try refreshing the page.' };
    }

    const title = titleEl ? titleEl.textContent.trim() : 'HackerRank Challenge';

    // Try to get code template
    let functionSignature = '';
    const codeEditor = document.querySelector('.monaco-editor .view-lines') ||
        document.querySelector('.ace_content') ||
        document.querySelector('.CodeMirror-code');

    if (codeEditor) {
        const codeLines = codeEditor.querySelectorAll('.view-line, .ace_line, .CodeMirror-line');
        if (codeLines.length > 0) {
            functionSignature = Array.from(codeLines).slice(0, 30).map(line => line.textContent).join('\n').trim();
        }
    }

    return {
        success: true,
        problem: {
            title: title,
            description: description,
            functionSignature: functionSignature,
            site: 'HackerRank',
            url: window.location.href
        }
    };
}

// CodeForces extractor
function extractCodeForces() {
    const titleEl = document.querySelector('.problem-statement .title') ||
        document.querySelector('.title');

    const descriptionEl = document.querySelector('.problem-statement');

    if (!descriptionEl) {
        return { success: false, error: 'Could not find problem description.' };
    }

    const title = titleEl ? titleEl.textContent.trim() : 'CodeForces Problem';
    const description = cleanDescription(descriptionEl.innerText || descriptionEl.textContent);

    return {
        success: true,
        problem: {
            title: title,
            description: description,
            site: 'CodeForces',
            url: window.location.href
        }
    };
}

// Clean up extracted description
function cleanDescription(text) {
    if (!text) return '';

    return text
        .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
        .replace(/\t/g, ' ')         // Replace tabs with spaces
        .replace(/\s{2,}/g, ' ')     // Remove multiple spaces
        .trim()
        .substring(0, 5000);         // Limit length
}

// Auto-inject floating button (optional feature)
function injectFloatingButton() {
    if (document.getElementById('leetcode-ai-btn')) return;

    const btn = document.createElement('div');
    btn.id = 'leetcode-ai-btn';
    btn.innerHTML = '🧠 AI Solve';
    btn.title = 'Generate AI Solution';

    btn.addEventListener('click', () => {
        // Open extension popup programmatically is not possible,
        // but we can show a notification
        alert('Click the LeetCode AI extension icon in your toolbar to generate a solution!');
    });

    document.body.appendChild(btn);
}

// Inject button when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFloatingButton);
} else {
    injectFloatingButton();
}
