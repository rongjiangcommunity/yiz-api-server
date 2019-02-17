'use strict';

module.exports = app => {
  app.beforeStart(async () => {
    // fetch all appid & secret
    app.config.wechat.appConf = app.config.wechat.appConf || {};
    const apps = app.config.wechat.apps || [];

    const result = await Promise.all(apps.map(a => {
      return app.redis.get('redis').hgetall(`app:${a}`);
    }));
    apps.forEach((a, i) => {
      if (result[i]) {
        app.config.wechat.appConf[a] = result[i];
      }
    });
  });
};
