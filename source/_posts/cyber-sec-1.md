---
title: Cyber Attacks Note 1 - Vulnerability, Threat & Risk
date: 2019-04-15 20:04:30
categories: Web安全
---

失踪人口回归啦～《Cyber Attacks Notes》系列正式开坑～

新坑由来是这样的：
在一个多月前，由于高估了自己的主观能动性，一个激动点击了Coursera上的**Cyber Attacks**这门课的trial，然后就晾那儿了。时隔一周，突然收到一条扣费短信（黑人问号脸.jpg，思考甚久，原来是trial到期直接续费了。
既然钱都交了，不把证书拿到岂不是很亏～
因为视频看得有点赶，课程里涵盖的内容又比较泛，结课了，觉得还是有必要结合资料，复盘一波。
于是，新坑开挖～热烈鼓掌～

---

第一篇笔记，我们先回答几个比较宽泛的问题：
* 什么是Vulnerability（弱点or漏洞or脆弱性，这个词翻译无能，请自行意会）？
* 什么是Threat（威胁）？
* 什么是Risk（风险）？
* 如何实施安全评估？

<!--more-->
---
# Vulnerability

好比是人都是有弱点的，那么被存在着弱点的人类创造出来的系统、网络，自然也不是完美无缺的。
我们可以将Vulnerability（针对网络安全）大致划分为如下几类：（个人看法，从根源上来看，我觉得所有的这些弱点最终还是归于人本身嘛～

1. **System Flaw** - 系统本身的缺陷，通常指软件的缺陷、bug。根本原因是系统的复杂度，系统越复杂，bug就越多。
2. **Lack of Security** - 整个系统的组织架构中缺少一些必要的安全组件。比如防火墙、恶意程序监控软件等。通常而言造成这类vulnerability的根本原因是预算，budget和capacity不到位。
3. **Human Action** - 人为操作，比如轻易把敏感信息透露给其他人，电脑不设密码等等。这类主要由于人自身不够重视，安全意识不够导致的。
4. **Organizational Vulnerability** - 组织层面的，包含内容更广，比如人员管理、开发流程等。主要原因是没人管，没有专门的人或者团队来负责整个流程上的管理。（工作近两年，个人感受有一点就是公司越来越注重员工的安全意识培训和强调Secure Development Lifecycle）

既然有这么多vulnerability，也就给了坏蛋们可乘之机。他们很可能针对这些Vulnerability对我们的系统或网络造成Threat，那么Threat又有哪些类型呢？

---
# Threat

下面是从*From CIA to API, An Introduction to Cyber Security*这本书中摘录的：
> The term *threat* is used in cyber security to describe **the bad things that hackers can do to assets**. 

*PS：这本书也是这门课的老师自己写的一本书，内容比较浅显，多为点到即止的概念介绍，正如它的定位，一本适合大众阅读的科普书。不过我个人认为，对于梳理这类概念性的信息还是有帮助的。*：

