import { prismaMock } from './singleton';
import { GetUsers, GetUser, GetUserFriends, GetUserReferrals, GetUserTopInfluentialFriends } from '../controllers/usersController'
import { GetActivityLog, GetNetworkStrengthLeaderboard, GetReferralPointsLeaderboard } from '../controllers/leaderboardController'
import httpMocks from 'node-mocks-http'
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

const mockUser = {
    id: "1234",
    username : "test-user",
    networkStrength : 0,
    referralPoints : 0,
    createdAt : new Date(),
    updatedAt : new Date()
}

const mockFriend = {
    id: "2345",
    user1Id : "1234",
    user2Id : "3456",
    createdAt : new Date(),
    updatedAt : new Date()
}

describe("Controllers", () => {
    let req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>;
    
    beforeEach(() => {
        req = httpMocks.createRequest()
        req.params.username = "test-user"
        res = httpMocks.createResponse()
    });

    it ("[GetUsers] should call findMany query and return 201 code", async () => {
        await GetUsers(req, res)
        expect(prismaMock.user.findMany).toHaveBeenCalled()
        expect(res.statusCode).toBe(201)
    });

    it ("[GetUser] should call queries and return 201 code", async () => {
        prismaMock.user.findUnique.mockResolvedValue(mockUser)
        await GetUser(req, res)
        expect(prismaMock.user.findUnique).toHaveBeenCalled()
        expect(prismaMock.friend.findMany).toHaveBeenCalled()
        expect(prismaMock.referral.findMany).toHaveBeenCalled()
        expect(res.statusCode).toBe(201)
    });

    it ("[GetUser] should return 404 code for invalid user", async () => {
        req.params.username = "test-user2"
        await GetUser(req, res)
        expect(res.statusCode).toBe(404)
    });

    it("[GetUserFriends] should call queries and return 201 code", async () => {
        prismaMock.user.findUnique.mockResolvedValue(mockUser)
        prismaMock.friend.count.mockResolvedValue(10)
        prismaMock.friend.findMany.mockResolvedValue([mockFriend])

        req.query.from = "2025-06-29T03:00:00Z"
        req.query.to = "2025-07-29T03:00:00Z"
        req.query.page = "1"
        req.query.limit = "5"

        await GetUserFriends(req, res)
        expect(prismaMock.user.findUnique).toHaveBeenCalled()
        expect(prismaMock.friend.count).toHaveBeenCalled()
        expect(prismaMock.friend.findMany).toHaveBeenCalled()
        expect(res.statusCode).toBe(201)
    });

    it("[GetUserTopInfluencialFriends] should call queries and return 201 code", async () => {
        prismaMock.user.findUnique.mockResolvedValue(mockUser)
        prismaMock.friend.findMany.mockResolvedValue([mockFriend, mockFriend, mockFriend])

        await GetUserTopInfluentialFriends(req, res)
        expect(prismaMock.user.findUnique).toHaveBeenCalled()
        expect(prismaMock.friend.findMany).toHaveBeenCalled()
        expect(res.statusCode).toBe(201)
    });

    it("[GetUserReferrals] should call queries and return 201 code", async () => {
        prismaMock.user.findUnique.mockResolvedValue(mockUser)

        req.query.from = "2025-06-29T03:00:00Z"
        req.query.to = "2025-07-29T03:00:00Z"

        await GetUserReferrals(req, res)
        expect(prismaMock.user.findUnique).toHaveBeenCalled()
        expect(prismaMock.referral.findMany).toHaveBeenCalled()
        expect(res.statusCode).toBe(201)
    });

    it("[GetActivityLog] should call findMany query and return 201 code", async () => {
        await GetActivityLog(req,res)
        expect(prismaMock.activityLog.findMany).toHaveBeenCalled()
        expect(res.statusCode).toBe(201)
    });

    it("[GetNetworkStrengthLeaderboard] should call queries and return 201 code", async () => {
        req.query.from = "2025-06-29T03:00:00Z"
        req.query.to = "2025-07-29T03:00:00Z"

        await GetNetworkStrengthLeaderboard(req, res)
        expect(prismaMock.activityLog.groupBy).toHaveBeenCalled()
        expect(prismaMock.user.findMany).toHaveBeenCalled()
        expect(res.statusCode).toBe(201)
    });

    it("[GetReferralPointsLeaderboard] should call queries and return 201 code", async () => {
        req.query.from = "2025-06-29T03:00:00Z"
        req.query.to = "2025-07-29T03:00:00Z"

        await GetReferralPointsLeaderboard(req, res)
        expect(prismaMock.activityLog.groupBy).toHaveBeenCalled()
        expect(prismaMock.user.findMany).toHaveBeenCalled()
        expect(res.statusCode).toBe(201)
    });
});