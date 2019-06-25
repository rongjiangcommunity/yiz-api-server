'use strict';

exports.redis = {
  clients: {
    redis: {
      port: 6379,
      host: '$host',
      password: '$password',
      db: 0,
    },
  },
};

exports.mysql = {
  clients: {
    yiz: {
      host: '$host',
      port: '3306',
      user: 'yizhong',
      password: '$password',
      database: 'yiz',
      timezone: 'utc',
    },
  },
};
