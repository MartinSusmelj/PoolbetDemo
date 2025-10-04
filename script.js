// Chart
(function () {
  const el = document.getElementById('chart');
  const chart = LightweightCharts.createChart(el, {
    layout: { background: { type: 'solid', color: '#101626' }, textColor: 'white' },
    grid: { horzLines: { color: 'rgba(255,255,255,0.06)' }, vertLines: { color: 'rgba(255,255,255,0.06)' } },
    rightPriceScale: { borderColor: 'rgba(255,255,255,0.2)' },
    timeScale: { borderColor: 'rgba(255,255,255,0.2)' }
  });
  const series = chart.addCandlestickSeries();
  const now = Math.floor(Date.now() / 1000);
  const data = Array.from({ length: 180 }).map((_, i) => {
    const t = now - (180 - i) * 60;
    const o = 60000 + Math.round(Math.sin(i/8)*400);
    const h = o + Math.round(100 + Math.random()*200);
    const l = o - Math.round(100 + Math.random()*200);
    const c = l + Math.round(Math.random()*(h-l));
    return { time: t, open: o, high: h, low: l, close: c };
  });
  series.setData(data);
  const resize = () => chart.applyOptions({ width: el.clientWidth, height: 380 });
  window.addEventListener('resize', resize);
  resize();
})();

// Pools mock
(function () {
  const pools = [
    { asset: 'BTC', side: 'UP', entries: 42, pot: '$1,240', status: 'OPEN' },
    { asset: 'ETH', side: 'DOWN', entries: 31, pot: '$980', status: 'OPEN' },
    { asset: 'SOL', side: 'UP', entries: 67, pot: '$2,210', status: 'LOCKED' },
    { asset: 'ARB', side: 'DOWN', entries: 22, pot: '$640', status: 'OPEN' },
    { asset: 'AVAX', side: 'UP', entries: 19, pot: '$520', status: 'RESOLVED' },
    { asset: 'DOGE', side: 'UP', entries: 55, pot: '$1,020', status: 'OPEN' },
  ];
  const container = document.getElementById('pools');
  pools.forEach(p => {
    const statusColor = p.status === 'OPEN' ? 'text-green-500' : (p.status === 'LOCKED' ? 'text-gray-400' : 'text-red-500');
    const sideColor = p.side === 'UP' ? 'text-green-500' : 'text-red-500';
    const card = document.createElement('div');
    card.className = 'card p-4 hover:-translate-y-0.5 transition transform';
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <div class="font-semibold">${p.asset} Pool</div>
        <div class="text-xs ${statusColor}">${p.status}</div>
      </div>
      <div class="mt-2 grid grid-cols-3 gap-3 text-sm">
        <div><div class="text-muted text-xs">Side</div><div class="font-semibold ${sideColor}">${p.side}</div></div>
        <div><div class="text-muted text-xs">Entries</div><div class="font-semibold">${p.entries}</div></div>
        <div><div class="text-muted text-xs">Pool</div><div class="font-semibold">${p.pot}</div></div>
      </div>
      <div class="mt-3 flex gap-2">
        <button class="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm">Details</button>
        <button class="px-3 py-2 rounded-md bg-[#7C93F6] text-black text-sm">Join</button>
      </div>
    `;
    container.appendChild(card);
  });
})();
