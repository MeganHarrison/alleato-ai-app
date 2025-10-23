"use client"
import { ChatKit, useChatKit } from "@openai/chatkit-react"

export default function Page() {
  const { control } = useChatKit({
    api: {
      async getClientSecret() {
        const res = await fetch("/api/chatkit/session", { method: "POST" })
        const { client_secret } = await res.json()
        return client_secret
      },
    },
  })

  return (
    <main className="flex h-screen items-center justify-center">
      <ChatKit control={control} className="w-[400px] h-[600px]" />
    </main>
  )
}
