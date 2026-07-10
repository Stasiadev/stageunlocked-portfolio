import { useEffect, useRef, useState } from 'react';

const INTERACTIVE_SELECTOR = 'button, a[href], .project-card';
const HEADING_SELECTOR = 'h1, h2, h3';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const rafId = useRef(null);
  const [hoverState, setHoverState] = useState('default'); // 'default' | 'interactive' | 'heading'
  const [textHover, setTextHover] = useState(false);

  useEffect(() => {
    const handleMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }

      const target = e.target;
      if (target.closest(HEADING_SELECTOR)) {
        setHoverState('heading');
      } else if (target.closest(INTERACTIVE_SELECTOR)) {
        setHoverState('interactive');
      } else {
        setHoverState('default');
      }
      setTextHover(window.getComputedStyle(target).cursor === 'text');
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useEffect(() => {
    const lerp = (a, b, n) => a + (b - a) * n;

    const tick = () => {
      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.12);
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.12);
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const ringSize = hoverState === 'heading' ? 72 : hoverState === 'interactive' ? 56 : 36;
  const ringBackground = hoverState === 'heading'
    ? 'rgba(123,45,190,0.15)'
    : hoverState === 'interactive'
    ? 'rgba(212,23,138,0.15)'
    : 'transparent';
  const ringBorderColor = hoverState !== 'default' ? '#D4178A' : 'rgba(212,23,138,0.35)';

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#D4178A',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: textHover ? 0 : 1,
          transition: 'opacity 0.15s ease',
          willChange: 'transform',
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: ringSize,
          height: ringSize,
          borderRadius: '50%',
          background: ringBackground,
          border: `1px solid ${ringBorderColor}`,
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'width 0.2s ease, height 0.2s ease, background 0.2s ease, border-color 0.2s ease',
          willChange: 'transform',
        }}
      />
    </>
  );
}
