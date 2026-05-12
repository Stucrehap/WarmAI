// 当前推荐用户列表
let currentUserIndex = 0;
let recommendedUsers = [];

// 页面加载时检查登录状态并加载推荐用户
document.addEventListener('DOMContentLoaded', async function() {
    if (!window.api.isLoggedIn()) {
        window.location.href = '/';
        return;
    }

    await loadRecommendations();
});

// 加载推荐用户
async function loadRecommendations() {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('userCard').style.display = 'none';
        document.getElementById('noMoreUsers').style.display = 'none';

        recommendedUsers = await window.api.getRecommendations();

        if (recommendedUsers.length === 0) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('noMoreUsers').style.display = 'block';
            return;
        }

        currentUserIndex = 0;
        displayCurrentUser();
    } catch (error) {
        alert('加载推荐用户失败：' + error.message);
        document.getElementById('loading').style.display = 'none';
    }
}

// 显示当前用户
function displayCurrentUser() {
    if (currentUserIndex >= recommendedUsers.length) {
        document.getElementById('userCard').style.display = 'none';
        document.getElementById('noMoreUsers').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
        return;
    }

    const user = recommendedUsers[currentUserIndex];
    document.getElementById('userName').textContent = user.username;
    document.getElementById('userUniversity').textContent = user.university || '未填写学校';
    document.getElementById('userMajor').textContent = user.major || '未填写专业';
    document.getElementById('userGrade').textContent = user.grade || '未填写年级';
    document.getElementById('userBio').textContent = user.bio || '这个人很懒，什么都没写';

    // 显示兴趣标签
    const interestsDiv = document.getElementById('userInterests');
    interestsDiv.innerHTML = '';
    if (user.interests && user.interests.length > 0) {
        user.interests.forEach(interest => {
            const tag = document.createElement('span');
            tag.className = 'interest-tag';
            tag.textContent = interest;
            interestsDiv.appendChild(tag);
        });
    }

    document.getElementById('loading').style.display = 'none';
    document.getElementById('userCard').style.display = 'block';
}

// 喜欢当前用户
async function likeUser() {
    if (currentUserIndex >= recommendedUsers.length) return;

    const user = recommendedUsers[currentUserIndex];

    try {
        const result = await window.api.likeUser(user.id);
        alert(`匹配分数：${(result.match_score * 100).toFixed(0)}分`);
        currentUserIndex++;
        displayCurrentUser();
    } catch (error) {
        alert('操作失败：' + error.message);
    }
}

// 跳过当前用户
async function passUser() {
    if (currentUserIndex >= recommendedUsers.length) return;

    const user = recommendedUsers[currentUserIndex];

    try {
        await window.api.passUser(user.id);
        currentUserIndex++;
        displayCurrentUser();
    } catch (error) {
        alert('操作失败：' + error.message);
    }
}

// 退出登录
function logout() {
    window.api.clearToken();
    window.location.href = '/';
}
