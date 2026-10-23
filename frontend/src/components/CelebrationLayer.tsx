// Transparent layer over the screen while a celebration plays (hooks/useCelebration): any tap skips it.
// children: what celebrates on top of it (Kulka, confetti). Skips on click (not pointerdown), so the tap
// can't land on the next screen; clicks never reach the page underneath.
export default function CelebrationLayer({ onSkip, children }: { onSkip: () => void; children?: React.ReactNode }) {
  return (
    <>
      <div className="celebrate-layer" aria-hidden="true" onClick={onSkip} />
      {children}
    </>
  );
}
