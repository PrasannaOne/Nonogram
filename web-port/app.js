
import { generatePuzzle, generateLegacyEasyPuzzle } from './nonogram.js';
import { PuzzleBoard, CELL, TOOL, getCompletedLines, getNewlyCompletedLines, isBoardComplete } from './interaction.js';
import { createGameRepository, updateModeProgress, selectGameMode, completeLevel, setCurrentPuzzle, getSavedPuzzle, spendHintPoints, getHintCost, GAME_MODES } from './progress.js';
import { getCellCoordinatesAtPoint, createAxisLockedStroke, getAxisLockedCell } from './pointer-input.js';
import { getKeyboardCellTarget } from './keyboard-input.js';
import { createSafeStorage } from './storage.js';
import { calculateBoardLayout } from './layout.js';
import { formatElapsedTime, restoreLevelStartTime } from './completion.js';

const $ = (id) => document.getElementById(id);
const storage = createSafeStorage(window);
const repository = createGameRepository(storage);
let gameState = repository.load();
let activeMode = gameState.currentMode;
let progress = gameState.profiles[activeMode];
let puzzle, board, activeTool = TOOL.FILL, pointerDown = false, activePointerId = null, completed = false;
let lastHint = null, hintedCells = new Set(), storageWarning = false, focusedCell = { row: 0, col: 0 }, activeAxisStroke = null;
let levelStartedAtMs = Date.now(), completedLevelNumber = null, activePuzzleSeed = null;
let activeUsesLegacyGenerator = false, completedPuzzleForReplay = null;
let previousCompletedLines = { rows: [], columns: [] };
const THEME_KEY = 'prasannaone.nonogram.theme.v1';
const THEMES = Object.freeze({
  lavender: '#f7f4fb', ocean: '#f0f8fc', rose: '#fff4f6',
  forest: '#f1f7f1', midnight: '#171a27', amoled: '#000000'
});

