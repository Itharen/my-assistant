# 🧑 LinkedIn PROFIL-FRISSÍTÉS — 2026-09

> **Owner, 2026-09-11 02:10:** *„Azután akartam csak válaszolni a LinkedIn üzenetekre, hogyha már
> a posztokat meg a profilt update-eltük."*

⭐ **A sorrend indoka jó, és felülírja a korábbi javaslatomat:** aki a válaszodból átkattint,
**frissített profilra** érkezzen. Ezért a sorrend: **profil → posztok → üzenetek.**

**Forrás:** a véglegesített `current/cv/releases/2026-09/cv-2026-09.pdf`.
**Mai állapot:** `current/linkedin/profile-current.json` *(mérve 2026-09-11)*.
📋 **Használat:** mezőnként másold át. A LinkedIn-limit minden mezőnél ki van írva.

---

## 1️⃣ HEADLINE  *(limit: 220 karakter)*

**MOST — 89 karakter**
```
AI Systems Engineer & Agent Builder | Full-stack Architect | TypeScript, Angular, Node.js
```

**JAVASOLT — 127 karakter** *(mérve)*
```
AI Solution Architect | Agent Orchestration & LLM Integration | Full-stack + DevOps | 15+ years | Contractor via my own company
```

**Mi változott és miért**

| | |
|---|---|
| `AI Systems Engineer` → **`AI Solution Architect`** | ez a CV vezető sora; az *architect* dönt, az *engineer* kivitelez |
| **`+ DevOps`** és **`15+ years`** bekerült | a te kérésedre a CV fejlécébe is; itt ugyanaz a két hiányzó jelzés |
| a technológia-lista **kikerült** | a headline a **pozicionálásé**; a `TypeScript, Angular, Node.js` úgyis ott van lentebb, és a helyét most a tapasztalat és a forma foglalja el |
| **`Contractor via my own company`** | a *HOW I WORK* első mondata. Aki megkeres, **rögtön tudja**, és nem megy el két kör a tisztázásra |

---

## 2️⃣ ABOUT  *(limit: 2600 karakter)*

**MOST — 1285 karakter.** ⚠️ Két baja van:

1. 🔴 **Hiányoznak a szóközök a mondatok között** — *„…internal tools.My focus is…"*, *„…to
   production.I work on…"*. Ez **11 helyen** fordul elő; export-hiba, de a profilodon **hanyagságnak
   látszik**.
2. Nincs benne semmi abból, ami a mostani munkád **magja**: az agent-agy, a RAG, az MCP-szerverek,
   a saját CI/CD, a 73 repós flotta, a DevOps.

**JAVASOLT — 1684 karakter** *(mérve)*

```
I build agentic systems — and I have built several different kinds: a development-agent
workspace, voice-to-voice assistants, and single- and multi-purpose agents for policy,
document and FAQ work.

The layer I am most proud of is an agent brain of my own: a local-first memory service that
makes a whole fleet of repositories, docs, decisions and session history reliably retrievable
for agents, behind one MCP and REST interface.

Around it: RAG end to end — embedding pipelines, vector search and scoped, versioned retrieval
over private corpora, with self-hosted models next to hosted APIs when cost, latency or data
residency demand it. Plus a long line of MCP servers and agent tooling built to order.

None of this is a demo. It runs across a 73-repository estate governed by machine-readable
rules that every agent in it reads and obeys, on delivery infrastructure I built myself: an
in-house CI/CD orchestrator with a coalescing job queue, containerised runners and per-step
reporting, and auto-generated end-to-end test suites from typed form models.

Underneath it is a decade and a half of full-stack engineering: TypeScript, NodeJS, Angular,
Python, C# and Unity3D. I own the whole chain — architecture, implementation, deployment,
people.

How I work: contractor only, through my own company. Project engagements first, short and long
alike; a subcontractor arrangement works too. Full remote, with the usual exceptions —
onboarding, getting to know the systems, and consultation with customers.

What a company buys from me is not a pair of hands. It is a working system, and the
infrastructure that keeps delivering it.

→ Future Development Program Kft.: futdevpro.hu
```

---

## 🙋 EGY DÖNTÉS, MIELŐTT ÁTMÁSOLOD

A mostani szövegedben ez a mondat szerepel:

> *„I also operate through my own company, which allows me to **scale when needed and bring in
> additional developers** for larger projects."*

**Kihagytam** a javaslatból. ⚠️ Nem azért, mert tiltott — a tiltás a **te párhuzamos
kapacitásodra** szól, ez viszont **csapat-bővítésről** szól, az más. Két ok miatt hagytam el:

1. a `HOW I WORK` szerint **te** vagy a szerződő fél, kontraktorként — a „hozok még fejlesztőket"
   ezt **elmossa**, és ügynökség-szagot ad;
2. a CV-ben sincs benne.

📌 **Ha szeretnéd visszatenni, szólj** — egy mondat, és bekerül.

---

## ⚠️ Amit NEM tudok ellenőrizni

A LinkedIn-profilnak több mezője van, mint amit az export visszaad *(Experience, Skills, Featured,
ajánlások)*. Ez a javaslat a **Headline** és az **About** mezőre szól — a többit, ha frissíteni
akarod, **együtt kell végignéznünk**, mert nem látom őket.
