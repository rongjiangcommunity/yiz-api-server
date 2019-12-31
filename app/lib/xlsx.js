'use strict';

const XLSX = require('xlsx');
// http://rongjiangcommunity.cn/api/query/user/all
// const data = require('./data.json');
const data = {};
const users = Object.entries(data).map(([id, info]) => {
  return {
    wxid: id.replace('yiz:user:', ''),
    ...info,
  };
}).filter(i => i.approved === 'true' && !!i.experience);

const wb = XLSX.utils.book_new();
const sheet = XLSX.utils.json_to_sheet(users);

XLSX.utils.book_append_sheet(wb, sheet, 'SheetJS');
XLSX.writeFile(wb, 'yiz-user.xlsx');