function createJourneySeed() {
  // 128 bits from Web Crypto give each fresh profile its own independent puzzle journey.
  const words = new Uint32Array(4);
  try {
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(words);
    else throw new Error('Web Crypto unavailable');
  } catch {
    for (let i = 0; i < words.length; i++) words[i] = Math.floor(Math.random() * 0x100000000);
  }
  if (words.every(value => value === 0)) words[0] = 1;
  return [...words].map(value => value.toString(16).padStart(8, '0')).join('');
}
function ensureJourneySeed(profile) {
  return typeof profile.journeySeed === 'string' && /^[a-f0-9]{32}$/i.test(profile.journeySeed)
    ? profile : { ...profile, journeySeed: createJourneySeed() };
}
function seedFor(level, mode = activeMode, legacy = false) {
  if (legacy && mode === 'easy') return (0x51f15e + Math.imul(level, 0x9e3779b1)) >>> 0;
  return `${progress.journeySeed}:puzzle:${mode}:${level}`;
}
function newBoardFor(level, savedPuzzle = null, legacyOverride = null) {
  const legacy = typeof legacyOverride === 'boolean' ? legacyOverride
    : typeof savedPuzzle?.legacy === 'boolean' ? savedPuzzle.legacy
    : (activeMode === 'easy' && progress.generatorVersion === 1);
  // A saved board's own seed and dimensions are authoritative. This preserves
  // in-flight v1-v54 puzzles even though new journeys now use randomised bags.
  const seed = savedPuzzle ? savedPuzzle.seed : seedFor(level, activeMode, legacy);
  const exactAttempt = Number.isSafeInteger(savedPuzzle?.attempts) ? savedPuzzle.attempts - 1 : null;
  // Old snapshots have no attempt index, so keep the original repeat-filter
  // history. New snapshots pin the exact accepted attempt and can ignore it.
  const avoidFingerprints = exactAttempt === null ? progress.recentFingerprints : [];
  const options = { level, seed, avoidFingerprints, exactAttempt };
  const generated = legacy
    ? generateLegacyEasyPuzzle({ ...options, size: savedPuzzle?.width ?? null })
    : generatePuzzle({ ...options, difficulty: activeMode, journeySeed: progress.journeySeed, size: savedPuzzle?.width ?? null });
  if (savedPuzzle?.fingerprint && generated.fingerprint !== savedPuzzle.fingerprint) {
    throw new Error('Saved puzzle fingerprint mismatch; refusing to load a different puzzle under the same progress record.');
  }
  const model = new PuzzleBoard(generated.height, generated.width);
  return { generated, model, seed, legacy };
}
function loadLevel(level, options = {}) {
  const replaySpec = options.replaySpec || null;
  const savedPuzzle = replaySpec
    ? { seed: replaySpec.seed, width: replaySpec.width, height: replaySpec.height, attempts: replaySpec.attempts, fingerprint: replaySpec.fingerprint, legacy: replaySpec.legacy, board: null, hintedCells: [] }
    : getSavedPuzzle(progress, level);
  progress = ensureJourneySeed(progress);
  const made = newBoardFor(level, savedPuzzle, replaySpec ? replaySpec.legacy : null);
  puzzle = made.generated; board = made.model; activePuzzleSeed = made.seed;
  activeUsesLegacyGenerator = made.legacy;
  completed = false; lastHint = null; focusedCell = { row: 0, col: 0 };
  hintedCells = new Set();
  const canRestore = Boolean(savedPuzzle && Array.isArray(savedPuzzle.board) && savedPuzzle.seed === activePuzzleSeed &&
    savedPuzzle.width === puzzle.width && savedPuzzle.height === puzzle.height);
  levelStartedAtMs = restoreLevelStartTime(canRestore ? savedPuzzle : null);
  if (canRestore) {
    savedPuzzle.board.forEach((row, r) => row.forEach((state, c) => { board.cells[r][c] = state; }));
    (savedPuzzle.hintedCells || []).forEach(({ row, col }) => hintedCells.add(`${row}:${col}`));
  }
  progress = setCurrentPuzzle(progress, { level, seed: activePuzzleSeed, width: puzzle.width, height: puzzle.height, startedAtMs: levelStartedAtMs, attempts: puzzle.attempts, fingerprint: puzzle.fingerprint, legacy: activeUsesLegacyGenerator }, board.snapshot());
  previousCompletedLines = getCompletedLines(board, puzzle.solution);
  save(); render();
}
function persist() {
  try {
    gameState = updateModeProgress(selectGameMode(gameState, activeMode), activeMode, progress);
    gameState = repository.save(gameState);
    storageWarning = false; return true;
  }
  catch (error) { console.warn('Nonogram progress could not be saved:', error); storageWarning = true; return false; }
}
function save() {
  progress = ensureJourneySeed(progress);
  progress = setCurrentPuzzle(progress, { level: puzzle.level, seed: activePuzzleSeed, width: puzzle.width, height: puzzle.height, startedAtMs: levelStartedAtMs, attempts: puzzle.attempts, fingerprint: puzzle.fingerprint, legacy: activeUsesLegacyGenerator }, board.snapshot());
  if (progress.currentPuzzle) progress.currentPuzzle.hintedCells = [...hintedCells].map(key => {
    const [row, col] = key.split(':').map(Number); return { row, col };
  });
  persist();
}
function make(tag, cls, text) { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; }
function announceStatus(message) { const region = $('liveStatus'); if (region) region.textContent = message; }
function readThemePreference() {
  try { const saved = storage.getItem(THEME_KEY); return Object.hasOwn(THEMES, saved) ? saved : 'lavender'; }
  catch { return 'lavender'; }
}
function applyTheme(theme, persistChoice = false) {
  if (!Object.hasOwn(THEMES, theme)) theme = 'lavender';
  document.documentElement.dataset.theme = theme;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.content = THEMES[theme];
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    const selected = button.dataset.themeChoice === theme;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  if (persistChoice) { try { storage.setItem(THEME_KEY, theme); } catch (error) { console.warn('Theme preference could not be saved:', error); } }
}
function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}
function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}
function render() {
  $('levelNumber').textContent = puzzle.level;
  $('levelSize').textContent = `${puzzle.width} × ${puzzle.height}`;
  $('pointsBalance').textContent = progress.points;
  document.querySelectorAll('[data-difficulty]').forEach(btn => {
    const selected = btn.dataset.difficulty === activeMode;
    btn.classList.toggle('active', selected);
    btn.setAttribute('aria-pressed', String(selected));
  });
  const root = $('board'); root.replaceChildren(); root.style.setProperty('--n', puzzle.width);
  const maxRowClueChars = Math.max(1, ...puzzle.clues.rows.map(clue => clue.filter(n => n !== 0).map(String).join(' ').length));
  const maxColumnClues = Math.max(1, ...puzzle.clues.columns.map(clue => clue[0] === 0 ? 1 : clue.length));
  root.dataset.maxRowClueChars = String(maxRowClueChars);
  root.dataset.maxColumnClues = String(maxColumnClues);
  const corner = make('div', 'corner'); root.append(corner);
  const columnClues = make('div', 'column-clues'); columnClues.style.setProperty('--n', puzzle.width);
  const rowClues = make('div', 'row-clues'); rowClues.style.setProperty('--n', puzzle.height);
  const cells = make('div', 'cells'); cells.style.setProperty('--n', puzzle.width);
  const doneLines = getCompletedLines(board, puzzle.solution);
  puzzle.clues.columns.forEach((clue, c) => {
    const done = doneLines.columns.includes(c);
    const el = make('div', `clue column-clue${done ? ' done' : ''}`);
    el.id = `column-clue-${c}`; el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `Column ${c + 1} clue: ${clue[0] === 0 ? 'no filled cells' : clue.join(', ')}${done ? ', complete' : ''}`);
    clue.filter(n => n !== 0).forEach(n => el.append(make('span', '', String(n)))); columnClues.append(el);
  });
  puzzle.clues.rows.forEach((clue, r) => {
    const done = doneLines.rows.includes(r);
    const el = make('div', `clue row-clue${done ? ' done' : ''}`);
    el.id = `row-clue-${r}`; el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `Row ${r + 1} clue: ${clue[0] === 0 ? 'no filled cells' : clue.join(', ')}${done ? ', complete' : ''}`);
    clue.filter(n => n !== 0).forEach(n => el.append(make('span', '', String(n)))); rowClues.append(el);
  });
  for (let r=0;r<puzzle.height;r++) for(let c=0;c<puzzle.width;c++) {
    const state = board.getState(r,c); const cell = make('button', `cell${state===CELL.FILLED?' filled':state===CELL.CROSSED?' crossed':''}`);
    cell.type='button'; cell.dataset.row=r; cell.dataset.col=c;
    cell.setAttribute('aria-label', `Row ${r+1}, column ${c+1}, ${state}`);
    cell.setAttribute('aria-describedby', `row-clue-${r} column-clue-${c}`);
    cell.tabIndex = r === focusedCell.row && c === focusedCell.col ? 0 : -1;
    if(lastHint && lastHint.row===r && lastHint.col===c) cell.classList.add('hinted');
    cell.addEventListener('pointerdown', onCellDown);
    cell.addEventListener('keydown', event => {
      const next = getKeyboardCellTarget(r, c, event.key, puzzle.height, puzzle.width);
      if (!next) return;
      event.preventDefault(); focusedCell = next;
      const nextCell = root.querySelector(`[data-row="${next.row}"][data-col="${next.col}"]`);
      root.querySelectorAll('.cell[tabindex="0"]').forEach(node => { node.tabIndex = -1; });
      if (nextCell) { nextCell.tabIndex = 0; nextCell.focus(); }
    });
    cell.addEventListener('click', event => {
      // Native keyboard activation produces click without a preceding pointerdown.
      if (event.detail !== 0 || completed) return;
      board.applyCell(r, c, activeTool);
      refreshCell(r, c); refreshLineMarks({ row: r, col: c }); save(); checkComplete();
    });
    cells.append(cell);
  }
  root.append(columnClues,rowClues,cells);
  updateBoardMetrics();
  $('undoButton').disabled = !board.canUndo();
  $('clearBoardButton').disabled = !board.snapshot().some(row => row.some(state => state !== CELL.UNKNOWN));
  $('hintButton').disabled = !hasHintCandidate();
  previousCompletedLines = doneLines;
  document.querySelectorAll('[data-tool]').forEach(btn => {
    const selected=btn.dataset.tool===activeTool; btn.classList.toggle('active',selected); btn.setAttribute('aria-pressed',String(selected));
  });
}

