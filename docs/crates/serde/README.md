# [Serde](https://serde.rs/)

> [Serde英文](https://serde.rs/) - [Serde中文](/crates/serde/) - [API文档](https://docs.rs/serde/) - [Github](https://github.com/serde-rs/serde)

---

**本书由Rust中文社区成员[kula](https://github.com/kulasama)贡献发起翻译，作者kula: [Github](https://github.com/kulasama) - [知乎](https://www.zhihu.com/people/kula1/activities) 欢迎加入！**

---


`Serde`, 是rust语言用来序列化和反序列化数据的一个非常高效的解决方案。

本质上，serde提供了一个序列化层的概念。可以将任何支持的数据格式反序列化成中间格式，然后序列化成任何一种支持的数据格式。

## 设计

同其他语言通过反射来实现序列化方案不同，serde基于rust的`trait`系统来实现自己的序列化，每种数据结构通过实现`serde`的`Serialize`和`Deserialize`接口来实现序列化功能，这种实现方案可以有效避免反射的性能开销。rust编译器可以在很多场景下对序列化进行高度优化,甚至可以达到一个资深工程师手写序列化代码的性能。

支持的数据格式
这里列举一下目前serde社区已经实现的一些数据格式。

- [JSON], the ubiquitous JavaScript Object Notation used by many HTTP APIs.
- [Bincode], a compact binary format used for IPC within the Servo rendering
  engine.
- [CBOR], a Concise Binary Object Representation designed for small message size
  without the need for version negotiation.
- [YAML], a popular human-friendly configuration language that ain't markup
  language.
- [MessagePack], an efficient binary format that resembles a compact JSON.
- [TOML], a minimal configuration format used by [Cargo].
- [Pickle], a format common in the Python world.
- [RON], a Rusty Object Notation.
- [BSON], the data storage and network transfer format used by MongoDB.
- [Avro], a binary format used within Apache Hadoop, with support for schema
  definition.
- [Hjson], a variant of JSON designed to be readable and writable by humans.
- [JSON5], A superset of JSON including some productions from ES5.
- [URL], the x-www-form-urlencoded format.
- [Envy], a way to deserialize environment variables into Rust structs.
  *(deserialization only)*
- [Envy Store], a way to deserialize [AWS Parameter Store] parameters into Rust
  structs. *(deserialization only)*

[JSON]: https://github.com/serde-rs/json
[Bincode]: https://github.com/TyOverby/bincode
[CBOR]: https://github.com/pyfisch/cbor
[YAML]: https://github.com/dtolnay/serde-yaml
[MessagePack]: https://github.com/3Hren/msgpack-rust
[TOML]: https://github.com/alexcrichton/toml-rs
[Pickle]: https://github.com/birkenfeld/serde-pickle
[RON]: https://github.com/ron-rs/ron
[BSON]: https://github.com/zonyitoo/bson-rs
[Avro]: https://github.com/flavray/avro-rs
[Hjson]: https://github.com/laktak/hjson-rust
[JSON5]: https://github.com/callum-oakley/json5-rs
[URL]: https://github.com/nox/serde_urlencoded
[Envy]: https://github.com/softprops/envy
[Envy Store]: https://github.com/softprops/envy-store
[Cargo]: http://doc.crates.io/manifest.html
[AWS Parameter Store]: https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-paramstore.html

## 数据结构

serde支持以下数据类型的序列化和反序列化，包括(`String`,`&str`,`usize`,`Vec<T>`,`HashMap<K,V>`)。此外，`serde`还提供`derive macro`来为你自己定义的数据类型提供序列化和反序列化的实现。下面给出`dervie macro`的`demo code`。

```rust
#[macro_use]
extern crate serde_derive;

extern crate serde;
extern crate serde_json;

#[derive(Serialize, Deserialize, Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let point = Point { x: 1, y: 2 };

    // Convert the Point to a JSON string.
    let serialized = serde_json::to_string(&point).unwrap();

    // Prints serialized = {"x":1,"y":2}
    println!("serialized = {}", serialized);

    // Convert the JSON string back to a Point.
    let deserialized: Point = serde_json::from_str(&serialized).unwrap();

    // Prints deserialized = Point { x: 1, y: 2 }
    println!("deserialized = {:?}", deserialized);
}
```
