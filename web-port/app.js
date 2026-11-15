import { generateEasyPuzzle } from './nonogram.js';
import { PuzzleBoard, CELL, TOOL, getCompletedLines, isBoardComplete } from './interaction.js';
import { createProgressRepository, createInitialProgress, completeLevel, setCurrentPuzzle } from './progress.js';

const $ = (id) => document.getElementById(id);
const repo = createProgressRepository(window.localStorage);
let progress = repo.load();
let puzzle = null;
let board = null;
let activeTool = TOOL.FILL;
let pointerStroke = false;
let strokePointerId = null;
let solved = false;
const homeView = $('homeView'), gameView = $('gameView'), grid = $('puzzleGrid');

function save() {
  if (puzzle && board) {
    progress = setCurrentPuzzle(progress, { level: puzzle.level, seed: puzzle.seed, width: puzzle.width, height: puzzle.height }, board.snapshot());
  }
  progress = repo.save(progress);
  updateHome();
}
function updateHome() {
  $('homeLevel').textContent = `Level ${progress.currentLevel}`;
  $('homeProgress').textContent = progress.completedLevels.length ? `${progress.completedLevels.length} completed. Your next puzzle is ready.` : 'A fresh page awaits.';
  $('completedCount').textContent = `${progress.completedLevels.length} puzzles completed`;
}
function showHome() { homeView.hidden = false; gameView.hidden = true; updateHome(); }
function startLevel(level = progress.currentLevel) {
  const seed = (Math.imul(level, 2654435761) ^ 0x51f15e) >>> 0;
  puzzle = generateEasyPuzzle({ level, seed });
  puzzle.seed = seed;
  board = new PuzzleBoard(puzzle.height, puzzle.width);
  const saved = progress.currentPuzzle;
  if (saved && saved.level === level && saved.seed === seed && saved.width === puzzle.width && saved.height === puzzle.height) {
    saved.board.forEach((row, r) => row.forEach((state, c) => {
      if (state !== CELL.UNKNOWN) board.applyCell(r, c, state === CELL.FILLED ? TOOL.FILL : TOOL.CROSS);
    }));
  }
  solved = false;
  $('levelTitle').textContent = `Puzzle ${String(level).padStart(2,'0')}`;
  $('levelSize').textContent = `${puzzle.width} × ${puzzle.height}`;
  homeView.hidden = true; gameView.hidden = false;
  renderBoard(); save();
}
function renderBoard() {
  const h = puzzle.height, w = puzzle.width;
  grid.style.setProperty('--cols', w); grid.style.setProperty('--rows', h);
  grid.style.gridTemplateColumns = `repeat(${w}, minmax(0,1fr))`;
  grid.style.gridTemplateRows = `repeat(${h}, minmax(0,1fr))`;
  $('rowClues').style.setProperty('--rows', h); $('columnClues').style.setProperty('--cols', w);
  $('rowClues').innerHTML = puzzle.clues.rows.map((clue, r) => `<div class="row-clue" data-row="${r}">${clue.map(n=>`<span>${n}</span>`).join('')}</div>`).join('');
  $('columnClues').innerHTML = puzzle.clues.columns.map((clue, c) => `<div class="column-clue" data-col="${c}">${clue.map(n=>`<span>${n}</span>`).join('')}</div>`).join('');
  grid.innerHTML = '';
  for (let r=0;r<h;r++) for (let c=0;c<w;c++) {
    const cell = document.createElement('button'); cell.type='button'; cell.className='cell'; cell.dataset.row=r; cell.dataset.col=c; if(c===w-1) cell.classList.add('last-col'); if(r===h-1) cell.classList.add('last-row');
    cell.setAttribute('role','gridcell'); cell.setAttribute('aria-label',`Row ${r+1}, column ${c+1}`); grid.append(cell);
  }
  refreshCells();
}
function refreshCells() {
  if (!board) return;
  const complete = getCompletedLines(board, puzzle.solution);
  grid.querySelectorAll('.cell').forEach(el => {
    const r=Number(el.dataset.row), c=Number(el.dataset.col), state=board.getState(r,c);
    el.classList.toggle('filled',state===CELL.FILLED); el.classList.toggle('crossed',state===CELL.CROSSED);
    el.setAttribute('aria-label',`Row ${r+1}, column ${c+1}, ${state}`);
  });
  $('rowClues').querySelectorAll('.row-clue').forEach(el=>el.classList.toggle('complete',complete.rows.includes(Number(el.dataset.row))));
  $('columnClues').querySelectorAll('.column-clue').forEach(el=>el.classList.toggle('complete',complete.columns.includes(Number(el.dataset.col))));
  const marked=board.snapshot().flat().filter(x=>x!==CELL.UNKNOWN).length;
  $('progressLabel').textContent=`${Math.round(marked/(puzzle.width*puzzle.height)*100)}% marked`;
  $('undoBtn').disabled=!board.canUndo();
  if (isBoardComplete(board,puzzle.solution)) finishPuzzle();
}
function paintFromTarget(target) {
  const cell=target.closest('.cell'); if(!cell || !grid.contains(cell)) return;
  board.paintCell(Number(cell.dataset.row),Number(cell.dataset.col));
  refreshCells();
}
function finishPuzzle() {
  if(solved) return; solved=true;
  progress=completeLevel(progress,puzzle.level); progress=repo.save(progress);
  $('statusText').textContent='Pattern complete. Nicely done.';
  $('dialogEyebrow').textContent='PUZZLE COMPLETE'; $('dialogTitle').textContent='A pattern found.';
  $('dialogBody').textContent='You made every little square count. Your next puzzle is ready whenever you are.';
  $('dialogActions').innerHTML='<button id="nextPuzzleBtn">Next puzzle ↗</button>';
  $('nextPuzzleBtn').addEventListener('click',()=>{ $('messageDialog').close(); startLevel(progress.currentLevel); });
  $('messageDialog').showModal(); updateHome();
}
function setTool(tool) {
  activeTool=tool;
  document.querySelectorAll('.tool-choice').forEach(el=>{const selected=el.dataset.tool===tool;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});
}

