module.exports = {
  userSqls: {
    // 注册
    register: "insert into users (username,password,nickname,avatar) values(?,?,?,?)",
    // 获取所有用户名,在注册前使用，判断是否存在用户名(也可以用于登录)
    getUser: "select username from users where username=?",
    // 登录
    login: "select * from users where username=?",
    //获取当前在线用户
    getnow: "select username,nickname,avatar,collection from users where username=?",
    // 修改头像
    reavatar: "update users set avatar=? where username=?",
    // 修改昵称
    nickname: "update users set nickname=? where username=?",
    // 修改密码
    repass: "update users set password=? where username=?",
    // 收藏
    // 首先要获取当前用户的收藏
    getCol: "select collection from users where username=?",
    collect: "update users set collection=? where username=?",

    // 获取收藏详情
    colList: "select * from subjects where id in (?)",

    // 取消收藏,和收藏一个原理，把前端删好的id字符串修改到数据库中
    cancelcol: "update users set collection=? where username=?"
  },

  subSqls: {
    // 由于数据比较庞大，这里就只做c1的题库，
    // 第1个表示排序，需要用一个对象解析 ASC顺序  rand()随机
    // 第2个表示数量
    subjects: "SELECT * from subjects"

  }
}