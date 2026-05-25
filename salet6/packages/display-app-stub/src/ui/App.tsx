import { useEffect, useRef, useState } from 'react';
import type { DrinkProfile } from '@salet/shared';
import { AnimationDispatcher } from '../engine/AnimationDispatcher.js';
import { pickRandom } from '../engine/random.js';
import { CANVAS_SIZE } from '../engine/constants.js';
import { PixiRuntime } from '../pixi/PixiRuntime.js';
import { fallbackDrinks } from '../types/fallbackDrinks.js';
import { useThemeStore } from '../state/themeStore.js';
import { initRuntimeBridgeClient } from '../bridge/runtimeBridgeClient.js';

const REMOVE_RADIUS = 90;

interface ActiveCoaster {
  id: string;
  x: number;
  y: number;
  drinkId: string;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function App(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const nextCoasterIdRef = useRef(1);
  const activeCoastersRef = useRef<ActiveCoaster[]>([]);
  const themeStoreApiRef = useRef(useThemeStore);
  const [bridgeStatus, setBridgeStatus] = useState('connecting');
  const [lastEvent, setLastEvent] = useState('Waiting for APPLY_THEME. Click on the table to place coasters.');
  const [coasterCount, setCoasterCount] = useState(0);

  useEffect(() => {
    const dispatcher = new AnimationDispatcher((drinkId) => {
      return themeStoreApiRef.current.getState().getDrinkById(drinkId) ?? fallbackDrinks.find((d) => d.id === drinkId);
    });

    const host = hostRef.current;
    if (!host) return;

    const runtime = new PixiRuntime(host, dispatcher);
    let cancelled = false;
    let pixiReady = false;
    let wsOpen = false;

    // Send RUNTIME_READY only after both Pixi is initialised AND WS is open.
    // Either can win the race; the second one to arrive triggers the send.
    const tryRuntimeReady = () => {
      if (pixiReady && wsOpen && !cancelled) {
        bridgeClient.sendRuntimeReady(true);
      }
    };

    const bridgeClient = initRuntimeBridgeClient({
      onTheme: (pkg) => {
        // Full session reset so a second APPLY_THEME does not leave stale coasters/sprites.
        runtime.reset();
        dispatcher.reset();
        activeCoastersRef.current = [];
        nextCoasterIdRef.current = 1;
        setCoasterCount(0);
        themeStoreApiRef.current.getState().applyTheme(pkg);
        dispatcher.setThemePackage(pkg);
        setLastEvent(`Theme applied: ${pkg.drinkProfiles.length} drinks loaded from Salet6.`);
      },
      onStatus: (status) => {
        setBridgeStatus(status);
        if (status === 'connected') {
          wsOpen = true;
          tryRuntimeReady();
        }
      },
    });

    void runtime.init().then(() => {
      if (!cancelled) {
        pixiReady = true;
        tryRuntimeReady();
      }
    });

    const handlePointerDown = (event: PointerEvent): void => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE;
      const y = ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE;

      const existing = activeCoastersRef.current.find((coaster) => dist(coaster, { x, y }) <= REMOVE_RADIUS);
      if (existing) {
        dispatcher.onCoasterRemoved(existing.id);
        activeCoastersRef.current = activeCoastersRef.current.filter((coaster) => coaster.id !== existing.id);
        setCoasterCount(activeCoastersRef.current.length);
        setLastEvent(`Removed ${existing.id}.`);
        return;
      }

      const drinks = themeStoreApiRef.current.getState().themePackage?.drinkProfiles ?? fallbackDrinks;
      const picked = pickRandom(drinks);
      if (!picked) return;

      const coasterId = `c${nextCoasterIdRef.current++}`;
      dispatcher.assignDrink(coasterId, picked.id);
      dispatcher.onCoasterConfirmed(coasterId, { x, y });
      activeCoastersRef.current.push({ id: coasterId, x, y, drinkId: picked.id });
      setCoasterCount(activeCoastersRef.current.length);
      setLastEvent(`Placed ${coasterId} at (${Math.round(x)}, ${Math.round(y)}) with random drink ${picked.name}.`);
    };

    host.addEventListener('pointerdown', handlePointerDown);

    return () => {
      cancelled = true;
      pixiReady = false;
      wsOpen = false;
      host.removeEventListener('pointerdown', handlePointerDown);
      bridgeClient.close();
      runtime.destroy();
    };
  }, []);

  const activeTheme = useThemeStore((s) => s.themePackage);
  const drinkSourceLabel = activeTheme ? 'theme package' : 'fallback list';
  const drinkCount = activeTheme?.drinkProfiles.length ?? fallbackDrinks.length;

  return (
    <main className="app-root">
      <div className="runtime-host" ref={hostRef} />
      <section className="hud">
        <h1>Tales9 Display Stub - Coaster Dispatch Only</h1>
        <p>Bridge: {bridgeStatus}</p>
        <p>Drink source: {drinkSourceLabel} ({drinkCount} drinks)</p>
        <p>Active coasters: {coasterCount}</p>
        <p>{lastEvent}</p>
      </section>
    </main>
  );
}
