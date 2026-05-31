"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Grupo de figuras humanas estilizadas en partículas. Misma estética matte
 * del skyline / barras: PointsMaterial, sin additive blending, color tinta.
 *
 * La "persona" se compone de primitivas geométricas simples:
 *   - cabeza   → puntos en superficie de esfera (Fibonacci)
 *   - torso    → cilindro relleno (anillos por altura)
 *   - brazos   → cilindros con ángulo leve
 *   - piernas  → dos cilindros verticales
 *
 * Cada figura se siembra en su propio sistema local y se transforma con
 * traslación + escala + rotación. 5 figuras distribuidas en grupo, con
 * una destacada en teal para crear punto focal.
 */

interface Props {
  className?: string;
  color?: string;
  highlightColor?: string;
}

interface Figure {
  /** Posición del pie/centro en el suelo. */
  x: number;
  z: number;
  /** Escala global (1.0 = adulto promedio en el sistema). */
  scale: number;
  /** Rotación Y en radianes (para que no miren todos al frente). */
  rotY: number;
  /** Si true, esta figura usa el color destacado. */
  highlight?: boolean;
  /** Densidad relativa de partículas (lejanos = menos). */
  density?: number;
}

export function ParticleCommunityCanvas({
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
    camera.position.set(0, 1.7, 7.5);
    camera.lookAt(0, 1.0, 0);

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
    // Composición — 5 figuras en grupo, mirando levemente al centro
    // ============================================================
    /**
     * Distribución pensada como "foto grupal": 3 al frente, 2 atrás.
     * Cada uno con altura/escala distinta para que se sientan personas,
     * no copias.
     */
    const figures: Figure[] = [
      // Atrás (lejos), un poco más altos en escala para sugerir altura
      { x: -1.4, z: -0.9, scale: 1.05, rotY: 0.18, density: 0.85 },
      { x: 1.5, z: -1.1, scale: 1.0, rotY: -0.22, density: 0.85 },
      // Frente — la figura central (highlight) un poco más adelante
      { x: -1.9, z: 0.4, scale: 0.92, rotY: 0.32 },
      { x: 0.05, z: 0.7, scale: 1.08, rotY: -0.04, highlight: true },
      { x: 1.95, z: 0.35, scale: 0.95, rotY: -0.34 },
    ];

    // ============================================================
    // Densidades base (escaladas en mobile)
    // ============================================================
    const HEAD_POINTS = isMobile ? 90 : 180; // puntos en la esfera
    const TORSO_RINGS = isMobile ? 14 : 22; // anillos verticales del torso
    const TORSO_PER_RING = isMobile ? 18 : 28;
    const LIMB_RINGS = isMobile ? 10 : 16;
    const LIMB_PER_RING = isMobile ? 10 : 14;

    const positionsRegular: number[] = [];
    const positionsHighlight: number[] = [];

    /**
     * Sembra puntos en superficie de esfera con distribución casi uniforme
     * (Fibonacci). Centro en (cx,cy,cz), radio r.
     */
    function seedSphere(
      target: number[],
      cx: number,
      cy: number,
      cz: number,
      r: number,
      n: number,
    ) {
      // golden ratio fibonacci sphere
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2; // -1..1
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        const j = 0.01;
        target.push(
          cx + x * r + (Math.random() - 0.5) * j,
          cy + y * r + (Math.random() - 0.5) * j,
          cz + z * r + (Math.random() - 0.5) * j,
        );
      }
    }

    /**
     * Sembra puntos sobre un cilindro entre dos centros de tapa con radios
     * (puede variar entre extremos para hacer formas tronco-cónicas). El
     * cilindro se orienta automáticamente entre A y B.
     */
    function seedCylinder(
      target: number[],
      ax: number,
      ay: number,
      az: number,
      bx: number,
      by: number,
      bz: number,
      rA: number,
      rB: number,
      rings: number,
      perRing: number,
    ) {
      const dx = bx - ax;
      const dy = by - ay;
      const dz = bz - az;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 1e-6) return;
      // Eje del cilindro
      const ux = dx / len;
      const uy = dy / len;
      const uz = dz / len;
      // Vector "up" arbitrario que no sea paralelo al eje, para construir
      // base ortogonal en el plano de los anillos.
      const helper =
        Math.abs(uy) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
      const axis = new THREE.Vector3(ux, uy, uz);
      const e1 = new THREE.Vector3().crossVectors(axis, helper).normalize();
      const e2 = new THREE.Vector3().crossVectors(axis, e1).normalize();

      for (let r = 0; r <= rings; r++) {
        const t = r / rings;
        const cx = ax + dx * t;
        const cy = ay + dy * t;
        const cz = az + dz * t;
        const radius = rA + (rB - rA) * t;
        for (let p = 0; p < perRing; p++) {
          const a = (p / perRing) * Math.PI * 2 + (r * 0.07);
          const px = cx + (Math.cos(a) * radius * e1.x + Math.sin(a) * radius * e2.x);
          const py = cy + (Math.cos(a) * radius * e1.y + Math.sin(a) * radius * e2.y);
          const pz = cz + (Math.cos(a) * radius * e1.z + Math.sin(a) * radius * e2.z);
          const j = 0.008;
          target.push(
            px + (Math.random() - 0.5) * j,
            py + (Math.random() - 0.5) * j,
            pz + (Math.random() - 0.5) * j,
          );
        }
      }
    }

    /**
     * Sembra una figura humana completa en el target especificado.
     * Sistema local: pies en (0,0,0), cabeza arriba.
     * Después aplica transformación (rotY + traslación) a cada punto.
     *
     * Proporciones (en unidades-figura, escala 1.0):
     *   - altura total: 2.0
     *   - piernas: 0..0.95
     *   - torso:  0.95..1.55
     *   - cuello: 1.55..1.65
     *   - cabeza: centro 1.80, radio 0.18
     *   - brazos: arrancan en hombros (0,1.5,0) hacia los lados
     */
    function seedHumanInto(target: number[], fig: Figure) {
      // Producimos en un buffer local y luego transformamos.
      const local: number[] = [];
      const keepProb = fig.density ?? 1.0;

      // ---- Cabeza
      seedSphere(local, 0, 1.8, 0, 0.18, HEAD_POINTS);

      // ---- Cuello (cilindro corto)
      seedCylinder(local, 0, 1.55, 0, 0, 1.65, 0, 0.07, 0.07, 4, 10);

      // ---- Torso (tronco más ancho arriba que abajo)
      seedCylinder(
        local,
        0,
        0.95,
        0,
        0,
        1.55,
        0,
        0.18,
        0.22,
        TORSO_RINGS,
        TORSO_PER_RING,
      );

      // ---- Caderas (transición de torso a piernas)
      seedCylinder(local, 0, 0.85, 0, 0, 0.95, 0, 0.2, 0.18, 4, 14);

      // ---- Piernas: dos cilindros verticales, ligeramente separadas
      seedCylinder(
        local,
        -0.09,
        0.85,
        0,
        -0.09,
        0,
        0,
        0.09,
        0.07,
        LIMB_RINGS,
        LIMB_PER_RING,
      );
      seedCylinder(
        local,
        0.09,
        0.85,
        0,
        0.09,
        0,
        0,
        0.09,
        0.07,
        LIMB_RINGS,
        LIMB_PER_RING,
      );

      // ---- Brazos: del hombro hacia abajo, con un poquito de ángulo afuera
      // Hombro izquierdo (en sistema local):
      seedCylinder(
        local,
        -0.22,
        1.5,
        0,
        -0.34,
        0.85,
        0.04,
        0.07,
        0.06,
        LIMB_RINGS,
        LIMB_PER_RING,
      );
      // Brazo derecho — la figura highlight cruza el brazo levemente al frente
      // para sugerir gesto. Las demás, simétricas.
      const rArmEndX = fig.highlight ? 0.18 : 0.34;
      const rArmEndZ = fig.highlight ? 0.18 : 0.04;
      seedCylinder(
        local,
        0.22,
        1.5,
        0,
        rArmEndX,
        0.85,
        rArmEndZ,
        0.07,
        0.06,
        LIMB_RINGS,
        LIMB_PER_RING,
      );

      // ---- Aplicar transformación: rotY en local, escala, traslación
      const cos = Math.cos(fig.rotY);
      const sin = Math.sin(fig.rotY);
      for (let i = 0; i < local.length; i += 3) {
        // Filtro por densidad (saltar partículas aleatoriamente)
        if (keepProb < 1.0 && Math.random() > keepProb) continue;
        const lx = local[i];
        const ly = local[i + 1];
        const lz = local[i + 2];
        // rotación Y
        const rx = lx * cos + lz * sin;
        const rz = -lx * sin + lz * cos;
        // escala + traslación
        const wx = rx * fig.scale + fig.x;
        const wy = ly * fig.scale;
        const wz = rz * fig.scale + fig.z;
        target.push(wx, wy, wz);
      }
    }

    // Sembrar todas las figuras
    for (const fig of figures) {
      seedHumanInto(
        fig.highlight ? positionsHighlight : positionsRegular,
        fig,
      );
    }

    // ---- Suelo: línea fina debajo del grupo + sub-suelo disperso
    {
      const sub: number[] = [];
      const groundY = 0;
      // Línea
      const tickCount = isMobile ? 30 : 60;
      for (let i = 0; i <= tickCount; i++) {
        const x = -3 + (i / tickCount) * 6;
        sub.push(x, groundY, 0);
      }
      // Disperso
      for (let i = 0; i < (isMobile ? 50 : 110); i++) {
        const x = (Math.random() - 0.5) * 6;
        const z = (Math.random() - 0.5) * 2.4;
        sub.push(x, groundY - 0.02 + Math.random() * 0.05, z);
      }
      positionsRegular.push(...sub);
    }

    // ============================================================
    // Crear los dos Points (regular + destacada) compartiendo física
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
        size: isMobile ? 0.028 : 0.022,
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

    // Rotación leve de toda la escena para 3D
    scene.rotation.y = -0.06;

    // ============================================================
    // Cursor (idéntico al skyline / bar chart)
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
    const radius = 0.85;
    const radiusSq = radius * radius;
    const repelStrength = reduceMotion ? 0 : 0.32;
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
