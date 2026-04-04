import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { getCurrentUserProfile } from "@/lib/user-profile";

export interface LiveScoreRecord {
  id: string;
  teamId: string;
  eventId: string;
  teamName: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  status: "scheduled" | "live" | "final";
  periodLabel: string;
  updatedAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface RecoveryJournalEntry {
  id: string;
  userId: string;
  date: string;
  status: "great" | "good" | "sore" | "injured";
  energy: number;
  soreness: number;
  sleepHours: number;
  notes: string;
  createdAt?: { seconds?: number; nanoseconds?: number } | null;
}

export interface SeasonalDashboard {
  gamesPlayed: number;
  wins: number;
  losses: number;
  avgPoints: number;
  avgAssists: number;
  avgRebounds: number;
  totalViews: number;
  totalPosts: number;
  bestGame: {
    label: string;
    totalContribution: number;
  } | null;
  recoveryTrend: number;
  availability: string;
}

interface GameLogEntry {
  opponent?: string;
  date?: string;
  points?: number;
  assists?: number;
  rebounds?: number;
  result?: string;
}

interface SeasonAccumulator {
  points: number;
  assists: number;
  rebounds: number;
  wins: number;
  losses: number;
  bestGame: SeasonalDashboard["bestGame"];
}

function mapLiveScore(id: string, data: Record<string, unknown>): LiveScoreRecord {
  return {
    id,
    teamId: String(data.teamId ?? ""),
    eventId: String(data.eventId ?? ""),
    teamName: String(data.teamName ?? "Team"),
    opponentName: String(data.opponentName ?? "Opponent"),
    teamScore: Number(data.teamScore ?? 0),
    opponentScore: Number(data.opponentScore ?? 0),
    status:
      data.status === "scheduled" || data.status === "final" ? data.status : "live",
    periodLabel: String(data.periodLabel ?? "Q1"),
    updatedAt:
      (data.updatedAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
  };
}

function mapRecoveryEntry(id: string, data: Record<string, unknown>): RecoveryJournalEntry {
  return {
    id,
    userId: String(data.userId ?? ""),
    date: String(data.date ?? ""),
    status:
      data.status === "great" || data.status === "sore" || data.status === "injured"
        ? data.status
        : "good",
    energy: Number(data.energy ?? 0),
    soreness: Number(data.soreness ?? 0),
    sleepHours: Number(data.sleepHours ?? 0),
    notes: String(data.notes ?? ""),
    createdAt:
      (data.createdAt as { seconds?: number; nanoseconds?: number } | null | undefined) ?? null,
  };
}

export async function upsertTeamLiveScore(input: {
  teamId: string;
  eventId: string;
  teamName: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  status: "scheduled" | "live" | "final";
  periodLabel: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const scoreId = `${input.teamId}__${input.eventId}`;
  await setDoc(
    doc(db, "liveScores", scoreId),
    {
      ...input,
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser.uid,
    },
    { merge: true }
  );
}

export async function getLiveScoresForTeam(teamId: string) {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, "liveScores"),
      where("teamId", "==", teamId),
      limit(20)
    )
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapLiveScore(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
  );
}

export async function getCurrentUserLiveScores() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const teamsSnapshot = await getDocs(
    query(collection(db, "teams"), where("memberIds", "array-contains", auth.currentUser.uid), limit(20))
  );
  const teamIds = teamsSnapshot.docs.map((docSnapshot: { id: string }) => docSnapshot.id);
  if (teamIds.length === 0) {
    return [];
  }

  const liveScoresSnapshot = await getDocs(query(collection(db, "liveScores"), limit(50)));
  return liveScoresSnapshot.docs
    .map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
      mapLiveScore(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
    )
    .filter((entry: LiveScoreRecord) => teamIds.includes(entry.teamId))
    .sort((left: LiveScoreRecord, right: LiveScoreRecord) => {
      const leftWeight = left.status === "live" ? 2 : left.status === "scheduled" ? 1 : 0;
      const rightWeight = right.status === "live" ? 2 : right.status === "scheduled" ? 1 : 0;
      return rightWeight - leftWeight;
    });
}

