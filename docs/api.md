# API

## /api/user/:sid

```sh
# POST
curl -X POST 127.0.0.1:7001/api/user/yiz:4c08562377489b566bf75e499de3d6f4983a2571f353552180f1d55867119307  -H 'Content-Type: application/json' -d '{"name":"ljw", "gender":"male"}'

# GET
curl 127.0.0.1:7001/api/user/yiz:4c08562377489b566bf75e499de3d6f4983a2571f353552180f1d55867119307
```

> 127.0.0.1:7001 替换为线上域名

## wechat API

* /api/wechat/redeem
* /api/wechat/expire

```sh
curl -X POST -H 'Content-Type: application/json' --data '{"code":"023ey3Ts00Gc8d1NH7Vs0RlZSs0ey3Ty", "appid":"yiz"}' 127.0.0.1:7001/api/wechat/redeem

curl -X POST -H 'Content-Type: application/json' --data '{"credentials":"yiz:f166d608e398a066f1016131e296069d2d9992b3c82a0b6ae09ec56fdcac42be"}' 127.0.0.1:7001/api/wechat/expire
```