# Rust数据布局

> 原文跟踪[data.md](https://github.com/rust-lang-nursery/nomicon/blob/master/src/data.md) &emsp; Commit: 885c5bc5e721a9a9e9f94ed2101ad3d5e4424975

数据布局对于低级编程来说非常重要，这是一个大问题。它也普遍影响了语言的其余部分，因此我们将首先深入研究如何在Rust中表示数据。

理想情况下，本章应该与语言参考中的[类型布局部分](https://doc.rust-lang.org/reference/type-layout.html)一致，是多余的。但本书最初编写时，语言参考完全失修，本书试图作为语言参考的部分替代品。现在已经不需要这样了，本章理应被删除。

我们将本章保持一段时间，但您应该为语言参考贡献任何新的事实或改进。
