// 获取URL参数
const urlParams = new URLSearchParams(window.location.search);
const receiverId = urlParams.get('user_id');
let receiverName = '';

// 页面加载时检查登录状态并加载聊天记录
document.addEventListener('DOMContentLoaded', async function() {
    if (!window.api.isLoggedIn()) {
        window.location.href = '/';
        return;
    }

    if (!receiverId) {
        alert('无效的聊天对象');
        window.location.href = '/chat-list.html';
        return;
    }

    await loadMessages();
    await loadReceiverInfo();
});

// 加载接收者信息
async function loadReceiverInfo() {
    try {
        const response = await fetch(`http://localhost:8000/api/users/${receiverId}`, {
            headers: {
                'Authorization': `Bearer ${window.api.getToken()}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            receiverName = user.username;
            document.getElementById('chatUserName').textContent = user.username;
        }
    } catch (error) {
        console.error('加载用户信息失败：', error);
    }
}

// 加载聊天记录
async function loadMessages() {
    try {
        const messages = await window.api.getMessages(receiverId);
        displayMessages(messages);
    } catch (error) {
        alert('加载聊天记录失败：' + error.message);
    }
}

// 显示消息
function displayMessages(messages) {
    const chatMessagesDiv = document.getElementById('chatMessages');
    chatMessagesDiv.innerHTML = '';

    if (messages.length === 0) {
        chatMessagesDiv.innerHTML = '<div style="text-align: center; color: #999; margin-top: 20px;">暂无消息，开始聊天吧！</div>';
        return;
    }

    messages.forEach(message => {
        const messageBubble = document.createElement('div');
        messageBubble.className = `message-bubble ${message.sender_id == getCurrentUserId() ? 'sent' : 'received'}`;

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = message.content;

        messageBubble.appendChild(messageText);
        chatMessagesDiv.appendChild(messageBubble);
    });

    // 滚动到底部
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

// 发送消息
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();

    if (!content) return;

    try {
        await window.api.sendMessage(receiverId, content);
        messageInput.value = '';
        await loadMessages();
    } catch (error) {
        alert('发送消息失败：' + error.message);
    }
}

// 处理回车键
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// 获取当前用户ID
function getCurrentUserId() {
    return window.api.getUserId();
}
