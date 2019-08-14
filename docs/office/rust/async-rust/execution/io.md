# 执行者和系统IO

在上一节关于`The Future Trait`的部分中，我们讨论了在套接字上执行异步读取`Future`的示例：

```rust
pub struct SocketRead<'a> {
    socket: &'a Socket,
}

impl SimpleFuture for SocketRead<'_> {
    type Output = Vec<u8>;

    fn poll(&mut self, wake: fn()) -> Poll<Self::Output> {
        if self.socket.has_data_to_read() {
            // The socket has data-- read it into a buffer and return it.
            Poll::Ready(self.socket.read_buf())
        } else {
            // The socket does not yet have data.
            //
            // Arrange for `wake` to be called once data is available.
            // When data becomes available, `wake` will be called, and the
            // user of this `Future` will know to call `poll` again and
            // receive data.
            self.socket.set_readable_callback(wake);
            Poll::Pending
        }
    }
}
```

这个`Future`将读取套接字上的可用数据，如果没有数据可用，它将`yield`于执行者，请求在套接字再次可读时唤醒其任务。但是，从这个例子中不清楚该`Socket`类型是如何实现的，特别是该`set_readable_callback`函数的工作方式并不明显 。一旦套接字变得可读，我们如何安排`lw.wake()`被调用？一种选择是让一个线程不断检查是否`socket`可读，在适当时调用 `wake()`。但是，这将是非常低效的，需要为每个阻塞的`IO``Future`提供单独的线程。这将大大降低异步代码的效率。

在实践中，通过与支持`IO`意识的系统阻塞设施集成来解决这个问题，例如`epoll`在Linux上，`kqueue`在FreeBSD和Mac OS上，在Windows上的`IOCP`和`port`在Fuchsia上（所有这些都通过跨平台的Rust [mio](https://github.com/carllerche/mio) crate暴露）。这些原语都允许线程阻塞多个异步IO事件，一旦事件完成就返回。实际上，这些API通常看起来像这样：

```rust
struct IoBlocker {
    ...
}

struct Event {
    // An ID uniquely identifying the event that occurred and was listened for.
    id: usize,

    // A set of signals to wait for, or which occurred.
    signals: Signals,
}

impl IoBlocker {
    /// Create a new collection of asynchronous IO events to block on.
    fn new() -> Self { ... }

    /// Express an interest in a particular IO event.
    fn add_io_event_interest(
        &self,

        /// The object on which the event will occur
        io_object: &IoObject,

        /// A set of signals that may appear on the `io_object` for
        /// which an event should be triggered, paried with
        /// an ID to give to events that result from this interest.
        event: Event,
    ) { ... }

    /// Block until one of the events occurs.
    /// This will only trigget
    fn block(&self) -> Event { ... }
}

let mut io_blocker = IoBlocker::new();
io_blocker.add_io_event_interest(
    &socket_1,
    Event { id: 1, signals: READABLE },
);
io_blocker.add_io_event_interest(
    &socket_2,
    Event { id: 2, signals: READABLE | WRITABLE },
);
let event = io_blocker.block();

// prints e.g. "Socket 1 is now READABLE" if socket one became readable.
println!("Socket {:?} is now {:?}", event.id, event.signals);
```

`Futures` 执行者可以使用这些原语来提供异步IO对象，例如可以配置在特定IO事件发生时运行的回调的套接字。在上面的`SocketRead`示例中，该 `Socket::set_readable_callback`函数可能类似于以下伪代码：

```rust
impl Socket {
    fn set_readable_callback(&self, waker: Waker) {
        // `local_executor` is a reference to the local executor.
        // this could be provided at creation of the socket, but in practice
        // many executor implementations pass it down through thread local
        // storage for convenience.
        let local_executor = self.local_executor;

        // Unique ID for this IO object.
        let id = self.id;

        // Store the local waker in the executor's map so that it can be called
        // once the IO event arrives.
        local_executor.event_map.insert(id, waker);
        local_executor.add_io_event_interest(
            &self.socket_file_descriptor,
            Event { id, signals: READABLE },
        );
    }
}
```

我们现在可以只有一个执行者线程，它可以接收和发送任何IO事件到适当的`Waker`，这将唤醒相应的任务，允许执行者在返回检查更多IO事件之前驱动更多任务完成（并且继续循环...）。
