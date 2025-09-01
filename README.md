# github stats api

a high-performance next.js 14 api service that provides comprehensive github metrics including lifetime commit counts and repository statistics via graphql integration.

## overview

this api provides a single, efficient endpoint to retrieve github user statistics:

- endpoint: `GET /api/commits/{username}`
- response time: ~800ms average (cached responses: ~50ms)
- rate limits: 5000 requests/hour (github api quota)
- cache policy: 24-hour in-memory lru cache per username

## Core architecture

The codebase follows a minimal, service-oriented structure:

**Core Services**
- `github.ts` - GraphQL client with year-based contribution aggregation
- `cache.ts` - Memory-based LRU caching layer with TTL support
- `utils.ts` - HTTP and formatting utilities

**API Layer**
- Single dynamic route handler at `app/api/commits/[username]/route.ts`
- Type definitions centralized in `types/index.ts`

## API contract

### request
```
GET /api/commits/{username}
```

### response
```json
{
  "commits": 1308,
  "total_repos": 42,
  "repos_count": {
    "owned": 28,
    "original": 35,
    "private": 12
  }
}
```

### error handling
```json
{
  "error": "User not found"
}
```

## how it works

the api uses a multi-stage query pattern to efficiently gather user stats:

1. check in-memory cache for recent data
2. query user creation date if not cached
3. fetch contribution data year-by-year from account creation
4. get repository stats in a single parallel query
5. aggregate results, update cache, return response

## integration examples

### HTTP/Fetch
```javascript
const stats = await fetch('https://your-api.vercel.app/api/commits/username').then(r => r.json());
```

### React/SWR
```typescript
import useSWR from 'swr';

function useGitHubStats(username) {
  return useSWR(`/api/commits/${username}`, fetcher);
}
```

## license

mit license

---

created by ilakiancs