grid.addEventListener('pointerdown',e=>{
  const cell=e.target.closest('.cell'); if(!cell||solved) return;
  e.preventDefault(); pointerStroke=true; strokePointerId=e.pointerId; grid.setPointerCapture(e.pointerId);
  board.beginStroke(activeTool); paintFromTarget(cell);
});
grid.addEventListener('pointerover',e=>{if(pointerStroke && e.pointerType==='mouse') paintFromTarget(e.target);});
grid.addEventListener('pointermove',e=>{if(!pointerStroke || e.pointerId!==strokePointerId) return; const el=document.elementFromPoint(e.clientX,e.clientY); paintFromTarget(el);});
function endStroke(){if(!pointerStroke)return;pointerStroke=false;strokePointerId=null;board.endStroke();refreshCells();save();}
grid.addEventListener('pointerup',endStroke);grid.addEventListener('pointercancel',endStroke);grid.addEventListener('lostpointercapture',endStroke);
document.querySelectorAll('.tool-choice').forEach(el=>el.addEventListener('click',()=>setTool(el.dataset.tool)));
$('undoBtn').addEventListener('click',()=>{if(board?.undo()){refreshCells();save();$('statusText').textContent='Last move undone.';}});
$('eraseBtn').addEventListener('click',()=>setTool(TOOL.ERASE));
$('resetBtn').addEventListener('click',()=>{if(!board)return;board.reset();solved=false;refreshCells();save();$('statusText').textContent='Board cleared. Start fresh.';});
$('hintBtn').addEventListener('click',()=>{if(!board||solved)return;let target=null;for(let r=0;r<puzzle.height&&!target;r++)for(let c=0;c<puzzle.width;c++){if(board.getState(r,c)===CELL.UNKNOWN&&puzzle.solution[r][c]){target=[r,c];break;}}if(!target){$('statusText').textContent='No unmarked filled squares remain to reveal.';return;}board.applyCell(target[0],target[1],TOOL.FILL);refreshCells();save();$('statusText').textContent='A correct square revealed. You can undo it too.';});
$('playBtn').addEventListener('click',()=>startLevel(progress.currentLevel));
$('backBtn').addEventListener('click',()=>{save();showHome();});
$('helpBtn').addEventListener('click',()=>{ $('dialogEyebrow').textContent='THE BASICS';$('dialogTitle').textContent='Read. Mark. Discover.';$('dialogBody').textContent='Numbers tell you how many filled squares appear in each row or column, in consecutive groups. Choose Fill for a filled square, Cross to mark an empty one, or Erase to clear a mark. Drag across cells to make a single stroke. Undo reverses your last stroke.';$('dialogActions').innerHTML='<button data-close>Got it</button>';$('messageDialog').showModal();});
$('settingsBtn').addEventListener('click',()=>{ $('dialogEyebrow').textContent='YOUR SPACE';$('dialogTitle').textContent='A calm little corner.';$('dialogBody').textContent='Your progress is saved locally on this device. No account, points, ads or noisy extras.';$('dialogActions').innerHTML='<button id="clearProgressBtn">Reset all progress</button><button data-close>Close</button>';$('clearProgressBtn').addEventListener('click',()=>{progress=repo.save(createInitialProgress());puzzle=null;board=null;$('messageDialog').close();showHome();});$('messageDialog').showModal();});
document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>el.closest('dialog').close()));
$('messageDialog').addEventListener('click',e=>{if(e.target===$('messageDialog'))$('messageDialog').close();});
updateHome();
