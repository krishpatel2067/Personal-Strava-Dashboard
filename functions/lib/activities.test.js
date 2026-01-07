import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchActivities } from "./activities.js";
import { stravaFetch } from "./client.js";

vi.mock("./client.js", () => ({
    stravaFetch: vi.fn(),
}));

vi.mock("firebase-functions/logger", () => ({
    info: vi.fn(),
    warn: vi.fn(),
}));

describe("fetchActivities", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("fetches single page and stops if it has fewer than perPage items", async () => {
        stravaFetch.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]); // 2 items, < 10
        // We mock multiple pages because p-limit forces a batch of concurrencyLimit (default 5)
        for (let i = 0; i < 4; i++) stravaFetch.mockResolvedValueOnce([]);

        const result = await fetchActivities("token", { startPage: 1 });

        expect(result.data.length).toBe(2);
        expect(result.lastPageFetched).toBe(0); // Finished
        expect(result.interrupted).toBe(false);
    });

    it("resumes from startPage and marks lastPageFetched if interrupted by safety limit", async () => {
        // Set limit to 1 fetch
        const mockPageData = Array(10).fill({ id: 1 });
        stravaFetch.mockResolvedValue(mockPageData);

        const result = await fetchActivities("token", {
            startPage: 5,
            apiLimitNow: 1
        });

        expect(result.interrupted).toBe(true);
        // Since we fetch in batches of 5 (default), even with limit 1, we process the first batch [5,6,7,8,9]
        expect(result.lastPageFetched).toBe(9);
        expect(result.fetchesDoneCount).toBe(5);
    });

    it("handles 429 rate limit error gracefully and does not advance lastPageFetched", async () => {
        const err = new Error("Rate Limit");
        err.status = 429;
        stravaFetch.mockRejectedValueOnce(err);

        const result = await fetchActivities("token", { startPage: 1 });

        expect(result.interrupted).toBe(true);
        expect(result.lastPageFetched).toBe(0); // 0 means next run starts at 0 + 1 = 1
    });

    it("saves successful pages even if a later page in the same batch fails", async () => {
        const fullPage = Array(10).fill({ id: 1 });

        // Batch 1: Success for page 1, 429 for page 2
        stravaFetch.mockResolvedValueOnce(fullPage);
        const err = new Error("Rate Limit");
        err.status = 429;
        stravaFetch.mockRejectedValueOnce(err);

        // Rest of batch (doesn't matter but mock for safety)
        stravaFetch.mockResolvedValue(fullPage);

        const result = await fetchActivities("token", { startPage: 1 });

        expect(result.interrupted).toBe(true);
        expect(result.data.length).toBe(10); // Page 1 was saved!
        expect(result.lastPageFetched).toBe(1); // Next run starts at page 2
    });

    it("successfully fetches multiple pages in batches", async () => {
        const fullPage = Array(10).fill({ id: 1 });
        const halfPage = Array(5).fill({ id: 2 });
        const emptyPage = [];

        // Batch 1 (Pages 1-5)
        stravaFetch.mockResolvedValueOnce(fullPage); // Page 1
        stravaFetch.mockResolvedValueOnce(fullPage); // Page 2
        stravaFetch.mockResolvedValueOnce(halfPage); // Page 3 (Stop signal)
        stravaFetch.mockResolvedValueOnce(emptyPage); // Page 4
        stravaFetch.mockResolvedValueOnce(emptyPage); // Page 5

        const result = await fetchActivities("token", { startPage: 1 });

        expect(result.data.length).toBe(25); // 10 + 10 + 5
        expect(result.lastPageFetched).toBe(0); // Finished
        expect(stravaFetch).toHaveBeenCalledTimes(5); // Full batch of 5 was triggered by Promise.all
    });
});
