import NProgress from '{{{nprogressPackage}}}';
import '{{{nprogressPackage}}}/nprogress.css';

let style: HTMLStyleElement;

const isSlaveApp = !!window.__POWERED_BY_QIANKUN__; // 是否是微应用，微应用暂不loading

export const showLoading = ()=>{
  if(isSlaveApp){
    return;
  }

  style = document.createElement('style')
  style.textContent = `#nprogress .bar {
  background: var(--yzw-color-primary, #0081CC) !important;
}
 #nprogress .spinner .spinner-icon {
  border-top-color: var(--yzw-color-primary, #0081CC) !important;
  border-left-color: var(--yzw-color-primary, #0081CC) !important;
}`
  document.body.appendChild(style);

  NProgress.inc();
}

export const hideLoading = ()=>{
  if(isSlaveApp){
    return;
  }

  NProgress.done();
  setTimeout(()=>{
    NProgress.remove();
    style?.remove();
  }, 500)
}
