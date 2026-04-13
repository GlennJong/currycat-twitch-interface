import { BadgeMap, TwitchChatEntry } from "../hooks/types";

interface TwitchEmote {
    id: string;
    emote_set_id: string;
    owner_id: string;
    format: string[];
}

interface TwitchFragment {
    type: 'text' | 'emote' | 'mention' | 'cheermote';
    text: string;
    cheermote: any | null;
    emote: TwitchEmote | null;
    mention: any | null;
}

/** 跳脫 HTML 特殊字元，防止 XSS 注入 */
const escapeHtml = (input: unknown): string =>
    String(input ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

/** 僅允許合法的 CSS 顏色值（hex / rgb / rgba），防止樣式注入 */
const sanitizeColor = (color: unknown): string => {
    const s = String(color ?? '').trim();
    if (
        /^#[0-9a-fA-F]{3,8}$/.test(s) ||
        /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(s) ||
        /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(s)
    ) {
        return s;
    }
    return '#FFFFFF';
};

/**
 * 確保顏色在深色背板上可辨識：若感知亮度太低則向白色提亮。
 * 僅處理 6 位 hex 顏色（#rrggbb）。
 */
const ensureReadableOnDark = (color: string): string => {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return color;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    // ITU-R BT.601 perceived luminance (0–1)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (lum >= 0.25) return color;
    // 亮度不足：混合 60% 白色提亮
    const blend = (c: number) =>
        Math.min(255, Math.round(c + (255 - c) * 0.6))
            .toString(16).padStart(2, '0');
    return `#${blend(r)}${blend(g)}${blend(b)}`;
};

// ---------------------------------------------------------------------------
// Chat message renderer
// ---------------------------------------------------------------------------
const renderChatMessage = (event: any, badgeMap: BadgeMap): string => {
    const rawColor = sanitizeColor(event.color);
    const userColor = ensureReadableOnDark(rawColor);
    const userDisplayName = escapeHtml(
        event.chatter_user_name || event.chatter_user_login || 'Unknown'
    );

    // Badges — look up image URL from the fetched badge map
    let badgesHtml = '';
    const badges: { set_id: string; id: string; info: string }[] = event.badges || [];
    badges.forEach(badge => {
        const key = `${badge.set_id}/${badge.id}`;
        const imgUrl = badgeMap[key];
        if (imgUrl) {
            const alt = escapeHtml(badge.set_id);
            badgesHtml += `<img src="${escapeHtml(imgUrl)}" class="chat-badge" alt="${alt}" />`;
        }
    });

    // Channel-points redemption indicator on this chat message
    let rewardHtml = '';
    if (event.channel_points_custom_reward_id) {
        rewardHtml = `<span class="chat-reward" title="Channel Points Redemption">&#127873;</span>`;
    } else if (event.message_type === 'channel_points_highlighted') {
        rewardHtml = `<span class="chat-reward chat-reward--highlight" title="Highlighted Message">&#11088;</span>`;
    }

    // Message fragments
    let messageContentHtml = '';
    const fragments: TwitchFragment[] = event.message?.fragments || [];
    fragments.forEach(fragment => {
        if (fragment.type === 'text') {
            messageContentHtml += escapeHtml(fragment.text ?? '');
        } else if (fragment.type === 'emote' && fragment.emote) {
            const emoteId = encodeURIComponent(fragment.emote.id);
            const emoteAlt = escapeHtml(fragment.text ?? '');
            const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/2.0`;
            messageContentHtml += `<img src="${emoteUrl}" alt="${emoteAlt}" class="chat-emote" />`;
        } else if (fragment.type === 'mention') {
            messageContentHtml += `<span class="chat-mention">${escapeHtml(fragment.text ?? '')}</span>`;
        } else if (fragment.type === 'cheermote') {
            messageContentHtml += escapeHtml(fragment.text ?? '');
        }
    });

    return `
        <div class="chat-line">
            <div class="chat-header">
                ${badgesHtml}${rewardHtml}
                <span class="chat-username" style="color: ${userColor};">${userDisplayName}：</span>
            </div>
            <span class="chat-message">${messageContentHtml}</span>
        </div>
    `;
};

// ---------------------------------------------------------------------------
// Channel-points redemption renderer (no chat message attached)
// ---------------------------------------------------------------------------
const renderRedemption = (event: any): string => {
    const userName = escapeHtml(event.user_name || event.user_login || 'Unknown');
    const rewardTitle = escapeHtml(event.reward?.title ?? 'Reward');
    const cost = Number(event.reward?.cost ?? 0).toLocaleString();
    const userInput = event.user_input
        ? `<span class="chat-message">${escapeHtml(event.user_input)}</span>`
        : '';

    return `
        <div class="chat-line chat-line--redemption">
            <div class="chat-header">
                <span class="chat-reward" title="Channel Points Redemption">&#127873;</span>
                <span class="chat-username chat-username--redemption">${userName}</span>
                <span class="chat-reward-label">兌換了 <b>${rewardTitle}</b>（${cost} 點）</span>
            </div>
            ${userInput}
        </div>
    `;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 將 TwitchChatEntry 轉換為聊天室 HTML 字串。
 */
export const twitchMessageConverter = (
    entry: TwitchChatEntry,
    badgeMap: BadgeMap = {},
): string => {
    if (entry.type === 'redemption') {
        return renderRedemption(entry.event);
    }
    return renderChatMessage(entry.event, badgeMap);
};
