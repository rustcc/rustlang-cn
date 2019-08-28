![img](https://images.wallpaperscraft.com/image/triangle_shape_dark_figure_88540_1366x768.jpg)

# Rust基础：`Add Trait`

> 本文同步于[Rust中文阅读：Rust基础：`Add Trait`](https://rustlang-cn.org/read/03/rust-bacise-add-trait.html) ,本文时间：2019-03-28, 作者：krircc，简介：天青色

[Rust中文](https://rustlang-cn.org),[欢迎加入](https://github.com/rustlang-cn/Important/issues/1)Rust中文,共建Rust语言中文网络！欢迎向Rust中文投稿,[投稿地址](https://github.com/rustlang-cn/rustlang-cn),好文将展示在：

- [Rust中文首页](https://rustlang-cn.org/)与[Rust中文阅读](https://rustlang-cn.org/read/)
- [Rust中文论坛](http://47.104.146.58/)
- [Rust中文](https://zhuanlan.zhihu.com/rustlang-cn)知乎专栏

在我更好地理解任何事物的旅程中，我总是回归基础。通常我们将我们的假设建立在盲目的“猜测”上，我们不明白为什么会发生某些事情，但我们观察到某些模式会导致成功。这对初学者来说可能很棒，但是你做事的时间越长，你就越不愿意依赖盲目的运气。

因此，对于我们最后几周在[metalab](https://metalab.at/) vienna的Rust黑客会议，我们选择了一些简单的东西。为自定义定点数据类型实现自己的`Add Trait`

听起来很容易，对吗？也许你会听到数学家背后微妙的傻笑。一切都很简单......您只需要应用训练有素的概念而不是构建它们。

那么让我们从我们的数据类型开始：

```rust
pub struct Fixed {
    integer: i32,
    decimal: u32,
}
```

我们有：

- 逗号前的整数（可以`signed`）
- 逗号后面的小数（不能`signed`）

到目前为止相当容易不是吗？

所以我们要做的第一件事是打印我们的数据类型。请记住这是关于基础的，所以我暂时不尝试使用宏，而是根据特质实现它。

查看：[Display](https://doc.rust-lang.org/std/fmt/trait.Display.html)

```rust
use std::fmt;

impl fmt::Display for Fixed {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}.{}", &self.integer, &self.decimal)
    }
}
```

我们的代码现在看起来像：

```rust
use std::fmt;

pub struct Fixed {
    integer: i32,
    decimal: u32,
}

impl fmt::Display for Fixed {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}.{}", &self.integer, &self.decimal)
    }
}

fn main() {
    println!("{}", Fixed {integer: 1, decimal: 0});
}
```

如果我们运行它将显示：

```rust
1.0
```

rust [playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=150979e181ef0ec50280af4562436984)

所以我们现在可以显示我们的值:)让我们进入下一步真正的任务：为我们的结构实现`Add Trait`

```rust
println!("{} + {} = {}", fixed1, fixed2, fixed1 + fixed2)
```

我不知道所有操作，但至少对于Rust中的'+'符号，`Add trait`是解析操作。

因为我们很懒，至少我是;），我不想写：

```rust
Fixed {
  integer: i32,
  decimal: u32
}
```

相反，让我们使用一个常见的rust模式。

```rust
impl Fixed {
    pub fn from(integer: i32, decimal: u32) -> Fixed {
        Fixed {
            integer,
            decimal
        }
    }
}
```

所以我们现在可以写：

```rust
let fixed1 = Fixed::from(1, 1);
```

[playground](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=abb2c854f770898473ad9f70f8c36abb)

而且我们根据[文档](https://doc.rust-lang.org/std/ops/trait.Add.html)实现了`Add trait`

```rust
impl Add for Fixed {
    type Output = Fixed;

    fn add(self, rhs: Self) -> Self::Output {
        return Fixed {
            integer: self.integer + rhs.integer,
            decimal: self.decimal + rhs.decimal
        }
    }
}
```

我故意跳过`Display trait`的细节，但`Add trait`很重要，所以让我们看一下它的构建，以便更好地理解这种操作`trait`模式

那应该添加什么呢？

```rust
a + b = c
```

所以我们有一个在加号（+）左侧的（LHS），我们有一个在它右侧的（RHS）。

添加两者的值将返回第三个值，即输出c。

我们有一些集理论和类型凝聚力主题，我们可以去：`ℕ∈Z∈ℚ`。 我们现在可以开始，什么可以添加到什么以及一般的变化方向。

下一步将是：

```rust
use std::fmt;
use std::ops::Add;

pub struct Fixed {
    integer: i32,
    decimal: u32,
}

impl fmt::Display for Fixed {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}.{}", &self.integer, &self.decimal)
    }
}

impl Add for Fixed {
    type Output = Fixed;

    fn add(self, rhs: Self) -> Self::Output {
        return Fixed {
            integer: self.integer + rhs.integer,
            decimal: self.decimal + rhs.decimal
        }
    }
}


impl Fixed {
    pub fn from(integer: i32, decimal: u32) -> Fixed {
        Fixed {
            integer,
            decimal
        }
    }
}

fn main() {
    let fixed1 = Fixed::from(1, 1);
    let fixed2 = Fixed::from(1, 1);
    let result = fixed1 + fixed2;

    println!("{} + {} = {}", fixed1, fixed2, result)
}
```

这会导致编译失败，因为我们需要将变量用作值。 所以我们需要为它们实现[copy trait](https://doc.rust-lang.org/std/marker/trait.Copy.html)。

```rust
impl Copy for Fixed { }

impl Clone for Fixed {
    fn clone(&self) -> Fixed {
        *self
    }
}
```

我们同样需要[Clone](https://doc.rust-lang.org/std/clone/trait.Clone.html)及`Copy` Trait`。

所以通过这个到[操场的链接](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=c52d755de09fd89e0011a4d4fd579aa2)，你有完整工作的正数，非溢出例子。

我们完了吗？ ... 不 ....

- 只有当我们不必将十进制域中的数字带到整数域时，我们才会完成。
- 如果我们只添加两个正数

所以我们来看看负数问题。

只要一个整数部分为负数，就会减去小数。

```rust
fn main() {
    let fixed1 = Fixed::from(-1, 1);
    let fixed2 = Fixed::from(1, 1);
    let result = fixed1 + fixed2;

    println!("{} + {} = {}", fixed1, fixed2, result)
}
```

目前将返回

```rust
0.2
```

这不是我们所期望的，一个可能的解决方案是：

```rust
impl Add for Fixed {
    type Output = Fixed;

    fn add(self, rhs: Self) -> Self::Output {
        if rhs.integer < 0 || self.integer < 0 {
            return Fixed {
                integer: self.integer + rhs.integer,
                decimal: self.decimal - rhs.decimal
            }
        }

        Fixed {
            integer: self.integer + rhs.integer,
            decimal: self.decimal + rhs.decimal
        }
    }
}
```

但正如我们应该知道的那样，只有在没有进位的情况下才有效。 但既然它是负数并且加上负数，我们就不必关心哪一个是负的，谢谢交换法。

```rust
-1.5 + 1.5  = 0
```

唯一的问题是......如果两者都是否的呢？

```rust
-1.1 + -1.1 = -2.2
```

不是

```rust
-1.1 + -1.1 = 2.0
```

所以我们只有当其中一个是负数时我们才需要具体对待，我们相互减去小数。

```rust
if (rhs.integer < 0 && self.integer > 0) || (self.integer < 0 && rhs.integer > 0) {
  return Fixed {
    integer: self.integer + rhs.integer,
    decimal: self.decimal - rhs.decimal
  }
}
```

好吧，到目前为止这可行，但你们中的一些人也许已经发现了下一个问题？

关于什么

```rust
  1.14
- 1.16
```

这个案例？ `14 - 16`这将无法减去的无符号整数导致溢出异常。

```rust
fn main() {
    let fixed1 = Fixed::from(1, 14);
    let fixed2 = Fixed::from(-1, 16);
    let result = fixed1 + fixed2;

    println!("{} + {} = {}", fixed1, fixed2, result)
}

thread 'main' panicked at 'attempt to subtract with overflow' .....
```

因为这是一个补充，我们可以使用交换法则只是翻转它并且它保持不变但我们需要将这个程序化。

所以我们需要确保数字较大的数字总是在左边

```rust
impl Add for Fixed {
    type Output = Fixed;

    fn add(self, rhs: Self) -> Self::Output {
        // we now take the bigger one on the left side of the plus 
        let lhs_decimal = max(self.decimal, rhs.decimal);
        // and the smaller one on the right side of the plus
        let rhs_decimal = min(self.decimal, rhs.decimal);

        if (rhs.integer < 0 && self.integer > 0) || (self.integer < 0 && rhs.integer > 0) {
            return Fixed {
                integer: self.integer + rhs.integer,
                decimal: lhs_decimal - rhs_decimal // applied here
            }
        }

        Fixed {
            integer: self.integer + rhs.integer,
            decimal: self.decimal + rhs.decimal
        }
    }
}
```

好吧，这个问题少了，但远没有结束。 让我们来解决问题。 领域的互动。 如果需要，我们希望我们的小数进位到我们的整数域

```rust
1.9 + 0.1 = 2
```

如果我们需要进位我们怎么意识到？ 也许有更好的方法，但我们使用了指数的大小。

```rust
1.9 -> exp 10^-1
1.1 -> exp 10^-1
2.0 -> exp 10^0
-------------------------
in our datastructure

1.9 -> exp 10^-1
1.1 -> exp 10^-1
1.10 -> exp 10^-2 = 2.0
-------------------------
```

另一种方式是假设最左边的数字的总和不允许小于较低的数字值。

在我们的例子中

```rust
1.9 
1.1 
----- 
3.0

9 + 1 = 1 [0] smaller than 9 
9 + 9 = 1 [8] smaller than 9
7 + 7 = 1 [4] smaller than 7
7 + 3 = 1 [0] smaller than 7

这可以看作二进制值

00010001
00000001
----------------
0001001[0] smaller than 1
```

这不错,但首先我们需要做一些其他我们需要创建相同数量的数字。

```rust
1.1000
1.100
```

在我们的系统中不被视为`0.1 + 0.1`，因此我们需要均衡幅度。 要做到这一点，我们需要得到数字的`log10`

所以首先我们需要计算我们的幅度。 我把这段[代码](https://helloacm.com/fast-integer-log10/)转换成：

```rust
fn magnitude(decimal: u32) -> u32 {
    match decimal {
        _ if decimal >= 1000000000 => 9,
        _ if decimal >= 100000000 => 8,
        _ if decimal >= 10000000 => 7,
        _ if decimal >= 1000000 => 6,
        _ if decimal >= 100000 => 5,
        _ if decimal >= 10000 => 4,
        _ if decimal >= 1000 => 3,
        _ if decimal >= 100 => 2,
        _ => 1,
    }
}
```

并减少函数调用

```rust
#[inline(always)]
fn magnitude(decimal: u32) -> u32 {
```

这个`trait`也得到了一点修改

```rust
impl Add for Fixed {
    type Output = Fixed;

    fn add(self, rhs: Self) -> Self::Output {
        let lhs_decimal = max(self.decimal, rhs.decimal);
        let rhs_decimal = min(self.decimal, rhs.decimal);

        // here are our magnitude calculations
        let lhs_magnitude = magnitude(lhs_decimal);
        let rhs_decimal_prepared = 10u32.pow(lhs_magnitude-1) * rhs_decimal;

        if (rhs.integer < 0 && self.integer > 0) || (self.integer < 0 && rhs.integer > 0) {
            return Fixed {
                integer: self.integer + rhs.integer,
                decimal: lhs_decimal - rhs_decimal_prepared
            }
        }

        Fixed {
            integer: self.integer + rhs.integer,
            decimal: lhs_decimal + rhs_decimal_prepared
        }
}
```

[工作的例子](https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=f54fa103b4183373b51df60e3275952d)

所以现在我们可以正确`加`和`减`，只要我们没有...一个进位;）

现在如果结果的pow10指数大于原始`lhs_decimal`的pow10指数，我们有一个`+1`进位到此整数:)

我们还需要保持`lhs_decimal` pow10指数，所以我们需要再次从结果中减去额外的`pow10`，因为这个`power`是进位的`+ 1-`

```rust
 let mut decimal_result: u32;
        let mut carry = 0;


        if (rhs.integer.is_negative() && self.integer > 0) || (self.integer.is_negative() && rhs.integer > 0) {
            decimal_result = lhs_decimal - rhs_decimal_prepared;
        } else {
            decimal_result = lhs_decimal + rhs_decimal_prepared;
        }


        let result_magnitude = magnitude(decimal_result);
        if magnitude(decimal_result) > lhs_magnitude {
            carry = 1;
            decimal_result = decimal_result - 10u32.pow(result_magnitude)
        }
```

这将引导我们：

```rust
use std::fmt;
use std::ops::Add;
use std::cmp::{max, min};

pub struct Fixed {
    integer: i32,
    decimal: u32,
}

impl fmt::Display for Fixed {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}.{}", &self.integer, &self.decimal)
    }
}

impl Add for Fixed {
    type Output = Fixed;

    fn add(self, rhs: Self) -> Self::Output {
        let lhs_decimal = max(self.decimal, rhs.decimal);
        let rhs_decimal = min(self.decimal, rhs.decimal);
        let lhs_magnitude = magnitude(lhs_decimal);
        let rhs_decimal_prepared = 10u32.pow(lhs_magnitude-1) * rhs_decimal;

        let mut decimal_result: u32;
        let mut carry = 0;


        if (rhs.integer.is_negative() && self.integer > 0) || (self.integer.is_negative() && rhs.integer > 0) {
            decimal_result = lhs_decimal - rhs_decimal_prepared;
        } else {
            decimal_result = lhs_decimal + rhs_decimal_prepared;
        }


        let result_magnitude = magnitude(decimal_result);
        if magnitude(decimal_result) > lhs_magnitude {
            carry = 1;
            decimal_result = decimal_result - 10u32.pow(result_magnitude)
        }

        Fixed {
            integer: self.integer + rhs.integer + carry,
            decimal: decimal_result
        }
    }
}

#[inline(always)]
fn magnitude(decimal: u32) -> u32 {
    match decimal {
        _ if decimal >= 1000000000 => 9,
        _ if decimal >= 100000000 => 8,
        _ if decimal >= 10000000 => 7,
        _ if decimal >= 1000000 => 6,
        _ if decimal >= 100000 => 5,
        _ if decimal >= 10000 => 4,
        _ if decimal >= 1000 => 3,
        _ if decimal >= 100 => 2,
        _ => 1,
    }
}


impl Copy for Fixed { }

impl Clone for Fixed {
    fn clone(&self) -> Fixed {
        *self
    }
}



impl Fixed {
    pub fn from(integer: i32, decimal: u32) -> Fixed {
        Fixed {
            integer,
            decimal
        }
    }
}

fn main() {
    let fixed1 = Fixed::from(1, 940);
    let fixed2 = Fixed::from(1, 16);
    let result = fixed1 + fixed2;

    println!("{} + {} = {}", fixed1, fixed2, result)
}

#[cfg(test)]
mod tests {
    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_add_integer() {
        let f1 = Fixed::from(1, 0);
        let f2 = Fixed::from(1, 0);

        let result = f1 + f2;

        assert_eq!(2, result.integer)
    }

    #[test]
    fn test_add_negative_integer() {
        let f1 = Fixed::from(1, 0);
        let f2 = Fixed::from(-1, 0);

        let result = f1 + f2;

        assert_eq!(0, result.integer)
    }

    #[test]
    fn test_two_add_negative_integer() {
        let f1 = Fixed::from(-1, 0);
        let f2 = Fixed::from(-1, 0);

        let result = f1 + f2;

        assert_eq!(-2, result.integer)
    }

    #[test]
    fn test_add_decimal() {
        let f1 = Fixed::from(0, 10);
        let f2 = Fixed::from(1, 0);

        let result = f1 + f2;

        assert_eq!(10, result.decimal)
    }

    #[test]
    fn test_add_different_magnitude_decimal() {
        let f1 = Fixed::from(0, 10);
        let f2 = Fixed::from(1, 100);

        let result = f1 + f2;

        assert_eq!(200, result.decimal)
    }

    #[test]
    fn test_add_negative_magnitude_decimal() {
        let f1 = Fixed::from(-1, 10);
        let f2 = Fixed::from(1, 100);

        let result = f1 + f2;

        assert_eq!(0, result.decimal)
    }

   /* #[test] // currently failing (negative zero problem)
    fn test_add_negative_zero_decimal() {
        let f1 = Fixed::from(-0, 10);
        let f2 = Fixed::from(1, 100);

        let result = f1 + f2;

        assert_eq!(0, result.decimal)
    }
    */

}
```

现在我们可以`加`我们的自定义固定浮点或多或少在数学上正确。 我想所有这些都可以进行优化。

[英文原文](https://chilimatic.hashnode.dev/rust-basics-the-add-trait-cjtoke4yh002t8hs1c61p82mz)
