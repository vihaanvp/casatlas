// Prisma 7 CLI does not auto-load .env. Load it here (Node 20.12+).
// Does not override vars already set in the environment (CI / Docker).
try {
  process.loadEnvFile()
} catch {
  // .env absent (CI) — env vars come from the environment instead.
}
import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? ''
  }
})
