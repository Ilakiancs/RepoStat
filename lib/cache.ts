import { CacheEntry, ReposCount } from '@/types';

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function getCachedUserStats(username: string): { commits: number; total_repos: number; repos_count: ReposCount } | null {
  const entry = cache.get(username);
  
  if (!entry) {
    return null;
  }
  
  const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
  
  if (isExpired) {
    cache.delete(username);
    return null;
  }
  
  return {
    commits: entry.commits,
    total_repos: entry.total_repos,
    repos_count: entry.repos_count
  };
}

export function setCachedUserStats(username: string, commits: number, total_repos: number, repos_count: ReposCount): void {
  cache.set(username, {
    commits,
    total_repos,
    repos_count,
    timestamp: Date.now()
  });
}

// Backward compatibility function
export function getCachedCommits(username: string): number | null {
  const stats = getCachedUserStats(username);
  return stats ? stats.commits : null;
}

// Backward compatibility function (deprecated)
export function setCachedCommits(username: string, commits: number): void {
  const existingStats = getCachedUserStats(username);
  const total_repos = existingStats ? existingStats.total_repos : 0;
  const repos_count = existingStats ? existingStats.repos_count : { owned: 0, original: 0, private: 0 };
  setCachedUserStats(username, commits, total_repos, repos_count);
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheSize(): number {
  return cache.size;
}