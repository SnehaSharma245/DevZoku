import { Queue } from "bullmq";

const hackathonTeamEmailQueue = new Queue(
  "team-hackathon-registration-emails",
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

export { hackathonTeamEmailQueue };
