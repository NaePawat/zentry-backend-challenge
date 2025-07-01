export interface User {
    id: string;
    username: string;
    networkStrength: number;
    referralPoints: number;
    createdAt: string;
}

export interface Referrer {
    id: string
    username: string
    createdAt: string
}

export interface Referral {
    id: string;
    referredId: string;
    username: string;
    createdAt: string;
}

export interface Friend {
    id: string;
    username: string;
    createdAt: string;
}

export interface InfluencialFriend extends Friend {
    networkStrength: number;
}

export interface TimeSeriesGraphData {
    date: string;
    count: number
}