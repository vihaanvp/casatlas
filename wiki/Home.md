# CASAtlas Wiki

Welcome to CASAtlas — a self-hosted portfolio tool for IB DP students to document their **Creativity, Activity, Service** (CAS) experiences, with optional teacher oversight.

This wiki is split into two guides. Pick whichever matches what you're here to do.

---

## 📘 Part I — Users & Self-Hosters

If you want to **run CASAtlas for yourself**, your school, your family, or a small group, start here. No programming knowledge is needed — you'll need basic comfort with a terminal and editing a `.env` file.

| Page | Start here if you want to… |
|------|---------------------------|
| [**What Is CASAtlas?**](What-Is-CASAtlas) | Understand the product and who it's for |
| [**Features**](Features) | See what CASAtlas does, end to end |
| [**Self-Hosting Overview**](Self-Hosting-Overview) | Decide between Docker and from-source |
| [**Self-Hosting with Docker**](Self-Hosting-Docker) | Run the app on a single machine with one command |
| [**Self-Hosting from Source**](Self-Hosting-From-Source) | Run it directly with Node.js + pnpm |
| [**OAuth Setup**](OAuth-Setup) | Get Google and/or GitHub login working |
| [**Configuration**](Configuration) | All environment variables, with defaults explained |
| [**Operating CASAtlas**](Operating-CASAtlas) | Backups, upgrades, log access, secret rotation |
| [**Troubleshooting**](Troubleshooting) | Common errors and how to resolve them |

---

## 🛠 Part II — Developers

If you're **modifying or contributing** to CASAtlas — or building a fork — the pages below cover the codebase in depth, including why things are shaped the way they are.

| Page | Start here if you want to… |
|------|---------------------------|
| [**Developer Guide**](Developer-Guide) | Set up a working dev environment |
| [**Architecture**](Architecture) | Understand how the app is organized |
| [**Database Schema**](Database-Schema) | See the entities, relationships, and design choices |
| [**Adding an Experience Field**](Adding-an-Experience-Field) | Walk through changing the schema end-to-end |
| [**Testing**](Testing) | How tests work in this project |

---

## Where else to find things

- **Bug reports & feature requests** — the [Issue tracker](https://github.com/vihaanvp/casatlas/issues) on GitHub
- **Security disclosures** — see [`SECURITY.md`](https://github.com/vihaanvp/casatlas/blob/main/SECURITY.md)
- **License** — MIT (see [`LICENSE`](https://github.com/vihaanvp/casatlas/blob/main/LICENSE.md))
- **Releases** — [GitHub Releases](https://github.com/vihaanvp/casatlas/releases) (Docker images are published to GHCR on every tag)

---

> **Status:** CASAtlas is in **v0.1.x Public Preview**. Core CAS workflows work end-to-end; check the [CHANGELOG](https://github.com/vihaanvp/casatlas/blob/main/CHANGELOG.md) for what shipped in each release.
