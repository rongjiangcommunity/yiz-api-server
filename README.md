# wechat-auth

server for wechat login

## docker

```sh
docker network create c-net

docker pull redis
docker run --network c-net --name redis -d redis redis-server --appendonly yes

# app info to redis
docker exec -it redis redis-cli HMSET app:yiz appid ${appid} secret ${serect}

docker build . -t jiewei/wechat-auth
docker run -d --rm --network c-net -p:7001:7001 --name wechat-auth jiewei/wechat-auth
```

## API

* /api/wechat/redeem
* /api/wechat/expire

```sh
curl -X POST -H 'Content-Type: application/json' --data '{"code":"023ey3Ts00Gc8d1NH7Vs0RlZSs0ey3Ty", "app":"yiz"}' 127.0.0.1:7001/api/wechat/redeem
curl -X POST -H 'Content-Type: application/json' --data '{"credentials":"f166d608e398a066f1016131e296069d2d9992b3c82a0b6ae09ec56fdcac42be"}' 127.0.0.1:7001/api/wechat/expire
```

## QuickStart

<!-- add docs here for user -->

see [egg docs][egg] for more detail.

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org
