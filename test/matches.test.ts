import { NextResponse } from "next/server";
import { GET } from "../src/app/api/match/route";
import { createClient } from "@supabase/supabase-js";

// Create a mock axios to the Get/match api, this is used to isolate the code from the requested network
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

const mockSupabaseResponse = (data: any[] | null, error: any) => {
  (createClient as jest.Mock).mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              data,
              error,
            }),
          }),
        }),
      }),
    }),
  });
};

describe("Testing Get/match", () => {
  // Create a mock test such that our program thinks that supabase returns this data
  afterEach(jest.clearAllMocks);

  it("Test 1: return the correct format", async () => {
    const mockMatchData = {
      id: 1,
      challonge_match_id: 123,
      bot1: "ALAN-WTIE",
      bot2: "KESUS",
      winner: null,
      score: null,
      round: 1,
      state: "open",
      start_time: "2015-01-19T16:57:17-05:00",
    };
    const error = null;
    mockSupabaseResponse([mockMatchData], error);

    const expectedResponse = {
      matchId: 123,
      bot1: "ALAN-WTIE",
      bot2: "KESUS",
      round: 1,
      state: "open",
      winner: null,
      score: null,
      isFinal: false,
    };

    const response = await GET();
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(data).toEqual(expectedResponse);
  });

  it("Test 2: No matches found - all matches may be completed / pending / no data", async () => {
    const error = null;
    mockSupabaseResponse([], error);

    const expectedResponse = {
      error: "No open matches found",
    };

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual(expectedResponse);
  });

  it("Test 3: No matches found - due to error in supabase endpoint", async () => {
    const mockMatchData = {
      id: 1,
      challonge_match_id: 123,
      bot1: "ALAN-WTIE",
      bot2: "KESUS",
      winner: null,
      score: null,
      round: "1",
      state: "open",
      start_time: "2015-01-19T16:57:17-05:00",
    };
    const error = "error";
    mockSupabaseResponse([mockMatchData], error);

    const expectedResponse = {
      error: "No open matches found",
    };

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual(expectedResponse);
  });
});
