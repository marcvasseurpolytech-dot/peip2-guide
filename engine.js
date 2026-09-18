/* Shared exercise engine for PEIP2 Guide modules.
   Each module page defines a QUESTIONS array and calls PEIP2.init(QUESTIONS). */

const PEIP2 = (function(){

  function normalize(s){
    return s.trim().toLowerCase().replace(/\s+/g,' ').replace(/[’]/g,"'");
  }

  let STATE = {}; // id -> true/false once checked

  function renderQuestions(questions){
    const area = document.getElementById('questionsArea');
    area.innerHTML = questions.map(q=>{
      let sentenceHtml = q.before;
      q.blanksMeta.forEach((meta, i)=>{
        const w = meta.width || 130;
        sentenceHtml += `<input type="text" id="q${q.id}_b${i+1}" autocomplete="off" style="width:${w}px;" ${meta.disabled?'':''}>`;
        sentenceHtml += meta.after;
      });
      return `
        <div class="q-card" id="card${q.id}">
          <span class="q-num">Question ${q.id}</span>
          <div class="q-sentence">${sentenceHtml}</div>
          <div class="q-actions"><button class="btn-check" id="checkBtn${q.id}">Vérifier</button></div>
          <div class="verdict" id="verdict${q.id}"></div>
        </div>`;
    }).join('');

    questions.forEach(q=>{
      document.getElementById('checkBtn'+q.id).addEventListener('click', ()=> checkOne(q));
    });
  }

  function renderDots(questions){
    const wrap = document.getElementById('progressDots');
    wrap.innerHTML = questions.map(q=>`<div class="dot" id="dot${q.id}">${q.id}</div>`).join('');
  }

  function updateScoreLabel(questions){
    const checked = Object.keys(STATE).length;
    const correct = Object.values(STATE).filter(v=>v).length;
    document.getElementById('scoreLabel').textContent = `${correct} / ${questions.length} correctes (${checked}/${questions.length} faites)`;

    if(checked === questions.length){
      const banner = document.getElementById('completionBanner');
      banner.classList.add('show');
      document.getElementById('completionScore').textContent = `${correct} / ${questions.length}`;
      let msg = '';
      const pct = correct / questions.length;
      if(pct === 1) msg = "Sans faute. Tu maîtrises ce point.";
      else if(pct >= 0.8) msg = "Très solide, revois juste les points signalés ci-dessus.";
      else if(pct >= 0.5) msg = "Des bases correctes, mais relis les règles avant de continuer.";
      else msg = "Reprends le cours ci-dessus avant de refaire la série.";
      document.getElementById('completionMsg').textContent = msg;
      window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'});
    }
  }

  function checkOne(q){
    const card = document.getElementById('card'+q.id);
    const verdictEl = document.getElementById('verdict'+q.id);
    let userVals = [];
    let isCorrect = true;

    q.blanksMeta.forEach((meta, i)=>{
      const input = document.getElementById(`q${q.id}_b${i+1}`);
      const val = normalize(input.value);
      userVals.push(input.value.trim());
      const acceptedForBlank = meta.accepted.map(normalize);
      if(!acceptedForBlank.includes(val)) isCorrect = false;
      input.disabled = true;
    });

    document.getElementById('checkBtn'+q.id).disabled = true;
    STATE[q.id] = isCorrect;

    const dot = document.getElementById('dot'+q.id);

    if(isCorrect){
      card.classList.add('ok');
      dot.classList.add('ok');
      verdictEl.className = 'verdict show ok';
      verdictEl.innerHTML = `<span class="tag">&#10003; Correct.</span>`;
    } else {
      card.classList.add('bad');
      dot.classList.add('bad');
      const yourAnswer = userVals.filter(v=>v).join(' ... ') || 'Sans réponse';
      const goodAnswer = q.blanksMeta.map(m=>m.accepted[0]).join(' ... ');
      verdictEl.className = 'verdict show bad';
      verdictEl.innerHTML = `
        <span class="tag">&#10007; À revoir.</span>
        Ta réponse : <span class="your">${yourAnswer}</span> &middot;
        attendu : <span class="good">${goodAnswer}</span>
        <div class="rule">${q.explanation}</div>`;
    }

    updateScoreLabel(window.__PEIP2_QUESTIONS__);
  }

  function init(questions){
    window.__PEIP2_QUESTIONS__ = questions;
    STATE = {};
    renderDots(questions);
    renderQuestions(questions);
    updateScoreLabel(questions);
  }

  return { init };
})();
