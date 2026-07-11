import { useState, useEffect } from 'react'
import CaseStudyModal from './CaseStudyModal.jsx'
import Dashboard from './Dashboard.jsx'
import CustomCursor from './CustomCursor.jsx'
import GlassBubbles from './GlassBubbles.jsx'
import Lenis from '@studio-freight/lenis'

// ── DESIGN TOKENS ────────────────────────────────────────────────
const C = {
  bg: '#07070F',
  card: '#0D0D1C',
  glass: 'rgba(255,255,255,0.035)',
  mg: '#D4178A',
  pu: '#7B2DBE',
  white: '#EEEEF5',
  dim: '#5A5A7A',
  dimLt: '#8A8AAA',
  border: 'rgba(255,255,255,0.07)',
  grad: 'linear-gradient(135deg, #D4178A 0%, #7B2DBE 100%)',
};
const FD = "'Syne', sans-serif";
const FB = "'DM Sans', sans-serif";

const STACK = [
  'React', 'TypeScript', 'Next.js', 'TailwindCSS', 'Claude API',
  'pgvector', 'Supabase', 'PostgreSQL', 'Python', 'Figma',
  'Node.js', 'React Native', 'TensorFlow.js', 'REST APIs', 'Git',
];

const ROLES = [
  'Design Engineer',
  'Frontend Developer',
  'AI/ML Integration Specialist',
  'UX Engineer',
  'Full-Stack Developer',
];

// ── ROLE CYCLE ───────────────────────────────────────────────────
function RoleCycle() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % ROLES.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <p style={{
      fontSize: 'clamp(15px, 2vw, 20px)', color: C.dimLt, marginBottom: 20,
      fontWeight: 300, letterSpacing: 0.5, fontFamily: FB, minHeight: '1.4em',
    }}>
      <span key={index} style={{
        display: 'inline-block',
        animation: 'roleFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      }}>
        {ROLES[index]}
      </span>
    </p>
  );
}

// ── TEXT SCRAMBLE ────────────────────────────────────────────────
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';

function useScramble(text, duration = 900) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const tickMs = 30;
    const totalTicks = Math.round(duration / tickMs);
    let tick = 0;

    const id = setInterval(() => {
      tick++;
      const resolvedCount = Math.floor((tick / totalTicks) * text.length);
      setDisplay(
        text
          .split('')
          .map((ch, i) => {
            if (ch === ' ') return ch;
            return i < resolvedCount
              ? ch
              : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join('')
      );
      if (tick >= totalTicks) {
        setDisplay(text);
        clearInterval(id);
      }
    }, tickMs);

    return () => clearInterval(id);
  }, [text, duration]);

  return display;
}

// ── SCROLL REVEAL ────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ── NAV ──────────────────────────────────────────────────────────
function Nav({ onContact }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '0 clamp(24px, 5vw, 60px)',
      height: 68,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(7,7,15,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px)' : 'none',
      borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
      transition: 'all 0.35s ease',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: FD, fontWeight: 800, fontSize: 17, letterSpacing: 2.5,
        background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        userSelect: 'none'
      }}>
        STAGE UNLOCKED
      </div>

      {/* Desktop nav */}
      <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
        {['About', 'Projects', 'Skills', 'Contact'].map(item => (
          <a key={item} href={`#${item.toLowerCase()}`} className="nav-link"
            style={{
              color: C.dimLt, textDecoration: 'none', fontSize: 14,
              fontWeight: 500, letterSpacing: 0.3, fontFamily: FB
            }}>
            {item}
          </a>
        ))}
        <a href="mailto:Amatadi00@gmail.com" className="btn-primary" style={{
          padding: '9px 22px', borderRadius: 8, textDecoration: 'none',
          background: C.grad, color: '#fff', fontWeight: 600, fontSize: 13,
          fontFamily: FB, boxShadow: '0 4px 16px rgba(212,23,138,0.25)',
        }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            e.currentTarget.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translate(0, 0)';
            e.currentTarget.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
          }}
        >
          Hire Me
        </a>
      </div>
    </nav>
  );
}

