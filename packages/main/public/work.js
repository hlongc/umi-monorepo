var ports = [];

onconnect = function (e) {
  var port = e.ports[0];
  if (!ports.indexOf(port)) {
    ports.push(port);
  }
  port.onmessage = function (e) {
    console.log("收到消息", e.data);
    port.postMessage("我是来自work的消息");
  };

  // 监听端口关闭事件
  port.onclose = function () {
    console.log("ports-关闭之前", ports);
    console.log(`主线程关闭端口了`, port);
    ports.splice(ports.indexOf(port), 1);
    console.log("ports-关闭之后", ports);
  };

  port.start();
};
