import React, { useEffect, useRef } from 'react';

interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [isNaN(r) ? 0.5 : r, isNaN(g) ? 0.5 : g, isNaN(b) ? 0.5 : b];
};

export default function Silk({
  speed = 5,
  scale = 1,
  color = '#7B7481',
  noiseIntensity = 1.5,
  rotation = 0,
}: SilkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return;
    }

    const vertexShaderSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec3 u_color;
      uniform float u_speed;
      uniform float u_scale;
      uniform float u_noiseIntensity;
      uniform float u_rotation;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      mat2 rotate2d(float angle) {
        return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv - 0.5;
        p.x *= u_resolution.x / u_resolution.y;

        float angle = u_rotation + u_time * u_speed * 0.005;
        p = rotate2d(angle) * p;

        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 3.0 * u_scale;
        
        for (int i = 0; i < 4; i++) {
          vec2 warp = vec2(
            noise(p * frequency + vec2(u_time * 0.01 * u_speed, 0.0)),
            noise(p * frequency + vec2(0.0, u_time * 0.008 * u_speed))
          ) * u_noiseIntensity * 0.4;
          
          value += amplitude * noise(p * frequency + warp);
          frequency *= 2.0;
          amplitude *= 0.5;
        }

        float shadow = smoothstep(0.2, 0.8, value);
        float highlight = smoothstep(0.4, 0.9, sin(value * 6.28318));

        vec3 shadowColor = u_color * 0.35;
        vec3 baseColor = u_color;
        vec3 highlightColor = vec3(0.95, 0.94, 0.97);

        vec3 col = mix(shadowColor, baseColor, shadow);
        col += highlightColor * highlight * 0.35;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    const positionAttributeLocation = gl.getAttribLocation(program, 'position');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    const speedUniformLocation = gl.getUniformLocation(program, 'u_speed');
    const scaleUniformLocation = gl.getUniformLocation(program, 'u_scale');
    const noiseIntensityUniformLocation = gl.getUniformLocation(program, 'u_noiseIntensity');
    const rotationUniformLocation = gl.getUniformLocation(program, 'u_rotation');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    let animationFrameId: number;
    let startTime = Date.now();

    const resize = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    const render = () => {
      resize();

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      const elapsedSeconds = (Date.now() - startTime) / 1000;
      gl.uniform1f(timeUniformLocation, elapsedSeconds);
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      
      const rgb = hexToRgb(color);
      gl.uniform3f(colorUniformLocation, rgb[0], rgb[1], rgb[2]);
      gl.uniform1f(speedUniformLocation, speed);
      gl.uniform1f(scaleUniformLocation, scale);
      gl.uniform1f(noiseIntensityUniformLocation, noiseIntensity);
      gl.uniform1f(rotationUniformLocation, rotation);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [speed, scale, color, noiseIntensity, rotation]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
