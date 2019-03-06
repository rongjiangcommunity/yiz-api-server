'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const login = app.middleware.login();
  const {router, controller} = app;
  router.get('/', controller.home.index);

  router.post('/api/wechat/redeem', controller.wechat.redeem);
  router.post('/api/wechat/expire', controller.wechat.expire);
  router.get('/api/user/:id', login, controller.user.info);
  router.post('/api/user/:id', login, controller.user.save);

  // router.post('/api/wechat/approve', controller.wechat.approve);
};
