import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import base from './base'//引用

//require("./js/pkcs10/pkcs10.js")
//const usechain = require("./js/usechain.js")

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
Vue.use(base);//将全局函数当做插件来进行注册

/* eslint-disable no-new */
var vm=new Vue({
  components: { App },
  router,
  store,

  template: '<App/>',

}).$mount('#app')
