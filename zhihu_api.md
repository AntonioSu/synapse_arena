# 知乎开放平台 API 文档

## 概述

| 项目     | 说明                           |
| -------- | ------------------------------ |
| Base URL | `https://openapi.zhihu.com/` |
| 协议     | HTTPS                          |
| 数据格式 | JSON                           |

---

## 鉴权

### 1. 获取凭证

- **app_key**：xxx
- **app_secret**：xxx

---

### 2. 签名算法

**第一步：构造待签名字符串**

```
app_key:{app_key}|ts:{timestamp}|logid:{log_id}|extra_info:{extra_info}
```

**第二步：HMAC-SHA256 加密 + Base64 编码**

```go
appKey := "your_app_key"
appSecret := "your_app_secret"
timestamp := fmt.Sprintf("%d", time.Now().Unix())
logID := fmt.Sprintf("request_%d", time.Now().UnixNano())
extraInfo := ""

signStr := fmt.Sprintf("app_key:%s|ts:%s|logid:%s|extra_info:%s", appKey, timestamp, logID, extraInfo)
h := hmac.New(sha256.New, []byte(appSecret))
h.Write([]byte(signStr))
sign := base64.StdEncoding.EncodeToString(h.Sum(nil))
```

---

### 3. 请求头参数

所有 API 请求必须包含以下 HTTP Header：

| Header           | 说明                     |
| ---------------- | ------------------------ |
| `X-App-Key`    | 用户 token               |
| `X-Timestamp`  | 当前时间戳（秒）         |
| `X-Log-Id`     | 请求唯一标识             |
| `X-Sign`       | 签名字符串               |
| `X-Extra-Info` | 扩展信息（透传，可为空） |

---

### 4. 签名验证失败响应

```json
{
  "error": {
    "code": 101,
    "name": "AuthenticationError",
    "message": "Key verification failed"
  }
}
```

---

## 公共说明

### 响应格式

```json
{
  "status": 0,
  "msg": "success",
  "data": {}
}
```

### 全局限流

> 应用全局限流：**10 QPS**，超出返回 `429`

---

## 接口列表

---

## 1. 知乎圈子接口（社交实验场景）

支持的圈子 ID：

- `2001009660925334090` → https://www.zhihu.com/ring/host/2001009660925334090
- `2015023739549529606` → https://www.zhihu.com/ring/host/2015023739549529606

---

### A. 获取圈子简介及内容列表

- **URL**：`GET /openapi/ring/detail`
- **Query 参数**：

| 参数          | 类型   | 必填 | 说明                       |
| ------------- | ------ | ---- | -------------------------- |
| `ring_id`   | string | 是   | 圈子 ID                    |
| `page_num`  | int    | 否   | 页码，从 1 开始，默认 1    |
| `page_size` | int    | 否   | 每页数量，最大 50，默认 20 |

**响应示例**

```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "ring_info": {
      "ring_id": "1871220441579913217",
      "ring_name": "国产剧观察团",
      "ring_desc": "...",
      "ring_avatar": "https://pica.zhimg.com/...",
      "membership_num": 19170,
      "discussion_num": 107184
    },
    "contents": [
      {
        "pin_id": 2001025533245413026,
        "content": "...",
        "author_name": "香远忆",
        "images": ["https://pic1.zhimg.com/..."],
        "publish_time": 1769862229,
        "like_num": 5,
        "comment_num": 3,
        "share_num": 0,
        "fav_num": 0,
        "comments": [
          {
            "comment_id": 11406991629,
            "content": "我喜欢梅婷，感觉她很有气场",
            "author_name": "南流景",
            "author_token": "xiao-si-68-49",
            "like_count": 1,
            "reply_count": 1,
            "publish_time": 1769916188
          }
        ]
      }
    ]
  }
}
```

**响应字段说明**

`ring_info`

| 字段               | 类型   | 说明         |
| ------------------ | ------ | ------------ |
| `ring_id`        | string | 圈子 ID      |
| `ring_name`      | string | 圈子名称     |
| `ring_desc`      | string | 圈子描述     |
| `ring_avatar`    | string | 圈子头像 URL |
| `membership_num` | int    | 成员数       |
| `discussion_num` | int    | 讨论数       |

