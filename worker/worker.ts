import { Worker } from "bullmq";
import { teamRegToHackathonTemplate } from "./templates/teamRegToHackathon";
import transporter from "./lib/nodemailerUtility";
import { hackathonResultAnnouncementTemplate } from "./templates/HackathonWinnerAnnouncement";

const hackathonTeamEmailWorker = new Worker(
  "hackathon-emails",
  async (job) => {
    const {
      email,
      memberName,
      teamName,
      hackathonName,
      hackathonStartDate,
      hackathonEndDate,
      organizationName,
      organizationEmail,

      position,
      captainName,
    } = job.data;

    if (job.name === "team-registration") {
      const message = teamRegToHackathonTemplate({
        memberName,
        teamName,
        hackathonName,
        hackathonStartDate,
        hackathonEndDate,
        organizationName,
        organizationEmail,
      });

      await transporter(
        organizationEmail,
        organizationName || "DevZoku",
        email,
        `Team Registration Confirmation for ${teamName} at ${hackathonName}`,
        message
      );
    }

    if (job.name === "winner-result") {
      const message = hackathonResultAnnouncementTemplate({
        captainName,
        teamName,
        hackathonName,
        organizationName,
        organizationEmail,
        position,
      });

      await transporter(
        organizationEmail,
        organizationName || "DevZoku",
        email,
        `Hackathon Results for ${teamName} at ${hackathonName}`,
        message
      );
    }
  },
  {
    concurrency: 100,
    connection: {
      host: process.env.VALKEY_HOST || "valkey",
      port: process.env.VALKEY_PORT ? Number(process.env.VALKEY_PORT) : 6379,
    },
  }
);

export { hackathonTeamEmailWorker };
