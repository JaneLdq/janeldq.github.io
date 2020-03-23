---
title: 网络拥塞控制指北之传输层篇
date: 2020-03-22 10:51:43
categories: 技术笔记
tags: 
- 拥塞控制
- TCP
---

在前一篇笔记中我们总结了网络层的拥塞控制机制，主要以检测拥塞并及时反馈拥塞为主，毕竟要想控制拥塞，还得从根本上解决 —— 减缓传输层的发送速率以减少传输层注入到网络层的流量。

换言之，我们希望采用某种拥塞控制算法能为传输层找到一种好的带宽分配方法，这种分配方法具备如下特质：
* **物尽其用** - 能利用所有可用带宽却能避免拥塞
* **一视同仁** - 为网络中相互竞争的流是公平地分配带宽
* **随机应变** - 能及时跟踪流量需求的变化，并快速收敛到公平且有效的带宽分配上。

<!--more-->
# 理想的带宽分配
下面我们就来展开聊聊传输层的“理想型”吧~

## 输入负载与实际吞吐量
下图描述了拥塞发生的过程，横坐标表示**输入负载 (offered load)** —— 即原始数据加上重传的传输速率，纵坐标表示**实际吞吐量 (throughput)** —— 即传递原始数据的速率。
// 图 TODO

可以看到，在到达网络的承载极限之前，实际吞吐量随输入负载的增加而增加，然而，随着输入负载接近网络的承载能力，偶尔突发的流量填满了路由器的缓冲区，造成丢包。这些丢失的数据消耗了部分容量，并且会引起重传，因此送达的数据低于理想曲线。如果这个时候还不控制输入负载，那么最终网络会被重传的数据包占领，导致实际吞吐量急速下降，出现**拥塞崩溃 (congestion collapse)**。
相应的，在输入负载提升的初期，延迟稳定在一定水平，表示穿过整个网络的传输延迟。随着负载接近临界，延迟逐步上升，最终演变为急剧上升。

因此，我们希望一个好的拥塞控制算法能有效控制输入负载，在避免导致拥塞出现的情况下，最大程度发挥所有可用带宽的作用，是为“物尽其用，恰到好处”。

## 最大-最小公平性
// TODO

<!--
---
# TCP 中的拥塞控制
-->