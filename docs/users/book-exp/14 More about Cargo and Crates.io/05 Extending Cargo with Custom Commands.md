# Cargo 命令扩展

如何扩展 Cargo 命令：

- 通过 `cargo install` 安装 binary crate 时，有一些 binary crate 属于 cargo 的子命令，这些子命令的命名方式是 `cargo-xxx`
- 可以查看 binary crate 的安装目录（例如 `~/.cargo/bin/` ），只要命名方式为 `cargo-xxx` ，则可以使用类似 `cargo build` 这种 cargo 内置命令的方式来使用它们
- 可通过 `cargo --list` 来查看已安装的 cargo 子命令



例如，查看 cargo 子命令，可能得到的清单如下：

```shell
$ cargo --list
Installed Commands:
	--snip--
	clippy
	fmt
	miri
```

则可以执行子命令：

```shell
$ cargo fmt
```

