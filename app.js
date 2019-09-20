const express = require('express');

const router = require('./router');
// const verifyRouter = require('./verifyRouter');
const bodyParser = require('body-parser')

const jwt = require('jsonwebtoken');

const app = express();


//服务端跨域设置
app.use(function (req, res, next) {
  // 允许请求的源
  res.setHeader('Access-Control-Allow-Origin', "*")
  // 允许请求的方法
  res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS")
  // 允许所有的头
  res.setHeader("Access-Control-Allow-Headers", "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization")
  next()
})


app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json({
  limit: '21000kb'
}))

const session = require('express-session');
// 全局配置session
app.use(session({
  secret: 'abcde',
  name: 'sessionId',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}))

const path = require('path');


//前端通过服务器地址查看图片
app.use('/upload', function (req, res, next) {
  // console.log(req.url)
  res.sendFile(path.join(__dirname, '/upload', req.url))
})


// 获取验证码
const usersController = require('./controller/controller');
app.use('/verify', (req, res, next) => {
  usersController.verify(req, res, next)
});

// 首页进入答题
const subController = require('./controller/subContrller');
app.use('/subject', (req,res,next) => {
  subController.subject(req,res,next)
})

app.use('/users', function (req, res, next) {
  // console.log(req.url.endsWith('/login'))
  if (req.url.endsWith('/login') || req.url.endsWith('/register')) {
    next();
  } else {
    jwt.verify(req.headers.authorization,
      "secret",
      (err, data) => {
        if (err) {
          res.send({
            meta: {
              msg: "登录验证已过期，请重新登录",
              status: 403
            }
          })
        } else {
          next()
        }
      })
  }
})

app.use('/users', router);

app.listen(9999, function () {
  console.log("已连接服务器，http://localhost:9999")
})