// ====== PoolBet Final Demo JS ======
// Globals & user
const COINS = ['BTC','ETH','SOL','ARB','AVAX','DOGE','MATIC','ADA'];
const PRICE_BASE = { BTC:60000, ETH:2500, SOL:150, ARB:1.2, AVAX:35, DOGE:0.12, MATIC:0.8, ADA:0.45 };
let PRICE = JSON.parse(JSON.stringify(PRICE_BASE)); // mutable current prices

let USER = { connected:false, pubkey:null, balance:1000, bets:[], wins:0, losses:0 };

// UI helpers
function showPopup(msg, timeout=2500){ const p=document.getElementById('popup'); p.textContent=msg; p.classList.remove('hidden'); setTimeout(()=>p.classList.add('hidden'), timeout); }
function fmtMs(ms){ if(ms<=0) return '0s'; let s=Math.floor(ms/1000); const h=Math.floor(s/3600); s%=3600; const m=Math.floor(s/60); s%=60; if(h>0) return `${h}h ${m}m`; if(m>0) return `${m}m ${s}s`; return `${s}s`; }
function timeColor(ms){ if(ms<=120000) return 'text-down'; if(ms<=600000) return 'text-warn'; return 'text-up'; } // <2m red, <10m yellow, else green
function badgeStatus(st){ if(st==='OPEN') return 'bg-up/15 text-up border border-up/30';
  if(st==='LOCKED') return 'bg-cool/15 text-cool border border-cool/30';
  if(st==='RUNNING') return 'bg-warn/15 text-warn border border-warn/30';
  return 'bg-down/15 text-down border border-down/30';
}

// Wallet connect
const btnConnect = document.getElementById('btn-connect');
const walletInfo = document.getElementById('wallet-info');
const userStatsEl = document.getElementById('user-stats');

async function connectWallet(){
  const p = window.solana;
  if(!p || !p.isPhantom){
    USER.connected = true; USER.pubkey = 'DEMO-'+Math.random().toString(36).slice(2,8).toUpperCase();
    walletInfo.textContent = USER.pubkey;
    btnConnect.textContent = USER.pubkey.slice(0,6)+'...';
    showPopup('Demo wallet connected. Credits: $'+USER.balance.toFixed(2));
    updateUserStatsUI();
    return;
  }
  try{
    const resp = await p.connect();
    USER.connected=true; USER.pubkey=resp.publicKey.toString();
    walletInfo.textContent = USER.pubkey.slice(0,10);
    btnConnect.textContent = USER.pubkey.slice(0,6)+'...';
    showPopup('Wallet connected: '+USER.pubkey.slice(0,6));
    updateUserStatsUI();
  }catch(e){ console.log('connect cancelled', e); }
}
btnConnect.addEventListener('click', connectWallet);

function updateUserStatsUI(){
  userStatsEl.textContent = `Wins:${USER.wins} • Losses:${USER.losses} • Balance:$${USER.balance.toFixed(2)}`;
  userStatsEl.className = 'badge bg-grape/20 text-grape border border-grape/40';
}

// Pools
function randPick(a){ return a[Math.floor(Math.random()*a.length)]; }
function futureMs(minutes){ return Date.now() + minutes*60*1000; }

let POOLS = [];
for(let i=0;i<30;i++){
  const coin = randPick(COINS);
  const reg = [5,10,15,30][Math.floor(Math.random()*4)];
  const lockPlus = [10,30,60][Math.floor(Math.random()*3)];
  const resolvePlus = [5,15,30][Math.floor(Math.random()*3)];
  const registrationEnd = futureMs(Math.random()<0.6 ? reg : -Math.random()*60); // some past
  const lockTime = registrationEnd + lockPlus*60*1000;
  const resolveTime = lockTime + resolvePlus*60*1000;
  const now = Date.now();
  let status = 'OPEN';
  if(now >= resolveTime) status='RESOLVED';
  else if(now >= lockTime) status='RUNNING';
  else if(now >= registrationEnd) status='LOCKED';
  POOLS.push({
    id: 'POOL-'+(1000+i),
    name: `${coin} ${Math.random()>0.5?'UP':'DOWN'} #${i+1}`,
    coin,
    side: Math.random()>0.5?'UP':'DOWN',
    minBuy: [5,10,15,20,25,50][Math.floor(Math.random()*6)],
    buyIn: 0, entries: 0,
    registrationEnd, lockTime, resolveTime, status,
    targetPrice: Math.round(PRICE_BASE[coin]*(0.95+Math.random()*0.1)),
    participants: []
  });
}

