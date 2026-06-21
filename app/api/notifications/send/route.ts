import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

import { db } from "@/lib/firebase";

async function deliverPush(input: { token: string; title: string; body: string; url?: string; type?: string; actorId?: string; postId?: string }) {
  if (!process.env.PUSH_DELIVERY_WEBHOOK_URL) {
    return { ok: true, simulated: true };
  }

  const response = await fetch(process.env.PUSH_DELIVERY_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Push delivery failed.");
  }

  return { ok: true, simulated: false };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      recipientId?: string;
      title?: string;
      body?: string;
      url?: string;
      type?: string;
      actorId?: string;
      postId?: string;
    };

    if (!body.recipientId || !body.title || !body.body) {
      return NextResponse.json({ error: "recipientId, title, and body are required." }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: "Firebase is not configured." }, { status: 500 });
    }

    const devices = await getDocs(
      query(collection(db, "pushDevices"), where("userId", "==", body.recipientId), limit(20))
    );

    const tokens = devices.docs
      .map((device: { data: () => Record<string, unknown> }) => String((device.data() as Record<string, unknown>).token ?? "").trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({ ok: true, delivered: 0, message: "No registered push devices." });
    }

    const results = await Promise.allSettled(
      tokens.map((token: string) =>
        deliverPush({
          token,
          title: body.title!.trim(),
          body: body.body!.trim(),
          url: body.url || "/notifications",
          type: body.type || "notification",
          actorId: body.actorId,
          postId: body.postId,
        })
      )
    );

    const delivered = results.filter((result) => result.status === "fulfilled").length;
    const simulated = results.some(
      (result) => result.status === "fulfilled" && result.value.simulated
    );

    return NextResponse.json({
      ok: true,
      delivered,
      failed: results.length - delivered,
      simulated,
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json({ error: "Failed to send push notification." }, { status: 500 });
  }
}