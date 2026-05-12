# Dynamo CLI (`dc`) — referencia

**Forrás:** `E:/Programming/Own/CURSOR/NPM-packages/dynamo-cli/`
**Package:** `@futdevpro/cli-dynamo` v01.15.60
**Bin:** `dc`, `dyn-cli`
**Last verified:** 2026-05-12 (`src/program.ts` + `src/_commands/` audit)
**Cél:** mit tud a Dynamo CLI — kapacitás-katalógus, hogy az agent tudja **mikor nyúljon érte**.

> Részletes parancs-help: `dc <command> --help`. Implementációs deep-dive a Dynamo CLI saját
> `__documentations/`-jában (LDP / CDP / dev-leftovers session-docs).

---

## 1. Mi ez

Általános fejlesztői Swiss-knife az FDP/Dynamo stack-hez:
- **scaffolding** (új projekt, modul, data-service, controller, …)
- **lokál dev-pipeline** (file-watcher → auto build/test/server, `dc ldp`)
- **CI/CD pipeline runner** (one-shot, `cicd-report.json`-t termel, `dc cdp`)
- **AI unit-test gen + fix** (OpenAI)
- **credential store** (NPM token, OpenAI key — `.dynamo/`-ban encrypted)
- **batch ops** (install-all, build-test-all, commit-push-all minden subprojektre)
- **code review + lint** (38+ check, 6 autofix; @futdevpro/dynamo-eslint)
- **utilities** (port-info/kill, ssh/ssl/key gen, image gen/edit, file ops)

Az **FDP CLI (`fdp`) ezt extendeli** prod-DevOps + Overseer query layerrel — lásd
[`fdp-cli.md`](fdp-cli.md). Build/scaffold = `dc`, prod-ops/observability = `fdp`.

---

## 2. Parancsok kategóriánként

### A) Project scaffolding & code gen
| Cmd | Mit csinál |
|---|---|
| `dc n` / `new` | interaktív új Dynamo projekt |
| `dc g [type] [name] [module]` | generic element generator (prompt-os) |
| `dc gds` | data-service (BE) |
| `dc gdm` | data-model (BE) |
| `dc gctrl` | controller (BE) |
| `dc gcs` | control-service |
| `dc gmc [path]` | model-constructor auto-generálás property-kből |

### B) Live Dev Pipeline (LDP) — folyamatos watcher-loop
| Cmd | Mit csinál |
|---|---|
| `dc ldp` | file watcher → auto build/test/server-restart loop |
| `dc ldp-init` | sample `pipeline.config.json` generálás |
| `dc ldp-status` | last/current run pretty-print |
| `dc ldp-stop` | user-stop marker (nem destruktív) |
| `dc ldp-clear` | runtime fájlok wipe |

**Config:** `pipeline.config.json` (CWD vagy `.dynamo/`). Flag: `-c, --config <path>`.

### C) CI/CD Pipeline (CDP) — one-shot CI futtatás
| Cmd | Mit csinál |
|---|---|
| `dc cdp` | egyszeri pipeline-run; `cicd-report.json` artifact |
| `dc cdp-init` | sample `pipeline.cicd.config.json` |
| `dc cdp-status` | last `cicd-report.json` olvasása |
| `dc cdp-clear` | runtime wipe |

**Config:** `pipeline.cicd.config.json` (CWD vagy `.dynamo/`). Flag: `-c, --config <path>` | `--no-fail-fast`.

**Fail-fast default ON.** Ez termeli a reportot, amit az `fdp pipeline-report` küld Overseer-be.

### D) CI helper-ek (Discord / build report / webhook / dev-leftovers)
| Cmd | Mit csinál |
|---|---|
| `dc ci-dn-s <json>` | Discord workflow **start** notif |
| `dc ci-dn-r <json>` | Discord workflow **result** notif |
| `dc ci-dn-m <json>` | Discord generic message |
| `dc ci-ck-dl <input>` | dev-leftovers check (`--fix` + `--patch-only`) |
| `dc ci-ck-v <input>` | required-values present-check |
| `dc ci-sbr <input>` | build-report forwardol endpointokra |
| `dc ci-slt <input>` | GitHub release + tag |
| `dc ci-tw <input>` | webhook trigger HMAC signature-rel |
| `dc ci-b <input>` | unified build runner (minden package-type) |

