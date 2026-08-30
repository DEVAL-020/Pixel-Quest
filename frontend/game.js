const CFG = {
  GRAVITY: 1500,
  JUMP_VELOCITY: -620,
  MOVE_SPEED: 260,
  MAX_FALL: 900,
  FRICTION_AIR: 1,
  PLAYER_W: 30,
  PLAYER_H: 40,
  ENEMY_W: 32,
  ENEMY_H: 30,
  COIN_R: 9,
  INVINCIBLE_TIME: 1.1,
  MAX_LIVES: 3,
  CANVAS_W: 960,
  CANVAS_H: 540,
};

const SFX = (() => {
  let ctx = null;
  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }
  function tone(freq, dur, type = 'square', vol = 0.08, delay = 0) {
    try {
      const c = ensure();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain).connect(c.destination);
      const t0 = c.currentTime + delay;
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) { }
  }
  return {
    jump: () => { tone(520, 0.09, 'square'); tone(760, 0.08, 'square', 0.06, 0.05); },
    coin: () => { tone(880, 0.06, 'square', 0.07); tone(1320, 0.09, 'square', 0.07, 0.05); },
    stomp: () => tone(180, 0.12, 'sawtooth', 0.09),
    hit: () => tone(140, 0.25, 'sawtooth', 0.1),
    levelUp: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', 0.08, i * 0.09)); },
    gameOver: () => { [392, 349, 294, 220].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.14)); },
    unlock: () => { ensure(); },
  };
})();

