---
title: CSAPP - Bomb Lab 笔记
date: 2021-01-20 15:57:10
categories: 技术笔记
tags: CSAPP
---

*2020/9/11: 最终还是决定尝试一下 CSAPP 这本书配套的 Bomb Lab，事实证明，成功拆除炸弹还是非常有成就感的！开心得屁颠屁颠跑来写笔记～*

上面是去年九月开坑时写的开头，中间因为忙着准备考试实在是精力有限，一下就拖到了 2021 年。（QAQ 被高数虐了一个多月却仍然挂得很惨）
月初休息了一波，最近工作也不忙了，所以我回来填坑啦～

言归正传，在 Bomb Lab 中，我们会拿到一个名为 bomb 的可执行文件和一个 bomb.c 文件。通过 bomb.c 中的代码我们可以知道要拆除这个炸弹一共有6道关卡，只有每个关卡都给出正确输入才能拆除炸弹，否则炸弹就会爆炸，如下图所示：

![Bomb Boom][1]

面对如此嚣张的威胁，我们要如何解决呢？
在 Bomb Lab 的 Writeup 里提到了一些非常有用的工具：gdb, objdump, strings。实践证明，它们真的很管用！
那么接下来，我们就一起来拆炸弹吧～
<!--more-->

第一步，**获得 bomb 可执行文件的反编译代码**，接下来的工作都要基于这份代码展开。
运行如下命令，将反编译结果输出到 bomb_dump.txt 文件中方便后续分析。
```
objdump -d bomb > bomb_dump.txt
```

粗略扫一眼反编译得到的代码，搜索一下 `main` 函数，在 265 - 344 行。显然，这一长串代码对应的就是 bomb.c 中的 `main()`，它的主要功能就是输出提示，读取用户输入，并跳转到对应的 `phase_1`, `phase_2`, `phase_3`, `phase_4`, `phase_5` 和 `phase_6`。

在这一段代码中，我们只需要注意一点：`read_line` 函数将用户输入的起始地址存于 `%rax` 中，在调用 `phase_x` 前用户输入被转到 `%rdi` 中，如下所示：
```
  400e32:	e8 67 06 00 00       	callq  40149e <read_line>
  400e37:	48 89 c7             	mov    %rax,%rdi
  400e3a:	e8 a1 00 00 00       	callq  400ee0 <phase_1>
```
「Note」**用户输入存于 `%rdi` 中**。

重头戏还是在分析这六个关卡的代码。接下来，就让我们一起来逐个攻破！

---
## Phase 1 - 事关美加边境关系？
我们先看一下 phase_1 的反编译代码，很简短（347 - 354 行）：
```
  400ee0:	48 83 ec 08          	sub    $0x8,%rsp
  400ee4:	be 00 24 40 00       	mov    $0x402400,%esi
  400ee9:	e8 4a 04 00 00       	callq  401338 <strings_not_equal>
  400eee:	85 c0                	test   %eax,%eax
  400ef0:	74 05                	je     400ef7 <phase_1+0x17>
  400ef2:	e8 43 05 00 00       	callq  40143a <explode_bomb>
  400ef7:	48 83 c4 08          	add    $0x8,%rsp
  400efb:	c3                   	retq   
```
我们看到 400ee4 这一行命令 `mov $0x402400,%esi` 将地址位于 **0x402400** 处的内容放到了 %esi 中，紧接着调用了 strings_not_equal 方法，因此我们可以猜测这一关卡的输入类型应该是个字符串。

接着，我们看一下 `strings_not_equal` 函数的代码（702 - 739 行）：
```
  401338:	41 54                	push   %r12
  40133a:	55                   	push   %rbp
  40133b:	53                   	push   %rbx
  40133c:	48 89 fb             	mov    %rdi,%rbx
  40133f:	48 89 f5             	mov    %rsi,%rbp
  401342:	e8 d4 ff ff ff       	callq  40131b <string_length>
  ...
```
由此可知，这个函数的两个参数分别存在了 **%rdi** 和 **%rsi** 中，**%rdi** 中存放的是用户输入，而 **%rsi** 中的内容正是从地址 **0x402400** 中读取来的。显然，只要我们能得到 **0x402400** 中的内容，这一关就搞定了～

使用 gdb 运行 bomb，并在 **0x400ee9** 处打个断点，敲入 `x/s 0x402400`，调试过程如下所示：
![Bomb phase 1 debug][2]

于是，我们成功获得第一关卡密钥：**"Border relations with Canada have never been better."**

---

[1]: /uploads/images/bomb_boom.png
[2]: /uploads/images/bomb_phase1_debug.png