### E) Unit-test generálás + AI fix (OpenAI)
| Cmd | Mit csinál |
|---|---|
| `dc gut [path]` | single-file test gen (AI cred kell) |
| `dc guts` | batch test gen aktuális mappára |
| `dc rt [path]` | run tests `--fix` `--max-attempts <n>` |
| `dc ft <path>` | AI-driven test-fail fixer |

### F) Dep- + verzió-menedzsment
| Cmd | Mit csinál |
|---|---|
| `dc sync-fdp-deps` / `sfd` | `@futdevpro/*` deps auto-discovery + bump-to-latest. Flag: `--check` / `--patch-only` / `--stage` / `--scope` / `--packages` |
| `dc bump-version` / `bv` | multi-package version bumper (patch ≥100000 → minor++; minor ≥1000 → major++) |
| `dc setup-version-hook` / `svh` | Husky pre-commit hook install (`dc bump-version` automatára) |
| `dc npu [rootDir]` | interaktív npm package updater |
| `dc ia` | install-all (`-f` minden, nem csak DyBu_settings) |
| `dc bta` | build-n-test-all subprojektre |
| `dc cpa` | commit-n-push-all |

### G) Credential management (encrypted store, `.dynamo/`)
| Cmd | Mit csinál |
|---|---|
| `dc npm-credentials` / `ncreds` | `--set` / `--clear` / `--view` NPM token |
| `dc aic` / `ai-config` | `--set` / `--clear` / `--view` OpenAI key |

### H) Security artifact gen
| Cmd | Mit csinál |
|---|---|
| `dc gssh --keyname` | SSH key pair |
| `dc gssl --hostname` | SSL cert |
| `dc gk [--length] [--chars]` | random encryption key |

### I) Code review & lint
| Cmd | Mit csinál |
|---|---|
| `dc rev` | 38+ code review check, 6 autofix. `-l` list, `-i <ids>`, `-f --fix`, `-a --apply`, `-t <path>`, `-j` JSON |
| `dc lint` | `@futdevpro/dynamo-eslint`. `-f --fix`, `-t <path>`, `-c <config>`, `-p <globs>`, `-j`, `--strict`, `--no-setup-check` |

### J) Image gen/edit (OpenAI)
| Cmd | Mit csinál |
|---|---|
| `dc gi [--prompt \| --prompt-file]` | single image gen (gpt-image-1). `--size --quality --background --format --output --api-key --dry-run` |
| `dc ie --image <path>` | image edit/compose (gpt-image-1 vagy dall-e-2). `--prompt --mask --model …` |

### K) File / port utilities
| Cmd | Mit csinál |
|---|---|
| `dc del <pattern>` / `rm` / `rimraf` | wildcard delete (`*`, `?`) |
| `dc dfl <src> --start --end` | line-range törlés fájlból |
| `dc efc <src> --start --end --output` | line-range extract új fájlba (auto-import detect) |
| `dc ip <port>` | melyik process foglalja a portot |
| `dc kp <ports...>` | kill port (`-f` skip confirmation) |
| `dc imf -f <file> \| -m <module>` | import-finder |

### L) Config-migráció
| Cmd | Mit csinál |
|---|---|
| `dc dmc` / `migrate-dynamo-config` | root-szintű Dynamo configok → `.dynamo/`-ba. `--apply` (default dry-run), `--projects <glob>` (batch), `--include <names>` |

Áttesz: `pipeline.cicd.config.json`, `pipeline.config.json`, `nodemon.config.json`, `version-bump.config.json`, `dc-credentials*`.

### M) Egyéb
| Cmd | Mit csinál |
|---|---|
| `dc im` | **interactive mode** — menü |
| `dc v` / `version` | CLI version |
| `dc d-rl` | docker release latest (pull → tag → push) |
| `dc t / t2 / t3 / t4 / t23` | dev-test parancsok (NEM produkciós) |