const LEVELS = [
  {
    name: 'Grasslands',
    theme: 'grass',
    width: 2400,
    spawn: { x: 40, y: 420 },
    ground: [
      { x: 0, w: 380 }, { x: 470, w: 260 }, { x: 840, w: 340 },
      { x: 1290, w: 300 }, { x: 1690, w: 710 },
    ],
    platforms: [
      { x: 540, y: 400, w: 120, h: 16 },
      { x: 950, y: 380, w: 140, h: 16 },
      { x: 1350, y: 390, w: 120, h: 16 },
      { x: 1800, y: 400, w: 150, h: 16 },
      { x: 2060, y: 330, w: 130, h: 16 },
    ],
    coins: [
      [200, 460], [560, 360], [610, 360], [980, 340], [1030, 340], [1080, 340],
      [900, 460], [1370, 350], [1750, 460], [1830, 360], [1900, 360], [2090, 290],
      [2200, 460], [2300, 460],
    ],
    enemies: [
      { x: 900, gy: 500, min: 860, max: 1160, speed: 80 },
      { x: 1000, gy: 380, min: 960, max: 1080, speed: 70, onPlatform: true },
      { x: 1800, gy: 500, min: 1750, max: 2050, speed: 100 },
    ],
    flag: { x: 2340, y: 400, w: 26, h: 100 },
  },
  {
    name: 'Caverns',
    theme: 'cave',
    width: 2800,
    spawn: { x: 40, y: 420 },
    ground: [
      { x: 0, w: 300 }, { x: 420, w: 200 }, { x: 720, w: 180 },
      { x: 1000, w: 220 }, { x: 1340, w: 200 }, { x: 1660, w: 260 },
      { x: 2040, w: 220 }, { x: 2360, w: 440 },
    ],
    platforms: [
      { x: 260, y: 400, w: 110, h: 16 },
      { x: 660, y: 370, w: 110, h: 16 },
      { x: 960, y: 340, w: 100, h: 16 },
      { x: 1260, y: 400, w: 110, h: 16 },
      { x: 1600, y: 360, w: 100, h: 16 },
      { x: 1940, y: 330, w: 130, h: 16 },
      { x: 2280, y: 380, w: 110, h: 16 },
      { x: 2560, y: 300, w: 130, h: 16 },
    ],
    coins: [
      [280, 360], [680, 330], [980, 300], [1280, 360], [1620, 320], [1960, 290],
      [2300, 340], [2580, 260], [500, 460], [900, 460], [1450, 460], [1800, 460],
      [2150, 460], [2650, 460],
    ],
    enemies: [
      { x: 460, gy: 500, min: 420, max: 610, speed: 90 },
      { x: 1010, gy: 500, min: 1000, max: 1210, speed: 100 },
      { x: 1670, gy: 500, min: 1660, max: 1900, speed: 110 },
      { x: 1970, gy: 330, min: 1940, max: 2060, speed: 80, onPlatform: true },
      { x: 2400, gy: 500, min: 2360, max: 2700, speed: 120 },
    ],
    flag: { x: 2750, y: 400, w: 26, h: 100 },
  },
  {
    name: 'Sky Fortress',
    theme: 'sky',
    width: 3200,
    spawn: { x: 40, y: 420 },
    ground: [
      { x: 0, w: 260 }, { x: 2960, w: 240 },
    ],
    platforms: [
      { x: 320, y: 430, w: 110, h: 16 },
      { x: 520, y: 360, w: 100, h: 16 },
      { x: 710, y: 290, w: 100, h: 16 },
      { x: 900, y: 380, w: 110, h: 16 },
      { x: 1090, y: 440, w: 120, h: 16 },
      { x: 1300, y: 360, w: 100, h: 16 },
      { x: 1480, y: 280, w: 100, h: 16 },
      { x: 1660, y: 360, w: 110, h: 16 },
      { x: 1850, y: 440, w: 120, h: 16 },
      { x: 2060, y: 370, w: 100, h: 16 },
      { x: 2240, y: 290, w: 100, h: 16 },
      { x: 2420, y: 360, w: 110, h: 16 },
      { x: 2610, y: 430, w: 120, h: 16 },
      { x: 2800, y: 360, w: 110, h: 16 },
    ],
    coins: [
      [350, 390], [550, 320], [740, 250], [930, 340], [1130, 400], [1330, 320],
      [1510, 240], [1690, 320], [1880, 400], [2090, 330], [2270, 250], [2450, 320],
      [2640, 390], [2830, 320],
    ],
    enemies: [
      { x: 330, gy: 430, min: 320, max: 420, speed: 70, onPlatform: true },
      { x: 910, gy: 380, min: 900, max: 1000, speed: 80, onPlatform: true },
      { x: 1310, gy: 360, min: 1300, max: 1390, speed: 90, onPlatform: true },
      { x: 1860, gy: 440, min: 1850, max: 1960, speed: 90, onPlatform: true },
      { x: 2250, gy: 290, min: 2240, max: 2330, speed: 100, onPlatform: true },
      { x: 2620, gy: 430, min: 2610, max: 2720, speed: 100, onPlatform: true },
    ],
    flag: { x: 3070, y: 400, w: 26, h: 100 },
  },
];

const state = {
  playerName: 'HERO',
  levelIndex: 0,
  score: 0,
  lives: CFG.MAX_LIVES,
  running: false,
  paused: false,
  pendingContinue: null,
};

const STORAGE_KEYS = {
  save: 'pixelquest_save',
  scores: 'pixelquest_scores',
};

let level = null;
let player, enemies, coins, camera, keys, lastTime, rafId;
let invincibleT = 0;
let walkCycle = 0;

const $ = (sel) => document.querySelector(sel);
const canvas = $('#game-canvas');
const ctx2d = canvas.getContext('2d');
ctx2d.imageSmoothingEnabled = false;

const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach((s) => s.classList.toggle('active', s.id === id));
}
document.querySelectorAll('[data-nav]').forEach((btn) => {
  btn.addEventListener('click', () => showScreen(btn.dataset.nav));
});

const nameInput = $('#player-name');
const savedName = localStorage.getItem('pixelquest_lastplayer');
if (savedName) nameInput.value = savedName;

const NAME_RE = /^[A-Za-z0-9 _-]*$/;
function sanitizeName(raw) {
  const cleaned = Array.from(String(raw || '')).filter((ch) => NAME_RE.test(ch)).join('');
  return (cleaned.trim() || 'HERO').slice(0, 24).toUpperCase();
}

