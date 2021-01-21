---
title: CSAPP - Bomb Lab 笔记
date: 2021-01-20 15:57:10
categories: 技术笔记
tags: CSAPP
---

*2020/9/11: 最终还是决定尝试一下 CSAPP 这本书配套的 Bomb Lab，事实证明，成功拆除炸弹还是非常有成就感的！开心得屁颠屁颠跑来写笔记～*

上面是去年九月开坑时写的开头，中间连着准备两场考试实在是精力有限，一下就拖到了 2021 年。QAQ 被高数虐了一个多月却仍然挂得很惨，月初休息了一波修复碎成渣渣的玻璃心。最近工作不怎么忙了，所以我回来填坑啦～

---
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
0000000000400ee0 <phase_1>:
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
0000000000401338 <strings_not_equal>:
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
## Phase 2 - 等比数列
下面我们来解第二关，代码位于 357-381 行。首先，这段代码做的第一件事是调用了名为 `read_six_numbers` 的函数，因此我们可以合理猜测这一关卡的输入应该是六个数值。
```
0000000000400efc <phase_2>:
  400efc:	55                   	push   %rbp
  400efd:	53                   	push   %rbx
  400efe:	48 83 ec 28          	sub    $0x28,%rsp
  400f02:	48 89 e6             	mov    %rsp,%rsi
  400f05:	e8 52 05 00 00       	callq  40145c <read_six_numbers>
  ...
```
我们在 0x400f02 处打个断点，可得到当前 phase_2 函数的栈指针指向的地址：0x0x7fffffffe030，然后进入 `read_six_numbers`，此时我们可知如下参数：
%rdi - 用户输入起始地址
%rsi - phase_2 的栈指针

### 解读 read_six_numbers
下面是 `read_six_numbers` 的代码：
```
000000000040145c <read_six_numbers>:
  40145c:	48 83 ec 18          	sub    $0x18,%rsp
  401460:	48 89 f2             	mov    %rsi,%rdx
  401463:	48 8d 4e 04          	lea    0x4(%rsi),%rcx
  401467:	48 8d 46 14          	lea    0x14(%rsi),%rax
  40146b:	48 89 44 24 08       	mov    %rax,0x8(%rsp)
  401470:	48 8d 46 10          	lea    0x10(%rsi),%rax
  401474:	48 89 04 24          	mov    %rax,(%rsp)
  401478:	4c 8d 4e 0c          	lea    0xc(%rsi),%r9
  40147c:	4c 8d 46 08          	lea    0x8(%rsi),%r8
  401480:	be c3 25 40 00       	mov    $0x4025c3,%esi     # x/s 0x4025c3: "%d %d %d %d %d %d"
  401485:	b8 00 00 00 00       	mov    $0x0,%eax
  40148a:	e8 61 f7 ff ff       	callq  400bf0 <__isoc99_sscanf@plt>
  40148f:	83 f8 05             	cmp    $0x5,%eax
  401492:	7f 05                	jg     401499 <read_six_numbers+0x3d>
  401494:	e8 a1 ff ff ff       	callq  40143a <explode_bomb>
  401499:	48 83 c4 18          	add    $0x18,%rsp
  40149d:	c3                   	retq 
```
401460 - 40147c 这一大段代码执行完后，寄存器和 read_six_numbers 函数的栈内容如下：
![Phase 2 - read six numbers - register & stack snapshot][3]
可以看到高亮的4个寄存器和栈顶的两个字段内容正是从 phase_2 函数栈顶开始的 6 个地址，每个地址间隔一个 32 位字长。
结合输入参数， 以及存放在地址 0x4025c3 中的 "%d %d %d %d %d %d" 字符串，不难猜测 read_six_number 函数的功能就是尝试将用户输入解析为 6 个数值，并存入给定地址。

「Note」"64-bit Linux uses the System V AMD64 ABI convention, which uses RDI, RSI, RDX, RCX, R8, and R9 for integers and address and the XMM registers for floating point arguments." 由此可知，sscanf 函数调用的前六个参数分别从以上六个寄存器中读取。

了解了 read_six_numbers 的功能之后，我们继续分析 phase_2 函数：
```
  400f05:	e8 52 05 00 00       	callq  40145c <read_six_numbers>
  400f0a:	83 3c 24 01          	cmpl   $0x1,(%rsp)
  400f0e:	74 20                	je     400f30 <phase_2+0x34>
  400f10:	e8 25 05 00 00       	callq  40143a <explode_bomb>
  400f15:	eb 19                	jmp    400f30 <phase_2+0x34>
  400f17:	8b 43 fc             	mov    -0x4(%rbx),%eax
  400f1a:	01 c0                	add    %eax,%eax
  400f1c:	39 03                	cmp    %eax,(%rbx)
  400f1e:	74 05                	je     400f25 <phase_2+0x29>
  400f20:	e8 15 05 00 00       	callq  40143a <explode_bomb>
  400f25:	48 83 c3 04          	add    $0x4,%rbx
  400f29:	48 39 eb             	cmp    %rbp,%rbx
  400f2c:	75 e9                	jne    400f17 <phase_2+0x1b>
  400f2e:	eb 0c                	jmp    400f3c <phase_2+0x40>
  400f30:	48 8d 5c 24 04       	lea    0x4(%rsp),%rbx
  400f35:	48 8d 6c 24 18       	lea    0x18(%rsp),%rbp
  400f3a:	eb db                	jmp    400f17 <phase_2+0x1b>
  400f3c:	48 83 c4 28          	add    $0x28,%rsp
```
已知 read_six_numbers 将用户输入解析为 6 个数值并存入 phase_2 的栈中，那么 400f0a 这条指令就是将用户输入的第一个数值与 1 进行比较，如果不相等，那么就 💥 BOOM！如果相等，则跳到 400f30，然后取下一个数值到 %rbx，然后跳转到 400f17。

