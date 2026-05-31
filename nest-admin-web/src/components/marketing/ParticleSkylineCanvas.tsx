"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Skyline de edificios hecho con partículas. Estética editorial:
 *   - Partículas opacas, color tinta (no glow ni additive blending).
 *   - Tamaño y densidad bajos: tienen que verse PARTÍCULAS, no nubes.
 *   - 6 edificios de alturas variadas con ventanas sembradas en la fachada.
 *   - El cursor las repele con un resorte de retorno (igual que antes).
 *
 * Por qué se ve "matte": usamos PointsMaterial con `sizeAttenuation`,
 * `transparent: true` con `opacity` <1 pero **sin** AdditiveBlending. El
 * resultado son puntos discretos que se restan del fondo claro como tinta,
 * no como luz.
 */

interface Props {
  className?: string;
  /** Color de las partículas (CSS hex). Default: tinta editorial. */
  color?: string;
}

export function ParticleSkylineCanvas({
  className,
  color = "#1b1a17",
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
    // Setup escena, cámara, renderer
    // ============================================================
    const scene = new THREE.Scene();

    // Ciudad ancha (~24 unidades). Cámara más lejos y FOV más amplio
    // para abarcarla completa sin recortar los extremos.
    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    // La cámara mira más arriba (lookAt y=4.6) que la cima de los edificios
    // intermedios (h~7.4 con spire), así la ciudad se asienta en la mitad
    // inferior del encuadre y queda más cielo arriba para el copy.
    camera.position.set(0, 4.4, 16);
    camera.lookAt(0, 4.6, -1);

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
    // Geometría: skyline de 6 edificios
    // ============================================================
    /**
     * Definimos los edificios como `{ x, w, d, h }` (centro X, ancho, profundidad,
     * altura). Sembramos partículas en el contorno (aristas) y unas pocas en
     * la fachada para sugerir ventanas sin saturar.
     */
    interface Building {
      x: number; // centro X
      z: number; // centro Z (profundidad — negativo = más lejos)
      w: number; // ancho
      d: number; // profundidad
      h: number; // altura
      /** Si tiene antena/spire delgado en el techo. */
      spire?: number;
      /** Densidad relativa: 1.0 normal, <1 reduce partículas (lejanía). */
      density?: number;
    }

    /**
     * Composición intencional de la ciudad. Compuesta a mano para tener
     * ritmo real: torres delgadas, bloques medianos, comercial bajo y un
     * rascacielos dominante. Z negativo = más lejos.
     *
     * La ciudad ocupa de x ≈ -12 a +12 (24 unidades) para llenar el ancho
     * del hero como fondo inmersivo.
     */
    const buildings: Building[] = [
      // ========== CAPA DE FONDO (z = -3.4 a -4.2, densidad 0.5-0.6) ==========
      // Llenan el horizonte; los extremos (más alejados de cámara) tienen
      // densidad aún más baja para difuminar visualmente los bordes.
      { x: -11.8, z: -3.6, w: 1.0, d: 0.9, h: 3.4, density: 0.45 },
      { x: -10.0, z: -3.8, w: 1.2, d: 1.0, h: 4.6, spire: 0.7, density: 0.5 },
      { x: -7.8, z: -3.5, w: 1.0, d: 1.0, h: 5.2, density: 0.55 },
      { x: -5.7, z: -3.7, w: 1.3, d: 1.1, h: 6.0, spire: 0.9, density: 0.55 },
      { x: -3.4, z: -3.9, w: 1.5, d: 1.2, h: 4.0, density: 0.55 },
      { x: -1.0, z: -4.1, w: 1.1, d: 1.1, h: 6.6, spire: 1.2, density: 0.6 },
      { x: 1.4, z: -3.7, w: 1.3, d: 1.1, h: 5.0, density: 0.55 },
      { x: 3.6, z: -3.8, w: 1.6, d: 1.2, h: 3.8, density: 0.55 },
      { x: 5.8, z: -3.6, w: 1.0, d: 1.0, h: 4.8, spire: 0.7, density: 0.55 },
      { x: 7.9, z: -3.7, w: 1.2, d: 1.1, h: 5.4, density: 0.5 },
      { x: 10.1, z: -3.8, w: 1.1, d: 1.0, h: 4.2, spire: 0.6, density: 0.5 },
      { x: 12.0, z: -3.5, w: 1.0, d: 0.9, h: 3.6, density: 0.45 },

      // ============ CAPA INTERMEDIA (z ≈ -1.3 a -1.6) ============
      // Ritmo principal del skyline, w/h variados para evitar uniformidad.
      { x: -10.6, z: -1.4, w: 1.3, d: 1.3, h: 2.6 },
      { x: -8.6, z: -1.5, w: 1.4, d: 1.3, h: 4.4, spire: 0.8 },
      { x: -6.4, z: -1.3, w: 1.4, d: 1.4, h: 3.0 },
      { x: -4.3, z: -1.5, w: 1.3, d: 1.3, h: 4.6 },
      { x: -2.4, z: -1.4, w: 1.7, d: 1.5, h: 2.4 },
      { x: 0.4, z: -1.6, w: 1.5, d: 1.5, h: 7.4, spire: 1.4 }, // RASCACIELOS
      { x: 2.6, z: -1.4, w: 1.4, d: 1.4, h: 3.4 },
      { x: 4.6, z: -1.5, w: 1.2, d: 1.2, h: 5.0, spire: 1.0 },
      { x: 6.6, z: -1.3, w: 1.5, d: 1.4, h: 2.8 },
      { x: 8.7, z: -1.5, w: 1.3, d: 1.3, h: 4.2 },
      { x: 10.7, z: -1.4, w: 1.4, d: 1.3, h: 3.0, spire: 0.7 },

      // =========== CAPA FRONTAL (z ≈ +0.5 a +0.9) — más cerca ===========
      // Edificios bajos y anchos al frente, no tapan el skyline.
      { x: -10.4, z: 0.5, w: 1.4, d: 1.0, h: 1.6 },
      { x: -7.8, z: 0.7, w: 1.7, d: 1.0, h: 2.0 },
      { x: -5.2, z: 0.6, w: 1.6, d: 1.0, h: 1.8 },
      { x: -2.6, z: 0.8, w: 2.0, d: 1.0, h: 1.4 },
      { x: 1.2, z: 0.6, w: 1.4, d: 1.0, h: 2.1 },
      { x: 3.8, z: 0.7, w: 1.7, d: 1.0, h: 1.6 },
      { x: 6.0, z: 0.5, w: 1.3, d: 1.0, h: 2.4 },
      { x: 8.4, z: 0.7, w: 1.6, d: 1.0, h: 1.5 },
      { x: 10.6, z: 0.5, w: 1.4, d: 1.0, h: 1.9 },
    ];

    const positionsList: number[] = [];

    // Densidad por unidad de longitud / área. Subida significativa para
    // que cada edificio tenga cuerpo, no solo aristas.
    const EDGE_DENSITY = isMobile ? 9 : 16;
    // Partículas por unidad cuadrada en cada fachada — sembrado uniforme
    // (no aleatorio puro) con jitter para que no parezca rejilla.
    const FACADE_DENSITY = isMobile ? 5 : 9;
    // Partículas en el interior del volumen, para sugerir profundidad.
    const VOLUME_DENSITY = isMobile ? 1.0 : 1.8; // por unidad cúbica

    /** Sembrar partículas en una arista 3D entre A y B con jitter mínimo. */
    function seedEdge(
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
        const j = 0.015;
        positionsList.push(
          ax + dx * t + (Math.random() - 0.5) * j,
          ay + dy * t + (Math.random() - 0.5) * j,
          az + dz * t + (Math.random() - 0.5) * j,
        );
      }
    }

    /**
     * Sembrar partículas en una fachada rectangular axis-aligned.
     * `axis` indica qué eje queda fijo (la cara normal). El jitter
     * tangencial evita rejillas perfectas; el normal mete partículas un
     * poco hacia adentro y afuera para que no se vean planas.
     */
    function seedFacade(
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
      // Para una fachada, el área es producto de los DOS ejes que varían.
      let area: number;
      if (axis === "x") area = h * d;
      else if (axis === "y") area = w * d;
      else area = w * h;
      const n = Math.max(8, Math.round(area * FACADE_DENSITY * FACADE_DENSITY));
      for (let i = 0; i < n; i++) {
        const u = Math.random();
        const v = Math.random();
        const jit = 0.012;
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
        positionsList.push(x, y, z);
      }
    }

    /** Sembrar partículas dispersas dentro de un volumen rectangular. */
    function seedVolume(
      x0: number,
      y0: number,
      z0: number,
      x1: number,
      y1: number,
      z1: number,
    ) {
      const w = x1 - x0;
      const h = y1 - y0;
      const d = z1 - z0;
      const vol = Math.abs(w * h * d);
      const n = Math.max(0, Math.round(vol * VOLUME_DENSITY));
      for (let i = 0; i < n; i++) {
        positionsList.push(
          x0 + Math.random() * w,
          y0 + Math.random() * h,
          z0 + Math.random() * d,
        );
      }
    }

    /**
     * Probabilidad de mantener una partícula recién sembrada. Lo usamos para
     * implementar la `density` por-edificio sin reescribir los seeders.
     */
    let keepProb = 1.0;
    const origPushLen = positionsList.length;
    void origPushLen; // referencia para evitar lint quisquilloso

    for (const b of buildings) {
      const x0 = b.x - b.w / 2;
      const x1 = b.x + b.w / 2;
      const z0 = b.z - b.d / 2;
      const z1 = b.z + b.d / 2;
      const y0 = 0;
      const y1 = b.h;
      keepProb = b.density ?? 1.0;

      // Snapshot del cursor de inserción para poder filtrar este edificio.
      const startIdx = positionsList.length;

      // ---- 12 aristas del prisma rectangular
      seedEdge(x0, y0, z0, x1, y0, z0);
      seedEdge(x1, y0, z0, x1, y0, z1);
      seedEdge(x1, y0, z1, x0, y0, z1);
      seedEdge(x0, y0, z1, x0, y0, z0);
      seedEdge(x0, y1, z0, x1, y1, z0);
      seedEdge(x1, y1, z0, x1, y1, z1);
      seedEdge(x1, y1, z1, x0, y1, z1);
      seedEdge(x0, y1, z0, x0, y1, z1);
      seedEdge(x0, y0, z0, x0, y1, z0);
      seedEdge(x1, y0, z0, x1, y1, z0);
      seedEdge(x1, y0, z1, x1, y1, z1);
      seedEdge(x0, y0, z1, x0, y1, z1);

      // ---- 4 fachadas + techo
      seedFacade(x0, y0, z1, x1, y1, z1, "z");
      seedFacade(x0, y0, z0, x1, y1, z0, "z");
      seedFacade(x0, y0, z0, x0, y1, z1, "x");
      seedFacade(x1, y0, z0, x1, y1, z1, "x");
      seedFacade(x0, y1, z0, x1, y1, z1, "y");

      // ---- Volumen interior
      seedVolume(x0 + 0.1, y0 + 0.1, z0 + 0.1, x1 - 0.1, y1 - 0.1, z1 - 0.1);

      // ---- Antena/spire vertical (solo en edificios marcados con `spire`)
      if (b.spire) {
        const sx = b.x;
        const sz = b.z;
        seedEdge(sx, y1, sz, sx, y1 + b.spire, sz);
      }

      // Aplicar densidad relativa filtrando aleatoriamente las partículas de
      // este edificio. Más eficiente que reescribir cada seeder.
      if (keepProb < 1.0) {
        const filtered: number[] = [];
        for (let i = startIdx; i < positionsList.length; i += 3) {
          if (Math.random() < keepProb) {
            filtered.push(
              positionsList[i],
              positionsList[i + 1],
              positionsList[i + 2],
            );
          }
        }
        positionsList.length = startIdx;
        positionsList.push(...filtered);
      }
    }

    // Suelo: línea de referencia bajo todos los edificios.
    seedEdge(-14, 0, 0, 14, 0, 0);
    // Sub-suelo disperso para anclar visualmente.
    for (let i = 0; i < (isMobile ? 140 : 280); i++) {
      const x = (Math.random() - 0.5) * 28;
      const z = (Math.random() - 0.5) * 7;
      positionsList.push(x, -0.04 + Math.random() * 0.06, z);
    }

    const positions = new Float32Array(positionsList);
    const totalCount = positions.length / 3;

    // basePositions = copia del estado inicial (origen al que vuelven)
    const basePositions = new Float32Array(positions);
    const velocities = new Float32Array(totalCount * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
    );

    // ============================================================
    // Material — PointsMaterial matte, NO additive
    // ============================================================
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      // Partículas algo más chicas que antes (más densidad → menos tamaño
      // por punto evita que se vea pastoso). Pero seguimos en mundo, no glow.
      size: isMobile ? 0.034 : 0.028,
      sizeAttenuation: true,
      transparent: true,
      // Bajamos opacidad porque ahora hay muchas más; con 0.85 cada
      // edificio se vería casi sólido. 0.65 deja sentir las partículas.
      opacity: 0.7,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    // Rotación leve para que se vea perspectiva, no fachada plana
    points.rotation.y = -0.08;
    scene.add(points);

    // ============================================================
    // Cursor — repulsión con resorte de retorno
    // ============================================================
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2(-10, -10);
    // Plano vertical en z=0 (cara visible de los edificios)
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
    const onMouseLeave = () => clearCursor();
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) updateCursor(t.clientX, t.clientY);
    };

    // Listeners en window/container — no en el canvas, para que el cursor
    // afecte aunque pase encima del copy (el copy tiene pointer-events:none).
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", clearCursor);
    container.addEventListener("mouseleave", onMouseLeave);

    // ============================================================
    // Resize
    // ============================================================
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ============================================================
    // Visibilidad: pausar cuando offscreen
    // ============================================================
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        visible = e.isIntersecting;
      },
      { threshold: 0.05 },
    );
    io.observe(container);

    // ============================================================
    // Loop
    // ============================================================
    const positionAttr = geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const radius = 1.1;
    const radiusSq = radius * radius;
    const repelStrength = reduceMotion ? 0 : 0.35;
    const springK = 0.02;
    const damping = 0.84;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      // Cursor en espacio local (porque points está rotado)
      const inv = new THREE.Matrix4().copy(points.matrixWorld).invert();
      const localCursor = cursorPoint.clone().applyMatrix4(inv);

      // Bounding box de "influencia" del cursor en mundo local — fuera de
      // este rango ni siquiera calculamos repulsión. Con muchas partículas
      // (skyline denso) este corte temprano vale la pena.
      const cx = localCursor.x;
      const cy = localCursor.y;
      const cz = localCursor.z;
      const cursorActive = cx < 9000;

      // Umbral cuadrático para considerar que una partícula está "en reposo"
      // (cerca de su origen, con velocidad mínima). Saltamos los que están
      // quietos para no escribir 0 sobre 0 todos los frames.
      const REST_THRESH_SQ = 0.0002;

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

        // Skip de partículas en reposo (cuando además el cursor está lejos).
        if (
          !cursorActive &&
          offSq < REST_THRESH_SQ &&
          vSq < REST_THRESH_SQ
        ) {
          continue;
        }

        // Resorte hacia origen
        vx += offX * springK;
        vy += offY * springK;
        vz += offZ * springK;

        // Repulsión por cursor (solo si el cursor está activo)
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
      positionAttr.needsUpdate = true;

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
      container.removeEventListener("mouseleave", onMouseLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [color]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
