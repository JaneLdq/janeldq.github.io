---
title: 浅析Java泛型
date: 2019-06-10 20:16:45
categories: 技术笔记
tags: Java
---

围观面试，正好有聊到Java泛型，自己的记忆也有点模糊，于是翻出了很久之前的零散笔记，准备重新整理了一波。

持续更新中...

---

在引入泛型之前，在Java中使用Collections是一种非常容易出错的操作。举个例子：

```java
List numbers = new ArrayList();
numbers.add(new Integer(10));
numbers.add("foo");    // 在不使用泛型的情况下，List中每个元素的类型都是Object，这意味着你可以往里面扔任何类型的对象
Integer sum = 0;
for (int i = 0; i < numbers.size(); i++) {
    Integer n = (Integer) numbers.get(i); // 必须使用强制转换将元素转换为我们想要的类型
    sum++;
}
System.out.println(sum);
```

那么问题来了，上面这段代码在编译时是不会报错的，然而，因为我们在List中插入了`String`类型，而在循环中我们默认每个元素都应该为`Integer`类型并做了强制转换，在运行时，程序就会抛出`java.lang.ClassCastException`异常。

我们都知道，错误越早发现，修复所需的代价越小，能在编译时发现错误就不要让它潜伏到运行时；而且，在没有泛型时，但凡使用Collections都逃不开强制转换，这也是一件非常痛苦的事情。

所幸，Java在5.0版本就引入了泛型。
<!--more-->
简单总结一下，泛型的出现，主要为了如下几个目的：

* 在编译时可以进行更严格的类型检查
* 消除强制转换，编译器会自动进行强转
* 用于实现更通用的算法，例如Collections的实现

那么接下来，我们就一起来看看泛型的定义和使用吧～

---
# 什么是泛型
泛型即可以是类/接口级别的，也可以是方法级别的。我们就先从泛型类说起。

## 泛型类
泛型，又被称为参数化类型，相比于一般的非泛型类，它具有更多的通用性和灵活性，允许我们在声明时再传入一些参数进行定制。

想必现在在大家的日常开发中都没少接触`List`这样的集合类，放在这个语境下，泛型就非常好理解了。相比于一个大杂烩的List，我们通常更希望拥有的是只包含某个类型的List，那为什么不针对每个类型分别实现自己的List呢？比如来一个IntegerList，再来一个StringList，那以后说不定还会有AppleList，OrangeList...而且，我们对这些List实现的操作都是一样的，Integer，String，Apple，Orange只是表明操作针对的对象类型不同而已。那我们为什么不能把它们作为List的一个参数，在声明时设置一下就好了呢？这样我想要什么类型的List都很方便，不需要自己再单独封装或者用风险很高的强制转换。

泛型就是这么个意思。


泛型类/接口的使用也非常简单，还是以`java.util.List`为例：
```java
List<Integer> numbers = new ArrayList<>();
```
跟开头的那段代码相比，这里的List的声明多了一些尖括号，`<>`里的值被称为**类型参数**，类型参数的值一般都为Class或Interface类型。

`List<Integer>`的意思就是*这是一个只能放Integer的List，别的类型一概不收*。有了这个声明，编译器就能在编译时进行类型检查，如果我们强行往里塞`String`，编译器就会报错啦。

值得注意的一点是，后面的`new ArrayList<>()`的`<>`不需要再填一次类型参数了，编译器能通过上下文完成**类型推导（type inference），编译器可以通过检查泛型类声明中的类型参数或泛型方法的参数的类型来计算类型参数的值**。
空的尖括号对`<>`被称为**Diamond**。（小“钻石”，还挺可爱的～）

那么，如何定义泛型类或接口呢？很简单，以`java.util.List`为例，它长得大致如下：

```java
public interface List<E> {
    boolean add(E e);
    Iterator<E> iterator();
}
```

每个泛型类型通过在名字后面加一对`<>`来定义了一组参数化的类型，比如List是这个泛型接口的名字，后面的`<>`里面包含一个类型参数`E`，E只是一个代号，跟一般的方法声明中的形参是一个意思，你可以把它换成T，V，K，都随意。

类型参数可以有一个或多个，比如，我们可以再看个`java.util.Map`的定义：

```java
public interface Map<K,V> {
    Set<K> keySet();
    Collection<V> values()；
}
```
那么在Map泛型接口定义中就包含了两个类型参数，`K`用于指定Key的类型，`V`用于指定Value的类型。那么我们在声明一个Map类时通常会这样定义：
```java
Map<String, Integer> myMap = new HashMap<>();
```
这个Map的键都是`String`类型，对应的值为`Integer`类型，你若是想往里塞其他类型的键值对，编译器不会放过你的。

