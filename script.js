(() => {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMessage = document.getElementById('overlay-message');
  const overlaySymbol = document.getElementById('overlay-symbol');
  const startButton = document.getElementById('start-button');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best-score');
  const statusEl = document.getElementById('game-status');
  const speedSelect = document.getElementById('speed');
  const soundButton = document.getElementById('sound-toggle');
  const soundLabel = document.getElementById('sound-label');

  const CELLS = 24;
  const CELL = canvas.width / CELLS;
  let snake, food, direction, nextDirection, score, timer, running, gameOver, soundOn;
  let audioContext = null;
  let best = 0;

  try { best = Number(localStorage.getItem('snakegames-best') || 0); } catch (_) {}
  bestEl.textContent = formatScore(best);
  soundOn = false;
  document.getElementById('year').textContent = new Date().getFullYear();

  function formatScore(value) { return String(value).padStart(3, '0'); }

  function resetGame() {
    clearInterval(timer);
    score = 0;
    snake = [
      { x: 11, y: 12 }, { x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    food = makeFood();
    running = false;
    gameOver = false;
    scoreEl.textContent = formatScore(score);
    statusEl.textContent = 'READY TO PLAY';
    draw();
  }

  function makeFood() {
    let position;
    do {
      position = { x: Math.floor(Math.random() * CELLS), y: Math.floor(Math.random() * CELLS) };
    } while (snake && snake.some(part => part.x === position.x && part.y === position.y));
    return position;
  }

  function drawGrid() {
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(158, 185, 190, 0.065)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CELLS; i++) {
      const pos = i * CELL + 0.5;
      ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(canvas.width, pos); ctx.stroke();
    }
  }

  function drawFood() {
    const cx = food.x * CELL + CELL / 2;
    const cy = food.y * CELL + CELL / 2;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, CELL * .8);
    glow.addColorStop(0, 'rgba(255,156,99,.27)');
    glow.addColorStop(1, 'rgba(255,156,99,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - CELL, cy - CELL, CELL * 2, CELL * 2);
    ctx.fillStyle = '#ff9c63';
    ctx.beginPath(); ctx.arc(cx, cy, CELL * .29, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd0ad';
    ctx.beginPath(); ctx.arc(cx - CELL * .09, cy - CELL * .1, CELL * .08, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b8f36b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy - CELL * .24); ctx.quadraticCurveTo(cx + 2, cy - CELL * .43, cx + CELL * .18, cy - CELL * .39); ctx.stroke();
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function drawSnake() {
    snake.forEach((part, index) => {
      const pad = index === 0 ? 2 : 3;
      const x = part.x * CELL + pad;
      const y = part.y * CELL + pad;
      const size = CELL - pad * 2;
      ctx.fillStyle = index === 0 ? '#d4ff91' : `hsl(91, ${Math.max(48, 65 - index)}%, ${Math.max(38, 65 - index * 1.1)}%)`;
      roundedRect(x, y, size, size, index === 0 ? 7 : 5);
      ctx.fill();
      if (index === 0) {
        ctx.fillStyle = '#15200f';
        let eyes;
        if (direction.x === 1) eyes = [[x + size * .68, y + size * .3], [x + size * .68, y + size * .7]];
        else if (direction.x === -1) eyes = [[x + size * .32, y + size * .3], [x + size * .32, y + size * .7]];
        else if (direction.y === -1) eyes = [[x + size * .3, y + size * .32], [x + size * .7, y + size * .32]];
        else eyes = [[x + size * .3, y + size * .68], [x + size * .7, y + size * .68]];
        eyes.forEach(([ex, ey]) => { ctx.beginPath(); ctx.arc(ex, ey, 2.3, 0, Math.PI * 2); ctx.fill(); });
      }
    });
  }

  function draw() {
    drawGrid();
    if (food) drawFood();
    if (snake) drawSnake();
  }

  function playTone(frequency = 540, duration = .07) {
    if (!soundOn) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.07, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
    } catch (_) {}
  }

  function startGame() {
    if (gameOver) resetGame();
    if (running) return;
    running = true;
    overlay.classList.add('hidden');
    statusEl.textContent = 'IN THE GAME';
    clearInterval(timer);
    timer = setInterval(tick, Number(speedSelect.value));
  }

  function endGame() {
    clearInterval(timer);
    running = false;
    gameOver = true;
    statusEl.textContent = 'GAME OVER';
    overlayTitle.textContent = 'Game over';
    overlayMessage.textContent = `You scored ${score} points. Ready for another run?`;
    overlaySymbol.textContent = '↻';
    startButton.innerHTML = 'PLAY AGAIN <span>→</span>';
    overlay.classList.remove('hidden');
    playTone(180, .22);
  }

  function tick() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const ate = head.x === food.x && head.y === food.y;
    const bodyToCheck = ate ? snake : snake.slice(0, -1);
    if (head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS ||
        bodyToCheck.some(part => part.x === head.x && part.y === head.y)) {
      endGame();
      return;
    }
    snake.unshift(head);
    if (ate) {
      score += 10;
      scoreEl.textContent = formatScore(score);
      if (score > best) {
        best = score;
        bestEl.textContent = formatScore(best);
        try { localStorage.setItem('snakegames-best', String(best)); } catch (_) {}
      }
      food = makeFood();
      playTone(680, .06);
      if (score > 0 && score % 50 === 0) {
        clearInterval(timer);
        timer = setInterval(tick, Math.max(45, Number(speedSelect.value) - Math.floor(score / 50) * 5));
      }
    } else {
      snake.pop();
    }
    draw();
  }

  function changeDirection(name) {
    const dirs = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    const candidate = dirs[name];
    if (!candidate) return;
    if (candidate.x === -direction.x && candidate.y === -direction.y) return;
    nextDirection = candidate;
    if (!running && !gameOver && name) startGame();
  }

  document.addEventListener('keydown', event => {
    const keyMap = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right'
    };
    if (keyMap[event.key]) {
      event.preventDefault();
      changeDirection(keyMap[event.key]);
    } else if (event.code === 'Space') {
      event.preventDefault();
      if (running) { clearInterval(timer); running = false; statusEl.textContent = 'PAUSED'; overlayTitle.textContent = 'Paused'; overlayMessage.textContent = 'Take a breath. Your next run is one button away.'; overlaySymbol.textContent = 'Ⅱ'; startButton.innerHTML = 'RESUME <span>→</span>'; overlay.classList.remove('hidden'); }
      else startGame();
    }
  });

  document.querySelectorAll('[data-dir]').forEach(button => {
    button.addEventListener('click', () => changeDirection(button.dataset.dir));
    button.addEventListener('pointerdown', event => event.preventDefault());
  });

  startButton.addEventListener('click', startGame);
  document.getElementById('restart-button').addEventListener('click', () => {
    resetGame();
    overlayTitle.textContent = 'Ready?';
    overlayMessage.textContent = "Press start when you're ready to play.";
    overlaySymbol.textContent = '▶';
    startButton.innerHTML = 'START GAME <span>→</span>';
    overlay.classList.remove('hidden');
  });
  speedSelect.addEventListener('change', () => { if (running) { clearInterval(timer); timer = setInterval(tick, Number(speedSelect.value)); } });
  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundLabel.textContent = soundOn ? 'Sound on' : 'Sound off';
    if (soundOn) playTone(540, .06);
  });

  resetGame();
})();
