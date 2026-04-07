/**
 * Quiz Engine for Current English course
 * Renders interactive quizzes from inline data and handles scoring.
 *
 * Usage: define window.quizData = [ ... ] before this script loads,
 * and include <div id="quiz-root"></div> in the page.
 *
 * Question types:
 *   { type:'fill', question:'...___...', answer:'word', hint:'optional' }
 *   { type:'mc', question:'...', options:['a','b','c','d'], answer:0, explanation:'...' }
 *   { type:'match', pairs:[{left:'simple',right:'upgrade'}, ...] }
 *   { type:'ox', statement:'...', answer:true/false, explanation:'...' }
 */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('quiz-root');
  if (!root || !window.quizData || !window.quizData.length) return;

  const data = window.quizData;
  let answered = new Array(data.length).fill(null); // null = unanswered

  function render() {
    const answeredCount = answered.filter(a => a !== null).length;
    let html = '';

    // Progress bar
    html += `<div class="quiz-progress">
      <span class="progress-text">${answeredCount} / ${data.length}</span>
      <div class="progress-bar"><div class="progress-fill" style="width:${(answeredCount/data.length)*100}%"></div></div>
      <span class="progress-text">${answeredCount === data.length ? 'Complete!' : 'In Progress'}</span>
    </div>`;

    data.forEach((q, i) => {
      const state = answered[i]; // null, 'correct', 'wrong'
      const cardClass = state ? ` ${state}` : '';
      html += `<div class="quiz-card${cardClass}" data-idx="${i}">`;
      html += renderQuestion(q, i, state);
      html += '</div>';
    });

    // Actions
    html += '<div class="quiz-actions">';
    if (answeredCount < data.length) {
      html += '<button class="quiz-btn primary" onclick="quizEngine.checkAll()">Check All Answers</button>';
    }
    if (answeredCount === data.length) {
      const correct = answered.filter(a => a === 'correct').length;
      html += `<button class="quiz-btn secondary" onclick="quizEngine.reset()">Try Again</button>`;
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
    h += `<input type="text" class="quiz-input${inputClass}" data-idx="${idx}" value="${escHtml(val)}" placeholder="Type your answer..." ${state ? 'disabled' : ''}>`;
    if (state === 'wrong') {
      h += `<div class="quiz-feedback wrong">Correct answer: <strong>${escHtml(q.answer)}</strong></div>`;
    } else if (state === 'correct') {
      h += `<div class="quiz-feedback correct">Correct!</div>`;
    }
    if (q.hint && !state) {
      h += `<div style="margin-top:6px;font-size:12px;color:var(--text-muted);">Hint: ${escHtml(q.hint)}</div>`;
    }
    return h;
  }

  function renderMC(q, idx, state) {
    const letters = ['A', 'B', 'C', 'D'];
    const sel = getInput(idx);
    let h = `<div class="quiz-question">${escHtml(q.question)}</div><div class="quiz-options">`;
    q.options.forEach((opt, oi) => {
      let cls = 'quiz-option';
      if (state) {
        if (oi === q.answer) cls += ' correct';
        else if (oi === sel && oi !== q.answer) cls += ' wrong';
      } else if (sel === oi) {
        cls += ' selected';
      }
      h += `<div class="${cls}" data-idx="${idx}" data-opt="${oi}">
        <span class="opt-letter">${letters[oi]}</span><span>${escHtml(opt)}</span>
      </div>`;
    });
    h += '</div>';
    if (state === 'wrong' && q.explanation) {
      h += `<div class="quiz-feedback wrong">${escHtml(q.explanation)}</div>`;
    } else if (state === 'correct') {
      h += `<div class="quiz-feedback correct">Correct!</div>`;
    }
    return h;
  }

  function renderMatch(q, idx, state) {
    const sel = getInput(idx) || {};
    const shuffled = q._shuffled || q.pairs.map((_, i) => i);
    let h = `<div class="quiz-question">Match the Simple expressions with their Upgrade equivalents:</div>`;
    h += '<div style="display:flex;flex-direction:column;gap:12px;">';
    q.pairs.forEach((p, pi) => {
      const isCorrect = sel[pi] === pi;
      let rowStyle = '';
      let icon = '';
      if (state) {
        if (isCorrect) {
          rowStyle = 'border-color:#4CAF50;background:#F1F8E9;';
          icon = '<span style="color:#4CAF50;font-weight:700;margin-left:8px;">&#10003;</span>';
        } else {
          rowStyle = 'border-color:#F44336;background:#FFF3F0;';
          icon = '<span style="color:#F44336;font-weight:700;margin-left:8px;">&#10007;</span>';
        }
      }
      h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start;padding:12px;border:2px solid var(--border);border-radius:6px;${rowStyle}">`;
      // Left: Simple expression
      h += `<div style="font-size:14px;"><span style="font-weight:700;color:var(--crimson);margin-right:6px;">${pi + 1}.</span>${escHtml(p.left)}</div>`;
      // Right: Dropdown or result
      h += '<div>';
      if (!state) {
        h += `<select class="match-select" data-idx="${idx}" data-pair="${pi}" style="width:100%;padding:8px 10px;border:2px solid var(--border);border-radius:6px;font-size:13px;background:#fff;">`;
        h += '<option value="">-- Select Upgrade --</option>';
        shuffled.forEach(si => {
          const selected = sel[pi] === si ? ' selected' : '';
          h += `<option value="${si}"${selected}>${escHtml(q.pairs[si].right)}</option>`;
        });
        h += '</select>';
      } else {
        // Show selected answer + feedback
        const selectedText = sel[pi] !== undefined ? q.pairs[sel[pi]].right : '(no answer)';
        h += `<div style="font-size:14px;font-weight:500;">${escHtml(selectedText)}${icon}</div>`;
        if (!isCorrect) {
          h += `<div style="font-size:12px;color:#2E7D32;margin-top:4px;"><strong>Correct:</strong> ${escHtml(p.right)}</div>`;
        }
      }
      h += '</div></div>';
    });
    h += '</div>';
    if (state === 'correct') {
      h += '<div class="quiz-feedback correct">All matched correctly!</div>';
    } else if (state === 'wrong') {
      const correctCount = q.pairs.filter((_, pi) => sel[pi] === pi).length;
      h += `<div class="quiz-feedback wrong">${correctCount} / ${q.pairs.length} correct. Wrong answers show the correct match below.</div>`;
    }
    return h;
  }

  function renderOX(q, idx, state) {
    const sel = getInput(idx);
    let h = `<div class="quiz-question">${escHtml(q.statement)}</div><div class="ox-buttons">`;
    ['O (Correct)', 'X (Incorrect)'].forEach((label, bi) => {
      const val = bi === 0;
      let cls = 'ox-btn';
      if (state) {
        if (val === q.answer) cls += ' correct';
        else if (sel === val && val !== q.answer) cls += ' wrong';
      } else if (sel === val) {
        cls += ' selected';
      }
      h += `<div class="${cls}" data-idx="${idx}" data-val="${val}">${label}</div>`;
    });
    h += '</div>';
    if (state === 'wrong' && q.explanation) {
      h += `<div class="quiz-feedback wrong">${escHtml(q.explanation)}</div>`;
    } else if (state === 'correct') {
      h += `<div class="quiz-feedback correct">Correct!</div>`;
    }
    return h;
  }

  // Input storage
  const inputs = {};
  function getInput(idx) { return inputs[idx]; }
  function setInput(idx, val) { inputs[idx] = val; }

  function bindEvents() {
    // Fill inputs
    root.querySelectorAll('.quiz-input').forEach(inp => {
      inp.addEventListener('input', e => {
        setInput(parseInt(e.target.dataset.idx), e.target.value);
      });
    });
    // MC options
    root.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', e => {
        const idx = parseInt(opt.dataset.idx);
        if (answered[idx]) return;
        setInput(idx, parseInt(opt.dataset.opt));
        render();
      });
    });
    // Match selects
    root.querySelectorAll('.match-select').forEach(sel => {
      sel.addEventListener('change', e => {
        const idx = parseInt(sel.dataset.idx);
        const pair = parseInt(sel.dataset.pair);
        if (answered[idx]) return;
        const current = getInput(idx) || {};
        current[pair] = sel.value === '' ? undefined : parseInt(sel.value);
        setInput(idx, current);
      });
    });
    // OX buttons
    root.querySelectorAll('.ox-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(btn.dataset.idx);
        if (answered[idx]) return;
        setInput(idx, btn.dataset.val === 'true');
        render();
      });
    });
  }

  function checkAll() {
    data.forEach((q, i) => {
      if (answered[i]) return;
      const inp = getInput(i);
      switch (q.type) {
        case 'fill': {
          const userAns = (inp || '').trim().toLowerCase();
          const correct = q.answer.toLowerCase();
          // Accept if answer contains the key phrase or matches
          const alts = q.alts ? q.alts.map(a => a.toLowerCase()) : [];
          answered[i] = (userAns === correct || alts.includes(userAns)) ? 'correct' : 'wrong';
          break;
        }
        case 'mc':
          answered[i] = inp === q.answer ? 'correct' : 'wrong';
          break;
        case 'match': {
          const sel = inp || {};
          const allCorrect = q.pairs.every((_, pi) => sel[pi] === pi);
          answered[i] = allCorrect ? 'correct' : 'wrong';
          break;
        }
        case 'ox':
          answered[i] = inp === q.answer ? 'correct' : 'wrong';
          break;
      }
    });
    render();
    // Scroll to score if complete
    const score = root.querySelector('.quiz-score');
    if (score) score.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function reset() {
    answered = new Array(data.length).fill(null);
    Object.keys(inputs).forEach(k => delete inputs[k]);
    render();
    root.scrollIntoView({ behavior: 'smooth' });
  }

  // Shuffle helper for match pairs
  data.forEach(q => {
    if (q.type === 'match') {
      q._shuffled = q.pairs.map((_, i) => i);
      for (let i = q._shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q._shuffled[i], q._shuffled[j]] = [q._shuffled[j], q._shuffled[i]];
      }
    }
  });

  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Expose API
  window.quizEngine = { checkAll, reset, render };
  render();
});
