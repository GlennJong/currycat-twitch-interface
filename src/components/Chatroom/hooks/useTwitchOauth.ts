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
  const [receivedMsg, setReceivedMsg] = useState<TwitchWsMessagePayload[]>();
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
