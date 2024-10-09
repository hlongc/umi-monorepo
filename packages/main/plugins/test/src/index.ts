import type { IApi } from 'umi';
import * as path from 'path';
import * as fs from 'fs';
import * as Mustache from 'mustache';
import { getRuntimeConfigDir } from './utils';
import { winPath } from 'umi/plugin-utils';

const lodashPackage = winPath(path.dirname(require.resolve('lodash/package')));
const nprogressPackage = winPath(path.dirname(require.resolve('nprogress/package')));

export default (api: IApi) => {
  // 通过新增方法判断umi4
  const isUmi4 = typeof api.modifyAppData === 'function';

  // umi3 会将package自动注入 无法规避，如果没配置就不开
  if (!isUmi4 && !api.userConfig.runtimeConfig) {
    return;
  }

  // 项目环境标识（npm i的时候setup没有PROJECT_ENV，用local兜底）
  const projectEnvVar = process.env.PROJECT_ENV ?? 'local';

  // 远程环境标识
  const remoteEnvVar = projectEnvVar === 'local' ? 'dev' : projectEnvVar;

  const appName = api.userConfig.runtimeConfig?.remote?.env?.appCode ?? process.env.npm_package_name ?? '';

  const configKey = api.userConfig.runtimeConfig?.remote?.env?.configKey ?? `config_${remoteEnvVar}`;

  const globalConfigKey = api.userConfig.runtimeConfig?.remote?.env?.global?.configKey ?? configKey; // 如果global自己指定了key，那读他自己的

  // 配置文件目录
  const dir = getRuntimeConfigDir(api);

  // 获取生成临时文件地址，umi4自动有plugin-runtimeConfig，umi3要自己设
  const getTempDir = (path: string)=>{
    return isUmi4 ? path : `plugin-runtimeConfig/${path}`;
  }

  api.describe({
    key: 'runtimeConfig',
    config: {
      schema(joi) {
        return joi.object({
          dir: joi.string().optional(),
          remote: joi.object({
            manualLoad: joi.boolean().optional(),
            env: joi.object({
              configKey: joi.string().optional(),
              apiBaseUrl: joi.string().optional(),
              appCode: joi.string(),
              global: joi.object({
                configKey: joi.string().optional(),
              }).optional()
            }),
            tenant: joi.object({
              apiBaseUrl: joi.string().optional(),
              mountField: joi.string().optional(),
            }),
            org: joi.object({
              apiBaseUrl: joi.string().optional(),
              mountField: joi.string().optional(),
            }),
          }).optional()
        });
      },
    },
    enableBy: api.EnableBy.config,
  });

  api.onGenerateFiles(()=>{
    api.writeTmpFile({
      content: Mustache.render(
        fs.readFileSync(path.join(__dirname, 'template/constants.ts.tpl'), 'utf-8'),
        {
          appName,
          configKey,
          globalConfigKey,
        }
      ),
      path: getTempDir('constants.ts'),
    })

    api.writeTmpFile({
      content: Mustache.render(
        fs.readFileSync(path.join(__dirname, 'template/runtimeConfig.ts.tpl'), 'utf-8'),
        {
          appName,
          dir,
          isOpenRemote: !!api.userConfig.runtimeConfig?.remote,
          projectEnvVar,
          isPrd: projectEnvVar === 'prd',
        }
      ),
      path: getTempDir('runtimeConfig.ts'),
    })

    api.writeTmpFile({
      content: Mustache.render(
        fs.readFileSync(path.join(__dirname, 'template/http.ts.tpl'), 'utf-8'),
        {
          ycfcBaseUrl: api.userConfig.runtimeConfig?.remote?.env?.apiBaseUrl ?? {
            dev: '//agw.yzwdev.cn/ifs/ycfc',
            qa: '//agw.yzwqa.cn/ifs/ycfc',
            stg: '//agw-stg.yzw.cn/ifs/ycfc',
            prd: '//agw.yzw.cn/ifs/ycfc',
          }[remoteEnvVar],
          ytcBaseUrl: api.userConfig.runtimeConfig?.remote?.tenant?.apiBaseUrl ?? {
            dev: '//ytc.yzwdev.cn',
            qa: '//ytc.yzwqa.cn',
            stg: '//ytc-stg.yzw.cn',
            prd: '//ytc.yzw.cn',
          }[remoteEnvVar],
        }
      ),
      path: getTempDir('http.ts'),
    })

    api.writeTmpFile({
      content: Mustache.render(
        fs.readFileSync(path.join(__dirname, 'template/loadRemoteRuntimeConfig.tsx.tpl'), 'utf-8'),
        {
          appName,
          isOpenEnv: !!api.userConfig.runtimeConfig?.remote?.env,
          appCode: api.userConfig.runtimeConfig?.remote?.env?.appCode,
          isOpenTenant: !!api.userConfig.runtimeConfig?.remote?.tenant,
          tenantConfigMountField: api.userConfig.runtimeConfig?.remote?.tenant?.mountField ?? 'tenantConfig',
          configKey,
          globalConfigKey,
          lodashPackage,
        }
      ),
      path: getTempDir('loadRemoteRuntimeConfig.ts'),
    })

    api.writeTmpFile({
      content: Mustache.render(
        fs.readFileSync(path.join(__dirname, 'template/defineConfig.ts.tpl'), 'utf-8'),
        {
          dir,
        }
      ),
      path: getTempDir('defineConfig.ts'),
    })

    api.writeTmpFile({
      content: Mustache.render(
        fs.readFileSync(path.join(__dirname, 'template/index.ts.tpl'), 'utf-8'),
        {
        }
      ),
      path: getTempDir('index.ts'),
    })

    api.writeTmpFile({
      content: Mustache.render(
        fs.readFileSync(path.join(__dirname, 'template/loading.ts.tpl'), 'utf-8'),
        {
          nprogressPackage,
        }
      ),
      path: getTempDir('loading.ts'),
    })

  });

  if(!isUmi4){
    // @ts-ignore
    api.addUmiExports(() => [{
      exportAll: true,
      source: '../plugin-runtimeConfig/index',
    }, ])
  }

  if(api.userConfig.runtimeConfig?.remote && !api.userConfig.runtimeConfig?.remote?.manualLoad){
    // 重写入口文件umi.ts，将import编译为require，让entry代码执行完了之后再执行umi.ts
    api.onPrepareBuildSuccess(()=>{
      const tempPath = api.paths.absTmpPath;
      const umiTSFilename = 'umi.ts';
      const umiTSFilePath = path.join(tempPath, umiTSFilename);
      const umiTsSourceCode = fs.readFileSync(umiTSFilePath, 'utf-8');
      const comment = `// @ts-nocheck
// @yzw-web/umi-plugin-runtime-config transformed`;
      if(!umiTsSourceCode.includes(comment)){ // dev的过程中会反复编译，需要判断有没有注释
        const umiRealTSFilename = 'umi.real.ts';
        const umiRealTSFilePath = path.join(tempPath, umiRealTSFilename);

        fs.writeFileSync(umiRealTSFilePath,umiTsSourceCode, 'utf-8');
        fs.writeFileSync(umiTSFilePath,
          `${comment}
import {loadRemoteRuntimeConfig} from './plugin-runtimeConfig/loadRemoteRuntimeConfig';

const promise = loadRemoteRuntimeConfig().then(()=>{
  return import('./${umiRealTSFilename}');
});
export const bootstrap = (...args) => promise.then((m) => m.bootstrap(...args));
export const mount = (...args) => promise.then((m) => m.mount(...args));
export const unmount = (...args) => promise.then((m) => m.unmount(...args));
export const update = (...args) => promise.then((m) => m.update(...args));`
          ,'utf-8');

        // 在dev模式下，exports导出了TestBrowser，TestBrowser import了app.ts，就意味着可能会提前import runtimeConfig，但TestBrowser又在runtimeConfig之前导出的，导致import runtimeConfig报错
        // https://github.com/umijs/umi/issues/10412
        // dev模式下，将runtimeConfig提到最前面导出。如果未来发现build也有问题，看是否直接粗暴提到第一个了。
        if(api.env === 'development'){
          const exportsTSFilename = 'exports.ts';
          const exportsTSFilePath = path.join(tempPath, exportsTSFilename);
          const exportsTSSourceCode = fs.readFileSync(exportsTSFilePath, 'utf-8');

          const lines = exportsTSSourceCode.split('\n');
          let runtimeConfigLine: string = '';
          const newLines = lines.filter(line=>{
            if(line.includes(`/plugin-runtimeConfig';`)){
              runtimeConfigLine = line;
              return false;
            }
            return true;
          });

          // 插入到第二行去，第一行是ts-nocheck
          newLines.splice(1, 0, runtimeConfigLine);

          fs.writeFileSync(exportsTSFilePath,newLines.join('\n'), 'utf-8');
        }
      }


    })

  }
};
