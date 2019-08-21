# Crates

## 内容目录

- [操作系统](#操作系统)
- [数据库](#数据库)
  - [数据库驱动](#数据库驱动)
- [数据结构](#数据结构)
- [文本](#文本)
- [文件格式](#文件格式)
- [容器](#容器)
- [GUI](#gui)
  - [Web](https://rustlang-cn.org/www/wasm.html)
  - [Native](#native)
- [Server](#server)
- [wasm](#server)
- [IOT](#iot)
- [科学计算](#科学计算)

## 操作系统

* [heim](https://github.com/heim-rs/heim) - 用于系统信息获取的跨平台异步库

## 数据库

### 数据库驱动

* [wither](https://github.com/thedodd/wither) - MongoDB的ODM基于mongo rust driver

## 数据结构

* [bytes](https://github.com/carllerche/bytes) - Utilities for working with bytes
* [voca_rs](https://github.com/e1r0nd/voca_rs) - The ultimate Rust string library
* [string](https://github.com/carllerche/string) - Rust String type with configurable byte storage.
* [intrusive-rs](https://crates.io/crates/intrusive-collections) - 用于创建侵入式集合的Rust库。目前支持单链接和双链接列表，以及红黑树。
* [linked-list](https://crates.io/crates/linked-list) - std :: collections :: LinkedList的替代实现
* [phf](https://crates.io/crates/phf) - Rust编译时 static maps
* [list_ursors](https://github.com/4e554c4c/list_cursors) - Linked list cursors
* [concread](https://github.com/firstyear/concread) - Rust的并发可读数据结构

## 文本

* [Ropey](https://crates.io/crates/ropey) - Ropey is a utf8 text rope library, designed to be the backing text buffer for applications such as text editors

## 文件格式

* [tomlenv](https://github.com/rustyhorde/tomlenv)  Manage your environment configuration with TOML

## 容器

* [hunit](https://github.com/kulasama/kunit) - Rust implementation of the Open Containers

## GUI

### [Web](https://rustlang-cn.org/www/wasm.html)

### Native
  
## Server

 > 前往[Awesome-Server](https://rustlang-cn.org/www/server.html)

## Wasm

 > 前往[Awesome-Wasm](https://rustlang-cn.org/www/wasm.html)
 
 ## IOT

 > 前往[Awesome-IOT](https://rustlang-cn.org/www/iot.html)

## 科学计算

* [lazy_static](https://crates.io/crates/lazy_static)

* [futures](https://crates.io/crates/futures)

* [Bitfields](https://docs.rs/bitflags/0.9.1/bitflags)

* [byteorder](https://docs.rs/byteorder/1.0.0/byteorder/)

* [itertools](https://docs.rs/itertools/0.6.0/itertools/)

* [memmap](https://docs.rs/memmap/0.5.2/memmap/)

* [rayon](https://docs.rs/rayon/0.8.2/rayon/)

* [reqwest](https://docs.rs/reqwest/0.6.2/reqwest/)

* [threadpool](https://docs.rs/threadpool/1.3.2/threadpool/)

* [walkdir](https://docs.rs/walkdir/1/walkdir/)

* [clippy](https://crates.io/crates/clippy)

* [tempfile](https://crates.io/crates/tempfile)

* [native-tls](https://crates.io/crates/native-tls)

* [regex](https://crates.io/crates/regex)

* [Date-time](https://crates.io/crates/chrono)

* [CLA](https://crates.io/crates/clap)
  * (https://crates.io/crates/docopt)

* [strings](https://crates.io/crates/strings)

* archive
  * [tar](https://crates.io/crates/tar)
  * [zip](https://crates.io/crates/zip)

* [bufio](https://crates.io/crates/bufstream)

* [bytes](https://crates.io/crates/bytes)

* compress
  * [bzip2](http://alexcrichton.com/bzip2-rs/bzip2/index.html)
  * [flate](https://docs.rs/flate2/0.2.19/flate2/)
  * [gzip](https://github.com/sile/libflate)
    * (https://github.com/oyvindln/deflate-rs)
  * [lzw](https://crates.io/crates/lzw)
  * [zlib](https://github.com/sile/libflate )
    * (https://github.com/oyvindln/deflate-rs)

* [crypto](https://github.com/briansmith/ring)
  * aes
  * cipher
  * des
  * dsa
  * ecdsa
  * elliptic
  * hmac
  * md5
  * rand
  * rc4
  * rsa
  * sha1
  * sha256
  * sha512
  * subtle
  * tls
  * x509
    * pkix

* [encoding](https://crates.io/crates/serde)
  * ascii85
  * asn1
  * base32
  * [base64](https://crates.io/crates/base64)
  * binary
  * [csv](https://crates.io/crates/csv)
    * [tsv](https://crates.io/crates/tsv) 
  * gob
  * hex
  * json
  * pem
  * xml

* hash
  * adler32
  * crc32
  * crc64
  * [fnv](https://crates.io/crates/fnv)

* [image](https://crates.io/crates/image)
  * color
    * palette
  * draw
  * gif
  * jpeg
  * png

* [log](https://crates.io/crates/log)
  * (https://docs.rs/log4rs/0.7.0/log4rs/)  
  * (https://crates.io/crates/env_logger)  
  * (https://crates.io/crates/slog) 
  * (https://crates.io/crates/log4rs)
  * [syslog](https://crates.io/crates/syslog)

* [math](https://docs.rs/num/0.1.39/num/)
  * [big](https://crates.io/crates/big)
  * cmplx
  * [rand](https://crates.io/crates/rand)

* [mime](https://crates.io/crates/mime)
  * [multipart](https://crates.io/crates/mime_multipart)
  * quotedprintable

* [net](https://crates.io/crates/net2/)
  * http
    * cgi
    -cookiejar
    * fcgi
    * httptest
    * httptrace
    * httputil
    * pprof
  * mail
  * rpc
    * jsonrpc
  * smtp
  * textproto
  * [url](https://crates.io/crates/url/)

* os
  * [exec](https://crates.io/crates/exec)
  * [signal](https://crates.io/crates/signal)
    * (https://crates.io/crates/tokio-signal)
  * [user](https://crates.io/crates/users/)

* [pat](https://github.com/saschagrunert/path)
  * filepath

* [reflect](https://crates.io/crates/typeable)

* [sort](https://crates.io/crates/quickersort)

* [syscall](https://crates.io/crates/sc)

* [unicode](https://crates.io/crates/unicode-normalization ) 
  * (https://crates.io/crates/encode_unicode) 
  * (https://crates.io/crates/encoding_rs)
  * utf16
  * [utf8](https://crates.io/crates/utf8-ranges)

* [gravatar](https://crates.io/crates/gravatar)



## Profiler

* [vignette](https://github.com/nikhilm/vignette) - A sampling profiler as a library

## 其他

* [fred](https://github.com/anvie/fred) : Simple Document File Reader Library for Rust
* [gif-generator](https://github.com/eliheuer/gif-generator):Generate animated GIFs from user input

* [gravatar](https://crates.io/crates/gravatar)
