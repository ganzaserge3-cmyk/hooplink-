"use client";

import { useEffect, useState } from "react";
import { Trophy, Star, Flame, Target, Gift, Award, Zap, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserGamification,
  UserGamification,
  Achievement,
  DailyChallenge,
  awardAchievement,
  claimChallengeReward,
  redeemReward,
  REWARDS,
  calculateLevel,
  pointsForNextLevel,
  pointsInCurrentLevel,
} from "@/lib/gamification";

interface GamificationDashboardProps {
  userId?: string; // Optional, defaults to current user
}

export function GamificationDashboard({ userId }: GamificationDashboardProps) {
  const { user } = useAuth();
  const [gamification, setGamification] = useState<UserGamification | null>(null);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (!targetUserId) return;

    const loadGamification = async () => {
      try {
        const data = await getUserGamification(targetUserId);
        setGamification(data);
      } catch (error) {
        console.error("Error loading gamification:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGamification();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!gamification) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Gamification data not available</p>
        </CardContent>
      </Card>
    );
  }

  const isOwnProfile = !userId || userId === user?.uid;

  return (
    <div className="space-y-6">
      {/* Level & Points Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Level {gamification.level}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{gamification.totalPoints.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{gamification.availablePoints}</p>
              <p className="text-sm text-muted-foreground">Available Points</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {gamification.level + 1}</span>
              <span>
                {pointsInCurrentLevel(gamification.totalPoints)} / {pointsForNextLevel(gamification.level)}
              </span>
            </div>
            <Progress
              value={(pointsInCurrentLevel(gamification.totalPoints) / pointsForNextLevel(gamification.level)) * 100}
              className="h-2"
            />
          </div>

          {/* Activity Streak */}
          <div className="flex items-center gap-2 pt-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm">
              {gamification.streaks.current} day streak
              {gamification.streaks.longest > gamification.streaks.current &&
                ` (best: ${gamification.streaks.longest})`
              }
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="challenges">Daily Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          <AchievementsList
            achievements={gamification.achievements}
            totalPoints={gamification.totalPoints}
          />
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          {isOwnProfile ? (
            <DailyChallenges
              challenges={gamification.dailyChallenges}
              onClaimReward={async (challengeId) => {
                if (await claimChallengeReward(targetUserId!, challengeId)) {
                  // Refresh data
                  const updated = await getUserGamification(targetUserId!);
                  setGamification(updated);
                }
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Daily challenges are private
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          {isOwnProfile ? (
            <RewardsShop
              availablePoints={gamification.availablePoints}
              redeemedRewards={gamification.redeemedRewards}
              onRedeemReward={async (rewardId) => {
                if (await redeemReward(targetUserId!, rewardId)) {
                  // Refresh data
                  const updated = await getUserGamification(targetUserId!);
                  setGamification(updated);
                }
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Rewards are personal
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default GamificationDashboard;

interface AchievementsListProps {
  achievements: Achievement[];
  totalPoints: number;
}

function AchievementsList({ achievements, totalPoints }: AchievementsListProps) {
  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);

  return (
    <div className="space-y-6">
      {/* Unlocked Achievements */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Unlocked ({unlockedAchievements.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unlockedAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} unlocked />
          ))}
        </div>
      </div>

      {/* Locked Achievements */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Locked Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lockedAchievements.slice(0, 6).map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} unlocked={false} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
}

function AchievementCard({ achievement, unlocked }: AchievementCardProps) {
  const rarityColors = {
    common: "bg-gray-100 text-gray-800",
    rare: "bg-blue-100 text-blue-800",
    epic: "bg-purple-100 text-purple-800",
    legendary: "bg-yellow-100 text-yellow-800",
  };

  return (
    <Card className={`transition-all ${unlocked ? "border-primary/50 bg-primary/5" : "opacity-60"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{achievement.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{achievement.name}</h4>
              <Badge variant="outline" className={rarityColors[achievement.rarity]}>
                {achievement.rarity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">+{achievement.points} pts</Badge>
              {unlocked && achievement.unlockedAt && (
                <span className="text-xs text-muted-foreground">
                  {achievement.unlockedAt.toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DailyChallengesProps {
  challenges: DailyChallenge[];
  onClaimReward: (challengeId: string) => void;
}

function DailyChallenges({ challenges, onClaimReward }: DailyChallengesProps) {
  const activeChallenges = challenges.filter(c => !c.completed);
  const completedChallenges = challenges.filter(c => c.completed && !c.claimed);
  const claimedChallenges = challenges.filter(c => c.claimed);

  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Challenges
          </h3>
          <div className="space-y-3">
            {activeChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Completed - Claim Rewards!
          </h3>
          <div className="space-y-3">
            {completedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClaim={() => onClaimReward(challenge.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Claimed Challenges */}
      {claimedChallenges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Completed Today
          </h3>
          <div className="space-y-3">
            {claimedChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} claimed />
            ))}
          </div>
        </div>
      )}

      {challenges.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="mx-auto h-12 w-12 mb-4" />
          <p>Daily challenges will be available soon!</p>
        </div>
      )}
    </div>
  );
}

interface ChallengeCardProps {
  challenge: DailyChallenge;
  onClaim?: () => void;
  claimed?: boolean;
}

function ChallengeCard({ challenge, onClaim, claimed }: ChallengeCardProps) {
  const progress = (challenge.current / challenge.target) * 100;

  return (
    <Card className={claimed ? "border-green-200 bg-green-50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">{challenge.title}</h4>
          <Badge variant="secondary">+{challenge.points} pts</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{challenge.current} / {challenge.target}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {claimed ? (
          <div className="flex items-center gap-2 mt-3 text-green-600">
            <Award className="h-4 w-4" />
            <span className="text-sm font-medium">Reward Claimed!</span>
          </div>
        ) : challenge.completed && onClaim ? (
          <Button onClick={onClaim} className="w-full mt-3" size="sm">
            <Gift className="h-4 w-4 mr-2" />
            Claim Reward
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Leaderboard() {
  // Placeholder - would need backend implementation
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Leaderboard coming soon!</p>
        <p className="text-sm text-muted-foreground mt-2">
          Compete with other athletes for the top spots
        </p>
      </CardContent>
    </Card>
  );
}

interface RewardsShopProps {
  availablePoints: number;
  redeemedRewards: string[];
  onRedeemReward: (rewardId: string) => void;
}

function RewardsShop({ availablePoints, redeemedRewards, onRedeemReward }: RewardsShopProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Rewards Shop
        </h3>
        <Badge variant="secondary">{availablePoints} points available</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REWARDS.map((reward) => {
          const alreadyRedeemed = redeemedRewards.includes(reward.id);
          const canAfford = availablePoints >= reward.cost;

          return (
            <Card key={reward.id} className={alreadyRedeemed ? "border-green-200 bg-green-50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{reward.name}</h4>
                  <Badge variant={canAfford ? "default" : "secondary"}>
                    {reward.cost} pts
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>

                {alreadyRedeemed ? (
                  <Badge variant="outline" className="text-green-600">
                    <Award className="h-3 w-3 mr-1" />
                    Redeemed
                  </Badge>
                ) : (
                  <Button
                    onClick={() => onRedeemReward(reward.id)}
                    disabled={!canAfford}
                    size="sm"
                    className="w-full"
                  >
                    {canAfford ? "Redeem" : "Not enough points"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
