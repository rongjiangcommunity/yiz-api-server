'use strict';

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
