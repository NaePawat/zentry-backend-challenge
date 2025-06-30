import { z } from "zod";

export const UserSchema = z.object({
    username: z.string().min(1)
});

export const FriendQuerySchema = z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
    page: z.string().optional().transform(Number).default('1'),
    limit: z.string().optional().transform(Number).default('10'),
});

export const ReferralQuerySchema = z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
});

export const LeaderboardQuerySchema = z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
});