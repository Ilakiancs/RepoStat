export interface GitHubUser {
  createdAt: string;
}

export interface RepositoryConnection {
  totalCount: number;
}

export interface GitHubUserWithRepos {
  repositories: RepositoryConnection;
}

export interface GitHubRepositoryStats {
  totalPublic: RepositoryConnection;
  totalPrivate: RepositoryConnection;
  owned: RepositoryConnection;
  original: RepositoryConnection;
}

export interface ContributionCalendar {
  totalContributions: number;
}

export interface ContributionsCollection {
  contributionCalendar: ContributionCalendar;
}

export interface GitHubUserResponse {
  user: GitHubUser & {
    contributionsCollection: ContributionsCollection;
  };
}

export interface ReposCount {
  owned: number;
  original: number;
  private: number;
}

export interface CacheEntry {
  commits: number;
  total_repos: number;
  repos_count: ReposCount;
  timestamp: number;
}

export interface ApiResponse {
  commits: number;
  total_repos: number;
  repos_count: ReposCount;
}

export interface ApiErrorResponse {
  error: string;
}