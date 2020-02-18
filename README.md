# Yizhong API Server

Restful API Server based on eggjs.

## Wechat login diagram

![img](https://res.wx.qq.com/wxdoc/dist/assets/img/api-login.2fcc9f35.jpg)

more info: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html

## Development

```sh
npm i
npm run dev
open http://localhost:7001/
```

## Docker

```sh
docker build . -t jiewei/yiz-api-server
docker push jiewei/yiz-api-server
```

## Debug lua in redis

```sh
redis-cli -p 6380  --eval phgetall.lua 0 , yiz:user:*
redis-cli -p 6380  --eval pget.lua 0 , app:*
```

## More

* [Developing inside a Container]

[egg]: https://eggjs.org
[Developing inside a Container]: https://code.visualstudio.com/docs/remote/containers
