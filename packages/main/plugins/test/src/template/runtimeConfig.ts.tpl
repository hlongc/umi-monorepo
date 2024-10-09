import commonConfig from '{{{dir}}}/common';
import diffConfig from '{{{dir}}}/{{{projectEnvVar}}}';
import type { AsyncConfig, CommonConfig, DiffConfig } from '{{{dir}}}/interface';
import { RUNTIME_CONFIG_WINDOW_CONFIG_KEY } from './constants';

export const runtimeConfig = { ...commonConfig, ...diffConfig } as AsyncConfig & CommonConfig & DiffConfig;

// window上挂一份，保特殊场景。
window[RUNTIME_CONFIG_WINDOW_CONFIG_KEY] = runtimeConfig;
{{^isPrd}}
console.log('{{{appName}}}最新runtimeConfig', runtimeConfig);
{{/isPrd}}

export const mergeRuntimeConfig = (asyncConfig: Partial<AsyncConfig>) => {
  Object.assign(runtimeConfig, asyncConfig);
  {{^isPrd}}
  console.log('{{{appName}}}最新runtimeConfig', runtimeConfig);
  {{/isPrd}}
};
