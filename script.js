(function(){
'use strict';
var DRAFT = false;  /* set to true to show dashed placeholders and a draft banner while editing */
var LINKS = { github: '', linkedin: '' };   /* paste your full GitHub and LinkedIn URLs here when you have them */
var SKILLS = ['C', 'C++', 'Java', 'Python', 'HTML', 'CSS', 'JavaScript'];

var d = document, body = d.body, root = d.documentElement;
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

if (DRAFT) body.classList.add('draft');
else { var nn = d.getElementById('note'); if (nn) nn.remove(); }
var hb = d.getElementById('noteHide');
if (hb) hb.addEventListener('click', function(){ d.getElementById('note').hidden = true; });

/* one shared pointer position, from -1 to 1 */
var mouse = { x: 0, y: 0, has: false };
window.addEventListener('pointermove', function(e){
  if (e.pointerType !== 'mouse') return;
  mouse.x = e.clientX / window.innerWidth * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight * 2 - 1);
  mouse.has = true;
});

/* ---------- contact details (assembled here so they are not sitting in the page as plain text) ---------- */
(function(){
  var mail = ['vikashsingh', '950873'].join('') + '@' + ['gmail', 'com'].join('.');
  var num = ['9508', '733511'].join('');
  var a = d.getElementById('cEmail'), t = d.getElementById('cTel');
  a.href = 'mailto:' + mail; a.textContent = mail;
  t.href = 'tel:+91' + num; t.textContent = num;
  [['cGit', LINKS.github], ['cIn', LINKS.linkedin]].forEach(function(p){
    var a = d.getElementById(p[0]);
    if (!p[1]) return;
    a.href = p[1]; a.target = '_blank'; a.rel = 'noopener';
    a.classList.remove('soon'); a.removeAttribute('aria-disabled');
    var sm = a.querySelector('small'); if (sm) sm.remove();
  });
})();

/* ---------- typed line and skill tape ---------- */
(function(){
  var el = d.getElementById('typed'), ph = ['C', 'C++', 'Java', 'Python', 'HTML, CSS and JavaScript'];
  if (reduce){ el.textContent = 'C, C++, Java, Python, HTML, CSS and JavaScript.'; return; }
  var pi = 0, ci = 0, del = false;
  (function tick(){
    var w = ph[pi];
    if (!del){
      ci++; el.textContent = w.slice(0, ci);
      if (ci === w.length){ del = true; return setTimeout(tick, 1500); }
      return setTimeout(tick, 85);
    }
    ci--; el.textContent = w.slice(0, ci);
    if (ci === 0){ del = false; pi = (pi + 1) % ph.length; return setTimeout(tick, 350); }
    return setTimeout(tick, 40);
  })();
})();
(function(){
  var tape = d.getElementById('tape'), html = '';
  for (var r = 0; r < 4; r++) SKILLS.forEach(function(s){ html += '<span>' + s + '</span>'; });
  tape.innerHTML = html;
})();

/* ---------- the swinging ID card ---------- */
var stage = d.getElementById('stage'), pend = d.getElementById('pend'), card = d.getElementById('card'), gloss = d.getElementById('gloss'), hint = d.getElementById('hint');
d.getElementById('strapTxt').textContent = new Array(16).join('VIKASH KUMAR   MCA   ');
var bc = d.getElementById('barcode'), seed = 7;
for (var i = 0; i < 46; i++){
  seed = (seed * 9301 + 49297) % 233280;
  var bar = d.createElement('i'); bar.style.width = (1 + Math.floor(seed / 233280 * 4)) + 'px'; bc.appendChild(bar);
}
var th = reduce ? 0 : 1.0, om = 0, thTarget = 0;
var dragging = false, moved = 0, sx = 0, sy = 0;
var flipped = false, fa = 0, tiltX = 0, tiltY = 0, stageVisible = true, lastT = performance.now();
var G = 13, C = 1.05;

function pivot(){ var r = stage.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top - 40 }; }
function flip(){
  flipped = !flipped;
  card.setAttribute('aria-pressed', String(flipped));
  hint.textContent = flipped ? 'Tap the card to flip it back.' : 'Drag the card. Tap it to flip.';
}
card.addEventListener('pointerdown', function(e){
  dragging = true; moved = 0; sx = e.clientX; sy = e.clientY; om = 0;
  try { card.setPointerCapture(e.pointerId); } catch (x) {}
});
card.addEventListener('pointermove', function(e){
  if (!dragging) return;
  moved = Math.max(moved, Math.hypot(e.clientX - sx, e.clientY - sy));
  if (reduce || moved < 6) return;
  var p = pivot();
  thTarget = clamp(Math.atan2(e.clientX - p.x, Math.max(120, e.clientY - p.y)), -0.95, 0.95);
});
card.addEventListener('pointerup', function(){
  if (!dragging) return;
  dragging = false;
  if (moved < 6) flip();
});
card.addEventListener('pointercancel', function(){ dragging = false; });
card.addEventListener('keydown', function(e){
  if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); }
});
window.addEventListener('pointermove', function(e){
  if (reduce || dragging || e.pointerType !== 'mouse') return;
  var r = card.getBoundingClientRect();
  if (e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom){
    om = clamp(om + e.movementX * 0.0016, -1.6, 1.6);
  }
});
new IntersectionObserver(function(es){ stageVisible = es[0].isIntersecting; }, { threshold: 0 }).observe(stage);

