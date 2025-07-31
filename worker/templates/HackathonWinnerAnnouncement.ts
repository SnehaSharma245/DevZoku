export function hackathonResultAnnouncementTemplate({
  captainName,
  teamName,
  hackathonName,
  organizationName,
  organizationEmail,
  position,
}: {
  captainName: string;
  teamName: string;
  hackathonName: string;
  organizationName: string;
  organizationEmail: string;
  position: "winner" | "firstRunnerUp" | "secondRunnerUp" | "participant";
}) {
  // Position display
  const positionDisplay: Record<
    string,
    { label: string; color: string; emoji: string }
  > = {
    winner: { label: "Winner 🥇", color: "#43a047", emoji: "🏆" },
    firstRunnerUp: {
      label: "First Runner Up 🥈",
      color: "#1976d2",
      emoji: "🥈",
    },
    secondRunnerUp: {
      label: "Second Runner Up 🥉",
      color: "#fbbf24",
      emoji: "🥉",
    },
    participant: { label: "Participant", color: "#888", emoji: "🎉" },
  };

  const pos = positionDisplay[position];
  if (!pos) {
    throw new Error(`Invalid position: ${position}`);
  }

  return `
    <div style="font-family: Arial, sans-serif; color: #222; background: #f6f8fa; padding: 32px 0;">
      <table align="center" style="max-width: 520px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 2px 12px #e0e0e0;">
        <tr>
          <td style="padding: 36px 36px 20px 36px;">
            <div style="text-align: center;">
              <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Team" width="60" style="margin-bottom: 12px;" />
              <h2 style="color: #1976d2; margin: 0 0 8px 0;">Hackathon Results Announced!</h2>
              <div style="margin: 12px 0;">
                <span style="display:inline-block; background:${
                  pos.color
                }; color:#fff; border-radius:8px; padding:6px 18px; font-size:16px; font-weight:bold;">
                  ${pos.emoji} ${pos.label}
                </span>
              </div>
            </div>
            <p style="font-size: 16px; margin: 24px 0 8px 0;">
              Hi <b style="color:#1976d2;">${captainName}</b>,
            </p>
            <p style="font-size: 15px; margin: 0 0 16px 0;">
              ${
                position === "participant"
                  ? `Thank you for participating in the hackathon <b style="color:#1976d2;">${hackathonName}</b> as the captain of <b style="color:#1976d2;">${teamName}</b>!`
                  : `Congratulations! Your team <b style="color:#1976d2;">${teamName}</b> has secured <b>${pos.label}</b> in the hackathon <b style="color:#1976d2;">${hackathonName}</b>!`
              }
            </p>
            ${
              organizationName
                ? `<p style="margin: 0 0 8px 0;">Organized by <b style="color:#1976d2;">${organizationName}</b></p>`
                : ""
            }
            ${
              organizationEmail
                ? `<p style="margin: 0 0 16px 0;">For any queries, contact: <a href="mailto:${organizationEmail}" style="color:#1976d2;">${organizationEmail}</a></p>`
                : ""
            }
            <div style="text-align: center; margin: 24px 0;">
              <img src="https://cdn-icons-png.flaticon.com/512/1041/1041916.png" alt="Hackathon" width="48" />
            </div>
            <p style="font-size: 15px; margin: 0 0 8px 0;">
              We appreciate your efforts and hope you enjoyed the event.<br/>
              For any queries, reply to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 36px 24px 36px;">
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0 8px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">
              This is an automated email. Please do not reply directly.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}
