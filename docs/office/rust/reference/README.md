# Rust 语言参考

> **本书同步于官方 [The Rust Reference](https://doc.rust-lang.org/reference/index.html) 仓库[地址](https://github.com/rust-lang-nursery/reference/),欢迎参与！**

> 源 [introduction](https://github.com/rust-lang-nursery/reference/blob/master/src/introduction.md) &nbsp; Commit: a2405b970b7c8222a483b82213adcb17d646c75d

# 介绍
本书是Rust编程语言的主要参考。它提供三种材料：

- 非正式描述每种语言结构及其用法的章节。
- 非正式描述内存模型，并发模型，运行时服务，链接模型和调试工具的章节。
- 附录章节提供了影响设计的语言的基本原理和参考。

警告：本书不完整。记录所有内容需要一段时间。有关本书中未记录的内容，请参阅[GitHub问题](https://github.com/rust-lang-nursery/reference/issues)。

## 本书不是什么

本书不作为该语言的介绍。假设背景熟悉该语言。有一本单独的[书](https://rustlang-cn.org/office/rust/book/)可以帮助获得这种背景知识。

本书也不作为 语言分发中包含的标准库的参考。通过从源代码中提取文档属性，可以单独记录这些库。人们可能期望语言功能的许多功能都是Rust中的库功能，所以你在寻找的可能就在那里，而不是在这里。

同样，本书通常不会记录`rustc`作为工具或Cargo的具体情况。`rustc`有自己的书。Cargo有一本包含参考的[书](https://rustlang-cn.org/office/rust/cargo/)。有一些页面，如[链接](https://rustlang-cn.org/office/rust/reference/linkage.html)仍然描述`rustc`如何工作。

本书也仅作为稳定Rust中可用内容的参考。有关正在处理的不稳定功能，请参阅[不稳定的书籍](https://doc.rust-lang.org/nightly/unstable-book/)。

最后，这本书不是规范性的。它可能包含特定于`rustc`自身的详细信息，不应将其视为`Rust`语言的规范。我们打算有一天会制作这样一本书，在那之前，本书是我们最接近的一本书。


## 如何使用本书

本书不假设您按顺序阅读本书。每章通常可以单独阅读，但会链接到其他章节，以了解他们所参考的语言的各个方面，但不进行讨论。

阅读本文档有两种主要方式。

首先是回答一个具体问题。如果您知道哪个章节回答了该问题，则可以跳转到目录中的该章节。否则，您可以按顺序或点击顶部栏上的搜索与您的问题相关的关键字。例如，假设您想知道何时删除在`let`语句中创建的临时值。如果您还不知道临时表的生命周期在表达式章节中定义，您可以搜索"temporary let"，第一个搜索结果将带您到该部分。

第二是通常提高你对语言方面的了解。在这种情况下，只需浏览目录，直到您看到想要了解更多信息的内容，然后开始阅读。如果链接看起来很有趣，请单击它，然后阅读该部分。

也就是说，读这本书没有错误的方法。阅读它，你得到最好的帮助。

### 约定

像所有技术书籍一样，本书在如何显示信息方面有一些约定。这些约定在此处记录。

- 定义术语的语句包含斜体字。只要在该章之外使用该术语，它通常是具有此定义的部分的链接。

一个示例性术语是所定义的术语的例子。

- 在引用中包在语言不同版本的差异，以粗体中的"版本差异"开头。

> 版本差异：在2015版中，此语法有效，自2018年版起不允许使用。

- 包含有关本书状态的有用信息或指出有用但大多数超出范围的信息的注释在块引号中，以粗体中的 "注意"：开头。

> 注意：这是一个示例说明。

- 在语言中显示不正确行为的警告或可能混淆语言功能的交互都在一个特殊的警告框中。

> 警告：这是一个示例警告。

文本内嵌的代码片段是`<code>`内部标记。

较长的代码示例位于突出显示语法的框中，该框具有用于复制，执行和显示右上角隐藏线的控件。

  ```rust
  # // This is a hidden line.
  fn main() {
      println!("This is a code example");
  }
  ```

* 语法和词汇结构在块引用中，以“ 粗体上标 ”中的“Lexer”或“Syntax” 作为第一行。

  > **<sup>Syntax</sup>**\
  > _ExampleGrammar_:\
  > &nbsp;&nbsp; &nbsp;&nbsp; `~` [_Expression_]\
  > &nbsp;&nbsp; | `box` [_Expression_]

  有关[详细信息]，请参阅表示法。

## 特约

我们欢迎各种贡献。

您可以通过打开问题或向[The Rust Reference repository]存储库发送拉取请求来为本书做出贡献。如果本书没有回答您的问题，并且您认为其答案在其范围内，请不要犹豫，在Discord的`#docs`频道中 提出问题或询问。了解人们最常使用本书有助于引导我们注意使这些部分成为最佳部分。


[The Rust Reference repository]: https://github.com/rust-lang-nursery/reference/
[_Expression_]: expressions.html
[详细信息]: notation.html
