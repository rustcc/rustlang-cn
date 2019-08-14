# Safe 和 Unsafe 如何交互

> 原文跟踪[safe-unsafe-meaning.md](https://github.com/rust-lang-nursery/nomicon/blob/master/src/safe-unsafe-meaning.md) &emsp; Commit: b6e3cbf5b0f12df1d5e30198ef7cfc17d9c70b6e

Safe Rust 和 Unsafe Rust 之间是什么关系呢? 它们之间如何相互作用呢?

用 `unsafe` 关键字控制 Safe Rust 和 Unsafe rust 之间的界限, 对两者来说就像一个接口(interface). 这也是为什么我们称 Rust 是一个安全的编程语言: 所有不安全的部分都只出现在 `unsafe` 的界限之后. 如果你愿意, 你甚至可以把 `#![forbid(unsafe_code)]` 加入到你的代码中, 用来保证你只写安全的 Rust 代码.

`unsafe` 关键词有两个用处: 声明编译器无法检查的约束, 或声明程序员已经检查过这部分逻辑并符合约束.

你可以用 `unsafe` 指明**函数**和 **trait 声明**存在未被检查的约束. 方法中, `unsafe` 意味着方法的用户必须查阅其文档, 以确认他们在使用 上符合方法维护者的规范要求. 在 trait 中, `unsafe` 意味着 rait 的实现者必须查阅其文档, 以确认他们的实现符合 unsafe trait 维护者的规范要求.

你还可以用 `unsafe` 一块作用域内, 所有不安全动作的执行, 都经过相应使用约定的规范的验证. 举例来说, 传给 `slice::get_unchecked` 的索引参数, 就是受使用约定规范约束的.

你可以在 trait 的实现上使用 `unsafe` 来声明这个实现, 遵守 trait 的使用约定规范. 举个例子, 一个类型其 `Send` trait 的实现, 就是可以安全的移动到其他线程.

Rust 标准库有一系列的 unsafe 方法或函数, 包括:

-   `slice::get_unchecked`, 执行了未检查的索引查找, 允许了自由违反内存安全的约定准则.
-   `mem::transmute` 将某些值重新解释为具有给定类型, 很随意的就绕过了类型安全(详情可查阅 [conversions])
-   每个指向一个 sized 类型的原始指针(raw pointer), 都有 `offset` 方法, 如果传递的 offset 不是 ["in bounds"][ptr_offset], 则会触发未定义的行为.
-   调用所有 FFI(外部方法接口) 的方法都是 `unsafe` 的, 因为 rust 不能检查其他语言做的非安全的操作行为.

Rust 1.29.2 版本的标准库定义了如下unsafe trait (其他还有, 但是其他的目前不稳定, 后续可能会继续改动, 而其中有一些可能会是一直不稳定的状态):

-   [`Send`] 是一个标记 trait(没有 API 的 trait), 用来承诺: 其实现的类型可以安全的发送(移动)到另一个线程.
-   [`Sync`] 也是一个标记 trait, 用来承诺: 不同线程可以通过一个共享引用, 来安全的共享其实现的数据或类型.
-   [`GlobalAlloc`] 允许整个程序的内存自定义分配

很多 Rust 标准库其实也在使用其内部使用 Unsafe Rust. 那些非安全的实现, 通常会经过非常严格的人肉检查, 所以说, 在非安全实现的基础上, 构建的安全 Rust 的接口, 是可以认定为是安全的.

为什么需要分离 Safe Rust 和 Unsafe Rsut, 其实是归结到一个 Safe Rust 的一个基础特性:

**不管如何, Safe Rust 不会引起未定义的行为**

Rust safe/unsafe 的拆分设计, 意味着它们之间存在着不对称的信任关系. Safe Rust 天然的相信所有其触及的 Unsafe Rust, 盲目相信 Unsafe Rust 的编写是正确的. 另一方面, Unsafe Rust 必须非常谨慎的相信 Safe Rust.

举个例子, Rsut 用 trait `PartialOrd` 和 `Ord` 来区分"仅仅"用来比较的类型, 和那些提供"全序"排序关系的类型(译者注: [全序关系可参考](https://zh.wikipedia.org/wiki/%E5%85%A8%E5%BA%8F%E5%85%B3%E7%B3%BB))的类型(这就基本意味着排序关系的行为是合理的).

`BTreeMap` 对只实现了偏序关系(partially-ordered)的类型来说毫无意义, 它要求类型实现关键 trait `Ord`. 但是, `BTreeMap` 内部的实现包含 Unsafe Rust 代码. 因为一个不合格的 `Ord` 实现(但是是 Safe 的)而导致未定义的行为是不可接受的, BTreeMap 内部编写了 Unsafe Rust 代码用来保证 `Ord` 实现是真正的全序关系顺序, 提升了代码健壮性, 即使它只有 `Ord` trait 的约束.

Unsafe Rust 代码通常假定 Safe Rust 代码不一定正确. 也就是说, `BTreeMap` 仍然会表现的不正常如果你传入的值不是全序关系顺序的. 但是它永远不会导致未定义的行为.

也许你可能会好奇, 如果 `BTreeMap` 因为 `Ord` 是 Safe 的而不信任它, 为什么它可以信任其他 Safe 的代码呢? 举个例子, `BTreeMap` 的正确编写依赖整型(integer)和切片(slice)的实现, 它们都是 Safe 的对吧?

区别之一是范围. `BTreeMap` 依赖整型和切片, 它依赖的是非常具体的整型和切片的实现. 这是一种衡量收益与可控风险的平衡. 这个例子里基本上是零风险; 如果整型和切变出问题, 那大家一起都出问题. 还有维护整型和切片的和维护 `BTreeMap` 的其实是同一波人, 所以可以容易的对它们同时保持密切的关注.

另一方面, `BTreeMap` 用泛型定义了其关键类型. 信任其 `Ord` 的实现意味着相信每一个 `Ord` 过去现在未来的实现. 所以它的风险在于: 有人在某些地方可能会犯错或者搞砸了它们的 `Ord` 的实现, 或者干脆提供了一个假的全序关系顺序实现, 并且"看起来正常". 发生这种事情时, `BTreeMap` 需要为此做好准备.

同样的逻辑适用于你传递的闭包, 要求其的内部的行为实现正确.

`unsafe` trait 的存在, 就是去解决这种泛型无约束的问题. 理论上来说, `BTreeMap` 的关键类型实现约束, 可能更适合一个叫 `UnsafeOrd` 的新的 trait, 比 `Ord` 显然更好, 它可能看起来如下:

```rust
use std::cmp::Ordering;

unsafe trait UnsafeOrd {
    fn cmp(&self, other: &Self) -> Ordering;
}
```

然后, 某个类型可以使用 `unsafe` 来实现 `UnsafeOrd`, 明确表示它们的实现, 是保证受其约定的规范约束的. 在这种情况下, `BTreeMap` 内部的 Unsafe Rust 相信其关键类型的 `UnsafeOrd` 会被正确的实现, 是合理的. 如果实现不正确, 那明确就是 unsafe trait 的错误实现导致的, 这也是 Rust 一贯的安全保证.

是否标记 trait 为 `unsafe` 的决定, 是一个 API 设计的选择. 按照惯例, Rust 是尽可能避免这样做的, 因为这样会导致到处都是 Unsafe Rust, 我们并不希望这样. `Send` 和 `Sync` 被标记为 unsafe 因为线程安全是一个_基础属性_, 其 unsafe 的代码不可能像 预防一个有问题的 `Ord` 实现一样的方式去防御. 类似的, `GlobalAllocator` 保留了程序中所有内存的记录, 并且在其上构建了诸如 `Box` 或 `Vec` 之类的其他内容. 如果它做了一些奇怪的事情(当他分配一块仍正被使用的内存块出去), 是没有机会去检测到它并对它做出什么处理的.

决定是否标记你自己的 trait 为 `unsafe`, 取决于如上同样类型的考虑. 如果不能期望用 `unsafe` 代码以合理的方式去防御有问题的 trait 实现, 那么把这个 trait 标记为 `unsafe` 就是合理的选择.

顺便说一句, 虽然 `Send` 和 `Sync` 是 `unsafe` 的 trait, 但是当在其适用场景下, 证明是可以安全的的使用的, 它们 _同样_ 是被自动实现. `Send` 是自动推导出的, 其类型中的所有子类型都实现了 `Send`, 则类型本身就自动实现了 `Send`. `Sync` 同样也是, 其类型中所有子类型都实现了 `Sync`, 类型本身自动推导出实现了 `Sync`. 这么做最大限度的的减少了这两个 `unsafe` trait 被到处实现. 然后就不需要人们都去 _实现_ 内存分配器(memory allocator)(或直接使用它们).

这是 Safe 和 Unsafe Rust 之间的平衡. 这样的分离设计让 Safe Rust 尽可能的易于人们使用, 但是在编写 Unsafe Rust 时, 要求人们付出额外的努力和细心. 本书其余部分主要讨论类似需要谨慎注意的点, 和一些 Unsafe Rust 必须要遵守的约定和规范

[`send`]: ../std/marker/trait.Send.html
[`sync`]: ../std/marker/trait.Sync.html
[`globalalloc`]: ../std/alloc/trait.GlobalAlloc.html
[conversions]: conversions.html
[ptr_offset]: ../std/primitive.pointer.html#method.offset
