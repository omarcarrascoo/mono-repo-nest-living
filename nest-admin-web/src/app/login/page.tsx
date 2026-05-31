import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Accede a la consola de administración de Nest Living para gestionar tu comunidad residencial.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
