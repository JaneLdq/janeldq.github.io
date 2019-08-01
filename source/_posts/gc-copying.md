---
title: GC算法梳理（三）复制算法
date: 2019-07-31 19:50:57
categories: 技术笔记
tags: GC
---

复制 (Copying GC) 算法最早由 Marvin Lee Minsky 于1963年在 *A LISP Garbage Collector Algorithm Using Serial Secondary Storage* 中提出。

复制算法的基本思想很简单，就是把整个堆空间一分为二，每次只使用一半的空间用于分配：
* 正在使用的空间叫做 **From** 空间，空置的另一半称为 **To** 空间；
* 执行 GC 时，将 From 空间的**活动对象**都复制到 To 空间，然后对整个 From 空间进行回收；
* 复制完成后，将 From 空间和 To 空间交换，即原来的 From 空间变成了 To 空间，原来的 To 空间变成了 From 空间，直到下一次 GC，两个空间再次交换。

复制算法的一大特点就是它关注的是**活动对象**，而不像之前提到的**标记-清除算法**及**引用计数法**，都是遍历查找非活动对象。

<!--more-->
复制算法概要如下图所示：
![copying-gc][1]

接下来，我们将主要介绍两种复制算法的实现方式：
* **递归实现** - 由 Robert R. Fenichel 和 Jerome C. Yochelson 于 1969 年在 *A LISP Garbage-Collector for Virtual-Memory Computer Systems* 中提出。
* **迭代实现** - 由 C.J. Cheney 于 1970 年在 *A Nonrecursive List Compacting Algorithm* 中提出。

这两篇文章都不长，可以找来读一读～

---
# 递归复制算法
Robert R. Fenichel 和 Jerome C. Yochelson 给出的GC复制算法的实现**采用递归的形式，遍历每个 GC Root，并递归复制其子对象**。

下面是算法伪码：
```c++
copying() {
    $free = $to_start
    // 遍历每个GC Root
    for (r: $roots) {
        // 将root指向GC后的新地址
        *r = copy(*r)
    }
    // 交换From和To空间
    swap($from_start, $to_start)
}

copy(obj) {
    if (obj.tag != COPIED) {
        // 这里虽然将obj拷贝到了To空间，但是obj中包含的指针还指向From空间
        copy_data($free, obj, obj.size)
        obj.tag = COPIED
        // forwarding指针指向该对象在To空间的新地址，之后遇到指向From空间的该对象时要将指针更新为forwarding指针
        obj.forwarding = $free
        $free += obj.size

        // 递归复制子对象
        for (child: children(obj.forwarding)) {
            *child = copy(*child)
        }
    }
    return obj.forwarding
}
```

很认真地画了个图，希望能带大家更直观地感受一下整个过程：

![recursive-copying-gc][2]

上图中一共有四个对象存在于 From 空间，其中从 Root 开始遍历一共能找到 3 个活动对象 `A`、`B` 和 `D`，通过递归复制，将这个三个对象依次复制到 To 空间得到 `A'`、`B'` 和 `D'`。可以看到复制到 To 空间后，对象内部包含的指针还是指向 From 空间的，直到递归返回时，用复制子对象得到的 forwarding 覆盖原子对象指针才完成指针的更新。最后，回收 From 空间所有对象并完成空间交换。

---
## 优点
* **优秀的吞吐量** - GC 复制算法只搜索并复制活动对象，因此能在较短时间内完成 GC，吞吐量优秀。它消耗的时间与活动对象的数量成正比，而不受堆大小的影响。
* **可实现高速分配** - GC 复制算法不使用空闲链表，分块在一个连续的内存空间，因此在进行分配时只需比较整个空闲分块的大小是否足够就可以了，而不需要链表遍历操作。
* **不会发生碎片化** - 每次进行复制时都会将活动对象重新集中（压缩），避免了碎片化。
* **与缓存兼容** - 在上述递归实现的复制算法中，有引用关系的对象会被安排在堆中离彼此较近的位置，有利于提高高速缓存命中率。

---
## 缺点
* **堆利用率低** - GC 复制算法将堆空间一分为二，每次只能利用一般用于分配。这一缺点可以通过搭配使用复制算法和标记-清除算法得到改善。
* **递归调用函数** - 每次递归调用都会消耗栈空间，由此带来了不少额外负担，而且还有栈溢出的可能。我们接下来要介绍的 Cheney 复制算法就采用迭代的方式避免了这个问题。

---
# Cheney 复制算法
// TODO 画图真费时间啊









  [1]:/uploads/images/copying-gc.svg
  [2]:/uploads/images/recursive-copying-gc.png