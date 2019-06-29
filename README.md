# wechat-auth

Auth server for wechat login

![img](https://res.wx.qq.com/wxdoc/dist/assets/img/api-login.2fcc9f35.jpg)

more info: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html

## API

* /api/wechat/redeem
* /api/wechat/expire

```sh
curl -X POST -H 'Content-Type: application/json' --data '{"code":"023ey3Ts00Gc8d1NH7Vs0RlZSs0ey3Ty", "appid":"yiz"}' 127.0.0.1:7001/api/wechat/redeem

curl -X POST -H 'Content-Type: application/json' --data '{"credentials":"yiz:f166d608e398a066f1016131e296069d2d9992b3c82a0b6ae09ec56fdcac42be"}' 127.0.0.1:7001/api/wechat/expire
```

### Development

```sh
npm i
npm run dev
open http://localhost:7001/
```

### Deploy

#### server start

```sh
docker network create wechat-net
docker pull jiewei/wechat-auth
docker pull redis

# redis
docker run -d --network wechat-net \
-v /home/admin/data/wechat-redis:/data \
-v /home/admin/conf/redis/redis.conf:/usr/local/etc/redis/redis.conf \
-p:6379:6379 --name wechat-redis redis \
redis-server /usr/local/etc/redis/redis.conf --appendonly yes

# config app
docker exec -it wechat-redis redis-cli -a $auth HMSET app:yiz:config appid $appid secret $serect sessionExSeconds 86400
docker exec -it wechat-redis redis-cli -a $auth set app:authtoken $token

# app
docker run -d --network wechat-net \
-v /home/admin/wechat-auth:/home/admin/app \
-p:6001:7001 --name wechat-auth jiewei/wechat-auth
```

#### docker build & upload

```sh
docker build . -t jiewei/wechat-auth
docker push jiewei/wechat-auth
```

## nginx on centOS

https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-centos-7

```sh
sudo yum install epel-release
sudo yum install nginx
sudo systemctl start nginx

sudo firewall-cmd --permanent --zone=public --add-service=http
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --reload

sudo systemctl enable nginx
sudo systemctl restart nginx

vi /etc/nginx/nginx.conf
```

## debug lua in redis

```sh
redis-cli -p 6380  --eval phgetall.lua 0 , yiz:user:*
redis-cli -p 6380  --eval pget.lua 0 , app:*
```

## backup

```sh
docker cp wechat-redis:/data /home/admin/data/redis/`date +"%Y%m%d_%H%M%S"`
```

[egg]: https://eggjs.org



