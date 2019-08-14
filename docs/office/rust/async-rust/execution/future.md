# `Future` 特质

该`Future`特质是Rust异步编程中的核心。Future是可以产生异步计算的值（尽管该值可以是空的，例如()）。一个简化的`Future` 特质版本可能是这个样子：

```rust
trait SimpleFuture {
    type Output;
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output>;
}
 enum Poll<T> {
    Ready(T),
    Pending,
}
```

通过调用该`poll`函数可以推进`Futures`，这将推动未来尽可能地完成。如果`Future`完成，它将返回`Poll::Ready(result)`。如果`Future`尚未完成，它将返回`Poll::Pending`并安排在`Future`准备好进行更多进展时调用`wake()`函数。当`wake()`被调用时，`executor`(执行者)驱动`Future`将再次调用`poll`，以便`Future`能够取得更多进展。

如果没有`wake()`，`executor`(执行者)将无法知道特定的`Futures`何时可以取得进展，并且必须不断地对每个`Futures`进行轮询。有了`wake()`，执行者确切地知道哪些期货准备好`poll`。

例如，考虑我们想要从可能已经或可能没有数据的套接字读取的情况。如果有数据，我们可以读取并返回`Poll::Ready(data)`，但如果没有数据准备就绪，我们的`Futures`将被阻止，无法再进展。当没有数据可用时，我们必须注册`wake`在套接字上在准备好数据时进行调用，这将告诉执行者我们的`Futures`已准备好取得进展。

一个简单的`SocketRead` `Futures`可能看起来像这样：

```rust
struct SocketRead<'a> {
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

这种`Futures`模型允许将多个异步操作组合在一起，而无需中间分配。一次运行多个`Futures`或将`Futures`链接在一起可以通过无分配状态机实现，如下所示：

```rust
/// A SimpleFuture that runs two other futures to completion concurrently.
///
/// Concurrency is achieved via the fact that calls to `poll` each future
/// may be interleaved, allowing each future to advance itself at its own pace.
pub struct Join<FutureA, FutureB> {
    // Each field may contain a future that should be run to completion.
    // If the future has already completed, the field is set to `None`.
    // This prevents us from polling a future after it has completed, which
    // would violate the contract of the `Future` trait.
    a: Option<FutureA>,
    b: Option<FutureB>,
}

impl<FutureA, FutureB> SimpleFuture for Join<FutureA, FutureB>
where
    FutureA: SimpleFuture<Output = ()>,
    FutureB: SimpleFuture<Output = ()>,
{
    type Output = ();
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output> {
        // Attempt to complete future `a`.
        if let Some(a) = &mut self.a {
            if let Poll::Ready(()) = a.poll(wake) {
                self.a.take();
            }
        }

        // Attempt to complete future `b`.
        if let Some(b) = &mut self.b {
            if let Poll::Ready(()) = b.poll(wake) {
                self.b.take();
            }
        }

        if self.a.is_none() && self.b.is_none() {
            // Both futures have completed-- we can return successfully
            Poll::Ready(())
        } else {
            // One or both futures returned `Poll::Pending` and still have
            // work to do. They will call `wake()` when progress can be made.
            Poll::Pending
        }
    }
}
```

这显示了如何在不需要单独分配的情况下同时运行多个`Future`，从而允许更高效的异步程序。同样，多个顺序`Future`可以一个接一个地运行，如下所示：

```rust
/// A SimpleFuture that runs two futures to completion, one after another.
//
// Note: for the purposes of this simple example, `AndThenFut` assumes both
// the first and second futures are available at creation-time. The real
// `AndThen` combinator allows creating the second future based on the output
// of the first future, like `get_breakfast.and_then(|food| eat(food))`.
pub struct AndThenFut<FutureA, FutureB> {
    first: Option<FutureA>,
    second: FutureB,
}

impl<FutureA, FutureB> SimpleFuture for AndThenFut<FutureA, FutureB>
where
    FutureA: SimpleFuture<Output = ()>,
    FutureB: SimpleFuture<Output = ()>,
{
    type Output = ();
    fn poll(&mut self, wake: fn()) -> Poll<Self::Output> {
        if let Some(first) = &mut self.first {
            match first.poll(wake) {
                // We've completed the first future-- remove it and start on
                // the second!
                Poll::Ready(()) => self.first.take(),
                // We couldn't yet complete the first future.
                Poll::Pending => return Poll::Pending,
            };
        }
        // Now that the first future is done, attempt to complete the second.
        self.second.poll(wake)
    }
}
```

这些示例显示了如何使用`Future`特征来表达异步控制流，而不需要多个已分配的对象和深度嵌套的回调。通过基本的控制流程，让我们来谈谈真正的`Future`特征以及它是如何不同的。

```rust
trait Future {
    type Output;
    fn poll(
        // Note the change from `&mut self` to `Pin<&mut Self>`:
        self: Pin<&mut Self>,
        // and the change from `wake: fn()` to `cx: &mut Context<'_>`:
        cx: &mut Context<'_>,
    ) -> Poll<Self::Output>;
}
```

您将注意到的第一个更改是我们的`self`类型不再`&mut self`，但已更改为`Pin<&mut Self>`。我们将在后面的章节中详细讨论`pinning`，但现在知道它允许我们创建不可移动的`Future`。不可移动的对象可以在它们的字段之间存储指针，例如`struct MyFut { a: i32, ptr_to_a: *const i32 }`。此功能是启用`async / await`所必需的。

其次，`wake: fn()`已改为`&mut Context<'_>`。在`SimpleFuture`，我们使用对函数指针(`fn()`)的调用来告诉`Future`的执行者应该轮询相关的`Future`。但是，由于`fn()`它是零大小的，因此无法存储有关哪个`task`是唤醒了的数据。在实际场景中，像Web服务器这样的复杂应用程序可能有数千个不同的连接，其唤醒应该分别进行管理。`Context` 通过控制 `Waker` 来唤醒特定的`task`。