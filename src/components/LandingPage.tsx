import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, ArrowRight, Star, Hexagon, Circle, Shield, Users, Zap, BookOpen } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero Animations
    const tl = gsap.timeline();
    tl.fromTo('.hero-badge', 
      { opacity: 0, y: -20 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" }
    )
    .fromTo('.hero-title',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.4"
    )
    .fromTo('.hero-desc',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.6"
    )
    .fromTo('.hero-cta',
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)", stagger: 0.1 },
      "-=0.4"
    )
    .fromTo('.hero-image',
      { opacity: 0, x: 50, rotateY: 15 },
      { opacity: 1, x: 0, rotateY: 0, duration: 1.2, ease: "power3.out" },
      "-=0.8"
    );

    // Floating decorations
    gsap.to('.float-slow', {
      y: -15,
      rotation: 5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to('.float-fast', {
      y: -25,
      rotation: -10,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Features scroll animation
    const features = gsap.utils.toArray('.feature-card-wrapper');
    features.forEach((feature: any, i) => {
      gsap.fromTo(feature,
        { opacity: 0, y: 100, scale: 0.9 },
        {
          scrollTrigger: {
            trigger: feature,
            start: "top 80%",
            toggleActions: "play none none reverse"
          },
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay: i * 0.15,
          ease: "back.out(1.5)"
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-main)',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden',
    }}>
      {/* Navbar */}
      <nav style={{
        padding: '24px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(247, 242, 235, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>TemuSpace</span>
        </div>
        <button
          onClick={onLogin}
          style={{
            padding: '10px 24px',
            background: 'var(--text-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Masuk
        </button>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} style={{
        padding: '140px 5% 80px',
        maxWidth: 1200,
        margin: '0 auto',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}>
        {/* Decorations */}
        <div className="float-slow" style={{ position: 'absolute', top: '20%', left: '2%', color: 'var(--accent-orange)' }}>
          <Star size={32} fill="currentColor" />
        </div>
        <div className="float-fast" style={{ position: 'absolute', bottom: '20%', left: '40%', color: 'var(--accent-purple)' }}>
          <Circle size={24} fill="currentColor" />
        </div>
        <div className="float-slow" style={{ position: 'absolute', top: '15%', right: '5%', color: 'var(--accent-green)' }}>
          <Hexagon size={40} fill="currentColor" />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 60,
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Text Content */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h1 className="hero-title" style={{
              fontSize: 'clamp(40px, 5vw, 64px)',
              fontWeight: 900,
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              marginBottom: 24,
              letterSpacing: '-0.02em'
            }}>
              Ruang Komunitas <br/>
              <span style={{ color: 'var(--accent-terracotta)' }}>Generasi Modern</span>
            </h1>
            
            <p className="hero-desc" style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: 'var(--text-muted)',
              marginBottom: 40,
              maxWidth: 480
            }}>
              TemuSpace adalah platform komunitas open-source yang menggabungkan forum diskusi, LMS, dan Virtual HQ Isometrik 3D yang interaktif!
            </p>
            
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button
                className="hero-cta"
                onClick={onLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 32px',
                  background: 'var(--text-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 12px 24px rgba(17, 24, 39, 0.2)',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Mulai Sekarang <ArrowRight size={20} />
              </button>
              
              <button
                className="hero-cta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '16px 32px',
                  background: 'white',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Play size={20} fill="currentColor" /> Tonton Demo
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="hero-image" style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              inset: -20,
              background: 'linear-gradient(135deg, rgba(217,119,6,0.2) 0%, rgba(139,92,246,0.2) 100%)',
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              filter: 'blur(30px)',
              zIndex: 0
            }} />
            <img 
              src="/hero-illustration.jpeg" 
              alt="TemuSpace Custom Illustration"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '4/3',
                objectFit: 'cover',
                borderRadius: 'var(--radius-3xl)',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
                border: '8px solid white'
              }}
            />
            {/* Floating UI Elements */}
            <div className="float-slow" style={{
              position: 'absolute',
              bottom: 40,
              left: -30,
              zIndex: 2,
              background: 'white',
              padding: '12px 20px',
              borderRadius: 'var(--radius-2xl)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Member Aktif</div>
                <div style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 800 }}>12,450+</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} style={{
        padding: '100px 5%',
        background: 'white',
        borderTopLeftRadius: 60,
        borderTopRightRadius: 60,
        position: 'relative',
        zIndex: 2,
        boxShadow: '0 -20px 40px rgba(0,0,0,0.02)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 16 }}>
              Semua Fitur dalam Satu Tempat
            </h2>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', marginBottom: 32 }}>
              Berhentilah berpindah-pindah aplikasi. TemuSpace menyediakan semua alat untuk komunitas modern Anda.
            </p>
            <button 
              onClick={onLogin}
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                padding: '14px 32px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: 16,
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)' }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)' }}
            >
              Jelajahi Fitur Sekarang
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20
          }}>
            <FeatureCard 
              tag="FORUM INTERAKTIF"
              color="#0ea5e9"
              title="Kolaborasi Lancar"
              desc="Bagikan ide, mulai diskusi, dan berkolaborasi di feed komunitas yang responsif dan interaktif."
              image="/feature-forum.jpeg"
              rotate={-3}
            />
            <FeatureCard 
              tag="VIRTUAL HQ"
              color="#e879f9"
              title="Ruang 3D Isometrik"
              desc="Ruang nongkrong virtual untuk bertemu, ngobrol, dan rapat dengan anggota komunitas secara seru."
              image="/feature-virtual-hq.jpeg"
              rotate={2}
            />
            <FeatureCard 
              tag="LMS & RESOURCES"
              color="#10b981"
              title="Pusat Pembelajaran"
              desc="Pusat materi, video, dan modul yang bisa diakses kapan saja untuk upgrade skill secara kolektif."
              image="/feature-lms.jpeg"
              rotate={-1}
            />
            <FeatureCard 
              tag="REAL PROJECTS"
              color="#f97316"
              title="Kanban Board"
              desc="Kelola proyek komunitas dengan Kanban board terintegrasi. Lacak progress dan tugas dengan mudah."
              image="/feature-kanban.jpeg"
              rotate={3}
            />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer style={{
        background: 'white',
        padding: '60px 5% 40px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>

          <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)' }}>TemuSpace</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          © 2026 TemuSpace Open Source. Dibuat dengan 💖 oleh Komunitas.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ tag, color, title, desc, image, rotate }: { tag: string, color: string, title: string, desc: string, image: string, rotate: number }) {
  return (
    <div className="feature-card-wrapper" style={{ padding: '20px 0' }}>
      <div className="feature-card-inner" style={{
        background: color,
        padding: '30px 24px',
        borderRadius: 24,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        height: 380,
        transform: `rotate(${rotate}deg)`,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = `rotate(0deg) translateY(-10px) scale(1.02)`;
        e.currentTarget.style.boxShadow = `0 30px 50px ${color}40`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = `rotate(${rotate}deg)`;
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
      }}
      >
        <div style={{ alignSelf: 'center', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, marginBottom: 24, letterSpacing: 1 }}>
          {tag}
        </div>
        <h3 style={{ fontSize: 26, fontWeight: 900, textAlign: 'center', marginBottom: 16, lineHeight: 1.1 }}>{title}</h3>
        <p style={{ fontSize: 14, textAlign: 'center', opacity: 0.95, lineHeight: 1.6, zIndex: 2, fontWeight: 500, padding: '0 8px' }}>{desc}</p>
        
        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
              width: '120%', height: 180, position: 'absolute', bottom: -50,
              background: `linear-gradient(to bottom, transparent, ${color})`, zIndex: 2
            }} />
            <img src={image} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, transform: 'translateY(20px)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} />
        </div>
      </div>
    </div>
  );
}
