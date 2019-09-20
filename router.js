const router = require('express').Router();

const usersController = require('./controller/controller');


router.post('/login', (req, res, next) => {
  usersController.login(req, res, next)
})

router.post('/register', (req, res, next) => {
  usersController.register(req, res, next)
})

router.get('/getnow', (req, res, next) => {
  usersController.getnow(req, res, next)
})

router.post('/repass', (req, res, next) => {
  usersController.repass(req, res, next)
})

router.post('/nickname', (req, res, next) => {
  usersController.nickname(req, res, next)
})

router.post('/collect', (req, res, next) => {
  usersController.collect(req, res, next)
})

router.get('/cancelcol', (req, res, next) => {
  usersController.cancelcol(req, res, next)
})

router.get('/colList', (req, res, next) => {
  usersController.colList(req, res, next)
})



router.post('/reavatar', (req, res, next) => {
  usersController.reavatar(req, res, next)
})

router.get('/logout',(req, res, next) => {
  usersController.logout(req, res, next)
})

module.exports = router