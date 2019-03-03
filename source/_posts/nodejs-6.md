---
title: Node学习（六）- 内存控制（二）
date: 2017-03-12 19:29:23
categories: 技术笔记
tags: Node
---

## 高效使用内存
### 变量的主动释放
* 全局变量位于全局作用域中，要直到进程退出才释放，此时将导致引用的对象常驻内存（老生代中）。
* 如果需要释放常驻内存的对象：
    * 通过delete删除引用关系（在V8中通过delete删除对象可能干扰V8的优化，所以用赋值更好）
    * 将变量重新赋值，让旧的对象脱离引用关系

<!--more-->
### 闭包
闭包的使用会导致一旦有变量引用某个中间函数，这个中间函数将不会被释放，同时也会使得原始的作用域不会得到释放，导致内存不能立即得到释放

## 内存指标
### 内存占用
* 查看进程内存占用

```
$ node
> process.memoryUsage()
{   rss: 19689472, // resident set size, 进程常驻部分
    heapTotal: 9473104, // V8的对内存总量
    heapUsed: 4670464 // 目前堆中使用的量
}
// 单位都是字节
```

以下是一个分配内存但不释放，最终导致堆内存溢出的例子：
```javascript
var showMem = function() {
    var mem = process.memoryUsage();
    var format = function(bytes) {
        return (bytes / 1024 / 1024).toFixed(2) + 'MB';
    }
    console.log('Process:heapTotal ' + format(mem.heapTotal)
        + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss)); 
    console.log('------------------------------------------------');
};

var useMem = function() {
    var size = 50 * 1024 * 1024;
    var arr = new Array(size);
    for (var i = 0; i < size; i++) {
        arr[i] = 0;
    }
    return arr;
}

var total = [];

for (var j = 0; j < 10; j++) {
    showMem();
    total.push(useMem());
}

showMem();
```
运行结果如下图所示：
![node heap out of memory][1]

* 查看系统内存占用

```
os.totalmem();
os.freemem();
```

### 堆外内存
由process.memoryUsage()的结果可以看到，堆中的内存总量总是小鱼进程的常驻内存用量，那么这些不是通过V8分配拟的内存被称为堆外内存。
利用堆外内存可以突破内存限制的问题。
```javascript
// 我们将上述例子中分配Array改为Buffer
var useMem = function() {
    var size = 50 * 1024 * 1024;
    var buffer = new Buffer(size);
    for (var i = 0; i < size; i++) {
        buffer[i] = 0;
    }
    return buffer;
}
```
运行结果：
![use buffer][2]
这其中的原因是Buffer对象不同于其他对象，它不经过V8的内存分配机制，所以也不会有堆内存的大小限制。为什么Buffer不是通过V8分配呢？这是因为相比起浏览器端运行的JavaScript，Node需要处理网络流和文件I/O流，操作字符串远不能满足传输的性能要求。

## 内存泄漏
内存泄漏的实质：应当回收的对象出现意外没有被回收，变成了老生代中的常驻对象。
造成内存泄漏的几个主要原因：

* 缓存
* 队列消费不及时
* 作用域未释放

### 缓存与内存
一旦一个对象被当做缓存来使用，那么它将会常驻在老生代中。缓存中存储的键越多，长期存活的对象也就越来越多，这将导致垃圾回收在进行扫描和整理时，对这些对象做无用功。
在JavaScript编程过程中，开发者通常喜欢用对象的键值对来缓存，但是**严格意义上的缓存有完善的过期策略**，普通对象的键值对并没有。

* 缓存限制策略：限制缓存的无限增长（LRU，FIFO算法等等）
* 缓存的大量使用：采用进程外的缓存，进程自身不存储状态
    * 如果在进程内使用缓存，进程之间无法共享，浪费物理缓存
    * 外部的缓存软件有良好的缓存过期淘汰策略以及自有的内存管理，不影响Node进程的性能

在Node中使用外部缓存机制可以解决如下问题
1. 将缓存移到外部，减少常驻内存的对象的数量，提高垃圾回收效率
2. 进程之间共享缓存

具体实现可以参看[Redis][3]和[Memcached][4]

[1]: http://o8bxo46sq.bkt.clouddn.com/node_memory_overflow.png
[2]: http://o8bxo46sq.bkt.clouddn.com/use_buffer.png
[3]: https://github.com/NodeRedis/node_redis
[4]: https://github.com/3rd-Eden/memcached