---
title: Node学习（三）- 异步编程的解决方案（2）
date: 2017-02-28 17:21:19
categories: 技术笔记
tags: Node
---

## Promise/Deferred模式
Promise/Deferred模式在JavaScript中最早出现在[Dojo][1]中，因用于jQuery1.5版本而被广为所知。

```javascript
// 普通版本Ajax
// 这种绑定的方式使得一个事件只能处理一个回调
$.get('/api', {
    success: onSuccess,
    error: onError,
    complete: onComplete
});

<!--more-->

// Promise/Deferred模式的Ajax
// 通过Deferred对象可以对事件加入任意业务逻辑
$.get('/api')
    .success(onSuccess1)
    .success(onSuccess2)
    .error(onError)
    .complete(onComplete);
```

CommonJS规范目前已经抽象出了Promises/A、Promises/B、Promises/D等经典异步Promise/Deferred模型（官方标准[Promise/A+][2]，相比Promises/A有一些不同之处，新增了部分内容），**使得异步操作可以以一种更优雅的方式出现**——Promise/Deferred模式一定程度上缓解了回调导致的深度嵌套问题。

### Promises/A
以下以Promises/A为例介绍Promise/Deferred模式
Promises/A提议对单个异步操作作出如下抽象定义：

* Promise操作只处于三种状态的一种：**未完成态**、**完成态**和**失败态**
* Promise的状态只能从**未完成态->完成态**或**未完成态->失败**，不可逆。且完成态与失败态不可相互转化。
* Promise的状态一旦转化不可再更改。
![Promise状态转化图][3]

* 一个Promise对象只要有**then()**方法即可。对then()方法的要求：
    * 接受完成态和错误态的回调方法
    * 可选地支持progress事件回调作为第三个方法
    * then()只接受function对象，其余对象被忽略
    * then()方法继续返回Promise对象，实现链式调用

    ```javascript
    then(fulfilledHandler, errorHandler, progressHandler)
    ```
根据以上提议，以下代码通过继承events模块完成了一个简单实现：

```javascript
var Promise = function() {
    EventEmitter.call(this);
};
util.inheris(Promise, EventEmitter); // Node的util工具方法

// 实现then()以及相关约束
Promise.prototype.then = function(fulfilledHandler, errorHandler, progressHandler) {
    if (typeof fulfilledHandler === 'function') {
        // 利用once()方法，保证成功回调只执行一次
        this.once('success', fulfilledHandler);
    }
    if (typeof errorHandler' === 'function') {
        this.once('error', errorHandler);
    }
    if (typeof progressHandler' === 'function') {
        this.once('progress', progressHandler);
    }
    return this;
}

```

以上代码中Promise.then()方法只是将回调函数存放起来，绑定到了事件上，而实现触发执行这些回调函数的对象通常被称为Deferred（延迟对象），示例代码如下：

```javascript
var Deferred = function() {
    this.state = 'unfulfilled';
    this.promise = new Promise();
};

Deferred.prototype.resolve = function(obj) {
    this.state = 'fulfilled';
    this.promise.emit('success', obj);
};

Deferred.prototype.reject = function(obj) {
    this.state = 'failed';
    this.promise.emit('error', err);
};

Deferred.prototype.progress = function(data) {
    this.promise.emit('progress', data);
};

```

Deferred主要用于内部，用于维护异步模型的状态；Promise则作用于外部，通过then()方法暴露给外部以添加自定逻辑。

    Promise是高级接口，事件是低级接口。低级接口可以构成更多更复杂的场景，高级接口一旦定义、不太容易变化，不再有低级接口的灵活性，但对于解决典型问题非常有效。

```javascript
// res是一个response对象
res.setEncoding('utf8');
res.on('data', function(chunk){   console.log('BODY: ' + chunk); });
res.on('end', function() { // Done });
res.on('error', function(err) { // Error });

//将上述代码改造成Promise模式
var promisify = function(res) {
    var deferred = new Deferred();
    var result = '';
    res.on('data', function(chunk) {
        result += chunk;
        deferred.progress(chunk);
    });
    res.on('end', function() {
        deferrend.resolve(result);
    });
    res.on('error', function(err) {
        deferred.reject(err);
    });
    return deferred.promise;
}
promisify(res).then(function() {
    // Done
}, function(err) {
    // Error
}, function(chunk) {
    console.log('BODY: ' + chunk);
});

```

