<template>
    <el-container>
        <el-main>
            <el-card header="我的订单">
                <el-collapse accordion>
                    <el-collapse-item v-for="(order) in orders">
                        <template #title>
                            <el-container direction="vertical" style="width: 90%;">
                                <el-row style="width: 100%;">
                                    <el-col :span="16">
                                        <el-row>{{ order.order_type }}</el-row>
                                        <el-row>{{ new Date(order.start_time).toLocaleDateString() }}</el-row>
                                    </el-col>
                                    <el-col :span="8">
                                        <el-row v-if="order.is_paid === null" v-bind="rowAttrs">进行中</el-row>
                                        <template v-else>
                                            <el-row v-bind="completedRowAttrs">{{ order.is_paid === 1 ? '已完成' : '待支付'
                                            }}</el-row>
                                            <el-row v-bind="completedRowAttrs">￥{{ order.price }}</el-row>
                                        </template>
                                    </el-col>
                                </el-row>
                                <el-divider style="margin-bottom: 0%;" />
                            </el-container>
                        </template>
                        <el-space direction="vertical" fill size="large" style="width: 100%;">
                            <el-descriptions :column="1" border>
                                <el-descriptions-item label="车型">{{ order.model }}</el-descriptions-item>
                                <el-descriptions-item label="取车网点">{{ order.pickup_lot }}</el-descriptions-item>
                                <el-descriptions-item label="还车网点">{{ order.return_lot ? order.return_lot : '无' }}
                                </el-descriptions-item>
                                <el-descriptions-item label="开始时间">
                                    {{ new Date(order.start_time).toLocaleString() }}
                                </el-descriptions-item>
                                <el-descriptions-item label="结束时间">
                                    {{ order.end_time ? new Date(order.end_time).toLocaleString() : '无' }}
                                </el-descriptions-item>
                            </el-descriptions>
                            <template v-if="order.is_paid === null">
                                <el-row justify="center">
                                    <el-select v-model="lotName">
                                        <el-option label="Station 1" value="Station 1"></el-option>
                                        <el-option label="Station 2" value="Station 2"></el-option>
                                        <el-option label="Station 3" value="Station 3"></el-option>
                                    </el-select>
                                </el-row>
                                <el-row justify="center">
                                    <el-button type="success" round @click="completeOrder(order.id)"
                                        style="width:70%">完成订单</el-button>
                                </el-row>
                            </template>
                            <el-button v-else-if="order.is_paid === 0" type="primary" round @click="payOrder(order.id)"
                                style="width: 70%;">支付</el-button>
                        </el-space>
                    </el-collapse-item>
                </el-collapse>
            </el-card>
        </el-main>
    </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';

const store = useStore();

const orders = ref([]);
const lotName = ref('');

const getOrders = () => {
    axios.get('http://localhost:3000/orders/' + store.state.user.userID).then((res) => {
        orders.value = res.data;
    }).catch(err => {
        if (err.response) {
            ElMessage.error(err.response.data.error);
        } else {
            console.log(err);
        }
    });
}

onMounted(() => {
    getOrders();
});

const completeOrder = (id) => {
    if (!lotName.value) {
        ElMessage.error('请选择还车网点');
        return;
    }
    console.log(id);
    axios.post('http://localhost:3000/complete_order/' + id, {
        lotName: lotName.value
    }).then(res => {
        orders.value = [];
        getOrders();
        ElMessage({
            message: '订单完成，待支付',
            type: 'success',
        });
    }).catch(err => {
        if (err.response) {
            ElMessage.error(err.response.data.error);
        } else {
            console.log(err);
        }
    });
}

const payOrder = (id) => {
    axios.post('http://localhost:3000/pay_order/' + id).then(res => {
        orders.value = [];
        getOrders();
        ElMessage({
            message: '支付成功',
            type: 'success',
        });
    }).catch(err => {
        if (err.response) {
            ElMessage.error(err.response.data.error);
        } else {
            console.log(err);
        }
    });
}

const rowAttrs = {
    justify: "center",
    style: "height: 100%; align-content: center"
}

const completedRowAttrs = {
    justify: "center",
    style: "height: 50%; align-content: center"
}

</script>

<style scoped>
::v-deep .el-collapse {
    margin-bottom: 24px;
}

::v-deep .el-collapse-item {
    margin-top: 24px;
}

::v-deep .el-collapse-item__header {
    height: unset;
    line-height: unset;
}
</style>