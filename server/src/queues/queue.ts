import { Queue } from "bullmq";
import Redis from "ioredis";

export const connection =
  process.env.NODE_ENV === "production"
    ? new Redis(process.env.REDIS_URL!, { tls: {}, maxRetriesPerRequest: null })
    : new Redis({ host: "localhost", port: 6379, maxRetriesPerRequest: null });

const hackathonTeamEmailQueue = new Queue("hackathon-emails", {
  connection: connection,
});

export { hackathonTeamEmailQueue };
