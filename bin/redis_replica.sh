#!/bin/bash

HOME=$(eval echo ~$user)
BIN_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

MASTER_AUTH=
MASTER_HOST='111.230.144.172'


redis_dir=$HOME/data/yiz-redis
mkdir -p $redis_dir

# Help
THIS="$(basename "$0")"
usage() {
  cat <<!
$BIN_PATH/${THIS} [options]

启动redis数据备份

启动本地redis后，进入容器：docker exec -it wechat-redis redis-cli

options:
  -i 显示帮助信息
  -a auth of master
  -h host of master
!
}

while getopts "ia:h:" opt; do
  case $opt in
    i)
      usage
      exit 0
      ;;
    a)
      MASTER_AUTH=$OPTARG
      ;;
    h)
      MASTER_HOST=$OPTARG
  esac
done

if docker network ls | grep my-net > /dev/null 2>&1;then
  echo '[INFO] my-net existed'
else
  docker network create my-net
fi

if docker ps -f 'name=redis' | grep wechat-redis > /dev/null 2>&1; then
  echo 'wechat-redis existed'
else
  docker run -d -it --network my-net \
  -v $redis_dir:/data \
  --name wechat-redis redis redis-server \
  --appendonly yes
fi

docker exec -it wechat-redis redis-cli config set masterauth $MASTER_AUTH
docker exec -it wechat-redis redis-cli SLAVEOF $MASTER_HOST 6379
