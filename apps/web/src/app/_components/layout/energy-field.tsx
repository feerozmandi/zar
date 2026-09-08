"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * پس‌زمینه‌ی WebGL «میدان انرژی» — هویت بصری مینیمال ۳بعدی پلتفرم.
 * صحنه: هسته‌ی بیست‌وجهی سیم‌دار (فیروزه‌ای برق) + حلقه‌ی مداری آبی +
 * ذرات کهربایی (جرقه) و خطوط اتصال کمرنگ. حرکت کمرمق با موس، بدون هم‌پوشانی
 * روی محتوا (pointer-events: none در والد). با کاهش حرکت سیستم متوقف می‌شود.
 */
export function EnergyField() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animationId = 0;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const build = () => {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
      camera.position.set(0, 0.5, 26);

      const core = new THREE.Group();
      const icosa = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(4.6, 1)),
        new THREE.LineBasicMaterial({ color: 0x1fe0d3, transparent: true, opacity: 0.5 }),
      );
      const inner = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.9, 1)),
        new THREE.LineBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.35 }),
      );
      const orbit = new THREE.LineSegments(
        new THREE.TorusGeometry(7.4, 0.045, 1, 140),
        new THREE.LineBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: 0.28 }),
      );
      orbit.rotation.set(Math.PI / 2.15, 0.4, 0);
      core.add(icosa, inner, orbit);
      scene.add(core);

      // ذرات کهربایی (جرقه)
      const sparkCount = Math.min(460, Math.floor((window.innerWidth * window.innerHeight) / 4200));
      const sparkData: Array<[number, number, number]> = [];
      for (let i = 0; i < sparkCount; i++) {
        sparkData.push([(Math.random() - 0.5) * 48, (Math.random() - 0.5) * 32, (Math.random() - 0.5) * 28]);
      }
      const positions = new Float32Array(sparkData.flat());
      const sparks = new THREE.Points(
        new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3)),
        new THREE.PointsMaterial({
          color: 0xffb224,
          size: 0.22,
          transparent: true,
          opacity: 0.75,
        }),
      );
      scene.add(sparks);

      // خطوط اتصال کمرنگ میان ذرات نزدیک (شبیه مسیر جریان)
      const links: number[] = [];
      for (let i = 0; i < sparkData.length; i++) {
        const point = sparkData[i];
        if (!point) continue;
        const [ix, iy, iz] = point;
        for (let j = i + 1; j < Math.min(sparkData.length, i + 18); j++) {
          const other = sparkData[j];
          if (!other) continue;
          const [jx, jy, jz] = other;
          const dx = ix - jx;
          const dy = iy - jy;
          const dz = iz - jz;
          if (dx * dx + dy * dy + dz * dz < 9 && Math.random() < 0.12) {
            links.push(ix, iy, iz, jx, jy, jz);
          }
        }
      }
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(links, 3));
      const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({ color: 0x1fe0d3, transparent: true, opacity: 0.1 }),
      );
      scene.add(lines);

      const pointer = { x: 0, y: 0 };
      const onPointer = (e: PointerEvent) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer?.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize, { passive: true });

      const clock = new THREE.Clock();
      const tick = () => {
        const t = clock.getElapsedTime();
        core.rotation.y = t * 0.16;
        core.rotation.x = Math.sin(t * 0.1) * 0.25;
        orbit.rotation.z = t * 0.1;
        sparks.rotation.y = t * 0.03;
        lines.rotation.y = t * 0.03;
        camera.position.x += (pointer.x * 2.4 - camera.position.x) * 0.035;
        camera.position.y += (1.2 + pointer.y * 1.6 - camera.position.y) * 0.035;
        camera.lookAt(0, 0, 0);
        renderer?.render(scene, camera);
        animationId = requestAnimationFrame(tick);
      };

      if (reduceMotion) {
        renderer.render(scene, camera);
      } else {
        animationId = requestAnimationFrame(tick);
      }

      return () => {
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(animationId);
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Points) {
            const geo = obj.geometry as THREE.BufferGeometry | undefined;
            geo?.dispose();
          }
        });
        const mats = [icosa.material, inner.material, orbit.material, sparks.material, lines.material];
        for (const m of mats) (m as THREE.Material | undefined)?.dispose();
        icosa.geometry?.dispose();
        inner.geometry?.dispose();
        orbit.geometry?.dispose();
        sparks.geometry?.dispose();
        lineGeo.dispose();
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    };

    let dispose: (() => void) | undefined;
    try {
      dispose = build();
    } catch (err) {
      // WebGL در دسترس نیست (قدیمی/محدود) — بدون پس‌زمینه، سایت همچنان کار می‌کند.
      console.warn("EnergyField: WebGL not available", err);
    }

    return () => dispose?.();
  }, []);

  return <div ref={hostRef} className="webgl-backdrop energy-field blueprint-grid" aria-hidden />;
}
