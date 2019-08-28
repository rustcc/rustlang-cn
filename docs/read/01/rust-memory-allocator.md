![img](https://images.wallpaperscraft.com/image/dragon_girl_forest_art_96504_1366x768.jpg)

# Rust内存分配器的不同行为

> 本文出自[Rust内存分配器的不同行为](https://zhuanlan.zhihu.com/p/54066600)，同步于[Rust中文阅读：Rust内存分配器的不同行为](https://rustlang-cn.org/read/rust/2019/rust-memory-allocator.html) ,本文时间：2019-01-07, 作者：[Pslydhh](https://www.zhihu.com/people/Pslydhh/activities)，简介：Pslydhh

[Rust中文首页](https://rustlang-cn.org),[欢迎加入](https://github.com/rustlang-cn/Important/issues/1)Rust中文,共建Rust语言中文网络！欢迎向Rust中文阅读投稿,[投稿地址](https://github.com/rustlang-cn/rustlang-cn)


对于如下的代码，采用nightly version：

```rust
use std::sync::mpsc;
use std::thread;
fn main() {
    const STEPS: usize  = 1000000;
    thread::sleep(std::time::Duration::from_millis(10));
    let now = std::time::Instant::now();

    let (tx1, rx1) = mpsc::channel();
    for _ in 0..STEPS {
        let _ = tx1.send(1);
//    }
//    for _ in 0..STEPS {
        assert_eq!(rx1.try_recv().unwrap(), 1);
    }

    let elapsed = now.elapsed();
    println!("recv duration: {} secs {} nanosecs\n", elapsed.as_secs(), elapsed.subsec_nanos());
    thread::sleep(std::time::Duration::from_millis(10000));
}
```

在我的linux上，观察输出"recv duration..." 之后进程RES的占用量：

- 如图注释：1824 kb
- 删除注释：48540 kb

直觉上来说这是令人奇怪的，因为不管先send 1000000个元素，再try_recv这1000000个元素，或者 send/recv成对操作，操作完之后进程的内存占用应该是几乎一致的。

于是我提交了这个[Issue：Different behaviors of allocator in nuanced snippets](https://github.com/rust-lang/rust/issues/56929)

对方表示在删除注释的情况下，一开始就send了百万级别的对象，在进程中开辟了一块非常大的内存，于是随后的try_recv就不会回收内存了，这是一个几乎所有内存分配器都会做的优化，因为很可能你的程序随后就会再次使用那一大块内存。

这么说也算是一种合理的选择吧，在我们上面这样单线程程序下没什么问题，但是在多线程的情况下呢？这种对于内存的重用能不能跨线程重用呢？毕竟假如一个线程保留了一大块内存，另一个线程又保留一大块内存，那么进程本身会不会直接被killed呢？

我们来看与上述类似的一个例子：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    const STEPS: usize  = 1000000;
    thread::sleep(std::time::Duration::from_millis(10));
    let now = std::time::Instant::now();

    let t = thread::spawn(|| {
        let t = thread::spawn(|| {
            let (tx1, rx1) = mpsc::channel();
            for _ in 0..STEPS {
                let _ = tx1.send(1);
            }
            for _ in 0..STEPS {
                assert_eq!(rx1.try_recv().unwrap(), 1);
            }
        });

        t.join().unwrap();

        let (tx1, rx1) = mpsc::channel();
        for _ in 0..STEPS {
            let _ = tx1.send(1);
        }
        for _ in 0..STEPS {
            assert_eq!(rx1.try_recv().unwrap(), 1);
        }
    });

    t.join().unwrap();

    let (tx1, rx1) = mpsc::channel();
    for _ in 0..STEPS {
        let _ = tx1.send(1);
    }
    for _ in 0..STEPS {
        assert_eq!(rx1.try_recv().unwrap(), 1);
    }

    let elapsed = now.elapsed();
    println!("recv duration: {} secs {} nanosecs\n", elapsed.as_secs(), elapsed.subsec_nanos());
    thread::sleep(std::time::Duration::from_millis(10000));
}
```

观察输出"recv duration..." 之后进程RES的占用量：

- RES: 142364 kb

差不多是前面那个例子的三倍，注意本例子启用了三个线程，也就是说，每个线程已经结束，它之前保留的内存居然还未归还给OS，**即使这些内存再也不能被使用到**。

到这里还只是内存不能使用。按照这个方式，有没有可能在程序合理的情况下，进程直接被killed呢？

我们把上面的STEPS改为50000000，在我的机器上直接被killed。如果把例子改一下，减少一个线程，那么它又能合理的运行了。

对于这个问题，对方回应称 [This is nothing Rust can control](https://github.com/rust-lang/rust/issues/56929#issuecomment-448546065)。也许通过修改内存分配器能够修改它的行为？

**好在对于后面这个例子，目前的stable版本(rustc 1.31.1)是能够回收内存的**
