# SOFT 2D VQ � 2D Quantum Potential & Bohmian Trajectory Simulator

An interactive browser-based visualizer and a MATLAB research codebase for simulating 2D quantum wavepacket dynamics using the **Split-Operator Fourier Transform (SOFT)** method, augmented with **Bohmian (quantum trajectory) mechanics** via the **quantum potential** (VQ).

Based off of matlab scripting work done in 2018-2019 in graduate school.

---

## Overview

This project numerically solves the time-dependent Schr�dinger equation in 2D using the SOFT method and computes Bohmian particle trajectories guided by the quantum potential. Two physical scenarios are supported:

- **Young's Double-Slit** � a Gaussian wavepacket passes through a double-slit barrier, producing quantum interference fringes and non-crossing Bohmian trajectories that sort into the fringe bands.
- **Wyatt Saddle-Point (Chemical Reaction Barrier)** � a benchmark barrier from Wyatt (2001): the wavepacket bifurcates into two transmitted channels, demonstrating reactive scattering without diffraction.

---

## Files

| File | Description |
|---|---|
| `index.html` | Self-contained browser visualizer (HTML + JS) |

---

## Physics

### Wavefunction Propagation � SOFT Method

The wavefunction is evolved using a second-order Strang splitting:

```
psi(t+dt) = exp(-iV*dt/2*hbar) * IFFT[ exp(-i*p^2*dt/2m*hbar) * FFT[psi] ] * exp(-iV*dt/2*hbar)
```

This operator-split approach alternates between position-space potential kicks and momentum-space kinetic propagation.

### Quantum Potential

The Bohm quantum potential is:

```
VQ = -(hbar^2/2m) * Laplacian(R) / R,   where R = sqrt(rho) = |psi|
```

Spatial second derivatives of R are computed by finite differences. VQ encodes all quantum non-locality and is what guides the Bohmian particles, producing the interference pattern in the double-slit case.

### Bohmian Trajectories

Particle velocities are derived from the wavefunction phase S (where psi = R*exp(iS/hbar)):

```
v = (hbar/m) * Im(psi* grad(psi)) / |psi|^2
```

Particles are initialized by sampling from the initial |psi_0|^2 distribution and are deterministically steered by the local Bohmian velocity field at each timestep.

---

## Browser Visualizer (`index.html`)

Open `index.html` directly in any modern browser � no server required.

### Features

- **Live wavepacket density** |psi|^2 rendered as a heatmap
- **Bohmian particle trajectories** with trail history
- **Quantum potential VQ** heatmap view (positive/negative signed coloring)
- **Scattering histogram** of transmitted particle angles
- **Real-time controls**: initial momentum, slit geometry, barrier height, particle count, beam width
- **Experiment switching** between Double-Slit and Saddle-Point at runtime

### Controls

| Control | Description |
|---|---|
| Barrier Geometry | Switch between Double-Slit and Saddle-Point potentials |
| Initial Momentum (p_x0) | Mean x-momentum of the incident Gaussian wavepacket |
| Slit Separation (d) | Centre-to-centre distance between the two slits |
| Slit Width (w) | Aperture of each slit (should be ~lambda for diffraction) |
| Beam Width (sigma_y) | Transverse width of the incident Gaussian |
| Barrier Height (V_0) | Peak potential energy of the barrier |
| Particle Count (N) | Number of Bohmian tracer particles |

### View Tabs

| Tab | Description |
|---|---|
| Combined Physics | Density, particles, trails, and barrier overlay |
| Quantum Potential V_Q | Signed heatmap of the Bohm quantum potential |
| Trajectory Map | Bohmian trail paths only |
| Scattering Histogram | Angular distribution of transmitted particles |

---

## Requirements

**Browser visualizer:** Any modern browser (Chrome, Firefox, Edge). No dependencies.

---

## References

- Bohm, D. (1952). *A Suggested Interpretation of the Quantum Theory in Terms of "Hidden" Variables.* Physical Review, 85(2), 166.
- Wyatt, R. E. (2005). *Quantum Dynamics with Trajectories: Introduction to Quantum Hydrodynamics.* Springer.
- Feit, M. D., Fleck, J. A., & Steiger, A. (1982). *Solution of the Schrodinger equation by a spectral method.* Journal of Computational Physics, 47(3), 412-433.
