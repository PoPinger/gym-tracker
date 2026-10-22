// Kulka on the "Utwórz plan" stepper: runs in from the left onto the active step bubble,
// and on every step change runs along to the new bubble, skidding to a stop.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Mascot, { type MascotState } from './Mascot';

const SIZE = 36;
const RUN_MS = 700; // matches the .m-stepper transition
const SKID_MS = 320;

// Rendered inside the .steps row, which it measures
export default function StepperMascot({ step }: { step: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [shownStep, setShownStep] = useState(step);
  const [mode, setMode] = useState<MascotState>('idle');
  const placed = useRef(false);

  // A new step starts the run (state adjusted during render, React's pattern for reacting to a prop change)
  if (shownStep !== step) { setShownStep(step); setMode('run'); }

  // Stand centred on the active bubble; the first placement is instant (the entrance animates it)
  useLayoutEffect(() => {
    const wrap = wrapRef.current, steps = wrap?.parentElement;
    const bubble = steps?.querySelector<HTMLElement>('.step-bubble.active');
    if (!wrap || !steps || !bubble) return;
    const x = bubble.getBoundingClientRect().left - steps.getBoundingClientRect().left + bubble.offsetWidth / 2 - SIZE / 2;
    if (!placed.current) { wrap.style.transition = 'none'; placed.current = true; } else wrap.style.transition = '';
    wrap.style.transform = `translateX(${Math.round(x)}px)`;
  }, [step]);

  useEffect(() => {
    if (mode === 'run') { const t = window.setTimeout(() => setMode('skid'), RUN_MS); return () => window.clearTimeout(t); }
    if (mode === 'skid') { const t = window.setTimeout(() => setMode('idle'), SKID_MS); return () => window.clearTimeout(t); }
  }, [mode, shownStep]);

  return (
    <div ref={wrapRef} className="m-stepper">
      <Mascot entrance="run" size={SIZE} state={mode} />
    </div>
  );
}
