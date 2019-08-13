# [Riker](https://riker.rs/)

> [Riker英文](https://riker.rs/) - [Riker中文](/crates/riker/) - [API文档](https://docs.rs/riker/) - [Github](https://github.com/riker-rs/riker)

Riker : 用于构建现代，并发和弹性应用程序的Rust框架.

## 基于Actor的并发

Actors暴露了基于消息的API，导致快速，无阻塞的代码执行，同时还消除了竞争条件，使并发代码变得轻而易举。

## 自我修复

构建隔离并从故障中恢复的应用程序。Actors提供监督策略，构成Riker弹性应用程序设计的核心。

## 事件源和CQRS

使用事件源和命令查询责任分离（CQRS）来驱动极速的持久性数据应用程序。

## 通用

在云，微服务，物联网，无人机，人工智能等方面。Rust编译为OS二进制文件，没有VM或GC开销，只需要几兆字节的内存。

## 模块化

包括默认线程管理，并发日志记录，消息调度和数据持久性，并且可以切换以用于替代实现。

## 现代Rust设计

轻松执行Rust,Futures并且不使用不安全的代码。

```rust
struct MyActor;
impl Actor for MyActor {
    type Msg = String;
    fn receive(&mut self,
                ctx: &Context<Self::Msg>,
                msg: Self::Msg,
                sender: ActorRef<Self::Msg>) {
        println!("received {}", msg);
    }
}
let sys = ActorSystem::new(&model).unwrap();
let props = MyActor::props();
let a = sys.actor_of(props, "a").unwrap();
a.tell("Hello actor!".to_string(), None);
```
