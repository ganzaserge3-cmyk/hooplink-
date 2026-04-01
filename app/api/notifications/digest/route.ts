import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    recipientEmail?: string;
    digest?: {
      total?: number;
      unread?: number;
      byType?: Array<{ type?: string; count?: number }>;
    };
  };

  if (!body.recipientEmail?.trim()) {
    return NextResponse.json({ error: "recipientEmail is required." }, { status: 400 });
  }

  const digest = body.digest ?? { total: 0, unread: 0, byType: [] };
  const text = [
    `HoopLink Digest`,
    `Unread: ${digest.unread ?? 0}`,
    `Recent: ${digest.total ?? 0}`,
    "",
    ...(digest.byType ?? []).map((entry) => `${entry.type}: ${entry.count}`),
  ].join("\n");

  if (!process.env.EMAIL_DIGEST_WEBHOOK_URL) {
    return NextResponse.json({
      ok: true,
      simulated: true,
      message: "EMAIL_DIGEST_WEBHOOK_URL is not set, so the digest was generated but not delivered.",
      payload: { to: body.recipientEmail, text },
    });
  }

  const response = await fetch(process.env.EMAIL_DIGEST_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: body.recipientEmail.trim(),
      subject: "Your HoopLink Digest",
      text,
      digest,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Digest delivery failed." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