function getLocalSave() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.save) || 'null');
  } catch (_e) {
    return null;
  }
}

function saveLocalProgress() {
  const progress = {
    player_name: state.playerName,
    level: state.levelIndex,
    score: state.score,
    lives: state.lives,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.save, JSON.stringify(progress));
  state.pendingContinue = progress;
}

function getLocalScores() {
  try {
    const scores = JSON.parse(localStorage.getItem(STORAGE_KEYS.scores) || '[]');
    return Array.isArray(scores) ? scores : [];
  } catch (_e) {
    return [];
  }
}

function saveLocalScore() {
  const scores = getLocalScores();
  scores.push({
    player_name: state.playerName,
    score: state.score,
    level_reached: LEVELS.length,
    created_at: new Date().toISOString(),
  });
  scores.sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));
  localStorage.setItem(STORAGE_KEYS.scores, JSON.stringify(scores.slice(0, 10)));
}
nameInput.addEventListener('input', () => {
  const cursor = nameInput.selectionStart;
  const before = nameInput.value;
  const filtered = Array.from(before).filter((ch) => NAME_RE.test(ch)).join('');
  if (filtered !== before) {
    nameInput.value = filtered;
    nameInput.setSelectionRange(Math.max(0, cursor - 1), Math.max(0, cursor - 1));
  }
});

function checkContinue() {
  const progress = getLocalSave();
  const canContinue = progress && progress.player_name === sanitizeName(nameInput.value);
  state.pendingContinue = canContinue ? progress : null;
  $('#btn-continue').disabled = !canContinue;
}
nameInput.addEventListener('change', checkContinue);
checkContinue();

$('#btn-new-game').addEventListener('click', () => {
  SFX.unlock();
  state.playerName = sanitizeName(nameInput.value);
  localStorage.setItem('pixelquest_lastplayer', state.playerName);
  state.levelIndex = 0;
  state.score = 0;
  state.lives = CFG.MAX_LIVES;
  startLevel(0);
});

$('#btn-continue').addEventListener('click', () => {
  SFX.unlock();
  if (!state.pendingContinue) return;
  state.playerName = sanitizeName(nameInput.value);
  localStorage.setItem('pixelquest_lastplayer', state.playerName);
  state.levelIndex = Math.min(state.pendingContinue.level, LEVELS.length - 1);
  state.score = state.pendingContinue.score;
  state.lives = state.pendingContinue.lives || CFG.MAX_LIVES;
  startLevel(state.levelIndex);
});

$('#btn-howto').addEventListener('click', () => showScreen('screen-howto'));

$('#btn-leaderboard').addEventListener('click', async () => {
  showScreen('screen-leaderboard');
  await loadLeaderboard();
});

