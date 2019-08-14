# 应用：构建执行者

`Futures`是懒惰的，必须积极驱动完成才能做任何事情。驱动`Futures`完成的一种常见方法是在`async`函数内部的`.await`，但这只会将问题提升一级：谁将运行从顶级`async`函数返回的`Futures`？答案是我们需要一个`Future`执行者。

`Future`执行者获取一组顶级`Futures`并通过`poll`在`Future`可以取得进展时调用它们来完成。通常，执行者将在开始时执行`poll`一次。当`Futures`通过调用`wake()`表示他们已经准备好取得进展时，他们被放回队列`poll`再次被调用，重复直到`Future`完成。

在本节中，我们将编写自己的简单执行者，能够同时运行大量顶级`Futures`。

下面的例子，我们依赖 `futures`的`ArchWake` trait，因为其提供了便捷的方案构建`Waker`

```toml
[package]
name = "xyz"
version = "0.1.0"
authors = ["XYZ Author"]
edition = "2018"

[dependencies]
futures-preview = "=0.3.0-alpha.17"
```

接下来，我们需要在`src/main.rs`顶部的以下导入：

```rust
use {
    futures::{
        future::{FutureExt, BoxFuture},
        task::{ArcWake, waker_ref},
    },
    std::{
        future::Future,
        sync::{Arc, Mutex},
        sync::mpsc::{sync_channel, SyncSender, Receiver},
        task::{Context, Poll},
        time::Duration,
    },
    // The timer we wrote in the previous section:
    timer_future::TimerFuture,
};
```

我们执行者的工作是通过通道发送任务运行。执行者将从通道中提取事件并运行它们。当一个任务准备好做更多的工作（被唤醒）时，它可以通过将自己放回到通道上来安排自己再次被轮询。

在此设计中，执行者本身只需要在通道的接收端接受任务。用户将获得发送端，以便他们可以创建新的`futures`。任务本身只是可以重新安排自己的`futures`，所以我们将它们存储为与发送端配对的`futures`，可以用来重新排队。

```rust
/// Task executor that receives tasks off of a channel and runs them.
struct Executor {
    ready_queue: Receiver<Arc<Task>>,
}

/// `Spawner` spawns new futures onto the task channel.
#[derive(Clone)]
struct Spawner {
    task_sender: SyncSender<Arc<Task>>,
}

/// A future that can reschedule itself to be polled by an `Executor`.
struct Task {
    /// In-progress future that should be pushed to completion.
    ///
    /// The `Mutex` is not necessary for correctness, since we only have
    /// one thread executing tasks at once. However, Rust isn't smart
    /// enough to know that `future` is only mutated from one thread,
    /// so we need use the `Mutex` to prove thread-safety. A production
    /// executor would not need this, and could use `UnsafeCell` instead.
    future: Mutex<Option<BoxFuture<'static, ()>>>,

    /// Handle to place the task itself back onto the task queue.
    task_sender: SyncSender<Arc<Task>>,
}

fn new_executor_and_spawner() -> (Executor, Spawner) {
    // Maximum number of tasks to allow queueing in the channel at once.
    // This is just to make `sync_channel` happy, and wouldn't be present in
    // a real executor.
    const MAX_QUEUED_TASKS: usize = 10_000;
    let (task_sender, ready_queue) = sync_channel(MAX_QUEUED_TASKS);
    (Executor { ready_queue }, Spawner { task_sender})
}
```

我们还要为 spawner 添加一种方法，以便轻松生成新的`future`。此方法将携带`future`类型，将其包装并放入FutureObj中，创建一个`Arc<Task>`，可以将其排入执行者。

```rust
impl Spawner {
    fn spawn(&self, future: impl Future<Output = ()> + 'static + Send) {
        let future = future.boxed();
        let task = Arc::new(Task {
            future: Mutex::new(Some(future)),
            task_sender: self.task_sender.clone(),
        });
        self.task_sender.send(task).expect("too many tasks queued");
    }
}
```

在排序轮询`futures`时，我们还需要创建一个`Waker`提供轮询。正如任务唤醒部分所讨论的那样，`Wakers`负责在`wake`调用后再次调度要轮询的任务。请记住， `Wakers`告诉执行者确切地准备了哪个任务，允许他们仅轮询准备好进展的`futures`。创建新的`Waker`最简单方法是实现`ArcWake`特征，然后使用`wake_ref`或`.into_waker()`函数将`Arc<impl ArcWake>` 转换为`Waker`。让我们为我们的任务实现`ArcWake`，让它们可以转换成`Wakers`并唤醒：

```rust
impl ArcWake for Task {
    fn wake_by_ref(arc_self: &Arc<Self>) {
        // Implement `wake` by sending this task back onto the task channel
        // so that it will be polled again by the executor.
        let cloned = arc_self.clone();
        arc_self.task_sender.send(cloned).expect("too many tasks queued");
    }
}
```

当从`Arc<Task>`创建`Waker`时，调用`wake()`会导致`Arc`复制并被发送到任务通道。然后我们的执行者接收任务并进行轮询。让我们实现：

```rust
impl Executor {
    fn run(&self) {
        while let Ok(task) = self.ready_queue.recv() {
            // Take the future, and if it has not yet completed (is still Some),
            // poll it in an attempt to complete it.
            let mut future_slot = task.future.lock().unwrap();
            if let Some(mut future) = future_slot.take() {
                // Create a `LocalWaker` from the task itself
                let waker = waker_ref(&task);
                let context = &mut Context::from_waker(&*waker);
                // `BoxFuture<T>` is a type alias for
                // `Pin<Box<dyn Future<Output = T> + Send + 'static>>`.
                // We can get a `Pin<&mut dyn Future + Send + 'static>`
                // from it by calling the `Pin::as_mut` method.
                if let Poll::Pending = future.as_mut().poll(context) {
                    // We're not done processing the future, so put it
                    // back in its task to be run again in the future.
                    *future_slot = Some(future);
                }
            }
        }
    }
}
```

恭喜！我们现在有一个工作的`futures`执行者。我们甚至可以用它来运行`async/.await`代码和自定义`futures`，比如我们之前写的`TimerFuture`：

```rust
fn main() {
    let (executor, spawner) = new_executor_and_spawner();

    // Spawn a task to print before and after waiting on a timer.
    spawner.spawn(async {
        println!("howdy!");
        // Wait for our timer future to complete after two seconds.
        TimerFuture::new(Duration::new(2, 0)).await;
        println!("done!");
    });

    // Drop the spawner so that our executor knows it is finished and won't
    // receive more incoming tasks to run.
    drop(spawner);

    // Run the executor until the task queue is empty.
    // This will print "howdy!", pause, and then print "done!".
    executor.run();
}
```