// ── HERO ─────────────────────────────────────────────────────────
function Hero() {
  const firstName = useScramble('ANASTASIA');
  const lastName = useScramble('MATADI');

  return (
    <>
    <section style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      position: 'relative', overflow: 'hidden', zIndex: 1,
      padding: 'clamp(100px,12vw,160px) clamp(24px,5vw,100px) 80px',
    }}>
      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', width: 640, height: 640, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,23,138,0.11) 0%, transparent 68%)',
        top: -120, right: -60, pointerEvents: 'none',
        animation: 'float 9s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(123,45,190,0.09) 0%, transparent 68%)',
        bottom: -80, left: -100, pointerEvents: 'none',
        animation: 'floatReverse 11s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,23,138,0.06) 0%, transparent 68%)',
        top: '40%', left: '40%', pointerEvents: 'none',
        animation: 'float 14s ease-in-out infinite',
      }} />

      {/* Content */}
      <div className="hero-grid" style={{
        maxWidth: 1200,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 'clamp(40px, 6vw, 100px)',
        alignItems: 'center',
        animation: 'fadeUp 1s cubic-bezier(0.16,1,0.3,1) forwards',
        position: 'relative',
      }}>
      <div>

        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32,
          padding: '7px 18px', borderRadius: 100,
          border: '1px solid rgba(212,23,138,0.28)',
          background: 'rgba(212,23,138,0.07)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: C.mg,
            animation: 'pulse 2.2s ease infinite', display: 'inline-block'
          }} />
          <span style={{ fontSize: 11, color: C.mg, letterSpacing: 2, fontWeight: 600, fontFamily: FB }}>
            AVAILABLE FOR REMOTE ROLES
          </span>
        </div>

        {/* Name */}
        <h1 style={{
          fontFamily: FD, fontWeight: 800,
          fontSize: 'clamp(56px, 9vw, 104px)',
          lineHeight: 0.95, letterSpacing: -2, marginBottom: 28,
        }}>
          {firstName}
          <br />
          <span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {lastName}
          </span>
        </h1>

        {/* Role */}
        <RoleCycle />

        {/* Tagline */}
        <p style={{
          fontSize: 16, color: C.dim, maxWidth: 500, lineHeight: 1.8,
          marginBottom: 52, fontWeight: 300, fontFamily: FB,
        }}>
          6+ years building responsive, user-centered web applications across
          tech and financial industries. I turn complex requirements into clean,
          performant, intuitive products.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="#projects" className="btn-primary" style={{
            padding: '15px 36px', borderRadius: 10, textDecoration: 'none',
            background: C.grad, color: '#fff', fontWeight: 600, fontSize: 15,
            fontFamily: FB, boxShadow: '0 6px 24px rgba(212,23,138,0.32)',
            display: 'inline-block',
          }}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              e.currentTarget.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
            }}
          >
            View My Work
          </a>
          <a href="#contact" className="btn-outline" style={{
            padding: '15px 36px', borderRadius: 10, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.14)', color: C.white,
            fontWeight: 500, fontSize: 15, fontFamily: FB, display: 'inline-block',
            background: 'transparent',
          }}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left - rect.width / 2;
              const y = e.clientY - rect.top - rect.height / 2;
              e.currentTarget.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
            }}
          >
            Get In Touch
          </a>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 48, marginTop: 64, paddingTop: 40,
          borderTop: `1px solid ${C.border}`
        }}>
          {[
            { num: '6+', label: 'Years Experience' },
            { num: '2', label: 'Industries Served' },
            { num: '100%', label: 'Remote' },
          ].map(s => (
            <div key={s.label}>
              <div style={{
                fontFamily: FD, fontSize: 32, fontWeight: 800,
                background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                {s.num}
              </div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 2, fontWeight: 400 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          gap: 8, marginTop: 48, opacity: 0.4,
        }}>
          <span style={{ fontSize: 10, letterSpacing: 3, color: C.dimLt, fontFamily: FB, fontWeight: 600 }}>
            SCROLL
          </span>
          <div style={{
            width: 1, height: 48, background: C.grad,
            animation: 'scrollPulse 2s ease-in-out infinite',
          }} />
        </div>
      </div>

      {/* Availability card */}
      <div className="hero-card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '28px 24px',
          width: '100%',
          maxWidth: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: 'fadeUp 1.2s cubic-bezier(0.16,1,0.3,1) forwards',
          animationDelay: '0.3s',
          opacity: 0,
        }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 10px #10B981',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700, letterSpacing: 1.5, fontFamily: FB }}>
              AVAILABLE NOW
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Details */}
          {[
            { label: 'Location',      value: 'Atlanta, GA · Remote' },
            { label: 'Response Time', value: '< 24 hours' },
            { label: 'Availability',  value: 'Immediate start' },
            { label: 'Engagement',    value: 'W-2 · 1099 · Contract' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 9, color: '#5A5A7A', letterSpacing: 2, fontWeight: 700, fontFamily: FB, marginBottom: 4 }}>
                {item.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: '#EEEEF5', fontWeight: 500, fontFamily: FB }}>
                {item.value}
              </div>
            </div>
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Stats mini row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            {[['6+', 'Years'], ['15', 'Projects'], ['2', 'Industries']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: FD, fontSize: 20, fontWeight: 800,
                  background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{num}</div>
                <div style={{ fontSize: 10, color: '#5A5A7A', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a href="mailto:Amatadi00@gmail.com" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '11px', borderRadius: 12,
            background: C.grad,
            color: '#fff', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', fontFamily: FB,
            boxShadow: '0 4px 16px rgba(212,23,138,0.28)',
          }}>
            Let's Work Together →
          </a>
        </div>
      </div>
      </div>
    </section>

    {/* Tech stack marquee */}
    <div style={{
      overflow: 'hidden', borderTop: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      padding: '18px 0', background: 'rgba(255,255,255,0.015)',
    }}>
      <div style={{
        display: 'flex', gap: 48, animation: 'marquee 28s linear infinite',
        width: 'max-content',
      }}>
        {[...STACK, ...STACK].map((item, i) => (
          <span key={i} style={{
            fontSize: 13, fontWeight: 600, color: C.dimLt,
            fontFamily: FB, letterSpacing: 0.5, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: C.mg, display: 'inline-block', opacity: 0.7,
            }} />
            {item}
          </span>
        ))}
      </div>
    </div>
    </>
  );
}

// ── ABOUT ────────────────────────────────────────────────────────
function About() {
  return (
    <section id="about" style={{ padding: 'clamp(80px,10vw,130px) clamp(24px,5vw,100px)', position: 'relative', zIndex: 1 }}>
      <div style={{
        position: 'absolute', left: 'clamp(4px,1vw,12px)', top: 32,
        fontSize: 9, fontWeight: 700, color: '#1E1E2E',
        letterSpacing: '0.2em', fontFamily: FB,
        writingMode: 'vertical-rl',
      }}>
        01
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="reveal" style={{
          display: 'grid', gridTemplateColumns: 'clamp(240px,35%,380px) 1fr',
          gap: 'clamp(40px,6vw,100px)', alignItems: 'stretch',
        }}>
          {/* Avatar card */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(212,23,138,0.12), rgba(123,45,190,0.12))',
              border: `1px solid rgba(212,23,138,0.15)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(60px,10vw,90px)',
              position: 'relative', overflow: 'hidden', width: '100%',
              height: '100%', minHeight: '320px'
            }}>
              <img
                src="/photo.stage.png"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 28,
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
              {/* Inner glow */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(circle at 60% 40%, rgba(212,23,138,0.08), transparent 70%)',
              }} />
            </div>
            {/* Badge */}
            <div style={{
              position: 'absolute', bottom: -18, right: -18,
              background: C.grad, borderRadius: 14, padding: '12px 22px',
              fontSize: 13, fontWeight: 700, color: '#fff',
              letterSpacing: 0.3, fontFamily: FD,
              boxShadow: '0 8px 24px rgba(212,23,138,0.35)',
            }}>
              6+ Years in Tech
            </div>
          </div>

          {/* Copy */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
            padding: 'clamp(28px,4vw,48px)',
          }}>
            <p style={{
              fontSize: 11, color: C.mg, letterSpacing: 2.5, marginBottom: 16,
              fontWeight: 700, fontFamily: FB
            }}>
              ABOUT ME
            </p>
            <h2 style={{
              fontFamily: FD, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700,
              lineHeight: 1.15, marginBottom: 24, paddingBottom: 8
            }}>
              Engineer who thinks
              <br />
              <span style={{
                background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                paddingBottom: 8,
                display: 'inline-block'
              }}>
                like a designer
              </span>
            </h2>
            <p style={{ color: C.dim, lineHeight: 1.85, marginBottom: 18, fontWeight: 300, fontSize: 15, fontFamily: FB }}>
              I'm a Software Engineer and UX/UI Designer with 6+ years of experience building
              web applications across tech and financial services. My edge is being equally
              fluent in engineering and design — I can take a product from wireframe to
              production without losing the intent of either.
            </p>
            <p style={{ color: C.dim, lineHeight: 1.85, marginBottom: 36, fontWeight: 300, fontSize: 15, fontFamily: FB }}>
              Currently completing my BS in Computer Science at WGU, building on an MS in
              Computer Science and years of hands-on product development across React,
              Python, Java, and Figma.
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['Remote-First', 'Async-Friendly', 'Full-Time Available', 'W-2 & 1099'].map(tag => (
                <span key={tag} style={{
                  padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
                  border: '1px solid rgba(212,23,138,0.28)', color: C.mg,
                  background: 'rgba(212,23,138,0.07)', fontFamily: FB,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── PROJECTS ─────────────────────────────────────────────────────
function Projects({ onViewDashboard }) {
  const [activeCase, setActiveCase] = useState(null)
  const projects = [
    {
      img: '/screenshots/chromata.png',
      title: 'Chromata',
      span: 'col-span-3',
      desc: 'AI-powered design token generator. Describe a brand or mood and get a complete color palette, typography pairing, and exportable JSON design system instantly.',
      tags: ['React', 'Claude API', 'Design Systems'],
      live: true,
      featured: true,
      bg: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(192,132,252,0.08) 100%)',
      url: '/projects/chromata',
    },
    {
      img: '/screenshots/meridian.png',
      title: 'Meridian',
      span: 'col-span-3',
      desc: 'Financial analytics dashboard with live KPI cards, sparklines, portfolio growth charts, channel breakdown, and top performers table across multiple time ranges.',
      tags: ['React', 'Recharts', 'Enterprise UI'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(30,64,175,0.08) 100%)',
      url: '/projects/meridian',
    },
    {
      img: '/screenshots/forma.png',
      title: 'Forma',
      span: 'col-span-2',
      desc: 'Animated marketing landing page with aurora glassmorphic design, fixed parallax blobs, scroll-triggered count-up stats, and IntersectionObserver card reveals.',
      tags: ['React', 'CSS Animation', 'Landing Page'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(236,72,153,0.08) 100%)',
      url: '/projects/forma',
    },
    {
      img: '/screenshots/altus.png',
      title: 'Altus',
      span: 'col-span-2',
      desc: 'Travel app mobile UI kit featuring three complete iOS screens — home discovery, flight detail booking flow, and a dramatic dark boarding pass with live barcode.',
      tags: ['React', 'Mobile UI', 'Travel'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(99,102,241,0.08) 100%)',
      url: '/projects/altus',
    },
    {
      img: '/screenshots/forge.png',
      title: 'Forge',
      span: 'col-span-2',
      desc: 'AI code review assistant with split-panel IDE layout. Paste any code and get a quality score, severity-categorized issues, and a refactored version with one click.',
      tags: ['React', 'Claude API', 'Developer Tools'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(14,165,233,0.08) 100%)',
      url: '/projects/forge',
    },
    {
      img: '/screenshots/nexus.png',
      title: 'Nexus',
      span: 'col-span-2',
      desc: 'RAG-powered AI knowledge base demonstrating full-stack retrieval augmented generation — document library, vector search simulation, and streamed responses with source citations.',
      tags: ['React', 'Claude API', 'RAG / ML'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(6,95,70,0.08) 100%)',
      url: '/projects/nexus',
    },
    {
      img: '/screenshots/fintrack.png',
      title: 'FINTRACK',
      span: 'col-span-4',
      desc: 'Personal finance portfolio dashboard with fully working five-tab navigation — overview, holdings, analytics, live-searchable transactions, and settings with toggle controls.',
      tags: ['React', 'Recharts', 'Fintech'],
      live: true,
      featured: true,
      bg: 'linear-gradient(135deg, rgba(212,23,138,0.1) 0%, rgba(123,45,190,0.08) 100%)',
      url: '/projects/fintrack',
    },
    {
      img: '/screenshots/lumena.png',
      title: 'Lumena',
      span: 'col-span-2',
      desc: 'PMU artistry studio booking flow — a six-step wizard covering service selection, style technique, artist profiles, calendar scheduling, consultation intake, and confirmation.',
      tags: ['React', 'Multi-step Form', 'Beauty Tech'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(201,168,122,0.1) 0%, rgba(232,180,192,0.08) 100%)',
      url: '/projects/lumena',
    },
    {
      img: '/screenshots/aura.png',
      title: 'Aura',
      span: 'col-span-3',
      desc: 'AI shade matching tool with live camera skin detection, sclera white balance correction, Claude Vision undertone analysis, and real cross-brand product recommendations.',
      tags: ['React', 'Claude Vision', 'Beauty Tech'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(123,45,66,0.1) 0%, rgba(192,132,138,0.08) 100%)',
      url: '/projects/aura',
    },
    {
      img: '/screenshots/flux.png',
      title: 'Flux',
      desc: 'E-commerce product and checkout flow for a beauty brand — product browsing, cart management, and a multi-step checkout with card payment UI.',
      tags: ['React', 'E-Commerce', 'Multi-step'],
      live: true,
      featured: false,
      bg: 'rgba(255,255,255,0.04)',
      url: '/projects/flux',
      span: 'col-span-2',
    },
    {
      img: '/screenshots/pulse.png',
      title: 'Pulse',
      desc: 'Real-time social analytics dashboard with live-updating KPIs, multi-platform comparison, sparklines, and top-performing post tracking.',
      tags: ['React', 'Recharts', 'Live Data'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,78,59,0.06) 100%)',
      url: '/projects/pulse',
      span: 'col-span-2',
    },
    {
      img: '/screenshots/vela.png',
      title: 'Vela',
      desc: 'Travel companion app with trip planning, day-by-day itinerary, booking management, and destination exploration — in a realistic iOS phone frame.',
      tags: ['React', 'Mobile UI', 'Travel'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(30,64,175,0.06) 100%)',
      url: '/projects/vela',
      span: 'col-span-2',
    },
    {
      img: '/screenshots/solara.png',
      title: 'Solara',
      desc: 'Real estate listings platform with property search, debounced filtering, saved listings, map view, and full property detail with agent contact flow.',
      tags: ['React', 'PropTech', 'Full-Stack UI'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.06) 100%)',
      url: '/projects/solara',
      span: 'col-span-3',
    },
    {
      img: '/screenshots/zephyr.png',
      title: 'Zephyr',
      desc: 'HR and people operations platform — employee directory with search and filter, onboarding progress tracker, leave request management, and headcount analytics.',
      tags: ['React', 'HRTech', 'Enterprise SaaS'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(16,185,129,0.06) 100%)',
      url: '/projects/zephyr',
      span: 'col-span-3',
    },
    {
      img: '/screenshots/beacon.png',
      title: 'Beacon',
      desc: 'Restaurant order management system with a live kanban order board, table occupancy grid, menu management, and real-time sales analytics.',
      tags: ['React', 'FoodTech', 'Real-Time'],
      live: true,
      featured: false,
      bg: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(234,179,8,0.06) 100%)',
      url: '/projects/beacon',
      span: 'col-span-2',
    },
  ];

  return (
    <section id="projects" style={{ padding: 'clamp(80px,10vw,130px) clamp(24px,5vw,100px)', position: 'relative', zIndex: 1 }}>
      <div style={{
        position: 'absolute', left: 'clamp(4px,1vw,12px)', top: 32,
        fontSize: 9, fontWeight: 700, color: '#1E1E2E',
        letterSpacing: '0.2em', fontFamily: FB,
        writingMode: 'vertical-rl',
      }}>
        02
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div className="reveal" style={{ marginBottom: 56 }}>
          <p style={{
            fontSize: 11, color: C.mg, letterSpacing: 2.5, marginBottom: 14,
            fontWeight: 700, fontFamily: FB
          }}>
            SELECTED WORK
          </p>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800, lineHeight: 1.1 }}>
            Projects
          </h2>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gridAutoRows: 'minmax(340px, auto)',
          gap: 20,
        }}>
          {projects.map((p, i) => (
            <div
              key={i}
              className={`reveal project-card reveal-d${i} ${p.span}`}
              style={{
                background: p.bg,
                borderRadius: 24,
                padding: 32,
                border: '1px solid rgba(212,23,138,0.15)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                e.currentTarget.style.transform =
                  `perspective(1200px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-6px) scale(1.01)`;
                e.currentTarget.style.borderColor = 'rgba(212,23,138,0.45)';
                e.currentTarget.style.boxShadow =
                  `0 24px 64px rgba(212,23,138,0.22), 0 0 0 1px rgba(212,23,138,0.18),
                   ${x * 20}px ${y * 20}px 40px rgba(123,45,190,0.12)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform =
                  'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
                e.currentTarget.style.borderColor = 'rgba(212,23,138,0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Image */}
              <img
                src={p.img}
                alt={p.title}
                style={{
                  width: '100%',
                  height: p.span === 'col-span-2' ? 180 : 220,
                  borderRadius: 12,
                  objectFit: 'cover',
                  objectPosition: 'top',
                  border: `1px solid ${p.featured ? 'rgba(212,23,138,0.2)' : C.border}`,
                  marginBottom: 22,
                }}
              />

              {/* Featured badge */}
              {p.featured && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginBottom: 16, alignSelf: 'flex-start'
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: C.mg,
                    animation: 'pulse 2s infinite', display: 'inline-block'
                  }} />
                  <span style={{
                    fontSize: 10, color: C.mg, letterSpacing: 1.5,
                    fontWeight: 700, fontFamily: FB
                  }}>LIVE</span>
                </div>
              )}

              <h3 style={{
                fontFamily: FD, fontSize: p.live ? 24 : 20, fontWeight: 700,
                marginBottom: 12, color: p.live ? C.white : C.dim
              }}>
                {p.title}
              </h3>

              <p style={{
                color: C.dim, fontSize: 14, lineHeight: 1.75, flex: 1,
                marginBottom: 24, fontWeight: 300, fontFamily: FB,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {p.desc}
              </p>

              {/* Tags */}
              {p.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {p.tags.map(tag => (
                    <span key={tag} style={{
                      padding: '4px 13px', borderRadius: 100, fontSize: 11, fontWeight: 500,
                      background: 'rgba(255,255,255,0.06)', color: C.dimLt, fontFamily: FB,
                    }}>{tag}</span>
                  ))}
                </div>
              )}

              {/* CTA */}
              {p.live ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start' }}>
                  <button onClick={() => window.open(p.url, '_blank')} style={{
                    background: C.grad, border: 'none', borderRadius: 10,
                    padding: '12px 24px', color: '#fff', fontWeight: 600,
                    fontSize: 14, cursor: 'pointer', fontFamily: FB,
                    boxShadow: '0 4px 16px rgba(212,23,138,0.28)',
                    transition: 'opacity 0.2s',
                  }}>
                    View Live Demo →
                  </button>
                  <button
                    onClick={() => setActiveCase(p)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      padding: '12px 24px',
                      color: C.dimLt,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      fontFamily: FB,
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = C.mg
                      e.currentTarget.style.color = C.white
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = C.border
                      e.currentTarget.style.color = C.dimLt
                    }}
                  >
                    Case Study →
                  </button>
                </div>
              ) : (
                <span style={{
                  fontSize: 11, color: C.dim, letterSpacing: 1.5,
                  fontWeight: 600, fontFamily: FB
                }}>
                  IN PROGRESS
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {activeCase && (
        <CaseStudyModal
          project={activeCase}
          onClose={() => setActiveCase(null)}
        />
      )}
    </section>
  );
}

