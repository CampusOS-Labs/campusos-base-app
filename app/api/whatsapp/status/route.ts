import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "WhatsApp service active",
    version: "1.0.0",
  })
}
