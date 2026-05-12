// API配置
const API_BASE_URL = 'http://localhost:8000/api';

// 获取存储的token
function getToken() {
    return localStorage.getItem('access_token');
}

// 设置token
function setToken(token) {
    localStorage.setItem('access_token', token);
}

// 清除token
function clearToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
}

// 检查是否已登录
function isLoggedIn() {
    return getToken() !== null;
}

// 设置用户ID
function setUserId(userId) {
    localStorage.setItem('user_id', userId);
}

// 获取用户ID
function getUserId() {
    return localStorage.getItem('user_id');
}

// API请求封装
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && {'Authorization': `Bearer ${token}`})
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    if (mergedOptions.body && typeof mergedOptions.body === 'object') {
        mergedOptions.body = JSON.stringify(mergedOptions.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);

    if (response.status === 401) {
        clearToken();
        window.location.href = '/';
        return null;
    }

    return response;
}

// 用户注册
async function register(userData) {
    const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: userData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '注册失败');
    }

    return response.json();
}

// 用户登录
async function login(credentials) {
    const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: credentials
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '登录失败');
    }

    const data = await response.json();
    setToken(data.access_token);
    return data;
}

// 获取当前用户信息
async function getCurrentUser() {
    const response = await apiRequest('/auth/me');

    if (!response.ok) {
        throw new Error('获取用户信息失败');
    }

    return response.json();
}

// 获取推荐用户列表
async function getRecommendations(skip = 0, limit = 10) {
    const response = await apiRequest(`/matching/recommendations?skip=${skip}&limit=${limit}`);

    if (!response.ok) {
        throw new Error('获取推荐列表失败');
    }

    return response.json();
}

// 喜欢用户
async function likeUser(userId) {
    const response = await apiRequest(`/matching/like/${userId}`, {
        method: 'POST'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '操作失败');
    }

    return response.json();
}

// 跳过用户
async function passUser(userId) {
    const response = await apiRequest(`/matching/pass/${userId}`, {
        method: 'POST'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '操作失败');
    }

    return response.json();
}

// 获取匹配成功列表
async function getMatches() {
    const response = await apiRequest('/matching/matches');

    if (!response.ok) {
        throw new Error('获取匹配列表失败');
    }

    return response.json();
}

// 获取聊天记录
async function getMessages(userId) {
    const response = await apiRequest(`/chat/messages/${userId}`);

    if (!response.ok) {
        throw new Error('获取聊天记录失败');
    }

    return response.json();
}

// 发送消息
async function sendMessage(receiverId, content) {
    const response = await apiRequest('/chat/messages', {
        method: 'POST',
        body: {
            receiver_id: receiverId,
            content: content
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '发送消息失败');
    }

    return response.json();
}

// 导出函数
window.api = {
    register,
    login,
    getCurrentUser,
    getRecommendations,
    likeUser,
    passUser,
    getMatches,
    getMessages,
    sendMessage,
    getToken,
    setToken,
    clearToken,
    isLoggedIn
};
