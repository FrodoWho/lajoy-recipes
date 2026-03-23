"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Main Content */}
      <main id="main-content" className="flex-grow flex items-center justify-center p-6 md:p-12 lg:p-20">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden bg-surface-container-low rounded-xl shadow-sm">
          {/* Left Side: Aesthetic Imagery */}
          <div className="hidden md:block relative bg-primary-container overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-container to-surface opacity-40" />
            <div className="relative h-full w-full p-12 flex flex-col justify-between z-10">
              <div>
                <h1 className="font-heading text-primary text-5xl font-bold leading-tight tracking-tight italic">
                  Lajoy&apos;s
                  <br />
                  Recipes
                </h1>
                <p className="mt-6 font-sans text-on-surface text-lg max-w-xs leading-relaxed">
                  Ontdek een wereld van culinaire inspiratie en ambachtelijke recepten.
                </p>
              </div>
              {/* Hero image */}
              <div className="relative mt-8">
                <img
                  src="/lajoy-login.png"
                  alt="Lajoy's Recipes kitchen scene"
                  className="w-full h-80 object-cover rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="p-5 sm:p-8 md:p-16 lg:p-24 flex flex-col justify-center bg-surface">
            <div className="max-w-sm mx-auto w-full">
              <header className="mb-12">
                <span className="font-label text-xs text-secondary-lajoy tracking-widest uppercase mb-2 block">
                  {isSignUp ? "Aan de slag" : "Welkom terug"}
                </span>
                <h2 className="font-heading text-on-surface text-3xl font-medium">
                  {isSignUp ? "Maak een account aan" : "Inloggen bij Lajoy's Recepten"}
                </h2>
              </header>

              <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
                <div className="space-y-1">
                  <label
                    className="font-label text-xs text-on-surface-variant block ml-1"
                    htmlFor="email"
                  >
                    E-mailadres
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-lg focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-300 outline-none font-label text-sm"
                    id="email"
                    name="email"
                    placeholder="chef@lajoys.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label
                      className="font-label text-xs text-on-surface-variant block ml-1"
                      htmlFor="password"
                    >
                      Wachtwoord
                    </label>
                    {!isSignUp && (
                      <button type="button" className="font-label text-xs text-secondary-lajoy hover:underline underline-offset-4">
                        Vergeten?
                      </button>
                    )}
                  </div>
                  <input
                    className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-lg focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all duration-300 outline-none font-label text-sm"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <div role="alert" className="text-sm text-error-lajoy bg-error-container rounded-lg p-3 font-label">
                    {error}
                  </div>
                )}
                {message && (
                  <div role="status" className="text-sm text-primary bg-primary-container/50 rounded-lg p-3 font-label">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white font-label font-semibold rounded-full hover:opacity-90 active:scale-[0.98] transition-all shadow-md mt-4 disabled:opacity-50"
                >
                  {loading ? "Laden..." : isSignUp ? "Registreren" : "Inloggen"}
                </button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant opacity-30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-tighter">
                  <span className="bg-surface px-4 text-on-surface-variant font-label">
                    Of ga verder met
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 py-3 px-4 bg-surface-container-low border border-outline-variant/20 rounded-full hover:bg-secondary-container transition-colors group">
                  <svg className="w-5 h-5 text-on-surface-variant group-hover:text-on-secondary-container" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-label text-sm font-medium text-on-surface">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 py-3 px-4 bg-surface-container-low border border-outline-variant/20 rounded-full hover:bg-secondary-container transition-colors group">
                  <svg className="w-5 h-5 text-on-surface-variant group-hover:text-on-secondary-container" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="font-label text-sm font-medium text-on-surface">Apple</span>
                </button>
              </div>

              <p className="mt-12 text-center font-label text-sm text-on-surface-variant">
                {isSignUp ? "Heb je al een account? " : "Nog geen account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-secondary-lajoy font-semibold hover:underline underline-offset-4 decoration-primary-container decoration-4"
                >
                  {isSignUp ? "Inloggen" : "Maak er een aan"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-10 md:py-16 mt-auto bg-surface-container-low border-t border-outline-variant/20">
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 md:px-8 max-w-7xl mx-auto gap-4 sm:gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="font-heading italic text-on-surface text-xl">
              Lajoy&apos;s Recipes
            </span>
            <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant opacity-70">
              &copy; {new Date().getFullYear()}{" "}Lajoy&apos;s Recipes
            </p>
          </div>
          <a className="font-label text-xs tracking-widest uppercase text-on-surface-variant hover:text-secondary-lajoy transition-all underline decoration-primary-container decoration-0 hover:decoration-2 underline-offset-8" href="mailto:support@lajoys.com">
            Ondersteuning
          </a>
        </div>
      </footer>
    </div>
  );
}
