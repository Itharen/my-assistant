// Google Assistant SDK integráció kanonikus típusai (SSoT — `current/principles/ssot.md`).
//
// Owners: server + cli + client mind innen importálják.
//
// Pure-type fájl — semmi runtime side-effect, semmi node-API import.

/** A GCP-ből letöltött OAuth client JSON `installed` blokkja. */
export interface GoogleInstalledCreds {
  client_id: string;
  client_secret: string;
  project_id: string;
  auth_uri: string;
  token_uri: string;
  redirect_uris: string[];
}

/** Auth + device-registration utáni runtime state. */
export interface GoogleRuntimeConfig {
  device_model_id: string;
  device_id: string;
}

/** A `cli/config/google.json` fájl shape-je. */
export interface GoogleAssistantConfig {
  installed: GoogleInstalledCreds;
  runtime?: GoogleRuntimeConfig;
}

/** `sendTextQuery` input. */
export interface QueryOptions {
  text: string;
  lang?: string;
  timeoutMs?: number;
}

/** `sendTextQuery` output. */
export interface QueryResult {
  responseText?: string;
  transcripts: string[];
  micMode?: string;
}

/** Server `/api/google/status` endpoint válasz-shape-je (UI fogyasztja). */
export interface GoogleStatusResponse {
  configured: boolean;
  hasInstalledCreds: boolean;
  hasTokensFile: boolean;
  hasDeviceModel: boolean;
  hasDeviceInstance: boolean;
  projectId?: string;
  deviceModelId?: string;
  deviceId?: string;
  tokensPath: string;
  nextStep: string;
}
