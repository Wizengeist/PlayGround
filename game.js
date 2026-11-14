(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const W = 640, H = 360, canvas = $('stage'), ctx = canvas.getContext('2d');
  const cardTypes = {
    STRIKE: ['#ff5a3c', '#7a1f14'], GRAPPLE: ['#ffb020', '#76500a'], AERIAL: ['#35d8ea', '#12616c'],
    TAUNT: ['#ff4fa3', '#78224b'], COUNTER: ['#8796ff', '#393e82'], SIGNATURE: ['#d38bff', '#633b87']
  };
  const cards = {
    jab: { name:'QUICK JAB', type:'STRIKE', cost:0, damage:5, text:'Deal <b class="dmg">5</b> damage.' },
    chop: { name:'STIFF CHOP', type:'STRIKE', cost:1, damage:8, text:'Deal <b class="dmg">8</b> damage.' },
    slam: { name:'MAT SLAM', type:'GRAPPLE', cost:2, damage:13, text:'Deal <b class="dmg">13</b> damage.' },
    lariat: { name:'RUNNING LARIAT', type:'STRIKE', cost:2, damage:12, text:'Deal <b class="dmg">12</b> damage.' },
    elbow: { name:'FLYING ELBOW', type:'AERIAL', cost:2, damage:11, text:'Deal <b class="dmg">11</b> damage. +8 crowd.' },
    taunt: { name:'WORK THE CROWD', type:'TAUNT', cost:0, heat:18, guard:4, text:'Gain <b>18 heat</b> and 4 guard.' },
    lockup: { name:'CHAIN WRESTLING', type:'GRAPPLE', cost:1, damage:5, heat:8, text:'Deal <b class="dmg">5</b> damage. Gain 8 heat.' },
    counter: { name:'COUNTER HOLD', type:'COUNTER', cost:1, counter:1, guard:5, text:'Counter the next attack. Gain 5 guard.' },
    suplex: { name:'RING-SHAKING SUPLEX', type:'GRAPPLE', cost:3, damage:18, text:'Deal <b class="dmg">18</b> damage.' },
    signature: { name:'FINAL CIRCUIT', type:'SIGNATURE', cost:0, damage:32, signature:true, text:'Spend all heat. Deal <b class="dmg">32</b> damage.' },
    uppercut: { name:'CORNER UPPERCUT', type:'STRIKE', cost:1, damage:9, text:'Deal <b class="dmg">9</b> damage.' },
    sweep: { name:'LEG SWEEP', type:'GRAPPLE', cost:1, damage:6, guard:4, text:'Deal <b class="dmg">6</b> damage. Gain 4 guard.' },
    dive: { name:'TOP-ROPE DIVE', type:'AERIAL', cost:3, damage:17, heat:8, text:'Deal <b class="dmg">17</b> damage. Gain 8 heat.' },
    feint: { name:'FEINT & FIRE', type:'COUNTER', cost:1, damage:5, counter:1, text:'Deal <b class="dmg">5</b>. Counter next attack.' },
    bleed: { name:'ROPE BURN', type:'STRIKE', cost:2, damage:8, bleed:2, text:'Deal <b class="dmg">8</b> and cause bleed.' },
    stun: { name:'KNEE TREMBLER', type:'GRAPPLE', cost:2, damage:7, stun:1, text:'Deal <b class="dmg">7</b> and stun.' }
  };
  const fighters = [
    { name:'REX MADDOX', tag:'POWERHOUSE', color:'#bd3b52', trim:'#ffc857', hp:88, passive:'Heavy moves deal +2 damage.', deck:['jab','jab','chop','chop','slam','lariat','taunt','lockup','counter','suplex','uppercut','sweep','signature'] },
    { name:'NOVA KNIGHT', tag:'HIGH-FLYER', color:'#2867a7', trim:'#39e0f0', hp:78, passive:'Aerial moves add +4 crowd.', deck:['jab','jab','elbow','elbow','dive','taunt','lockup','counter','feint','chop','sweep','uppercut','signature'] },
    { name:'VIXEN VALE', tag:'RING GENERAL', color:'#923d90', trim:'#ff4fa3', hp:82, passive:'Taunts grant +5 extra heat.', deck:['jab','chop','chop','slam','taunt','taunt','counter','feint','bleed','stun','uppercut','sweep','signature'] }
  ];
  const enemies = [
    { name:'BRUTUS KANE', tag:'THE WALL', color:'#7b3448', trim:'#ff5670', hp:65, quote:'“You’re stepping into MY ring, kid.”' },
    { name:'JUNO FURY', tag:'THE PHENOM', color:'#344f94', trim:'#57dff2', hp:78, quote:'“The spotlight only shines on winners.”' },
    { name:'THE CHAMPION', tag:'CIRCUIT KING', color:'#9a702c', trim:'#ffc857', hp:94, quote:'“This belt is staying right here.”' }
  ];
  const state = { screen:'title', anim:0, shake:0, flash:0, sound:true, selected:null, player:null, enemy:null, match:0, deck:[], draw:[], discard:[], hand:[], momentum:3, heat:0, rage:0, crowd:0, guard:0, enemyGuard:0, counter:0, enemyCounter:0, bleed:0, enemyBleed:0, stun:0, enemyStun:0, chain:0, turn:1, enemyIntent:null, wins:0, playing:false, paused:false, rewardCards:[] };
  function showScreen(name) {
    state.screen = name;
    document.querySelectorAll('.screen').forEach(el => el.classList.toggle('hidden', el.id !== `screen-${name}`));
    const battle = name === 'battle';
    $('hud').classList.toggle('hidden', !battle); $('dock').classList.toggle('hidden', !battle);
    $('intent').classList.toggle('hidden', !battle); $('commentary').classList.toggle('hidden', !battle);
    if (!battle) $('floaters').innerHTML = '';
  }
  function say(text) { $('commentary-text').textContent = text; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function shuffle(a) { for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function startSelect() {
    $('fighter-grid').innerHTML = '';
    fighters.forEach((f,i) => {
      const button=document.createElement('button'); button.className='fighter-card'; button.innerHTML=`<canvas class="fc-portrait" width="64" height="64"></canvas><span class="fc-name">${f.name}</span><span class="fc-tag">${f.tag}</span><span class="fc-hp">♥ ${f.hp} STAMINA</span><span class="fc-passive">${f.passive}</span><span class="fc-sig">FINISHER · FINAL CIRCUIT</span><span class="fc-check">✓</span>`;
      drawPortrait(button.querySelector('canvas'), f, false);
      button.addEventListener('click',()=>{ state.selected=i; document.querySelectorAll('.fighter-card').forEach((el,j)=>el.classList.toggle('selected',j===i)); $('btn-enter-ring').disabled=false; });
      $('fighter-grid').appendChild(button);
    });
    showScreen('select');
  }
  function beginRun() {
    if (state.selected == null) return;
    state.match=0; state.wins=0; state.heat=0; state.crowd=0;
    const template=fighters[state.selected]; state.player={...template,maxHp:template.hp,hp:template.hp}; state.deck=template.deck.slice(); beginMatch();
  }
  function beginMatch() {
    const e=enemies[state.match]; state.enemy={...e,maxHp:e.hp,hp:e.hp}; state.rage=0; state.guard=0; state.enemyGuard=0; state.counter=0; state.enemyCounter=0; state.bleed=0; state.enemyBleed=0; state.stun=0; state.enemyStun=0; state.crowd=0; state.turn=1; state.momentum=3; state.chain=0; state.playing=false;
    $('splash-match').textContent=`MATCH ${state.match+1} · ${['QUALIFIER','SEMI-FINAL','CHAMPIONSHIP'][state.match]}`;
    $('splash-player').textContent=state.player.name; $('splash-player-tag').textContent=state.player.tag; $('splash-enemy').textContent=e.name; $('splash-enemy-tag').textContent=e.tag; $('splash-quote').textContent=e.quote;
    showScreen('splash'); setTimeout(()=>{ if(state.screen!=='splash')return; showScreen('battle'); state.playing=true; state.draw=shuffle(state.deck.slice()); state.discard=[]; state.hand=[]; drawCards(5); planEnemy(); render(); say('The bell rings! Make your move.'); },1500);
  }
  function drawCards(n) { for(let i=0;i<n;i++){ if(!state.draw.length){ if(!state.discard.length) break; state.draw=shuffle(state.discard); state.discard=[]; } state.hand.push(state.draw.pop()); } }
  function planEnemy() {
    const moves=[{name:'CLUBBING BLOW',damage:8},{name:'BODY SLAM',damage:11},{name:'CORNER CHARGE',damage:13}];
    const move=moves[Math.min(2,Math.floor(Math.random()*moves.length)+(state.match===2?0:0))];
    state.enemyIntent={...move,type:'attack'}; $('intent-name').textContent=move.name; $('intent-sub').textContent=`${move.damage} DAMAGE`; $('intent-dmg').textContent=move.damage; drawIntentIcon();
  }
  function cardMarkup(id,index,disabled=false) {
    const c=cards[id], [accent,dark]=cardTypes[c.type]||cardTypes.STRIKE, isSig=!!c.signature, ready=state.heat>= (state.selected===2?55:60);
    const art=document.createElement('canvas'); art.className='card-art'; art.width=112; art.height=62; drawCardArt(art,c.type,accent);
    const button=document.createElement('button'); button.className=`card ${isSig?'sig':''} ${isSig&&ready?'ready':''} ${disabled?'disabled':''} ${index>=0?'drawn':''}`; button.style.setProperty('--accent',accent); button.style.setProperty('--accent-dark',dark); button.setAttribute('aria-label',`${c.name}, cost ${isSig?'heat':c.cost}`);
    button.innerHTML=`<span class="cost ${c.cost===0?'free':''}">${isSig?'★':c.cost}</span><span class="card-name">${c.name}</span><span class="card-type"><i class="gem"></i>${c.type}</span><span class="card-rules">${c.text}</span><span class="card-foot"><span>${isSig?(ready?'READY':'LOCKED'):''}</span><span class="hotkey">${index>=0?index+1:''}</span></span>`; button.insertBefore(art,button.querySelector('.card-name'));
    if(index>=0) button.addEventListener('click',()=>playCard(index));
    return button;
  }
  function renderHand() {
    const hand=$('hand'); hand.innerHTML=''; hand.classList.toggle('many',state.hand.length>6);
    state.hand.forEach((id,i)=>{const c=cards[id], locked=c.signature&&state.heat<(state.selected===2?55:60), disabled=locked||(!c.signature&&c.cost>state.momentum)||!state.playing; const el=cardMarkup(id,i,disabled); if(locked)el.classList.add('locked'); hand.appendChild(el); });
  }
  function render() {
    if(!state.player||!state.enemy)return;
    const p=state.player,e=state.enemy;
    $('player-name').textContent=p.name; $('player-tag').textContent=p.tag; $('enemy-name').textContent=e.name; $('enemy-tag').textContent=e.tag;
    $('player-hp-fill').style.width=`${100*p.hp/p.maxHp}%`; $('player-hp-label').textContent=`${p.hp}/${p.maxHp}`; $('enemy-hp-fill').style.width=`${100*e.hp/e.maxHp}%`; $('enemy-hp-label').textContent=`${e.hp}/${e.maxHp}`;
    $('player-heat-fill').style.width=`${100*state.heat/100}%`; $('player-heat-label').textContent=state.heat; $('enemy-rage-fill').style.width=`${100*state.rage/100}%`; $('enemy-rage-label').textContent=state.rage;
    $('match-label').textContent=`MATCH ${state.match+1} / 3`; $('match-stakes').textContent=['QUALIFIER','SEMI-FINAL','CHAMPIONSHIP'][state.match]; $('crowd-fill').style.width=`${state.crowd}%`;
    $('momentum-pips').innerHTML=Array.from({length:3},(_,i)=>`<i class="pip ${i<state.momentum?'on':''}"></i>`).join(''); $('draw-count').textContent=state.draw.length; $('discard-count').textContent=state.discard.length; $('turn-count').textContent=state.turn; $('chain-readout').innerHTML=`CHAIN <b>${state.chain}</b>`; $('chain-readout').classList.toggle('show',state.chain>1);
    $('btn-endturn').disabled=!state.playing;
    $('player-badges').innerHTML=[state.guard&&`<span class="badge guard">GUARD ${state.guard}</span>`,state.counter&&'<span class="badge counter">COUNTER</span>',state.bleed&&'<span class="badge bleed">BLEED</span>'].filter(Boolean).join('');
    $('enemy-badges').innerHTML=[state.enemyGuard&&`<span class="badge guard">GUARD ${state.enemyGuard}</span>`,state.enemyCounter&&'<span class="badge counter">COUNTER</span>',state.enemyStun&&'<span class="badge stun">STUN</span>'].filter(Boolean).join('');
    drawPortrait($('portrait-player'),p,false); drawPortrait($('portrait-enemy'),e,true); renderHand();
  }
  function playCard(index) {
    if(!state.playing||index<0||index>=state.hand.length)return;
    const id=state.hand[index], c=cards[id], sig=!!c.signature, threshold=state.selected===2?55:60;
    if((sig&&state.heat<threshold)||(!sig&&c.cost>state.momentum))return;
    state.playing=true; if(sig)state.heat=0; else state.momentum-=c.cost;
    state.chain++; let dmg=c.damage||0; if(state.chain>1)dmg+=Math.min(3,state.chain-1); if(state.selected===0&&['GRAPPLE','STRIKE'].includes(c.type))dmg+=2;
    if(state.enemyCounter&&dmg>0){ state.enemyCounter=0; dmg=0; say(`${state.enemy.name} counters your move!`); floatText('COUNTER!',64,55,'counter'); }
    else if(dmg>0){ const actual=Math.max(0,dmg-state.enemyGuard); state.enemyGuard=Math.max(0,state.enemyGuard-dmg); state.enemy.hp=Math.max(0,state.enemy.hp-actual); state.crowd=clamp(state.crowd+actual*2+(c.type==='AERIAL'?8:0),0,100); state.rage=clamp(state.rage+Math.ceil(actual/3),0,100); floatText(`-${actual}`,65,52,'damage'); state.shake=5; state.flash=.14; soundHit(180+actual*8); }
    if(c.heat)state.heat=clamp(state.heat+c.heat+(state.selected===2&&c.type==='TAUNT'?5:0),0,100);
    if(c.guard)state.guard+=c.guard; if(c.counter)state.counter=1; if(c.bleed)state.enemyBleed=2; if(c.stun)state.enemyStun=1;
    if(state.selected===1&&c.type==='AERIAL')state.crowd=clamp(state.crowd+4,0,100);
    state.hand.splice(index,1); state.discard.push(id);
    if(state.enemy.hp<=0){render();finishMatch(true);return;} render();
  }
  function endTurn() {
    if(!state.playing)return; state.playing=false;
    const crowdBonus=state.crowd>=100; if(crowdBonus){state.crowd=0;say('The crowd is electric! +1 momentum next turn.');}
    if(state.enemyBleed){state.enemy.hp=Math.max(0,state.enemy.hp-4);state.enemyBleed--;floatText('BLEED -4',65,51,'damage');}
    if(state.enemy.hp<=0){render();finishMatch(true);return;}
    let incoming=state.enemyIntent?.damage||8;
    if(state.stun){state.stun--;incoming=0;say('You shake off the stun and avoid the attack!');}
    else if(state.counter){state.counter=0;incoming=0;say('Counter! Their attack misses.');floatText('COUNTER!',36,54,'counter');}
    else {const blocked=Math.min(state.guard,incoming);state.guard=Math.max(0,state.guard-blocked);incoming-=blocked;state.player.hp=Math.max(0,state.player.hp-incoming);floatText(`-${incoming}`,34,52,'damage');if(incoming)soundHit(110);}
    state.heat=clamp(state.heat+5,0,100);
    if(state.player.hp<=0){render();finishMatch(false);return;}
    if(state.enemyStun){state.enemyStun=0;}
    if(state.player.hp<=0){render();finishMatch(false);return;}
    state.turn++; state.chain=0; state.momentum=crowdBonus?4:3; drawCards(2); planEnemy(); state.playing=true; render();
  }
  function finishMatch(won) {
    state.playing=false;
    if(!won){ $('result-belt').textContent='×'; $('result-title').textContent='DOWN FOR THE COUNT'; $('result-sub').textContent='The circuit is unforgiving. Shake it off and run it back.'; $('result-stats').innerHTML=`<span>MATCH ${state.match+1} ELIMINATION</span><span>${state.wins} MATCH${state.wins===1?'':'ES'} WON</span>`; $('btn-retry').classList.remove('hidden'); showScreen('result'); return; }
    state.wins++; state.match++;
    if(state.match>=3){ $('result-belt').textContent='★'; $('result-title').textContent='CIRCUIT CHAMPION!'; $('result-sub').textContent='You run the circuit. The belt is yours.'; $('result-stats').innerHTML='<span>3 MATCHES WON</span><span>THE CROWD WILL NEVER FORGET</span>'; $('btn-retry').classList.add('hidden'); showScreen('result'); return; }
    offerReward();
  }
  function offerReward() {
    const pool=['elbow','slam','lariat','taunt','counter','suplex','uppercut','sweep','dive','feint','bleed','stun','lockup'];
    state.rewardCards=shuffle(pool).slice(0,3); const grid=$('reward-grid'); grid.innerHTML='';
    state.rewardCards.forEach(id=>{const pick=document.createElement('button');pick.className='reward-card';pick.appendChild(cardMarkup(id,-1,false));pick.addEventListener('click',()=>chooseReward(id));grid.appendChild(pick);});
    $('reward-kicker').textContent=`MATCH ${state.match} WON`; $('reward-sub').textContent=`Add one card to your deck. Your stamina was restored by 35%.`;
    showScreen('reward');
  }
  function chooseReward(id) { state.deck.push(id); continueRun(); }
  function skipReward() { continueRun(); }
  function continueRun() { state.player.hp=Math.min(state.player.maxHp,state.player.hp+Math.ceil(state.player.maxHp*.35)); beginMatch(); }
  function restart() {
    state.playing=false; state.paused=false; state.selected=null; state.player=null; state.enemy=null; state.heat=0; state.rage=0; state.match=0; state.wins=0; $('btn-enter-ring').disabled=true; showScreen('title');
  }
  function rect(c,x,y,w,h,color) { c.fillStyle=color; c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
  function drawPortrait(c,f,enemySide) {
    if(!c||!f)return; const g=c.getContext('2d');g.imageSmoothingEnabled=false;const w=c.width,h=c.height;
    g.clearRect(0,0,w,h);rect(g,0,0,w,h,'#10091a');rect(g,4,5,w-8,h-9,enemySide?'#291126':'#1a1830');
    const accent=f.trim||'#ffc857',skin='#e9a978';rect(g,7,9,w-14,3,accent);rect(g,7,h-12,w-14,3,accent);
    rect(g,15,44,34,20,f.color);rect(g,11,48,42,12,f.color);rect(g,18,40,28,8,skin);rect(g,19,38,26,6,'#d78a67');
    rect(g,20,15,24,24,skin);rect(g,17,22,4,10,skin);rect(g,43,22,4,10,skin);rect(g,19,13,26,7,'#221627');rect(g,17,17,7,8,'#221627');rect(g,41,17,6,8,'#221627');
    rect(g,22,25,5,3,'#231b25');rect(g,37,25,5,3,'#231b25');rect(g,26,33,12,2,'#8a3c48');rect(g,20,20,24,3,accent);rect(g,24,23,3,3,'#fff0d0');rect(g,37,23,3,3,'#fff0d0');
  }
  function drawCardArt(c,type,color) {
    if(!c)return;const g=c.getContext('2d');g.imageSmoothingEnabled=false;const w=c.width,h=c.height;g.clearRect(0,0,w,h);rect(g,0,0,w,h,'#10091a');
    for(let x=0;x<w;x+=12)rect(g,x,0,1,h,'#1b1230');rect(g,0,h-9,w,9,'#211431');const cx=w/2,cy=h/2-2;
    rect(g,cx-25,cy-13,50,25,'#d83f4a');rect(g,cx-29,cy-12,58,4,'#ffd36e');rect(g,cx-29,cy+10,58,4,'#ffd36e');rect(g,cx-29,cy-9,3,18,'#ffe49a');rect(g,cx+26,cy-9,3,18,'#ffe49a');
    rect(g,cx-4,cy-17,9,8,'#ffd1a0');rect(g,cx-7,cy-9,15,17,color||'#ffc857');rect(g,cx-17,cy-7,11,5,'#ffd1a0');rect(g,cx+7,cy-5,12,5,'#ffd1a0');rect(g,cx-9,cy+7,6,10,'#d8d0ff');rect(g,cx+2,cy+7,6,10,'#d8d0ff');
    [[cx-31,cy-23],[cx+25,cy-24],[cx+34,cy+1]].forEach(([x,y])=>{rect(g,x,y,5,5,color||'#ffc857');rect(g,x+1,y+1,3,3,'#fff4c9');});
  }
  function drawIntentIcon() {
    const c=$('intent-icon'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,24,24);rect(g,0,0,24,24,'#190714');
    rect(g,10,3,5,7,'#ff4c74');rect(g,6,9,13,8,'#e43e65');rect(g,3,10,4,4,'#ffd28d');rect(g,18,10,4,4,'#ffd28d');rect(g,7,17,4,5,'#e5d6ff');rect(g,14,17,4,5,'#e5d6ff');
  }
  function drawArenaFighter(g,x,floor,f,isEnemy) {
    const ratio=Math.max(0,f.hp/f.maxHp);rect(g,x-31,floor-4,64,7,'rgba(0,0,0,.45)');rect(g,x-17,floor-35,12,32,'#191628');rect(g,x+5,floor-35,13,32,'#191628');rect(g,x-20,floor-5,18,5,'#090711');rect(g,x+3,floor-5,20,5,'#090711');
    rect(g,x-23,floor-79,47,42,f.color);rect(g,x-29,floor-76,11,28,f.color);rect(g,x+18,floor-77,12,29,f.color);rect(g,x-25,floor-48,51,7,f.trim);rect(g,x-15,floor-111,30,30,'#e4a77d');rect(g,x-18,floor-105,5,12,'#e4a77d');rect(g,x-17,floor-114,34,9,'#211628');rect(g,x-19,floor-110,8,8,'#211628');rect(g,x+11,floor-110,7,7,'#211628');rect(g,x-10,floor-99,5,3,'#17111a');rect(g,x+5,floor-99,5,3,'#17111a');rect(g,x-4,floor-88,10,2,'#7d3944');rect(g,x-33,floor-52,12,7,'#f0e2d4');rect(g,x+22,floor-52,12,7,'#f0e2d4');rect(g,x-24,floor-126,48,4,'#08050e');rect(g,x-23,floor-125,46*ratio,isEnemy?'#ff5670':'#ffc857');g.fillStyle=isEnemy?'#ffbdd0':'#fff1ae';g.font='8px monospace';g.textAlign='center';g.fillText(f.tag,x,floor-131);
  }
  function drawArena() {
    const g=ctx;g.imageSmoothingEnabled=false;g.clearRect(0,0,W,H);const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#10091d');bg.addColorStop(.52,'#291338');bg.addColorStop(1,'#080510');g.fillStyle=bg;g.fillRect(0,0,W,H);rect(g,0,0,W,49,'#090612');
    for(let i=0;i<9;i++){const x=34+i*72;rect(g,x,12,32,5,i%2?'#a3408b':'#4fb4d0');rect(g,x+5,17,22,3,'#fff1c1');g.globalAlpha=.07;g.fillStyle=i%2?'#fa3678':'#50d9ec';g.beginPath();g.moveTo(x+6,20);g.lineTo(x-15,174);g.lineTo(x+62,174);g.closePath();g.fill();g.globalAlpha=1;}
    for(let r=0;r<5;r++)for(let x=-4+(r%2)*5;x<W;x+=13){const y=52+r*17,bob=Math.sin(state.anim/13+x*.2+r)>.65?1:0;const cs=['#d64464','#7161b9','#efaa49','#4b9eaa','#d4c2e8'];rect(g,x,y+bob,5,5,'#d6a77f');rect(g,x-1,y+5+bob,7,6,cs[Math.abs((x/13+r*3|0)%cs.length)]);}
    rect(g,0,138,W,13,'#1c1028');rect(g,0,147,W,4,'#51346d');g.beginPath();g.moveTo(81,156);g.lineTo(559,156);g.lineTo(618,333);g.lineTo(22,333);g.closePath();g.fillStyle='#191024';g.fill();g.strokeStyle='#604080';g.lineWidth=2;g.stroke();
    g.beginPath();g.moveTo(108,167);g.lineTo(532,167);g.lineTo(582,315);g.lineTo(58,315);g.closePath();g.fillStyle='#252047';g.fill();for(let x=94;x<565;x+=32){g.strokeStyle='rgba(170,143,214,.12)';g.beginPath();g.moveTo(x,168);g.lineTo(x-16,315);g.stroke();}
    rect(g,267,213,106,28,'#39264f');rect(g,271,217,98,20,'#261937');g.fillStyle='#ffc857';g.font='bold 13px monospace';g.textAlign='center';g.fillText('SLAM CIRCUIT',320,232);
    ['#f0d7ff','#ff5b83','#f0d7ff'].forEach((col,i)=>{const y=177+i*44;g.strokeStyle=col;g.lineWidth=3;g.beginPath();g.moveTo(78-i*4,y);g.lineTo(562+i*4,y);g.stroke();});
    [[78,159],[554,159],[24,313],[606,313]].forEach(([x,y])=>{rect(g,x-5,y-10,14,26,'#15101d');rect(g,x-4,y-8,12,9,'#f1cb63');rect(g,x-4,y+3,12,9,'#ea5270');});
    const p=state.player||fighters[0],e=state.enemy||enemies[0];drawArenaFighter(g,220,242,p,false);drawArenaFighter(g,414,242,e,true);
    for(let i=0;i<44;i++){const x=(i*97+state.anim*(i%3+1))%W,y=52+(i*29)%95;rect(g,x,y,1,1,i%2?'#fff1c8':'#8be9ef');}if(state.flash>0){g.fillStyle=`rgba(255,60,65,${state.flash})`;g.fillRect(0,0,W,H);state.flash=Math.max(0,state.flash-.025);}g.fillStyle='rgba(0,0,0,.14)';for(let y=0;y<H;y+=4)g.fillRect(0,y,W,1);
  }
  function floatText(text,xPercent,yPercent,kind) { const el=document.createElement('span');el.className=`floater ${kind||''}`;el.textContent=text;el.style.left=`${xPercent}%`;el.style.top=`${yPercent}%`;$('floaters').appendChild(el);setTimeout(()=>el.remove(),1050); }
  let audio;
  function beep(freq,duration,volume){if(!state.sound)return;try{audio||=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),gain=audio.createGain();o.type='square';o.frequency.value=freq;gain.gain.value=volume||.025;o.connect(gain);gain.connect(audio.destination);o.start();gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.stop(audio.currentTime+duration);}catch(_){}}
  function soundHit(freq){beep(freq,.09,.035);setTimeout(()=>beep(freq*.68,.08,.02),45);}
  function openHelp(){state.paused=state.screen==='battle';if(state.paused)state.playing=false;showScreen('help');}
  function closeHelp(){if(state.paused){state.paused=false;showScreen('battle');state.playing=true;render();}else showScreen('title');}
  $('btn-start').addEventListener('click',startSelect);$('btn-how').addEventListener('click',openHelp);$('btn-back-title').addEventListener('click',()=>showScreen('title'));$('btn-enter-ring').addEventListener('click',beginRun);$('btn-endturn').addEventListener('click',endTurn);$('btn-skip-reward').addEventListener('click',skipReward);$('btn-restart').addEventListener('click',restart);$('btn-retry').addEventListener('click',restart);$('btn-help').addEventListener('click',openHelp);$('btn-pause').addEventListener('click',openHelp);$('btn-close-help').addEventListener('click',closeHelp);$('btn-help-back').addEventListener('click',closeHelp);
  $('btn-sound').addEventListener('click',()=>{state.sound=!state.sound;$('btn-sound').classList.toggle('muted',!state.sound);$('btn-sound').textContent=state.sound?'♪':'×';if(state.sound)beep(520,.06);});
  window.addEventListener('keydown',event=>{if(event.repeat)return;if(event.key==='Escape'){if(state.screen==='help')closeHelp();else if(state.screen==='battle')openHelp();return;}if(state.screen==='title'&&(event.key==='Enter'||event.key===' ')){event.preventDefault();startSelect();return;}if(state.screen==='select'&&event.key==='Enter'&&state.selected!=null){beginRun();return;}if(state.screen!=='battle')return;if(event.key===' '||event.key==='End'){event.preventDefault();endTurn();return;}const n=Number(event.key);if(n>=1&&n<=9)playCard(n-1);if(event.key.toLowerCase()==='h')openHelp();});
  function frame(){state.anim++;drawArena();requestAnimationFrame(frame);} showScreen('title');requestAnimationFrame(frame);
})();
