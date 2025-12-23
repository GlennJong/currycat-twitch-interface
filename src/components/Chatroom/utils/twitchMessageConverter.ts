// 徽章的型別保持不變
// interface TwitchBadge {
//     set_id: string;
//     id: string;
//     info: string;
// }

// 表情符號的型別保持不變
interface TwitchEmote {
    id: string;
    emote_set_id: string;
    owner_id: string;
    format: string[];
}

// 訊息片段的型別保持不變
interface TwitchFragment {
    type: 'text' | 'emote' | 'mention' | 'cheermote';
    text: string;
    cheermote: any | null;
    emote: TwitchEmote | null;
    mention: any | null;
}

// 訊息內容的型別保持不變
// interface TwitchMessage {
//     text: string;
//     fragments: TwitchFragment[];
// }

// 完整的 Event 物件型別
// interface TwitchEvent {
//     broadcaster_user_id: string;
//     broadcaster_user_login: string;
//     broadcaster_user_name: string;
//     chatter_user_id: string;
//     chatter_user_login: string;
//     chatter_user_name: string;
//     message: TwitchMessage;
//     color: string;
//     badges: TwitchBadge[];
//     source_badges: TwitchBadge[] | null;
//     // 其他欄位...
// }

// 完整的 WebSocket Payload 型別
// interface TwitchWebSocketPayload {
//     subscription: any; // 簡化處理
//     event: TwitchEvent;
// }


/**
 * 轉換 Twitch 聊天訊息 Event 為 HTML 字串。
 *
 * @param {TwitchEvent} event - 包含聊天訊息所有細節的 Event 物件。
 * @returns {string} - 包含完整樣式的聊天訊息 HTML 字串。
 */
export const twitchMessageConverter = (event: any): string => {
    // 安全工具：避免 XSS / 注入
    const escapeHtml = (input: string): string =>
        input.replace(/[&<>":'`]/g, (ch) => {
            switch (ch) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                case '`': return '&#96;';
                default: return ch;
            }
        });

    const sanitizeColor = (color?: string): string => {
        if (!color) return '#FFFFFF';
        const c = color.trim();
        // 只接受 #RGB 或 #RRGGBB（大小寫皆可）
        return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c) ? c : '#FFFFFF';
    };

    const isSafeId = (id: string | undefined | null): id is string =>
        !!id && /^[A-Za-z0-9]+$/.test(id);

    // 1. 處理使用者名稱和顏色
    // 使用 chatter_user_name 作為顯示名稱
    const rawUserDisplayName: string = String(event.chatter_user_name ?? '');
    const userDisplayName: string = escapeHtml(rawUserDisplayName);
    const userColor: string = sanitizeColor(event.color); // 安全顏色
    const usernameHtml: string = `<span class="chat-username" style="color: ${userColor};">${userDisplayName}：</span>`;

    // 2. 處理徽章 (Badges)
    // let badgesHtml: string = '';
    // const badges: TwitchBadge[] = event.badges || [];
    
    // badges.forEach(badge => {
    //     const badgeUrl: string = `https://static-cdn.jtvnw.net/badges/v1/${badge.set_id}/${badge.id}/1`;
    //     badgesHtml += `<img src="${badgeUrl}" class="chat-badge" alt="${badge.set_id}" />`;
    // });

    // 3. 處理訊息內容 (包含表情符號)
    let messageContentHtml: string = '';
    const fragments: TwitchFragment[] = (event && event.message && Array.isArray(event.message.fragments))
        ? event.message.fragments
        : [];

    fragments.forEach(fragment => {
        if (fragment.type === 'text') {
            // escape text fragment to prevent injection
            messageContentHtml += escapeHtml(String(fragment.text ?? ''));
        } else if (fragment.type === 'emote' && fragment.emote) {
            const emoteIdRaw: string | undefined = fragment.emote.id;
            if (!isSafeId(emoteIdRaw)) {
                // 若 emoteId 不符合白名單，忽略該片段
                return;
            }
            const emoteId: string = emoteIdRaw;
            const emoteAlt: string = escapeHtml(String(fragment.text ?? ''));
            // 只拼接受控的 CDN URL 與白名單過的 ID
            const emoteUrl: string = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0`;
            messageContentHtml += `<img src="${emoteUrl}" alt="${emoteAlt}" class="chat-emote" />`;
        } else if (fragment.type === 'mention' || fragment.type === 'cheermote') {
            // 明確處理非 text/emote 類型：以純文字顯示，避免非預期的結構注入
            messageContentHtml += escapeHtml(String(fragment.text ?? ''));
        }
    });

    // 4. 將所有部分組合起來
    return `
        <div class="chat-line">
            ${usernameHtml}
            <span class="chat-message">${messageContentHtml}</span>
        </div>
    `;
};