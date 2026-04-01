import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getLeaderboard, type AthleteSummary } from "@/lib/athlete";
import { getRecruitTargets, type RecruitTarget } from "@/lib/recruiting";
import { getOrganizationTeams, getTeamEvents, getTeam, type TeamEvent, type TeamRecord } from "@/lib/teams";
import { searchProfiles, type SearchProfile } from "@/lib/user-profile";

export interface DirectoryData {
  verifiedScouts: SearchProfile[];
  coaches: SearchProfile[];
  clubs: TeamRecord[];
}

export interface EventDiscoveryRecord extends TeamEvent {
  teamName: string;
  teamSport: string;
  city: string;
}

export interface EventTicketRecord {
  id: string;
  eventId: string;
  userId: string;
  holderName: string;
  email: string;
  qrCode: string;
  checkedIn: boolean;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface EventRegistrationRecord {
  id: string;
  eventId: string;
  userId: string;
  message: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface EventStaffAssignment {
  id: string;
  eventId: string;
  profileUid: string;
  role: string;
  displayName: string;
}

export interface EventInternalNote {
  id: string;
  eventId: string;
  authorId: string;
  note: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface AttendanceCertificate {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  issuedAt?: { seconds?: number; nanoseconds?: number } | null;
}

function assertSignedIn() {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }
  return auth.currentUser;
}

export function getGraduationYear(profile: SearchProfile) {
  const age = profile.role?.age ?? null;
  if (!age) {
    return null;
  }

  const yearsUntilGraduation = Math.max(0, 18 - age);
  return new Date().getFullYear() + yearsUntilGraduation;
}

export function getPositionArchetype(profile: SearchProfile) {
  const position = String(profile.role?.position ?? "").toLowerCase();
  const stats = profile.athleteProfile?.stats ?? {};
  const points = Number(stats.pointsPerGame ?? 0);
  const assists = Number(stats.assistsPerGame ?? 0);
  const rebounds = Number(stats.reboundsPerGame ?? 0);

  if (position.includes("guard") && assists >= points / 2) {
    return "playmaker";
  }
  if (position.includes("guard") && points >= 18) {
    return "shot creator";
  }
  if ((position.includes("forward") || position.includes("wing")) && rebounds >= 7) {
    return "two-way wing";
  }
  if (position.includes("center") || rebounds >= 10) {
    return "rim anchor";
  }
  if (points >= 20) {
    return "primary scorer";
  }
  return "glue piece";
}

export async function getDirectoryData(filters?: { sport?: string; region?: string }) {
  const [profiles, teams] = await Promise.all([searchProfiles(""), getOrganizationTeams().catch(() => [])]);
  const sport = filters?.sport?.trim().toLowerCase() || "";
  const region = filters?.region?.trim().toLowerCase() || "";

  const filteredProfiles = profiles.filter((profile: SearchProfile) => {
    const matchesSport = !sport || String(profile.role?.sport ?? "").toLowerCase().includes(sport);
    const matchesRegion = !region || String(profile.location ?? "").toLowerCase().includes(region);
    return matchesSport && matchesRegion;
  });

  return {
    verifiedScouts: filteredProfiles.filter((profile: SearchProfile) => profile.verified && profile.role?.type === "scout"),
    coaches: filteredProfiles.filter((profile: SearchProfile) => profile.role?.type === "coach"),
    clubs: teams.filter((team: TeamRecord) => {
      const matchesSport = !sport || team.sport.toLowerCase().includes(sport);
      const matchesRegion = !region || team.location.toLowerCase().includes(region);
      return matchesSport && matchesRegion;
    }),
  } satisfies DirectoryData;
}

export async function getEventDiscovery(city: string) {
  const teams = await getOrganizationTeams().catch(() => []);
  const events = await Promise.all(
    teams.map(async (team: TeamRecord) => ({
      team,
      events: await getTeamEvents(team.id),
    }))
  );

  return events
    .flatMap(({ team, events }: { team: TeamRecord; events: TeamEvent[] }) =>
      events.map((event: TeamEvent) => ({
        ...event,
        teamName: team.name,
        teamSport: team.sport,
        city: team.location,
      }))
    )
    .filter((event: EventDiscoveryRecord) =>
      city.trim()
        ? [event.city, event.location, event.teamName].join(" ").toLowerCase().includes(city.trim().toLowerCase())
        : true
    );
}

export async function registerForShowcase(eventId: string, message: string) {
  const user = assertSignedIn();
  await addDoc(collection(db!, "showcaseRegistrations"), {
    eventId,
    userId: user.uid,
    message: message.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getMyShowcaseRegistrations() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "showcaseRegistrations"), where("userId", "==", auth.currentUser.uid), limit(50))
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      eventId: String(data.eventId ?? ""),
      userId: String(data.userId ?? ""),
      message: String(data.message ?? ""),
      createdAt:
        (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    } satisfies EventRegistrationRecord;
  });
}

