---
title: 浅谈网络安全（二）- 报文完整性与身份认证
date: 2020-04-11 17:52:36
categories: 技术笔记
tags:
- 网络安全
---

在上一篇笔记中，我们提到安全的网络通信有三点基本特性：保密性、报文完整性和身份认证。这篇笔记我们就来聊聊报文完整性和身份认证，二者是息息相关的。
还是用 Alice 和 Bob 来举例，当 Bob 收到一条来自 Alice 的消息，他需要验证如下内容：

* 这条消息在传输过程中没有被篡改 - 验证报文完整性
* 这条消息确实是 Alice 发的 - 进行身份认证

<!--more-->
---
# 报文完整性
在报文完整性校验的实现中，我们会用到**加密哈希函数**。

## 加密哈希函数
一般哈希函数具有如下特性：
1. 接受任意长度的输入
2. 产生固定长度的输出
3. 计算时间在合理范围内

像之前在介绍可靠数据传输中用于错误检测的校验和 (checksum) 和循环冗余校验（Cyclic Redundant Check) 都满足这些特性。
相比于这些一般哈希函数，加密哈希函数还要满足一个特性：
4. **无碰撞性 (collision free)** - 对于两个不同的输入，其输出的哈希值一定是不同的。

常用的加密哈希算法有：[MD5](https://en.wikipedia.org/wiki/MD5)(虽然现在有了彩虹表可以破解很多常见密文，但是目前应用还是挺广泛的), [SHA-1](https://en.wikipedia.org/wiki/SHA-1), [SHA-2](https://en.wikipedia.org/wiki/SHA-2), [Whirlpool](https://en.wikipedia.org/wiki/Whirlpool_(hash_function%29) 等。

举个例子，下面这段 js 代码对字符串 `hello, world` 采用了 md5 加密，控制台将输出对应的哈希值 `e4d7f1b4ed2e42d15898f4b27b019da4`：
```js
const crypto = require('crypto')
let hash = crypto.createHash('md5').update("hello, world").digest("hex")
console.log(hash)
```

---
## MAC - Message Authentication Code
别激动，此 MAC 非苹果家的 mac，而是 **Message Authentication Code** 的缩写，翻译有好多种，我也不知道叫哪个比较合适，这里就直接简称 MAC 了。
那 MAC 到底是什么呢？它又如何保证报文完整性呢？
首先，我们假设 Alice 和 Bob 共享一个只有二人知道的小秘密 (shared secret)，用 `s` 表示，当 Alice 和 Bob 通信时：
1. Alice 想给 Bob 发送消息 `m`，于是她把 `m` 和 `s` 拼起来得到 `m+s`，然后使用哈希算法得到哈希值 `H(m+s)`，这个 `H(m+s)` 就是 **Message Authentication Code (MAC)**
2. 然后 Alice 把 (`m`, `H(m+s)`) 一起发给 Bob
3. Bob 收到消息 (`m`, `h`)，并且 Bob 知道 `s`，那么 Bob 就可以根据 `m` 和 `s` 计算出 `H(m+s)`，如果 `H(m+s) = h`，那么 Bob 就认为消息一切正常

MAC 同时满足了报文完整性的检查和身份的认证：
1. 对哈希值的检验可以判断报文完整性，得到相同的哈希值意味着消息和秘密都是一致的
2. 而秘密只有 Alice 和 Bob 两人知道，因此 Bob 可以认为发送方身份通过了验证（当然，若秘密泄漏了，则另当别论）

上述描述的 MAC 的基本思想是基于哈希算法，这也是如今最主流的一种 MAC 标准，详细信息见  **HMAC(Hash-based MAC)**](https://en.wikipedia.org/wiki/HMAC)。

**使用基于哈希的 MAC 校验报文完整性不需要加密算法，这非常适合用于一些对保密性没有要求的场景**。比如在网络层使用链路状态路由算法同步路由信息时，就不要求保密性，毕竟所有消息本身就是同步到所有路由器上的。

除此之外，还有采用分组加密算法实现的 MAC，比如[**OMAC**](https://en.wikipedia.org/wiki/One-key_MAC), [**CBC-MAC**](https://en.wikipedia.org/wiki/CBC-MAC), [**PMAC**](https://en.wikipedia.org/wiki/PMAC_(cryptography%29)等，更多 MAC 相关的信息见 [MAC - wiki](https://en.wikipedia.org/wiki/Message_authentication_code)。

<!--
# 数字签名
-->

---

**参考资料**

* [MAC - wiki](https://en.wikipedia.org/wiki/Message_authentication_code)