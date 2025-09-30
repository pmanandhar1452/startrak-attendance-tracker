import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  qrCodeUrl?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { to, subject, html, qrCodeUrl }: EmailRequest = await req.json()

    // DEMO MODE: log emails instead of sending
    console.log("📧 [DEMO] Sending email to:", to)
    console.log("📧 [DEMO] Subject:", subject)
    console.log("📧 [DEMO] QR Code URL:", qrCodeUrl)
    console.log("📧 [DEMO] HTML Content:", html.substring(0, 200) + "...")

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully (simulated)",
        emailId: `sim_${Date.now()}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Email sending error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    )
  }
})
