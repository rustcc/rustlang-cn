![img](https://images.wallpaperscraft.com/image/abstraction_light_neon_glitter_97687_1366x768.jpg)

# Rust Web开发实战-前端

> 本文同步于[Rust中文阅读：Rust Web开发实战-前端](https://rustlang-cn.org/read/07/practical-rust-web-development-front-end.html)，源自于[Rust中文营养计划
](https://github.com/rustlang-cn/nutrition#rust%E4%B8%AD%E6%96%87%E8%90%A5%E5%85%BB%E8%AE%A1%E5%88%92)，时间：2019-07-13, 本文已发布在[Rust中文网络点](https://github.com/rustlang-cn/rustlang-cn/blob/master/README.md#%E4%B8%80%E5%8F%82%E4%B8%8E-rust-%E4%B8%AD%E6%96%87%E9%98%85%E8%AF%BB%E6%8A%95%E7%A8%BF). 欢迎加入[Rust中文营养计划](https://github.com/rustlang-cn/nutrition),共建Rust语言中文网络！

- 本文译者：[amerysong](https://github.com/amerysong)
- [英文原文](https://dev.to/werner/practical-rust-web-development-front-end-538d)

---

在这篇文章中，我将向您展示如何使用 wasm 在 Rust 中创建前端应用程序，我必须说明这并不简单，可能会有诸多弊端，这是由于在 Rust 中使用 wasm 还为时尚早。因此，我不建议你在生产环境中使用，尤其是文档，并不是很直观。


## 无框架（Frameworkless）

任何具有 Web 开发经验的人都会尝试做的第一件事就是研究任何使工作更轻松的框架。有一些问题需要考虑，但是也有一些问题让我想要做无框架，正如我在前一段中所说的那样，缺少更新的文档会使一切变得更难，变化太大而且没有稳定的库，特别是可用的框架。

关于无框架的好处是，我可以理解我应该如何使用 wasm_bindgen 并学习它的一些缺点，如果我决定在生产中使用它，将来会对我有所帮助。

如果您可以设法使用框架，那么你就应该用，它应该是处理状态和模板的更好方法。

我确信编写一个框架意味着很多工作，而框架背后的人正在努力工作，但是，目前大多数框架都有一些问题。

Yew 很受欢迎，但缺乏路由器（集成在框架中），而使用像 stdweb 这样的非官方 crates 之前需要三思而后行。

Seed 似乎很酷，使用 wasm_bindgen 并有一个路由器，但由于某种原因，我仍然不明白fetch API不起作用。

Percy 使用 Nightly 版本工作，而我更喜欢稳定版的 Rust。

因此，我决定为我的宠物项目采用无框架，这不是什么大问题，但我想有更稳定的方法可以为 SPA 应用程序生产一些东西，遗憾的是 Rust 目前还不是稳定方法其中之一。

但是，让我们忽略所有这些，并说我们有足够的勇气将它用于我们的项目。

## 基础（Basics）

可能对您有帮助的一个提示是永远不要忘记您正在使用 Javascript，这是什么意思？在很少的地方，比如使用 fetch 发起一个 ajax 请求，你应该返回一个 Promise 而不是 Future，然后像在 Javascript 中那样使用 promise，而不是在 Rust 中。我稍后会给你看一个例子。

我们将从基础开始，让它运行。

我们将在项目中添加 webpack.config.js 和 package.json 文件。

`webpack.config.js`:
```rust
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
    },
    devServer: {
        historyApiFallback: true //This is important for our client Router
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html'
        }),
        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, ".")
        }),
        // Have this example work in Edge which doesn't ship `TextEncoder` or
        // `TextDecoder` at this time.
        new webpack.ProvidePlugin({
          TextDecoder: ['text-encoding', 'TextDecoder'],
          TextEncoder: ['text-encoding', 'TextEncoder']
        })
    ],
    mode: 'development'
};
```

`package.json`:
```json
{
  "scripts": {
    "build": "webpack",
    "serve": "webpack-dev-server"
  },
  "devDependencies": {
    "@wasm-tool/wasm-pack-plugin": "0.4.2",
    "text-encoding": "^0.7.0",
    "html-webpack-plugin": "^3.2.0",
    "webpack": "^4.29.4",
    "webpack-cli": "^3.1.1",
    "webpack-dev-server": "^3.1.0"
  },
  "dependencies": {
    "bootstrap": "^4.3.1"
  }
}
```

当然不要忘了 `index.html` 和 `index.js` 文件。

`index.html`
```html
<html>
  <head>
    <meta content="text/html;charset=utf-8" http-equiv="Content-Type"/>
    <link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">
  </head>
  <title>My Store</title>
  <body>
    <div id="app"></div>
    <script src="node_modules/bootstrap/dist/js/bootstrap.min.js"></script>
  </body>
</html>
```

最后向工程添加一个空的 `lib.rs` 文件，然后就可以使用以下命令运行工程：

> cargo build
> 
> npm install
> 
> npm run serve

如果所有功能正常工作，我们的服务器就会启动运行。

## 路由（Router）

我们也将实现我们的客户端路由，为了实现这一点，我们需要处理History中的状态并对我们的 webpack 配置进行一些聚合（请记住我们也在使用 Javascript ）。

我们将从一个空的Cargo项目开始，并在 `Cargo.toml` 中添加下一个 crates。

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
futures = { version = "0.1.20", features = ["use_std"] }
wasm-bindgen = { version = "0.2.45", features = ["serde-serialize"]  }
js-sys = "0.3.22"
wasm-bindgen-futures = "0.3.22"
serde = { version = "1.0.80", features = ["derive"] }
serde_derive = "^1.0.59"
serde_json = "1"
console_error_panic_hook = "0.1.6"

[dependencies.web-sys]
version = "0.3.4"
features = [
  'Headers',
  'Request',
  'RequestInit',
  'RequestMode',
  'Response',
  'Window',
  'Document',
  'Element',
  'HtmlElement',
  'HtmlInputElement',
  'HtmlButtonElement',
  'HtmlFormElement',
  'HtmlCollection',
  'MouseEvent',
  'Node',
  'History',
  'Event',
  'EventTarget',
  'ErrorEvent',
  'Location',
  'console'
]

[profile.release]
debug = true

```

每当你需要来自 DOM Api 的东西时，你可能需要在 [dependencies.web-sys] 中添加它。

`src/router.rs`：
```rust
use wasm_bindgen::prelude::*;
use web_sys::{ History, Location };

pub struct Router {
    pub history: History,
    pub location: Location
}

impl Router {
    pub fn new() -> Self {
        let window = web_sys::window().expect("no global `window` exists");
        let history = window.history().expect("no history");
        let document = window.document().expect("should have a document on window");
        let location = document.location().unwrap();

        Router { history, location }
    }

    pub fn go_to(&self, url: &str, state: &JsValue) -> Result<(), JsValue> {
        self.history.push_state_with_url(state, 
            url, Some(&format!("{}/{}", self.location.origin().unwrap(), url)))
    }
}

```

每次用户更改网址时，我们都需要进入状态。现在我们要添加我们应用程序所需的所有路由，让我们添加一个带有 `components` 标签的文件夹，并添加一个名为 routes.rs 的文件。

`src/components/routes.rs`：
```rust
use std::collections::HashMap;
use std::sync::Arc;
use wasm_bindgen::JsValue;
use crate::components::component::Component;
use crate::components;
use crate::app::App;

// In this struct we will have registered all our routes.
pub struct Routes(HashMap<String, Box<Component>>);

impl Routes {
    // Every time we need a new component, we register our route here.
    pub fn new(app: Arc<App>) -> Routes {
        let mut routes = Routes(HashMap::new());
        routes.0.insert("/dashboard".to_string(),
            Box::new(components::dashboard::Dashboard::new("dashboard".to_string(), app.clone())));
        routes.0.insert("/login".to_string(),
            Box::new(components::login::Login::new("login".to_string(), app.clone())));
        routes.0.insert("/register".to_string(),
            Box::new(components::register::Register::new("register".to_string(), app.clone())));
        routes.0.insert("/home".to_string(),
            Box::new(components::home::Home::new("home".to_string(), app.clone())));
        routes.0.insert("/".to_string(),
            Box::new(components::home::Home::new("home".to_string(), app.clone())));
        routes
    }

    pub fn go_to(&self, url: String, state: &JsValue) {
        self.0.get(&url).expect("Component not created").render(state);
    }

    pub fn load_components(&self, url: String, state: &JsValue ) {
        self.0.get(&url).expect("Component not created").load_components(state);
    }
}

```

## Fetch API

我们需要一种方法将http请求发送到服务器，我们可以使用Javascript Fetch API，但是请记住我们正在使用Javascript，所以我们需要使用 `#[wasm_bindgen]` 注释每个函数并返回一个Promise 。

`src/fetch.rs`：
```rust
use futures::Future;
use js_sys::Promise;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, RequestMode, Response};
use serde::Serialize;

// This is the url for the server
const BASE_URL: &str = "http://localhost:8088";

#[wasm_bindgen]
pub fn fetch_request(url: &str,
                     method: &str,
                     body: Option<String>) -> Promise {
    let mut opts = RequestInit::new();
    opts.method(method);
    opts.mode(RequestMode::Cors);
    if let Some(body_string) = body {
        let js_value = JsValue::from_str(&body_string);
        opts.body(Some(&js_value));
    }

    let request = Request::new_with_str_and_init(&format!("{}/{}", BASE_URL, url), &opts).unwrap();

    request
        .headers()
        .set("Content-Type", "application/json").unwrap();

    let window = web_sys::window().ok_or_else(|| JsValue::from_str("Could not get a window object")).unwrap();
    let request_promise = 
        window
            .fetch_with_request(&request);

    let future = JsFuture::from(request_promise)
        .and_then(|resp_value| {
            assert!(resp_value.is_instance_of::<Response>());
            let resp: Response = resp_value.dyn_into()?;
            resp.json()
        })
        .and_then(|json_value: Promise| {
            JsFuture::from(json_value)
        });

    future_to_promise(future)
}

#[wasm_bindgen]
pub fn post_request(url: &str, body: String) -> Promise {
    fetch_request(url, "POST", Some(body))
}

#[wasm_bindgen]
pub fn get_request(url: &str) -> Promise  {
    fetch_request(url, "GET", None)
}

#[wasm_bindgen]
pub fn delete_request(url: &str) -> Promise {
    fetch_request(url, "DELETE", None)
}

```

## 组件（Components）

我们将在这个博客中实现注册组件，其余的登录，主页和控制面板将在存储库中提供，我将稍后展示产品页面，但是，一旦你能够理解基础知识，你可以继续阅读产品页面。

我们需要一个可以抽象组件所需的大多数功能的 trait。

`src/components/component.rs`：
```rust
use std::sync::Arc;
use wasm_bindgen::JsValue;
use web_sys::{ HtmlInputElement, Document, Element };
use wasm_bindgen::JsCast;
use serde::{Deserialize, Serialize};
use crate::app::App;

#[derive(Debug, Serialize, Deserialize)]
pub struct FlashMessage {
    pub message: String
}

// Every component should implement these methods, except for render
// that will be the same for all components. 
pub trait Component {
    fn load_components(&self, data: &JsValue) -> Result<(), JsValue>;
    fn app(&self) -> Arc<App>;
    fn url(&self) -> String;
    fn render(&self, state: &JsValue) -> Result<(), JsValue> {
        self.app().div.set_inner_html("");
        self.load_components(state)?;
        self.app().go_to(&self.url(), state)
    }
}

// I'm using a struct to reduce boilerplate creating
// inputs and other things components might need, It's a 
// way to dry your code
pub struct InputComponent(pub Arc<Document>);

impl InputComponent {
    pub fn create_input(&self, id: &str, name: &str, ttype: &str, placeholder: &str) 
        -> Result<Element, JsValue> {
            let div = self.0.create_element("div")?;
            div.set_class_name("from-group");
            let input_element = self.0.create_element("input")?;
            input_element.set_id(id);
            let input = JsCast::dyn_ref::<HtmlInputElement>(&input_element)
                .ok_or(JsValue::from_str("Error casting input"))?;
            input.set_placeholder(placeholder);
            input.set_class_name("form-control");
            input.set_name(name);
            input.set_type(ttype);
            div.append_child(input);
            Ok(div)
    }

    pub fn value_by_id(&self, id: &str) -> String {
        let element = self.0.get_element_by_id(id).expect(&format!("No {}", id));
        JsCast::dyn_ref::<HtmlInputElement>(&element).expect("Error casting input").value()
    }
}

```

`src/components/register.rs`：
```rust
use std::sync::Arc;
use serde_json::json;
use wasm_bindgen::{ JsValue, JsCast };
use wasm_bindgen::closure::Closure;
use web_sys::{ HtmlButtonElement, EventTarget, ErrorEvent };
use serde::{Deserialize, Serialize};
use crate::app::App;
use crate::components::component::{ Component, InputComponent, FlashMessage };
use crate::fetch::post_request;
use crate::components;

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterUser {
    pub email: String,
    pub company: String,
    pub password: String,
    pub password_confirmation: String
}

impl RegisterUser {
    pub fn new() -> Self {
        RegisterUser {
            email: "".to_string(),
            company: "".to_string(),
            password: "".to_string(),
            password_confirmation: "".to_string()
        }
    }
}

#[derive(Clone)]
pub struct Register {
    url: String,
    app: Arc<App>
}

impl Register {
    pub fn new(url: String, app: Arc<App>) -> Self {
        Register { url, app }
    }
}

impl Component for Register {
    fn app(&self) -> Arc<App> { self.app.clone() }

    fn url(&self) -> String { self.url.clone() }

    fn load_components(&self, data: &JsValue) -> Result<(), JsValue> {

        let main_div = self.app.document.create_element("div")?;
        main_div.set_class_name("container");
        let h2_title = self.app.document.create_element("h2")?;
        h2_title.set_text_content(Some("Register an User"));

        let form = self.app.document.create_element("form")?;

        let email_div = 
            InputComponent(self.app.document.clone())
                .create_input("email", "email", "text", "Email")?;

        let company_div = 
            InputComponent(self.app.document.clone())
                .create_input("company", "company", "text", "Company")?;

        let password_div = 
            InputComponent(self.app.document.clone())
                .create_input("password", "password", "password", "Password")?;

        let password_confirmation_div = 
            InputComponent(self.app.document.clone())
                .create_input("password_confirmation", "password_confirmation", "password", "Password Confirmation")?;

        let button_element = self.app.document.create_element("button")?;
        let button = JsCast::dyn_ref::<HtmlButtonElement>(&button_element)
            .ok_or(JsValue::from_str("Error casting input"))?;
        button.set_class_name("btn btn-primary");
        button.set_text_content(Some("Send"));
        button.set_type("Submit");

        form.append_child(&email_div)?;
        form.append_child(&company_div)?;
        form.append_child(&password_div)?;
        form.append_child(&password_confirmation_div)?;
        form.append_child(&button)?;

        main_div.append_child(&h2_title)?;
        main_div.append_child(&form)?;

        let button_et: EventTarget = button_element.into();

        let document = self.app.document.clone();
        // We need to access the app property from the struct
        // inside a closure, however we need to move everything we
        // need, the best way to do that is cloning through an Arc.
        // This way the cost of cloning is reduced. 
        let app_closure = self.app.clone();
        let form_closure = Arc::new(form);
        let handler = 
            Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
                event.prevent_default();
                event.stop_propagation();
                let register_user = RegisterUser{
                    email: InputComponent(document.clone()).value_by_id("email"),
                    company: InputComponent(document.clone()).value_by_id("company"),
                    password: InputComponent(document.clone()).value_by_id("password"),
                    password_confirmation: InputComponent(document.clone()).value_by_id("password_confirmation")
                };
                let serialized_register_user = json!(register_user).to_string();
                // Here we're cloning the app again because we're
                // gonna need it in another closure.
                let app_success_closure = app_closure.clone();
                let success_response = 
                    Closure::once(move |js_value: JsValue| {
                        let message = FlashMessage { message: "User Created".to_string() };
                        components::routes::Routes::new(app_success_closure)
                            .go_to("/home".to_string(), &JsValue::from_serde(&message).unwrap());
                    });
                let error_form_closure = form_closure.clone();
                let app_error_closure = app_closure.clone();
                let error_response = 
                    Closure::once(move |js_value: JsValue| {
                        let response: &ErrorEvent = js_value.as_ref().unchecked_ref();
                        let text = response.message();
                        let alert_error = app_error_closure.document.create_element("div")
                            .expect("Creating alert not possible");
                        alert_error.set_class_name("alert alert-danger");
                        alert_error.set_text_content(Some(&text));
                        error_form_closure.append_child(&alert_error);
                    });
                post_request("register", serialized_register_user)
                    .then(&success_response)
                    .catch(&error_response);
                error_response.forget();
                success_response.forget();
            }) as Box<dyn FnMut(_)>);

        button_et.add_event_listener_with_callback("click", handler.as_ref().unchecked_ref())?;

        handler.forget();

        self.app.div.append_child(&main_div)?;

        Ok(())
    }
}

```

正如您在前面的代码中看到的那样，具有适当模板库的框架可以节省大量工作，我希望将来可以拥有更好的选项或更稳定的框架。

你可以在[这里](https://github.com/practical-rust-web-development/front_raw_mystore)找到完整源代码。


## 疑难排解（Troubleshooting）

### 更好的浏览器错误信息
要更好地解释发生了什么，可以使用 **console_error_panic_hook** crate。

### Error: closure invoked recursively or destroyed already

这意味着你正在使用一个闭包，你应该在使用它之后添加一个 `forget` 方法，这是让我有点焦虑的事情之一，特别是当你在文档中阅读时：这个函数会泄漏内存。应该谨慎使用它以确保内存泄漏不会对程序造成太大影响。但是没有其他方法可以使闭包工作。

