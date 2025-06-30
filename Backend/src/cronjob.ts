import cron from "node-cron";
import prisma from './lib/prisma';
import { EventsGenerator } from "./events-generator";
import { GENERATE_COUNT, GENERATE_FREQUENCY, MAX_REFERRAL_DEPTH } from "./lib/constant";  
import { RegisterEvent, ReferralEvent, AddFriendEvent, UnfriendEvent, ConnectionEvent } from "./types";
import { LogEvent } from "@prisma/client";

export const StartCronJob = async () => {
    const cronJobController = new CronJobController();
    const generator = new EventsGenerator();
    cron.schedule(`*/${GENERATE_FREQUENCY} * * * * *`, async () => {
        const { value: events } = await generator.stream(GENERATE_COUNT).next();
        const registerEvents = events!.filter((e) => e.type === "register");
        const referralEvents = events!.filter((e) => e.type === "referral");
        const addFriendEvents = events!.filter((e) => e.type === "addfriend");
        const unfriendEvents = events!.filter((e) => e.type === "unfriend");

        await cronJobController.RegisterUsers(registerEvents)
        await cronJobController.ReferUsers(referralEvents);
        await cronJobController.AddFriends(addFriendEvents);
        await cronJobController.Unfriends(unfriendEvents);
    });
}

export class CronJobController {
    public async RegisterUsers(events : RegisterEvent[]) {
        await Promise.all(
            events.map(async (e) => {
                console.log(`Generated event: ${e.type} for user ${e.name} at ${e.created_at}`);

                try {
                    await prisma.user.create({
                        data: {
                            username: e.name,
                            networkStrength: 0, // Initial network strength
                            referralPoints: 0 // Initial referral points
                        },
                    });
                } catch (err) {
                    console.log(`[RegisterUsers] Error registering user ${e.name}, username might already be taken, ${err}`);
                }
            })
        );
    }

    public async ReferUsers(events : ReferralEvent[]) {
        await Promise.all(
            events.map(async (e) => {
                console.log(`Generated event: ${e.type} for user ${e.user} by ${e.referredBy} at ${e.created_at}`);
                const referredUser = await prisma.user.findUnique({
                    where: { username: e.user }
                });

                if (!referredUser) {
                    console.error(`[ReferUsers] User ${e.user} not found`);
                    return;
                }

                const referrerUser = await prisma.user.findUnique({
                    where: { username: e.referredBy }
                });

                if (!referrerUser) {
                    console.error(`[ReferUsers] Referral user ${e.referredBy} not found`);
                    return;
                }

                const existReferral = await prisma.referral.findFirst({
                    where: {
                        referredId: referredUser.id
                    }
                });

                if (existReferral) {
                    console.log(`[ReferUsers] ${e.user} is already referred by ${e.referredBy}`);
                    return;
                }

                const referral = await prisma.referral.create({
                    data: {
                        referrerId: referrerUser.id,
                        referrerName: referrerUser.username,
                        referredId: referredUser.id,
                        referredName: referredUser.username,
                    }
                }).catch((err) => {
                    console.error(`[ReferUsers] Error adding relationship ${e.user} referred by :${e.referredBy}`);
                });

                if (!referral) {
                    console.error(`[ReferUsers] Failed to create referral relationship for ${e.user} referred by ${e.referredBy}`);
                    return;
                }

                // Update network strength for the referred user
                await prisma.user.update({
                    where: { id: referredUser.id },
                    data: {
                        networkStrength: {
                            increment: 1
                        },
                        referrer: {
                            connect: { 
                                id: referral.id,
                                referrerId: referral.referrerId,
                                referrerName: referral.referrerName,
                                referredId: referral.referredId,
                                referredName: referral.referredName
                            }
                        }
                    }
                });

                // Update referral points for the referrer
                await prisma.user.update({
                    where: { id: referrerUser.id },
                    data: {
                        referralPoints: {
                            increment: 1
                        },
                        networkStrength: {
                            increment: 1
                        }
                    }
                });

                // Update referral points for the referral chain
                this.UpdateReferralPointsRecursive(referrerUser.id, 0)

                // Log activity for both users
                this.AddActivityLog(referrerUser.id, 1, "REFERRAL");
                this.AddActivityLog(referrerUser.id, 1, "REFERRED");
            })
        );
    }

