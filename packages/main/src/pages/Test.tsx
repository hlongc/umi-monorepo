import { useEffect } from "react";

export default function () {
  useEffect(() => {
    console.log("useMount");
    const worker = new SharedWorker("/work.js");

    const port = worker.port;
    port.start();

    port.postMessage("hello worker");
    port.onmessage = (e) => {
      console.log("from worker message", e.data);
    };

    return () => {
      port.close();
    };
  }, []);

  return null;
}
