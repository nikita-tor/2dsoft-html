// -------------------------------------------------------------
// Event Listeners & UI Binding
// -------------------------------------------------------------
document.getElementById('btn-play').addEventListener('click', (e) => {
    isRunning = !isRunning;
    e.target.innerText = isRunning ? '⏸ Pause' : '▶ Play';
    e.target.classList.toggle('btn-primary', !isRunning);
});

document.getElementById('btn-reset').addEventListener('click', () => {
    isRunning = false;
    document.getElementById('btn-play').innerText = '▶ Play';
    resetSimulation();
});

document.getElementById('select-pottype').addEventListener('change', (e) => {
    params.potType = e.target.value;
    const dsCtrl = document.getElementById('doubleslit-controls');
    dsCtrl.style.display = (params.potType === 'doubleslit') ? 'block' : 'none';

    const explainer = document.getElementById('info-text');
    if (params.potType === 'doubleslit') {
        explainer.innerHTML = "<b>True Young's Double-Slit Experiment:</b> The incident wavepacket hits a wall with two narrow slits ($w \\sim \\lambda$). The wavelets diffracting out of each slit overlap in space, generating multi-ring quantum interference fringes in $|\\Psi|^2$ and guiding Bohmian particles into distinct fringe bands!";
    } else {
        explainer.innerHTML = "<b>Wyatt 2001 Saddle-Point Potential:</b> Benchmark chemical reaction barrier ($V_0 - \\frac{1}{2}m\\omega^2 y^2 + \\dots$). Wavepacket bifurcates smoothly into two channels without narrow-slit diffraction.";
    }

    resetSimulation();
});

const bindSlider = (id, key, labelId) => {
    document.getElementById(id).addEventListener('input', (e) => {
        params[key] = parseFloat(e.target.value);
        document.getElementById(labelId).innerText = e.target.value;
        resetSimulation();
    });
};

bindSlider('slider-px0', 'px0', 'val-px0');
bindSlider('slider-slitsep', 'slitSep', 'val-slitsep');
bindSlider('slider-slitwidth', 'slitWidth', 'val-slitwidth');
bindSlider('slider-sigmay', 'sigmay', 'val-sigmay');
bindSlider('slider-v0', 'v0', 'val-v0');
bindSlider('slider-npart', 'npart', 'val-npart');

// framesPerFrame is read directly from params inside animLoop each frame.
// Resetting the simulation on change would freeze time and restart the sim
// unnecessarily — just updating params is enough.
document.getElementById('slider-fpf').addEventListener('input', (e) => {
    params.framesPerFrame = parseFloat(e.target.value);
    document.getElementById('val-fpf').innerText = e.target.value;
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        activeView = e.target.getAttribute('data-view');
        render();
    });
});

resetSimulation();
requestAnimationFrame(animLoop);
