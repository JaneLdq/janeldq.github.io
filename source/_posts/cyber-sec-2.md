---
title: Cyber Attacks Note 2 - Attacks
date: 2019-05-09 13:08:44
categories: Web安全
---

四月底五月初去霓虹国浪浪浪以一个多星期，于是前前后后也没有心思搞学习了~明天又要出去团建了，开心心~

---

在上一篇笔记中，我们提到了网络环境中暴露的弱点，以及潜在的威胁。对于攻击者而言，这些漏洞和弱点就是他们借以实施攻击的要害。

本文的内容主要是对上Cyber Attacks时关于分类的笔记，但自己总结时发现课上提到的非常简单，真的要细分起来内容还是相当多的，比如从最古早的Malware到与web安全息息相关的各类安全攻击，不论是维度还是粒度，都需要再仔细研究一波，所以这篇短小精干的划水小笔记就先用来过渡一下啦~
<!--more-->

---
# 攻击的基本类型
简单来讲，一般的攻击都可以归为一下两种基本类型之一：

* **Brute force attack** - 采用某种机制自动的找到目标并尝试所有可能的方式以实施攻击。比如密码撞库。
* **Heuristic attack** - ‘heuristic’的翻译是“启发式的，探索的”，也就是说这类攻击中需要人根据已有的知识、洞察和分析来找到某种更便捷的更节省时间的攻击方式。举个简单的例子，SQL注入攻击。

在真实场景中，攻击者通常会采用以上两类攻击的组合。如果它们被组织成一组有序的，长时间的攻击，那么又可以称这类攻击为*advanced persistent attack*, 简称APT，持续攻击。

![Cyber attacks types][1]

---
# 攻击者
为什么黑客们要进行攻击呢？最开始大概就是一群技术爱好者出于人类搞破坏的恶趣味利用网络做的一些“小破坏”，然而随着技术的逐渐成熟和黑客圈子的不断扩大，人性中更大恶开始展现。有一部分贪婪的人开始利用攻击获取经济利益，还有一部分人为了泄愤发起攻击。还有一类呢，就属于政治范围了，不必多提。

看个表格简单归类一下：

|Adversary Type|Motivation|Defining Attributes|
|---|---|---|
|Vandal|Mischief|Individually capable, predictable|
|Hacktivist|Anger|Group capable, unpredictable|
|Criminal|Greed|Well funded, financial motivation|
|Nation-State|Dominance|world class capability and support|

---

**参考资料**
* *From CIA to APT, An Introduction to Cyber Security*

  [1]: http://static.zybuluo.com/JaneL/1zk9ctvkk994q223wyzr8yxo/Cyber%20attacks%20types.png