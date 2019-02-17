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
        host: 'redis',
        password: '',
        db: 0,
      },
    },
  };
  config.wechat = {
    jscode2session: 'https://api.weixin.qq.com/sns/jscode2session',
    apps: [ 'yiz' ],
    appConf: {
      // [app_name]: {
      //   appid: '',
      //   secret: '',
      // },
    },
  };
  config.security = {
    csrf: {
      ignoreJSON: false,
      ignore: ctx => {
        const { request: { url: pathname } } = ctx;
        const csrfIgnore = [
          '/api',
        ];
        return csrfIgnore.some(item => pathname.indexOf(item) >= 0);
      },
    },
  };
  return config;
};

