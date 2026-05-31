// Fizika imtahan hazırlığı — 250 sual
let QUESTIONS = [];
let state = {
  mode: null,          // 'study' | 'exam'
  order: [],           // question indices in play
  current: 0,
  answers: {},         // { qid: 'A' }
  finished: false,
};
const LS_KEY = 'fizika_state_v1';

async function init(){
  const r = await fetch('questions.json');
  QUESTIONS = await r.json();
  document.getElementById('qTot').textContent = QUESTIONS.length;
  const saved = localStorage.getItem(LS_KEY);
  if(saved){
    try{ state = JSON.parse(saved); if(state.mode){ showQuiz(); } }catch(e){}
  }
  bind();
}

function save(){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }

function bind(){
  document.getElementById('modeStudy').onclick = () => startStudy();
  document.getElementById('modeExam').onclick = () => { document.getElementById('home').scrollIntoView(); show('home'); };
  document.getElementById('modeReview').onclick = () => showReview();
  document.getElementById('prevBtn').onclick = () => { if(state.current>0){state.current--; render();} };
  document.getElementById('nextBtn').onclick = () => nextQ();
  document.querySelectorAll('.opt').forEach(o => o.onclick = () => choose(o.dataset.l));
  document.addEventListener('keydown', e => {
    if(document.getElementById('quiz').classList.contains('hidden')) return;
    const k = e.key.toUpperCase();
    if(['A','B','C','D','E'].includes(k)) choose(k);
    else if(e.key==='ArrowRight') nextQ();
    else if(e.key==='ArrowLeft' && state.current>0){state.current--; render();}
  });
}

window.startStudy = function(){
  state = { mode:'study', order: QUESTIONS.map((_,i)=>i), current:0, answers:{}, finished:false };
  save(); showQuiz();
};
window.startExam = function(){
  const n = Math.min(QUESTIONS.length, Math.max(5, parseInt(document.getElementById('examCount').value)||25));
  const idx = QUESTIONS.map((_,i)=>i);
  for(let i=idx.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
  state = { mode:'exam', order: idx.slice(0,n), current:0, answers:{}, finished:false };
  save(); showQuiz();
};

function show(id){
  ['home','quiz','review'].forEach(x => document.getElementById(x).classList.toggle('hidden', x!==id));
}
function showQuiz(){ show('quiz'); render(); }

function curQ(){ return QUESTIONS[state.order[state.current]]; }

function render(){
  const q = curQ(); if(!q) return;
  document.getElementById('qIdx').textContent = state.current+1;
  document.getElementById('qTot').textContent = state.order.length;
  document.getElementById('modeLabel').textContent = state.mode==='exam'?'📝 İmtahan':'📖 Öyrən';
  document.getElementById('qScore').textContent = score();
  document.getElementById('pbar').style.width = ((state.current+1)/state.order.length*100)+'%';
  document.getElementById('qImage').src = 'questions/'+q.image;
  const picked = state.answers[q.id];
  document.querySelectorAll('.opt').forEach(o => {
    o.classList.remove('selected','correct','wrong');
    const l = o.dataset.l;
    if(state.mode==='study' && picked){
      if(l===q.answer) o.classList.add('correct');
      else if(l===picked) o.classList.add('wrong');
    } else if(picked===l){
      o.classList.add('selected');
    }
  });
  const fb = document.getElementById('feedback');
  if(state.mode==='study' && picked){
    fb.textContent = picked===q.answer ? '✓ Düzgün!' : '✗ Düzgün cavab: '+q.answer;
    fb.style.color = picked===q.answer ? 'var(--ok)' : 'var(--bad)';
  } else fb.textContent='';
  renderGrid();
  save();
}

function renderGrid(){
  const g = document.getElementById('gridNav');
  g.innerHTML='';
  state.order.forEach((qi, i) => {
    const q = QUESTIONS[qi];
    const d = document.createElement('div');
    d.className='gnum'; d.textContent = q.id;
    const a = state.answers[q.id];
    if(a){
      if(state.mode==='study' || state.finished){
        d.classList.add(a===q.answer ? 'done':'wrong');
      } else d.classList.add('done');
    }
    if(i===state.current) d.classList.add('current');
    d.onclick = () => { state.current=i; render(); window.scrollTo({top:0,behavior:'smooth'}); };
    g.appendChild(d);
  });
}

function choose(letter){
  const q = curQ();
  state.answers[q.id] = letter;
  save(); render();
}

function nextQ(){
  if(state.current < state.order.length - 1){
    state.current++; render(); window.scrollTo({top:0,behavior:'smooth'});
  } else {
    state.finished = true; save(); showReview();
  }
}

function score(){
  let s=0;
  for(const qi of state.order){
    const q = QUESTIONS[qi];
    if(state.answers[q.id]===q.answer) s++;
  }
  return s;
}

function showReview(){
  show('review');
  const total = state.order.length;
  const s = score();
  const pct = total ? Math.round(s/total*100) : 0;
  const answered = state.order.filter(qi => state.answers[QUESTIONS[qi].id]).length;
  let html = `<div class="result">
    <div class="score">${s} / ${total}</div>
    <div>Düzgün cavablar: <strong>${pct}%</strong></div>
    <div class="stats">Cavablandırılmış: ${answered} / ${total}</div>
    <div style="margin-top:16px"><button onclick="show('quiz');render()">← Suallara qayıt</button>
    <button class="ghost" onclick="if(confirm('Yenidən başla?')){localStorage.removeItem('fizika_state_v1');location.reload()}">🔄 Yenidən başla</button></div>
  </div><h3>Səhv cavablar:</h3>`;
  const wrong = state.order.filter(qi => {
    const q=QUESTIONS[qi]; const a=state.answers[q.id]; return a && a!==q.answer;
  });
  if(!wrong.length) html += '<p>🎉 Səhv yoxdur!</p>';
  else html += '<div class="grid">' + wrong.map(qi => {
    const q=QUESTIONS[qi]; return `<div class="gnum wrong" onclick="jumpTo(${state.order.indexOf(qi)})">${q.id}</div>`;
  }).join('') + '</div>';
  document.getElementById('reviewBody').innerHTML = html;
}
window.show = show;
window.jumpTo = (i) => { state.current=i; show('quiz'); render(); window.scrollTo({top:0}); };

init();
