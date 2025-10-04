// v9: switch to Chart.js; charts in Status and Join modals with target/prediction/final overlays.
const COINS=['BTC','ETH','SOL','ARB','AVAX','DOGE','MATIC','ADA'];
const PRICE_BASE={BTC:60000,ETH:2500,SOL:150,ARB:1.2,AVAX:35,DOGE:0.12,MATIC:0.8,ADA:0.45};
let PRICE=JSON.parse(JSON.stringify(PRICE_BASE));
let PRICE_HISTORY={};

let USER={connected:false,pubkey:null,balance:1000,bets:[],wins:0,losses:0};

function showPopup(msg,t=2500){const p=document.getElementById('popup');p.textContent=msg;p.classList.remove('hidden');setTimeout(()=>p.classList.add('hidden'),t);}
function fmtMs(ms){if(ms<=0)return'0s';let s=Math.floor(ms/1000);const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60);s%=60;if(h>0)return`${h}h ${m}m`;if(m>0)return`${m}m ${s}s`;return`${s}s`;}
function timeColor(ms){if(ms<=120000)return'text-down';if(ms<=600000)return'text-warn';return'text-up';}
function badgeStatus(st){if(st==='OPEN')return'bg-up/15 text-up border border-up/30';if(st==='LOCKED')return'bg-cool/15 text-cool border border-cool/30';if(st==='RUNNING')return'bg-warn/15 text-warn border border-warn/30';return'bg-down/15 text-down border border-down/30';}

const btnConnect=document.getElementById('btn-connect');const walletInfo=document.getElementById('wallet-info');const userStatsEl=document.getElementById('user-stats');
async function connectWallet(){const p=window.solana;if(!p||!p.isPhantom){USER.connected=true;USER.pubkey='DEMO-'+Math.random().toString(36).slice(2,8).toUpperCase();walletInfo.textContent=USER.pubkey;btnConnect.textContent=USER.pubkey.slice(0,6)+'...';showPopup('Demo wallet connected. Credits: $'+USER.balance.toFixed(2));updateUserStatsUI();renderPools();return;}try{const r=await p.connect();USER.connected=true;USER.pubkey=r.publicKey.toString();walletInfo.textContent=USER.pubkey.slice(0,10);btnConnect.textContent=USER.pubkey.slice(0,6)+'...';showPopup('Wallet connected: '+USER.pubkey.slice(0,6));updateUserStatsUI();renderPools();}catch(e){console.log('connect cancelled',e);}}
btnConnect.addEventListener('click',connectWallet);
function updateUserStatsUI(){userStatsEl.textContent=`Wins:${USER.wins} • Losses:${USER.losses} • Balance:$${USER.balance.toFixed(2)}`;userStatsEl.className='badge bg-grape/20 text-grape border border-grape/40';}

function randPick(a){return a[Math.floor(Math.random()*a.length)];}
function futureMs(min){return Date.now()+min*60*1000;}
function nowSec(){return Math.floor(Date.now()/1000);}

// Seed history
for(const c of COINS){const base=PRICE_BASE[c];PRICE_HISTORY[c]=[];let v=base;for(let i=240;i>0;i--){v=Math.max(0.0001,v+(Math.random()-0.5)*base*0.002);PRICE_HISTORY[c].push({t:nowSec()-i*60,y:+v.toFixed(4)});}}

