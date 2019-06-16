'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const {router, controller} = app;
  const isWxLogin = app.middleware.isWxLogin();
  router.get('/', controller.home.index);

  router.post('/api/wechat/redeem', controller.wechat.redeem);
  router.post('/api/wechat/expire', controller.wechat.expire);
  router.post('/api/wechat/decrypt/:sid', isWxLogin, controller.wechat.decrypt);
};
