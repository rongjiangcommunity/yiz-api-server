'use strict';
const camelcase = require('camelcase');

/**
 * 权限设计
 * 系统管理员：admin
 * 年纪管理员：gadmin
 * 班级管理员：cadmin
 * 校友：xiaoyou
 * 普通用户：''
 */
const ADMIN = 'admin';
const CADMIN = 'cadmin';
const GADMIN = 'gadmin';
const XIAOYOU = 'xiaoyou';

exports.ADMIN = ADMIN;
exports.CADMIN = CADMIN;
exports.GADMIN = GADMIN;
exports.XIAOYOU = XIAOYOU;
/**
 * CADMIN: 班级管理员
 * GADMIN: 年级管理员
 * ADMIN: 管理员
 */
exports.roles = ['', XIAOYOU, CADMIN, GADMIN, ADMIN];


/**
 * 校友认证状态
 */
const OK = 'ok';
const NOT_OK = 'notok';
const PENDING = 'pending';

exports.OK = OK;
exports.NOT_OK = NOT_OK;
exports.PENDING = PENDING;
exports.statusEnum = [OK, NOT_OK, PENDING];

exports.bookingStatusEnum = ['wait', 'active', 'completed', 'failed', 'cancel'];

/**
 * @param {string} appid
 * @param {string} openid
 * @param {string} formId
 */
exports.saveFormId = async function(appid, openid, formId) {
  if (!formId || formId.indexOf('mock')>=0) {
    return;
  }
  if (!checkFormId(formId)) {
    return;
  }
  // @ts-ignore
  const redis = /** @type {MyTypes.Redis} */(this.ctx.app.redis.get('redis'));
  const key = `${appid}:form_ids:${openid}`;
  // @ts-ignore
  await redis.zadd(key, Date.now(), formId);

  // @ts-ignore
  this.ctx.logger.info('formId.save', appid, openid, formId);
};
/**
 * @param {string} appid
 * @param {string} openid
 */
exports.getFormId = async function(appid, openid) {
  // @ts-ignore
  const redis = /** @type {MyTypes.Redis} */(this.ctx.app.redis.get('redis'));
  // 7days
  const senvenDaysInSeconds = 7*24*60*60;
  // 10min
  const THRESHOLD = 10*60;

  const key = `${appid}:form_ids:${openid}`;
  // zpopmin: Available since 5.0.0.
  // @ts-ignore
  let [formId, ts] = await redis.zpopmin(key);
  ts = Number(ts);
  while (formId) {
    if (checkFormId(formId) && ts+senvenDaysInSeconds*1000-THRESHOLD*1000 > Date.now()) {
      break;
    }
    // @ts-ignore
    [formId, ts] = await redis.zpopmin(key);
  }
  // @ts-ignore
  this.ctx.logger.info('formId.get', appid, openid, formId);

  return formId;
};

/**
 * @param {{[key: string]: any}} o
 */
function camelcaseKeys(o) {
  return tranformKeys(o, camelcase);
}
/**
 * @param {{[key: string]: any}} o
 * @param {function} fn
 */
function tranformKeys(o, fn) {
  const u = {};
  Object.keys(o).forEach(key => {
    // @ts-ignore
    u[fn(key)] = o[key];
  });
  return u;
}
/**
 * @param {string} formId
 */
function checkFormId(formId) {
  return /^[\d\w]{32}$/.test(formId);
}

exports.camelcaseKeys = camelcaseKeys;
exports.tranformKeys = tranformKeys;

exports.msgStatusEnum = ['created', 'active', 'finished', 'closed', 'timeout'];
exports.msgUndoneStatusEnum = ['created', 'active'];
exports.msgDoneStatusEnum = ['finished', 'closed', 'timeout'];


