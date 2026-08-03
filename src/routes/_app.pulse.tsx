import { createFileRoute } from "@tanstack/react-router";
import { useSessionStore } from "@/stores/session";
import { useHydrated } from "@/hooks/use-hydrated";
import { I18nProvider } from "@/pulse/lib/i18n";
import { PeriodsProvider } from "@/pulse/state/periods";
import { PulseDashboard } from "@/pulse/PulseDashboard";
import pulseCss from "@/pulse/pulse.css?url";

/**
 * Quincenal Pulse dentro de PKGD OS.
 *
 * El dashboard es el mismo de dashboard.pkgdgroup.com: mismos componentes,
 * mismas secciones, mismo sistema de diseño editorial. Lo que cambió es la
 * puerta — antes Firebase/Google, ahora la sesión del OS (solo Dirección
 * General, ver ADMIN_ROUTES en `_app.tsx`) — y el transporte: `/api/pulse/*`
 * pasa por el backend de PKGD OS hacia el backend de datos de Pulse.
 *
 * Su CSS y sus fuentes se cargan SOLO en esta ruta: el CSS va escalado bajo
 * `.pulse-root` para no contaminar el resto del OS, y las fuentes (DM Serif /
 * DM Sans / JetBrains Mono) son las del reporte original, que no forman parte
 * del stack tipográfico de PKGD OS.
 */
export const Route = createFileRoute("/_app/pulse")({
  head: () => ({
    meta: [{ title: "PKGD OS · Quincenal Pulse" }],
    links: [
      { rel: "stylesheet", href: pulseCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;700&display=swap",
      },
    ],
  }),
  component: PulsePage,
});

function PulsePage() {
  // Recharts y los fetch del dashboard son de cliente; sin esperar la
  // hidratación el SSR pinta un árbol que el cliente reemplaza entero.
  const hydrated = useHydrated();
  const token = useSessionStore((s) => s.token);

  if (!hydrated || !token) {
    return <div className="pulse-root" />;
  }

  return (
    <div className="pulse-root">
      <I18nProvider>
        <PeriodsProvider>
          <PulseDashboard />
        </PeriodsProvider>
      </I18nProvider>
    </div>
  );
}
