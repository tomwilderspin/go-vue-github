import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';

const CORE_WASM = 'wasm/lib.wasm';

Vue.config.productionTip = false;

const initCoreApp = wasmFile => {
  const go = new global.Go();
  if (!WebAssembly.instantiateStreaming) {
    // polyfill [safari]
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
      const source = await (await resp).arrayBuffer();
      return WebAssembly.instantiate(source, importObject);
    };
  }
  return new Promise((res, rej) => {
    WebAssembly.instantiateStreaming(fetch(wasmFile), go.importObject)
      .then(result => {
        const goRun = go.run(result.instance);
        const install = vueInstance => {
          console.log('installed app core');
          vueInstance.prototype.$appCore = {
            add: global.add,
            subtract: global.subtract,
          };
        };
        res({ install });
        return goRun;
      })
      .catch(error => {
        console.error('go wasm core lib error:', error);
        rej(error);
        throw error;
      });
  });
};

// init core lib
initCoreApp(CORE_WASM)
  .then(coreApp => Vue.use(coreApp))
  .catch(error => {
    console.error('failed to init core application', error);
    throw error;
  });

// create new Vue App
new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');
