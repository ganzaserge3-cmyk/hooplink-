import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import type { SearchProfile } from "@/lib/user-profile";

export interface SavedFilterPreset {
  id: string;
  scope: "discover" | "search";
  name: string;
  filters: Record<string, string | boolean>;
}

export async function saveFilterPreset(input: {
  scope: "discover" | "search";
  name: string;
  filters: Record<string, string | boolean>;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await addDoc(collection(db, "filterPresets"), {
    userId: auth.currentUser.uid,
    scope: input.scope,
    name: input.name.trim(),
    filters: input.filters,
    createdAt: serverTimestamp(),
  });
}

export async function getFilterPresets(scope: "discover" | "search") {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, "filterPresets"),
      where("userId", "==", auth.currentUser.uid),
      where("scope", "==", scope),
      limit(20)
    )
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      scope: data.scope === "search" ? "search" : "discover",
      name: String(data.name ?? ""),
      filters:
        (data.filters as Record<string, string | boolean> | undefined) ?? {},
    } satisfies SavedFilterPreset;
  });
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildRecruitProfilePdf(profile: SearchProfile) {
  const lines = [
    profile.displayName,
    `Username: @${profile.username || profile.uid.slice(0, 8)}`,
    `Role: ${profile.role?.type || "member"}`,
    `Sport: ${profile.role?.sport || "n/a"}`,
    `Position: ${profile.role?.position || "n/a"}`,
    `Team: ${profile.role?.team || "n/a"}`,
    `Experience: ${profile.role?.experience || "n/a"}`,
    `Age: ${profile.role?.age ?? "n/a"}`,
    `Height: ${profile.role?.height || "n/a"}`,
    `Location: ${profile.location || "n/a"}`,
    `Bio: ${profile.role?.bio || "n/a"}`,
  ];

  const contentStream = [
    "BT",
    "/F1 16 Tf",
    "50 780 Td",
    `(${escapePdfText(lines[0])}) Tj`,
    "/F1 11 Tf",
    ...lines.slice(1).map((line, index) => `50 ${758 - index * 18} Td (${escapePdfText(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}
