const canvas = document.getElementById("rain");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let mouseX = 0;
let mouseY = 0;
let parallaxX = 0;
let parallaxY = 0;
const parallaxStrength = 0.04;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX - width / 2;
  mouseY = e.clientY - height / 2;
});

const starLayers = [
  { count: 300, speed: 0.015, radius: 0.3, alphaRange: [0.1, 0.7], parallaxFactor: 0.6 },
  { count: 200, speed: 0.008, radius: 0.5, alphaRange: [0.2, 0.8], parallaxFactor: 0.4 },
  { count: 100, speed: 0.004, radius: 0.7, alphaRange: [0.3, 1], parallaxFactor: 0.2 },
];
const stars = [];
starLayers.forEach((layer) => {
  for (let i = 0; i < layer.count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * layer.radius + 0.2,
      alpha: Math.random() * (layer.alphaRange[1] - layer.alphaRange[0]) + layer.alphaRange[0],
      delta: Math.random() * 0.01 + 0.002,
      speed: layer.speed,
      colorShift: Math.random() * 0.05,
      parallaxFactor: layer.parallaxFactor,
    });
  }
});

const drops = [];
const DROP_COUNT = 200;
const ANGLE = (10 * Math.PI) / 180;
function initDrops() {
  drops.length = 0;
  for (let i = 0; i < DROP_COUNT; i++) {
    drops.push({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 20 + 8,
      speed: Math.random() * 2 + 0.6,
      opacity: Math.random() * 0.4 + 0.25,
      width: Math.random() * 1 + 0.5,
    });
  }
}
initDrops();
window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  initDrops();
});

const galaxies = [
  ["#0b0b14", "#12002a", "#00020f", "#000000"],
  ["#1a001f", "#001f33", "#000022", "#000000"],
  ["#000011", "#220044", "#003322", "#000000"],
  ["#11001a", "#331100", "#001133", "#000000"],
];

let currentGalaxy = 0;
let nextGalaxy = 1;
let transitionStart = performance.now();
const transitionDuration = 4000;
const delayBetween = 10000;

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const bigint = parseInt(hex, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}
function lerpColorHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return [
    Math.round(lerp(ca[0], cb[0], t)),
    Math.round(lerp(ca[1], cb[1], t)),
    Math.round(lerp(ca[2], cb[2], t)),
  ];
}
function rgbString(arr) {
  return `rgb(${arr[0]},${arr[1]},${arr[2]})`;
}

function draw(timestamp) {
  parallaxX += (mouseX * parallaxStrength - parallaxX) * 0.07;
  parallaxY += (mouseY * parallaxStrength - parallaxY) * 0.07;

  const elapsed = timestamp - transitionStart;
  let t = 0;
  if (elapsed > delayBetween) t = Math.min((elapsed - delayBetween) / transitionDuration, 1);

  const nebula = ctx.createRadialGradient(
    width / 2 + parallaxX * 0.5,
    height / 2 + parallaxY * 0.5,
    0,
    width / 2,
    height / 2,
    width
  );
  for (let i = 0; i < 4; i++) {
    const c = lerpColorHex(galaxies[currentGalaxy][i], galaxies[nextGalaxy][i], t);
    nebula.addColorStop(i === 0 ? 0 : i === 1 ? 0.3 : i === 2 ? 0.6 : 1, rgbString(c));
  }
  ctx.fillStyle = nebula;
  ctx.globalAlpha = 0.45 + 0.05 * Math.sin(timestamp / 3000);
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  for (let s of stars) {
    s.alpha += s.delta;
    if (s.alpha <= 0.1 || s.alpha >= 1) s.delta *= -1;
    s.x += s.speed;
    if (s.x > width) s.x = 0;

    const color = 255 - Math.floor(s.colorShift * 200);
    ctx.beginPath();
    ctx.arc(s.x + parallaxX * s.parallaxFactor, s.y + parallaxY * s.parallaxFactor, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color},${color},255,${s.alpha})`;
    ctx.fill();
  }

  for (let d of drops) {
    const dx = d.length * Math.sin(ANGLE);
    const dy = d.length * Math.cos(ANGLE);
    const grad = ctx.createLinearGradient(
      d.x + parallaxX * 0.2,
      d.y + parallaxY * 0.2,
      d.x + dx + parallaxX * 0.2,
      d.y + dy + parallaxY * 0.2
    );
    grad.addColorStop(0, `rgba(0,255,204,${d.opacity})`);
    grad.addColorStop(1, `rgba(0,255,204,0)`);
    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.lineWidth = d.width;
    ctx.moveTo(d.x + parallaxX * 0.2, d.y + parallaxY * 0.2);
    ctx.lineTo(d.x + dx + parallaxX * 0.2, d.y + dy + parallaxY * 0.2);
    ctx.stroke();

    d.x += Math.sin(ANGLE) * d.speed;
    d.y += Math.cos(ANGLE) * d.speed;
    if (d.y > height + 30 || d.x > width + 50) {
      d.y = -d.length - Math.random() * 100;
      d.x = Math.random() * width;
      d.length = Math.random() * 20 + 8;
      d.speed = Math.random() * 2 + 0.6;
      d.opacity = Math.random() * 0.4 + 0.25;
      d.width = Math.random() * 1 + 0.5;
    }
  }

  if (t === 1) {
    currentGalaxy = nextGalaxy;
    nextGalaxy = (nextGalaxy + 1) % galaxies.length;
    transitionStart = timestamp;
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