// Filters
const fSearch = document.getElementById('f-search');
const fCoin = document.getElementById('f-coin');
const fBuy = document.getElementById('f-buy');
const fStatus = document.getElementById('f-status');
document.getElementById('f-reset').addEventListener('click', ()=>{ fSearch.value=''; fCoin.value=''; fBuy.value=''; fStatus.value=''; renderPools(); });
document.getElementById('f-apply').addEventListener('click', ()=> renderPools());

function applyFilters(list){
  const q = fSearch.value.trim().toLowerCase();
  const coin = fCoin.value;
  const buy = parseFloat(fBuy.value||'0');
  const status = fStatus.value;
  return list.filter(p=>{
    if(q && !(p.name.toLowerCase().includes(q) || p.coin.toLowerCase().includes(q))) return false;
    if(coin && p.coin !== coin) return false;
    if(!isNaN(buy) && buy>0 && p.minBuy>buy) return false;
    if(status && p.status !== status) return false;
    return true;
  });
}

// Render pools
const allList = document.getElementById('all-list');
const activeCount = document.getElementById('active-count');
const allCount = document.getElementById('all-count');
let selectedPoolId = null;

function renderPools(){
  const now = Date.now();
  POOLS.forEach(p=>{
    if(now >= p.resolveTime) p.status='RESOLVED';
    else if(now >= p.lockTime) p.status='RUNNING';
    else if(now >= p.registrationEnd) p.status='LOCKED';
    else p.status='OPEN';
  });
  const pools = applyFilters(POOLS);
  allCount.textContent = pools.length;
  activeCount.textContent = pools.filter(p=>p.status==='OPEN').length;

  allList.innerHTML = pools.map(p=>{
    const ms = p.status==='OPEN' ? p.registrationEnd-now :
               p.status==='LOCKED' ? p.lockTime-now :
               p.status==='RUNNING' ? p.resolveTime-now : 0;
    const tClass = timeColor(ms);
    const badge = badgeStatus(p.status);
    return `
    <div class="card p-4 space-y-2" data-id="${p.id}">
      <div class="flex items-center justify-between">
        <div class="font-semibold text-[15px]">${p.name}</div>
        <span class="badge ${badge}">${p.status}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 small">
        <div class="muted">Coin</div><div class="">${p.coin}</div>
        <div class="muted">Min Buy-in</div><div>$${p.minBuy}</div>
        <div class="muted">Target</div><div>$${p.targetPrice}</div>
        <div class="muted">Timer</div><div class="${tClass} font-semibold">${p.status==='RESOLVED'?'ended':fmtMs(ms)}</div>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-accent text-sm" data-action="join">Join</button>
        <button class="btn btn-ghost text-sm" data-action="status">View Status</button>
      </div>
    </div>`;
  }).join('');

  // attach handlers
  document.querySelectorAll('#all-list .card').forEach(el=>{
    el.onclick = (e)=>{
      const id = el.getAttribute('data-id');
      const act = e.target.getAttribute('data-action');
      if(act==='join') openJoinPanel(id);
      else if(act==='status') openStatusModal(id);
      else openJoinPanel(id);
    };
  });
}

// Join Panel + Modal
const joinPanel = document.getElementById('join-panel');
const modalJoin = document.getElementById('modal-join');
const joinPoolName = document.getElementById('join-pool-name');
const joinPoolInfo = document.getElementById('join-pool-info');
const betUp = document.getElementById('bet-up');
const betDown = document.getElementById('bet-down');
const betAmount = document.getElementById('bet-amount');
const betConfirm = document.getElementById('bet-confirm');
const betMsg = document.getElementById('bet-msg');
document.getElementById('modal-join-close').onclick = ()=> modalJoin.classList.add('hidden');
document.getElementById('bet-cancel').onclick = ()=> modalJoin.classList.add('hidden');
let chosenSide = 'UP';
betUp.onclick = ()=>{ chosenSide='UP'; betUp.classList.add('btn-accent'); betDown.classList.remove('btn-accent'); };
betDown.onclick = ()=>{ chosenSide='DOWN'; betDown.classList.add('btn-accent'); betUp.classList.remove('btn-accent'); };

function openJoinPanel(id){
  const p = POOLS.find(x=>x.id===id); if(!p) return;
  selectedPoolId = id;
  joinPanel.innerHTML = `
    <div class="small muted">Pool: <span class="font-semibold">${p.name}</span></div>
    <div class="small muted">Coin: <span class="font-semibold">${p.coin}</span></div>
    <div class="small muted">Min buy-in: <span class="font-semibold">$${p.minBuy}</span></div>
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button id="open-join" class="btn btn-accent">Open Join Modal</button>
      <button id="view-status" class="btn btn-ghost">View Status</button>
    </div>`;
  document.getElementById('open-join').onclick = ()=> openJoinModal(p);
  document.getElementById('view-status').onclick = ()=> openStatusModal(p.id);
}

