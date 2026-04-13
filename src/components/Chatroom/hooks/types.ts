export type TwitchOauthLoginState = {
  access_token: string;
  scope: string;
  token_type: string;
};

/** Badge image URL map: key = "{set_id}/{version}", value = image_url_1x */
export type BadgeMap = Record<string, string>;

/** Normalized entry stored in the messages list — covers both chat and redemption events */
export type TwitchChatEntry = {
  id: string;
  type: 'chat' | 'redemption';
  event: any;
};

export type TwitchUserState = {
  id: string;
  broadcaster_type: string;
  created_at: string;
  description: string;
  display_name: string;
  login: string;
  offline_image_url: string;
  profile_image_url: string;
  type: string;
  view_count: number;
};

export type TwitchWsMessagePayload = {
  subscription: {
    id: string
    status: string,
    type: string,
    version: string,
    condition: {
      broadcaster_user_id: string,
      user_id: string
    },
    transport: {
      method: 'websocket',
      session_id: string
    },
    created_at: string,
    cost: number
  },
  event: {
    broadcaster_user_id: string,
    broadcaster_user_login: string,
    broadcaster_user_name: string,
    source_broadcaster_user_id: null | string,
    source_broadcaster_user_login: null | string,
    source_broadcaster_user_name: null | string,
    chatter_user_id: number,
    chatter_user_login: string,
    chatter_user_name: string,
    message_id: string,
    source_message_id: null | string,
    is_source_only:  null | string,
    message: {
      text: string,
      fragments: [
        {
          type: 'text',
          text: string,
          cheermote: string | null,
          emote: string | null,
          mention: string | null
        }
      ]
    },
    color: string,
    badges: {
      set_id: string,
      id: string,
      info: string
    }[],
    source_badges: null | string,
    message_type: 'text' | 'channel_points_highlighted' | 'channel_points_sub_only' | 'user_intro' | string,
    cheer: null | string,
    reply: null | string,
    channel_points_custom_reward_id: null | string,
    channel_points_animation_id: null | string
  }
}

/** channel.channel_points_custom_reward_redemption.add event */
export type TwitchChannelPointsRedemptionPayload = {
  subscription: {
    id: string,
    status: string,
    type: string,
    version: string,
    condition: {
      broadcaster_user_id: string,
    },
    transport: {
      method: 'websocket',
      session_id: string
    },
    created_at: string,
    cost: number
  },
  event: {
    id: string,
    broadcaster_user_id: string,
    broadcaster_user_login: string,
    broadcaster_user_name: string,
    user_id: string,
    user_login: string,
    user_name: string,
    user_input: string,
    status: string,
    reward: {
      id: string,
      title: string,
      cost: number,
      prompt: string,
    },
    redeemed_at: string,
  }
}