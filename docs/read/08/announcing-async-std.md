![img](https://images.wallpaperscraft.com/image/girls_flowers_fireworks_145903_1366x768.jpg)

# 宣布async-std

> 本文源于[Rust中文营养计划](https://link.zhihu.com/?target=https%3A//github.com/rustlang-cn/nutrition)，发布在[Rust中文网络点](https://link.zhihu.com/?target=https%3A//rustlang-cn.org/www/resource.html%23rust%25E4%25B8%25AD%25E6%2596%2587). 欢迎参与[Rust中文营养计划](https://link.zhihu.com/?target=https%3A//github.com/rustlang-cn/nutrition),共建Rust语言中文生态网络！

> [英文原文](https://async.rs/blog/announcing-async-std/)  &emsp; 译者：krircc

我们很高兴地宣布一个beta版本`async-std`的发布,版本1.0意图由2019年9月26日发布。

`async-std`是的外观和感觉像Rust标准库，一切正如你所期待使用`async/await`的工作方式一样。

该库附带一本[书](https://book.async.rs/)和精美的[API文档](https://docs.rs/async-std)，很快就会提供一个稳定的接口来构建异步库和应用程序。虽然我们在1.0发布之前不承诺API稳定性，但我们也不希望进行任何重大更改。

## 概观

请考虑以下代码使用阻塞文件系统API从文件中读取：

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_file(path: &str) -> io::Result<String> {
    let mut file = File::open(path)?;
    let mut buffer = String::new();
    file.read_to_string(&mut buffer)?;
    Ok(buffer)
}
```

为了实现异步`read_file`，如果我们可以在适当的地方使用`async/ await`代码，那就太棒了。这种体验正是`async-std`提供的：

```rust
use async_std::fs::File;
use async_std::io::{self, Read};

async fn read_file(path: &str) -> io::Result<String> {
    let mut file = File::open(path).await?;
    let mut buffer = String::new();
    file.read_to_string(&mut buffer).await?;
    Ok(buffer)
}
```

另一个有趣的亮点是[task](https://book.async.rs/concepts/tasks.html)模块，提供与标准库中的[thread](https://doc.rust-lang.org/std/thread/index.html)模块类似的接口。使用`async-std`运行并发任务就像生成一个线程一样简单：

```rust
use async_std::task;
use std::time::Duration;

fn main() {
    let task = task::spawn(async {
        task::sleep(Duration::from_millis(1000)).await;
        println!("done");
        "hello"
    });

    task::block_on(async {
        println!("waiting for the task");
        let res = task.await;
        println!("task ended with result {:?}", res);
    });
}
```

运行，该程序打印以下内容：

```rust
waiting for the task
done
task ended with result "hello"
```

可以像生成的线程一样方式，`awaited`(等待)生成的任务。也可以声明与线程局部变量作用类似的任务局部变量。您可以将任务视为轻量级线程(协程
)，并以这种方式对待它们！

如果您想参观该库，请访问我们的[chat tutorial](https://github.com/async-rs/a-chat)。

## 一个新的`async/await`开始

`async-std`旨在支持新的异步编程模型（在Rust 1.39中得到稳定），以及源自我们之前在该领域的编码实践经验。为此，`async-std`不仅为您提供了`std`异步版本的`I / O`功能，而且还提供了异步版本的`Mutex`和`RwLock`等并发原语。

`async-std`带有全新的代码库和精心设计的语义。它是Rust标准库的忠实端口，坚持其经过验证的接口，在绝对必要的情况下只有极小的差异。

通过尽可能地模仿标准库易于理解的API，我们希望用户可以轻松学习如何使用`async-std`和从基于线程的阻塞API 切换到异步API。如果您熟悉Rust的标准库，那么很少有人会感到惊讶。

## 与`futures`其他图书馆的关系

`async-std`是一个独立的库，基于标准库中的[`Future`](https://doc.rust-lang.org/nightly/std/future/trait.Future.html)特质和[`futures`](https://github.com/rust-lang-nursery/futures-rs)支持的特质集。

由于`futures`API的某些部分仍在积极开发中，我们希望为用户提供强大的稳定性保证，因此我们依赖于最小且最稳定的`futures`特性。

与此同时，我们非常重视与整个异步生态系统的兼容性，因此我们努力设计API的方式不会使我们的`Crate`高于其他类似的，或锁定用户进入我们的生态系统。我们不需要兼容层或任何额外的设置来让`async-std`与`futures`其他库一起使用。

## 高效的单分配任务

Rust中零成本`Future`的承诺之一一直是每个衍生任务只会产生单个分配的成本。 然而，这一直是一个白色的谎言......或者至少直到今天。

大多数执行程序通常每个`spawn`执行两次分配，一次用于任务状态，一次用于`Future`。 另外，为了等待任务的结果，通常使用单触发通道，这产生第三分配。

为了减少分配量，我们实现了一个名为[`async-task`](https://github.com/async-rs/async-task)的库，它为每个生成的任务执行单个分配，并且能够等待任务的结果而无需创建额外的通道。 这让我们从三个分配变成了只有一个分配！

我们接下来将更多博客文章关注性能上。

## 教学，文档和帮助

`async-std`附带完整的[API文档](https://docs.rs/async-std)和一本[书](https://book.async.rs/)，教你使用库和编写库或应用程序。

我们将文档视为一流的功能，因此如果您发现任何内容令人困惑，请在我们的[Discord频道](https://discord.gg/JvZeVNe)中提出问题或github提出[问题](https://github.com/async-rs/async-std/issues/new)。文档是我们承诺的核心，我们总是渴望改进它！

## 走向1.0的道路

`async-std`目前处于`Beta`阶段。我们的目标是在2019年9月26日稳定发布，Rust 1.39的测试版同一天发布。

初始版本号`0.99`表示我们1.0的距离。`async-std`将继续处于测试阶段，直到`async/ await`正处于稳定的轨道上。

在测试期间，我们将针对API扩展和向后兼容的更改发布新的修补程序版本，并针对重大更改发布新的次要版本。在理想情况下，我们将在没有任何重大变化的情况下进行走向`1.0`。

## 安全性和可靠性

`async-std`记录了[SemVer](https://book.async.rs/overview/stability-guarantees.html)和[安全实践](https://book.async.rs/security/policy.html)。

我们使用少量经过良好审查和检查的依赖项，实现所有`async-std`核心原语的需求。

## 社区参与

`async-std`由[`Stjepan Glavina`](https://github.com/stjepang)与[`Yoshua Wuyts`](https://github.com/yoshuawuyts)合作开发，并重用了许多Rust生态系统中`crossbeam`在并发领域取得成功的想法。

它的设计和实现得到了业界和开源社区的反馈。现在图书馆终于出版了，我们想欢迎更广泛的贡献者社区。在接下来的几周内，我们需要进行测试，填补API中的剩余空白，并编写更多文档。实例和经验报告也非常受欢迎！

请参阅我们的[贡献部分](https://async.rs/contribute)了解详情 想帮忙吗？随意抓住一个好的[第一个问题](https://github.com/async-rs/async-std/issues?q=is%3Aopen+is%3Aissue+no%3Amilestone+label%3A%22good+first+issue%22)。

## 谢谢和赞助

感谢所有贡献者和早期用户在开发过程中向我们提供反馈！

最后，感谢[`Ferrous Systems`](https://ferrous-systems.com/)为这个项目提供资金！如果您想帮助开发`async-std`资金，请与我们联系。