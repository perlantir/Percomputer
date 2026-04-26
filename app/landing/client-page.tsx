"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import {
  Brain,
  Bot,
  Workflow,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Code2,
  Sparkles,
  Layers,
  Cpu,
  GitBranch,
  Lock,
  Rocket,
  Clock,
  Users,
  ArrowRight,
  Check,
  ChevronRight,
  Star,
  Terminal,
  Database,
  MessageSquare,
  Plug,
  Eye,
  TrendingUp,
  Settings,
  Play,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — inherited from globals.css
   Colors:
     --bg-canvas: #FBF8F4 (light) / #191A1A (dark)
     --bg-surface: #FFFFFF / #202222
     --bg-surface-2: #F4F1EB / #262828
     --bg-surface-3: #ECE8E1 / #2D2F2F
     --text-primary: #13343B / #F1EFEA
     --text-secondary: #5A6B6E / #A8B0B1
     --text-tertiary: #8A9799 / #6F7878
     --accent-primary: #20B8CD
     --accent-secondary: #E07A5F
     --accent-tertiary: #F4A261
     --success: #2A9D8F
     --danger: #E76F51
     --warning: #E9C46A
   Motion easings: ease-out-expo = [0.16, 1, 0.3, 1]
   ═══════════════════════════════════════════════════════════════════════════════ */

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_SPRING = { type: "spring" as const, stiffness: 100, damping: 15 };

/* ═══════════════════════════════════════════════════════════════════════════════
   ANIMATED HERO BACKGROUND — Particle Network
   ═══════════════════════════════════════════════════════════════════════════════ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  const initParticles = useCallback((width: number, height: number) => {
    const count = Math.min(Math.floor((width * height) / 12000), 80);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      particlesRef.current = initParticles(rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("mouseleave", () => {
      mouseRef.current = { x: -1000, y: -1000 };
    });

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.15;
          p.vy += (dy / dist) * force * 0.15;
        }

        // Damping
        p.vx *= 0.999;
        p.vy *= 0.999;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(32, 184, 205, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const opacity = (1 - dist / 150) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(32, 184, 205, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "auto" }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DATA CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════════ */

