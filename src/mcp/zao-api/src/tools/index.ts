import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getProfile } from "./get_profile.js";
import { getCasts } from "./get_casts.js";
import { getRespectScore } from "./get_respect_score.js";
import { getCommunityMembers } from "./get_community_members.js";
import { getRecents } from "./get_recents.js";
import { searchCasts } from "./search_casts.js";
import { getRoomHistory } from "./get_room_history.js";
import { getProposals } from "./get_proposals.js";


export const tools: Tool[] = [
  {
    name: "get_profile",
    description: "Get a user's ZAO profile by their FID (Farcaster ID)",
    inputSchema: {
      type: "object",
      properties: {
        fid: { type: "string", description: "The user's FID (Farcaster ID)" }
      },
      required: ["fid"]
    }
  },
  {
    name: "get_casts",
    description: "Get recent casts from a specific user by FID",
    inputSchema: {
      type: "object",
      properties: {
        fid: { type: "string", description: "The user's FID" },
        limit: { type: "number", description: "Number of casts to return (default: 20, max: 100)" }
      },
      required: ["fid"]
    }
  },
  {
    name: "get_respect_score",
    description: "Get a user's respect score and ranking in the ZAO community",
    inputSchema: {
      type: "object",
      properties: {
        fid: { type: "string", description: "The user's FID" }
      },
      required: ["fid"]
    }
  },
  {
    name: "get_community_members",
    description: "Get list of active ZAO community members",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of members to return (default: 20, max: 100)" }
      }
    }
  },
  {
    name: "get_recents",
    description: "Get recent casts from the community in the last N hours",
    inputSchema: {
      type: "object",
      properties: {
        hours: { type: "number", description: "Number of hours to look back (default: 24, max: 168)" }
      }
    }
  },
  {
    name: "search_casts",
    description: "Search casts by keyword in the ZAO community",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query string" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_room_history",
    description: "Get history of audio rooms in ZAO",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of rooms to return (default: 10, max: 50)" }
      }
    }
  },
  {
    name: "get_proposals",
    description: "Get governance proposals for ZOUNZ DAO",
    inputSchema: {
      type: "object",
      properties: {
        status: { 
          type: "string", 
          enum: ["open", "closed", "all"],
          description: "Filter by proposal status (default: all)" 
        }
      }
    }
  }
];

import type { ToolArgs } from "../types/index.js";

export const toolHandlers: Record<string, (args: ToolArgs) => Promise<unknown>> = {
  get_profile: getProfile as (args: ToolArgs) => Promise<unknown>,
  get_casts: getCasts as (args: ToolArgs) => Promise<unknown>,
  get_respect_score: getRespectScore as (args: ToolArgs) => Promise<unknown>,
  get_community_members: getCommunityMembers as (args: ToolArgs) => Promise<unknown>,
  get_recents: getRecents as (args: ToolArgs) => Promise<unknown>,
  search_casts: searchCasts as (args: ToolArgs) => Promise<unknown>,
  get_room_history: getRoomHistory as (args: ToolArgs) => Promise<unknown>,
  get_proposals: getProposals as (args: ToolArgs) => Promise<unknown>
};
