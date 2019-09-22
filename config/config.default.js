// @ts-nocheck
'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1532792034463_1808';

  // add your config here
  config.middleware = [];

  config.redis = {
    clients: {
      redis: {
        port: 6379,
        host: 'yiz-redis',
        password: '',
        db: 0,
      },
    },
  };
  exports.mysql = {
    clients: {
      yiz: {
        host: 'mysql',
        port: '3306',
        user: 'yizhong',
        password: '$password',
        database: 'yiz',
        timezone: 'utc',
      },
    },
  };
  config.wechat = {
    jscode2session: 'https://api.weixin.qq.com/sns/jscode2session',
    apps: ['yiz'],
    appConf: {
      // [app_name]: {
      //   appid: '',
      //   secret: '',
      // },
    },
  };
  config.security = {
    domainWhiteList: ['https://jyyizhong.web.app'],
    csrf: {
      ignoreJSON: false,
      ignore: ctx => {
        const {request: {url: pathname}} = ctx;
        const csrfIgnore = [
          '/api',
        ];
        return csrfIgnore.some(item => pathname.indexOf(item) >= 0);
      },
    },
  };
  config.authtoken = '';
  return config;
};