// Fit the complete clue + cell grid into the space actually available. The
// cell tracks remain square on narrow phones, tablets, desktop and landscape.
function updateBoardMetrics() {
  if (!puzzle) return;
  const wrap = $('boardWrap');
  const root = $('board');
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  if (!width || !height) return;

  const layout = calculateBoardLayout({
    width,
    height,
    size: puzzle.width,
    maxRowClueChars: Number(root.dataset.maxRowClueChars || 1),
    maxColumnClues: Number(root.dataset.maxColumnClues || 1)
  });
  root.style.setProperty('--row-clue-width', `${layout.rowClueWidth}px`);
  root.style.setProperty('--column-clue-height', `${layout.columnClueHeight}px`);
  root.style.setProperty('--cell-size', `${layout.cellSize}px`);
  root.style.setProperty('--clue-font-size', `${layout.clueFontSize}px`);
}

function refreshCell(row, col) {
  const cell = $('board').querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  const state = board.getState(row, col);
  cell.classList.toggle('filled', state === CELL.FILLED);
  cell.classList.toggle('crossed', state === CELL.CROSSED);
  cell.setAttribute('aria-label', `Row ${row+1}, column ${col+1}, ${state}`);
}
function restartAnimations(nodes, className) {
  if (!nodes.length || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  for (const node of nodes) node.classList.remove(className);
  requestAnimationFrame(() => {
    for (const node of nodes) node.classList.add(className);
  });
}
function animateCompletionCell(changedCell, newlyDone) {
  if (!changedCell || board.getState(changedCell.row, changedCell.col) !== CELL.FILLED) return;
  const lineWasCompleted = newlyDone.rows.includes(changedCell.row) || newlyDone.columns.includes(changedCell.col);
  if (!lineWasCompleted) return;
  const cell = $('board').querySelector(`[data-row="${changedCell.row}"][data-col="${changedCell.col}"]`);
  if (cell) restartAnimations([cell], 'line-completing');
}
$('board').addEventListener('animationend', event => {
  if (event.animationName === 'lineCellComplete') event.target.classList.remove('line-completing');
  else if (event.animationName === 'lineClueComplete') event.target.classList.remove('just-completed');
});

function refreshLineMarks(changedCell = null) {
  const done = getCompletedLines(board, puzzle.solution);
  const newlyDone = getNewlyCompletedLines(previousCompletedLines, done);
  const newlyCompletedClues = [];
  $('board').querySelectorAll('.row-clue').forEach((node, i) => {
    const isDone = done.rows.includes(i);
    node.classList.toggle('done', isDone);
    if (newlyDone.rows.includes(i)) newlyCompletedClues.push(node);
    const clue = puzzle.clues.rows[i];
    node.setAttribute('aria-label', `Row ${i + 1} clue: ${clue[0] === 0 ? 'no filled cells' : clue.join(', ')}${isDone ? ', complete' : ''}`);
  });
  $('board').querySelectorAll('.column-clue').forEach((node, i) => {
    const isDone = done.columns.includes(i);
    node.classList.toggle('done', isDone);
    if (newlyDone.columns.includes(i)) newlyCompletedClues.push(node);
    const clue = puzzle.clues.columns[i];
    node.setAttribute('aria-label', `Column ${i + 1} clue: ${clue[0] === 0 ? 'no filled cells' : clue.join(', ')}${isDone ? ', complete' : ''}`);
  });
  $('undoButton').disabled = !board.canUndo();
  $('clearBoardButton').disabled = !board.snapshot().some(row => row.some(state => state !== CELL.UNKNOWN));
  $('hintButton').disabled = !hasHintCandidate();
  previousCompletedLines = done;
  restartAnimations(newlyCompletedClues, 'just-completed');
  animateCompletionCell(changedCell, newlyDone);
}
function paintCellAt(row, col) {
  if (board.paintCell(row, col)) {
    refreshCell(row, col);
    refreshLineMarks({ row, col });
  }
}
function onCellDown(event) {
  if (completed || event.button !== 0 || event.isPrimary === false) return;
  event.preventDefault();
  if (pointerDown) finishStroke();
  if (completed) return;
  pointerDown = true;
  activePointerId = event.pointerId ?? null;
  board.beginStroke(activeTool);
  const cell = event.target.closest?.('.cell');
  if (cell) {
    focusedCell = { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
    activeAxisStroke = createAxisLockedStroke(focusedCell, event.clientX, event.clientY);
    $('board').querySelectorAll('.cell[tabindex="0"]').forEach(node => { node.tabIndex = -1; });
    cell.tabIndex = 0;
    paintCellAt(focusedCell.row, focusedCell.col);
  }
}
function onPointerMove(event) {
  if (!pointerDown || completed || (activePointerId !== null && event.pointerId !== activePointerId)) return;
  event.preventDefault();
  const coordinate = getCellCoordinatesAtPoint(document, event.clientX, event.clientY);
  const locked = getAxisLockedCell(activeAxisStroke, coordinate, event.clientX, event.clientY);
  if (locked) paintCellAt(locked.row, locked.col);
}
function finishStroke(event) {
  if (!pointerDown || (event?.pointerId != null && activePointerId !== null && event.pointerId !== activePointerId)) return;
  pointerDown = false;
  activePointerId = null;
  activeAxisStroke = null;
  board.endStroke();
  // Cells and clue marks were updated in place during the stroke. Avoid
  // rebuilding the whole grid on pointer-up; update only the tool states.
  $('undoButton').disabled = !board.canUndo();
  $('hintButton').disabled = !hasHintCandidate();
  save();
  checkComplete();
}
if ('ResizeObserver' in window) {
  const boardResizeObserver = new ResizeObserver(updateBoardMetrics);
  boardResizeObserver.observe($('boardWrap'));
} else {
  window.addEventListener('resize', updateBoardMetrics, { passive: true });
}
window.addEventListener('orientationchange', () => requestAnimationFrame(updateBoardMetrics), { passive: true });

window.addEventListener('pointermove', onPointerMove, { passive: false });
window.addEventListener('pointerup', finishStroke);
window.addEventListener('pointercancel', finishStroke);
window.addEventListener('blur', () => { if (pointerDown) finishStroke(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && pointerDown) finishStroke(); });
window.addEventListener('keydown', event => {
  const target = event.target;
  const isEditable = target instanceof HTMLElement && (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
  if (isEditable || document.querySelector('dialog[open]') || completed ||
      !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
  event.preventDefault();
  if (board.undo()) {
    save(); render();
    $('board').querySelector(`[data-row="${focusedCell.row}"][data-col="${focusedCell.col}"]`)?.focus();
  }
});
function checkComplete() {
  if (completed || !isBoardComplete(board, puzzle.solution)) return;
  completed = true;
  const finishedLevel = puzzle.level;
  completedLevelNumber = finishedLevel;
  completedPuzzleForReplay = { level: finishedLevel, seed: activePuzzleSeed, width: puzzle.width, height: puzzle.height, attempts: puzzle.attempts, fingerprint: puzzle.fingerprint, legacy: activeUsesLegacyGenerator };
  const elapsedMs = Math.max(0, Date.now() - levelStartedAtMs);
  const pointsBefore = progress.points;
  progress = completeLevel(progress, finishedLevel, puzzle.fingerprint, puzzle.points);
  const pointsEarned = Math.max(0, progress.points - pointsBefore);
  persist();
  $('completionTitle').textContent = `Level ${finishedLevel} accomplished!`;
  $('completionTime').textContent = formatElapsedTime(elapsedMs);
  $('completionPoints').textContent = String(pointsEarned);
  announceStatus(`Level ${finishedLevel} complete. Time ${formatElapsedTime(elapsedMs)}. ${pointsEarned} points earned.`);
  $('clearBoardButton').disabled = true;
  $('undoButton').disabled = true;
  $('hintButton').disabled = true;
  // Let the final cell/clue paint before presenting the summary. Two animation
  // frames give a short, consistent delay without a fixed wall-clock timer.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (completed && completedLevelNumber === finishedLevel && !$('completionDialog').open) {
      openDialog($('completionDialog'));
    }
  }));
}
function hasHintCandidate() { return puzzle.solution.some((row,r)=>row.some((v,c)=>v && board.getState(r,c)!==CELL.FILLED)); }
function switchDifficulty(nextMode) {
  if (!GAME_MODES.includes(nextMode) || nextMode === activeMode) return;
  if (pointerDown) finishStroke();
  persist();
  gameState = selectGameMode(gameState, nextMode);
  activeMode = nextMode;
  progress = ensureJourneySeed(gameState.profiles[activeMode]);
  gameState = updateModeProgress(gameState, activeMode, progress);
  activeTool = TOOL.FILL;
  completedPuzzleForReplay = null;
  pointerDown = false; activePointerId = null; completed = false; lastHint = null;
  loadLevel(progress.currentLevel || 1);
}
document.querySelectorAll('[data-difficulty]').forEach(btn => btn.addEventListener('click', () => {
  switchDifficulty(btn.dataset.difficulty);
  closeDialog($('settingsDialog'));
}));

