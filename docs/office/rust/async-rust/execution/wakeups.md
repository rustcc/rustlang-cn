# `Waker`唤醒任务

`futures`在第一次被`poll`时无法完成是很常见的 。当发生这种情况时，`futures`需要确保在准备好取得更多进展后再次对其进行轮询。这是通过`Waker`类型完成的 。

每次轮询`futures`时，都会将其作为“任务”的一部分进行轮询。任务是已提交给执行者的顶级`futures`。

`Waker`提供了一种`wake()`方法，可以用来告诉执行者他们的相关任务应该被唤醒。当`wake()`调用时，执行程序知道与该关联的任务`Waker`已准备好进行，并且应该再次轮询其`future`。

`Waker`实现了`clone()`它们以便复制和存储它们。

让我们尝试使用`Waker`实现一个简单的计时器。

## 应用：构建计时器

为了示例，我们将在创建计时器时启动新线程，在所需时间内休眠，然后在时间窗口结束时给future`计时器发信号。

以下是我们开始时需要的导入：

```rust
use {
    std::{
        future::Future,
        pin::Pin,
        sync::{Arc, Mutex},
        task::{Context, Poll, Waker},
        thread,
        time::Duration,
    },
};
```

让我们从定义`Future`类型本身开始。我们的`Future`需要一种方法让线程通知计时器已经过去而`Future`应该完成。我们将使用`Arc<Mutex<..>>`共享值在线程和`Future`之间进行通信。

```rust
pub struct TimerFuture {
    shared_state: Arc<Mutex<SharedState>>,
}

/// Shared state between the future and the waiting thread
struct SharedState {
    /// Whether or not the sleep time has elapsed
    completed: bool,

    /// The waker for the task that `TimerFuture` is running on.
    /// The thread can use this after setting `completed = true` to tell
    /// `TimerFuture`'s task to wake up, see that `completed = true`, and
    /// move forward.
    waker: Option<Waker>,
}
```

 现在，让我们编写实际`Future`实现！

```rust
impl Future for TimerFuture {
    type Output = ();
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        // Look at the shared state to see if the timer has already completed.
        let mut shared_state = self.shared_state.lock().unwrap();
        if shared_state.completed {
            Poll::Ready(())
        } else {
            // Set waker so that the thread can wake up the current task
            // when the timer has completed, ensuring that the future is polled
            // again and sees that `completed = true`.
            //
            // It's tempting to do this once rather than repeatedly cloning
            // the waker each time. However, the `TimerFuture` can move between
            // tasks on the executor, which could cause a stale waker pointing
            // to the wrong task, preventing `TimerFuture` from waking up
            // correctly.
            //
            // N.B. it's possible to check for this using the `Waker::will_wake`
            // function, but we omit that here to keep things simple.
            shared_state.waker = Some(cx.waker().clone());
            Poll::Pending
        }
    }
}
```

如果线程已经设置`shared_state.completed = true`，我们就完成了！否则，我们为当前任务克隆`Waker`，然后传递给`shared_state.waker`以便线程可以将任务唤醒。

重要的是，我们必须在每次轮询`Future`时更新`Waker`，因为`Future`可能已经转移到另一个不同的任务与`Waker`。`Future`被轮询之后在任务间传递时会发生这种情况。

最后，我们需要API来实际构造计时器并启动线程：

```rust
impl TimerFuture {
    /// Create a new `TimerFuture` which will complete after the provided
    /// timeout.
    pub fn new(duration: Duration) -> Self {
        let shared_state = Arc::new(Mutex::new(SharedState {
            completed: false,
            waker: None,
        }));

        // Spawn the new thread
        let thread_shared_state = shared_state.clone();
        thread::spawn(move || {
            thread::sleep(duration);
            let mut shared_state = thread_shared_state.lock().unwrap();
            // Signal that the timer has completed and wake up the last
            // task on which the future was polled, if one exists.
            shared_state.completed = true;
            if let Some(waker) = shared_state.waker.take() {
                waker.wake()
            }
        });

        TimerFuture { shared_state }
    }
}
```

Woot! 这就是我们构建简单计时器`Future`所需的全部内容。现在，我们只需有一个执行者来运行`Future`.
