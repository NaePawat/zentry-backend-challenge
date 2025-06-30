import prisma from '../lib/prisma';
import { Request, Response } from 'express';
import { LeaderboardQuerySchema } from '../lib/zod';
import { GetNetworkStrengthLeaderboardResponse, GetReferralPointsLeaderboardResponse } from '../types/response';

/**
 * Controller for handling fetching activity log requests.
 * return activity log entries sorted by creation date.
 * 
 * @module controllers/leaderboardController
 */

export const GetActivityLog = async (req: Request, res: Response) => {
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: { 
                createdAt: 'asc' 
            },
        });

        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Controller for handling fetching leaderboard with network strength as a main comparison.
 * return user entries sorted by network strength.
 * 
 * @module controllers/leaderboardController
 */

export const GetNetworkStrengthLeaderboard = async (req: Request, res: Response) => {
    try {
        const { from, to } = LeaderboardQuerySchema.parse(req.query);

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (fromDate > toDate) {
            res.status(400).json({ error: "'from' is later than 'to' date" });
            return;
        }

        const leaderboard = await prisma.activityLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: {
                    gte: fromDate,
                    lte: toDate,
                }
            },
            _sum: {
                amount: true,
            },
            orderBy: {
                _sum: {
                    amount: 'desc',
                },
            },
            take: 10,
        });

        const userIds = leaderboard.map(user => user.userId);

        const users = await prisma.user.findMany({
            where: { 
                id: { in: userIds } 
            },
            select: { 
                id: true, 
                username: true,
                networkStrength: true, 
            },
            orderBy: {
                networkStrength: 'desc',
            }
        });

        const response: GetNetworkStrengthLeaderboardResponse = {
            leaderboard: users.map(user => ({
                id: user.id,
                username: user.username,
                networkStrength: user.networkStrength
            }))
        }

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Controller for handling fetching leaderboard with referral points as a main comparison.
 * return user entries sorted by referral points.
 * 
 * @module controllers/leaderboardController
 */

export const GetReferralPointsLeaderboard = async (req: Request, res: Response) => {
    try {
        const { from, to } = LeaderboardQuerySchema.parse(req.query);

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (fromDate > toDate) {
            res.status(400).json({ error: "'from' is later than 'to' date" });
            return;
        }

        const leaderboard = await prisma.activityLog.groupBy({
            by: ['userId'],
            where: {
                createdAt: {
                    gte: fromDate,
                    lte: toDate,
                },
                reason: 'REFERRAL'
            },
            _sum: {
                amount: true,
            },
            orderBy: {
                _sum: {
                    amount: 'desc',
                },
            },
            take: 10,
        });

        const userIds = leaderboard.map(user => user.userId);

        const users = await prisma.user.findMany({
            where: { 
                id: { in: userIds } 
            },
            select: { 
                id: true, 
                username: true,
                referralPoints: true, 
            },
            orderBy: {
                referralPoints: 'desc',
            }
        });

        const response: GetReferralPointsLeaderboardResponse = {
            leaderboard: users.map(user => ({
                id: user.id,
                username: user.username,
                referralPoints: user.referralPoints
            }))
        }

        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}