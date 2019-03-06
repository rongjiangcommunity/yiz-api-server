# wechat-auth

Auth server for wechat login

![img](https://developers.weixin.qq.com/miniprogram/dev/image/api-login.jpg?t=18080318)

refer to: https://developers.weixin.qq.com/miniprogram/dev/api/api-login.html

## API

* /api/wechat/redeem
* /api/wechat/expire

```sh
curl -X POST -H 'Content-Type: application/json' --data '{"code":"023ey3Ts00Gc8d1NH7Vs0RlZSs0ey3Ty", "appid":"yiz"}' 127.0.0.1:7001/api/wechat/redeem

curl -X POST -H 'Content-Type: application/json' --data '{"credentials":"yiz:f166d608e398a066f1016131e296069d2d9992b3c82a0b6ae09ec56fdcac42be"}' 127.0.0.1:7001/api/wechat/expire
```

## QuickStart

see [egg docs][egg] for more detail.

### Development

```sh
npm i
npm run dev
open http://localhost:7001/
```

### Deploy

#### start server

```sh
docker network create wechat-net

docker pull jiewei/wechat-auth
docker pull redis

docker run --network wechat-net --name wx-redis -d redis redis-server --appendonly yes

# set app config in db
docker exec -it redis redis-cli HMSET app:yiz appid ${appid} secret ${serect}

docker run -d --network wechat-net -p:6001:7001 --name wechat-auth jiewei/wechat-auth
```

#### build

```sh
docker build . -t jiewei/wechat-auth
```

## nginx on centsOS

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

```

[egg]: https://eggjs.org
