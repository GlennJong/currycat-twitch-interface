import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchBadges,
  getTwitchLoginStateFromQueryString,
  getTwitchUserProfile,
  openTwitchOauthLogin,
  subscribeChannelPointsForWs,
  subscribeMessageForWs
} from "./methods";
import { TWITCH_WS_URL } from "./constants";
import { BadgeMap, TwitchChatEntry, TwitchOauthLoginState, TwitchUserState, TwitchWsMessagePayload } from "./types";

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
  const [receivedMsg, setReceivedMsg] = useState<TwitchChatEntry[]>([]);
  const [badgeMap, setBadgeMap] = useState<BadgeMap>({});

  const receivedMsgRef = useRef<TwitchChatEntry[]>([]);
  const websocketRef = useRef<WebSocket>(null);
  const twitchStateRef = useRef<(TwitchOauthLoginState & TwitchUserState) | undefined>(undefined);
  const isWsConnectedRef = useRef<boolean>(false);
  const instanceIdRef = useRef<string>(Math.random().toString(36).slice(2));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    twitchStateRef.current = twitchState;
  }, [twitchState]);

  // Clear current twitch state in memory
  const clearTwitchState = useCallback(() => {
    setTwitchState(undefined);
  }, []);

  // Get twitch login state only from OAuth querystring
  const handleGetTwitchState = useCallback(async () => {
    const loginData = getTwitchLoginStateFromQueryString();
    if (!loginData) return;

    const { access_token } = loginData;
    const userData = await getTwitchUserProfile(client_id, access_token);
    if (!userData) return;

    const fullState = { ...loginData, ...userData };
    setTwitchState(fullState);
  }, []);

  useEffect(() => {
    handleGetTwitchState();
  }, [handleGetTwitchState]);

  // Listen for one-shot sync trigger from other windows (dock/overlay)
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof (window as any).BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('currycat-dock');
      bc.onmessage = (ev) => {
        if (!ev.data) return;
        if (ev.data.source && ev.data.source === instanceIdRef.current) return;
        if (ev.data.type === 'sync-chat-trigger') {
          try {
            if (twitchStateRef.current) startWebsocket();
          } catch {}
        }
      };
    }
    return () => {
      if (bc) bc.close();
    };
  }, []);

  function startOauthConnect() {
    openTwitchOauthLogin(client_id, redirect_uri);
  }

  function startWebsocket(events: WsEventHandler<TwitchWsMessagePayload> = {}) {
    const { onOpen, onClose, onMessage, onError } = events;
    const currentTwitchState = twitchStateRef.current;
    if (!currentTwitchState) return;
    if (isWsConnectedRef.current) return;
    if (websocketRef.current && (websocketRef.current.readyState === WebSocket.OPEN || websocketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const { access_token, id } = currentTwitchState;
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
        const subType: string = data.metadata?.subscription_type ?? '';

        if (subType === "channel.chat.message") {
          const entry: TwitchChatEntry = {
            id: data.payload.event.message_id,
            type: 'chat',
            event: data.payload.event,
          };
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onMessage && onMessage(data.payload);
          receivedMsgRef.current = [
            ...receivedMsgRef.current.slice(-maxMessage + 1),
            entry,
          ];
          setReceivedMsg([...receivedMsgRef.current]);
        } else if (subType === "channel.channel_points_custom_reward_redemption.add") {
          const entry: TwitchChatEntry = {
            id: data.payload.event.id,
            type: 'redemption',
            event: data.payload.event,
          };
          receivedMsgRef.current = [
            ...receivedMsgRef.current.slice(-maxMessage + 1),
            entry,
          ];
          setReceivedMsg([...receivedMsgRef.current]);
        }
      } else {
        const session_id = data.payload.session.id;
        const [chatOk] = await Promise.all([
          subscribeMessageForWs(session_id, client_id, access_token, id),
          subscribeChannelPointsForWs(session_id, client_id, access_token, id),
        ]);
        if (chatOk) {
          isWsConnectedRef.current = true;
          // Fetch badge image URLs now that we have auth
          fetchBadges(client_id, access_token, id).then(setBadgeMap);
        } else {
          if (onError) {
            onError();
          }
        }
      }
    });

    websocketRef.current = ws;
    setIsSyncing(true);
  }

  function stopWebsocket() {
    try {
      if (websocketRef.current) websocketRef.current.close();
    } catch {}
    websocketRef.current = null;
    isWsConnectedRef.current = false;
    setIsSyncing(false);
  }

  return {
    twitchState,
    setTwitchState,
    clearTwitchState,
    startOauthConnect,
    startWebsocket,
    stopWebsocket,
    isSyncing,
    messages: receivedMsg,
    badgeMap,
  };
}

export default useTwitchOauth;
