import { Queue } from "bullmq";

const queue = new Queue("hackathon-emails", {
  connection: {
    host: process.env.VALKEY_HOST || "valkey",
    port: process.env.VALKEY_PORT ? Number(process.env.VALKEY_PORT) : 6379,
  },
});

export { queue as hackathonTeamEmailQueue };
