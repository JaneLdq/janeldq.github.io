---
title: Node学习（七）- Node中的错误处理
date: 2017-03-21 10:43:51
categories: 技术笔记
tags: Node
---
毕设中遇到了错误处理和参数检查相关的问题，一直以来这一块都不甚清楚，上网找到了一篇文章，介绍Node.js中处理错误的最佳实践，开篇提出的问题无比吻合我目前的疑惑。

[英文原文：Error Handling in Node.js][1]
[中文译文：\[译\] NodeJS 错误处理最佳实践][2]

以上是原文和译文，在这里是为了加深自身记忆摘取一些重点。
<!--more-->
## Node.js三种主要错误传递方式
### Throw
作为异常抛出错误，是以同步的方式传递异常，也就是在函数被调用处的相同上下文。如果调用者使用try/catch则可以捕获，如果没有，程序通常会崩溃。

在Node.js中，错误（error）和异常（exception）是不同的。一个错误是一个Error类的实例，错误在被构造出来后可以直接传递给其他函数或者抛出来。当你抛出一个错误时，它就变成了一个异常。

```javascript
// 如下是错误作为异常的例子
throw new Error('something bad happened!');
// 也可以不抛出错误，作为参数传递
// 这种使用方式在Node中更为常见，应为大部分的错误都是异步的
callback(new Error('something bad happened');
```

### Callback
callback回调函数是专门处理错误和异步操作的结果的函数。callback是最基础的异步传递错误的方式。通常是以callback(err, result)的形式调用，err和result只有一个是non-null，这取决于操作的成败。

### EventEmitter
在EventEmitter上触发一个Error事件，由调用者监听error事件。这种方式在两种特殊情况下有效：

* 当你在执行一个可能产生多个错误或多个结果的操作时。例如http请求的data,end和error事件。
* 用在那些具有复杂状态机的对象上，这些对象往往伴随着大量的异步事件。例如socket可能会触发connect, end, timeout, drain, close等事件。这样可以把error作为另外一种可触发的事件。

在大多数情况下，我们会把 callback 和 event emitter 归到同一个“异步错误传递”篮子里。如果你有传递异步错误的需要，你通常只要用其中的一种而不是同时使用。

## 操作(Operational)失败 vs. 编程者(Programmer)错误
### 操作失败
**操作失败**是正确编写的程序在运行时产生的错误。程序中并没有bug。通常它是由其他问题：系统本身（内存溢出，打开的文件太多）、系统配置（访问远端主机的路由不存在）、网络（socket挂起）、远程服务问题（500错误、连接失败等等）。例子如下：

* 连接服务器失败
* 解析主机名失败
* 无效用户输入
* 请求超时
* 服务器返回500
* socket挂起
* 系统内存溢出
    
### 编程者失误
**编程者失误**是程序中的bug。通常修改代码就可以避免这些问题。它们是不可能被正确处理的。例如：

* 尝试从‘undefined’读属性
* 调用异步函数却不指定回调
* 该传对象时却传递字符串
* 该传IP地址时却传对象

**操作失败是程序正常操作的一部分，只要被妥善处理，它们就不一定预示着bug或者严重的问题。而由编程者的失误则是bug。**

### 难分难解的关系
有时，同一个问题中可能同时存在操作失败和编程者失误，例如：

*If an HTTP server tries to use an undefined variable and crashes, that's a programmer error. Any clients with requests in flight at the time of the crash will see an ECONNRESET error, typically reported in Node as a "socket hang-up". For the client, that's a separate operational error. That's because a correct client must handle a server that crashes or a network that flakes out.*

类似，如果不处理好操作失败, 这本身就是一个编程者失误，例如：
	
*If a program tries to connect to a server but it gets an ECONNREFUSED error, and it hasn't registered a handler for the socket's 'error' event, then the program will crash, and that's a programmer error. The connection failure is an operational error (since that's something any correct program can experience when the network or other components in the system have failed), but the failure to handle it is a programmer error.*

### 处理操作失败
对任何可能导致错误的代码都需要考虑操作失败时发生了什么：

* How it may fail(the failure mode)
* what such a failure would indicate

