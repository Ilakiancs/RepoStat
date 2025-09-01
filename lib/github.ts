import { GitHubUserResponse, GitHubUserWithRepos, GitHubRepositoryStats, ReposCount } from '@/types';
import { getCurrentYear, getYearFromDate } from './utils';

const GITHUB_API_URL = 'https://api.github.com/graphql';

export class GitHubClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async makeGraphQLRequest(query: string, variables: Record<string, any> = {}): Promise<any> {
    const response = await fetch(GITHUB_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GitHub API error: ${data.errors.map((e: any) => e.message).join(', ')}`);
    }

    return data.data;
  }

  private async getUserCreatedAt(username: string): Promise<string> {
    const query = `
      query GetUser($username: String!) {
        user(login: $username) {
          createdAt
        }
      }
    `;

    const data = await this.makeGraphQLRequest(query, { username });
    
    if (!data.user) {
      throw new Error('User not found');
    }

    return data.user.createdAt;
  }

  private async getContributionsForYear(username: string, year: number): Promise<number> {
    const fromDate = `${year}-01-01T00:00:00Z`;
    const toDate = `${year}-12-31T23:59:59Z`;

    const query = `
      query GetContributions($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
            }
          }
        }
      }
    `;

    const data = await this.makeGraphQLRequest(query, {
      username,
      from: fromDate,
      to: toDate,
    });

    if (!data.user) {
      throw new Error('User not found');
    }

    return data.user.contributionsCollection.contributionCalendar.totalContributions;
  }

  private async getRepositoryStats(username: string): Promise<{ total_repos: number; repos_count: ReposCount }> {
    const query = `
      query GetRepositoryStats($username: String!) {
        user(login: $username) {
          totalPublic: repositories(privacy: PUBLIC) {
            totalCount
          }
          totalPrivate: repositories(privacy: PRIVATE) {
            totalCount
          }
          owned: repositories(ownerAffiliations: [OWNER]) {
            totalCount
          }
          original: repositories(isFork: false) {
            totalCount
          }
        }
      }
    `;

    const data = await this.makeGraphQLRequest(query, { username });
    
    if (!data.user) {
      throw new Error('User not found');
    }

    const stats: GitHubRepositoryStats = data.user;
    const totalRepos = stats.totalPublic.totalCount + stats.totalPrivate.totalCount;

    return {
      total_repos: totalRepos,
      repos_count: {
        owned: stats.owned.totalCount,
        original: stats.original.totalCount,
        private: stats.totalPrivate.totalCount
      }
    };
  }

  async getTotalCommits(username: string): Promise<number> {
    try {
      const createdAt = await this.getUserCreatedAt(username);
      const startYear = getYearFromDate(createdAt);
      const currentYear = getCurrentYear();

      let totalCommits = 0;

      for (let year = startYear; year <= currentYear; year++) {
        const commits = await this.getContributionsForYear(username, year);
        totalCommits += commits;
      }

      return totalCommits;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching GitHub data');
    }
  }

  async getUserStats(username: string): Promise<{ commits: number; total_repos: number; repos_count: ReposCount }> {
    try {
      const [totalCommits, repoStats] = await Promise.all([
        this.getTotalCommits(username),
        this.getRepositoryStats(username)
      ]);

      return {
        commits: totalCommits,
        total_repos: repoStats.total_repos,
        repos_count: repoStats.repos_count
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while fetching GitHub data');
    }
  }
}