const fs = require('fs');
function generateWavyCurve(cx, cy, r_base, wave_amp, points) {
    const N = 200;
    let path = [];
    for (let i = 0; i <= N; i++) {
        const theta = (i / N) * 2 * Math.PI;
        const r = r_base + wave_amp * Math.cos(points * theta);
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        if (i === 0) {
            path.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
        } else {
            path.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
        }
    }
    return path.join(" ") + " Z";
}
const pathData = generateWavyCurve(50, 50, 48, 5, 10);
const css = `
.mask-wavy {
  mask-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${pathData}"/></svg>');
  -webkit-mask-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="${pathData}"/></svg>');
  mask-size: cover;
  -webkit-mask-size: cover;
  mask-position: center;
  -webkit-mask-position: center;
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  border-radius: 0;
}
`;
fs.writeFileSync('wavy-mask.txt', css);
fs.writeFileSync('wavy-path.txt', pathData);
