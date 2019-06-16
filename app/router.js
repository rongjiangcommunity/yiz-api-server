'use strict';

const {CADMIN} = require('./extend/helper');

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const isWxLogin = app.middleware.isWxLogin();
  const authtoken = app.middleware.authToken();
  const checkRole = app.middleware.checkRole;
  const prereview = app.middleware.prereview();

  const {router, controller: c} = app;
  router.get('/', c.home.index);

  router.post('/api/wechat/redeem', c.wechat.redeem);
  router.post('/api/wechat/expire', c.wechat.expire);
  router.post('/api/wechat/decrypt/:sid', isWxLogin, c.wechat.decrypt);
  // TODO: @deprecated
  router.post('/api/wechat/:sid/decrypt', isWxLogin, c.wechat.decrypt);

  router.get('/api/user/:sid', isWxLogin, c.user.info);
  router.post('/api/user/:sid', isWxLogin, c.user.save);
  router.post('/api/user/feedback/:sid', isWxLogin, c.user.feedback);

  const reviweMiddlewares = [isWxLogin, checkRole(CADMIN), prereview];
  router.post('/api/user/apply/:sid', isWxLogin, c.register.applyFor);
  router.get('/api/user/apply/:sid', isWxLogin, c.register.applyInfo);
  router.get('/api/user/reviewlist/:sid', isWxLogin, checkRole(CADMIN), c.register.reviewList);
  // eslint-disable-next-line max-len
  router.get('/api/user/reviewhistory/:sid', isWxLogin, checkRole(CADMIN), c.register.reviewHistory);
  router.get('/api/user/review/:sid/:uid', ...reviweMiddlewares, c.register.reviewInfo);
  router.post('/api/user/review/:sid/:uid', isWxLogin, checkRole(CADMIN), c.register.review);

  router.get('/api/query/hgetall/:pattern', authtoken, c.home.phgetall);
  router.get('/api/query/get/:pattern', authtoken, c.home.pget);
};
