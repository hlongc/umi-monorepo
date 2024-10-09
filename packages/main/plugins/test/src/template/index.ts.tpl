// 不能暴露，不能和runtimeConfig一起在一个地方暴露，umi@4较低版本会引起循环引用。使用的时候稍微写长一些 @@/plugin-runtimeConfig/defineConfig
// export {defineCommonRuntimeConfig, defineDiffRuntimeConfig} from './defineConfig';
export {
  runtimeConfig,
  mergeRuntimeConfig
} from './runtimeConfig';

export {loadRemoteRuntimeConfig} from './loadRemoteRuntimeConfig';

export {
  RUNTIME_CONFIG_TENANT_ID_LOCALSTORAGE_KEY,
  RUNTIME_CONFIG_WINDOW_CONFIG_KEY,
} from './constants';
