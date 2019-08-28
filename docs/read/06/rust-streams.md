![img](https://images.pexels.com/photos/2395264/pexels-photo-2395264.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500)

# Rust流(Streams)

> 本文同步于[Rust中文阅读：Rust流(Streams)](https://rustlang-cn.org/read/06/rust-streams.html)，源自于[Rust中文营养计划
](https://github.com/rustlang-cn/nutrition#rust%E4%B8%AD%E6%96%87%E8%90%A5%E5%85%BB%E8%AE%A1%E5%88%92)，时间：2019-06-21, 本文已发布在[Rust中文网络点](https://github.com/rustlang-cn/rustlang-cn/blob/master/README.md#%E4%B8%80%E5%8F%82%E4%B8%8E-rust-%E4%B8%AD%E6%96%87%E9%98%85%E8%AF%BB%E6%8A%95%E7%A8%BF). 欢迎加入[Rust中文营养计划](https://github.com/rustlang-cn/nutrition),共建Rust语言中文网络！

- 本文译者：krircc
- [英文原文](https://blog.yoshuawuyts.com/rust-streams/)

---

随着Rust的异步故事不断发展，Rust的流故事也在不断发展。在这篇文章中，我们将了解Rust的流模型如何工作，如何有效地使用它，以及未来的发展方向。

## Streams特质

在同步Rust中，流核心抽象是[Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html)。它提供了一种在序列中产生项的方法，并在它们之间进行阻塞。通过将迭代器传递给其他迭代器的构造函数来完成组合，这使得我们可以毫不费力地将事物连接在一起。

在异步Rust中，流核心抽象是[Stream](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/stream/trait.Stream.html)。它的行为非常相似Iterator，但它不是在每个项之间产生阻塞，而是允许其他任务在阻塞等待时运行。

在异步Rust中与同步Rust中[Read](https://doc.rust-lang.org/std/io/trait.Read.html)和[Write](https://doc.rust-lang.org/std/io/trait.Write.html)对应的是[AsyncRead](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/io/trait.AsyncRead.html)和[AsyncWrite](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/io/trait.AsyncWrite.html)。这些特质表示未解析的字节，通常直接来自IO层（例如来自套接字或文件）。

```rust
use futures::prelude::*;
use runtime::fs::File;

let f = file::create("foo.txt").await?; // create a file
f.write_all(b"hello world").await?;     // write data to the file (AsyncWrite)

let f = file::open("foo.txt").await?; // open a file
let mut buffer = Vec::new();          // init the buffer to read the data into
f.read_to_end(&mut buffer).await?;    // read the whole file (AsyncRead)
```

Rust流具有其他语言的一些最佳功能。例如：他们通过利用Rust的特质系统来回避[Node.js的Duplex流](https://nodejs.org/api/stream.html#stream_class_stream_duplex)中看到的遗留问题。也同时实施背压和惰性迭代，这提高了效率。最重要的是，Rust流允许使用相同类型的异步迭代。

关于Rust流还有很多值得关注的地方，尽管还有一些问题要解决。

## Streams和Roles

让我们首先列举可以在典型系统中表达的各种流：

- source：可以生成数据的流
- Sink：可以消费数据的流
- Through：消费数据，对其进行操作然后生成新数据的流
- Duplex：流可以生成数据，也可以独立的消费数据

建立通用术语很有用，因为Rust的流特质不会将1：1映射到这些角色。实际上，Rust的每个流特质都可以用来填充许多不同的角色。以下是每个特质可以参与的角色概述：


|              | Source  |  Sink   | Through | Duplex  |
| ------------ | ------- | ------- | ------- | ------- |
| `AsyncRead`  | __Yes__ | _No_    | __Yes__ | __Yes__ |
| `AsyncWrite` | _No_    | __Yes__ | _No_    | __Yes__ |
| `Stream`     | __Yes__ | _No_    | __Yes__ | _No_    |

在这里有很多东西需要拆开分析。我们来挖掘吧！

### Duplex

`Duplex`始终使用`AsyncRead + AsyncWrite`实现。这与其他语言不同。一个关键的区别是，使用Rust的特质系统，我们可以避免困扰其他语言的多个遗留问题.`duplex`流的示例包括套接字和文件。

### through

`through`流使用任一`AsyncRead`或`Stream`实现。通过将另一个流的through传递到他的构造函数中使得数据流从一个流流向另一个流。

在Rust中，`source`和`through`唯一的区别在`Traits`是如何使用的，而不是在`Traits`定义本身。一个例子：

```rust
let s = b"hello planet";                // source  (AsyncRead)
let s = gzip::compress(s).await?;       // through (AsyncRead)
let s = my_protocol::parse(f).await?;   // through (Stream)
```

### asyncread vs stream

`AsyncRead`和`Stream`另一个有趣的区别是。两种流都可以对`byte`进行操作。但不同之处在于`AsyncRead`是一个对借来的数据进行操作的字节流。 而`Stream`是一个对拥有数据进行操作的对象流。这就是说`Stream`可以对任何类型的数据进行操作，而不仅仅是字节。

虽然`AsyncRead`和`Stream`都可以对字节进行操作，但`AsyncRead`会生成未解析的数据，而`Stream`会生成已解析的数据。 不同之处在于，使用`Stream`，每个产生的项通常可以单独转换为有效的消息。 使用`AsyncRead`时，我们可能需要请求更多数据。

`AsyncRead`的示例包括文件，套接字和HTTP正文。 `Stream`的示例包括[ndjsonlines](http://ndjson.org/)和`protobuf`消息。

`AsyncRead`和`Stream`之间的关系等同于标准库的`Read`和`Iterator`特质之间的关系。 在下面的示例中，我们使用[split](https://doc.rust-lang.org/std/io/trait.BufRead.html#method.split)将任意数量的字节转换为单独的字节行。 我们用`Trait`和`yield`类型标记了每一行：

```rust
use std::io;

let f = io::File::open("foo.txt")?; // Read<[u8]>
let f = io::BufReader::new(f);      // Read<[u8]>
for buf in f.split(b'\n') {         // Iterator<[u8]>
    println!("{}", buf);
}
```

相同的数据类型。不同的特质。

不幸的是，[AsyncRead.split](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/io/trait.AsyncReadExt.html#method.split)做了一些根本不同的事情，所以这个例子不能直接复制（下面有更多关于`split`的内容）。所以不要尝试在`async Rust`中写这个。

## sinks

流的工作方式是 在管道流的末尾，有一个`sink`或迭代器从流中请求项。这意味着管道流只会在请求时生成数据。这通常被称为`延迟迭代`或`具有背压的流`。

目前，没有专门的语法来循环流。相反，建议使用`while let Some`循环：

```rust
let stream = my_protocol::parse(f).await?;
while let Some(item) in stream.next().await {
    println!("{:?}", item);
}
```

现在我们对Rust的流概念的特性有了更好的了解，我们已经准备好了解如何创建管道流。

## 管道

基于流的编程的主要内容之一是能够将流组合在一起。在shell中，您可以使用在一起管道程序|，在Node.js中，您可以使用相同的方法.pipe。典型的shell示例如下所示：

```shell
cat foo.txt | gzip > foo.txt.gz
```

上面的示例从`foo.txt`中读取数据，管道然后`gzip`以压缩数据，并将结果写回新文件。

Rust流有一个非常相似的模型。事实上，我们可以想象在`Rust`中编写相同的代码：

```rust
use runtime::fs::File;

File::open("foo.txt")
    .and_then(|s| gzip::compress(s))
    .and_then(|s| word_count::bytes(s))
    .and_then(|s| s.copy_into(File::create("foo.txt.gz")))
    .await?;
```

此代码示例今天不会运行，因为有些包还未存在。但它很好地说明了`Rust`的流在实践中如何运作。我们可以抽象地表达管道如下：

```txt
┌───────────┐   ┌───────────┐   ┌────────────┐
│ AsyncRead │──>│ AsyncRead │──>│ AsyncWrite │
└───────────┘   └───────────┘   └────────────┘
```

数据从源文件，通过压缩器进入目标文件。不同的管道将使用不同的组合`AsyncRead`和 `Sink`。但是在所有模式中，将最后一个流传递给下一个构造函数是常见的，直到我们到达接收器。

## 管道双工流

当涉及双工流时，流模型变得有点棘手。让我们假装我们打开一个实现`AsyncRead`+ `AsyncWrite` 的套接字：

```rust
let mut sock = Socket::new("localhost:3000");
dbg!(sock) // implements AsyncRead + AsyncWrite
```

我们希望从套接字读取数据，对每个值进行操作，并将数据写回套接字。在Rust中，这会让我们陷入困境，因为我们无法在两个地方保持对相同值的可变引用。所以双工流有一个方便的`split`方法将套接字分成`Read/Write`(读写)各半：

```rust
let mut sock = Socket::new("localhost:3000");
let (reader, writer) = &mut sock.split();
```

## 将`AsyncRead`管道化为`AsyncWrite`

在上面的示例中，`Socket`双工是源和接收器。这些方法都没有包装另一个流。有时我们只对流的读取或写入一半感兴趣。这就是为什么`Duplex`流在其构造函数中采用其他流的原因并不常见。

那么我们如何写数据呢？

嗯，`Rust`方便地有一个[copy_into](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/io/trait.AsyncReadExt.html#method.copy_into)组合器用于这个目的。它从`AsyncRead`获取数据，并将其写入`AsyncWrite`：

```rust
let mut sock = Socket::new("localhost:3000");
let (reader, writer) = &mut sock.split();
reader.copy_into(writer).await?;
```

## 将流管道化为`AsyncWrite`

如果我们想从`Stream`到`AsyncWrite`写数据，事情就变得很有点棘手。首先`Stream`应该输出字节（`&[u8]`或`Vec<u8>`），因为IO设备只能读取字节。

但更重要的是：目前没有可用的`copy_into`组合器！但我们可以通过转换`Stream`为`AsyncRead`，然后调用`copy_into`来解决这个问题：

```rust
stream
    .map(io::Result::Ok)  // convert each `Vec<u8>` to `Result<Vec<u8>>`
    .into_async_read()    // convert the stream to `AsyncRead`
    .copy_into(writer)    // copy the data to the sink
    .await?;              // start the pipeline
```

目前这个代码确实遭受了双缓冲[错误](https://github.com/rust-lang-nursery/futures-rs/issues/1659)，这使得它的效率低于实际。但是，如果 `copy_into` [能使Stream工作](https://github.com/rust-lang-nursery/futures-rs/issues/1661)可能会具有最好效果：

```rust
stream.copy_into(writer).await?;
```

## 处理错误

`Node.js`在引入流时犯的最大错误之一就是`pipe`不会转发错误。幸运的是，在`Rust`流中，解决了这个问题,在于如何在构造函数中包装流。这意味着流自动转发错误，管道处理它们。

错误处理的唯一困难是错误类型需要排队。在创建管道包含`io::Error`错误以外的错误的时，这可能特别棘手。但是生态系统仍处于年轻状态，模式仍在不断涌现，所以并非所有内容都是流模式的，这一点也不足为奇。

## 编写编解码器

解析器协议通常被分成编码器和解码器。编码器将结构转换为字节序列。解码器将字节转换为结构。这可以很容易地在`Rust`中建模：

```rust
/// The type we're converting to and from.
pub struct MyFrame;

/// Convert frames to bytes.
pub struct Encode;
impl Encode {
    /// Take a stream of frames, and return a stream of bytes.
    pub fn new(stream: impl Stream<Item = MyFrame>) -> Self;
}
impl Stream for Encode {
    type Item = Result<Vec<u8>, Error>;
}

/// Convert bytes to frames.
pub struct Decode;
impl Decode {
    /// Take a stream of bytes, and return a stream of frames.
    pub fn new(reader: impl AsyncRead) -> Self;
}
impl Stream for Decode {
    type Item = Result<MyFrame, Error>;
}
```

存在专门的包，旨在帮助创建编解码器。但实际上编解码器主要是一种设计模式，编写它们的最简单方法是直接使用标准流特质。

注意：根据您的使用情况，您可能需要在编写解码器时执行一些内部缓冲。但所有需要的是一个好的（环）缓冲区抽象，`crates.io`上有各种各样的。

## 使用组合器的AD-HOC流

有时您希望快速操作流的输出。它是否过滤掉您不感兴趣的结果，连接项目或快速计算。`Streams`组合器允许您以很少的开销执行这些任务。

假设我们想从文件中读取数据，并按换行分割。该[lines](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/io/trait.AsyncBufReadExt.html#method.lines) 组合程序规定：

```rust
let mut sock = Socket::new("localhost:3000");
let (reader, _) = &mut sock.split();

// This is returns a stream of `String`
let lines = reader.lines().await?;
```

现在如果我们想要解析这些行[serde](https://docs.rs/serde/1.0.92/serde/)怎么办？提示[map](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/future/trait.FutureExt.html#method.map) 组合器：

```rust
let mut sock = Socket::new("localhost:3000");
let (reader, _) = &mut sock.split();

#[derive(Deserialize)]
struct Pet {
    name: String,
}

// This returns a stream of `Result<Pet>`
let pet_stream = reader
    .lines()
    .map(|line| serde_json::parse::<Pet>(line));
```

另一个有趣的事实是，`Vec<u8>`实现`AsyncRead`和`AsyncWrite`，这意味着如果你想连接一个流的所有值，就可以直接使用缓冲区。

可能会添加更多的组合器，以及需要探索的模式。但`Rust`流的核心部件感觉非常稳固，随着生态系统的发展，可以添加更多的组合器。

## 为什么我们不谈论接收器(Sink)特质

惊喜！还有另一个你应该知道的特质。它的名字是[Sink](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/sink/trait.Sink.html)，而且它是很奇怪的一个。大声说出来会令人困惑（我们在谈论[Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html)还是Sink？），但特质本身就在那里。看看定义：

```rust
pub trait Sink<Item> {
    type SinkError;
    fn poll_ready(
        self: Pin<&mut Self>,
        cx: &mut Contex
    ) -> Poll<Result<(), Self::SinkError>>;
    fn start_send(
        self: Pin<&mut Self>,
        item: Item
    ) -> Result<(), Self::SinkError>;
    fn poll_flush(
        self: Pin<&mut Self>,
        cx: &mut Context
    ) -> Poll<Result<(), Self::SinkError>>;
    fn poll_close(
        self: Pin<&mut Self>,
        cx: &mut Context
    ) -> Poll<Result<(), Self::SinkError>>;
}
```

无论何时实现`Sink`您都需要实现4个方法，1个关联类型和1个范型参数。哦，还有一个强制性的内部缓冲区。因为特质定义中的所有这些方法都是特定生命周期的钩子。通过该周期移动数据的唯一方法是在内部临时存储数据，并在稍后再次产生它。

也许你已经理解了，但`Sink`并不简单。它的存在理由是成为一个`AsyncWrite`类型的对应物。它通常将编写器包装在其构造函数中，然后将类型序列化到其中。

在表面上这可能听起来很吸引人。但实际上没有人敢在没有`crates.io`的严格帮助的情况下写下这个怪物。或许这种复杂性实际上是值得的?，这就引出了一个问题。答案越来越多似乎是一个响亮的“不”。

`Sink`不会带来任何使用3个标准流特质无法更优雅或更少仪式地解决问题的东西。所以省去一些麻烦，不要打扰`Sink`。

## 下一步是什么

### 异步迭代语法

目前可以对流进行异步迭代，但使用它并不一定很好。大多数用户领域迭代流使用`while let Some`循环完成

```rust
let mut listener = TcpListener::bind("127.0.0.1:8081")?;
let incoming = listener.incoming();
while let Some(conn) in incoming.await {
    let conn = conn?;
    /* handle connection */
}
```

如果我们可以将其写为`for await`循环，那就更好了：

```rust
let mut listener = TcpListener::bind("127.0.0.1:8081")?;
for conn.await? in listener.incoming() {
    /* handle connection */
}
```

目前还不清楚何时会发生这种情况。但这绝对值得期待！

### 异步特质流

说到改进，流特质本身可以做一些工作。目前这些特质与`Future`特质非常相似：

```rust
pub trait AsyncRead {
    fn poll_read(
        self: Pin<&mut Self>,
        cx: &mut Context,
        buf: &mut [u8]
    ) -> Poll<io::Result<usize>>;
}
```

是什么让这个特别棘手的是：定义`self: Pin<&mut Self>`。这意味着这种方法只对`Self`被 [固定](https://doc.rust-lang.org/std/pin/index.html)的实例实现。我不想让你厌倦为什么这很棘手，但我想提一下，最近我一直听到关于这些特质可能简化的对话。

原则上，流特质没有任何关于它们的异步。他们异步的唯一原因是因为他们返回`Future`，可能需要在内部等待其他`Future`。这很重要，因为`trait`一旦直接允许`async`，似乎可以显著简化特质。

```rust
pub trait AsyncRead {
    async fn read(&mut self, buf: &mut [u8]) -> io::Result<usize>;
}
```

这将是特别好的，因为这将意味着`AsyncRead`，`AsyncWrite` 和`Stream`将被定义和STD的`Read`，`Write`和`Iterator` 以相同的方式，具有唯一的区别是在方法前`async`关键字。

```rust
pub trait Read {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize>;
}
```

但是，没有什么可以确定的。但我对这里的可能性持谨慎乐观态度。

## 使用yield的匿名流

谈到我们如何定义流的改进，已经讨论过的另一件事是为生成器添加语法。生成器可能会使用`yield`关键字，我们可以想象一个流本质上是一个`Future`的生成器。就像`async/await`允许我们跳过围绕构建`Future`的样板,`yield`也一样对于流：

```rust
async fn keep_squaring(mut val: u64) -> yield u64 {
   loop {
       val *= 2;
       yield val;
   }
}

for val.await in keep_squaring(4) {
    dbg!(val);
}
```

这个可能会更进一步，但似乎它有可能提供一些受欢迎的工作流程改进。

## 零拷贝读写

一个很好的特性是`AsyncRead`，`AsyncWrite`通过[poll_read_vectored](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/io/trait.AsyncRead.html#method.poll_read_vectored)和[poll_write_vectored](https://docs.rs/futures-preview/0.3.0-alpha.16/futures/io/trait.AsyncWrite.html#method.poll_write_vectored)支持`向量IO`。这样可以优化特定应用程序的性能。

在将来添加可能有用的类似方法是 （`poll_read_vec`和`poll_write_vec`在名称不太混淆的情况下）。这些方法允许将缓冲区直接传递给方法，并使用`mem::swap`技巧，防止`memcpy`在每个操作上执行一个额外的操作。允许我们显着提高某些API的性能，而无需根据需要修改最终用户API。

这在包装同步API时尤为重要（目前这意味着：几乎每个文件系统操作）。但更重要的是：与直接使用OS API相比，它将允许我们删除Rust目前基于`Future` IO的额外开销。

## 结论

在这篇文章中，我们讨论了Rust的各种异步流，讨论了常见的模式和陷阱，并展望了流的未来。

Rust流的未来非常令人兴奋！如果我们能够将管道流的人体工程学结合在一起，凭借Rust的可靠性保证,我们将更接近使Rust成为脚本语言传统空间的绝佳选择。

我们希望您喜欢阅读 Rust流！ - 祝你有个美好的一周！

感谢Irina Shestak，Nemo157，David Barsky，Stjepan Glavina和Hugh Kennedy阅读并提供有关此帖子的多次迭代的反馈，想法和意见！