function cardFrame(now, dt){
  if (!stageVisible || dt <= 0) return;
  if (reduce){ th = 0; om = 0; }
  else if (dragging && moved >= 6){
    var nt = th + (thTarget - th) * 0.35;
    om = clamp((nt - th) / dt, -9, 9); th = nt;
  } else if (!dragging){
    om += (-G * Math.sin(th) - C * om + 0.35 * Math.sin(now / 1100)) * dt;
    th += om * dt;
  }
  fa += ((flipped ? 180 : 0) - fa) * (1 - Math.exp(-7 * dt));
  var swing = clamp(om * 7, -16, 16);
  var kk = 1 - Math.exp(-6 * dt);
  var wantY = (!reduce && mouse.has) ? mouse.x * 11 : 0, wantX = (!reduce && mouse.has) ? -mouse.y * 8 : 0;
  tiltY += (wantY - tiltY) * kk; tiltX += (wantX - tiltX) * kk;
  pend.style.transform = 'rotate(' + th.toFixed(4) + 'rad)';
  card.style.transform = 'perspective(1100px) rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + (fa + (flipped ? -swing : swing) + tiltY).toFixed(2) + 'deg)';
  gloss.style.transform = 'translateX(' + (th * 70 + swing * 2 + tiltY * 3).toFixed(1) + '%)';
}

/* ---------- hero: a field of floating 3D code shapes (three.js) ---------- */
var glFrame = null;
(function(){
  if (!window.THREE) return;
  var cv = d.getElementById('gl'), hero = d.getElementById('top'), renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 14);
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  var dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(4, 6, 8); scene.add(dl);
  var field = new THREE.Group(); scene.add(field);

  function isDark(){
    var t = root.getAttribute('data-theme');
    return t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function palette(){
    return isDark() ? { wire: 0x6A78FF, a: 0x3A4CC0, b: 0x7A5BFF, glyph: 0x6A78FF }
                    : { wire: 0xFFFFFF, a: 0x4B5BE8, b: 0xFFFFFF, glyph: 0xFFFFFF };
  }
  var P = palette();
  var wireMats = [], solidA = [], solidB = [], glyphMats = [];

  var geos = [
    new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1.1, 0), new THREE.TorusGeometry(0.8, 0.28, 10, 24),
    new THREE.BoxGeometry(1.3, 1.3, 1.3), new THREE.TetrahedronGeometry(1.2, 0), new THREE.DodecahedronGeometry(1, 0),
    new THREE.TorusKnotGeometry(0.7, 0.22, 64, 10)
  ];
  var items = [];
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function addItem(obj, x, y, z){
    obj.position.set(x, y, z); field.add(obj);
    items.push({ o: obj, y0: y, f: rnd(0.3, 0.8), ph: rnd(0, 6.28), rx: rnd(-0.4, 0.4), ry: rnd(-0.5, 0.5) });
  }
  var i, m, s;
  for (i = 0; i < 22; i++){
    m = new THREE.MeshBasicMaterial({ color: P.wire, wireframe: true, transparent: true, opacity: 0.55 }); wireMats.push(m);
    var w = new THREE.Mesh(geos[i % geos.length], m); s = rnd(0.5, 1.5); w.scale.setScalar(s);
    addItem(w, rnd(-12, 12), rnd(-7, 7), rnd(-12, 3));
  }
  for (i = 0; i < 9; i++){
    m = new THREE.MeshStandardMaterial({ color: i % 2 ? P.b : P.a, roughness: 0.55, flatShading: true });
    (i % 2 ? solidB : solidA).push(m);
    var so = new THREE.Mesh(geos[(i * 3) % geos.length], m); s = rnd(0.35, 0.8); so.scale.setScalar(s);
    addItem(so, rnd(3, 12), rnd(-6, 6), rnd(-9, 0));
  }
  function glyphTex(txt){
    var c = d.createElement('canvas'); c.width = 256; c.height = 128;
    var x = c.getContext('2d'); x.fillStyle = '#fff';
    x.font = '700 70px ui-monospace, Menlo, Consolas, monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(txt, 128, 66);
    return new THREE.CanvasTexture(c);
  }
  var glyphs = ['{ }', '</>', 'C++', 'Java', 'Py', 'JS', '101', '=>', '()', '[]', 'git', 'SQL', 'CSS', 'HTML', ';', '&&'];
  glyphs.forEach(function(g){
    m = new THREE.SpriteMaterial({ map: glyphTex(g), color: P.glyph, transparent: true, opacity: 0.5, depthWrite: false }); glyphMats.push(m);
    var sp = new THREE.Sprite(m); s = rnd(1.1, 2.0); sp.scale.set(2.6 * s, 1.3 * s, 1);
    addItem(sp, rnd(-11, 11), rnd(-6.5, 6.5), rnd(-6, 4));
  });
  function recolor(){
    P = palette();
    wireMats.forEach(function(x){ x.color.set(P.wire); });
    solidA.forEach(function(x){ x.color.set(P.a); });
    solidB.forEach(function(x){ x.color.set(P.b); });
    glyphMats.forEach(function(x){ x.color.set(P.glyph); });
  }
  var mqd = window.matchMedia('(prefers-color-scheme: dark)');
  if (mqd.addEventListener) mqd.addEventListener('change', recolor);

  function resize(){
    var w = hero.clientWidth, h = hero.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (reduce) renderer.render(scene, camera);
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(hero); else window.addEventListener('resize', resize);
  resize();

  var visible = true;
  new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  var cx = 0, cy = 0;
  glFrame = function(now, dt){
    if (reduce || !visible) return;
    var t = now / 1000;
    for (var k = 0; k < items.length; k++){
      var it = items[k];
      if (!it.o.isSprite){ it.o.rotation.x += it.rx * dt; it.o.rotation.y += it.ry * dt; }
      it.o.position.y = it.y0 + Math.sin(t * it.f + it.ph) * 0.45;
    }
    var sp = clamp(window.scrollY / Math.max(1, hero.clientHeight), 0, 1);
    var kk = 1 - Math.exp(-3 * dt);
    cx += ((mouse.has ? mouse.x * 1.8 : Math.sin(t * 0.2) * 1.2) - cx) * kk;
    cy += ((mouse.has ? mouse.y * 1.1 : Math.cos(t * 0.17) * 0.7) - cy) * kk;
    field.rotation.y = sp * 1.2 + Math.sin(t * 0.1) * 0.08;
    camera.position.set(cx, cy, 14 + sp * 7);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };
})();

