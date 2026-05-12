// Server connection defaults. Same-origin by default — the server serves both
// the client (at `/`) and the API (at `/api/*`). A developer running the
// Angular dev server (`ng serve`) against a separately-hosted backend can
// override this via `localStorage['ma.server-base-url']`.

/** Az API kapcsolódási default-ok típusa. */
interface ApiConfig_Interface {
  defaultBaseUrl: string;
  loopbackDevMode: boolean;
}

export const API_CONFIG: ApiConfig_Interface = {
  defaultBaseUrl: '/api',
  loopbackDevMode: true,
};
