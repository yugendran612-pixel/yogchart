// js/global.js

// 1. Persisted Theme Management
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

// Check local storage for theme preference
if (localStorage.theme === 'light') {
    html.classList.remove('dark');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
        
        // Dispatch custom event so chart.js knows to update its colors
        window.dispatchEvent(new Event('themeChanged'));
    });
}

// 2. High-Velocity Hotkeys (Execution Layer)
// Bypasses UI clicking for rapid market execution
document.addEventListener('keydown', (e) => {
    // Ignore hotkeys if user is typing in an input field (like the search bar)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Shift + B = Instant Market Buy
    if (e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        triggerExecutionNotification('MARKET BUY EXECUTED', 'green');
    }
    
    // Shift + S = Instant Market Sell
    if (e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerExecutionNotification('MARKET SELL EXECUTED', 'red');
    }
});

function triggerExecutionNotification(msg, color) {
    // In production, this would fire an API call to Supabase or your Exchange endpoint
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 bg-${color}-600 text-white px-4 py-2 rounded shadow-lg font-bold terminal-font z-50 animate-bounce`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}
