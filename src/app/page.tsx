"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError) {
      setError(
        authError === "auth"
          ? "Sign-in failed. Please try again."
          : decodeURIComponent(authError)
      );
    }
  }, [searchParams]);

  const handleSignIn = async () => {
    if (!email) return;
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/app`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/app`,
      },
    });
    if (authError) {
      setError(authError.message);
    }
  };

  const handleStartClick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      router.push("/app");
    } else {
      document.getElementById("start")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ========== NAV ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="text-black">
              <path d="M14 2L26 8v12l-12 6L2 20V8l12-6z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M14 8l6 3v6l-6 3-6-3v-6l6-3z" fill="currentColor" opacity="0.3"/>
              <path d="M14 11l3 1.5v3L14 17l-3-1.5v-3L14 11z" fill="currentColor"/>
            </svg>
            <span className="text-black font-semibold text-lg tracking-tight">TailStake</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how" className="text-gray-500 hover:text-black transition-colors">How It Works</a>
            <a href="#already" className="text-gray-500 hover:text-black transition-colors">Already Co-Owning?</a>
            <a href="#pricing" className="text-gray-500 hover:text-black transition-colors">Pricing</a>
          </div>
          <button
            onClick={handleStartClick}
            className="text-sm font-medium text-white bg-black hover:bg-gray-800 px-5 py-2 rounded-full transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ========== HERO (rounded card with margin) ========== */}
      <section className="pt-20 px-4 md:px-6">
        <div className="relative rounded-[2rem] overflow-hidden min-h-[85vh] flex items-end">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero-aircraft.jpg')" }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/90" />

          <div className="relative w-full max-w-7xl mx-auto px-8 md:px-12 pb-12 md:pb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-8">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-sm text-white/80">Now live in Romania</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-[1.05] tracking-[-0.04em] max-w-4xl">
              Own a fraction.
              <br />
              Fly the whole plane.
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-2xl text-lg md:text-xl text-white/60 leading-relaxed">
              The legal backbone for aircraft co-ownership. Clear terms for entry,
              clear costs, clear exit. No handshake deals, no 200k disasters.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
              <button
                onClick={handleStartClick}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white text-black px-8 py-4 text-base font-medium transition-all hover:bg-gray-100 hover:scale-[1.02]"
              >
                Start Now
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={handleStartClick}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-white/30 text-white px-8 py-4 text-base font-medium transition-all hover:bg-white/10 hover:scale-[1.02]"
              >
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ALREADY CO-OWNING ========== */}
      <section id="already" className="px-4 md:px-6 mt-4">
        <div className="rounded-[2rem] bg-gray-50">
          <div className="mx-auto max-w-7xl px-8 md:px-12 py-24 md:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Text */}
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-[0.15em] mb-6">For existing co-owners</p>
                <h2 className="text-4xl md:text-5xl font-semibold text-black leading-[1.1] tracking-[-0.03em]">
                  Already sharing a plane?
                </h2>
                <p className="mt-2 text-4xl md:text-5xl font-semibold text-gray-400 leading-[1.1] tracking-[-0.03em]">
                  Make it official.
                </p>
                <p className="mt-8 text-lg text-gray-500 leading-relaxed max-w-lg">
                  If you already co-own on a handshake deal, TailStake gives you
                  the legal structure you should have had from day one.
                </p>

                <div className="mt-12 space-y-1">
                  {[
                    { title: "Clear entry", desc: "Define ownership shares, voting rights, and responsibilities before anyone puts money in." },
                    { title: "Clear costs", desc: "Fixed costs (hangar, insurance, annual) split by ownership. Variable costs (fuel, oil, filters) split by flight hours. No more 50/50 when you flew 80 hours and they flew 10." },
                    { title: "Clear exit", desc: "ROFR windows, valuation method, buyout terms. When someone wants out, the process is already written." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-5 items-start p-5 rounded-2xl hover:bg-white transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{i + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-black text-lg">{item.title}</h3>
                        <p className="text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleStartClick}
                  className="mt-10 inline-flex items-center gap-2 rounded-full bg-black hover:bg-gray-800 px-8 py-4 text-base font-medium text-white transition-colors"
                >
                  Join the Platform
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Visual card */}
              <div className="relative">
                <div className="rounded-[2rem] bg-white shadow-2xl shadow-black/5 overflow-hidden border border-gray-200">
                  {/* Mock cap table header */}
                  <div className="bg-black px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-white/40 uppercase tracking-[0.15em]">Co-Ownership</p>
                        <p className="text-white font-semibold text-xl mt-1">YR-5412 · Tecnam P92</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] font-medium mb-5">Cap Table</p>
                      {[
                        { name: "Ion Popescu", pct: "40.00%", role: "Initiator", color: "bg-emerald-500" },
                        { name: "Maria Ionescu", pct: "35.00%", role: "Member", color: "bg-emerald-400" },
                        { name: "Andrei Vasile", pct: "25.00%", role: "Member", color: "bg-emerald-300" },
                      ].map((m, i) => (
                        <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                            <span className="font-medium text-black">{m.name}</span>
                            {m.role === "Initiator" && (
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {m.role}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-black tabular-nums">{m.pct}</span>
                        </div>
                      ))}
                    </div>
                    {/* Ownership bar */}
                    <div className="flex rounded-full overflow-hidden h-2">
                      <div className="bg-emerald-500" style={{ width: "40%" }} />
                      <div className="bg-emerald-400" style={{ width: "35%" }} />
                      <div className="bg-emerald-300" style={{ width: "25%" }} />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">ROFR</p>
                        <p className="font-semibold text-black mt-0.5">21 days</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Monthly</p>
                        <p className="font-semibold text-black mt-0.5">EUR 150</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Value</p>
                        <p className="font-semibold text-black mt-0.5">EUR 65,000</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how" className="px-4 md:px-6 mt-4">
        <div className="rounded-[2rem] bg-white">
          <div className="mx-auto max-w-7xl px-8 md:px-12 py-24 md:py-32">
            <div className="mb-20">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-[0.15em] mb-4">Simple process</p>
              <h2 className="text-4xl md:text-5xl font-semibold text-black tracking-[-0.03em]">
                Three steps to<br />safe co-ownership
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Set up your co-ownership",
                  desc: "Enter aircraft details, add up to 5 co-owners, set ownership percentages and governance rules. Takes 5 minutes.",
                },
                {
                  step: "02",
                  title: "Generate agreement",
                  desc: "Pay EUR 199. We generate a Master Agreement under Romanian law with ROFR clauses, exit protection, and governance rules.",
                },
                {
                  step: "03",
                  title: "Everyone signs",
                  desc: "Each co-owner gets an email, reviews the agreement, and signs online. Once everyone signs, your co-ownership is active.",
                },
              ].map((item, i) => (
                <div key={i} className="group relative rounded-[1.5rem] bg-gray-50 p-8 md:p-10 hover:bg-gray-100 transition-colors min-h-[320px] flex flex-col justify-between">
                  <span className="text-7xl font-semibold text-gray-200 group-hover:text-gray-300 transition-colors">{item.step}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-black mb-3">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="px-4 md:px-6 mt-4">
        <div className="rounded-[2rem] bg-gray-900">
          <div className="mx-auto max-w-7xl px-8 md:px-12 py-24 md:py-32">
            <div className="mb-20">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-[0.15em] mb-4">Built for pilots</p>
              <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-[-0.03em]">
                Everything a handshake<br className="hidden md:block" /> deal doesn&apos;t give you
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Right of First Refusal",
                  desc: "When someone wants out, existing members get first dibs. ROFR window is configurable (7-90 days) and enforced by the agreement.",
                  label: "Exit Protection",
                },
                {
                  title: "Basis-point precision",
                  desc: "Ownership tracked to 0.01% using integer basis points. Three people splitting equally? 33.33% + 33.33% + 33.34%. Clean.",
                  label: "Ownership",
                },
                {
                  title: "Romanian law from day one",
                  desc: "Built for Romanian co-ownership law (Cod Civil, Art. 631-686). Real clauses, real protection, reviewed by aviation lawyers.",
                  label: "Legal",
                },
                {
                  title: "Fixed vs variable cost splitting",
                  desc: "Fixed costs (hangar, insurance, annual inspection) split by ownership share. Variable costs (fuel, oil, filters, landing fees) split by flight hours. Everyone pays for what they use.",
                  label: "Costs",
                },
                {
                  title: "Emergency deposit fund",
                  desc: "Each member contributes to a shared reserve for unexpected repairs. No more scrambling to collect money when something breaks.",
                  label: "Safety Net",
                },
                {
                  title: "EUR 199, not EUR 1,000",
                  desc: "A custom lawyer contract costs EUR 500-1,000 and gives you a static PDF. We give you a living co-ownership with cap table, signing, and exit management.",
                  label: "Pricing",
                },
              ].map((item, i) => (
                <div key={i} className="rounded-[1.5rem] bg-gray-800 p-8 hover:bg-gray-700/80 transition-colors">
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-400 mb-6">
                    {item.label}
                  </span>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-[15px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== THE PROBLEM ========== */}
      <section className="px-4 md:px-6 mt-4">
        <div className="relative rounded-[2rem] overflow-hidden min-h-[450px] flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/aircraft-detail.webp')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black/95" />

          <div className="relative mx-auto max-w-4xl px-8 md:px-12 py-24 md:py-32 text-center">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-[0.15em] mb-8">Without TailStake</p>
            <h2 className="text-3xl md:text-5xl font-semibold text-white leading-[1.15] tracking-[-0.03em] mb-8">
              A co-owner wants to exit. Now what?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed text-lg">
              No exit clause. No ROFR. No agreed valuation method. One partner gets stuck paying
              for everything, the other disappears. Lawyers get involved. Months of stress, thousands in fees.
              This is how most handshake deals end.
            </p>
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section id="pricing" className="px-4 md:px-6 mt-4">
        <div className="rounded-[2rem] bg-gray-50">
          <div className="mx-auto max-w-7xl px-8 md:px-12 py-24 md:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-[0.15em] mb-4">Simple pricing</p>
                <h2 className="text-4xl md:text-5xl font-semibold text-black tracking-[-0.03em] mb-6">
                  One fee.<br />Everything included.
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed max-w-md">
                  No subscriptions, no per-member charges. One-time formation fee.
                  A custom lawyer contract costs EUR 500-1,000. We give you more for less.
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white border border-gray-200 shadow-2xl shadow-black/5 p-10 md:p-12">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-6xl font-semibold text-black tracking-tight">199</span>
                  <span className="text-2xl text-gray-400">EUR</span>
                </div>
                <p className="text-gray-400 mb-10">one-time formation fee</p>

                <ul className="space-y-4 mb-10">
                  {[
                    "Master Agreement under Romanian law",
                    "ROFR + exit clauses built in",
                    "Cap table with basis-point precision",
                    "Fixed & variable cost splitting",
                    "Emergency deposit fund setup",
                    "Click-wrap signing for all members",
                    "PDF agreement for your records",
                    "GDPR-compliant signature recording",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15px] text-gray-600">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5 text-black">
                        <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleStartClick}
                  className="w-full rounded-full bg-black hover:bg-gray-800 px-6 py-4 text-base font-medium text-white transition-colors"
                >
                  Start Your Co-Ownership
                </button>
                <p className="mt-4 text-xs text-gray-400 text-center">Non-refundable. Stripe sandbox mode.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA / SIGN IN ========== */}
      <section id="start" className="px-4 md:px-6 mt-4">
        <div className="rounded-[2rem] bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern" />

          <div className="relative mx-auto max-w-md px-8 md:px-12 py-24 md:py-32 text-center">
            {magicLinkSent ? (
              <div>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-8">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="text-3xl font-semibold text-white mb-4">Check your email</h2>
                <p className="text-gray-400 text-lg">
                  We sent a magic link to <strong className="text-white">{email}</strong>.
                  <br />Click it to get started.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-[-0.03em] mb-4">
                  Start now
                </h2>
                <p className="text-gray-500 mb-8 text-lg">
                  Create your account and go straight to your dashboard.
                </p>

                {/* OAuth buttons */}
                <div className="mb-6">
                  <button
                    onClick={() => handleOAuth("google")}
                    className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-white hover:bg-gray-100 px-6 py-4 font-medium text-black transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-gray-600 text-sm">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Email magic link */}
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="pilot@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    className="flex-1 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  />
                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="rounded-full bg-white hover:bg-gray-100 px-8 py-4 font-medium text-black transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : "Go"}
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-600">Magic link, no password needed</p>
                {error && (
                  <p className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========== FOOTER (not full width) ========== */}
      <footer className="px-4 md:px-6 mt-4 pb-4">
        <div className="rounded-[2rem] bg-gray-900 py-12">
          <div className="mx-auto max-w-7xl px-8 md:px-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2.5">
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none" className="text-gray-600">
                  <path d="M14 2L26 8v12l-12 6L2 20V8l12-6z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M14 11l3 1.5v3L14 17l-3-1.5v-3L14 11z" fill="currentColor"/>
                </svg>
                <span className="text-gray-600 text-sm font-medium">TailStake.com</span>
              </div>
              <p className="text-sm text-gray-600">
                Aircraft co-ownership made simple. Built in Romania.
              </p>
              <div className="flex gap-6 text-sm text-gray-600">
                <a href="mailto:hello@tailstake.com" className="hover:text-white transition-colors">Contact</a>
                <a href="mailto:privacy@tailstake.com" className="hover:text-white transition-colors">Privacy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