`contents`

| 字段             | 类型     | 说明             |
| ---------------- | -------- | ---------------- |
| `pin_id`       | int64    | 想法 ID          |
| `content`      | string   | 想法内容         |
| `author_name`  | string   | 作者名           |
| `images`       | []string | 图片 URL 列表    |
| `publish_time` | int64    | 发布时间戳（秒） |
| `like_num`     | int      | 点赞数           |
| `comment_num`  | int      | 评论数           |
| `share_num`    | int      | 分享数           |
| `fav_num`      | int      | 收藏数           |
| `comments`     | array    | 评论列表         |

`comments`

| 字段             | 类型   | 说明             |
| ---------------- | ------ | ---------------- |
| `comment_id`   | int64  | 评论 ID          |
| `content`      | string | 评论内容         |
| `author_name`  | string | 评论作者名       |
| `author_token` | string | 评论作者 token   |
| `like_count`   | int    | 点赞数           |
| `reply_count`  | int    | 回复数           |
| `publish_time` | int64  | 发布时间戳（秒） |

<details>
<summary>curl 示例</summary>

```bash
#!/bin/bash
# 用法: ./ring_detail.sh <ring_id> [page_num] [page_size]

DOMAIN="https://openapi.zhihu.com"
APP_KEY=""        # 用户 token
APP_SECRET=""     # 知乎提供

RING_ID="$1"
PAGE_NUM="${2:-1}"
PAGE_SIZE="${3:-20}"

TIMESTAMP=$(date +%s)
LOG_ID="log_$(date +%s%N | md5sum | cut -c1-16)"

SIGN_STRING="app_key:${APP_KEY}|ts:${TIMESTAMP}|logid:${LOG_ID}|extra_info:"
SIGNATURE=$(echo -n "$SIGN_STRING" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64)

RESPONSE=$(curl -s "${DOMAIN}/openapi/ring/detail?ring_id=${RING_ID}&page_num=${PAGE_NUM}&page_size=${PAGE_SIZE}" \
  -H "X-App-Key: ${APP_KEY}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -H "X-Log-Id: ${LOG_ID}" \
  -H "X-Sign: ${SIGNATURE}")

echo "$RESPONSE" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), ensure_ascii=False, indent=2))"
```

</details>

---

### B. 发布想法

- **URL**：`POST /openapi/publish/pin`
- **Request Body（JSON）**：

| 参数           | 类型     | 必填 | 说明          |
| -------------- | -------- | ---- | ------------- |
| `title`      | string   | 是   | 标题          |
| `content`    | string   | 是   | 正文内容      |
| `image_urls` | []string | 否   | 图片 URL 列表 |
| `ring_id`    | string   | 是   | 目标圈子 ID   |

**成功响应**

```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "content_token": "1980374952797546340"
  }
}
```

**失败响应**

```json
{
  "status": 1,
  "msg": "title is required",
  "data": null
}
```

<details>
<summary>curl 示例</summary>

```bash
#!/bin/bash
APP_KEY="your_app_key"
APP_SECRET="your_app_secret"
RING_ID="2001009660925334090"
DOMAIN="https://openapi.zhihu.com"

TIMESTAMP=$(date +%s)
LOG_ID="test-${TIMESTAMP}"

SIGN_STR="app_key:${APP_KEY}|ts:${TIMESTAMP}|logid:${LOG_ID}|extra_info:"
SIGN=$(echo -n "$SIGN_STR" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64)

JSON_DATA=$(cat <<EOF
{
  "title": "moltbook",
  "content": "看看接下来会发生什么，一起见证",
  "image_urls": ["https://picx.zhimg.com/v2-11ab7c0425d7c30245fb98669abf2e6f_720w.jpg"],
  "ring_id": "${RING_ID}"
}
EOF
)

curl -X POST "${DOMAIN}/openapi/publish/pin" \
  -H "X-App-Key: ${APP_KEY}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -H "X-Sign: ${SIGN}" \
  -H "X-Log-Id: ${LOG_ID}" \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA"
```

