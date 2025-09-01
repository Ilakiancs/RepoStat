import { NextRequest, NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github";
import { getCachedUserStats, setCachedUserStats } from "@/lib/cache";
import { createCorsHeaders } from "@/lib/utils";
import { ApiResponse, ApiErrorResponse } from "@/types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    username: string;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse | ApiErrorResponse>> {
  const corsHeaders = createCorsHeaders();

  try {
    const { username } = params;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    const cachedStats = getCachedUserStats(username);
    if (cachedStats !== null) {
      return NextResponse.json(
        cachedStats,
        { headers: corsHeaders }
      );
    }

    const githubClient = new GitHubClient(githubToken);
    const userStats = await githubClient.getUserStats(username);

    setCachedUserStats(username, userStats.commits, userStats.total_repos, userStats.repos_count);

    return NextResponse.json(
      userStats,
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(_request: NextRequest): Promise<NextResponse> {
  const corsHeaders = createCorsHeaders();
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
