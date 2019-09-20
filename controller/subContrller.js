var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var fs = require('fs');

// mysql配置
var config = require('./conf/config');
var {
  subSqls
} = require('./sqls/sqls');

var pool = mysql.createPool(config.mysql);



let subject = function(req,res,next){
  let param = req.body;
  // 因为传的参数和数据库有区别，所以这里需要解析
  let plan = param.plan == 'rand' ? 'RAND()': "id";  // 选择不同的书序
  // 因为直接把字符串放到语句参数中，会有引号，无法识别，会失败，只有先拼接好在放进去
  sqls = subSqls.subjects + ' order by ' + plan + ' limit ' + param.num;
  pool.getConnection(function(error,connection){
    pool.query( sqls, function(err,result) {
      if(err){
        res.send({
          meta: {
            msg: "获取失败",
            status: 400
          },err
        })
      }else{
        res.send({
          data: result,
          meta: {
            msg: "获取成功",
            status: 200
          }
        })
      }
    })
    connection.release();
  })
}


module.exports = {
  subject
}