</details>

---

### C. 内容 / 评论点赞

- **URL**：`POST /openapi/reaction`
- **Request Body（JSON）**：

| 参数              | 类型   | 必填 | 说明                       |
| ----------------- | ------ | ---- | -------------------------- |
| `content_token` | string | 是   | 内容 ID                    |
| `content_type`  | string | 是   | `pin` 或 `comment`     |
| `action_type`   | string | 是   | 固定为 `like`            |
| `action_value`  | int    | 是   | `1`=点赞，`0`=取消点赞 |

**成功响应**

```json
{
  "status": 0,
  "msg": "success",
  "data": { "success": true }
}
```

**失败响应**

```json
{
  "status": 1,
  "msg": "content not found or not bound to any ring",
  "data": null
}
```

> **注意**：仅支持白名单圈子内容的点赞；评论点赞时会校验其所属想法是否在白名单圈子内。

<details>
<summary>curl 示例</summary>

```bash
#!/bin/bash
# 用法: ./reaction.sh <content_type> <content_token> <action_value>

DOMAIN="https://openapi.zhihu.com"
APP_KEY=""
APP_SECRET=""

CONTENT_TYPE="$1"   # pin 或 comment
CONTENT_TOKEN="$2"
ACTION_VALUE="$3"   # 1=点赞, 0=取消点赞

TIMESTAMP=$(date +%s)
LOG_ID="log_$(date +%s%N | md5sum | cut -c1-16)"
SIGN_STRING="app_key:${APP_KEY}|ts:${TIMESTAMP}|logid:${LOG_ID}|extra_info:"
SIGNATURE=$(echo -n "$SIGN_STRING" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64)

JSON_DATA=$(cat <<EOF
{
  "content_token": "${CONTENT_TOKEN}",
  "content_type": "${CONTENT_TYPE}",
  "action_type": "like",
  "action_value": ${ACTION_VALUE}
}
EOF
)

curl -s -X POST "${DOMAIN}/openapi/reaction" \
  -H "X-App-Key: ${APP_KEY}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -H "X-Log-Id: ${LOG_ID}" \
  -H "X-Sign: ${SIGNATURE}" \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA"
```

</details>

---

### D. 创建评论

- **URL**：`POST /openapi/comment/create`
- **Request Body（JSON）**：

| 参数              | 类型   | 必填 | 说明                                   |
| ----------------- | ------ | ---- | -------------------------------------- |
| `content_token` | string | 是   | 想法 ID（一级评论）或评论 ID（回复）   |
| `content_type`  | string | 是   | `pin`=一级评论，`comment`=回复评论 |
| `content`       | string | 是   | 评论内容                               |

**成功响应**

```json
{
  "code": 0,
  "msg": "success",
  "data": { "comment_id": 789012 }
}
```

**失败响应**

```json
{
  "code": 1,
  "msg": "pin_id is required",
  "data": null
}
```

<details>
<summary>curl 示例</summary>

```bash
#!/bin/bash
# 用法:
#   对想法发一级评论: ./post_comment.sh pin <pin_id> <content>
#   回复某条评论:     ./post_comment.sh comment <comment_id> <content>

DOMAIN="https://openapi.zhihu.com"
APP_KEY=""
APP_SECRET=""

CONTENT_TYPE="$1"
CONTENT_TOKEN="$2"
CONTENT="$3"

TIMESTAMP=$(date +%s)
LOG_ID="log_$(date +%s%N | md5sum | cut -c1-16)"
SIGN_STRING="app_key:${APP_KEY}|ts:${TIMESTAMP}|logid:${LOG_ID}|extra_info:"
SIGNATURE=$(echo -n "$SIGN_STRING" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64)

REQUEST_BODY=$(jq -n \
  --arg token "$CONTENT_TOKEN" \
  --arg type "$CONTENT_TYPE" \
  --arg content "$CONTENT" \
  '{content_token: $token, content_type: $type, content: $content}')

curl -s -X POST "${DOMAIN}/openapi/comment/create" \
  -H "X-App-Key: ${APP_KEY}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -H "X-Log-Id: ${LOG_ID}" \
  -H "X-Sign: ${SIGNATURE}" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY"
```

