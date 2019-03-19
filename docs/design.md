# redis

## 应用及用户

> yiz 一中简写

* `${appid}:appsecret`: 存储小程序密钥 appid,secret
* `${appid}:credentials:${sha256_seesion}`: 存储小程序登录信息 openid,session_key,unionid
* `${appid}:session:${openid}`: 存储用户最新的session字符串，用户session更新时，一并删除旧的登录信息
* `${appid}:user:${openid}`: 存储用户信息

```txt
yiz:appsecret
yiz:credentials:032c9f8396312effd80295e8d7ee2f914728c32fb73360b1a707c6778dffd17a
```

## 申请、审核

### 权限设计

* 系统管理员：admin
* 年纪管理员：grade_admin
* 班级管理员：class_admin
* 校友：alumni
* 普通用户：'' | unknown

### 用户接口

#### POST /api/user/apply/:id

提交申请信息

* body：姓名、period、g3、微信、手机、classmates(,)
* db key: ${appid}:apply:${uid}
* status枚举：ok, failed, pending
* db: gmt_create,gmt_modified,name,period,g3,wechat,mobile, classmates, assign_to=null, approved_by=null,status

##### 接口设计

入参

| field  |  type | 备注  |
|---|---|---|
|  name |  String | 姓名  |
|  period |  Number |  届 |
|  g3 | Number  | 高三班级  |
|  wechat | String  | 微信  |
| mobile  |  String | 手机  |
| classmates  |  String | 同班同学，半角逗号连接 |

出参

| field  |  type | 备注  |
|---|---|---|
|  success |  Boolean |   |
|  data |  JSON |   |

#### GET /api/user/apply/:id

查询申请进度

入参

无

出参

| field  |  type | 备注  |
|---|---|---|
|  name |  String | 姓名  |
|  period |  Number |  届 |
|  g3 | Number  | 高三班级  |
|  wechat | String  | 微信  |
| mobile  |  String | 手机  |
| classmates  |  String | 同班同学，半角逗号连接 |
| status  |  String | ok, failed, pending |

### 管理员接口

注意权限控制

#### review list

* 数据类型：sorted set
* 系统管理员：`${appid}:sorted:review:admin` zadd $uid $ts
* 班级管理员：`${appid}:sorted:review:${period}-${g3}` zadd $uid $ts

Attention

* 分页

#### review detail

* candidate_id、姓名、period、g3、微信、手机、classmates

Attention

#### review

* candidate_id,reviewer_id