applyTheme(readThemePreference());
document.querySelectorAll('[data-theme-choice]').forEach(button => {
  button.addEventListener('click', () => applyTheme(button.dataset.themeChoice, true));
});
$('settingsButton').addEventListener('click', () => openDialog($('settingsDialog')));
$('aboutButton').addEventListener('click', () => {
  closeDialog($('settingsDialog'));
  openDialog($('aboutDialog'));
});
document.querySelectorAll('[data-close-dialog]').forEach(button => {
  button.addEventListener('click', () => closeDialog($(button.dataset.closeDialog)));
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog || dialog.id === 'completionDialog') return;
    closeDialog(dialog);
  });
});
async function shareGame() {
  const shareData = {
    title: 'Nonogram · PrasannaOne',
    text: 'A little logic, one square at a time. Play Nonogram.',
    url: window.location.href
  };
  if (typeof navigator.share === 'function') {
    try { await navigator.share(shareData); return; }
    catch (error) { if (error?.name === 'AbortError') return; }
  }
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(shareData.url);
    announceStatus('Game link copied.');
  } catch {
    window.prompt('Copy this link to share the game:', shareData.url);
  }
}
$('shareButton').addEventListener('click', shareGame);

// Completion is an explicit choice: continue, replay this puzzle, or support the game.
$('completionDialog').addEventListener('cancel', event => event.preventDefault());
$('nextLevelButton').addEventListener('click', () => {
  closeDialog($('completionDialog'));
  completedLevelNumber = null;
  completedPuzzleForReplay = null;
  loadLevel(progress.currentLevel);
});
$('replayLevelButton').addEventListener('click', () => {
  const replay = completedPuzzleForReplay;
  const levelToReplay = completedLevelNumber;
  closeDialog($('completionDialog'));
  completedLevelNumber = null;
  if (Number.isSafeInteger(levelToReplay) && levelToReplay > 0 && replay?.level === levelToReplay) {
    completed = false;
    loadLevel(levelToReplay, { replaySpec: replay });
  }
});

