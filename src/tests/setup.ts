import { mockReset } from 'jest-mock-extended'
import { prismaMock } from "./singleton";

jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: prismaMock,
}))

beforeEach(() => {
    mockReset(prismaMock)
})