那么问题来了，既然Java中List接口已经时泛型接口了，那么为什么我在开头写的那段不带类型参数的代码还能编译通过呢？直接使用List为什么还是合法的呢？这里就要提到Java引入泛型之后留下的一个大坑——**泛型类的原始类型(Raw Type)**了。

---
### 原始类型 Raw Types
```java
List raw = new ArrayList();

List<Integer> foo = new ArrayList<>();
List bar  = foo; // this is ok

List<Integer> baz = raw; // warning: unchecked conversion

```
像上面这样写，List就是 List<E> 的一个原始类型(raw type)，即不带任何实际类型参数。
值得注意的是，**非泛型类或接口并不是谁的原始类型，原始类型这个概念只是针对泛型类/接口才存在的**。
如上所示，若将参数化的泛型类赋值给它的原始类型是没问题的，反过来操作则会有警告，因为这意味着在运行时很可能会发生错误。

**使用原始类型就意味着放弃了泛型所提供的安全性和类型检查等优势，所以要在新代码中要避免使用它们**。

既然原始类型这么不好用，那么为什么Java的新版本还要留着它呢？答案显而易见，就是为了与引入泛型之前的遗留代码兼容。

**🌟提问：原始类型`List`和参数化的`List<Object>`有什么区别呢？**
*首先，使用原始类型`List`就失去了泛型提供的类型检查和隐式强转的好处；其次，这里还涉及到泛型的继承，举个例子，`List<String>`可以赋值给`List`，而不能赋值给`List<Object>`，因为`List<String>`是`List`的子类却不是`List<Object>`的子类。关于泛型的继承关系，我们接下来还会进一步介绍。*

---
## 泛型方法
除了定义整个泛型之外，我们也可以只针对某个方法设置它的类型参数，这类方法就被称为泛型方法。
举个例子，比如我们想写一个工具类方法，把某个数组中的所有元素添加到一个Collection中，那么可以定义这样一个泛型方法:
```java
public static <T> void fromArrayToCollection(T[] a, Collection<T> c) {
    for (T o : a) {
        c.add(o); // Correct
    }
}

我们又见到了熟悉的尖括号对`<T>`，同泛型类定义一样，这里的`T`表示类型参数，在方法声明的形参中，我们就可以使用`T`来指定形参的类型。当我们使用这个函数时，T的值就根据传入的参数类型来决定。
再看个例子就懂啦：
```java
String[] strArr = new String[10];
List<String> strList = new ArrayList<>();
fromArrayToCollection(strArr, strList); // 调用时传入的参数是String数组和列表，这时类型参数T的具体值就是String类

Integer[] intArr = new Integer[10];
List<Integer> intList = new ArrayList<>();
fromArrayToCollection(intArr, intList); // 调用时传入的参数是Integer数组和列表，这时类型参数T的具体值就是Integer类

