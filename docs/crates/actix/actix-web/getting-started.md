# 开始

我们来编写第一个actix web应用程序！

## Hello, world

首先创建一个新的基于二进制的Cargo项目并进入新目录：

```bash
cargo new hello-world
cd hello-world
```

现在，确保actix-web的Cargo.toml 包含以下项目依赖关系：

```ini
[dependencies]
actix-web = "1.0"
```

为了实现一个Web服务器，我们首先需要创建一个请求处理程序。请求处理函数是接受零个或多个参数的函数, 这些参数可以从请求中提取（即 `impl FromRequest`），并返回一个可以转换为`HttpResponse`（即 `impl Responder`）的类型：

文件名: `src/main.rs`

```rust
use actix_web::{web, App, HttpResponse, HttpServer, Responder};

fn index() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

fn index2() -> impl Responder {
    HttpResponse::Ok().body("Hello world again!")
}
```

接下来，创建一个App实例，并在特定HTTP方法的路径上注册带有应用`route`的请求处理程序 。之后，应用程序实例可用于`HttpServer`侦听传入连接。服务器接受应该返回应用程序工厂的函数。

```rust
fn main() {
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(index))
            .route("/again", web::get().to(index2))
    })
    .bind("127.0.0.1:8088")
    .unwrap()
    .run()
    .unwrap();
}
```

仅此而已！现在编译并运行该程序cargo run。去`http://localhost:8088` 看结果。

## 使用属性宏来定义路由

或者，您可以使用宏属性定义路径，这些属性允许您指定函数上方的路径，如下所示：

```rust
use actix_web::get;

#[get("/hello")]
fn index3() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}
```

然后您可以使用`service()`方式注册路径：

```rust
App::new()
    .service(index3)
```

出于一致性原因，本文档仅使用本页开头显示的显式语法。但是，如果您更喜欢属性宏这种语法，那么在您声明路由时，您可以随意使用它，因为它只是语法糖。

要了解更多信息，请参阅[actix-web-codegen](https://docs.rs/actix-web-codegen/0.1.2/actix_web_codegen/)。

## 自动重载

如果需要，您可以在开发期间自动重新加载服务器，以便按需重新编译。这不是必需的，但它使快速原型设计更加方便，因为您可以在保存时立即看到更改。要了解如何实现这一点，请查看[自动重载模式](/crates/actix/actix-web/autoreloade.html)。