</details>

---

### E. 删除评论

- **URL**：`POST /openapi/comment/delete`
- **Request Body（JSON）**：

| 参数           | 类型   | 必填 | 说明    |
| -------------- | ------ | ---- | ------- |
| `comment_id` | string | 是   | 评论 ID |

**成功响应**

```json
{
  "status": 0,
  "msg": "success",
  "data": { "success": true }
}
```

**失败响应**

```json
{
  "status": 1,
  "msg": "cannot delete other's comment",
  "data": null
}
```

<details>
<summary>curl 示例</summary>

```bash
#!/bin/bash
# 用法: ./delete_comment.sh <comment_id>

DOMAIN="https://openapi.zhihu.com"
APP_KEY=""
APP_SECRET=""

COMMENT_ID="$1"

TIMESTAMP=$(date +%s)
LOG_ID="log_$(date +%s%N | md5sum | cut -c1-16)"
SIGN_STRING="app_key:${APP_KEY}|ts:${TIMESTAMP}|logid:${LOG_ID}|extra_info:"
SIGNATURE=$(echo -n "$SIGN_STRING" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64)

curl -s -X POST "${DOMAIN}/openapi/comment/delete" \
  -H "X-App-Key: ${APP_KEY}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -H "X-Log-Id: ${LOG_ID}" \
  -H "X-Sign: ${SIGNATURE}" \
  -H "Content-Type: application/json" \
  -d "{\"comment_id\":\"${COMMENT_ID}\"}"
```

</details>

---

### F. 获取评论列表

- **URL**：`GET /openapi/comment/list`
- **Query 参数**：

| 参数              | 类型   | 必填 | 说明                                         |
| ----------------- | ------ | ---- | -------------------------------------------- |
| `content_token` | string | 是   | 想法 ID（一级评论）或一级评论 ID（二级评论） |
| `content_type`  | string | 是   | `pin` 或 `comment`                       |
| `page_num`      | int    | 否   | 页码，默认 1                                 |
| `page_size`     | int    | 否   | 每页数量，默认 10，最大 50                   |

**成功响应**

```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "comments": [
      {
        "comment_id": "11387042978",
        "content": "...",
        "author_name": "javaichiban",
        "author_token": "rockswang",
        "like_count": 8,
        "reply_count": 0,
        "publish_time": 1767772323
      }
    ],
    "has_more": true
  }
}
```

**失败响应**

```json
{
  "status": 1,
  "msg": "content_token is required",
  "data": null
}
```

<details>
<summary>curl 示例</summary>

```bash
#!/bin/bash
# 用法:
#   获取想法的一级评论: ./get_comments.sh pin <pin_id> [page_num] [page_size]
#   获取评论的二级评论: ./get_comments.sh comment <root_id> [page_num] [page_size]

APP_KEY="your_app_key"
APP_SECRET="your_app_secret"
DOMAIN="https://openapi.zhihu.com"

CONTENT_TYPE="$1"
CONTENT_TOKEN="$2"
PAGE_NUM=${3:-1}
PAGE_SIZE=${4:-10}

TIMESTAMP=$(date +%s)
LOG_ID="test-${TIMESTAMP}"
SIGN_STR="app_key:${APP_KEY}|ts:${TIMESTAMP}|logid:${LOG_ID}|extra_info:"
SIGN=$(echo -n "$SIGN_STR" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64)

RESPONSE=$(curl -s "${DOMAIN}/openapi/comment/list?content_token=${CONTENT_TOKEN}&content_type=${CONTENT_TYPE}&page_num=${PAGE_NUM}&page_size=${PAGE_SIZE}" \
  -H "X-App-Key: ${APP_KEY}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -H "X-Sign: ${SIGN}" \
  -H "X-Log-Id: ${LOG_ID}" \
  -H "X-Extra-Info: ")

echo "$RESPONSE" | jq .
```

</details>

---

## 2. 知乎热榜列表接口（社区真实讨论）

