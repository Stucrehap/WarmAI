import httpx
from config import settings
from models import User

async def calculate_match_score(user1: User, user2: User) -> float:
    """
    使用AI API计算两个用户的匹配分数
    """
    if not settings.AI_API_KEY:
        # 如果没有配置AI API，使用基于规则的简单匹配算法
        return calculate_rule_based_match(user1, user2)

    # 构建用户画像
    user1_profile = f"""
    用户名: {user1.username}
    学校: {user1.university}
    专业: {user1.major}
    年级: {user1.grade}
    个人简介: {user1.bio}
    兴趣: {', '.join(user1.interests) if user1.interests else '无'}
    """

    user2_profile = f"""
    用户名: {user2.username}
    学校: {user2.university}
    专业: {user2.major}
    年级: {user2.grade}
    个人简介: {user2.bio}
    兴趣: {', '.join(user2.interests) if user2.interests else '无'}
    """

    prompt = f"""
    请分析以下两位用户的匹配度，给出0-100的匹配分数。
    只考虑兴趣爱好、专业背景、个人特质等因素，分数越高表示越匹配。

    用户A:
    {user1_profile}

    用户B:
    {user2_profile}

    请只返回一个0-100之间的数字作为匹配分数，不要返回其他内容。
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AI_API_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.AI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.AI_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                },
                timeout=10.0
            )

            if response.status_code == 200:
                result = response.json()
                score_text = result["choices"][0]["message"]["content"].strip()
                # 提取数字
                import re
                match = re.search(r'\d+', score_text)
                if match:
                    return float(match.group()) / 100.0  # 归一化到0-1

    except Exception as e:
        print(f"AI API调用失败: {e}")

    # 如果AI API调用失败，降级到规则匹配
    return calculate_rule_based_match(user1, user2)

def calculate_rule_based_match(user1: User, user2: User) -> float:
    """
    基于规则的匹配算法（备用方案）
    """
    score = 0.0

    # 同一学校加分
    if user1.university and user2.university and user1.university == user2.university:
        score += 0.3

    # 专业相关加分
    if user1.major and user2.major:
        if user1.major == user2.major:
            score += 0.3
        elif is_related_major(user1.major, user2.major):
            score += 0.15

    # 兴趣匹配加分
    if user1.interests and user2.interests:
        common_interests = set(user1.interests) & set(user2.interests)
        interest_score = len(common_interests) * 0.1
        score += min(interest_score, 0.3)

    # 年级相近加分
    if user1.grade and user2.grade:
        try:
            grade_diff = abs(int(user1.grade) - int(user2.grade))
            if grade_diff == 0:
                score += 0.1
            elif grade_diff == 1:
                score += 0.05
        except:
            pass

    return min(score, 1.0)

def is_related_major(major1: str, major2: str) -> bool:
    """
    判断两个专业是否相关
    """
    related_groups = [
        {"计算机", "软件工程", "人工智能", "数据科学"},
        {"金融", "经济学", "会计", "财务管理"},
        {"机械工程", "电子工程", "自动化"},
        {"英语", "翻译", "语言学", "文学"}
    ]

    for group in related_groups:
        if major1 in group and major2 in group:
            return True

    return False
