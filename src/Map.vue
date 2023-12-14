<template>
    <div id="container"></div>
</template>

<script setup>
import { defineEmits, onMounted, onUnmounted } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";

const emit = defineEmits(['lotClicked']);

const lot_pos = [[113.392095, 23.04585], [113.406876, 23.053916], [113.371109, 23.050635]]; // 停车网点坐标

let map = null;


window._AMapSecurityConfig = {
    securityJsCode: 'a6e70e4dbde5df38c9fcd1be543eee98', // 安全密钥
};

onMounted(() => {
    AMapLoader.load({
        key: "8672190a015e4ab59ba0b61dddeff156", // 开发者Key
        version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    })
        .then((AMap) => {
            map = new AMap.Map("container", {
                viewMode: "3D", // 是否为3D地图模式
                zoom: 13.6, // 初始化地图级别
                zooms: [13.6, 20], // 限制地图级别
                center: [113.390479, 23.048806], // 初始化地图中心点位置
            });

            for (let i = 0; i < lot_pos.length; i++) { // 添加停车网点
                const marker = new AMap.Marker({
                    position: lot_pos[i],
                    map: map,
                    label: {
                        content: (i + 1).toString()
                    }
                });
                marker.on('click', function (e) {
                    if (e.originEvent.constructor === MouseEvent)
                        return;
                    emit('lotClicked', i + 1);
                });
            }
        })
        .catch((e) => {
            console.log(e);
        });
});

onUnmounted(() => {
    map?.destroy();
});

</script>

<style scoped>
#container {
    width: 100%;
    height: 90%;
    position: absolute;
    top: 0;
    left: 0;
}
</style>