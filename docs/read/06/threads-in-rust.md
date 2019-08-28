![img](https://images.wallpaperscraft.com/image/silhouette_mountains_art_142642_1366x768.jpg)

# Rust中的线程

> 本文同步于[Rust中文阅读：Rust中的线程](https://rustlang-cn.org/read/06/threads-in-rust.html)，源自于[Rust中文营养计划
](https://github.com/rustlang-cn/nutrition#rust%E4%B8%AD%E6%96%87%E8%90%A5%E5%85%BB%E8%AE%A1%E5%88%92)，时间：2019-06-21, 本文已发布在[Rust中文网络点](https://github.com/rustlang-cn/rustlang-cn/blob/master/README.md#%E4%B8%80%E5%8F%82%E4%B8%8E-rust-%E4%B8%AD%E6%96%87%E9%98%85%E8%AF%BB%E6%8A%95%E7%A8%BF). 欢迎加入[Rust中文营养计划](https://github.com/rustlang-cn/nutrition),共建Rust语言中文网络！

- 本文译者：<font color="#000066"><a href="https://github.com/huoyuanliao" target = "_black"><strong>huoyuanliao</strong></a></font>
- 本文校对：[suhanyujie](https://github.com/suhanyujie), krircc
- [英文原文](https://chilimatic.hashnode.dev/threads-in-rust-cjwmbxw9e003pzjs19n7pa0bt)

---

在本季度的常规编程课程中，我们关注的是线程编程。

并发 / 多线程是一个非常难的话题，它有许多非常具体的术语，并且可以说有不同的并发"级别"。

我将从编程人员 / 操作系统角度开始介绍术语。

## 进程和线程

我们有进程，也有线程。

进程是在一个有独立内存的操作系统上运行软件的模型。 从用户空间的角度来看数据只能通过定义的 API/ABI 来访问。

线程或"执行线程"是一种运行/执行部分软件的方法。如果愿意，它可以访问产生线程的父进程提供的共享内存。

在Rust中，每个进程都有一个主线程，可以通过以下方式访问：

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let main_thread_handle = thread::current();
}
```

这意味着由操作系统启动的进程和这些进程产生的线程可以被操作系统或给定的运行时操纵。

进程可以根据需要生成尽可能多的线程（在OS限制内），并且线程可以理论上访问操作系统为进程分配的内存。

对于一个操作系统来说，分配资源、虚拟化资源和协调资源比仅仅协调资源开销更大，因此从操作系统的角度来看，一个线程相对于一个进程来说开销更低，更廉价。

不过有线程比没有线程的开销始终要大。在特定情况下，这也可能意味着完全并行可能比单线程更慢。

维基百科的进程定义：

* 进程通常是独立的，而线程作为进程的子集存在
* 进程比线程携带更多的状态信息，而进程内的多个线程共享进程状态以及内存和其他资源
* 进程有单独的地址空间，而线程共享它们的地址空间
* 进程之间的交互只能通过系统提供的行程间通讯机制进行
* 同一进程中线程之间的上下文切换通常比进程之间的上下文切换更快

## OS内存的Ring模型

* CPU Ring级别
  
Ring级别描述了一个访问权限系统。
还有一些负Ring是为 HSM (高安全模块)构建的，它们有一个额外的保护层，即使内核也不应该访问。但是为了简单起见，我们将从Ring0开始，它是我们的操作系统内核运行的地方，并且完全控制它。
![Ring model](https://cdn.hashnode.com/res/hashnode/image/upload/v1559911696088/Bow5kQPQu.png)

Rings定义了一种特权等级制度，其中特权的方向是由内而外的。 例如，ring0可以访问ring1，但不能反过来访问。为什么这很重要？这些保护环也提供了对某些CPU指令的访问，这一点很重要。另外，我认为理解不同的概念来理解系统如何工作是很重要的。
此外，可观察性是并发中的一个重要因素，如果进程在不同的ring中运行，至少从操作系统的角度来看，可以产生巨大的差异。

有关Ring的更多信息[rings](https://en.wikipedia.org/wiki/Protection_ring). 

一个更真实的内存映射将沿着这条线:

![memory_ring_model_example](https://cdn.hashnode.com/res/hashnode/image/upload/v1559913176902/t-omtczfO.png)

实际上，我们讨论的是管理地址，地址可以被看作是位模式，操作系统允许访问某些地址，或者不允许。

我们的内核可以访问模型中的所有地址，并为驱动程序和程序提供所需的地址。

正如您可以看到的，基于Ring的地址不需要在地址空间中对齐，它可以，但不是必需的。

## 内存虚拟化
另一个技巧来自我们的程序/应用程序视图。地址虚拟化。

我们的操作系统将创建一个地址映射表来模拟我们的程序是独立的。 例如，每个程序可能认为它与内存地址0x1到 Fx1一起工作，但实际上这些地址是通过虚拟化表转换成我们操作系统的真实硬件地址的。

这同样适用于类似 virtualbox 的混合虚拟化技术。 系统管理程序会对我们的虚拟机说谎，告诉它，它是系统上唯一的一个，并转换内存和 CPU 时间。

从我们的流程角度和我们的线程角度来看，我们拥有所有的内存。同时我们的进程不知道操作系统提供的信息之外还存在多少内存。

从我们的进程视角和线程视角来看，我们拥有所有的内存。 同时，除了操作系统提供的信息之外，我们的进程并不知道有多少内存真正存在。

## 从操作系统的角度看进程：
* OS在执行页面中注册程序起始点的地址
* 操作系统试图满足内存请求
* 循环遍历正在运行的进程并调度执行时间
* 操作系统负责侦听中断 / 系统调用
* 操作系统注册可能的线程
* 操作系统提供对特定内存空间的访问，例如，如果一个网络包进来并且程序允许访问它
* 操作系统调度我们的 CPU 时间，并试图与其他正在运行的程序取得平衡
## 什么是操作系统？
操作系统是一个运行和管理其他软件和硬件的软件。

有点含糊？ 对我来说，这是一个相当好的描述，没有执行的障碍和使用的意图。

如果我们看一下操作系统的最基本/原始实现是一个程序在无限循环中运行，发送无操作指令。

然而，现代OS实现需要做更多

* 安全
* 控制系统性能
* 作业调度
* 错误检测辅助
* 其他软件和用户之间的协调
* 内存管理
* 处理器管理
* 设备管理
* 文件管理
  
  [更多细节](https://www.geeksforgeeks.org/functions-of-operating-system/)
  
操作系统可以被视为一个大型资源管理系统，为我们提供和管理它们。

# CPU的基础知识
![science.jpg](https://cdn.hashnode.com/res/hashnode/image/upload/v1559919481805/hWQnwUcYw.jpeg)

为什么是无限循环？ 没有等待吗？ 由于我们硬件的性质。 中央处理器运行在电平上，该电平通过 FSB 传输，在给定的间隔(Hz)内，达到一定阈值的每一个电压峰值(u)或没有电压峰值(u)都可以看到1或0(数字化)值。

这也被称为时钟周期。 所以1个区间有或没有电势的峰值。

![1479539984.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1559916540220/vVbMfFs0Q.png)
[原始来源](https://www.electrical4u.com/sinusoidal-wave-signal/)

这种波将通过晶体管进行转换
![99NDnHMIs.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1559916731554/99NDnHMIs.png)
[原始来源](https://en.wikipedia.org/wiki/Transistor)

转换成数字信号
![7WYcV2y6w.gif](https://cdn.hashnode.com/res/hashnode/image/upload/v1559916860310/7WYcV2y6w.gif)

[原始来源](http://www.techmind.org/dsp/)

晶体管通常是用半导体制造的，尽管有新的石墨烯实验。 一般来说，晶体管可以看作是一个开关，如果达到一定的电压 / 电位(u) ，它就会翻转。
这是由于半导体的间隙允许电子从价带转移到导电带。
你可以简化它，通过想象通过增加电压，你把带子推得更近，使得电子更容易跨越带子之间的间隙。
我们的 CPU 得到的指令流可能是0和1，或者没有足够的潜力和足够的潜力。
这还不足以做任何事情---- 你可以呆在你的房间里，打开或关掉你的灯，没有上下文就没有任何意义。
背景往往是时间。 所以我们有一个以特定节奏振荡的时钟，这个时钟允许我们在一段时间内定义一个信息单位，我们喜欢称之为比特。
这意味着我们的 CPU 总是在工作，我们的整个系统有一个内部时钟，如果我们不提供任何 CPU 做它仍然会工作，只要它是打开的-相当少，因为它有内置的逻辑门，以减少能源浪费。
这就是 CPU 的核心特性，它总是在运行。 或者是这样？ 阿兰 · 图灵提出了一个有趣的问题，叫做停机问题,我们现在不会去碰它。

## CPU - MESI
我们需要理解并发和并行计算跨越了我们的程序、操作系统和 CPU 或任何其他形式的分布式"处理器"之间的边界。

我们的现代 CPU 架构是由多个组件构成的

![cpu_architecture.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1559918791423/nqO7Poq_e.png)

CPU的通常任务如下

* 获取信息
* 处理信息
* 储存信息
这就是每个 CPU 所做的，它的名字叫中央处理单元。
但是这些核心是如何工作的呢？ 寄存器和缓存是如何工作的？ 这有什么关系？

好吧。 如果 CPU 中只有一个核心，那就不是。 只要我们有多个核心，应该工作在相同的问题，合作问题开始。

我们如何协调不同核心之间的数据流？ 我们知道我们希望它快一点！ 所以如果可能的话，我们尽量在下面的缓存里填满所需的信息。

但是如果处理器1做第一部分，处理器2做第二部分呢？ 如果我们查看图表，我们会看到 L1和 L2缓存是不共享的。

我们如何能够有效地在 cpu 之间进行通信，以减轻任何分布式系统所存在的一些问题。
* MESI来救援。
![220px-Diagrama_MESI.gif](https://cdn.hashnode.com/res/hashnode/image/upload/v1559921545819/Ej_8tUtlA.gif)

MESI是一个拥有4个核心状态的状态机

* 修改
* 独占
* 共享
* 无效
这允许内部缓存分发和通信！ 它允许核心从其他缓存中获取信息。

如果你再次思考Rust，以及所有权是如何运作的，对我来说，这实际上接近于一个抽象的计算概念
* 你需要拥有它来写(独家)
* 你可以分享给大家阅读(分享)
*  在模型中禁止修改和无效，因为您要么必须使用原子化的 ARC，要么使用 RC，或者使用像 mutex 这样的构造

## 分支预测
分支预测是分支预测器的一种尝试

在实际使用 CPU 的"空闲"周期来获取所需的数据并进行投机性执行之前，猜测指令分支的可能结果。

由于失败的代价和什么都不做一样昂贵，这个系统提高了给定 CPU 的吞吐量的效率。

##  超线程
超线程是英特尔开发的技术，每个物理内核通过复制物理内核中的架构状态分成两个逻辑内核。
因此，当前的执行状态是持久化的，而不是数据状态。 因此，逻辑核心可以被中断，并且仍然知道他的执行状态，从而允许操作系统将这个虚拟核心视为真正的核心。

![31x8ia.jpg](https://cdn.hashnode.com/res/hashnode/image/upload/v1559922355734/3sbAvJ4Lk.jpeg)

## 让我们回到Rust的线程
* 绿色线程
绿色线程线程是一种将线程调度从内核空间移到用户空间以减少从内核生成线程的开销的技术

这意味着即使是"更便宜的"线程，但也意味着一个运行时，这就是为什么它被踢出Rust。 因为Rust要保证零成本抽象。

这有一定的优点，例如它可以利用 futex sys 调用，并且不需要像操作系统那样的平衡执行树问题。

一个操作系统总是试图做到"公平"，并分配工作负载绿色线程允许您基本上产生 n 个线程，但仍然只使用1，因为效率是一个视角和意图的问题。

* 启动线程
```Rust
use std::thread;

fn main() {
    case1();
}

fn case1() {
    let t1 = thread::spawn(|| {
        println!("Thread 1");
    });

    let t2 = thread::spawn(|| {
        println!("Thread 2");
    });

    let t3 = thread::spawn(|| {
        println!("Thread 3");
    });
    // needed otherwise it does not block till 
    // the threads actually have been run
    t1.join();
    t2.join();
    t3.join();
}
```
这基本上只产生3个线程。 因为不能保证线程的执行顺序，所以我们最有可能得到预期的结果，但是我们需要在结束时等待，以确保包含其他3个线程的主线程不会在看到 println!之前终止
* 构建模式
```Rust
// example from the rust book
fn main() {
    let child1_thread = thread::Builder::new()
        .name("child1".to_string())
        // in mebibyte MiB designed to replace the megabyte 
        // when used in the binary sense to 
        // mean 2^20 bytes, which conflicts with 
        // the definition of the prefix mega
        .stack_size(1) // default is 2  
        .spawn(move || {
            println!("Hello, world!");
        });
}
```

线程中sleep
```Rust
fn main() {
    let t1 = thread::spawn(|| {
        thread::sleep(Duration::from_secs(2));
        println!("Thread 1");
    });

    let t2 = thread::spawn(|| {
        println!("Thread 2");
    });

    let t3 = thread::spawn(|| {
        println!("Thread 3");
    });

    t1.join();
    t2.join();
    t3.join();
}
```
这在大多数语言中非常常见，我们可以添加sleep命令并等待一段时间。对于时间和一致性窗口，这可能会很有趣。或者只是为了减轻负荷。

线程本地存储
```rust
fn main() {
    use std::cell::RefCell;

    // create a local store
    thread_local! {
        pub static THREAD_LOCAL_VALUE: RefCell<u32> = RefCell::new(23);
    }

    THREAD_LOCAL_VALUE.with(|value| {
        *value.borrow_mut() = 3;
    });

    let t1 = thread::spawn(|| {
        THREAD_LOCAL_VALUE.with(|value| {
            *value.borrow_mut() = 12;
        });
    });

    t1.join().unwrap();

    THREAD_LOCAL_VALUE.with(|value| {
        println!("{}", *value.borrow());
    })
}
```
我们可以看到我们正在使用 RefCell。 Refcell 不是线程安全的！ 这样做的目的是创建一个线程本地化的值存储，可以在每个线程中访问，而不会出现所有权问题。
因为该值保持本地化，因此thread0无法访问thread1的值。

停靠线程
```Rust
fn main() {
    let t1 = thread::spawn(|| {
        println!("park thread");

        thread::park();

        println!("unpark");
    });

    thread::sleep(Duration::from_secs(2));
    t1.thread().unpark();

    t1.join();
}
```
我们可以停一个线程，然后继续等待。 这篇文章已经很长了，所以我将跳过在 sys 调用中查找并查看系统上实际发生的情况的部分。

线程与Atomic bool
```rust
fn main() {
    let atomic_lock = Arc::new(AtomicBool::new(true));
    let atomic_lock2 = atomic_lock.clone();

    let t1 = thread::spawn(move|| {
        atomic_lock2.store(true, Ordering::SeqCst);
    });

    t1.join();

    println!("{}", atomic_lock.load(Ordering::SeqCst));
}
```
所以让我们更详细地看一下这个。我们创建一个atomic boolean 值并将其放在Arc中。

Arc是什么？ Arc 是指向我们的值的线程安全引用计数器 / 智能指针。 要真正跨线程使用某些东西，我们需要避免所有权问题。

如果我们能用
```rust
let atomic_lock = Arc::new(AtomicBool::new(true));
```
然后申请
```rust
let t1 = thread::spawn(move|| {
        atomic_lock.store(true, Ordering::SeqCst);
    });
```
我们可以通过代码移动到线程来转移所有权。
所以我们需要在它上面调用克隆。
```rust
let atomic_lock2 = atomic_lock.clone();
```
这将引用计数器增加到2，我们可以安全地将对值的第二个引用传递给线程。 并让我们的主线程(fn main)与我们的额外线程(thread: : spawn)共享状态。
```rust
atomic_lock.store(true, Ordering::SeqCst);
```
![31xdyq.jpg](https://cdn.hashnode.com/res/hashnode/image/upload/v1559923773502/rFYl7jiuw.jpeg)

现在我们开始讨论CPU和内存模型有用的部分。

## Atomics and ordering
Rust中的原子实现了LLVM屏障
* Relaxed 
* Release
* Acquire
* AcqRel
* SeqCst
  
它们不仅定义了Atomics的行为，还定义了他周围的代码的执行顺序。这意味着关于线程之间的代码执行顺序的保证可能与我们期望的非常不同

一旦我们进入"多线程"的领域，我们必须理解，我们实际上需要考虑类似于一个具有更低延迟的通用分布式系统模型，。

你拥有的核心越多，你拥有的不同的系统和存储就越多。 这就是 MESI 所暗示的。 如果我们在3个不同的缓存中有一个共享状态 s，我们不能保证基于执行顺序，除非我们特别告诉 CPU。

这就是Atomic和屏障对于它来说是一种在指令级别强制执行顺序的方法！这些仅由某些CPU支持。

但是想想看，基于"状态"有4个核心和1个 RAM 有类似的问题，如4个通过网络连接的单核心。

## 一致性
![sequency.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1559923885778/1GjOqLV5N.png)

杰普森

### SeqCst - 顺序一致性
循序一致性是我们想要的默认模式。 它确实解决了很多问题，我们很少需要在教学水平上进行优化。
因此，假设这个模型将覆盖90% 的普通开发人员情况，我们很少需要移动到另一个。
那么这意味着什么呢？ 这意味着在所有线程中，代码的执行顺序将保持与我们编程时一样，我们阻止缓存重新排序和其他优化步骤，因为我们希望正确性高于效率。
### Relaxed
Relaxed 正如它的名字所暗示的那样，它是一个约束最少的atomic

它被定义为单调秩序。 单调是一个数学术语，描述一个函数只能向一个方向移动，例如在 n 的集合中的一个加法。
例如：

1 + 2 + 1 + 4 + 5 + 1 + 4 + 2是单调的
1 + 2 2 + 2 4是单调的
1 + -1 + 2 + 5不是单调的，因为我们通过减去'改变'方向
也就是说它永远不会回到从前的状态。 所以如果我们可以看看我们的代码，它显示了这种行为，放松将是一个合适的选择。 然而，大多数时候我们会编写不符合这个描述的代码，所以..。 一个不太可能有意识的选择。

对于 CPU 来说，单调的 fence 只是意味着它不必太在意其他状态，因为它们可以被移动(MESI-intercache movements) ，因为 fence 中的指令是单调的。

### Aquire, Release 和 AcqRel
现在我们来看一些有希望真正帮助理解这意味着什么的东西:

#### Aquire用于装载的
```rust
let x = AtomicUsize::new(0);
let mut result = x.load(Ordering::Acquire);
result += 1;
x.store(result, Ordering::Release); // The value is now 1.
```
#### Release是为了存储

Aquire 保证后面的代码是有序的，Release 保证前面的代码是有序的。

因此，在Aquire和Release之间将保持执行顺序。

这主要意味着如果你有两个线程运行不同的代码，那么在获取之前线程 a 中发生的所有事情都是可以被线程 b 观察到的。 然而，要观察线程 a 在获取锁之后发生的事情，线程 b 也需要一个获取锁。
因此，对于那些不了解这一点的人，这是一篇关于这种行为的非常好的文章[information](https://hashnode.com/util/redirect?url=https://medium.com/nearprotocol/rust-parallelism-for-non-c-c-developers-ec23f48b7e56)。

接下来，我将用互斥体构造继续线程主题。

## Mutex 互斥
```rust
fn main() {
    let state = Arc::new(Mutex::new(0));
    let shared_state1 = state.clone();
    let shared_state2 = state.clone();

    let t1 = thread::spawn(move|| {
        while *shared_state1.lock().expect("access_state") < 10 {
            thread::sleep(Duration::from_millis(20));
            println!("current state {}", shared_state1.lock().expect("access_state"));
        }

        println!("reached {}", shared_state1.lock().expect("access_state"));
    });

    let t2 = thread::spawn(move|| {
        while *shared_state2.lock().expect("access_state") < 11 {
            thread::sleep(Duration::from_millis(100));
            let mut state = shared_state2.lock().expect("access_state");
            *state = *state + 1;
        }
    });

    t1.join();
    t2.join();
}
```
什么是互斥？ Mutex 来自"相互独占"，这意味着一次只允许1个线程访问值。

这个例子基本上使用两个线程。 一个在倒计时，另一个在检查状态。

sleep是唯一这样的程序实际上显示的东西除了'10'和退出; d

Mutex是最直接的概念之一，它是一个基本的异或，你或我可以拥有资源而不是我们两个。

## RwLock
```rust
fn main() {
    let state = Arc::new(RwLock::new(0));
    let shared_state1 = state.clone();
    let shared_state2 = state.clone();

    let t1 = thread::spawn(move|| {
        while *shared_state1.read().expect("access_state") < 10 {
            thread::sleep(Duration::from_millis(20));
            println!("current state {}", shared_state1.read().expect("access_state"));
        }

        println!("reached {}", shared_state1.read().expect("access_state"));
    });

    let t2 = thread::spawn(move|| {
        while *shared_state2.read().expect("access_state") < 11 {
            thread::sleep(Duration::from_millis(100));
            let mut state = shared_state2.write().expect("access_state");
            *state = *state + 1;
        }
    });

    t1.join();
    t2.join();
}
```
RW lock必不可少，为您提供类似mutex的选项，其中一个核心优势就是可以共享读锁。因此，如果一个线程调用读锁定，其他线程也可以。

只有写锁可以由1个线程保持。

我希望至少你们中的一些人会喜欢我的文章，这篇文章涉及了如此多的主题，我只是触及了表面，因为实际上我想做一些系统调用，看看操作系统上的不同之处。
