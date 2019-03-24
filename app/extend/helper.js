'use strict';

// * 系统管理员：admin
// * 年纪管理员：gadmin
// * 班级管理员：cadmin
// * 校友：xiaoyou
// * 普通用户：''

const ADMIN = 'admin';
const CADMIN = 'cadmin';
const GADMIN = 'gadmin';
const XIAOYOU = 'xiaoyou';
const roles = ['', XIAOYOU, CADMIN, GADMIN, ADMIN];

exports.roles = roles;
exports.ADMIN = ADMIN;
exports.CADMIN = CADMIN;
exports.GADMIN = GADMIN;
exports.XIAOYOU = XIAOYOU;