fromArrayToCollection(strArr, intList); // error， 如果根据输入变量的推断出的参数类型不一样，编译器就会报错啦
```

---
## Bounded类型参数

除了像上面的例子中展示的定义一个普通的类型参数之外，有时候我们可能会想要限制类型参数的类型，比如限定它只能是某个接口或类的子类。这时我们就需要用到Bounded类型参数(Bounded Type Parameters)。
Bounded类型参数的


---
# 神奇的通配符

前面提到了要避免使用原始类型，但有的时候我们想使用泛型，但是又不能确定实际的类型参数，这个时候要怎么办呢？针对这类场景，Java泛型提供了通配符`?`作为替代。

## Unbounded通配符
直接使用通配符 `?` 就是无界通配符，例如`List<?>`，这时这个`List`就是一个未知类型的`List`。
无界通配符适用于以下两种场景：

    1. If you are writing a method that can be implemented using functionality provided in the Object class.
    
    2. When the code is using methods in the generic class that don't depend on the type parameter. For example, List.size or List.clear. In fact, Class<?> is so often used because most of the methods in Class<T> do not depend on T.

还是举个例子：
```java
public static void print(List<Object> list) {
    for(Object o: list) {
        System.out.println(o);
    }
}
```
上面这个方法呢，本意是想能打印任意类型的`List`，然而这样做并不能达到目的。因为像`List<String>`, `List<Integer>`, `List<MyClass>` 并不是`List<Object>`的子类（关于*泛型的继承关系*请接着往下看）。
这时候Unbounded Wildcard就派上用场了，把`List<Object>`换成`List<?>`问题就解决啦。

> *It's important to note that `List<Object>` and `List<?>` are not the same. You can insert an Object, or any subtype of Object, into a `List<Object>`. But you can **only insert null** into a `List<?>`.*

---
## Bounded通配符
跟无界通配符相对应的，还有有界通配符。有界通配符又分为如下两类：

### Upper Bounded - `< ? extends supertype>`

当希望类型变量的值是某个类（接口）以及其子类时，就可以使用Upper Bounded Wildcards - `< ? extends supertype>`。

举个例子：
```java
public static void sum(List<? extends Number> list>) {
    double s = 0.0;
    for (Number n : list)
        s += n.doubleValue();
    return s;
}
```
上面的sum方法就对`Number`及其子类的`List`进行处理，所以`List<Integer>`,  `List<Double>`,  `List<Float>`,  `List<Number>`都是合法参数。如果使用`List<Number>`而不是`List<? extends Number>`那么将只有`List<Number>`是合法的。

---
### Lower Bounded - `< ? super subtype>` 

与Upper Bounded Wildcards相反，Lower Bounded Wildcards - `< ? super subtype>`限制的是下限，即用于指定参数可以是一个具体的类型以及它的父类。

举个例子：
```java
public static void addNumbers(List<? super Integer> list) {
    for (int i = 1; i <= 10; i++) {
        list.add(i);
    }
}
```

上面这个方法希望任何一个能存储`Integer`值的类型都可以作为参数，那么相比较于只允许`Integer`类型作为元素的`List<Integer>`，`List<? super Integer>`使得`List<Number>`, `List<Object>`类型都可以作为参数使用。

<!--
## 通配符间的继承关系
看图说话！

![通配符间的继承关系][2]
-->

---
## 通配符的使用指南
在考虑何时该使用哪种通配符之前，我们先将函数的变量分个类：

* **输入变量** - 输入变量为代码提供数据。举个栗子，在拷贝方法`copy(source, destination)`中，source提供数据源，所以它是输入变量

* **输出变量** - 输出变量用于存储提供给其他用途的数据。还是原来的栗子，在拷贝方法`copy(src, dest)`中的,destination用于接收数据，所以它是输出变量。

当然啦，也有即作为输入又作为输出的变量，我们在具体的指导规则中再讨论。

通过输入/输出原则我们就可以确定不同通配符的适用情形了：

* **对于输入变量，使用`<? extends supertype>`**。对于内部代码而言，只要输入变量有它要调用的接口就可以了，至于其子类自己添加的那些并不关心。
* **对于输出变量，使用`<? super subtype>`**。对于输出而言，使用下界通配符才能保证要输出的字段都可以被赋值。
* 当作为输入变量是可以通过`Object`类中定义的方法访问时，使用Unbounded wildcard(`?`)
* 当一个变量既作为输入变量又作为输出变量时，就不要使用通配符啦

以上这些原则并不适用与返回值，应该尽量避免在返回值中使用通配符，因为这种写法就是在强制方法的调用者来处理通配符。

未完待续...

---

**参考资料**
* The Java Tutorial - Generics
* *Effective Java (3rd Edition)*

<!--
---

# 泛型的继承关系
看图说话！
![泛型的继承关系][1]

图中的MyList类定义如下
```java
interface MyList<E,T> extends List<E> {
  void setValue(int index, T val);
  ...
}
```

---
# 类型消除(Type Erasure)
Java通过类型消除来实现泛型，Java编译器使用类型消除达到如下效果：

* 将所有泛型的类型参数替换成它们的bounds，如果是参数是unbounded，那么替换成Object。这样生成的二进制码中就只有一般的类、接口和方法了。
* 在必要时插入强制类型转换来保证类型安全
* 生成桥接方法来保证多态性

我们来看一些栗子。
## 替换泛型类、接口和泛型方法
举个栗子，
```java
public class Box<T> {
    private T t;
    public Box(T t) {this.t = t;}
    public T get() { return t; }
}
```
上面的Box&lt;T>中的T是unbounded的，所以编译器会将Box&lt;T>中的T替换成Object，变成下面这样：
```java
public class Box {
    private Object t;
    public Box(Object t) {this.t = t;}
    public Object get() { return t; }
}
```
再看一个有界的栗子,
```java
public class Box<T extends Comparable<T>> {
    private T t;
    public Box(T t) {this.t = t;}
    public T get() { return t; }
}
```
编译器处理后就变成了下面这样：
```java
public class Box {
    private Comparable t;
    public Box(Comparable) {this.t = t;}
    public Comparable get() { return t; }
}
```

对于泛型方法的处理，同理：
```java
// 原始泛型方法
public static <T extends Shape> void draw(T shape) { /* ... */ }
// 处理过后
public static void draw(Shape shape) { /* ... */ }
```

## 需要引入桥接方法的情况
还是看代码说话，给定一个泛型类Node和它的子类IntNode：
```java
public class Node<T> {
    public T data;
    public Node(T data) { this.data = data; }
    public void setData(T data) { this.data = data; }
}

