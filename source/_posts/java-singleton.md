---
title: 在 Java 中实现单例模式
date: 2020-05-05 16:05:45
categories: 设计模式
tags: 
- Java
- 单例模式
---

虽然单例模式很好理解，在具体实现的时候，还是有很多细节需要注意。几年前，我写过一篇在 Javascript 中实现单例模式的笔记，但其实在不同语言中实现单例模式还是有不少的区别，尤其像 Java、C++ 这类多线程语言。

在本文中，我们一起来看看在 Java 中实现单例模式都有哪些方式，要考虑哪些问题。
<!--more-->

---
# 单线程中的单例模式
一说到单例模式，大家的第一反应可能都是：那还不简单，看我一下给你写好几个版本出来：

* **公共静态类变量**
```java
public class EagerHelper {
    public static final EagerHelper INSTANCE = new EagerHelper();
    private EagerHelper() {}
}
```

* **私有静态类变量 + 工厂方法**
```java
public class EagerFactoryHelper {
    private static final EagerFactoryHelper INSTANCE = new EagerFactoryHelper();
    private EagerFactoryHelper() {}
    public static EagerFactoryHelper getInstance() {
        return INSTANCE;
    }
}
```

* **工厂方法 + Lazy Initialization**
```java
public class LazyFactoryHelper {
    private static LazyFactoryHelper INSTANCE = null;
    private LazyFactoryHelper() {}
    public static LazyFactoryHelper getInstance() {
        if (INSTANCE == null) {
            INSTANCE = new LazyFactoryHelper();
        }
        return INSTANCE;
    }
}
```
乍一看，上面这三种都实现了单例模式：
* 使用类变量共享唯一实例
* 私有构造函数防止外部创建实例
* 还用到了 Lazy Initialzation 降低在加载类时的开销，将初始化推迟到第一次访问实例时

然而，上面的实现都只能在单线程环境中使用，一旦涉及了多线程，就会出问题了。如果有多个线程同时访问，就可能出现初始化多个实例，或者某个线程获得尚未完成初始化的实例，导致程序运行出错。

那么，如何实现线程安全的单例呢？

---
# 多线程中的单例模式
提到多线程，一定离不开锁机制。提到 Java 中的多线程，一定离不开 `synchronized`、`volatile` 等关键字。

## synchronized
一般来说，使用 `synchronized` 关键字修饰方法是最容易想到的实现方式：
```java
public class SyncHelper {
    private static SyncHelper INSTANCE = null;
    private SyncHelper() {}
    public synchronized static SyncHelper getInstance() {
        if (INSTANCE == null) {
            INSTANCE = new SyncHelper();
        }
        return INSTANCE;
    }
}
```

然而，这样实现导致每次请求实例都要执行加锁、释放锁的操作，这会对性能造成不小的影响。而事实上，只有最初请求实例的几个线程可能会遇到竞争的情况，当唯一的实例创建完成后，后续请求实例的线程本可以直接获得实例，这时还要先申请锁实在是没必要。
为了减少不必要的加锁操作，可以采用 **双重检查锁定** 模式。

---
## Double-checked Locking Idiom
**Double-checked Locking**, 即**双重检查锁定**，按照如下逻辑实现加锁机制：
1. 检查实例是否已创建，如果是，则直接返回已有实例
2. 否则，请求锁
3. 再次检查实例是否已创建，如果之前拿到锁的线程已经创建好实例，那么直接返回已有实例
4. 否则，创建并返回实例

代码如下：
```java
public class DoubleCheckedHelper {
    private static DoubleCheckedHelper INSTANCE = null;
    private DoubleCheckedHelper() {}
    public static DoubleCheckedHelper getInstance() {
        if (INSTANCE == null) {
            synchronized (DoubleCheckedHelper.class) {
                if (INSTANCE == null) {
                    INSTANCE = new DoubleCheckedHelper();
                }
            }
        }
        return INSTANCE;
    }
}
```

