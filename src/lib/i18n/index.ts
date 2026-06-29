import { useSessionStore, type ChatLanguage } from "@/stores/session";
import { LOGIN_COPY } from "./login";
import { COMMON_COPY } from "./common";
import { AUDIT_COPY } from "./audit";
import { HIVE_COPY } from "./hive";
import { KNOWLEDGE_COPY } from "./knowledge";

/**
 * Central i18n registry. Each namespace is `{ en: {...}, es: {...} }`.
 * Read the active UI language from the session store (`chatLanguage`, the
 * EN/ES toggle) and return the matching dictionary.
 *
 * Existing Oracle/AppShell copy still lives in `./oracle` (`oracleCopy`).
 */
const DICT = {
  login: LOGIN_COPY,
  common: COMMON_COPY,
  audit: AUDIT_COPY,
  hive: HIVE_COPY,
  knowledge: KNOWLEDGE_COPY,
} as const;

type Namespace = keyof typeof DICT;

/** Hook: returns the dictionary for `ns` in the active language. */
export function useT<N extends Namespace>(ns: N): (typeof DICT)[N]["en"] {
  const lang = useSessionStore((s) => s.chatLanguage);
  return DICT[ns][lang] as (typeof DICT)[N]["en"];
}

/** Non-hook accessor when the language is already known. */
export function tCopy<N extends Namespace>(
  ns: N,
  lang: ChatLanguage,
): (typeof DICT)[N]["en"] {
  return DICT[ns][lang] as (typeof DICT)[N]["en"];
}
