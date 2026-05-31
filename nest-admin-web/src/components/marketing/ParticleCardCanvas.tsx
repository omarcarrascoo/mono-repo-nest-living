"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Tarjeta de crédito 3D hecha con partículas. Misma estética matte del
 * resto: PointsMaterial, sin additive blending, color tinta. Misma física
 * de cursor (resorte + repulsión + damping).
 *
 * Composición:
 *   - Cuerpo: rectángulo CON grosor (volumen real, no plano), levemente
 *     inclinado en el espacio.
 *   - Chip: cuadrado teal en relieve.
 *   - Número: cuatro grupos de cuatro dígitos sembrados desde un bitmap
 *     2D off-screen (Three no necesita cargar fuente 3D).
 *   - Nombre del titular y "VALID THRU" abajo, mismo método.
 *
 * El truco para "tipografía en partículas" es:
 *   1. Dibujamos el texto en un canvas 2D off-screen.
 *   2. Leemos los píxeles oscuros (el texto).
 *   3. Convertimos cada píxel "encendido" en una partícula 3D, mapeando el
 *      tamaño del canvas al tamaño físico que ocupa el texto en la tarjeta.
 */

interface Props {
  className?: string;
  color?: string;
  highlightColor?: string;
}

export function ParticleCardCanvas({
  className,
  color = "#1b1a17",
  highlightColor = "#0f766e",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.innerWidth < 768;

    // ============================================================
    // Setup
    // ============================================================
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      36,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    // Vista 3/4 — ligeramente arriba y a un lado para ver volumen
    camera.position.set(0.6, 1.4, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // ============================================================
    // Dimensiones de la tarjeta (relación ~85.6×54mm reales = 1.585:1)
    // ============================================================
    const W = 3.4; // ancho
    const H = 2.15; // alto (W / 1.585)
    const T = 0.06; // grosor
    const x0 = -W / 2;
    const x1 = W / 2;
    const y0 = -H / 2;
    const y1 = H / 2;
    const z0 = -T / 2;
    const z1 = T / 2;

    // ============================================================
    // Densidades
    // ============================================================
    const EDGE_DENSITY = isMobile ? 10 : 16;
    const FACADE_DENSITY = isMobile ? 4 : 7;
    // Para texto en bitmap: cuántos píxeles del bitmap saltarse al sembrar.
    // Más alto = menos densidad. Mobile salta más píxeles.
    const TEXT_PIXEL_STEP = isMobile ? 4 : 3;

    const positionsRegular: number[] = [];
    const positionsHighlight: number[] = [];

    // ============================================================
    // Helpers de seeding
    // ============================================================
    function seedEdge(
      target: number[],
      ax: number,
      ay: number,
      az: number,
      bx: number,
      by: number,
      bz: number,
    ) {
      const dx = bx - ax;
      const dy = by - ay;
      const dz = bz - az;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const n = Math.max(4, Math.round(len * EDGE_DENSITY));
      for (let i = 0; i < n; i++) {
        const t = i / Math.max(1, n - 1);
        const j = 0.008;
        target.push(
          ax + dx * t + (Math.random() - 0.5) * j,
          ay + dy * t + (Math.random() - 0.5) * j,
          az + dz * t + (Math.random() - 0.5) * j,
        );
      }
    }

    function seedFacade(
      target: number[],
      x0: number,
      y0: number,
      z0: number,
      x1: number,
      y1: number,
      z1: number,
      axis: "x" | "y" | "z",
    ) {
      const w = Math.abs(x1 - x0) || 1;
      const h = Math.abs(y1 - y0) || 1;
      const d = Math.abs(z1 - z0) || 1;
      const area = axis === "x" ? h * d : axis === "y" ? w * d : w * h;
      const n = Math.max(8, Math.round(area * FACADE_DENSITY * FACADE_DENSITY));
      for (let i = 0; i < n; i++) {
        const u = Math.random();
        const v = Math.random();
        const jit = 0.006;
        let x = 0,
          y = 0,
          z = 0;
        if (axis === "x") {
          x = x0 + (Math.random() - 0.5) * jit;
          y = y0 + (y1 - y0) * u + (Math.random() - 0.5) * jit;
          z = z0 + (z1 - z0) * v + (Math.random() - 0.5) * jit;
        } else if (axis === "y") {
          x = x0 + (x1 - x0) * u + (Math.random() - 0.5) * jit;
          y = y0 + (Math.random() - 0.5) * jit;
          z = z0 + (z1 - z0) * v + (Math.random() - 0.5) * jit;
        } else {
          x = x0 + (x1 - x0) * u + (Math.random() - 0.5) * jit;
          y = y0 + (y1 - y0) * v + (Math.random() - 0.5) * jit;
          z = z0 + (Math.random() - 0.5) * jit;
        }
        target.push(x, y, z);
      }
    }

    function seedVolume(
      target: number[],
      x0: number,
      y0: number,
      z0: number,
      x1: number,
      y1: number,
      z1: number,
      densityMul = 1,
    ) {
      const vol = Math.abs((x1 - x0) * (y1 - y0) * (z1 - z0));
      const n = Math.max(0, Math.round(vol * 18 * densityMul));
      for (let i = 0; i < n; i++) {
        target.push(
          x0 + Math.random() * (x1 - x0),
          y0 + Math.random() * (y1 - y0),
          z0 + Math.random() * (z1 - z0),
        );
      }
    }

    /**
     * Sembra texto en partículas via bitmap 2D off-screen.
     * Centra el texto en (cx, cy, cz) con el ancho `width` deseado en mundo.
     */
    function seedText(
      target: number[],
      text: string,
      cx: number,
      cy: number,
      cz: number,
      width: number,
      fontPx: number,
      fontFamily: string,
    ) {
      // 1. Dibujar a canvas off-screen
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Medir
      ctx.font = `${fontPx}px ${fontFamily}`;
      const metrics = ctx.measureText(text);
      const textW = Math.ceil(metrics.width) + 4;
      const textH = Math.ceil(fontPx * 1.2) + 4;
      canvas.width = textW;
      canvas.height = textH;
      // Re-aplicar (cambiar canvas resetea el contexto)
      const ctx2 = canvas.getContext("2d");
      if (!ctx2) return;
      ctx2.font = `${fontPx}px ${fontFamily}`;
      ctx2.fillStyle = "#000";
      ctx2.textBaseline = "middle";
      ctx2.fillText(text, 2, textH / 2);

      // 2. Leer pixels y mapear
      const img = ctx2.getImageData(0, 0, textW, textH);
      const data = img.data;
      // Tamaño físico del bitmap: width en mundo. La altura se escala
      // proporcionalmente.
      const worldW = width;
      const worldH = (textH / textW) * worldW;
      const startX = cx - worldW / 2;
      const startY = cy + worldH / 2; // Y va al revés en canvas

      for (let py = 0; py < textH; py += TEXT_PIXEL_STEP) {
        for (let px = 0; px < textW; px += TEXT_PIXEL_STEP) {
          const idx = (py * textW + px) * 4;
          const alpha = data[idx + 3];
          // Si el pixel tiene tinta (alpha alto), lo sembramos.
          if (alpha > 128) {
            const wx = startX + (px / textW) * worldW;
            const wy = startY - (py / textH) * worldH;
            // Pequeño jitter en Z para que el texto no se vea perfectamente
            // plano sobre la cara frontal.
            const jit = 0.004;
            target.push(
              wx + (Math.random() - 0.5) * jit,
              wy + (Math.random() - 0.5) * jit,
              cz + (Math.random() - 0.5) * jit,
            );
          }
        }
      }
    }

    // ============================================================
    // Componer la tarjeta
    // ============================================================
    // ---- Cuerpo (volumen rectangular delgado)
    // 12 aristas
    seedEdge(positionsRegular, x0, y0, z0, x1, y0, z0);
    seedEdge(positionsRegular, x1, y0, z0, x1, y0, z1);
    seedEdge(positionsRegular, x1, y0, z1, x0, y0, z1);
    seedEdge(positionsRegular, x0, y0, z1, x0, y0, z0);
    seedEdge(positionsRegular, x0, y1, z0, x1, y1, z0);
    seedEdge(positionsRegular, x1, y1, z0, x1, y1, z1);
    seedEdge(positionsRegular, x1, y1, z1, x0, y1, z1);
    seedEdge(positionsRegular, x0, y1, z0, x0, y1, z1);
    seedEdge(positionsRegular, x0, y0, z0, x0, y1, z0);
    seedEdge(positionsRegular, x1, y0, z0, x1, y1, z0);
    seedEdge(positionsRegular, x1, y0, z1, x1, y1, z1);
    seedEdge(positionsRegular, x0, y0, z1, x0, y1, z1);
    // Cara trasera + cantos (la frontal la dejamos más vacía para que se
    // vea el contenido)
    seedFacade(positionsRegular, x0, y0, z0, x1, y1, z0, "z"); // trasera
    seedFacade(positionsRegular, x0, y0, z0, x0, y1, z1, "x"); // izq
    seedFacade(positionsRegular, x1, y0, z0, x1, y1, z1, "x"); // der
    seedFacade(positionsRegular, x0, y0, z0, x1, y0, z1, "y"); // abajo
    seedFacade(positionsRegular, x0, y1, z0, x1, y1, z1, "y"); // arriba
    // Frontal con menos densidad (le baja densidad pero sigue habiendo)
    {
      const before = positionsRegular.length;
      seedFacade(positionsRegular, x0, y0, z1, x1, y1, z1, "z");
      // recorta al 35% para que se vea el chip y números
      const filtered: number[] = [];
      for (let i = before; i < positionsRegular.length; i += 3) {
        if (Math.random() < 0.35) {
          filtered.push(
            positionsRegular[i],
            positionsRegular[i + 1],
            positionsRegular[i + 2],
          );
        }
      }
      positionsRegular.length = before;
      positionsRegular.push(...filtered);
    }

    // ---- Chip (cuadrado en relieve, izquierda-arriba)
    {
      const chipW = 0.46;
      const chipH = 0.34;
      const chipX = -W / 2 + 0.46;
      const chipY = H / 2 - 0.55;
      const chipZ1 = z1 + 0.04; // pequeño relieve sobre la cara frontal

      // Aristas del chip (perimetro)
      seedEdge(
        positionsHighlight,
        chipX - chipW / 2,
        chipY - chipH / 2,
        chipZ1,
        chipX + chipW / 2,
        chipY - chipH / 2,
        chipZ1,
      );
      seedEdge(
        positionsHighlight,
        chipX + chipW / 2,
        chipY - chipH / 2,
        chipZ1,
        chipX + chipW / 2,
        chipY + chipH / 2,
        chipZ1,
      );
      seedEdge(
        positionsHighlight,
        chipX + chipW / 2,
        chipY + chipH / 2,
        chipZ1,
        chipX - chipW / 2,
        chipY + chipH / 2,
        chipZ1,
      );
      seedEdge(
        positionsHighlight,
        chipX - chipW / 2,
        chipY + chipH / 2,
        chipZ1,
        chipX - chipW / 2,
        chipY - chipH / 2,
        chipZ1,
      );
      // Cara superior del chip (frontal)
      seedFacade(
        positionsHighlight,
        chipX - chipW / 2,
        chipY - chipH / 2,
        chipZ1,
        chipX + chipW / 2,
        chipY + chipH / 2,
        chipZ1,
        "z",
      );
      // Líneas internas del chip (sugieren los contactos)
      const lines = 3;
      for (let i = 1; i <= lines; i++) {
        const ly = chipY - chipH / 2 + (chipH * i) / (lines + 1);
        seedEdge(
          positionsHighlight,
          chipX - chipW / 2 + 0.05,
          ly,
          chipZ1 + 0.001,
          chipX + chipW / 2 - 0.05,
          ly,
          chipZ1 + 0.001,
        );
      }
      // Volumen del chip — relieve sutil
      seedVolume(
        positionsHighlight,
        chipX - chipW / 2 + 0.02,
        chipY - chipH / 2 + 0.02,
        z1 + 0.005,
        chipX + chipW / 2 - 0.02,
        chipY + chipH / 2 - 0.02,
        chipZ1 - 0.005,
        0.6,
      );
    }

    // ---- Número de tarjeta (4 grupos de 4 dígitos en el centro)
    // Ej. "•••• •••• •••• 0428" — usamos el patrón clásico.
    {
      const numText = "5413  9012  4471  0428";
      // Posición centrada horizontalmente, debajo del chip
      const numCx = 0;
      const numCy = -0.1;
      const numCz = z1 + 0.005; // un pelo en relieve
      const numWorldW = W * 0.78;
      // Fuente monoespaciada para que se sienta tarjeta
      const fontFamily =
        "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
      seedText(
        positionsRegular,
        numText,
        numCx,
        numCy,
        numCz,
        numWorldW,
        56,
        fontFamily,
      );
    }

    // ---- "VALID THRU" + fecha
    {
      const labelCx = -W / 2 + 0.85;
      const labelCy = -H / 2 + 0.6;
      const labelCz = z1 + 0.005;
      seedText(
        positionsRegular,
        "VALID THRU",
        labelCx,
        labelCy + 0.16,
        labelCz,
        0.7,
        14,
        "ui-sans-serif, system-ui",
      );
      seedText(
        positionsRegular,
        "12 / 28",
        labelCx,
        labelCy,
        labelCz,
        0.65,
        28,
        "ui-monospace, monospace",
      );
    }

    // ---- Nombre del titular (esquina inferior izquierda)
    {
      const nameCx = 0;
      const nameCy = -H / 2 + 0.32;
      const nameCz = z1 + 0.005;
      seedText(
        positionsRegular,
        "NEST LIVING",
        nameCx,
        nameCy,
        nameCz,
        W * 0.6,
        30,
        "ui-sans-serif, system-ui",
      );
    }

    // ---- Logo / monograma esquina superior derecha (un círculo simple)
    {
      const lcx = W / 2 - 0.45;
      const lcy = H / 2 - 0.4;
      const lcz = z1 + 0.005;
      const rOuter = 0.18;
      const rInner = 0.12;
      // Anillo: dos círculos concéntricos en partículas
      const points = isMobile ? 36 : 60;
      for (let i = 0; i < points; i++) {
        const a = (i / points) * Math.PI * 2;
        const j = 0.005;
        positionsRegular.push(
          lcx + Math.cos(a) * rOuter + (Math.random() - 0.5) * j,
          lcy + Math.sin(a) * rOuter + (Math.random() - 0.5) * j,
          lcz + (Math.random() - 0.5) * j,
        );
        positionsRegular.push(
          lcx + Math.cos(a) * rInner + (Math.random() - 0.5) * j,
          lcy + Math.sin(a) * rInner + (Math.random() - 0.5) * j,
          lcz + (Math.random() - 0.5) * j,
        );
      }
    }

    // ============================================================
    // Crear los dos Points y compartir física
    // ============================================================
    function makePoints(positionsArr: number[], col: string) {
      const positions = new Float32Array(positionsArr);
      const totalCount = positions.length / 3;
      const basePositions = new Float32Array(positions);
      const velocities = new Float32Array(totalCount * 3);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3).setUsage(
          THREE.DynamicDrawUsage,
        ),
      );

      const material = new THREE.PointsMaterial({
        color: new THREE.Color(col),
        size: isMobile ? 0.024 : 0.02,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);
      return {
        points,
        geometry,
        material,
        positions,
        basePositions,
        velocities,
        totalCount,
      };
    }

    const regular = makePoints(positionsRegular, color);
    const highlight = makePoints(positionsHighlight, highlightColor);
    highlight.material.opacity = 0.92;

    // Inclinación inicial para vista 3/4 — la tarjeta no es una postal plana
    scene.rotation.y = -0.32;
    scene.rotation.x = 0.1;

    // ============================================================
    // Cursor (idéntico al resto)
    // ============================================================
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2(-10, -10);
    const interactPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const cursorPoint = new THREE.Vector3(9999, 9999, 9999);
    const tmp = new THREE.Vector3();

    function updateCursor(clientX: number, clientY: number) {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.ray.intersectPlane(interactPlane, tmp);
      if (hit) cursorPoint.copy(hit);
    }

    function clearCursor() {
      cursorPoint.set(9999, 9999, 9999);
    }

    const onMouseMove = (e: MouseEvent) => updateCursor(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) updateCursor(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", clearCursor);
    container.addEventListener("mouseleave", clearCursor);

    // ============================================================
    // Resize + visibilidad
    // ============================================================
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
      },
      { threshold: 0.05 },
    );
    io.observe(container);

    // ============================================================
    // Loop
    // ============================================================
    const radius = 0.95;
    const radiusSq = radius * radius;
    const repelStrength = reduceMotion ? 0 : 0.4;
    const springK = 0.022;
    const damping = 0.84;
    const REST_THRESH_SQ = 0.0002;

    function step(buffer: ReturnType<typeof makePoints>) {
      const cx = cursorPoint.x;
      const cy = cursorPoint.y;
      const cz = cursorPoint.z;
      const cursorActive = cx < 9000;

      const { positions, basePositions, velocities, totalCount } = buffer;

      for (let i = 0; i < totalCount; i++) {
        const ix = i * 3;
        const iy = ix + 1;
        const iz = ix + 2;

        const px = positions[ix];
        const py = positions[iy];
        const pz = positions[iz];
        const bx = basePositions[ix];
        const by = basePositions[iy];
        const bz = basePositions[iz];

        const offX = bx - px;
        const offY = by - py;
        const offZ = bz - pz;
        const offSq = offX * offX + offY * offY + offZ * offZ;

        let vx = velocities[ix];
        let vy = velocities[iy];
        let vz = velocities[iz];
        const vSq = vx * vx + vy * vy + vz * vz;

        if (
          !cursorActive &&
          offSq < REST_THRESH_SQ &&
          vSq < REST_THRESH_SQ
        ) {
          continue;
        }

        vx += offX * springK;
        vy += offY * springK;
        vz += offZ * springK;

        if (cursorActive) {
          const dx = px - cx;
          const dy = py - cy;
          const dz = pz - cz;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq < radiusSq && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const f = (1 - distSq / radiusSq) * repelStrength;
            const invD = 1 / dist;
            vx += dx * invD * f;
            vy += dy * invD * f;
            vz += dz * invD * f;
          }
        }

        vx *= damping;
        vy *= damping;
        vz *= damping;

        velocities[ix] = vx;
        velocities[iy] = vy;
        velocities[iz] = vz;

        positions[ix] = px + vx;
        positions[iy] = py + vy;
        positions[iz] = pz + vz;
      }
      const attr = buffer.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      step(regular);
      step(highlight);
      renderer.render(scene, camera);
    };
    tick();

    // ============================================================
    // Cleanup
    // ============================================================
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", clearCursor);
      container.removeEventListener("mouseleave", clearCursor);
      regular.geometry.dispose();
      regular.material.dispose();
      highlight.geometry.dispose();
      highlight.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [color, highlightColor]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