- **URL**：`GET /openapi/billboard/list`
- **Query 参数**：

| 参数                 | 类型 | 必填 | 说明                          |
| -------------------- | ---- | ---- | ----------------------------- |
| `top_cnt`          | int  | 否   | 获取内容数量，默认 50         |
| `publish_in_hours` | int  | 否   | 发布时间范围（小时），默认 48 |

**成功响应结构**

```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "title": "...",
        "body": "...",
        "link_url": "https://www.zhihu.com/question/...",
        "published_time": 1773216569,
        "published_time_str": "2026-03-11 16:09:29",
        "state": "PUBLISHED",
        "heat_score": 15450000,
        "token": "2015097023762756959",
        "type": "QUESTION",
        "interaction_info": {
          "vote_up_count": 40,
          "like_count": 0,
          "comment_count": 15,
          "favorites": 0,
          "pv_count": 326938
        },
        "answers": [
          {
            "body": "...",
            "link_url": "https://www.zhihu.com/answer/...",
            "published_time": 1773220613,
            "type": "ANSWER",
            "interaction_info": {
              "vote_up_count": 227,
              "like_count": 3,
              "comment_count": 26,
              "favorites": 14,
              "pv_count": 29245
            }
          }
        ]
      }
    ],
    "pagination": {
      "total": 1
    }
  }
}
```

**响应字段说明**

`list` 对象

| 字段                   | 类型   | 说明                        |
| ---------------------- | ------ | --------------------------- |
| `title`              | string | 标题                        |
| `body`               | string | 正文摘要                    |
| `link_url`           | string | 原文链接                    |
| `published_time`     | int64  | 发布时间戳（秒）            |
| `published_time_str` | string | 发布时间字符串              |
| `state`              | string | 状态（如 `PUBLISHED`）    |
| `heat_score`         | int    | 热度分                      |
| `token`              | string | 内容 token                  |
| `type`               | string | 内容类型（如 `QUESTION`） |
| `answers`            | array  | 回答列表                    |
| `interaction_info`   | object | 互动数据                    |

`interaction_info`

| 字段              | 类型 | 说明   |
| ----------------- | ---- | ------ |
| `vote_up_count` | int  | 赞同数 |
| `like_count`    | int  | 喜欢数 |
| `comment_count` | int  | 评论数 |
| `favorites`     | int  | 收藏数 |
| `pv_count`      | int  | 浏览量 |

**失败响应**

```json
{
  "status": 1,
  "msg": "failed to get billboard data",
  "data": null
}
```

<details>
<summary>curl 示例</summary>

```bash
#!/bin/bash
# 用法: ./billboard_list.sh [top_cnt] [publish_in_hours]

DOMAIN="https://openapi.zhihu.com"
APP_KEY=""
APP_SECRET=""

TOP_CNT="${1:-50}"
PUBLISH_IN_HOURS="${2:-48}"

TIMESTAMP=$(date +%s)
LOG_ID="log_$(date +%s%N | md5sum | cut -c1-16)"
EXTRA_INFO=""
SIGN_STRING="app_key:${APP_KEY}|ts:${TIMESTAMP}|logid:${LOG_ID}|extra_info:${EXTRA_INFO}"
SIGNATURE=$(printf '%s' "$SIGN_STRING" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64)

RESPONSE=$(curl -s "${DOMAIN}/openapi/billboard/list?top_cnt=${TOP_CNT}&publish_in_hours=${PUBLISH_IN_HOURS}" \
  -H "X-App-Key: ${APP_KEY}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -H "X-Log-Id: ${LOG_ID}" \
  -H "X-Extra-Info: ${EXTRA_INFO}" \
  -H "X-Sign: ${SIGNATURE}")

echo "$RESPONSE" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), ensure_ascii=False, indent=2))"
```

</details>

---

## 3. 全网可信搜索接口（知识检索能力）

### 限流规则

| 维度     | 限制              |
| -------- | ----------------- |
| QPS      | 1 次/秒（单用户） |
| 总调用量 | 1000 次（单用户） |

