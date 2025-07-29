import { teamRegToHackathonTemplate } from "../templates/teamRegToHackathon";
import transporter from "../utils/nodemailerUtility";
import { hackathonResultAnnouncementTemplate } from "../templates/HackathonWinnerAnnouncement";

const sendTeamRegistrationEmail = async ({
  email,
  memberName,
  teamName,
  hackathonName,
  hackathonStartDate,
  hackathonEndDate,
  organizationName,
  organizationEmail,
}: {
  email: string;
  memberName: string;
  teamName: string;
  hackathonName: string;
  hackathonStartDate: string;
  hackathonEndDate: string;
  organizationName: string;
  organizationEmail: string;
}) => {
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
    organizationEmail || "",
    organizationName || "DevZoku",
    email,
    `Team Registration Confirmation for ${teamName} at ${hackathonName}`,
    message
  );
};

const sendHackathonResultEmail = async ({
  email,
  captainName,
  teamName,
  hackathonName,
  organizationName,
  organizationEmail,
  position,
}: {
  email: string;
  captainName: string;
  teamName: string;
  hackathonName: string;
  organizationName: string;
  organizationEmail: string;
  position: "winner" | "firstRunnerUp" | "secondRunnerUp" | "participant";
}) => {
  const message = hackathonResultAnnouncementTemplate({
    captainName,
    teamName,
    hackathonName,
    organizationName,
    organizationEmail: organizationEmail || "",
    position,
  });

  await transporter(
    organizationEmail || "",
    organizationName || "DevZoku",
    email,
    `Hackathon Results for ${teamName} at ${hackathonName}`,
    message
  );
};

export { sendTeamRegistrationEmail, sendHackathonResultEmail };