    public async AddFriends(events : AddFriendEvent[]) {
        await Promise.all(
            events.map(async (e) => {
                console.log(`Generated event: ${e.type} for ${e.user1_name} and ${e.user2_name} at ${e.created_at}`);
                const user1 = await prisma.user.findUnique({
                    where: { username: e.user1_name }
                });

                if (!user1) {
                    console.error(`[AddFriend] User1 ${e.user1_name} not found`);
                    return;
                }

                const user2 = await prisma.user.findUnique({
                    where: { username: e.user2_name }
                });

                if (!user2) {
                    console.error(`[AddFriend] User2 ${e.user2_name} not found`);
                    return;
                }

                const friendship = await prisma.friend.findFirst({
                    where: {
                        OR: [
                            { user1Id: user1.id, user2Id: user2.id },
                            { user1Id: user2.id, user2Id: user1.id },
                        ],
                    }
                });

                if (friendship) {
                    console.log(`[AddFriend] Friend relationship already exists between ${e.user1_name} and ${e.user2_name}`);
                    return;
                }

                // Create friendship entry
                await prisma.friend.create({
                    data: {
                        user1Id: user1.id,
                        user1Name: user1.username,
                        user2Id: user2.id,
                        user2Name: user2.username,
                    }   
                }).catch((err) => {
                    console.error(`[AddFriend] Error adding friendship between ${e.user1_name} and ${e.user2_name}`, err);
                });

                // Update network strength for both users
                await prisma.user.update({
                    where: { id: user1.id },
                    data: {
                        networkStrength: {
                            increment: 1
                        }
                    }
                }).catch((err) => {
                    console.error(`[AddFriend] Error updating network strength for ${e.user1_name}`);
                });

                await prisma.user.update({
                    where: { id: user2.id },
                    data: {
                        networkStrength: {
                            increment: 1
                        }
                    }
                }).catch((err) => {
                    console.error(`[AddFriend] Error updating network strength for ${e.user2_name}`);
                });

                // Log activity for both users
                this.AddActivityLog(user1.id, 1, "FRIEND_ADDED");
                this.AddActivityLog(user2.id, 1, "FRIEND_ADDED");
            })
        );
    }

    public async Unfriends(events : UnfriendEvent[]) {
        await Promise.all(
            events.map(async (e) => {
                console.log(`Generated event: ${e.type}  for ${e.user1_name} and ${e.user2_name} at ${e.created_at}`);
                const user1 = await prisma.user.findUnique({
                    where: { username: e.user1_name }
                });

                if (!user1) {
                    console.error(`[Unfriend] User1 ${e.user1_name} not found`);
                    return;
                }

                const user2 = await prisma.user.findUnique({
                    where: { username: e.user2_name }
                });

                if (!user2) {
                    console.error(`[Unfriend] User2 ${e.user2_name} not found`);
                    return;
                }

                const friendship = await prisma.friend.findFirst({
                    where: {
                        OR: [
                            { user1Id: user1.id, user2Id: user2.id },
                            { user1Id: user2.id, user2Id: user1.id },
                        ],
                    }
                });

                if (!friendship) {
                    console.log(`[Unfriend] No friendship exists between ${e.user1_name} and ${e.user2_name}`);
                    return;
                }

                // Remove friendship entry
                await prisma.friend.delete({
                    where: { id: String(friendship.id) }
                }).catch((err) => {
                    console.error(`[Unfriend] Error delete friendship between ${e.user1_name} and ${e.user2_name}`, err);
                });

                // Update network strength for both users
                await prisma.user.update({
                    where: { id: user1.id },
                    data: {
                        networkStrength: {
                            decrement: 1
                        }
                    }
                }).catch((err) => {
                    console.error(`[AddFriend] Error updating network strength for ${e.user1_name}`);
                });

                await prisma.user.update({
                    where: { id: user2.id },
                    data: {
                        networkStrength: {
                            decrement: 1
                        }
                    }
                }).catch((err) => {
                    console.error(`[AddFriend] Error updating network strength for ${e.user2_name}`);
                });

                // Log activity for both users
                this.AddActivityLog(user1.id, -1, "FRIEND_REMOVED");
                this.AddActivityLog(user2.id, -1, "FRIEND_REMOVED");
            })
        );
    }

    private UpdateReferralPointsRecursive(userId: string, depth: number) {
        if (depth >= MAX_REFERRAL_DEPTH) return;

        prisma.referral.findMany({
            where: { referredId: userId },
            include: { referrer: true }
        }).then(referrals => {
            referrals.forEach(async (referral) => {
                // Update referral points for the referrer
                await prisma.user.update({
                    where: { id: referral.referrerId },
                    data: {
                        referralPoints: {
                            increment: 1
                        }
                    }
                });

                this.AddActivityLog(referral.referrerId, 1, "REFERRAL");

                // Recursively update points for the next level
                this.UpdateReferralPointsRecursive(referral.referredId, depth + 1);
            });
        }).catch(err => {
            console.error(`[UpdateReferralPointsRecursive] Error updating referral points for user ${userId}`);
        });
    }

    private async AddActivityLog(userId: string, amount: number, reason: LogEvent) {
        await prisma.activityLog.create({
            data: {
                userId: userId,
                amount: amount,
                reason: reason
            }
        }).catch((err) => {
            console.error(`Error logging activity ${reason} for user ${userId}`);
        });
    }
}