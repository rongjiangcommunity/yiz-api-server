# 接口设计

术语说明

* sid: session id
* uid: user id

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
* 年纪管理员：gadmin
* 班级管理员：cadmin
* 校友：xiaoyou
* 普通用户：'' | unknown

### 用户接口

#### POST /api/user/apply/:sid

提交申请信息

<!-- * body：姓名、period、g3、微信、手机、classmates(,)
* db key: ${appid}:apply:${uid}
* status枚举：ok, notok, pending
* db: gmt_create,gmt_modified,name,period,g3,wechat,mobile, classmates, assign_to=null, approved_by=null,status -->

##### 参数

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

#### GET /api/user/apply/:sid

查询申请进度

出参

| field  |  type | 备注  |
|---|---|---|
|  name |  String | 姓名  |
|  period |  Number |  届 |
|  g3 | Number  | 高三班级  |
|  wechat | String  | 微信  |
| mobile  |  String | 手机  |
| classmates  |  String | 同班同学，半角逗号连接 |
| status  |  String | ok, notok, pending |

```json
{"success":true,"data":{"gmt_create":"1553367634692","name":"ljw","period":"88","g3":"10","wechat":"wx123","mobile":"123","classmates":"c1,c2,c3","status":"ok","assign_to":"","approved_by":"o-YIv5TyMkOjeXljbwY6CqScAdq4","comment":"优秀","gmt_modified":"1553437330576","approved_by_name":"88-10 ljw"}}
```

### 管理员接口

注意权限控制

#### GET /api/user/reviewlist/:sid

待审批用户列表接口，权限：管理员和班级管理员

出参示例:

```json
{"success":true,"data":[{"gmt_create":"1553367634692","name":"ljw","period":"88","g3":"10","wechat":"wx123","mobile":"123","classmates":"c1,c2,c3","status":"ok","assign_to":"","approved_by":"o-YIv5TyMkOjeXljbwY6CqScAdq4","comment":"优秀","gmt_modified":"1553437330576","approved_by_name":"88-10 ljw","uid":"o-YIv5TyMkOjeXljbwY6CqScAdq4"}]}
```

<!--
redis key设计：

* 系统管理员：`${appid}:apply_list:admin` zadd $uid $ts
* 班级管理员：`${appid}:apply_list:${period}-${g3}` zadd $uid $ts -->

后续：

* 支持分页

#### GET /api/user/review/:sid/:uid

待审批用户信息接口，权限：管理员和班级管理员

出参示例:

```json
{"success":true,"data":{"gmt_create":"1553367634692","name":"ljw","period":"88","g3":"10","wechat":"wx123","mobile":"123","classmates":"c1,c2,c3","status":"ok","assign_to":"","approved_by":"o-YIv5TyMkOjeXljbwY6CqScAdq4","comment":"优秀","gmt_modified":"1553437330576","approved_by_name":"88-10 ljw"}}
```

<!-- * 待审批用户 id、姓名、period、g3、微信、手机、classmates -->

#### POST /api/user/review/:sid/:uid

校友审批，权限：管理员和班级管理员
