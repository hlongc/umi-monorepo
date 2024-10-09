import { IApi } from "umi";

export default (api: IApi) => {
  api.describe({
    key: "rewrite",
  });

  api.onStart(() => {
    console.log("rewrite插件启动了");
  });

  api.onGenerateFiles(() => {
    console.log("onGenerateFiles", api.paths);
  });
};
