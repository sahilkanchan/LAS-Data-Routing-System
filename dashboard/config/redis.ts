export const REDIS_PORT=process.env.REDIS_PORT ?? 6379
export const REDIS_HOST=process.env.REDIS_HOST ?? "localhost"
export const REDIS_URL=(REDIS_HOST && REDIS_PORT) ? `redis://${REDIS_HOST}:${REDIS_PORT}` : "redis://localhost:6379"
// export const REDIS_USERNAME=process.env.REDIS_USERNAME ?? "user"
export const REDIS_PASSWORD=process.env.REDIS_PASSWORD ?? "password"