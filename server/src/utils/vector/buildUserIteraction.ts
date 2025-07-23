import type { UserInteraction } from "../../db/schema/userInteraction.schema";

export function buildUserInteractionText(interaction: UserInteraction): string {
  return `
    Hackathon Tags Searched: ${
      interaction.hackathonTagsSearchedFor?.join(", ") ?? ""
    }
     Hackathon Registered Tags: ${
       interaction.hackathonsRegisteredTags?.join(", ") ?? ""
     }
    Preferred Duration: ${interaction.preferredDuration ?? ""}
    Preferred Mode: ${interaction.preferredMode ?? ""}
    Interaction Type: ${interaction.interactionType}
  `;
}
