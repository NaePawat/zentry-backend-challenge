import prisma from '../lib/prisma.js';
import { Request, Response } from 'express';
import { addMinutes, startOfMinute } from 'date-fns'
import { z } from 'zod';
import { UserSchema, FriendQuerySchema, ReferralQuerySchema } from '../lib/zod.js';
import { GetFriendsResponse, GetUserResponse, GetUsersResponse, GetTopInfluencialFriendsResponse, GetReferralsResponse } from '../types/response.js';
import { Friend, Referral, Referrer, TimeSeriesGraphData } from '../types/model.js';

/**
 * Controller for handling fetching list of users data.
 * 
 * @module controllers/usersController
 */

export const GetUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();

        const response : GetUsersResponse = {
            users: users != undefined ? users.map(user => ({
                id: user.id,
                username: user.username,
                networkStrength: user.networkStrength,
                referralPoints: user.referralPoints,
                createdAt: user.createdAt.toISOString(),
            })) : []
        }

        res.status(201).json(response);
    } catch (err) {
        if (err instanceof z.ZodError)
            res.status(400).json({ error: err.errors });
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Controller for handling fetching user data.
 * returns user data, friends, referrals and referredBy information.
 * 
 * @module controllers/usersController
 */
export const GetUser = async (req: Request, res: Response) => {
    try {
        const { username } = UserSchema.parse(req.params);

        const user = await prisma.user.findUnique({
            where: {
                username: username
            },
            include: {
                referrer: true
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const friendships = await prisma.friend.findMany({
            where: {
                OR: [
                    { user1Id: user.id },
                    { user2Id: user.id },
                ],
            },
            orderBy: { 
                createdAt: 'asc' 
            },
            select: {
                id: true,
                user1Id: true,
                user2Id: true,
                createdAt: true
            }
        });

        const friends : Friend[] = friendships != undefined ? await Promise.all(friendships.map(async friendship => {
            const friendId = friendship.user1Id === user.id ? friendship.user2Id : friendship.user1Id;
            const friend = await prisma.user.findUnique({
                where: {
                    id : friendId
                } 
            });

            const result : Friend = {
                id: friendship.id,
                username: friend!.username,
                createdAt: friendship.createdAt.toISOString()
            }

            return result
        })) : [];

        let referrer : Referrer | null = null;

        if (user.referrer != null) {
            const refUser = await prisma.user.findUnique({
                where: {
                    id : user.referrer.referrerId
                }
            });

            if (refUser != undefined)
            {
                referrer = {
                    id: refUser.id,
                    username: refUser.username,
                    createdAt: refUser.createdAt.toISOString()
                }
            }
        }

        const referralsList = await prisma.referral.findMany({
            where: {
                referrerId: user.id
            },
            orderBy: { 
                createdAt: 'asc' 
            },
            select: {
                id: true,
                referredId: true,
                createdAt: true
            }
        });

        const referrals : Referral[] = referralsList != undefined ? await Promise.all(referralsList.map(async ref => {
            const referredUser = await prisma.user.findUnique({
                where: {
                    id : ref.referredId
                }
            });

            const result : Referral = {
                id : ref.id,
                referredId : ref.referredId,
                username : referredUser!.username,
                createdAt : ref.createdAt.toISOString()
            }

            return result;
        })) : [];

        const response : GetUserResponse = {
            user: {
                id: user?.id || '',
                username: user?.username || '',
                networkStrength: user?.networkStrength || 0,
                referralPoints: user?.referralPoints || 0,
                createdAt: user?.createdAt.toISOString() || ''
            },
            friends: friends,
            referredBy: referrer,
            referrals: referrals
        }

        res.status(201).json(response);
    } catch (err) {
        if (err instanceof z.ZodError)
            res.status(400).json({ error: err.errors });
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Controller for handling fetching user's friends data.
 * returns the list of friends within timerange of "from" and "to" query parameters.
 * It also supports pagination with "page" and "limit" query parameters.
 * 
 * @module controllers/usersController
 */

export const GetUserFriends = async (req: Request, res: Response) => {
    try {
        const { username } = UserSchema.parse(req.params);
        const { from, to, page, limit } = FriendQuerySchema.parse(req.query);

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (fromDate > toDate) {
            res.status(400).json({ error: "'from' is later than 'to' date" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const totalFriends = await prisma.friend.count({
            where: {
                OR: [
                    { user1Id: user.id },
                    { user2Id: user.id },
                ],
                createdAt: { 
                    gte: fromDate, 
                    lte: toDate 
                },
            },
        });

        const totalPages = Math.ceil(totalFriends / limit);

        const friendships = await prisma.friend.findMany({
            where: {
                OR: [
                    { user1Id: user.id },
                    { user2Id: user.id },
                ],
                createdAt: {
                    gte: fromDate,
                    lte: toDate
                }
            },
            orderBy: { 
                createdAt: 'asc' 
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                user1Id: true,
                user2Id: true,
                createdAt: true
            }
        });

        const friends : Friend[] = friendships != undefined ? await Promise.all(friendships.map(async friendship => {
            const friendId = friendship.user1Id === user.id ? friendship.user2Id : friendship.user1Id;
            const friend = await prisma.user.findUnique({
                where: {
                    id : friendId
                } 
            });

            const result : Friend = {
                id: friendship.id,
                username: friend!.username,
                createdAt: friendship.createdAt.toISOString()
            }

            return result
        })) : [];

        const response : GetFriendsResponse = {
            currentPage: page,
            totalPages: totalPages,
            totalFriends: totalFriends,
            friends: friends
        }

        res.status(201).json(response);
    } catch (err) {
        if (err instanceof z.ZodError)
            res.status(400).json({ error: err.errors });
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Controller for handling fetching user's friends time series data from displaying graph in frontend.
 * return the list of data in 1 min interval until current time (for our testing, 1 day interval might be too long)
 * 
 * @module controllers/usersController
 */

export const GetUserFriendsTimeSeriesData = async (req: Request, res: Response) => {
    try {
        const { username } = UserSchema.parse(req.params);
        const { from, to } = ReferralQuerySchema.parse(req.query);

        const fromDate = new Date(from);
        const toDate = new Date(to);

        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const friendEvents = await prisma.activityLog.findMany({
            where: { 
                userId: user.id,
                createdAt: { gte: fromDate, lte: toDate },
                reason: { in: ["FRIEND_ADDED", "FRIEND_REMOVED"]} 
            },
            
            orderBy: { createdAt: 'asc' },
        });

        const result: TimeSeriesGraphData[] = [];

        if (friendEvents.length == 0 || friendEvents == undefined)
        {
            res.status(201).json(result);
            return;
        } 

        const timeMap = new Map<string, number>();

        for (const event of friendEvents) {
            const minuteKey = startOfMinute(event.createdAt).toISOString();
            const delta = event.reason === 'FRIEND_ADDED' ? 1 : -1;
            timeMap.set(minuteKey, (timeMap.get(minuteKey) || 0) + delta);
        }
        
        const startTime = startOfMinute(friendEvents[0].createdAt);
        const endTime = startOfMinute(friendEvents[friendEvents.length - 1].createdAt);

        let currentTime = startTime;
        let count = 0;

        while (currentTime <= endTime) {
            const key = currentTime.toISOString();
            if (timeMap.has(key)) {
                count += timeMap.get(key)!;
            }
            result.push({
                date: key,
                count,
            });
            currentTime = addMinutes(currentTime, 1);
        }

        res.status(201).json(result);
    } catch (err) {
        if (err instanceof z.ZodError)
            res.status(400).json({ error: err.errors });
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Controller for handling fetching user's top influential friends.
 * returns the list of top 3 friends that have the most referral points + network strength..
 * 
 * @module controllers/usersController
 */

export const GetUserTopInfluentialFriends = async (req: Request, res: Response) => {
    try {
        const { username } = UserSchema.parse(req.params);

        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const friendships = await prisma.friend.findMany({
            where: {
                OR: [
                    { user1Id: user.id },
                    { user2Id: user.id },
                ]
            },
            select: {
                id: true,
                user1Id: true,
                user2Id: true,
                createdAt: true
            }
        });

        const friendIds = friendships.map(friend => 
            friend.user1Id === user.id ? friend.user2Id : friend.user1Id
        );

        const topFriends = await prisma.user.findMany({
            where: {
                id: { in: friendIds },
            },
            orderBy: {
                networkStrength: 'desc',
            },
            take: 3,
            select: {
                id: true,
                username: true,
                networkStrength: true,
                createdAt: true
            },
        });

        const response: GetTopInfluencialFriendsResponse = {
            friends: topFriends != undefined ? topFriends.map(friend => ({
                id: friend.id,
                username: friend.username,
                networkStrength: friend.networkStrength,
                createdAt: friend.createdAt.toISOString()
            })) :[]
        }

        res.status(201).json(response);
    } catch (err) {
        if (err instanceof z.ZodError)
            res.status(400).json({ error: err.errors });
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Controller for handling fetching user's rferrals data.
 * returns the list of referrals within timerange of "from" and "to" query parameters.
 * 
 * @module controllers/usersController
 */

export const GetUserReferrals = async (req: Request, res: Response) => {
    try {
        const { username } = UserSchema.parse(req.params);
        const { from, to } = ReferralQuerySchema.parse(req.query);

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (fromDate > toDate) {
            res.status(400).json({ error: "'from' is later than 'to' date" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const totalReferrals = await prisma.referral.count({
            where: {
                referrerId: user.id,
                createdAt: { gte: fromDate, lte: toDate },
            },
        });

        const referralsList = await prisma.referral.findMany({
            where: {
                referrerId: user.id,
                createdAt: {
                    gte: fromDate,
                    lte: toDate
                }
            },
            orderBy: { 
                createdAt: 'asc' 
            },
            select: {
                id: true,
                referredId: true,
                createdAt: true
            }
        });

        const referrals : Referral[] = referralsList != undefined ? await Promise.all(referralsList.map(async ref => {
            const referredUser = await prisma.user.findUnique({
                where: {
                    id : ref.referredId
                }
            });

            const result : Referral = {
                id : ref.id,
                referredId : ref.referredId,
                username : referredUser!.username,
                createdAt : ref.createdAt.toISOString()
            }

            return result;
        })) : [];

        const response: GetReferralsResponse = {
            totalReferrals: totalReferrals,
            referrals: referrals
        }

        res.status(201).json(response);
    } catch (err) {
        if (err instanceof z.ZodError)
            res.status(400).json({ error: err.errors });
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Controller for handling fetching user's referrals time series data from displaying graph in frontend.
 * return the list of data in 1 min interval until current time (for our testing, 1 day interval might be too long)
 * 
 * @module controllers/usersController
 */

export const GetUserReferralsTimeSeriesData = async (req: Request, res: Response) => {
    try {
        const { username } = UserSchema.parse(req.params);
        const { from, to } = ReferralQuerySchema.parse(req.query);

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (fromDate > toDate) {
            res.status(400).json({ error: "'from' is later than 'to' date" });
            return;
        }

        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const referralEvents = await prisma.activityLog.findMany({
            where: { 
                userId: user.id,
                createdAt: { gte: fromDate, lte: toDate },
                reason: "REFERRAL"
            },
            
            orderBy: { createdAt: 'asc' },
        });

        const result: TimeSeriesGraphData[] = [];

        if (referralEvents.length == 0 || referralEvents == undefined)
        {
            res.status(201).json(result);
            return;
        } 

        const timeMap = new Map<string, number>();

        for (const event of referralEvents) {
            const minuteKey = startOfMinute(event.createdAt).toISOString();
            timeMap.set(minuteKey, (timeMap.get(minuteKey) || 0) + 1);
        }
        
        const startTime = startOfMinute(referralEvents[0].createdAt);
        const endTime = startOfMinute(referralEvents[referralEvents.length - 1].createdAt);

        let currentTime = startTime;
        let count = 0;

        while (currentTime <= endTime) {
            const key = currentTime.toISOString();
            if (timeMap.has(key)) {
                count += timeMap.get(key)!;
            }
            result.push({
                date: key,
                count,
            });
            currentTime = addMinutes(currentTime, 1);
        }

        res.status(201).json(result);
    } catch (err) {
        if (err instanceof z.ZodError)
            res.status(400).json({ error: err.errors });
        res.status(500).json({ error: 'Server error' });
    }
}