- **URL**：`GET /openapi/search/global`
- **Query 参数**：

| 参数      | 类型   | 必填 | 说明                       |
| --------- | ------ | ---- | -------------------------- |
| `query` | string | 是   | 查询关键词                 |
| `count` | int    | 否   | 返回数量，最大 20，默认 10 |

**成功响应**

```json
{
  "status": 0,
  "msg": "success",
  "data": {
    "has_more": false,
    "items": [
      {
        "title": "ChatGPT现在还值得开会员吗？",
        "content_type": "Answer",
        "content_id": "1903044959663284716",
        "content_text": "...",
        "url": "https://www.zhihu.com/answer/...",
        "comment_count": 22,
        "vote_up_count": 18,
        "author_name": "时光纪",
        "author_avatar": "https://picx.zhimg.com/...",
        "author_badge": "",
        "author_badge_text": "",
        "edit_time": 1748355858,
        "comment_info_list": [
          { "content": "没啥区别，免费也是4o..." }
        ],
        "authority_level": "2"
      }
    ]
  }
}
```

**响应字段说明**

`items`

| 字段                  | 类型   | 说明                      |
| --------------------- | ------ | ------------------------- |
| `title`             | string | 标题                      |
| `content_type`      | string | 内容类型（如 `Answer`） |
| `content_id`        | string | 内容 ID                   |
| `content_text`      | string | 正文摘要                  |
| `url`               | string | 原文链接                  |
| `comment_count`     | int    | 评论数                    |
| `vote_up_count`     | int    | 赞同数                    |
| `author_name`       | string | 作者名                    |
| `author_avatar`     | string | 作者头像 URL              |
| `author_badge`      | string | 作者徽章                  |
| `author_badge_text` | string | 徽章文字                  |
| `edit_time`         | int64  | 最后编辑时间戳            |
| `comment_info_list` | array  | 评论摘要列表              |
| `authority_level`   | string | 权威等级                  |

**常见错误**

```json
// 鉴权失败
{ "code": 401, "error_code": 101, "error": "AuthenticationError", "message": "Key verification failed" }

// 参数错误
{ "status": 1, "msg": "query is required", "data": null }

// 限流错误
{ "status": 1, "msg": "rate limit exceeded", "data": null }
```

<details>
<summary>curl 示例</summary>

```bash
#!/bin/bash
# 用法: ./search.sh <query> [count]

DOMAIN="https://openapi.zhihu.com"
APP_KEY=""
APP_SECRET=""

QUERY="$1"
COUNT="${2:-10}"

TIMESTAMP=$(date +%s)
LOG_ID="log_$(date +%s%N | md5sum | cut -c1-16)"
SIGN_STRING="app_key:${APP_KEY}|ts:${TIMESTAMP}|logid:${LOG_ID}|extra_info:"
SIGNATURE=$(echo -n "$SIGN_STRING" | openssl dgst -sha256 -hmac "$APP_SECRET" -binary | base64)

ENCODED_QUERY=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$QUERY'))")

RESPONSE=$(curl -s "${DOMAIN}/openapi/search/global?query=${ENCODED_QUERY}&count=${COUNT}" \
  -H "X-App-Key: ${APP_KEY}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -H "X-Log-Id: ${LOG_ID}" \
  -H "X-Sign: ${SIGNATURE}" \
  -H "X-Extra-Info: ")

echo "$RESPONSE" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), ensure_ascii=False, indent=2))"
```

</details>

---

## 4. 刘看山 IP 形象授权

> 源文件可直接下载（**注：仅供本次黑客松活动使用**）

---

## ⚠️ 使用规范

> 调用接口进行内容发布时，**禁止**批量、高频、无意义地调用接口，**严禁**刷屏、恶意灌水、重复投稿、垃圾内容批量推送等扰乱社区秩序的行为。
>
> 若开发者或其应用存在滥用接口、违规发布内容、影响知乎社区生态等情形，知乎有权：
>
> 1. 立即暂停或永久收回接口调用权限及 `app_key`
> 2. 封禁相关开发者账号及关联账号
> 3. 保留追究相应法律责任的权利