let POOLS=[];
for(let i=0;i<24;i++){const coin=randPick(COINS);const reg=[5,10,15,30][Math.floor(Math.random()*4)];const lockPlus=[10,30,60][Math.floor(Math.random()*3)];const resolvePlus=[5,15,30][Math.floor(Math.random()*3)];const registrationEnd=futureMs(Math.random()<0.6?reg:-Math.random()*60);const lockTime=registrationEnd+lockPlus*60*1000;const resolveTime=lockTime+resolvePlus*60*1000;const now=Date.now();let status='OPEN';if(now>=resolveTime)status='RESOLVED';else if(now>=lockTime)status='RUNNING';else if(now>=registrationEnd)status='LOCKED';const target=Math.round(PRICE_BASE[coin]*(0.95+Math.random()*0.1));const pool={id:'POOL-'+(1000+i),name:`${coin} Pool #${i+1}`,coin,minBuy:[5,10,15,20,25,50][Math.floor(Math.random()*6)],buyIn:0,entries:0,registrationEnd,lockTime,resolveTime,status,targetPrice:target,participants:[],creator:null,winners:[],payouts:{}};const baseJoins=Math.floor(Math.random()*10);for(let j=0;j<baseJoins;j++){const amt=[5,10,15,20,25][Math.floor(Math.random()*5)];const pred=+(target*(0.95+Math.random()*0.1)).toFixed(2);pool.participants.push({user:'RND-'+Math.random().toString(36).slice(2,6),amount:amt,predictedPrice:pred});pool.entries++;pool.buyIn+=amt;}POOLS.push(pool);}

const fSearch=document.getElementById('f-search');const fCoin=document.getElementById('f-coin');const fBuy=document.getElementById('f-buy');const fStatus=document.getElementById('f-status');const fYours=document.getElementById('f-yours');
document.getElementById('f-reset').addEventListener('click',()=>{fSearch.value='';fCoin.value='';fBuy.value='';fStatus.value='';fYours.checked=false;renderPools();});
document.getElementById('f-apply').addEventListener('click',()=>renderPools());

function applyFilters(list){const q=fSearch.value.trim().toLowerCase();const coin=fCoin.value;const buy=parseFloat(fBuy.value||'0');const status=fStatus.value;const onlyYours=fYours.checked;return list.filter(p=>{if(q&&!(p.name.toLowerCase().includes(q)||p.coin.toLowerCase().includes(q)))return false;if(coin&&p.coin!==coin)return false;if(!isNaN(buy)&&buy>0&&p.minBuy>buy)return false;if(status&&p.status!==status)return false;if(onlyYours&&(!USER.connected||p.creator!==USER.pubkey))return false;return true;});}

const allList=document.getElementById('all-list');const activeCount=document.getElementById('active-count');const allCount=document.getElementById('all-count');
function badgeYours(p){return(USER.connected&&p.creator===USER.pubkey)?'<span class="badge bg-grape/20 text-grape border border-grape/40">Yours</span>':'';}

function renderPools(){const now=Date.now();POOLS.forEach(p=>{if(now>=p.resolveTime)p.status='RESOLVED';else if(now>=p.lockTime)p.status='RUNNING';else if(now>=p.registrationEnd)p.status='LOCKED';else p.status='OPEN';});const pools=applyFilters(POOLS);allCount.textContent=pools.length;activeCount.textContent=pools.filter(p=>p.status==='OPEN').length;allList.innerHTML=pools.map(p=>{const ms=p.status==='OPEN'?p.registrationEnd-now:p.status==='LOCKED'?p.lockTime-now:p.status==='RUNNING'?p.resolveTime-now:0;const tClass=timeColor(ms);const badge=badgeStatus(p.status);const joinDisabled=(p.status==='RESOLVED'||p.status==='LOCKED')?'btn-disabled':'';const joinAttr=(p.status==='RESOLVED'||p.status==='LOCKED')?'disabled':'';return `<div class="card p-4 space-y-2" data-id="${p.id}">
  <div class="flex items-center justify-between gap-2">
    <div class="font-semibold text-[15px]">${p.name}</div>
    <div class="flex items-center gap-2">${badgeYours(p)}<span class="badge ${badge}">${p.status}</span></div>
  </div>
  <div class="grid grid-cols-2 gap-2 small">
    <div class="muted">Coin</div><div>${p.coin}</div>
    <div class="muted">Min Buy-in</div><div>$${p.minBuy}</div>
    <div class="muted">Target</div><div>$${p.targetPrice}</div>
    <div class="muted">Timer</div><div class="${tClass} font-semibold">${p.status==='RESOLVED'?'ended':fmtMs(ms)}</div>
  </div>
  <div class="flex gap-2">
    <button class="btn btn-accent text-sm ${joinDisabled}" data-action="join" ${joinAttr}>Join</button>
    <button class="btn btn-ghost text-sm" data-action="status">View Status</button>
  </div>
</div>`;}).join('');document.querySelectorAll('#all-list .card').forEach(el=>{el.onclick=(e)=>{const id=el.getAttribute('data-id');const act=e.target.getAttribute('data-action');const p=POOLS.find(x=>x.id===id);if(!p)return;if(act==='join'){if(p.status==='RESOLVED'||p.status==='LOCKED')return;openJoinModal(p);}else if(act==='status'){openStatusModal(id);}else{if(!(p.status==='RESOLVED'||p.status==='LOCKED'))openJoinModal(p);}}});}