async function loadLeaderboard() {
  const list = $('#leaderboard-list');
  list.innerHTML = '<p class="muted">Loading scores…</p>';
  const scores = getLocalScores();
  if (!scores.length) {
    list.innerHTML = '<p class="muted">No scores yet — be the first!</p>';
    return;
  }
  list.innerHTML = scores
    .map((s, i) => `
      <div class="lb-row">
        <span><span class="lb-rank">#${i + 1}</span>${escapeHtml(s.player_name)}</span>
        <span>${s.score} pts · Lv${s.level_reached}</span>
      </div>`)
    .join('');
}
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function startLevel(index) {
  level = LEVELS[index];
  $('#hud-level').textContent = index + 1;
  buildEntities();
  camera = { x: 0 };
  keys = { left: false, right: false, jump: false };
  invincibleT = 0;
  walkCycle = 0;
  hideAllOverlays();
  updateHUD();
  showScreen('screen-game');
  state.running = true;
  state.paused = false;
  lastTime = performance.now();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

function buildEntities() {
  player = {
    x: level.spawn.x, y: level.spawn.y,
    w: CFG.PLAYER_W, h: CFG.PLAYER_H,
    vx: 0, vy: 0, onGround: false, facing: 1,
  };
  enemies = level.enemies.map((e) => ({
    x: e.x, y: e.gy - CFG.ENEMY_H,
    w: CFG.ENEMY_W, h: CFG.ENEMY_H,
    vx: e.speed, min: e.min, max: e.max, alive: true,
  }));
  coins = level.coins.map(([x, y]) => ({ x, y, r: CFG.COIN_R, taken: false }));
}

function hideAllOverlays() {
  ['overlay-pause', 'overlay-levelcomplete', 'overlay-gameover', 'overlay-victory']
    .forEach((id) => $('#' + id).classList.add('hidden'));
}

function solidRects() {
  const rects = level.ground.map((g) => ({ x: g.x, y: 500, w: g.w, h: 200 }));
  level.platforms.forEach((p) => rects.push(p));
  return rects;
}

function moveAndCollide(ent, dt, rects) {
  ent.x += ent.vx * dt;
  for (const r of rects) {
    if (rectsOverlap(ent, r)) {
      if (ent.vx > 0) ent.x = r.x - ent.w;
      else if (ent.vx < 0) ent.x = r.x + r.w;
    }
  }
  ent.y += ent.vy * dt;
  ent.onGround = false;
  for (const r of rects) {
    if (rectsOverlap(ent, r)) {
      if (ent.vy > 0) { ent.y = r.y - ent.h; ent.vy = 0; ent.onGround = true; }
      else if (ent.vy < 0) { ent.y = r.y + r.h; ent.vy = 0; }
    }
  }
}
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Space'].includes(e.key) || e.code === 'Space') e.preventDefault();
  if (!state.running) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space') keys.jump = true;
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') togglePause();
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.code === 'Space') keys.jump = false;
});

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;
  if (state.running && !state.paused) {
    update(dt);
    draw();
  }
  rafId = requestAnimationFrame(loop);
}

let jumpHeld = false;
function update(dt) {
  const rects = solidRects();
  player.vx = 0;
  if (keys.left) { player.vx = -CFG.MOVE_SPEED; player.facing = -1; }
  if (keys.right) { player.vx = CFG.MOVE_SPEED; player.facing = 1; }
  if (keys.jump && player.onGround && !jumpHeld) {
    player.vy = CFG.JUMP_VELOCITY;
    player.onGround = false;
    SFX.jump();
  }
  jumpHeld = keys.jump;

  player.vy = Math.min(player.vy + CFG.GRAVITY * dt, CFG.MAX_FALL);

  moveAndCollide(player, dt, rects);
  if (player.y > 620) {
    damagePlayer(true);
  }

  player.x = Math.max(0, Math.min(player.x, level.width - player.w));

  walkCycle += (player.vx !== 0 ? Math.abs(player.vx) : 0) * dt * 0.02;

  if (invincibleT > 0) invincibleT -= dt;

  enemies.forEach((en) => {
    if (!en.alive) return;
    en.x += en.vx * dt;
    if (en.x < en.min) { en.x = en.min; en.vx = Math.abs(en.vx); }
    if (en.x + en.w > en.max) { en.x = en.max - en.w; en.vx = -Math.abs(en.vx); }

    if (rectsOverlap(player, en)) {
      const stomping = player.vy > 0 && (player.y + player.h) - en.y < 18;
      if (stomping) {
        en.alive = false;
        player.vy = CFG.JUMP_VELOCITY * 0.55;
        state.score += 25;
        SFX.stomp();
        updateHUD();
      } else if (invincibleT <= 0) {
        damagePlayer(false);
      }
    }
  });

  coins.forEach((c) => {
    if (c.taken) return;
    const dx = (player.x + player.w / 2) - c.x;
    const dy = (player.y + player.h / 2) - c.y;
    if (Math.sqrt(dx * dx + dy * dy) < c.r + 18) {
      c.taken = true;
      state.score += 10;
      SFX.coin();
      updateHUD();
    }
  });

  const f = level.flag;
  if (rectsOverlap(player, { x: f.x, y: f.y, w: f.w, h: f.h })) {
    onLevelComplete();
  }

  camera.x = Math.max(0, Math.min(player.x - CFG.CANVAS_W / 2, level.width - CFG.CANVAS_W));
}

