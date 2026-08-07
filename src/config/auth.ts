export const authConfig = {
  allowRegistration: process.env.ALLOW_REGISTRATION !== "false",
  providers: {
    google: { enabled: !!process.env.GOOGLE_CLIENT_ID },
    github: { enabled: !!process.env.GITHUB_CLIENT_ID },
    credentials: { enabled: process.env.AUTH_DEV_LOGIN === "true" },
  },
} as const
