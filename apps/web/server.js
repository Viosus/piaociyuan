// server.js - 自定义服务器支持 Socket.io
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // 创建 Socket.io 服务器
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_APP_URL
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/',
  });

  // 用户在线状态管理
  const onlineUsers = new Map(); // userId -> socketId

  // WebSocket 认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // WebSocket 连接处理
  io.on('connection', (socket) => {
    console.log(`[WebSocket] 用户连接: ${socket.userId} (${socket.id})`);

    // 记录用户在线状态
    onlineUsers.set(socket.userId, socket.id);

    // 用户加入自己的房间（用于接收私信）
    socket.join(`user:${socket.userId}`);

    // 广播用户上线状态
    socket.broadcast.emit('user:online', { userId: socket.userId });

    // 监听发送消息事件
    socket.on('message:send', async (data) => {
      console.log(`[WebSocket] 消息发送: ${socket.userId} -> ${data.receiverId}`);

      // 推送给接收方
      io.to(`user:${data.receiverId}`).emit('message:new', {
        ...data,
        senderId: socket.userId,
      });

      // 确认消息已发送
      socket.emit('message:sent', { messageId: data.messageId });
    });

    // 监听消息已读事件
    socket.on('message:read', async (data) => {
      console.log(`[WebSocket] 消息已读: ${data.conversationId}`);

      // 通知发送方消息已读
      if (data.senderId) {
        io.to(`user:${data.senderId}`).emit('message:read', {
          conversationId: data.conversationId,
          readAt: new Date().toISOString(),
        });
      }
    });

    // 监听输入状态
    socket.on('typing:start', (data) => {
      io.to(`user:${data.receiverId}`).emit('typing:start', {
        userId: socket.userId,
        conversationId: data.conversationId,
      });
    });

    socket.on('typing:stop', (data) => {
      io.to(`user:${data.receiverId}`).emit('typing:stop', {
        userId: socket.userId,
        conversationId: data.conversationId,
      });
    });

    // 用户断开连接
    socket.on('disconnect', () => {
      console.log(`[WebSocket] 用户断开: ${socket.userId} (${socket.id})`);
      onlineUsers.delete(socket.userId);

      // 广播用户离线状态
      socket.broadcast.emit('user:offline', { userId: socket.userId });
    });

    // 获取在线用户列表
    socket.on('users:online', (callback) => {
      callback(Array.from(onlineUsers.keys()));
    });
  });

  // 将 io 实例附加到全局，供 API 路由使用
  global.io = io;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io server is running`);
    });

  // 优雅关闭处理
  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received, starting graceful shutdown...`);

    // 标记关闭状态
    let httpClosed = false;
    let ioClosed = false;

    // 设置超时，如果10秒内没有关闭完成，强制退出
    const forceExitTimer = setTimeout(() => {
      console.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);

    const checkAndExit = () => {
      if (httpClosed && ioClosed) {
        console.log('Graceful shutdown completed');
        clearTimeout(forceExitTimer);
        process.exit(0);
      }
    };

    // 关闭所有 Socket.io 连接
    io.close(() => {
      console.log('Socket.io server closed');
      ioClosed = true;
      checkAndExit();
    });

    // 关闭 HTTP 服务器，不再接受新连接
    httpServer.close(() => {
      console.log('HTTP server closed');
      httpClosed = true;
      checkAndExit();
    });
  };

  // 监听终止信号
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // 监听未捕获的异常和 Promise 拒绝
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // 对于未处理的 Promise 拒绝，不强制关闭，只记录错误
  });
});
