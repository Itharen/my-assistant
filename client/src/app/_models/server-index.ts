// Barrel — re-export minden, client-számára-elérhető SSoT type-ot a server
// kanonikus modeljeiből (FDP-pattern, lásd `current/principles/ssot.md`).
//
// A client `import type { Foo } from '@server-models'`-tal hivatkozza. A TS
// build/compile-time-ban resolve-olja a fájlt — nincs duplikáció, nincs npm
// package.
//
// SZABÁLY: csak `export type` — runtime kód NEM kerülhet ide (a kliens nem
// futtathat node-API-t).

// === Integrations ===========================================================

export type {
  SpotifyConfig,
  PlaybackSnapshot,
  SpotifyDevice,
  ResolveDeviceResult,
  SpotifyStatusResponse,
} from '@server/_models/interfaces/integrations/spotify.interface';

export type {
  GoogleInstalledCreds,
  GoogleRuntimeConfig,
  GoogleAssistantConfig,
  QueryOptions as GoogleQueryOptions,
  QueryResult as GoogleQueryResult,
  GoogleStatusResponse,
} from '@server/_models/interfaces/integrations/google.interface';

// === (a meglévő server-envelope.interface.ts marad külön — wire shape-ek,
//      itt nem re-export, mert már most is `import type ... from '../_models/server-envelope.interface'`
//      mintával hivatkozott.) =================================================
