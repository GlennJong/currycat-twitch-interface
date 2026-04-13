import { parseQueryString } from "../utils/common";
import { fetchGet, fetchPost } from "../utils/fetch";
import {
  TWITCH_BADGES_GLOBAL_URL,
  TWITCH_BADGES_URL,
  TWITCH_EVENT_SUBSCRIBE_URL,
  TWITCH_OAUTH_URL,
  TWITCH_USER_URL,
} from "./constants";
import { BadgeMap, TwitchOauthLoginState, TwitchUserState } from "./types";

// Basic methods
export function openTwitchOauthLogin(client_id: string, redirect_uri: string) {
  const scope = [
    "user:read:chat",
    "user:bot",
    "channel:bot",
    "channel:read:subscriptions",
    "channel:read:redemptions",
  ].join("+");
  const params = `response_type=token&force_verify=true&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}`;
  window.location.href = `${TWITCH_OAUTH_URL}?${params}`;
}

export function getTwitchLoginStateFromQueryString():
  | TwitchOauthLoginState
  | undefined {
  const queryString = window.location.href.split("#")[1];
  if (typeof queryString !== "undefined") {
    const result = parseQueryString<TwitchOauthLoginState>(queryString);
    return result;
  }
}

export async function getTwitchUserProfile(
  client_id: string,
  user_token: string,
): Promise<TwitchUserState | undefined> {
  const headers = {
    "Client-ID": client_id,
    Authorization: `Bearer ${user_token}`,
  };

  const result = await fetchGet(TWITCH_USER_URL, headers);
  if (result) {
    return result.data[0];
  }
}

// Websocket methods
export const subscribeMessageForWs = async (
  ws_session_id: string,
  client_id: string,
  user_token: string,
  user_id: string,
) => {
  const url = TWITCH_EVENT_SUBSCRIBE_URL;
  const data = {
    type: "channel.chat.message",
    version: "1",
    condition: { broadcaster_user_id: user_id, user_id: user_id },
    transport: { method: "websocket", session_id: ws_session_id },
  };

  const header = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user_token}`,
    "Client-Id": client_id,
  };

  try {
    await fetchPost(url, header, data);
    return true;
  } catch (err) {
    return false;
  }
};

export const subscribeChannelPointsForWs = async (
  ws_session_id: string,
  client_id: string,
  user_token: string,
  broadcaster_user_id: string,
) => {
  const url = TWITCH_EVENT_SUBSCRIBE_URL;
  const data = {
    type: "channel.channel_points_custom_reward_redemption.add",
    version: "1",
    condition: { broadcaster_user_id },
    transport: { method: "websocket", session_id: ws_session_id },
  };
  const header = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user_token}`,
    "Client-Id": client_id,
  };
  try {
    await fetchPost(url, header, data);
    return true;
  } catch {
    return false;
  }
};

/** Fetch global + channel badge image URLs and return as a BadgeMap.
 *  Key format: "{set_id}/{version}", value: image_url_1x
 */
export const fetchBadges = async (
  client_id: string,
  user_token: string,
  broadcaster_id: string,
): Promise<BadgeMap> => {
  const headers = {
    "Client-ID": client_id,
    Authorization: `Bearer ${user_token}`,
  };

  const processBadgeData = (data: any[], map: BadgeMap) => {
    data?.forEach((badgeSet: any) => {
      badgeSet.versions?.forEach((version: any) => {
        map[`${badgeSet.set_id}/${version.id}`] = version.image_url_1x;
      });
    });
  };

  const map: BadgeMap = {};
  const [globalResult, channelResult] = await Promise.all([
    fetchGet(TWITCH_BADGES_GLOBAL_URL, headers),
    fetchGet(`${TWITCH_BADGES_URL}?broadcaster_id=${broadcaster_id}`, headers),
  ]);
  processBadgeData(globalResult?.data ?? [], map);
  // Channel-specific badges override global ones
  processBadgeData(channelResult?.data ?? [], map);
  return map;
};
