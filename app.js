'use strict';

module.exports = app => {
  app.beforeStart(async () => {
    // fetch miniapps's appid & secret
    app.config.wechat.miniAppConf = app.config.wechat.miniAppConf || {};
    const miniApps = app.config.wechat.miniApps || [];

    const result = await Promise.all(miniApps.map(mini => {
      return app.redis.get('redis').hgetall(`miniapp:${mini}`);
    }));
    miniApps.forEach((mini, i) => {
      if (result[i]) {
        app.config.wechat.miniAppConf[mini] = result[i];
      }
    });
  });
};