const modalJoin=document.getElementById('modal-join');const joinPoolName=document.getElementById('join-pool-name');const joinPoolInfo=document.getElementById('join-pool-info');const betAmount=document.getElementById('bet-amount');const betPrice=document.getElementById('bet-price');const betConfirm=document.getElementById('bet-confirm');const betMsg=document.getElementById('bet-msg');const joinChartEl=document.getElementById('join-chart');let joinChart=null;document.getElementById('modal-join-close').onclick=()=>modalJoin.classList.add('hidden');document.getElementById('bet-cancel').onclick=()=>modalJoin.classList.add('hidden');
function openJoinModal(p){if(!USER.connected){showPopup('Connect wallet first');return;}joinPoolName.textContent=p.name;joinPoolInfo.textContent=`Min: $${p.minBuy} • Status: ${p.status}`;betAmount.value=p.minBuy;betPrice.value=p.targetPrice;betMsg.textContent='';modalJoin.classList.remove('hidden');drawJoinChart(p);betConfirm.onclick=()=>confirmBet(p);}
function drawJoinChart(p){if(joinChart){joinChart.destroy();joinChart=null;}const d=(PRICE_HISTORY[p.coin]||[]).slice(-120);joinChart=new Chart(joinChartEl.getContext('2d'),{type:'line',data:{labels:d.map(x=>new Date(x.t*1000).toLocaleTimeString()),datasets:[{label:`${p.coin} price`,data:d.map(x=>x.y),fill:false,tension:0.25}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{enabled:true}},scales:{x:{display:false},y:{display:true}}}});}

function confirmBet(p){const amt=parseFloat(betAmount.value||'0');const pred=parseFloat(betPrice.value||'0');if(amt<p.minBuy){betMsg.textContent='Amount below min buy-in';return;}if(amt>USER.balance){betMsg.textContent='Insufficient balance';return;}if(!(pred>0)){betMsg.textContent='Enter a valid predicted price';return;}p.participants.push({user:USER.pubkey,amount:amt,predictedPrice:pred});p.entries++;p.buyIn+=amt;USER.balance-=amt;USER.bets.push({poolId:p.id,amount:amt,predictedPrice:pred});updateUserStatsUI();showPopup(`Bet placed: $${amt.toFixed(2)} @ $${pred.toFixed(2)}`);modalJoin.classList.add('hidden');renderPools();}

