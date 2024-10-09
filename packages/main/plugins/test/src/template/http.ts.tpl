/**
 * 下面只考虑json的请求和json的返回，如果有其他情况再说
 */
const createRequestInstance = ({
                                 baseURL,
                               }: {
  baseURL: string;
})=>{
  return {
    request: (config: RequestInit & {
      url: string;
      params?: Record<string, any>; // 模拟axios的params
      data?: any;// 模拟axios的data
      showWarn?: boolean
    })=>{
      const {
        url,
        showWarn,
        params,
        data,
        body,
        headers,
        ...restConfig
      } = config;
      return fetch(baseURL + config.url + (params ? `?${new URLSearchParams(params)}` : ''), {
        ...restConfig,
        credentials: 'include',
        headers: {
          ...headers,
          ...(data ? {
            "Content-Type": "application/json",
          }:{}),
        },
        body: data ? JSON.stringify(data) : body,
      }).then(res=>{
        return res.json().then(data=>{
          if (!data.success) {
            if (data.message && showWarn) {
              alert(data.message)
            }
            // 注意。这里的reject也会往下面catch走，下面的逻辑已兜住了这里的情况
            return Promise.reject({
              message: data.message,
              response: res,
            });
          }
          return data.data;
        })
      }).catch((error)=>{
        if(showWarn){
          if (error.response) {
            if (String(error.response.status)[0] === '5') {
              alert('服务器内部错误');
            }
          } else if (error.message === 'Failed to fetch') { // 这里与axios的区别，axios是Network Error
            alert('网络异常，请检查网络');
          } else if (/timeout/i.test(error.message)) {
            alert('访问超时，请重试');
          }
        }
        return Promise.reject(error);
      })
    }
  };
}
// 配置中心

export const ycfcRequestInstance = createRequestInstance({
  baseURL: '{{{ycfcBaseUrl}}}',
});

// 租户中心
export const ytcRequestInstance = createRequestInstance({
  baseURL: '{{{ytcBaseUrl}}}',
});
