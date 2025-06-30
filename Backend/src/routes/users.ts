import express from 'express';
import { GetUsers, GetUser, GetUserFriends, GetUserTopInfluentialFriends, GetUserReferrals } from '../controllers/usersController';

const router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users in the system.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of all users
 *       500:
 *         description: Internal server error
 */
router.get('/', GetUsers);

/**
 * @openapi
 * /api/users/{username}:
 *   get:
 *     summary: Get user data by username
 *     description: Retrieve user data by their username.
 *     tags:
 *       - Users
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: johndoe
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:username', GetUser);

/**
 * @openapi
 * /api/users/{username}/friends:
 *   get:
 *     summary: Get user friends
 *     description: Retrieve a list of friends for a specific user by their username.
 *     tags:
 *       - Users
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: johndoe
 *       - name: from
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: 2025-06-01
 *       - name: to
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: 2025-06-30
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:username/friends', GetUserFriends);

/**
 * @openapi
 * /api/users/{username}/friends/top-influential:
 *   get:
 *     summary: Get top influential friends of a user
 *     description: Retrieve the top influential friends of a specific user by their username.
 *     tags:
 *       - Users
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: johndoe
 *     responses:
 *       200:
 *         description: Top influential friends retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:username/friends/top-influential', GetUserTopInfluentialFriends);

/**
 * @openapi
 * /api/users/{username}/referrals:
 *   get:
 *     summary: Get user referrals
 *     description: Retrieve a list of referrals made by a specific user by their username.
 *     tags:
 *       - Users
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: johndoe
 *       - name: from
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: 2025-06-01
 *       - name: to
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: 2025-06-30
 *     responses:
 *       200:
 *         description: User referrals retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:username/referrals', GetUserReferrals);

export default router;