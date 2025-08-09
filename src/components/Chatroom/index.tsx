import { useEffect, useRef, useState } from "react";
import useTwitchOauth from "./hooks/useTwitchOauth";
import { twitchMessageConverter } from "./utils/twitchMessageConverter";
import './style.css';

function Chatroom() {
  const [ isSyncisSyncing, setIsSyncing ] = useState<boolean>(false);
  const { messages, twitchState, startOauthConnect, startWebsocket } = useTwitchOauth();
  const scrollRef = useRef<HTMLDivElement>(null); // 新增滾動容器的 ref

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight; // 將卷軸拉到最底部
    }
  }, [messages]); // 當 messages 更新時觸發

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {twitchState ? (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
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
              ref={scrollRef} // 將滾動容器綁定到 ref
              style={{
                flex: 1,
                overflowY: 'hidden', // prevent visible scroll bar
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
            color: '#fff',
            fontSize: '12px',
            opacity: .5
          }}>
            Before connect to your TWITCH APP, please fill <b>client_id</b> and <b>redirect_uri</b> in .env file.
          </div>
          <button className="button" onClick={() => startOauthConnect()}>Connect by oauth</button>
        </div>
      )}
    </div>
  );
}

export default Chatroom;
