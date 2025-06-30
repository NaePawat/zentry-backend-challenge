import { prismaMock } from './singleton';
import { CronJobController } from "../cronjob";
import { EventsGenerator } from "../events-generator";
import { LogEvent } from '@prisma/client';

describe("Cronjob", () => {
    let cronJobController : CronJobController;
    let generator : EventsGenerator;

    const count = 10

    beforeEach(async () => {
        cronJobController = new CronJobController();
        generator = new EventsGenerator();
    });

    it("should generate register events to database correctly", async () => {
        const stream = generator.stream(count);
        const { value: events } = await stream.next();
        const registerEvents = events!.filter((e) => e.type === "register");

        await cronJobController.RegisterUsers(registerEvents);
        expect(prismaMock.user.create).toHaveBeenCalledTimes(registerEvents.length);
    });

    it("should generate referral events to database correctly", async () => {
        const stream = generator.stream(count);
        const { value: events } = await stream.next();
        const referralEvents = events!.filter((e) => e.type === "referral");
        // wrap in if-case since stream possibility for referral events is low
        if (referralEvents.length > 0)
        {
            const testEvent = referralEvents[0]
            const mockUser = {
                id: "1234",
                username : testEvent.user,
                networkStrength : 0,
                referralPoints : 0,
                createdAt : new Date(),
                updatedAt : new Date()
            }

            const mockReferral = {
                id: "2345",
                referrerId: "0",
                referredId: "1",
                createdAt : new Date(),
                updatedAt : new Date()
            }

            const mockActivityLog = {
                id: "3456",
                userId: "0",
                amount: 1,
                createdAt : new Date(),
                reason : "REFERRAL" as LogEvent
            }

            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            prismaMock.referral.create.mockResolvedValue(mockReferral);
            prismaMock.referral.findMany.mockResolvedValue([mockReferral]);
            prismaMock.activityLog.create.mockResolvedValue(mockActivityLog);

            await cronJobController.ReferUsers([testEvent]);
            expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(2); // one for referred user, one for referrer user
            expect(prismaMock.referral.findFirst).toHaveBeenCalled();
            expect(prismaMock.referral.findMany).toHaveBeenCalled();
            expect(prismaMock.activityLog.create).toHaveBeenCalledTimes(3); //referred user event, referrer event, and recursive update event
        } else {
            console.log("insufficient events were generated");
        }
    });

    it("should generate add friends events to database correctly", async () => {
        const stream = generator.stream(count);
        const { value: events } = await stream.next();
        const addFriendEvents = events!.filter((e) => e.type === "addfriend");

        const mockUser = {
            id: "1234",
            username : addFriendEvents[0].user1_name,
            networkStrength : 0,
            referralPoints : 0,
            createdAt : new Date(),
            updatedAt : new Date()
        }

        const mockUser2 = {
            id: "1234",
            username : addFriendEvents[0].user2_name,
            networkStrength : 0,
            referralPoints : 0,
            createdAt : new Date(),
            updatedAt : new Date()
        }

        const mockFriend = {
            id: "abcd",
            user1Id: "0",
            user2Id: "1",
            createdAt : new Date(),
            updatedAt : new Date()
        }

        const mockActivityLog = {
            id: "3456",
            userId: "0",
            amount: 1,
            createdAt : new Date(),
            reason : "FRIEND_ADDED" as LogEvent
        }

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.user.findUnique.mockResolvedValue(mockUser2);
        prismaMock.friend.create.mockResolvedValue(mockFriend);
        prismaMock.user.update.mockResolvedValue(mockUser);
        prismaMock.user.update.mockResolvedValue(mockUser2);
        prismaMock.activityLog.create.mockResolvedValue(mockActivityLog);

        await cronJobController.AddFriends(addFriendEvents);
        expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(addFriendEvents.length * 2); // for both users
        expect(prismaMock.friend.findFirst).toHaveBeenCalledTimes(addFriendEvents.length);
        expect(prismaMock.friend.create).toHaveBeenCalledTimes(addFriendEvents.length)
        expect(prismaMock.user.update).toHaveBeenCalledTimes(addFriendEvents.length * 2); // for both users
        expect(prismaMock.activityLog.create).toHaveBeenCalledTimes(addFriendEvents.length * 2); // for both users
    });

    it("should generate unfriend events to database correctly", async () => {
        const { value: events } = await generator.stream(count).next();
        const { value: secondEvents } = await generator.stream(count).next(); // unfriend event on second generation
        const unfriendEvents = secondEvents!.filter((e) => e.type === "unfriend");

        const mockUser = {
            id: "1234",
            username : unfriendEvents[0].user1_name,
            networkStrength : 0,
            referralPoints : 0,
            createdAt : new Date(),
            updatedAt : new Date()
        }

        const mockUser2 = {
            id: "1234",
            username : unfriendEvents[0].user2_name,
            networkStrength : 0,
            referralPoints : 0,
            createdAt : new Date(),
            updatedAt : new Date()
        }

        const mockFriend = {
            id: "abcd",
            user1Id: "0",
            user2Id: "1",
            createdAt : new Date(),
            updatedAt : new Date()
        }

        const mockActivityLog = {
            id: "3456",
            userId: "0",
            amount: -1,
            createdAt : new Date(),
            reason : "FRIEND_REMOVED" as LogEvent
        }

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.user.findUnique.mockResolvedValue(mockUser2);
        prismaMock.friend.findFirst.mockResolvedValue(mockFriend);
        prismaMock.friend.delete.mockResolvedValue(mockFriend);
        prismaMock.user.update.mockResolvedValue(mockUser);
        prismaMock.user.update.mockResolvedValue(mockUser2);
        prismaMock.activityLog.create.mockResolvedValue(mockActivityLog);

        await cronJobController.Unfriends(unfriendEvents);
        expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(unfriendEvents.length * 2); // for both users
        expect(prismaMock.friend.findFirst).toHaveBeenCalledTimes(unfriendEvents.length);
        expect(prismaMock.friend.delete).toHaveBeenCalledTimes(unfriendEvents.length);
        expect(prismaMock.user.update).toHaveBeenCalledTimes(unfriendEvents.length * 2); // for both users
        expect(prismaMock.activityLog.create).toHaveBeenCalledTimes(unfriendEvents.length * 2); // for both users
    });
});