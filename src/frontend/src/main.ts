import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';

// Root component placeholder until App.vue is added
const Root = {
    template: `<router-view />`
};

const app = createApp(Root);
app.use(createPinia());
app.use(router);
app.mount('#app');