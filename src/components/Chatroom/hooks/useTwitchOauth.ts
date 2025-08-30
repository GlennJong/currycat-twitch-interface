import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTwitchLoginStateFromQueryString,
  getTwitchUserProfile,
  openTwitchOauthLogin,
  subscribeMessageForWs
} from "./methods";
import { TWITCH_WS_URL } from "./constants";
import { TwitchOauthLoginState, TwitchUserState, TwitchWsMessagePayload } from "./types";

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
  const [receivedMsg, setReceivedMsg] = useState<TwitchWsMessagePayload[]>([]);
  console.log('twitchState', twitchState)
  
  const receivedMsgRef = useRef<TwitchWsMessagePayload[]>([]);
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
    setTwitchState,
    setManualTwitchState,
    clearManualTwitchState,
    startOauthConnect,
    startWebsocket,
    messages: receivedMsg,
  };
}

export default useTwitchOauth;
