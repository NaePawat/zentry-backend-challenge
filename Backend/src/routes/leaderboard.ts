import express from 'express';
import { GetActivityLog, GetNetworkStrengthLeaderboard, GetReferralPointsLeaderboard } from '../controllers/leaderboardController.js';

const router = express.Router();

/**
 * @openapi
 * /api/leaderboard:
 *   get:
 *     summary: Get all activity logs used for leaderboard
 *     description: Retrieve a list of all activity logs in the system.
 *     tags:
 *       - Leaderboard
 *     responses:
 *       200:
 *         description: List of all users
 *       500:
 *         description: Internal server error
 */
router.get('/', GetActivityLog);

/**
 * @openapi
 * /api/leaderboard/network-strength:
 *   get:
 *     summary: Get network strength leaderboard
 *     description: Retrieve the leaderboard based on network strength.
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - name: from
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: to
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Network strength leaderboard retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/network-strength', GetNetworkStrengthLeaderboard);

/**
 * @openapi
 * /api/leaderboard/referral-points:
 *   get:
 *     summary: Get referral points leaderboard
 *     description: Retrieve the leaderboard based on referral points.
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - name: from
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: to
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Referral points leaderboard retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/referral-points', GetReferralPointsLeaderboard);

export default router;