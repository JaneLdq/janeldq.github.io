---
title: 垃圾回收算法梳理
date: 2019-07-20 15:36:14
categories: 技术笔记
tags: GC
---

在介绍JVM中提供的垃圾收集器之前，我觉得有必要先补充一下关于垃圾回收（以下简称 GC）的理论知识——垃圾回收算法（以下简称 GC 算法）。

GC算法的基本类型并不多，概括起来大概就以下三种：
* **标记-清除算法** (Mark-and-Sweep) - 由 [John McCarthy][1] 1960 年在论文 *Recursive functions of symbolic expressions and their computation by machine* 中提出的标记-清除算法
* **引用计数法** (Reference Counting) - 由 [George E. Collins][2] 1960 年在论文 *A method for overlapping and erasure of lists* 提出的引用计数法
* **复制算法** - 由 [Marwin L.Minsky][3] 1963 年在论文 *A Lisp garbage collector algorithm using serial secondary storage* 中提出的复制算法

在这之后还出现了各种各样的 GC 算法，但究其根本都可以归纳为以上三种算法的组合和应用。
<!--more-->

---
# GC 算法的评价标准
聊算法总免不了要进行一番性能比较，既然要比较，就需要一些能够度量的标准。
以下列举了一些常见度量：

* 吞吐量 (Throughput) - 在一段较长的时间内， 非 GC 运行时间所占总运行时间的百分比
* GC 开销 (Garbage collection overhead) - 与吞吐量相反，即 GC 时间占总时间的百分比
* 暂停时间 (Pause time) - 在整个程序执行过程中程序为了进行 GC 而停下来的时间
* 收集频率 (Frequency of collectoin) 
* 堆使用效率

在选择 GC 算法时，要考虑到程序的应用场景，举几个例子：
* 交互式 (interactive) 应用可能要求 GC 暂停时间要短，这样对用户操作才更友好
* 非交互式 (non-interactive) 应用，比如运行在后台的程序，对整个 GC 运行的时间的要求所占权重就更高
* 实时 (real-time) 应用则可能对 GC 暂停时间和 GC 总时间的占比上限都更低
* 运行在有限内存空间上的嵌入式应用可能对堆使用效率要求更高
* ...

// TODO 先去看个电影嘻嘻

 [1]:https://en.wikipedia.org/wiki/John_McCarthy_(computer_scientist)
 [2]:https://en.wikipedia.org/wiki/George_E._Collins
 [3]:https://en.wikipedia.org/wiki/Marvin_Minsky