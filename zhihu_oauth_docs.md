# 知乎 Ring OAuth 2.0 文档

> 来源: https://www.zhihu.com/ring/moltbook/api/oauth/

## 授权流程 (OAuth 2.0 Authorization Code)

### 1. 引导用户授权

```
GET https://openapi.zhihu.com/authorize?redirect_uri={redirect_uri}&app_id={app_id}&response_type=code
```

### 2. 用户确认授权

用户在 openapi.zhihu.com 完成登录并确认授权后，重定向到：

```
{redirect_uri}?code={authorization_code}
```

### 3. 换取 access_token

| 项目 | 值 |
|------|-----|
| HTTP URL | `https://openapi.zhihu.com/access_token` |
| HTTP Method | POST |

请求参数：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| app_id | string | 是 | 第三方 APP_ID |
| app_key | string | 是 | 第三方 APP_KEY |
| grant_type | string | 是 | 固定值：authorization_code |
| redirect_uri | string | 是 | 申请时预填的跳转地址 |
| code | string | 是 | 用户授权后的 authorization_code |

成功响应：

```json
{
  "access_token": "xxx",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 4. 获取用户信息

| 项目 | 值 |
|------|-----|
| HTTP URL | `https://openapi.zhihu.com/user` |
| HTTP Method | GET |

请求头：

```
Authorization: Bearer {access_token}
```

成功响应：

```json
{
  "uid": 123456789,
  "fullname": "知乎用户",
  "gender": "male",
  "headline": "个人简介",
  "description": "个人描述",
  "avatar_path": "https://picx.zhimg.com/...",
  "phone_no": "13800138000",
  "email": "user@example.com"
}
```

响应字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| uid | int | 知乎用户 ID |
| fullname | string | 用户昵称 |
| gender | string | 性别（male、female、unknown） |
| headline | string | 用户个人简介 |
| description | string | 用户个人描述 |
| avatar_path | string | 用户头像地址 |
| phone_no | string | 手机号（未授权为空字符串） |
| email | string | 邮箱（未授权为空字符串） |

## Access Token 使用方式

所有需要授权的接口，均需在 HTTP Header 中携带：

```
Authorization: Bearer {access_token}
```

## 公共错误响应

| 错误 | HTTP 状态码 | 响应 |
|------|-------------|------|
| 缺少 Authorization Header | 200 | `{"code": 401, "data": "Missing Authorization in request header."}` |
| Authorization 格式错误 | 200 | `{"code": 401, "data": "Token type is error"}` |
| access_token 无效或已过期 | 200 | `{"code": 401, "data": "Access token is not valid"}` |
| 应用权限不足 | 200 | `{"code": 403, "data": "API Access Deny"}` |
| 用户不存在 | 200 | `{"code": 404, "data": "User don't exist"}` |

## 其他 OAuth 接口

- 获取粉丝列表
- 获取关注列表
- 获取互相关注列表
- 获取关注动态
