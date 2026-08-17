// -------------------------------------------------------------
// Quantum Physics Simulation Engine
// -------------------------------------------------------------
const N_GRID = 256;
const fftEngine = new FFT2D(N_GRID);

let params = {
    potType: 'doubleslit',
    px0: 0.15,
    sigmax: 80,
    sigmay: 220,
    v0: 0.050,
    alpha: 30,
    slitSep: 160,
    slitWidth: 30,
    omega: 0.0027,
    npart: 600,
    dt: 1.0,
    hbar: 1.0,
    m: 1.0,
    framesPerFrame: 2.0,
};

const L = 1600.0;
const dx = L / N_GRID;
const dy = L / N_GRID;
const dpx = (2 * Math.PI) / L;
const dpy = (2 * Math.PI) / L;

let rePsi = new Float64Array(N_GRID * N_GRID);
let imPsi = new Float64Array(N_GRID * N_GRID);
let V = new Float64Array(N_GRID * N_GRID);
let Vq = new Float64Array(N_GRID * N_GRID);
let kineticPhase = new Float64Array(N_GRID * N_GRID);

let particles = [];
let trails = [];
let isRunning = false;
let currentTime = 0;
let activeView = 'combined';

function initPotential() {
    for (let j = 0; j < N_GRID; j++) {
        let y = -L/2 + j * dy;
        for (let i = 0; i < N_GRID; i++) {
            let x = -L/2 + i * dx;

            if (params.potType === 'doubleslit') {
                // True Double-Slit Wall Potential
                let wallExp = Math.exp(-Math.pow(x / params.alpha, 2));
                let d = params.slitSep;
                let w = params.slitWidth;

                let inSlit1 = Math.abs(y - d/2) < w/2;
                let inSlit2 = Math.abs(y + d/2) < w/2;

                if (inSlit1 || inSlit2) {
                    V[j * N_GRID + i] = 0;
                } else {
                    V[j * N_GRID + i] = params.v0 * wallExp;
                }
            } else {
                // Wyatt Saddle-Point Reaction Potential
                let expTerm = Math.exp(-Math.pow(x / params.alpha, 2));
                let polyTerm = params.v0 - 0.5 * params.m * Math.pow(params.omega, 2) * Math.pow(y, 2);
                V[j * N_GRID + i] = Math.max(0, polyTerm * expTerm);
            }
        }
    }

    for (let j = 0; j < N_GRID; j++) {
        let py = (j < N_GRID/2 ? j : j - N_GRID) * dpy;
        for (let i = 0; i < N_GRID; i++) {
            let px = (i < N_GRID/2 ? i : i - N_GRID) * dpx;
            let p2 = px * px + py * py;
            kineticPhase[j * N_GRID + i] = - (p2 / (2 * params.m * params.hbar)) * params.dt;
        }
    }
}

function resetSimulation() {
    initPotential();
    currentTime = 0;

    let x0 = -450;
    let y0 = 0;

    let normSum = 0;

    for (let j = 0; j < N_GRID; j++) {
        let y = -L/2 + j * dy;
        for (let i = 0; i < N_GRID; i++) {
            let x = -L/2 + i * dx;

            let env = Math.exp(-0.25 * (Math.pow(x - x0, 2) / Math.pow(params.sigmax, 2) + Math.pow(y - y0, 2) / Math.pow(params.sigmay, 2)));
            let phase = params.px0 * (x - x0);

            let idx = j * N_GRID + i;
            rePsi[idx] = env * Math.cos(phase);
            imPsi[idx] = env * Math.sin(phase);

            normSum += (rePsi[idx]*rePsi[idx] + imPsi[idx]*imPsi[idx]) * dx * dy;
        }
    }

    let normFactor = 1.0 / Math.sqrt(normSum);
    for (let k = 0; k < N_GRID * N_GRID; k++) {
        rePsi[k] *= normFactor;
        imPsi[k] *= normFactor;
    }

    particles = [];
    trails = [];
    for (let p = 0; p < params.npart; p++) {
        let u1 = Math.random(), u2 = Math.random();
        let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        let z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

        let px = x0 + z0 * params.sigmax;
        let py = y0 + z1 * params.sigmay;

        if (px > -80) px = -80;

        particles.push({ x: px, y: py });
        trails.push([{ x: px, y: py }]);
    }

    render();
    updateStats();
}

