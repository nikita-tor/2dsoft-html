// -------------------------------------------------------------
// Canvas Rendering & Visualizations
// -------------------------------------------------------------
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

function mapX(x) { return (x + L/2) / L * canvas.width; }
function mapY(y) { return (y + L/2) / L * canvas.height; }

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const showDensity = document.getElementById('chk-density').checked;
    const showParticles = document.getElementById('chk-particles').checked;
    const showTrails = document.getElementById('chk-trails').checked;
    const showPotential = document.getElementById('chk-potential').checked;

    if (activeView === 'combined' || activeView === 'trails') {
        if (showDensity) renderDensityHeatmap();
    } else if (activeView === 'vq') {
        renderVqHeatmap();
    } else if (activeView === 'histogram') {
        renderScatteringHistogram();
        return;
    }

    if (showPotential && activeView !== 'vq') {
        renderPotentialOverlay();
    }

    if (showTrails) {
        ctx.lineWidth = 1.5;
        for (let p = 0; p < trails.length; p++) {
            let tr = trails[p];
            if (tr.length < 2) continue;

            ctx.beginPath();
            ctx.moveTo(mapX(tr[0].x), mapY(tr[0].y));
            for (let k = 1; k < tr.length; k++) {
                ctx.lineTo(mapX(tr[k].x), mapY(tr[k].y));
            }
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.stroke();
        }
    }

    if (showParticles) {
        for (let p = 0; p < particles.length; p++) {
            let pt = particles[p];
            let cx = mapX(pt.x);
            let cy = mapY(pt.y);

            ctx.beginPath();
            ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = pt.x > 150 ? '#10b981' : '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// Offscreen canvas reused by renderHeatmap (module-level singleton)
const _offCanvas = (() => {
    let c = document.createElement('canvas');
    c.width = N_GRID;
    c.height = N_GRID;
    return c;
})();

let offCtx = _offCanvas.getContext('2d');

function renderHeatmap(valueFn) {
    let imgData = ctx.createImageData(N_GRID, N_GRID);
    let data = imgData.data;

    for (let j = 0; j < N_GRID; j++) {
        for (let i = 0; i < N_GRID; i++) {
            let idx = j * N_GRID + i;
            let pxIdx = ((N_GRID - 1 - j) * N_GRID + i) * 4;
            let color = valueFn(idx);
            data[pxIdx + 0] = color.r;
            data[pxIdx + 1] = color.g;
            data[pxIdx + 2] = color.b;
            data[pxIdx + 3] = color.a;
        }
    }

    offCtx.putImageData(imgData, 0, 0);
    ctx.drawImage(_offCanvas, 0, 0, canvas.width, canvas.height);
}

function renderDensityHeatmap() {
    let rhoFn = (idx) => {
        let rho = (rePsi[idx]*rePsi[idx] + imPsi[idx]*imPsi[idx]) * 35000;
        return {
            r: Math.min(255, rho * 1.8),
            g: Math.min(255, rho * 0.9),
            b: Math.min(255, rho * 2.8 + 20),
            a: Math.min(240, rho * 300)
        };
    };
    renderHeatmap(rhoFn);
}

function renderVqHeatmap() {
    let vqFn = (idx) => {
        let val = Vq[idx];
        if (val > 0) return {
            r: Math.min(255, val * 4000),
            g: 0,
            b: 50,
            a: Math.min(220, Math.abs(val) * 5000)
        };
        return {
            r: 0,
            g: Math.min(255, -val * 4000),
            b: Math.min(255, -val * 4000),
            a: Math.min(220, Math.abs(val) * 5000)
        };
    };
    renderHeatmap(vqFn);
}

function renderPotentialOverlay() {
    let barrierX = mapX(0);
    let alphaWidth = Math.max(4, (params.alpha / L) * canvas.width);

    if (params.potType === 'doubleslit') {
        // Draw Opaque Barrier Wall with Two Open Slits
        ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
        ctx.fillRect(barrierX - alphaWidth/2, 0, alphaWidth, canvas.height);

        // Clear the Two Slits
        let s1Y = mapY(params.slitSep / 2);
        let s2Y = mapY(-params.slitSep / 2);
        let wPx = (params.slitWidth / L) * canvas.height;

        ctx.clearRect(barrierX - alphaWidth/2 - 2, s1Y - wPx/2, alphaWidth + 4, wPx);
        ctx.clearRect(barrierX - alphaWidth/2 - 2, s2Y - wPx/2, alphaWidth + 4, wPx);

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(barrierX - alphaWidth/2 - 2, s1Y - wPx/2, alphaWidth + 4, wPx);
        ctx.strokeRect(barrierX - alphaWidth/2 - 2, s2Y - wPx/2, alphaWidth + 4, wPx);

        ctx.font = '11px Segoe UI';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.fillText('Slit 1', barrierX + 35, s1Y + 4);
        ctx.fillText('Slit 2', barrierX + 35, s2Y + 4);
    } else {
        let grad = ctx.createLinearGradient(barrierX, 0, barrierX, canvas.height);
        grad.addColorStop(0.0, 'rgba(56, 189, 248, 0.35)');
        grad.addColorStop(0.25, 'rgba(234, 179, 8, 0.4)');
        grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.7)');
        grad.addColorStop(0.75, 'rgba(234, 179, 8, 0.4)');
        grad.addColorStop(1.0, 'rgba(56, 189, 248, 0.35)');

        ctx.fillStyle = grad;
        ctx.fillRect(barrierX - alphaWidth, 0, alphaWidth * 2, canvas.height);
    }
}

function renderScatteringHistogram() {
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let numBins = 50;
    let bins = new Int32Array(numBins);

    let passed = 0;
    for (let p = 0; p < particles.length; p++) {
        let pt = particles[p];
        if (pt.x > 300) {
            passed++;
            let angle = Math.atan2(pt.y, pt.x);
            let bin = Math.floor((angle + Math.PI/2) / Math.PI * numBins);
            if (bin >= 0 && bin < numBins) bins[bin]++;
        }
    }

    let maxBin = 1;
    for (let b = 0; b < numBins; b++) if (bins[b] > maxBin) maxBin = bins[b];

    let barWidth = canvas.width / numBins;
    for (let b = 0; b < numBins; b++) {
        let h = (bins[b] / maxBin) * (canvas.height - 120);
        let x = b * barWidth;
        let y = canvas.height - 60 - h;

        let grad = ctx.createLinearGradient(0, y, 0, canvas.height - 60);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#a855f7');

        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y, barWidth - 2, h);
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 60);
    ctx.lineTo(canvas.width, canvas.height - 60);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Scattering Angle θ (rad)', canvas.width / 2, canvas.height - 20);
    ctx.fillText(`Detector Particle Fringe Histogram (Transmitted Particles: ${passed})`, canvas.width / 2, 40);
}

function updateStats() {
    document.getElementById('stat-time').innerText = currentTime.toFixed(1);

    let normSum = 0;
    for (let k = 0; k < N_GRID * N_GRID; k++) {
        normSum += (rePsi[k]*rePsi[k] + imPsi[k]*imPsi[k]) * dx * dy;
    }
    document.getElementById('stat-norm').innerText = normSum.toFixed(3);

    let refl = 0, trans = 0;
    for (let p = 0; p < particles.length; p++) {
        if (particles[p].x > 150) trans++;
        else if (particles[p].x < -150) refl++;
    }
    let total = particles.length || 1;
    document.getElementById('stat-refl').innerText = Math.round((refl / total) * 100) + '%';
    document.getElementById('stat-trans').innerText = Math.round((trans / total) * 100) + '%';
}

function animLoop() {
    if (isRunning) {
        for (let s = 0; s < params.framesPerFrame; s++) {
            stepSimulation();
        }
        updateStats();
    }

    if(activeView === 'vq') {
        computeQuantumPotential();
    }

    render();
    requestAnimationFrame(animLoop);
}
