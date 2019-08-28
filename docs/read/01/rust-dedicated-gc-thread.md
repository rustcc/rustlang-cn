![img](https://images.wallpaperscraft.com/image/clouds_mountains_art_127406_1366x768.jpg)

# Rust: Dedicated GC thread

> 本文出自[Rust: Dedicated GC thread](https://zhuanlan.zhihu.com/p/54085497)，同步于[Rust中文阅读：Rust: Dedicated GC thread](https://rustlang-cn.org/read/01/rust-dedicated-gc-thread.html) ,本文时间：2019-01-07, 作者：[Pslydhh](https://www.zhihu.com/people/Pslydhh/activities)，简介：Pslydhh

[Rust中文首页](https://rustlang-cn.org),[欢迎加入](https://github.com/rustlang-cn/Important/issues/1)Rust中文,共建Rust语言中文网络！欢迎向Rust中文阅读投稿,[投稿地址](https://github.com/rustlang-cn/rustlang-cn)

[crossbeam-epoch](https://zhuanlan.zhihu.com/p/44169722)是一个并发环境下内存回收的框架，它作为crossbeam中多种并发数据结构的基础。所以必须足够高效。

但是它具有如下缺点：

* 全局epoch被所有的应用线程写入。
* 为了安全回收内存，所有应用线程都可能循环所有应用线程构成的local epoch。
* 垃圾的回收时机不友好：每个线程维护自己的pin_count，用于统计解除并发数据结构的次数。比如每达到128次尝试回收一次内存，而不管此时是否有内存需要被回收。

于是我尝试把内存回收的所有工作放到一个专门的线程里来处理，[dedicated GC thread](https://github.com/crossbeam-rs/crossbeam/issues/287).

它除了没有以上3个缺点之外，工作方式如下：

* 应用线程不断收集待回收数据，通过std::mpsc与GC thread通信，当收集足够的数据量时给GC thread一个notify，比如每收集1024个待回收数据。
* GC thread通过std::mpsc recv一个信号，那么根据信号内容便知道有多少个array的数据待回收了，之后先是增加epoch的值，然后将刚刚收集的信息放到本地的vec里面。再之后我们等到所有应用线程的epoch都达到某个数值，那么便可以安全回收那一批数据。
* GC thread必须等到所有应用线程的本地epoch都达到某个数值才能安全回收内存。

GC thread核心的逻辑是如下代码片段：

```rust
loop {
    epoch = epoch + 1;
    let block_id = receiver.recv().unwrap();

    // add one to the global epoch
    collector.global.epoch.store_epoch(epoch, Ordering::Release);
    let guard = pin_for_dedicate(Some(&handle));
    
    // if block_id > max_block_id: new slice could be reclaimed at future.
    if block_id > max_block_id {
    
        // means if all threads' epoch reach/will reach epoch, the slice(.., block_id) of queue
        // blocks could be reclaimed
        array.push( (Cell::new(block_id - max_block_id), epoch) );
        max_block_id = block_id;
    }
    
    // for reclaim
    if array.len() > 0 && (epoch - array[0].1) >= EPOCH_EVOLUTION{
    
        // try to wait all threads reach epoch. 
        // this must be fast, because the epoch(array[0].1) has been a long time.....
        collector.global.wait_until_epoch(array[0].1, &guard);

        // reclaim all objects in nums arrays.
        let nums = array[0].0.get();
        for _ in 0..nums {
             collector.global.drop_bags_per_block(&guard);
        }
        let _ = array.remove(0);
    }
}
```

我们这里看一下[drop_bags_per_block](https://github.com/Pslydhh/crossbeam/blob/dec65b57eafc9100730129e298173ed06fc2497e/crossbeam-epoch/src/internal.rs#L190)的源代码：

```rust
pub fn drop_bags_per_block(&self, guard: &Guard) {
    self.queue.drop_bags_per_block(guard);
}
```

[drop_bags_per_block in queue：](https://github.com/Pslydhh/crossbeam/blob/dec65b57eafc9100730129e298173ed06fc2497e/crossbeam-epoch/src/sync/queue.rs#L80)

```rust
pub fn drop_bags_per_block(&self, guard: &Guard) {
        let head_ptr = self.head.block.load(Ordering::Relaxed, &guard);
        let head = unsafe { head_ptr.deref() };

        for offset in 0..BLOCK_CAP {
            let slot = unsafe { &*head.slots.get_unchecked(offset).get() };

            unsafe {
                let slot = &*head.slots.get_unchecked(offset).get();
                let data = ManuallyDrop::into_inner(slot.msg.get().read());
                // reclaim memory hold by this element.
                drop(data);
            }
        }

        let next = head.next.load(Ordering::Relaxed, &guard);
        self.head.block.store(next, Ordering::Relaxed);

        unsafe{
            // reclaim memory of the array.
            drop(head_ptr.into_owned());
        }
}
```

这里只是将一个array上的内存数据按个回收，最后回收整个array的内存，并且它采用的数据结构也是 [链接的数组](https://zhuanlan.zhihu.com/p/34974186) 中介绍的并发队列。

所以如上的代码片段：

```rust
    // reclaim all objects in nums arrays.
    let nums = array[0].0.get();
    for _ in 0..nums {
        collector.global.drop_bags_per_block(&guard);
    }
    let _ = array.remove(0);
```

只不过就是连续回收这样的nums个数组内存，同时这个nums是本地的array维持的。

最后通过remove来删除它。这样的回收方式高效快捷，又没有竞争。

但是这样子安全吗？我们再看看前面一句的代码：

```rust
    // try to wait all threads reach epoch. 
    // this must be fast, because the epoch(array[0].1) has been a long time.....
    collector.global.wait_until_epoch(array[0].1, &guard);
```

这里把array[0].1也就是之前局部保存的epoch作为参数传入，我们来看看[wait_until_epoch](https://github.com/Pslydhh/crossbeam/blob/dec65b57eafc9100730129e298173ed06fc2497e/crossbeam-epoch/src/internal.rs#L169)的源代码：

```rust
pub fn wait_until_epoch(&self, epoch: usize, guard: &Guard) {
        // atomic::fence(Ordering::SeqCst);
        for local in self.locals.iter(&guard) {
            match local {
                Err(IterError::Stalled) => {}
                Ok(local) => {
                    loop {
                        let local_epoch = local.epoch.load(Ordering::Relaxed);
                        // array[0].2 is the block's epoch
                        if !local_epoch.is_pinned() || local_epoch.unpinned() >= epoch {
                            break;
                        }
                        // println!("yield_now");
                        thread::yield_now();
                    }                
                }
            }
        }
        atomic::fence(Ordering::Acquire);
}
```

这里明显看出，GC thread实质就是在等待应用线程退出本次epoch，或者已接触到更大的epoch：

```rust
if !local_epoch.is_pinned() || local_epoch.unpinned() >= epoch {
        break;
}
// println!("yield_now");
thread::yield_now();
```

等到所有应用线程都通过这里，那么我们就可以安全回收内存了。

所以**明显这是个阻塞的模式，会不会导致时间消耗过大呢？（尽管GC thread是个独立的专门回收内存的线程）**

我们再来看看调用wait_until_epoch之前的代码：

```rust
 // for reclaim
if array.len() > 0 && (epoch - array[0].1) >= EPOCH_EVOLUTION{
```

这里epoch是只通过GC thread不断增长，然后被发布的。array[0].1是前面某个epoch值。

这里的意思是只要epoch演进了足够多>= EPOCH_EVOLUTION，那么我们就进行array[0].1对应的那次回收。我们可以认为EPOCH_EVOLUTION越大，wait_until_epoch等待的时间越小，事实上这个值不用太大。

这样我们的GC thread就能够每次recv之后，只要epoch演进足够多，都能够成批量、确定地回收内存。个人认为这种方式非常高效。