---

## 3. Konfig-fájlok (agent-szempontból fontos)

| Fájl | Hol | Mire |
|---|---|---|
| `pipeline.config.json` | CWD vagy `.dynamo/` | **LDP** — watch pattern + steps + restart + debounce + version-bump + log-trim |
| `pipeline.cicd.config.json` | CWD vagy `.dynamo/` | **CDP** — step-ek + timing + log-output + fatal flag-ek + artifact |
| `.dynamo/version-bump.config.json` | `.dynamo/` | bump-version — subprojektek + generated const fájlok + git-add behavior |
| `.dynamo/dc-credentials(.json)` | `.dynamo/` vagy CWD | **encrypted** NPM token + OpenAI key (`@peculiar/x509`) |
| `.husky/pre-commit` | `.husky/` | `dc setup-version-hook` által installolt, futtatja `dc bump-version`-t |

**Config-search sorrend (LDP+CDP):** `--config <path>` flag → CWD → `.dynamo/`.

---

## 4. Mikor `dc`-t használjon az agent

| Szituáció | Parancs |
|---|---|
| új projekt-váz kell | `dc n` |
| BE-template gen | `dc gds` / `gdm` / `gctrl` |
| unit-test gen (AI) | `dc gut` / `guts` → `dc rt --fix` |
| lokál dev loop | `dc ldp` |
| egyszeri CI build (report-tal) | `dc cdp` |
| Discord értesítés CI-ből | `dc ci-dn-s` / `ci-dn-r` |
| package.json verzió-drift fix | `dc ci-ck-dl --fix --patch-only` |
| `@futdevpro/*` dep-ek bump | `dc sync-fdp-deps` (`--check` / `--patch-only` / `--stage`) |
| code review / lint | `dc rev` / `dc lint` |
| batch install/build/commit | `dc ia` / `bta` / `cpa` |
| port foglalt? | `dc ip <port>` / `dc kp <ports>` |
| config-modernizáció `.dynamo/`-ba | `dc dmc` |
| OpenAI image gen/edit | `dc gi` / `dc ie` |
| SSH/SSL/key | `dc gssh` / `gssl` / `gk` |

---

## 5. Gotcha-k

1. **LDP vs CDP** — LDP folyamatos watcher (restart-loop), CDP egyszeri CI-runner. Külön config-séma, hasonló step-formátum.
2. **Fail-fast default ON CDP-ben** — `--no-fail-fast`-tel végigfut akkor is, ha fatal step bukott.
3. **Credential store** — `dc-credentials.json` encrypted, **soha** ne `cat`-eld a tartalmát logba.
4. **Version overflow** — patch ≥100000 → minor++ reset 0. minor ≥1000 → major++ reset 0.
5. **Discord notif `${VAR}` interpoláció** — GitHub Actions env-var-okat behelyettesít.
6. **AI test gen / image gen** — OpenAI key kell (`dc aic --set` vagy `OPENAI_API_KEY`). `--dry-run` köteles első hívásnál ha költség-érzékeny vagy.
7. **`dc dmc` default DRY-RUN** — `--apply` nélkül csak listáz.
8. **`-local` verzió-skip** — `*-local` package.json verzió **non-version flag**, `dc bump-version` átugorja (lásd workspace memory).

---

## 6. Kapcsolódó dokumentumok

- [`fdp-cli.md`](fdp-cli.md) — `fdp` extendeli `dc`-t prod-DevOps + Overseer querykkel
- [`overseer-agent-access.md`](overseer-agent-access.md) — Overseer-oldal (`dc cdp` adja a reportot, `fdp pipeline-report` küldi fel)
- Dynamo CLI saját `__documentations/` — dated session docs (LDP/CDP/CCAP review)
- `NPM-packages/dynamo-cli/src/_commands/ci-tools/dev-leftovers-checker/README.md`
- Workspace `CLAUDE.md` "Common Development Commands" szekció
