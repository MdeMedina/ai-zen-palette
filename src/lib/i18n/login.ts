import type { ChatLanguage } from "@/stores/session";

export const LOGIN_COPY = {
  en: {
    gateway: "Authentication Gateway",
    emailLabel: "Corporate Email / Operator ID",
    accessKeyLabel: "Access Key",
    errAuth: "Email or access key not recognized. Check your credentials and try again.",
    errNetwork: "Couldn't reach the authentication service. Try again in a moment.",
    initializing: "Initializing…",
    initialize: "Initialize Session",
    srInitializing: "Initializing session…",
    srGranted: "Access granted. Redirecting…",
    forgotKey: "Forgot access key?",
    needHelp: "Need help?",
    restricted: "PKGD OS · v0.1 · Restricted Access",
  },
  es: {
    gateway: "Puerta de Autenticación",
    emailLabel: "Correo Corporativo / ID de Operador",
    accessKeyLabel: "Clave de Acceso",
    errAuth: "Correo o clave de acceso no reconocidos. Revise sus credenciales e intente de nuevo.",
    errNetwork: "No se pudo contactar el servicio de autenticación. Intente de nuevo en un momento.",
    initializing: "Iniciando…",
    initialize: "Iniciar Sesión",
    srInitializing: "Iniciando sesión…",
    srGranted: "Acceso concedido. Redirigiendo…",
    forgotKey: "¿Olvidó su clave de acceso?",
    needHelp: "¿Necesita ayuda?",
    restricted: "PKGD OS · v0.1 · Acceso Restringido",
  },
} as const satisfies Record<ChatLanguage, Record<string, string>>;
