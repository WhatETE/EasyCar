<template>
    <el-popconfirm v-bind="popAttrs">
        <template #reference>
            <el-affix :offset="20" style="width:150px">
                <el-card v-bind="cardAttrs">
                    <el-row>
                        <el-col :span="10"><el-avatar :icon="UserFilled" /></el-col>
                        <el-col :span="14">
                            <el-row>
                                <el-text truncated tag="b">{{ store.state.user.username }}</el-text>
                            </el-row>
                            <el-row><el-button type="danger" round size="small">注销</el-button></el-row>
                        </el-col>
                    </el-row>
                </el-card>
            </el-affix>
        </template>
    </el-popconfirm>
    <el-container style="position:fixed; top:0px; width: 100%;">
        <el-main style="height: 90vh;">
            <Map v-if="menuIndex === '1'" @lotClicked="showDrawer" />
            <Orders v-else-if="menuIndex === '2'" />
        </el-main>
        <el-footer style="padding: 0%; height: 10vh;">
            <el-menu v-bind="menuAttrs" @select="menuSelected" style="height: 100%;">
                <el-menu-item index="1" style="width: 50%;">
                    <el-icon>
                        <mapLocation />
                    </el-icon>
                    <span>用车</span>
                </el-menu-item>
                <el-menu-item index="2" style="width: 50%;">
                    <el-icon>
                        <list />
                    </el-icon>
                    <span>订单</span>
                </el-menu-item>
            </el-menu>
        </el-footer>
    </el-container>
    <el-drawer v-model="drawerVisible" v-bind="drawerAttrs">
        <el-descriptions size="small" border>
            <el-descriptions-item label="名称">{{ parkingLot.name }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ parkingLot.address }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ parkingLot.lot_type }}</el-descriptions-item>
            <el-descriptions-item label="可用停车位">{{ parkingLot.available_spots }}</el-descriptions-item>
            <el-descriptions-item label="营业时间">{{ parkingLot.opening_time }}-{{ parkingLot.closing_time }}
            </el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <el-space fill style="width: 100%;">
            <el-card v-for="car in parkingLot.cars" :header="car.model" @click="showDialog(car)">
                <el-descriptions size="small" border>
                    <el-descriptions-item label="日租">￥{{ car.daily_price }}/日</el-descriptions-item>
                    <el-descriptions-item label="分时">￥{{ car.hourly_price }}/小时</el-descriptions-item>
                </el-descriptions>
            </el-card>
        </el-space>
    </el-drawer>
    <el-dialog v-model="dialogVisible" v-bind="dialogAttrs">
        <el-space direction="vertical" size="large" fill style="width: 100%;">
            <el-tabs v-model="activeName" stretch @tab-change="setDesItem">
                <el-tab-pane label="日租计费" name="daily">
                    <el-descriptions :column="1" border>
                        <el-descriptions-item v-for="(item, index) in descriptionItems" :label="item.label"
                            v-bind="desItemAttrs">
                            <template v-if="index === 3">
                                <el-input-number v-model="days" :min="1" :max="99"></el-input-number>
                            </template>
                            <template v-else>
                                {{ item.value() }}
                            </template>
                        </el-descriptions-item>
                    </el-descriptions>
                </el-tab-pane>
                <el-tab-pane label="分时计费" name="hourly">
                    <el-descriptions :column="1" border>
                        <el-descriptions-item v-for="(item, index) in descriptionItems" :label="item.label"
                            v-bind="desItemAttrs">
                            {{ item.value() }}
                        </el-descriptions-item>
                    </el-descriptions>
                </el-tab-pane>
            </el-tabs>
            <el-row justify="space-between">
                <el-col :span="11"><el-button v-bind="dialogButtonAttrs"
                        @click="dialogClose(); dialogVisible = false">取消</el-button></el-col>
                <el-col :span="11"><el-button type="success" v-bind="dialogButtonAttrs"
                        @click="placeOrder">确认订单</el-button></el-col>
            </el-row>
        </el-space>
    </el-dialog>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { MapLocation, List, UserFilled } from '@element-plus/icons-vue'
