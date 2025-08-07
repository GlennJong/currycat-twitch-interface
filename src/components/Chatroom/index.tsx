import { useEffect, useState } from "react";
import useTwitchOauth from "./hooks/useTwitchOauth";
import { twitchMessageConverter } from "./utils/twitchMessageConverter";

function Chatroom() {
  const [ isSyncisSyncing, setIsSyncing ] = useState<boolean>(false);
  const { messages, twitchState, startOauthConnect, startWebsocket } = useTwitchOauth();

  return (
    <div>
      {twitchState ? (
        <div style={{ textAlign: 'center' }}>
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
          { isSyncisSyncing &&
            <div style={{
              marginTop: '12px',
              padding: '12px',
              width: '50vw',
              height: '50vh',
              background: '#482d7a',
              fontSize: '12px',
              overflowY: 'auto'
            }}>
              { messages?.map(_message =>
                <div style={{ textAlign: 'left', color: '#fff' }} key={_message.event.message_id}>
                  <div dangerouslySetInnerHTML={{ __html: twitchMessageConverter(_message.event, 'unknown') }} />
                  {/* { _message.event.chatter_user_name }({ _message.event.chatter_user_login }): { _message.event.message.text } */}
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
        <div style={{ textAlign: 'center' }}>
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
