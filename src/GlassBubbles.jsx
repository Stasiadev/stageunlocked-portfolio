const BUBBLES = [
  { size: 120, left: 8,  top: 15, duration: 18, delay: 0,   anim: 'bubbleFloat1' },
  { size: 60,  left: 22, top: 70, duration: 22, delay: 3,   anim: 'bubbleFloat2' },
  { size: 90,  left: 75, top: 20, duration: 16, delay: 1,   anim: 'bubbleFloat3' },
  { size: 45,  left: 90, top: 55, duration: 24, delay: 5,   anim: 'bubbleFloat1' },
  { size: 80,  left: 45, top: 85, duration: 20, delay: 2,   anim: 'bubbleFloat2' },
  { size: 110, left: 15, top: 45, duration: 19, delay: 4,   anim: 'bubbleFloat3' },
  { size: 50,  left: 60, top: 10, duration: 23, delay: 1.5, anim: 'bubbleFloat1' },
  { size: 70,  left: 85, top: 75, duration: 17, delay: 6,   anim: 'bubbleFloat2' },
  { size: 40,  left: 35, top: 30, duration: 21, delay: 3.5, anim: 'bubbleFloat3' },
  { size: 95,  left: 55, top: 60, duration: 25, delay: 0.5, anim: 'bubbleFloat1' },
  { size: 55,  left: 5,  top: 88, duration: 18, delay: 7,   anim: 'bubbleFloat2' },
  { size: 75,  left: 78, top: 40, duration: 22, delay: 2.5, anim: 'bubbleFloat3' },
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
            zIndex: 0,
            animation: `${b.anim} ${b.duration}s ease-in-out infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </>
  );
}