// ── SKILLS ───────────────────────────────────────────────────────
function Skills() {
  const cats = [
    { label: 'Languages', items: ['JavaScript (ES6+)', 'TypeScript', 'Python', 'Java', 'HTML5', 'CSS3', 'SQL'] },
    { label: 'Frameworks & Libraries', items: ['React', 'Next.js', 'TailwindCSS', 'AngularJS', 'shadcn/ui', 'REST APIs', 'Node.js'] },
    { label: 'Design & UX', items: ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'Design Systems', 'Responsive Design'] },
    { label: 'Tools & Practices', items: ['AWS', 'Docker', 'Git', 'Prisma', 'PostgreSQL', 'WordPress', 'Agile / Scrum', 'Performance Optimization', 'Cross-browser Testing'] },
  ];

  const catColors = {
    'Languages':              '#D4178A',
    'Frameworks & Libraries': '#7B2DBE',
    'Design & UX':            '#6366F1',
    'Tools & Practices':      '#0EA5E9',
  };

  return (
    <section id="skills" style={{ padding: 'clamp(80px,10vw,130px) clamp(24px,5vw,100px)', position: 'relative', zIndex: 1 }}>
      <div style={{
        position: 'absolute', left: 'clamp(4px,1vw,12px)', top: 32,
        fontSize: 9, fontWeight: 700, color: '#1E1E2E',
        letterSpacing: '0.2em', fontFamily: FB,
        writingMode: 'vertical-rl',
      }}>
        03
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="reveal" style={{ marginBottom: 56 }}>
          <p style={{
            fontSize: 11, color: C.mg, letterSpacing: 2.5, marginBottom: 14,
            fontWeight: 700, fontFamily: FB
          }}>
            TECH STACK
          </p>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(36px,5vw,56px)', fontWeight: 800 }}>
            Skills
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 40 }}>
          {cats.map((cat, i) => (
            <div key={i} className={`reveal reveal-d${i % 3}`} style={{
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid rgba(255,255,255,0.06)`,
              borderLeft: `3px solid ${catColors[cat.label]}`,
              borderRadius: 16,
              padding: '28px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: catColors[cat.label],
                  boxShadow: `0 0 12px ${catColors[cat.label]}`,
                }} />
                <p style={{
                  fontSize: 11, color: catColors[cat.label],
                  letterSpacing: 2, fontWeight: 700,
                  fontFamily: FB, margin: 0,
                }}>
                  {cat.label.toUpperCase()}
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {cat.items.map(item => (
                  <span key={item} className="skill-pill" style={{
                    padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    background: `${catColors[cat.label]}10`,
                    color: C.white,
                    border: `1px solid ${catColors[cat.label]}25`,
                    fontFamily: FB,
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CONTACT ──────────────────────────────────────────────────────
function Contact() {
  return (
    <section id="contact" style={{ padding: 'clamp(80px,10vw,130px) clamp(24px,5vw,100px)', position: 'relative', zIndex: 1 }}>
      <div style={{
        position: 'absolute', left: 'clamp(4px,1vw,12px)', top: 32,
        fontSize: 9, fontWeight: 700, color: '#1E1E2E',
        letterSpacing: '0.2em', fontFamily: FB,
        writingMode: 'vertical-rl',
      }}>
        04
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="reveal" style={{
          background: 'linear-gradient(135deg, rgba(212,23,138,0.07) 0%, rgba(123,45,190,0.07) 100%)',
          border: '1px solid rgba(212,23,138,0.18)',
          borderRadius: 36, padding: 'clamp(48px,7vw,96px) clamp(32px,6vw,80px)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,23,138,0.08), transparent 70%)',
            top: -100, right: -100, pointerEvents: 'none',
          }} />

          <p style={{
            fontSize: 11, color: C.mg, letterSpacing: 2.5, marginBottom: 16,
            fontWeight: 700, fontFamily: FB
          }}>
            CONTACT
          </p>
          <h2 style={{
            fontFamily: FD, fontWeight: 800,
            fontSize: 'clamp(40px,6vw,68px)', lineHeight: 1.1, marginBottom: 20
          }}>
            Let's Build
            <br />
            <span style={{ background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Something Great
            </span>
          </h2>
          <p style={{
            color: C.dim, fontSize: 15, fontWeight: 300, maxWidth: 440,
            margin: '0 auto 52px', lineHeight: 1.7, fontFamily: FB
          }}>
            Available for remote full-time positions.
            Open to W-2 and 1099 engagements.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:Amatadi00@gmail.com" className="btn-primary" style={{
              padding: '16px 44px', borderRadius: 12, textDecoration: 'none',
              background: C.grad, color: '#fff', fontWeight: 700, fontSize: 15,
              fontFamily: FB, boxShadow: '0 6px 28px rgba(212,23,138,0.35)',
              display: 'inline-block',
            }}
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                e.currentTarget.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translate(0, 0)';
                e.currentTarget.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
              }}
            >
              Email Me
            </a>
            <a href="https://www.linkedin.com/in/anastasia-m-916350356/"
              target="_blank" rel="noreferrer"
              className="btn-outline" style={{
                padding: '16px 44px', borderRadius: 12, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.14)', color: C.white,
                fontWeight: 500, fontSize: 15, fontFamily: FB, display: 'inline-block',
                background: 'transparent',
              }}
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                e.currentTarget.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translate(0, 0)';
                e.currentTarget.style.transition = 'transform 0.6s cubic-bezier(0.22,1,0.36,1)';
              }}
            >
              LinkedIn ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      padding: '28px clamp(24px,5vw,100px)',
      borderTop: `1px solid ${C.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 16,
    }}>
      <span style={{
        fontFamily: FD, fontWeight: 800, fontSize: 15, letterSpacing: 2,
        background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
      }}>
        STAGE UNLOCKED
      </span>
      <span style={{ color: C.dim, fontSize: 13, fontFamily: FB }}>
        © 2026 Anastasia Matadi · All rights reserved.
      </span>
    </footer>
  );
}

// ── ROOT ─────────────────────────────────────────────────────────
export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  useReveal();

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  if (showDashboard) {
    return <Dashboard onBack={() => setShowDashboard(false)} />;
  }

  return (
    <div className="custom-cursor-zone" style={{ background: C.bg, minHeight: '100vh', color: C.white, width: '100%', overflowX: 'hidden', position: 'relative', zIndex: 0 }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }} />
      <GlassBubbles />
      <CustomCursor />
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0,
        width: 2, zIndex: 999, pointerEvents: 'none',
        background: 'rgba(255,255,255,0.04)',
      }}>
        <div style={{
          width: '100%', height: `${scrollPct}%`,
          background: 'linear-gradient(180deg, #D4178A, #7B2DBE)',
          transition: 'height 0.1s linear',
        }} />
      </div>
      <Nav />
      <Hero />
      <Projects onViewDashboard={() => setShowDashboard(true)} />
      <About />
      <Skills />
      <Contact />
      <Footer />
    </div>
  );
}
