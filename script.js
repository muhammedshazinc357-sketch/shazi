(() => {
  'use strict';
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const statusEl = document.getElementById('status');
  const overlay = document.getElementById('overlay');
  const titleEl = document.getElementById('overlay-title');
  const copyEl = document.getElementById('overlay-copy');
  const startBtn = document.getElementById('start');
  const pauseBtn = document.getElementById('pause');
  const restartBtn = document.getElementById('restart');

  const cells = 20, cell = canvas.width / cells;
  let snake, food, dir, queuedDir, score, best, timer, state = 'ready';
  const speeds = () => Math.max(75, 145 - Math.floor(score / 5) * 8);
  best = Number(localStorage.getItem('snake-best') || 0);
  bestEl.textContent = pad(best);

  function pad(n){ return String(n).padStart(3,'0'); }
  function newGame(){
    clearInterval(timer); score=0;
    snake=[{x:9,y:10},{x:8,y:10},{x:7,y:10}];
    dir={x:1,y:0}; queuedDir={...dir}; spawnFood();
    scoreEl.textContent=pad(score); state='playing';
    overlay.classList.add('hidden'); pauseBtn.disabled=false;
    pauseBtn.textContent='PAUSE'; statusEl.textContent='IN GAME';
    draw(); timer=setInterval(tick,speeds());
  }
  function spawnFood(){
    do { food={x:Math.floor(Math.random()*cells),y:Math.floor(Math.random()*cells)}; }
    while(snake.some(s=>s.x===food.x&&s.y===food.y));
  }
  function setDirection(name){
    const map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    const next=map[name]; if(!next||state!=='playing') return;
    if(next.x===-dir.x&&next.y===-dir.y) return;
    queuedDir=next;
  }
  function tick(){
    dir=queuedDir;
    const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    const eating=head.x===food.x&&head.y===food.y;
    const body=eating?snake:snake.slice(0,-1);
    if(head.x<0||head.y<0||head.x>=cells||head.y>=cells||body.some(s=>s.x===head.x&&s.y===head.y)){
      gameOver();return;
    }
    snake.unshift(head);
    if(eating){
      score++;scoreEl.textContent=pad(score);
      if(score>best){best=score;bestEl.textContent=pad(best);localStorage.setItem('snake-best',best);}
      spawnFood();clearInterval(timer);timer=setInterval(tick,speeds());
    }else snake.pop();
    draw();
  }
  function draw(){
    ctx.fillStyle='#0b130b';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='#172417';ctx.lineWidth=1;
    for(let i=1;i<cells;i++){ctx.beginPath();ctx.moveTo(i*cell,0);ctx.lineTo(i*cell,canvas.height);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*cell);ctx.lineTo(canvas.width,i*cell);ctx.stroke();}
    ctx.fillStyle='#ffcf67';ctx.fillRect(food.x*cell+4,food.y*cell+4,cell-8,cell-8);
    snake.forEach((part,i)=>{ctx.fillStyle=i===0?'#c4ff86':'#83d64d';ctx.fillRect(part.x*cell+2,part.y*cell+2,cell-4,cell-4);});
    if(snake.length){ctx.fillStyle='#15220f';const h=snake[0], eye=3;
      if(dir.x!==0){ctx.fillRect(h.x*cell+(dir.x>0?cell-6:3),h.y*cell+5,eye,eye);ctx.fillRect(h.x*cell+(dir.x>0?cell-6:3),h.y*cell+12,eye,eye);}
      else{ctx.fillRect(h.x*cell+5,h.y*cell+(dir.y>0?cell-6:3),eye,eye);ctx.fillRect(h.x*cell+12,h.y*cell+(dir.y>0?cell-6:3),eye,eye);}
    }
  }
  function gameOver(){
    clearInterval(timer);state='over';pauseBtn.disabled=true;statusEl.textContent='GAME OVER';
    titleEl.textContent='GAME OVER';copyEl.textContent=`You scored ${score}. Give it another go!`;
    startBtn.innerHTML='PLAY AGAIN <span>↻</span>';overlay.classList.remove('hidden');
  }
  function togglePause(){
    if(state==='playing'){clearInterval(timer);state='paused';pauseBtn.textContent='RESUME';statusEl.textContent='PAUSED';titleEl.textContent='PAUSED';copyEl.textContent='Take a breather, then continue.';startBtn.textContent='RESUME';overlay.classList.remove('hidden');}
    else if(state==='paused'){state='playing';overlay.classList.add('hidden');pauseBtn.textContent='PAUSE';statusEl.textContent='IN GAME';timer=setInterval(tick,speeds());}
  }
  startBtn.addEventListener('click',()=>state==='paused'?togglePause():newGame());
  pauseBtn.addEventListener('click',togglePause);
  restartBtn.addEventListener('click',newGame);
  document.addEventListener('keydown',e=>{
    const keys={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
    if(keys[e.key]){e.preventDefault();setDirection(keys[e.key]);}
    if(e.key===' '){e.preventDefault();if(state==='ready'||state==='over')newGame();else togglePause();}
  });
  document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>setDirection(b.dataset.dir)));
  let touchStart=null;
  canvas.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchStart={x:t.clientX,y:t.clientY};},{passive:true});
  canvas.addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>20)setDirection(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));touchStart=null;},{passive:true});
  // Draw a quiet board before the first round.
  snake=[{x:9,y:10},{x:8,y:10},{x:7,y:10}];food={x:14,y:7};dir={x:1,y:0};draw();
})();
