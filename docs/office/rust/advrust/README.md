# Rust高级编程

> 源：[README](https://github.com/rust-lang-nursery/nomicon/blob/master/src/README.md) &nbsp; Commit: 47d081061ea4db3cf3bd2bcaa369d1cac1c479e3 

**同步于官方 [The Rustonomicon](https://doc.rust-lang.org/nomicon/) 仓库[地址](https://github.com/rust-lang-nursery/nomicon)！** 本书部分内容基于[rustonomicon_zh-CN](https://github.com/tjxing/rustonomicon_zh-CN),感谢作者.现将与Rust官方文档同步更新.

> **本书的知识均“按其现状”提供，无任何明示或暗含的担保，包括但不限于释放让你的心灵在不可思议的无限宇宙破碎飘零的不可名状的恐惧。**

本书深入介绍了编写`Unsafe Rust`程序时需要了解的所有细节。

如果你仍然期待着拥有一个长期且快乐的Rust编程生涯，那么现在就转身离开，彻底忘掉你曾经见到过这本书——你并不会感到生活有什么缺憾。但是，如果你计划编写非安全代码——或者仅仅是想探究一下这门语言的内在秘密——本书将给你许多有用的信息.

与[《Rust编程语言》](https://rustlang-cn.org/office/rust/book/)一书不同，我们将假设你事先具有足够的知识。特别地，您应该熟悉系统编程和基本的 Rust 知识。如果您不能适应这些主题，则应考虑首先阅读《Rust编程语言》一书。但我们不会假设您已经阅读过《Rust编程语言》；如果你愿意，你可以直接阅读本书，我们会在适当的情况下偶尔回顾一下基础知识。 但注意我们不会从头开始解释一切。

本书基本上是作为[《Rust 语言参考》](https://rustlang-cn.org/office/rust/reference/)的一个高层次的补充。语言参考提供了 Rust 各个部分详细的句法和语义，而本书则解释了如何将各个部分结合起来，以及在这过程中你需要注意的问题。

《Rust 语言参考》将告诉你引用、析构器和栈解退的句法和语义，但它不会告诉你将它们合在一起时，会导致异常安全问题，也不会告诉你如何处理这些问题。

需要说明的是，本书最初编写的时候，《Rust 语言参考》处在彻底的失修状态中，许多本来应该在语言参考中出现的内容只能在本书查到。后来，《Rust 语言参考》编写恢复了正轨，得到了恰当的维护，尽管它还远远没有达到完善的程度。现在，如果本书和语言参考有矛盾的地方，一般可以认为语言参考是正确的。（并不是说它就是绝对标准，只是因为语言参考被维护地更好而已）

本书涉及到的主题包括：(un)safety 的含义，语言和标准库提供的基本 unsafe 构件，在这之上构建安全抽象的技术，子类型和变型（[Variance](https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science))），异常安全（恐慌/栈解退安全），使用未初始化内存，类型双关（[type punning](https://en.wikipedia.org/wiki/Type_punning)），并发，与其他语言交互，优化技巧，语言构造如何映射到编译器/系统/硬件基元，如何**不**创造一个让人生气的内存模型，为什么你**将会**制造让人生气的内存模型，等等。

本书不会详尽描述每一个标准库的 API 的语义和保证，也不会详尽描述每一个 Rust 的语言特性。
