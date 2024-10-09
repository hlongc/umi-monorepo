import {IApi} from "umi";

export const getRuntimeConfigDir = (api: IApi)=>{
  return api.userConfig.runtimeConfig?.dir ?? '@/runtime-config'
}
