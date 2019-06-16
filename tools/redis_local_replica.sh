#!/bin/bash

HOME=$(eval echo ~$user)
TOOLS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

redis_dir=$HOME/data/wechat-redis
mkdir -p $redis_dir

# docker exec -it wechat-redis redis-cli
# MASTER_AUTH=$password ./tools/redis_local_replica.sh
# Help
THIS="$(basename "$0")"
usage() {
  cat <<!
$TOOLS_DIR/${THIS} [options]

启动redis本地数据备份

启动本地redis后，进入容器：docker exec -it wechat-redis redis-cli

options:
  -h  显示帮助信息
  -p master auth
!
}

while getopts "hp:" opt; do
  case $opt in
    h)
      usage
      exit 0
      ;;
    p)
      MASTER_AUTH=$OPTARG
      ;;
  esac
done

if docker network ls | grep wechat-net > /dev/null 2>&1;then
  echo '[INFO] wechat-net existed'
else
  docker network create wechat-net
fi

if docker ps -f 'name=redis' | grep wechat-redis > /dev/null 2>&1; then
  echo 'wechat-redis existed'
else
  docker run -d -it --network wechat-net \
  -v $redis_dir:/data \
  --name wechat-redis redis redis-server \
  --appendonly yes
fi

docker exec -it wechat-redis redis-cli config set masterauth $MASTER_AUTH
docker exec -it wechat-redis redis-cli SLAVEOF 111.230.144.172 6379