function damagePlayer(fromPit) {
  if (invincibleT > 0 && !fromPit) return;
  state.lives -= 1;
  invincibleT = CFG.INVINCIBLE_TIME;
  SFX.hit();
  updateHUD();
  if (state.lives <= 0) {
    onGameOver();
  } else {
    player.x = level.spawn.x;
    player.y = level.spawn.y;
    player.vx = 0; player.vy = 0;
  }
}

function onLevelComplete() {
  state.running = false;
  if (state.levelIndex >= LEVELS.length - 1) {
    $('#victory-score').textContent = `Final score: ${state.score}`;
    $('#overlay-victory').classList.remove('hidden');
    SFX.levelUp();
  } else {
    $('#level-complete-score').textContent = `Score so far: ${state.score}`;
    $('#overlay-levelcomplete').classList.remove('hidden');
    SFX.levelUp();
  }
}

function onGameOver() {
  state.running = false;
  $('#gameover-score').textContent = `Score: ${state.score}`;
  $('#overlay-gameover').classList.remove('hidden');
  SFX.gameOver();
}

function updateHUD() {
  $('#hud-score').textContent = state.score;
  $('#hud-level').textContent = state.levelIndex + 1;
  const heartsEl = $('#hud-hearts');
  heartsEl.innerHTML = '';
  for (let i = 0; i < CFG.MAX_LIVES; i++) {
    const h = document.createElement('div');
    h.className = 'heart' + (i < state.lives ? '' : ' empty');
    heartsEl.appendChild(h);
  }
}

$('#btn-pause').addEventListener('click', togglePause);
function togglePause() {
  if (!state.running && !state.paused) return;
  state.paused = !state.paused;
  $('#overlay-pause').classList.toggle('hidden', !state.paused);
  $('#save-status').textContent = '';
}
$('#btn-resume').addEventListener('click', () => { state.paused = false; $('#overlay-pause').classList.add('hidden'); });
$('#btn-restart-level').addEventListener('click', () => { state.paused = false; startLevel(state.levelIndex); });
$('#btn-quit').addEventListener('click', () => { state.running = false; state.paused = false; showScreen('screen-menu'); checkContinue(); });

$('#btn-save-progress').addEventListener('click', async () => {
  const statusEl = $('#save-status');
  saveLocalProgress();
  statusEl.textContent = 'Saved on this device!';
});

$('#btn-next-level').addEventListener('click', () => {
  state.levelIndex += 1;
  startLevel(state.levelIndex);
});
$('#btn-retry').addEventListener('click', () => {
  state.lives = CFG.MAX_LIVES;
  startLevel(state.levelIndex);
});
$('#btn-gameover-menu').addEventListener('click', () => { state.running = false; showScreen('screen-menu'); checkContinue(); });
$('#btn-victory-menu').addEventListener('click', () => { state.running = false; showScreen('screen-menu'); checkContinue(); });

$('#btn-submit-score').addEventListener('click', async (e) => {
  e.target.disabled = true;
  e.target.textContent = 'Submitting…';
  saveLocalScore();
  e.target.textContent = 'Submitted!';
});

const THEME_COLORS = {
  grass: { sky1: '#2b2450', sky2: '#0d0d16', ground: '#3a2a1e', groundTop: '#5a8f3c', plat: '#5b4a36' },
  cave: { sky1: '#141026', sky2: '#0a0a10', ground: '#2a2436', groundTop: '#4a3f5c', plat: '#3c3450' },
  sky: { sky1: '#1c2c52', sky2: '#0d0d16', ground: '#3a2a4e', groundTop: '#7a63c9', plat: '#4d3d78' },
};

