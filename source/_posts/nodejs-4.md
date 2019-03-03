---
title: Node学习（四）- 异步编程的解决方案（3）
date: 2017-02-28 22:32:45
categories: 技术笔记
tags: Node
---

## 流程控制库

### connect —— 尾触发与next
需要手工调用才能持续执行后续调用的方法被称为**尾触发**，常见关键词next
目前主要应用在[connect][1]模块中：

<!--more-->
```javascript
var connect = require('connect');
var app = connect();
// use()用于注册中间件
app.use(connect.cookieParser());
app.use(connect.session());
app.use(connect.query());
app.use(connect.bodyParser());
app.use(connect.csrf());
// 创建服务器并监听3000端口
http.createServer(app).listen(3000);
```

中间件利用了尾触发机制，最简单的中间件如下：

```javascript
function(req, res, next) {
    // do something
}
```

![middleware flow][2]

中间件机制使得处理网络请求时，可以进行过滤、验证、日志等操作，而不与具体业务逻辑产生关联。

以下为简化过的connect的关键代码部分：

```javascript
var merge = require('utils-merge');
var proto = {};

function createServer() {
    function app(req, res, next) { 
        app.handle(req, res, next); 
    }
    merge(app, proto);
    merge(app, EventEmitter.prototype);
    app.route = '/';
    app.stack = [];
    return app;
}

proto.use = function use(route, fn) {
    // ...
    this.stack.push({ route: route, handle: fn});
    return this;
}

proto.handle = function handle(req, res, out) {
    // ...
    next();
}

function next(err) {
    // ...
    // next callback
    layer = stack[index++];
    layer.handle(req, res, next);
}
```

    尽管中间件这种尾触发模式并不要求每个中间方法都是异步的，但如果每个步骤都采用异步来完成，实际上只是串行化的处理，没办法通过并行的异步调用来提升业务的处理效率。流式处理可以将一些串行的逻辑扁平化，但是并行逻辑处理还是需要搭配事件或者Promise完成的。
    
### async
[async][3]是npm最知名的流程控制模块之一，提供了20多个方法用于处理异步的各种协作模式。

* 异步的串行执行 - series()
    适合无依赖的异步串行执行
* 异步的并行执行 - parallel()
* 异步调用的依赖处理 - waterfall()
    当前一个执行的结果是后一个调用的输入时，使用waterfall()
* 自动依赖处理 - auto()
    用于处理异步/同步复杂交错的业务处理

### Step
[Step][4]比async轻量， 只有一个API —— Step

```javascript
Step(task1, task2, task3);
```

Step接受任意数量的任务，所有任务串行依次执行：
```javascript
Step(
    function readFile1() {
        // Step 用到了this关键字，它是Step内部的一个next()方法，将异步调用的结果传递给下一个任务作为参数
        fs.readFile('f1.txt', 'utf-8');
    },
    function readFile2(err, content) {
        fs.readFile('f2.txt', 'utf-8', this);
    },
    function done(err, content) {
        console.log(content);
    }
);
```

Step并行任务执行实现：
```javascript
Step(
    function readFile1() {
    // this的parallel()方法告诉Step需要等到所有任务完成时才进入下一个任务
        fs.readFile('f1.txt', 'utf-8', this.parallel());
        fs.readFile('f2.txt', 'utf-8', this.parallel());
    },
    function done(err, content1, content2) {
        console.log(arguments);
    }
);
```


  [1]: https://github.com/senchalabs/connect
  [2]: http://o8bxo46sq.bkt.clouddn.com/middleware_flow.png
  [3]: http://caolan.github.io/async/
  [4]: https://www.npmjs.com/package/step
  [5]: https://github.com/JeffreyZhao/wind