function openJoinModal(p){
  if(!USER.connected){ showPopup('Connect wallet first'); return; }
  joinPoolName.textContent = p.name;
  joinPoolInfo.textContent = `Min: $${p.minBuy} • Status: ${p.status}`;
  betAmount.value = p.minBuy;
  chosenSide='UP'; betUp.classList.add('btn-accent'); betDown.classList.remove('btn-accent'); betMsg.textContent='';
  modalJoin.classList.remove('hidden');
  betConfirm.onclick = ()=> confirmBet(p);
}

function confirmBet(p){
  const amt = parseFloat(betAmount.value||'0');
  if(amt < p.minBuy){ betMsg.textContent='Amount below min buy-in'; return; }
  if(amt > USER.balance){ betMsg.textContent='Insufficient balance'; return; }
  p.participants.push({ user: USER.pubkey, side: chosenSide, amount: amt });
  p.entries +=1; p.buyIn += amt;
  USER.balance -= amt; USER.bets.push({ poolId:p.id, side:chosenSide, amount:amt });
  updateUserStatsUI();
  showPopup(`Bet placed: ${chosenSide} $${amt.toFixed(2)}`);
  modalJoin.classList.add('hidden');
  renderPools();
}

// Status Modal (participants + live expected payout)
const modalStatus = document.getElementById('modal-status');
const statusTitle = document.getElementById('status-title');
const statusBody = document.getElementById('status-body');
document.getElementById('modal-status-close').onclick = ()=> modalStatus.classList.add('hidden');

