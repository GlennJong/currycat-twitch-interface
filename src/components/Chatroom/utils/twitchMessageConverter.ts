// 徽章的型別保持不變
interface TwitchBadge {
    set_id: string;
    id: string;
    info: string;
}

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
interface TwitchMessage {
    text: string;
    fragments: TwitchFragment[];
}

// 完整的 Event 物件型別
interface TwitchEvent {
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    chatter_user_id: string;
    chatter_user_login: string;
    chatter_user_name: string;
    message: TwitchMessage;
    color: string;
    badges: TwitchBadge[];
    source_badges: TwitchBadge[] | null;
    // 其他欄位...
}

// 完整的 WebSocket Payload 型別
interface TwitchWebSocketPayload {
    subscription: any; // 簡化處理
    event: TwitchEvent;
}


/**
 * 轉換 Twitch 聊天訊息 Event 為 HTML 字串。
 *
 * @param {TwitchEvent} event - 包含聊天訊息所有細節的 Event 物件。
 * @returns {string} - 包含完整樣式的聊天訊息 HTML 字串。
 */
export const twitchMessageConverter = (event: TwitchEvent): string => {
    // 1. 處理使用者名稱和顏色
    // 使用 chatter_user_name 作為顯示名稱
    const userDisplayName: string = event.chatter_user_name;
    const userColor: string = event.color || '#FFFFFF'; // 如果沒有顏色，預設為白色
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
    const fragments: TwitchFragment[] = event.message.fragments || [];

    fragments.forEach(fragment => {
        if (fragment.type === 'text') {
            messageContentHtml += fragment.text;
        } else if (fragment.type === 'emote' && fragment.emote) {
            const emoteId: string = fragment.emote.id;
            const emoteAlt: string = fragment.text;
            // 這裡的版本可以根據你的需求調整
            const emoteUrl: string = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0`;
            messageContentHtml += `<img src="${emoteUrl}" alt="${emoteAlt}" class="chat-emote" />`;
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