<div id="actix">

<div id="actix-nav">
    <div class="logo">
        <a href="/crates/actix/"><img src="https://avatars2.githubusercontent.com/u/32776943?s=200&v=4"></a>
    </div>
    <div class="title">
        <li class="nav"><a href="/crates/actix/">首页</a></li>
        <li class="nav"><a href="/crates/actix/actix/">Actix</a></li>
        <li class="nav"><a href="/crates/actix/actix-web/">Actix-web</a></li>
        <li class="nav"><a href="/crates/actix/community.html">社区</a></li>
        <li class="nav"><a href="/crates/actix/code.html">源码</a></li>
    </div>
</div>

<div id="show">
    <img src="https://actix.rs/img/logo-large.png" >
    <p id="word">Rust的强大Actor系统和最有趣的Web框架</p>
</div>

<div id="actix-features">
    <div class="left">
        <li >
            <p class="feature">类型安全</p>
            忘记关于字符串类型的对象，从请求到响应，一切异步具有类型
        </li>
        <li >
            <p class="feature">特性丰富</p>
            Actix提供了丰富的特性开箱即用。WebSockets，HTTP/2，流，管道，SSL，异步HTTP客户端等一应俱全
        </li>
        <li >
            <p class="feature">扩展性强</p>
            轻松创建任何基于Actix应用的自己的特色库
        </li>
        <li >
            <p class="feature">速度极快</p>
            Actix 具有顶级的速度,<a href="https://www.techempower.com/benchmarks/#section=data-r18&hw=ph&test=fortune">自己看</a>
        </li>
    </div>

<div class="right">

<div class="language-rust extra-class">
<pre class="language-rust">
<code>

```rust
extern crate actix_web;
use actix_web::{server, App, HttpRequest, Responder};

fn greet(req: &HttpRequest) -> impl Responder {
    let to = req.match_info().get("name").unwrap_or("World");
    format!("Hello {}!", to)
}

fn main() {
    server::new(|| {
        App::new()
            .resource("/", |r| r.f(greet))
            .resource("/{name}", |r| r.f(greet))
    })
    .bind("127.0.0.1:8000")
    .expect("Can not bind to port 8000")
    .run();
}
```

</code>
</pre>
</div>
</div>
    
</div>

<div id="detail">

## 灵活的请求响应

Actix中的Handler函数可以返回实现该`Responder` trait的各种对象。这使得从API返回一致的响应变得轻而易举.

```rust
#[derive(Serialize)]
struct Measurement {
    temperature: f32,
}

fn hello_world() -> impl Responder {
    "Hello World!"
}

fn current_temperature(_req: HttpRequest) -> impl Responder {
    Json(Measurement { temperature: 42.3 })
}
```

## 强大的Extractors

Actix提供了一个强大的提取器系统，可以从传入的HTTP请求中提取数据并将其传递给您的视图函数。这不仅可以创建方便的API， 而且还意味着您的视图函数可以是同步代码，并且仍然可以受益于异步IO处理。

```rust
#[derive(Deserialize)]
struct Event {
    timestamp: f64,
    kind: String,
    tags: Vec<String>,
}

fn capture_event(evt: Json<Event>) -> impl Responder {
    let id = store_event_in_db(evt.timestamp, evt.kind, evt.tags);
    format!("got event {}", id)
}
```

## 轻松处理表单

处理multipart/ urlencoded表单数据很容易。只需定义一个可以反序列化的结构，actix就可以处理剩下的部分。

```rust
#[derive(Deserialize)]
struct Register {
    username: String,
    country: String,
}

fn register(data: Form<Register>) -> impl Responder {
    format!("Hello {} from {}!", data.username, data.country)
}
```

## 请求路由

一个actix应用程序带有一个URL路由系统，可以让你在URL上匹配并调用单个处理程序。为了获得额外的灵活性，可以使用域。

```rust
fn index(req: HttpRequest) -> impl Responder {
    "Hello from the index page"
}

fn hello(path: Path<String>) -> impl Responder {
    format!("Hello {}!", *path)
}

fn main() {
    App::new()
        .resource("/", |r| r.method(Method::Get).with(index))
        .resource("/hello/{name}", |r| r.method(Method::Get).with(hello))
        .finish();
}
```

</div>

</div>
