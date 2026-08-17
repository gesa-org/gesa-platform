import { NextResponse } from "next/server";
import { translateBatch } from "@/lib/translate";

const MAX_TEXTS_PER_REQUEST = 200;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const texts = Array.isArray(body?.texts) ? (body.texts as unknown[]).filter((t) => typeof t === "string") : [];
  const targetLang = typeof body?.targetLang === "string" ? body.targetLang : null;

  if (!targetLang || texts.length === 0) {
    return NextResponse.json({ error: "texts and targetLang are required" }, { status: 400 });
  }

  const trimmed = (texts as string[]).slice(0, MAX_TEXTS_PER_REQUEST);
  const translated = await translateBatch(trimmed, targetLang);

  return NextResponse.json({ translated });
}