export async function addRecoveryJournalEntry(input: {
  date: string;
  status: "great" | "good" | "sore" | "injured";
  energy: number;
  soreness: number;
  sleepHours: number;
  notes: string;
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await addDoc(collection(db, "recoveryJournal"), {
    userId: auth.currentUser.uid,
    date: input.date.trim(),
    status: input.status,
    energy: input.energy,
    soreness: input.soreness,
    sleepHours: input.sleepHours,
    notes: input.notes.trim(),
    createdAt: serverTimestamp(),
  });
}

export async function getCurrentUserRecoveryJournal() {
  if (!auth?.currentUser || !db) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(db, "recoveryJournal"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("date", "desc"),
      limit(30)
    )
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) =>
    mapRecoveryEntry(docSnapshot.id, docSnapshot.data() as Record<string, unknown>)
  );
}

export async function getCurrentSeasonDashboard(): Promise<SeasonalDashboard | null> {
  if (!auth?.currentUser || !db) {
    return null;
  }

  const [profile, postsSnapshot, recoveryEntries] = await Promise.all([
    getCurrentUserProfile(),
    getDocs(query(collection(db, "posts"), where("userId", "==", auth.currentUser.uid), limit(100))),
    getCurrentUserRecoveryJournal(),
  ]);

  const typedProfile = (profile as
    | {
        role?: { availabilityStatus?: string };
        athleteProfile?: {
          gameLogs?: Array<{
            opponent?: string;
            date?: string;
            points?: number;
            assists?: number;
            rebounds?: number;
            result?: string;
          }>;
        };
      }
    | null);
  const gameLogs: GameLogEntry[] = typedProfile?.athleteProfile?.gameLogs ?? [];
  const totals = gameLogs.reduce<SeasonAccumulator>(
    (accumulator: SeasonAccumulator, game: GameLogEntry) => {
      const points = Number(game.points ?? 0);
      const assists = Number(game.assists ?? 0);
      const rebounds = Number(game.rebounds ?? 0);
      const totalContribution = points + assists + rebounds;
      const result = String(game.result ?? "").toLowerCase();

      accumulator.points += points;
      accumulator.assists += assists;
      accumulator.rebounds += rebounds;
      if (result.startsWith("w")) {
        accumulator.wins += 1;
      } else if (result.startsWith("l")) {
        accumulator.losses += 1;
      }
      if (!accumulator.bestGame || totalContribution > accumulator.bestGame.totalContribution) {
        accumulator.bestGame = {
          label: `${game.date || "Game"} vs ${game.opponent || "Opponent"}`,
          totalContribution,
        };
      }
      return accumulator;
    },
    {
      points: 0,
      assists: 0,
      rebounds: 0,
      wins: 0,
      losses: 0,
      bestGame: null as SeasonalDashboard["bestGame"],
    }
  );

  const totalViews = postsSnapshot.docs.reduce((sum: number, docSnapshot: { data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return sum + Number(data.views ?? 0);
  }, 0);

  const recoveryTrend = recoveryEntries.length
    ? Math.round(
        recoveryEntries.reduce((sum: number, entry: RecoveryJournalEntry) => sum + entry.energy - entry.soreness, 0) /
          recoveryEntries.length
      )
    : 0;

  const gamesPlayed = gameLogs.length;
  return {
    gamesPlayed,
    wins: totals.wins,
    losses: totals.losses,
    avgPoints: gamesPlayed ? Number((totals.points / gamesPlayed).toFixed(1)) : 0,
    avgAssists: gamesPlayed ? Number((totals.assists / gamesPlayed).toFixed(1)) : 0,
    avgRebounds: gamesPlayed ? Number((totals.rebounds / gamesPlayed).toFixed(1)) : 0,
    totalViews,
    totalPosts: postsSnapshot.docs.length,
    bestGame: totals.bestGame,
    recoveryTrend,
    availability: typedProfile?.role?.availabilityStatus || "available",
  };
}

export async function getRecoverySnapshot() {
  const entries = await getCurrentUserRecoveryJournal();
  const latest = entries[0] ?? null;
  return {
    latest,
    streak: entries.filter((entry: RecoveryJournalEntry) => entry.status === "great" || entry.status === "good").length,
  };
}
