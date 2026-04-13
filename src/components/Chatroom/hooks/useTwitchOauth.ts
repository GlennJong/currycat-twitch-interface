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

// localStorage key for manual twitch state
const MANUAL_TWITCH_STATE_KEY = "manual_twitch_state";

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
  console.log('twitchState', twitchState)

  const receivedMsgRef = useRef<TwitchChatEntry[]>([]);
  const websocketRef = useRef<WebSocket>(null);
  const isWsConnectedRef = useRef<boolean>(false);

  // Save manual twitch state to localStorage
  const saveManualTwitchState = useCallback((state: TwitchOauthLoginState & TwitchUserState) => {
    localStorage.setItem(MANUAL_TWITCH_STATE_KEY, JSON.stringify(state));
  }, []);

  // Load manual twitch state from localStorage
  const loadManualTwitchState = useCallback((): (TwitchOauthLoginState & TwitchUserState) | null => {
    try {
      const stored = localStorage.getItem(MANUAL_TWITCH_STATE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  // Clear manual twitch state
  const clearManualTwitchState = useCallback(() => {
    localStorage.removeItem(MANUAL_TWITCH_STATE_KEY);
    setTwitchState(undefined);
  }, []);

  // Set manual twitch state
  const setManualTwitchState = useCallback((manualState: Partial<TwitchOauthLoginState & TwitchUserState>) => {
    const currentState = twitchState || loadManualTwitchState() || {} as TwitchOauthLoginState & TwitchUserState;
    const newState = { ...currentState, ...manualState };
    setTwitchState(newState);
    saveManualTwitchState(newState);
  }, [twitchState, loadManualTwitchState, saveManualTwitchState]);

  // Get twitch login state from querystring or localStorage
  const handleGetTwitchState = useCallback(async () => {
    // First try to get from OAuth querystring
    const loginData = getTwitchLoginStateFromQueryString();
    if (loginData) {
      const { access_token } = loginData;
      const userData = await getTwitchUserProfile(client_id, access_token);
      if (userData) {
        const fullState = { ...loginData, ...userData };
        setTwitchState(fullState);
        saveManualTwitchState(fullState); // Also save to localStorage
        return;
      }
    }

    // If OAuth failed, try to load from localStorage
    const manualState = loadManualTwitchState();
    if (manualState) {
      setTwitchState(manualState);
    }
  }, [saveManualTwitchState, loadManualTwitchState]);

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
  }

  return {
    twitchState,
    setTwitchState,
    setManualTwitchState,
    clearManualTwitchState,
    startOauthConnect,
    startWebsocket,
    messages: receivedMsg,
    badgeMap,
  };
}

export default useTwitchOauth;
