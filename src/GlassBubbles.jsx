const BUBBLES = [
  { size: 55, left: 8,  top: 15, delay: 0,   animation: 'bubbleFloat1 18s ease-in-out infinite' },
  { size: 42, left: 75, top: 20, delay: 1,   animation: 'bubbleFloat3 16s ease-in-out infinite' },
  { size: 20, left: 90, top: 55, delay: 5,   animation: 'bubbleFloat1 24s ease-in-out infinite' },
  { size: 38, left: 45, top: 85, delay: 2,   animation: 'bubbleFloat2 20s ease-in-out infinite' },
  { size: 28, left: 60, top: 10, delay: 1.5, animation: 'bubbleFloat1 23s ease-in-out infinite' },
  { size: 20, left: 35, top: 30, delay: 3.5, animation: 'bubbleFloat3 21s ease-in-out infinite' },
];

export default function GlassBubbles() {
  return (
    <>
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            left: `${b.left}%`,
            top: `${b.top}%`,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 28% 28%,
              rgba(255,255,255,0.35),
              rgba(212,23,138,0.12) 35%,
              rgba(123,45,190,0.18) 60%,
              rgba(99,102,241,0.08) 80%,
              rgba(255,255,255,0.04)
            )`,
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(1px)',
            boxShadow: `
              inset 0 0 24px rgba(255,255,255,0.08),
              inset -4px -4px 12px rgba(212,23,138,0.1),
              0 0 32px rgba(212,23,138,0.06)
            `,
            pointerEvents: 'none',
            zIndex: -1,
            opacity: 0.3,
            animation: b.animation,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </>
  );
}
