"use client";

import { useEffect, useRef } from "react";

const vertex = `attribute vec2 position; void main(){ gl_Position = vec4(position, 0.0, 1.0); }`;
const fragment = `
precision mediump float;
uniform vec2 resolution;
uniform float time;
uniform vec2 pointer;
float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y); }
void main(){
  vec2 uv=gl_FragCoord.xy/resolution.xy; vec2 p=(gl_FragCoord.xy-.5*resolution.xy)/min(resolution.x,resolution.y);
  p += pointer*.06; float t=time*.12; vec2 q=p*1.25;
  for(float i=1.;i<5.;i++){ q.x += .18/i*cos(i*2.3*q.y+t); q.y += .18/i*sin(i*1.8*q.x-t*.7); }
  float n=noise(q*1.8+vec2(t*.15,-t*.1));
  vec3 dark=vec3(.106,.094,.035); vec3 brown=vec3(.298,.208,.102); vec3 copper=vec3(.78,.38,.16); vec3 gold=vec3(.85,.80,.55);
  vec3 color=mix(dark,brown,smoothstep(.12,.78,n)); color=mix(color,copper,smoothstep(.58,1.,n)*.42); color+=gold*.06*sin(q.x*2.2+q.y*1.7+t);
  float vignette=1.-.42*smoothstep(.35,1.25,length(uv-.5)*1.35); gl_FragColor=vec4(color*vignette,1.);
}`;

export function ShaderBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", { antialias: false });
    if (!canvas || !gl) return;
    const compile = (type: number, source: string) => { const shader = gl.createShader(type); if (!shader) return null; gl.shaderSource(shader, source); gl.compileShader(shader); return shader; };
    const vs = compile(gl.VERTEX_SHADER, vertex); const fs = compile(gl.FRAGMENT_SHADER, fragment); if (!vs || !fs) return;
    const program = gl.createProgram(); if (!program) return;
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program); gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position"); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "resolution"); const time = gl.getUniformLocation(program, "time"); const pointer = gl.getUniformLocation(program, "pointer");
    let frame = 0; let start = performance.now(); let mouseX = 0; let mouseY = 0;
    const resize = () => { const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.max(1, Math.round(rect.width*dpr)); canvas.height = Math.max(1, Math.round(rect.height*dpr)); gl.viewport(0,0,canvas.width,canvas.height); };
    const onMove = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); mouseX=((event.clientX-rect.left)/rect.width-.5)*2; mouseY=-((event.clientY-rect.top)/rect.height-.5)*2; };
    const render = (now: number) => { gl.uniform2f(resolution, canvas.width, canvas.height); gl.uniform1f(time, (now-start)/1000); gl.uniform2f(pointer, mouseX, mouseY); gl.drawArrays(gl.TRIANGLES,0,3); frame=requestAnimationFrame(render); };
    resize(); const observer = new ResizeObserver(resize); observer.observe(canvas); window.addEventListener("pointermove", onMove, { passive: true }); frame=requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("pointermove", onMove); gl.deleteBuffer(buffer); gl.deleteProgram(program); };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}

export default ShaderBackground;