export async function issueEventTicket(eventId: string, holderName: string, email: string) {
  const user = assertSignedIn();
  await addDoc(collection(db!, "eventTickets"), {
    eventId,
    userId: user.uid,
    holderName: holderName.trim() || auth.currentUser?.displayName || "HoopLink Guest",
    email: email.trim(),
    qrCode: `HL-${eventId}-${user.uid.slice(0, 8)}-${Date.now()}`,
    checkedIn: false,
    createdAt: serverTimestamp(),
  });
}

export async function getMyEventTickets() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "eventTickets"), where("userId", "==", auth.currentUser.uid), limit(50))
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      eventId: String(data.eventId ?? ""),
      userId: String(data.userId ?? ""),
      holderName: String(data.holderName ?? ""),
      email: String(data.email ?? ""),
      qrCode: String(data.qrCode ?? ""),
      checkedIn: Boolean(data.checkedIn),
      createdAt:
        (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    } satisfies EventTicketRecord;
  });
}

export async function checkInTicket(ticketId: string, qrCode: string) {
  assertSignedIn();
  const snapshot = await getDoc(doc(db!, "eventTickets", ticketId));
  if (!snapshot.exists()) {
    throw new Error("Ticket not found.");
  }
  const ticket = snapshot.data() as Record<string, unknown>;
  if (String(ticket.qrCode ?? "") !== qrCode.trim()) {
    throw new Error("QR code does not match this ticket.");
  }

  await updateDoc(doc(db!, "eventTickets", ticketId), {
    checkedIn: true,
    checkedInAt: serverTimestamp(),
  });

  await addDoc(collection(db!, "attendanceCertificates"), {
    eventId: String(ticket.eventId ?? ""),
    userId: String(ticket.userId ?? ""),
    title: "Verified Attendance",
    issuedAt: serverTimestamp(),
  });
}

export async function getAttendanceCertificates() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "attendanceCertificates"), where("userId", "==", auth.currentUser.uid), limit(50))
  );
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      eventId: String(data.eventId ?? ""),
      userId: String(data.userId ?? ""),
      title: String(data.title ?? "Attendance"),
      issuedAt:
        (data.issuedAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    } satisfies AttendanceCertificate;
  });
}

export async function assignEventStaff(eventId: string, profileUid: string, role: string, displayName: string) {
  assertSignedIn();
  await setDoc(
    doc(db!, "eventStaffAssignments", `${eventId}__${profileUid}`),
    {
      eventId,
      profileUid,
      role: role.trim() || "staff",
      displayName: displayName.trim() || "Staff",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getEventStaffAssignments(eventId: string) {
  if (!db) {
    return [];
  }
  const snapshot = await getDocs(
    query(collection(db, "eventStaffAssignments"), where("eventId", "==", eventId), limit(50))
  );
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      eventId: String(data.eventId ?? ""),
      profileUid: String(data.profileUid ?? ""),
      role: String(data.role ?? "staff"),
      displayName: String(data.displayName ?? "Staff"),
    } satisfies EventStaffAssignment;
  });
}

