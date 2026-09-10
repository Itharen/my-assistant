# 🔎 Flotta-felderítés a CV-hez — mi mutat még high value-t

> **Owner, 2026-09-10 23:30:** *„a szakértelmeimet feltérképezve egy kicsit a flottában is
> körülnézhetsz, hogy mi mindent csináltam még, ami érdekes lehet itt."* ·
> *„mi minden az, ami még high value-t mutat."*

**Forrás:** `E:/Programming/Own/CURSOR/fleet-registry.json` *(73 repó)* + a projektek `README.md`-jei.
**Mérve:** 2026-09-10.

## A flotta mérete — ez maga is CV-tétel

| Kategória | Repó |
|---|---|
| LIVE-projects | 36 |
| NPM-packages | 13 |
| STALE-projects | 12 |
| FDP-GAME-projects | 4 |
| OGS-projects | 4 |
| TEMPLATE-projects | 2 |
| gyökér *(fdp-devops, fdp-documentations)* | 2 |
| **Összesen** | **73** |

---

## 🔴 A HÁROM LEGERŐSEBB, AMI MOST NINCS BENNE A CV-BEN

### 1. Saját CI/CD-platform — **Overseer**
Nem „használok Jenkinst", hanem **megépítette a pipeline-vezérlőt**: webhook → job-sor →
Docker-alapú futtatók → lépésenkénti riport → dashboard. Van benne **job-összevonás**
*(projekt+ág-onként egy bejegyzés)*, **prioritás-öregítés**, secret-kezelés (AES-256), RBAC,
és saját CLI (`fdp`) a DevOps-műveletekhez. A `fdp-devops` alatt **21 szolgáltatásos**
Docker-compose környezet, webhook-szerver SSL-kezeléssel.

⭐ **Miért high value B2B-ben:** ez a „nem csak fejlesztek, hanem **szállítok** is" bizonyítéka.

### 2. Vektoros agent-memória MCP-szerverként — **FDP Agent Memory**
Local-first, **saját MongoDB**, **saját vektor-keresés** (nem Atlas), **6 szakosított tár**
+ alias-feloldó, MCP `read`/`write`/`capabilities` felület **és** REST. Cserélhető
embedding-szolgáltató (lokális LM Studio vagy OpenAI). Scope-os, verziózott tudás.

⭐ **Miért high value:** pont ez az, amit ma minden cég keres — **RAG-infrastruktúra**, nem
prompt-írás. És **MCP-szerver-fejlesztés**, ami 2026-ban a legfrissebb integrációs réteg.

### 3. Automatikusan generált E2E-tesztkészlet — **dynamo-e2e**
Forms-modellekből **generál** Playwright-suite-okat: típusos, felülírható, diffelhető.
18 mező-típusú registry, form-coverage, viewport-audit, Core-Web-Vitals diagnosztika,
saját CLI (`dye2e`). **98,37% coverage, 254 spec.** Mellette az `fdp-e2e-helpers`
9 előre katalogizált űrlappal.

⭐ **Miért high value:** mérhető minőség-garancia — a B2B-ben ez a kockázat-csökkentés.

---

## 🟡 TOVÁBBI TÉTELEK, amik erősítenek

| Mi | Mit mutat | CV-ben |
|---|---|---|
| **73 repós flotta gépi olvasású szabály-rendszerrel** — generált szabály-blokk MINDEN repó agent-fájljában, központi doksi-repó, propagáló szkriptek | AI-asszisztált fejlesztés **méretben**, nem demóban | ⭐ **javaslom** |
| **master-control-mcp** — saját MCP-csomag | MCP-eszközfejlesztés | képességként |
| **unblockable-browser-handler-tool** — böngésző-automatizálás | RPA / integráció ott is, ahol nincs API | képességként |
| **fdp-credit-service** *(kiadatlan)* | fizetés/kredit-elszámolás, jogi következményekkel | 🔒 név nélkül |
| **fdp-auth-service** *(kiadatlan)* | egységes auth, OAuth2, JWT, e-mail-verifikáció | 🔒 név nélkül |
| **Játékok**: WarBots (+ arena, conquest), Livirrium, Portalhold, Prototyper, war-factory, productor | Unity mélység, multiplayer, determinisztikus szimuláció | a WarBots már benne van |
| **art-tarot · 3x3 · ideology-forum · niche-datasets** | termék-kísérletek, adat-termékek | ⚠️ kiadatlan → név nélkül |

---

## ⚠️ AMIT NEM TETTEM BE — és miért

| Mi | Miért nem |
|---|---|
| **OGS-projects** *(Oldlight Gaming Studio: goldaholic, oldlight-bot, oldlight-site)* | 🔴 **Nem tudom igazolni, hogy az ő munkája és megnevezhető-e.** A repó egy **másik GitHub-szervezeté** (`Oldlight-Games-Studio`), és az owner-profilban nincs róla semmi. ⇒ **owner-kérdés**, nem feltételezés |
| Konkrét ügyfélnevek a szerződéses munkákból | a CV eddig sem nevezte meg őket |
| STALE-projects | elavult vonal, nem erősít |

---

## 📌 A javaslatom a CV-be

**Egy új, tömör blokk** *(vagy a meglévők bővítése)* ezzel a három ténnyel:

> **Delivery infrastructure I built and run** — an in-house CI/CD orchestrator (webhook → queued
> Docker runners → per-step reporting, secret management, RBAC) · a local-first vector memory
> service exposed over MCP and REST, with swappable embedding providers · auto-generated Playwright
> E2E suites from typed form models (98% coverage on the engine itself).
>
> **Across a 73-repository fleet** governed by machine-readable rules that every AI agent in it obeys.

⛔ **AMI NEM MEHET BELE:** hogy ezek miatt **több munkát tud párhuzamosan vinni**. Owner,
2026-09-10 23:47: *„ezt nem fogom senkinek az orrára kötni."* A **képesség** megy ki, a **kapacitás**
nem. L. `current/principles/cv-writing.md` §1 tiltás.
