"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { selectIsAdmin, useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/lib/api/errors";

/**
 * Form de login.
 *
 * Detalle no obvio: usamos refs para leer email/password al hacer submit en
 * vez de depender únicamente del state controlado. Razón: el autofill del
 * browser (Chrome / 1Password) suele rellenar los inputs sin disparar el
 * `change` que React necesita para actualizar su estado, y entonces el
 * usuario veía el botón deshabilitado aunque "los campos estaban llenos".
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAdmin = useAuthStore(selectIsAdmin);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya hay sesión activa, no tiene sentido quedarse en login.
  useEffect(() => {
    if (hydrated && status === "authenticated") {
      router.replace(next ?? "/dashboard");
    }
  }, [hydrated, status, isAdmin, next, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const email = emailRef.current?.value?.trim() ?? "";
    const password = passwordRef.current?.value ?? "";

    if (!email || !password) {
      setError("Escribe tu correo y contraseña.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      router.replace(next ?? "/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 401
          ? "Correo o contraseña incorrectos."
          : err instanceof ApiError && err.status === 0
            ? "No pudimos conectar con el servidor. ¿Está corriendo el backend?"
            : (err as Error)?.message ?? "Intenta de nuevo en un momento.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-editorial-ink lg:flex-row">
      {/* ---- Formulario (izquierda) ---- */}
      <div className="flex flex-1 flex-col px-6 py-8 md:px-12 lg:px-16">
        <Link href="/" aria-label="Nest Living">
          <Logo variant="dark" width={104} priority />
        </Link>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm py-12">
            <Link
              href="/"
              className="link-underline mb-10 inline-flex items-center gap-2 text-sm font-medium text-editorial-soft hover:text-editorial-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>

            <p className="eyebrow">Acceso de administradores</p>
            <h1 className="font-display mt-4 text-5xl leading-none">
              Hola de <em className="italic text-teal-dark">nuevo.</em>
            </h1>
            <p className="mt-4 text-lg text-editorial-soft">
              Entra a la consola de tu comunidad.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-7">
              <div>
                <label htmlFor="email" className="eyebrow mb-1 block">
                  Correo electrónico
                </label>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  autoFocus
                  placeholder="tu@correo.com"
                  className="input-line"
                />
              </div>

              <div>
                <label htmlFor="password" className="eyebrow mb-1 block">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="input-line pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-editorial-soft transition-colors hover:text-editorial-ink"
                    aria-label={
                      showPwd ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPwd ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="border-l-2 border-danger-strong pl-3 text-sm font-medium text-danger-strong">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-ink group flex w-full items-center justify-center gap-2 rounded-full py-4 text-base font-semibold"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-10 border-t border-hairline pt-6 text-sm leading-relaxed text-editorial-soft">
              El acceso es solo para administradores de club. Si necesitas una
              cuenta, contacta al super administrador de tu residencia.
            </p>
          </div>
        </div>
      </div>

      {/* ---- Panel visual (derecha en desktop) ---- */}
      <div className="relative hidden w-[42%] shrink-0 overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=2070&auto=format&fit=crop"
          alt="Interior residencial nórdico y luminoso"
          fill
          priority
          sizes="42vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <figure className="absolute inset-x-0 bottom-0 p-12">
          <blockquote className="font-display text-3xl leading-snug text-white">
            “Tu comunidad, mejor conectada.”
          </blockquote>
          <figcaption className="mt-3 text-sm text-white/75">
            Finanzas, comunicación y operación de tu comunidad, en un solo lugar.
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
