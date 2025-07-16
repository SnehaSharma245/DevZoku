export function teamRegToHackathonTemplate({
  memberName,
  teamName,
  hackathonName,
  hackathonStartDate,
  hackathonEndDate,
  organizationName,
  organizationEmail,
}: {
  memberName: string;
  teamName: string;
  hackathonName: string;
  hackathonStartDate?: string;
  hackathonEndDate?: string;
  organizationName?: string;
  organizationEmail?: string;
}) {
  let dateInfo = "";
  if (hackathonStartDate && hackathonEndDate) {
    dateInfo = `<span style="color:#1976d2;">scheduled from <b>${hackathonStartDate}</b> to <b>${hackathonEndDate}</b></span>`;
  } else if (hackathonStartDate) {
    dateInfo = `<span style="color:#1976d2;">starting on <b>${hackathonStartDate}</b></span>`;
  } else if (hackathonEndDate) {
    dateInfo = `<span style="color:#1976d2;">ending on <b>${hackathonEndDate}</b></span>`;
  }

  return `
    <div style="font-family: Arial, sans-serif; color: #222; background: #f6f8fa; padding: 32px 0;">
      <table align="center" style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #e0e0e0;">
        <tr>
          <td style="padding: 32px 32px 16px 32px;">
            <div style="text-align: center;">
              <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Team" width="60" style="margin-bottom: 12px;" />
              <h2 style="color: #1976d2; margin: 0 0 8px 0;">🎉 Hackathon Registration Confirmation</h2>
            </div>
            <p style="font-size: 16px; margin: 24px 0 8px 0;">
              Hi <b style="color:#1976d2;">${memberName}</b>,
            </p>
            <p style="font-size: 15px; margin: 0 0 16px 0;">
              <span style="color:#43a047;">Congratulations!</span> Your team <b style="color:#1976d2;">${teamName}</b> has been successfully registered for the hackathon <b style="color:#1976d2;">${hackathonName}</b>
              ${dateInfo ? `<br/>${dateInfo}.` : ""} 
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
              We wish you and your team all the best.<br/>
              For any queries, reply to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 32px 24px 32px;">
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
