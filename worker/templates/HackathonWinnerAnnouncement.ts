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
    winner: { label: "Winner 🥇", color: "#FF6F61", emoji: "🥇" },
    firstRunnerUp: {
      label: "First Runner Up 🥈",
      color: "#FF8A65",
      emoji: "🥈",
    },
    secondRunnerUp: {
      label: "Second Runner Up 🥉",
      color: "#FF9466",
      emoji: "🥉",
    },
    participant: { label: "Participant", color: "#6B7A8F", emoji: "" },
  };

  const pos = positionDisplay[position];
  if (!pos) {
    throw new Error(`Invalid position: ${position}`);
  }

  return `
    <div style="font-family: Arial, sans-serif; color: #062a47; background: #fff9f5; padding: 32px 0;">
      <table align="center" style="max-width: 520px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(255, 105, 97, 0.1); border: 1px solid #fff9f5;">
        <tr>
          <td style="padding: 36px 36px 20px 36px;">
            <div style="text-align: center;">
              <h2 style="color: #FF6F61; margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">Hackathon Results Announced!</h2>
              <div style="margin: 16px 0;">
                <span style="display:inline-block; background: linear-gradient(135deg, ${
                  pos.color
                }, #FF9466); color:#fff; border-radius:12px; padding:8px 20px; font-size:16px; font-weight:bold; box-shadow: 0 2px 8px rgba(255, 105, 97, 0.2);">
                  ${pos.emoji} ${pos.label}
                </span>
              </div>
            </div>
            <p style="font-size: 16px; margin: 24px 0 8px 0; color: #062a47;">
              Hi <b style="color: #FF6F61;">${captainName}</b>,
            </p>
            <p style="font-size: 15px; margin: 0 0 16px 0; color: #062a47; line-height: 1.5;">
              ${
                position === "participant"
                  ? `Thank you for participating in the hackathon <b style="color: #FF6F61;">${hackathonName}</b> as the captain of <b style="color: #FF6F61;">${teamName}</b>!`
                  : `Congratulations! Your team <b style="color: #FF6F61;">${teamName}</b> has secured <b style="color: #FF6F61;">${pos.label}</b> in the hackathon <b style="color: #FF6F61;">${hackathonName}</b>!`
              }
            </p>
            ${
              organizationName
                ? `<p style="margin: 0 0 8px 0; color: #062a47;">Organized by <b style="color: #FF6F61;">${organizationName}</b></p>`
                : ""
            }
            ${
              organizationEmail
                ? `<p style="margin: 0 0 16px 0; color: #062a47;">For any queries, contact: <a href="mailto:${organizationEmail}" style="color: #FF6F61; text-decoration: none;">${organizationEmail}</a></p>`
                : ""
            }
            <div style="text-align: center; margin: 24px 0; padding: 16px; background: #fff9f5; border-radius: 8px;">
              <p style="font-size: 15px; margin: 0; color: #6B7A8F; line-height: 1.5;">
                We appreciate your efforts and hope you enjoyed the event.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 36px 24px 36px;">
            <hr style="border: none; border-top: 1px solid #fff9f5; margin: 24px 0 8px 0;" />
            <p style="font-size: 12px; color: #6B7A8F; text-align: center;">
              This is an automated email. Please do not reply directly.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}
