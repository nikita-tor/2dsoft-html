// -------------------------------------------------------------
// Fast 1D / 2D FFT Implementation (Cooley-Tukey Radix-2)
// -------------------------------------------------------------
class FFT2D {
    constructor(N) {
        this.N = N;
        this.bitRev = new Int32Array(N);

        for (let i = 0; i < N; i++) {
            let rev = 0;
            let temp = i;
            let bits = Math.log2(N);
            for (let b = 0; b < bits; b++) {
                rev = (rev << 1) | (temp & 1);
                temp >>= 1;
            }
            this.bitRev[i] = rev;
        }

        this.cosTable = new Float64Array(N / 2);
        this.sinTable = new Float64Array(N / 2);
        for (let k = 0; k < N / 2; k++) {
            let theta = -2.0 * Math.PI * k / N;
            this.cosTable[k] = Math.cos(theta);
            this.sinTable[k] = Math.sin(theta);
        }
    }

    transform1D(re, im, inv = false) {
        const N = this.N;
        const angleSign = inv ? 1 : -1;

        for (let i = 0; i < N; i++) {
            let j = this.bitRev[i];
            if (i < j) {
                let tr = re[i]; re[i] = re[j]; re[j] = tr;
                let ti = im[i]; im[i] = im[j]; im[j] = ti;
            }
        }

        for (let len = 2; len <= N; len <<= 1) {
            let half = len >> 1;
            let step = N / len;
            for (let i = 0; i < N; i += len) {
                for (let j = 0; j < half; j++) {
                    let k = j * step;
                    let theta = angleSign * 2.0 * Math.PI * k / N;
                    let cos = this.cosTable[k];
                    let sin = inv ? -this.sinTable[k] : this.sinTable[k];

                    let uRe = re[i + j];
                    let uIm = im[i + j];
                    let vRe = re[i + j + half] * cos - im[i + j + half] * sin;
                    let vIm = re[i + j + half] * sin + im[i + j + half] * cos;

                    re[i + j] = uRe + vRe;
                    im[i + j] = uIm + vIm;
                    re[i + j + half] = uRe - vRe;
                    im[i + j + half] = uIm - vIm;
                }
            }
        }

        if (inv) {
            for (let i = 0; i < N; i++) {
                re[i] /= N;
                im[i] /= N;
            }
        }
    }

    transform2D(re2D, im2D, inv = false) {
        const N = this.N;
        let rRow = new Float64Array(N);
        let iRow = new Float64Array(N);

        for (let y = 0; y < N; y++) {
            let off = y * N;
            for (let x = 0; x < N; x++) {
                rRow[x] = re2D[off + x];
                iRow[x] = im2D[off + x];
            }
            this.transform1D(rRow, iRow, inv);
            for (let x = 0; x < N; x++) {
                re2D[off + x] = rRow[x];
                im2D[off + x] = iRow[x];
            }
        }

        for (let x = 0; x < N; x++) {
            for (let y = 0; y < N; y++) {
                rRow[y] = re2D[y * N + x];
                iRow[y] = im2D[y * N + x];
            }
            this.transform1D(rRow, iRow, inv);
            for (let y = 0; y < N; y++) {
                re2D[y * N + x] = rRow[y];
                im2D[y * N + x] = iRow[y];
            }
        }
    }
}
