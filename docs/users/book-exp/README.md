# 「Rust-the-Book」学习心得

## 作者

作者 [@lindorof](https://lindorof.github.io) ，特别感谢 [@krircc](https://github.com/krircc) 的热心帮助。

## 说明

#### 本书的起源

基于对 RUST 官网[「The Book」](https://doc.rust-lang.org/book/index.html)英文版的学习，翻译为中文，但更主要的是加入了自己的心得和总结，从而整理形成本书。

#### 为何阅读「The Book」英文版

刚开始是阅读的中文翻译版本 [中文版《Rust编程语言》](https://rustlang-cn.org/office/rust/book/)，但发现有些翻译太生硬（只是个人感受），因此转而阅读官方英文版，同步进行翻译，并记录心得总结，所以形成本书；同时，本书并不代表比原中文翻译版本要好。

#### 本书的目的

可以当做另一个[「The Book」](https://doc.rust-lang.org/book/index.html)中文版，当未来需要查阅文档时，直接参看本书即可，可以不用再费劲翻阅官方英文版（英文水平逆天的除外）。

#### 关于本书的内容

第一，本书的章节顺序、章节名称、章节内容都遵循[「The Book」](https://doc.rust-lang.org/book/index.html)；第二，对于具体的某一章，其中的内容讲解顺序可能会进行调整，或者增加自己的心得和总结，或者增加自己的一些拓展，形成本章中一个独立的小节，但内容范围都不变。

#### 抛砖引玉

在学习的过程中，有的内容是自己暂时看不明白、或者自己暂时理解但不一定正确的结论，因此将对应文字背景标黄，以免误导读者。

## 源码

针对部分章节，编写了完整的 project 代码。

代码地址：[Code of The Book](https://gitee.com/A1G2G1/Rust_The_Book.git)

另外，对于涉及到代码 project 的章节，都在章节内容开头标注了对应的 project 名称。

## <font color="#dddd00">改进</font>

#### 说明

1. 本书最初记录于笔记软件，现迁移到该平台，因此出现了部分不兼容的 MD 语法，等待改进
2. 学习过程中会存在遗留问题，可能会在问题解决以后增加或修改章节内容，因此也记录在此处

#### 流程图表

使用了 ```mermaid``` 图表，目前暂时展现不出来，等待改进。涉及到的章节：

- Chapter 07 模块
- Chapter 11 自动测试
- Chapter 12 命令行
- Chapter 14.2 发布 Crate
- Chapter 14.3 Workspace

#### 关于 Chapter13

- 对于 Closure ，暂时不清楚能否拓展为 Generic ，让 Closure 也支持泛型。也许随着本书的学习，很快就有答案，暂时记录一下该问题