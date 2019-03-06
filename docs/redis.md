# redis

## key 设计

> yiz 一中简写

* `${appid}:appsecret`: 存储小程序密钥 appid,secret
* `${appid}:credentials:${sha256_seesion}`: 存储小程序登录信息 openid,session_key,unionid
* `${appid}:session:${openid}`: 存储用户最新的session字符串，用户session更新时，一并删除旧的登录信息
* `${appid}:user:${openid}`: 存储用户信息

```txt
yiz:appsecret
yiz:credentials:032c9f8396312effd80295e8d7ee2f914728c32fb73360b1a707c6778dffd17a
```

assign_to,approved,approved_by
