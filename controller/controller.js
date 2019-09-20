var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var fs = require('fs');

// 引入验证码模块
var svgCaptcha = require('svg-captcha');

// 引入token
var jwt = require('jsonwebtoken');

// mysql配置
var config = require('./conf/config');
var {
  userSqls
} = require('./sqls/sqls');

var pool = mysql.createPool(config.mysql);



// 验证码
var verify = function (req, res, next) {
  var captcha = svgCaptcha.create({
    size: 4, // 验证码长度
    ignoreChars: '0o1ilI', // 验证码字符中排除 0o1i
    noise: 2, // 干扰线条的数量
    color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
    background: '#cc9966', // 验证码图片背景颜色
    height: 36,
    width: 100
  });
  //将文本验证码保存到session，方便做验证
  req.session.verify = captcha.text;
  console.log(req.session.verify)
  //返回图片地址，类型为svg图片
  res.type('svg')
  res.send(captcha.data);
}

// 登录
var login = function (req, res, next) {
  var param = req.body;
  var verifytext = req.session.verify;
  // console.log(req.req.session.verify)
  if (param.verify != verifytext) {
    res.send({
      meta: {
        msg: "验证码错误",
        status: 404
      }
    })
    return;
  }

  // 验证码正确，向数据库查询数据
  pool.getConnection(function (err, connection) {
    pool.query(userSqls.login, [param.username], function (err, result) {
      if (result.length === 0) {
        res.send({
          meta: {
            msg: "用户名不存在",
            status: 404
          }
        })
      } else {
        if (result[0].password != param.password) {
          res.send({
            meta: {
              msg: "密码错误",
              status: 404
            }
          })
        } else {
          // 登陆成功，移出返回项中的密码 ，并设置token
          var token = jwt.sign({
              username: param.username
            },
            "secret", {
              expiresIn: '24h'
            }
          )

          req.session.token = token;
          req.session.username = param.username;
          // console.log(token)

          result[0].token = token;
          delete result[0].password;
          res.send({
            data: result[0],
            meta: {
              msg: "登录成功",
              status: 200
            }
          })
        }
      }

    })

    connection.release()
  })

}

// 注册
var register = function (req, res, next) {
  // 解构前端参数
  var {
    username,
    password,
    nickname,
    avatar
  } = req.body;
  // console.log(avatar)
  // 非空判断
  if (!username || !password || !nickname) {
    res.send({
      meta: {
        msg: "请补全注册信息",
        status: 404
      }
    });
    return;
  }

  pool.getConnection(function (err, connection) {
    // 先判断是否存在用户名
    pool.query(userSqls.getUser, [username], function (err, getres) {
      if (getres.length === 0) {
        // 不存在重名，可以注册
        // 已判断没有重名，处理头像base64的文件
        var base64Data = avatar.replace(/^data:image\/\w+;base64,/, "");
        var dataBuffer = Buffer.from(base64Data, 'base64');
        var avartarPath = "upload/" + username + ".png";
        fs.writeFile(avartarPath, dataBuffer, function (err) {
          if (err) {
            res.send(err);
          } else {
            // 如果头像写入成功
            avartarPath = 'http://songcn.nat123.cc:24130/' + avartarPath;
            pool.query(userSqls.register, [username, password, nickname, avartarPath], function (err, result) {
              if (err) {
                res.send({
                  meta: "注册失败",
                  status: 404
                })
              } else {
                res.send({
                  meta: {
                    msg: "注册成功",
                    status: 200
                  }
                })
              }
            })
          }
        });


      } else {
        res.send({
          meta: {
            msg: "该用户名已存在",
            status: 404
          }
        })
      }
    })
    connection.release();
  })
}

// 改昵称
var nickname = function (req, res, next) {
  let {
    username,
    nickname
  } = req.body;
  if (!username) {
    return;
  }

  pool.getConnection(function (error, connection) {
    pool.query(userSqls.nickname, [nickname, username], function (err, result) {
      if (err) {
        res.send({
          meta: {
            msg: "修改失败",
            status: 404
          }
        })
      } else {
        res.send({
          meta: {
            msg: "修改成功",
            status: 200
          }
        })
      }
    })
    connection.release()
  })
}

