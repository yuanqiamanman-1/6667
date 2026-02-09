#!/usr/bin/env python3
"""
测试社区帖子和问答问题的 toggle-hidden API
"""
import requests
import json

API_BASE = "http://localhost:8000/api/v1"

# 1. 登录获取 token
print("1. 登录...")
login_response = requests.post(
    f"{API_BASE}/auth/login",
    data={"username": "associationHq1", "password": "123456"}
)
if login_response.status_code != 200:
    print(f"❌ 登录失败: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print(f"✅ 登录成功,token: {token[:20]}...")

# 2. 获取社区帖子列表
print("\n2. 获取社区帖子...")
posts_response = requests.get(
    f"{API_BASE}/content/community/posts?limit=1",
    headers=headers
)
if posts_response.status_code != 200:
    print(f"❌ 获取帖子失败: {posts_response.status_code}")
    print(posts_response.text)
    exit(1)

posts = posts_response.json()
if not posts:
    print("❌ 没有帖子数据")
    exit(1)

post = posts[0]
post_id = post["id"]
initial_hidden = post.get("hidden", False)

print(f"✅ 找到帖子: ID={post_id}")
print(f"   内容: {post['content'][:30]}...")
print(f"   初始hidden状态: {initial_hidden}")

# 3. 切换帖子隐藏状态
print("\n3. 切换帖子hidden状态...")
toggle_response = requests.post(
    f"{API_BASE}/content/community/posts/{post_id}/toggle-hidden",
    headers=headers,
    json={"hidden": not initial_hidden}
)
if toggle_response.status_code != 200:
    print(f"❌ 切换失败: {toggle_response.status_code}")
    print(toggle_response.text)
    exit(1)

toggle_result = toggle_response.json()
print(f"✅ 切换成功: {toggle_result}")

# 4. 重新获取帖子,验证状态已更新
print("\n4. 验证状态更新...")
posts_response2 = requests.get(
    f"{API_BASE}/content/community/posts?limit=10",
    headers=headers
)
posts2 = posts_response2.json()
updated_post = next((p for p in posts2 if p["id"] == post_id), None)

if not updated_post:
    print("❌ 未找到更新后的帖子")
    exit(1)

updated_hidden = updated_post.get("hidden", False)
print(f"✅ 更新后的hidden状态: {updated_hidden}")

if updated_hidden == (not initial_hidden):
    print("\n✅✅✅ 社区帖子隐藏功能正常工作!")
else:
    print(f"\n❌❌❌ 状态未正确更新! 预期: {not initial_hidden}, 实际: {updated_hidden}")
