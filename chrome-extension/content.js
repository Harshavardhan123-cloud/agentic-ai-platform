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

// Auto-type code into the code editor (bypasses paste detection)
// Auto-type code into the code editor (bypasses paste detection)
// Auto-type code into the code editor (bypasses paste detection)
async function autotypeCode(code) {
    try {
        // Ensure window focus
        window.focus();

        // METHOD 1: Script Injection to access window.monaco (The only way to effectively use Monaco API)
        // We create a script element, inject it, and send a custom event with the code
        const scriptContent = `
            (function() {
                function tryMonaco() {
                    if (window.monaco && window.monaco.editor) {
                        const editors = window.monaco.editor.getEditors();
                        if (editors.length > 0) {
                            const editor = editors[0]; // Usually the first one is the implementation editor
                            const model = editor.getModel();
                            if (model) {
                                model.setValue(\`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
                                return true;
                            }
                        }
                    }
                    return false;
                }

                function tryReactInput() {
                    const activeElement = document.activeElement;
                    if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                        nativeInputValueSetter.call(activeElement, \`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
                        
                        const event = new Event('input', { bubbles: true});
                        activeElement.dispatchEvent(event);
                        return true;
                    }
                    return false;
                }

                if (!tryMonaco()) {
                    if (!tryReactInput()) {
                        console.log("HRC AI: Could not auto-type using Monaco or React inputs.");
                    }
                }
            })();
        `;

        const script = document.createElement('script');
        script.textContent = scriptContent;
        (document.head || document.documentElement).appendChild(script);
        script.remove();

        // Return success immediately as the injected script handles it. 
        // We can't easily get the return value back from injected script without messaging.
        // Assuming success if no error was thrown during injection.
        return { success: true, method: 'script-injection' };

    } catch (e) {
        console.error("Auto-type error:", e);

        // Fallback: Clipboard + User Action
        try {
            await navigator.clipboard.writeText(code);
            return {
                success: false,
                error: 'Auto-type limited. Code copied to clipboard - click editor and press Ctrl+V.',
                fallback: true
            };
        } catch (clipErr) {
            return { success: false, error: e.message };
        }
    }
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
