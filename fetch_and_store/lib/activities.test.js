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

        const result = await fetchActivities("token", { startPage: 1, apiLimitNow: 100 });

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
            apiLimitNow: 1,
        });

        expect(result.interrupted).toBe(true);
        // Now it should stop EXACTLY at the limit. 
        // startPage is 5, limit is 1. So it fetches page 5 and stops.
        expect(result.lastPageFetched).toBe(5);
        expect(result.fetchesDoneCount).toBe(1);
    });

    it("interrupts if daily limit is reached mid-batch", async () => {
        const mockPageData = Array(10).fill({ id: 1 });
        stravaFetch.mockResolvedValue(mockPageData);

        const result = await fetchActivities("token", {
            startPage: 1,
            numFetchesToday: 95,
            apiLimitDaily: 97, // Only 2 more fetches allowed
        });

        expect(result.interrupted).toBe(true);
        expect(result.lastPageFetched).toBe(2);
        expect(result.fetchesDoneCount).toBe(2);
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
        const perPage = 10;
        const fullPage = Array(perPage).fill({ id: 1 });

        // Batch 1: Success for page 1, 429 for page 2
        stravaFetch.mockResolvedValueOnce(fullPage);
        const err = new Error("Rate Limit");
        err.status = 429;
        stravaFetch.mockRejectedValueOnce(err);

        // Rest of batch (doesn't matter but mock for safety)
        stravaFetch.mockResolvedValue(fullPage);

        const result = await fetchActivities("token", { startPage: 1 });

        expect(result.interrupted).toBe(true);
        expect(result.data.length).toBe(perPage); // Page 1 was saved!
        expect(result.lastPageFetched).toBe(1); // Next run starts at page 2
    });

    it("successfully fetches multiple pages in batches", async () => {
        const perPage = 10;
        const fullPage = Array(perPage).fill({ id: 1 });
        const halfPage = Array(perPage / 2).fill({ id: 2 });
        const emptyPage = [];
        const concurrencyLimit = 5;

        // Batch 1 (Pages 1-5)
        stravaFetch.mockResolvedValueOnce(fullPage); // Page 1
        stravaFetch.mockResolvedValueOnce(fullPage); // Page 2
        stravaFetch.mockResolvedValueOnce(halfPage); // Page 3 (Stop signal)
        stravaFetch.mockResolvedValueOnce(emptyPage); // Page 4
        stravaFetch.mockResolvedValueOnce(emptyPage); // Page 5

        const result = await fetchActivities("token", {
            startPage: 1,
            concurrencyLimit: concurrencyLimit,
            apiLimitNow: 100, // Ensure we don't hit the default limit
        });

        expect(result.data.length).toBe(perPage * 2.5); // 10 + 10 + 5
        expect(result.lastPageFetched).toBe(0); // Finished
        expect(stravaFetch).toHaveBeenCalledTimes(concurrencyLimit); // Full batch of 5 was triggered by Promise.all
    });
});
