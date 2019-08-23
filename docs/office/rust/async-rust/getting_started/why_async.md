# 为什么要异步

我们喜欢 Rust，因为它能让我们写出高效、安全的代码，但为什么要异步呢？
因为异步代码能让我们在同一个系统线程上并发执行多项任务。在一个典型的多线程应用里，如果你想同时下载两个不同的网页，你必须将这两项工作分配到两个不同的线程上，像这样：

```rust
fn get_two_sites() {
    // 创建两个线程分别执行各自的下载任务
    let thread_one = thread::spawn(|| download("https:://www.foo.com"));
    let thread_two = thread::spawn(|| download("https:://www.bar.com"));
     // 等待两个线程完成任务
    thread_one.join();
    thread_two.join();
}
```

对很多应用来说这就足够了——这样一来，多线程就被设计为只用来一次性执行多个不同任务。但这也带来了一些限制。在线程切换和跨线程共享数据上会产生很多额外开销。即使是一个什么都不做的线程也会用尽珍贵的系统资源，而这就是异步代码要减少的开销。我们可以使用 Rust 的 `async`/`.await` 重写上面的函数，实现执行多个任务的目标而不用创建多个线程：

```rust
async fn get_two_sites() {
    // Create a two different "futures" which, when run to completion,
    // will asynchronously download the webpages.
    // 创建两个不同的 future，当它们被完成执行时会异步下载不同的网页
    let future_one = download_async("https:://www.foo.com");
    let future_two = download_async("https:://www.bar.com");
     // 同时执行两个 future 使它们完成
    join!(future_one, future_two);
}
```

总之，相比多线程实现来说，异步实现的应用具有使用更少的资源获得更高性能的潜力。线程由操作系统支持，使用它们并不需要特别的编程模型——任何函数都可以创建一个线程，而调用一个使用多线程的函数就像调用一个普通函数一样简单。但是异步函数就需要语言层面或者类库层面提供特殊的支持才能工作。在 Rust 中，`async fn` 会创建一个异步函数，当它被调用时，会返回一个需要依次执行函数体来完成的 future 对象。
传统多线程应用也可以非常有效，Rust的较小的内存占用以及可预测性意味着你可以做更多的事，即使不使用 `async` 关键字。然而，异步编程模型增长的复杂性并不总是值得的，想清楚你的应用采用简单多线程模型是否会更好仍然是很重要的。
