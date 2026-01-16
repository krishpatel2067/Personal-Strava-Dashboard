import { describe, it, expect, vi, beforeEach } from "vitest";
import { stravaFetch } from "./client.js";

describe("stravaFetch", () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    it("includes the Bearer token in headers", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ data: "ok" }),
        });

        await stravaFetch("test-endpoint", "my-token");

        expect(fetch).toHaveBeenCalledWith(
            "https://www.strava.com/api/v3/test-endpoint",
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Authorization": "Bearer my-token",
                }),
            }),
        );
    });

    it("appends query parameters correctly", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
        });

        await stravaFetch("activities", "token", {
            params: { page: 1, per_page: 30 },
        });

        const calledUrl = global.fetch.mock.calls[0][0];
        expect(calledUrl).toContain("page=1");
        expect(calledUrl).toContain("per_page=30");
    });

    it("throws a specific error for 429 rate limits", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 429,
        });

        await expect(stravaFetch("any", "token"))
            .rejects.toThrow("Strava Rate Limit Exceeded (429)");
    });

    it("throws an error with API message when response is not ok", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: "Not Found",
            json: () => Promise.resolve({ message: "Athlete not found" }),
        });

        await expect(stravaFetch("athlete", "token"))
            .rejects.toThrow("Strava API Error: Athlete not found (404)");
    });
});
