/**
 * Quiz Engine - supports multiple quiz instances per page.
 * Each instance: { rootId, dataKey, engineKey }
 *
 * Usage:
 *   window.quizDataExpr = [ ... ];  // expression & vocab questions
 *   window.quizDataGrammar = [ ... ]; // grammar questions
 *   <div id="quiz-root-expr"></div>
 *   <div id="quiz-root-grammar"></div>
 */
document.addEventListener('DOMContentLoaded', () => {
  const instances = [
    { rootId: 'quiz-root-expr', dataKey: 'quizDataExpr', engineKey: 'quizEngineExpr' },
    { rootId: 'quiz-root-grammar', dataKey: 'quizDataGrammar', engineKey: 'quizEngineGrammar' },
    { rootId: 'quiz-root', dataKey: 'quizData', engineKey: 'quizEngine' } // legacy fallback
  ];

  instances.forEach(({ rootId, dataKey, engineKey }) => {
    const root = document.getElementById(rootId);
    const data = window[dataKey];
    if (!root || !data || !data.length) return;
    initQuiz(root, data, engineKey);
  });

  function initQuiz(root, data, engineKey) {
    let answered = new Array(data.length).fill(null);
    const inputs = {};

    // Shuffle match pairs
    data.forEach(q => {
      if (q.type === 'match') {
        q._shuffled = q.pairs.map((_, i) => i);
        for (let i = q._shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [q._shuffled[i], q._shuffled[j]] = [q._shuffled[j], q._shuffled[i]];
        }
      }
    });

    function getInput(idx) { return inputs[idx]; }
    function setInput(idx, val) { inputs[idx] = val; }

    function render() {
      const answeredCount = answered.filter(a => a !== null).length;
      let html = '';
      html += `<div class="quiz-progress">
        <span class="progress-text">${answeredCount} / ${data.length}</span>
        <div class="progress-bar"><div class="progress-fill" style="width:${(answeredCount/data.length)*100}%"></div></div>
        <span class="progress-text">${answeredCount === data.length ? 'Complete!' : 'In Progress'}</span>
      </div>`;

      data.forEach((q, i) => {
        const state = answered[i];
        const cardClass = state ? ` ${state}` : '';
        html += `<div class="quiz-card${cardClass}" data-idx="${i}">`;
        html += renderQuestion(q, i, state);
        html += '</div>';
      });

      html += '<div class="quiz-actions">';
      if (answeredCount < data.length) {
        html += `<button class="quiz-btn primary" data-engine="${engineKey}" onclick="window['${engineKey}'].checkAll()">Check Answers</button>`;
      }
      if (answeredCount === data.length) {
        const correct = answered.filter(a => a === 'correct').length;
        html += `<button class="quiz-btn secondary" onclick="window['${engineKey}'].reset()">Try Again</button>`;
        html += '</div>';
        html += `<div class="quiz-score">
          <div class="score-num">${correct} / ${data.length}</div>
          <div class="score-label">${correct === data.length ? 'Perfect!' : correct >= data.length * 0.7 ? 'Great job!' : 'Keep practicing!'}</div>
        </div>`;
      } else {
        html += '</div>';
      }

      root.innerHTML = html;
      bindEvents();
    }

    function renderQuestion(q, idx, state) {
      let h = '';
      const badges = { fill: 'Fill in the Blank', mc: 'Multiple Choice', match: 'Matching', ox: 'O / X' };
      h += `<span class="quiz-type-badge ${q.type}">${badges[q.type] || q.type}</span>`;
      switch (q.type) {
        case 'fill': h += renderFill(q, idx, state); break;
        case 'mc': h += renderMC(q, idx, state); break;
        case 'match': h += renderMatch(q, idx, state); break;
        case 'ox': h += renderOX(q, idx, state); break;
      }
      return h;
    }

    function renderFill(q, idx, state) {
      const display = q.question.replace('___', '<span class="blank">______</span>');
      const val = getInput(idx) || '';
      const inputClass = state ? ` ${state}` : '';
      let h = `<div class="quiz-question">${display}</div>`;
      h += `<input type="text" class="quiz-input${inputClass}" data-idx="${idx}" value="${esc(val)}" placeholder="Type your answer..." ${state ? 'disabled' : ''}>`;
      if (state === 'wrong') h += `<div class="quiz-feedback wrong">Correct answer: <strong>${esc(q.answer)}</strong></div>`;
      else if (state === 'correct') h += `<div class="quiz-feedback correct">Correct!</div>`;
      if (q.hint && !state) h += `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">Hint: ${esc(q.hint)}</div>`;
      return h;
    }

    function renderMC(q, idx, state) {
      const letters = ['A', 'B', 'C', 'D'];
      const sel = getInput(idx);
      let h = `<div class="quiz-question">${esc(q.question)}</div><div class="quiz-options">`;
      q.options.forEach((opt, oi) => {
        let cls = 'quiz-option';
        if (state) { if (oi === q.answer) cls += ' correct'; else if (oi === sel && oi !== q.answer) cls += ' wrong'; }
        else if (sel === oi) cls += ' selected';
        h += `<div class="${cls}" data-idx="${idx}" data-opt="${oi}"><span class="opt-letter">${letters[oi]}</span><span>${esc(opt)}</span></div>`;
      });
      h += '</div>';
      if (state === 'wrong' && q.explanation) h += `<div class="quiz-feedback wrong">${esc(q.explanation)}</div>`;
      else if (state === 'correct') h += `<div class="quiz-feedback correct">Correct!</div>`;
      return h;
    }

    function renderMatch(q, idx, state) {
      const sel = getInput(idx) || {};
      const shuffled = q._shuffled || q.pairs.map((_, i) => i);
      let h = `<div class="quiz-question">Match the Simple expressions with their Upgrade equivalents:</div>`;
      h += '<div style="display:flex;flex-direction:column;gap:12px;">';
      q.pairs.forEach((p, pi) => {
        const isCorrect = sel[pi] === pi;
        let rowStyle = '', icon = '';
        if (state) {
          if (isCorrect) { rowStyle = 'border-color:#4CAF50;background:#F1F8E9;'; icon = '<span style="color:#4CAF50;font-weight:700;margin-left:8px;">&#10003;</span>'; }
          else { rowStyle = 'border-color:#F44336;background:#FFF3F0;'; icon = '<span style="color:#F44336;font-weight:700;margin-left:8px;">&#10007;</span>'; }
        }
        h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start;padding:12px;border:2px solid var(--border);border-radius:6px;${rowStyle}">`;
        h += `<div style="font-size:14px;"><span style="font-weight:700;color:var(--crimson);margin-right:6px;">${pi+1}.</span>${esc(p.left)}</div><div>`;
        if (!state) {
          h += `<select class="match-select" data-idx="${idx}" data-pair="${pi}" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:6px;font-size:13px;background:#fff;"><option value="">-- Select Upgrade --</option>`;
          shuffled.forEach(si => { h += `<option value="${si}"${sel[pi]===si?' selected':''}>${esc(q.pairs[si].right)}</option>`; });
          h += '</select>';
        } else {
          const txt = sel[pi] !== undefined ? q.pairs[sel[pi]].right : '(no answer)';
          h += `<div style="font-size:14px;font-weight:500;">${esc(txt)}${icon}</div>`;
          if (!isCorrect) h += `<div style="font-size:12px;color:#2E7D32;margin-top:4px;"><strong>Correct:</strong> ${esc(p.right)}</div>`;
        }
        h += '</div></div>';
      });
      h += '</div>';
      if (state === 'correct') h += '<div class="quiz-feedback correct">All matched correctly!</div>';
      else if (state === 'wrong') { const c = q.pairs.filter((_,pi) => sel[pi]===pi).length; h += `<div class="quiz-feedback wrong">${c} / ${q.pairs.length} correct.</div>`; }
      return h;
    }

    function renderOX(q, idx, state) {
      const sel = getInput(idx);
      let h = `<div class="quiz-question">${esc(q.statement)}</div><div class="ox-buttons">`;
      ['O (Correct)', 'X (Incorrect)'].forEach((label, bi) => {
        const val = bi === 0;
        let cls = 'ox-btn';
        if (state) { if (val === q.answer) cls += ' correct'; else if (sel === val && val !== q.answer) cls += ' wrong'; }
        else if (sel === val) cls += ' selected';
        h += `<div class="${cls}" data-idx="${idx}" data-val="${val}">${label}</div>`;
      });
      h += '</div>';
      if (state === 'wrong' && q.explanation) h += `<div class="quiz-feedback wrong">${esc(q.explanation)}</div>`;
      else if (state === 'correct') h += `<div class="quiz-feedback correct">Correct!</div>`;
      return h;
    }

    function bindEvents() {
      root.querySelectorAll('.quiz-input').forEach(inp => {
        inp.addEventListener('input', e => setInput(parseInt(e.target.dataset.idx), e.target.value));
      });
      root.querySelectorAll('.quiz-option').forEach(opt => {
        opt.addEventListener('click', () => { const idx = parseInt(opt.dataset.idx); if (answered[idx]) return; setInput(idx, parseInt(opt.dataset.opt)); render(); });
      });
      root.querySelectorAll('.match-select').forEach(sel => {
        sel.addEventListener('change', () => { const idx = parseInt(sel.dataset.idx); const pair = parseInt(sel.dataset.pair); if (answered[idx]) return; const c = getInput(idx)||{}; c[pair] = sel.value===''?undefined:parseInt(sel.value); setInput(idx, c); });
      });
      root.querySelectorAll('.ox-btn').forEach(btn => {
        btn.addEventListener('click', () => { const idx = parseInt(btn.dataset.idx); if (answered[idx]) return; setInput(idx, btn.dataset.val==='true'); render(); });
      });
    }

    function checkAll() {
      data.forEach((q, i) => {
        if (answered[i]) return;
        const inp = getInput(i);
        switch (q.type) {
          case 'fill': { const u=(inp||'').trim().toLowerCase(), c=q.answer.toLowerCase(), a=q.alts?q.alts.map(x=>x.toLowerCase()):[]; answered[i]=(u===c||a.includes(u))?'correct':'wrong'; break; }
          case 'mc': answered[i]=inp===q.answer?'correct':'wrong'; break;
          case 'match': { const s=inp||{}; answered[i]=q.pairs.every((_,pi)=>s[pi]===pi)?'correct':'wrong'; break; }
          case 'ox': answered[i]=inp===q.answer?'correct':'wrong'; break;
        }
      });
      render();
    }

    function reset() {
      answered = new Array(data.length).fill(null);
      Object.keys(inputs).forEach(k => delete inputs[k]);
      render();
    }

    function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; }

    window[engineKey] = { checkAll, reset, render };
    render();
  }
});
