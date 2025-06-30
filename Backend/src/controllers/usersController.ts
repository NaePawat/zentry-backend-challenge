import prisma from '../lib/prisma';
import { Request, Response } from 'express';
import { z } from 'zod';
import { UserSchema, FriendQuerySchema, ReferralQuerySchema } from '../lib/zod';
import { GetFriendsResponse, GetUserResponse, GetUsersResponse, GetTopInfluencialFriendsResponse, GetReferralsResponse } from '../types/response';
import { Referral } from '../types/model';

/**
 * Controller for handling fetching list of users data.
 * 
 * @module controllers/usersController
 */

export const GetUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();

        if (!users || users.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const response : GetUsersResponse = {
            users: users.map(user => ({
                id: user.id,
                username: user.username,
                networkStrength: user.networkStrength,
                referralPoints: user.referralPoints,
                createdAt: user.createdAt.toISOString(),
            }))
        }

        res.status(200).json(response);
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
                user1Name: true,
                user2Name: true,
                createdAt: true
            }
        });

        const referrals = await prisma.referral.findMany({
            where: {
                referrerId: user.id
            },
            orderBy: { 
                createdAt: 'asc' 
            },
            select: {
                id: true,
                referredId: true,
                referredName: true,
                createdAt: true
            }
        });

        const response : GetUserResponse = {
            user: {
                id: user?.id || '',
                username: user?.username || '',
                networkStrength: user?.networkStrength || 0,
                referralPoints: user?.referralPoints || 0,
                createdAt: user?.createdAt.toISOString() || ''
            },
            friends: friendships.map(friendship => {
                return {
                    id: friendship.id,
                    username: friendship.user1Name === username ? 
                        friendship.user2Name : friendship.user1Name,
                    createdAt: friendship.createdAt.toISOString()
                };
            }),
            referredBy: user.referrer as Referral | null,
            referrals: referrals.map(referral => {
                return {
                    id: referral.id,
                    referredId: referral.referredId,
                    username: referral.referredName,
                    createdAt: referral.createdAt.toISOString(),
                };
            })
        }

        res.status(200).json(response);
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
                user1Name: true,
                user2Name: true,
                createdAt: true
            }
        });

        const response : GetFriendsResponse = {
            currentPage: page,
            totalPages: totalPages,
            totalFriends: totalFriends,
            friends: friendships.map(friendship => {
                return {
                    id: friendship.id,
                    username: friendship.user1Name === username ? 
                        friendship.user2Name : friendship.user1Name,
                    createdAt: friendship.createdAt.toISOString()
                };
            })
        }

        res.status(200).json(response);
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
            friends: topFriends.map(friend => ({
                id: friend.id,
                username: friend.username,
                networkStrength: friend.networkStrength,
                createdAt: friend.createdAt.toISOString()
            }))
        }

        res.status(200).json(response);
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

        const referrals = await prisma.referral.findMany({
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
                referredName: true,
                createdAt: true
            }
        });

        const response: GetReferralsResponse = {
            totalReferrals: totalReferrals,
            referrals: referrals.map(referral => {
                return {
                    id: referral.id,
                    referredId: referral.referredId,
                    username: referral.referredName,
                    createdAt: referral.createdAt.toISOString(),
                };
            })
        }

        res.status(200).json(response);
    } catch (err) {
        if (err instanceof z.ZodError)
            res.status(400).json({ error: err.errors });
        res.status(500).json({ error: 'Server error' });
    }
}
