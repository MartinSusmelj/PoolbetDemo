// PoolBet Updated Demo JS
// Files: index.html, app-updated.js, favicon.svg
const btnConnect = document.getElementById('btn-connect');
const walletInfo = document.getElementById('wallet-info');
const userStatsEl = document.getElementById('user-stats');
let USER = { connected:false, pubkey:null, balance:1000, bets:[], wins:0, losses:0 };
function showPopup(msg, timeout=3000){ const p=document.getElementById('popup'); p.textContent=msg; p.classList.remove('hidden'); setTimeout(()=>p.classList.add('hidden'), timeout); }

async function connectWallet(){
  const p = window.solana;
  if (!p || !p.isPhantom){
    showPopup('Phantom not found — entering demo wallet',2000);
    // demo connect
    USER.connected=true; USER.pubkey='DEMO-'+Math.random().toString(36).slice(2,8).toUpperCase();
    walletInfo.textContent = USER.pubkey;
    btnConnect.textContent = USER.pubkey.slice(0,6)+'...';
    updateUserStatsUI();
    showPopup('Connected as demo wallet. Credits: $'+USER.balance,3000);
    return;
  }
  try{
    const resp = await p.connect();
    USER.connected=true; USER.pubkey=resp.publicKey.toString();
    walletInfo.textContent = USER.pubkey.slice(0,10);
    btnConnect.textContent = USER.pubkey.slice(0,6)+'...';
    showPopup('Wallet connected: '+USER.pubkey.slice(0,6),2000);
    updateUserStatsUI();
  }catch(e){
    console.log('connect cancelled',e);
  }
}
btnConnect.addEventListener('click', connectWallet);

function updateUserStatsUI(){ userStatsEl.textContent = `Wins:${USER.wins} Losses:${USER.losses} Balance:$${USER.balance.toFixed(2)}`; }

// Pools data with timings: registrationEnd, lockTime, resolveTime (timestamps ms)
const COINS = ['BTC','ETH','SOL','ARB','AVAX','DOGE','MATIC','ADA'];
function randPick(a){ return a[Math.floor(Math.random()*a.length)]; }
function futureMs(minutes){ return Date.now() + minutes*60*1000; }

let POOLS = [];
for(let i=0;i<24;i++){
  const coin = randPick(COINS);
  const status = ['OPEN','LOCKED','RUNNING','RESOLVED'][Math.floor(Math.random()*4)];
  const regMinutes = [5,10,15,30][Math.floor(Math.random()*4)];
  const lockMinutes = regMinutes + [10,30,60][Math.floor(Math.random()*3)];
  const resolveMinutes = lockMinutes + [5,15,30][Math.floor(Math.random()*3)];
  const now = Date.now();
  const registrationEnd = now + (status==='OPEN' ? regMinutes*60*1000 : -1000);
  const lockTime = now + (status==='RUNNING' ? 5*60*1000 : lockMinutes*60*1000);
  const resolveTime = now + resolveMinutes*60*1000;
  POOLS.push({
    id:'POOL-'+(1000+i),
    name:`${coin} ${Math.random()>0.5?'UP':'DOWN'} #${i+1}`,
    coin, side:Math.random()>0.5?'UP':'DOWN',
    minBuy: [5,10,15,20,25][Math.floor(Math.random()*5)],
    buyIn:0, entries: Math.floor(Math.random()*60),
    status: status,
    registrationEnd, lockTime, resolveTime,
    targetPrice: Math.round(100 + Math.random()*50000),
    participants: []
  });
}

// Utilities: format countdown
function fmtMs(ms){ if(ms<=0) return '0s'; let s=Math.floor(ms/1000); const h=Math.floor(s/3600); s%=3600; const m=Math.floor(s/60); s%=60; if(h>0) return `${h}h ${m}m`; if(m>0) return `${m}m ${s}s`; return `${s}s`; }

// Rendering
const allList = document.getElementById('all-list');
const activeCount = document.getElementById('active-count');
const allCount = document.getElementById('all-count');
const joinPanel = document.getElementById('join-panel');
let selectedPoolId = null;

function renderPools(){
  const now = Date.now();
  POOLS.forEach(p=>{
    // update status based on times
    if(p.status !== 'RESOLVED'){
      if(now >= p.resolveTime){ p.status='RESOLVED'; }
      else if(now >= p.lockTime){ p.status='RUNNING'; }
      else if(now >= p.registrationEnd){ p.status='LOCKED'; }
      else { p.status='OPEN'; }
    }
  });
  const html = POOLS.map(p => {
    const countdown = p.status==='OPEN' ? fmtMs(p.registrationEnd - now) :
                      p.status==='LOCKED' ? fmtMs(p.lockTime - now) :
                      p.status==='RUNNING' ? fmtMs(p.resolveTime - now) : 'ended';
    return `
    <div class="card p-4 cursor-pointer" data-id="${p.id}">
      <div class="flex justify-between"><div class="font-semibold">${p.name}</div><div class="small muted">${p.coin}</div></div>
      <div class="mt-2 small muted">Min: $${p.minBuy} • Entries: ${p.entries}</div>
      <div class="mt-2"><div class="small muted">Status: <span class="font-semibold">${p.status}</span></div><div class="small muted">Timer: <span class="font-semibold">${countdown}</span></div></div>
    </div>`;
  }).join('');
  allList.innerHTML = html;
  activeCount.textContent = POOLS.filter(p=>p.status==='OPEN').length;
  allCount.textContent = POOLS.length;
  // attach click handlers
  document.querySelectorAll('#all-list .card').forEach(el=>{
    el.onclick = ()=>{
      selectedPoolId = el.getAttribute('data-id');
      openJoinPanel(selectedPoolId);
    };
  });
}

