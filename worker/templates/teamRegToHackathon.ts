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
    dateInfo = `<span style="color:#FF6F61;">scheduled from <b>${hackathonStartDate}</b> to <b>${hackathonEndDate}</b></span>`;
  } else if (hackathonStartDate) {
    dateInfo = `<span style="color:#FF6F61;">starting on <b>${hackathonStartDate}</b></span>`;
  } else if (hackathonEndDate) {
    dateInfo = `<span style="color:#FF6F61;">ending on <b>${hackathonEndDate}</b></span>`;
  }

  return `
    <div style="font-family: Arial, sans-serif; color: #062a47; background: #fff9f5; padding: 32px 0;">
      <table align="center" style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(255, 105, 97, 0.1); border: 1px solid #fff9f5;">
        <tr>
          <td style="padding: 32px 32px 16px 32px;">
            <div style="text-align: center;">
              <h2 style="color: #FF6F61; margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">Hackathon Registration Confirmation</h2>
            </div>
            <p style="font-size: 16px; margin: 24px 0 8px 0; color: #062a47;">
              Hi <b style="color: #FF6F61;">${memberName}</b>,
            </p>
            <p style="font-size: 15px; margin: 0 0 16px 0; color: #062a47; line-height: 1.5;">
              <span style="color: #FF8A65;">Congratulations!</span> Your team <b style="color: #FF6F61;">${teamName}</b> has been successfully registered for the hackathon <b style="color: #FF6F61;">${hackathonName}</b>
              ${dateInfo ? `<br/>${dateInfo}.` : ""} 
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
                We wish you and your team all the best.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 32px 24px 32px;">
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