## Threat Types
Threat可分为四大类：
1. **<span style="font-size: 1.2rem">C</span>onfidentiality** Threat (sensitive information leakage)  - 机密性，通常指敏感信息的泄露。现在经常爆出的用户信息泄露新闻就属于这类Threat。
2. **<span style="font-size: 1.2rem">I</span>ntegrity** Threat (corruption of some asset) - 完整性，对于数据而言主要是信息的完整和真实性受到威胁；对于其他assets，比如计算机，被恶意应用入侵甚至控制。（在英语中经常会见到"Compromised"这个词来形容被“感染”的asset，也就是指面对hacker的入侵“妥协”了的意思。）
3. **<span style="font-size: 1.2rem">A</span>vailability** Threat (intentional blocking of access to a computer or network system) - 可用性，通常指不能正常访问某个系统或服务，请求被阻塞住了。最典型的一个availability threat应该属**DDoS - Distributed Denial of Service**
4. **Fraud** (steals a service withou paying, and resulting impact doesn't fit well into disclosure, integrity or denial of service categories) - 使用欺骗的手段获取一些非法利益，但是又不太符合以上三种类型。比如在Q币还很流行的时候，有很多坏蛋盗号花别人的Q币啊（想当年年幼无知，也是受害者之一了

看个表格总结一下：

|Threat Type|Motivation|Defining Attributes|
|---|---|---|
|Confidentiality|Secrets|Personal and business information|
|Integrity|Degradation|Remote operational control/change|
|Availability|Disruption|Distributed botnet attacks|
|Fraud|Money/Goods|Ingenious and clever means for theft|

## CIA模型
机密性Confidentiality, 完整性Integrity, 可用性Availability被称为安全的三个基本元素，简称CIA。
* 机密性 - 数据/信息/内容不被泄露。最常见的实现手段就是加密。
* 完整性 - 保证数据内容的完整，不被篡改。常见的保护措施是数字签名。
* 可用性 - 保护资源的可获得性。

当然，除了CIA之外，安全领域还包含很多其他要素，比如我们即将在STRIDE模型中看到的不可抵赖性等。但最最重要的仍然是CIA三位啦。

## STRIDE模型
上文将Threat大致分为CIAF四类，大多时候Fraud都不被提及，这并不意味着它不重要，只是CIA比较经典而已。除此之外，还有很多不同的Threat建模方法的。比如这小节介绍的一种——STRIDE模型。

跟CIA一样，STRIDE也是六个单词的首字母缩写，它最早是由微软提出的。

|Threat|Definition|Desired property|
|---|---|---|
|Spoofing 伪装|冒充他人身份|认证|
|Tempering 篡改|修改数据或代码|完整性|
|Repudiation 抵赖|否认做过的事情|不可抵赖性|
|InformationDisclosure 信息泄露|机密信息泄露|机密性|
|Denial of Service 拒绝服务|拒绝服务|可用性|
|Elevation of Privilege 提升权限|未经授权获得许可|授权| 

值得一提的是，任何一种建模方法在选择一定粒度的抽象后总是难以做到百分百涵盖所有的Threat种类的。不过在做安全评估时，借助已有的Threat模型进行分析还是很有价值的。

---
# Risk
Risk（风险）指可能会出现的损失，公式表达如下：
$ Risk =  Probability * Consequence $
也就是说风险由两项指标组成：某个攻击发生的**可能性**以及它带来的**后果**。

## DREAD模型
那么，如何有效地衡量风险呢？有没有模型可供参考呢？当然有啦，这里再介绍一个微软家的模型——DREAD模型。

|Dimension|Assessment|
|---|---|
|Damage Potential 潜在危害|一次攻击会带来多严重的危害？（获得root权限？泄露敏感信息？泄露其他信息？|
|Reproducibility 可重复性|重复一次攻击有多容易？（随意重复？有时间限制？很难重复？）|
|Exploitability 可利用性|发动一次攻击需要多少工作？（初学者是能短期学会？还是需要熟练的攻击者？还是漏洞利用条件很苛刻？）|
|Affected users 受影响的用户|有多少用户会被影响？（所有用户/关键用户/默认配置？部分用户/非默认配置？极少数/匿名用户？|
|Discoverability 可发现性|发现威胁有多容易？（漏洞显眼，很容易获得攻击条件？部分人能看到，需要深入挖掘？发觉漏洞及其困难？）|

根据这五个维度，我们可以根据漏洞的情况对其进行评级，例如与上表中提到的部分情况进行匹配，给每个维度打个分求和用于综合评估。

---
# Asset
Asset翻译过来是“资产”的意思。在前面几小节中，我们提到要保护数据内容，而在安全领域保护的资产并不只有数据，针对不同的业务场景，资产也可以是代码，硬件等等。只不过在web安全中，尤其是现在云服务发展起来之后，用户数据无疑是最主要也最重要的Asset。

---
# 安全评估过程
了解了以上关于威胁和风险的基础概念后，我们就可以梳理出一个简化的安全评估过程，大致分为四个步骤：
1. **资产等级划分** - 明确目标，要保护什么
2. **威胁分析** - 确定危险来自何处，攻击面（Attack Surface）
3. **风险分析** - 结合具体情况，判断风险高低
4. **确认解决方案** - 好的安全方案能有效抵抗威胁，同时不过多干涉正常的业务流程，高性能，用户体验好，低耦合，易于扩展和升级

---

以上就是本篇笔记的主要内容了，主要一些基本概念介绍。下一篇计划讲讲常见的Attack（攻击），未完待续。

---

**参考资料**
* *《白帽子讲Web安全》*
* *From CIA to APT, An Introduction to Cyber Security*
* [Confidentiality, integrity, and availability (CIA triad)][1]

  [1]: https://whatis.techtarget.com/definition/Confidentiality-integrity-and-availability-CIA