错误处理的粒度要细，因为哪里出错和为什么出错决定了它产生的影响大小和对策。

对于一个给定的错误，有如下对策：

* **直接处理**：有的时候该做什么很清楚。
* **把出错传递到客户端**：如果不清楚该做什么，最简单的做法就是放弃你正在执行的操作，清理所有开始的，并且把错误抛回客户端。这种方式适合错误短时间内无法解决的情形。例如用户传来一个无效JSON。
* **重试操作**：对于由网络或者远程服务引起的错误，有时重试操作是有用的（例如503错误）。**如果确定要重试，就应该清晰的用文档记录下将会多次重试，重试多少次直到失败,以及两次重试的间隔。**另外，**不要每次都假设需要重试**。如果调用栈很深，那么最好是快速失败并且让终端客户来重试。如果每一层调用都重试，反而会导致用户等待更长的时间。
* **直接崩溃**：对于本不可能发生的错误或者编程失误导致的错误，可以记录错误日志然后直接崩溃。例如内存不足等。
* **记录错误，其他什么也不做**：有的时候你什么都做不了，没有操作可以重试或者放弃，没有任何理由崩溃掉应用程序。例如，你用DNS跟踪了一组远程服务，结果有一个DNS失败了。除了记录一条日志并且继续使用剩下的服务以外，你什么都做不了。

### 处理编程错误（并不）
对于编程错误，**并没有什么可处理的**。从定义上看，一段本该工作的代码坏掉了（比如变量名敲错），你不能用更多的代码再去修复它。即使你这么做了，你也只是用错误处理的代码代替了出错的代码。

有一些人提倡从编程错误中恢复，也就是允许当前操作失败，但仍然处理请求。这种做法不推荐。
	
*考虑这样的情况：原始代码里有一个失误是没考虑到某种特殊情况。你怎么确定这个问题不会影响其他请求呢？如果其它的请求共享了某个状态（服务器，套接字，数据库连接池等），有极大的可能其他请求会不正常。*
    
因此，**从编程错误中恢复的最好方法就是立刻崩溃**。你应该使用一个restarter运行程序，当程序崩溃时自动重启。如果restarter 准备就绪，崩溃是失误来临时最快的恢复可靠服务的方法。

在这种情况下使程序崩溃的唯一负面影响就是相连的客户端会暂时被干扰，但是请记住如下几点：

* 这些错误本质上是bug, bug在生产代码中应该是极少的，并且享有最高优先级被debug和修复
* 请求没有必要一定得成功完成
* 在一个可靠地分布式系统中，客户端必须能够通过重连接和重发请求来处理服务器端的错误
* 如果你的程序如此频繁地崩溃让连接断开变成了问题，那么真正的问题是服务器 Bug 太多了，而不是因为你选择出错就崩溃

* **附：服务端bug太多如何调试？**
利用堆栈信息和日志。把NodeJS配置成出现未捕获异常时把内核文件打印出来，在GNU/Linux或者illumos系统上使用这些内核文件，查看应用崩溃时的堆栈记录、传给函数的参数、闭包里引用的变量等等。

## 编写函数的实践

**写好文档！！！**
包括它接受的参数（附上类型和其它约束），返回值，可能发生的错误，以及这些错误意味着什么。

### 如何选择错误传递方式？
考虑两点：

* 这是操作失败还是编程错误
* 这个函数本身是同步的还是异步的

目前为止最常见的例子是在异步函数中发生了操作失败，大多数情况下，会将一个回调函数作为参数传过来，当错误发生时把错误传给回调。例子可参照Node的fs模块。如果情况更复杂，可以考虑使用EventEmitter。即使这样也是以异步传递错误。

另一个常见例子是JSON.parse，对于这类函数，如果你类似用户无效输入算作操作失败，那么就需要同步传递错误。可以选择抛出（更常用）或者返回错误。

对于一个给定的函数，如果任何一个操作错误可以被异步传递，那么所有的操作错误都要异步传递。

通用规则：**一个函数可以同步传递错误（throw），也可以异步传递错误（callback(error) or emitting error），但不应该同时使用。**

对于编程错误它们作为bug，永远不应该被处理，而应该是被修理！**认真讲：除非是在开发环境下，否则编程错误永远都不应该出现**。