public class IntNode extends Node<Integer> {
    public IntNode(Integer data) { super(data); }
    public void setData(Integer data) {
        super.setData(data);
    }
}
```
假设我们写了如下代码：
```java
IntNode in = new IntNode(19);
Node n = in;
n.setData("hhh");
Integer data = in.data;
```
上面这段代码在编译器做完类型消除之后，会变成下面这样：
```java
IntNode in = new IntNode(19);
Node n = (IntNode)iNode;
n.setData("hhh"); //这里调用的是IntNode继承自父类中的setData(Object)方法，所以在n的data字段中保存的引用其实是引向了一个String类
Integer data = (String)in.data; // in和n指向同一个对象，但是in中期待的data类型是Integer，因此在吧String转成Integer的时候就抛异常啦
```

正如上所示，在编译一个继承自泛型类或接口的子类时，编译器需要再做完类型消除后创建一个桥接方法来保证多态性，否则就会出错。对于程序员来说，并不需要关系桥接方法的生成，在这里提到只是为了更详细的了解Java的泛型机制而已。

以上的Node类和IntNode类在编译器处理完类型消除后会变成如下长相：
```java
public class Node {
    public Object data;
    public Node(Object data) { this.data = data; }
    public void setData(Object data) {this.data = data};
}
public class IntNode extends Node {
    public Integer data;
    public IntNode(Integer data) { super(data); }
    public void setData(Integer data) { super.setData(data); }
}
```
这时IntNode.setData(Integer data)和Node.setData(Object data)由于参数不同变成了两个方法，也就是说，父类Node.setData方法并不会被Override，由此失去了多态性，这并不是我们希望看到的结果。因此，为了解决这个问题，编译器会在IntNode中生成一个桥接方法：

```java
public class IntNode extends Node {
    // 编译器在编译时添加的桥接方法
    public void setData(Object data) {
        setData((Integer) data));
    }
    public void setData(Integer data) { super.setData(data); }
    // ...
}
```

由于编译器实际上是做了类型消除和添加桥接方法两步，在我们实际运行下面这段代码时，在调用n.setData("hhh")时就会报异常了。
```java
IntNode in = new IntNode(19);
Node n = (IntNode)iNode;
n.setData("hhh"); // 在这一步就会抛出错误了，java.lang.ClassCastException: java.lang.String cannot be cast to java.lang.Integer
Integer data = (String)in.data; 
```
# Non-Reifiable Types - 不可具体化类型
不可具体化类型是指其运行时表示法包含的信息比它编译时表示法包含的信息更少的类型。
例如List&lt;String>和List&lt;Integer>等泛型类型，它们的类型信息在编译之后，经过类型消除，运行时表示法都变成List，JVM并不能分别二者的不同。


---

# 对泛型的限制

* Cannot Instantiate Generic Types with Primitive Types（不能将原始类型作为实例化泛型的类型参数）
* Cannot Create Instances of Type Parameters（不能使用类型参数创建实例，但是可以使用反射机制作为workround）
```java
public static <E> void append(List<E> list) {
    E elem = new E();  // 编译时错误，直接创建是不行的
    list.add(elem);
}
public static <E> void append(List<E> list, Class<E> cls) throws Exception {
    E elem = cls.newInstance();   // 使用反射机制是可以的
    list.add(elem);
}
```

* Cannot Declare Static Fields Whose Types are Type Parameters（不能将静态字段声明成类型参数的类型，想想静态字段是所有实例都共享的，然而每个实例的类型参数都可能是不同的，你不能要求一个静态字段既是A又是B还是C，明显不合理嘛）

* Cannot Use Casts or instanceof With Parameterized Types

* Cannot Create Arrays of Parameterized Type
```java
List<String>[] strLists = new List<String>[1]; // 假设这样是合法的
List<Integer> intList = Arrays.asList(42);
Object[] objs = strLists; // 这是合法的，数组时协变(covariant)的，即SubClass[]是ParentClass[]的子类型
objs[0] = intList; // 这是合法的，在类型擦除之后List<Integer>变成了List, List<String>[]变成了List[]
String s = strLists[0].get(0); // 此时strLists的第一个元素指向了intList，它返回的是Integer

```

>数组和泛型有着非常不同的类型规则。数组提供了运行时的类型安全，但是没>有编译时的类型安全；反之，泛型提供了编译时的类型安全，却可能在运行时>出现ClassCastException。一般情况下，数组与泛型并不是很好混合使用，此>时最好使用列表代替数组。
> —— 《Effective Java》第26条

* Cannot Create, Catch, or Throw Objects of Parameterized Types

* Cannot Overload a Method Where the Formal Parameter Types of Each Overload Erase to the Same Raw Type
-->

---