document.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>{activeTool=btn.dataset.tool;render();}));
$('undoButton').addEventListener('click',()=>{if(board.undo()){save();render();}});
$('clearBoardButton').addEventListener('click',()=>{
  if (completed) return;
  if (pointerDown) finishStroke();
  if (!board.reset()) return;
  // Restart player marks, but keep cells already revealed by purchased hints.
  for (const key of hintedCells) {
    const [row, col] = key.split(':').map(Number);
    board.cells[row][col] = CELL.FILLED;
  }
  lastHint = null;
  save();
  render();
  announceStatus('Level restarted. Revealed hints were kept.');
});
$('hintButton').addEventListener('click',()=>{
  const hintCost = getHintCost(puzzle.width);
  const purchase = spendHintPoints(progress, hintCost);
  if (!purchase.success) { announceStatus(`A hint costs ${hintCost} points. You have ${progress.points}.`); return; }
  const revealed = board.giveHint(puzzle.solution);
  if (revealed) {
    const beforeHintLines = previousCompletedLines;
    progress = purchase.progress; lastHint = revealed; hintedCells.add(`${revealed.row}:${revealed.col}`); save(); render();
    previousCompletedLines = beforeHintLines;
    refreshLineMarks();
    announceStatus('Hint revealed.'); checkComplete();
  }
});
try { loadLevel(progress.currentLevel || 1); }
catch(error) { console.error(error); announceStatus('Could not create this puzzle. Reload to try again.'); }


// GitHub Pages is served over HTTPS, so the app can install its offline shell.
// Service-worker failure must never block normal gameplay.
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' });
      if (navigator.onLine && typeof registration.update === 'function') await registration.update();
    } catch (error) {
      console.warn('Nonogram offline support could not be registered:', error);
    }
  }, { once: true });
}