import { useStore } from 'vuex';
import axios from 'axios';
import Map from './Map.vue';
import Orders from './Orders.vue';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

const drawerVisible = ref(false);
const dialogVisible = ref(false);

const activeName = ref('daily');
const parkingLot = ref({});
const menuIndex = ref('1');
const selectedCar = ref({});

const currentTime = ref(new Date().toLocaleString());
const days = ref(1);
const descriptionItems = ref([
    { label: '取车网点', value: () => parkingLot.value.name },
    { label: '车型', value: () => selectedCar.value.model },
    { label: '日租金', value: () => selectedCar.value.daily_price },
    { label: '租车天数', value: () => days.value },
    { label: '预估租金', value: () => selectedCar.value.daily_price * days.value },
    { label: '当前时间', value: () => currentTime.value }
]);

onMounted(() => {
    setInterval(() => {
        currentTime.value = new Date().toLocaleString();
    }, 1000);
});

const setDesItem = (name) => {
    if (name === 'hourly') {
        descriptionItems.value.splice(2, 3, { label: '计价', value: () => selectedCar.value.hourly_price });
    } else {
        descriptionItems.value.splice(2, 1, { label: '日租金', value: () => selectedCar.value.daily_price },
            { label: '租车天数', value: () => days.value },
            { label: '预估租金', value: () => selectedCar.value.daily_price * days.value });
    }
}

const showDrawer = (lotIndex) => {
    axios.get('http://localhost:3000/parking_lots/' + (lotIndex).toString()).then((res) => {
        parkingLot.value = res.data;
        drawerVisible.value = true;
    }).catch(err => {
        if (err.response) {
            ElMessage.error(err.response.data.error);
        } else {
            console.log(err);
        }
    });
}

const showDialog = (car) => {
    selectedCar.value = car;
    dialogVisible.value = true;
}

const menuSelected = (index) => {
    menuIndex.value = index;
}

const dialogClose = () => {
    if (activeName.value !== 'daily') {
        activeName.value = 'daily';
        setDesItem('daily');
    }
    days.value = 1;
}

const placeOrder = () => {
    axios.post('http://localhost:3000/place_order/', {
        orderType: activeName.value === 'daily' ? '日租' : '分时',
        startTime: new Date().toLocaleString().replace(/\//g, '-'),
        lotID: parkingLot.value.id,
        carID: selectedCar.value.id,
    }).then(res => {
        ElMessage({
            message: '订单创建成功',
            type: 'success',
        });
        dialogClose();
        dialogVisible.value = false;
        drawerVisible.value = false;
    }).catch(err => {
        if (err.response) {
            ElMessage.error(err.response.data.error);
        } else {
            console.log(err);
        }
    });
}

const popAttrs = {
    title: "确定退出登录？",
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    confirmButtonType: "danger",
    onConfirm: () => {
        store.commit('logout');
        router.push('/login');
    }
}

const cardAttrs = {
    id: "userInfo",
    shadow: 'always',
    bodyStyle: 'padding: 5px'
}

const menuAttrs = {
    mode: 'horizontal',
    ellipsis: false,
    defaultActive: '1'
}

const drawerAttrs = {
    title: "网点详情",
    direction: "btt",
    size: "80%",
    openDelay: 10
}

const dialogAttrs = {
    title: "订单创建",
    alignCenter: true,
    destroyOnClose: true,
    width: "90%",
    beforeClose: (done) => {
        dialogClose();
        done();
    }
}

const desItemAttrs = {
    labelAlign: "left",
    align: "right"
}

const dialogButtonAttrs = {
    round: true,
    style: "width: 100%;"
}
</script>

<style scoped>
#userInfo {
    width: 120px;
    border-radius: 40px;
    background-color: rgba(255, 255, 255, 0.5);
}
</style>