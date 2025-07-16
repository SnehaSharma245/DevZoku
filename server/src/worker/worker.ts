import { Worker } from "bullmq";
import { teamRegToHackathonTemplate } from "../templates/teamRegToHackathon";
import transporter from "../utils/nodemailerUtility";
const hackathonTeamEmailWorker = new Worker(
  "team-hackathon-registration-emails",
  async (job) => {
    console.log("Worker started for job:", job.id);
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
      email,
      `Team Registration Confirmation for ${teamName} at ${hackathonName}`,
      message
    ).then((info) => {
      console.log(`Email sent to ${email} with info:`, info);
    });
  },
  {
    concurrency: 100,
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);
export { hackathonTeamEmailWorker };
