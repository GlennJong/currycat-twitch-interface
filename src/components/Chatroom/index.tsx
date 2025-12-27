import { useEffect, useRef, useState } from "react";
import useTwitchOauth from "./hooks/useTwitchOauth";
import { twitchMessageConverter } from "./utils/twitchMessageConverter";
import { SCROLL_BOTTOM_DELAY_MS } from "./constants";
import './style.css';

function Chatroom({ onInput }: { onInput: (msg: string) => void }) {
  const [ isSyncisSyncing, setIsSyncing ] = useState<boolean>(false);
  const [ showManualInput, setShowManualInput ] = useState<boolean>(false);
  const [ manualAccessToken, setManualAccessToken ] = useState<string>('');
  const [ manualUserId, setManualUserId ] = useState<string>('');
  const [ manualUserName, setManualUserName ] = useState<string>('');
  
  const { messages, twitchState, startOauthConnect, startWebsocket, setManualTwitchState, clearManualTwitchState } = useTwitchOauth();
  const scrollRef = useRef<HTMLDivElement>(null); // 新增滾動容器的 ref
  const scrollTimerRef = useRef<number | null>(null); // 延遲滾動的計時器

  useEffect(() => {
    // 取消之前的計時器避免重複觸發
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }

    // 先將文字輸入回傳（不需延遲）
    onInput(messages?.[messages.length - 1]?.event?.message.text || '');

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {twitchState ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflowY: 'auto'}}>
          <div style={{ textAlign: 'center', flexShrink: 0, marginBottom: '8px' }}>
            { !isSyncisSyncing &&
              <div style={{ 
                fontSize: '10px', 
                color: '#aaa', 
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 8px'
              }}>
                <span>User: {twitchState.display_name} ({twitchState.id})</span>
                <button
                  onClick={clearManualTwitchState}
                  style={{
                    background: 'none',
                    border: '1px solid #666',
                    color: '#aaa',
                    fontSize: '8px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title="Clear Twitch State"
                >
                  Clear
                </button>
              </div>
            }
            { !isSyncisSyncing &&
              <button
                className="button"
                disabled={isSyncisSyncing}
                onClick={() => {
                  startWebsocket({
                    onMessage: (msg) => console.log(JSON.stringify(msg))
                  });
                  setIsSyncing(true);
                }}
              >
                {isSyncisSyncing ? 'Syncing' : 'Sync Chat Message'}
              </button>
            }
          </div>
          { isSyncisSyncing &&
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                height: '100%',
                overflowY: 'auto'
                // overflowY: 'hidden', // prevent visible scroll bar
              }}
            >
              { messages?.map(_message => 
                <div style={{ textAlign: 'left', color: '#fff' }} key={_message.event.message_id}>
                  <div dangerouslySetInnerHTML={{ __html: twitchMessageConverter(_message.event) }} />
                </div>
                )
              ||
                <div style={{ textAlign: 'left', color: '#fff', opacity: '.3' }}>
                  Send message in stream chat room.
                </div>
              }
            </div>
          }
        </div>
      ) : (
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            marginBottom: '12px',
            fontSize: '12px',
          }}>
            Before connect to your TWITCH APP, please fill <b>client_id</b> and <b>redirect_uri</b> in .env file.
          </div>
          <button 
            className="button" 
            onClick={() => startOauthConnect()}
            style={{ marginBottom: '10px' }}
          >
            Connect by oauth
          </button>
          
          <div style={{ margin: '10px 0', color: '#888', fontSize: '12px' }}>
            OR
          </div>
          
          
          {showManualInput && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              // maxWidth: '300px', 
              // margin: '0 auto',
              // padding: '15px',
            }}>
              <input
                type="text"
                placeholder="Access Token"
                value={manualAccessToken}
                onChange={(e) => setManualAccessToken(e.target.value)}
                style={{
                  fontSize: '12px'
                }}
              />
              <input
                type="text"
                placeholder="User ID"
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                style={{
                  fontSize: '12px'
                }}
              />
              <input
                type="text"
                placeholder="User Name"
                value={manualUserName}
                onChange={(e) => setManualUserName(e.target.value)}
                style={{
                  fontSize: '12px'
                }}
              />
            </div>
          )}
          <div style={{ marginTop: '16px'}}>
            <button 
              className="button" 
              onClick={() => setShowManualInput(!showManualInput)}
            >
              {showManualInput ? 'Manual' : 'Twitch State'}
            </button>
            {showManualInput && 
              <button
                className="button"
                onClick={() => {
                  if (manualAccessToken && manualUserId && manualUserName) {
                    setManualTwitchState({
                      access_token: manualAccessToken,
                      id: manualUserId,
                      display_name: manualUserName,
                      login: manualUserName.toLowerCase(),
                      scope: 'chat:read',
                      token_type: 'bearer',
                      broadcaster_type: '',
                      created_at: new Date().toISOString(),
                      description: '',
                      offline_image_url: '',
                      profile_image_url: '',
                      type: '',
                      view_count: 0
                    });
                    setShowManualInput(false);
                    setManualAccessToken('');
                    setManualUserId('');
                    setManualUserName('');
                  }
                }}
                disabled={!manualAccessToken || !manualUserId || !manualUserName}
              >
                Save
              </button>
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatroom;
