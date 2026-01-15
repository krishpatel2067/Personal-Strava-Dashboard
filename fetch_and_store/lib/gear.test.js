import { describe, it, expect, vi } from "vitest";
import { getGear } from "./gear.js";
import { stravaFetch } from "./client.js";

// Mock the client
vi.mock("./client.js", () => ({
    stravaFetch: vi.fn(),
}));

describe("getGear", () => {
    it("calls stravaFetch with the correct gear endpoint", async () => {
        const mockGear = { id: "g123", name: "Road Bike", brand_name: "Specialized" };
        stravaFetch.mockResolvedValue(mockGear);

        const result = await getGear("g123", "test-token");

        expect(stravaFetch).toHaveBeenCalledWith("gear/g123", "test-token");
        expect(result).toEqual(mockGear);
    });
});