400f17 - 400f2e 这一段做的事情就是把每个输入自加，看是否与下一个输入相等，又因为要求第一个值为 1，一共有 6 个输入，所以不难得出这一关的期望输入 **“1 2 4 8 16 32”**，也就是 a0 = 1, q = 2 的等比数列的前六项。（梦回高中系列）

---
## Phase 3 - 幸运组合

我们继续解 phase_3，先看前半部分代码：
```
0000000000400f43 <phase_3>:
  400f43:	48 83 ec 18          	sub    $0x18,%rsp
  400f47:	48 8d 4c 24 0c       	lea    0xc(%rsp),%rcx
  400f4c:	48 8d 54 24 08       	lea    0x8(%rsp),%rdx
  400f51:	be cf 25 40 00       	mov    $0x4025cf,%esi
  400f56:	b8 00 00 00 00       	mov    $0x0,%eax
  400f5b:	e8 90 fc ff ff       	callq  400bf0 <__isoc99_sscanf@plt>
  400f60:	83 f8 01             	cmp    $0x1,%eax
  400f63:	7f 05                	jg     400f6a <phase_3+0x27>
  400f65:	e8 d0 04 00 00       	callq  40143a <explode_bomb>
```
到这里，我们基本可以养成看到代码中出现地址就先试着作为 string 输出看看内容的习惯，比如 400f51 行，调用 `x/s 0x4025cf` 可以得到字符串 "%d %d"。由此，我们猜测这一关卡的期待输入是**两个数**。

前面已经提到 sscanf 将 %rdx, %rcx 一次作为第三、第四参数。在 phase_3 中，调用 sscanf 前已将 0x8(%rsp)， 0xc(%rsp) 分别存入 %rdx, %rcx，由此可知正确的输入将被解析为两个数值，并分别存放在 0x8(%rsp)， 0xc(%rsp) 中。

400f60 - 400f65 这一段调用系统函数读取用户输入并判断用户输入是否大于两个值，如果不是，恭喜你喜提 💥 BOOM！反之继续：
```
  400f6a:	83 7c 24 08 07       	cmpl   $0x7,0x8(%rsp)
  400f6f:	77 3c                	ja     400fad <phase_3+0x6a>
```
首先将第一个输入值与 7 进行比较，如果大于 7，则引爆炸弹，否则继续：
```
  400f71:	8b 44 24 08          	mov    0x8(%rsp),%eax
  400f75:	ff 24 c5 70 24 40 00 	jmpq   *0x402470(,%rax,8)
  400f7c:	b8 cf 00 00 00       	mov    $0xcf,%eax
  400f81:	eb 3b                	jmp    400fbe <phase_3+0x7b>
  400f83:	b8 c3 02 00 00       	mov    $0x2c3,%eax
  400f88:	eb 34                	jmp    400fbe <phase_3+0x7b>
  400f8a:	b8 00 01 00 00       	mov    $0x100,%eax
  400f8f:	eb 2d                	jmp    400fbe <phase_3+0x7b>
  400f91:	b8 85 01 00 00       	mov    $0x185,%eax
  400f96:	eb 26                	jmp    400fbe <phase_3+0x7b>
  400f98:	b8 ce 00 00 00       	mov    $0xce,%eax
  400f9d:	eb 1f                	jmp    400fbe <phase_3+0x7b>
  400f9f:	b8 aa 02 00 00       	mov    $0x2aa,%eax
  400fa4:	eb 18                	jmp    400fbe <phase_3+0x7b>
  400fa6:	b8 47 01 00 00       	mov    $0x147,%eax
  400fab:	eb 11                	jmp    400fbe <phase_3+0x7b>
  400fad:	e8 88 04 00 00       	callq  40143a <explode_bomb>
  400fb2:	b8 00 00 00 00       	mov    $0x0,%eax
  400fb7:	eb 05                	jmp    400fbe <phase_3+0x7b>
  400fb9:	b8 37 01 00 00       	mov    $0x137,%eax
  400fbe:	3b 44 24 0c          	cmp    0xc(%rsp),%eax
  400fc2:	74 05                	je     400fc9 <phase_3+0x86>
  400fc4:	e8 71 04 00 00       	callq  40143a <explode_bomb>
  400fc9:	48 83 c4 18          	add    $0x18,%rsp
```
将第一个输入值存入 %eax 中，接着是一条跳转指令，`jmpq   *0x402470(,%rax,8)`，这里采取的是**比例变址寻址**：
Addr = 0x402470 + %rax * 8

我们先通过命令 `x/8gx 0x402470` 查看这个地址开始的 8 个64位，结果如下所示：
![Phase 3 - x/16wx 0x402470][4]
不难发现，这几个地址刚好和代码中的几个分支相对应，每个分支读取一个数值到 %eax，然后跳转到 400fbe 将其与输入的第二个数值进行比较，如果相等，则成功通关，否则引爆炸弹。

我们已知第一个输入要小于 7，因此有 0 - 7 八个数值，根据上面的寻址公式，我们可得到如下八组幸运组合，输入八个组合中的任意一个都可以通过关卡：

|0|1|2|3|4|5|6|7|
|---|---|---|---|---|---|---|---|
|207|311|707|256|389|206|682|327|

非常棒，我们已经解决一半关卡了～再接再厉～

---
# Phase 4 - 奇妙的位移

未完待续...

[1]: /uploads/images/bomb_boom.png
[2]: /uploads/images/bomb_phase1_debug.png
[3]: /uploads/images/bomb_phase1_debug.png
[4]: /uploads/images/bomb_phase3_addr.png