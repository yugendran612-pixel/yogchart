// js/chart.js

const chartContainer = document.getElementById('chartContainer');
if (!chartContainer) {
    console.warn("Chart container not found. Skipping chart initialization.");
} else {
    const darkColors = { bg: '#030712', text: '#9ca3af', grid: '#1f2937' };
    const lightColors = { bg: '#ffffff', text: '#374151', grid: '#e5e7eb' };
    const isDark = document.documentElement.classList.contains('dark');
    const initialColors = isDark ? darkColors : lightColors;

    const chart = LightweightCharts.createChart(chartContainer, {
        layout: { background: { type: 'solid', color: initialColors.bg }, textColor: initialColors.text },
        grid: { vertLines: { color: initialColors.grid }, horzLines: { color: initialColors.grid } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        timeScale: { timeVisible: true, secondsVisible: false },
    });

    new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== chartContainer) return;
        const newRect = entries[0].contentRect;
        chart.applyOptions({ height: newRect.height, width: newRect.width });
    }).observe(chartContainer);

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444', borderVisible: false,
        wickUpColor: '#22c55e', wickDownColor: '#ef4444'
    });

    // Listen for theme changes from global.js
    window.addEventListener('themeChanged', () => {
        const dark = document.documentElement.classList.contains('dark');
        const colors = dark ? darkColors : lightColors;
        chart.applyOptions({
            layout: { background: { color: colors.bg }, textColor: colors.text },
            grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } }
        });
    });

    // Live Data Engine (Binance WebSockets)
    let wsKline = null;
    let wsTrade = null;
    const livePriceEl = document.getElementById('livePrice');
    const orderTape = document.getElementById('orderTape');

    async function initSymbol(symbol) {
        symbol = symbol.toUpperCase();
        if (document.getElementById('symbolInput')) document.getElementById('symbolInput').value = symbol;
        if (orderTape) orderTape.innerHTML = '';
        candleSeries.setData([]); 
        if (livePriceEl) livePriceEl.innerText = 'Loading...';

        try {
            const res = await fetch(`https://api.mexc.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=200`);
            if (res.ok) {
                const data = await res.json();
                const formattedData = data.map(d => ({
                    time: Math.floor(d[0] / 1000), 
                    open: parseFloat(d[1]), 
                    high: parseFloat(d[2]), 
                    low: parseFloat(d[3]), 
                    close: parseFloat(d[4])
                })).sort((a, b) => a.time - b.time);
                candleSeries.setData(formattedData);
            }
        } catch (err) {
            console.warn("History fetch blocked. Starting live stream only.");
        }

        const wsSymbol = symbol.toLowerCase();

        if (wsKline) wsKline.close();
        wsKline = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@kline_1m`);
        wsKline.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            const k = msg.k;
            const closePrice = parseFloat(k.c);
            
            candleSeries.update({
                time: Math.floor(k.t / 1000),
                open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: closePrice
            });

            if (livePriceEl) {
                livePriceEl.innerText = closePrice >= 10 ? closePrice.toFixed(2) : closePrice.toFixed(4);
                livePriceEl.className = closePrice >= parseFloat(k.o) ? 'font-bold text-lg terminal-font leading-none text-green-500' : 'font-bold text-lg terminal-font leading-none text-red-500';
            }
        };

        if (wsTrade) wsTrade.close();
        wsTrade = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@trade`);
        wsTrade.onmessage = (event) => {
            if (!orderTape) return;
            const msg = JSON.parse(event.data);
            const isBuy = !msg.m; 
            const price = parseFloat(msg.p);
            const qty = parseFloat(msg.q);
            const timeStr = new Date(msg.T).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });

            const formattedPrice = price >= 10 ? price.toFixed(2) : price.toFixed(4);
            const formattedQty = qty > 1000 ? (qty/1000).toFixed(1) + 'K' : qty.toFixed(2);

            const div = document.createElement('div');
            div.className = `flex justify-between px-3 py-1 rounded text-[11px] ${isBuy ? 'text-green-500 bg-green-500/5' : 'text-red-500 bg-red-500/5'} hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`;
            div.innerHTML = `<span class="w-1/3 font-bold">${formattedPrice}</span><span class="w-1/3 text-right">${formattedQty}</span><span class="w-1/3 text-right text-gray-500">${timeStr}</span>`;
            
            orderTape.prepend(div);
            if (orderTape.children.length > 50) orderTape.lastChild.remove();
        };
    }

    const symbolInput = document.getElementById('symbolInput');
    if (symbolInput) {
        symbolInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') initSymbol(e.target.value); });
    }

    initSymbol('XRPUSDT');
}
