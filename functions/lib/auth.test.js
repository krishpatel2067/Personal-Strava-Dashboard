import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccessToken } from "./auth.js";

// Mock firebase-functions/logger
vi.mock("firebase-functions/logger", () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
}));

describe("getAccessToken", () => {
    let mockDb;
    let mockDoc;
    let mockSecretData;

    beforeEach(() => {
        vi.clearAllMocks();

        mockSecretData = {
            CLIENT_ID: "cid",
            CLIENT_SECRET: "csec",
            REFRESH_TOKEN: "rtok",
            EXPIRES_AT: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            ACCESS_TOKEN: "atok",
        };

        mockDoc = {
            get: vi.fn(() => Promise.resolve({
                exists: true,
                data: () => mockSecretData,
            })),
            set: vi.fn(() => Promise.resolve()),
        };

        mockDb = {
            doc: vi.fn(() => mockDoc),
        };

        // Mock global fetch
        global.fetch = vi.fn();
    });

    it("returns existing access token if not expired", async () => {
        const token = await getAccessToken(mockDb);
        expect(token).toBe("atok");
        expect(mockDb.doc).toHaveBeenCalledWith("main/secret");
        expect(fetch).not.toHaveBeenCalled();
    });

    it("refreshes token if expired", async () => {
        mockSecretData.EXPIRES_AT = Math.floor(Date.now() / 1000) - 100;

        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                access_token: "new_atok",
                refresh_token: "new_rtok",
                expires_at: Math.floor(Date.now() / 1000) + 3600,
            }),
        });

        const token = await getAccessToken(mockDb);

        expect(token).toBe("new_atok");
        expect(fetch).toHaveBeenCalledWith("https://www.strava.com/oauth/token", expect.any(Object));
        expect(mockDoc.set).toHaveBeenCalledWith(expect.objectContaining({
            ACCESS_TOKEN: "new_atok",
            REFRESH_TOKEN: "new_rtok",
        }));
    });

    it("throws error if secret document does not exist", async () => {
        mockDoc.get.mockResolvedValue({ exists: false });
        await expect(getAccessToken(mockDb)).rejects.toThrow("Secret document not found in Firestore.");
    });

    it("performs initial auth if no refresh token exists", async () => {
        mockSecretData.REFRESH_TOKEN = null;
        mockSecretData.AUTH_CODE = "auth_code_123";

        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                access_token: "init_atok",
                refresh_token: "init_rtok",
                expires_at: 123456,
                athlete: { id: 1 },
            }),
        });

        const token = await getAccessToken(mockDb);

        expect(token).toBe("init_atok");
        expect(fetch).toHaveBeenCalled();
        const fetchBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(fetchBody.grant_type).toBe("authorization_code");
        expect(fetchBody.code).toBe("auth_code_123");
    });

    it("throws error if OAuth exchange fails", async () => {
        mockSecretData.REFRESH_TOKEN = null;
        mockSecretData.AUTH_CODE = "auth_code_bad";

        global.fetch.mockResolvedValue({
            ok: false,
            statusText: "Bad Request",
        });

        await expect(getAccessToken(mockDb)).rejects.toThrow("OAuth exchange failed: Bad Request");
    });

    it("throws error if token refresh fails", async () => {
        mockSecretData.ACCESS_TOKEN = null;
        mockSecretData.EXPIRES_AT = -1;

        global.fetch.mockResolvedValue({
            ok: false,
            statusText: "Bad Request",
        });

        await expect(getAccessToken(mockDb)).rejects.toThrow("Token refresh failed: Bad Request");
    });
});
