<template>
  <el-container class="container">
    <el-header height="30%" class="header">
      <el-text v-bind="headerTextAttrs">{{ registerMode ? '注册' : '登录' }}</el-text>
    </el-header>
    <el-main class="main">
      <el-form v-bind="formAttrs" style="width: 90%;">
        <el-form-item prop="username">
          <el-input v-model="ruleForm.username" placeholder="用户名" v-bind="inputAttrs"></el-input>
        </el-form-item>
        <el-form-item prop="phone" v-if="registerMode">
          <el-input v-model="ruleForm.phone" placeholder="手机号码" v-bind="inputAttrs"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="ruleForm.password" placeholder="密码" v-bind="passInputAttrs"></el-input>
        </el-form-item>
        <el-form-item prop="re_enter" v-if="registerMode">
          <el-input v-model="ruleForm.re_enter" placeholder="确认密码" v-bind="passInputAttrs"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button v-bind="buttonAttrs" @click="buttonClick">{{ registerMode ? '注册' : '登录' }}</el-button>
        </el-form-item>
      </el-form>
      <el-link v-if="!registerMode" type="primary" @click="forgotMode">忘记密码？</el-link>
    </el-main>
    <el-footer height="25%">
      <el-link disabled style="color: #606266;">{{ registerMode ? '已有帐户？' : '首次使用？' }}</el-link>
      <el-link type="primary" @click="switchMode">{{ registerMode ? '点我登录' : '点我注册' }}</el-link>
    </el-footer>
  </el-container>
  <el-dialog v-model="forgotFormVisible" v-bind="forgotDialogAttrs">
    <el-form v-bind="forgotFormAttrs">
      <el-form-item prop="username">
        <el-input v-model="ruleForgotForm.username" placeholder="用户名" v-bind="inputAttrs"></el-input>
      </el-form-item>
      <el-form-item prop="phone">
        <el-input v-model="ruleForgotForm.phone" placeholder="手机号码" v-bind="inputAttrs"></el-input>
      </el-form-item>
      <el-form-item prop="secretKey">
        <el-input v-model="ruleForgotForm.secretKey" placeholder="验证码：SCUT-CCF-2021" v-bind="inputAttrs"
          :prefix-icon="Unlock"></el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="ruleForgotForm.password" placeholder="密码" v-bind="passInputAttrs"></el-input>
      </el-form-item>
      <el-form-item prop="re_enter">
        <el-input v-model="ruleForgotForm.re_enter" placeholder="确认密码" v-bind="passInputAttrs"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button v-bind="buttonAttrs" @click="forgot">确认</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Key, Unlock } from '@element-plus/icons-vue';
import axios from 'axios';

const store = useStore();
const router = useRouter();

const registerMode = ref(false);
const forgotFormVisible = ref(false);

const clearInput = () => {
  if (form.value) {
    form.value.resetFields();
  }
  if (forgotForm.value) {
    forgotForm.value.resetFields();
  }
}
const switchMode = () => {
  registerMode.value = !registerMode.value;
  buttonAttrs.value.class = registerMode.value ? 'register-button' : 'login-button';
  clearInput();
}

const forgotMode = () => {
  forgotFormVisible.value = true;
  clearInput();
}

const buttonClick = computed(() => {
  return registerMode.value ? register : login;
});

const register = async () => {
  const vaild = await form.value.validate().catch(err => {
    console.log(err);
  });
  if (!vaild) {
    return false;
  }
  axios.post('http://localhost:3000/register', {
    username: ruleForm.value.username,
    password: ruleForm.value.password,
    phone: ruleForm.value.phone
  }).then(res => {
    ElMessage({
      message: '注册成功，请登录',
      type: 'success',
    });
  }).catch(err => {
    if (err.response) {
      ElMessage.error(err.response.data.error);
    } else {
      console.log(err);
    }
  })
};

const login = async () => {
  const vaild = await form.value.validate().catch(err => {
    console.log(err);
  });
  if (!vaild) {
    return false;
  }
  axios.post('http://localhost:3000/login', {
    username: ruleForm.value.username,
    password: ruleForm.value.password
  }).then(res => {
    store.commit('setToken', res.data.token);
    store.commit('setUser', {
      userID: res.data.userID,
      username: ruleForm.value.username
    });
    router.push('/main');
  }).catch(err => {
    if (err.response) {
      ElMessage.error(err.response.data.error);
    } else {
      console.log(err);
    }
  })
};

const forgot = async () => {
  const vaild = await forgotForm.value.validate().catch(err => {
    console.log(err);
  });
  if (!vaild) {
    return false;
  }
  console.log(ruleForgotForm.value.username, ruleForgotForm.value.phone, ruleForgotForm.value.password)
  axios.post('http://localhost:3000/forgot', {
    username: ruleForgotForm.value.username,
    phone: ruleForgotForm.value.phone,
    new_password: ruleForgotForm.value.password,
  }).then(res => {
    ElMessage({
      message: '密码修改成功，请登录',
      type: 'success',
    });
  }).catch(err => {
    if (err.response) {
      ElMessage.error(err.response.data.error);
    } else {
      console.log(err);
    }
  })
};

const headerTextAttrs = {
  tag: "b",
  size: "large",
  style: "font-size: 35px;"
};

const inputAttrs = {
  size: "large",
  class: "rounded-input",
  prefixIcon: User,
  maxlength: 20
};

const passInputAttrs = {
  size: "large",
  class: "rounded-input",
  type: "password",
  prefixIcon: Key,
  showPassword: true,
  maxlength: 20
};

const buttonAttrs = ref({
  type: "primary",
  size: "large",
  round: true,
  class: "login-button"
});

const forgotDialogAttrs = {
  title: "忘记密码",
  alignCenter: true,
  style: "border-radius: 30px; width: 90%;",
  beforeClose: (done) => {
    clearInput();
    done();
  }
};

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 10, message: '用户名应为3-10个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, max: 20, message: '密码应为5-20个字符', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3456789]\d{9}$/, message: '手机号码格式错误', trigger: 'blur' },
  ],
  secretKey: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^SCUT-CCF-2021$/, message: '验证码错误', trigger: 'blur' },
  ],
  re_enter: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { min: 5, max: 20, message: '密码应为5-20个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (registerMode.value && value !== ruleForm.value.password) {
          console.log(1, registerMode)
          callback(new Error('两次输入密码不一致'));
        }
        else if (!registerMode.value && value !== ruleForgotForm.value.password) {
          console.log(2)
          callback(new Error('两次输入密码不一致'));
        } else {
          callback();
        }
      }, trigger: 'blur'
    }
  ]
})

const ruleForm = ref({
  username: '',
  password: '',
  phone: '',
  re_enter: '',
});

const ruleForgotForm = ref({
  username: '',
  password: '',
  phone: '',
  secretKey: '',
  re_enter: '',
});

const form = ref(null);
const forgotForm = ref(null);

const formAttrs = {
  ref: form,
  rules: rules,
  model: ruleForm
}

const forgotFormAttrs = {
  ref: forgotForm,
  rules: rules,
  model: ruleForgotForm
}
</script>

<style scoped>
.container {
  justify-content: center;
  align-items: center;
  height: 100vh;
  /* 使用视口高度单位，使元素占满整个视口 */
}

.header {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.main {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
}

.rounded-input {
  --el-input-border-radius: 20px;
  --el-input-height: 50px;
  font-size: large;
}

.register-button {
  width: 100%;
  height: 55px;
  font-size: 20px;
  --el-button-bg-color: #3CB371;
  --el-button-text-color: white;
}

.login-button {
  width: 100%;
  height: 55px;
  font-size: 20px;
}
</style>