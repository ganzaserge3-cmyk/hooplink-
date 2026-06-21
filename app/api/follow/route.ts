import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => ({}))) as {
            targetUid?: string;
            isFollowing?: boolean;
        };

        if (!body.targetUid || typeof body.isFollowing !== "boolean") {
            return NextResponse.json({ error: "targetUid and isFollowing are required." }, { status: 400 });
        }

        // In production, you would:
        // 1. Verify the user is authenticated
        // 2. Call the toggleFollowUser function from lib/user-profile.ts
        // 3. Trigger push notification to the target user if they're being followed

        // For now, we'll return success since the client-side toggleFollowUser handles the Firestore updates
        // The notification is already created in Firestore by createNotification()

        return NextResponse.json({
            ok: true,
            message: body.isFollowing ? "Unfollowed successfully." : "Followed successfully."
        });
    } catch (error) {
        console.error("Error in follow API:", error);
        return NextResponse.json({ error: "Failed to process follow action." }, { status: 500 });
    }
}