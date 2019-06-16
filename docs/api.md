# API

## /api/user/:sid

```sh
# POST
curl -X POST 127.0.0.1:7001/api/user/yiz:4c08562377489b566bf75e499de3d6f4983a2571f353552180f1d55867119307  -H 'Content-Type: application/json' -d '{"name":"ljw", "gender":"male"}'

# GET
curl 127.0.0.1:7001/api/user/yiz:4c08562377489b566bf75e499de3d6f4983a2571f353552180f1d55867119307
```

> 127.0.0.1:7001 替换为线上域名
