const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 8000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 内存数据库（用于演示）
let users = [];
let matches = [];
let messages = [];
let currentUserId = 1;

// 辅助函数
function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30m' });
}

function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ detail: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ detail: 'Invalid token' });
    }
}

// 注册接口
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, student_id, university, major, grade, bio, interests } = req.body;

    // 检查用户是否存在
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ detail: 'Username already registered' });
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ detail: 'Email already registered' });
    }

    // 创建新用户
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
        id: currentUserId++,
        username,
        email,
        password_hash: hashedPassword,
        student_id: student_id || null,
        university: university || null,
        major: major || null,
        grade: grade || null,
        bio: bio || '',
        interests: interests || [],
        created_at: new Date()
    };

    users.push(newUser);

    // 返回用户信息（不包含密码）
    const { password_hash, ...userResponse } = newUser;
    res.json(userResponse);
});

// 登录接口
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ detail: 'Incorrect username or password' });
    }

    const token = generateToken(user.id);
    res.json({ access_token: token, token_type: 'bearer' });
});

// 获取当前用户信息
app.get('/api/auth/me', verifyToken, (req, res) => {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
        return res.status(404).json({ detail: 'User not found' });
    }

    const { password_hash, ...userResponse } = user;
    res.json(userResponse);
});

// 获取用户资料
app.get('/api/users/profile', verifyToken, (req, res) => {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
        return res.status(404).json({ detail: 'User not found' });
    }

    const { password_hash, ...userResponse } = user;
    res.json(userResponse);
});

// 更新用户资料
app.put('/api/users/profile', verifyToken, (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.userId);
    if (userIndex === -1) {
        return res.status(404).json({ detail: 'User not found' });
    }

    const { username, email, student_id, university, major, grade, bio, interests } = req.body;
    users[userIndex] = {
        ...users[userIndex],
        username: username || users[userIndex].username,
        email: email || users[userIndex].email,
        student_id: student_id !== undefined ? student_id : users[userIndex].student_id,
        university: university !== undefined ? university : users[userIndex].university,
        major: major !== undefined ? major : users[userIndex].major,
        grade: grade !== undefined ? grade : users[userIndex].grade,
        bio: bio !== undefined ? bio : users[userIndex].bio,
        interests: interests || users[userIndex].interests
    };

    const { password_hash, ...userResponse } = users[userIndex];
    res.json(userResponse);
});

// 获取指定用户信息
app.get('/api/users/:userId', verifyToken, (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ detail: 'User not found' });
    }

    const { password_hash, ...userResponse } = user;
    res.json(userResponse);
});

// 获取推荐列表
app.get('/api/matching/recommendations', verifyToken, (req, res) => {
    const currentUser = users.find(u => u.id === req.userId);
    if (!currentUser) {
        return res.status(404).json({ detail: 'User not found' });
    }

    // 获取已经交互过的用户ID
    const interactedUserIds = matches
        .filter(m => m.user_id_1 === req.userId)
        .map(m => m.user_id_2);

    // 过滤出未交互的用户
    const recommendations = users.filter(u =>
        u.id !== req.userId && !interactedUserIds.includes(u.id)
    );

    res.json(recommendations);
});

// 喜欢用户
app.post('/api/matching/like/:userId', verifyToken, (req, res) => {
    const targetUserId = parseInt(req.params.userId);

    // 检查目标用户是否存在
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) {
        return res.status(404).json({ detail: 'User not found' });
    }

    // 检查是否已经交互过
    const existingMatch = matches.find(m =>
        (m.user_id_1 === req.userId && m.user_id_2 === targetUserId) ||
        (m.user_id_1 === targetUserId && m.user_id_2 === req.userId)
    );

    if (existingMatch) {
        return res.status(400).json({ detail: 'Already interacted with this user' });
    }

    // 计算匹配分数（简化版）
    let matchScore = 0.5; // 默认分数

    // 同一学校
    if (users.find(u => u.id === req.userId).university === targetUser.university) {
        matchScore += 0.2;
    }

    // 相同专业
    if (users.find(u => u.id === req.userId).major === targetUser.major) {
        matchScore += 0.2;
    }

    // 共同兴趣
    const currentUser = users.find(u => u.id === req.userId);
    if (currentUser.interests && targetUser.interests) {
        const commonInterests = currentUser.interests.filter(i =>
            targetUser.interests.includes(i)
        );
        matchScore += commonInterests.length * 0.05;
    }

    matchScore = Math.min(matchScore, 1.0);

    // 创建匹配记录
    const newMatch = {
        id: matches.length + 1,
        user_id_1: req.userId,
        user_id_2: targetUserId,
        match_score: matchScore,
        status: 'pending',
        created_at: new Date()
    };

    matches.push(newMatch);

    res.json({ message: 'Like recorded', match_score: matchScore });
});

// 跳过用户
app.post('/api/matching/pass/:userId', verifyToken, (req, res) => {
    const targetUserId = parseInt(req.params.userId);

    // 检查目标用户是否存在
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) {
        return res.status(404).json({ detail: 'User not found' });
    }

    // 创建拒绝记录
    const newMatch = {
        id: matches.length + 1,
        user_id_1: req.userId,
        user_id_2: targetUserId,
        match_score: 0.0,
        status: 'rejected',
        created_at: new Date()
    };

    matches.push(newMatch);

    res.json({ message: 'Pass recorded' });
});

// 获取匹配成功列表
app.get('/api/matching/matches', verifyToken, (req, res) => {
    const userMatches = matches.filter(m =>
        (m.user_id_1 === req.userId || m.user_id_2 === req.userId) &&
        m.status === 'accepted'
    );

    const result = userMatches.map(m => {
        const matchedUserId = m.user_id_1 === req.userId ? m.user_id_2 : m.user_id_1;
        const matchedUser = users.find(u => u.id === matchedUserId);
        const { password_hash, ...userResponse } = matchedUser;

        return {
            id: m.id,
            user_id_1: m.user_id_1,
            user_id_2: m.user_id_2,
            match_score: m.match_score,
            status: m.status,
            created_at: m.created_at,
            matched_user: userResponse
        };
    });

    res.json(result);
});

// 获取聊天记录
app.get('/api/chat/messages/:userId', verifyToken, (req, res) => {
    const otherUserId = parseInt(req.params.userId);

    const chatMessages = messages.filter(m =>
        (m.sender_id === req.userId && m.receiver_id === otherUserId) ||
        (m.sender_id === otherUserId && m.receiver_id === req.userId)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json(chatMessages);
});

// 发送消息
app.post('/api/chat/messages', verifyToken, (req, res) => {
    const { receiver_id, content } = req.body;

    const newMessage = {
        id: messages.length + 1,
        sender_id: req.userId,
        receiver_id,
        content,
        timestamp: new Date(),
        is_read: false
    };

    messages.push(newMessage);

    res.json(newMessage);
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to AI Campus Dating System (Node.js version)',
        version: '1.0.0',
        status: 'running'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 AI Campus Dating System (Node.js) is running on http://localhost:${PORT}`);
    console.log(`📱 Frontend can be accessed at: file://${__dirname}/../frontend/index.html`);
});