function draw() {
  const t = THEME_COLORS[level.theme];
  const grad = ctx2d.createLinearGradient(0, 0, 0, CFG.CANVAS_H);
  grad.addColorStop(0, t.sky1);
  grad.addColorStop(1, t.sky2);
  ctx2d.fillStyle = grad;
  ctx2d.fillRect(0, 0, CFG.CANVAS_W, CFG.CANVAS_H);

  ctx2d.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 40; i++) {
    const px = (i * 137 - camera.x * 0.3) % (CFG.CANVAS_W + 100);
    const py = (i * 53) % 260;
    ctx2d.fillRect(((px % CFG.CANVAS_W) + CFG.CANVAS_W) % CFG.CANVAS_W, py, 2, 2);
  }

  ctx2d.save();
  ctx2d.translate(-camera.x, 0);

  level.ground.forEach((g) => {
    ctx2d.fillStyle = t.ground;
    ctx2d.fillRect(g.x, 500, g.w, 200);
    ctx2d.fillStyle = t.groundTop;
    ctx2d.fillRect(g.x, 500, g.w, 10);
  });

  level.platforms.forEach((p) => {
    ctx2d.fillStyle = t.plat;
    ctx2d.fillRect(p.x, p.y, p.w, p.h);
    ctx2d.fillStyle = t.groundTop;
    ctx2d.fillRect(p.x, p.y, p.w, 4);
  });

  const f = level.flag;
  ctx2d.fillStyle = '#b98bff';
  ctx2d.fillRect(f.x, f.y, 6, f.h);
  ctx2d.beginPath();
  ctx2d.moveTo(f.x + 6, f.y);
  ctx2d.lineTo(f.x + 6 + 26, f.y + 12);
  ctx2d.lineTo(f.x + 6, f.y + 24);
  ctx2d.closePath();
  ctx2d.fillStyle = pulse('#ffd35c', '#ff9de2');
  ctx2d.fill();

  coins.forEach((c) => {
    if (c.taken) return;
    ctx2d.save();
    ctx2d.translate(c.x, c.y + Math.sin(performance.now() / 250 + c.x) * 3);
    ctx2d.fillStyle = '#ffd35c';
    ctx2d.beginPath();
    ctx2d.arc(0, 0, c.r, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.fillStyle = '#a8730f';
    ctx2d.beginPath();
    ctx2d.arc(0, 0, c.r * 0.4, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.restore();
  });

  enemies.forEach((en) => {
    if (!en.alive) return;
    ctx2d.fillStyle = '#ff5d6c';
    ctx2d.fillRect(en.x, en.y, en.w, en.h);
    ctx2d.fillStyle = '#3a0006';
    const eyeDir = en.vx > 0 ? 1 : -1;
    ctx2d.fillRect(en.x + en.w / 2 + eyeDir * 6 - 3, en.y + 8, 6, 6);
  });

  drawPlayer();

  ctx2d.restore();
}

function pulse(colorA, colorB) {
  const p = (Math.sin(performance.now() / 300) + 1) / 2;
  return lerpColor(colorA, colorB, p);
}
function lerpColor(a, b, t) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}
function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function drawPlayer() {
  const blink = invincibleT > 0 && Math.floor(invincibleT * 12) % 2 === 0;
  if (blink) return;

  const bob = player.onGround ? Math.abs(Math.sin(walkCycle)) * 3 : 0;
  const px = player.x, py = player.y - bob;

  ctx2d.fillStyle = '#2b6f61';
  const legSwing = player.onGround && player.vx !== 0 ? Math.sin(walkCycle * 2) * 6 : 0;
  ctx2d.fillRect(px + 4, py + player.h - 10 + Math.max(0, legSwing), 8, 10);
  ctx2d.fillRect(px + player.w - 12, py + player.h - 10 + Math.max(0, -legSwing), 8, 10);
  ctx2d.fillStyle = '#49e2c4';
  ctx2d.fillRect(px, py, player.w, player.h - 8);

  ctx2d.fillStyle = '#0c0c14';
  const eyeX = player.facing > 0 ? px + player.w - 12 : px + 4;
  ctx2d.fillRect(eyeX, py + 10, 8, 8);
  ctx2d.fillStyle = '#ff5d6c';
  ctx2d.fillRect(px, py + 4, player.w, 5);
}

updateHUD();
$('#copyright-year').textContent = new Date().getFullYear();