### Promise中的多异步操作
以下为一种简单的多异步原型实现
```javascript
Deferred.prototype.all = function(promises) {
    var count = promises.length;
    var that = this;
    var results = [];
    promises.forEach(function(promise, i) {
        promise.then(function(data) {
            count--;
            result[i] = data;
            if (count === 0) {
                that.resolve(results);
            }
        }, function(err) {
            that.reject(err);
        });
    });
    // 将promise数组抽象组合成一个新的Promise
    return this.promise;
};
```

## Promise进阶知识
Promise模式的缺陷是需要为不同的场景封装不同的API，但对于经典场景还是值得的。

### Promise的队列操作
对于嵌套执行的步骤，代码会十分难看：
```javascript
obj.api1(function(val1) {
    obj.api2(val1, function(val2) {
        obj.api3(val2, function(val3) {
            obj.api4(val3, function(val4) {
                callback(val4);
            });
        });
    });
});
```

理想的编程体验应当是将上一个调用的结果作为下一调用的输入：

```javascript
promise()
    .then(obj.api1)
    .then(obj.api2)
    .then(obj.api3)
    .then(obj.api4)
    .then(function(val4) {
        // Do something with val4
    }, function(err) {
        // Handle and error from step 1 to 4
    })
    .done();
```

要让Promise支持链式调用，主要通过两个步骤：

1. 将所有回调都存入队列中
2. Promise完成时，逐个执行回调，一旦检测到返回了新的Promise，停止执行，然后将当前的Deferred对象的promise的引用改变为新的Promise对象，并将队列中余下的回调转交给它。

为了实现链式调用，改造一下Promise/Deferred的实现。

```javascript
var Promise = function() {
    this.queue = [];
    this.isPromise = true;
};

Promise.prototype.then = function(fulfilledHandler, errorHandler, progressHandler) {
    var handler = {};
    if (typeof fulfilledHandler === 'function') {
        handler.fulfilled = fulfilledHandler;
    }
    if (typeof errorHandler === 'function'）{
        handler.error = errorHandler;
    }
    if (typeof progressHandler === 'function') {
        handler.progress = progressHandler;
    }
    this.queue.push(handler);
    return this;
};
```

```javascript
var Deferred = function() {
    this.promise = new Promise();
};

Deferred.prototype.resolve = function(obj) {
    var promise = this.promise;
    var handler;
    while ((handler = promise.queue.shift())) {
        if (handler && handler.fulfilled) {
            var ret = handler.fulfiiled(obj);
            if (ret && ret.isPromise) {
                ret.queue = promise.queue;
                this.promise = ret;
                return;
            }
        }
    }
};

Deferred.prototype.callback = function() {
    var that = this;
    return function(err, file) {
        if (err) {
            return that.reject(err);
        }
        that.resolve(file);
    };
};
```

读取文件为例：
```javascript
// var readFile1 = function(file, encoding) {
//     var deferred = new Deferrend();
//     fs.readFile(file, encoding, // deferred.callback());
//     return deferred.promise;
// }
// var readFile2 = function(file, encoding) {
//     var deferred = new Deferrend();
//     fs.readFile(file, encoding, // deferred.callback());
//     return deferred.promise;
// }

// 利用smooth统一将方法Promise化，就不用如上注释掉的代码那样重复了
var smooth = function(method) {
    return function() {
        var deferred = new Deferrend();
        var args = Array.prototype.slice.call(arguments, 1);
        args.push(deferred.callback());
        method.apply(null, args);
        return deferred.promise;
    };
};
var readFile = smooth(fs.readFile);

readFile('file1.txt', 'utf8').then(function(file1) {
        return readFile(file1.trim(), 'utf8');
}).then(function(file2) {
    console.log(file2);
});
```

## 相关参考
* [Node的模块**Q** - Promises/A规范的一个实现][4]
* [**Bluebird** - Promise/A+规范的一个实现][5]
* [Node异步编程方式][6]
* [JavaScript异步编程的Promise模式][7]


  [1]: https://dojotoolkit.org/
  [2]: https://promisesaplus.com/
  [3]: http://o8bxo46sq.bkt.clouddn.com/promise_state.png
  [4]: https://www.npmjs.com/package/q
  [5]: https://www.npmjs.com/package/bluebird
  [6]: http://www.infoq.com/cn/news/2011/09/nodejs-async-code
  [7]: http://www.infoq.com/cn/news/2011/09/js-promise