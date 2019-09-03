# 安装 Binary Crate

何为 binary crate ：

- 有 ***binary target*** 的 crate
- 而 ***binary target*** 的意思是可执行程序
- 如果一个 crate 有 `src/main.rs` 或者其它 binary 文件，就会创建可执行的 ***binary target***
- 相反的，***library target*** 指的是自身不能运行，但是可以被包含到其它程序中
- 通常来说，crate 的 `README` 文件会描述该 crate 是 ***library crate*** 还是 ***binary crate*** ，或者二者都是
- binary crate 也会发布到 [crates.io](https://crates.io/) ，且 rust 开发者可以安装到本地并直接使用它们



如何安装 binary crate ：

- 通过 `cargo install xxx` 进行安装
- 安装以后，binary crate 会被存储在本地，默认路径是 `$HOME/.cargo/bin`
- 确保上述路径已被配置在操作系统的 `$PATH` 中，从而可以直接在命令行运行这些 binary crate



举例：安装 Chapter12 提到的 `ripgrep` ：

```shell
$ cargo install ripgrep

Updating crates.io index
Downloading ripgrep v x.x.x

Installing ~/.cargo/bin/rg
```

> 注意最后一句，`~/.cargo/bin/` 表示存储路径，`rg` 表示该 binary crate 的名称

然后可以使用 `ripgrep` ，例如：

```shell
$ rg --help
```

