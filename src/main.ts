import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import TippyPlugin from "./plugins/tippy";

import "./style.scss";

// import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(TippyPlugin);

app.mount("#app").$nextTick(() => {
  postMessage({ payload: "removeLoading" }, "*");
});
