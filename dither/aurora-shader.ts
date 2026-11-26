// Aurora field and simplex helpers adapted from dithercn, MIT. See LICENSE.
export const AURORA_FRAGMENT = `
precision highp float;
uniform vec2 res;
uniform float time;
uniform sampler2D thresholds;
uniform float matrixSize;
uniform vec3 paper;
uniform vec3 tip;
uniform vec3 ink;
uniform vec3 peak;
uniform float auroraCurtains;
uniform float auroraDrift;
uniform float auroraFlip;
uniform float auroraGlow;
uniform float auroraHeight;
uniform float auroraIntensity;
uniform float auroraLength;
uniform float auroraMask;
uniform float auroraRays;
uniform float auroraScale;
uniform float auroraShimmer;
uniform float auroraSpread;
uniform float auroraSway;
uniform float auroraTilt;
uniform float auroraTurbulence;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 dither_permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = dither_permute(dither_permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    sum += amp * snoise(p);
    p = rotate * p * 2.02 + vec2(11.3, 4.7);
    amp *= 0.5;
  }
  return clamp(0.5 + 0.5 * sum / 0.9375, 0.0, 1.0);
}


float field(vec2 uv, vec2 res, float t) {
  float aspect = res.x / res.y;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  if (auroraFlip > 0.5) {
    p.y = -p.y;
  }
  float c = cos(auroraTilt);
  float s = sin(auroraTilt);
  p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y) + vec2(0.0, 0.5);
  float x = p.x * auroraScale + t * auroraDrift * 0.04;
  float decayBase = mix(15.0, 2.2, auroraLength);
  float light = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    if (fi >= auroraCurtains) {
      break;
    }
    float depth = fi / max(auroraCurtains - 1.0, 1.0);
    float edge = auroraHeight + fi * auroraSpread
      + auroraSway * 0.11 * snoise(vec2(x * 0.55 + fi * 3.1, t * 0.035 + fi * 1.7))
      + auroraTurbulence * 0.05 * snoise(vec2(x * 2.1 - fi * 1.3, t * 0.07 + fi));
    float above = p.y - edge;
    float curtain = above > 0.0
      ? exp(-above * decayBase * (1.0 + fi * 0.4))
      : exp(above * 48.0);
    float bend = snoise(vec2(x * 0.8, t * 0.03 + fi)) * (0.25 + 0.35 * auroraSway);
    float rx = (x + bend) * auroraRays;
    float rays = mix(0.2, 1.0, smoothstep(0.25, 0.75, fbm(vec2(rx + fi * 9.0, t * 0.045 + fi))));
    rays *= 0.75 + 0.25 * snoise(vec2(rx * 3.2, fi * 4.0 + t * 0.02));
    float patch = mix(0.3, 1.0, smoothstep(0.25, 0.7, fbm(vec2(x * 0.45 + fi * 5.0, t * 0.02 + fi * 2.0))));
    float rim = exp(-abs(above) * 34.0) * auroraGlow;
    float haze = above > 0.0 ? exp(-above * 5.0) * 0.09 : exp(above * 14.0) * 0.05;
    light += (curtain * rays + rim * (0.5 + 0.5 * rays) + haze) * patch * mix(1.0, 0.5, depth);
  }
  float ripple = 0.5 + 0.5 * sin(t * 0.8 + p.x * 4.0 + 2.0 * snoise(vec2(p.x * 2.5, t * 0.15)));
  float tone = (1.0 - exp(-light * 1.25)) * auroraIntensity * (1.0 - auroraShimmer * 0.45 * ripple);

  float keep = 1.0;
  if (auroraMask > 2.5) {
    keep = smoothstep(0.0, 0.22, uv.x) * (1.0 - smoothstep(0.78, 1.0, uv.x));
  } else if (auroraMask > 1.5) {
    keep = smoothstep(0.02, 0.4, uv.y);
  } else if (auroraMask > 0.5) {
    keep = (1.0 - smoothstep(0.6, 0.98, uv.y));
  }
  return tone * keep;
}

void main(){
 vec2 uv=gl_FragCoord.xy/res;
 float tone=clamp(field(uv,res,time),0.0,1.0)*4.0;
 float threshold=texture2D(thresholds,(mod(floor(gl_FragCoord.xy),matrixSize)+.5)/matrixSize).r;
 float level=floor(tone)+step(threshold,fract(tone));
 vec3 color=paper;
 if(level>.5)color=mix(paper,tip,.3);
 if(level>1.5)color=mix(paper,tip,.7);
 if(level>2.5)color=ink;
 if(level>3.5)color=peak;
 gl_FragColor=vec4(color,1.0);
}
`;
