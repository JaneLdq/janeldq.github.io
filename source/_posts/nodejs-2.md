---
title: Node学习（二）- 异步编程的解决方案（1）
date: 2017-02-28 14:47:32
categories: 技术笔记
tags: Node
---

目前异步编程的主要解决方案有如下三种：

* 事件发布/订阅模式
* Promise/Deferred模式
* 流程控制库

## 事件发布/订阅模式（事件侦听器模式）
事件发布/订阅模式可以实现事件与回调函数（事件侦听器）的一对多关联。
该模式常被用来解耦业务逻辑，事件发布者无需关注侦听器如何实现业务逻辑，甚至不用关注有多少个侦听器，数据通过消息的方式灵活传递。

<!--more-->

换个角度，事件侦听器模式也是一种**钩子(hook)机制**，利用钩子导出内部数据或状态给外部的调用者。通过事件钩子的方式，可以使编程者不用关注组件是如何启动和执行的，只需关注在需要的事件点上即可。

Node对事件发布/订阅机制做了一些额外处理

* 如果一个事件的侦听器大于10个，会得到一条警告（可能导致内存泄漏；过多占用CPU等情景）。调用emitter.setMaxListeners(0)可以去掉该限制。
* 为了处理异常，EventEmitter对error事件特殊对待。如果运行期间的错误触发了error事件，EventEmitter会检查error事件的侦听器，如果有，交给侦听器，否则作为异常跑出。如果外部没有捕获这个异常，将引起线程退出。
 
### 利用事件队列解决雪崩问题
* 雪崩问题：在高访问量、大并发量的情况下缓存失效的情形，此时大量请求同时涌入数据库，数据库无法同时承受如此大的查询请求，进而影响网站整体的响应速度。
* once()：通过它添加的侦听器只执行一次，执行之后会将它与事件的关联移除。

```javascript
var proxy = new events.EventEmitter();
// 移除警告，可能有很多次调用
proxy.setMaxListener(0);
var status = "ready";
var slect = function(callback) {
// 这里利用once()方法，将所有请求的回调都压入事件队列中，保证每一个回调都只会被执行一次
    proxy.once("selected", callback);
    // 对于相同的SQL语句，保证在同一个查询开始到结束的过程中永远只有一次，新到来的相同调用只需在队列中等待数据就绪即可，一旦查询结束，得到的结果将被这些调用共同使用，节省了重复的数据库调用开销
    if (status === "ready") {
        status = "pending";
        db.select("SQL", function(results) {
            proxy.emit("selected", results);
            status = "ready";
        });
    }
};
```

### 多异步之间的协作方案
多异步协作也就是处理事件与侦听器是多对一的情况，某一个业务逻辑可能依赖两个通过回调或事件传递的结果。

由于多个异步场景中回调函数的执行并不能保证顺序，且回调函数之间没有任何交集，需要借助第三方函数与第三方变量（通常称作**哨兵变量**）来处理异步协作的结果。

```javascript
var after = function(times, callback) {
    // count哨兵变量
    var count = 0, results = {};
    // 返回一个偏函数，times的值是预设好的
    return function(key, value) {
        results[key] = value;
        count++;
        if (count === times) {
            callback(results);
        }
    };
};
```

以渲染页面需要*模板读取*、*数据读取*和*本地化资源*读取为例：

```javascript
var done = after(times, render);
var emitter = new events.Emitter();

// 事件：侦听器 = 1:N
emitter.on("done", done);
emitter.on("done", other);

// 事件：侦听器 = N:1
fs.readFile(template_path, "utf8", function(err, template) {
    emitter.emit("done", "template", template);
});
db.query(sql, function(err, data) {
    emiiter.emit("done", "data", data);
});
l10n.get(function(err, resources) {
    emitter.emit("done", "resources", resource);
});

// 这个方案结合了多对一的收敛和一对多的发散，但这个方案也要求调用者要自己准备done()函数以及在回调函数中解析提取结果中的数据
```

### EventProxy模块
* 提供了all(), tail(), after()等等方法
* 完善了异常处理, fail(), done()等方法
* 详情参见[EventProxy Git项目地址][2]

  [2]: https://github.com/JacksonTian/eventproxy
  [3]: http://blog.csdn.net/jiangxinyu/article/details/5284079