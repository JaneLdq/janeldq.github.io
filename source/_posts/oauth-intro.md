---
title: 浅谈 OAuth 2.0 授权
date: 2019-10-21 14:04:34
categories: 技术笔记
tags: Authorization
---

一年之前开过一个关于Web认证相关的坑，只简单地开了个头就不甚了了。时隔一年，正好这一年做的项目一直都跟应用间的认证和授权相关，于是决定重拾旧坑，好好研究一番。

本文想先聊聊 OAuth 2.0，主要包含以下几个问题：
1. 为什么会有 OAuth 2.0 的诞生
2. OAuth 2.0 是什么，它到底干了什么

---
## 为什么会有 OAuth 2.0 的诞生
在传统的客户端-服务器认证模型中，由**客户端**携带**用户**的**认证凭证（credentials）**来访问**服务端**受保护的**资源**，而当有第三方应用想访问服务端资源时，我们最容易想到的方式是什么呢？

让第三方应用与客户端**共享认证凭证**。

而上述这种做法的弊端和局限性也很明显：
* 第三方应用需要自己保存用户凭证（安全隐患非常大，尤其在使用明码的情况下）
* 服务端要支持用户名密码验证机制，而密码本身就存在安全弱点
* 第三方应用获得的访问权限过大，而客户端没有办法限制授权的有效期和范围
* 用户如果要收回对某一第三方应用的授权，就只能修改密码，而这将同时收回所有其他第三方应用的授权
* 只要有一个第三方应用被攻击了，那么用户的认证凭证就泄漏了，那么所有被这个密码保护的数据也将被泄漏。

OAuth 的出现就是为了解决这些问题。OAuth 2.0 表示它是 OAuth 的第二个版本，注意 OAuth 2.0 和 OAuth 1.0 是不兼容的，本文只讨论 OAuth 2.0。
<!--more-->
---
## OAuth 2.0 中的四种角色
那么，在具体了解 OAuth 2.0 的运作机制前，我们需要先认识 OAuth 2.0 中定义的四种角色。
* **Resource Owner** - 资源拥有者，拥有给其他资源请求方授权的能力的角色，通常指用户。
* **Resource Server** - 资源服务器，存储用户资源的服务器。
* **Client** - 客户端，即上面所提到的第三方应用，在用户授权下以用户身份访问受保护资源的应用。
* **Authorization Server** - 授权服务器，在成功认证资源拥有者并获得授权后向客户端发送 Access Token（客户端通过 Access Token 向资源服务器请求资源）。

Resource Server 和 Authorization Server 可以是一台服务器，也可以是不同的服务器。

---
## OAuth 2.0 授权过程
下图来自 [The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)

    +--------+                               +---------------+
    |        |--(1)- Authorization Request ->|   Resource    |
    |        |                               |     Owner     |
    |        |<-(2)-- Authorization Grant ---|               |
    |        |                               +---------------+
    |        |
    |        |                               +---------------+
    |        |--(3)-- Authorization Grant -->| Authorization |
    | Client |                               |     Server    |
    |        |<-(4)----- Access Token -------|               |
    |        |                               +---------------+
    |        |
    |        |                               +---------------+
    |        |--(5)----- Access Token ------>|    Resource   |
    |        |                               |     Server    |
    |        |<-(6)--- Protected Resource ---|               |
    +--------+                               +---------------+


上图给出了一个概括性的 OAuth 2.0 授权过程，简单描述如下：
1. Client 向 Resource Owner 请求授权。授权请求可以直接发给 Resource Onwer，但更好的方式是以 Authorization Server 作为中介间接请求。
2. Client 收到 Authorization Grant，一般是 OAuth 协议定义的四种授权类型（Grant Type，见下文），也可以是扩展授权类型。授权类型取决于 Client 请求授权的方式以及 Authorization Server 支持的类型。
3. Client 向 Authorization Server 的请求认证，并提供 Authorization Grant 以获取 Access Token。
4. Authorization Server 通过 Client 的认证，并且验证它的授权，如果合法，就向它提供 Access Token。
5. Client 拿着 Access Token 向 Resource Server 请求访问受保护的资源。
6. Resource Server 验证 Access Token，如果合法就满足请求。 

这里的 1 - 4 四个步骤根据授权类型（Grant Type）的不同，具体的流程也不同，我们将在下文详细介绍。

看完这个流程是不是瞬间冒出十万个为什么？
* Authorization Server 与 Resource Owner 之间的信任如何建立？Authorization Server 怎么知道这个授权合不合法呢？
* Authorization Server 与 Resource Server 之间的信任如何建立？Resource Server 怎么验证 Access Token 是可信任且合法的呢？
* Authorization Server 怎么认证一个 Client ？Client 的信息哪里来？
<!--
    * Client的信息要事先注册在Authorization Server中，最基本的信息包含 Client 的类型和 redirect URL，注册完成后，Authorization Server 会为每个 Client 生成唯一的 ID。如果Client的类型是 confidential 的话，那么还会生成一组 client credentials，它可能是密码，也可能是 public/private key pair，具体取决于 Client 和 Authorization Server间的认证方式。而这一认证形式在OAuth 中并没有具体规定，在实际应用中应该根据安全性需求自行选择。-->
* ...

别着急，在我们了解授权类型的过程中，或许能找到某些问题的答案。
<!--
OAuth 2.0 协议通过引入 Authorization Server 这个角色，在 Resource Owner, Resource Server 和 Client 之间引入了一个单独的授权层，从而将用户凭证（Credentials）从 Client 和 Resource Server 的交互中隔离开来。Client **不需要（也不应该）获取 Resource Owner 的认证凭证**，而是通过 Authorization Server 的介入，在获得用户授权后，拿着 Authorization Server 生成的 **Access Token** 向 Resource Server 请求受保护的资源。-->

---
## OAuth 2.0 的四种授权类型
### Authorization Code