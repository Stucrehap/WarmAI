// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    // 如果已登录，跳转到主页
    if (window.api.isLoggedIn()) {
        window.location.href = '/home.html';
        return;
    }

    initializeAuth();
});

function initializeAuth() {
    // 切换登录/注册标签页
    window.switchTab = function(tab) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const tabBtns = document.querySelectorAll('.tab-btn');

        tabBtns.forEach(btn => btn.classList.remove('active'));

        if (tab === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            tabBtns[0].classList.add('active');
        } else {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
            tabBtns[1].classList.add('active');
        }
    };

    // 登录表单提交
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await window.api.login({ username, password });
            // 获取用户信息以存储ID
            const user = await window.api.getCurrentUser();
            window.api.setUserId(user.id);
            showMessage('登录成功！正在跳转...', 'success');
            setTimeout(() => {
                window.location.href = '/home.html';
            }, 1000);
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });

    // 注册表单提交
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const userData = {
            username: document.getElementById('registerUsername').value,
            email: document.getElementById('registerEmail').value,
            password: document.getElementById('registerPassword').value,
            student_id: document.getElementById('studentId').value || null,
            university: document.getElementById('university').value || null,
            major: document.getElementById('major').value || null,
            grade: document.getElementById('grade').value || null,
            bio: '',
            interests: []
        };

        try {
            await window.api.register(userData);
            showMessage('注册成功！请登录', 'success');
            switchTab('login');
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}
