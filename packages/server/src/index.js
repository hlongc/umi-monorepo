const chokidar = require("chokidar");
const express = require("express");
const fs = require("fs");
const { resolve } = require("path");
const { promisify } = require("util");

const app = express();

const logPath = resolve(__dirname, "../log");
const stat = promisify(fs.stat);

const clients = []; // 存储所有 SSE 客户端的连接

app.get("/poll/log", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // 允许客户端跨域
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Credentials", true);

  res.flushHeaders();

  res.on("drain", () => {
    console.log("客户端缓冲区已满，继续发送数据");
  });

  clients.push(res);
  console.log("客户端连接成功");
  req.on("close", () => {
    console.log("客户端断开连接");
    clients.splice(clients.indexOf(res), 1);
  });
});

app.get("/log", (req, res) => {
  fs.readFile(logPath, (err, data) => {
    res.status(200).json({
      success: true,
      code: 0,
      data: data.toString(),
    });
  });
});

chokidar.watch(logPath, {}).on("change", async () => {
  try {
    const data = await stat(logPath);
    console.log(data);
  } catch (e) {
    console.log(`文件读取异常-${logPath}`, e);
    return;
  }
  fs.readFile(logPath, (err, data) => {
    clients.forEach((client) => {
      const lines = data.toString("utf8").split("\n");
      console.log("推送消息", lines);

      lines.forEach((val) => {
        if (client.writableEnded) {
          console.log("客户端连接已断开，无法推送消息");
          return;
        }
        const result = client.write(`data: ${val}\n\n`);
        console.log("推送结果", result);
      });
    });
  });
});

app.listen(3001, () => {
  console.log("服务启动在3001端口");
});