// 改密码
var repass = function (req, res, next) {
  let {
    username,
    password
  } = req.body;
  if (!username) {
    return;
  }
  pool.getConnection(function (error, connection) {
    pool.query(userSqls.repass, [password, username], function (err, result) {
      if (err) {
        res.send({
          meta: {
            msg: "修改失败",
            status: 404
          }
        })
      } else {
        res.send({
          meta: {
            msg: "修改成功",
            status: 200
          }
        })
      }
    })
    connection.release();
  })
}

// 退出
var logout = function (req, res, next) {
  req.session.destroy(function (err) {
    res.send({
      meta: {
        msg: "退出成功",
        status: 200
      }
    })
  })
}


// 当前登录用户数据
var getnow = function (req, res, next) {
  // res.send("获取当前登录用户数据")
  let username = req.session.username;
  if (!username) {
    return;
  }
  pool.getConnection(function (err, connection) {
    pool.query(userSqls.getnow, [username], function (err, result) {
      if (err) {
        res.send({
          meta: {
            msg: "获取失败",
            status: 404
          }
        })
      } else {
        res.send({
          data: result[0],
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

// 收藏题目
var collect = function (req, res, next) {
  let {
    username,
    collection
  } = req.body;
  let newCol;
  pool.getConnection(function (error, connection) {
    pool.query(userSqls.getCol, [username], function (err, result) {
      // 等到一个数组，里面是个对象
      // 直接将新的收藏拼接上
      if (result[0].collection == '') {
        newCol = collection
      } else if (result[0].collection.indexOf(collection) >= 0) {
        newCol = result[0].collection
      } else {
        newCol = result[0].collection + ',' + collection;
      }


      pool.query(userSqls.collect, [newCol, username], function (er, data) {
        res.send({
          meta: {
            msg: '收藏成功',
            status: 200
          }
        })
      })


    })

    connection.release()
  })
}

// 取消收藏
var cancelcol = function (req, res, next) {
  // 前端传来字符串
  let { username,collection } = req.query;
  console.log(collection)
  pool.getConnection(function(error,connection){
    pool.query( userSqls.cancelcol, [collection,username], function(err,result) {
      res.send({
        meta: {
          msg: "取消成功",
          status: 200
        }
      })
    })
    connection.release()
  }) 
}

// 收藏列表
var colList = function (req, res, next) {
  let {
    collection
  } = req.query;
  // 将传来的字符串解析
  let subjectsArr = collection.split(',');
  
  pool.getConnection(function (error, connection) {

    pool.query(userSqls.colList, [subjectsArr], function (err, result) {
      if (err) {
        res.send({
          meta: {
            msg: "获取失败",
            status: 404
          }
        })
      } else {
        res.send({
          data: result,
          collection,
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


// 修改头像
var reavatar = function (req, res, next) {
  let {
    avatar,
    username
  } = req.body;
  if (!username) {
    return;
  }
  // 处理头像base64的文件
  var base64Data = avatar.replace(/^data:image\/\w+;base64,/, "");
  var dataBuffer = Buffer.from(base64Data, 'base64');
  var avatarPath = "upload/" + username + ".png";
  fs.writeFile(avatarPath, dataBuffer, function (err) {
    if (err) {
      res.send({
        meta: {
          msg: '修改失败',
          status: 404
        }
      })
    } else {
      // 图片文件生成成功，修改数据库
      pool.getConnection(function (error, connection) {
        avatarPath = 'http://songcn.nat123.cc:24130/' + avatarPath;
        pool.query(userSqls.reavatar, [avatarPath, username], function (errorb, result) {
          if (err) {
            res.send({
              meta: {
                msg: '修改失败',
                status: 404
              }
            })
          } else {
            res.send({
              meta: {
                msg: "修改成功",
                status: 200
              },
              data: {
                avatar: avatarPath
              }
            })
          }
        })
      })
    }
  })
}


module.exports = {
  verify,
  login,
  register,
  nickname,
  repass,
  getnow,
  collect,
  cancelcol,
  reavatar,
  logout,
  colList
}