const FEATURES: { icon: LucideIcon; title: string; description: string; color: string }[] = [
  { icon: Brain, title: "Multi-Model Orchestration", description: "Route tasks across GPT-4, Claude, Gemini, and 20+ models with intelligent load balancing.", color: "#20B8CD" },
  { icon: Bot, title: "Autonomous Agents", description: "Deploy self-directed agents that plan, execute, and iterate without human intervention.", color: "#E07A5F" },
  { icon: Workflow, title: "Visual Workflow Builder", description: "Design complex AI pipelines with our drag-and-drop node editor and real-time preview.", color: "#F4A261" },
  { icon: Zap, title: "Sub-Second Latency", description: "Optimized inference routing delivers responses in under 500ms at the 99th percentile.", color: "#20B8CD" },
  { icon: Shield, title: "Enterprise Security", description: "SOC 2 Type II certified with end-to-end encryption, RBAC, and audit logging.", color: "#2A9D8F" },
  { icon: Globe, title: "Global Edge Network", description: "Deploy at 40+ edge locations worldwide for low-latency responses everywhere.", color: "#E07A5F" },
  { icon: BarChart3, title: "Real-Time Analytics", description: "Monitor token usage, costs, latency, and quality scores from a unified dashboard.", color: "#F4A261" },
  { icon: Code2, title: "API-First Design", description: "RESTful and WebSocket APIs with SDKs for Python, TypeScript, Go, and Rust.", color: "#20B8CD" },
  { icon: Sparkles, title: "Smart Routing", description: "AI-powered router automatically selects the best model for cost, speed, and quality.", color: "#E07A5F" },
  { icon: Layers, title: "Agent Composition", description: "Compose specialized agents into teams that collaborate on complex multi-step tasks.", color: "#2A9D8F" },
  { icon: Cpu, title: "Custom Model Hosting", description: "Deploy your own fine-tuned models on our infrastructure with auto-scaling GPUs.", color: "#20B8CD" },
  { icon: GitBranch, title: "Version Control", description: "Track every prompt, parameter, and output change with built-in versioning and diffs.", color: "#F4A261" },
  { icon: Lock, title: "Data Privacy", description: "Zero data retention options, PII redaction, and GDPR/CCPA compliance built-in.", color: "#2A9D8F" },
  { icon: Rocket, title: "One-Click Deploy", description: "Ship agents to production with a single click. CI/CD integration included.", color: "#E07A5F" },
  { icon: Clock, title: "Scheduled Workflows", description: "Cron-based scheduling for recurring reports, data sync, and maintenance tasks.", color: "#20B8CD" },
  { icon: Users, title: "Team Collaboration", description: "Shared workspaces, role-based permissions, and real-time collaborative editing.", color: "#F4A261" },
  { icon: Terminal, title: "CLI & SDK", description: "Powerful command-line interface and native SDKs for rapid development.", color: "#2A9D8F" },
  { icon: Database, title: "Persistent Memory", description: "Long-term conversational memory with vector search across sessions.", color: "#20B8CD" },
  { icon: MessageSquare, title: "Human-in-the-Loop", description: "Request approvals, clarifications, and feedback at any step in a workflow.", color: "#E07A5F" },
  { icon: Plug, title: "100+ Integrations", description: "Connect to Slack, Notion, GitHub, Salesforce, and more out of the box.", color: "#F4A261" },
  { icon: Eye, title: "Observability", description: "Full tracing, structured logging, and alerting for every agent execution.", color: "#2A9D8F" },
  { icon: TrendingUp, title: "Auto-Optimization", description: "Continuously improve prompts and routing decisions based on outcome feedback.", color: "#20B8CD" },
  { icon: Settings, title: "Fine-Grained Controls", description: "Temperature, top-p, max tokens, stop sequences — all configurable per step.", color: "#E07A5F" },
  { icon: Shield, title: "Prompt Injection Guard", description: "Advanced detection and mitigation of prompt injection and jailbreak attempts.", color: "#2A9D8F" },
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for personal projects and experimentation.",
    features: [
      "1,000 API calls / month",
      "3 concurrent workflows",
      "Community models only",
      "7-day execution history",
      "Email support",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/ month",
    description: "For professional developers and small teams.",
    features: [
      "50,000 API calls / month",
      "20 concurrent workflows",
      "All models + fine-tuning",
      "90-day execution history",
      "Priority support",
      "Custom integrations",
      "Team collaboration (5 seats)",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced security and scale needs.",
    features: [
      "Unlimited API calls",
      "Unlimited workflows",
      "Custom model hosting",
      "Unlimited history",
      "24/7 dedicated support",
      "SSO & SAML",
      "Audit logs & compliance",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "CTO",
    company: "DataFlow AI",
    avatar: "SC",
    content: "We reduced our AI infrastructure costs by 60% while improving response quality. The multi-model routing is genuinely intelligent — it knows when to use Claude vs GPT-4 vs a smaller model.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "VP Engineering",
    company: "Nexus Labs",
    avatar: "MJ",
    content: "The workflow builder changed how we think about AI automation. What used to take weeks of engineering now takes hours. Our team shipped 40+ agent workflows in the first month.",
    rating: 5,
  },
  {
    name: "Elena Rodriguez",
    role: "Head of AI",
    company: "Meridian Corp",
    avatar: "ER",
    content: "Enterprise security was our top concern. This platform exceeded every requirement — SOC 2, GDPR, zero data retention. We evaluated 12 vendors and this was the clear winner.",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Lead Developer",
    company: "Streamline Studios",
    avatar: "DP",
    content: "The observability layer is incredible. Full traces for every agent execution let us debug complex multi-step workflows in minutes instead of days. SDK integration took under an hour.",
    rating: 5,
  },
  {
    name: "Aisha Patel",
    role: "Product Manager",
    company: "CloudFirst",
    avatar: "AP",
    content: "We went from prototype to production in two weeks. The human-in-the-loop feature gives our customers confidence, and the analytics dashboard helps us optimize continuously.",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "CEO",
    company: "Autonomous Systems Inc",
    avatar: "JW",
    content: "The agent composition feature is a game-changer. We built a research agent, a writing agent, and a review agent that collaborate autonomously. Output quality rivals our senior team.",
    rating: 5,
  },
];

const FOOTER_LINKS = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap", "Integrations"],
  Resources: ["Documentation", "API Reference", "SDKs", "Tutorials", "Blog"],
  Company: ["About", "Careers", "Contact", "Partners", "Press Kit"],
  Legal: ["Privacy Policy", "Terms of Service", "Security", "Compliance", "Cookie Policy"],
};

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ── Animated Section Wrapper ── */
function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ── Feature Card ── */
function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.08, ease: EASE_OUT_EXPO }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5",
        "transition-shadow duration-300 hover:shadow-lg hover:border-[var(--border-default)]"
      )}
    >
      <div
        className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${feature.color}15` }}
      >
        <Icon size={20} style={{ color: feature.color }} />
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-[var(--text-primary)]">
        {feature.title}
      </h3>
      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
        {feature.description}
      </p>
    </motion.div>
  );
}

/* ── Testimonial Card ── */
function TestimonialCard({ testimonial, index }: { testimonial: (typeof TESTIMONIALS)[number]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.12, ease: EASE_OUT_EXPO }}
      className={cn(
        "rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5",
        "transition-shadow duration-300 hover:shadow-md"
      )}
    >
      {/* Stars */}
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} size={14} className="fill-[#E9C46A] text-[#E9C46A]" />
        ))}
      </div>
      {/* Quote */}
      <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        &ldquo;{testimonial.content}&rdquo;
      </p>
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-xs font-semibold text-[var(--accent-primary)]">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{testimonial.name}</p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {testimonial.role}, {testimonial.company}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Pricing Card ── */
function PricingCard({ tier, index }: { tier: (typeof PRICING_TIERS)[number]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: EASE_OUT_EXPO }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className={cn(
        "relative flex flex-col rounded-2xl border p-6",
        tier.highlighted
          ? "border-[var(--accent-primary)]/40 bg-[var(--bg-surface)] shadow-xl shadow-[var(--accent-primary)]/5"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
      )}
    >
      {tier.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent-primary)] px-3 py-0.5 text-xs font-semibold text-[var(--text-inverse)]">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{tier.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[var(--text-primary)]">{tier.price}</span>
        {tier.period && <span className="text-sm text-[var(--text-tertiary)]">{tier.period}</span>}
      </div>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{tier.description}</p>
      <ul className="mt-5 flex flex-col gap-2.5">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
            <Check size={15} className="mt-0.5 shrink-0 text-[var(--success)]" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        className={cn(
          "mt-auto pt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200",
          tier.highlighted
            ? "bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-primary-hover)]"
            : "border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
        )}
      >
        {tier.cta}
      </button>
    </motion.div>
  );
}

/* ── Stats Counter ── */
function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-1 text-sm text-[var(--text-tertiary)]">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.98]);

  return (
    <>
      <div className="relative min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        {/* ═══════════════ NAVIGATION ═══════════════ */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)]/60 bg-[var(--bg-canvas)]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
                <Bot size={18} className="text-[var(--text-inverse)]" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Agent Platform</span>
            </div>
            <div className="hidden items-center gap-6 text-sm text-[var(--text-secondary)] md:flex">
              <a href="#features" className="transition-colors hover:text-[var(--text-primary)]">Features</a>
              <a href="#demo" className="transition-colors hover:text-[var(--text-primary)]">Demo</a>
              <a href="#pricing" className="transition-colors hover:text-[var(--text-primary)]">Pricing</a>
              <a href="#testimonials" className="transition-colors hover:text-[var(--text-primary)]">Testimonials</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/"
                className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-inverse)] transition-colors hover:bg-[var(--accent-primary-hover)]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* ═══════════════ HERO SECTION ═══════════════ */}
        <motion.section
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16"
        >
          {/* Background */}
          <div className="absolute inset-0">
            <ParticleCanvas />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-canvas)] via-transparent to-[var(--bg-canvas)] opacity-60" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-canvas)] to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-1.5 text-xs text-[var(--text-secondary)]"
            >
              <Sparkles size={14} className="text-[var(--accent-primary)]" />
              Now with autonomous agent teams
              <ChevronRight size={12} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
              className="text-balance text-4xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-7xl"
            >
              Build, Run & Scale{" "}
              <span className="text-gradient">Autonomous AI Workflows</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT_EXPO }}
              className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg"
            >
              The multi-model, multi-agent orchestration platform. Route tasks across 20+ LLMs,
              compose intelligent agents, and deploy production-ready workflows in minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT_EXPO }}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-inverse)] shadow-lg shadow-[var(--accent-primary)]/20 transition-all duration-200 hover:bg-[var(--accent-primary-hover)] hover:shadow-xl hover:shadow-[var(--accent-primary)]/25"
              >
                Start Building Free
                <ArrowRight size={16} />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-hover)]"
              >
                <Play size={15} />
                Watch Demo
              </a>
            </motion.div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT_EXPO }}
              className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-6 py-5 backdrop-blur-sm sm:grid-cols-4 sm:px-8"
            >
              <StatCounter value={20} suffix="+" label="AI Models" />
              <StatCounter value={1000} suffix="+" label="Teams" />
              <StatCounter value={50} suffix="M+" label="API Calls" />
              <StatCounter value={999} suffix="%" label="Uptime" />
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-10 w-6 rounded-full border-2 border-[var(--border-default)] p-1"
            >
              <div className="h-2 w-full rounded-full bg-[var(--accent-primary)]" />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ═══════════════ FEATURES SECTION ═══════════════ */}
        <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
          {/* Subtle gradient background */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(var(--accent-primary-rgb), 0.03) 0%, transparent 70%)`,
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-16 text-center">
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                Features
              </span>
              <h2 className="text-balance text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Everything you need to{" "}
                <span className="text-gradient">ship AI workflows</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--text-secondary)]">
                From intelligent model routing to autonomous agent teams — a complete platform
                for building production-grade AI applications.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {FEATURES.map((feature, i) => (
                <FeatureCard key={feature.title} feature={feature} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ DEMO VIDEO SECTION ═══════════════ */}
        <section id="demo" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-16 text-center">
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                See It In Action
              </span>
              <h2 className="text-balance text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                From idea to production in <span className="text-gradient">minutes</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)]">
                Watch how quickly you can build, test, and deploy a multi-agent workflow.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <motion.div
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.3 }}
                className="group relative aspect-video overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xl shadow-black/5"
              >
                {/* Placeholder UI */}
                <div className="absolute inset-0 bg-[var(--bg-surface-2)]">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-[var(--danger)]" />
                      <div className="h-3 w-3 rounded-full bg-[var(--warning)]" />
                      <div className="h-3 w-3 rounded-full bg-[var(--success)]" />
                    </div>
                    <div className="ml-4 flex-1 rounded-md bg-[var(--bg-surface-2)] px-3 py-1 text-xs text-[var(--text-tertiary)]">
                      app.agentplatform.dev/workflows/new
                    </div>
                  </div>

                  {/* Mock content */}
                  <div className="grid h-[calc(100%-41px)] grid-cols-12 gap-0">
                    {/* Sidebar */}
                    <div className="col-span-3 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
                      <div className="mb-3 h-6 w-24 rounded bg-[var(--bg-surface-2)]" />
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="mb-2 flex items-center gap-2">
                          <div className="h-4 w-4 rounded bg-[var(--bg-surface-2)]" />
                          <div className="h-3 w-20 rounded bg-[var(--bg-surface-2)]" />
                        </div>
                      ))}
                    </div>
                    {/* Canvas */}
                    <div className="col-span-9 bg-[var(--bg-canvas)] p-4">
                      {/* Nodes */}
                      <div className="relative h-full">
                        {/* Start node */}
                        <div className="absolute left-8 top-8 w-40 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-[var(--success)]/15" />
                            <div>
                              <div className="h-2.5 w-16 rounded bg-[var(--bg-surface-3)]" />
                              <div className="mt-1 h-2 w-24 rounded bg-[var(--bg-surface-2)]" />
                            </div>
                          </div>
                        </div>
                        {/* Router node */}
                        <div className="absolute left-64 top-24 w-48 rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--bg-surface)] p-3 shadow-md">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent-primary)]/15">
                              <Sparkles size={12} className="text-[var(--accent-primary)]" />
                            </div>
                            <div>
                              <div className="h-2.5 w-20 rounded bg-[var(--bg-surface-3)]" />
                              <div className="mt-1 h-2 w-28 rounded bg-[var(--bg-surface-2)]" />
                            </div>
                          </div>
                        </div>
                        {/* Model A */}
                        <div className="absolute left-48 top-56 w-44 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-[var(--accent-secondary)]/15" />
                            <div>
                              <div className="h-2.5 w-14 rounded bg-[var(--bg-surface-3)]" />
                              <div className="mt-1 h-2 w-20 rounded bg-[var(--bg-surface-2)]" />
                            </div>
                          </div>
                        </div>
                        {/* Model B */}
                        <div className="absolute left-96 top-56 w-44 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-[var(--accent-tertiary)]/15" />
                            <div>
                              <div className="h-2.5 w-14 rounded bg-[var(--bg-surface-3)]" />
                              <div className="mt-1 h-2 w-20 rounded bg-[var(--bg-surface-2)]" />
                            </div>
                          </div>
                        </div>
                        {/* End node */}
                        <div className="absolute left-64 top-96 w-40 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-[var(--info)]/15" />
                            <div>
                              <div className="h-2.5 w-12 rounded bg-[var(--bg-surface-3)]" />
                              <div className="mt-1 h-2 w-24 rounded bg-[var(--bg-surface-2)]" />
                            </div>
                          </div>
                        </div>
                        {/* Connection lines (SVG) */}
                        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: -1 }}>
                          <line x1="88" y1="56" x2="280" y2="48" stroke="var(--border-default)" strokeWidth="1.5" strokeDasharray="4" />
                          <line x1="340" y1="96" x2="270" y2="240" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="4" opacity="0.5" />
                          <line x1="380" y1="96" x2="434" y2="240" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="4" opacity="0.5" />
                          <line x1="270" y1="280" x2="344" y2="400" stroke="var(--border-default)" strokeWidth="1.5" strokeDasharray="4" />
                          <line x1="434" y1="280" x2="344" y2="400" stroke="var(--border-default)" strokeWidth="1.5" strokeDasharray="4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary)] shadow-lg"
                  >
                    <Play size={28} className="ml-1 text-[var(--text-inverse)]" fill="white" />
                  </motion.div>
                </div>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════════ PRICING SECTION ═══════════════ */}
        <section id="pricing" className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-surface-2)]/30 to-transparent" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-16 text-center">
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                Pricing
              </span>
              <h2 className="text-balance text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Simple, transparent <span className="text-gradient">pricing</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)]">
                Start free, scale as you grow. No hidden fees, no surprises.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PRICING_TIERS.map((tier, i) => (
                <PricingCard key={tier.name} tier={tier} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ TESTIMONIALS SECTION ═══════════════ */}
        <section id="testimonials" className="relative py-24 sm:py-32 overflow-hidden">
          {/* Subtle gradient background */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 70% 50% at 30% 60%, rgba(var(--accent-secondary), 0.03) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 30%, rgba(var(--accent-primary-rgb), 0.025) 0%, transparent 50%)`,
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-16 text-center">
              <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                Testimonials
              </span>
              <h2 className="text-balance text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                Loved by <span className="text-gradient">engineering teams</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)]">
                See what teams are saying about building with our platform.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <TestimonialCard key={t.name} testimonial={t} index={i} />
              ))}
            </div>

            {/* Logo bar */}
            <AnimatedSection delay={0.2} className="mt-16">
              <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Trusted by teams at
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-40 grayscale">
                {["DataFlow AI", "Nexus Labs", "Meridian Corp", "CloudFirst", "Streamline Studios", "Autonomous Systems"].map(
                  (name) => (
                    <span key={name} className="text-sm font-semibold text-[var(--text-secondary)]">
                      {name}
                    </span>
                  )
                )}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════════ CTA SECTION ═══════════════ */}
        <section className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <motion.div
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center shadow-xl sm:p-12"
              >
                {/* Decorative gradient blobs */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[var(--accent-primary)] opacity-[0.07] blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-[var(--accent-secondary)] opacity-[0.07] blur-3xl" />

                <h2 className="relative text-balance text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                  Ready to build your first{" "}
                  <span className="text-gradient">AI workflow?</span>
                </h2>
                <p className="relative mx-auto mt-4 max-w-lg text-base text-[var(--text-secondary)]">
                  Join thousands of developers shipping intelligent agents. Start free,
                  no credit card required.
                </p>
                <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-8 py-3.5 text-sm font-semibold text-[var(--text-inverse)] shadow-lg shadow-[var(--accent-primary)]/20 transition-all duration-200 hover:bg-[var(--accent-primary-hover)] hover:shadow-xl"
                  >
                    Get Started Free
                    <ArrowRight size={16} />
                  </Link>
                  <a
                    href="https://docs.agentplatform.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-8 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-hover)]"
                  >
                    Read the Docs
                  </a>
                </div>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)]">
                    <Bot size={18} className="text-[var(--text-inverse)]" />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)]">Agent Platform</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[var(--text-tertiary)]">
                  Multi-model, multi-agent orchestration platform for building,
                  running, and scaling autonomous AI workflows.
                </p>
              </div>

              {/* Links */}
              {Object.entries(FOOTER_LINKS).map(([category, links]) => (
                <div key={category}>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                    {category}
                  </h4>
                  <ul className="space-y-2">
                    {links.map((link) => (
                      <li key={link}>
                        <a
                          href="#"
                          className="text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-6 sm:flex-row">
              <p className="text-xs text-[var(--text-tertiary)]">
                &copy; {new Date().getFullYear()} Agent Platform. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/your-org/multi-model-agent-platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
                >
                  <span className="sr-only">GitHub</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/agentplatform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
                >
                  <span className="sr-only">Twitter</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://discord.gg/agentplatform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
                >
                  <span className="sr-only">Discord</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
   