function computeQuantumPotential() {
    let A = new Float64Array(N_GRID * N_GRID);
    for (let k = 0; k < N_GRID * N_GRID; k++) {
        A[k] = Math.sqrt(rePsi[k]*rePsi[k] + imPsi[k]*imPsi[k]);
    }

    for (let j = 1; j < N_GRID - 1; j++) {
        for (let i = 1; i < N_GRID - 1; i++) {
            let idx = j * N_GRID + i;
            let aVal = A[idx];

            if (aVal < 1e-6) {
                Vq[idx] = 0;
                continue;
            }

            let d2x = (A[idx + 1] - 2 * aVal + A[idx - 1]) / (dx * dx);
            let d2y = (A[idx + N_GRID] - 2 * aVal + A[idx - N_GRID]) / (dy * dy);

            let vval = - (params.hbar * params.hbar / (2 * params.m)) * (d2x + d2y) / aVal;
            Vq[idx] = Math.max(-0.15, Math.min(0.15, vval));
        }
    }
}

// Phase multiply helper: applies pre-scaled phase values from srcArr.
// scaledPhase = srcArr[k] * hbarInv * dtHalf where hbarInv = -1/h, dtHalf = dt*0.5.
function applyPhaseArray(reArr, imArr, srcArr, n, hbarInv, dtHalf) {
    for (let k = 0; k < n; k++) {
        let phase = srcArr[k] * hbarInv * dtHalf;
        let cos = Math.cos(phase), sin = Math.sin(phase);
        let r = reArr[k], i = imArr[k];
        reArr[k] = r * cos - i * sin;
        imArr[k] = r * sin + i * cos;
    }
}

function applyDirectPhase(reArr, imArr, srcArr, n) {
    for (let k = 0; k < n; k++) {
        let phase = srcArr[k];
        let cos = Math.cos(phase), sin = Math.sin(phase);
        let r = reArr[k], i = imArr[k];
        reArr[k] = r * cos - i * sin;
        imArr[k] = r * sin + i * cos;
    }
}

function propagateV(reArr, imArr, dt, m, h) {
    let hbarInv = -1.0 / h, dtHalf = dt * 0.5;
    applyPhaseArray(reArr, imArr, V, N_GRID * N_GRID, hbarInv, dtHalf);
}

function propagateKinetic(reArr, imArr) {
    applyDirectPhase(reArr, imArr, kineticPhase, N_GRID * N_GRID);
}

function stepSimulation() {
    const dt = params.dt;

    // Half-step potential phase
    propagateV(rePsi, imPsi, dt, params.m, params.hbar);
    fftEngine.transform2D(rePsi, imPsi, false);

    // Full-step kinetic phase
    propagateKinetic(rePsi, imPsi);
    fftEngine.transform2D(rePsi, imPsi, true);

    // Half-step potential phase
    propagateV(rePsi, imPsi, dt, params.m, params.hbar);

    // computeQuantumPotential();

    for (let p = 0; p < particles.length; p++) {
        let pt = particles[p];

        let gx = (pt.x + L/2) / dx;
        let gy = (pt.y + L/2) / dy;

        let ix = Math.floor(gx);
        let iy = Math.floor(gy);

        if (ix >= 1 && ix < N_GRID - 2 && iy >= 1 && iy < N_GRID - 2) {
            let idx = iy * N_GRID + ix;

            let dReX = (rePsi[idx + 1] - rePsi[idx - 1]) / (2 * dx);
            let dImX = (imPsi[idx + 1] - imPsi[idx - 1]) / (2 * dx);
            let dReY = (rePsi[idx + N_GRID] - rePsi[idx - N_GRID]) / (2 * dy);
            let dImY = (imPsi[idx + N_GRID] - imPsi[idx - N_GRID]) / (2 * dy);

            let r = rePsi[idx], im = imPsi[idx];
            let rho = r * r + im * im + 1e-12;

            let vx = (params.hbar / params.m) * (r * dImX - im * dReX) / rho;
            let vy = (params.hbar / params.m) * (r * dImY - im * dReY) / rho;

            pt.x += vx * dt * 3.0;
            pt.y += vy * dt * 3.0;

            trails[p].push({ x: pt.x, y: pt.y });
            if (trails[p].length > 30) trails[p].shift();
        }
    }

    currentTime += dt;
}