export async function addEventInternalNote(eventId: string, note: string) {
  const user = assertSignedIn();
  await addDoc(collection(db!, "eventInternalNotes"), {
    eventId,
    authorId: user.uid,
    note: note.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getEventInternalNotes(eventId: string) {
  if (!db) {
    return [];
  }
  const snapshot = await getDocs(
    query(collection(db, "eventInternalNotes"), where("eventId", "==", eventId), limit(50))
  );
  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      eventId: String(data.eventId ?? ""),
      authorId: String(data.authorId ?? ""),
      note: String(data.note ?? ""),
      createdAt:
        (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
    } satisfies EventInternalNote;
  });
}

export function buildRosterCsv(team: TeamRecord) {
  const rows = [
    ["uid", "displayName", "role", "permissions"],
    ...team.members.map((member) => [
      member.uid,
      member.displayName,
      member.role,
      (member.orgPermissions ?? []).join("|"),
    ]),
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildRecruitBoardPdf(targets: RecruitTarget[], profiles: SearchProfile[]) {
  const lines = [
    "HoopLink Recruiting Board",
    ...targets.map((target) => {
      const profile = profiles.find((entry) => entry.uid === target.targetUid);
      return `${profile?.displayName || target.targetUid} | ${target.stage} | ${(target.tags ?? []).join(", ") || "no tags"} | ${target.note || "no note"}`;
    }),
  ];

  const contentStream = [
    "BT",
    "/F1 14 Tf",
    "50 780 Td",
    `(${escapePdfText(lines[0])}) Tj`,
    "/F1 10 Tf",
    ...lines.slice(1).map((line, index) => `50 ${758 - index * 16} Td (${escapePdfText(line)}) Tj`),
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

export async function importStatsCsv(csvText: string) {
  const user = assertSignedIn();
  const rows = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    throw new Error("Paste a CSV with a header and at least one row.");
  }

  const headers = rows[0].split(",").map((header) => header.trim().toLowerCase());
  const gameLogs = rows.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    return {
      opponent: row.opponent || "Opponent",
      date: row.date || "",
      points: Number(row.points || 0),
      assists: Number(row.assists || 0),
      rebounds: Number(row.rebounds || 0),
      result: row.result || "",
    };
  });

  const average = (field: "points" | "assists" | "rebounds") =>
    gameLogs.length
      ? Number(
          (
            gameLogs.reduce((sum, item) => sum + Number(item[field] || 0), 0) / gameLogs.length
          ).toFixed(1)
        )
      : 0;

  await setDoc(
    doc(db!, "users", user.uid),
    {
      athleteProfile: {
        gameLogs,
        stats: {
          pointsPerGame: average("points"),
          assistsPerGame: average("assists"),
          reboundsPerGame: average("rebounds"),
        },
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getStatLeaders(filters?: {
  metric?: "followers" | "points" | "assists" | "rebounds";
  classYear?: string;
  archetype?: string;
}) {
  const profiles = await searchProfiles("");
  const filtered = profiles.filter((profile: SearchProfile) => {
    const matchesClassYear = !filters?.classYear || String(getGraduationYear(profile) ?? "") === filters.classYear;
    const matchesArchetype =
      !filters?.archetype || getPositionArchetype(profile).toLowerCase().includes(filters.archetype.toLowerCase());
    return matchesClassYear && matchesArchetype;
  });

  const metric = filters?.metric ?? "followers";
  return filtered.sort((left: SearchProfile, right: SearchProfile) => {
    if (metric === "points") {
      return Number(right.athleteProfile?.stats?.pointsPerGame ?? 0) - Number(left.athleteProfile?.stats?.pointsPerGame ?? 0);
    }
    if (metric === "assists") {
      return Number(right.athleteProfile?.stats?.assistsPerGame ?? 0) - Number(left.athleteProfile?.stats?.assistsPerGame ?? 0);
    }
    if (metric === "rebounds") {
      return Number(right.athleteProfile?.stats?.reboundsPerGame ?? 0) - Number(left.athleteProfile?.stats?.reboundsPerGame ?? 0);
    }
    return right.followers.length - left.followers.length;
  });
}

export async function getComparableAthletes(profileUid: string) {
  const profiles = await searchProfiles("");
  const base = profiles.find((profile: SearchProfile) => profile.uid === profileUid);
  if (!base) {
    return [];
  }

  const baseArchetype = getPositionArchetype(base);
  return profiles
    .filter((profile: SearchProfile) => profile.uid !== profileUid)
    .map((profile: SearchProfile) => {
      let score = 0;
      if (profile.role?.sport === base.role?.sport) score += 4;
      if (profile.role?.position === base.role?.position) score += 3;
      if (getPositionArchetype(profile) === baseArchetype) score += 2;
      if (Math.abs(Number(profile.athleteProfile?.stats?.pointsPerGame ?? 0) - Number(base.athleteProfile?.stats?.pointsPerGame ?? 0)) <= 3) score += 1;
      return { profile, score };
    })
    .sort((left: { profile: SearchProfile; score: number }, right: { profile: SearchProfile; score: number }) => right.score - left.score)
    .slice(0, 8)
    .map((entry: { profile: SearchProfile; score: number }) => entry.profile);
}

export async function getScoutWatchlistsByClassYear() {
  const [targets, profiles] = await Promise.all([getRecruitTargets(), searchProfiles("")]);
  const grouped = new Map<string, Array<{ target: RecruitTarget; profile: SearchProfile | undefined }>>();

  targets.forEach((target: RecruitTarget) => {
    const profile = profiles.find((entry: SearchProfile) => entry.uid === target.targetUid);
    const key = String(getGraduationYear(profile as SearchProfile) ?? "Unknown");
    const current = grouped.get(key) ?? [];
    current.push({ target, profile });
    grouped.set(key, current);
  });

  return Array.from(grouped.entries())
    .map(([classYear, items]) => ({ classYear, items }))
    .sort(
      (
        left: { classYear: string; items: Array<{ target: RecruitTarget; profile: SearchProfile | undefined }> },
        right: { classYear: string; items: Array<{ target: RecruitTarget; profile: SearchProfile | undefined }> }
      ) => left.classYear.localeCompare(right.classYear)
    );
}

export async function getPublicStatLeaders() {
  const [followers, points] = await Promise.all([getLeaderboard("followers"), getLeaderboard("points")]);
  return { followers, points } as { followers: AthleteSummary[]; points: AthleteSummary[] };
}
