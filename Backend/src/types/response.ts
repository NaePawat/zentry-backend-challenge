import { User, Referral, Friend, InfluencialFriend } from "./model";

//#region User Responses
export interface GetUsersResponse {
    users: User[];
}

export interface GetUserResponse {
    user: User;
    friends : Friend[]
    referredBy: Referral | null;
    referrals: Referral[];
}

export interface GetFriendsResponse {
    currentPage: number;
    totalPages: number;
    totalFriends: number;
    friends: Friend[];
}

export interface GetTopInfluencialFriendsResponse {
    friends: InfluencialFriend[];
}

export interface GetReferralsResponse {
    totalReferrals: number;
    referrals: Referral[];
}
//#endregion

//#region Leaderboard Responses
export interface GetNetworkStrengthLeaderboardResponse {
    leaderboard: {
        id: string;
        username: string;
        networkStrength: number;
    }[];
}

export interface GetReferralPointsLeaderboardResponse {
    leaderboard: {
        id: string;
        username: string;
        referralPoints: number;
    }[];
}
//#endregion