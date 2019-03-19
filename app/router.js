'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const checkLogin = app.middleware.checkLogin();
  const authtoken = app.middleware.authtoken();
  const {router, controller} = app;
  router.get('/', controller.home.index);

  router.post('/api/wechat/redeem', controller.wechat.redeem);
  router.post('/api/wechat/expire', controller.wechat.expire);
  router.get('/api/user/:id', checkLogin, controller.user.info);
  router.post('/api/user/:id', checkLogin, controller.user.save);

  router.get('/api/query/hgetall/:pattern', authtoken, controller.home.hgetallp);
  router.get('/api/query/get/:pattern', authtoken, controller.home.getp);
};
