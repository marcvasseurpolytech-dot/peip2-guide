/* access.js — shared open/close check for PEIP2 Guide (index + modules) */

const PEIP2Access = (function(){

  async function fetchAccess(){
    const r = await fetch('access.json?_=' + Date.now());
    if(!r.ok) throw new Error('access.json fetch failed');
    return r.json();
  }

  function isModuleOpen(cfg, moduleId){
    if(cfg.closed) return { open:false, reason:'closed' };
    const m = cfg.modules && cfg.modules[String(moduleId)];
    if(!m || !m.unlocked) return { open:false, reason:'locked' };
    if(m.unlock_date){
      const d = new Date(m.unlock_date);
      if(d.getTime() > Date.now()) return { open:false, reason:'future', date:d };
    }
    return { open:true };
  }

  function lockMessage(status){
    if(status.reason === 'closed') return "Le guide est actuellement fermé par ton enseignant.";
    if(status.reason === 'future') return "Ce module ouvrira le " + status.date.toLocaleString('fr-FR', {dateStyle:'long', timeStyle:'short'}) + ".";
    return "Ce module n'est pas encore ouvert.";
  }

  // For a module page: hides course/exercises and shows a lock panel if closed;
  // otherwise calls onUnlocked(). Fails open (lets the module run) if access.json
  // itself can't be reached, so a missing/broken file never locks everyone out.
  async function guardModule(moduleId, onUnlocked){
    let cfg;
    try { cfg = await fetchAccess(); } catch(e){ onUnlocked(); return; }

    const status = isModuleOpen(cfg, moduleId);
    if(status.open){ onUnlocked(); return; }

    document.querySelectorAll('.course, .progress-wrap, #questionsArea, .completion').forEach(el => el.style.display = 'none');
    const main = document.querySelector('main');
    const lock = document.createElement('div');
    lock.className = 'course';
    lock.innerHTML = `<h2>&#128274; Module verrouillé</h2><p>${lockMessage(status)}</p>`;
    const anchor = document.getElementById('questionsArea') || main.lastElementChild;
    main.insertBefore(lock, anchor);
  }

  // For the home page: dims locked module cards and adds a status badge.
  async function decorateHome(){
    let cfg;
    try { cfg = await fetchAccess(); } catch(e){ return; }

    document.querySelectorAll('.module-card').forEach(card => {
      const id = card.dataset.module;
      if(!id) return;
      const status = isModuleOpen(cfg, id);
      if(!status.open){
        card.classList.add('locked');
        card.addEventListener('click', e => e.preventDefault());
        const badge = document.createElement('div');
        badge.className = 'lock-badge';
        badge.textContent = status.reason === 'future'
          ? '🔒 dès le ' + status.date.toLocaleDateString('fr-FR')
          : '🔒 fermé';
        card.appendChild(badge);
      }
    });
  }

  return { guardModule, decorateHome };
})();
