// js/global.js

// 1. Initialize Supabase
const supabaseUrl = 'https://gqdirctfbzlnnfctcdcy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZGlyY3RmYnpsbm5mY3RjZGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MzIxMjMsImV4cCI6MjEwODQwODEyM30.D12kInUr6jHHxCNTWLuoNGXUrxFPWFYdKHxw0cAfaWA';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Handle SSO Login
const loginBtn = document.getElementById('loginBtn'); 
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { 
                redirectTo: window.location.origin + '/index.html' 
            }
        });
        if (error) console.error("Login failed:", error.message);
    });
}

// 3. Check Session on Page Load
async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        if (loginBtn) {
            loginBtn.innerText = 'LOGGED IN';
            loginBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            loginBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }
    }
}
checkUser();

// 4. Persisted Theme Management
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

// 5. High-Velocity Hotkeys (Execution Layer)
document.addEventListener('keydown', (e) => {
    // Ignore hotkeys if user is typing in an input field
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
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 bg-${color}-600 text-white px-4 py-2 rounded shadow-lg font-bold terminal-font z-50 animate-bounce`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}
