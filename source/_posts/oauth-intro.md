---
title: 浅谈 OAuth 2.0 (一)
date: 2019-10-21 14:04:34
categories: 技术笔记
tags: Authorization
---

一年之前开过一个关于Web认证相关的坑，只简单地开了个头就不甚了了。时隔一年，正好这一年做的项目一直都跟应用间的认证和授权相关，于是决定重拾旧坑，好好研究一番。

（ˊ_>ˋ 原本就想写个简单的概述，但那样好像没什么意义，而且内容也实在是有点多...）

第一篇就先聊聊 OAuth 诞生的背景和其中的一些基本概念吧。

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

OAuth 的出现就是为了解决这些问题。OAuth 并不是框架或工具，而是一组基于 HTTP 协议的标准，它定义了一系列与授权场景相关的概念和规则，针对不同的应用场景给定了几类标准的授权过程。下面就让我们一起揭开 OAuth 神秘的面纱吧。

*注：本文将只介绍 OAuth 2.0，OAuth 2.0 和 OAuth 1.0 并不兼容。*

<!--more-->
---
## OAuth 2.0 中的 4 类角色
就好比在面向对象的编程中，我们要先抽象出对象，在应用授权的场景中，我们也要先划分出不同的角色。
OAuth 2.0 定义了如下四种角色：

* **Resource Owner** - 资源拥有者，拥有给其他资源请求方授权的能力的角色，通常指用户（下文都简称用户）。
* **Resource Server** - 资源服务器，存储用户资源的服务器。
* **Client** - 客户端，即上面所提到的第三方应用，在用户授权下以用户身份访问受保护资源的应用。
* **Authorization Server** - 授权服务器，在成功认证资源拥有者并获得授权后向客户端发送 Access Token（客户端通过 Access Token 向资源服务器请求资源）。

资源服务器和授权服务器可以是一台服务器，也可以是不同的服务器。

这四种角色之间的主要交互过程如下图所示：
![OAuth 2.0 Roles][1]

简单概括流程如下：
1. 客户端在请求资源前向用户请求 `Authorization Grant`。
2. 客户端拿到用户给的 `Authorization Grant` 后向授权服务器获取用于访问资源的 `Access Token` 授权服务器对客户端进行认证并校验授权，如果合法，则生成 `Access Token` 并返回给客户端。
3. 客户端拿着 `Access Token` 向资源服务器请求受保护的资源，服务器校验 `Access Token`，如果合法，则返回资源。

注：在上图中体现出来是客户端直接向用户请求授权，而更好的方式是由授权服务器作为中介间接授权，详细过程见下文介绍的具体的授权过程。 

上面又提到了两个新的概念，`Authorization Grant` 和 `Access Token`，要讲清楚 `Authorization Grant` 就必须先弄懂 `Access Token`。

---
## OAuth 2.0 中的 2 类 Token
事实上，OAuth 2.0 中定义了两种 Token，一种是 `Access Token`，另一种是 `Refresh Token`。

### Access Token
`Access Token`，故名思义，就是用来访问受保护资源要用到的令牌。客户端要访问资源服务器上受保护的资源，就必须要有 `Access Token` 作为通行证。`Access Token` 由授权服务器生成。客户端之后获取了用户授权后才能向授权服务器申请 `Access Token`。

OAuth 通过 `Access Token` 在授权过程中增加了一个授权层（Authorization Layer），这样对于资源服务器而言，它只需要能支持 `Access Token` 这一种授权方式就可以了。

*“只要你给我一个合法的 `Access Token`，那我就给你提供你想要的资源，至于这个 `Access Token` 是怎么来的：用户和客户端如何认证、如何授权，我都不 care，就是这么任性”。*

那么问题来了：

🌟 **Access Token 的格式是什么？里面包含了什么内容？**
🌟 **资源服务器如何验证一个 Access Token 是合法的呢？**
🌟 **资源服务器和授权服务器之间的信任如何建立？**

>  An access token is a string representing an authorization issued to the client. ... Tokens
   represent specific scopes and durations of access, granted by the
   resource owner, and enforced by the resource server and authorization
   server.(from RFC 6749)

从官方定义上来看，`Access Token` 是一个**字符串**，至少要提供关于**客户端的基本信息**（通常是客户端的ID）和该客户端**获得的权限**，权限由一组 `scopes` 表示，并且 `Access Token` 是有有效期的。

至于 Access Token 的具体格式、这些内容究竟是如何获得：是 `Access Token` 自包含的（self-contain）内容呢？还是 `Access Token` 只提供一个标识符，然后利用这个标识符再通过某种方式来获取呢？OAuth 2.0 (RFC6749) 里没有规定。

常见的方式如下：
* **Signed JWT Bearer Token** - 所有需要勇于验证合法性的内容都包含在 token 自身里了，包括但不限于用户信息、客户端信息、scope 等。这种方式要求资源服务器能通过 `Access Token` 的签名（授权服务器进行数字签名）来验证其确实是来自可信任的授权服务器。

* **共享数据库** - 对于小型应用，资源服务器和授权服务器通常是同一个服务器，此时它们之间自然不存在信任问题，而且还能直接内部共享 Token 的信息，比如共享数据库。

