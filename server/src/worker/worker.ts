import { Worker } from "bullmq";
import { teamRegToHackathonTemplate } from "../templates/teamRegToHackathon";
import transporter from "../utils/nodemailerUtility";
import { connection } from "../queues/queue";
import { buildUserInteractionText } from "../utils/vector/buildUserIteraction";
import { initialiseVectorStore } from "../lib/vectorStore";
import { Document } from "@langchain/core/documents";
import { hackathonResultAnnouncementTemplate } from "../templates/HackathonWinnerAnnouncement";

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
      type,
      position,
      captainName,
    } = job.data;

    if (type === "team-registration") {
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

    if (type === "hackathon-result-announcement") {
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
    connection: connection,
  }
);

export { hackathonTeamEmailWorker };
