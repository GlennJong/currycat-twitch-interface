import { useEffect, useRef } from "react";
import useTwitchOauth from "./hooks/useTwitchOauth";
import { twitchMessageConverter } from "./utils/twitchMessageConverter";
import { PixelWindow } from '@glennjong/pixel-window';
import { SCROLL_BOTTOM_DELAY_MS } from "./constants";
import './style.css';
import { Color } from "@/constants";

// const MessageItem = ({message}: {message: string}) => {
//   return (
//       <PixelWindow
//         pixel={32}
//         stroke={Color.BlackDark}
//         frame={Color.WhiteLight}
//         background={Color.WhiteLight}
//         style={{
//           position: 'relative',
//           height: '320px'
//         }}
//       >
//         { message }
//       </PixelWindow>
//   )
// }

function Chatroom({ onInput }: { onInput: (msg: string) => void }) {

  const { messages, badgeMap, twitchState, startOauthConnect, startWebsocket, clearTwitchState, isSyncing } = useTwitchOauth();
  const scrollRef = useRef<HTMLDivElement>(null); // 新增滾動容器的 ref
  const scrollTimerRef = useRef<number | null>(null); // 延遲滾動的計時器

  useEffect(() => {
    // 取消之前的計時器避免重複觸發
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }

    // 先將文字輸入回傳（不需延遲）
    const last = messages?.[messages.length - 1];
    const lastText = last?.type === 'chat'
      ? last.event?.message?.text || ''
      : last?.event?.user_input || '';
    onInput(lastText);

    // 延遲滾動至底部，給圖像（表情符號）緩衝載入時間
    scrollTimerRef.current = window.setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight; // 將卷軸拉到最底部
      }
      scrollTimerRef.current = null;
    }, SCROLL_BOTTOM_DELAY_MS);

    // 清理：依賴變更或卸載時中止計時器
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
    };
  }, [messages, onInput]); // 當 messages 更新時觸發

  return (
    <div className="chatroom">
      {twitchState ? (
        <div className="chatroom-inner">
          <div className="chatroom-topbar">
            { !isSyncing &&
              <div className="chatroom-topbar-info">
                <span>User: {twitchState.display_name} ({twitchState.id})</span>
                <button
                  onClick={clearTwitchState}
                  className="chatroom-clear-button"
                  title="Clear Twitch State"
                >
                  Clear
                </button>
              </div>
            }
            { !isSyncing &&
              <button
                className="button"
                disabled={isSyncing}
                onClick={() => {
                  startWebsocket({
                    // onMessage: (msg) => console.log(JSON.stringify(msg))
                  });
                }}
              >
                {isSyncing ? 'Syncing' : 'Sync Chat Message'}
              </button>
            }
          </div>
          { isSyncing &&
            <div
              ref={scrollRef}
              className="chatroom-messages"
            >
              { messages?.map(_message =>
                <div className="chat-message-wrapper" key={_message.id}>
                  <PixelWindow
                    pixel={32}
                    stroke={Color.BlackDark}
                    frame={Color.WhiteLight}
                    background={Color.WhiteLight}
                    style={{
                      position: 'relative',
                      textAlign: 'left',
                      color: '#fff'
                    }}
                  >
                    {/* { message } */}
                      <div dangerouslySetInnerHTML={{ __html: twitchMessageConverter(_message, badgeMap) }} />
                  </PixelWindow>
                  </div>
                  )
              ||
                  <div className="chatroom-empty">
                    Send message in stream chat room.
                  </div>
              }
            </div>
          }
        </div>
      ) : (
          <div className="chatroom-connect-center">
            <div className="chatroom-empty-note">
            Before connect to your TWITCH APP, please fill <b>client_id</b> and <b>redirect_uri</b> in .env file.
          </div>
          <div className="chatroom-connect-button">
            <button 
              className="button" 
              onClick={() => startOauthConnect()}
            >
            Connect by oauth
          </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatroom;
