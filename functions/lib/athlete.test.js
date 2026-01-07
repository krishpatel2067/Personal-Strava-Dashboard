import { describe, it, expect, vi } from "vitest";
import { getLoggedInAthlete } from "./athlete.js";
import { stravaFetch } from "./client.js";

// Mock the client
vi.mock("./client.js", () => ({
    stravaFetch: vi.fn(),
}));

describe("getLoggedInAthlete", () => {
    it("calls stravaFetch with the correct endpoint", async () => {
        const mockAthlete = { id: 123, firstname: "Test" };
        stravaFetch.mockResolvedValue(mockAthlete);

        const result = await getLoggedInAthlete("test-token");

        expect(stravaFetch).toHaveBeenCalledWith("athlete", "test-token");
        expect(result).toEqual(mockAthlete);
    });
});