* **通过 Token Introspection Endpoint** - 这是一个OAuth 2.0 的扩展协议（[RFC7662](https://tools.ietf.org/html/rfc7662)），由授权服务器开放一个用于验证和解析 `Access Token` 的接口供资源管理器调用。


#### Scope
我们在前文提到，传统的用户名密码授权方式问题之一就是权限过大，一旦拥有了用户的用户名密码，客户端理论上可以访问所有该用户能访问的资源。然而，这并不是我们想要的。我们希望只给客户端授予必要的最小权限，那么 `scope` 就是 OAuth 中用来达到这一目的存在。

`scope` 由资源服务器来定义，比如最简单的 `sample.read`、`sample.write` 这类，在授权时，用户可以选择只授予某个客户端 `sample.read` 的 `scope` 而给另一个客户端授予 `sample.write` 的权限。

---
### Refresh Token
`Refresh Token` 也是由授权服务器生成的。当一个 `Access Token` 过期或者失效时，客户端可以使用 `Refresh Token` 来获取一个新的 `Access Token`，这个新的 `Access Token` 拥有的 `scope` 范围**小于等于**原来的那个。

`Refresh Token` 是可选项，如果授权服务器生成了 `Refresh Token`，它会与 `Access Token` 一起返回给客户端。

---

未完待续...

<!--

---
## OAuth 2.0 中的 2 类客户端

* Public
* Confidential

---
## OAuth 2.0 的四种授权类型
客户端在获取 Access Token 之前要先从用户那里获得授权，OAuth 2.0 定义了四种获取授权的方式：
* Authorization Code
* Implicit
* Resource Owner Password Credentials
* Client Credentials

除此之外，OAuth 2.0 还支持自定义扩展授权类型。

下面我们就分别来看看这四种授权类型的授权流程是怎样的吧。

### Authorization Code
授权码这一授权类型既可以用来获取 Access Token，也可以用来获取 Refresh Token。

先看图：
![authorization code grant][2]

1. 客户端通过 User Agent（通常指浏览器，这一组件在上图中没有体现）向授权服务器发起获取授权码的请求，在请求中会带上 `client_id`, `scope`, `state` 和一个在获取授权码后要跳转到的 `redirect_uri`（请记住这个URL，我们还会再见到它好几次）。
2. 授权服务器将 User Agent 重定向到用户认证页面，对用户进行认证，并授权给客户端，然后授权服务器将 User Agent 重定向到刚刚 客户端在请求中指定的那个 `redirect_uri`，并附加上授权码和客户端在请求中带上的`state`。（用户也可以在这一步拒绝授权，那么在这一步将返回Error Response）。
3. 客户端带着授权码，`redirect_uri` 和 `client_id` 向授权服务器请求 Access Token，在这一步，如果客户端之前注册时有生成 Client Credential，那么授权服务器会对客户端进行认证，并且还要校验这个请求中的 `redirect_uri` 和获取授权码的请求中的 `redirect_uri` 是否一致。
4. 如果客户端认证成功，其他校验也都通过了，那么授权服务器就会返回一个 Access Token，有可能还附带一个 Refresh Token。

在 Authorization Code 这一授权类型中，**授权服务器充当了客户端和用户之间的媒介，在整个过程中，用户只与授权服务器交互完成认证，因此用户的认证信息完全不需要与客户端共享。**


---
### Implicit
一种为浏览器客户端简化的授权流程，客户端使用脚本语言直接请求授权，跳过了“获取授权码”这个步骤。

// TODO 画图好累哦，明天再来填坑

---
### Resource Owner Password Credentials
用户密码认证，直接使用用户的用户名密码进行认证。这种方式只应该在高度信任的情况下使用，比如客户端是操作系统的一部分的情况，或者其他认证类型不可行的时候。
即使这种情况用到了用户的用户密码，也应该只是在第一次请求时用于获取 Access Token 和 Refresh Token， 并将 Token 设定为长生命周期的 Token 以便于后续操作，这样可以避免在客户端保存用户密码。

// TODO 图

---
### Client Credentials
这一类型中客户端以自己的名义，而不是以用户的名义向资源服务器请求资源，因此在获取 Access Token 时客户端直接采用自己的认证信息进行认证就可以了。这一模式从本质上来讲，客户端自身就是“资源拥有者”，因此并不存在是授权问题。

// TODO 图
-->
---

**参考资料**

* [RFC6749 - The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
* [OAuth 2.0 Servers](https://www.oauth.com)
* [What the Heck is OAuth?](https://developer.okta.com/blog/2017/06/21/what-the-heck-is-oauth)
* [stackoverflow - OAuth v2 communication between authentication and resource server](https://stackoverflow.com/questions/6255104/oauth-v2-communication-between-authentication-and-resource-server)
* [stackoverflow - How Resource Server can identify user from token?](https://stackoverflow.com/questions/48770574/how-resource-server-can-identify-user-from-token)

  [1]: /uploads/images/oauth-roles.svg
  [2]:/uploads/images/oauth2-code-grant.svg








