function openStatusModal(id){
  const p = typeof id==='string' ? POOLS.find(x=>x.id===id) : id;
  if(!p) return;
  statusTitle.textContent = `Status – ${p.name}`;
  // Build participants table
  const rows = p.participants.length ? p.participants.map(pt=>`<tr>
      <td class="py-1 small">${pt.user? (pt.user.slice(0,6)+'...'): 'anon'}</td>
      <td class="py-1 small ${pt.side==='UP'?'text-up':'text-down'}">${pt.side}</td>
      <td class="py-1 small">$${pt.amount.toFixed(2)}</td>
    </tr>`).join('') : `<tr><td class="py-2 small muted" colspan="3">No participants yet</td></tr>`;

  const coin = p.coin;
  const price = PRICE[coin];
  const leading = price >= p.targetPrice ? 'UP' : 'DOWN';
  const totalUp = p.participants.filter(x=>x.side==='UP').reduce((s,a)=>s+a.amount,0);
  const totalDown = p.participants.filter(x=>x.side==='DOWN').reduce((s,a)=>s+a.amount,0);
  const pot = totalUp + totalDown;
  // expected payout for your bet if pool resolved now (simple: pro-rata on winning side, 90% to winners)
  const yourBet = p.participants.find(x=>x.user===USER.pubkey);
  let expected = '-';
  if(yourBet){
    const winnersTotal = (leading==='UP'? totalUp: totalDown) || 1;
    const share = yourBet.amount / winnersTotal;
    expected = '$' + (pot * 0.9 * share).toFixed(2);
  }

  statusBody.innerHTML = `
    <div class="grid md:grid-cols-3 gap-3">
      <div class="card p-3">
        <div class="small muted">Coin</div><div class="text-lg font-semibold">${coin}</div>
        <div class="small muted mt-2">Target Price</div><div class="font-semibold">$${p.targetPrice}</div>
        <div class="small muted mt-2">Current Price</div><div class="font-semibold">$${price.toFixed(2)}</div>
        <div class="small muted mt-2">Leading</div><div class="font-semibold ${leading==='UP'?'text-up':'text-down'}">${leading}</div>
      </div>
      <div class="card p-3">
        <div class="small muted">Pool</div>
        <div class="font-semibold">$${pot.toFixed(2)} <span class="small muted">(Up:$${totalUp.toFixed(2)} / Down:$${totalDown.toFixed(2)})</span></div>
        <div class="small muted mt-2">Your expected payout now</div>
        <div class="font-semibold">${expected}</div>
      </div>
      <div class="card p-3 md:col-span-1">
        <div class="small muted mb-2">Participants</div>
        <table class="w-full">
          <thead><tr class="small muted"><th class="text-left">User</th><th class="text-left">Side</th><th class="text-left">Amount</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  modalStatus.classList.remove('hidden');
}

// Create Pool
const modalCreate = document.getElementById('modal-create');
document.getElementById('btn-create').onclick = ()=> modalCreate.classList.remove('hidden');
document.getElementById('modal-create-close').onclick = ()=> modalCreate.classList.add('hidden');
document.getElementById('cp-cancel').onclick = ()=> modalCreate.classList.add('hidden');
document.getElementById('cp-create').onclick = ()=> {
  const name = document.getElementById('cp-name').value.trim();
  const coin = document.getElementById('cp-coin').value;
  const price = parseFloat(document.getElementById('cp-price').value);
  const datetime = document.getElementById('cp-datetime').value;
  const buyin = parseFloat(document.getElementById('cp-buyin').value);
  const windowMin = parseInt(document.getElementById('cp-window').value,10);
  if(!name||!coin||!price||!datetime||!buyin||!windowMin){ document.getElementById('cp-msg').textContent='Fill all fields'; return; }
  const id = 'POOL-'+Math.random().toString(36).slice(2,7).toUpperCase();
  const regEnd = futureMs(windowMin);
  const lock = regEnd + 5*60*1000;
  const resolve = lock + 5*60*1000;
  const pool = { id, name, coin, side:'UP', minBuy:buyin, buyIn:0, entries:0, status:'OPEN', registrationEnd:regEnd, lockTime:lock, resolveTime:resolve, targetPrice: price, participants:[], creator: USER.pubkey };
  POOLS.unshift(pool);
  renderPools();
  modalCreate.classList.add('hidden');
  showPopup(`✅ Pool created: ${name} (${coin})`);
};

// Simulate random joins every 25–40s
function simulateRandomJoins(pool, count){
  let joined=0;
  const iv = setInterval(()=>{
    if(joined>=count){ clearInterval(iv); return; }
    const side = Math.random()>0.5?'UP':'DOWN';
    const amt = [5,10,15,20,25][Math.floor(Math.random()*5)];
    pool.participants.push({ user:'RND-'+Math.random().toString(36).slice(2,6), side, amount:amt });
    pool.entries++; pool.buyIn += amt;
    joined++;
    renderPools();
  }, 400 + Math.random()*800);
}
setInterval(()=>{
  const opens = POOLS.filter(p=>p.status==='OPEN'); if(opens.length===0) return;
  const p = opens[Math.floor(Math.random()*opens.length)];
  simulateRandomJoins(p, 5+Math.floor(Math.random()*16));
}, 25000 + Math.random()*15000);

// Resolve pools periodically (affects user stats)
function resolvePools(){
  POOLS.forEach(p=>{
    if(p.status==='RESOLVED' && !p._settled){ // settle once
      const totalUp = p.participants.filter(x=>x.side==='UP').reduce((s,a)=>s+a.amount,0);
      const totalDown = p.participants.filter(x=>x.side==='DOWN').reduce((s,a)=>s+a.amount,0);
      const pot = totalUp + totalDown;
      // Decide winner by final price vs target
      const winner = PRICE[p.coin] >= p.targetPrice ? 'UP' : 'DOWN';
      p.winner = winner;
      const yourBet = p.participants.find(x=>x.user===USER.pubkey);
      if(yourBet){
        if(yourBet.side===winner){
          const winnersTotal = (winner==='UP'? totalUp: totalDown) || 1;
          const share = yourBet.amount / winnersTotal;
          const reward = pot * 0.9 * share;
          USER.wins++; USER.balance += reward;
          showPopup(`🎉 You won $${reward.toFixed(2)} in ${p.name}`);
        }else{
          USER.losses++;
          showPopup(`❌ You lost $${yourBet.amount.toFixed(2)} in ${p.name}`);
        }
        updateUserStatsUI();
      }
      p._settled = true;
    }
  });
}
setInterval(()=>{
  const now = Date.now();
  POOLS.forEach(p=>{ if(p.status!=='RESOLVED' && now>=p.resolveTime) p.status='RESOLVED'; });
  resolvePools();
  renderPools();
}, 4000);

// Price ticker (random drift per coin)
setInterval(()=>{
  for(const c of COINS){
    const b = PRICE_BASE[c];
    const vol = b*0.0015; // 0.15% tick
    PRICE[c] = Math.max(0.0001, PRICE[c] + (Math.random()-0.5)*2*vol);
  }
}, 2000);

// Initial render
renderPools();
updateUserStatsUI();

// ====== End ======
