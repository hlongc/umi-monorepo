# Change Log - @yzw-web/umi-plugin-runtime-config

This log was last generated on Fri, 05 Jul 2024 09:38:45 GMT and should not be manually modified.

## 1.1.1
Fri, 05 Jul 2024 09:38:45 GMT

### Patches

- fix: 修复runtime-config新方案在qiankun子应用下的问题

## 1.1.0
Mon, 17 Jun 2024 10:22:12 GMT

### Minor changes

- fix: 修复runtime-config配置不在最前面的问题，此举一并解决

### Patches

- feat: 修改runtimeConfig lodash的引用优化，不再要求项目中安装lodash
- feat: 非微应用在无缓存加载远程配置的情况下显示loading

## 1.0.0
Mon, 03 Jun 2024 11:31:02 GMT

### Breaking changes

- feat: 讲runtimeConfig远程获取时机再提前，并且通过顶层await阻塞后续逻辑。规避app.ts顶层与model.ts顶层提前执行拿不到runtimeconfig的问题

## 0.4.0
Mon, 13 May 2024 07:18:07 GMT

### Minor changes

- feat: runtimeConfig的环境配置在localStorage中多一个configKey的标识，避免微前端中主子应用用的不同key导致无限刷新。支持配置global额外的configKey，如果配了就不取应用的configKey。

## 0.3.0
Fri, 19 Apr 2024 10:17:20 GMT

### Minor changes

- feat: runtimeConfig改为使用fetch获取配置，更轻量。避免被ajax-hook劫持

## 0.2.2
Thu, 21 Mar 2024 09:00:45 GMT

### Patches

- fix: 将runtimeConfig的自动请求提升到最前

## 0.2.1
Mon, 20 Nov 2023 06:41:16 GMT

### Patches

- fix: 兼容本地umi setup时候没有PROJECT_ENV报错的情况

## 0.2.0
Tue, 10 Oct 2023 08:24:04 GMT

### Minor changes

- feat: 修改runtimeConfig dev和qa域名

## 0.1.0
Sun, 25 Jun 2023 10:00:48 GMT

### Minor changes

- feat: 1. 将配置拆开缓存，拆开对比，避免大前端配置或者租户配置一修改有微前端的应用不停的刷新问题。2. 生产环境不再打印配置，防止配置直接泄露

## 0.0.10
Fri, 26 May 2023 09:23:15 GMT

### Patches

- fix: 修复qiankun子应用 localStorage的key取名不对相互冲突的问题

## 0.0.9
Wed, 24 May 2023 10:57:41 GMT

### Patches

- feat: 1. 增加configKey参数用于多QA环境配置，具体用法见文档。2. 增加JSON.parse解析错误的console

## 0.0.8
Mon, 22 May 2023 03:05:52 GMT

### Patches

- fix: 完善umi3兼容问题

## 0.0.7
Sat, 20 May 2023 08:08:00 GMT

### Patches

- fix: 修正远程prd地址

## 0.0.6
Mon, 15 May 2023 07:55:54 GMT

### Patches

- perf: 如果是首次请求，接口报错了要报错。

## 0.0.5
Mon, 15 May 2023 05:40:30 GMT

### Patches

- feat: 租户请求参数约定可从本地localStorage去取

## 0.0.4
Fri, 12 May 2023 09:40:06 GMT

### Patches

- feat: 代码优化

## 0.0.3
Fri, 12 May 2023 01:43:45 GMT

### Patches

- feat: 强升版本

## 0.0.2
Thu, 11 May 2023 14:01:59 GMT

### Patches

- fix: 修正语法错误