上面这段代码真的没有问题吗？我们要意识到实例的初始化并不是一瞬间完成的事情，考虑如下情况：
当线程 A 正在初始化实例但尚未完成，这时 `INSTANCE` 已经指向了一块分配好的内存。此时线程 B 调用 `getInstance` 方法，`INSTANCE == null` 这句判断的值为 false，这个尚未完成初始化的“半成品”实例会被返回给线程 B，导致线程 B 运行出错。

因此，上面这个版本的双重检查锁定模式是有问题的。如何修正呢？很简单，引入 `volatile` 关键字。这里用到了 `volatile` 提供的 **happens-before** 保证。（不熟悉 `volatile`？，请移步各大搜索引擎～）
修正后的版本如下：
```java
public class DoubleCheckedHelper {
    private volatile static DoubleCheckedHelper INSTANCE = null;
    private DoubleCheckedHelper() {}
    public static DoubleCheckedHelper getInstance() {
        DoubleCheckedHelper localRef = INSTANCE;
        if (localRef == null) {
            synchronized (DoubleCheckedHelper.class) {
                localRef = INSTANCE;
                if (localRef == null) {
                    localRef = INSTANCE = new DoubleCheckedHelper();
                }
            }
        }
        return localRef;
    }
}
```
在上面这段代码中，我们除了引入了 `volatile` 修饰实例变量之外，还在 `getInstance` 方法中引入了一个局部变量，这么做是为了降低访问 `volatile` 变量带来的性能开销。

---
## Initialization-on-demand holder Idiom
修正过的双重检查锁定机制虽然是线程安全的，但这段代码看起来实在是不怎么优美。那么，有没有更简洁优美的方式呢？
尽善尽美的程序员们开发除了 **Initialization-on-demand holder** 模式，代码如下：
```java
public class InitOnDemandHelper {
    private InitOnDemandHelper() {}
    private static class LazyHolder {
        static final InitOnDemandHelper INSTANCE = new InitOnDemandHelper();
    }
    public static InitOnDemandHelper getInstance() {
        return LazyHolder.INSTANCE;
    }
}
```
**Initialization-on-demand holder** 模式利用了 JVM 的类初始化机制：类
* 当类加载器加载 `Helper` 类时，由于它没有定义任何静态类变量，`Helper` 类的初始化基本上啥事儿也不用干，**节省了类初始化的开销**；
* 只有当外部代码调用 `Helper.getInstance()` 方法获取 `Helper` 实例时，`LazyHolder` 才会被初始化，这时才会创建实例，**实现了 Lazy Initialization**；
* JVM 会保证类的初始化在多线程环境中被正确地加锁、同步，如果有多个线程同时初始化一个类，那么只会有一个线程执行类的初始化方法，其他线程将被阻塞直到类初始化完成。这一 JVM 的硬性要求保证了这一实现是**线程安全**的。

你以为到这里就结束了吗？是时候展现真正的技术了！

---
## Enum！
所有上面这些基于工厂方法的实现，在对象的序列化和反序列化时会遇到问题。
怎么办呢？使用 Java 中的 `enum` 类型来实现单例模式可以完美的解决序列化的问题，同时还自带线程安全特性。（实不相瞒，本小白也是今天才学到如此奇技淫巧，着实没想到枚举类型还能这样用，妙哉妙哉～）
代码相当精简：
```java
public enum EnumHelper {
    INSTANCE;
    // other methods
}
```
如上所示，`EnumHelper.INSTANCE` 就是一个线程安全的单例实例了。

---

还有一些坑没有提到，明天继续～

**参考资料**
* [Double-checked Locking - wiki](https://en.wikipedia.org/wiki/Double-checked_locking#Usage_in_Java)
* [Why is volatile used in double checked locking](https://stackoverflow.com/questions/7855700/why-is-volatile-used-in-double-checked-locking)
* [Initialization-on-demand Holder - wiki](https://en.wikipedia.org/wiki/Initialization-on-demand_holder_idiom)
* [Java Singletons Using Enum](https://dzone.com/articles/java-singletons-using-enum)
* Effective Java, 3rd edition