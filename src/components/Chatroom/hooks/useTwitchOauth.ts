import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTwitchLoginStateFromQueryString,
  getTwitchUserProfile,
  openTwitchOauthLogin,
  subscribeMessageForWs
} from "./methods";
import { TWITCH_WS_URL } from "./constants";
import { TwitchOauthLoginState, TwitchUserState, TwitchWsMessagePayload } from "./types";



// constants
const client_id = import.meta.env["VITE_TWITCH_CLIENT_ID"];
const redirect_uri = import.meta.env["VITE_TWITCH_OAUTH_REDIRECT_URI"];

type WsEventHandler<T> =
  | {
      onOpen?: () => void;
      onClose?: () => void;
      onMessage?: (data: T) => void;
      onError?: () => void;
    }
  | undefined;

function useTwitchOauth(maxMessage: number = 15) {
  const [twitchState, setTwitchState] = useState<TwitchOauthLoginState & TwitchUserState>();
  const [receivedMsg, setReceivedMsg] = useState<TwitchWsMessagePayload[]>([
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
    {"subscription":{"id":"27741724-5f67-4b5d-a5e0-a0932304cbb7","status":"enabled","type":"channel.chat.message","version":"1","condition":{"broadcaster_user_id":"119013384","user_id":"119013384"},"transport":{"method":"websocket","session_id":"AgoQWKyO354gQ_ytZ69GpPK_LBIGY2VsbC1j"},"created_at":"2025-08-15T12:07:51.051124098Z","cost":0},"event":{"broadcaster_user_id":"119013384","broadcaster_user_login":"curry_cat","broadcaster_user_name":"curry_cat","source_broadcaster_user_id":null,"source_broadcaster_user_login":null,"source_broadcaster_user_name":null,"chatter_user_id":"119013384","chatter_user_login":"curry_cat","chatter_user_name":"curry_cat","message_id":"81138a48-47ef-46f4-a9c6-dd3e627a53de","source_message_id":null,"is_source_only":null,"message":{"text":"test","fragments":[{"type":"text","text":"test","cheermote":null,"emote":null,"mention":null}]},"color":"#D2691E","badges":[{"set_id":"broadcaster","id":"1","info":""},{"set_id":"twitch-recap-2024","id":"1","info":""}],"source_badges":null,"message_type":"text","cheer":null,"reply":null,"channel_points_custom_reward_id":null,"channel_points_animation_id":null}},
  ]);
  
  const receivedMsgRef = useRef<TwitchWsMessagePayload[]>([]);
  const websocketRef = useRef<WebSocket>(null);
  const isWsConnectedRef = useRef<boolean>(false);

  // Get twitch login state from querystring
  const handleGetTwitchState = useCallback(async () => {
    const loginData = getTwitchLoginStateFromQueryString();
    if (!loginData) return;

    const { access_token } = loginData;
    const userData = await getTwitchUserProfile(client_id, access_token);
    if (!userData) return;

    setTwitchState({ ...loginData, ...userData });
  }, []);

  useEffect(() => {
    handleGetTwitchState();
  }, [handleGetTwitchState]);

  function startOauthConnect() {
    openTwitchOauthLogin(client_id, redirect_uri);
  }

  function startWebsocket(events: WsEventHandler<TwitchWsMessagePayload> = {}) {
    const { onOpen, onClose, onMessage, onError } = events;
    if (!twitchState) return;

    const { access_token, id } = twitchState;
    const ws = new WebSocket(TWITCH_WS_URL);
    ws.onopen = () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onOpen && onOpen();
    };
    ws.onclose = () => {
      isWsConnectedRef.current = false;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onClose && onClose();
    };

    ws.addEventListener("message", async (event) => {
      const data = JSON.parse(event.data);

      if (isWsConnectedRef.current) {
        // channel.read.redemptions
        // channel.chat.message
        if (data.metadata.subscription_type === "channel.chat.message") {
          
          const newMsg = data.payload;
          console.log({ newMsg })

          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onMessage && onMessage(newMsg);
          receivedMsgRef.current = [
            ...receivedMsgRef.current.slice(-maxMessage + 1), // 保留最多 maxMessage 條訊息
            newMsg,
          ];
          setReceivedMsg([...receivedMsgRef.current]);
        }
      } else {
        const session_id = data.payload.session.id;
        const isSubscribeSuccess = await subscribeMessageForWs(
          session_id,
          client_id,
          access_token,
          id,
        );
        if (isSubscribeSuccess) {
          isWsConnectedRef.current = true;
        } else {
          if (onError) {
            onError();
          }
        }
      }
    });

    websocketRef.current = ws;
  }

  return {
    twitchState,
    startOauthConnect,
    startWebsocket,
    messages: receivedMsg,
  };
}

export default useTwitchOauth;
