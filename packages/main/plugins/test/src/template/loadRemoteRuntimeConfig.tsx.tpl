import {mergeRuntimeConfig} from "./runtimeConfig";
import {ycfcRequestInstance, ytcRequestInstance} from "./http";
import {isEqual} from '{{{lodashPackage}}}';
import {
  RUNTIME_CONFIG_TENANT_ID_LOCALSTORAGE_KEY,
  RUNTIME_CONFIG_GLOBAL_CACHE_LOCALSTORAGE_KEY,
  RUNTIME_CONFIG_APP_CACHE_LOCALSTORAGE_KEY,
  RUNTIME_CONFIG_TENANT_CACHE_LOCALSTORAGE_KEY,
} from './constants';
import {showLoading, hideLoading} from './loading';

const request = async ({isFirst}:{isFirst: boolean})=>{
  const res = await Promise.all([
    // 开启环境配置才获取环境配置
    {{#isOpenEnv}}
    ycfcRequestInstance.request({
      url: '/web/client/configure/v1/item/public/getOne',
      params: {
        appCode: 'cfe-global',
        key: '{{{globalConfigKey}}}',
      },
      showWarn: isFirst,
    }),
    ycfcRequestInstance.request({
      url: '/web/client/configure/v1/item/public/getOne',
      params: {
        appCode: '{{{appCode}}}',
        key: '{{{configKey}}}',
      },
      showWarn: isFirst,
    }),
    {{/isOpenEnv}}
    {{^isOpenEnv}}
    null,null,
    {{/isOpenEnv}}
    // 开启租户配置且运行时非子应用才能获取租户配置
    {{#isOpenTenant}}
      ytcRequestInstance.request({
      url: '/api/infra/tenant/config',
      method: 'POST',
      data: {
        key: 'identity_app',
        /**
         * 本地开发时，用localStorage里的id，没有就cscec兜底。
         * 环境上运行时，如果localStorage里没id值，就用域名。
         */
        ...(process.env.NODE_ENV === 'production' && !localStorage.getItem(RUNTIME_CONFIG_TENANT_ID_LOCALSTORAGE_KEY)
          ? {
            tenantDomainName: window.location.hostname,
          }
          : {
            tenantId: localStorage.getItem(RUNTIME_CONFIG_TENANT_ID_LOCALSTORAGE_KEY) ?? 'cscec',
          }),
      },
      showWarn: isFirst,
    })
    {{/isOpenTenant}}
    {{^isOpenTenant}}
    null
    {{/isOpenTenant}}
  ]);

  console.log('远程配置请求成功');

  {{#isOpenEnv}}
  const globalEnvConfigRes = res[0] as unknown as EnvConfigRes;
  const appEnvConfigRes = res[1] as unknown as EnvConfigRes;

  let globalEnvConfig;
  let appEnvConfig;
  try {
    globalEnvConfig = JSON.parse(globalEnvConfigRes.value);
    appEnvConfig = JSON.parse(appEnvConfigRes.value);
  } catch (e) {
    console.error('远程环境配置参数JSON.parse失败')
    console.error(e);
  }
  {{/isOpenEnv}}

  {{#isOpenTenant}}
  const tenantConfigConfigRes = res[2];
  const tenantConfig = tenantConfigConfigRes?.[0];
  {{/isOpenTenant}}

  return {
    {{#isOpenEnv}}
    globalEnvConfig,
    appEnvConfig,
    {{/isOpenEnv}}
    {{#isOpenTenant}}
    tenantConfig,
    {{/isOpenTenant}}
  };
}

export const loadRemoteRuntimeConfig = async ()=>{
  const globalEnvCacheStr = localStorage.getItem(RUNTIME_CONFIG_GLOBAL_CACHE_LOCALSTORAGE_KEY);
  const appEnvCacheStr = localStorage.getItem(RUNTIME_CONFIG_APP_CACHE_LOCALSTORAGE_KEY);
  let globalEnvCache;
  let appEnvCache;
  try {
    globalEnvCache = JSON.parse(globalEnvCacheStr);
    appEnvCache = JSON.parse(appEnvCacheStr);
  }catch (e){}

  {{#isOpenTenant}}
  const tenantCacheStr = localStorage.getItem(RUNTIME_CONFIG_TENANT_CACHE_LOCALSTORAGE_KEY);
  let tenantCache;
  try {
    tenantCache = JSON.parse(tenantCacheStr);
  }catch (e){}
  {{/isOpenTenant}}

  if(
    globalEnvCache
    && appEnvCache
    {{#isOpenTenant}}
    && tenantCache
    {{/isOpenTenant}}
  ){
    const allConfig = {
      ...globalEnvCache,
      ...appEnvCache,
    };

    {{#isOpenTenant}}
    allConfig['{{{tenantConfigMountField}}}'] = tenantCache;
    {{/isOpenTenant}}

    mergeRuntimeConfig(allConfig);

    const beforeRequestTimeStamp = Date.now();
    // 偷偷去请求，比对。
    request({isFirst: false}).then((remoteRes)=>{
      if(
        isEqual(globalEnvCache, remoteRes.globalEnvConfig)
        && isEqual(appEnvCache, remoteRes.appEnvConfig)
        {{#isOpenTenant}}
        && isEqual(tenantCache, remoteRes.tenantConfig)
        {{/isOpenTenant}}
      ){
        return;
      }

      // 如果两者不相等，先存缓存
      localStorage.setItem(RUNTIME_CONFIG_GLOBAL_CACHE_LOCALSTORAGE_KEY, JSON.stringify(remoteRes.globalEnvConfig));
      localStorage.setItem(RUNTIME_CONFIG_APP_CACHE_LOCALSTORAGE_KEY, JSON.stringify(remoteRes.appEnvConfig));
      {{#isOpenTenant}}
      localStorage.setItem(RUNTIME_CONFIG_TENANT_CACHE_LOCALSTORAGE_KEY, JSON.stringify(remoteRes.tenantConfig));
      {{/isOpenTenant}}

      // 1. 700ms内，直接刷新
      const afterRequestTimeStamp = Date.now();
      if(afterRequestTimeStamp - beforeRequestTimeStamp <= 700){
        window.location.reload();
        return;
      }
      // 2. 否则弹提示，就弹提示建议用户更新
      const isUpdate = window.confirm('检测到配置有更新，为了您的使用体验请点击确定更新')
      if(isUpdate){
        window.location.reload();
      }
    })
    return;
  }

  showLoading();

  const {
    globalEnvConfig,
    appEnvConfig,
    {{#isOpenTenant}}
    tenantConfig
    {{/isOpenTenant}}
  } = await request({isFirst: true});

  hideLoading();

  localStorage.setItem(RUNTIME_CONFIG_GLOBAL_CACHE_LOCALSTORAGE_KEY, JSON.stringify(globalEnvConfig));
  localStorage.setItem(RUNTIME_CONFIG_APP_CACHE_LOCALSTORAGE_KEY, JSON.stringify(appEnvConfig));

  const allConfig = {
    ...globalEnvConfig,
    ...appEnvConfig,
  };

  {{#isOpenTenant}}
  localStorage.setItem(RUNTIME_CONFIG_TENANT_CACHE_LOCALSTORAGE_KEY, JSON.stringify(tenantConfig));
  allConfig['{{{tenantConfigMountField}}}'] = tenantConfig;
  {{/isOpenTenant}}

  mergeRuntimeConfig(allConfig);
}

interface EnvConfigRes{
  key: string;
  orgCode: string;
  orgId: number;
  releaseKey: string;
  value: string;
}
