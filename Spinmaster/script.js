
let names = [];
let angle = 0;
let spinning = false;
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

function updateWheel() {
  names = document.getElementById("nameList").value.trim().split("\n").filter(n => n.trim() !== "");
  drawWheel(names);
}

function drawWheel(names) {
  const radius = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(radius, radius);

  const segAngle = 2 * Math.PI / names.length;
  const segColor = document.getElementById("segColor").value;
  const textColor = document.getElementById("textColor").value;

  names.forEach((name, i) => {
    ctx.beginPath();
    ctx.fillStyle = i % 2 === 0 ? segColor : shadeColor(segColor, -10);
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, i * segAngle, (i + 1) * segAngle);
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.save();
    ctx.rotate(i * segAngle + segAngle / 2);
    ctx.fillStyle = textColor;
    ctx.textAlign = "right";
    ctx.font = "16px sans-serif";
    ctx.fillText(name, radius - 10, 5);
    ctx.restore();
  });

  ctx.restore();
}

function drawRotatedWheel() {
  const radius = canvas.width / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(angle);
  drawWheel(names);
  ctx.restore();
}

function shadeColor(color, percent) {
  const num = parseInt(color.slice(1), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1);
}

function spinWheel() {
  if (spinning || names.length < 2) return;

  const spins = 5 + Math.random() * 5; // More spins for excitement
  const finalAngle = angle + spins * 2 * Math.PI;
  const spinTime = 4000; // Spin duration (ms)
  const start = performance.now();

  spinning = true;

  function animate(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / spinTime, 1); // Time progress
    const eased = easeOutQuart(t); // Apply easing for smoothness

    angle = angle + (finalAngle - angle) * eased; // Rotate the wheel
    drawRotatedWheel(); // Draw the wheel after each frame

    if (t < 1) {
      requestAnimationFrame(animate); // Continue animating until completed
    } else {
      spinning = false;
      angle = finalAngle; // Lock angle after completion
      const normalized = (2 * Math.PI - (angle % (2 * Math.PI))) % (2 * Math.PI); // Normalize angle
      const winnerIndex = Math.floor((normalized / (2 * Math.PI)) * names.length) % names.length; // Find winner
      const winner = names[winnerIndex];
      document.getElementById('winnerName').textContent = winner;
      addToHistory(winner); // Add winner to history

      if (document.getElementById("removeWinner").checked) {
        names.splice(winnerIndex, 1); // Remove winner from list if needed
        document.getElementById("nameList").value = names.join('\n');
      }

      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } }); // Confetti effect on win
    }
  }

  requestAnimationFrame(animate); // Start the animation loop
}

function easeOutQuart(t) {
  return 1 - (--t) * t * t * t; // Easing function for smoothness
}

function addToHistory(name) {
  const li = document.createElement("li");
  li.textContent = name;
  document.getElementById("winnerHistory").appendChild(li);
}

function shuffleNames() {
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  document.getElementById("nameList").value = names.join("\n");
  drawWheel(names);
}

function sortNames() {
  names.sort();
  document.getElementById("nameList").value = names.join("\n");
  drawWheel(names);
}

function saveNames() {
  const data = document.getElementById("nameList").value;
  localStorage.setItem("wheel-names", data);
  alert("Names saved!");
}

function loadNames() {
  const data = localStorage.getItem("wheel-names");
  if (data) {
    document.getElementById("nameList").value = data;
    updateWheel();
  } else {
    alert("No saved names found!");
  }
}

function exportHistory() {
  const items = document.querySelectorAll("#winnerHistory li");
  const text = Array.from(items).map(li => li.textContent).join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "winner_history.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function resetWheel() {
  names = [];
  angle = 0;
  document.getElementById('nameList').value = '';
  document.getElementById('winnerName').textContent = '?';
  document.getElementById('winnerHistory').innerHTML = '';
  drawWheel([]);
}
