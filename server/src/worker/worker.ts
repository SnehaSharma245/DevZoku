import { Worker } from "bullmq";
import { teamRegToHackathonTemplate } from "../templates/teamRegToHackathon";
import transporter from "../utils/nodemailerUtility";
import { connection } from "../queues/queue";

console.log(connection.options);

const hackathonTeamEmailWorker = new Worker(
  "team-hackathon-registration-emails",
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
    } = job.data;

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
  },
  {
    concurrency: 100,
    connection: connection,
  }
);
export { hackathonTeamEmailWorker };