const modalStatus=document.getElementById('modal-status');const statusTitle=document.getElementById('status-title');const statusBody=document.getElementById('status-body');const statusChartEl=document.getElementById('status-chart');let statusChart=null;document.getElementById('modal-status-close').onclick=()=>modalStatus.classList.add('hidden');
function openStatusModal(id){const p=POOLS.find(x=>x.id===id);if(!p)return;statusTitle.textContent=`Status – ${p.name}`;const price=PRICE[p.coin];const pot=p.participants.reduce((s,a)=>s+a.amount,0);let rows=p.participants.map(pt=>`<tr><td class="py-1 small">${pt.user?pt.user.slice(0,6)+'…':'anon'}</td><td class="py-1 small">$${pt.amount.toFixed(2)}</td><td class="py-1 small">$${pt.predictedPrice.toFixed(2)}</td></tr>`).join('');if(!rows)rows=`<tr><td class="py-2 small muted" colspan="3">No participants yet</td></tr>`;let bestErr=Infinity;p.participants.forEach(pt=>{bestErr=Math.min(bestErr,Math.abs(price-pt.predictedPrice));});const winnersNow=p.participants.filter(pt=>Math.abs(price-pt.predictedPrice)===bestErr);const shareNow=p.participants.length?(pot*0.9/Math.max(1,winnersNow.length)):0;const youNow=winnersNow.some(w=>w.user===USER.pubkey);const expectNow=p.participants.length?(youNow?('$'+shareNow.toFixed(2)):'$0.00'):'-';statusBody.innerHTML=`<div class="grid md:grid-cols-3 gap-3"><div class="card p-3"><div class="small muted">Coin</div><div class="text-lg font-semibold">${p.coin}</div><div class="small muted mt-2">Target Price</div><div class="font-semibold">$${p.targetPrice}</div><div class="small muted mt-2">Current Price</div><div class="font-semibold">$${price.toFixed(2)}</div></div><div class="card p-3"><div class="small muted">Pot</div><div class="font-semibold">$${pot.toFixed(2)}</div><div class="small muted mt-2">Your expected payout now</div><div class="font-semibold">${expectNow}</div></div><div class="card p-3 md:col-span-1"><div class="small muted mb-2">Participants</div><table class="w-full"><thead><tr class="small muted"><th class="text-left">User</th><th class="text-left">Amount</th><th class="text-left">Prediction</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;modalStatus.classList.remove('hidden');drawStatusChart(p);}
function drawStatusChart(p){if(statusChart){statusChart.destroy();statusChart=null;}const d=(PRICE_HISTORY[p.coin]||[]).slice(-240);const labels=d.map(x=>new Date(x.t*1000).toLocaleTimeString());const data=d.map(x=>x.y);const datasets=[{label:`${p.coin} price`,data,fill:false,tension:0.25}];statusChart=new Chart(statusChartEl.getContext('2d'),{type:'line',data:{labels,datasets},options:{responsive:true,plugins:{legend:{display:false},tooltip:{enabled:true},annotation:{annotations:{}}},scales:{x:{display:false},y:{display:true}}}});
  // Add overlay lines manually via plugin (simple horizontal lines)
  const ctx=statusChart.ctx;const yScale=statusChart.scales.y;
  function drawHoriz(val, label){const y=yScale.getPixelForValue(val);ctx.save();ctx.strokeStyle='rgba(124,147,246,0.9)';ctx.lineWidth=1.5;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(statusChart.chartArea.left,y);ctx.lineTo(statusChart.chartArea.right,y);ctx.stroke();ctx.fillStyle='rgba(124,147,246,0.9)';ctx.fillText(label+' $'+val.toFixed(2), statusChart.chartArea.left+6, y-4);ctx.restore();}
  function drawHorizCyan(val, label){const y=yScale.getPixelForValue(val);ctx.save();ctx.strokeStyle='rgba(34,211,238,0.9)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(statusChart.chartArea.left,y);ctx.lineTo(statusChart.chartArea.right,y);ctx.stroke();ctx.fillStyle='rgba(34,211,238,0.9)';ctx.fillText(label+' $'+val.toFixed(2), statusChart.chartArea.left+6, y-4);ctx.restore();}
  function drawHorizRed(val, label){const y=yScale.getPixelForValue(val);ctx.save();ctx.strokeStyle='rgba(239,68,68,0.9)';ctx.lineWidth=1;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(statusChart.chartArea.left,y);ctx.lineTo(statusChart.chartArea.right,y);ctx.stroke();ctx.fillStyle='rgba(239,68,68,0.9)';ctx.fillText(label+' $'+val.toFixed(2), statusChart.chartArea.left+6, y-4);ctx.restore();}
  // draw after first render
  setTimeout(()=>{
    drawHoriz(p.targetPrice,'Target');
    const your=p.participants.find(x=>x.user===USER.pubkey);
    if(your) drawHorizCyan(your.predictedPrice,'Your prediction');
    if(p.status==='RESOLVED') drawHorizRed(PRICE[p.coin],'Final');
  },0);
}

const modalCreate=document.getElementById('modal-create');document.getElementById('btn-create').onclick=()=>modalCreate.classList.remove('hidden');document.getElementById('modal-create-close').onclick=()=>modalCreate.classList.add('hidden');document.getElementById('cp-cancel').onclick=()=>modalCreate.classList.add('hidden');document.getElementById('cp-create').onclick=()=>{const name=document.getElementById('cp-name').value.trim();const coin=document.getElementById('cp-coin').value;const price=parseFloat(document.getElementById('cp-price').value);const dt=document.getElementById('cp-datetime').value;const buyin=parseFloat(document.getElementById('cp-buyin').value);const win=parseInt(document.getElementById('cp-window').value,10);if(!name||!coin||!price||!dt||!buyin||!win){document.getElementById('cp-msg').textContent='Fill all fields';return;}const id='POOL-'+Math.random().toString(36).slice(2,7).toUpperCase();const regEnd=futureMs(win);const lock=regEnd+5*60*1000;const resolve=lock+5*60*1000;const pool={id,name,coin,minBuy:buyin,buyIn:0,entries:0,status:'OPEN',registrationEnd:regEnd,lockTime:lock,resolveTime:resolve,targetPrice:price,participants:[],creator:USER.pubkey,winners:[],payouts:{}};POOLS.unshift(pool);renderPools();modalCreate.classList.add('hidden');showPopup(`✅ Pool created: ${name} (${coin})`);const count=3+Math.floor(Math.random()*8);const duration=Math.max(1000,regEnd-Date.now());const step=Math.max(800,Math.floor(duration/count));let joined=0;const iv=setInterval(()=>{if(Date.now()>=regEnd||joined>=count){clearInterval(iv);return;}const amt=[5,10,15,20,25][Math.floor(Math.random()*5)];const pred=+(price*(0.97+Math.random()*0.06)).toFixed(2);pool.participants.push({user:'RND-'+Math.random().toString(36).slice(2,6),amount:amt,predictedPrice:pred});pool.entries++;pool.buyIn+=amt;joined++;renderPools();},step);};

function resolvePools(){const now=Date.now();POOLS.forEach(p=>{if(p.status!=='RESOLVED'&&now>=p.resolveTime)p.status='RESOLVED';if(p.status==='RESOLVED'&&!p._settled){const finalPrice=PRICE[p.coin];const pot=p.participants.reduce((s,a)=>s+a.amount,0);if(p.participants.length>0){let best=Infinity;p.participants.forEach(pt=>{best=Math.min(best,Math.abs(finalPrice-pt.predictedPrice));});const winners=p.participants.filter(pt=>Math.abs(finalPrice-pt.predictedPrice)===best);const share=pot*0.9/Math.max(1,winners.length);p.winners=winners.map(w=>w.user);p.payouts={};winners.forEach(w=>p.payouts[w.user]=share);const your=winners.find(w=>w.user===USER.pubkey);if(your){USER.wins++;USER.balance+=share;showPopup(`🎉 You won $${share.toFixed(2)} in ${p.name}`);}else if(p.participants.some(pt=>pt.user===USER.pubkey)){USER.losses++;showPopup(`❌ You lost in ${p.name}`);}updateUserStatsUI();}p._settled=true;}});renderPools();}
setInterval(resolvePools,4000);

// Update prices & history
setInterval(()=>{for(const c of COINS){const b=PRICE_BASE[c];const vol=b*0.0015;PRICE[c]=Math.max(0.0001,PRICE[c]+(Math.random()-0.5)*2*vol);PRICE_HISTORY[c].push({t:nowSec(),y:+PRICE[c].toFixed(4)});if(PRICE_HISTORY[c].length>480)PRICE_HISTORY[c].shift();}},2000);

renderPools();updateUserStatsUI();