function openJoinPanel(id){
  const p = POOLS.find(x=>x.id===id);
  if(!p) return;
  selectedPoolId = id;
  joinPanel.innerHTML = `
    <div class="small muted">Pool: <span class="font-semibold">${p.name}</span></div>
    <div class="small muted">Coin: <span class="font-semibold">${p.coin}</span></div>
    <div class="small muted">Min buy-in: <span class="font-semibold">$${p.minBuy}</span></div>
    <div class="mt-3 small muted">Status: <span class="font-semibold">${p.status}</span></div>
    <div class="mt-3 grid grid-cols-2 gap-2">
      <button id="open-join" class="btn btn-accent">Open Join Modal</button>
      <button id="sim-join" class="btn btn-ghost">Simulate Joiners</button>
    </div>`;
  document.getElementById('open-join').onclick = ()=> openJoinModal(p);
  document.getElementById('sim-join').onclick = ()=> simulateRandomJoins(p, Math.floor(Math.random()*16)+5);
}

// Join modal
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

function openJoinModal(p){
  if(!USER.connected){ showPopup('Connect wallet first',2000); return; }
  joinPoolName.textContent = p.name;
  joinPoolInfo.textContent = `Min: $${p.minBuy} • Status: ${p.status}`;
  betAmount.value = p.minBuy;
  chosenSide = 'UP'; betUp.classList.add('btn-accent'); betDown.classList.remove('btn-accent');
  betMsg.textContent = '';
  modalJoin.classList.remove('hidden');
  betConfirm.onclick = ()=> confirmBet(p);
}

function confirmBet(p){
  const amt = parseFloat(betAmount.value || '0');
  if(amt < p.minBuy){ betMsg.textContent = 'Amount below min buy-in'; return; }
  if(amt > USER.balance){ betMsg.textContent = 'Insufficient balance'; return; }
  // register participation
  p.participants.push({ user: USER.pubkey, side: chosenSide, amount: amt });
  p.entries +=1;
  p.buyIn += amt;
  USER.balance -= amt;
  USER.bets.push({ poolId: p.id, side: chosenSide, amount: amt });
  updateUserStatsUI();
  showPopup('Bet placed: '+chosenSide+' $'+amt,2000);
  modalJoin.classList.add('hidden');
  renderPools();
}

// Create modal actions
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
  showPopup('Pool created: '+name,2500);
  document.getElementById('cp-msg').textContent='';
  // mark in filters by showing "Your pool" in join panel if selected
};

// Simulate random joiners over time
function simulateRandomJoins(pool, count){
  let joined=0;
  const iv = setInterval(()=>{
    if(joined>=count){ clearInterval(iv); return; }
    const side = Math.random()>0.5?'UP':'DOWN';
    const amt = [5,10,15,20][Math.floor(Math.random()*4)];
    pool.participants.push({ user:'RANDOM-'+Math.random().toString(36).slice(2,6), side, amount:amt });
    pool.entries +=1; pool.buyIn += amt;
    joined++;
    renderPools();
  }, 400 + Math.random()*800);
}

// Background: auto-joiners randomly for OPEN pools
setInterval(()=>{
  const openPools = POOLS.filter(p=>p.status==='OPEN');
  if(openPools.length===0) return;
  const p = openPools[Math.floor(Math.random()*openPools.length)];
  const joins = Math.floor(Math.random()*16)+5;
  simulateRandomJoins(p, joins);
}, 30*1000);

// Resolve pools when resolveTime passes
function resolvePools(){
  POOLS.forEach(p=>{
    if(p.status==='RESOLVED') return;
    if(Date.now() >= p.resolveTime){
      // decide winning side randomly biased by participants
      const up = p.participants.filter(x=>x.side==='UP').reduce((s,a)=>s+a.amount,0);
      const down = p.participants.filter(x=>x.side==='DOWN').reduce((s,a)=>s+a.amount,0);
      const winner = (up+down===0) ? (Math.random()>0.5?'UP':'DOWN') : (up>down? 'UP':'DOWN');
      p.winner = winner;
      p.status='RESOLVED';
      // payout simulation: update USER stats if participated
      const you = p.participants.find(x=>x.user===USER.pubkey);
      if(you){
        const won = you.side===winner;
        if(won){ USER.wins +=1; USER.balance += you.amount * 1.8; showPopup('You won $'+(you.amount*0.8).toFixed(2),3000); }
        else { USER.losses +=1; showPopup('You lost $'+(you.amount).toFixed(2),3000); }
      }
      // small cleanup
    }
  });
  updateUserStatsUI();
  renderPools();
}
setInterval(resolvePools, 5000);

// Initial render and countdown updater
renderPools();
setInterval(renderPools, 1000);

// search filter hook
document.getElementById('f-search').addEventListener('input', ()=> { const q=document.getElementById('f-search').value.trim().toLowerCase(); const filtered = POOLS.filter(p=> p.name.toLowerCase().includes(q) || p.coin.toLowerCase().includes(q)); document.getElementById('all-list').innerHTML = filtered.map(p=>`<div class="card p-4"><div class="flex justify-between"><div class="font-semibold">${p.name}</div><div class="small muted">${p.coin}</div></div><div class="mt-2 small muted">Status: ${p.status}</div></div>`).join(''); });

// helper futureMs used in index is not available here; define simple
function futureMs(minutes){ return Date.now() + minutes*60*1000; }