### 如何界定一个Bad input是操作失败还是编程错误呢？
两个字：**文档**

*It's up to you to define and document what types your function will allow and how you'll try to interpret them.*
    
如果你接收到的输入是文档表明不可接受的，那么就是编程错误；如果输入是文档表明可接收但是你现在无法处理的，那么就是操作失败。

你要利用自己的判断力来决定你需要的严格程度。建议偏严格一点，毕竟条件太宽松，靠猜测总是更容易错的。

*To get specific, imagine a function called "connect" that takes an IP address and a callback and invokes the callback asynchronously after either succeeding or failing. Suppose the user passes something that's obviously not a valid IP address, like 'bob'. In this case, you have a few options:*
*1. Document that the function only accepts strings representing valid IPv4 addresses, and throw an exception immediately if the user passes 'bob'. This is strongly recommended.*
*2. Document that the function accepts any string. If the user passes 'bob', emit an asynchronous error indicating that you couldn't connect to IP address 'bob'.*

如果一个值怎么都不可能是有效的，就应该在文档里写明是这不允许的并且立刻抛出一个异常。只要在文档里写的清清楚楚，那这就是一个程序员的失误而不是操作失败。立即抛出可以把Bug带来的损失降到最小，并且保存了开发者可以用来调试这个问题的信息。

## 具体的编写新函数的建议
### 1. 清楚的知道函数是做什么的
每个接口的文档都要清洗的描述如下几点：

* 应该输入哪些参数
* 每个参数的类型
* 每个参数的任何附加的其他约束（例如必须是一个有效IP地址）

如果以上任意一点错误或者缺少，那么就是编程错误，应该立即抛出异常。
另外还有如下内容需要记录在文档中：

* 调用方可能会遇到的操作失败（以及它们的name）
* 如何处理操作失败（是会作为异常抛出，还是传递给回调，或者是触发事件）
* 函数返回值

### 2. 使用 Error 对象或它的子类，并且实现 Error 的协议
所有错误应该使用Error类或者它的子类，并应该提供name和message属性，以及准确的stack。

### 3. 使用Error的name属性在程序中区分错误
当你想要知道错误是何种类型的时候，用 name 属性。可以考虑重用使用JavaScript内置的错误名如RangeError， Http异常如BadRequestError等
不要想着给每个东西都取一个新名字，可以取一个大类别，再通过属性说明具体问题。

### 4. 通过给Error对象增加属性增加细节说明
Node内置[Error][3]类详细介绍，可以通过设定相关属性值增加细节，至少如下属性需要说明：

* name: 用于在程序里区分众多的错误类型
* message: 可读（人而非机器）的错误消息。对可能读到这条消息的人来说这应该已经足够完整。如果你从更底层的地方传递了一个错误，你应该加上一些信息来说明你在做什么。
* stack：一般来讲不要随意扰乱堆栈信息。甚至不要增强它。V8引擎只有在这个属性被读取的时候才会真的去运算，以此大幅提高处理异常时候的性能。如果你读完再去增强它，结果就会多付出代价，哪怕调用者并不需要堆栈信息。

### 5. 如果要把底层抛出的错误传给上层调用者，记得先包装
通过包装，我们传递一个新的包含了所有底层错误消息和基于当前层附加的有用的上下文。
包装一个错误需要考虑的几点：

* 对于原始错误，原封不动地传给上层，当调用者想直接从原始错误获取信息时它仍是可访问的
* 要么使用原来的名字，要么显示地选择一个更有意义的名字
* 保留原错误的所有属性。在合适的情况下增强message属性（但是不要在原始的异常上修改）。浅拷贝其它的像是syscall，errno这类的属性。最好是直接拷贝除了 name，message和stack以外的所有属性，而不是硬编码等待拷贝的属性列表。不要理会stack，因为即使是读取它也是相对昂贵的。如果调用者想要一个合并后的堆栈，它应该遍历错误原因并打印每一个错误的堆栈。

[1]: https://www.joyent.com/node-js/production/design/errors
[2]: https://cnodejs.org/topic/55714dfac4e7fbea6e9a2e5d
[3]: https://nodejs.org/api/errors.html