<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import CloseSvg from '@renderer/components/svg/Close.vue';

const props = defineProps<{
    tag: string;
    url: string;
    onSuccess: () => void;
    closePopUpSelf: () => void;
}>();

const webviewRef = ref<any>(null);

onMounted(() => {
    if (webviewRef.value) {
        webviewRef.value.addEventListener('did-navigate', (event: any) => {
            // Very basic check for login redirect or success pages
            // You can refine this based on actual platform behavior
            if (props.tag === 'bilibili' && event.url.includes('bilibili.com') && !event.url.includes('passport.bilibili.com') && !event.url.includes('sso.bilibili.com')) {
               props.onSuccess();
               props.closePopUpSelf();
            } else if (props.tag === 'netease' && event.url.includes('music.163.com') && !event.url.includes('login') && !event.url.includes('st.music.163.com')) {
               props.onSuccess();
               props.closePopUpSelf();
            }
        });
    }
});

function close() {
    props.closePopUpSelf();
}
</script>
<template>
    <div class="webview-login-overlay">
        <div class="webview-login-container">
            <div class="header">
                <span class="title">登录</span>
                <div class="close-btn" @click="close">
                    <CloseSvg style="width: 100%; height: 100%;" />
                </div>
            </div>
            <webview ref="webviewRef" class="login-webview" :src="props.url"></webview>
        </div>
    </div>
</template>
<style scoped>
.webview-login-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
}

.webview-login-container {
    width: 800px;
    height: 600px;
    background-color: var(--universal-bg-color, #ffffff);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.header {
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    background-color: var(--universal-header-bg-color, #f0f0f0);
    border-bottom: 1px solid #ddd;
}

.title {
    font-size: 14px;
    font-weight: bold;
    color: var(--universal-text-color, #333);
}

.close-btn {
    width: 20px;
    height: 20px;
    cursor: pointer;
    color: var(--universal-text-color, #333);
}

.login-webview {
    flex: 1;
    width: 100%;
}
</style>
