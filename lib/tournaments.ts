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

export interface TournamentBracket {
  id: string;
  teamId: string;
  title: string;
  rounds: Array<{
    name: string;
    matchups: Array<{
      home: string;
      away: string;
      winner?: string;
    }>;
  }>;
}

export async function createTournamentBracket(input: {
  teamId: string;
  title: string;
  rounds: TournamentBracket["rounds"];
}) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  await addDoc(collection(db, "tournamentBrackets"), {
    teamId: input.teamId,
    title: input.title.trim(),
    rounds: input.rounds,
    createdAt: serverTimestamp(),
  });
}

function pairSeededTeams(teamNames: string[]) {
  const sorted = [...teamNames.map((name) => name.trim()).filter(Boolean)].sort((left, right) =>
    left.localeCompare(right)
  );
  const pairs: Array<{ home: string; away: string }> = [];
  for (let index = 0; index < sorted.length; index += 2) {
    pairs.push({
      home: sorted[index] ?? "TBD",
      away: sorted[index + 1] ?? "BYE",
    });
  }
  return pairs;
}

export async function createSeededTournamentBracket(input: {
  teamId: string;
  title: string;
  teamNames: string[];
}) {
  const openingRound = pairSeededTeams(input.teamNames);
  const semifinalSlots = Math.max(1, Math.ceil(openingRound.length / 2));

  const rounds: TournamentBracket["rounds"] = [
    {
      name: "Seeded Round",
      matchups: openingRound.map((matchup) => ({ ...matchup })),
    },
    {
      name: "Semifinals",
      matchups: Array.from({ length: semifinalSlots }, () => ({ home: "TBD", away: "TBD" })),
    },
    {
      name: "Final",
      matchups: [{ home: "TBD", away: "TBD" }],
    },
  ];

  await createTournamentBracket({
    teamId: input.teamId,
    title: input.title,
    rounds,
  });
}

export async function getTournamentBrackets(teamId: string) {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(
    query(collection(db, "tournamentBrackets"), where("teamId", "==", teamId), limit(20))
  );

  return snapshot.docs.map((docSnapshot: { id: string; data: () => Record<string, unknown> }) => {
    const data = docSnapshot.data() as Record<string, unknown>;
    return {
      id: docSnapshot.id,
      teamId: String(data.teamId ?? ""),
      title: String(data.title ?? ""),
      rounds: Array.isArray(data.rounds)
        ? (data.rounds as TournamentBracket["rounds"])
        : [],
    } satisfies TournamentBracket;
  });
}

function autoAdvanceRounds(rounds: TournamentBracket["rounds"]) {
  return rounds.map((round, roundIndex, allRounds) => {
    if (roundIndex === 0) {
      return round;
    }

    const previousRound = allRounds[roundIndex - 1];
    const winners = previousRound.matchups
      .map((matchup) => matchup.winner)
      .filter((winner): winner is string => Boolean(winner));

    return {
      ...round,
      matchups: round.matchups.map((matchup, matchupIndex) => ({
        ...matchup,
        home: winners[matchupIndex * 2] ?? matchup.home ?? "TBD",
        away: winners[matchupIndex * 2 + 1] ?? matchup.away ?? "TBD",
      })),
    };
  });
}

export async function recordBracketWinner(
  bracketId: string,
  roundIndex: number,
  matchupIndex: number,
  winner: string
) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "tournamentBrackets", bracketId));
  if (!snapshot.exists()) {
    throw new Error("Bracket not found.");
  }

  const bracket = snapshot.data() as Record<string, unknown>;
  const rounds = Array.isArray(bracket.rounds)
    ? ((bracket.rounds as TournamentBracket["rounds"]).map((round) => ({
        ...round,
        matchups: round.matchups.map((matchup) => ({ ...matchup })),
      })) as TournamentBracket["rounds"])
    : [];

  if (!rounds[roundIndex]?.matchups[matchupIndex]) {
    throw new Error("Matchup not found.");
  }

  rounds[roundIndex].matchups[matchupIndex].winner = winner.trim();
  const nextRounds = autoAdvanceRounds(rounds);

  await updateDoc(doc(db, "tournamentBrackets", bracketId), {
    rounds: nextRounds,
    updatedAt: serverTimestamp(),
  });
}

export async function autoAdvanceBracket(bracketId: string) {
  if (!auth?.currentUser || !db) {
    throw new Error("You must be signed in.");
  }

  const snapshot = await getDoc(doc(db, "tournamentBrackets", bracketId));
  if (!snapshot.exists()) {
    throw new Error("Bracket not found.");
  }

  const bracket = snapshot.data() as Record<string, unknown>;
  const rounds = Array.isArray(bracket.rounds)
    ? (bracket.rounds as TournamentBracket["rounds"])
    : [];

  await setDoc(
    doc(db, "tournamentBrackets", bracketId),
    {
      rounds: autoAdvanceRounds(rounds),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
