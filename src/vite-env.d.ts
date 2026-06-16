/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PAYPAL_CLIENT_ID?: string
  readonly VITE_PAYPAL_CURRENCY?: string
  readonly VITE_WHATSAPP_CHAT_LINK?: string
  readonly VITE_YOUTUBE_CHANNEL_LINK?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