/* ---------- skills: a globe you can spin ---------- */
var globeFrame = null;
(function(){
  var globe = d.getElementById('globe'), gcv = d.getElementById('gcv'), ctx = gcv.getContext('2d');
  if (!ctx) return;
  function fib(n, i){ var y = 1 - (i + 0.5) * 2 / n, r = Math.sqrt(1 - y * y), a = i * 2.399963; return [Math.cos(a) * r, y, Math.sin(a) * r]; }
  var tags = SKILLS.map(function(name, i){
    var el = d.createElement('span'); el.className = 'tag3d'; el.textContent = name; globe.appendChild(el);
    el.addEventListener('pointerenter', function(){ hoverTag = true; });
    el.addEventListener('pointerleave', function(){ hoverTag = false; });
    return { el: el, p: fib(SKILLS.length, i) };
  });
  var dots = []; for (var i = 0; i < 110; i++) dots.push(fib(110, i));
  var ry = 0.5, rx = -0.3, vel = 0, drag = false, lx = 0, ly = 0, hoverTag = false, vis = true;
  var W = 0, R = 0, dpr = 1, fg = 'rgb(245,247,255)', lastCol = 0;

  function size(){
    W = globe.clientWidth; dpr = Math.min(window.devicePixelRatio || 1, 2);
    gcv.width = gcv.height = Math.round(W * dpr); R = W * 0.36;
  }
  window.addEventListener('resize', size); size();
  new IntersectionObserver(function(es){ vis = es[0].isIntersecting; }, { threshold: 0 }).observe(globe);

  globe.addEventListener('pointerdown', function(e){ drag = true; lx = e.clientX; ly = e.clientY; try { globe.setPointerCapture(e.pointerId); } catch (x) {} });
  globe.addEventListener('pointermove', function(e){
    if (!drag) return;
    var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    ry += dx * 0.01; rx = clamp(rx + dy * 0.008, -0.9, 0.9); vel = clamp(dx * 0.6, -6, 6);
  });
  var stop = function(){ drag = false; };
  globe.addEventListener('pointerup', stop); globe.addEventListener('pointercancel', stop);

  function rot(p){
    var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    var x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy, y = p[1];
    return [x, y * cx - z * sx, y * sx + z * cx];
  }
  function ring(pts){
    ctx.beginPath();
    for (var k = 0; k < pts.length; k++){
      var q = rot(pts[k]), s = 1 + q[2] * 0.14;
      var px = (W / 2 + q[0] * R * s) * dpr, py = (W / 2 + q[1] * R * s) * dpr;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  globeFrame = function(now, dt){
    if (!vis) return;
    if (now - lastCol > 600){ fg = getComputedStyle(globe).color; lastCol = now; }
    if (!drag){
      vel *= Math.exp(-2.2 * dt);
      ry += (vel + ((reduce || hoverTag) ? 0 : 0.28)) * dt;
    }
    ctx.clearRect(0, 0, gcv.width, gcv.height);
    ctx.strokeStyle = fg; ctx.fillStyle = fg; ctx.lineWidth = 1.2 * dpr; ctx.globalAlpha = 0.28;
    var a, b, pts;
    for (a = -60; a <= 60; a += 30){
      var la = a * Math.PI / 180; pts = [];
      for (b = 0; b <= 48; b++){ var t = b / 48 * Math.PI * 2; pts.push([Math.cos(la) * Math.cos(t), Math.sin(la), Math.cos(la) * Math.sin(t)]); }
      ring(pts);
    }
    for (a = 0; a < 6; a++){
      var lo = a * Math.PI / 6; pts = [];
      for (b = 0; b <= 48; b++){ var u = b / 48 * Math.PI * 2; pts.push([Math.cos(u) * Math.cos(lo), Math.sin(u), Math.cos(u) * Math.sin(lo)]); }
      ring(pts);
    }
    for (var k = 0; k < dots.length; k++){
      var q = rot(dots[k]);
      ctx.globalAlpha = 0.15 + 0.5 * (q[2] + 1) / 2;
      ctx.beginPath();
      ctx.arc((W / 2 + q[0] * R) * dpr, (W / 2 + q[1] * R) * dpr, (1.2 + q[2] * 0.8) * dpr, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (k = 0; k < tags.length; k++){
      var r = rot(tags[k].p), sc = 1 + r[2] * 0.22;
      var el = tags[k].el;
      el.style.transform = 'translate(-50%,-50%) translate(' + (r[0] * R * 1.04).toFixed(1) + 'px,' + (r[1] * R * 1.04).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
      el.style.opacity = (0.4 + 0.6 * (r[2] + 1) / 2).toFixed(2);
      el.style.zIndex = String(100 + Math.round(r[2] * 50));
    }
  };
})();

/* ---------- one animation loop for the hero card, the field and the globe ---------- */
var last = performance.now();
function frame(now){
  var dt = Math.min(0.033, (now - last) / 1000); last = now;
  cardFrame(now, dt);
  if (glFrame) glFrame(now, dt);
  if (globeFrame) globeFrame(now, dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- about: words light up while the section is pinned ---------- */
(function(){
  var story = d.getElementById('about'), rv = d.getElementById('reveal');
  if (reduce) return;
  var words = rv.textContent.trim().split(/\s+/);
  rv.textContent = '';
  words.forEach(function(w, i){
    var s = d.createElement('span'); s.textContent = w; rv.appendChild(s);
    if (i < words.length - 1) rv.appendChild(d.createTextNode(' '));
  });
  body.classList.add('js-reveal');
  var spans = rv.querySelectorAll('span'), tick = false;
  function update(){
    tick = false;
    var r = story.getBoundingClientRect(), tot = r.height - window.innerHeight;
    var p = tot > 0 ? clamp(-r.top / tot, 0, 1) : 1;
    var n = Math.round(clamp(0.2 + p * 1.05, 0, 1) * spans.length);
    for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('on', i < n);
  }
  window.addEventListener('scroll', function(){ if (!tick){ tick = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ---------- education: marks dials count up when they scroll into view ---------- */
(function(){
  var dials = d.querySelectorAll('.dial');
  if (reduce || !dials.length) return;
  Array.prototype.forEach.call(dials, function(dl){ dl.style.setProperty('--p', 0); dl.querySelector('.num').textContent = '0%'; });
  function run(el){
    var target = +el.getAttribute('data-p'), t0 = performance.now(), dur = 1400;
    (function step(now){
      var k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3), v = target * e;
      el.style.setProperty('--p', v.toFixed(2));
      el.querySelector('.num').textContent = Math.round(v) + '%';
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ io.unobserve(e.target); run(e.target); } });
  }, { threshold: 0.6 });
  Array.prototype.forEach.call(dials, function(dl){ io.observe(dl); });
})();
/* ===== sorting algorithms as generators: each yield is one visible step ===== */
function* bubbleSort(a, st){
  var n = a.length, t;
  for (var i = 0; i < n - 1; i++){
    var swapped = false;
    for (var j = 0; j < n - 1 - i; j++){
      st.cmp++; yield { c: [j, j + 1] };
      if (a[j] > a[j + 1]){ t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; st.sw++; swapped = true; yield { w: [j, j + 1] }; }
    }
    if (!swapped) break;
  }
}
function* selectionSort(a, st){
  var n = a.length, t;
  for (var i = 0; i < n - 1; i++){
    var m = i;
    for (var j = i + 1; j < n; j++){ st.cmp++; yield { c: [m, j] }; if (a[j] < a[m]) m = j; }
    if (m !== i){ t = a[i]; a[i] = a[m]; a[m] = t; st.sw++; yield { w: [i, m] }; }
  }
}
function* insertionSort(a, st){
  for (var i = 1; i < a.length; i++){
    var key = a[i], j = i - 1;
    while (j >= 0){
      st.cmp++; yield { c: [j, j + 1] };
      if (a[j] > key){ a[j + 1] = a[j]; st.sw++; yield { w: [j + 1] }; j--; } else break;
    }
    a[j + 1] = key; st.sw++; yield { w: [j + 1] };
  }
}
function* mergeRec(a, tmp, l, r, st){
  if (l >= r) return;
  var m = (l + r) >> 1;
  yield* mergeRec(a, tmp, l, m, st);
  yield* mergeRec(a, tmp, m + 1, r, st);
  var i = l, j = m + 1, k = l;
  while (i <= m && j <= r){ st.cmp++; yield { c: [i, j] }; if (a[i] <= a[j]) tmp[k++] = a[i++]; else tmp[k++] = a[j++]; }
  while (i <= m) tmp[k++] = a[i++];
  while (j <= r) tmp[k++] = a[j++];
  for (k = l; k <= r; k++){ a[k] = tmp[k]; st.sw++; yield { w: [k] }; }
}
function* mergeSort(a, st){ yield* mergeRec(a, a.slice(), 0, a.length - 1, st); }
function* quickRec(a, lo, hi, st){
  if (lo >= hi) return;
  var p = a[hi], i = lo, t;
  for (var j = lo; j < hi; j++){
    st.cmp++; yield { c: [j, hi] };
    if (a[j] < p){ t = a[i]; a[i] = a[j]; a[j] = t; if (i !== j){ st.sw++; yield { w: [i, j] }; } i++; }
  }
  t = a[i]; a[i] = a[hi]; a[hi] = t;
  if (i !== hi){ st.sw++; yield { w: [i, hi] }; }
  yield* quickRec(a, lo, i - 1, st);
  yield* quickRec(a, i + 1, hi, st);
}
function* quickSort(a, st){ yield* quickRec(a, 0, a.length - 1, st); }

/* ===== path search on a grid: returns the order cells were checked and the final path ===== */
function findPath(kind, walls, R, Cn, s, e){
  var N = R * Cn, prev = new Int32Array(N).fill(-1), seen = new Uint8Array(N), g = new Float64Array(N).fill(Infinity);
  var order = [], dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], open = [s], found = false;
  var er = (e / Cn) | 0, ec = e % Cn;
  function h(i){ return Math.abs(((i / Cn) | 0) - er) + Math.abs((i % Cn) - ec); }
  g[s] = 0; seen[s] = 1;
  while (open.length){
    var bi = 0;
    if (kind === 'astar'){
      var bf = Infinity;
      for (var k = 0; k < open.length; k++){
        var f = g[open[k]] + h(open[k]);
        if (f < bf || (f === bf && h(open[k]) < h(open[bi]))){ bf = f; bi = k; }
      }
    } else if (kind === 'dfs'){ bi = open.length - 1; }
    var cur = open.splice(bi, 1)[0];
    order.push(cur);
    if (cur === e){ found = true; break; }
    var r = (cur / Cn) | 0, c = cur % Cn;
    for (var d = 0; d < 4; d++){
      var nr = r + dirs[d][0], nc = c + dirs[d][1];
      if (nr < 0 || nc < 0 || nr >= R || nc >= Cn) continue;
      var ni = nr * Cn + nc;
      if (walls[ni]) continue;
      var ng = g[cur] + 1;
      if (kind === 'astar'){
        if (ng < g[ni]){ g[ni] = ng; prev[ni] = cur; if (open.indexOf(ni) < 0) open.push(ni); seen[ni] = 1; }
      } else if (!seen[ni]){ seen[ni] = 1; prev[ni] = cur; g[ni] = ng; open.push(ni); }
    }
  }
  var path = [];
  if (found){ for (var x = e; x !== -1; x = prev[x]) path.push(x); path.reverse(); }
  return { order: order, path: path, found: found };
}

/* ---------- live project demos, opened in a dialog ---------- */
function el(tag, cls, text){
  var n = d.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

/* 1. Algorithm Visualizer */
function buildSort(box){
  box.innerHTML =
    '<div class="dctl">' +
    '<label>Algorithm<select class="dsel" data-r="alg"><option value="bubble">Bubble sort</option><option value="selection">Selection sort</option><option value="insertion">Insertion sort</option><option value="merge">Merge sort</option><option value="quick">Quick sort</option></select></label>' +
    '<label>Bars<input type="range" min="10" max="80" value="40" data-r="n"></label>' +
    '<label>Speed<input type="range" min="1" max="100" value="65" data-r="sp"></label>' +
    '<button type="button" class="dbtn" data-r="go">Sort</button>' +
    '<button type="button" class="dbtn alt" data-r="new">New array</button>' +
    '</div>' +
    '<canvas class="dcv" data-r="cv" aria-label="Bars being sorted"></canvas>' +
    '<div class="dstats"><span>Comparisons <b data-r="c">0</b></span><span>Writes <b data-r="w">0</b></span><span data-r="info"></span></div>' +
    '<p class="dnote">White bars are waiting, yellow bars are being compared, orange bars were just written, green bars are done. Run two algorithms on the same array to compare their counts.</p>';
  function q(k){ return box.querySelector('[data-r="' + k + '"]'); }
  var cv = q('cv'), ctx = cv.getContext('2d'), alg = q('alg'), nIn = q('n'), spIn = q('sp'), go = q('go');
  var GENS = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort, merge: mergeSort, quick: quickSort };
  var INFO = { bubble: 'Time O(n²), space O(1)', selection: 'Time O(n²), space O(1)', insertion: 'Time O(n²), best case O(n)', merge: 'Time O(n log n), space O(n)', quick: 'Time O(n log n) on average, O(n²) worst case' };
  var orig = [], arr = [], hl = { c: [], w: [] }, gen = null, st = { cmp: 0, sw: 0 }, sweep = -1, alive = true, raf = 0, acc = 0, lastT = 0;

  function stats(){ q('c').textContent = st.cmp; q('w').textContent = st.sw; q('info').textContent = INFO[alg.value]; }
  function draw(){
    var W = cv.width, H = cv.height, n = arr.length;
    ctx.clearRect(0, 0, W, H);
    var bw = W / n, gap = Math.max(1, bw * 0.14);
    for (var i = 0; i < n; i++){
      var h = arr[i] / 100 * (H - 6);
      ctx.fillStyle = i < sweep ? '#5EE6B0' : hl.w.indexOf(i) >= 0 ? '#FF6B2C' : hl.c.indexOf(i) >= 0 ? '#F0DE2E' : '#F5F7FF';
      ctx.fillRect(i * bw + gap / 2, H - h, bw - gap, h);
    }
  }
  function reset(){ gen = null; hl = { c: [], w: [] }; st.cmp = 0; st.sw = 0; sweep = -1; go.textContent = 'Sort'; stats(); draw(); }
  function newArray(){
    var n = +nIn.value; orig = [];
    for (var i = 0; i < n; i++) orig.push(5 + Math.floor(Math.random() * 95));
    arr = orig.slice(); reset();
  }
  function fit(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); draw();
  }
  function loop(t){
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    var dt = Math.min(100, t - (lastT || t)); lastT = t;
    if (gen){
      var sp = +spIn.value, ms = Math.max(0.5, 260 * Math.pow(1 - sp / 100, 2.2)), guard = 0;
      acc += dt;
      while (acc >= ms && guard < 400 && gen){
        acc -= ms; guard++;
        var r = gen.next();
        if (r.done){ gen = null; hl = { c: [], w: [] }; sweep = 0; go.textContent = 'Sort'; break; }
        hl = { c: r.value.c || [], w: r.value.w || [] };
      }
      stats(); draw();
    } else if (sweep >= 0 && sweep < arr.length){
      sweep += Math.max(1, Math.ceil(arr.length / 45)); draw();
    }
  }
  go.addEventListener('click', function(){
    if (gen){ gen = null; go.textContent = 'Sort'; return; }
    arr = orig.slice(); st.cmp = 0; st.sw = 0; sweep = -1; hl = { c: [], w: [] };
    gen = GENS[alg.value](arr, st); go.textContent = 'Stop'; acc = 0;
  });
  q('new').addEventListener('click', newArray);
  nIn.addEventListener('input', newArray);
  alg.addEventListener('change', function(){ arr = orig.slice(); reset(); });
  return {
    start: function(){ fit(); newArray(); raf = requestAnimationFrame(loop); },
    stop: function(){ alive = false; cancelAnimationFrame(raf); },
    resize: fit
  };
}

/* 2. Path Finder */
function buildPath(box){
  box.innerHTML =
    '<div class="dctl">' +
    '<label>Algorithm<select class="dsel" data-r="alg"><option value="bfs">Breadth-first search (BFS)</option><option value="astar">A* search</option><option value="dfs">Depth-first search (DFS)</option></select></label>' +
    '<button type="button" class="dbtn" data-r="go">Find path</button>' +
    '<button type="button" class="dbtn alt" data-r="cp">Clear path</button>' +
    '<button type="button" class="dbtn alt" data-r="rm">Random maze</button>' +
    '<button type="button" class="dbtn alt" data-r="cw">Clear walls</button>' +
    '</div>' +
    '<canvas class="dcv free" data-r="cv" aria-label="Grid for path finding. Click and drag to draw walls."></canvas>' +
    '<div class="dstats"><span>Cells checked <b data-r="v">0</b></span><span>Path length <b data-r="p">-</b></span><span data-r="msg"></span></div>' +
    '<p class="dnote">Click and drag on the grid to draw walls. The green dot is the start and the orange dot is the goal. BFS and A* always find the shortest path. DFS finds a path, but usually not the shortest one.</p>';
  function q(k){ return box.querySelector('[data-r="' + k + '"]'); }
  var cv = q('cv'), ctx = cv.getContext('2d'), alg = q('alg');
  var small = window.innerWidth < 640, cols = small ? 18 : 32, rows = small ? 14 : 16;
  var walls = new Uint8Array(cols * rows), vis = new Uint8Array(cols * rows), pth = new Uint8Array(cols * rows);
  var s = (rows >> 1) * cols + 2, goal = (rows >> 1) * cols + cols - 3;
  var anim = null, drawing = false, paint = 1, alive = true, raf = 0;

  function fit(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth;
    if (!w) return;
    var cs = w / cols; cv.style.height = (cs * rows) + 'px';
    cv.width = Math.round(w * dpr); cv.height = Math.round(cs * rows * dpr); draw();
  }
  function draw(){
    var cs = cv.width / cols, i, x, y;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (i = 0; i < walls.length; i++){
      x = (i % cols) * cs; y = ((i / cols) | 0) * cs;
      ctx.fillStyle = walls[i] ? '#F5F7FF' : pth[i] ? '#F0DE2E' : vis[i] ? '#4B5BE8' : 'rgba(255,255,255,0.07)';
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
    }
    [[s, '#5EE6B0'], [goal, '#FF6B2C']].forEach(function(p){
      ctx.fillStyle = p[1]; ctx.beginPath();
      ctx.arc((p[0] % cols + 0.5) * cs, (((p[0] / cols) | 0) + 0.5) * cs, cs * 0.36, 0, 6.2832); ctx.fill();
    });
  }
  function clearRes(){ vis.fill(0); pth.fill(0); anim = null; q('v').textContent = '0'; q('p').textContent = '-'; q('msg').textContent = ''; }
  function cellAt(ev){
    var r = cv.getBoundingClientRect();
    var c = Math.floor((ev.clientX - r.left) / r.width * cols), rr = Math.floor((ev.clientY - r.top) / r.height * rows);
    return (c < 0 || rr < 0 || c >= cols || rr >= rows) ? -1 : rr * cols + c;
  }
  cv.addEventListener('pointerdown', function(ev){
    if (anim) return;
    var i = cellAt(ev); if (i < 0 || i === s || i === goal) return;
    drawing = true; paint = walls[i] ? 0 : 1; walls[i] = paint; clearRes(); draw();
    try { cv.setPointerCapture(ev.pointerId); } catch (x) {}
  });
  cv.addEventListener('pointermove', function(ev){
    if (!drawing) return;
    var i = cellAt(ev); if (i < 0 || i === s || i === goal || walls[i] === paint) return;
    walls[i] = paint; draw();
  });
  var stopDraw = function(){ drawing = false; };
  cv.addEventListener('pointerup', stopDraw); cv.addEventListener('pointercancel', stopDraw);

  q('go').addEventListener('click', function(){
    if (anim) return;
    clearRes();
    var res = findPath(alg.value, walls, rows, cols, s, goal);
    anim = { order: res.order, path: res.path, found: res.found, i: 0, j: 0, phase: 0 };
  });
  q('cp').addEventListener('click', function(){ clearRes(); draw(); });
  q('cw').addEventListener('click', function(){ walls.fill(0); clearRes(); draw(); });
  q('rm').addEventListener('click', function(){
    clearRes();
    for (var i = 0; i < walls.length; i++) walls[i] = (i !== s && i !== goal && Math.random() < 0.3) ? 1 : 0;
    draw();
  });
  function loop(){
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (!anim) return;
    var k;
    if (anim.phase === 0){
      var per = Math.max(1, Math.ceil(anim.order.length / 160));
      for (k = 0; k < per && anim.i < anim.order.length; k++) vis[anim.order[anim.i++]] = 1;
      q('v').textContent = anim.i;
      if (anim.i >= anim.order.length) anim.phase = 1;
    } else {
      for (k = 0; k < 2 && anim.j < anim.path.length; k++) pth[anim.path[anim.j++]] = 1;
      if (anim.j >= anim.path.length){
        if (anim.found){ q('p').textContent = (anim.path.length - 1) + ' steps'; q('msg').textContent = 'Path found.'; }
        else { q('msg').textContent = 'No path found. Try removing some walls.'; }
        anim = null;
      }
    }
    draw();
  }
  return {
    start: function(){ fit(); raf = requestAnimationFrame(loop); },
    stop: function(){ alive = false; cancelAnimationFrame(raf); },
    resize: fit
  };
}

/* 3. Expense Tracker */
function buildExp(box){
  var CATS = ['Food', 'Travel', 'Study', 'Shopping', 'Bills', 'Other'];
  var COL = ['#F0DE2E', '#4B5BE8', '#5EE6B0', '#FF6B2C', '#B58CFF', '#9AA3D6'];
  var KEY = 'vk-expense-tracker-v1', items = [];
  try {
    var saved = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) items = saved.filter(function(x){ return x && typeof x.amt === 'number' && (x.type === 'exp' || x.type === 'inc'); });
  } catch (e) { items = []; }
  function save(){ try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }
  function fmt(n){ return '\u20B9' + Math.round(n).toLocaleString('en-IN'); }

  var opts = CATS.map(function(c){ return '<option>' + c + '</option>'; }).join('');
  box.innerHTML =
    '<div class="sumrow"><div class="sum"><span>Balance</span><b data-r="bal">0</b></div><div class="sum"><span>Income</span><b data-r="inc">0</b></div><div class="sum"><span>Spent</span><b data-r="exp">0</b></div></div>' +
    '<div class="dctl">' +
    '<label>Type<select class="dsel" data-r="type"><option value="exp">Expense</option><option value="inc">Income</option></select></label>' +
    '<label>Description<input class="dinp" data-r="desc" maxlength="40" placeholder="Lunch, books..."></label>' +
    '<label>Amount (\u20B9)<input class="dinp" data-r="amt" type="number" min="1" step="1" inputmode="numeric" placeholder="250"></label>' +
    '<label>Category<select class="dsel" data-r="cat">' + opts + '</select></label>' +
    '<button type="button" class="dbtn" data-r="add">Add</button>' +
    '</div>' +
    '<div class="expgrid">' +
    '<div><canvas class="dcv sq" data-r="cv" aria-label="Doughnut chart of spending by category"></canvas><ul class="legend" data-r="leg"></ul></div>' +
    '<div><ul class="elist" data-r="list"></ul>' +
    '<div class="dctl"><button type="button" class="dbtn alt" data-r="sample">Load sample data</button><button type="button" class="dbtn alt" data-r="clear">Clear all</button></div></div>' +
    '</div>' +
    '<p class="dnote">Your entries are saved in this browser only, using localStorage. Nothing is sent anywhere.</p>';
  function q(k){ return box.querySelector('[data-r="' + k + '"]'); }
  var cv = q('cv'), ctx = cv.getContext('2d'), typeSel = q('type'), catSel = q('cat'), descIn = q('desc'), amtIn = q('amt');

  function chart(spent, totals){
    var W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.44, r = R * 0.6, mid = (R + r) / 2;
    ctx.clearRect(0, 0, W, H); ctx.lineWidth = R - r;
    if (!spent){
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(cx, cy, mid, 0, 6.2832); ctx.stroke();
    } else {
      var a0 = -Math.PI / 2;
      totals.forEach(function(t, i){
        if (!t) return;
        var a1 = a0 + t / spent * 6.2832;
        ctx.strokeStyle = COL[i]; ctx.beginPath(); ctx.arc(cx, cy, mid, a0, a1); ctx.stroke(); a0 = a1;
      });
    }
    ctx.fillStyle = '#F5F7FF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '800 ' + Math.round(W * 0.085) + 'px Syne, system-ui, sans-serif';
    ctx.fillText(spent ? fmt(spent) : 'No spending', cx, cy - W * 0.02);
    ctx.font = '500 ' + Math.round(W * 0.05) + 'px Instrument Sans, system-ui, sans-serif';
    ctx.fillText(spent ? 'spent' : 'yet', cx, cy + W * 0.07);
  }
  function render(){
    var inc = 0, spent = 0, totals = CATS.map(function(){ return 0; });
    items.forEach(function(x){
      if (x.type === 'inc') inc += x.amt;
      else { spent += x.amt; var ci = CATS.indexOf(x.cat); totals[ci < 0 ? CATS.length - 1 : ci] += x.amt; }
    });
    q('bal').textContent = (inc - spent < 0 ? '-' : '') + fmt(Math.abs(inc - spent));
    q('inc').textContent = fmt(inc); q('exp').textContent = fmt(spent);
    chart(spent, totals);
    var leg = q('leg'); leg.innerHTML = '';
    totals.forEach(function(t, i){
      if (!t) return;
      var li = el('li'), sw = el('i'); sw.style.background = COL[i];
      li.appendChild(sw); li.appendChild(el('span', '', CATS[i])); li.appendChild(el('b', '', fmt(t))); leg.appendChild(li);
    });
    var list = q('list'); list.innerHTML = '';
    if (!items.length){ list.appendChild(el('li', 'empty', 'Nothing here yet. Add an entry or load the sample data.')); return; }
    items.slice().reverse().forEach(function(x){
      var li = el('li'), main = el('div', 'em');
      main.appendChild(el('b', '', x.desc)); main.appendChild(el('small', '', x.type === 'inc' ? 'Income' : x.cat));
      var amt = el('span', 'amt ' + x.type, (x.type === 'inc' ? '+' : '-') + fmt(x.amt));
      var del = el('button', 'x', '\u00D7'); del.type = 'button'; del.setAttribute('aria-label', 'Delete ' + x.desc); del.setAttribute('data-id', String(x.id));
      li.appendChild(main); li.appendChild(amt); li.appendChild(del); list.appendChild(li);
    });
  }
  function add(){
    var amt = parseFloat(amtIn.value);
    if (!(amt > 0)){ amtIn.focus(); return; }
    var inc = typeSel.value === 'inc';
    items.push({ id: Date.now() + Math.floor(Math.random() * 1000), type: typeSel.value, desc: descIn.value.trim() || (inc ? 'Income' : catSel.value), amt: amt, cat: inc ? 'Income' : catSel.value });
    save(); descIn.value = ''; amtIn.value = ''; render(); descIn.focus();
  }
  q('add').addEventListener('click', add);
  [descIn, amtIn].forEach(function(i){ i.addEventListener('keydown', function(ev){ if (ev.key === 'Enter'){ ev.preventDefault(); add(); } }); });
  typeSel.addEventListener('change', function(){ catSel.disabled = typeSel.value === 'inc'; });
  q('list').addEventListener('click', function(ev){
    var b = ev.target.closest ? ev.target.closest('button[data-id]') : null;
    if (!b) return;
    var id = +b.getAttribute('data-id');
    items = items.filter(function(x){ return x.id !== id; }); save(); render();
  });
  q('sample').addEventListener('click', function(){
    var t = Date.now();
    items = [
      { type: 'inc', desc: 'Pocket money', amt: 8000, cat: 'Income' }, { type: 'exp', desc: 'Canteen lunch', amt: 1200, cat: 'Food' },
      { type: 'exp', desc: 'Train tickets', amt: 650, cat: 'Travel' }, { type: 'exp', desc: 'Programming books', amt: 900, cat: 'Study' },
      { type: 'exp', desc: 'New headphones', amt: 1500, cat: 'Shopping' }, { type: 'exp', desc: 'Mobile recharge', amt: 499, cat: 'Bills' }
    ].map(function(x, i){ x.id = t + i; return x; });
    save(); render();
  });
  q('clear').addEventListener('click', function(){ items = []; save(); render(); });

  function fit(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth;
    if (!w) return;
    cv.width = cv.height = Math.round(w * dpr); render();
  }
  return { start: fit, stop: function(){}, resize: fit };
}

/* dialog that hosts the demos */
var dlg = d.getElementById('demo'), dbody = d.getElementById('demoBody'), dtitle = d.getElementById('demoTitle'), inst = null;
var DEMOS = {
  sort: { title: 'Algorithm Visualizer', build: buildSort },
  path: { title: 'Path Finder', build: buildPath },
  exp:  { title: 'Expense Tracker', build: buildExp }
};
function closeDemo(){
  if (inst && inst.stop) inst.stop();
  inst = null; body.classList.remove('lock');
}
function openDemo(key){
  var cfg = DEMOS[key]; if (!cfg) return;
  dtitle.textContent = cfg.title; dbody.innerHTML = '';
  inst = cfg.build(dbody);
  body.classList.add('lock');
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  if (inst && inst.start) inst.start();
}
dlg.addEventListener('close', closeDemo);
d.getElementById('demoClose').addEventListener('click', function(){
  if (dlg.close) dlg.close(); else { dlg.removeAttribute('open'); closeDemo(); }
});
dlg.addEventListener('click', function(ev){ if (ev.target === dlg && dlg.close) dlg.close(); });
window.addEventListener('resize', function(){ if (inst && inst.resize) inst.resize(); });
Array.prototype.forEach.call(d.querySelectorAll('[data-demo]'), function(b){
  b.addEventListener('click', function(){ openDemo(b.getAttribute('data-demo')); });
});

})();
