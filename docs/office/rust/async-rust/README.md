# Rust异步编程

> 本书译自官方[async-book](https://rust-lang.github.io/async-book/),欢迎参与！本书翻译[仓库](https://github.com/rustlang-cn/rustlang-cn/tree/master/docs/office/rust/async-rust)，官方书[仓库](https://github.com/rust-lang/async-book).

- 入门
  * 本书涵盖的内容
  * 为什么异步？
  * 异步`Rust`的状态
  * `async/await!` 基础
  * 应用：HTTP服务器
- 深入异步:执行`Future`和任务
  * `Future`特质
  * 使用`LocalWaker`和`Waker`唤醒任务
    - 应用：构建计时器
  * 应用：构建执行者
  * 执行者和系统IO
- `async/await`
  * 是什么和为什么
  * `async块`，闭包和函数
  * 应用：XXX
- Pinning
  * 实际用途
- 流
  * 模式：迭代和并发
- 一次执行多个`Future`
  * `select!` 和 `join!`
  * Spawning
  * 撤销和超时
  * `FuturesUnordered`
- `I/O`
  * `AsyncRead` 和 `AsyncWrite`
- 异步设计模式：解决方案和建议
  * 服务器模型和请求/响应模式
  * 管理共享状态
- 生态系统：Tokio等等
  * 还有很多吗......
