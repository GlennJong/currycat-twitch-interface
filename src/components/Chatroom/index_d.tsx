import { IframeHTMLAttributes, useEffect, useRef } from 'react'
import './style.css'

const Chatroom = () => {

  const rootRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = document.createElement('iframe');
    if (iframe) {
      iframe.setAttribute('src', 'https://nightdev.com/hosted/obschat?theme=dark&channel=curry_cat&fade=false&bot_activity=false&prevent_clipping=false');
      iframe.onload = function() {
        // Get a reference to the iframe's document
        const iframeDoc = iframe.contentDocument || iframe?.contentWindow?.document;
        
        if (!iframeDoc) return;
        
        const style = iframeDoc.createElement('style');
        // Add your CSS rules

        const body = iframeDoc.querySelector('body');
        
        if (!body) return;
        body.style.backgroundColor = '#f0f8ff';
        body.style.fontFamily = 'BoutiqueBitmap, sans-serif !important';

        // Append the style element to the head of the iframe's document
        iframeDoc.head.appendChild(style);
      };
      rootRef.current?.appendChild(iframe);
    }
  }, [])

  // useEffect(() => {
  //       // 監聽來自父網頁的訊息
  //       window.addEventListener('message', (event) => {
  //           // 這是安全性的關鍵：檢查訊息的來源，確保它是從你信任的父網頁發出的。
  //           if (event.origin !== 'http://localhost:5500') {
  //               // 如果來源不正確，忽略此訊息。
  //               // 請將 'http://localhost:5500' 替換為你的父網頁實際執行的伺服器位址。
  //               console.error('收到來自不正確來源的訊息：', event.origin);
  //               return;
  //           }

  //           console.log('從父網頁接收到訊息：', event.data);

  //           // 檢查訊息的類型，並執行相應的動作
  //           if (event.data.type === 'change-background') {
  //               document.body.style.backgroundColor = event.data.color;
  //           }

  //           // 執行完動作後，可以選擇性地回覆父網頁
  //           window.parent.postMessage(
  //               { status: 'success', message: '背景顏色已成功改變' },
  //               event.origin
  //           );
  //       });
  // }, [])
  
  return (
    <div className="chatroom" ref={rootRef}>
      {/* <iframe
        ref={iframeRef}
        src="https://nightdev.com/hosted/obschat?theme=dark&channel=curry_cat&fade=false&bot_activity=false&prevent_clipping=false"
      /> */}
    </div>
  )
}

export default Chatroom